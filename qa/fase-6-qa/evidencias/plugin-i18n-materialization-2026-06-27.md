# Evidencia materializacion de mensajes i18n por plugin - 2026-06-27

Incremento de la arquitectura frontend modular extensible (ADR-012). Da a la
plataforma la capacidad de materializar traducciones aportadas por plugins, con
la garantia de que las claves base nunca pueden ser secuestradas.

## Alcance

- `I18nService` con overlay de mensajes por locale.
- `registerMessages(locale, messages)`: las claves base de plataforma siempre
  ganan; las claves colisionantes se ignoran y se devuelven al llamante.
- Resolucion `t(...)`: base de plataforma > overlay de plugin > la propia clave.

## Cambios verificados

- `I18nService.dictionary` pasa a fusionar overlay + base (base con prioridad).
- Nuevo `registerMessages(locale, messages)` que retorna las claves ignoradas por
  colision con el core.
- Sin cambio de comportamiento para claves existentes (la base mantiene su valor).

## Casos de prueba (i18n.service.spec.ts)

- Resuelve mensajes de plugin registrados para el locale activo.
- Un plugin nunca sobrescribe una clave base (`nav.audit` sigue siendo "Audit" y
  la clave se reporta como ignorada).
- Los mensajes de plugin quedan acotados a su locale.
- Se interpolan variables en mensajes de plugin.
- Una clave sin traduccion devuelve la propia clave.

## Pruebas unitarias frontend

### Comando

```bash
npx nx test web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- Test files: 76 passed.
- Tests: 339 passed, 0 failed (5 casos nuevos de i18n).

## Build productivo frontend

### Comando

```bash
npx nx build web --skip-nx-cache
```

### Resultado

- Estado: PASS.
- `web:validate-plugins`: "Plugin catalog validation passed".
- Initial total: `1.24 MB`. Estimated transfer initial: `246.40 kB`.

## Riesgo residual

- El servicio ya materializa mensajes, pero el origen del catalogo de mensajes
  por plugin (provider estatico o bloque en el manifest) queda como punto de
  conexion siguiente; hoy se consume via `registerMessages` directamente.
- La gobernanza de scoping de `i18nNamespaces` (ya implementada) y esta
  materializacion son complementarias: el scoping valida que claves declara un
  plugin, esta capacidad las hace resolubles.
- Module Federation (codigo Angular externo) se especifica en
  [ADR-013](../../fase-3-arquitectura/adr/ADR-013-frontend-module-federation-remote-plugins.md),
  en estado Propuesto.
```
