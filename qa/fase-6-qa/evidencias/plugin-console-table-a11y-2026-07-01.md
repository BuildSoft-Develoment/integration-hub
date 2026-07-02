# Evidencia semantica accesible de tablas (WCAG 1.3.1) - 2026-07-01

Cierra un gap detectado en el doble check de la auditoria a11y previa: las tablas de
datos de la consola `/plugins` no exponian la relacion cabecera-celda (`scope`) ni un
nombre accesible (`caption`). Este incremento lo corrige en todas las tablas.

## Alcance

- `scope="col"` en las 22 celdas de cabecera (`<th>`) de las tablas (registro
  unificado, backend, versiones, canary): asocia cada columna con sus celdas de datos
  para lectores de pantalla (WCAG 1.3.1 Info and Relationships).
- `<caption class="sr-only">` en cada tabla, dandole un nombre accesible
  (Registro frontend / Backend / Versiones / Metricas de canary) sin alterar el layout
  visual (utilidad `.sr-only` clip-hidden).

## Cambios verificados

- `plugin-diagnostics-page.component.ts`:
  - `scope="col"` en todos los `<th>`.
  - `<caption class="sr-only">` con el titulo de seccion en las 4 tablas con cabecera.
  - Utilidad CSS `.sr-only` (posicion absoluta, clip 1px).

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: **PASS**. Test files: **80 passed**. Tests: **373 passed** (+1 nuevo:
  "gives data tables accessible semantics (scope + caption)": verifica que todos los
  `<th>` tienen `scope="col"` y que existen captions no vacios).

## Prueba e2e (Playwright, chromium, stack real)

### Comando

```bash
# tras rebuild de Quinoa y health=200
BASE_URL=http://localhost:8080 npx playwright test \
  --config=apps/web-e2e/playwright.config.ts --project=chromium
```

### Resultado

- Suite completa: **3 passed (1.8m)**.
- "shows the plugin management console" verifica que existe al menos un
  `th[scope="col"]` y un `table caption` en la vista.

## Estado de los pendientes

- Todos los pendientes documentados siguen cerrados; este incremento refuerza la
  auditoria a11y (semantica de tablas), que antes solo cubria foco/teclado/aria-live.

## Siguientes incrementos (opcionales)

- Grafica temporal de la evolucion del ratio de canary (requiere serie temporal por
  bucket en el backend).
- Filtro/orden en el dashboard de canary si crece el numero de versiones.
