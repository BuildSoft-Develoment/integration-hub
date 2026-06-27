# Catalogo frontend de plugins metadata-only

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

## Objetivo

Definir como instalar contribuciones externas de frontend sin ejecutar codigo
remoto y sin modificar el shell Angular.

## Alcance

Este mecanismo acepta solo metadata para rutas ya instaladas por la plataforma.
No habilita `loadChildren`, `loadComponent`, componentes remotos ni dependencias
externas en runtime.

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

- El catalogo debe referenciar `./catalog.schema.json`.
- Las rutas deben pertenecer al conjunto publicado en el schema.
- Las capabilities deben pertenecer al conjunto publicado en el schema.
- No se aceptan campos fuera del contrato publico.
- `routes` debe omitirse o estar vacio.
- Un plugin con codigo Angular debe entrar por provider estatico y build
  controlado, no por catalogo JSON runtime.
- Instalar un plugin existente requiere `--replace`.
- Operaciones de prueba deben usar `--dry-run`.

## Referencias

- [ADR-012 Frontend modular extensible por contribuciones](../../fase-3-arquitectura/adr/ADR-012-frontend-modular-extensible-plugins.md)
- [Frontend Nx Angular](frontend-nx-angular.md)
