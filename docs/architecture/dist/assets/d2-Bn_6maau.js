function n(r){switch(r){case"index":return`direction: down\r
\r
User: {\r
  label: "Usuario de negocio"\r
  shape: c4-person\r
}\r
Admin: {\r
  label: "Administrador de integraciones"\r
  shape: c4-person\r
}\r
PlatformAdmin: {\r
  label: "Platform Admin"\r
  shape: c4-person\r
}\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
Operator: {\r
  label: "Operator"\r
  shape: c4-person\r
}\r
Auditor: {\r
  label: "Auditor"\r
  shape: c4-person\r
}\r
InfraTeam: {\r
  label: "Equipo de infraestructura"\r
  shape: c4-person\r
}\r
SchedulerActor: {\r
  label: "Scheduler"\r
  shape: c4-person\r
}\r
AppService: {\r
  label: "Integration Hub Service"\r
}\r
Vault: {\r
  label: "Kubernetes Secrets / External Config"\r
}\r
LoadBalancer: {\r
  label: "Load Balancer / Reverse Proxy"\r
}\r
SharedStorage: {\r
  label: "Shared File Storage"\r
}\r
IngressController: {\r
  label: "Ingress Controller"\r
}\r
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
FileSources: {\r
  label: "Source Providers"\r
}\r
Observability: {\r
  label: "Observabilidad"\r
}\r
\r
User -> LoadBalancer: "Accede por HTTPS"\r
User -> IntegrationHub: "Consulta estado y resultados"\r
Admin -> LoadBalancer: "Administra por HTTPS"\r
Admin -> IntegrationHub: "Configura fuentes, readers y procesos"\r
PlatformAdmin -> Iam: "UC-09"\r
PlatformAdmin -> Vault: "UC-10"\r
IntegrationAdmin -> IntegrationHub: "UC-01, UC-02, UC-03"\r
Operator -> IntegrationHub: "UC-04, UC-06, UC-08"\r
Auditor -> IntegrationHub: "UC-06, UC-07"\r
InfraTeam -> LoadBalancer: "UC-10"\r
InfraTeam -> IngressController: "UC-10"\r
InfraTeam -> SharedStorage: "UC-10"\r
SchedulerActor -> IntegrationHub: "UC-05"\r
IntegrationHub -> ExternalApi: "[...]"\r
IntegrationHub -> Iam: "[...]"\r
IntegrationHub -> Db: "[...]"\r
LoadBalancer -> IngressController: "Reenvia trafico al cluster"\r
Vault -> IntegrationHub: "Entrega secretos y credenciales"\r
SharedStorage -> IntegrationHub: "Comparte archivos locales"\r
IntegrationHub -> FileSources: "[...]"\r
IntegrationHub -> Observability: "Exporta trazas"\r
`;case"context":return`direction: down\r
\r
User: {\r
  label: "Usuario de negocio"\r
  shape: c4-person\r
}\r
Admin: {\r
  label: "Administrador de integraciones"\r
  shape: c4-person\r
}\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
Operator: {\r
  label: "Operator"\r
  shape: c4-person\r
}\r
Auditor: {\r
  label: "Auditor"\r
  shape: c4-person\r
}\r
InfraTeam: {\r
  label: "Equipo de infraestructura"\r
  shape: c4-person\r
}\r
SchedulerActor: {\r
  label: "Scheduler"\r
  shape: c4-person\r
}\r
PlatformAdmin: {\r
  label: "Platform Admin"\r
  shape: c4-person\r
}\r
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
FileSources: {\r
  label: "Source Providers"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
Observability: {\r
  label: "Observabilidad"\r
}\r
\r
User -> IntegrationHub: "Consulta estado y resultados"\r
Admin -> IntegrationHub: "Configura fuentes, readers y procesos"\r
IntegrationAdmin -> IntegrationHub: "UC-01, UC-02, UC-03"\r
Operator -> IntegrationHub: "UC-04, UC-06, UC-08"\r
Auditor -> IntegrationHub: "UC-06, UC-07"\r
SchedulerActor -> IntegrationHub: "UC-05"\r
PlatformAdmin -> Iam: "UC-09"\r
IntegrationHub -> Iam: "[...]"\r
IntegrationHub -> Db: "[...]"\r
IntegrationHub -> FileSources: "[...]"\r
IntegrationHub -> ExternalApi: "[...]"\r
IntegrationHub -> Observability: "Exporta trazas"\r
`;case"containers":return`direction: down\r
\r
User: {\r
  label: "Usuario de negocio"\r
  shape: c4-person\r
}\r
Admin: {\r
  label: "Administrador de integraciones"\r
  shape: c4-person\r
}\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
Operator: {\r
  label: "Operator"\r
  shape: c4-person\r
}\r
Auditor: {\r
  label: "Auditor"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsole: {\r
  label: "Admin Console"\r
}\r
IntegrationHubQuarkusApp: {\r
  label: "Quarkus Native App"\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
FileSources: {\r
  label: "Source Providers"\r
\r
  Filesystem: {\r
    label: "File System"\r
  }\r
  Ftp: {\r
    label: "FTP"\r
  }\r
  Sftp: {\r
    label: "SFTP"\r
  }\r
  RestSource: {\r
    label: "REST Source"\r
  }\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
ObservabilityOtel: {\r
  label: "OpenTelemetry Collector"\r
}\r
ObservabilityJaeger: {\r
  label: "Jaeger"\r
}\r
\r
IntegrationHubAdminConsole -> IntegrationHubQuarkusApp: "Invoca APIs protegidas"\r
User -> IntegrationHubAdminConsole: "Consulta estado y resultados"\r
Admin -> IntegrationHubAdminConsole: "Configura fuentes, readers y procesos"\r
IntegrationAdmin -> IntegrationHubAdminConsole: "UC-01, UC-02, UC-03"\r
Operator -> IntegrationHubAdminConsole: "UC-04, UC-06, UC-08"\r
Auditor -> IntegrationHubAdminConsole: "UC-06, UC-07"\r
IntegrationHubAdminConsole -> Iam: "Autenticacion OIDC"\r
IntegrationHubQuarkusApp -> Iam: "Valida access tokens"\r
IntegrationHubQuarkusApp -> Db: "Persiste configuracion, jobs, auditoria y staging"\r
IntegrationHubQuarkusApp -> FileSources.Filesystem: "Lee archivos locales"\r
IntegrationHubQuarkusApp -> FileSources.Ftp: "Descarga archivos"\r
IntegrationHubQuarkusApp -> FileSources.Sftp: "Descarga archivos"\r
IntegrationHubQuarkusApp -> FileSources.RestSource: "Obtiene payloads remotos"\r
IntegrationHubQuarkusApp -> ExternalApi: "Invoca APIs de negocio"\r
IntegrationHubQuarkusApp -> ObservabilityOtel: "Exporta trazas"\r
ObservabilityOtel -> ObservabilityJaeger: "Entrega trazas"\r
`;case"components":return`direction: down\r
\r
IntegrationHubQuarkusAppAdminApi: {\r
  label: "Admin API"\r
}\r
IntegrationHubQuarkusAppExecutionApi: {\r
  label: "Execution API"\r
}\r
IntegrationHubQuarkusAppQueryApi: {\r
  label: "Query API"\r
}\r
IntegrationHubQuarkusAppScheduler: {\r
  label: "Scheduler"\r
}\r
IntegrationHubQuarkusAppProcessEngine: {\r
  label: "Process Engine"\r
}\r
IntegrationHubQuarkusAppSourceRegistry: {\r
  label: "Source Provider Registry"\r
}\r
IntegrationHubQuarkusAppReaderRegistry: {\r
  label: "Reader Provider Registry"\r
}\r
IntegrationHubQuarkusAppTaskRegistry: {\r
  label: "Task Provider Registry"\r
}\r
IntegrationHubQuarkusAppAuditService: {\r
  label: "Audit Service"\r
}\r
IntegrationHubQuarkusAppTelemetry: {\r
  label: "OpenTelemetry Instrumentation"\r
}\r
IntegrationHubQuarkusAppSourceProviders: {\r
  label: "Source Providers"\r
}\r
IntegrationHubQuarkusAppReaderProviders: {\r
  label: "Reader Providers"\r
}\r
IntegrationHubQuarkusAppTaskProviders: {\r
  label: "Task Providers"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
FileSourcesFilesystem: {\r
  label: "File System"\r
}\r
FileSourcesFtp: {\r
  label: "FTP"\r
}\r
FileSourcesSftp: {\r
  label: "SFTP"\r
}\r
FileSourcesRestSource: {\r
  label: "REST Source"\r
}\r
ObservabilityOtel: {\r
  label: "OpenTelemetry Collector"\r
}\r
\r
IntegrationHubQuarkusAppAdminApi -> IntegrationHubQuarkusAppProcessEngine: "Configura definiciones"\r
IntegrationHubQuarkusAppExecutionApi -> IntegrationHubQuarkusAppProcessEngine: "Inicia ejecuciones"\r
IntegrationHubQuarkusAppQueryApi -> IntegrationHubQuarkusAppAuditService: "Consulta eventos"\r
IntegrationHubQuarkusAppScheduler -> IntegrationHubQuarkusAppProcessEngine: "Dispara procesos programados"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppSourceRegistry: "Resuelve fuente"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppReaderRegistry: "Resuelve reader"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTaskRegistry: "Resuelve tarea"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTaskProviders: "[...]"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppAuditService: "Registra eventos"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTelemetry: "Crea spans"\r
IntegrationHubQuarkusAppSourceRegistry -> IntegrationHubQuarkusAppSourceProviders: "Usa implementations"\r
IntegrationHubQuarkusAppReaderRegistry -> IntegrationHubQuarkusAppReaderProviders: "Usa implementations"\r
IntegrationHubQuarkusAppTaskRegistry -> IntegrationHubQuarkusAppTaskProviders: "Usa implementations"\r
IntegrationHubQuarkusAppProcessEngine -> Db: "Persiste definiciones y tasks"\r
IntegrationHubQuarkusAppTaskProviders -> Db: "Batch insert, update y upsert"\r
IntegrationHubQuarkusAppTaskProviders -> ExternalApi: "[...]"\r
`;case"engine":return`direction: down\r
\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService: {\r
  label: "ProcessExecutionService"\r
}\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper: {\r
  label: "JsonConfigurationMapper"\r
}\r
IntegrationHubQuarkusAppSourceRegistry: {\r
  label: "Source Provider Registry"\r
}\r
IntegrationHubQuarkusAppReaderRegistry: {\r
  label: "Reader Provider Registry"\r
}\r
IntegrationHubQuarkusAppTaskRegistry: {\r
  label: "Task Provider Registry"\r
}\r
IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider: {\r
  label: "DbWriteTaskProvider"\r
}\r
IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider: {\r
  label: "RestCallTaskProvider"\r
}\r
IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider: {\r
  label: "NotificationTaskProvider"\r
}\r
IntegrationHubQuarkusAppAuditService: {\r
  label: "Audit Service"\r
}\r
IntegrationHubQuarkusAppTelemetry: {\r
  label: "OpenTelemetry Instrumentation"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService -> IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper: "Lee configuracion JSON"\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService -> IntegrationHubQuarkusAppSourceRegistry: "Resuelve SourceProvider"\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService -> IntegrationHubQuarkusAppReaderRegistry: "Resuelve ReaderProvider"\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService -> IntegrationHubQuarkusAppTaskRegistry: "Resuelve TaskProvider"\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService -> IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider: "Ejecuta DB_WRITE"\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService -> IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider: "Ejecuta REST_CALL"\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService -> IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider: "Ejecuta NOTIFICATION"\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService -> Db: "Persiste definiciones y tasks"\r
IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider -> Db: "Batch insert, update y upsert"\r
IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider -> ExternalApi: "Envia payloads"\r
IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider -> ExternalApi: "Webhook y notificaciones"\r
`;case"security":return`direction: down\r
\r
User: {\r
  label: "Usuario de negocio"\r
  shape: c4-person\r
}\r
Admin: {\r
  label: "Administrador de integraciones"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsole: {\r
  label: "Admin Console"\r
\r
  ReactApp: {\r
    label: "React + PatternFly UI"\r
  }\r
  OidcClient: {\r
    label: "OIDC Client"\r
  }\r
  ProcessDesigner: {\r
    label: "Process Designer"\r
  }\r
  OperationsConsole: {\r
    label: "Operations Console"\r
  }\r
}\r
IntegrationHubQuarkusApp: {\r
  label: "Quarkus Native App"\r
\r
  AdminApi: {\r
    label: "Admin API"\r
  }\r
  ExecutionApi: {\r
    label: "Execution API"\r
  }\r
  QueryApi: {\r
    label: "Query API"\r
  }\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
\r
IntegrationHubAdminConsole.ReactApp -> IntegrationHubAdminConsole.OidcClient: "Gestiona sesion"\r
IntegrationHubAdminConsole.ReactApp -> IntegrationHubAdminConsole.ProcessDesigner: "Edita pipelines"\r
IntegrationHubAdminConsole.ReactApp -> IntegrationHubAdminConsole.OperationsConsole: "Consulta ejecuciones"\r
IntegrationHubAdminConsole.ProcessDesigner -> IntegrationHubQuarkusApp.AdminApi: "CRUD de catalogos y procesos"\r
IntegrationHubAdminConsole.OperationsConsole -> IntegrationHubQuarkusApp.ExecutionApi: "Ejecuta procesos"\r
IntegrationHubAdminConsole.OperationsConsole -> IntegrationHubQuarkusApp.QueryApi: "Consulta jobs y auditoria"\r
IntegrationHubAdminConsole.OidcClient -> Iam: "Login y refresh token"\r
IntegrationHubQuarkusApp -> Iam: "Valida access tokens"\r
`;case"ingestion":return`direction: down\r
\r
IntegrationHubQuarkusAppProcessEngine: {\r
  label: "Process Engine"\r
}\r
IntegrationHubQuarkusAppSourceRegistry: {\r
  label: "Source Provider Registry"\r
}\r
IntegrationHubQuarkusAppReaderRegistry: {\r
  label: "Reader Provider Registry"\r
}\r
IntegrationHubQuarkusAppTaskRegistry: {\r
  label: "Task Provider Registry"\r
}\r
IntegrationHubQuarkusAppTaskProviders: {\r
  label: "Task Providers"\r
\r
  DbWriteTaskProvider: {\r
    label: "DbWriteTaskProvider"\r
  }\r
}\r
IntegrationHubQuarkusAppSourceProviders: {\r
  label: "Source Providers"\r
}\r
IntegrationHubQuarkusAppReaderProviders: {\r
  label: "Reader Providers"\r
}\r
FileSourcesFilesystem: {\r
  label: "File System"\r
}\r
FileSourcesFtp: {\r
  label: "FTP"\r
}\r
FileSourcesSftp: {\r
  label: "SFTP"\r
}\r
FileSourcesRestSource: {\r
  label: "REST Source"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppSourceRegistry: "Resuelve fuente"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppReaderRegistry: "Resuelve reader"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTaskRegistry: "Resuelve tarea"\r
IntegrationHubQuarkusAppSourceRegistry -> IntegrationHubQuarkusAppSourceProviders: "Usa implementations"\r
IntegrationHubQuarkusAppReaderRegistry -> IntegrationHubQuarkusAppReaderProviders: "Usa implementations"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider: "Ejecuta DB_WRITE"\r
IntegrationHubQuarkusAppProcessEngine -> Db: "Persiste definiciones y tasks"\r
IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider -> Db: "Batch insert, update y upsert"\r
`;case"observability":return`direction: down\r
\r
IntegrationHubAdminConsole: {\r
  label: "Admin Console"\r
\r
  OperationsConsole: {\r
    label: "Operations Console"\r
  }\r
}\r
IntegrationHubQuarkusApp: {\r
  label: "Quarkus Native App"\r
\r
  QueryApi: {\r
    label: "Query API"\r
  }\r
  Telemetry: {\r
    label: "OpenTelemetry Instrumentation"\r
  }\r
  AuditService: {\r
    label: "Audit Service"\r
  }\r
}\r
ObservabilityOtel: {\r
  label: "OpenTelemetry Collector"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
ObservabilityJaeger: {\r
  label: "Jaeger"\r
}\r
\r
IntegrationHubAdminConsole.OperationsConsole -> IntegrationHubQuarkusApp.QueryApi: "Consulta jobs y auditoria"\r
IntegrationHubQuarkusApp.QueryApi -> IntegrationHubQuarkusApp.AuditService: "Consulta eventos"\r
ObservabilityOtel -> ObservabilityJaeger: "Entrega trazas"\r
IntegrationHubQuarkusApp -> ObservabilityOtel: "Exporta trazas"\r
IntegrationHubQuarkusApp -> Db: "Persiste configuracion, jobs, auditoria y staging"\r
`;case"runtime":return`direction: down\r
\r
IntegrationHubQuarkusAppScheduler: {\r
  label: "Scheduler"\r
}\r
IntegrationHubQuarkusAppExecutionApi: {\r
  label: "Execution API"\r
}\r
IntegrationHubQuarkusAppProcessEngine: {\r
  label: "Process Engine"\r
\r
  ProcessExecutionService: {\r
    label: "ProcessExecutionService"\r
  }\r
  ProcessCatalogService: {\r
    label: "ProcessCatalogService"\r
  }\r
  JsonConfigurationMapper: {\r
    label: "JsonConfigurationMapper"\r
  }\r
}\r
IntegrationHubQuarkusAppAuditService: {\r
  label: "Audit Service"\r
}\r
IntegrationHubQuarkusAppTelemetry: {\r
  label: "OpenTelemetry Instrumentation"\r
}\r
IntegrationHubQuarkusAppTaskRegistry: {\r
  label: "Task Provider Registry"\r
}\r
IntegrationHubQuarkusAppTaskProviders: {\r
  label: "Task Providers"\r
\r
  DbWriteTaskProvider: {\r
    label: "DbWriteTaskProvider"\r
  }\r
  RestCallTaskProvider: {\r
    label: "RestCallTaskProvider"\r
  }\r
  NotificationTaskProvider: {\r
    label: "NotificationTaskProvider"\r
  }\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
\r
IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -> IntegrationHubQuarkusAppProcessEngine.JsonConfigurationMapper: "Lee configuracion JSON"\r
IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -> IntegrationHubQuarkusAppTaskRegistry: "Resuelve TaskProvider"\r
IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -> IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider: "Ejecuta DB_WRITE"\r
IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -> IntegrationHubQuarkusAppTaskProviders.RestCallTaskProvider: "Ejecuta REST_CALL"\r
IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -> IntegrationHubQuarkusAppTaskProviders.NotificationTaskProvider: "Ejecuta NOTIFICATION"\r
IntegrationHubQuarkusAppProcessEngine.ProcessCatalogService -> Db: "Persiste definiciones y tasks"\r
IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider -> Db: "Batch insert, update y upsert"\r
IntegrationHubQuarkusAppTaskProviders.RestCallTaskProvider -> ExternalApi: "Envia payloads"\r
IntegrationHubQuarkusAppTaskProviders.NotificationTaskProvider -> ExternalApi: "Webhook y notificaciones"\r
IntegrationHubQuarkusAppScheduler -> IntegrationHubQuarkusAppProcessEngine: "Dispara procesos programados"\r
IntegrationHubQuarkusAppExecutionApi -> IntegrationHubQuarkusAppProcessEngine: "Inicia ejecuciones"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppAuditService: "Registra eventos"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTelemetry: "Crea spans"\r
`;case"access":return`direction: down\r
\r
PlatformAdmin: {\r
  label: "Platform Admin"\r
  shape: c4-person\r
}\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
Operator: {\r
  label: "Operator"\r
  shape: c4-person\r
}\r
Auditor: {\r
  label: "Auditor"\r
  shape: c4-person\r
}\r
User: {\r
  label: "Usuario de negocio"\r
  shape: c4-person\r
}\r
Admin: {\r
  label: "Administrador de integraciones"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsole: {\r
  label: "Admin Console"\r
\r
  ReactApp: {\r
    label: "React + PatternFly UI"\r
  }\r
  OidcClient: {\r
    label: "OIDC Client"\r
  }\r
  ProcessDesigner: {\r
    label: "Process Designer"\r
  }\r
  OperationsConsole: {\r
    label: "Operations Console"\r
  }\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
IntegrationHubQuarkusApp: {\r
  label: "Quarkus Native App"\r
\r
  AdminApi: {\r
    label: "Admin API"\r
  }\r
  ExecutionApi: {\r
    label: "Execution API"\r
  }\r
  QueryApi: {\r
    label: "Query API"\r
  }\r
}\r
\r
PlatformAdmin -> Iam: "UC-09"\r
IntegrationAdmin -> IntegrationHubAdminConsole.ProcessDesigner: "UC-01, UC-02, UC-03"\r
Operator -> IntegrationHubAdminConsole.OperationsConsole: "UC-04, UC-06, UC-08"\r
Auditor -> IntegrationHubAdminConsole.OperationsConsole: "UC-06, UC-07"\r
IntegrationHubAdminConsole.OidcClient -> Iam: "Login y refresh token"\r
IntegrationHubAdminConsole.ReactApp -> IntegrationHubAdminConsole.OidcClient: "Gestiona sesion"\r
IntegrationHubAdminConsole.ReactApp -> IntegrationHubAdminConsole.ProcessDesigner: "Edita pipelines"\r
IntegrationHubAdminConsole.ReactApp -> IntegrationHubAdminConsole.OperationsConsole: "Consulta ejecuciones"\r
IntegrationHubAdminConsole.ProcessDesigner -> IntegrationHubQuarkusApp.AdminApi: "CRUD de catalogos y procesos"\r
IntegrationHubAdminConsole.OperationsConsole -> IntegrationHubQuarkusApp.ExecutionApi: "Ejecuta procesos"\r
IntegrationHubAdminConsole.OperationsConsole -> IntegrationHubQuarkusApp.QueryApi: "Consulta jobs y auditoria"\r
User -> IntegrationHubAdminConsole: "Consulta estado y resultados"\r
Admin -> IntegrationHubAdminConsole: "Configura fuentes, readers y procesos"\r
`;case"deployment_dev":return`direction: down\r
\r
DevApp: {\r
  label: "app"\r
\r
  DockerHost: {\r
    label: "dockerHost"\r
\r
    AdminConsole: {\r
      label: "Admin Console"\r
    }\r
    QuarkusApp: {\r
      label: "Quarkus Native App"\r
    }\r
  }\r
}\r
DevData: {\r
  label: "data"\r
\r
  Data: {\r
    label: "data"\r
\r
    Iam: {\r
      label: "Keycloak"\r
    }\r
    Db: {\r
      label: "PostgreSQL"\r
    }\r
    Otel: {\r
      label: "OpenTelemetry Collector"\r
    }\r
    Jaeger: {\r
      label: "Jaeger"\r
    }\r
  }\r
}\r
\r
DevApp.DockerHost.AdminConsole -> DevApp.DockerHost.QuarkusApp: "[...]"\r
DevData.Data.Otel -> DevData.Data.Jaeger: "Entrega trazas"\r
DevApp.DockerHost.AdminConsole -> DevData.Data.Iam: "[...]"\r
DevApp.DockerHost.QuarkusApp -> DevData.Data.Db: "[...]"\r
DevApp.DockerHost.QuarkusApp -> DevData.Data.Iam: "Valida access tokens"\r
DevApp.DockerHost.QuarkusApp -> DevData.Data.Otel: "Exporta trazas"\r
`;case"deployment_pre":return`direction: down\r
\r
PreServices: {\r
  label: "services"\r
\r
  ConfigNode: {\r
    label: "configNode"\r
\r
    Vault: {\r
      label: "Kubernetes Secrets / External Config"\r
    }\r
    SharedStorage: {\r
      label: "Shared File Storage"\r
    }\r
  }\r
}\r
PreApp: {\r
  label: "app"\r
\r
  PreNode1: {\r
    label: "preNode1"\r
\r
    AdminConsole: {\r
      label: "Admin Console"\r
    }\r
    QuarkusApp: {\r
      label: "Quarkus Native App"\r
    }\r
  }\r
}\r
PreData: {\r
  label: "data"\r
\r
  Data: {\r
    label: "data"\r
\r
    Iam: {\r
      label: "Keycloak"\r
    }\r
    Db: {\r
      label: "PostgreSQL"\r
    }\r
    Otel: {\r
      label: "OpenTelemetry Collector"\r
    }\r
    Jaeger: {\r
      label: "Jaeger"\r
    }\r
  }\r
}\r
\r
PreApp.PreNode1.AdminConsole -> PreApp.PreNode1.QuarkusApp: "[...]"\r
PreData.Data.Otel -> PreData.Data.Jaeger: "Entrega trazas"\r
PreApp.PreNode1.AdminConsole -> PreData.Data.Iam: "[...]"\r
PreApp.PreNode1.QuarkusApp -> PreData.Data.Db: "[...]"\r
PreApp.PreNode1.QuarkusApp -> PreData.Data.Iam: "Valida access tokens"\r
PreApp.PreNode1.QuarkusApp -> PreData.Data.Otel: "Exporta trazas"\r
PreServices.ConfigNode.Vault -> PreApp.PreNode1.QuarkusApp: "Entrega secretos y credenciales"\r
PreServices.ConfigNode.SharedStorage -> PreApp.PreNode1.QuarkusApp: "Comparte archivos locales"\r
`;case"deployment_prod":return`direction: down\r
\r
ProdEdge: {\r
  label: "edge"\r
\r
  LoadBalancer: {\r
    label: "loadBalancer"\r
\r
    LoadBalancer: {\r
      label: "Load Balancer / Reverse Proxy"\r
    }\r
  }\r
}\r
ProdServices: {\r
  label: "services"\r
\r
  ServicesNode: {\r
    label: "servicesNode"\r
\r
    Vault: {\r
      label: "Kubernetes Secrets / External Config"\r
    }\r
    SharedStorage: {\r
      label: "Shared File Storage"\r
    }\r
  }\r
}\r
ProdApp: {\r
  label: "app"\r
\r
  AppCluster: {\r
    label: "appCluster"\r
\r
    IngressController: {\r
      label: "ingressController"\r
\r
      IngressController: {\r
        label: "Ingress Controller"\r
      }\r
    }\r
    AppService: {\r
      label: "Integration Hub Service"\r
    }\r
    AppPod1: {\r
      label: "appPod1"\r
\r
      AdminConsole: {\r
        label: "Admin Console"\r
      }\r
      QuarkusApp: {\r
        label: "Quarkus Native App"\r
      }\r
    }\r
    AppPod2: {\r
      label: "appPod2"\r
\r
      AdminConsole: {\r
        label: "Admin Console"\r
      }\r
      QuarkusApp: {\r
        label: "Quarkus Native App"\r
      }\r
    }\r
  }\r
}\r
ProdData: {\r
  label: "data"\r
\r
  PostgresHa: {\r
    label: "postgresHa"\r
\r
    PostgresPrimary: {\r
      label: "postgresPrimary"\r
\r
      Db: {\r
        label: "PostgreSQL"\r
      }\r
    }\r
    PostgresReplica: {\r
      label: "postgresReplica"\r
\r
      Db: {\r
        label: "PostgreSQL"\r
      }\r
    }\r
  }\r
  KeycloakHa: {\r
    label: "keycloakHa"\r
\r
    KeycloakNode1: {\r
      label: "keycloakNode1"\r
\r
      Iam: {\r
        label: "Keycloak"\r
      }\r
    }\r
    KeycloakNode2: {\r
      label: "keycloakNode2"\r
\r
      Iam: {\r
        label: "Keycloak"\r
      }\r
    }\r
  }\r
  ObservabilityNode: {\r
    label: "observabilityNode"\r
\r
    Otel: {\r
      label: "OpenTelemetry Collector"\r
    }\r
    Jaeger: {\r
      label: "Jaeger"\r
    }\r
  }\r
}\r
\r
ProdApp.AppCluster.AppPod1.AdminConsole -> ProdApp.AppCluster.AppPod1.QuarkusApp: "[...]"\r
ProdApp.AppCluster.AppPod2.AdminConsole -> ProdApp.AppCluster.AppPod2.QuarkusApp: "[...]"\r
ProdData.ObservabilityNode.Otel -> ProdData.ObservabilityNode.Jaeger: "Entrega trazas"\r
ProdEdge.LoadBalancer.LoadBalancer -> ProdApp.AppCluster.IngressController.IngressController: "Reenvia trafico al cluster"\r
ProdApp.AppCluster.AppPod1.AdminConsole -> ProdData.KeycloakHa.KeycloakNode1.Iam: "[...]"\r
ProdApp.AppCluster.AppPod1.AdminConsole -> ProdData.KeycloakHa.KeycloakNode2.Iam: "[...]"\r
ProdApp.AppCluster.AppPod1.QuarkusApp -> ProdData.PostgresHa.PostgresPrimary.Db: "[...]"\r
ProdApp.AppCluster.AppPod1.QuarkusApp -> ProdData.PostgresHa.PostgresReplica.Db: "[...]"\r
ProdApp.AppCluster.AppPod1.QuarkusApp -> ProdData.KeycloakHa.KeycloakNode1.Iam: "Valida access tokens"\r
ProdApp.AppCluster.AppPod1.QuarkusApp -> ProdData.KeycloakHa.KeycloakNode2.Iam: "Valida access tokens"\r
ProdApp.AppCluster.AppPod1.QuarkusApp -> ProdData.ObservabilityNode.Otel: "Exporta trazas"\r
ProdServices.ServicesNode.Vault -> ProdApp.AppCluster.AppPod1.QuarkusApp: "Entrega secretos y credenciales"\r
ProdServices.ServicesNode.SharedStorage -> ProdApp.AppCluster.AppPod1.QuarkusApp: "Comparte archivos locales"\r
ProdApp.AppCluster.AppPod2.AdminConsole -> ProdData.KeycloakHa.KeycloakNode1.Iam: "[...]"\r
ProdApp.AppCluster.AppPod2.AdminConsole -> ProdData.KeycloakHa.KeycloakNode2.Iam: "[...]"\r
ProdApp.AppCluster.AppPod2.QuarkusApp -> ProdData.PostgresHa.PostgresPrimary.Db: "[...]"\r
ProdApp.AppCluster.AppPod2.QuarkusApp -> ProdData.PostgresHa.PostgresReplica.Db: "[...]"\r
ProdApp.AppCluster.AppPod2.QuarkusApp -> ProdData.KeycloakHa.KeycloakNode1.Iam: "Valida access tokens"\r
ProdApp.AppCluster.AppPod2.QuarkusApp -> ProdData.KeycloakHa.KeycloakNode2.Iam: "Valida access tokens"\r
ProdApp.AppCluster.AppPod2.QuarkusApp -> ProdData.ObservabilityNode.Otel: "Exporta trazas"\r
ProdServices.ServicesNode.Vault -> ProdApp.AppCluster.AppPod2.QuarkusApp: "Entrega secretos y credenciales"\r
ProdServices.ServicesNode.SharedStorage -> ProdApp.AppCluster.AppPod2.QuarkusApp: "Comparte archivos locales"\r
ProdApp.AppCluster.IngressController -> ProdApp.AppCluster.AppService: "Ruta UI y API"\r
ProdApp.AppCluster.AppService -> ProdApp.AppCluster.AppPod1: "Balancea trafico HTTP"\r
ProdApp.AppCluster.AppService -> ProdApp.AppCluster.AppPod2: "Balancea trafico HTTP"\r
ProdEdge.LoadBalancer -> ProdApp.AppCluster.IngressController: "HTTPS"\r
`;case"usecase_uc01_source":return`direction: right\r
\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleProcessDesigner: {\r
  label: "Process Designer"\r
}\r
IntegrationHubQuarkusAppAdminApi: {\r
  label: "Admin API"\r
}\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Define tipo de fuente y parametros"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppAdminApi: "Registra source definition"\r
IntegrationHubQuarkusAppAdminApi -> IntegrationHubQuarkusAppProcessEngineProcessCatalogService: "Persiste catalogo"\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService -> Db: "Guarda source definition"\r
`;case"usecase_uc02_reader":return`direction: right\r
\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleProcessDesigner: {\r
  label: "Process Designer"\r
}\r
IntegrationHubQuarkusAppAdminApi: {\r
  label: "Admin API"\r
}\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Define formato y layout"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppAdminApi: "Registra reader definition"\r
IntegrationHubQuarkusAppAdminApi -> IntegrationHubQuarkusAppProcessEngineProcessCatalogService: "Persiste catalogo"\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService -> Db: "Guarda reader definition"\r
`;case"usecase_uc03_process":return`direction: right\r
\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleProcessDesigner: {\r
  label: "Process Designer"\r
}\r
IntegrationHubQuarkusAppAdminApi: {\r
  label: "Admin API"\r
}\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Crea proceso y ordena tareas"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppAdminApi: "Guarda process definition"\r
IntegrationHubQuarkusAppAdminApi -> IntegrationHubQuarkusAppProcessEngineProcessCatalogService: "Valida y registra tareas"\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService -> Db: "Guarda process definition y task definitions"\r
`;case"usecase_uc04_manual_execution":return`direction: right\r
\r
Operator: {\r
  label: "Operator"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleOperationsConsole: {\r
  label: "Operations Console"\r
}\r
IntegrationHubQuarkusAppExecutionApi: {\r
  label: "Execution API"\r
}\r
IntegrationHubQuarkusAppProcessEngine: {\r
  label: "Process Engine"\r
}\r
IntegrationHubQuarkusAppSourceRegistry: {\r
  label: "Source Provider Registry"\r
}\r
IntegrationHubQuarkusAppReaderRegistry: {\r
  label: "Reader Provider Registry"\r
}\r
IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider: {\r
  label: "DbWriteTaskProvider"\r
}\r
IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider: {\r
  label: "RestCallTaskProvider"\r
}\r
IntegrationHubQuarkusAppAuditService: {\r
  label: "Audit Service"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
\r
Operator -> IntegrationHubAdminConsoleOperationsConsole: "Selecciona proceso activo"\r
IntegrationHubAdminConsoleOperationsConsole -> IntegrationHubQuarkusAppExecutionApi: "Solicita ejecucion"\r
IntegrationHubQuarkusAppExecutionApi -> IntegrationHubQuarkusAppProcessEngine: "Inicia ejecucion"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppSourceRegistry: "Resuelve fuente"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppReaderRegistry: "Lee contenido"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider: "Persiste registros"\r
IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider -> Db: "Guarda staging o destino"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider: "Invoca API externa"\r
IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider -> ExternalApi: "Envia payload"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppAuditService: "Registra eventos"\r
`;case"usecase_uc05_scheduled_execution":return`direction: right\r
\r
SchedulerActor: {\r
  label: "Scheduler"\r
  shape: c4-person\r
}\r
IntegrationHubQuarkusAppScheduler: {\r
  label: "Scheduler"\r
}\r
IntegrationHubQuarkusAppProcessEngine: {\r
  label: "Process Engine"\r
}\r
IntegrationHubQuarkusAppSourceRegistry: {\r
  label: "Source Provider Registry"\r
}\r
IntegrationHubQuarkusAppReaderRegistry: {\r
  label: "Reader Provider Registry"\r
}\r
IntegrationHubQuarkusAppTaskRegistry: {\r
  label: "Task Provider Registry"\r
}\r
IntegrationHubQuarkusAppAuditService: {\r
  label: "Audit Service"\r
}\r
IntegrationHubQuarkusAppTelemetry: {\r
  label: "OpenTelemetry Instrumentation"\r
}\r
ObservabilityOtel: {\r
  label: "OpenTelemetry Collector"\r
}\r
ObservabilityJaeger: {\r
  label: "Jaeger"\r
}\r
\r
SchedulerActor -> IntegrationHubQuarkusAppScheduler: "Detecta proceso programado"\r
IntegrationHubQuarkusAppScheduler -> IntegrationHubQuarkusAppProcessEngine: "Lanza ejecucion"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppSourceRegistry: "Resuelve fuente"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppReaderRegistry: "Lee contenido"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTaskRegistry: "Ejecuta tareas"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppAuditService: "Registra eventos"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTelemetry: "Emite spans"\r
IntegrationHubQuarkusAppTelemetry -> ObservabilityOtel: "Exporta trazas"\r
ObservabilityOtel -> ObservabilityJaeger: "Publica visualizacion"\r
`;case"usecase_uc09_access":return`direction: right\r
\r
PlatformAdmin: {\r
  label: "Platform Admin"\r
  shape: c4-person\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
IntegrationHubAdminConsoleOidcClient: {\r
  label: "OIDC Client"\r
}\r
IntegrationHubQuarkusAppAdminApi: {\r
  label: "Admin API"\r
}\r
\r
PlatformAdmin -> Iam: "Administra clientes y roles"\r
PlatformAdmin -> IntegrationHubAdminConsoleOidcClient: "Valida acceso a consola"\r
IntegrationHubAdminConsoleOidcClient -> Iam: "Solicita autenticacion OIDC"\r
IntegrationHubAdminConsoleOidcClient -> IntegrationHubQuarkusAppAdminApi: "Invoca APIs protegidas"\r
IntegrationHubQuarkusAppAdminApi -> Iam: "Valida tokens y roles"\r
`;default:throw new Error("Unknown viewId: "+r)}}export{n as d2Source};
