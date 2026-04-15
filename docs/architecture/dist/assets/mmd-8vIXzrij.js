function r(e){switch(e){case"index":return`---\r
title: "Landscape view"\r
---\r
graph TB\r
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
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
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
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
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
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
`;case"security":return`---\r
title: "Flujo OIDC y autorizacion"\r
---\r
graph TB\r
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
  subgraph IntegrationHubAdminConsole["\`Admin Console\`"]\r
    IntegrationHubAdminConsole.ReactApp@{ shape: rectangle, label: "React + PatternFly UI" }\r
    IntegrationHubAdminConsole.OidcClient@{ shape: rectangle, label: "OIDC Client" }\r
    IntegrationHubAdminConsole.ProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
    IntegrationHubAdminConsole.OperationsConsole@{ shape: rectangle, label: "Operations Console" }\r
  end\r
  subgraph IntegrationHubQuarkusApp["\`Quarkus Native App\`"]\r
    IntegrationHubQuarkusApp.AdminApi@{ shape: rectangle, label: "Admin API" }\r
    IntegrationHubQuarkusApp.ExecutionApi@{ shape: rectangle, label: "Execution API" }\r
    IntegrationHubQuarkusApp.QueryApi@{ shape: rectangle, label: "Query API" }\r
  end\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  IntegrationHubAdminConsole.ReactApp -. "\`Gestiona sesion\`" .-> IntegrationHubAdminConsole.OidcClient\r
  IntegrationHubAdminConsole.ReactApp -. "\`Edita pipelines\`" .-> IntegrationHubAdminConsole.ProcessDesigner\r
  IntegrationHubAdminConsole.ReactApp -. "\`Consulta ejecuciones\`" .-> IntegrationHubAdminConsole.OperationsConsole\r
  IntegrationHubAdminConsole.ProcessDesigner -. "\`CRUD de catalogos y procesos\`" .-> IntegrationHubQuarkusApp.AdminApi\r
  IntegrationHubAdminConsole.OperationsConsole -. "\`Ejecuta procesos\`" .-> IntegrationHubQuarkusApp.ExecutionApi\r
  IntegrationHubAdminConsole.OperationsConsole -. "\`Consulta jobs y auditoria\`" .-> IntegrationHubQuarkusApp.QueryApi\r
  IntegrationHubAdminConsole.OidcClient -. "\`Login y refresh token\`" .-> Iam\r
  IntegrationHubQuarkusApp -. "\`Valida access tokens\`" .-> Iam\r
`;case"ingestion":return`---\r
title: "Fuentes, readers y persistencia"\r
---\r
graph TB\r
  IntegrationHubQuarkusAppProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
  IntegrationHubQuarkusAppSourceRegistry@{ shape: rectangle, label: "Source Provider Registry" }\r
  IntegrationHubQuarkusAppReaderRegistry@{ shape: rectangle, label: "Reader Provider Registry" }\r
  IntegrationHubQuarkusAppTaskRegistry@{ shape: rectangle, label: "Task Provider Registry" }\r
  subgraph IntegrationHubQuarkusAppTaskProviders["\`Task Providers\`"]\r
    IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider@{ shape: rectangle, label: "DbWriteTaskProvider" }\r
  end\r
  IntegrationHubQuarkusAppSourceProviders@{ shape: rectangle, label: "Source Providers" }\r
  IntegrationHubQuarkusAppReaderProviders@{ shape: rectangle, label: "Reader Providers" }\r
  FileSourcesFilesystem@{ shape: rectangle, label: "File System" }\r
  FileSourcesFtp@{ shape: rectangle, label: "FTP" }\r
  FileSourcesSftp@{ shape: rectangle, label: "SFTP" }\r
  FileSourcesRestSource@{ shape: rectangle, label: "REST Source" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve fuente\`" .-> IntegrationHubQuarkusAppSourceRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve reader\`" .-> IntegrationHubQuarkusAppReaderRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve tarea\`" .-> IntegrationHubQuarkusAppTaskRegistry\r
  IntegrationHubQuarkusAppSourceRegistry -. "\`Usa implementations\`" .-> IntegrationHubQuarkusAppSourceProviders\r
  IntegrationHubQuarkusAppReaderRegistry -. "\`Usa implementations\`" .-> IntegrationHubQuarkusAppReaderProviders\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Ejecuta DB_WRITE\`" .-> IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Persiste definiciones y tasks\`" .-> Db\r
  IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider -. "\`Batch insert, update y upsert\`" .-> Db\r
`;case"observability":return`---\r
title: "Trazas, auditoria y operacion"\r
---\r
graph TB\r
  subgraph IntegrationHubAdminConsole["\`Admin Console\`"]\r
    IntegrationHubAdminConsole.OperationsConsole@{ shape: rectangle, label: "Operations Console" }\r
  end\r
  subgraph IntegrationHubQuarkusApp["\`Quarkus Native App\`"]\r
    IntegrationHubQuarkusApp.QueryApi@{ shape: rectangle, label: "Query API" }\r
    IntegrationHubQuarkusApp.Telemetry@{ shape: rectangle, label: "OpenTelemetry Instrumentation" }\r
    IntegrationHubQuarkusApp.AuditService@{ shape: rectangle, label: "Audit Service" }\r
  end\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  ObservabilityJaeger@{ shape: rectangle, label: "Jaeger" }\r
  IntegrationHubAdminConsole.OperationsConsole -. "\`Consulta jobs y auditoria\`" .-> IntegrationHubQuarkusApp.QueryApi\r
  IntegrationHubQuarkusApp.QueryApi -. "\`Consulta eventos\`" .-> IntegrationHubQuarkusApp.AuditService\r
  ObservabilityOtel -. "\`Entrega trazas\`" .-> ObservabilityJaeger\r
  IntegrationHubQuarkusApp -. "\`Exporta trazas\`" .-> ObservabilityOtel\r
  IntegrationHubQuarkusApp -. "\`Persiste configuracion, jobs, auditoria y staging\`" .-> Db\r
`;case"runtime":return`---\r
title: "Scheduler y ejecucion de procesos"\r
---\r
graph TB\r
  IntegrationHubQuarkusAppScheduler@{ shape: rectangle, label: "Scheduler" }\r
  IntegrationHubQuarkusAppExecutionApi@{ shape: rectangle, label: "Execution API" }\r
  subgraph IntegrationHubQuarkusAppProcessEngine["\`Process Engine\`"]\r
    IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService@{ shape: rectangle, label: "ProcessExecutionService" }\r
    IntegrationHubQuarkusAppProcessEngine.ProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
    IntegrationHubQuarkusAppProcessEngine.JsonConfigurationMapper@{ shape: rectangle, label: "JsonConfigurationMapper" }\r
  end\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  IntegrationHubQuarkusAppTelemetry@{ shape: rectangle, label: "OpenTelemetry Instrumentation" }\r
  IntegrationHubQuarkusAppTaskRegistry@{ shape: rectangle, label: "Task Provider Registry" }\r
  subgraph IntegrationHubQuarkusAppTaskProviders["\`Task Providers\`"]\r
    IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider@{ shape: rectangle, label: "DbWriteTaskProvider" }\r
    IntegrationHubQuarkusAppTaskProviders.RestCallTaskProvider@{ shape: rectangle, label: "RestCallTaskProvider" }\r
    IntegrationHubQuarkusAppTaskProviders.NotificationTaskProvider@{ shape: rectangle, label: "NotificationTaskProvider" }\r
  end\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -. "\`Lee configuracion JSON\`" .-> IntegrationHubQuarkusAppProcessEngine.JsonConfigurationMapper\r
  IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -. "\`Resuelve TaskProvider\`" .-> IntegrationHubQuarkusAppTaskRegistry\r
  IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -. "\`Ejecuta DB_WRITE\`" .-> IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider\r
  IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -. "\`Ejecuta REST_CALL\`" .-> IntegrationHubQuarkusAppTaskProviders.RestCallTaskProvider\r
  IntegrationHubQuarkusAppProcessEngine.ProcessExecutionService -. "\`Ejecuta NOTIFICATION\`" .-> IntegrationHubQuarkusAppTaskProviders.NotificationTaskProvider\r
  IntegrationHubQuarkusAppProcessEngine.ProcessCatalogService -. "\`Persiste definiciones y tasks\`" .-> Db\r
  IntegrationHubQuarkusAppTaskProviders.DbWriteTaskProvider -. "\`Batch insert, update y upsert\`" .-> Db\r
  IntegrationHubQuarkusAppTaskProviders.RestCallTaskProvider -. "\`Envia payloads\`" .-> ExternalApi\r
  IntegrationHubQuarkusAppTaskProviders.NotificationTaskProvider -. "\`Webhook y notificaciones\`" .-> ExternalApi\r
  IntegrationHubQuarkusAppScheduler -. "\`Dispara procesos programados\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppExecutionApi -. "\`Inicia ejecuciones\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Registra eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Crea spans\`" .-> IntegrationHubQuarkusAppTelemetry\r
`;case"access":return`---\r
title: "Realm, clientes y autorizacion"\r
---\r
graph TB\r
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
  subgraph IntegrationHubAdminConsole["\`Admin Console\`"]\r
    IntegrationHubAdminConsole.ReactApp@{ shape: rectangle, label: "React + PatternFly UI" }\r
    IntegrationHubAdminConsole.OidcClient@{ shape: rectangle, label: "OIDC Client" }\r
    IntegrationHubAdminConsole.ProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
    IntegrationHubAdminConsole.OperationsConsole@{ shape: rectangle, label: "Operations Console" }\r
  end\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  subgraph IntegrationHubQuarkusApp["\`Quarkus Native App\`"]\r
    IntegrationHubQuarkusApp.AdminApi@{ shape: rectangle, label: "Admin API" }\r
    IntegrationHubQuarkusApp.ExecutionApi@{ shape: rectangle, label: "Execution API" }\r
    IntegrationHubQuarkusApp.QueryApi@{ shape: rectangle, label: "Query API" }\r
  end\r
  IntegrationHubAdminConsole.OidcClient -. "\`Login y refresh token\`" .-> Iam\r
  IntegrationHubAdminConsole.ReactApp -. "\`Gestiona sesion\`" .-> IntegrationHubAdminConsole.OidcClient\r
  IntegrationHubAdminConsole.ReactApp -. "\`Edita pipelines\`" .-> IntegrationHubAdminConsole.ProcessDesigner\r
  IntegrationHubAdminConsole.ReactApp -. "\`Consulta ejecuciones\`" .-> IntegrationHubAdminConsole.OperationsConsole\r
  IntegrationHubAdminConsole.ProcessDesigner -. "\`CRUD de catalogos y procesos\`" .-> IntegrationHubQuarkusApp.AdminApi\r
  IntegrationHubAdminConsole.OperationsConsole -. "\`Ejecuta procesos\`" .-> IntegrationHubQuarkusApp.ExecutionApi\r
  IntegrationHubAdminConsole.OperationsConsole -. "\`Consulta jobs y auditoria\`" .-> IntegrationHubQuarkusApp.QueryApi\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHubAdminConsole\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHubAdminConsole\r
`;default:throw new Error("Unknown viewId: "+e)}}export{r as mmdSource};
