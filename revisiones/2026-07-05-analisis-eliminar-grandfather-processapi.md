# Análisis — eliminar el grandfather de fronteras (schedules→ProcessApiService) sin dejar camino legacy

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Contexto: el guard de fronteras (v60) dejó **una** excepción `eslint-disable` — la arista `schedules → ProcessApiService`
de `features/processes`. La directiva permanente es **no dejar caminos legacy**: ese `eslint-disable` **es** una
excepción legacy. Este análisis evalúa cómo eliminarla en la capa correcta.

## Lo que el código real revela (verificado)

1. **`schedules` usa UN solo método**: `SchedulesApiService.execute()` delega en `ProcessApiService.execute(id)` y
   **no usa ningún modelo** de processes. De hecho tipa el resultado como `Observable<unknown>` — ni siquiera consume
   el tipo de respuesta.
   ([schedules-api.service.ts:49-51](../frontend/libs/features/schedules/src/lib/api/schedules-api.service.ts))
2. **`ProcessApiService.execute(id)` es trivial**:
   `POST /api/process-executions/${id}` con cuerpo `{}`, devuelve `ProcessExecutionStartResponse`.
   ([process-api.service.ts:96-98](../frontend/libs/features/processes/src/lib/api/process-api.service.ts))
3. **Mover `ProcessApiService` entero a `core` es INVIABLE** (haría el guard peor): el servicio importa **3 archivos de
   modelos que viven en `features/processes`** (`process.models`, `process-db-write.models`, `process-db-routine.models`
   → `ProcessRecord`, `ConnectionRef`, `DbWrite*Ref`, `DbRoutine*Ref`). Un servicio en `core` que los importe crearía
   un **`core→feature`** — exactamente la dirección que el guard prohíbe. Y esos modelos son dominio de la feature
   processes (usados por sus 8 consumidores internos), no de `core`.
4. **`ProcessExecutionStartResponse` está definido DENTRO de `process-api.service.ts`** (feature), no en un modelo
   compartido. Un servicio en `core` que lo retorne necesitaría el DTO en `core`.
5. **La operación está DUPLICADA en otra feature**: `features/executions` tiene su propio
   `ExecutionApiService.execute(id, request)` que también hace `POST /api/process-executions/${id}` (con cuerpo
   `request` y respuesta `ExecuteProcessResponse`).
   ([execution-api.service.ts:64](../frontend/libs/features/executions/src/lib/api/execution-api.service.ts))
   → "disparar una ejecución de proceso por id" es un **data-access transversal** que hoy vive replicado en
   `features/processes` y `features/executions`, y que `features/schedules` además necesita. Es el smell de fondo.

## Diseño propuesto (bounded, SOLID) — extracción a `core/services`

La resolución DIP-correcta: la operación de data-access compartida vive en la **capa baja** (`core/services`), y las
features dependen de ella (no entre sí).

1. **Nuevo `ProcessExecutionApiService` en `libs/core/services/src/lib/managers/`** (`@Injectable providedIn:'root'`):
   - `execute(processDefinitionId): Observable<ProcessExecutionStartResponse>` → el `POST /api/process-executions/${id}`
     con `{}`.
   - **Mover el DTO `ProcessExecutionStartResponse` a `core`** (data-access es dueño de su contrato). Al ser un DTO
     pequeño y hoy definido en el propio archivo del servicio, se mueve sin arrastrar modelos de dominio.
   - Exportar desde el barrel `@integration-hub/core/services`.
2. **`schedules`**: inyecta `ProcessExecutionApiService` desde `@integration-hub/core/services` (feature→core:
   **permitido**). Se elimina el import a `@integration-hub/features/processes` **y el `eslint-disable`**.
3. **`features/processes`**: `ProcessApiService.execute` **delega** en el servicio de core (constructor injection) y
   **re-exporta** el tipo `ProcessExecutionStartResponse` desde su barrel para no romper a sus 8 consumidores internos.
   Así se elimina también la duplicación del endpoint **dentro** de processes, sin cambiar su API pública.

### Alcance / lo que queda fuera (para no inflar)
- **`features/executions` NO se toca en este paso.** Su `execute(id, request)` tiene **firma distinta** (envía un
  `request` con parámetros y devuelve `ExecuteProcessResponse`) — es "ejecutar con parámetros", no "arrancar con cuerpo
  vacío". Aunque comparten URL, unificar ambos es un rediseño de contrato aparte. Se **flaggea** como limpieza
  relacionada agendable, no se bundlea aquí (el objetivo es eliminar el grandfather, no reunificar toda la superficie
  de ejecución).

### SOLID
- **DIP**: la operación compartida baja a `core` (capa estable); las features dependen de la abstracción, no una de
  otra. Es literalmente invertir la dependencia `schedules→processes`.
- **SRP**: `ProcessExecutionApiService` tiene una única responsabilidad (disparar ejecuciones vía HTTP); `ProcessApiService`
  deja de ser el dueño accidental de esa operación transversal.
- **OCP**: futuros consumidores (executions, otros) extienden reutilizando el servicio de core sin tocar features.

## Validación / pruebas (plan)

- **Guard de fronteras**: `npm run lint:boundaries` → verde **sin ningún `eslint-disable`** (grandfather eliminado);
  prueba negativa de que sigue atrapando violaciones.
- **Unit (Angular/Jest)**: `ProcessExecutionApiService` — un test con `HttpTestingController` que verifica
  `POST /api/process-executions/{id}` con cuerpo `{}`. `SchedulesApiService.execute` — verifica que delega en el nuevo
  servicio (ya existe `schedules.store.spec.ts` que ejercita `execute`). `ProcessApiService.execute` — sigue verde con
  la delegación (specs existentes de processes lo cubren).
- **Build**: `nx build web` para confirmar que el re-export del tipo mantiene compilando a los 8 consumidores de
  processes + executions.
- **Nota de arranque**: como el ciclo anterior, es cambio de **frontend** sin runtime backend; la validación real es
  lint:boundaries + unit + build, no el stack en localhost:8080.

## Veredicto (PRELIMINAR — corregido por el doble-check, ver abajo)

El diseño de extracción a core es viable, pero el doble-check encontró que **está sobre-diseñado** para el objetivo real
(eliminar el grandfather). Ver la sección siguiente para el veredicto corregido.

---

## Doble-check — corrección del análisis (self-review)

Al desafiar mi propia recomendación (opción A: extracción a `core/services`) contra el código real, encontré **dos
errores** en el análisis y un cambio de recomendación:

### Errores corregidos
1. **"Re-exportar el DTO para no romper 8 consumidores" era falso.** `grep` de `ProcessExecutionStartResponse` en todo
   el repo → aparece **solo dentro de `process-api.service.ts`** (definición + uso en `execute`). **Nadie lo importa.**
   Los consumidores de `execute()` (p.ej. `process-catalog-command` que lee `execution.id`/`.status`) lo obtienen por
   **inferencia de tipo**, no importando el nombre. → No hay nada que re-exportar; y "mover el DTO a core" sería **churn
   puro** de un tipo interno de processes.
2. **La premisa "una operación transversal" es endeble.** Los 3 call-sites del endpoint `/api/process-executions/{id}`
   **difieren de verdad**:
   - processes: cuerpo `{}` → `ProcessExecutionStartResponse` (`{id, status}`),
   - executions: cuerpo `request: ExecuteProcessRequest` → `ExecuteProcessResponse` (firma distinta, verificada),
   - schedules: cuerpo `{}` → **`unknown`** (`schedules.store` solo hace `await` + feedback; **no lee ningún campo** de
     la respuesta — verificado en `schedules.store.ts:110`).
   No son "la misma operación duplicada": son **tres clientes distintos** de un mismo endpoint REST. Centralizarlos en
   un único servicio de core con una firma es **incómodo** justamente porque difieren — lo que debilita la
   justificación DIP de la opción A. Y la opción A dejaba `executions` igual → **solo resolvía la duplicación a medias**.

### Recomendación corregida → **opción B (mínima), no A**

**`schedules` hace su propio `POST` directo**, igual que ya hace su `GET` crudo para `list()`:

```ts
execute(processDefinitionId: number): Observable<unknown> {
  return this.http.post('/api/process-executions/' + processDefinitionId, {});
}
```

- Elimina el import a `@integration-hub/features/processes` **y el `eslint-disable`** → guard verde **sin excepciones**
  (cumple "no dejar caminos legacy").
- **Cero archivos nuevos, cero cambios en `processes`**, y `unknown` no pierde información (confirmado: nadie lee la
  respuesta en schedules).
- **Consistente con la convención existente**: `schedules-api` ya posee HTTP crudo (`/api/query/process-schedules`);
  `processes` y `executions` ya hardcodean el endpoint de ejecución cada uno. B no introduce un patrón nuevo ni una
  dependencia mala (SRP: schedules-api es dueño de sus llamadas HTTP; sin acoplamiento entre features).
- **Único knock**: el string del endpoint queda en 3 lugares. Pero ya estaba en 2, y los cuerpos/respuestas difieren →
  no es "lo mismo triplicado". Bajo riesgo, bounded.

### Validación de la opción B (plan)
- `npm run lint:boundaries` → verde **sin `eslint-disable`** (grandfather eliminado); prueba negativa intacta.
- `nx build web` → compila (schedules ya devolvía `unknown`; sin cambios de tipo en consumidores).
- Caveat honesto: los specs de libs (`*.spec.ts`) no corren con `nx test web` (mismo gap que `nx lint web`); para un
  passthrough HTTP de una línea, un unit test aporta poco — la señal real es lint:boundaries + build.

### Cuándo valdría la opción A
Solo si se quiere **de-duplicar de verdad** el disparo de ejecución across `processes`+`executions`+`schedules` en un
único data-access de core — un refactor mayor y **awkward** por las firmas distintas (cuerpo opcional + dos tipos de
respuesta). No es necesario para cerrar el grandfather. Se deja como posible tarea aparte (fusionar la superficie de
"ejecutar proceso"), no recomendada ahora.

## Veredicto (corregido)

Eliminar el grandfather es **bounded y correcto con la opción B** (schedules hace su `POST` directo): quita la única
excepción del guard con **una línea**, cero superficie nueva, sin acoplamiento entre features y consistente con la
convención del repo. La opción A (extracción a core) estaba **sobre-diseñada** — reposaba en un supuesto falso
(re-export del DTO) y una premisa endeble (operación transversal), y solo resolvía la duplicación a medias.
**Recomiendo proceder con la opción B.**
