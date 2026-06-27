# Revisión del análisis app_htoh(50) → v50-fix — hash en streaming + runbook release-gate de V69

Fecha: 2026-06-26
Alcance: el análisis confirma cerrados los dos hardenings criptográficos de v49 (canonicalización inyectiva V3 +
validación de versión/conteo/hash) y plantea dos pendientes (escalabilidad del hash + formalización operativa del
preflight V69) más una consideración de despliegue V2→V3. Directiva: sin código fallback.

## Verdicto contra el código real

| Hallazgo del análisis | Verdicto | Acción |
|---|---|---|
| **Hash acumula todo en memoria**: `computePayPlanSet` construía un `StringBuilder` con TODO el canónico antes del SHA-256 → memoria O(conjunto), problemática con cientos de miles / millones de `pay_fragment`. | **REAL** (escalabilidad) | **CORREGIDO** → cálculo en streaming, memoria O(fila), V3 byte-idéntico |
| **No hay preflight operativo separado para V69** (el analista no lo halló; corría sin Maven/paquete completo). | **PARCIAL**: el script `ops/sql/mt101-corrective-v69-preflight.sql` ya existía (v49). Faltaba el **runbook release-gate** que lo formalice. | **AÑADIDO** → runbook 008 |
| **V2→V3 / runs EXECUTING**: un run ya EXECUTING bajo un algoritmo anterior no debe auto-invalidarse durante el despliegue. | **REAL** (operativo, no de código) | El código NO toca runs EXECUTING (la validación de versión solo corre en REQUESTED→EXECUTING). Documentado en el runbook como gate de drenado. |
| ¿Preflight obligatorio aunque no haya producción aún? | Aclaración | Documentado: no necesario en base nueva/vacía (pero debe dar 0); obligatorio en ambientes poblados, restauraciones y upgrade futuro. |

## Corrección de código (sin rutas legacy)

### Hash en streaming — V3 byte-idéntico
Nuevo helper privado `digestPayPlanSet(ResultSet)`: itera fila a fila, construye SOLO la fila actual con el MISMO
encoder canónico (`appendPayPlanSetRow`) y alimenta sus bytes UTF-8 al `MessageDigest` (`update`), cerrando con
`digest()`. La memoria queda acotada a **una fila**, no al conjunto completo.

- `computePayPlanSet` (ledger) y `computePayPlanSetFromPlanRevision` (revisión inmutable) ahora delegan en
  `digestPayPlanSet`.
- **El algoritmo V3 NO cambia**: los bytes alimentados son exactamente la misma secuencia (concatenación de filas
  canónicas) que producía el cálculo monolítico anterior, por lo que el hash es idéntico. Sin bump de versión.
- Se extrajo `newSha256()` (factory de `MessageDigest`) y se **eliminó** el método `sha256Hex` (quedó sin llamadores
  tras el refactor) → sin código muerto/legacy.

### Preflight V69 — runbook release-gate
`ops/runbooks/008-mt101-corrective-v69-preflight-runbook.md`: formaliza el gate (ejecutar preflight → si hay hallazgos
detener → resolver con evidencia → aplicar V69 → validar FKs), la tabla de obligatoriedad por escenario, y la
consideración V2→V3 (sin PAY EXECUTING en vuelo o resolverlos por STATUS/RECONCILE antes de promover). Referencia el
script `ops/sql/mt101-corrective-v69-preflight.sql` (solo lectura) ya existente.

## Pruebas (todas en verde)

- `Mt101PayPlanSetCanonicalTest` — **6** (+1): `streamingPerRowDigestEqualsTheMonolithicCanonicalDigest` evidencia la
  invariante en la que se apoya el refactor: digerir las filas por partes produce EXACTAMENTE el mismo hash que
  SHA-256 del canónico completo concatenado (incluye una fila con `null`, otra con `|` y `\n`). Más los 5 de
  inyectividad/participación de v49.
- `Mt101CorrectiveLifecycleServiceTest` — **62**: regression del hash consistente entre las tres vistas (run aprobado,
  revisión ACTIVE, ledger vivo) con el cálculo en streaming. Si el streaming alterara los bytes, las comparaciones
  `approved == active == current` fallarían.
- `Mt101PayFragmentReprocessTest` — **35**.
- **Suite Mt101 completa: 287 tests, 0 fallos** (BUILD SUCCESS), incluyendo los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT`, `Mt101MillionFileProcessE2EIT`, `Mt101OutboundEndToEndIT`), que aprueban y despachan
  recomputando el hash en streaming.

## Conclusión

Cerrado el hardening de escalabilidad: el hash del conjunto se calcula en **streaming** (memoria O(fila)), idéntico
byte a byte a V3, sin tocar la garantía maker-checker. El preflight de V69 queda **formalizado** como release-gate
operativo (runbook 008 + script), con la política de obligatoriedad por escenario y el drenado de PAY EXECUTING antes
de promover. No quedan P0 ni brechas de disponibilidad sobre "plan aprobado = plan ejecutado"; los pendientes restantes
son puramente de **operación de despliegue**, ya documentados.
