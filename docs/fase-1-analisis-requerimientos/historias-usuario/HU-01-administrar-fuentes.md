# HU-01 Administrar fuentes

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UC-04 Monitorear y reprocesar ejecucion](../casos-de-uso/UC-04-monitorear-y-reprocesar-ejecucion.md)
- Siguiente: [HU-02 Configurar readers](HU-02-configurar-readers.md)
<!-- nav-guided:end -->

## Como

`Integration Admin`

## Quiero

configurar y validar fuentes de datos reutilizables

## Para

poder alimentar procesos de integracion con conectividad controlada y trazable

## Criterios de aceptacion

- permite registrar fuentes `filesystem`, `ftp`, `sftp` y `rest`
- persiste parametros de conexion y configuracion
- permite validar conectividad cuando aplica
- deja la fuente disponible para procesos autorizados

## Reglas de negocio

- solo perfiles administrativos crean o editan fuentes
- las credenciales deben resolverse de forma segura
