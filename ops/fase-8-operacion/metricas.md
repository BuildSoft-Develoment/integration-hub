# Metricas operativas

## Metricas minimas

- ejecuciones por estado
- latencia de tareas REST
- filas procesadas por minuto
- fallos por proceso y provider
- uso de CPU y memoria
- latencia de PostgreSQL
- ultima ejecucion programada
- tiempo por tarea

## Baseline de capacidad

### DEV

- 4 vCPU
- 8 GB RAM
- 50 GB disco

### PRE

- 4 a 8 vCPU
- 16 GB RAM
- 100 GB disco

### PROD

- 2 nodos de aplicacion Kubernetes
- 4 a 8 vCPU por nodo
- 16 a 32 GB RAM por nodo
- `PostgreSQL` con primary + replica
- `Keycloak` con 2 nodos
