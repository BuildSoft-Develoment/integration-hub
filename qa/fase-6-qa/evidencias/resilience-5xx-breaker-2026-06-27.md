# Evidencia promocion de 5xx al circuit breaker - 2026-06-27

Cierra el residual de resiliencia: un 5xx del destino remoto alimenta el circuit
breaker, distinguiendolo del error de cliente (4xx) y sin reintentar.

## Diseno

- `ResilientHttpSender.send(...)` lanza `RemoteServerException` cuando el status es
  >= 500. El `@CircuitBreaker` (failOn por defecto = Throwable) lo contabiliza.
- NO se reintenta: `@Retry(retryOn = IOException.class)` solo reintenta fallos de
  E/S; un 5xx en un POST no idempotente no se repite (evita doble efecto).
- Los 4xx no se promueven: son error de cliente y los interpreta cada provider
  (epilogo de estado), sin alimentar el breaker.

## Cambios verificados

- Nueva `RemoteServerException` (con `statusCode`).
- `ResilientHttpSender`: metodo `throwIfServerError(int)` invocado tras el envio.

## Casos de prueba (ResilientHttpSenderTest)

- 503 -> lanza `RemoteServerException` con `statusCode() == 503`.
- 404 y 429 -> no lanza.
- 200 y 204 -> no lanza.

## Pruebas backend

### Comando

```bash
mvn -pl platform-app test -Dtest='ResilientHttpSenderTest,RestTaskSupportTest,HttpRequestSupportLoginTest'
```

### Resultado

- Estado: BUILD SUCCESS.
- Tests: 13 run, 0 failures, 0 errors (3 nuevos de `ResilientHttpSenderTest`).

## Riesgo residual

- El epilogo de los providers (`RestCallTaskProvider`, `NotificationTaskProvider`)
  ahora ve solo 2xx-4xx; un 5xx sale como `RemoteServerException` antes del chequeo
  de estado, con mensaje claro. Sin regresion en las pruebas existentes.
