function r(e){switch(e){case"index":return`---\r
title: "Landscape view"\r
---\r
graph TB\r
  User@{ shape: rectangle, label: "Usuario de negocio" }\r
  Admin@{ shape: rectangle, label: "Administrador de integraciones" }\r
  IntegrationHub@{ shape: rectangle, label: "Integration Hub Platform" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  FileSources@{ shape: rectangle, label: "Fuentes externas" }\r
  Observability@{ shape: rectangle, label: "Observabilidad" }\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHub\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHub\r
  IntegrationHub -. "\`[...]\`" .-> ExternalApi\r
  IntegrationHub -. "\`[...]\`" .-> Iam\r
  IntegrationHub -. "\`[...]\`" .-> Db\r
  IntegrationHub -. "\`[...]\`" .-> FileSources\r
  IntegrationHub -. "\`Exporta trazas\`" .-> Observability\r
`;case"context":return`---\r
title: "Nivel 1 - Contexto del sistema"\r
---\r
graph TB\r
  User@{ shape: rectangle, label: "Usuario de negocio" }\r
  Admin@{ shape: rectangle, label: "Administrador de integraciones" }\r
  subgraph IntegrationHub["\`Integration Hub Platform\`"]\r
    IntegrationHub.AdminConsole@{ shape: rectangle, label: "Admin Console" }\r
    IntegrationHub.QuarkusApp@{ shape: rectangle, label: "Quarkus Native App" }\r
  end\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  FileSources@{ shape: rectangle, label: "Fuentes externas" }\r
  Observability@{ shape: rectangle, label: "Observabilidad" }\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHub.AdminConsole\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHub.AdminConsole\r
  IntegrationHub.AdminConsole -. "\`Invoca APIs protegidas\`" .-> IntegrationHub.QuarkusApp\r
  IntegrationHub.AdminConsole -. "\`Autenticacion OIDC\`" .-> Iam\r
  IntegrationHub.QuarkusApp -. "\`Invoca APIs de negocio\`" .-> ExternalApi\r
  IntegrationHub.QuarkusApp -. "\`Valida access tokens\`" .-> Iam\r
  IntegrationHub.QuarkusApp -. "\`Persiste configuracion, jobs, auditoria y staging\`" .-> Db\r
  IntegrationHub.QuarkusApp -. "\`[...]\`" .-> FileSources\r
  IntegrationHub.QuarkusApp -. "\`Exporta trazas\`" .-> Observability\r
`;case"containers":return`---\r
title: "Nivel 2 - Contenedores"\r
---\r
graph TB\r
  User@{ shape: rectangle, label: "Usuario de negocio" }\r
  Admin@{ shape: rectangle, label: "Administrador de integraciones" }\r
  IntegrationHubAdminConsole@{ shape: rectangle, label: "Admin Console" }\r
  IntegrationHubQuarkusApp@{ shape: rectangle, label: "Quarkus Native App" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  FileSourcesFilesystem@{ shape: rectangle, label: "File System" }\r
  FileSourcesFtp@{ shape: rectangle, label: "FTP" }\r
  FileSourcesSftp@{ shape: rectangle, label: "SFTP" }\r
  FileSourcesRestSource@{ shape: rectangle, label: "REST Source" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  ObservabilityJaeger@{ shape: rectangle, label: "Jaeger" }\r
  IntegrationHubAdminConsole -. "\`Invoca APIs protegidas\`" .-> IntegrationHubQuarkusApp\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHubAdminConsole\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHubAdminConsole\r
  IntegrationHubAdminConsole -. "\`Autenticacion OIDC\`" .-> Iam\r
  IntegrationHubQuarkusApp -. "\`Valida access tokens\`" .-> Iam\r
  IntegrationHubQuarkusApp -. "\`Persiste configuracion, jobs, auditoria y staging\`" .-> Db\r
  IntegrationHubQuarkusApp -. "\`Lee archivos locales\`" .-> FileSourcesFilesystem\r
  IntegrationHubQuarkusApp -. "\`Descarga archivos\`" .-> FileSourcesFtp\r
  IntegrationHubQuarkusApp -. "\`Descarga archivos\`" .-> FileSourcesSftp\r
  IntegrationHubQuarkusApp -. "\`Obtiene payloads remotos\`" .-> FileSourcesRestSource\r
  IntegrationHubQuarkusApp -. "\`Invoca APIs de negocio\`" .-> ExternalApi\r
  IntegrationHubQuarkusApp -. "\`Exporta trazas\`" .-> ObservabilityOtel\r
  ObservabilityOtel -. "\`Entrega trazas\`" .-> ObservabilityJaeger\r
`;case"components":return`---\r
title: "Nivel 3 - Componentes del backend Quarkus"\r
---\r
graph TB\r
  IntegrationHubQuarkusAppAdminApi@{ shape: rectangle, label: "Admin API" }\r
  IntegrationHubQuarkusAppExecutionApi@{ shape: rectangle, label: "Execution API" }\r
  IntegrationHubQuarkusAppQueryApi@{ shape: rectangle, label: "Query API" }\r
  IntegrationHubQuarkusAppScheduler@{ shape: rectangle, label: "Scheduler" }\r
  IntegrationHubQuarkusAppProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
  IntegrationHubQuarkusAppSourceRegistry@{ shape: rectangle, label: "Source Provider Registry" }\r
  IntegrationHubQuarkusAppReaderRegistry@{ shape: rectangle, label: "Reader Provider Registry" }\r
  IntegrationHubQuarkusAppTaskRegistry@{ shape: rectangle, label: "Task Provider Registry" }\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  IntegrationHubQuarkusAppTelemetry@{ shape: rectangle, label: "OpenTelemetry Instrumentation" }\r
  IntegrationHubQuarkusAppSourceProviders@{ shape: rectangle, label: "Source Providers" }\r
  IntegrationHubQuarkusAppReaderProviders@{ shape: rectangle, label: "Reader Providers" }\r
  IntegrationHubQuarkusAppTaskProviders@{ shape: rectangle, label: "Task Providers" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  FileSourcesFilesystem@{ shape: rectangle, label: "File System" }\r
  FileSourcesFtp@{ shape: rectangle, label: "FTP" }\r
  FileSourcesSftp@{ shape: rectangle, label: "SFTP" }\r
  FileSourcesRestSource@{ shape: rectangle, label: "REST Source" }\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  IntegrationHubQuarkusAppAdminApi -. "\`Configura definiciones\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppExecutionApi -. "\`Inicia ejecuciones\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppQueryApi -. "\`Consulta eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppScheduler -. "\`Dispara procesos programados\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve fuente\`" .-> IntegrationHubQuarkusAppSourceRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve reader\`" .-> IntegrationHubQuarkusAppReaderRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve tarea\`" .-> IntegrationHubQuarkusAppTaskRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`[...]\`" .-> IntegrationHubQuarkusAppTaskProviders\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Registra eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Crea spans\`" .-> IntegrationHubQuarkusAppTelemetry\r
  IntegrationHubQuarkusAppSourceRegistry -. "\`Usa implementations\`" .-> IntegrationHubQuarkusAppSourceProviders\r
  IntegrationHubQuarkusAppReaderRegistry -. "\`Usa implementations\`" .-> IntegrationHubQuarkusAppReaderProviders\r
  IntegrationHubQuarkusAppTaskRegistry -. "\`Usa implementations\`" .-> IntegrationHubQuarkusAppTaskProviders\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Persiste definiciones y tasks\`" .-> Db\r
  IntegrationHubQuarkusAppTaskProviders -. "\`Batch insert, update y upsert\`" .-> Db\r
  IntegrationHubQuarkusAppTaskProviders -. "\`[...]\`" .-> ExternalApi\r
`;case"deployment":return`---\r
title: "Nivel 4 - Componentes internos del motor de ejecucion"\r
---\r
graph TB\r
  IntegrationHubQuarkusAppProcessEngineProcessExecutionService@{ shape: rectangle, label: "ProcessExecutionService" }\r
  IntegrationHubQuarkusAppProcessEngineProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper@{ shape: rectangle, label: "JsonConfigurationMapper" }\r
  IntegrationHubQuarkusAppSourceRegistry@{ shape: rectangle, label: "Source Provider Registry" }\r
  IntegrationHubQuarkusAppReaderRegistry@{ shape: rectangle, label: "Reader Provider Registry" }\r
  IntegrationHubQuarkusAppTaskRegistry@{ shape: rectangle, label: "Task Provider Registry" }\r
  IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider@{ shape: rectangle, label: "DbWriteTaskProvider" }\r
  IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider@{ shape: rectangle, label: "RestCallTaskProvider" }\r
  IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider@{ shape: rectangle, label: "NotificationTaskProvider" }\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  IntegrationHubQuarkusAppTelemetry@{ shape: rectangle, label: "OpenTelemetry Instrumentation" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  IntegrationHubQuarkusAppProcessEngineProcessExecutionService -. "\`Lee configuracion JSON\`" .-> IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper\r
  IntegrationHubQuarkusAppProcessEngineProcessExecutionService -. "\`Resuelve SourceProvider\`" .-> IntegrationHubQuarkusAppSourceRegistry\r
  IntegrationHubQuarkusAppProcessEngineProcessExecutionService -. "\`Resuelve ReaderProvider\`" .-> IntegrationHubQuarkusAppReaderRegistry\r
  IntegrationHubQuarkusAppProcessEngineProcessExecutionService -. "\`Resuelve TaskProvider\`" .-> IntegrationHubQuarkusAppTaskRegistry\r
  IntegrationHubQuarkusAppProcessEngineProcessExecutionService -. "\`Ejecuta DB_WRITE\`" .-> IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider\r
  IntegrationHubQuarkusAppProcessEngineProcessExecutionService -. "\`Ejecuta REST_CALL\`" .-> IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider\r
  IntegrationHubQuarkusAppProcessEngineProcessExecutionService -. "\`Ejecuta NOTIFICATION\`" .-> IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider\r
  IntegrationHubQuarkusAppProcessEngineProcessCatalogService -. "\`Persiste definiciones y tasks\`" .-> Db\r
  IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider -. "\`Batch insert, update y upsert\`" .-> Db\r
  IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider -. "\`Envia payloads\`" .-> ExternalApi\r
  IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider -. "\`Webhook y notificaciones\`" .-> ExternalApi\r
`;default:throw new Error("Unknown viewId: "+e)}}export{r as mmdSource};
