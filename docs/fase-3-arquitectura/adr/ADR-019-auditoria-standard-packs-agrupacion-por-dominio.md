# ADR-019 Auditoria por dominio: standard packs (limite plataforma <-> estandar)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-018 FILE_WRITE: binding de origenes y expresiones de detalle (paridad DB_WRITE + evaluador JEXL money-safe)](ADR-018-file-write-binding-origenes-y-expresiones-detalle.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

**Propuesto (2026-07-25).** Depende de ADR-012 (frontend modular por contribuciones), ADR-010 (auditoria asincrona + lineage) y ADR-009 (vertical de mensajeria de pagos). El diseno se verifico contra codigo (rutas, policy de navegacion y manifest de la plataforma) antes de proponerse; no hay implementacion todavia. Se implementa en dos fases (ver *Plan por fases*): la Fase 1 (reagrupacion UI) es independiente y de bajo riesgo; la Fase 2 (extraer MT101 a su pack) es la que fija el limite arquitectonico.

**Doble check (2026-07-25):** midiendo el acoplamiento real, la lib `features/audit` es ~80% MT101 (21 de 27 tipos son `Mt101*`; 34 de 37 metodos de `AuditApiService` son `mt101*`; 4 de 4 componentes de dominio son MT101; una sola capability `audit-read` para todo). El "audit generico" es un nucleo chico (eventos + lineage + spool = 6 tipos + 3 metodos) fusionado con un vertical SWIFT grande. Correccion respecto de la premisa inicial: la Fase 2 **no es mover entradas del manifest**, es **partir la Nx lib** (API + modelos + rutas + componentes + capability). Ver *El acoplamiento real* y *Plan por fases*.

## Contexto

La seccion `#/audit` acumulo, sin un modelo de agrupacion, tanto **observabilidad generica de plataforma** como **herramientas especificas del estandar SWIFT MT101**. La app tiene hoy tareas genericas y SWIFT, y va a incorporar otros estandares (ISO 20022, MT103, ...). El eje que importa para agrupar es el **dominio** (generico vs estandar), y hoy no existe.

Hay **dos superficies de navegacion** para auditoria, y no coinciden:

1. **Menu (sidebar)** — 5 items planos en `apps/web/src/app/core/app-navigation.policy.ts` (`audit`, `recordLineage`, `auditSpool`, `mt101Fragments`, `mt101Quarantine`). Mezclan generico y SWIFT sin agrupar, y **faltan** `mt101-pay-dispatch` y `mt101-pay-conflicts`.
2. **Cajas (workspace-nav)** — 7 `AppWorkspaceContribution` con `group: 'audit'` en `apps/web/src/app/core/platform-plugin.manifest.ts`, renderizadas por `AuditWorkspaceNavComponent` **agrupadas por `mode`** (`query`/`operation`), no por dominio. Se repiten arriba de cada sub-pagina.

Inventario y clasificacion (verificado contra los headers de cada componente):

| Sub-auditoria | Ruta | Dominio | Modo | Sidebar | Caja |
|---|---|---|---|:--:|:--:|
| Eventos | `/audit` | Generico | query | si | si |
| Trazabilidad de registro | `/audit/record-lineage` | Generico | query | si | si |
| Spool auditoria | `/audit/spool` | Generico | operation | si | si |
| Fragmentos MT101 | `/audit/mt101-fragments` | SWIFT MT101 | query | si | si |
| Cuarentena MT101 | `/audit/mt101-quarantine` | SWIFT MT101 | operation | si | si |
| PAY Despacho | `/audit/mt101-pay-dispatch` | SWIFT MT101 | query | no | si |
| PAY Conflictos | `/audit/mt101-pay-conflicts` | SWIFT MT101 | operation | no | si |

- **Generico** (sirve para cualquier estandar): eventos, trazabilidad E2E (`INGESTED -> BUILT -> VALIDATED -> ARCHIVED -> SENT/REJECTED`, `record-lineage.component.ts`), spool async (`audit-spool.component.ts`).
- **SWIFT MT101**: fragmentos, cuarentena, PAY despacho, PAY conflictos.

Problemas:

- **Inconsistencia**: menu (5) contra cajas (7); misma informacion, dos verdades.
- **Sin separacion de dominio**: generico revuelto con SWIFT en ambas superficies.
- **Agrupado por el eje equivocado** (modo, no dominio).
- **No escala**: MT101 esta *hardcodeado en el manifest de la plataforma*. Cada estandar nuevo agrandaria el sidebar plano y empeoraria la mezcla. El modelo ya es de plugins (las cajas son contribuciones), pero el limite plataforma <-> estandar no esta trazado.

### El acoplamiento real (hallazgo del doble check)

La reagrupacion **visual** es barata, pero la separacion **fisica** no, porque el codigo generico y el SWIFT estan fusionados en la misma Nx lib `features/audit`:

| Artefacto | Generico | SWIFT MT101 | Acoplamiento |
|---|---|---|---|
| `audit.models.ts` (tipos) | 6 (`AuditRecord`, `RecordLineageEntry`, `AuditSpool*`) | **21** (`Mt101*`) | 1 archivo, mezclado |
| `AuditApiService` (metodos) | 3 (`list`, `recordLineage`, `auditSpool*`) | **34** (`mt101*`) | 1 servicio, mezclado |
| Componentes de dominio | 0 | **4** (fragments, quarantine, pay-dispatch, pay-conflicts) | misma lib |
| Rutas (`auditRoutes`) | 3 | 4 | **un solo `Route[]` cerrado** cargado por una unica lib lazy |
| Capability | `audit-read` | `audit-read` (la misma) | sin separacion RBAC |

Los endpoints confirman la linea de corte: los genericos son `/api/query/audit-events`, `/api/query/record-lineage`, `/api/query/audit-spool/*` (sin prefijo de estandar); los de SWIFT son `/api/query/mt101-fragments/*`, `/api/query/mt101-quarantine/*`, `/api/query/mt101-pay-dispatch-intents/*`. La lib `features/audit` es hoy, por superficie, ~80% un vertical SWIFT (coherente con ADR-009) con un nucleo de observabilidad chico encima.

## Decision

Introducir una **dimension de dominio** en las contribuciones de auditoria y reorganizar ambas superficies alrededor de ella, con el corolario arquitectonico de tratar cada estandar como un **standard pack** que se auto-registra.

### 1. Dimension de dominio en la contribucion

`AppWorkspaceContribution` (en `libs/shared/ui/.../app-navigation.models.ts`) gana un campo opcional de **dominio** con su etiqueta y orden. `group: 'audit'` sigue nombrando la SECCION (el hub); el nuevo campo nombra el DOMINIO dentro de ella.

```jsonc
{
  "id": "audit-mt101-fragments",
  "group": "audit",
  "domain": "swift-mt101",          // <- nuevo eje de agrupacion
  "domainLabelKey": "audit.domain.swiftMt101",
  "domainOrder": 20,
  "route": "/audit/mt101-fragments",
  "labelKey": "audit.workspace.fragments",
  "mode": "query"
}
```

Los genericos declaran `domain: "platform"` (`domainOrder` menor). `AuditWorkspaceNavComponent` agrupa por `domain` (ordenado por `domainOrder`) y baja `mode` a **tag secundario** dentro de cada caja. El shell no conoce "swift" ni "mt101": solo agrupa por el `domain` que cada contribucion declara.

### 2. El hub `/audit` como unica superficie; sidebar de 1 entrada

Las 5 entradas planas de auditoria del sidebar colapsan a **una sola** (`audit -> /audit`). `/audit` es un hub que muestra las sub-auditorias agrupadas por dominio. Esto destatura el sidebar (hoy ~15 items) y hace que **un estandar nuevo no agregue items al sidebar**, solo un bloque dentro del hub.

### 3. Standard packs (limite plataforma <-> estandar)

La plataforma contribuye **solo** la auditoria generica. Cada estandar contribuye sus propias sub-auditorias (y sus tareas) bajo su dominio, mediante su propio manifest/modulo:

| Pack | Aporta a auditoria | Dominio |
|---|---|---|
| Plataforma | Eventos, Trazabilidad, Spool | `platform` |
| SWIFT MT101 | Fragmentos, Cuarentena, PAY Despacho, PAY Conflictos | `swift-mt101` |
| (futuro) ISO 20022 / MT103 | sus propias sub-auditorias | `iso-20022` / ... |

Es el mismo mecanismo de contribuciones de ADR-012; lo que cambia es **quien** declara las cajas MT101: hoy el manifest de la plataforma, en la propuesta un pack SWIFT-MT101. El shell renderiza dominios de forma generica -> **un estandar nuevo = un pack nuevo, cero cambios en el shell**. Es coherente con como ya se organizan los task providers (`libs/core/providers/.../tasks/payments/swift/`).

## Plan por fases

**Fase 1 — Reagrupar por dominio (UI, bajo riesgo, sin ADR-blocker).**
- Agregar `domain`/`domainLabelKey`/`domainOrder` al modelo y poblarlo en las 7 contribuciones existentes (siguen en el manifest de plataforma por ahora).
- `AuditWorkspaceNavComponent` agrupa por dominio; `mode` pasa a tag.
- Sidebar: quitar `recordLineage`/`auditSpool`/`mt101Fragments`/`mt101Quarantine` de la policy; queda solo `audit`. (Los deep-links a las rutas siguen validos.)
- Un commit, reversible, sin mover manifests.

**Fase 2 — Standard pack SWIFT MT101 (fija el limite; este ADR).** Es un **split de Nx lib**, no un movimiento de manifest:
- Partir `features/audit` en un nucleo generico (events/lineage/spool: 6 tipos, 3 metodos API, 3 rutas) y un pack `features/swift-mt101` (21 tipos `Mt101*`, 34 metodos, 4 componentes, 4 rutas). El pack **extiende el vertical de ADR-009**, no es codigo nuevo.
- El pack declara sus propias contribuciones (workspaces `domain:'swift-mt101'`, rutas, y **capability propia** p.ej. `swift-mt101-read`) via su manifest; la plataforma deja de nombrar "mt101".
- **Decision de rutas (abierta)**: hoy `auditRoutes` es un `Route[]` cerrado de una sola lib. Para que un pack aporte `/audit/mt101-*` hay dos opciones — (a) el shell gana un *merge de rutas hijas* bajo un padre compartido (`/audit`), o (b) el pack toma su propio namespace (`/swift-mt101/*`) y el hub de auditoria enlaza cross-namespace. **Recomendado (b)**: mas simple y refuerza el limite; el hub solo agrupa/enlaza.
- Deja una plantilla para el proximo estandar (ISO 20022 / MT103).

## Consecuencias

Positivas:
- Una sola fuente de verdad para la navegacion de auditoria; se acaba la inconsistencia menu/cajas.
- Sidebar mas limpio; la seccion escala por dominios, no por items sueltos.
- Limite plataforma <-> estandar explicito -> ISO 20022 / MT103 entran como packs sin refactor del shell.
- PAY Despacho / PAY Conflictos quedan visibles en su dominio (hoy solo por deep-link).

Costos:
- Cambia el modelo de contribuciones (`AppWorkspaceContribution` gana campos) -> las contribuciones existentes se migran (Fase 1).
- Colapsar el sidebar cambia una IA que algunos usuarios ya memorizaron (mitigado: los deep-links siguen funcionando; el hub agrupa lo mismo).
- **Fase 2 es un split de lib** (~80% de `features/audit`): separar `AuditApiService` / `audit.models.ts` / rutas / los 4 componentes + capability propia. Costoso pero de alto valor; requiere re-test de registro de cajas, resolucion de rutas y RBAC. Por eso Fase 1 y Fase 2 se entregan por separado.

## Alcance / lo que NO entra

- **No** se cambia ninguna sub-auditoria por dentro (misma funcionalidad de eventos/lineage/spool/fragmentos/etc.).
- **No** se convierte MT101 en un plugin remoto (Module Federation, ADR-013); sigue siendo un modulo local, solo que su manifest se separa del de plataforma (Fase 2).
- **No** se toca el backend de auditoria (endpoints `/api/query/...` intactos); la linea de corte del backend (`audit-events`/`record-lineage`/`audit-spool` vs `mt101-*`) ya existe y se respeta.
- La separacion RBAC (una capability por estandar, p.ej. `swift-mt101-read`) es parte de la **Fase 2**, no de la Fase 1 (que conserva `audit-read`).
- **`record-lineage` queda en el nucleo generico** (su endpoint no lleva prefijo de estandar), pero su UI tiene modos de busqueda por archivo/fila hoy mas utiles para MT101: es la "costura". Si un estandar futuro produce lineage, hay que verificar que esos modos generalicen (no se asume).
- La agrupacion del sidebar por *grupos con encabezado* (en vez de colapsar a 1 entrada) queda como alternativa descartada: el `AppNavigationComponent` hoy renderiza items planos y agregar encabezados de grupo es mas superficie que el hub, sin la ganancia de escala.

## Referencias

- [ADR-009 Vertical de mensajeria de pagos](ADR-009-vertical-mensajeria-pagos.md)
- [ADR-012 Frontend modular extensible por contribuciones](ADR-012-frontend-modular-extensible-plugins.md)
- [ADR-010 Auditoria asincrona multi-broker y lineage por registro](ADR-010-auditoria-asincrona-multi-broker-lineage-registro.md)
- Codigo: `app-navigation.policy.ts` (items de sidebar), `platform-plugin.manifest.ts` (workspaces `group:'audit'` + `PLATFORM_ROUTE_CONTRIBUTIONS` con la unica lib lazy `features/audit`), `AuditWorkspaceNavComponent` (agrupa por `mode` hoy), `AppWorkspaceContribution` (`app-navigation.models.ts`), `audit.routes.ts` (8 rutas en un `Route[]` cerrado), `AuditApiService` + `audit.models.ts` (nucleo generico + 34 metodos / 21 tipos `Mt101*`), `tasks/payments/swift/` (precedente de organizacion por estandar).
