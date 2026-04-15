function r(e){switch(e){case"index":return`---\r
title: "Landscape view"\r
---\r
graph TB\r
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
  PlatformAdmin@{ icon: "fa:user", shape: rounded, label: "Platform Admin" }\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r
  Auditor@{ icon: "fa:user", shape: rounded, label: "Auditor" }\r
  InfraTeam@{ icon: "fa:user", shape: rounded, label: "Equipo de infraestructura" }\r
  SchedulerActor@{ icon: "fa:user", shape: rounded, label: "Scheduler" }\r
  AppService@{ shape: rectangle, label: "Integration Hub HTTP Service" }\r
  Vault@{ shape: rectangle, label: "Kubernetes Secrets / External Config" }\r
  LoadBalancer@{ shape: rectangle, label: "Load Balancer / Reverse Proxy" }\r
  SharedStorage@{ shape: rectangle, label: "Shared File Storage" }\r
  IngressController@{ shape: rectangle, label: "Ingress Controller" }\r
  IntegrationHub@{ shape: rectangle, label: "Integration Hub Platform" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  FileSources@{ shape: rectangle, label: "Fuentes externas" }\r
  Observability@{ shape: rectangle, label: "Observabilidad" }\r
  User -. "\`Accede por HTTPS\`" .-> LoadBalancer\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHub\r
  Admin -. "\`Administra por HTTPS\`" .-> LoadBalancer\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHub\r
  PlatformAdmin -. "\`UC-09\`" .-> Iam\r
  PlatformAdmin -. "\`UC-10\`" .-> Vault\r
  IntegrationAdmin -. "\`UC-01, UC-02, UC-03\`" .-> IntegrationHub\r
  Operator -. "\`UC-04, UC-06, UC-08\`" .-> IntegrationHub\r
  Auditor -. "\`UC-06, UC-07\`" .-> IntegrationHub\r
  InfraTeam -. "\`UC-10\`" .-> LoadBalancer\r
  InfraTeam -. "\`UC-10\`" .-> IngressController\r
  InfraTeam -. "\`UC-10\`" .-> SharedStorage\r
  SchedulerActor -. "\`UC-05\`" .-> IntegrationHub\r
  IntegrationHub -. "\`[...]\`" .-> ExternalApi\r
  IntegrationHub -. "\`[...]\`" .-> Iam\r
  IntegrationHub -. "\`[...]\`" .-> Db\r
  LoadBalancer -. "\`Reenvia trafico al cluster\`" .-> IngressController\r
  Vault -. "\`Entrega secretos y credenciales\`" .-> IntegrationHub\r
  SharedStorage -. "\`Comparte archivos locales\`" .-> IntegrationHub\r
  IntegrationHub -. "\`[...]\`" .-> FileSources\r
  IntegrationHub -. "\`Exporta trazas\`" .-> Observability\r
`;case"context":return`---\r
title: "Nivel 1 - Contexto del sistema"\r
---\r
graph TB\r
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r
  Auditor@{ icon: "fa:user", shape: rounded, label: "Auditor" }\r
  InfraTeam@{ icon: "fa:user", shape: rounded, label: "Equipo de infraestructura" }\r
  SchedulerActor@{ icon: "fa:user", shape: rounded, label: "Scheduler" }\r
  PlatformAdmin@{ icon: "fa:user", shape: rounded, label: "Platform Admin" }\r
  IntegrationHub@{ shape: rectangle, label: "Integration Hub Platform" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  FileSourcesFilesystem@{ shape: rectangle, label: "File System" }\r
  FileSourcesFtp@{ shape: rectangle, label: "FTP" }\r
  FileSourcesSftp@{ shape: rectangle, label: "SFTP" }\r
  FileSourcesRestSource@{ shape: rectangle, label: "REST Source" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  Observability@{ shape: rectangle, label: "Observabilidad" }\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHub\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHub\r
  IntegrationAdmin -. "\`UC-01, UC-02, UC-03\`" .-> IntegrationHub\r
  Operator -. "\`UC-04, UC-06, UC-08\`" .-> IntegrationHub\r
  Auditor -. "\`UC-06, UC-07\`" .-> IntegrationHub\r
  SchedulerActor -. "\`UC-05\`" .-> IntegrationHub\r
  PlatformAdmin -. "\`UC-09\`" .-> Iam\r
  IntegrationHub -. "\`[...]\`" .-> Iam\r
  IntegrationHub -. "\`[...]\`" .-> Db\r
  IntegrationHub -. "\`Lee archivos locales\`" .-> FileSourcesFilesystem\r
  IntegrationHub -. "\`Descarga archivos\`" .-> FileSourcesFtp\r
  IntegrationHub -. "\`Descarga archivos\`" .-> FileSourcesSftp\r
  IntegrationHub -. "\`Obtiene payloads remotos\`" .-> FileSourcesRestSource\r
  IntegrationHub -. "\`[...]\`" .-> ExternalApi\r
  IntegrationHub -. "\`Exporta trazas\`" .-> Observability\r
`;case"containers":return`---\r
title: "Nivel 2 - Contenedores"\r
---\r
graph TB\r
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r
  Auditor@{ icon: "fa:user", shape: rounded, label: "Auditor" }\r
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
  IntegrationAdmin -. "\`UC-01, UC-02, UC-03\`" .-> IntegrationHubAdminConsole\r
  Operator -. "\`UC-04, UC-06, UC-08\`" .-> IntegrationHubAdminConsole\r
  Auditor -. "\`UC-06, UC-07\`" .-> IntegrationHubAdminConsole\r
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
`;case"engine":return`---\r
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
  PlatformAdmin@{ icon: "fa:user", shape: rounded, label: "Platform Admin" }\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r
  Auditor@{ icon: "fa:user", shape: rounded, label: "Auditor" }\r
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
  PlatformAdmin -. "\`UC-09\`" .-> Iam\r
  IntegrationAdmin -. "\`UC-01, UC-02, UC-03\`" .-> IntegrationHubAdminConsole.ProcessDesigner\r
  Operator -. "\`UC-04, UC-06, UC-08\`" .-> IntegrationHubAdminConsole.OperationsConsole\r
  Auditor -. "\`UC-06, UC-07\`" .-> IntegrationHubAdminConsole.OperationsConsole\r
  IntegrationHubAdminConsole.OidcClient -. "\`Login y refresh token\`" .-> Iam\r
  IntegrationHubAdminConsole.ReactApp -. "\`Gestiona sesion\`" .-> IntegrationHubAdminConsole.OidcClient\r
  IntegrationHubAdminConsole.ReactApp -. "\`Edita pipelines\`" .-> IntegrationHubAdminConsole.ProcessDesigner\r
  IntegrationHubAdminConsole.ReactApp -. "\`Consulta ejecuciones\`" .-> IntegrationHubAdminConsole.OperationsConsole\r
  IntegrationHubAdminConsole.ProcessDesigner -. "\`CRUD de catalogos y procesos\`" .-> IntegrationHubQuarkusApp.AdminApi\r
  IntegrationHubAdminConsole.OperationsConsole -. "\`Ejecuta procesos\`" .-> IntegrationHubQuarkusApp.ExecutionApi\r
  IntegrationHubAdminConsole.OperationsConsole -. "\`Consulta jobs y auditoria\`" .-> IntegrationHubQuarkusApp.QueryApi\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHubAdminConsole\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHubAdminConsole\r
`;case"deployment_dev":return`---\r
title: "DEV"\r
---\r
graph TB\r
  subgraph DevApp["\`app\`"]\r
    subgraph DevApp.DockerHost["\`dockerHost\`"]\r
      DevApp.DockerHost.AdminConsole@{ shape: rectangle, label: "Admin Console" }\r
      DevApp.DockerHost.QuarkusApp@{ shape: rectangle, label: "Quarkus Native App" }\r
    end\r
  end\r
  subgraph DevData["\`data\`"]\r
    subgraph DevData.Data["\`data\`"]\r
      DevData.Data.Iam@{ shape: rectangle, label: "Keycloak" }\r
      DevData.Data.Db@{ shape: rectangle, label: "PostgreSQL" }\r
      DevData.Data.Otel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
      DevData.Data.Jaeger@{ shape: rectangle, label: "Jaeger" }\r
    end\r
  end\r
  DevApp.DockerHost.AdminConsole -. "\`[...]\`" .-> DevApp.DockerHost.QuarkusApp\r
  DevData.Data.Otel -. "\`Entrega trazas\`" .-> DevData.Data.Jaeger\r
  DevApp.DockerHost.AdminConsole -. "\`[...]\`" .-> DevData.Data.Iam\r
  DevApp.DockerHost.QuarkusApp -. "\`[...]\`" .-> DevData.Data.Db\r
  DevApp.DockerHost.QuarkusApp -. "\`Valida access tokens\`" .-> DevData.Data.Iam\r
  DevApp.DockerHost.QuarkusApp -. "\`Exporta trazas\`" .-> DevData.Data.Otel\r
`;case"deployment_pre":return`---\r
title: "PRE"\r
---\r
graph TB\r
  subgraph PreServices["\`services\`"]\r
    subgraph PreServices.ConfigNode["\`configNode\`"]\r
      PreServices.ConfigNode.Vault@{ shape: rectangle, label: "Kubernetes Secrets / External Config" }\r
      PreServices.ConfigNode.SharedStorage@{ shape: rectangle, label: "Shared File Storage" }\r
    end\r
  end\r
  subgraph PreApp["\`app\`"]\r
    subgraph PreApp.PreNode1["\`preNode1\`"]\r
      PreApp.PreNode1.AdminConsole@{ shape: rectangle, label: "Admin Console" }\r
      PreApp.PreNode1.QuarkusApp@{ shape: rectangle, label: "Quarkus Native App" }\r
    end\r
  end\r
  subgraph PreData["\`data\`"]\r
    subgraph PreData.Data["\`data\`"]\r
      PreData.Data.Iam@{ shape: rectangle, label: "Keycloak" }\r
      PreData.Data.Db@{ shape: rectangle, label: "PostgreSQL" }\r
      PreData.Data.Otel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
      PreData.Data.Jaeger@{ shape: rectangle, label: "Jaeger" }\r
    end\r
  end\r
  PreApp.PreNode1.AdminConsole -. "\`[...]\`" .-> PreApp.PreNode1.QuarkusApp\r
  PreData.Data.Otel -. "\`Entrega trazas\`" .-> PreData.Data.Jaeger\r
  PreApp.PreNode1.AdminConsole -. "\`[...]\`" .-> PreData.Data.Iam\r
  PreApp.PreNode1.QuarkusApp -. "\`[...]\`" .-> PreData.Data.Db\r
  PreApp.PreNode1.QuarkusApp -. "\`Valida access tokens\`" .-> PreData.Data.Iam\r
  PreApp.PreNode1.QuarkusApp -. "\`Exporta trazas\`" .-> PreData.Data.Otel\r
  PreServices.ConfigNode.Vault -. "\`Entrega secretos y credenciales\`" .-> PreApp.PreNode1.QuarkusApp\r
  PreServices.ConfigNode.SharedStorage -. "\`Comparte archivos locales\`" .-> PreApp.PreNode1.QuarkusApp\r
`;case"deployment_prod":return'---\r\ntitle: "PROD"\r\n---\r\ngraph TB\r\n  subgraph ProdEdge["`edge`"]\r\n    subgraph ProdEdge.LoadBalancer["`loadBalancer`"]\r\n      ProdEdge.LoadBalancer.LoadBalancer@{ shape: rectangle, label: "Load Balancer / Reverse Proxy" }\r\n    end\r\n  end\r\n  subgraph ProdServices["`services`"]\r\n    subgraph ProdServices.ServicesNode["`servicesNode`"]\r\n      ProdServices.ServicesNode.Vault@{ shape: rectangle, label: "Kubernetes Secrets / External Config" }\r\n      ProdServices.ServicesNode.SharedStorage@{ shape: rectangle, label: "Shared File Storage" }\r\n    end\r\n  end\r\n  subgraph ProdApp["`app`"]\r\n    subgraph ProdApp.AppCluster["`appCluster`"]\r\n      subgraph ProdApp.AppCluster.IngressController["`ingressController`"]\r\n        ProdApp.AppCluster.IngressController.IngressController@{ shape: rectangle, label: "Ingress Controller" }\r\n      end\r\n      ProdApp.AppCluster.AppHttpService@{ shape: rectangle, label: "Integration Hub HTTP Service" }\r\n      subgraph ProdApp.AppCluster.AppPod1["`appPod1`"]\r\n        ProdApp.AppCluster.AppPod1.AdminConsole@{ shape: rectangle, label: "Admin Console" }\r\n        ProdApp.AppCluster.AppPod1.QuarkusApp@{ shape: rectangle, label: "Quarkus Native App" }\r\n      end\r\n      subgraph ProdApp.AppCluster.AppPod2["`appPod2`"]\r\n        ProdApp.AppCluster.AppPod2.AdminConsole@{ shape: rectangle, label: "Admin Console" }\r\n        ProdApp.AppCluster.AppPod2.QuarkusApp@{ shape: rectangle, label: "Quarkus Native App" }\r\n      end\r\n    end\r\n  end\r\n  subgraph ProdData["`data`"]\r\n    subgraph ProdData.PostgresHa["`postgresHa`"]\r\n      subgraph ProdData.PostgresHa.PostgresPrimary["`postgresPrimary`"]\r\n        ProdData.PostgresHa.PostgresPrimary.Db@{ shape: rectangle, label: "PostgreSQL" }\r\n      end\r\n      subgraph ProdData.PostgresHa.PostgresReplica["`postgresReplica`"]\r\n        ProdData.PostgresHa.PostgresReplica.Db@{ shape: rectangle, label: "PostgreSQL" }\r\n      end\r\n    end\r\n    subgraph ProdData.KeycloakHa["`keycloakHa`"]\r\n      subgraph ProdData.KeycloakHa.KeycloakNode1["`keycloakNode1`"]\r\n        ProdData.KeycloakHa.KeycloakNode1.Iam@{ shape: rectangle, label: "Keycloak" }\r\n      end\r\n      subgraph ProdData.KeycloakHa.KeycloakNode2["`keycloakNode2`"]\r\n        ProdData.KeycloakHa.KeycloakNode2.Iam@{ shape: rectangle, label: "Keycloak" }\r\n      end\r\n    end\r\n    subgraph ProdData.ObservabilityNode["`observabilityNode`"]\r\n      ProdData.ObservabilityNode.Otel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r\n      ProdData.ObservabilityNode.Jaeger@{ shape: rectangle, label: "Jaeger" }\r\n    end\r\n  end\r\n  ProdApp.AppCluster.AppPod1.AdminConsole -. "`[...]`" .-> ProdApp.AppCluster.AppPod1.QuarkusApp\r\n  ProdApp.AppCluster.AppPod2.AdminConsole -. "`[...]`" .-> ProdApp.AppCluster.AppPod2.QuarkusApp\r\n  ProdData.ObservabilityNode.Otel -. "`Entrega trazas`" .-> ProdData.ObservabilityNode.Jaeger\r\n  ProdEdge.LoadBalancer.LoadBalancer -. "`Reenvia trafico al cluster`" .-> ProdApp.AppCluster.IngressController.IngressController\r\n  ProdApp.AppCluster.AppPod1.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.AppPod1.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresPrimary.Db\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresReplica.Db\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`Exporta trazas`" .-> ProdData.ObservabilityNode.Otel\r\n  ProdServices.ServicesNode.Vault -. "`Entrega secretos y credenciales`" .-> ProdApp.AppCluster.AppPod1.QuarkusApp\r\n  ProdServices.ServicesNode.SharedStorage -. "`Comparte archivos locales`" .-> ProdApp.AppCluster.AppPod1.QuarkusApp\r\n  ProdApp.AppCluster.AppPod2.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.AppPod2.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresPrimary.Db\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresReplica.Db\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`Exporta trazas`" .-> ProdData.ObservabilityNode.Otel\r\n  ProdServices.ServicesNode.Vault -. "`Entrega secretos y credenciales`" .-> ProdApp.AppCluster.AppPod2.QuarkusApp\r\n  ProdServices.ServicesNode.SharedStorage -. "`Comparte archivos locales`" .-> ProdApp.AppCluster.AppPod2.QuarkusApp\r\n  ProdApp.AppCluster.IngressController -. "`Ruta UI y API`" .-> ProdApp.AppCluster.AppHttpService\r\n  ProdApp.AppCluster.AppHttpService -. "`Balancea trafico HTTP`" .-> ProdApp.AppCluster.AppPod1\r\n  ProdApp.AppCluster.AppHttpService -. "`Balancea trafico HTTP`" .-> ProdApp.AppCluster.AppPod2\r\n  ProdEdge.LoadBalancer -. "`HTTPS`" .-> ProdApp.AppCluster.IngressController\r\n';case"usecase_uc01_source":return`---\r
title: "UC-01 Configurar fuente"\r
---\r
graph LR\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  IntegrationHubAdminConsoleProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
  IntegrationHubQuarkusAppAdminApi@{ shape: rectangle, label: "Admin API" }\r
  IntegrationHubQuarkusAppProcessEngineProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  IntegrationAdmin -. "\`Define tipo de fuente y parametros\`" .-> IntegrationHubAdminConsoleProcessDesigner\r
  IntegrationHubAdminConsoleProcessDesigner -. "\`Registra source definition\`" .-> IntegrationHubQuarkusAppAdminApi\r
  IntegrationHubQuarkusAppAdminApi -. "\`Persiste catalogo\`" .-> IntegrationHubQuarkusAppProcessEngineProcessCatalogService\r
  IntegrationHubQuarkusAppProcessEngineProcessCatalogService -. "\`Guarda source definition\`" .-> Db\r
`;case"usecase_uc02_reader":return`---\r
title: "UC-02 Configurar reader"\r
---\r
graph LR\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  IntegrationHubAdminConsoleProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
  IntegrationHubQuarkusAppAdminApi@{ shape: rectangle, label: "Admin API" }\r
  IntegrationHubQuarkusAppProcessEngineProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  IntegrationAdmin -. "\`Define formato y layout\`" .-> IntegrationHubAdminConsoleProcessDesigner\r
  IntegrationHubAdminConsoleProcessDesigner -. "\`Registra reader definition\`" .-> IntegrationHubQuarkusAppAdminApi\r
  IntegrationHubQuarkusAppAdminApi -. "\`Persiste catalogo\`" .-> IntegrationHubQuarkusAppProcessEngineProcessCatalogService\r
  IntegrationHubQuarkusAppProcessEngineProcessCatalogService -. "\`Guarda reader definition\`" .-> Db\r
`;case"usecase_uc03_process":return`---\r
title: "UC-03 Disenar proceso"\r
---\r
graph LR\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  IntegrationHubAdminConsoleProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
  IntegrationHubQuarkusAppAdminApi@{ shape: rectangle, label: "Admin API" }\r
  IntegrationHubQuarkusAppProcessEngineProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  IntegrationAdmin -. "\`Crea proceso y ordena tareas\`" .-> IntegrationHubAdminConsoleProcessDesigner\r
  IntegrationHubAdminConsoleProcessDesigner -. "\`Guarda process definition\`" .-> IntegrationHubQuarkusAppAdminApi\r
  IntegrationHubQuarkusAppAdminApi -. "\`Valida y registra tareas\`" .-> IntegrationHubQuarkusAppProcessEngineProcessCatalogService\r
  IntegrationHubQuarkusAppProcessEngineProcessCatalogService -. "\`Guarda process definition y task definitions\`" .-> Db\r
`;case"usecase_uc04_manual_execution":return`---\r
title: "UC-04 Ejecutar proceso manualmente"\r
---\r
graph LR\r
  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r
  IntegrationHubAdminConsoleOperationsConsole@{ shape: rectangle, label: "Operations Console" }\r
  IntegrationHubQuarkusAppExecutionApi@{ shape: rectangle, label: "Execution API" }\r
  IntegrationHubQuarkusAppProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
  IntegrationHubQuarkusAppSourceRegistry@{ shape: rectangle, label: "Source Provider Registry" }\r
  IntegrationHubQuarkusAppReaderRegistry@{ shape: rectangle, label: "Reader Provider Registry" }\r
  IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider@{ shape: rectangle, label: "DbWriteTaskProvider" }\r
  IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider@{ shape: rectangle, label: "RestCallTaskProvider" }\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  Operator -. "\`Selecciona proceso activo\`" .-> IntegrationHubAdminConsoleOperationsConsole\r
  IntegrationHubAdminConsoleOperationsConsole -. "\`Solicita ejecucion\`" .-> IntegrationHubQuarkusAppExecutionApi\r
  IntegrationHubQuarkusAppExecutionApi -. "\`Inicia ejecucion\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve fuente\`" .-> IntegrationHubQuarkusAppSourceRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Lee contenido\`" .-> IntegrationHubQuarkusAppReaderRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Persiste registros\`" .-> IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider\r
  IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider -. "\`Guarda staging o destino\`" .-> Db\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Invoca API externa\`" .-> IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider\r
  IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider -. "\`Envia payload\`" .-> ExternalApi\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Registra eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
`;case"usecase_uc05_scheduled_execution":return`---\r
title: "UC-05 Ejecutar proceso programado"\r
---\r
graph LR\r
  SchedulerActor@{ icon: "fa:user", shape: rounded, label: "Scheduler" }\r
  IntegrationHubQuarkusAppScheduler@{ shape: rectangle, label: "Scheduler" }\r
  IntegrationHubQuarkusAppProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
  IntegrationHubQuarkusAppSourceRegistry@{ shape: rectangle, label: "Source Provider Registry" }\r
  IntegrationHubQuarkusAppReaderRegistry@{ shape: rectangle, label: "Reader Provider Registry" }\r
  IntegrationHubQuarkusAppTaskRegistry@{ shape: rectangle, label: "Task Provider Registry" }\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  IntegrationHubQuarkusAppTelemetry@{ shape: rectangle, label: "OpenTelemetry Instrumentation" }\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  ObservabilityJaeger@{ shape: rectangle, label: "Jaeger" }\r
  SchedulerActor -. "\`Detecta proceso programado\`" .-> IntegrationHubQuarkusAppScheduler\r
  IntegrationHubQuarkusAppScheduler -. "\`Lanza ejecucion\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve fuente\`" .-> IntegrationHubQuarkusAppSourceRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Lee contenido\`" .-> IntegrationHubQuarkusAppReaderRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Ejecuta tareas\`" .-> IntegrationHubQuarkusAppTaskRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Registra eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Emite spans\`" .-> IntegrationHubQuarkusAppTelemetry\r
  IntegrationHubQuarkusAppTelemetry -. "\`Exporta trazas\`" .-> ObservabilityOtel\r
  ObservabilityOtel -. "\`Publica visualizacion\`" .-> ObservabilityJaeger\r
`;case"usecase_uc09_access":return`---\r
title: "UC-09 Administrar acceso"\r
---\r
graph LR\r
  PlatformAdmin@{ icon: "fa:user", shape: rounded, label: "Platform Admin" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  IntegrationHubAdminConsoleOidcClient@{ shape: rectangle, label: "OIDC Client" }\r
  IntegrationHubQuarkusAppAdminApi@{ shape: rectangle, label: "Admin API" }\r
  PlatformAdmin -. "\`Administra clientes y roles\`" .-> Iam\r
  PlatformAdmin -. "\`Valida acceso a consola\`" .-> IntegrationHubAdminConsoleOidcClient\r
  IntegrationHubAdminConsoleOidcClient -. "\`Solicita autenticacion OIDC\`" .-> Iam\r
  IntegrationHubAdminConsoleOidcClient -. "\`Invoca APIs protegidas\`" .-> IntegrationHubQuarkusAppAdminApi\r
  IntegrationHubQuarkusAppAdminApi -. "\`Valida tokens y roles\`" .-> Iam\r
`;default:throw new Error("Unknown viewId: "+e)}}export{r as mmdSource};
