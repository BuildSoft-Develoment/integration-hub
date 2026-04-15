function r(e){switch(e){case"index":return'---\r\ntitle: "Landscape view"\r\n---\r\ngraph TB\r\n  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r\n  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r\n  PlatformAdmin@{ icon: "fa:user", shape: rounded, label: "Platform Admin" }\r\n  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r\n  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r\n  Auditor@{ icon: "fa:user", shape: rounded, label: "Auditor" }\r\n  InfraTeam@{ icon: "fa:user", shape: rounded, label: "Equipo de infraestructura" }\r\n  SchedulerActor@{ icon: "fa:user", shape: rounded, label: "Scheduler" }\r\n  Vault@{ shape: rectangle, label: "Kubernetes Secrets / External Config" }\r\n  LoadBalancer@{ shape: rectangle, label: "Load Balancer / Reverse Proxy" }\r\n  SharedStorage@{ shape: rectangle, label: "Shared File Storage" }\r\n  IngressController@{ shape: rectangle, label: "Ingress Controller" }\r\n  IntegrationHub@{ shape: rectangle, label: "Integration Hub Platform" }\r\n  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r\n  Iam@{ shape: rectangle, label: "Keycloak" }\r\n  Db@{ shape: rectangle, label: "PostgreSQL" }\r\n  FileSources@{ shape: rectangle, label: "Fuentes externas" }\r\n  Observability@{ shape: rectangle, label: "Observabilidad" }\r\n  User -. "`Accede por HTTPS`" .-> LoadBalancer\r\n  User -. "`Consulta estado y resultados`" .-> IntegrationHub\r\n  Admin -. "`Administra por HTTPS`" .-> LoadBalancer\r\n  Admin -. "`Configura fuentes, readers y procesos`" .-> IntegrationHub\r\n  PlatformAdmin -. "`UC-09`" .-> Iam\r\n  PlatformAdmin -. "`UC-10`" .-> Vault\r\n  IntegrationAdmin -. "`UC-01, UC-02, UC-03`" .-> IntegrationHub\r\n  Operator -. "`UC-04, UC-06, UC-08`" .-> IntegrationHub\r\n  Auditor -. "`UC-06, UC-07`" .-> IntegrationHub\r\n  InfraTeam -. "`UC-10`" .-> LoadBalancer\r\n  InfraTeam -. "`UC-10`" .-> IngressController\r\n  InfraTeam -. "`UC-10`" .-> SharedStorage\r\n  SchedulerActor -. "`UC-05`" .-> IntegrationHub\r\n  IntegrationHub -. "`[...]`" .-> ExternalApi\r\n  IntegrationHub -. "`[...]`" .-> Iam\r\n  IntegrationHub -. "`[...]`" .-> Db\r\n  LoadBalancer -. "`Reenvia trafico al cluster`" .-> IngressController\r\n  IngressController -. "`Enruta trafico HTTP interno`" .-> IntegrationHub\r\n  Vault -. "`Entrega secretos y credenciales`" .-> IntegrationHub\r\n  SharedStorage -. "`Comparte archivos locales`" .-> IntegrationHub\r\n  IntegrationHub -. "`[...]`" .-> FileSources\r\n  IntegrationHub -. "`Exporta trazas`" .-> Observability\r\n';case"context":return`---\r
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
  Vault@{ shape: rectangle, label: "Kubernetes Secrets / External Config" }\r
  SharedStorage@{ shape: rectangle, label: "Shared File Storage" }\r
  LoadBalancer@{ shape: rectangle, label: "Load Balancer / Reverse Proxy" }\r
  IngressController@{ shape: rectangle, label: "Ingress Controller" }\r
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
  User -. "\`Accede por HTTPS\`" .-> LoadBalancer\r
  Admin -. "\`Administra por HTTPS\`" .-> LoadBalancer\r
  LoadBalancer -. "\`Reenvia trafico al cluster\`" .-> IngressController\r
  IngressController -. "\`Enruta trafico HTTP interno\`" .-> IntegrationHubAdminConsole\r
  IngressController -. "\`Enruta trafico HTTP interno\`" .-> IntegrationHubQuarkusApp\r
  Vault -. "\`Entrega secretos y credenciales\`" .-> IntegrationHubQuarkusApp\r
  SharedStorage -. "\`Comparte archivos locales\`" .-> IntegrationHubQuarkusApp\r
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
  LoadBalancer@{ shape: rectangle, label: "Load Balancer / Reverse Proxy" }\r
  IngressController@{ shape: rectangle, label: "Ingress Controller" }\r
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
  User -. "\`Accede por HTTPS\`" .-> LoadBalancer\r
  Admin -. "\`Administra por HTTPS\`" .-> LoadBalancer\r
  LoadBalancer -. "\`Reenvia trafico al cluster\`" .-> IngressController\r
  IntegrationHubQuarkusApp -. "\`Valida access tokens\`" .-> Iam\r
  IngressController -. "\`Enruta trafico HTTP interno\`" .-> IntegrationHubAdminConsole\r
  IngressController -. "\`Enruta trafico HTTP interno\`" .-> IntegrationHubQuarkusApp\r
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
`;case"deployment_prod":return'---\r\ntitle: "PROD"\r\n---\r\ngraph TB\r\n  subgraph ProdEdge["`edge`"]\r\n    subgraph ProdEdge.LoadBalancer["`loadBalancer`"]\r\n      ProdEdge.LoadBalancer.LoadBalancer@{ shape: rectangle, label: "Load Balancer / Reverse Proxy" }\r\n    end\r\n  end\r\n  subgraph ProdServices["`services`"]\r\n    subgraph ProdServices.ServicesNode["`servicesNode`"]\r\n      ProdServices.ServicesNode.Vault@{ shape: rectangle, label: "Kubernetes Secrets / External Config" }\r\n      ProdServices.ServicesNode.SharedStorage@{ shape: rectangle, label: "Shared File Storage" }\r\n    end\r\n  end\r\n  subgraph ProdApp["`app`"]\r\n    subgraph ProdApp.AppCluster["`appCluster`"]\r\n      subgraph ProdApp.AppCluster.IngressController["`ingressController`"]\r\n        ProdApp.AppCluster.IngressController.IngressController@{ shape: rectangle, label: "Ingress Controller" }\r\n      end\r\n      subgraph ProdApp.AppCluster.ProdNode1["`prodNode1`"]\r\n        ProdApp.AppCluster.ProdNode1.AdminConsole@{ shape: rectangle, label: "Admin Console" }\r\n        ProdApp.AppCluster.ProdNode1.QuarkusApp@{ shape: rectangle, label: "Quarkus Native App" }\r\n      end\r\n      subgraph ProdApp.AppCluster.ProdNode2["`prodNode2`"]\r\n        ProdApp.AppCluster.ProdNode2.AdminConsole@{ shape: rectangle, label: "Admin Console" }\r\n        ProdApp.AppCluster.ProdNode2.QuarkusApp@{ shape: rectangle, label: "Quarkus Native App" }\r\n      end\r\n    end\r\n  end\r\n  subgraph ProdData["`data`"]\r\n    subgraph ProdData.PostgresHa["`postgresHa`"]\r\n      subgraph ProdData.PostgresHa.PostgresPrimary["`postgresPrimary`"]\r\n        ProdData.PostgresHa.PostgresPrimary.Db@{ shape: rectangle, label: "PostgreSQL" }\r\n      end\r\n      subgraph ProdData.PostgresHa.PostgresReplica["`postgresReplica`"]\r\n        ProdData.PostgresHa.PostgresReplica.Db@{ shape: rectangle, label: "PostgreSQL" }\r\n      end\r\n    end\r\n    subgraph ProdData.KeycloakHa["`keycloakHa`"]\r\n      subgraph ProdData.KeycloakHa.KeycloakNode1["`keycloakNode1`"]\r\n        ProdData.KeycloakHa.KeycloakNode1.Iam@{ shape: rectangle, label: "Keycloak" }\r\n      end\r\n      subgraph ProdData.KeycloakHa.KeycloakNode2["`keycloakNode2`"]\r\n        ProdData.KeycloakHa.KeycloakNode2.Iam@{ shape: rectangle, label: "Keycloak" }\r\n      end\r\n    end\r\n    subgraph ProdData.ObservabilityNode["`observabilityNode`"]\r\n      ProdData.ObservabilityNode.Otel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r\n      ProdData.ObservabilityNode.Jaeger@{ shape: rectangle, label: "Jaeger" }\r\n    end\r\n  end\r\n  ProdApp.AppCluster.ProdNode1.AdminConsole -. "`[...]`" .-> ProdApp.AppCluster.ProdNode1.QuarkusApp\r\n  ProdApp.AppCluster.ProdNode2.AdminConsole -. "`[...]`" .-> ProdApp.AppCluster.ProdNode2.QuarkusApp\r\n  ProdApp.AppCluster.IngressController.IngressController -. "`Enruta trafico HTTP interno`" .-> ProdApp.AppCluster.ProdNode1.AdminConsole\r\n  ProdApp.AppCluster.IngressController.IngressController -. "`Enruta trafico HTTP interno`" .-> ProdApp.AppCluster.ProdNode1.QuarkusApp\r\n  ProdApp.AppCluster.IngressController.IngressController -. "`Enruta trafico HTTP interno`" .-> ProdApp.AppCluster.ProdNode2.AdminConsole\r\n  ProdApp.AppCluster.IngressController.IngressController -. "`Enruta trafico HTTP interno`" .-> ProdApp.AppCluster.ProdNode2.QuarkusApp\r\n  ProdData.ObservabilityNode.Otel -. "`Entrega trazas`" .-> ProdData.ObservabilityNode.Jaeger\r\n  ProdEdge.LoadBalancer.LoadBalancer -. "`Reenvia trafico al cluster`" .-> ProdApp.AppCluster.IngressController.IngressController\r\n  ProdApp.AppCluster.ProdNode1.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.ProdNode1.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.ProdNode1.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresPrimary.Db\r\n  ProdApp.AppCluster.ProdNode1.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresReplica.Db\r\n  ProdApp.AppCluster.ProdNode1.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.ProdNode1.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.ProdNode1.QuarkusApp -. "`Exporta trazas`" .-> ProdData.ObservabilityNode.Otel\r\n  ProdServices.ServicesNode.Vault -. "`Entrega secretos y credenciales`" .-> ProdApp.AppCluster.ProdNode1.QuarkusApp\r\n  ProdServices.ServicesNode.SharedStorage -. "`Comparte archivos locales`" .-> ProdApp.AppCluster.ProdNode1.QuarkusApp\r\n  ProdApp.AppCluster.ProdNode2.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.ProdNode2.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.ProdNode2.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresPrimary.Db\r\n  ProdApp.AppCluster.ProdNode2.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresReplica.Db\r\n  ProdApp.AppCluster.ProdNode2.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.ProdNode2.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.ProdNode2.QuarkusApp -. "`Exporta trazas`" .-> ProdData.ObservabilityNode.Otel\r\n  ProdServices.ServicesNode.Vault -. "`Entrega secretos y credenciales`" .-> ProdApp.AppCluster.ProdNode2.QuarkusApp\r\n  ProdServices.ServicesNode.SharedStorage -. "`Comparte archivos locales`" .-> ProdApp.AppCluster.ProdNode2.QuarkusApp\r\n  ProdApp.AppCluster.IngressController -. "`Rutea trafico UI y API`" .-> ProdApp.AppCluster.ProdNode1\r\n  ProdApp.AppCluster.IngressController -. "`Rutea trafico UI y API`" .-> ProdApp.AppCluster.ProdNode2\r\n  ProdEdge.LoadBalancer -. "`HTTPS`" .-> ProdApp.AppCluster.IngressController\r\n';case"usecase_design_execute":return`---\r
title: "Disenar y ejecutar proceso"\r
---\r
graph LR\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  subgraph IntegrationHubAdminConsole["\`Admin Console\`"]\r
    IntegrationHubAdminConsole.ProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
    IntegrationHubAdminConsole.OperationsConsole@{ shape: rectangle, label: "Operations Console" }\r
  end\r
  subgraph IntegrationHubQuarkusApp["\`Quarkus Native App\`"]\r
    IntegrationHubQuarkusApp.AdminApi@{ shape: rectangle, label: "Admin API" }\r
    IntegrationHubQuarkusApp.ExecutionApi@{ shape: rectangle, label: "Execution API" }\r
    IntegrationHubQuarkusApp.ProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
    IntegrationHubQuarkusApp.SourceRegistry@{ shape: rectangle, label: "Source Provider Registry" }\r
    IntegrationHubQuarkusApp.ReaderRegistry@{ shape: rectangle, label: "Reader Provider Registry" }\r
    IntegrationHubQuarkusApp.TaskProvidersDbWriteTaskProvider@{ shape: rectangle, label: "DbWriteTaskProvider" }\r
    IntegrationHubQuarkusApp.TaskProvidersRestCallTaskProvider@{ shape: rectangle, label: "RestCallTaskProvider" }\r
  end\r
  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r
  IntegrationAdmin -. "\`Configura source, reader y tareas\`" .-> IntegrationHubAdminConsole.ProcessDesigner\r
  IntegrationHubAdminConsole.ProcessDesigner -. "\`Guarda process definition\`" .-> IntegrationHubQuarkusApp.AdminApi\r
  Operator -. "\`Selecciona proceso\`" .-> IntegrationHubAdminConsole.OperationsConsole\r
  IntegrationHubAdminConsole.OperationsConsole -. "\`Ejecuta proceso\`" .-> IntegrationHubQuarkusApp.ExecutionApi\r
  IntegrationHubQuarkusApp.ExecutionApi -. "\`Inicia ejecucion\`" .-> IntegrationHubQuarkusApp.ProcessEngine\r
  IntegrationHubQuarkusApp.ProcessEngine -. "\`Obtiene fuente\`" .-> IntegrationHubQuarkusApp.SourceRegistry\r
  IntegrationHubQuarkusApp.ProcessEngine -. "\`Lee contenido\`" .-> IntegrationHubQuarkusApp.ReaderRegistry\r
  IntegrationHubQuarkusApp.ProcessEngine -. "\`Persiste registros\`" .-> IntegrationHubQuarkusApp.TaskProvidersDbWriteTaskProvider\r
  IntegrationHubQuarkusApp.TaskProvidersDbWriteTaskProvider -. "\`Guarda staging/destino\`" .-> Db\r
  IntegrationHubQuarkusApp.ProcessEngine -. "\`Invoca API externa\`" .-> IntegrationHubQuarkusApp.TaskProvidersRestCallTaskProvider\r
  IntegrationHubQuarkusApp.TaskProvidersRestCallTaskProvider -. "\`Envia payload\`" .-> ExternalApi\r
  IntegrationHubQuarkusApp.ExecutionApi -. "\`Consulta resultado\`" .-> IntegrationHubAdminConsole.OperationsConsole\r
`;case"usecase_scheduled_audit":return`---\r
title: "Ejecucion programada y auditoria"\r
---\r
graph LR\r
  IntegrationHubAdminConsoleOperationsConsole@{ shape: rectangle, label: "Operations Console" }\r
  IntegrationHubQuarkusAppScheduler@{ shape: rectangle, label: "Scheduler" }\r
  IntegrationHubQuarkusAppProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  IntegrationHubQuarkusAppQueryApi@{ shape: rectangle, label: "Query API" }\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  ObservabilityJaeger@{ shape: rectangle, label: "Jaeger" }\r
  SchedulerActor@{ icon: "fa:user", shape: rounded, label: "Scheduler" }\r
  IntegrationHubQuarkusAppTelemetry@{ shape: rectangle, label: "OpenTelemetry Instrumentation" }\r
  Auditor@{ icon: "fa:user", shape: rounded, label: "Auditor" }\r
  SchedulerActor -. "\`Dispara scheduler\`" .-> IntegrationHubQuarkusAppScheduler\r
  IntegrationHubQuarkusAppScheduler -. "\`Lanza proceso programado\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Registra eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Emite spans\`" .-> IntegrationHubQuarkusAppTelemetry\r
  Auditor -. "\`Consulta auditoria\`" .-> IntegrationHubAdminConsoleOperationsConsole\r
  IntegrationHubAdminConsoleOperationsConsole -. "\`Solicita eventos y ejecuciones\`" .-> IntegrationHubQuarkusAppQueryApi\r
  IntegrationHubQuarkusAppQueryApi -. "\`Lee eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppTelemetry -. "\`Exporta trazas\`" .-> ObservabilityOtel\r
  ObservabilityOtel -. "\`Publica visualizacion\`" .-> ObservabilityJaeger\r
`;default:throw new Error("Unknown viewId: "+e)}}export{r as mmdSource};
