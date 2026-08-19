# ADR-029 — Entrega continua con promocion de artefacto; el despliegue lo dispara una persona

- **Estado**: propuesta
- **Fecha**: 2026-08-19
- **Ambito**: CI/CD del paquete de despliegue en VM (`ops/fase-7-deploy/dist/vm`)

## Contexto

El 2026-08-19 quedo desplegado el primer entorno en la nube: una VM de Google Compute Engine con los
ocho contenedores del paquete, HTTPS de una CA publica, SSO contra Keycloak y desellado automatico
de OpenBao contra Cloud KMS. Con el sistema en pie, la pregunta pasa a ser cuanto de ese despliegue
debe automatizarse.

Cuatro hechos condicionan la respuesta. Los tres primeros estan verificados sobre el repositorio; el
cuarto es una propiedad del entorno.

**1. Hoy no existe despliegue automatico, solo publicacion de imagenes.** De los cuatro workflows de
`main`, ninguno toca una maquina: `publish-vm-images.yml` construye las dos imagenes nativas y las
sube a `ghcr.io`, y el ultimo paso de `release-deploy.yml` es `Build & push image`. El despliegue lo
hace una persona por SSH con `pull` + `up -d`. Es decir, hay **entrega** continua de artefactos, no
**despliegue** continuo.

**2. Cada despliegue migra la base de datos, sin humano en el bucle.**
`quarkus.flyway.migrate-at-start=true` aparece una sola vez en `application.properties`, sin prefijo
de perfil, y no la sobreescriben ni la configuracion del paquete de VM ni los perfiles `prod,onprem`
con los que arranca el contenedor. Hay 52 migraciones. Arrancar la aplicacion **es** migrar.

De ahi se sigue la consecuencia que gobierna todo lo demas: **el rollback no es simetrico**. Volver a
la imagen anterior son treinta segundos; el esquema no vuelve solo. Si la version nueva migro y se
retrocede, la vieja se encuentra un esquema que no entiende.

**3. La imagen que llega a produccion no se ha ejecutado nunca en otro sitio.** El entorno de
integracion levanta 17 servicios y comparte 7 de los 8 de la VM, asi que ejercita el motor de sobra
—pero **construye sus propias imagenes en la maquina**. Las que descarga la VM las construye CI. Son
artefactos distintos del mismo codigo, y solo uno de los dos ha corrido antes de recibir dinero.

**4. Una sola maquina, sin alta disponibilidad, en el camino del dinero.** Un reinicio es una
interrupcion. No hay a donde derivar trafico mientras se despliega.

## Decision

Se adopta **entrega continua con promocion de artefacto**, y el disparo del despliegue queda en manos
de una persona. Ocho reglas:

**R1. Desplegar solo desde un tag inmutable, nunca desde una rama.** El `IMAGE_TAG` del paquete ya lo
fuerza: sin valor explicito el compose no levanta, y `latest` esta prohibido porque con un tag movil
nadie puede responder que version corre ni existe un nombre al que volver.

**R2. Construir una vez y promover.** El mismo artefacto —por digest, no por tag— corre primero en
integracion y despues en produccion. Recompilar para desplegar produce un binario que nadie ha
probado, por identico que sea el codigo fuente.

**R3. Toda migracion debe ser compatible con la version anterior.** Expandir en una release, contraer
en la siguiente. Es lo unico que hace posible el rollback dado el hecho 2, y es lo que hay que
revisar en cada pull request que toque `db/migration`.

**R4. Instantanea del disco antes de desplegar una migracion**, no despues. La programacion diaria no
basta: la copia que importa es la inmediatamente anterior al cambio de esquema.

**R5. Aprobacion humana para produccion.** El tag dispara la publicacion; el despliegue lo confirma
alguien. En GitHub se implementa con *Environments* y revisores obligatorios.

**R6. Verificacion de salud despues del despliegue, y rollback = redesplegar el tag anterior.** Un
despliegue no termina cuando el contenedor arranca. Y el rollback tiene que estar ensayado, no
supuesto.

**R7. Las credenciales de la maquina no viajan a CI.** La VM tira del registro con su propio token de
solo lectura. Dar a un workflow una clave SSH de produccion abre una puerta que hoy no existe.

**R8. No desplegar con trabajo en vuelo.** Reiniciar `platform-app` a mitad de un proceso es
exactamente el escenario que la reconciliacion debe cubrir; no conviene ejercitarlo sin querer.

## Alternativas descartadas

**Despliegue automatico al fusionar en `main`.** Es lo que suele entenderse por CD. Se descarta por la
conjuncion de los hechos 2, 3 y 4: migraciones automaticas al arrancar, un artefacto que nadie ha
ejecutado antes, y ninguna maquina a la que derivar si sale mal. Cualquiera de los tres por separado
seria manejable; los tres juntos convierten cada merge en una apuesta.

**Aceptar el rollback por restauracion de copia.** Tecnicamente valido y a veces inevitable, pero
dura horas y pierde lo escrito desde la copia. Como camino habitual no sirve: la compatibilidad hacia
atras de R3 es mas barata y se paga una vez, al escribir la migracion.

**Construir en la VM.** Se probo y no cabe: el analisis de GraalVM pica a 9,7 GB y la maquina tiene 8.
Ademas contradiria R2.

**Dar acceso SSH a CI para que despliegue.** Es la via directa al despliegue automatico, y la razon
para no tomarla es R7: convierte el repositorio en una ruta hacia la maquina que guarda la boveda.

## Consecuencias

- **El entorno de integracion tiene que consumir las imagenes del registro** en vez de construirlas.
  Es el cambio concreto que cierra el hueco del hecho 3, y es mas barato que montar un entorno de
  preproduccion nuevo.
- **Cada pull request que toque `db/migration` gana una revision explicita** de compatibilidad hacia
  atras. Sin eso, R3 es una intencion.
- **El despliegue sigue siendo manual**, y eso es deliberado: hoy el `pull` a mano es lo unico que
  pone a un humano delante del cambio. Automatizarlo antes de tener R2 y R3 funcionando quitaria la
  ultima red sin haber puesto la primera.
- **Cuando R2 y R3 esten en pie**, el paso siguiente es un workflow de despliegue con aprobacion
  (R5) que haga `pull` + `up -d` + verificacion (R6). No antes.
- La publicacion sigue costando ~12 min de runner grande por version. Es aceptable porque se publica
  al taggear, no en cada merge.

## Evidencia

- Workflows y disparadores en `main`: `.github/workflows/` — ninguno con paso de despliegue.
- `quarkus.flyway.migrate-at-start=true`: `platform-app/src/main/resources/application.properties:25`,
  sin sobreescritura en `ops/fase-7-deploy/dist/vm/config/application.properties`.
- 52 migraciones en `platform-app/src/main/resources/db/migration`.
- Servicios comparados: `ops/fase-7-deploy/dist/onprem/docker-compose.int.yml` (17) frente a
  `ops/fase-7-deploy/dist/vm/docker-compose.cloud.yml` (8).
- Requisito de memoria del build nativo: `ops/fase-7-deploy/dist/NATIVE-STATUS.md`.
- Primer despliegue en la nube verificado el 2026-08-19: certificado emitido, `verify-oidc.sh` con
  veredicto positivo y desellado automatico contra Cloud KMS (`Sealed: false` sin intervencion).
