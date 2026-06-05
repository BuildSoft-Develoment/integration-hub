# ADR-005 Unificacion de la peticion HTTP (REST_CALL + webhook de NOTIFICATION)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

Aceptado (ruta B). Pendiente de validacion humana en el gate de arquitectura.

> **Progreso**: **implementado (front + back)**. Backend: `HttpRequestSupport`
> (`provider/task/http/`) consolida el armado de la peticion (metodo/headers/auth/body/timeout); lo
> usan `RestCallTaskProvider` y el webhook de `NotificationTaskProvider` (cada uno con su epilogo:
> output vs auditoria + 2xx); `sendWebhook` honra el `method` del config. Frontend: componente
> reusable `process-http-request` (endpoint + tabs Query/Auth/Headers/Body con tokens) sobre
> `HttpRequestDraft` y soporte `http-request-task.support.ts`; lo embeben `process-rest-call-task-form`
> y el canal `webhook` de `process-notification-task-form` (conservando `message`). **Sin fallback**:
> el webhook usa headers/query/auth estructurados y dejo de usar `headersJson` crudo. Pendiente: gate
> humano de contrato + auth.

## Contexto

El motor de procesos tiene dos tareas que ejecutan una **peticion HTTP saliente**:

- **`REST_CALL`** (`RestCallTaskProvider` + form `process-rest-call-task-form`): peticion HTTP
  completa — `method` (GET/POST/PUT/PATCH/DELETE), URL = base + path + query, autenticacion
  (`none`/`basic`/`bearer`/`login-request`), headers/query/path **estructurados** (binding boards
  y path-builder), body con plantilla de tokens (`${...}`/`{...}`), `executionMode` per-record/batch.
  La **respuesta se mapea a output** para que la consuman tareas posteriores.
- **`NOTIFICATION` canal `webhook`** (`NotificationTaskProvider.sendWebhook` + canal del form
  `process-notification-task-form`): **POST fijo** a una `url` con `bodyTemplate` (mismo motor de
  tokens), `headers` **crudos** (`headersJson`) y `timeoutSeconds`. Es **fire-and-forget**
  (valida 2xx) y **audita** `NOTIFICATION_SENT`. No tiene metodo, ni auth, ni headers/query/path
  estructurados.

El webhook es, en la practica, un **subconjunto recortado de `REST_CALL`**. El nucleo
—construir la peticion (metodo + auth + headers + body por plantilla) y enviarla con
`java.net.http.HttpClient`— es **casi identico en front y back**. Lo unico que diverge es la
**semantica del epilogo**: `REST_CALL` captura la respuesta como output; el webhook audita y no
captura respuesta.

Mantener dos implementaciones HTTP en paralelo (front + back) genera:

- **Duplicacion** de la logica de armado de peticion, sustitucion de tokens y manejo de errores.
- **Drift**: el webhook ya quedo atras (sin auth/headers estructurados/params) y, si se le agrega
  paridad copiando REST, habria que mantener dos copias que divergiran.
- **UX inconsistente**: dos formas distintas de configurar "una peticion HTTP".

Esto se cruza con [ADR-004](ADR-004-motor-input-output-tareas.md): ambas son "tareas de salida
HTTP" y, bajo el modelo de I/O tipado, su respuesta deberia exponerse como output tipado.

## Decision

**Extraer la configuracion y ejecucion de una peticion HTTP a una unidad compartida**, reusada
por `REST_CALL` y por el canal `webhook` de `NOTIFICATION`. No se fusionan las tareas: cada una
conserva su semantica de epilogo.

### Frontend
- Nuevo componente reusable `process-http-request` con: `method`, URL (base/path/query), tabs de
  **auth / headers / query / body** (binding boards + path-builder + editor de body con tokens y
  autocomplete ya unificado).
- `process-rest-call-task-form` lo embebe tal cual.
- El **canal webhook** de `process-notification-task-form` embebe el mismo componente (en lugar de
  `url` + `headersJson` crudo + body suelto), conservando el campo `message` y el resto de canales
  (log/email) sin cambios.

### Backend
- Nuevo `HttpRequestSupport` (o builder) que arme la peticion a partir del `configuration_json`:
  metodo, `applyAuthentication` (none/basic/bearer/login-request), headers estructurados,
  query/path, body con sustitucion de tokens (`${...}`/`{...}`), timeout.
- `RestCallTaskProvider` lo usa y **mapea la respuesta a output**.
- `NotificationTaskProvider.sendWebhook` lo usa y conserva su epilogo: **auditar + validar 2xx**
  (fire-and-forget); opcionalmente, exponer un `summary` (status/ok) como output.

### Contrato
- El `configuration_json` del webhook adopta los mismos campos de peticion HTTP que `REST_CALL`
  (`method`, `authType`, `headers` estructurados, `queryParameters`, `pathTemplate`/segmentos,
  `bodyTemplate`). El contrato queda documentado en `spec-tecnica` de la feature de procesos (003)
  y, si se materializa I/O tipado, alineado con ADR-004.
- **Sin fallback** (decision): el webhook adopta headers/query/auth estructurados y **deja de usar
  `headersJson` crudo**; no se mantiene compatibilidad con el formato anterior (no hay webhooks en
  produccion que preservar). Default `method` = `POST` si no se especifica.

## Alternativas consideradas

1. **Copiar la maquinaria de REST dentro del webhook** (front + back). Da paridad pero **duplica**
   dos stacks HTTP que divergiran; rechazada.
2. **Mantener separado**: webhook minimal (POST + body, fire-and-forget) y dirigir el HTTP complejo
   a una tarea `REST_CALL`. Es la opcion mas barata si **no** hay requisito de auth/headers en
   notificaciones webhook; queda como fallback si el negocio no necesita paridad.
3. **Fusionar `REST_CALL` y webhook en un unico tipo de tarea HTTP**. Mayor alcance; se difiere a
   la evolucion del motor (ADR-004) por riesgo y por afectar el contrato de tareas.

## Consecuencias

**A favor**
- Fuente unica de verdad para "peticion HTTP" (front y back); el webhook gana auth/headers/params
  sin duplicar codigo.
- UX consistente entre REST y webhook.
- Base lista para que la respuesta HTTP sea un output tipado (ADR-004).

**En contra / riesgos**
- Refactor que toca `RestCallTaskProvider`, `RestTaskSupport`, `NotificationTaskProvider` y los
  forms REST/NOTIFICATION (el form REST esta en edicion activa) → **debe coordinarse con el WIP**
  para evitar conflictos.
- Requiere **paridad backend real**: agregar auth/headers/params solo en la UI seria cosmetico
  (`sendWebhook` hoy los ignora).
- Sin fallback (decision): un webhook definido con el formato anterior (`headersJson` crudo) dejaria
  de resolver esos headers; aceptable porque no hay webhooks en produccion. Cubrir con pruebas.

## Plan de ejecucion (coordinado con ADR-004 / WIP del motor)

1. Cerrar/estabilizar el WIP del motor (ADR-004) para no editar el form REST en paralelo.
2. **Backend** — *hecho*: `HttpRequestSupport` extraido; `RestCallTaskProvider` y `sendWebhook` lo
   consumen; epilogos distintos (output vs auditoria); `sendWebhook` honra `method` del config;
   compila + `RestTaskSupportTest` verde.
3. **Frontend** — *hecho*: `HttpRequestDraft` + `http-request-task.support.ts` (de/serializacion
   compartida) + componente `process-http-request` (endpoint + tabs Query/Auth/Headers/Body con
   tokens/autocomplete); reusado en `process-rest-call-task-form` y en el canal `webhook` de
   `process-notification-task-form` (preserva `message`/log/email). **Sin fallback** de `headersJson`
   crudo. Verificado: `nx build web` + `nx test web` + `mvn -pl platform-app compile` verdes.
4. **Contrato + trazabilidad**: documentar el `configuration_json` HTTP en `spec-tecnica` de 003;
   actualizar `traceability.md`/`@trace`; migracion Flyway si aplica.
5. **Gate humano**: cambio de contrato + seguridad (auth) + datos → revision y firma humana
   (el agente no auto-aprueba).

## Referencias

- [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md)
- [ADR-003 RBAC endpoint x rol](ADR-003-rbac-endpoint-rol.md)
- `platform-app/.../provider/task/rest/RestCallTaskProvider.java`
- `platform-app/.../provider/task/notification/NotificationTaskProvider.java`
- `frontend/libs/features/processes/.../process-rest-call-task-form`,
  `.../process-notification-task-form`
