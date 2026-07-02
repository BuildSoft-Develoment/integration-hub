# Evidencia P2: slots/outlets para enriquecer páginas existentes - 2026-07-02

El salto de extensibilidad UX: un plugin (o feature) puede **inyectar un widget dentro de
una página existente** en un *slot* con nombre, en vez de solo añadir pantallas nuevas.
Convierte los plugins de "añaden vistas" a "enriquecen el producto".

## Mecanismo (mismo patrón DI que actions/command handlers)

- **`AppSlotContribution`** `{ slot, component, order?, requiredCapability?, source? }` +
  token `APP_SLOT_CONTRIBUTIONS` + `provideAppSlotContributions([...])` (multi-provider).
- **`AppSlotRegistry`** (`providedIn: 'root'`): resuelve las contribuciones de un slot,
  **ordenadas** (`order`) y **filtradas por RBAC** (`requiredCapability` vía `AuthAccessService`).
- **`SlotOutletComponent`** (`ih-slot`): `<ih-slot name="overview.widgets" />` renderiza las
  contribuciones del slot con `NgComponentOutlet`.
- **Overview** expone el primer slot: `overview.widgets` (vacío por defecto → sin cambio
  visual; plugins/features registran widgets en el injector raíz).

## Pruebas

### Unit (`npx nx test web`)

- **PASS. Test files: 83. Tests: 397** (+3):
  - `AppSlotRegistry` resuelve por slot, **excluye** las gated por capability que el usuario
    no tiene, **ordena** por `order`, y las incluye cuando sí tiene la capability.
  - `SlotOutletComponent` renderiza los widgets contribuidos del slot (y no los de otros).
- Build de producción: **OK**.

### e2e (Playwright, chromium, stack real)

- **2 passed**: "exposes the overview.widgets extension slot on the dashboard" (el outlet
  `ih-slot` está presente en `/#/overview`) + regresión del widget de salud de plugins.

## Alcance / follow-up

- Entregado: el mecanismo de slots (registry + outlet + RBAC + orden) + **1 slot cableado**
  (`overview.widgets`, vacío por defecto). La renderización de contribuciones está probada
  por unit; no se registró un widget demo permanente para no ensuciar el dashboard.
- Añadir más puntos de extensión = colocar otro `<ih-slot name="...">` (p.ej.
  `connection.detail.tabs`).
- Documentado en `guia-autor-plugins.md` (sección 2c).

## Estado del roadmap UI/UX

- **P1** (shell `ih-catalog-list`, 7 catálogos) ✅ · **P3** (UI kit para plugins) ✅ ·
  **P2** (slots/outlets) ✅. Roadmap UI/UX + extensibilidad completo en su primera iteración.
