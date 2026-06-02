/**
 * scripts/_lib/feature-templates.mjs (v12.88)
 *
 * FUENTE UNICA de las plantillas de artefactos por feature.
 * La consumen:
 *   - scripts/scaffold-feature.mjs  (genera specs/<slug>/ con el slug real)
 *   - scripts/sync-plantillas.mjs   (regenera plantillas/fase-4-sdd/ en blanco)
 *   - ci/scripts/check-plantillas.mjs (verifica que plantillas/fase-4-sdd no driften)
 *
 * Antes los builders vivian inline en scaffold-feature.mjs y plantillas/fase-4-sdd/
 * era una COPIA paralela a mano que ya habia driftado (secciones distintas). Ahora
 * hay una sola fuente: las plantillas se derivan de estos builders con un config
 * placeholder, asi no pueden divergir de lo que scaffold:feature realmente produce.
 */

// Config con placeholders para renderizar las plantillas "en blanco".
export const PLANTILLA_CONFIG = {
  slug: "<nnn-feature>",
  titulo: "<Titulo de la feature>",
  rfs: ["RF-NN"],
  rnfs: ["RNF-NN"],
  hus: ["HU-NN"],
  entidad: "<entidad>",
  endpoints: ["GET /api/<entidad>"],
  primaryRf: "RF-NN",
  primaryHu: "HU-NN",
};

// Archivos de feature que se SINCRONIZAN a plantillas/fase-4-sdd/ (derivados de
// estos builders). README.md y prototype-html5/index.html no entran (el README de
// la carpeta es doc propio; el html es per-feature).
// v12.106: spec-tareas.md tambien se deriva de la fuente unica — antes era plantilla-only
// y un proyecto recien scaffoldado se quedaba sin archivo de tareas, contradiciendo el
// principio "para cada feature: spec-funcional + spec-tecnica + spec-tareas".
export const FASE4_SYNC_FILES = [
  "spec-funcional.md",
  "spec-tecnica.md",
  "spec-tareas.md",
  "tdd-evidence.md",
  "traceability.md",
  "prototype.md",
  "prototype-validation.md",
  "product-design.md",
  "spdd-frontend.md",
  "api-contract.md",
  "ui-test-cases.md",
];

// Banner que encabeza cada plantilla de fase-4-sdd (single source).
export const FASE4_BANNER =
  "> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. " +
  "Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). " +
  "Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.";

export function buildCanonicalFiles(c) {
  return {
    "README.md": readme(c),
    "spec-funcional.md": specFuncional(c),
    "spec-tecnica.md": specTecnica(c),
    "spec-tareas.md": specTareas(c),
    "tdd-evidence.md": tddEvidence(c),
    "traceability.md": traceability(c),
    "prototype.md": prototype(c),
    "prototype-validation.md": prototypeValidation(c),
    "product-design.md": productDesign(c),
    "spdd-frontend.md": spddFrontend(c),
    "api-contract.md": apiContract(c),
    "ui-test-cases.md": uiTestCases(c),
    "prototype-html5/index.html": placeholderProtoHtml(c),
  };
}

// Emite las plantillas fase-4-sdd "en blanco" (con banner) desde la fuente unica.
export function emitFase4Plantillas() {
  const all = buildCanonicalFiles(PLANTILLA_CONFIG);
  const out = {};
  for (const name of FASE4_SYNC_FILES) {
    out[name] = `${FASE4_BANNER}\n\n${all[name]}`;
  }
  return out;
}

export function readme(c) {
  return `# ${c.titulo}

Feature ${c.slug}. Especificacion canonica autogenerada por \`scaffold-feature\` (v12.47).

## Documentos canonicos
- [spec-funcional.md](spec-funcional.md) — origen, objetivo, requerimientos
- [spec-tecnica.md](spec-tecnica.md) — modelo de datos y dependencias
- [traceability.md](traceability.md) — matriz RF → codigo
- [prototype.md](prototype.md) — anatomia del prototipo
- [prototype-validation.md](prototype-validation.md) — registro de validacion
- [product-design.md](product-design.md) — jobs-to-be-done
- [spdd-frontend.md](spdd-frontend.md) — componentes y estados UI
- [api-contract.md](api-contract.md) — endpoints y contratos
- [ui-test-cases.md](ui-test-cases.md) — casos de prueba UI
- [prototype-html5/index.html](prototype-html5/index.html) — prototipo navegable

## Estado
Recien generada via \`scaffold-feature\`. Pendiente:
- Rellenar contenido del dominio en todos los .md (eliminar placeholders \`<...>\`).
- Generar prototipo HTML5 real (copiar golden mas cercano).
- Correr \`npm run check:project\` y resolver hallazgos.
`;
}

export function specFuncional(c) {
  return `# Spec funcional - ${c.titulo}

## Origen
- Backlog item: \`${c.primaryHu} <descripcion corta de la historia de usuario>\`
- Requerimientos relacionados: ${[...c.rfs, ...c.rnfs].map((r) => `\`${r}\``).join(", ")}
- Product Design: \`product-design.md\`
- SPDD aprobado: \`spdd-frontend.md\`, \`prototype-validation.md\`

## Objetivo
<Una frase clara que describa que problema resuelve esta feature para el usuario final.>

## Requerimientos

${c.rfs.map((rf) => `- **${rf}**: <descripcion del comportamiento observable>`).join("\n")}
${c.rnfs.map((rnf) => `- **${rnf}**: <restriccion no funcional, ej. latencia p95 <= Xms o disponibilidad >= 99.9%>`).join("\n")}

## Reglas de negocio

- <Regla 1 — invariante del dominio>
- <Regla 2 — caso borde>
- <Regla 3 — autorizacion/permisos>

## Actores

| Actor | Permisos | Caso de uso principal |
|---|---|---|
| <Rol-A> | <leer/crear/editar/aprobar> | <accion principal> |
| <Rol-B> | <permisos> | <accion> |

## Criterios de aceptacion

- [ ] Dado <precondicion>, cuando <accion>, entonces <resultado>.
- [ ] Dado <precondicion>, cuando <error>, entonces <feedback al usuario>.
- [ ] La auditoria registra correlationId, rol y operacion.

## Fuera de alcance
- <Lo que NO se hace en esta iteracion (mover a backlog futuro).>
`;
}

export function specTecnica(c) {
  return `# Spec tecnica - ${c.titulo}

## Modelo de datos

Tabla \`${c.entidad}\`:

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| <campo_1> | TEXT | <descripcion + restriccion> |
| <campo_2> | TIMESTAMP | NOT NULL, default CURRENT_TIMESTAMP |
| <campo_fk> | UUID | FK -> <tabla_relacionada>.id |
| estado | TEXT | enum: pendiente|activo|inactivo |
| created_at | TIMESTAMP | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, actualizado en cada UPDATE |

Indices: \`(estado, updated_at DESC)\` para listados; \`(<campo_fk>)\` para joins.

Restricciones: PRIMARY KEY (id); UNIQUE (<campo_si_aplica>).

## Dependencias
- BD: <PostgreSQL/MySQL/SQLite>
- Auth: <Keycloak/Cognito/JWT propio>
- Otras tablas: <listar FKs>

## Estimacion de volumen
- Filas estimadas: <miles/millones>
- Crecimiento mensual: <tasa>
- Particion: <none / por mes / por tenant>

## Migraciones
- \`flyway/V001__create_${c.entidad}.sql\` (o equivalente del stack)

## Logging / Auditoria
- Toda mutacion registra: correlationId, actor, operacion, entidad_id, timestamp.
- PII enmascarado en logs segun \`docs/transversal/90.16-privacidad-compliance.md\`.

## Performance esperada
- Latencia p95 lecturas: <=200ms con dataset operativo.
- Latencia p95 escrituras: <=500ms.
- Throughput esperado: <N rps en horario pico>.
`;
}

// v12.119: spec-tareas como TABLA EJECUTABLE strict. Cada T-NNN es una fila con
// columnas obligatorias (id, rf, tipo, archivo, test, comandos RED/GREEN + expected,
// dependencias, paralelizable, estado). El validador check:tasks-executable verifica
// que NO hayan placeholders, paths inventados ni comandos vacios cuando una task
// pasa de estado pending. Por TDD: cada RF genera un par {test, impl} con test
// dependencia del impl.
//
// v12.106: spec-tareas como ciudadano de primera clase del scaffold (motivacion
// original — cada feature real necesita su lista de tareas ejecutables).
export function specTareas(c) {
  const primary = c.endpoints[0] || `GET /api/${c.entidad}`;
  // Genera UN par test+impl por RF. Test va antes que impl (TDD).
  const rows = [];
  let next = 1;
  for (const rf of c.rfs) {
    const slugRf = String(rf).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const testId = `T-${String(next).padStart(3, "0")}`; next += 1;
    const implId = `T-${String(next).padStart(3, "0")}`; next += 1;
    const testFile = `tests/unit/${c.entidad}/${c.entidad}-${slugRf}.test.ts`;
    const implFile = `src/backend/application/${c.entidad}/${c.entidad}-${slugRf}.ts`;
    const cmdTest = `npm test -- ${c.entidad}-${slugRf}`;
    rows.push(`| ${testId} | ${rf} | test | ${testFile} | (self) | ${cmdTest} | FAIL (sin impl) | ${cmdTest} | PASS | - | si | pending |`);
    rows.push(`| ${implId} | ${rf} | impl | ${implFile} | ${testFile} | ${cmdTest} | FAIL (test escrito) | ${cmdTest} | PASS | ${testId} | no | pending |`);
  }
  return `# Spec de tareas - ${c.titulo}

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla \`## Tabla ejecutable de tareas\`. Sin
placeholders, sin paths inventados, sin comandos con \`<...>\`. Granularidad: 2-5 min
por T-NNN. Cada T tipo=impl exige un T tipo=test que la precede (TDD obligatorio).
El validador \`check:tasks-executable\` bloquea \`check:all\` si una fila viola estas reglas.

## Contexto
- Feature: \`${c.slug}\`
- Spec funcional: \`spec-funcional.md\`
- Spec tecnica: \`spec-tecnica.md\`
- API contract: \`api-contract.md\` (endpoint principal: \`${primary}\`)
- Entidad BD: \`${c.entidad}\`
- UX/prototipo: \`prototype.md\` + \`prototype-html5/index.html\` + \`prototype-validation.md\`
- SPDD frontend: \`spdd-frontend.md\`
- Rama sugerida: \`feat/${c.slug}\`
- Worktree sugerido: \`worktrees/${c.slug}\`
- Gate: \`gate-4-6\` (cierre de SDD -> construccion habilitada)

## Tabla ejecutable de tareas

> Columnas obligatorias (v12.119+): \`id | rf | tipo | archivo | test | comando_red |
> expected_red | comando_green | expected_green | depende_de | paralelizable | estado\`.
> Estados validos: \`pending\` | \`in_progress\` | \`done\` | \`blocked\`. Tipos validos:
> \`test\` | \`impl\` | \`refactor\` | \`doc\`. Paths deben ser exactos (no \`<...>\` ni TBD).

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green).
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Cambios frontend tienen consistencia con prototipo y SPDD.
- [ ] Pruebas ejecutadas y registradas en \`qa/fase-6-qa/\`.
- [ ] Preguntas abiertas o bloqueantes documentados en \`traceability.md\`.

Referencia: \`docs/transversal/90.33-flujo-delivery-ia-proveedores.md\`
`;
}

// v12.120: tdd-evidence.md per feature. Cada T tipo=impl debe tener bloque RED+GREEN
// auditable. El validador check:tdd-evidence bloquea promote a state=done sin evidencia.
export function tddEvidence(c) {
  const slug = c.slug;
  const blocks = [];
  let next = 1;
  for (const rf of c.rfs) {
    const slugRf = String(rf).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const testId = `T-${String(next).padStart(3, "0")}`; next += 1;
    const implId = `T-${String(next).padStart(3, "0")}`; next += 1;
    const testPath = `tests/unit/${c.entidad}/${c.entidad}-${slugRf}.test.ts`;
    const cmd = `npm test -- ${c.entidad}-${slugRf}`;
    blocks.push(`## ${rf} / ${implId}

- Test path: (planned) ${testPath}
- RED command: (planned) ${cmd}
- RED result: pending
- RED log: pending
- GREEN command: (planned) ${cmd}
- GREEN result: pending
- GREEN log: pending
- Commit RED: pending
- Commit GREEN: pending
- Verified: pending

> Nota: tras correr el ciclo RED-GREEN real (\`ai/protocols/tdd.md\`), reemplaza
> "(planned) ..." por el valor real entre backticks y "pending" por el log/timestamp real.`);
  }
  return `# TDD Evidence - ${c.titulo}

> **Que es esto.** Evidencia auditable del ciclo RED-GREEN-REFACTOR por cada T tipo=impl
> de \`spec-tareas.md\`. \`agent:finish\` actualiza este archivo con commits y timestamps
> reales antes de cerrar el feature. \`check:tdd-evidence\` (STRICT en \`check:project\`)
> exige que cada T en state=done tenga aqui un bloque con RED + GREEN reales (no \`pending\`).

> **Como llenarlo.** Cada bloque corresponde a un T tipo=impl de spec-tareas.md. Sigue el
> protocolo \`tdd\` (ver \`ai/protocols/tdd.md\`):
> 1. Escribe el test → corre → captura RED log + commit.
> 2. Escribe codigo minimo → corre → captura GREEN log + commit.
> 3. Refactor (opcional, agrupable).
> 4. Actualiza el bloque aqui con \`Verified: <YYYY-MM-DD HH:MM>\`.

## Contexto
- Feature: \`${slug}\`
- spec-tareas.md: ver para los T-NNN correspondientes
- Protocolo aplicable: \`ai/protocols/tdd.md\`

${blocks.join("\n\n")}
`;
}

export function traceability(c) {
  const apiPrincipal = c.endpoints[0] || `GET /api/${c.entidad}`;
  const rfRows = c.rfs.map((rf, i) => `| ${rf} | ${c.hus[i % c.hus.length]} | spdd-frontend.md | prototype-html5/index.html | ${apiPrincipal} | ${c.entidad} | - | - | Spec inicial generada | spec-funcional.md |`);
  const rnfRows = c.rnfs.map((rnf, i) => `| ${rnf} | ${c.hus[i % c.hus.length]} | spdd-frontend.md | prototype-html5/index.html | ${apiPrincipal} | - | - | - | Pendiente prototipo | prototype.md |`);
  return `# Traceability - ${c.titulo}

[README principal](../../README.md) | [Specs](../README.md)

## Proposito
Matriz viva que conecta cada requerimiento con su diseno, prototipo, API, datos,
codigo, prueba, estado y evidencia. Es la fuente que \`node scripts/ai-framework-agent.mjs
sync-memory\` parsea para poblar \`ai_trace_links\`, \`ai_gate_runs\` y
\`ai_evidence_items\` en la memoria del agente IA.

## Flujo
\`\`\`text
Product Design -> SPDD -> Prototipo HTML5 -> SDD -> Construccion -> QA
\`\`\`

## Matriz de trazabilidad

> Regla v12.22+: usar \`-\` en \`Codigo\` y \`Test\` mientras el archivo/clase/test
> NO exista en el repo. Llenar el nombre real solo cuando exista; antes vive
> en \`spec-tareas.md\` como nombre futuro. Asi \`sync-memory\` lo marca
> automaticamente \`planned\` vs \`implemented\` y \`check-trace-drift\` no reporta
> falsos positivos.

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
${[...rfRows, ...rnfRows].join("\n")}

## Gates
| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-prototype-ready | pending | — | — | prototype-validation.md |
| gate-spdd-approved | pending | — | — | spdd-frontend.md |
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-build-ready | pending | — | — | traceability.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | ops/runbooks/${c.slug}-runbook.md |
| gate-operations-ready | pending | — | — | ops/runbooks/${c.slug}-runbook.md |

## Decisiones
- <Decision 1 — link a ADR si aplica>
- <Decision 2>

## Preguntas abiertas
- <Pregunta sobre regla de negocio>
- <Pregunta sobre alcance>
`;
}

export function prototype(c) {
  return `# Prototipo - ${c.titulo}

## Objetivo del prototipo
<Que validar con el prototipo: flujos, estados, jerarquia visual, permisos.>

## Patron visual elegido
<Elegir uno: SaaS operativo / Streaming-catalogo / Dashboard / E-commerce / Educacion>

Referencia: \`ejemplos/fase-2-ux-ui/prototype-html5-golden/<patron>/index.html\` (el golden es REFERENCIA de nivel, NO plantilla a copiar tal cual).

## Sistema visual e identidad
> OBLIGATORIO: todos los prototipos pertenecen al MISMO producto y comparten marca,
> tokens, tipografia, botones, estados, modales y toasts. Lo que cambia por feature
> es la estructura: layout, jerarquia, flujo y componentes propios del dominio.
> \`check:prototype-diversity\` es CIEGO al color: recolorear el mismo esqueleto NO pasa.
> Si hay varias features del mismo dominio, varia el layout (o usa
> \`scaffold:prototype --freeform\`) sin cambiar el look and feel del producto.

- **Layout/shell propio**: <topbar+sidebar+tabla | hero+grid | dashboard de cards | wizard | catalogo+player | ...>
- **Tokens compartidos**: <brand_hue, tipografia, espaciado, radios, sombras y estados del producto>
- **Acento secundario opcional**: <solo si ayuda a identificar la vertical sin romper la marca>
- **Componentes caracteristicos**: <los 2-3 componentes que hacen RECONOCIBLE esta feature>
- **En que se DIFERENCIA estructuralmente** de las otras features del proyecto: <layout/jerarquia/densidad/flujo distintos>

## Anatomia
- **Topbar**: <logo + busqueda + perfil + notificaciones>
- **Sidebar/Nav**: <secciones principales>
- **Main content**: <cards / table / hero / grid segun dominio>
- **Detail panel / modal**: <si aplica>

## Estados UI que el prototipo debe cubrir
- loading (spinner / skeleton)
- empty (sin datos + CTA)
- error (mensaje recuperable + boton retry)
- success / populated (caso feliz)
- permission denied (rol sin permiso)

## Datos mock
- <N> registros del dominio (ej. 16 ${c.entidad}s).
- Variedad: <al menos 3 estados distintos, 2-3 roles distintos>.
- IDs legibles (formato ${String(c.entidad).toUpperCase()}-YYYY-NNNN).

## Roles representados
| Rol | Que ve | Que NO ve |
|---|---|---|
| <Rol-A> | <vistas + acciones> | <permisos restringidos> |
| <Rol-B> | <vistas> | <permisos restringidos> |

## Microinteracciones esperadas (nivel 3 de rubrica)
- Hover en filas: revela acciones contextuales (opacity 0 -> 1).
- Focus en inputs: border-color brand + box-shadow.
- Boton primario hover: darken + transform scale(1.02).
- Toast/modal con animacion suave (0.2s ease).

## Tokens CSS esperados (12+ para nivel 3)
- \`--brand\`, \`--brand-light\`, \`--brand-dark\`
- \`--success\`, \`--warning\`, \`--danger\`, \`--info\`
- \`--neutral-50\`...\`--neutral-900\` (escala 9 valores)
- \`--shadow-sm\`, \`--shadow-md\`, \`--shadow-lg\`
- \`--radius\`, \`--transition\`, \`--font\`, \`--font-mono\`

## Responsive
- Desktop: <layout completo>
- Tablet (<=900px): <reflow>
- Mobile (<=480px): <stack vertical, sidebar oculto>
`;
}

export function prototypeValidation(c) {
  return `# Prototype Validation - ${c.titulo}

## Participantes
- <Nombre humano 1, rol> — REQUIERE al menos 1 participante humano para aprobar.
- <Nombre humano 2, rol>

## Fecha
<YYYY-MM-DD>

## Resultado
- Aprobado:
- Aprobado con observaciones:
- Bloqueado:
- Pendiente:

## Validacion de prototipo HTML5
- [ ] El prototipo abre sin build, backend ni dependencias no documentadas.
- [ ] El flujo extremo a extremo se entiende.
- [ ] Los estados loading/progress, empty, error, success y permission denied estan claros cuando aplican.
- [ ] Los roles/permisos son visibles.
- [ ] Las validaciones de formulario se entienden.
- [ ] Los datos mock estan identificados.
- [ ] La navegacion por menu, tabs, botones o breadcrumb es suficiente.
- [ ] El feedback UX cubre toast, modal, confirmacion, progreso o mensajes recuperables.
- [ ] Las limitaciones estan registradas.
- [ ] Se decidio si se requiere formalizar en Penpot.

## Observaciones

## Decisiones

## Cambios requeridos

## Observaciones aceptadas

## Revision visual humana
> OBLIGATORIA (v12.60). El validador automatico NO aprueba la UX por si solo.
> Un HUMANO confirma que "parece producto real". Si se ve pobre -> Resultado: blocked.
> Para approved: Revisor humano real (no agente/IA) + Fecha + Evidencia revisada (path/screenshot).

- Revisor:
- Fecha:
- Resultado: pending  <!-- approved | blocked | pending -->
- Comentarios:
- Evidencia revisada:

## Gate
- \`gate-prototype-ready\`
- \`gate-spdd-approved\`
- \`gate-prototype-human-visual-review\`
`;
}

export function productDesign(c) {
  return `# Product Design - ${c.titulo}

## Problema
<Que problema del usuario resuelve.>

## Jobs to be Done
- Cuando <contexto>, quiero <accion>, para <resultado>.
- Cuando <contexto>, quiero <accion>, para <resultado>.

## Hipotesis de valor
<Si construimos X, esperamos que Y suceda, medido por Z.>

## Metricas de exito
- Metrica primaria: <ej. tasa de conversion >= 30%>
- Metrica secundaria: <ej. latencia p95 <= 800ms>
- Anti-metrica: <ej. tasa de errores <= 1%>

## Flujos principales
1. <Flujo feliz: paso 1 -> paso 2 -> resultado>
2. <Flujo alternativo: cuando falta dato>
3. <Flujo de error: cuando hay permission denied>

## Restricciones
- <Tecnicas: ej. integracion con sistema X>
- <Negocio: ej. cumplir regulacion Y>
- <UX: ej. accesibilidad WCAG 2.1 AA>

## Decisiones de producto
- <Decision 1: <que> porque <por que>>
- <Decision 2>
`;
}

export function spddFrontend(c) {
  return `# SPDD Frontend - ${c.titulo}

## Componentes principales
- \`<NombreComponente>\` — <responsabilidad>
- \`<NombreComponente>\` — <responsabilidad>

## Estados UI

| Estado | Trigger | Comportamiento esperado |
|---|---|---|
| loading | fetch inicial | spinner centrado, skeleton si tabla |
| empty | API devuelve [] | mensaje + CTA primaria |
| error | API devuelve 4xx/5xx | mensaje recuperable + boton retry |
| success | datos cargados | render contenido |
| permission-denied | API devuelve 403 | mensaje rol y contacto |
| validation-error | input invalido | mensaje inline en campo |

## Permisos visibles

| Rol | Componentes visibles | Acciones permitidas |
|---|---|---|
| <Rol-A> | <componentes> | <acciones> |
| <Rol-B> | <componentes> | <acciones> |

## Feedback UX
- Toast: <para cuando> (ej. "Cambios guardados")
- Modal: <para cuando> (ej. confirmar borrado)
- Confirm: <para cuando> (ej. accion destructiva)
- Progress: <para cuando> (ej. carga de archivo)

## Accesibilidad
- Focus rings visibles (\`:focus { outline: 2px solid var(--brand); }\`)
- Labels asociados a inputs
- aria-label en botones icon-only
- Contraste >= 4.5:1 para texto principal

## Responsive
- Breakpoints: 480px (mobile), 768px (tablet), 1024px (desktop)
- Layout: <stack mobile, grid 2 cols tablet, grid 3-4 cols desktop>

## Trazabilidad hacia codigo
- Cada componente lleva comentario \`// @trace ${c.primaryRf}\` (o el RF que implementa).
- Test correspondiente: \`<componente>.test.tsx\` con \`// @trace ${c.primaryRf}\`.
`;
}

export function apiContract(c) {
  const epLines = c.endpoints.map((ep) => {
    const [method, path] = ep.split(/\s+/);
    return `### ${method} ${path}

**Trace**: \`${c.primaryRf}\`
**Auth**: requerido (rol <X> o <Y>)
**Query params** (si aplica):
| Param | Tipo | Requerido | Notas |
|---|---|---|---|
| <param_1> | string | no | <descripcion> |
| page | int | no | default 0 |
| size | int | no | default 20, max 100 |

**Request body** (POST/PUT/PATCH):
\`\`\`yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [<campo_1>]
        properties:
          <campo_1>:
            type: string
            example: "valor ejemplo"
          <campo_2>:
            type: integer
            minimum: 0
\`\`\`

**Response 200**:
\`\`\`yaml
responses:
  '200':
    description: OK
    content:
      application/json:
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/${c.entidad}'
            page:
              type: integer
            total:
              type: integer
\`\`\`

**Errores**:
- 400: validacion fallida
- 401: sin autenticacion
- 403: rol sin permiso
- 404: recurso no existe (si aplica)
- 500: error interno (registrado con correlationId)

`;
  }).join("\n");
  return `# API Contract - ${c.titulo}

## Endpoints

${epLines}

## Schema OpenAPI (referenciar en \`contracts/api/openapi.yaml\`)

\`\`\`yaml
components:
  schemas:
    ${c.entidad}:
      type: object
      required: [id]
      properties:
        id:
          type: string
          format: uuid
        <campo_1>:
          type: string
        <campo_2>:
          type: string
          format: date-time
        estado:
          type: string
          enum: [pendiente, activo, inactivo]
\`\`\`

## Correlacion
Toda request DEBE llevar header \`X-Correlation-Id\` (UUID). Si no viene, el backend lo genera.
Se propaga a logs y telemetria.

## Rate limit
- <X> requests por minuto por usuario.
- 429 con header \`Retry-After\` cuando se excede.
`;
}

export function uiTestCases(c) {
  return `# UI Test Cases - ${c.titulo}

## Casos manuales por estado

### Loading
- [ ] Al entrar a la vista, se muestra spinner centrado mientras carga.
- [ ] Si la carga tarda >500ms, aparece skeleton de filas.

### Empty
- [ ] Si el backend devuelve \`[]\`, se muestra mensaje "Aun no hay ${c.entidad}s" + CTA primaria.
- [ ] El CTA lleva al flujo de creacion.

### Error
- [ ] Si el backend devuelve 500, se muestra mensaje "Algo salio mal" + boton "Reintentar".
- [ ] El boton dispara nueva request.

### Success
- [ ] Render correcto de N filas con datos del mock.
- [ ] Las acciones por fila aparecen al hacer hover.

### Permission denied
- [ ] Si el rol no autoriza la accion, el boton aparece deshabilitado con tooltip.
- [ ] Si el rol no autoriza la vista, redirige a /forbidden con mensaje.

### Validation
- [ ] Campo requerido vacio: mensaje inline en rojo bajo el input.
- [ ] Email mal formado: mensaje "Email invalido" tras blur.

## Casos por rol

| Rol | Caso | Resultado esperado |
|---|---|---|
| <Rol-A> | crea ${c.entidad} | exito + toast |
| <Rol-A> | intenta borrar | accion denegada |
| <Rol-B> | borra ${c.entidad} | exito tras confirmacion |

## Casos automatizables (e2e)
Trace: \`${c.primaryRf}\`

\`\`\`ts
// tests/e2e/${c.entidad}.spec.ts
// @trace ${c.primaryRf}
test("usuario puede listar ${c.entidad}s", async ({ page }) => {
  await page.goto("/${c.entidad}");
  await expect(page.locator("[data-testid='${c.entidad}-list']")).toBeVisible();
});
\`\`\`
`;
}

export function placeholderProtoHtml(c) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${c.titulo}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{
  --brand:#1F4E79; --brand-light:#E7EEF5; --brand-dark:#163B5A;
  --success:#10B981; --warning:#F59E0B; --danger:#DC2626; --info:#06B6D4;
  --neutral-50:#F9FAFB; --neutral-100:#F3F4F6; --neutral-200:#E5E7EB;
  --neutral-500:#6B7280; --neutral-700:#374151; --neutral-900:#111827;
  --shadow-sm:0 1px 3px rgba(0,0,0,.08); --shadow-md:0 4px 12px rgba(0,0,0,.1); --shadow-lg:0 8px 24px rgba(0,0,0,.12);
  --radius:6px; --transition:.18s ease;
  --font:'Segoe UI',system-ui,sans-serif; --font-mono:'SF Mono',Monaco,monospace;
  --topbar-h:56px; --sidebar-w:240px;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font);color:var(--neutral-900);background:var(--neutral-50);min-height:100vh}
.topbar{position:sticky;top:0;height:var(--topbar-h);background:#fff;border-bottom:1px solid var(--neutral-200);display:flex;align-items:center;padding:0 24px;box-shadow:var(--shadow-sm);z-index:10}
.brand{font-weight:800;color:var(--brand)}
.main{max-width:900px;margin:0 auto;padding:24px}
.card{background:#fff;border:1px solid var(--neutral-200);border-radius:var(--radius);box-shadow:var(--shadow-sm);padding:24px}
.empty{padding:40px;text-align:center;color:var(--neutral-500)}
@media(max-width:768px){.main{padding:16px}}
</style>
</head>
<body>
<!-- ===================================================================
     spdd:freeform-starter — ANDAMIAJE (este comentario NO es visible al usuario).
     scaffold-feature genero un prototipo MINIMO (no se eligio --domain). INSTRUCCIONES
     PARA EL AGENTE (no las dejes como texto en pantalla):
       1. Diseña la UI REAL del dominio "${c.titulo}" — o regenera con:
          npm run scaffold:prototype -- --feature <NNN-slug> --domain <dominio>   (golden de referencia)
          npm run scaffold:prototype -- --feature <NNN-slug> --freeform           (andamiaje neutro)
       2. Consume datos de mock-data.json (window.FEATURE_DATA) y cubre estados loading/empty/error.
       3. BORRA este comentario al terminar. Mientras exista, check:prototype-diversity BLOQUEA.
     Trace: ${c.primaryRf}
==================================================================== -->
<header class="topbar"><span class="brand">${c.titulo}</span></header>
<main class="main">
  <section class="card">
    <div class="empty">Sin datos para mostrar.</div>
  </section>
</main>
</body>
</html>
`;
}
