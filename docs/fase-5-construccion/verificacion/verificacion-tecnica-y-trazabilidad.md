# Verificacion tecnica y trazabilidad

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Mapa de construccion backend y frontend](../modulos/mapa-construccion-backend-frontend.md)
- Siguiente: [Catalogo de plugins de frontend](../modulos/frontend-plugin-catalog.md)
<!-- nav-guided:end -->

## Objetivo

Concentrar la verificacion minima que acompana la construccion antes de pasar a QA formal.

## Verificaciones tecnicas base

> Los dos runners `test-jdk25.cmd` y `test-quarkus-jdk25.cmd` figuraban aqui como verificaciones
> base y **no verifican nada**: el primero ejecuta `mvn -version` y el segundo `mvn quarkus:dev`.
> Ninguno compila, prueba ni valida. Se retiran de la lista.

- `mvn -B -pl platform-app -am -Pfast-tests verify` (carril rapido: compila y corre unitarios + ITs)
- `mvn -B -o verify` (reactor completo, incluido el carril failsafe)
- `npm run check:all` (gobernanza: trazabilidad, API vs codigo, RBAC vs codigo)
- `npm run build` dentro de `frontend/`
- `npm run test -- --watch=false` dentro de `frontend/`

## Trazabilidad: cosechar ANTES de mirar el panel

El contrato de esta fase (`ci/scripts/_lib/phase-contracts.mjs`, fase 5 `debeValidar`) exige estos
cuatro pasos, y el orden importa:

1. `npm run memory:harvest-trace` — lee las anotaciones `@trace` / `@covers` del codigo
2. `npm run memory:sync` — vuelca `TRACEABILITY_MATRIX.md` y las `traceability.md` a la memoria
3. `npm run check:trace-coverage`
4. `npm run check:trace-drift`

**Sin (1) el panel miente**, y miente hacia el lado peligroso: muestra el resultado de la ultima
cosecha, asi que una anotacion recien escrita no aparece y se lee como "requisito sin cubrir" —
o, peor, una que se borro sigue certificando. Los pasos 3 y 4 validan lo que la memoria tiene, no
lo que hay en disco.

`npm run check:trace-scope` informa ademas cuantas anotaciones siguen SIN cualificar con
`spec <slug>`. Una anotacion desnuda (`@covers RF-006`) no dice de cual de las ocho features es,
porque los RF se numeran por spec: certifica las ocho a la vez, que es como no certificar ninguna.

## Trazabilidad esperada

- la implementacion debe apuntar a una feature de `specs/`
- los resultados deben poder reflejarse luego en `qa/`
- si el cambio altera salida a ambientes, debe dejar referencia en `ops/` o `releases/`

## Riesgos a controlar

- drift entre spec y codigo
- cambios de UI sin actualizacion documental
- cambios operativos sin runbook o rollback
- cambios arquitectonicos sin `ADR`
