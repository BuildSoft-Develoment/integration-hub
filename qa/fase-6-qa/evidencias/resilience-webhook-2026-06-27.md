# Evidencia resiliencia canal webhook de notificaciones - 2026-06-27

Extiende el circuit breaker (`ResilientHttpSender`, ADR de resiliencia) al canal
webhook de `NotificationTaskProvider`, cerrando un residual de la revision de
arquitectura.

## Alcance

- `NotificationTaskProvider.sendWebhook(...)` enruta el envio saliente por
  `ResilientHttpSender` (timeout + retry sobre IOException + circuit breaker).

## Decision de seguridad

- `RestPaymentTransport` queda EXCLUIDO del sender con reintentos de forma
  deliberada: reintentar un POST de pago puede causar doble pago si la peticion
  llego pero se perdio la respuesta. El webhook si es seguro porque el reintento
  actua solo sobre `IOException` (la peticion no llego a completarse), no sobre
  codigos 5xx ya recibidos.

## Cambios verificados

- Inyeccion de `ResilientHttpSender` en `NotificationTaskProvider`.
- `sendWebhook` usa `httpSender.send(request)` en lugar de `httpClient.send(...)`.
- Se conserva el `httpClient` local para la resolucion del token `login-request`
  en `HttpRequestSupport.build(...)`.

## Compilacion y pruebas backend

### Comando

```bash
mvn -pl platform-app test-compile
mvn -pl platform-app test -Dtest='RestTaskSupportTest,HttpRequestSupportLoginTest,RestPaymentTransportTest'
```

### Resultado

- Compilacion: BUILD SUCCESS.
- Pruebas REST/HTTP (smoke de regresion): 25 run, 0 failures, 0 errors.
- No hay tests especificos de notificacion en el modulo; el cambio es analogo al
  ya validado en `RestCallTaskProvider`.

## Riesgo residual

- Promover 5xx a fallo de infraestructura (para que alimente el breaker) sigue
  pendiente y requiere distinguir 4xx (cliente) de 5xx en el `ResilientHttpSender`
  sin cambiar el epilogo de los providers.
- `RestPaymentTransport` y los gateways MT101 no usan reintentos por la regla de
  no-doble-pago; un breaker sin retry podria evaluarse aparte si se requiere.
