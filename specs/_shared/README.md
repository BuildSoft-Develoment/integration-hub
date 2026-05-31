# specs/_shared/ — Infraestructura compartida de prototipos (opt-in, v12.61)

Helpers de **bajo nivel** que los prototipos HTML5 pueden compartir cuando el
proyecto se construye como un **portafolio multi-spec** (varias features que
forman un mismo producto navegable). Es **opt-in**: el modo por defecto sigue
siendo `standalone` (cada prototipo autocontenido con tokens inline).

## Cuándo usar `_shared/`

Usa el modo `portfolio-spa` cuando:

- Tienes varias features que comparten marca, sesión y navegación cruzada.
- Quieres un único sistema de diseño (tokens) en vez de duplicarlo por spec.
- La sesión (rol, usuario, demo-mode) debe sobrevivir la navegación entre
  prototipos abiertos con `target="_blank"` (por eso usamos **localStorage**,
  no sessionStorage).

Si solo tienes una feature, o cada prototipo es independiente, usa
`standalone` (default) — no necesitas `_shared/`.

## Cómo activarlo

```bash
npm run scaffold:prototype -- --feature 002-mi-feature --domain operativo --mode portfolio-spa
```

Esto inyecta en el `<head>` del prototipo:

```html
<link rel="stylesheet" href="../../_shared/tokens.css">
<script src="../../_shared/seed.js"></script>
<script src="../../_shared/mock-api.js"></script>
<script src="../../_shared/app-state.js"></script>
<script src="../../_shared/ui.js"></script>
<script src="../../_shared/nav-items.js"></script>
<script src="../../_shared/nav.js"></script>
```

La ruta `href`/`src` sube dos niveles desde el `index.html` de la feature
(de `prototype-html5/` a `specs/`) y entra a la carpeta compartida.

## Qué contiene (y qué NO)

| Archivo | Expone (window) | Rol |
| --- | --- | --- |
| `tokens.css` | — | Sistema de diseño: paleta, tipografía, espaciado, radios, sombras, breakpoints, primitivas `.u-*`. Cada spec sobrescribe `--brand-h`. |
| `mock-api.js` | `MockApi` | API simulada de bajo nivel: latencia, inyección de error, CRUD en memoria. **No** trae datos de dominio. |
| `app-state.js` | `AppState` | Estado/sesión en localStorage (sobrevive `target=_blank`), pub/sub cross-tab. |
| `ui.js` | `UI` | Primitivas transversales: toast, modal, skeleton/empty/error, formateadores. **No** define layout de dominio. |
| `nav.js` | `SharedNav` | Sidebar/menu COMPARTIDO + cross-link + navegacion CON contexto + breadcrumb "volver" + guards por rol + badges + responsive. `SharedNav.mount('#spdd-nav', { active:'<slug>', brand })`. Helper de navegacion (permitido), no un app-shell. |
| `nav-items.js` | `SPDD_NAV_ITEMS` | Manifiesto UNICO de la lista de features del sidebar (slug/label/icon + opcional `roles`/`badge`). `scaffold:prototype --mode portfolio-spa` lo actualiza solo. |
| `seed.js` | `SharedSeed` | Datos COMUNES cross-spec (opcional): entidades que varias features comparten (ej. "miembro") para que se vean consistentes. `SharedSeed.register/get/resource`. Vacio por defecto. |

### Sidebar compartido (portfolio-spa)

En modo `portfolio-spa`, el menu lateral vive **una sola vez** en `specs/_shared/nav.js` y
la lista de features en `specs/_shared/nav-items.js`. Cada prototipo monta el sidebar con:

```html
<script src="../../_shared/nav-items.js"></script>
<script src="../../_shared/nav.js"></script>
<div id="spdd-nav"></div>
<script>SharedNav.mount('#spdd-nav', { active: '002-mi-feature', brand: 'MiApp' });</script>
```

- **NO dupliques el sidebar** en cada prototipo: reemplaza el del golden por el mount.
- Agregar una feature al menu = `scaffold:prototype --mode portfolio-spa` (registra en `nav-items.js`) o editar el manifiesto.
- `check:prototype-spa-coherence` verifica que todos los prototipos usen el sidebar comun, que el mount no quede inerte (`hidden`) ni con sidebar inline duplicado, y que el manifiesto este en sintonia con los prototipos reales (sin huerfanos ni links rotos).

### Navegacion cross-spec CON contexto (v12.85)

Para abrir otra feature **pasando una entidad seleccionada** (ej. desde "Miembros"
abrir "Donaciones de ESE miembro") usa `SharedNav.go()` en origen y
`SharedNav.context()` en destino:

```js
// Feature ORIGEN (al hacer click en un registro):
SharedNav.go('003-donaciones', { focus: miembro.id, entity: 'miembro', label: miembro.nombre });

// Feature DESTINO (al cargar):
var ctx = SharedNav.context();   // { focus, entity, label, from, fromLabel }
if (ctx.focus) { /* filtra/abre el detalle de ctx.focus */ }
```

El contexto se persiste en `AppState` (sobrevive `target=_blank`) y se refleja en
la URL (`?focus=&entity=&from=`). El breadcrumb **"← Volver a `<feature origen>`"**
se pinta solo a partir de `?from=`.

### Guards por rol y badges (v12.85)

En `nav-items.js` cada item acepta:

- `roles: ["admin"]` — el item solo se muestra al rol activo (`AppState.session.role()`).
  Sin rol o en demo-mode se muestran todos.
- `badge: 3` (estatico) o `badge: { state: "pendientes" }` (lee un contador compartido
  de `AppState`, cross-spec).

`role`/`demo-mode` tienen **fuente unica** en `AppState`; la URL solo los propaga en el
primer salto cross-window.

### Datos declarativos por feature (`mock-data.json`, v12.86)

Cada prototipo declara sus datos en `specs/<slug>/prototype-html5/mock-data.json`:

```json
{
  "entities": {
    "donacion": { "shared": false, "rows": [ { "id": 1, "monto": 100 } ] },
    "miembro":  { "shared": true,  "rows": [ { "id": 1, "nombre": "Ana" } ] }
  }
}
```

`scaffold:prototype` lo cablea en `window.FEATURE_DATA` y registra en `SharedSeed`
las entidades `"shared": true`. El prototipo las consume:

```js
var donaciones = MockApi.resource(FEATURE_DATA.donacion);
var miembros   = SharedSeed.resource("miembro");   // misma fuente en todas las features
```

El validador `check:prototype-mock-data` bloquea placeholders `<<...>>` residuales y el
esqueleto sin completar.

### Datos comunes cross-spec (`seed.js`)

Cuando 2+ features comparten una entidad (ej. "miembro"), regístrala una sola vez en
`seed.js` y reúsala — en vez de duplicar mocks contradictorios:

```js
// seed.js (entidades compartidas):
SharedSeed.register("miembro", [{ id: 1, nombre: "Ana Perez", rol: "lider" }]);
// En la feature:
var miembros   = SharedSeed.resource("miembro");        // CRUD sobre el dataset comun
var donaciones = MockApi.resource(misDonacionesPropias); // datos propios de la feature
```

### Regla anti-trampa (la más importante)

`_shared/` solo puede contener **helpers de bajo nivel**. Está **prohibido**
crear un *renderer genérico único* que defina todo el layout/dominio (p. ej.
`mini-app.js`, `app-renderer.js`, `ui-factory.js`, `render-all.js`,
`app-shell.js`). El validador `check-prototype-visible-product.mjs` bloquea esos
nombres. Cada spec **debe** construir su propia UI de dominio (vistas, datos,
casos de uso) en su `index.html`; `_shared/` solo aporta tokens y feedback
transversal.

## Cómo lo ven los validadores

- **`check-prototype-diversity.mjs`**: ignora las líneas que referencian
  `_shared/` al calcular el hash de estructura. Compartir infraestructura **no**
  cuenta como clonar el dominio.
- **`check-html5-prototype-quality.mjs`**: resuelve `<link>`/`@import` a CSS
  local (incluido `_shared/tokens.css`) y **suma sus tokens y media queries** al
  grading. Mover el sistema de diseño a `_shared/` **no baja** el nivel.
- **`check-prototype-visible-product.mjs`**: permite estos helpers, pero exige
  que el prototipo siga siendo producto visible real + revisión humana.

## Sincronización a proyectos instanciados

`npm run template:upgrade:apply` copia `specs/_shared/` si falta (safe-to-copy:
son helpers sin customización semántica). No sobreescribe archivos existentes.
