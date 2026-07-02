# Lighthouse CI

Script de auditoria Lighthouse para el frontend de Integration Hub.

## Prerequisitos

1. Servidor de desarrollo corriendo:
   ```bash
   npx nx serve web
   ```

2. Lighthouse CLI instalado (opcional si usas npx):
   ```bash
   npm install -g @lhci/cli
   ```

## Uso

### Script PowerShell (recomendado)

```bash
npm run lighthouse
```

Genera reportes HTML + JSON por cada ruta en `lighthouse-report/`.

### Lighthouse CI (CI/CD)

```bash
npm run lighthouse:ci
```

Usa `lighthouserc.json` con assertions:
- Performance >= 80 (warn)
- Accessibility >= 90 (error)
- Best Practices >= 85 (warn)
- SEO >= 80 (warn)

## Rutas auditadas

| URL | Descripcion |
|-----|-------------|
| `/` | Home |
| `/overview` | Dashboard |
| `/connections` | Catalogo conexiones |
| `/sources` | Catalogo sources |
| `/readers` | Catalogo readers |
| `/processes` | Catalogo procesos |
| `/schedules` | Catalogo schedules |
| `/executions` | Catalogo ejecuciones |
| `/audit` | Audit trail |
| `/payment-rules` | Reglas de pago |

## Output

```
lighthouse-report/
  home.html
  home.report.json
  overview.html
  overview.report.json
  ...
```

## Scores objetivo

| Categoria | Minimo | Nivel |
|-----------|--------|-------|
| Performance | 80 | warn |
| Accessibility | 90 | error |
| Best Practices | 85 | warn |
| SEO | 80 | warn |
