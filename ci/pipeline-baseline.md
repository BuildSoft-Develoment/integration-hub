# Pipeline baseline

## Objetivo

Describir un pipeline minimo para el estado actual del proyecto.

## Etapas sugeridas

1. checkout
2. validacion de catalogo frontend extensible
3. build de frontend
4. build y test de backend en carril rapido
5. matriz de compatibilidad multi-BD en carril dedicado
6. empaquetado del artefacto Quarkus con Quinoa
7. smoke tests
8. promocion por ambiente

## Entradas reales del repositorio

- `pom.xml`
- `platform-app/pom.xml`
- `frontend/package.json`
- scripts `.cmd` de test y arranque

## Validaciones minimas

- pruebas Java
- carril backend rapido desde raiz: `mvn -B -pl platform-app -am -Pfast-tests verify`
- carril backend multi-BD desde raiz: `mvn -B -pl platform-app -am -Pcompat-db-tests test`
- pruebas frontend
- `npx nx run web:test-plugins` o `npm run test:plugins`
- `npx nx run web:validate-plugins` o `npm run validate:plugins`
- artefacto construible
- evidencias de release
