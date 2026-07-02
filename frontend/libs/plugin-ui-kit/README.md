# @integration-hub/plugin-ui-kit

Primitivas presentacionales del UI kit de Integration Hub, empaquetadas como **paquete
versionado y publicable** para que un autor de plugin **externo** las consuma y su remote se
vea nativo.

Es **autocontenido**: solo depende de `@angular/*` (peer deps). No arrastra servicios ni
lógica de plataforma, así que se puede publicar a un registry e instalar desde fuera.

## Contenido

| Import | Selector | Uso |
|---|---|---|
| `StatusBadgeComponent` | `ih-status-badge` | badge de estado (`success`/`error`/`warning`/`info`/`neutral`) |
| `EmptyStateComponent` | `ih-empty-state` | estado vacío con icono, mensaje y CTA opcional |
| `LoadingComponent` | `ih-loading` | barra o skeleton de carga |
| `IconComponent` | `ih-icon` | iconos SVG inline (ver `IhIconName`) |

También exporta los tipos `StatusBadgeKind` e `IhIconName`.

## Uso (autor externo)

```ts
// npm install @integration-hub/plugin-ui-kit
import { StatusBadgeComponent, IconComponent } from '@integration-hub/plugin-ui-kit';

@Component({
  standalone: true,
  imports: [StatusBadgeComponent, IconComponent],
  template: `<ih-icon name="shield" /> <ih-status-badge status="success">OK</ih-status-badge>`,
})
export class MiWidget {}
```

La apariencia es nativa porque los **design tokens (`--ih-*`) son CSS global** del host, que
estos componentes leen. Compártelo como **singleton** en tu `federation.config.js`:

```js
shared: {
  '@integration-hub/plugin-ui-kit': { singleton: true, strictVersion: false, requiredVersion: false },
}
```

## Desarrollo

- Build del paquete: `nx build plugin-ui-kit` → `dist/libs/plugin-ui-kit` (formato Angular:
  FESM + typings + `package.json`).
- Referencia visual + auditoría a11y de estas primitivas: **Storybook** (`npm run storybook`).
- Dentro del monorepo, la plataforma las consume vía el barrel `@integration-hub/shared/ui`,
  que las re-exporta desde este paquete (no hay duplicación).
