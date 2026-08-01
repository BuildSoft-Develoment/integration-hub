# Catalogo frontend de plugins metadata-only

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Verificacion tecnica y trazabilidad](../verificacion/verificacion-tecnica-y-trazabilidad.md)
- Siguiente: [Fase 6 - QA](../../fase-6-qa/README.md)
<!-- nav-guided:end -->

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

## Objetivo

Definir como instalar contribuciones externas de frontend sin modificar el shell Angular.

## Alcance

Dos canales, no uno:

1. **Metadata** hacia rutas que la plataforma ya monta: navegacion, workspaces y acciones. Este
   canal no ejecuta nada.
2. **`remote`** (ADR-013): un plugin que aporta codigo Angular por Native Federation. **No es
   carga libre**: los cuatro campos `url`, `exposedModule`, `integrity` y `signature` son
   obligatorios, y antes de montar nada el runtime descarga el remoteEntry, recomputa su SRI, lo
   compara y verifica la firma **ECDSA P-256** contra la clave de confianza de su `keyId`, ademas
   de exigir que el origen este en la allowlist. Si algo de eso falla, el plugin queda `degraded`,
   no cargado.

Lo que sigue prohibido —y esa prohibicion si es coherente en todo el contrato— es **declarar rutas
Angular desde el catalogo**: `routes` esta en `maxItems: 0`.

> Este documento decia antes que el catalogo "no ejecuta codigo remoto" y que no habilita
> `loadChildren`/`loadComponent`. Era cierto cuando se escribio (ADR-012) y dejo de serlo con
> ADR-013, que anadio el bloque `remote` al mismo `catalog.schema.json` sin retirar la frase.

## Archivos canonicos

- Catalogo runtime:
  `frontend/apps/web/public/plugins/catalog.json`
- Schema publico para proveedores:
  `frontend/apps/web/public/plugins/catalog.schema.json`
- Gate local/CI:
  `frontend/scripts/validate-plugin-catalog.js`
- Pruebas del gate:
  `frontend/scripts/validate-plugin-catalog.spec.js`
- Gestor de instalacion/remocion:
  `frontend/scripts/manage-plugin-catalog.js`
- Pruebas del gestor:
  `frontend/scripts/manage-plugin-catalog.spec.js`

## Contrato minimo

Cada manifest debe declarar:

- `id`: identificador unico del plugin.
- `version`: version del manifest/plugin.
- `platformVersion`: version mayor compatible con el shell.
- `displayName`: nombre visible para trazabilidad.
- `navigation`: entradas opcionales hacia rutas conocidas.
- `workspaces`: superficies opcionales hacia rutas conocidas.
- `actions`: acciones opcionales declarativas.
- `capabilities`: capacidades opcionales conocidas por el shell.
- `i18nNamespaces`: namespaces opcionales para traducciones.

## Ejemplo

```json
{
  "$schema": "./catalog.schema.json",
  "manifests": [
    {
      "id": "audit-summary",
      "version": "1.0.0",
      "platformVersion": "1.0.0",
      "displayName": "Audit Summary",
      "navigation": [
        {
          "id": "audit-summary-nav",
          "route": "/audit",
          "labelKey": "plugins.auditSummary.nav",
          "requiredCapability": "audit"
        }
      ],
      "workspaces": [
        {
          "id": "audit-summary-workspace",
          "route": "/audit/record-lineage",
          "labelKey": "plugins.auditSummary.workspace",
          "mode": "query",
          "requiredCapability": "audit-read"
        }
      ],
      "actions": [
        {
          "id": "audit-summary-open",
          "labelKey": "plugins.auditSummary.open",
          "kind": "navigation",
          "placement": "toolbar",
          "route": "/audit/record-lineage",
          "requiredCapability": "audit-read"
        },
        {
          "id": "audit-summary-docs",
          "labelKey": "plugins.auditSummary.docs",
          "kind": "external-link",
          "href": "https://example.com/audit-summary"
        },
        {
          "id": "audit-summary-refresh",
          "labelKey": "plugins.auditSummary.refresh",
          "kind": "command",
          "command": "audit-summary.refresh"
        }
      ]
    }
  ]
}
```

## Validacion

Desde `frontend/`:

```bash
npm run validate:plugins
npm run test:plugins
npm run build
```

`web:build` depende de `web:validate-plugins`, por lo que un catalogo invalido
falla antes de compilar el frontend productivo.

## Instalacion controlada

Instalar un manifest nuevo:

```bash
npm run plugins:install -- path/to/plugin-manifest.json
```

Validar una instalacion sin escribir el catalogo:

```bash
npm run plugins:install -- path/to/plugin-manifest.json --dry-run
```

Reemplazar explicitamente un manifest existente:

```bash
npm run plugins:install -- path/to/plugin-manifest.json --replace
```

Listar plugins metadata-only instalados:

```bash
npm run plugins:list
```

Retirar un plugin metadata-only:

```bash
npm run plugins:remove -- audit-summary
```

El gestor valida el catalogo resultante antes de escribirlo. Si la operacion
introduce una ruta desconocida, capability no soportada, duplicado o campo fuera
del contrato, el archivo no se actualiza.

## Reglas

- El catalogo debe declarar `"$schema": "./catalog.schema.json"`.
- Las rutas deben pertenecer al conjunto publicado en el schema.
- Las capabilities deben pertenecer al conjunto publicado en el schema.
- Las acciones `navigation` deben apuntar a rutas conocidas del shell.
- Las acciones `external-link` solo aceptan `https://`.
- Las acciones `command` publican identificadores simbolicos; el catalogo JSON no ejecuta
  handlers. (El bloque `remote` si carga codigo, pero por Native Federation y solo tras firma,
  SRI y allowlist de origen: son canales distintos.)
- Los comandos se resuelven solo si la aplicacion instala un handler estatico
  con `provideAppActionCommandHandlers(...)`.
- No se aceptan campos fuera del contrato publico.
- `routes` debe omitirse o estar vacio.
- Un plugin con codigo Angular entra por una de dos vias: provider estatico y build controlado, o
  el bloque `remote` de ADR-013 con firma, SRI y allowlist de origen. Lo que no puede en ninguna de
  las dos es declarar rutas Angular desde el catalogo.
- Instalar un plugin existente requiere `--replace`.
- Operaciones de prueba deben usar `--dry-run`.

## Referencias

- [ADR-012 Frontend modular extensible por contribuciones](../../fase-3-arquitectura/adr/ADR-012-frontend-modular-extensible-plugins.md)
- [Frontend Nx Angular](frontend-nx-angular.md)

## Ejemplo de handler estatico

```ts
provideAppActionCommandHandlers([
  {
    command: 'audit-summary.refresh',
    execute: async (_action, context) => {
      await auditFacade.refresh(context.selection ?? []);
    },
  },
], 'audit-summary');
```

El manifest externo solo declara `command: "audit-summary.refresh"`. El codigo
que ejecuta la accion debe venir instalado en el build del shell o en un plugin
estatico gobernado por release.

## Consulta desde una feature

```ts
readonly actions = computed(() =>
  this.appActions.actionBarActions({
    placement: 'toolbar',
    group: 'audit-summary',
  })
);
```

Las features deben consultar acciones mediante `AppActionQueryService`. Esta
facade filtra capabilities y oculta comandos sin handler instalado, evitando que
una pantalla conozca la estructura interna del registry de plugins.

Si una feature registra handlers en su injector local, debe proveer tambien
`AppActionExecutor` y `AppActionQueryService` en el mismo scope para que los
handlers queden visibles durante la resolucion.
