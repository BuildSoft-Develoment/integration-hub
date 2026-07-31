# ADR-024 — Despliegue nativo bajo un subpath, horneado en build-time

- **Estado**: aceptada
- **Fecha**: 2026-07-31
- **Ambito**: empaquetado y despliegue de `platform-app` (backend Quarkus + SPA embebida)

## Contexto

El ambiente de integracion on-premise sirve la aplicacion detras de un nginx, en
`https://app.buildsoft.com.pe/appih/`, compartiendo dominio con otros servicios. La aplicacion no
esta en la raiz: cuelga de un **subpath**.

Eso afecta a dos cosas que **no** son configuracion de runtime:

1. El `root-path` de Quarkus, que determina donde se montan la API y los endpoints de plataforma.
2. El `base-href` del SPA de Angular, que Quinoa compila **dentro** del binario. Un bundle construido
   para `/` pide sus assets a `/main-xxxx.js`; detras del subpath esa ruta no existe.

Ademas, el despliegue es **nativo** (Mandrel), no JVM: el artefacto es un ejecutable con la UI ya
embebida, no un jar mas una carpeta de estaticos.

La decision llevaba semanas tomada y funcionando, pero **solo existia en scripts `.cmd` de una laptop
y en notas fuera del repositorio**. `adr/README.md` exige registrar los cambios de despliegue, y este
no estaba. La reingenieria documental lo saco a la luz: ninguna fase mencionaba `/appih`.

## Decision

**El subpath se hornea en tiempo de build mediante el perfil Maven `appih`**, que fija a la vez el
`root-path` de Quarkus y la configuracion de build del SPA con su `base-href`.

```
mvn -pl platform-app -am clean package -Dmaven.test.skip=true \
    -Pnative,appih -Dquarkus.native.container-build=true
```

Consecuencias directas, y son las que importan en operacion:

- **Es irreversible sin reconstruir.** Una imagen construida sin `-Pappih` sirve en `/` y **no
  funciona** detras del nginx de integracion. No se arregla con una variable de entorno ni con una
  regla de proxy: el `base-href` esta dentro del bundle.
- **Es una decision opt-in.** Sin el perfil, dev local y cualquier despliegue en raiz siguen igual.
- **La imagen base debe ser UBI9.** El builder Mandrel es UBI9 (glibc 2.34); la variante
  `quarkus-micro-image:2.0` es UBI8 (glibc 2.28) y el runner **no arranca** —
  `GLIBC_2.34 not found`.

Y el modelo de entrega: **sin rebuild en destino**. Se construye la imagen aqui, se exporta con
`docker save`, se carga con `docker load` en el servidor y se levanta con compose. El servidor no
necesita Maven, ni JDK, ni acceso a repositorios de artefactos.

## Alternativas descartadas

- **Reescritura de rutas solo en nginx.** Resuelve la API pero no el SPA: el navegador seguiria
  pidiendo los assets a la raiz. Habria que reescribir tambien el HTML al vuelo, que es fragil y
  opaco.
- **`base-href` por variable de entorno en runtime.** Angular lo resuelve en build; hacerlo dinamico
  exige inyectar el `<base>` en el `index.html` servido, y con la UI embebida en un binario nativo eso
  significa reescribir un recurso empaquetado.
- **Servir la SPA aparte del backend** (nginx sirviendo estaticos, Quarkus solo API). Es una
  arquitectura razonable, pero renuncia a la ventaja de un unico artefacto autocontenido, que es justo
  lo que hace viable el despliegue on-premise sin rebuild.
- **Desplegar en la raiz de un subdominio propio.** Es la opcion mas limpia y quedaria descartada solo
  por la restriccion actual de compartir dominio. Si esa restriccion desaparece, este ADR debe
  revisarse: el subpath deja de aportar.

## Consecuencias

- El checklist de salida a produccion incluye el perfil `appih` como item de build, porque olvidarlo
  produce una imagen que arranca, pasa el health check y **sirve una UI rota**.
- Cualquier ambiente nuevo debe declarar si va en raiz o en subpath **antes** de construir.
- El paquete autocontenido de `C:\deploy` viaja con las imagenes ya construidas con el perfil. Cambiar
  el subpath obliga a regenerar el `.tar` completo, no solo la configuracion.

## Evidencia

- Perfil `appih` en `pom.xml`, seccion `<profiles>`.
- Imagen de runtime: `ops/fase-7-deploy/dist/common/Dockerfile.native` (base UBI9, con el motivo
  escrito en el propio fichero).
- Estado del soporte nativo por capacidad, incluido el SFTP del money-path:
  `ops/fase-7-deploy/dist/NATIVE-STATUS.md`.
- Procedimiento de entrega sin rebuild: `ops/fase-7-deploy/runbook.md` y `dist/README.md`.
