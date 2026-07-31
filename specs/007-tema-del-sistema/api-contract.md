# API Contract - Tema del sistema

> Contrato reconstruido por reingenieria desde `SystemThemeSettingResource` de `platform-app`.
> Se ensambla en `contracts/api/openapi.yaml` con `npm run generate:openapi`.

## Endpoints

### GET /api/system/theme
**Trace**: `RF-001` · **Auth**: platform-admin, integration-admin, auditor · Devuelve la configuracion de tema vigente.

### PUT /api/system/theme
**Trace**: `RF-002`, `RF-003` · **Auth**: platform-admin, integration-admin · Actualiza la configuracion de tema/locale/sidebar.

### GET /api/branding
**Trace**: `RF-001` · **Auth**: sin restriccion (@PermitAll: endpoint publico, se sirve sin token) · Devuelve el branding publico (brandName, brandMark, logoDataUri, primaryColor) leido del singleton SystemThemeSetting para que el login de Keycloak pinte la marca en runtime sin redeploy; responde con Access-Control-Allow-Origin: * y Cache-Control: no-store porque lo consume otro origen.

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
  /api/branding:
    get:
      summary: Devuelve el branding publico (brandName, brandMark, logoDataUri, primaryColor) leido del singleton SystemTheme
      operationId: publicBranding
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
