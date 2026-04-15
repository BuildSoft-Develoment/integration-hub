function n(r){switch(r){case"index":return`@startuml\r
title "Landscape view"\r
top to bottom direction\r
\r
hide stereotype\r
skinparam ranksep 60\r
skinparam nodesep 30\r
skinparam {\r
  arrowFontSize 10\r
  defaultTextAlignment center\r
  wrapWidth 200\r
  maxMessageSize 100\r
  shadowing false\r
}\r
\r
skinparam rectangle<<User>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Admin>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHub>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSources>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Observability>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
rectangle "==Usuario de negocio" <<User>> as User\r
rectangle "==Administrador de integraciones" <<Admin>> as Admin\r
rectangle "==Integration Hub Platform" <<IntegrationHub>> as IntegrationHub\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==Fuentes externas" <<FileSources>> as FileSources\r
rectangle "==Observabilidad" <<Observability>> as Observability\r
\r
User .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationHub .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> FileSources : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Observability : <color:#8D8D8D>Exporta trazas\r
@enduml\r
`;case"context":return`@startuml\r
title "Nivel 1 - Contexto del sistema"\r
top to bottom direction\r
\r
hide stereotype\r
skinparam ranksep 60\r
skinparam nodesep 30\r
skinparam {\r
  arrowFontSize 10\r
  defaultTextAlignment center\r
  wrapWidth 200\r
  maxMessageSize 100\r
  shadowing false\r
}\r
\r
skinparam rectangle<<User>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Admin>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsole>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusApp>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSources>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Observability>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
rectangle "==Usuario de negocio" <<User>> as User\r
rectangle "==Administrador de integraciones" <<Admin>> as Admin\r
rectangle "Integration Hub Platform" <<IntegrationHub>> as IntegrationHub {\r
  skinparam RectangleBorderColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHub>> dashed\r
\r
  rectangle "==Admin Console" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole\r
  rectangle "==Quarkus Native App" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp\r
}\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==Fuentes externas" <<FileSources>> as FileSources\r
rectangle "==Observabilidad" <<Observability>> as Observability\r
\r
User .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusApp : <color:#8D8D8D>Invoca APIs protegidas\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Autenticacion OIDC\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>Invoca APIs de negocio\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Valida access tokens\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste configuracion, jobs, auditoria y staging\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSources : <color:#8D8D8D>[...]\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Observability : <color:#8D8D8D>Exporta trazas\r
@enduml\r
`;case"containers":return`@startuml\r
title "Nivel 2 - Contenedores"\r
top to bottom direction\r
\r
hide stereotype\r
skinparam ranksep 60\r
skinparam nodesep 30\r
skinparam {\r
  arrowFontSize 10\r
  defaultTextAlignment center\r
  wrapWidth 200\r
  maxMessageSize 100\r
  shadowing false\r
}\r
\r
skinparam rectangle<<User>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Admin>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsole>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusApp>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesFilesystem>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesFtp>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesSftp>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesRestSource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityOtel>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityJaeger>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
rectangle "==Usuario de negocio" <<User>> as User\r
rectangle "==Administrador de integraciones" <<Admin>> as Admin\r
rectangle "==Admin Console" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole\r
rectangle "==Quarkus Native App" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==File System" <<FileSourcesFilesystem>> as FileSourcesFilesystem\r
rectangle "==FTP" <<FileSourcesFtp>> as FileSourcesFtp\r
rectangle "==SFTP" <<FileSourcesSftp>> as FileSourcesSftp\r
rectangle "==REST Source" <<FileSourcesRestSource>> as FileSourcesRestSource\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
rectangle "==OpenTelemetry Collector" <<ObservabilityOtel>> as ObservabilityOtel\r
rectangle "==Jaeger" <<ObservabilityJaeger>> as ObservabilityJaeger\r
\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusApp : <color:#8D8D8D>Invoca APIs protegidas\r
User .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Autenticacion OIDC\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Valida access tokens\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste configuracion, jobs, auditoria y staging\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesFilesystem : <color:#8D8D8D>Lee archivos locales\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesFtp : <color:#8D8D8D>Descarga archivos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesSftp : <color:#8D8D8D>Descarga archivos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesRestSource : <color:#8D8D8D>Obtiene payloads remotos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>Invoca APIs de negocio\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> ObservabilityOtel : <color:#8D8D8D>Exporta trazas\r
ObservabilityOtel .[#8D8D8D,thickness=2].> ObservabilityJaeger : <color:#8D8D8D>Entrega trazas\r
@enduml\r
`;case"components":return`@startuml\r
title "Nivel 3 - Componentes del backend Quarkus"\r
top to bottom direction\r
\r
hide stereotype\r
skinparam ranksep 60\r
skinparam nodesep 30\r
skinparam {\r
  arrowFontSize 10\r
  defaultTextAlignment center\r
  wrapWidth 200\r
  maxMessageSize 100\r
  shadowing false\r
}\r
\r
skinparam rectangle<<IntegrationHubQuarkusAppAdminApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppExecutionApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppQueryApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppScheduler>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngine>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppSourceRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppReaderRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTaskRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppAuditService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTelemetry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppSourceProviders>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppReaderProviders>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTaskProviders>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesFilesystem>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesFtp>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesSftp>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesRestSource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityOtel>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
rectangle "==Admin API" <<IntegrationHubQuarkusAppAdminApi>> as IntegrationHubQuarkusAppAdminApi\r
rectangle "==Execution API" <<IntegrationHubQuarkusAppExecutionApi>> as IntegrationHubQuarkusAppExecutionApi\r
rectangle "==Query API" <<IntegrationHubQuarkusAppQueryApi>> as IntegrationHubQuarkusAppQueryApi\r
rectangle "==Scheduler" <<IntegrationHubQuarkusAppScheduler>> as IntegrationHubQuarkusAppScheduler\r
rectangle "==Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine\r
rectangle "==Source Provider Registry" <<IntegrationHubQuarkusAppSourceRegistry>> as IntegrationHubQuarkusAppSourceRegistry\r
rectangle "==Reader Provider Registry" <<IntegrationHubQuarkusAppReaderRegistry>> as IntegrationHubQuarkusAppReaderRegistry\r
rectangle "==Task Provider Registry" <<IntegrationHubQuarkusAppTaskRegistry>> as IntegrationHubQuarkusAppTaskRegistry\r
rectangle "==Audit Service" <<IntegrationHubQuarkusAppAuditService>> as IntegrationHubQuarkusAppAuditService\r
rectangle "==OpenTelemetry Instrumentation" <<IntegrationHubQuarkusAppTelemetry>> as IntegrationHubQuarkusAppTelemetry\r
rectangle "==Source Providers" <<IntegrationHubQuarkusAppSourceProviders>> as IntegrationHubQuarkusAppSourceProviders\r
rectangle "==Reader Providers" <<IntegrationHubQuarkusAppReaderProviders>> as IntegrationHubQuarkusAppReaderProviders\r
rectangle "==Task Providers" <<IntegrationHubQuarkusAppTaskProviders>> as IntegrationHubQuarkusAppTaskProviders\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
rectangle "==File System" <<FileSourcesFilesystem>> as FileSourcesFilesystem\r
rectangle "==FTP" <<FileSourcesFtp>> as FileSourcesFtp\r
rectangle "==SFTP" <<FileSourcesSftp>> as FileSourcesSftp\r
rectangle "==REST Source" <<FileSourcesRestSource>> as FileSourcesRestSource\r
rectangle "==OpenTelemetry Collector" <<ObservabilityOtel>> as ObservabilityOtel\r
\r
IntegrationHubQuarkusAppAdminApi .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>Configura definiciones\r
IntegrationHubQuarkusAppExecutionApi .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>Inicia ejecuciones\r
IntegrationHubQuarkusAppQueryApi .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Consulta eventos\r
IntegrationHubQuarkusAppScheduler .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>Dispara procesos programados\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceRegistry : <color:#8D8D8D>Resuelve fuente\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppReaderRegistry : <color:#8D8D8D>Resuelve reader\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskRegistry : <color:#8D8D8D>Resuelve tarea\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProviders : <color:#8D8D8D>[...]\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Registra eventos\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTelemetry : <color:#8D8D8D>Crea spans\r
IntegrationHubQuarkusAppSourceRegistry .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceProviders : <color:#8D8D8D>Usa implementations\r
IntegrationHubQuarkusAppReaderRegistry .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppReaderProviders : <color:#8D8D8D>Usa implementations\r
IntegrationHubQuarkusAppTaskRegistry .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProviders : <color:#8D8D8D>Usa implementations\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste definiciones y tasks\r
IntegrationHubQuarkusAppTaskProviders .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Batch insert, update y upsert\r
IntegrationHubQuarkusAppTaskProviders .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>[...]\r
@enduml\r
`;case"deployment":return`@startuml\r
title "Nivel 4 - Componentes internos del motor de ejecucion"\r
top to bottom direction\r
\r
hide stereotype\r
skinparam ranksep 60\r
skinparam nodesep 30\r
skinparam {\r
  arrowFontSize 10\r
  defaultTextAlignment center\r
  wrapWidth 200\r
  maxMessageSize 100\r
  shadowing false\r
}\r
\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineProcessExecutionService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineProcessCatalogService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppSourceRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppReaderRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTaskRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppAuditService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTelemetry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
rectangle "==ProcessExecutionService" <<IntegrationHubQuarkusAppProcessEngineProcessExecutionService>> as IntegrationHubQuarkusAppProcessEngineProcessExecutionService\r
rectangle "==ProcessCatalogService" <<IntegrationHubQuarkusAppProcessEngineProcessCatalogService>> as IntegrationHubQuarkusAppProcessEngineProcessCatalogService\r
rectangle "==JsonConfigurationMapper" <<IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper>> as IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper\r
rectangle "==Source Provider Registry" <<IntegrationHubQuarkusAppSourceRegistry>> as IntegrationHubQuarkusAppSourceRegistry\r
rectangle "==Reader Provider Registry" <<IntegrationHubQuarkusAppReaderRegistry>> as IntegrationHubQuarkusAppReaderRegistry\r
rectangle "==Task Provider Registry" <<IntegrationHubQuarkusAppTaskRegistry>> as IntegrationHubQuarkusAppTaskRegistry\r
rectangle "==DbWriteTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider\r
rectangle "==RestCallTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider\r
rectangle "==NotificationTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider\r
rectangle "==Audit Service" <<IntegrationHubQuarkusAppAuditService>> as IntegrationHubQuarkusAppAuditService\r
rectangle "==OpenTelemetry Instrumentation" <<IntegrationHubQuarkusAppTelemetry>> as IntegrationHubQuarkusAppTelemetry\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper : <color:#8D8D8D>Lee configuracion JSON\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceRegistry : <color:#8D8D8D>Resuelve SourceProvider\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppReaderRegistry : <color:#8D8D8D>Resuelve ReaderProvider\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskRegistry : <color:#8D8D8D>Resuelve TaskProvider\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider : <color:#8D8D8D>Ejecuta DB_WRITE\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider : <color:#8D8D8D>Ejecuta REST_CALL\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider : <color:#8D8D8D>Ejecuta NOTIFICATION\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste definiciones y tasks\r
IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Batch insert, update y upsert\r
IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>Envia payloads\r
IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>Webhook y notificaciones\r
@enduml\r
`;default:throw new Error("Unknown viewId: "+r)}}export{n as pumlSource};
