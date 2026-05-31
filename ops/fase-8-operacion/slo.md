# SLO / SLI del Integration Hub

Objetivos de nivel de servicio (fase 8). Los SLI se miden con la telemetria
OpenTelemetry expuesta por la plataforma.

| SLO | Objetivo | SLI |
|---|---|---|
| Disponibilidad de la API | 99.5% mensual | Ratio de respuestas no-5xx |
| Latencia de la API | p95 < 500 ms | Histograma de latencia HTTP |
| Exito de ejecuciones | 99% diario | Ejecuciones COMPLETED / total |
| Frescura de procesamiento | < 5 min de retraso | Edad del ultimo lote procesado |

## Presupuesto de error
- El presupuesto de error mensual se consume con cada incidente.
- Al agotarse, se congelan cambios no criticos hasta recuperar el SLO.
