# Evidencia QA - Observabilidad y auditoria

Fecha: 2026-06-14.

## Alcance

- Auditoria asincrona P0/P1: spool durable, relay con lease/backoff/DEAD,
  consumer batch multi-broker y DLQ.
- UI de operacion: `/audit/spool`.
- UI de diagnostico MT101 masivo: `/audit/mt101-fragments`.
- Contrato de trazabilidad por registro se mantiene en `/audit/record-lineage`.

## Resultados

| Area | Comando / evidencia | Resultado | Nota |
|---|---|---|---|
| Compilacion backend + consumer | `mvn -q -pl platform-contract,platform-app,audit-consumer -DskipTests compile` | PASS | Valida DTOs, resources, repositorios, relay y consumer. |
| Consumer audit batch/DLQ | `mvn -q -pl audit-consumer -am test` | PASS | Incluye PROCESS/RECORD/poison en batch, writer idempotente y cold-store Postgres. |
| Broker SPI raw | `mvn -q -pl platform-app -am "-Dtest=RawBrokerProvidersTest" "-Dsurefire.failIfNoSpecifiedTests=false" test` | PASS | RabbitMQ, Redis y JMS devuelven fallo publicable sin lanzar si broker no existe. |
| Frontend build | `cmd.exe /c npx nx build web --configuration=development --skip-nx-cache` | PASS | Rutas y componentes `audit-spool` y `mt101-fragment-lookup` compilan. |
| Frontend tests | `cmd.exe /c npx nx test web --skip-nx-cache` | PASS | 50 archivos, 169 tests. |
| MT101_PAY accepted() | `mvn -q -pl platform-app -am "-Dtest=Mt101PayTaskProviderTest,Mt101PayFragmentReprocessTest" "-Dsurefire.failIfNoSpecifiedTests=false" test` | PASS | `accepted=false` sin `lastError` se cuenta como rechazo y no como enviado. |
| Browser local | `http://localhost:8080/audit/spool` | BLOCKED | El navegador integrado recibio `ERR_CONNECTION_REFUSED`; no habia runtime local activo en 8080. |

## Cobertura por requerimiento

| RF | Estado QA | Evidencia |
|---|---|---|
| RF-006 auditoria asincrona obligatoria | PASS tecnico | Maven compile + `audit-consumer -am test` + `RawBrokerProvidersTest`. |
| RF-007 trazabilidad por registro | PASS regresion | Se conserva API/modelos; frontend test completo sigue verde. |
| RF-008 operacion de spool | PASS build/API | API compila, UI build/test pasan; falta evidencia visual con runtime activo. |
| RF-009 fragmento MT101 por fila origen | PASS build/API | API compila, UI build/test pasan; falta prueba web con datos reales cargados. |

## Riesgos residuales

- Falta evidencia browser porque `platform-app` no estaba levantado en
  `localhost:8080` durante esta corrida.
- Las pruebas P0/P1 son tecnicas; la certificacion operativa debe repetir con
  stack Docker completo (Postgres + Kafka + audit-consumer + platform-app) y
  datos MT101 masivos cargados.
