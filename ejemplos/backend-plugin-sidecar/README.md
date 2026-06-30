# Sidecar backend de referencia

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ejemplos](../README.md)

Ejemplo tecnico compilable para autores de plugins backend out-of-process
(ADR-014). Muestra el flujo minimo:

1. consumir un `AsyncTaskEnvelope` publicado por el core;
2. ejecutar un handler externo aislado;
3. construir un `RemoteTaskResumePayload`;
4. firmar el body crudo con `ResumeCallbackSignature`;
5. llamar a `POST /api/process-executions/resume/{resumeToken}`.

Este ejemplo no reemplaza el runbook oficial. La operacion productiva vive en
`ops/fase-7-deploy/runbook.md`.

## Prueba local

```powershell
mvn -pl platform-contract install
mvn -f ejemplos/backend-plugin-sidecar/pom.xml test
```

## Contrato esperado

- Dependencia publica: `platform-contract`.
- Entrada: `AsyncTaskEnvelope`.
- Salida HTTP: `ResumeCallbackRequest` con URL, body JSON y header
  `X-Signature`.
- Idempotencia: el `idempotencyKey` del envelope se propaga sin modificar al
  callback de resume.
