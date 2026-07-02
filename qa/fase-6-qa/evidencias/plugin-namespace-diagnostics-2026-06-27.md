# Evidencia gobernanza i18n y diagnostico de plugins - 2026-06-27

Continuacion de la arquitectura frontend modular extensible (ADR-012), sobre el
aislamiento de fallos por plugin. Consume el ultimo campo declarado-pero-no-usado
del contrato (`i18nNamespaces`) y expone el estado del runtime para una vista de
administracion.

## Alcance

1. Gobernanza de namespaces i18n: un plugin que declara `i18nNamespaces` queda
   obligado a que todas sus claves contribuidas caigan dentro de ellos.
2. Diagnostico observable: senal con plugins instalados (estaticos/externos) y en
   cuarentena, lista para una superficie de admin.

## 1. Gobernanza de namespaces i18n

### Cambios verificados

- `AppPluginRuntimeRegistry`: nuevo
  `assertContributedKeysWithinDeclaredNamespaces(...)`. Cuando un manifest declara
  `i18nNamespaces`, cada clave de navegacion, workspace (label y descripcion),
  accion y confirmacion debe pertenecer a uno de los namespaces; en caso contrario
  se rechaza. Si no declara namespaces, no se restringe (compatibilidad atras).
- Se aplica tanto en la via estricta (`registerExternalManifests`) como en la
  resiliente (`installExternalManifests`), donde una violacion va a cuarentena.
- Build gate `validate-plugin-catalog.js`: misma regla
  (`validateI18nNamespaceScope`) para catalogos JSON externos.

### Casos de prueba

- Runtime: clave fuera del namespace declarado se pone en cuarentena con motivo;
  clave dentro del namespace se acepta.
- Build gate: claves dentro del namespace pasan; clave fuera produce error de
  validacion `outside the declared i18nNamespaces`.

## 2. Diagnostico observable

### Cambios verificados

- `AppPluginRuntimeRegistry.diagnostics` (`computed`): `{ installed, quarantined }`.
  `installed` distingue origen `static` vs `external`; `quarantined` reusa la senal
  `rejected` con `{ id, reason }`.
- Tipos publicos `InstalledPluginInfo` y `PluginDiagnostics` exportados.

### Caso de prueba

- Tras instalar un plugin valido y uno incompatible, `diagnostics()` lista el
  plataforma + el valido como instalados y el incompatible como en cuarentena.

## Validacion de catalogo y tooling

### Comando

```bash
node --test scripts/validate-plugin-catalog.spec.js scripts/manage-plugin-catalog.spec.js
```

### Resultado

- Estado: PASS.
- Tests Node: 24 passed, 0 failed (2 casos nuevos de gobernanza de namespaces).

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 74 passed.
- Tests: 333 passed, 0 failed (gobernanza de namespaces x2, diagnostico x1).

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins`: "Plugin catalog validation passed" (incluye la regla de
  namespaces).
- Initial total: `1.24 MB`. Estimated transfer initial: `246.39 kB`.

## Riesgo residual

- `i18nNamespaces` ya se gobierna (scoping), pero los mensajes de traduccion del
  plugin todavia no se cargan en `I18nService` (diccionarios estaticos en/es); la
  materializacion de catalogos de mensajes por plugin queda como siguiente paso.
- La senal `diagnostics` esta lista pero aun no tiene una vista/route dedicada en
  el shell; es el siguiente incremento de UI.
- Module Federation (codigo Angular externo) y sandbox de ejecucion por plugin
  siguen fuera de alcance: requieren ADR de procedencia, firma, versionado y
  rollback.
```
