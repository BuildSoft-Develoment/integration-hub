function n(r){switch(r){case"index":return`direction: down\r
\r
User: {\r
  label: "Usuario de negocio"\r
}\r
Admin: {\r
  label: "Administrador de integraciones"\r
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
  label: "Fuentes externas"\r
}\r
Observability: {\r
  label: "Observabilidad"\r
}\r
\r
User -> IntegrationHub: "Consulta estado y resultados"\r
Admin -> IntegrationHub: "Configura fuentes, readers y procesos"\r
IntegrationHub -> ExternalApi: "[...]"\r
IntegrationHub -> Iam: "[...]"\r
IntegrationHub -> Db: "[...]"\r
IntegrationHub -> FileSources: "[...]"\r
IntegrationHub -> Observability: "Exporta trazas"\r
`;case"context":return`direction: down\r
\r
User: {\r
  label: "Usuario de negocio"\r
}\r
Admin: {\r
  label: "Administrador de integraciones"\r
}\r
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
\r
  AdminConsole: {\r
    label: "Admin Console"\r
  }\r
  QuarkusApp: {\r
    label: "Quarkus Native App"\r
  }\r
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
  label: "Fuentes externas"\r
}\r
Observability: {\r
  label: "Observabilidad"\r
}\r
\r
User -> IntegrationHub.AdminConsole: "Consulta estado y resultados"\r
Admin -> IntegrationHub.AdminConsole: "Configura fuentes, readers y procesos"\r
IntegrationHub.AdminConsole -> IntegrationHub.QuarkusApp: "Invoca APIs protegidas"\r
IntegrationHub.AdminConsole -> Iam: "Autenticacion OIDC"\r
IntegrationHub.QuarkusApp -> ExternalApi: "Invoca APIs de negocio"\r
IntegrationHub.QuarkusApp -> Iam: "Valida access tokens"\r
IntegrationHub.QuarkusApp -> Db: "Persiste configuracion, jobs, auditoria y staging"\r
IntegrationHub.QuarkusApp -> FileSources: "[...]"\r
IntegrationHub.QuarkusApp -> Observability: "Exporta trazas"\r
`;case"containers":return`direction: down\r
\r
User: {\r
  label: "Usuario de negocio"\r
}\r
Admin: {\r
  label: "Administrador de integraciones"\r
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
IntegrationHubAdminConsole -> Iam: "Autenticacion OIDC"\r
IntegrationHubQuarkusApp -> Iam: "Valida access tokens"\r
IntegrationHubQuarkusApp -> Db: "Persiste configuracion, jobs, auditoria y staging"\r
IntegrationHubQuarkusApp -> FileSourcesFilesystem: "Lee archivos locales"\r
IntegrationHubQuarkusApp -> FileSourcesFtp: "Descarga archivos"\r
IntegrationHubQuarkusApp -> FileSourcesSftp: "Descarga archivos"\r
IntegrationHubQuarkusApp -> FileSourcesRestSource: "Obtiene payloads remotos"\r
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
`;case"deployment":return`direction: down\r
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
`;default:throw new Error("Unknown viewId: "+r)}}export{n as d2Source};
