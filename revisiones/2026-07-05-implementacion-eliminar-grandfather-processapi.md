# Implementación — grandfather de fronteras eliminado (opción B, SOLID)

Fecha: 2026-07-05
Alcance: implementa la **opción B** del
[análisis (corregido por el doble-check)](2026-07-05-analisis-eliminar-grandfather-processapi.md). Elimina la única
excepción `eslint-disable` del guard de fronteras (la arista `schedules → ProcessApiService`), dejando el guard **100%
limpio, sin caminos legacy**. Frontend/tooling; cero runtime backend, cero money-path.

## Por qué la opción B (y no la extracción a core)

El doble-check descartó la opción A (extraer a `core/services`) por sobre-diseñada: reposaba en un supuesto falso (el
DTO `ProcessExecutionStartResponse` no lo importa nadie — es interno a `process-api.service.ts`) y una premisa endeble
(los 3 call-sites del endpoint difieren de verdad, no son "una operación transversal"). La opción B es la SOLID-limpia:
`schedules` es dueño de sus propias llamadas HTTP (como ya lo era para `list()`), sin acoplarse a otra feature.

## Cambio (una sola línea de lógica)

`libs/features/schedules/src/lib/api/schedules-api.service.ts`:
- **Eliminado**: el import `ProcessApiService` desde `@integration-hub/features/processes`, su `eslint-disable`, el
  bloque de comentario de deuda, y el campo `private readonly processApi = inject(ProcessApiService)`.
- **`execute()`** ahora hace el `POST` directo: `this.http.post('/api/process-executions/${id}', {})`. Devuelve
  `Observable<unknown>` (sin cambios de firma): `schedules.store` solo hace `await` + feedback, **no lee ningún campo**
  de la respuesta, así que `unknown` no pierde información.

### SOLID
- **SRP**: `schedules-api` posee toda su superficie HTTP en un solo lugar (list + execute), sin delegar en una feature
  ajena. Cada feature es dueña de sus llamadas.
- **DIP / bajo acoplamiento**: se elimina la dependencia `schedules → features/processes`; no se introduce ninguna
  dependencia mala a cambio. La dirección de dependencias del monorepo queda sin excepciones.
- **YAGNI**: no se crea abstracción de core que hoy no aporta (los 3 clientes del endpoint difieren; centralizar sería
  churn con firmas incómodas).

## Pruebas (evidenciadas)

- **Guard de fronteras 100% limpio**: `npm run lint:boundaries` → **exit 0**. Verificado además que **no queda ningún**
  `eslint-disable.*no-restricted-imports` en `libs` (grep vacío) → el guard ya no tiene excepciones.
- **Sin residuos**: grep de `ProcessApiService|eslint-disable|@integration-hub/features` en `libs/features/schedules` →
  vacío.
- **Build real**: `nx build web --skip-nx-cache` → **Successfully ran target build** (bundle generado en ~9 s). La
  compilación confirma que `Observable<Object>` (retorno de `http.post` sin type param) tipa contra
  `Observable<unknown>` y que ningún consumidor de `schedules.execute` se rompe.

### Nota de arranque
Cambio 100% frontend (una línea HTTP + limpieza de imports); cero runtime backend. La validación real es
lint:boundaries + build, no el stack en localhost:8080 (que no ejercita nada de esto).

## Deuda relacionada (documentada, no bundleada)

El endpoint `POST /api/process-executions/{id}` lo consumen hoy 3 features de forma independiente (processes con `{}`,
executions con `request`, schedules con `{}`), con **firmas/respuestas distintas**. Unificarlas en un único data-access
de `core` es un refactor mayor y *awkward* por esas diferencias — **no necesario** para el guard, agendable aparte.

## Conclusión

El guard de fronteras queda **sin ninguna excepción**: la dirección de dependencias del frontend se impone limpia, sin
caminos legacy. Se logró con la opción mínima y SOLID (schedules dueño de su HTTP), tras el doble-check que descartó la
extracción a core por sobre-diseñada. Validado con lint:boundaries verde (0 grandfathers) + build exitoso.
