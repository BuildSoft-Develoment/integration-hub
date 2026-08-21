# ADR-030 — Despliegue automatizado a la VM: modelo pull con aprobacion, y rollback clasificado por migracion

- **Estado**: propuesta
- **Fecha**: 2026-08-20
- **Ambito**: despliegue de `platform-app` y `audit-consumer` en la VM de GCP (`ops/fase-7-deploy/dist/vm`)

## Contexto

Direccion pide que el despliegue a la nube deje de hacerse a mano. ADR-029 ya habia previsto este
paso —"cuando R2 y R3 esten en pie, el paso siguiente es un workflow de despliegue con aprobacion
(R5)"—, asi que esto no lo contradice: lo continua. De las dos condiciones, **R2 esta cumplida en
lo esencial** —integracion consume las imagenes del registro en vez de construirlas, asi que el
artefacto que llega a produccion ya ha corrido antes— pero **no al pie de la letra**: R2 pide
promover "por digest, no por tag", y lo que promovemos es un tag corto de SHA.
`deploy-int.yml` rechaza los tags moviles (`latest`, `main`, `develop`), lo que acota el riesgo
sin llegar a fijar el digest. **R3 no esta cumplida**:
"toda migracion debe ser compatible con la version anterior" sigue siendo una intencion escrita sin
ninguna comprobacion automatica. `ci-compat-db.yml` no la cubre; lo que ejecuta es
`-Pcompat-db-tests`, que es compatibilidad multi-motor, no compatibilidad hacia atras.

Ocho hechos condicionan el diseno. Todos estan verificados sobre el repositorio o sobre el bytecode
de las dependencias, y el primero —el que gobierna a los demas— ademas **ejecutado**.

**1. Volver a la imagen anterior NO arranca, aunque la migracion fuera inofensiva.** Es el hecho que
gobierna todo lo demas, y no se deduce de la documentacion de ninguno de los dos proyectos: la de
Flyway dice que las migraciones futuras se ignoran por defecto, y la de Quarkus dice que
`ignore-future-migrations` vale `false`. Las dos son ciertas, y juntas dan un resultado que ninguna
enuncia. La cadena, eslabon por eslabon:

- Flyway 12 arranca con `ignoreMigrationPatterns = ["*:future"]` (`FlywayModel.defaults()`), es
  decir, **ignorando** las migraciones aplicadas que su jar no conoce.
- `FlywayCreator` de Quarkus llama a `FluentConfiguration.ignoreMigrationPatterns(...)` de forma
  **incondicional**: las dos ramas del `if` convergen antes de la llamada. Con los defaults
  (`ignore-missing-migrations=false`, `ignore-future-migrations=false`, sin patrones explicitos) el
  array que pasa esta **vacio**.
- `setIgnoreMigrationPatterns(String...)` no tiene guarda para el array vacio: hace
  `Arrays.stream(...).collect(toList())` y lo asigna. El default `["*:future"]` queda **sobrescrito
  por una lista vacia**.
- Con `validate-on-migrate=true` (default, no lo pisamos) y `migrate-at-start=true`, el arranque
  valida, encuentra en `flyway_schema_history` versiones que ese jar no lleva dentro, y aborta.

Traducido: `IMAGE_TAG=<anterior> && docker compose up -d` **no es un rollback**, es otra caida. Y lo
es aunque la migracion fuera un `ADD COLUMN ... DEFAULT` perfectamente aditivo.

La contrapartida buena: `clean-on-validation-error` vale `false` y `FlywayCleanVetoCallback` es
configuracion de build-time horneada en el binario nativo. El camino por el que Flyway "arregla" un
fallo de validacion **vaciando la base** esta cerrado. Un rollback mal hecho deja el sistema parado,
no sin datos.

**2. Las migraciones no son excepcionales.** Cinco en los ultimos treinta dias (V101, V102, V103,
V104, V106). Cualquier diseno que trate el caso "el pase trae migraciones" como raro se equivoca de
caso comun.

**3. Pero el contenido de las migraciones casi nunca impide retroceder.** Son **106**, no 52:
`quarkus.flyway.locations` declara dos directorios —`db/migration` del motor (52) y
`db/migration-mt101` del vertical (54)— y Flyway las mezcla por numero de version en un unico
historial. Repasadas las dos:

- Las 13 sentencias `ADD COLUMN ... NOT NULL` llevan **todas** `DEFAULT`, asi que la version vieja
  inserta sin esa columna y el valor por defecto la rellena.
- Las nueve `ALTER TYPE` ensanchan o mantienen el ancho (`varchar(120)`->`varchar(255)`,
  `varchar(64)`->`varchar(512)`, `char(64)`->`varchar(64)`, `varchar(20)`->`varchar(80)`,
  `char(1)`->`varchar(1)`).
- El `SET NOT NULL` de V10 se aplica a columnas que la propia V10 acaba de crear.

**Quedan dos migraciones que impiden retroceder por su contenido**, las dos por `DROP COLUMN`: V101
sobre `system_theme_setting` —tema de la interfaz— y **V36 del vertical sobre
`vertical_mt101.mt101_fragment_record`, que si esta en el camino del dinero**.

Aun asi el riesgo dominante no esta en el esquema: esta en la validacion del hecho 1, que es
universal y afecta a todo pase con migraciones, las inofensivas incluidas.

**4. Flyway no puede deshacer.** `undo` es extension propietaria: la edicion Community solo trae
`UndoCommandExtensionStub` bajo `internal/proprietaryStubs`. Todo script de bajada lo escribe una
persona, y por tanto hay que ensayarlo, no suponerlo.

**5. `audit-consumer` no migra, pero comparte tablas.** No tiene `db/` en el modulo; el unico que
versiona DDL es `platform-app`. Su rollback es cambio de imagen puro. Pero escribe en tablas cuyo
esquema es propiedad de `platform-app`: escribe `audit_record_event` desde `PostgresColdStore` y
`audit_dead_letter_event` desde `AuditDeadLetterWriter`. Mover un tag sin el otro deja un consumidor
trabajando contra un esquema que su pareja acaba de cambiar.

**6. En produccion Hibernate no valida el esquema al arrancar.**
`quarkus.hibernate-orm.database.generation=none`. Un desajuste no aparece al levantar el contenedor
sino **en la primera consulta que toca la columna**, potencialmente a mitad de un proceso. La
comprobacion tiene que ser previa a aprobar, no observada despues de desplegar.

**7. La VM no puede hacerse una instantanea a si misma.** Sus ambitos son `cloudkms` mas los siete
por defecto; no incluyen `compute`. Anadirlo exige apagar la instancia una vez.

**8. Los dos transportes del modelo pull ya existen.** La maquina tiene un clon del repositorio y un
`docker login ghcr.io` hecho con un token de solo lectura (`read:packages`). No hace falta credencial
nueva: hace falta que el `git pull` deje de ser interactivo.

## Decision

Se adopta **despliegue automatizado en modelo pull, con puerta de aprobacion humana y rollback
clasificado**. Dieciseis reglas.

**D1. La VM tira; nadie empuja.** Ningun workflow recibe clave SSH ni puerto abierto contra la
maquina que guarda la boveda. Es R7 de ADR-029, y es la razon de que el modelo sea pull y no push.

**D2. La version deseada vive en un fichero versionado, en una rama que ningun workflow observa.**
Cada despliegue y cada rollback pasan a ser un commit con autor y fecha, revisable y revertible, y el
rollback usa **el mismo mecanismo** que el despliegue en vez de un camino especial que se oxida por
no usarse. La rama tiene que ser propia: los disparadores actuales son `main`, `develop`, tags `v*` y
manuales, y `ops/**` **no** esta en la lista de rutas inertes de `entrega-continua-int.yml` —se quito
a proposito porque ahi vive `Dockerfile.native`—, asi que dejar el fichero bajo `ops/` en `develop`
lanzaria doce minutos de compilacion nativa en cada aprobacion y en cada rollback.

**D3. La aprobacion es la fusion de un pull request, no un boton de entorno.** Cumple R5 de ADR-029,
pero no por donde este ADR decia en su primera version.

**Por que cambia.** Decia "con *Environments* y revisores obligatorios de GitHub". **Eso no esta
disponible aqui**: comprobado el 2026-08-20 creando el entorno `produccion` en este repositorio, su
pagina de configuracion ofrece **solo** ramas y tags, secretos y variables. No hay seccion de reglas
de proteccion: ni revisores obligatorios, ni temporizador, ni *Prevent self-review*. La documentacion
de GitHub solo lo insinua —"some features for environments have no or limited availability for
private repositories"— sin decir cuales. Que la seccion *Environments* exista no significa que dentro
este la puerta.

**Lo que la sustituye.** Por D2 la version deseada ya vive en un fichero versionado: el workflow
**propone** el cambio de `tag` como un pull request contra la rama de estado, y **fusionarlo es la
aprobacion**. El agente de la VM ve el commit resultante y despliega.

No es un apano por no tener lo otro; es mejor en tres cosas:

- **Se ve el diff** —`tag: 13da61d -> 9b064f6`—. Aprobar deja de ser un boton sin contexto.
- **El veredicto A/B/C de D4 cabe en el cuerpo del pull request**, que es donde se lee de verdad.
- **Las protecciones de rama son mas capaces que las del entorno.** Un entorno admite como mucho
  1-de-N: "only one of the required reviewers needs to approve". Un pull request permite exigir **N
  aprobaciones** ("Required number of approvals before merging"), asi que el dia que direccion pida
  doble firma para el camino del dinero, se puede.

**La configuracion, verificada sobre el formulario de este repositorio:**

- `Require a pull request before merging` sobre la rama de estado;
- `Require approvals`: 1 hoy, ampliable;
- `Require approval of the most recent reviewable push` —"whether the most recent reviewable push
  must be approved by someone other than the person who pushed it"—. Es el *Prevent self-review* que
  el entorno no ofrecia, y es lo que convierte la pausa en segregacion de funciones;
- **quien aprueba se designa con `CODEOWNERS`** apuntando el fichero de estado al equipo
  `@BuildSoft-Develoment/aprobadores-produccion`, mas `Require review from Code Owners`. Sin eso
  aprueba cualquiera con escritura. El equipo se creo el 2026-08-20 con rol **Read**: un aprobador no
  necesita mas.

**Mientras haya una sola persona** la regla de "aprobado por alguien distinto de quien empujo" no
puede cumplirse, igual que pasaba con el entorno. Se deja activada de todos modos: hoy no hay nada
que desplegar automaticamente, y con ella puesta es **imposible** que un despliegue se apruebe solo
mientras se construye el resto.

**El entorno `produccion` se conserva** aunque no sea la puerta: su restriccion de ramas y tags
sigue funcionando y mecaniza la R1 de ADR-029 —solo un tag inmutable despliega—, y da un sitio para
secretos propios de produccion.

**D4. Cada pase se clasifica solo, y la clase se muestra en la pantalla de aprobacion.** La
clasificacion sale del diff de **todos** los directorios que declara `quarkus.flyway.locations`, no
de uno:

```
git diff --name-only <tag-estable> <tag-nuevo> -- \
  platform-app/src/main/resources/db/migration \
  vertical-swift-mt101/src/main/resources/db/migration-mt101
```

Enumerar un solo directorio es el error que este ADR estuvo a punto de cometer. Por ADR-023 cada
modulo es dueno de su DDL, asi que la lista crece con cada vertical nuevo: el clasificador la lee de
`quarkus.flyway.locations` en vez de llevarla escrita, o el dia que nazca un tercer vertical su
primera migracion destructiva pasara clasificada como A.

| Clase | Contenido del salto | Rollback |
|---|---|---|
| **A** | sin migraciones | cambiar el tag |
| **B** | migraciones aditivas (`ADD COLUMN ... DEFAULT`, `CREATE TABLE`, `CREATE INDEX`) | cambiar el tag **y** `QUARKUS_FLYWAY_IGNORE_FUTURE_MIGRATIONS=true` en ese contenedor |
| **C** | destructivas (`DROP COLUMN`, renombrado, estrechar un tipo, `NOT NULL` sin default) | script de bajada + borrado de las filas del historial + instantanea |

**D5. En clase B el rollback no toca la base.** La variable es configuracion de runtime, asi que una
variable de entorno basta y gana al fichero de propiedades incluso en el binario nativo. Las columnas
nuevas se quedan donde estan y el codigo viejo las ignora. Sin script, sin perdida de datos.

**D6. Esa variable se retira al volver a avanzar.** Mientras este puesta, el entorno acepta en
silencio un jar al que le faltan migraciones, que es justo lo que la validacion existe para cazar. Su
presencia en el `.env` es la marca de que el entorno esta retrocedido, y quitarla es parte de volver
adelante.

**D7. La puerta rechaza sola un pase de clase C que no traiga script de bajada.** No es una norma de
revision: es una comprobacion que corre antes de abrir la aprobacion. Una regla que depende de que
alguien se acuerde es exactamente lo que le paso a R3 de ADR-029.

Para que sea comprobable hace falta convencion de sitio y nombre, no basta con decir donde no va:
cada migracion destructiva `Vnnn` exige un `ops/fase-7-deploy/rollback/Vnnn__<nombre>.down.sql`. Va
**fuera** de `db/migration` —dentro, Flyway lo aplicaria como una migracion mas— y se escribe en el
mismo pull request que la subida.

La comprobacion corre en **dos sitios**, porque cubren cosas distintas: en el pull request que anade
la migracion, que es donde sale mas barato arreglarlo, y sobre el salto completo
`<tag-estable>..<tag-nuevo>` al pedir la aprobacion, porque una release abarca varios pull requests y
ninguno de ellos ve el salto entero.

Y exige **las dos mitades** del script, no solo el DDL: sin el borrado del historial la imagen vieja
tampoco arranca (hecho 1), y es la mitad que se olvida.

```sql
ALTER TABLE system_theme_setting ADD COLUMN density varchar(20);
DELETE FROM flyway_schema_history WHERE version IN ('101');
```

**D8. Los dos tags se mueven juntos y son siempre el mismo.** `platform-app` y `audit-consumer` se
despliegan y se retroceden en el mismo acto, por el hecho 5.

**D9. Instantanea antes de todo pase de clase B o C**, no despues. La programacion diaria no basta:
la copia que importa es la inmediatamente anterior al cambio de esquema.

**D10. Ningun rollback automatico por fallo de salud.** Si la verificacion falla, el despliegue **se
detiene y avisa**; retroceder es decision de una persona que ya sabe que clase de pase era. Revertir
la imagen sola mientras el esquema ha avanzado puede cambiar una caida por otra peor, y en el camino
del dinero eso no se automatiza. Lo que si es automatico es negarse a seguir.

**D11. Tras recrear `platform-app`, refrescar nginx —pero nunca a ciegas.** `proxy_pass` sobre un
nombre estatico resuelve una sola vez al cargar la configuracion; recrear el contenedor le cambia la
IP y deja un 502 permanente. Ya paso el 2026-08-19 en la VM y esta corregido en el despliegue a
integracion.

Lo que no dice esa correccion, y se observo en el stack de integracion local el 2026-08-20: la misma
resolucion-al-cargar tiene un segundo filo, **peor**. Si al releer la configuracion **falta** un
upstream —no que haya cambiado de IP, sino que el contenedor no exista— nginx no arranca en absoluto:

```
[emerg] host not found in upstream "openbao" in /etc/nginx/conf.d/default.conf:128
```

Y entra en bucle de reinicio. El resultado no es un 502 en una ruta: es **el sitio entero caido**,
incluidas las rutas que funcionaban. Un nginx viejo sirviendo una IP obsoleta al menos responde en
las demas; uno que no arranca, no.

De ahi dos exigencias para el agente:

- **Preferir `nginx -s reload` a reiniciar el contenedor.** El reload vuelve a leer la configuracion
  —y por tanto vuelve a resolver los upstreams, que es lo que D11 persigue—, pero si la nueva
  configuracion no valida, el maestro **mantiene vivos los workers antiguos**. Reiniciar el
  contenedor no perdona. (No probado todavia en este stack: el nginx de integracion estaba caido
  cuando se redacto esto.)
- **Comprobar antes que todos los upstreams estan en pie**, y despues verificar con D14. Refrescar
  nginx con un servicio caido convierte un incidente parcial en una caida total.

**D12. El agente no recrea nada con trabajo en vuelo: aplaza.** R8 de ADR-029 —"no desplegar con
trabajo en vuelo"— no se hereda solo. Hoy la cumple que hay una persona decidiendo cuando; un agente
que mira cada cinco minutos y recrea en cuanto ve un tag nuevo la rompera tarde o temprano, y sera a
mitad de una tanda de pagos. Aplaza con **dos** condiciones, y solo con esas dos:

```sql
select (select count(*) from process_execution
          where status = 'RUNNING'
            and execution_lease_until > now())                as motor_vivo,
       (select count(*) from vertical_mt101.mt101_rebuild_run
          where pay_status = 'EXECUTING'
            and pay_lease_until > now())                      as pago_en_vuelo;
```

Las dos llevan una acotacion, y **sin ella la regla se vuelve en contra**:

- `RUNNING` **con lease vigente**. V86 dio a `process_execution` owner, token, lease y heartbeat:
  `renewLease()` los renueva mientras el nodo siga siendo dueno y `listExpiredRunningIds()` barre las
  huerfanas. El lease dura 30 s (`integrationhub.execution.async.lease-seconds`) y **se renueva**
  mientras la ejecucion vive, asi que un nodo caido deja de contar en medio minuto. Sin mirar el
  lease, esa misma fila aplazaria el despliegue para siempre.
- `pay_status = 'EXECUTING'` **con lease vigente**, sobre `mt101_rebuild_run`. El pago correctivo lo
  dispara la aprobacion de un operador, no el bucle de ejecucion del motor, y por eso lleva un lease
  propio: V44 anadio `pay_lease_until`, se fija al reclamar el pago y se anula al cerrarlo. Tambien
  se cura solo —`markExpiredPayExecutionsUncertain` corre cada 60 s y pasa a `UNCERTAIN` todo
  `EXECUTING` con lease vencido—, **pero mucho mas despacio que el del motor**: este lease dura 15
  minutos y, al contrario que el otro, **no se renueva**; se fija una vez al reclamar. Un nodo caido
  puede por tanto aplazar hasta unos **16 minutos** (15 de lease mas un ciclo de barrido), no un
  minuto.

Y una que **parece** la condicion obvia y **no lo es**: `mt101_pay_dispatch_intent.status = 'DISPATCHING'`.
Ese ledger es la guarda antidoble-pago, no un indicador de vuelo: el codigo dice que "un crash tras
marcar DISPATCHING queda asi", y `Mt101PayDispatchIntentReconcileService` no es un barrido sino una
accion de operador con `executedBy` y `reason` obligatorios que, sin terminal definitivo, deja la fila
"atascada para conciliacion manual" —nunca un desbloqueo ciego que arriesgue doble-pago—. Una fila
asi puede seguir ahi **semanas, por diseno**. Aplazar por ella habria congelado los despliegues para
siempre.

**Lo que NO aplaza**, que es la mitad que evita congelar los despliegues:

- `task_dispatch_outbox`, `task_inbox` y `task_async_dispatch`: existen precisamente para sobrevivir a
  un reinicio. Bloquear por ellos seria desconfiar del diseno que ya se pago.
- `SUSPENDED`: espera deliberada de un callback bancario o una aprobacion; puede durar dias.
- `PENDING`: no ha empezado; se recoge despues.
- `NEEDS_RECONCILIATION` y `UNCERTAIN`: ya estan rotos de antes. Bloquear el despliegue no los
  arregla, solo lo congela.

**El aplazamiento es acotado y visible.** Un agente que aplaza en silencio es indistinguible de un
agente muerto. Tras doce ciclos —una hora, a cinco minutos— abre un **issue de GitHub** con lo que
encontro. Esa hora no es arbitraria: supera con holgura los dos techos de auto-curacion (medio minuto
el del motor, ~16 minutos el del pago correctivo), asi que si a la hora se sigue aplazando ya no es
un nodo caido, es trabajo real o una fila enferma. Abierto el issue, deja de intentarlo hasta que
alguien decida. Un issue por despliegue pendiente, actualizado; no uno cada cinco minutos. Y debe
separar dos casos que piden respuestas opuestas: "hay trabajo de verdad, vuelve luego" y "hay una
fila atascada desde hace horas", que no es un aplazamiento sino una incidencia.

Tres avisos para quien lo implemente:

- **La regla no inventa ningun umbral**, y esa es la razon de preferir los dos leases a cualquier
  ventana de frescura. El del pago correctivo dura **15 minutos**, pero esta escrito a fuego en una
  sola linea (`LocalDateTime.now().plusMinutes(15)`) y no es configurable: quien lo cambie debe saber
  que mueve tambien el techo del aplazamiento.
- **`execution_lease_until` es `timestamp` sin zona** y Java lo escribe con `LocalDateTime`. Compararlo
  con el `now()` de Postgres solo funciona si los dos contenedores coinciden de reloj. Hoy coinciden
  porque ninguno fija `TZ` y ambos van en UTC —por coincidencia, no por diseno—.
- **Punto ciego**: una fila `RUNNING` con `execution_lease_until` nulo (anterior a V86) es invisible
  tanto para el barrido de recuperacion como para esta condicion.

**D13. "Tag estable" es el que se probo sano, no el anterior.** Es el lado izquierdo de toda
clasificacion (D4) y el destino de todo rollback, asi que no puede quedar implicito. Definicion:

> **el tag estable es la version que estaba corriendo y respondio sana la ultima vez que se aprobo un
> despliegue.**

No es "el tag anterior". Si un pase salio mal, su predecesor es el que quieres, no el.

El fichero de estado de D2 lleva las dos versiones, no una:

```yaml
tag: 9b064f6          # lo que la maquina debe correr
tag_estable: 13da61d  # lo ultimo que se probo sano; destino de un rollback
clase: B              # A | B | C, calculada en D4 sobre el salto tag_estable..tag
aprobado_por: ...
fecha: ...
```

**Lo propone un workflow y lo fusiona una persona (D3); la maquina no escribe nunca.** Es lo que
mantiene en pie D1: si el agente tuviera que promover el tag estable, necesitaria credencial de
**escritura** sobre el repositorio, y el modelo pull dejaria de ser solo-lectura por la puerta de
atras.

**La promocion es una comprobacion, no un apunte.** Antes de escribir el `tag` nuevo, el workflow
consulta el endpoint publico de salud —`https://<host>/appih/q/health`, el mismo 200 que ya exige
`deploy-int.yml`—:

- se puede probar que corre el `tag` anterior **y** responde sano -> ese tag pasa a ser
  `tag_estable`;
- cualquier otro caso —no responde, la VM esta apagada, o **no se puede probar que version corre**—
  -> **`tag_estable` no avanza**.

De ahi sale la propiedad que se buscaba: **un despliegue que nunca demostro estar sano no puede
convertirse en destino de rollback**. Y que la maquina este apagada —lo esta a menudo, para ahorrar—
no rompe nada: simplemente no promueve, que es la respuesta conservadora.

Un rollback, entonces, es escribir `tag: <tag_estable>` y dejar `tag_estable` intacto.

**El tercer caso no es teorico, y bloquea parte de esta regla.** Un 200 en salud prueba que corre
*algo* sano, no **que tag** corre; y hoy no hay forma de averiguarlo: `/q/info` esta deshabilitado
(404 en integracion) y `/q/health` no lleva la version. Por D1 el workflow no tiene otro canal hacia
la maquina que el HTTP publico, asi que **no es un detalle a pulir: es el unico canal, y esta mudo**.

Y lo que lo vuelve urgente es **D12**: el agente aplaza cuando hay trabajo en vuelo y, tras doce
ciclos, abre issue y deja de intentarlo. Es decir, **que el `tag` del fichero no sea el que corre es
un comportamiento previsto, no una indisciplina**. Promover a ciegas el `tag` saliente convertiria en
destino de rollback una version que nunca llego a desplegarse —el fallo exacto que D13 existe para
evitar—.

Mientras el canal siga mudo, entonces:

- **exponer el tag que corre por HTTP** —habilitar `/q/info` con la version de imagen, o anadirla a
  la trama de salud— es **requisito** de esta regla, no una mejora;
- y hasta que exista, `tag_estable` lo avanza **explicitamente quien aprueba**, que si puede mirar si
  el despliegue anterior llego a aplicarse. La maquina no lo adivina.

**D14. La salud se comprueba con lo que ya funciona, y a traves de nginx.** No hace falta disenar
nada: `deploy-int.yml` lleva un paso "Comprobar que responde" que sondea un **200 en `/q/health`** con
un presupuesto de 100 segundos y falla con un mensaje que distingue el caso que importa —"los
contenedores pueden estar arriba y la app rota"—. El criterio se adopta tal cual.

**Contra nginx, no contra el contenedor**, y esta es la parte que no es obvia. El 502 del 2026-08-19
lo provoco nginx resolviendo una IP muerta (D11): **el contenedor estaba sano**. Una comprobacion
hecha contra `platform-app` directamente habria dado verde sobre un sistema caido para todo usuario.
Comprobar por la puerta publica es lo que convierte D11 de confianza en verificacion:

| Servicio | Como se comprueba | Por que asi |
|---|---|---|
| `platform-app` | `GET https://<host>/appih/q/health` -> 200 | recorre nginx, la ruta `/appih/` y el contenedor; es el camino del usuario |
| `audit-consumer` | `GET http://audit-consumer:8082/q/health` -> 200, desde `ihnet` | no tiene puerto publicado ni ruta en nginx, y **no debe tenerlos**: es interno |

El consumer tiene `quarkus-smallrye-health` y su propia configuracion ya anticipa este uso ("un
orquestador lee `/q/health`"). Al no estar publicado, la sonda sale desde dentro de la red: sirve
cualquier contenedor del stack que traiga cliente HTTP —el de nginx lleva `wget` de busybox—, sin
publicar nada nuevo.

**La misma comprobacion la usan dos actores, y no es duplicidad:**

- **el agente, despues de recrear**: si no responde, D10 —se detiene y avisa, sin retroceder solo—;
- **el workflow de aprobacion, antes de promover** `tag_estable` (D13): pregunta por lo que corre
  *ahora*, no por lo que acaba de desplegar.

**Lo que falta y no cubre esta regla:** ni `platform-app` ni `audit-consumer` declaran `healthcheck` de
contenedor —ni en el compose de la VM, ni en el de integracion, ni como `HEALTHCHECK` en los
Dockerfile—; si lo tienen postgres, keycloak, kafka, openbao y minio. Mientras siga asi, `depends_on:
condition: service_healthy` no puede apuntar a ellos y Docker no distingue "arrancado" de "arrancado
y roto". Anadirlo es higiene que excede este ADR, pero conviene saber que la unica senal de salud de
los dos servicios que se despliegan es la de arriba.

**D15. El rollback de clase C se ensaya antes de aprobar, y el ensayo tiene guion.** "Ensayado" sin
procedimiento es una intencion; esto es el procedimiento, y no es hipotetico: son los pasos que se
ejecutaron el 2026-08-20 para establecer el hecho 1.

**Por defecto, contra un Postgres desechable.** Minutos, aislado, sin ventana ni permiso de nadie:

1. Levantar un Postgres vacio.
2. Arrancar la imagen **nueva** contra el: migra hasta el esquema nuevo.
3. Aplicar el script de bajada entero —el DDL **y** el `DELETE` de `flyway_schema_history`—.
4. Arrancar la imagen **estable** contra la misma base.
5. Comprobar los dos asertos de abajo.

**En integracion**, y solo cuando el script de bajada toca **datos** y no solo DDL: un esquema vacio
no puede ensayar una migracion de datos. Ahi la secuencia lleva volcado antes y restauracion despues,
porque el ensayo destruye el estado del entorno.

**Prohibido durante el ensayo: `QUARKUS_FLYWAY_IGNORE_FUTURE_MIGRATIONS`.** Es la salida de emergencia
de la clase B (D5) y aqui **falsea el resultado**: con la variable puesta la imagen vieja arranca
aunque el script de bajada este mal, porque deja de validar justo lo que el ensayo viene a demostrar.
Un ensayo de clase C con esa variable certifica un rollback que no funciona.

**Aprobado son dos asertos, no una impresion:**

- la imagen estable **arranca y responde 200** en `/q/health` (D14);
- `select max(version) from flyway_schema_history where success` devuelve la version que le
  corresponde al tag estable, ni una mas.

**La evidencia se adjunta a la aprobacion**: las dos comprobaciones con su salida. Un ensayo que nadie
puede ver es un ensayo que nadie hizo —y esa es exactamente la forma en que R3 de ADR-029 se quedo en
intencion durante 52 migraciones—.

**D16. Al retroceder, lo que el consumer viejo no entienda acaba en la cola de muertos —y hay que
sacarlo de ahi.** Kafka no pierde nada en un rollback: el consumer viejo reanuda desde el offset
confirmado. La pregunta no es si le llegan los eventos, sino si sabe **leerlos**.

Y hoy la respuesta es que no, en cuanto la version nueva anada un campo:

- `AuditEnvelope` lleva un campo `schemaVersion`, documentado como "evolucion independiente de
  consumidores". **Nadie lo valida**: no aparece en ningun sitio de `audit-consumer`. Hoy no protege.
- `AuditEventHandler` inyecta el `ObjectMapper` de CDI, y
  `quarkus.jackson.fail-on-unknown-properties` vale **`true`** por defecto en Quarkus 3.37.2 —"fail when
  encountering unknown properties"—. El consumer no lo pisa y `AuditEnvelope` no lleva
  `@JsonIgnoreProperties(ignoreUnknown = true)`. Un campo nuevo **rompe el parseo del consumer viejo**.

Lo que salva la situacion es que el fallo esta contenido: el handler captura, escribe en
`audit_dead_letter_event` —con el `payload` entero y el `error_message`—, avisa por log y **sigue**. Ni
se pierde el evento ni se atasca la particion en un bucle de veneno.

Pero **no hay reinyeccion**: la tabla guarda todo lo necesario para reproducir el evento y no existe
codigo que lo haga. Asi que la regla operativa es:

- un rollback que cruce un cambio de `AuditEnvelope` obliga a **vigilar
  `audit_dead_letter_event`** por las filas creadas en la ventana del retroceso, y a
  reinyectarlas —a mano, hoy— cuando se vuelva adelante;
- esas filas son la medida exacta del dano del rollback en el camino de auditoria: si no hay ninguna,
  no hubo dano.

**La prevencion es barata, pero hay que decidirla ANTES.** Basta
`quarkus.jackson.fail-on-unknown-properties=false` en el consumer, o
`@JsonIgnoreProperties(ignoreUnknown = true)` sobre `AuditEnvelope`: con eso un campo anadido se vuelve
invisible para un consumer anterior, que es el expandir-y-contraer de R3 aplicado a la trama en vez
de al esquema.

Y el "antes" es literal: esa propiedad es **build-time** (`JacksonBuildTimeConfig`), asi que **no se
puede activar durante un rollback con una variable de entorno**, al contrario que la de D5. Tiene que
venir horneada en la imagen. Es la misma frontera que dejo `quarkus.oidc.enabled=false` sin efecto al
probar el binario nativo: lo de runtime se corrige en caliente, lo de build-time hay que preverlo.

## Alternativas descartadas

**Modelo push con SSH desde CI.** Es la via directa y la razon de no tomarla es D1: convierte el
repositorio en una ruta hacia la maquina que guarda la boveda.

**Dejar `ignore-future-migrations=true` puesto siempre.** Haria el rollback trivial, pero convierte
un despliegue mal empaquetado —una imagen a la que le faltan migraciones— en un arranque limpio y
silencioso. La validacion es exactamente lo que hay que conservar en el camino normal y relajar solo
en el excepcional.

**`flyway undo`.** No esta en la edicion Community (hecho 4).

**Rollback siempre por restauracion de instantanea.** Tecnicamente valido y a veces inevitable, pero
dura horas y pierde lo escrito desde la copia. Como camino habitual sobra: por el hecho 3, casi todos
los pases son de clase A o B, y esos se retroceden en minutos sin tocar la base.

**Guardar la version deseada en `develop`.** Rechazado por el coste descrito en D2.

## Consecuencias

- **El clasificador de D4 y el rechazo de D7 son la primera comprobacion mecanica de R3** de
  ADR-029. Hasta ahora esa regla dependia de que alguien se acordara al revisar el pull request.
- **Nace un directorio `ops/fase-7-deploy/rollback/`** con los scripts de bajada. Empieza vacio: las
  dos migraciones destructivas del historial —V101 y la V36 del vertical— ya estan aplicadas en todos
  los entornos, y escribirles un script ahora seria para un rollback que nadie va a hacer.
- **Los pases de clase C exigen el ensayo de D15 antes de aprobar produccion**, contra un Postgres
  desechable por defecto y en integracion solo si el script de bajada toca datos. Un script que nadie
  ha ejecutado es una suposicion, no un plan.
- **Hay que decidir sobre la instantanea** (hecho 7): o se anade el ambito `compute` mas un rol de
  IAM acotado —lo que obliga a apagar la VM una vez—, o quien aprueba la toma a mano antes de dar el
  visto bueno. Conformarse con la programacion diaria no es defendible en un pase que migra esquema.
- **La rama de estado no se borra nunca.** Es el registro de que version *debe* correr, quien la
  aprobo y desde cuando.
- **Exponer por HTTP el tag que corre deja de ser opcional** (D13). Es el unico canal que D1 permite
  entre la maquina y quien aprueba, y hoy esta mudo: `/q/info` deshabilitado y `/q/health` sin
  version. Mientras siga asi, `tag_estable` lo avanza una persona, no el workflow.
- **Hay que decidir si se hornea la tolerancia de Jackson en `audit-consumer`** (D16). Es
  configuracion de build-time: si no viaja en la imagen, no hay forma de activarla el dia del
  rollback, y cada campo nuevo de `AuditEnvelope` se convierte en filas de cola de muertos que
  alguien tendra que reinyectar a mano.
- **El refresco de nginx del runbook y de `deploy-int.yml` deberia pasar de reiniciar el contenedor a
  `nginx -s reload`** (D11). Hoy los dos reinician, y un reinicio con cualquier upstream caido no
  degrada el servicio: lo apaga entero.
- **El `git pull` de la VM tiene que dejar de ser interactivo**, con una clave de despliegue de solo
  lectura. Es la unica credencial nueva del diseno.
- **Sigue habiendo una interrupcion en cada despliegue**: una sola maquina, sin sitio a donde derivar
  trafico (hecho 4 de ADR-029). Automatizar el disparo no la elimina; la hace mas frecuente y mas
  previsible.

## Evidencia

- Cadena de la validacion (hecho 1), verificada en bytecode:
  `FlywayModel.defaults()` de `flyway-core-12.0.0.jar` asigna `["*:future"]`;
  `FlywayCreator` de `quarkus-flyway-3.37.2.jar` llama a `ignoreMigrationPatterns` de forma
  incondicional tras converger las dos ramas;
  `ClassicConfiguration.setIgnoreMigrationPatterns(String...)` asigna sin guarda para el array vacio.
- Defaults de la extension: `validate-on-migrate=true`, `ignore-missing-migrations=false`,
  `ignore-future-migrations=false`, `clean-on-validation-error=false` (`@WithDefault` en
  `FlywayDataSourceRuntimeConfig`).
- `quarkus.flyway.migrate-at-start=true`: `platform-app/src/main/resources/application.properties:25`,
  sin sobreescritura en `ops/fase-7-deploy/dist/vm/config/application.properties`.
- `quarkus.hibernate-orm.database.generation=none`:
  `platform-app/src/main/resources/application.properties:8` y
  `ops/fase-7-deploy/dist/config/application-prod.properties:26`.
- `undo` propietario: `org/flywaydb/core/internal/proprietaryStubs/UndoCommandExtensionStub.class`.
- Hecho 1 **ejecutado** el 2026-08-20 contra un Postgres 16 desechable, en JVM **y en nativo** —la
  imagen `integration-hub:native-appih`, la misma que corre en integracion—. Con la base al dia
  arranca y aplica 106 migraciones. Anadida a mano una fila de version 107 en
  `flyway_schema_history`, el mismo binario termina con `exit=1` y
  `FlywayValidateException: Detected applied migration not resolved locally: 107`. Con
  `QUARKUS_FLYWAY_IGNORE_FUTURE_MIGRATIONS=true` valida las 107, no migra nada y arranca: 4,9 s en
  JVM, 0,362 s en nativo.
- La frontera build-time/runtime de D5, comprobada en el mismo experimento: sobre el binario nativo
  `QUARKUS_FLYWAY_IGNORE_FUTURE_MIGRATIONS` **si** surte efecto (es runtime) y
  `QUARKUS_OIDC_ENABLED=false` **no** (es build-time, horneada al compilar).
- 106 migraciones: 52 en `platform-app/.../db/migration` (cinco anadidas entre el 2026-07-25 y el
  2026-08-04) y 54 en `vertical-swift-mt101/.../db/migration-mt101`, estas llegadas de golpe en el
  commit `97203cb9` del 2026-07-30 —el reparto de ADR-023, mudanza y no crecimiento—.
- `DROP COLUMN` en `V101__system_theme_setting_drop_density_sidebar.sql` y en
  `V36__mt101_fragment_record_status_drop_and_archive_scope.sql`.
- `audit-consumer` sin directorio `db/`; `quarkus.flyway.locations` solo declara `db/migration` y
  `db/migration-mt101` (`application.properties:64`).
- Ambitos de la VM: `ops/fase-7-deploy/dist/vm/README.md:303`. Clon del repositorio en la maquina:
  `README.md:123`.
- Rutas inertes de la entrega continua a integracion: `.github/workflows/entrega-continua-int.yml`,
  sin `ops/**`. Los seis workflows del repositorio disparan solo con `main`, `develop`, tags `v*` o
  a mano: ninguno observa una rama arbitraria.
- Tablas compartidas: `audit-consumer/src/main/java/com/integrationhub/auditconsumer/coldstore/PostgresColdStore.java`
  y `.../AuditDeadLetterWriter.java`. `audit_spool` no aparece en `audit-consumer`.
- Incidente de nginx del 2026-08-19: commit `911fc79c`. La comprobacion de salud adoptada en D14 es
  el paso "Comprobar que responde" de `.github/workflows/deploy-int.yml` (200 en `/appih/q/health`,
  100 s de presupuesto). `audit-consumer` declara `quarkus-smallrye-health` y `quarkus.http.port=8082`,
  y en el compose de la VM vive solo en `ihnet`, sin puertos publicados ni ruta en nginx.
- Segundo filo de la resolucion-al-cargar de nginx (D11), observado el 2026-08-20 en el stack de
  integracion local: con el contenedor `openbao` inexistente, `nginx:1.27-alpine` aborta con
  `[emerg] host not found in upstream "openbao"` y entra en bucle de reinicio, dejando caidas tambien
  `/appih` y `/iam`, que funcionaban.
- Camino de mensajes (D16): `AuditEnvelope.schemaVersion` existe en `platform-contract` pero no
  aparece en `audit-consumer`; `AuditEventHandler` inyecta el `ObjectMapper` de CDI y captura el
  fallo de parseo hacia `audit_dead_letter_event` (payload + error_message + topic + created_at);
  `quarkus.jackson.fail-on-unknown-properties` = `true` por defecto (modelo de configuracion de
  `quarkus-jackson-3.37.2`), sin sobreescritura en el consumer y sin `@JsonIgnoreProperties` en el
  contrato. No existe codigo de reinyeccion.
- Lease del motor: `integrationhub.execution.async.lease-seconds` (30 s por defecto), renovado por
  `renewActiveLeases()` dentro de `pumpPendingExecutions()`, que corre cada 2 s
  (`integrationhub.execution.async.dispatch-every`). Ni `application-prod.properties` ni la
  configuracion de la VM los sobreescriben.
- Estados de D12: `ExecutionStatus` (PENDING, RUNNING, COMPLETED, COMPLETED_WITH_ERRORS, FAILED,
  SUSPENDED, NEEDS_RECONCILIATION, ABORTED), persistido con `@Enumerated(EnumType.STRING)` en
  `ProcessExecution` y `ProcessTaskExecution`, asi que la comparacion contra el literal es correcta.
- Lease y heartbeat: `V86__process_execution_distributed_claim.sql` y
  `ProcessExecutionRepository.renewLease() / listExpiredRunningIds()`.
- `DISPATCHING` residual tras un crash: `Mt101CorrectiveLifecycleService`; resolucion manual gobernada:
  `Mt101PayDispatchIntentReconcileService`; `updated_at = current_timestamp` en cada cambio de estado
  del ledger: `Mt101PayDispatchIntentStore`.
- Lease del pago correctivo: `pay_lease_until` en `V44__mt101_corrective_pay_hash_uncertain_partial.sql`;
  se fija en `Mt101RebuildRepository.claimPayForExecution` (guardado por `status='ARCHIVED' and
  pay_status='REQUESTED'`) y se anula al cerrar; su duracion son **15 minutos escritos a fuego** en
  `Mt101CorrectiveLifecycleService` (`LocalDateTime.now().plusMinutes(15)`, unica aparicion).
- Barrido que lo cura: `Mt101RebuildRepository.markExpiredPayExecutionsUncertain`
  (`pay_status='EXECUTING' and pay_lease_until < ?` -> `UNCERTAIN`), invocado cada 60 s desde
  `Mt101RebuildLifecycleScheduler`.
- El comentario del DDL del ledger (`DISPATCHING | SENT | REJECTED | UNCERTAIN`) esta incompleto: el
  codigo usa tambien `INVALIDATED`. No es la lista autorizada.
