# API Contract - Tema del sistema

> Contrato reconstruido por reingenieria desde `SystemThemeSettingResource` de `platform-app`.
> Se ensambla en `contracts/api/openapi.yaml` con `npm run generate:openapi`.

## Endpoints

### GET /api/system/theme
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin, auditor · Devuelve la configuracion de tema vigente.

### PUT /api/system/theme
**Trace**: `RF-002`, `RF-003` · **Auth**: platform-admin, integration-admin · Actualiza la configuracion de tema/locale/sidebar.

## Paths OpenAPI

```yaml
paths:
  /api/system/theme:
    get:
      summary: Obtiene la configuracion de tema del sistema
      operationId: getSystemTheme
      responses:
        '200':
          description: OK
    put:
      summary: Actualiza la configuracion de tema del sistema
      operationId: updateSystemTheme
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SystemThemeSetting'
      responses:
        '200':
          description: OK
```

## Schema OpenAPI

```yaml
components:
  schemas:
    SystemThemeSetting:
      type: object
      required: [scheme]
      properties:
        scheme:
          type: string
        preset:
          type: string
        density:
          type: string
        primaryColor:
          type: string
        errorColor:
          type: string
        neutralColor:
          type: string
        locale:
          type: string
        sidebarMode:
          type: string
```
