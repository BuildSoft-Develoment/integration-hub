# Pipeline baseline

## Objetivo

Describir un pipeline minimo para el estado actual del proyecto.

## Etapas sugeridas

1. checkout
2. build de frontend
3. build y test de backend
4. empaquetado del artefacto Quarkus con Quinoa
5. smoke tests
6. promocion por ambiente

## Entradas reales del repositorio

- `pom.xml`
- `platform-app/pom.xml`
- `frontend/package.json`
- scripts `.cmd` de test y arranque

## Validaciones minimas

- pruebas Java
- pruebas frontend
- artefacto construible
- evidencias de release
