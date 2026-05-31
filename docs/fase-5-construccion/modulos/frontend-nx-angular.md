# Frontend Nx Angular

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Fase 5 - Construccion](../README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Objetivo

Consolidar la estructura tecnica real del frontend Angular del proyecto y sus convenciones activas de implementacion.

## Estado actual

- el frontend React anterior fue reemplazado por un workspace `Angular 21` sobre `Nx`
- la aplicacion viva esta en `frontend/`
- el frontend se integra con `Quinoa` dentro del despliegue `Quarkus`

## Stack base validado

- `Angular 21`
- `Nx`
- `Angular Material`
- `Angular CDK`
- `Angular Aria`
- `TailwindCSS v4`
- `Signals`
- `keycloak-js`
- `Luxon`
- `Vitest`
- `Playwright`
- `Quinoa`

## Integracion con Quinoa

En `platform-app/src/main/resources/application.properties`:

- `quarkus.quinoa.ui-dir=../frontend`
- `quarkus.quinoa.build-dir=dist/browser`

## Arquitectura base

- `frontend/libs/core/providers`
- `frontend/libs/core/services`
- `frontend/libs/shared/ui`
- `frontend/libs/features/*`

El patron favorece providers y managers en infraestructura, stores y command services en aplicacion, y pages/components en presentacion.

## Convenciones actuales

### Nomenclatura de pages

- `*-page.ts`
- `*-page.html`
- `*-page.css`

### Regla de `catalog`

Usar `catalog` cuando la feature tiene:

- toolbar de filtros y acciones
- lista o tabla principal
- paginacion
- drawer o panel lateral
- store orientado a seleccion, filtros y CRUD

### Regla de `page`

Usar `page` simple en features de:

- resumen
- consulta
- operacion puntual
- lista liviana sin catalogo CRUD completo

### Tokens y providers por dominio

- tokens explicitos por dominio
- implementaciones concretas separadas en `implementations/sources`, `implementations/readers`, `implementations/connections` y `implementations/tasks`

## Patrones de UI actuales

- `overview` como resumen operativo
- catalogos con `toolbar + list/table + drawer`
- `processes` y `executions` con stores por capas y componentes especializados
- feedback contextual con `snack-bar` y mensajes locales sin duplicacion

## Testing y verificacion

- `npm run build`
- `npm run test -- --watch=false`
- `npm run e2e`

## Regla de mantenimiento

Los cambios estructurales del frontend deben reflejarse aqui, en fase 2 si impactan UX y en fase 3 si alteran arquitectura o stack.
