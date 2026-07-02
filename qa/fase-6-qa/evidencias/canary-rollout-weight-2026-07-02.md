# Evidencia: peso de rollout canary por %/segmento (slice) - 2026-07-02

Avanza el gap "orquestación canary por porcentaje/segmento" con un slice acotado y honesto:
configuración de peso canary persistida por versión + **motor de decisión determinista por
segmento** (el núcleo de "%/segmento") + superficie de gestión (UI + endpoints). El
enrutado del split en la ruta de invocación en caliente queda documentado como siguiente
paso (hoy el registry resuelve 1 descriptor por tipo).

## Backend

- **Flyway `V76__plugin_canary_weight.sql`**: `canary_weight INTEGER` en
  `plugin_descriptor_version`. **Aplicada en vivo** (log: "Successfully applied 1 migration,
  now at version v76").
- Entidad `PluginDescriptorVersion.canaryWeight`.
- **`CanaryRolloutSelector`**: `routesToCanary(weight, routingKey)` — decisión determinista
  por segmento (CRC32 del key mod 100): sticky por key, y la cuota a canary aproxima el peso.
- `BackendPluginAdminService.setCanaryWeight(id, version, weight)` (clamp 0-100).
- Endpoints en `PluginDiagnosticsResource`:
  - `POST /api/plugins/{id}/versions/{version}/canary-weight` (admin) — fija el peso.
  - `GET /api/plugins/{id}/canary/route?key=<segmento>` (admin/auditor) — simula la decisión
    de ruta (qué versión atendería ese segmento con el peso actual). Consumidor real del selector.
- `BackendPluginVersionResponse.canaryWeight` mapeado.

### Pruebas backend

```bash
mvn -pl platform-app test -Dtest=CanaryRolloutSelectorTest,PluginDiagnosticsResourceTest,MetricsPluginPromotionGateTest -Dsurefire.failIfNoSpecifiedTests=false
```

- Estado: **BUILD SUCCESS**, **29 tests** (Selector 4: 0%/100%/sticky/distribución;
  Resource 18: +4 nuevos — setCanaryWeight OK/NotFound, canaryRoute a canary/fallback stable;
  Gate 7).

## Frontend

- `BackendPluginVersion.canaryWeight`; columna "Peso canary" en la tabla de Versiones con
  input + "Fijar peso" para versiones de canal canary; `setCanaryWeight()` → POST + refetch.
- i18n en/es: `plugins.col.canaryWeight`, `plugins.setWeight`.

### Pruebas unitarias frontend

```bash
npx nx test web --skip-nx-cache
```

- Estado: **PASS**. Test files: **80 passed**. Tests: **384 passed** (+1: `setCanaryWeight`
  hace `POST .../canary-weight` con `{weight:25}` y refetch).
- Build de producción: **OK** (`npx nx build web` compila limpio, incluido el chunk de plugins).

## Prueba e2e (Playwright) — PENDIENTE de entorno

- Test **escrito**: "sets a canary rollout weight from the versions table" (mock con estado
  de `/api/plugins` + `/canary-weight`; fija 40 en la UI y verifica que el peso se refleja).
- **No ejecutado en esta sesión**: a mitad del trabajo **Docker Desktop se cayó**, dejando
  Postgres y Keycloak indisponibles → la app responde health 500 y el e2e no puede autenticar
  (Keycloak) ni servir con DB. Es un fallo de entorno, ajeno al cambio. Se ejecutará al
  restaurar la stack. El test unitario `setCanaryWeight` cubre el mismo flujo POST y pasa.

## Siguiente paso (documentado)

- Cablear el split en caliente: registrar el descriptor canary junto al stable e invocar
  `CanaryRolloutSelector` en la resolución por tipo (`RemotePluginRegistry`), usando una
  routing key estable (p.ej. execution/connection id) como segmento.
