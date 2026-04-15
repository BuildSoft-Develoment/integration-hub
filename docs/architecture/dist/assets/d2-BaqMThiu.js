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
IntegrationHubAdminConsole: {\r
  label: "Admin Console App (Front)"\r
}\r
IntegrationHubQuarkusApp: {\r
  label: "App Service Quarkus Native"\r
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
IntegrationHubQuarkusApp -> FileSources.Filesystem: "Lee archivos locales"\r
IntegrationHubQuarkusApp -> FileSources.Ftp: "Descarga archivos"\r
IntegrationHubQuarkusApp -> FileSources.Sftp: "Descarga archivos"\r
IntegrationHubQuarkusApp -> FileSources.RestSource: "Obtiene payloads remotos"\r
IntegrationHubQuarkusApp -> ExternalApi: "Invoca APIs de negocio"\r
IntegrationHubQuarkusApp -> ObservabilityOtel: "Exporta trazas"\r
ObservabilityOtel -> ObservabilityJaeger: "Entrega trazas"\r
`;case"frontend_components":return`direction: down\r
\r
IntegrationHubAdminConsoleReactApp: {\r
  label: "React + PatternFly UI"\r
}\r
IntegrationHubAdminConsoleOidcClient: {\r
  label: "OIDC Client"\r
}\r
IntegrationHubAdminConsoleProcessDesigner: {\r
  label: "Process Designer"\r
}\r
IntegrationHubAdminConsoleOperationsConsole: {\r
  label: "Operations Console"\r
}\r
Iam: {\r
  label: "Keycloak"\r
}\r
IntegrationHubQuarkusAppProcessDefinitionResource: {\r
  label: "ProcessDefinitionResource"\r
}\r
IntegrationHubQuarkusAppProcessExecutionResource: {\r
  label: "ProcessExecutionResource"\r
}\r
IntegrationHubQuarkusAppProcessScheduleResource: {\r
  label: "ProcessScheduleResource"\r
}\r
IntegrationHubQuarkusAppExecutionQueryResource: {\r
  label: "ExecutionQueryResource"\r
}\r
\r
IntegrationHubAdminConsoleReactApp -> IntegrationHubAdminConsoleOidcClient: "Gestiona sesion"\r
IntegrationHubAdminConsoleReactApp -> IntegrationHubAdminConsoleProcessDesigner: "Configura catalogos y procesos"\r
IntegrationHubAdminConsoleReactApp -> IntegrationHubAdminConsoleOperationsConsole: "Consulta y ejecuta procesos"\r
IntegrationHubAdminConsoleOidcClient -> Iam: "Login y refresh token"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppProcessDefinitionResource: "CRUD de definiciones"\r
IntegrationHubAdminConsoleOperationsConsole -> IntegrationHubQuarkusAppProcessExecutionResource: "Ejecuta procesos"\r
IntegrationHubAdminConsoleOperationsConsole -> IntegrationHubQuarkusAppProcessScheduleResource: "Consulta programaciones"\r
IntegrationHubAdminConsoleOperationsConsole -> IntegrationHubQuarkusAppExecutionQueryResource: "Consulta ejecuciones y auditoria"\r
`;case"backend_components":return`direction: down\r
\r
IntegrationHubQuarkusAppProcessDefinitionResource: {\r
  label: "ProcessDefinitionResource"\r
}\r
IntegrationHubQuarkusAppProcessExecutionResource: {\r
  label: "ProcessExecutionResource"\r
}\r
IntegrationHubQuarkusAppProcessScheduleResource: {\r
  label: "ProcessScheduleResource"\r
}\r
IntegrationHubQuarkusAppExecutionQueryResource: {\r
  label: "ExecutionQueryResource"\r
}\r
IntegrationHubQuarkusAppProcessSchedulerService: {\r
  label: "ProcessSchedulerService"\r
}\r
IntegrationHubQuarkusAppTelemetry: {\r
  label: "OpenTelemetry Instrumentation"\r
}\r
Iam: {\r
  label: "Keycloak"\r
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
ObservabilityOtel: {\r
  label: "OpenTelemetry Collector"\r
}\r
IntegrationHubQuarkusAppProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
IntegrationHubQuarkusAppProcessScheduleQueryService: {\r
  label: "ProcessScheduleQueryService"\r
}\r
IntegrationHubQuarkusAppExecutionQueryService: {\r
  label: "ExecutionQueryService"\r
}\r
IntegrationHubQuarkusAppProcessExecutionService: {\r
  label: "ProcessExecutionService"\r
}\r
ObservabilityJaeger: {\r
  label: "Jaeger"\r
}\r
IntegrationHubQuarkusAppPersistenceLayer: {\r
  label: "Panache Persistence Layer"\r
}\r
IntegrationHubQuarkusAppProcessEngine: {\r
  label: "Process Engine"\r
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
IntegrationHubQuarkusAppProcessDefinitionResource -> IntegrationHubQuarkusAppProcessCatalogService: "Delega gestion de procesos"\r
IntegrationHubQuarkusAppProcessExecutionResource -> IntegrationHubQuarkusAppProcessExecutionService: "Delega ejecucion"\r
IntegrationHubQuarkusAppProcessScheduleResource -> IntegrationHubQuarkusAppProcessScheduleQueryService: "Delega consulta de schedules"\r
IntegrationHubQuarkusAppExecutionQueryResource -> IntegrationHubQuarkusAppExecutionQueryService: "Delega consultas operativas"\r
IntegrationHubQuarkusAppProcessCatalogService -> IntegrationHubQuarkusAppPersistenceLayer: "Persiste definiciones"\r
IntegrationHubQuarkusAppProcessExecutionService -> IntegrationHubQuarkusAppProcessEngine: "[...]"\r
IntegrationHubQuarkusAppProcessExecutionService -> IntegrationHubQuarkusAppAuditService: "Registra eventos"\r
IntegrationHubQuarkusAppProcessSchedulerService -> IntegrationHubQuarkusAppProcessExecutionService: "Dispara procesos programados"\r
IntegrationHubQuarkusAppProcessScheduleQueryService -> IntegrationHubQuarkusAppPersistenceLayer: "Consulta programaciones"\r
IntegrationHubQuarkusAppExecutionQueryService -> IntegrationHubQuarkusAppPersistenceLayer: "Consulta ejecuciones y auditoria"\r
IntegrationHubQuarkusAppProcessEngine -> Db: "Batch insert, update y upsert"\r
IntegrationHubQuarkusAppPersistenceLayer -> Db: "Opera sobre PostgreSQL"\r
IntegrationHubQuarkusAppProcessEngine -> ExternalApi: "[...]"\r
ObservabilityOtel -> ObservabilityJaeger: "Entrega trazas"\r
`;case"execution_query_layers":return`direction: down\r
\r
IntegrationHubQuarkusAppExecutionQueryResource: {\r
  label: "ExecutionQueryResource"\r
}\r
IntegrationHubQuarkusAppExecutionQueryService: {\r
  label: "ExecutionQueryService"\r
}\r
IntegrationHubQuarkusAppPersistenceLayer: {\r
  label: "Panache Persistence Layer"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationHubQuarkusAppExecutionQueryResource -> IntegrationHubQuarkusAppExecutionQueryService: "Delega consultas operativas"\r
IntegrationHubQuarkusAppExecutionQueryService -> IntegrationHubQuarkusAppPersistenceLayer: "Consulta ejecuciones y auditoria"\r
IntegrationHubQuarkusAppPersistenceLayer -> Db: "Opera sobre PostgreSQL"\r
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
IntegrationHubQuarkusAppProcessDefinitionResource: {\r
  label: "ProcessDefinitionResource"\r
}\r
IntegrationHubQuarkusAppProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
IntegrationHubQuarkusAppPersistenceLayer: {\r
  label: "Panache Persistence Layer"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Define tipo de fuente y parametros"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppProcessDefinitionResource: "Registra source definition"\r
IntegrationHubQuarkusAppProcessDefinitionResource -> IntegrationHubQuarkusAppProcessCatalogService: "Delega alta de catalogo"\r
IntegrationHubQuarkusAppProcessCatalogService -> IntegrationHubQuarkusAppPersistenceLayer: "Persiste source definition"\r
IntegrationHubQuarkusAppPersistenceLayer -> Db: "Guarda source definition"\r
`;case"usecase_uc02_reader":return`direction: right\r
\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleProcessDesigner: {\r
  label: "Process Designer"\r
}\r
IntegrationHubQuarkusAppProcessDefinitionResource: {\r
  label: "ProcessDefinitionResource"\r
}\r
IntegrationHubQuarkusAppProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
IntegrationHubQuarkusAppPersistenceLayer: {\r
  label: "Panache Persistence Layer"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Define formato y layout"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppProcessDefinitionResource: "Registra reader definition"\r
IntegrationHubQuarkusAppProcessDefinitionResource -> IntegrationHubQuarkusAppProcessCatalogService: "Delega alta de catalogo"\r
IntegrationHubQuarkusAppProcessCatalogService -> IntegrationHubQuarkusAppPersistenceLayer: "Persiste reader definition"\r
IntegrationHubQuarkusAppPersistenceLayer -> Db: "Guarda reader definition"\r
`;case"usecase_uc03_process":return`direction: right\r
\r
IntegrationAdmin: {\r
  label: "Integration Admin"\r
  shape: c4-person\r
}\r
IntegrationHubAdminConsoleProcessDesigner: {\r
  label: "Process Designer"\r
}\r
IntegrationHubQuarkusAppProcessDefinitionResource: {\r
  label: "ProcessDefinitionResource"\r
}\r
IntegrationHubQuarkusAppProcessCatalogService: {\r
  label: "ProcessCatalogService"\r
}\r
IntegrationHubQuarkusAppPersistenceLayer: {\r
  label: "Panache Persistence Layer"\r
}\r
Db: {\r
  label: "PostgreSQL"\r
}\r
\r
IntegrationAdmin -> IntegrationHubAdminConsoleProcessDesigner: "Crea proceso y ordena tareas"\r
IntegrationHubAdminConsoleProcessDesigner -> IntegrationHubQuarkusAppProcessDefinitionResource: "Guarda process definition"\r
IntegrationHubQuarkusAppProcessDefinitionResource -> IntegrationHubQuarkusAppProcessCatalogService: "Valida y registra tareas"\r
IntegrationHubQuarkusAppProcessCatalogService -> IntegrationHubQuarkusAppPersistenceLayer: "Persiste definicion"\r
IntegrationHubQuarkusAppPersistenceLayer -> Db: "Guarda process definition y tasks"\r
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
ObservabilityOtel: {\r
  label: "OpenTelemetry Collector"\r
}\r
ObservabilityJaeger: {\r
  label: "Jaeger"\r
}\r
\r
SchedulerActor -> IntegrationHubQuarkusAppProcessSchedulerService: "Detecta proceso programado"\r
IntegrationHubQuarkusAppProcessSchedulerService -> IntegrationHubQuarkusAppProcessExecutionService: "Lanza ejecucion"\r
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
