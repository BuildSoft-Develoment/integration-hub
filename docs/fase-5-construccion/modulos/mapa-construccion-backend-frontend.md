# Mapa de construccion backend y frontend

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Construccion](../05.00-estructura-construccion-actual.md)
- Siguiente: [Verificacion tecnica y trazabilidad](../verificacion/verificacion-tecnica-y-trazabilidad.md)
<!-- nav-guided:end -->

## Objetivo

Ubicar donde se construyen realmente las capacidades del producto dentro del repositorio: en que
modulo cae cada cambio y por que.

## Backend: siete modulos Maven, un solo deployable

Es un **monolito modular** (ADR-021): los modulos existen para poner fronteras de codigo y de
propiedad, no para desplegar por separado. Todo se empaqueta en el mismo binario.

| Modulo | Que vive aqui | Cuando tocarlo |
|---|---|---|
| `platform-app/` | El motor: API REST, seguridad OIDC, scheduler, persistencia, orquestacion de procesos, y el arranque Quarkus con Quinoa | Cambios del motor que NO son de un vertical concreto |
| `platform-spi/` | El contrato de extension: `TaskProvider`, `ReaderProvider`, `SourceProvider` y compañia | Al anadir o cambiar un punto de extension. Un cambio aqui afecta a TODOS los verticales |
| `platform-contract/` | Tipos compartidos del contrato publico | Solo si cambia el contrato entre motor y consumidores |
| `vertical-swift-mt101/` | El vertical SWIFT MT101, incluido su **money-path** y su propio DDL en `db/migration-mt101` | Todo lo especifico de MT101. No mezclar con el motor |
| `vertical-iso20022/` | El vertical ISO 20022 (PAIN.001). **Andamiaje**: existe la estructura, el contenido esta por construir | Trabajo de PAIN.001. Es una vertical **distinta** de MT101: no reutilizar sus reglas por parecido |
| `audit-consumer/` | Consumidor de los eventos de auditoria publicados al broker | Cambios del lado consumidor de la auditoria asincrona |
| `ejemplos/backend-plugin-sidecar/` | Ejemplo ejecutable de plugin backend fuera de proceso (ADR-014) | Al cambiar el contrato gRPC de plugins; sirve de prueba viva |

**Cada modulo es dueno de su DDL** (ADR-023): `platform-app` versiona `db/migration` y el vertical
MT101 versiona `db/migration-mt101`. Flyway las mezcla por numero de version sobre UN solo
`flyway_schema_history`.

> Una migracion ya publicada es INMUTABLE. Editarla -aunque sea un comentario- cambia su checksum
> CRC32 y deja sin arrancar toda instalacion que ya la aplico. Lo vigila
> `npm run check:migration-immutability` contra `ci/migrations.lock`.

## Frontend: workspace Nx/Angular

| Ruta | Que vive aqui |
|---|---|
| `frontend/apps/web/` | La consola: el shell que monta las rutas |
| `frontend/apps/web-e2e/` | Pruebas end-to-end de la consola |
| `frontend/apps/sample-plugin/` | Plugin de frontend de ejemplo, remoto de Module Federation |
| `frontend/libs/core/` | Nucleo transversal de la app |
| `frontend/libs/features/` | Una libreria por dominio funcional |
| `frontend/libs/shared/` | Componentes y utilidades compartidas entre features |
| `frontend/libs/plugin-ui-kit/` | Kit que consumen los plugins de UI externos |

**Todo lo de features va cargado en lazy**: nada de dominio entra al bundle inicial. Si un servicio
`root` necesita providers de un componente, se baja el servicio, no se sube el registro.

## Calidad y operacion

- `qa/` — plan, casos, defectos y evidencias
- `ops/` — runbooks, rollback, operacion, metricas y los artefactos de despliegue
- `ci/` — validadores de gobernanza y `migrations.lock`
- `releases/` — snapshots y notas de version

## Regla practica

Cuando una feature toca mas de una capa, `specs/<feature>/` es la referencia comun que coordina
backend, frontend, QA y operaciones.

Para la estructura de directorios completa y al detalle, la fuente unica es
[90.06 estructura del repositorio real](../../transversal/90.06-estructura-repositorio-real.md);
esta pagina describe DONDE se construye cada cosa, no repite el arbol.
