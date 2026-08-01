# API Contract - Mensajeria de pagos (MT101)

> Contrato reconstruido por reingenieria desde los `*Resource` del modulo `vertical-swift-mt101`.
> Se ensambla en `contracts/api/openapi.yaml` con `npm run generate:openapi`.
>
> **Esta spec era la UNICA sin api-contract.md.** El vertical que mueve el dinero exponia 45
> endpoints sin contrato, y por eso `check:api-vs-code` reportaba que el backend servia 123
> endpoints y el contrato cubria 46. Varios de los de abajo no consultan: **despachan pagos al
> banco o autorizan que se despachen**. Estan marcados en su descripcion.

## Endpoints

### PATCH /api/query/mt101-quarantine/staging-row
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Corrige el payload de una fila de pago en staging aplicando un JSON Merge Patch, con locking optimista obligatorio via If-Match (409 si otro operador la movio o si un rebuild APPROVED/BUILDING la congelo); exige reason/ticketRef y toma el actor del token OIDC para la auditoria.

### GET /api/query/mt101-quarantine/staging-row
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Devuelve el payload actual de una fila en cuarentena identificada por stagingId/recordNumber y su version como ETag, que hay que reenviar en If-Match al corregir.

### GET /api/query/mt101-quarantine/lote
**Trace**: `RF-015` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Cabecera del lote MT101 (fragmentSetId, processExecutionId, archivo origen, hash y conteos de fragmentos por estado) resuelta por fragmentSetId o por processExecutionId; es la entrada de la traza lote -> fila fallida -> accion.

### POST /api/query/mt101-quarantine/build
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Encola en cuarentena las filas fallidas de un fragment set leyendo paginadamente la tabla de issues de validacion y resolviendo cada :21: a su fila exacta de origen (sourceFileHash + sourceRecordNumber + stagingId); devuelve cuantas filas quedaron en cuarentena.

### GET /api/query/mt101-quarantine
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Lista paginada por afterId de las filas de pago en cuarentena de un set, con su identidad de origen (archivo, numero de registro, stagingId), regla que fallo, severidad y referencias :20:/:21:; antes de listar sincroniza el ciclo de vida de los rebuild runs.

### GET /api/query/mt101-quarantine/summary-by-rule
**Trace**: `RF-002` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Agrupa la cuarentena por causa (ruleCode, ruleSet, severidad) con conteo y rango de numeros de registro afectados, para convertir miles de fallos de validacion en un punado de decisiones del operador.

### GET /api/query/mt101-quarantine/correction-sheet
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Descarga en XLSX (streaming, Content-Disposition attachment) la planilla de correccion de las filas en cuarentena de un set, opcionalmente filtrada por ruleCode y estado; solo lectura, valida el set antes de abrir el stream.

### POST /api/query/mt101-quarantine/correction-sheet/preview
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Dry-run del import de la planilla XLSX de correccion: clasifica cada fila en a corregir, sin cambios o en conflicto, lista las columnas editables y devuelve una muestra con los campos que cambiarian, sin mutar nada.

### POST /api/query/mt101-quarantine/correction-sheet/apply
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Aplica masivamente la planilla XLSX y muta el payload de las filas de pago marcadas como a corregir reusando el camino money-safe de la correccion unitaria (re-valida REJECTED, lock y version, y audita fila por fila); reason es obligatorio y el actor sale del token OIDC.

### POST /api/query/mt101-quarantine/rebuild-runs/request
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · El maker solicita un rebuild correctivo de las filas en cuarentena de un set; falla si no hay filas QUARANTINED y el correctiveSetId lo genera el servidor (<original>-FIX-<referenceCode>), nunca el cliente, para que un build correctivo no pise un set existente.

### POST /api/query/mt101-quarantine/rebuild-runs/request-child
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Solicita un correctivo hijo a partir de un rebuild run padre cuyo correctivo fue rechazado, encadenando el reproceso sin volver a leer el archivo origen.

### GET /api/query/mt101-quarantine/rebuild-runs
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Lista los ultimos rebuild runs correctivos de un set con su estado del ciclo maker-checker (REQUESTED/APPROVED/BUILT/VALIDATED/ARCHIVED/SENT/FAILED), solicitante y aprobador.

### GET /api/query/mt101-quarantine/rebuild-runs/detail
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Detalle de un rebuild run correctivo por rebuildRunId: set original, correctiveSetId, estado, conteos y metadatos de solicitud/aprobacion.

### POST /api/query/mt101-quarantine/rebuild-runs/approve
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin · El checker aprueba un rebuild run correctivo con segregacion de funciones dura: rechaza la aprobacion si el aprobador es el mismo que lo solicito; la aprobacion congela las filas seleccionadas. Idempotente si ya estaba APPROVED.

### POST /api/query/mt101-quarantine/rebuild-runs/execute
**Trace**: `RF-022` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Ejecuta el rebuild aprobado disparando MT101_BUILD_FROM_TABLE sobre el set correctivo; exige estado APPROVED y, si alguna fila seleccionada cambio en staging despues de aprobar, revoca la aprobacion (vuelve a REQUESTED) y no construye con datos no aprobados.

### POST /api/query/mt101-quarantine/rebuild-runs/advance-corrective
**Trace**: `RF-003` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Avanza el correctivo BUILT -> VALIDATED -> ARCHIVED encadenando MT101_REPAIR (opcional), MT101_VALIDATE, MT101_ROUTE y MT101_ARCHIVE de forma reanudable; no envia nada al banco y, si VALIDATE rechaza, marca el run FAILED y no archiva.

### POST /api/query/mt101-quarantine/rebuild-runs/request-pay
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · El maker solicita el envio al banco (PAY) del correctivo ya ARCHIVED; el backend exige motivo y ticketRef de negocio y el estado ARCHIVED, dejando la solicitud como evidencia durable del maker-checker sobre un pago real.

### POST /api/query/mt101-quarantine/rebuild-runs/approve-pay
**Trace**: `RF-004` · **Auth**: platform-admin, integration-admin · El checker (distinto del maker) aprueba y EJECUTA el envio del correctivo: dispara el despacho SWIFT real al banco y deja el run en SENT. Es el endpoint que mueve dinero.

### POST /api/query/mt101-quarantine/rebuild-runs/resolve-uncertain-pay
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Resuelve un correctivo en PAY_UNCERTAIN consultando MT101_STATUS al gateway; nunca reenvia el pago, solo transiciona el estado, y exige motivo de negocio que queda junto al detalle tecnico en la evidencia de resolucion.

### POST /api/query/mt101-quarantine/rebuild-runs/resolve-uncertain-normal-pay
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Resuelve el estado durable UNCERTAIN/DISPATCHING del PAY normal (no correctivo) de un fragment set consultando MT101_STATUS al gateway: transiciona a SENT o REJECTED segun lo que responda el banco y deja pendiente lo que siga sin confirmar; no reenvia MT101_PAY.

### POST /api/query/mt101-quarantine/process-executions/close-reconciled
**Trace**: `RF-006` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Cierra una ejecucion marcada NEEDS_RECONCILIATION tras conciliar sus fragmentos: solo cierra si TODOS estan en un terminal de despacho y rechaza si queda alguno ARCHIVED/UNCERTAIN/DISPATCHING; no reenvia ni re-ejecuta pagos.

### GET /api/query/mt101-quarantine/rebuild-runs/pay-actions
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Historial append-only de todas las acciones PAY de un rebuild run (solicitud, aprobacion, envio, resoluciones de incertidumbre) con actor, motivo y ticket: la evidencia de quien autorizo el movimiento de dinero.

### GET /api/query/mt101-fragments/summary
**Trace**: `RF-022` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Resumen de un set de fragmentos: total, conteo por estado y numero de fragmentos marcados pay_conflict, para el panel de cuarentena.

### GET /api/query/mt101-fragments/by-physical-line
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Busqueda inversa archivo+linea fisica: devuelve un lineage por ejecucion (reprocesos visibles) enriquecido con la cuarentena (regla, motivo, :20:/:21:), asi una linea que el banco cita se resuelve a registro aunque no llegara a tener fragmento.

### GET /api/query/mt101-fragments/by-sheet-row
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Espejo Excel de by-physical-line: archivo+hoja+fila resuelve a los registros de cada ejecucion con su detalle de cuarentena.

### GET /api/query/mt101-fragments/pay-conflicts
**Trace**: `RF-006` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Fragmentos del set en conflicto de pago (contradiccion entre el terminal que dejo el worker PAY y el que confirmo STATUS) con motivo y estado real, para conciliar.

### GET /api/query/mt101-fragments/pay-conflicts/open
**Trace**: `RF-006` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Inbox transversal paginado por cursor de los conflictos de pago ABIERTOS de todos los sets y ejecuciones, mas recientes primero, con fragmentSetId y processExecutionId para saltar a la vista por set; cursor malformado da 400.

### GET /api/query/mt101-fragments/pay-conflicts/confirmations
**Trace**: `RF-005` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Confirmaciones del banco (gatewayReference y ultimo STATUS confirmado) de un :20: dentro de una ejecucion concreta: la evidencia de por que el pago quedo en conflicto; processExecutionId es obligatorio porque la referencia SWIFT se repite entre corridas.

### POST /api/query/mt101-fragments/pay-conflicts/acknowledge
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, payments-operator · Reconocimiento single-actor de un conflicto de pago: limpia el flag pay_conflict y emite la trama append-only PAY_CONFLICT_RESOLVED sin tocar el terminal real del pago; idempotente, exige reason y ticketRef en el cuerpo JSON (no en la URL) y excluye a auditor por ser escritura sobre el camino del dinero.

### GET /api/query/mt101-fragments/pay-conflicts/settings
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Devuelve si el maker-checker de reconocimiento esta activo, para que la UI ofrezca el flujo de dos pasos o el boton single-actor y no llame al endpoint equivocado.

### POST /api/query/mt101-fragments/pay-conflicts/request-acknowledge
**Trace**: `RF-024` · **Auth**: pay-conflict-maker (Mt101Roles.PAY_CONFLICT_MAKER) · Paso 1 del four-eyes bancario: el MAKER solicita reconocer el conflicto con reason y ticketRef pero NO apaga la alerta; la segregacion de funciones es por ROL dedicado, distinto del checker, y platform-admin no queda implicitamente autorizado (hay que asignarle el rol maker). Solo con maker-checker habilitado; si no, 400 indicando usar el acknowledge single-actor. Devuelve 204.

### POST /api/query/mt101-fragments/pay-conflicts/approve-acknowledge
**Trace**: `RF-024` · **Auth**: pay-conflict-checker (Mt101Roles.PAY_CONFLICT_CHECKER) · Paso 2 del four-eyes bancario: el CHECKER aprueba la solicitud PENDING, limpia pay_conflict y emite PAY_CONFLICT_RESOLVED con ambos actores. Doble barrera de segregacion: rol pay-conflict-checker (distinto del maker) mas identidad (400 si checker == maker o si no hay solicitud PENDING); el approver sale del token OIDC, no del cuerpo, y platform-admin no esta autorizado implicitamente.

### GET /api/query/mt101-fragments/row-timeline
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Linea de tiempo operacional (hitos) de una fila reconstruida en caliente desde staging, fragmento y cuarentena, independiente del store frio asincrono; exige recordNumber y stagingId, la identidad estricta de fila.

### POST /api/query/mt101-fragments/reprocess/status
**Trace**: `RF-022` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Transiciona en bloque los fragmentos de un set de fromStatus a toStatus (p.ej. REJECTED a BUILT para revalidar tras corregir reglas) y devuelve cuantos se afectaron; escritura gobernada con actor, reason y ticketRef, sin el rol auditor.

### POST /api/query/mt101-fragments/reprocess/source-rows
**Trace**: `RF-022` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Reproceso quirurgico: lleva a toStatus (BUILT por defecto) solo los fragmentos cuyo rango de filas solapa [recordFrom, recordTo] del archivo identificado por sourceFileHash, y devuelve los fragmentos tocados para que el operador vea exactamente que filas del lote se movieron.

### POST /api/query/mt101-fragments/reprocess/reopen-rejected
**Trace**: `RF-024` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Reabre una fila cuyo rebuild correctivo fue rechazado (REBUILD_REJECTED a QUARANTINED) para corregirla y reconstruirla de nuevo; identidad estricta obligatoria por recordNumber y stagingId, con actor, reason y ticketRef.

### GET /api/query/mt101-pay-dispatch-intents/summary
**Trace**: `RF-004` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Resumen del ledger de intencion de dispatch del PAY directo por lista: total, conteo por estado y cuantas intenciones estan atascadas (UNCERTAIN o DISPATCHING), que son las que bloquean el reenvio del pago.

### GET /api/query/mt101-pay-dispatch-intents/stuck
**Trace**: `RF-004` · **Auth**: platform-admin, integration-admin, operator, payments-operator, auditor · Lista las intenciones de dispatch atascadas (UNCERTAIN o DISPATCHING colgado por un crash), mas antiguas primero: pagos que no se reenvian hasta conciliar y que hasta este endpoint no tenian superficie de lectura.

### POST /api/query/mt101-pay-dispatch-intents/reconcile
**Trace**: `RF-004` · **Auth**: platform-admin, integration-admin, operator, payments-operator · Concilia una intencion atascada por dispatchKey leyendo el terminal ya clasificado en mt101_archive que dejo STATUS, y la transiciona a SENT o REJECTED sin re-consultar el gateway ni re-despachar el pago; sin ejecucion, match o terminal es no-op y queda manual. Exige reason como evidencia y excluye a auditor: es escritura sobre el camino del dinero.

### GET /api/payment-validation-rules
**Trace**: `RF-023` · **Auth**: platform-admin, integration-admin, auditor · Lista paginada del catalogo de reglas de validacion de pagos con filtros por ruleSet, texto libre sobre code/ruleSet, standard, appliesTo y estado activo/inactivo; devuelve PageResponse con total y items ordenados por ruleSet y code.

### GET /api/payment-validation-rules/export
**Trace**: `RF-023` · **Auth**: platform-admin, integration-admin, auditor · Exporta completo (sin paginar) el perfil de reglas de un banco identificado por ruleSet, para portarlo entre ambientes; el ruleSet es obligatorio y su ausencia es error.

### POST /api/payment-validation-rules
**Trace**: `RF-023` · **Auth**: platform-admin, integration-admin · Alta de una regla de validacion que despues aplica MT101_VALIDATE sobre el camino del dinero: valida y normaliza ruleSet, code, standard, appliesTo, severity (E/W/I), predicateKind (uno de los ocho tipos soportados, incluido JEXL) y predicateBody como JSON bien formado.

### PUT /api/payment-validation-rules/{ruleId}
**Trace**: `RF-023` · **Auth**: platform-admin, integration-admin · Reescribe por completo una regla existente (falla si el ruleId no existe) reaplicando las mismas validaciones de severity, predicateKind y predicateBody; cambia el criterio con que se bloquean o dejan pasar pagos, sin bloqueo optimista.

### POST /api/payment-validation-rules/{ruleId}/activation/{active}
**Trace**: `RF-023` · **Auth**: platform-admin, integration-admin · Activa o desactiva una regla via el flag booleano de la ruta: apagar una regla de severidad E deja pasar pagos que antes quedaban retenidos por MT101_VALIDATE.

### POST /api/payment-validation-rules/import
**Trace**: `RF-023` · **Auth**: platform-admin, integration-admin · Importa en bloque un perfil de reglas de banco forzando el ruleSet del request sobre cada item; con replaceExisting=true BORRA antes todas las reglas de ese ruleSet, y responde ruleSet, cantidad importada y si hubo reemplazo.

## Paths OpenAPI

```yaml
paths:
  /api/query/mt101-quarantine/staging-row:
    patch:
      summary: Corrige el payload de una fila de pago en staging aplicando un JSON Merge Patch, con locking optimista obligat
      operationId: mt101QuarantineCorrectRow
      responses:
        '200':
          description: OK
    get:
      summary: Devuelve el payload actual de una fila en cuarentena identificada por stagingId/recordNumber y su version como
      operationId: mt101QuarantineStagingRow
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/lote:
    get:
      summary: Cabecera del lote MT101 (fragmentSetId, processExecutionId, archivo origen, hash y conteos de fragmentos por e
      operationId: mt101QuarantineLote
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/build:
    post:
      summary: Encola en cuarentena las filas fallidas de un fragment set leyendo paginadamente la tabla de issues de validac
      operationId: mt101QuarantineBuild
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine:
    get:
      summary: Lista paginada por afterId de las filas de pago en cuarentena de un set, con su identidad de origen (archivo, 
      operationId: mt101QuarantineList
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/summary-by-rule:
    get:
      summary: Agrupa la cuarentena por causa (ruleCode, ruleSet, severidad) con conteo y rango de numeros de registro afecta
      operationId: mt101QuarantineSummaryByRule
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/correction-sheet:
    get:
      summary: Descarga en XLSX (streaming, Content-Disposition attachment) la planilla de correccion de las filas en cuarent
      operationId: mt101QuarantineCorrectionSheet
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/correction-sheet/preview:
    post:
      summary: Dry-run del import de la planilla XLSX de correccion: clasifica cada fila en a corregir, sin cambios o en conf
      operationId: mt101QuarantinePreviewCorrectionSheet
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/correction-sheet/apply:
    post:
      summary: Aplica masivamente la planilla XLSX y muta el payload de las filas de pago marcadas como a corregir reusando e
      operationId: mt101QuarantineApplyCorrectionSheet
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/request:
    post:
      summary: El maker solicita un rebuild correctivo de las filas en cuarentena de un set
      operationId: mt101RequestRebuildRun
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                connectionRef: {}
                fragmentSetId: {}
                reason: {}
                ticketRef: {}
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/request-child:
    post:
      summary: Solicita un correctivo hijo a partir de un rebuild run padre cuyo correctivo fue rechazado, encadenando el rep
      operationId: mt101RequestChildCorrective
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs:
    get:
      summary: Lista los ultimos rebuild runs correctivos de un set con su estado del ciclo maker-checker (REQUESTED/APPROVED
      operationId: mt101ListRebuildRuns
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/detail:
    get:
      summary: Detalle de un rebuild run correctivo por rebuildRunId: set original, correctiveSetId, estado, conteos y metada
      operationId: mt101RebuildRunDetail
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/approve:
    post:
      summary: El checker aprueba un rebuild run correctivo con segregacion de funciones dura: rechaza la aprobacion si el ap
      operationId: mt101ApproveRebuildRun
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/execute:
    post:
      summary: Ejecuta el rebuild aprobado disparando MT101_BUILD_FROM_TABLE sobre el set correctivo
      operationId: mt101ExecuteRebuildRun
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                connectionRef: {}
                rebuildRunId: {}
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/advance-corrective:
    post:
      summary: Avanza el correctivo BUILT -> VALIDATED -> ARCHIVED encadenando MT101_REPAIR (opcional), MT101_VALIDATE, MT101
      operationId: mt101AdvanceCorrective
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/request-pay:
    post:
      summary: El maker solicita el envio al banco (PAY) del correctivo ya ARCHIVED
      operationId: mt101RequestCorrectivePay
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/approve-pay:
    post:
      summary: El checker (distinto del maker) aprueba y EJECUTA el envio del correctivo: dispara el despacho SWIFT real al b
      operationId: mt101ApproveCorrectivePay
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                connectionRef: {}
                rebuildRunId: {}
                reason: {}
                ticketRef: {}
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/resolve-uncertain-pay:
    post:
      summary: Resuelve un correctivo en PAY_UNCERTAIN consultando MT101_STATUS al gateway
      operationId: mt101ResolveUncertainCorrectivePay
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/resolve-uncertain-normal-pay:
    post:
      summary: Resuelve el estado durable UNCERTAIN/DISPATCHING del PAY normal (no correctivo) de un fragment set consultando
      operationId: mt101ResolveUncertainNormalPay
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/process-executions/close-reconciled:
    post:
      summary: Cierra una ejecucion marcada NEEDS_RECONCILIATION tras conciliar sus fragmentos: solo cierra si TODOS estan en
      operationId: mt101CloseReconciledExecution
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                connectionRef: {}
                processExecutionId: {}
                reason: {}
      responses:
        '200':
          description: OK
  /api/query/mt101-quarantine/rebuild-runs/pay-actions:
    get:
      summary: Historial append-only de todas las acciones PAY de un rebuild run (solicitud, aprobacion, envio, resoluciones 
      operationId: mt101ListCorrectivePayActions
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/summary:
    get:
      summary: Resumen de un set de fragmentos: total, conteo por estado y numero de fragmentos marcados pay_conflict, para e
      operationId: mt101FragmentsSummary
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/by-physical-line:
    get:
      summary: Busqueda inversa archivo+linea fisica: devuelve un lineage por ejecucion (reprocesos visibles) enriquecido con
      operationId: mt101FragmentsByPhysicalLine
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/by-sheet-row:
    get:
      summary: Espejo Excel de by-physical-line: archivo+hoja+fila resuelve a los registros de cada ejecucion con su detalle 
      operationId: mt101FragmentsBySheetRow
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/pay-conflicts:
    get:
      summary: Fragmentos del set en conflicto de pago (contradiccion entre el terminal que dejo el worker PAY y el que confi
      operationId: mt101PayConflicts
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/pay-conflicts/open:
    get:
      summary: Inbox transversal paginado por cursor de los conflictos de pago ABIERTOS de todos los sets y ejecuciones, mas 
      operationId: mt101OpenPayConflicts
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/pay-conflicts/confirmations:
    get:
      summary: Confirmaciones del banco (gatewayReference y ultimo STATUS confirmado) de un :20: dentro de una ejecucion conc
      operationId: mt101PayConflictConfirmations
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/pay-conflicts/acknowledge:
    post:
      summary: Reconocimiento single-actor de un conflicto de pago: limpia el flag pay_conflict y emite la trama append-only 
      operationId: acknowledgeMt101PayConflict
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/pay-conflicts/settings:
    get:
      summary: Devuelve si el maker-checker de reconocimiento esta activo, para que la UI ofrezca el flujo de dos pasos o el 
      operationId: mt101PayConflictSettings
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/pay-conflicts/request-acknowledge:
    post:
      summary: Paso 1 del four-eyes bancario: el MAKER solicita reconocer el conflicto con reason y ticketRef pero NO apaga l
      operationId: requestAcknowledgeMt101PayConflict
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/pay-conflicts/approve-acknowledge:
    post:
      summary: Paso 2 del four-eyes bancario: el CHECKER aprueba la solicitud PENDING, limpia pay_conflict y emite PAY_CONFLI
      operationId: approveAcknowledgeMt101PayConflict
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/row-timeline:
    get:
      summary: Linea de tiempo operacional (hitos) de una fila reconstruida en caliente desde staging, fragmento y cuarentena
      operationId: mt101RowTimeline
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/reprocess/status:
    post:
      summary: Transiciona en bloque los fragmentos de un set de fromStatus a toStatus (p
      operationId: reprocessMt101FragmentsByStatus
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/reprocess/source-rows:
    post:
      summary: Reproceso quirurgico: lleva a toStatus (BUILT por defecto) solo los fragmentos cuyo rango de filas solapa [rec
      operationId: reprocessMt101FragmentsBySourceRows
      responses:
        '200':
          description: OK
  /api/query/mt101-fragments/reprocess/reopen-rejected:
    post:
      summary: Reabre una fila cuyo rebuild correctivo fue rechazado (REBUILD_REJECTED a QUARANTINED) para corregirla y recon
      operationId: reopenRejectedMt101Rebuild
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                connectionRef: {}
                fragmentSetId: {}
                reason: {}
      responses:
        '200':
          description: OK
  /api/query/mt101-pay-dispatch-intents/summary:
    get:
      summary: Resumen del ledger de intencion de dispatch del PAY directo por lista: total, conteo por estado y cuantas inte
      operationId: mt101PayDispatchIntentSummary
      responses:
        '200':
          description: OK
  /api/query/mt101-pay-dispatch-intents/stuck:
    get:
      summary: Lista las intenciones de dispatch atascadas (UNCERTAIN o DISPATCHING colgado por un crash), mas antiguas prime
      operationId: mt101StuckPayDispatchIntents
      responses:
        '200':
          description: OK
  /api/query/mt101-pay-dispatch-intents/reconcile:
    post:
      summary: Concilia una intencion atascada por dispatchKey leyendo el terminal ya clasificado en mt101_archive que dejo S
      operationId: reconcileMt101PayDispatchIntent
      responses:
        '200':
          description: OK
  /api/payment-validation-rules:
    get:
      summary: Lista paginada del catalogo de reglas de validacion de pagos con filtros por ruleSet, texto libre sobre code/r
      operationId: listPaymentValidationRules
      responses:
        '200':
          description: OK
    post:
      summary: Alta de una regla de validacion que despues aplica MT101_VALIDATE sobre el camino del dinero: valida y normali
      operationId: createPaymentValidationRule
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                ruleCode: {}
                ruleSet: {}
                severity: {}
                expression: {}
                active: {}
      responses:
        '200':
          description: OK
  /api/payment-validation-rules/export:
    get:
      summary: Exporta completo (sin paginar) el perfil de reglas de un banco identificado por ruleSet, para portarlo entre a
      operationId: exportPaymentValidationRuleSet
      responses:
        '200':
          description: OK
  /api/payment-validation-rules/{ruleId}:
    put:
      summary: Reescribe por completo una regla existente (falla si el ruleId no existe) reaplicando las mismas validaciones 
      operationId: updatePaymentValidationRule
      responses:
        '200':
          description: OK
  /api/payment-validation-rules/{ruleId}/activation/{active}:
    post:
      summary: Activa o desactiva una regla via el flag booleano de la ruta: apagar una regla de severidad E deja pasar pagos
      operationId: setPaymentValidationRuleActive
      responses:
        '200':
          description: OK
  /api/payment-validation-rules/import:
    post:
      summary: Importa en bloque un perfil de reglas de banco forzando el ruleSet del request sobre cada item
      operationId: importPaymentValidationRules
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                rules: {}
      responses:
        '200':
          description: OK
```
