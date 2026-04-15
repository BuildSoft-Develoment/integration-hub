function e(r){switch(r){case"index":return`direction: down\r
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
SharedStorage: {\r
  label: "Shared File Storage"\r
}\r
LoadBalancer: {\r
  label: "Load Balancer / Reverse Proxy"\r
}\r
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
}\r
IngressController: {\r
  label: "Ingress Controller"\r
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
User -> LoadBalancer: "Accede por HTTPS"\r
User -> IntegrationHub: "Consulta estado y resultados"\r
Admin -> LoadBalancer: "Administra por HTTPS"\r
Admin -> IntegrationHub: "Configura fuentes, readers y procesos"\r
PlatformAdmin -> Iam: "UC-09"\r
IntegrationAdmin -> IntegrationHub: "Administra catalogos y procesos"\r
Operator -> IntegrationHub: "Ejecuta procesos"\r
Auditor -> IntegrationHub: "Consulta auditoria y resultados"\r
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
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
FileSources: {\r
  label: "Fuentes externas"\r
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
IntegrationHub -> Iam: "[...]"\r
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
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
\r
  AdminConsole: {\r
    label: "Admin Console App (Front)"\r
  }\r
  QuarkusApp: {\r
    label: "App Service Quarkus Native"\r
  }\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
FileSources: {\r
  label: "Fuentes externas"\r
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
Observability: {\r
  label: "Observabilidad"\r
\r
  Otel: {\r
    label: "OpenTelemetry Collector"\r
  }\r
  Jaeger: {\r
    label: "Jaeger"\r
  }\r
}\r
\r
IntegrationHub.AdminConsole -> IntegrationHub.QuarkusApp: "Invoca APIs protegidas"\r
User -> IntegrationHub.AdminConsole: "Consulta estado y resultados"\r
Admin -> IntegrationHub.AdminConsole: "Configura fuentes, readers y procesos"\r
IntegrationAdmin -> IntegrationHub.AdminConsole: "Administra catalogos y procesos"\r
Operator -> IntegrationHub.AdminConsole: "Ejecuta procesos"\r
Auditor -> IntegrationHub.AdminConsole: "Consulta auditoria y resultados"\r
IntegrationHub.AdminConsole -> Iam: "Autenticacion OIDC"\r
IntegrationHub.QuarkusApp -> Iam: "Valida access tokens"\r
IntegrationHub.QuarkusApp -> Db: "Persiste configuracion, jobs, auditoria y staging"\r
IntegrationHub.QuarkusApp -> FileSources.Filesystem: "Lee archivos locales"\r
IntegrationHub.QuarkusApp -> FileSources.Ftp: "Descarga archivos"\r
IntegrationHub.QuarkusApp -> FileSources.Sftp: "Descarga archivos"\r
IntegrationHub.QuarkusApp -> FileSources.RestSource: "Obtiene payloads remotos"\r
IntegrationHub.QuarkusApp -> ExternalApi: "Invoca APIs de negocio"\r
IntegrationHub.QuarkusApp -> Observability.Otel: "Exporta trazas"\r
Observability.Otel -> Observability.Jaeger: "Entrega trazas"\r
`;case"frontend_components":return`direction: down\r
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
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
\r
  AdminConsole: {\r
    label: "Admin Console App (Front)"\r
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
  QuarkusApp: {\r
    label: "App Service Quarkus Native"\r
\r
    ProcessDefinitionResource: {\r
      label: "ProcessDefinitionResource"\r
    }\r
    SourceDefinitionResource: {\r
      label: "SourceDefinitionResource"\r
    }\r
    ReaderDefinitionResource: {\r
      label: "ReaderDefinitionResource"\r
    }\r
    ProcessExecutionResource: {\r
      label: "ProcessExecutionResource"\r
    }\r
    ProcessScheduleResource: {\r
      label: "ProcessScheduleResource"\r
    }\r
    ExecutionQueryResource: {\r
      label: "ExecutionQueryResource"\r
    }\r
  }\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
\r
IntegrationHub.AdminConsole.ReactApp -> IntegrationHub.AdminConsole.OidcClient: "Gestiona sesion"\r
IntegrationHub.AdminConsole.ReactApp -> IntegrationHub.AdminConsole.ProcessDesigner: "Configura catalogos y procesos"\r
IntegrationHub.AdminConsole.ReactApp -> IntegrationHub.AdminConsole.OperationsConsole: "Consulta y ejecuta procesos"\r
IntegrationHub.AdminConsole.OidcClient -> Iam: "Login y refresh token"\r
IntegrationHub.AdminConsole.ProcessDesigner -> IntegrationHub.QuarkusApp.ProcessDefinitionResource: "CRUD de procesos"\r
IntegrationHub.AdminConsole.ProcessDesigner -> IntegrationHub.QuarkusApp.SourceDefinitionResource: "CRUD de sources"\r
IntegrationHub.AdminConsole.ProcessDesigner -> IntegrationHub.QuarkusApp.ReaderDefinitionResource: "CRUD de readers"\r
IntegrationHub.AdminConsole.OperationsConsole -> IntegrationHub.QuarkusApp.ProcessExecutionResource: "Ejecuta procesos"\r
IntegrationHub.AdminConsole.OperationsConsole -> IntegrationHub.QuarkusApp.ProcessScheduleResource: "Consulta programaciones"\r
IntegrationHub.AdminConsole.OperationsConsole -> IntegrationHub.QuarkusApp.ExecutionQueryResource: "Consulta ejecuciones y auditoria"\r
User -> IntegrationHub.AdminConsole: "Consulta estado y resultados"\r
Admin -> IntegrationHub.AdminConsole: "Configura fuentes, readers y procesos"\r
IntegrationAdmin -> IntegrationHub.AdminConsole: "Administra catalogos y procesos"\r
Operator -> IntegrationHub.AdminConsole: "Ejecuta procesos"\r
Auditor -> IntegrationHub.AdminConsole: "Consulta auditoria y resultados"\r
IntegrationHub.QuarkusApp -> Db: "Persiste configuracion, jobs, auditoria y staging"\r
IntegrationHub.QuarkusApp -> Iam: "Valida access tokens"\r
`;case"backend_components":return`direction: down\r
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
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
\r
  QuarkusApp: {\r
    label: "App Service Quarkus Native"\r
\r
    Telemetry: {\r
      label: "OpenTelemetry Instrumentation"\r
    }\r
    ProcessDefinitionResource: {\r
      label: "ProcessDefinitionResource"\r
    }\r
    SourceDefinitionResource: {\r
      label: "SourceDefinitionResource"\r
    }\r
    ReaderDefinitionResource: {\r
      label: "ReaderDefinitionResource"\r
    }\r
    ProcessExecutionResource: {\r
      label: "ProcessExecutionResource"\r
    }\r
    ProcessScheduleResource: {\r
      label: "ProcessScheduleResource"\r
    }\r
    ExecutionQueryResource: {\r
      label: "ExecutionQueryResource"\r
    }\r
    ProcessSchedulerService: {\r
      label: "ProcessSchedulerService"\r
    }\r
    ProcessCatalogService: {\r
      label: "ProcessCatalogService"\r
    }\r
    SourceCatalogService: {\r
      label: "SourceCatalogService"\r
    }\r
    ReaderCatalogService: {\r
      label: "ReaderCatalogService"\r
    }\r
    ProcessScheduleQueryService: {\r
      label: "ProcessScheduleQueryService"\r
    }\r
    ExecutionQueryService: {\r
      label: "ExecutionQueryService"\r
    }\r
    ProcessExecutionService: {\r
      label: "ProcessExecutionService"\r
    }\r
    Repositories: {\r
      label: "Repositories"\r
    }\r
    ProcessEngine: {\r
      label: "Process Engine"\r
    }\r
    AuditService: {\r
      label: "Audit Service"\r
    }\r
    DomainEntities: {\r
      label: "Domain Entities"\r
    }\r
  }\r
  AdminConsole: {\r
    label: "Admin Console App (Front)"\r
  }\r
}\r
FileSources: {\r
  label: "Fuentes externas"\r
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
Observability: {\r
  label: "Observabilidad"\r
\r
  Otel: {\r
    label: "OpenTelemetry Collector"\r
  }\r
  Jaeger: {\r
    label: "Jaeger"\r
  }\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
\r
IntegrationHub.QuarkusApp.ProcessDefinitionResource -> IntegrationHub.QuarkusApp.ProcessCatalogService: "Delega gestion de procesos"\r
IntegrationHub.QuarkusApp.SourceDefinitionResource -> IntegrationHub.QuarkusApp.SourceCatalogService: "Delega gestion de sources"\r
IntegrationHub.QuarkusApp.ReaderDefinitionResource -> IntegrationHub.QuarkusApp.ReaderCatalogService: "Delega gestion de readers"\r
IntegrationHub.QuarkusApp.ProcessExecutionResource -> IntegrationHub.QuarkusApp.ProcessExecutionService: "Delega ejecucion"\r
IntegrationHub.QuarkusApp.ProcessScheduleResource -> IntegrationHub.QuarkusApp.ProcessScheduleQueryService: "Delega consulta de schedules"\r
IntegrationHub.QuarkusApp.ExecutionQueryResource -> IntegrationHub.QuarkusApp.ExecutionQueryService: "Delega consultas operativas"\r
IntegrationHub.QuarkusApp.ProcessCatalogService -> IntegrationHub.QuarkusApp.Repositories: "[...]"\r
IntegrationHub.QuarkusApp.SourceCatalogService -> IntegrationHub.QuarkusApp.Repositories: "Persiste sources"\r
IntegrationHub.QuarkusApp.ReaderCatalogService -> IntegrationHub.QuarkusApp.Repositories: "Persiste readers"\r
IntegrationHub.QuarkusApp.ProcessExecutionService -> IntegrationHub.QuarkusApp.ProcessEngine: "[...]"\r
IntegrationHub.QuarkusApp.ProcessExecutionService -> IntegrationHub.QuarkusApp.AuditService: "Registra eventos"\r
IntegrationHub.QuarkusApp.ProcessSchedulerService -> IntegrationHub.QuarkusApp.ProcessExecutionService: "Dispara procesos programados"\r
IntegrationHub.QuarkusApp.ProcessScheduleQueryService -> IntegrationHub.QuarkusApp.Repositories: "Consulta programaciones"\r
IntegrationHub.QuarkusApp.ExecutionQueryService -> IntegrationHub.QuarkusApp.Repositories: "[...]"\r
IntegrationHub.QuarkusApp.Repositories -> IntegrationHub.QuarkusApp.DomainEntities: "Lee y persiste"\r
User -> IntegrationHub.AdminConsole: "Consulta estado y resultados"\r
Admin -> IntegrationHub.AdminConsole: "Configura fuentes, readers y procesos"\r
IntegrationAdmin -> IntegrationHub.AdminConsole: "Administra catalogos y procesos"\r
Operator -> IntegrationHub.AdminConsole: "Ejecuta procesos"\r
Auditor -> IntegrationHub.AdminConsole: "Consulta auditoria y resultados"\r
IntegrationHub.AdminConsole -> IntegrationHub.QuarkusApp.ProcessDefinitionResource: "CRUD de procesos"\r
IntegrationHub.AdminConsole -> IntegrationHub.QuarkusApp.SourceDefinitionResource: "CRUD de sources"\r
IntegrationHub.AdminConsole -> IntegrationHub.QuarkusApp.ReaderDefinitionResource: "CRUD de readers"\r
IntegrationHub.AdminConsole -> IntegrationHub.QuarkusApp.ProcessExecutionResource: "Ejecuta procesos"\r
IntegrationHub.AdminConsole -> IntegrationHub.QuarkusApp.ProcessScheduleResource: "Consulta programaciones"\r
IntegrationHub.AdminConsole -> IntegrationHub.QuarkusApp.ExecutionQueryResource: "Consulta ejecuciones y auditoria"\r
IntegrationHub.QuarkusApp.ProcessEngine -> Db: "Batch insert, update y upsert"\r
IntegrationHub.QuarkusApp.Repositories -> Db: "Opera sobre PostgreSQL"\r
IntegrationHub.AdminConsole -> Iam: "Autenticacion OIDC"\r
IntegrationHub.QuarkusApp.ProcessEngine -> ExternalApi: "[...]"\r
Observability.Otel -> Observability.Jaeger: "Entrega trazas"\r
IntegrationHub.QuarkusApp -> Iam: "Valida access tokens"\r
IntegrationHub.QuarkusApp -> FileSources.Filesystem: "Lee archivos locales"\r
IntegrationHub.QuarkusApp -> FileSources.Ftp: "Descarga archivos"\r
IntegrationHub.QuarkusApp -> FileSources.Sftp: "Descarga archivos"\r
IntegrationHub.QuarkusApp -> FileSources.RestSource: "Obtiene payloads remotos"\r
IntegrationHub.QuarkusApp -> Observability.Otel: "Exporta trazas"\r
`;case"process_engine_code":return`direction: down\r
\r
IntegrationHub: {\r
  label: "Integration Hub Platform"\r
\r
  AdminConsole: {\r
    label: "Admin Console App (Front)"\r
\r
    ProcessDesigner: {\r
      label: "Process Designer"\r
    }\r
    OperationsConsole: {\r
      label: "Operations Console"\r
    }\r
  }\r
  QuarkusApp: {\r
    label: "App Service Quarkus Native"\r
\r
    Telemetry: {\r
      label: "OpenTelemetry Instrumentation"\r
    }\r
    Repositories: {\r
      label: "Repositories"\r
\r
      ProcessDefinitionRepository: {\r
        label: "ProcessDefinitionRepository"\r
      }\r
      SourceDefinitionRepository: {\r
        label: "SourceDefinitionRepository"\r
      }\r
      ReaderDefinitionRepository: {\r
        label: "ReaderDefinitionRepository"\r
      }\r
      ProcessTaskDefinitionRepository: {\r
        label: "ProcessTaskDefinitionRepository"\r
      }\r
      ProcessExecutionRepository: {\r
        label: "ProcessExecutionRepository"\r
      }\r
      ProcessTaskExecutionRepository: {\r
        label: "ProcessTaskExecutionRepository"\r
      }\r
      AuditEventRepository: {\r
        label: "AuditEventRepository"\r
      }\r
    }\r
    ProcessExecutionResource: {\r
      label: "ProcessExecutionResource"\r
    }\r
    ProcessExecutionService: {\r
      label: "ProcessExecutionService"\r
    }\r
    ProcessEngine: {\r
      label: "Process Engine"\r
\r
      JsonConfigurationMapper: {\r
        label: "JsonConfigurationMapper"\r
      }\r
      SourceRegistry: {\r
        label: "Source Provider Registry"\r
      }\r
      ReaderRegistry: {\r
        label: "Reader Provider Registry"\r
      }\r
      TaskRegistry: {\r
        label: "Task Provider Registry"\r
      }\r
      SourceProviders: {\r
        label: "Source Providers"\r
      }\r
      ReaderProviders: {\r
        label: "Reader Providers"\r
      }\r
      TaskProviders: {\r
        label: "Task Providers"\r
      }\r
    }\r
    AuditService: {\r
      label: "Audit Service"\r
    }\r
  }\r
}\r
FileSources: {\r
  label: "Fuentes externas"\r
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
Observability: {\r
  label: "Observabilidad"\r
\r
  Otel: {\r
    label: "OpenTelemetry Collector"\r
  }\r
  Jaeger: {\r
    label: "Jaeger"\r
  }\r
}\r
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
Db: {\r
  label: "PostgreSQL"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
\r
IntegrationHub.AdminConsole.OperationsConsole -> IntegrationHub.QuarkusApp.ProcessExecutionResource: "Ejecuta procesos"\r
IntegrationHub.QuarkusApp.ProcessExecutionResource -> IntegrationHub.QuarkusApp.ProcessExecutionService: "Delega ejecucion"\r
IntegrationHub.QuarkusApp.ProcessExecutionService -> IntegrationHub.QuarkusApp.ProcessEngine.JsonConfigurationMapper: "Lee configuracion JSON"\r
IntegrationHub.QuarkusApp.ProcessExecutionService -> IntegrationHub.QuarkusApp.ProcessEngine.SourceRegistry: "Resuelve SourceProvider"\r
IntegrationHub.QuarkusApp.ProcessExecutionService -> IntegrationHub.QuarkusApp.ProcessEngine.ReaderRegistry: "Resuelve ReaderProvider"\r
IntegrationHub.QuarkusApp.ProcessExecutionService -> IntegrationHub.QuarkusApp.ProcessEngine.TaskRegistry: "Resuelve TaskProvider"\r
IntegrationHub.QuarkusApp.ProcessExecutionService -> IntegrationHub.QuarkusApp.ProcessEngine.TaskProviders: "[...]"\r
IntegrationHub.QuarkusApp.ProcessEngine.SourceRegistry -> IntegrationHub.QuarkusApp.ProcessEngine.SourceProviders: "Usa implementations"\r
IntegrationHub.QuarkusApp.ProcessEngine.ReaderRegistry -> IntegrationHub.QuarkusApp.ProcessEngine.ReaderProviders: "Usa implementations"\r
IntegrationHub.QuarkusApp.ProcessEngine.TaskRegistry -> IntegrationHub.QuarkusApp.ProcessEngine.TaskProviders: "Usa implementations"\r
IntegrationHub.QuarkusApp.ProcessExecutionService -> IntegrationHub.QuarkusApp.AuditService: "Registra eventos"\r
IntegrationHub.QuarkusApp.ProcessEngine.TaskProviders -> Db: "Batch insert, update y upsert"\r
IntegrationHub.QuarkusApp.ProcessEngine.TaskProviders -> ExternalApi: "[...]"\r
Observability.Otel -> Observability.Jaeger: "Entrega trazas"\r
User -> IntegrationHub.AdminConsole: "Consulta estado y resultados"\r
Admin -> IntegrationHub.AdminConsole: "Configura fuentes, readers y procesos"\r
IntegrationAdmin -> IntegrationHub.AdminConsole: "Administra catalogos y procesos"\r
Operator -> IntegrationHub.AdminConsole: "Ejecuta procesos"\r
Auditor -> IntegrationHub.AdminConsole: "Consulta auditoria y resultados"\r
IntegrationHub.QuarkusApp.Repositories -> Db: "Opera sobre PostgreSQL"\r
IntegrationHub.QuarkusApp -> FileSources.Filesystem: "Lee archivos locales"\r
IntegrationHub.QuarkusApp -> FileSources.Ftp: "Descarga archivos"\r
IntegrationHub.QuarkusApp -> FileSources.Sftp: "Descarga archivos"\r
IntegrationHub.QuarkusApp -> FileSources.RestSource: "Obtiene payloads remotos"\r
IntegrationHub.QuarkusApp -> Observability.Otel: "Exporta trazas"\r
`;case"domain_entities_code":return`direction: down\r
\r
IntegrationHubQuarkusApp: {\r
  label: "App Service Quarkus Native"\r
\r
  DomainEntities: {\r
    label: "Domain Entities"\r
\r
    CatalogEntities: {\r
      label: "Catalog"\r
\r
      SourceDefinitionEntity: {\r
        label: "SourceDefinition"\r
      }\r
      ReaderDefinitionEntity: {\r
        label: "ReaderDefinition"\r
      }\r
      ProcessDefinitionEntity: {\r
        label: "ProcessDefinition"\r
      }\r
      ProcessTaskDefinitionEntity: {\r
        label: "ProcessTaskDefinition"\r
      }\r
    }\r
    ExecutionEntities: {\r
      label: "Execution"\r
\r
      ProcessExecutionEntity: {\r
        label: "ProcessExecution"\r
      }\r
      ProcessTaskExecutionEntity: {\r
        label: "ProcessTaskExecution"\r
      }\r
      AuditEventEntity: {\r
        label: "AuditEvent"\r
      }\r
    }\r
  }\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.SourceDefinitionEntity -> IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.ProcessTaskDefinitionEntity: "0..n taskDefinitions"\r
IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.ReaderDefinitionEntity -> IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.ProcessTaskDefinitionEntity: "0..n taskDefinitions"\r
IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.ProcessDefinitionEntity -> IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.ProcessTaskDefinitionEntity: "0..n taskDefinitions"\r
IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.ProcessDefinitionEntity -> IntegrationHubQuarkusApp.DomainEntities.ExecutionEntities.ProcessExecutionEntity: "0..n processExecutions"\r
IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.ProcessTaskDefinitionEntity -> IntegrationHubQuarkusApp.DomainEntities.ExecutionEntities.ProcessTaskExecutionEntity: "0..n taskExecutions"\r
IntegrationHubQuarkusApp.DomainEntities.CatalogEntities.ProcessTaskDefinitionEntity -> IntegrationHubQuarkusApp.DomainEntities.ExecutionEntities.AuditEventEntity: "0..n auditEvents"\r
IntegrationHubQuarkusApp.DomainEntities.ExecutionEntities.ProcessExecutionEntity -> IntegrationHubQuarkusApp.DomainEntities.ExecutionEntities.ProcessTaskExecutionEntity: "0..n taskExecutions"\r
IntegrationHubQuarkusApp.DomainEntities.ExecutionEntities.ProcessExecutionEntity -> IntegrationHubQuarkusApp.DomainEntities.ExecutionEntities.AuditEventEntity: "0..n auditEvents"\r
IntegrationHubQuarkusApp -> Db: "Persiste configuracion, jobs, auditoria y staging"\r
`;case"security_overview":return`direction: down\r
\r
PlatformAdmin: {\r
  label: "Platform Admin"\r
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
IntegrationHubQuarkusApp: {\r
  label: "App Service Quarkus Native"\r
\r
  ProcessDefinitionResource: {\r
    label: "ProcessDefinitionResource"\r
  }\r
  ProcessExecutionResource: {\r
    label: "ProcessExecutionResource"\r
  }\r
}\r
IntegrationHubAdminConsole: {\r
  label: "Admin Console App (Front)"\r
\r
  OidcClient: {\r
    label: "OIDC Client"\r
  }\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
\r
PlatformAdmin -> Iam: "UC-09"\r
IntegrationHubAdminConsole.OidcClient -> Iam: "Login y refresh token"\r
User -> IntegrationHubAdminConsole: "Consulta estado y resultados"\r
Admin -> IntegrationHubAdminConsole: "Configura fuentes, readers y procesos"\r
IntegrationAdmin -> IntegrationHubAdminConsole: "Administra catalogos y procesos"\r
Operator -> IntegrationHubAdminConsole: "Ejecuta procesos"\r
Auditor -> IntegrationHubAdminConsole: "Consulta auditoria y resultados"\r
IntegrationHubQuarkusApp -> Iam: "Valida access tokens"\r
`;case"deployment_dev":return`direction: down\r
\r
DevApp: {\r
  label: "app"\r
\r
  DockerHost: {\r
    label: "dockerHost"\r
\r
    AdminConsole: {\r
      label: "Admin Console App (Front)"\r
    }\r
    QuarkusApp: {\r
      label: "App Service Quarkus Native"\r
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
      label: "Admin Console App (Front)"\r
    }\r
    QuarkusApp: {\r
      label: "App Service Quarkus Native"\r
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
        label: "Admin Console App (Front)"\r
      }\r
      QuarkusApp: {\r
        label: "App Service Quarkus Native"\r
      }\r
    }\r
    AppPod2: {\r
      label: "appPod2"\r
\r
      AdminConsole: {\r
        label: "Admin Console App (Front)"\r
      }\r
      QuarkusApp: {\r
        label: "App Service Quarkus Native"\r
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
IntegrationHubQuarkusAppSourceDefinitionResource: {\r
  label: "SourceDefinitionResource"\r
}\r
IntegrationHubQuarkusAppSourceCatalogService: {\r
  label: "SourceCatalogService"\r
}\r
IntegrationHubQuarkusAppRepositoriesSourceDefinitionRepository: {\r
  label: "SourceDefinitionRepository"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Define tipo de fuente y parametros"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppSourceDefinitionResource: "Registra source definition"\r
IntegrationHubQuarkusAppSourceDefinitionResource -> IntegrationHubQuarkusAppSourceCatalogService: "Delega alta de catalogo"\r
IntegrationHubQuarkusAppSourceCatalogService -> IntegrationHubQuarkusAppRepositoriesSourceDefinitionRepository: "Persiste source definition"\r
IntegrationHubQuarkusAppRepositoriesSourceDefinitionRepository -> Db: "Guarda source definition"\r
`;case"usecase_uc02_reader":return`direction: right\r
\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleProcessDesigner: {\r
  label: "Process Designer"\r
}\r
IntegrationHubQuarkusAppReaderDefinitionResource: {\r
  label: "ReaderDefinitionResource"\r
}\r
IntegrationHubQuarkusAppReaderCatalogService: {\r
  label: "ReaderCatalogService"\r
}\r
IntegrationHubQuarkusAppRepositoriesReaderDefinitionRepository: {\r
  label: "ReaderDefinitionRepository"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Define formato y layout"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppReaderDefinitionResource: "Registra reader definition"\r
IntegrationHubQuarkusAppReaderDefinitionResource -> IntegrationHubQuarkusAppReaderCatalogService: "Delega alta de catalogo"\r
IntegrationHubQuarkusAppReaderCatalogService -> IntegrationHubQuarkusAppRepositoriesReaderDefinitionRepository: "Persiste reader definition"\r
IntegrationHubQuarkusAppRepositoriesReaderDefinitionRepository -> Db: "Guarda reader definition"\r
`;case"usecase_uc03_process":return`direction: right\r
\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleProcessDesigner: {\r
  label: "Process Designer"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
IntegrationHubQuarkusAppProcessDefinitionResource: {\r
  label: "ProcessDefinitionResource"\r
}\r
IntegrationHubQuarkusAppProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
IntegrationHubQuarkusAppRepositoriesProcessDefinitionRepository: {\r
  label: "ProcessDefinitionRepository"\r
}\r
IntegrationHubQuarkusAppRepositoriesProcessTaskDefinitionRepository: {\r
  label: "ProcessTaskDefinitionRepository"\r
}\r
IntegrationHubQuarkusAppReaderDefinitionResource: {\r
  label: "ReaderDefinitionResource"\r
}\r
IntegrationHubQuarkusAppReaderCatalogService: {\r
  label: "ReaderCatalogService"\r
}\r
IntegrationHubQuarkusAppRepositoriesReaderDefinitionRepository: {\r
  label: "ReaderDefinitionRepository"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Crea proceso y ordena tareas"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppProcessDefinitionResource: "Guarda process definition"\r
IntegrationHubQuarkusAppProcessDefinitionResource -> IntegrationHubQuarkusAppProcessCatalogService: "Valida y registra tareas"\r
IntegrationHubQuarkusAppProcessCatalogService -> IntegrationHubQuarkusAppRepositoriesProcessDefinitionRepository: "Persiste definicion"\r
IntegrationHubQuarkusAppProcessCatalogService -> IntegrationHubQuarkusAppRepositoriesProcessTaskDefinitionRepository: "Persiste tasks"\r
IntegrationHubQuarkusAppRepositoriesProcessDefinitionRepository -> Db: "Guarda process definition"\r
IntegrationHubQuarkusAppRepositoriesProcessTaskDefinitionRepository -> Db: "Guarda process tasks"\r
`;case"usecase_uc04_manual_execution":return`direction: right\r
\r
Operator: {\r
  label: "Operator"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleOperationsConsole: {\r
  label: "Operations Console"\r
}\r
IntegrationHubQuarkusAppProcessExecutionResource: {\r
  label: "ProcessExecutionResource"\r
}\r
IntegrationHubQuarkusAppProcessExecutionService: {\r
  label: "ProcessExecutionService"\r
}\r
IntegrationHubQuarkusAppProcessEngine: {\r
  label: "Process Engine"\r
\r
  TaskProvidersDbWriteTaskProvider: {\r
    label: "DbWriteTaskProvider"\r
  }\r
  TaskProvidersRestCallTaskProvider: {\r
    label: "RestCallTaskProvider"\r
  }\r
  SourceRegistry: {\r
    label: "Source Provider Registry"\r
  }\r
  ReaderRegistry: {\r
    label: "Reader Provider Registry"\r
  }\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
ExternalApi: {\r
  label: "APIs externas"\r
}\r
\r
Operator -> IntegrationHubAdminConsoleOperationsConsole: "Selecciona proceso activo"\r
IntegrationHubAdminConsoleOperationsConsole -> IntegrationHubQuarkusAppProcessExecutionResource: "Solicita ejecucion"\r
IntegrationHubQuarkusAppProcessExecutionResource -> IntegrationHubQuarkusAppProcessExecutionService: "Delega ejecucion"\r
IntegrationHubQuarkusAppProcessExecutionService -> IntegrationHubQuarkusAppProcessEngine.TaskProvidersDbWriteTaskProvider: "Persiste registros"\r
IntegrationHubQuarkusAppProcessEngine.TaskProvidersDbWriteTaskProvider -> Db: "Guarda staging o destino"\r
IntegrationHubQuarkusAppProcessExecutionService -> IntegrationHubQuarkusAppProcessEngine.TaskProvidersRestCallTaskProvider: "Invoca API externa"\r
IntegrationHubQuarkusAppProcessEngine.TaskProvidersRestCallTaskProvider -> ExternalApi: "Envia payload"\r
`;case"usecase_uc05_scheduled_execution":return`direction: right\r
\r
SchedulerActor: {\r
  label: "Scheduler"\r
  shape: c4-person\r
}\r
IntegrationHubQuarkusAppProcessSchedulerService: {\r
  label: "ProcessSchedulerService"\r
}\r
IntegrationHubQuarkusAppProcessExecutionService: {\r
  label: "ProcessExecutionService"\r
}\r
IntegrationHubQuarkusAppProcessEngine: {\r
  label: "Process Engine"\r
}\r
IntegrationHubQuarkusAppAuditService: {\r
  label: "Audit Service"\r
}\r
IntegrationHubQuarkusAppTelemetry: {\r
  label: "OpenTelemetry Instrumentation"\r
}\r
Observability: {\r
  label: "Observabilidad"\r
\r
  Otel: {\r
    label: "OpenTelemetry Collector"\r
  }\r
  Jaeger: {\r
    label: "Jaeger"\r
  }\r
}\r
\r
SchedulerActor -> IntegrationHubQuarkusAppProcessSchedulerService: "Detecta proceso programado"\r
IntegrationHubQuarkusAppProcessSchedulerService -> IntegrationHubQuarkusAppProcessExecutionService: "Lanza ejecucion"\r
IntegrationHubQuarkusAppProcessExecutionService -> IntegrationHubQuarkusAppProcessEngine: "Orquesta la ejecucion del motor"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppAuditService: "Registra eventos"\r
IntegrationHubQuarkusAppProcessEngine -> IntegrationHubQuarkusAppTelemetry: "Emite spans"\r
IntegrationHubQuarkusAppTelemetry -> Observability.Otel: "Exporta trazas"\r
Observability.Otel -> Observability.Jaeger: "Publica visualizacion"\r
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
IntegrationHubQuarkusAppProcessDefinitionResource: {\r
  label: "ProcessDefinitionResource"\r
}\r
\r
PlatformAdmin -> Iam: "Administra clientes y roles"\r
PlatformAdmin -> IntegrationHubAdminConsoleOidcClient: "Valida acceso a consola"\r
IntegrationHubAdminConsoleOidcClient -> Iam: "Solicita autenticacion OIDC"\r
IntegrationHubAdminConsoleOidcClient -> IntegrationHubQuarkusAppProcessDefinitionResource: "Invoca APIs protegidas"\r
IntegrationHubQuarkusAppProcessDefinitionResource -> Iam: "Valida tokens y roles"\r
`;default:throw new Error("Unknown viewId: "+r)}}export{e as d2Source};
