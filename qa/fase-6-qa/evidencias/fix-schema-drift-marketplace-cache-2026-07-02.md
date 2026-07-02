# Evidencia: fix de schema drift en plugin_marketplace_catalog_cache - 2026-07-02

Corrige un defecto real detectado en el arranque: Hibernate reportaba en cada boot
`ERROR ... Schema validation: missing column [bodyJson] in table
[plugin_marketplace_catalog_cache]`.

## Causa raíz

- La migración `V72__plugin_marketplace_catalog_cache.sql` crea la columna `body_json`
  (snake_case, consistente con el resto de columnas de la tabla).
- La entidad `PluginMarketplaceCatalogCache` declaraba el campo camelCase `bodyJson`
  **sin** `@Column(name = ...)`, así que Hibernate buscaba una columna `bodyJson` que no
  existe. Todos los demás campos multi-palabra de la entidad (`catalogUrl`, `fetchedAt`,
  `expiresAt`, `lastUsedAt`) sí llevan su `@Column(name = "snake_case")`; `bodyJson` era el
  único que lo olvidó.

## Alcance (aislado)

- La validación de schema de Hibernate reporta TODAS las columnas faltantes; el log solo
  listaba `bodyJson`, confirmando que es el único desajuste. No hay otros campos afectados.

## Cambio

- `entity/PluginMarketplaceCatalogCache.java`: el campo `bodyJson` pasa a
  `@Column(name = "body_json", nullable = false, columnDefinition = "text")`.
  (Se alinea la entidad con la migración, que es la realidad de la BD; no hace falta migración.)

## Verificación

- Antes: 6 ocurrencias de `missing column [bodyJson]` en boots previos.
- Tras el fix, el app rearranca (health **200**) y **no aparece ningún `missing column`** en
  el boot posterior (02:27:58) — validación de schema limpia.

```bash
# el error ya no aparece en boots posteriores al fix
grep "missing column" platform-app-dev.out.log | awk '$2 > "02:20:00"'   # (vacío)
```
