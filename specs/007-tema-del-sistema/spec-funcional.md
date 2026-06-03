---
origin: reingenieria
---

# Spec funcional - Tema del sistema

## Objetivo

Permitir configurar la apariencia y preferencias de presentacion de la consola (tema visual,
densidad, paleta de colores, idioma y modo de barra lateral) como un ajuste unico del sistema.

## Actores

- `platform-admin`
- `integration-admin`
- `auditor` (solo lectura)

## Flujo principal

1. El usuario abre la configuracion de tema del sistema.
2. Consulta la configuracion vigente (`GET /api/system/theme`).
3. Ajusta esquema (`scheme`), preset, densidad, colores (`primary`/`error`/`neutral`), idioma (`locale`) y modo de sidebar.
4. Guarda los cambios (`PUT /api/system/theme`).
5. La consola aplica la nueva apariencia.

## Requerimientos

- RF-001 consultar la configuracion de tema y preferencias del sistema.
- RF-002 actualizar tema (`scheme`, `preset`, `density`, colores), `locale` y `sidebar_mode`.
- RF-003 persistir la configuracion como ajuste unico (singleton) del sistema.

## Reglas de negocio

- la configuracion de tema es un ajuste **unico** del sistema (singleton), no por usuario
- solo perfiles administrativos (`platform-admin`, `integration-admin`) pueden modificarla
- `auditor` puede consultarla pero no modificarla
- los valores deben mantenerse dentro de los catalogos soportados (esquema/preset/densidad)

## Criterios de aceptacion

- se puede consultar la configuracion vigente
- se pueden actualizar tema, idioma y modo de sidebar
- el cambio persiste y la consola lo refleja
- (UI) la accion `app-theme-action` y la fachada `app-preferences.facade` permiten cambiar
  preset/density/locale/sidebarMode; `theme.service` aplica el `ThemeConfiguration` de forma
  reactiva y `system-theme-config.service` lo persiste via `/api/system/theme`

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; Fase 2 (prototipo/SPDD) no
aplica (`origin: reingenieria`). Los gates restantes se registran como `pending` hasta su
validacion humana formal.

- `gate-sdd-approved`: pending
- `gate-qa-passed`: pending
