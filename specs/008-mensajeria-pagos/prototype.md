# Prototipo — Mensajeria de pagos SWIFT MT101

> **ESTE DOCUMENTO DESCRIBE UNA CONSOLA YA CONSTRUIDA, NO UN PROTOTIPO PREVIO.** Leelo antes de
> usarlo como referencia de proceso.
>
> La metodologia situa el prototipo ANTES de construir, para validar la experiencia barata. En 008
> no ocurrio asi: el historial de git muestra que `spec-funcional.md` y los primeros componentes
> Angular de la consola aterrizaron **el mismo dia** (2026-06-08, commits `b4bb992f` y `dbfcd9de`),
> y no hubo prototipo HTML5 intermedio.
>
> Se documenta la anatomia REAL porque un prototipo escrito hoy, a toro pasado, describiria algo que
> ya no puede validar nada — y ademas mentiria sobre como se hizo. Lo que sigue sirve para lo que si
> sirve: entender la estructura de la consola, mantenerla coherente y tener contra que contrastar el
> proximo cambio.

## Objetivo

Operar el camino del dinero MT101: construir, validar, archivar y despachar mensajes de pago, y —
sobre todo — **resolver los estados en los que un pago quedo sin cerrar**. La consola no es un CRUD:
su razon de ser son los caminos de excepcion, porque el camino feliz no necesita pantalla.

## Ubicacion real

- Libreria: `frontend/libs/features/swift-mt101/`
- Ruta del shell: `/swift-mt101` (declarada en `frontend/apps/web/src/app/core/platform-plugin.manifest.ts`)
- Carga **lazy**, como el resto de features: nada de este dominio entra al bundle inicial.

## Anatomia: cinco componentes de consola

| Componente | Que resuelve | Requisito |
|---|---|---|
| `mt101-pay-dispatch` | Los intentos de despacho y su conciliacion contra el ledger `mt101_pay_dispatch_intent` | `RF-004` |
| `mt101-pay-conflicts` | Los conflictos de pago y su cierre con maker-checker (quien solicita no aprueba) | `RF-024` |
| `mt101-quarantine` | Las filas que no pasaron validacion, y su reproceso quirurgico por fila | `RF-022` |
| `mt101-fragment-lookup` | Buscar un fragmento y su linaje hasta la fila de origen | `RF-022` |
| `mt101-bulk-correction-wizard` | Correccion masiva con planilla: preview, coercion y apply | `RF-022` |

Ademas, **siete formularios de tarea** (`process-task-forms/`) que se montan dentro del disenador de
procesos del motor: archive, build, parse, parse-from-table, inbound-deliver, field-mapping-board y
los demas del vertical. No son pantallas propias: extienden el editor de procesos de la spec 003.

## Sistema visual

Comparte marca, tokens, tipografia, botones, estados, modales y toasts con el resto del producto —
es la misma consola, no un producto aparte. Lo que diferencia estructuralmente a esta feature no es
el color:

- **Densidad de tabla alta con acciones por fila.** El operador trabaja sobre listas de fragmentos y
  necesita actuar sin abandonar el contexto; de ahi el motivo de rechazo inline por fila.
- **Estado como forma, no solo como texto.** `UNCERTAIN`, `NEEDS_RECONCILIATION` y `pay_conflict` no
  son "errores": son estados con procedimiento propio, y la UI los distingue de un `FAILED`.
- **Confirmacion explicita antes de cualquier accion que mueva dinero.** Es la unica feature del
  producto donde un clic puede provocar un pago.
- **Flujo de dos personas** en el acknowledge de conflictos: la UI refleja la segregacion de
  funciones, no solo la impone el backend.

## Lo que este documento NO es

No es un artefacto de validacion de experiencia. Si en el futuro se rehace la consola o se abre una
pantalla nueva del vertical, el prototipo **si** debe preceder a la construccion: el valor de la Fase
2 esta en descubrir el problema de UX cuando cuesta barato cambiarlo, y eso ya no se puede recuperar
para lo construido.

## Enlaces

- Validacion (y por que no la hubo): [prototype-validation.md](prototype-validation.md)
- Requisitos: [spec-funcional.md](spec-funcional.md)
- Operacion de los estados que esta consola resuelve: [`ops/runbooks/008-mensajeria-pagos-runbook.md`](../../ops/runbooks/008-mensajeria-pagos-runbook.md)
