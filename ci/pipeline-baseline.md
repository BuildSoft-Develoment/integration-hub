# Pipeline baseline

## Objetivo

Describir un pipeline minimo para el estado actual del proyecto.

## Etapas sugeridas

1. checkout
2. validacion de catalogo frontend extensible
3. build de frontend
4. build y test de backend
5. empaquetado del artefacto Quarkus con Quinoa
6. smoke tests
7. promocion por ambiente

## Entradas reales del repositorio

- `pom.xml`
- `platform-app/pom.xml`
- `frontend/package.json`
- scripts `.cmd` de test y arranque

## Validaciones minimas

- pruebas Java
- pruebas frontend
- `npx nx run web:test-plugins` o `npm run test:plugins`
- `npx nx run web:validate-plugins` o `npm run validate:plugins`
- artefacto construible
- evidencias de release
