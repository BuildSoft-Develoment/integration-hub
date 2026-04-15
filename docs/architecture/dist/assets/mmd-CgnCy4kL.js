function r(e){switch(e){case"index":return`---\r
title: "Landscape view"\r
---\r
graph TB\r
  User@{ shape: rectangle, label: "Usuario de negocio" }\r
  Admin@{ shape: rectangle, label: "Administrador de integraciones" }\r
  IntegrationHub@{ shape: rectangle, label: "Integration Hub Platform" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  FileSources@{ shape: rectangle, label: "Fuentes externas" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  Observability@{ shape: rectangle, label: "Observabilidad" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHub\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHub\r
  IntegrationHub -. "\`[...]\`" .-> ExternalApi\r
  IntegrationHub -. "\`[...]\`" .-> FileSources\r
  IntegrationHub -. "\`[...]\`" .-> Iam\r
  IntegrationHub -. "\`Exporta trazas\`" .-> Observability\r
  IntegrationHub -. "\`[...]\`" .-> Db\r
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
  FileSources@{ shape: rectangle, label: "Fuentes externas" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  Observability@{ shape: rectangle, label: "Observabilidad" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHub.AdminConsole\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHub.AdminConsole\r
  IntegrationHub.AdminConsole -. "\`Invoca APIs protegidas\`" .-> IntegrationHub.QuarkusApp\r
  IntegrationHub.AdminConsole -. "\`Autenticacion OIDC\`" .-> Iam\r
  IntegrationHub.QuarkusApp -. "\`Invoca APIs de negocio\`" .-> ExternalApi\r
  IntegrationHub.QuarkusApp -. "\`[...]\`" .-> FileSources\r
  IntegrationHub.QuarkusApp -. "\`Valida access tokens\`" .-> Iam\r
  IntegrationHub.QuarkusApp -. "\`Exporta trazas\`" .-> Observability\r
  IntegrationHub.QuarkusApp -. "\`Persiste configuracion, jobs, auditoria y staging\`" .-> Db\r
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
  IntegrationHubQuarkusAppProcessExecutionService@{ shape: rectangle, label: "ProcessExecutionService" }\r
  IntegrationHubQuarkusAppProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  IntegrationHubQuarkusAppProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
  IntegrationHubQuarkusAppDbWriteTaskProvider@{ shape: rectangle, label: "DbWriteTaskProvider" }\r
  IntegrationHubQuarkusAppRestCallTaskProvider@{ shape: rectangle, label: "RestCallTaskProvider" }\r
  IntegrationHubQuarkusAppNotificationTaskProvider@{ shape: rectangle, label: "NotificationTaskProvider" }\r
  IntegrationHubQuarkusAppTaskProviderRegistryCode@{ shape: rectangle, label: "TaskProviderRegistry" }\r
  IntegrationHubQuarkusAppSourceProviderRegistryCode@{ shape: rectangle, label: "SourceProviderRegistry" }\r
  IntegrationHubQuarkusAppReaderProviderRegistryCode@{ shape: rectangle, label: "ReaderProviderRegistry" }\r
  IntegrationHubQuarkusAppJsonConfigurationMapper@{ shape: rectangle, label: "JsonConfigurationMapper" }\r
  IntegrationHubQuarkusAppSourceRegistry@{ shape: rectangle, label: "Source Provider Registry" }\r
  IntegrationHubQuarkusAppReaderRegistry@{ shape: rectangle, label: "Reader Provider Registry" }\r
  IntegrationHubQuarkusAppTaskRegistry@{ shape: rectangle, label: "Task Provider Registry" }\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  IntegrationHubQuarkusAppTelemetry@{ shape: rectangle, label: "OpenTelemetry instrumentation" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  IntegrationHubQuarkusAppSourceProviders@{ shape: rectangle, label: "Source Providers" }\r
  IntegrationHubQuarkusAppReaderProviders@{ shape: rectangle, label: "Reader Providers" }\r
  IntegrationHubQuarkusAppTaskProviders@{ shape: rectangle, label: "Task Providers" }\r
  FileSourcesFilesystem@{ shape: rectangle, label: "File System" }\r
  FileSourcesFtp@{ shape: rectangle, label: "FTP" }\r
  FileSourcesSftp@{ shape: rectangle, label: "SFTP" }\r
  FileSourcesRestSource@{ shape: rectangle, label: "REST Source" }\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  IntegrationHubQuarkusAppAdminApi -. "\`Configura definiciones\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppExecutionApi -. "\`Inicia ejecuciones\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppQueryApi -. "\`Consulta eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve fuente\`" .-> IntegrationHubQuarkusAppSourceRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve reader\`" .-> IntegrationHubQuarkusAppReaderRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve tarea\`" .-> IntegrationHubQuarkusAppTaskRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Registra eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Crea spans\`" .-> IntegrationHubQuarkusAppTelemetry\r
  IntegrationHubQuarkusAppSourceRegistry -. "\`Usa implementations\`" .-> IntegrationHubQuarkusAppSourceProviders\r
  IntegrationHubQuarkusAppReaderRegistry -. "\`Usa implementations\`" .-> IntegrationHubQuarkusAppReaderProviders\r
  IntegrationHubQuarkusAppTaskRegistry -. "\`Usa implementations\`" .-> IntegrationHubQuarkusAppTaskProviders\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Ejecuta DB_WRITE\`" .-> IntegrationHubQuarkusAppDbWriteTaskProvider\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Ejecuta REST_CALL\`" .-> IntegrationHubQuarkusAppRestCallTaskProvider\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Ejecuta NOTIFICATION\`" .-> IntegrationHubQuarkusAppNotificationTaskProvider\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Resuelve TaskProvider\`" .-> IntegrationHubQuarkusAppTaskProviderRegistryCode\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Resuelve SourceProvider\`" .-> IntegrationHubQuarkusAppSourceProviderRegistryCode\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Resuelve ReaderProvider\`" .-> IntegrationHubQuarkusAppReaderProviderRegistryCode\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Lee configuracion JSON\`" .-> IntegrationHubQuarkusAppJsonConfigurationMapper\r
  IntegrationHubQuarkusAppProcessCatalogService -. "\`Persiste definiciones y tasks\`" .-> Db\r
  IntegrationHubQuarkusAppDbWriteTaskProvider -. "\`Batch insert/update/upsert\`" .-> Db\r
  IntegrationHubQuarkusAppRestCallTaskProvider -. "\`Envio de payloads\`" .-> ExternalApi\r
  IntegrationHubQuarkusAppNotificationTaskProvider -. "\`Webhook/email/log\`" .-> ExternalApi\r
`;case"code":return`---\r
title: "Nivel 4 - Codigo clave del motor de ejecucion"\r
---\r
graph TB\r
  IntegrationHubQuarkusAppProcessExecutionService@{ shape: rectangle, label: "ProcessExecutionService" }\r
  IntegrationHubQuarkusAppProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  IntegrationHubQuarkusAppDbWriteTaskProvider@{ shape: rectangle, label: "DbWriteTaskProvider" }\r
  IntegrationHubQuarkusAppRestCallTaskProvider@{ shape: rectangle, label: "RestCallTaskProvider" }\r
  IntegrationHubQuarkusAppNotificationTaskProvider@{ shape: rectangle, label: "NotificationTaskProvider" }\r
  IntegrationHubQuarkusAppTaskProviderRegistryCode@{ shape: rectangle, label: "TaskProviderRegistry" }\r
  IntegrationHubQuarkusAppSourceProviderRegistryCode@{ shape: rectangle, label: "SourceProviderRegistry" }\r
  IntegrationHubQuarkusAppReaderProviderRegistryCode@{ shape: rectangle, label: "ReaderProviderRegistry" }\r
  IntegrationHubQuarkusAppJsonConfigurationMapper@{ shape: rectangle, label: "JsonConfigurationMapper" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Ejecuta DB_WRITE\`" .-> IntegrationHubQuarkusAppDbWriteTaskProvider\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Ejecuta REST_CALL\`" .-> IntegrationHubQuarkusAppRestCallTaskProvider\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Ejecuta NOTIFICATION\`" .-> IntegrationHubQuarkusAppNotificationTaskProvider\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Resuelve TaskProvider\`" .-> IntegrationHubQuarkusAppTaskProviderRegistryCode\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Resuelve SourceProvider\`" .-> IntegrationHubQuarkusAppSourceProviderRegistryCode\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Resuelve ReaderProvider\`" .-> IntegrationHubQuarkusAppReaderProviderRegistryCode\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Lee configuracion JSON\`" .-> IntegrationHubQuarkusAppJsonConfigurationMapper\r
  IntegrationHubQuarkusAppProcessCatalogService -. "\`Persiste definiciones y tasks\`" .-> Db\r
  IntegrationHubQuarkusAppDbWriteTaskProvider -. "\`Batch insert/update/upsert\`" .-> Db\r
  IntegrationHubQuarkusAppRestCallTaskProvider -. "\`Envio de payloads\`" .-> ExternalApi\r
  IntegrationHubQuarkusAppNotificationTaskProvider -. "\`Webhook/email/log\`" .-> ExternalApi\r
`;default:throw new Error("Unknown viewId: "+e)}}export{r as mmdSource};
