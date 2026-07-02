# Evidencia aislamiento de fallos por plugin - 2026-06-27

Continuacion de la arquitectura frontend modular extensible (ADR-012). Aporta
tolerancia a fallos a la instalacion de plugins externos ("instalables desde
fuera"): un plugin malformado o en conflicto se pone en cuarentena en lugar de
abortar el catalogo o romper el shell.

## Problema

`AppPluginRuntimeRegistry.registerExternalManifests(...)` y el `snapshot`
(`buildAppPluginRegistry`) lanzan ante el primer manifest invalido: ruta
desconocida, enlace no HTTPS, version incompatible, id/ruta duplicada o rutas
Angular declaradas. Como el `snapshot` es un `computed` leido por la navegacion,
acciones y workspaces, un unico plugin externo en conflicto con la plataforma
podia hacer explotar el render y tumbar el shell completo.

## Cambios verificados

- Nuevo `installExternalManifests(...)`: contraparte resiliente que valida cada
  manifest de forma aislada contra la plataforma y los plugins ya aceptados.
  - Reutiliza la validacion existente construyendo el snapshot de forma
    incremental (`[...estaticos, ...aceptados, candidato]`): compatibilidad de
    version y conflictos de id/ruta/workspace/accion se detectan sin duplicar
    logica.
  - Mantiene las garantias de seguridad del metadata-only: sin rutas Angular,
    enlaces solo `https://`, navegacion solo a rutas conocidas del shell.
  - Nunca lanza: devuelve `PluginInstallationReport { accepted, rejected }`.
- Nueva senal `rejected` (cuarentena) con `{ id, reason }` por plugin descartado,
  observable para una futura superficie de diagnostico/admin.
- `loadExternalManifestCatalog(...)` (la via real "desde fuera", catalogo JSON)
  pasa a instalar de forma resiliente en lugar de la via estricta.
- `registerExternalManifests(...)` se conserva estricto (lanza) para registro
  programatico/confiable; su contrato y pruebas no cambian.

## Casos de prueba (app-plugin-runtime.registry.spec.ts)

- Instala plugins validos y pone en cuarentena hermanos invalidos en el mismo
  lote (aislamiento): el valido carga, el malo se descarta con su motivo.
- Un plugin con id en conflicto con la plataforma se pone en cuarentena y el
  shell sigue construyendo su snapshot (navegacion no vacia).
- Plugins con major de plataforma incompatible quedan en cuarentena.
- Manifests que cuelan rutas Angular quedan en cuarentena sin lanzar, y aparecen
  en la senal `rejected`.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 74 passed.
- Tests: 330 passed, 0 failed (4 casos nuevos de aislamiento de plugins).

## Riesgo residual

- La senal `rejected` esta expuesta pero aun no se consume en una vista de
  diagnostico; queda como siguiente incremento (panel de plugins instalados /
  en cuarentena con motivos).
- Sigue siendo metadata-only: la carga de codigo Angular externo (Module
  Federation) y el sandbox de ejecucion por plugin permanecen fuera de alcance y
  requieren ADR de procedencia, firma, versionado y rollback.
- `i18nNamespaces` se valida y sanea pero todavia no se materializa en el
  servicio i18n (diccionarios estaticos en/es).
```
