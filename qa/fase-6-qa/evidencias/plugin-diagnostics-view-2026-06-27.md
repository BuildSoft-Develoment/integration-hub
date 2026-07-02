# Evidencia vista de diagnostico de plugins - 2026-06-27

Cierre del ciclo de observabilidad de la arquitectura frontend modular extensible
(ADR-012): superficie de administracion que consume la senal `diagnostics` del
runtime de plugins (instalados + en cuarentena).

## Alcance

- Nueva ruta `/plugins` (capability `admin`) con su entrada de navegacion.
- Componente standalone que lista plugins instalados (origen plataforma/externo) y
  plugins en cuarentena con su motivo.
- Carga diferida via `loadComponent` (sin crear una feature lib nueva).
- i18n en/es con paridad.

## Cambios verificados

- `app/features/plugins/plugin-diagnostics-page.component.ts`: componente
  `OnPush` que inyecta `AppPluginRuntimeRegistry` y deriva `installed()` /
  `quarantined()` de la senal `diagnostics`.
- `platform-plugin.manifest.ts`: ruta `plugins` con `loadComponent` y
  `requiredCapability: admin`.
- `app-section-access.policy.ts`: nueva clave de seccion `plugins` -> `admin`.
- `app-navigation.policy.ts`: entrada de navegacion `plugins` -> `/plugins`.
- Diccionarios en/es: `nav.plugins` y bloque `plugins.*` (titulo, columnas,
  estados vacios, origen).

## Casos de prueba

- `plugin-diagnostics-page.component.spec.ts`: tras instalar un plugin valido y
  uno incompatible, el render muestra la plataforma y el plugin valido como
  instalados y el incompatible (cuarentena) con su id.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 75 passed.
- Tests: 334 passed, 0 failed.
- Sin regresion al agregar la nueva navegacion/ruta al manifest de plataforma
  (incluye el guard de cobertura i18n del manifest y la paridad de diccionarios).

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins`: "Plugin catalog validation passed".
- Chunk diferido `plugin-diagnostics-page-component`: 2.46 kB (836 bytes transfer).
- Initial total: `1.24 MB`. Estimated transfer initial: `246.32 kB`.

## Riesgo residual

- La vista es de solo lectura; acciones de gestion (recargar catalogo, desinstalar)
  quedan como incremento posterior.
- La verificacion en vivo de la ruta requiere sesion OIDC con capability `admin`;
  la evidencia automatizada (unit + build) cubre el render y el empaquetado.
- Materializacion de catalogos de mensajes i18n por plugin y Module Federation
  siguen fuera de alcance (requieren ADR propio).
```
