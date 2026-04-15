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
skinparam person<<User>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Admin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<PlatformAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<IntegrationAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Operator>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Auditor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<InfraTeam>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<SchedulerActor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<Vault>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<LoadBalancer>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<SharedStorage>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IngressController>>{\r
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
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
person "==Platform Admin" <<PlatformAdmin>> as PlatformAdmin\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
person "==Operator" <<Operator>> as Operator\r
person "==Auditor" <<Auditor>> as Auditor\r
person "==Equipo de infraestructura" <<InfraTeam>> as InfraTeam\r
person "==Scheduler" <<SchedulerActor>> as SchedulerActor\r
rectangle "==Kubernetes Secrets / External Config" <<Vault>> as Vault\r
rectangle "==Load Balancer / Reverse Proxy" <<LoadBalancer>> as LoadBalancer\r
rectangle "==Shared File Storage" <<SharedStorage>> as SharedStorage\r
rectangle "==Ingress Controller" <<IngressController>> as IngressController\r
rectangle "==Integration Hub Platform" <<IntegrationHub>> as IntegrationHub\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==Fuentes externas" <<FileSources>> as FileSources\r
rectangle "==Observabilidad" <<Observability>> as Observability\r
\r
User .[#8D8D8D,thickness=2].> LoadBalancer : <color:#8D8D8D>Accede por HTTPS\r
User .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> LoadBalancer : <color:#8D8D8D>Administra por HTTPS\r
Admin .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Configura fuentes, readers y procesos\r
PlatformAdmin .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>UC-09\r
PlatformAdmin .[#8D8D8D,thickness=2].> Vault : <color:#8D8D8D>UC-10\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-01, UC-02, UC-03\r
Operator .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-04, UC-06, UC-08\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-06, UC-07\r
InfraTeam .[#8D8D8D,thickness=2].> LoadBalancer : <color:#8D8D8D>UC-10\r
InfraTeam .[#8D8D8D,thickness=2].> IngressController : <color:#8D8D8D>UC-10\r
InfraTeam .[#8D8D8D,thickness=2].> SharedStorage : <color:#8D8D8D>UC-10\r
SchedulerActor .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-05\r
IntegrationHub .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>[...]\r
LoadBalancer .[#8D8D8D,thickness=2].> IngressController : <color:#8D8D8D>Reenvia trafico al cluster\r
IngressController .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Enruta trafico HTTP interno\r
Vault .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Entrega secretos y credenciales\r
SharedStorage .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Comparte archivos locales\r
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
skinparam person<<User>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Admin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<IntegrationAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Operator>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Auditor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<InfraTeam>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<SchedulerActor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<PlatformAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<IntegrationHub>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #AC4D39\r
  FontColor #FBD3CB\r
  BorderColor #853A2D\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesFilesystem>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesFtp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesSftp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesRestSource>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Observability>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
person "==Operator" <<Operator>> as Operator\r
person "==Auditor" <<Auditor>> as Auditor\r
person "==Equipo de infraestructura" <<InfraTeam>> as InfraTeam\r
person "==Scheduler" <<SchedulerActor>> as SchedulerActor\r
person "==Platform Admin" <<PlatformAdmin>> as PlatformAdmin\r
rectangle "==Integration Hub Platform" <<IntegrationHub>> as IntegrationHub\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==File System" <<FileSourcesFilesystem>> as FileSourcesFilesystem\r
rectangle "==FTP" <<FileSourcesFtp>> as FileSourcesFtp\r
rectangle "==SFTP" <<FileSourcesSftp>> as FileSourcesSftp\r
rectangle "==REST Source" <<FileSourcesRestSource>> as FileSourcesRestSource\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
rectangle "==Observabilidad" <<Observability>> as Observability\r
\r
User .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-01, UC-02, UC-03\r
Operator .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-04, UC-06, UC-08\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-06, UC-07\r
SchedulerActor .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-05\r
PlatformAdmin .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>UC-09\r
IntegrationHub .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> FileSourcesFilesystem : <color:#8D8D8D>Lee archivos locales\r
IntegrationHub .[#8D8D8D,thickness=2].> FileSourcesFtp : <color:#8D8D8D>Descarga archivos\r
IntegrationHub .[#8D8D8D,thickness=2].> FileSourcesSftp : <color:#8D8D8D>Descarga archivos\r
IntegrationHub .[#8D8D8D,thickness=2].> FileSourcesRestSource : <color:#8D8D8D>Obtiene payloads remotos\r
IntegrationHub .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Observability : <color:#8D8D8D>Exporta trazas\r
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
skinparam person<<User>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Admin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<IntegrationAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Operator>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Auditor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<IntegrationHubAdminConsole>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<IntegrationHubQuarkusApp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #AC4D39\r
  FontColor #FBD3CB\r
  BorderColor #853A2D\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesFilesystem>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesFtp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesSftp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesRestSource>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityOtel>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
skinparam rectangle<<ObservabilityJaeger>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
person "==Operator" <<Operator>> as Operator\r
person "==Auditor" <<Auditor>> as Auditor\r
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
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>UC-01, UC-02, UC-03\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>UC-04, UC-06, UC-08\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>UC-06, UC-07\r
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
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #AC4D39\r
  FontColor #FBD3CB\r
  BorderColor #853A2D\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesFilesystem>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesFtp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesSftp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesRestSource>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ObservabilityOtel>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
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
`;case"engine":return`@startuml\r
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
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
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
`;case"security":return`@startuml\r
title "Flujo OIDC y autorizacion"\r
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
skinparam person<<User>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Admin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleReactApp>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleOidcClient>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleProcessDesigner>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleOperationsConsole>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
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
skinparam rectangle<<Iam>>{\r
  BackgroundColor #AC4D39\r
  FontColor #FBD3CB\r
  BorderColor #853A2D\r
}\r
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
rectangle "Admin Console" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole {\r
  skinparam RectangleBorderColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubAdminConsole>> dashed\r
\r
  rectangle "==React + PatternFly UI" <<IntegrationHubAdminConsoleReactApp>> as IntegrationHubAdminConsoleReactApp\r
  rectangle "==OIDC Client" <<IntegrationHubAdminConsoleOidcClient>> as IntegrationHubAdminConsoleOidcClient\r
  rectangle "==Process Designer" <<IntegrationHubAdminConsoleProcessDesigner>> as IntegrationHubAdminConsoleProcessDesigner\r
  rectangle "==Operations Console" <<IntegrationHubAdminConsoleOperationsConsole>> as IntegrationHubAdminConsoleOperationsConsole\r
}\r
rectangle "Quarkus Native App" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
  rectangle "==Admin API" <<IntegrationHubQuarkusAppAdminApi>> as IntegrationHubQuarkusAppAdminApi\r
  rectangle "==Execution API" <<IntegrationHubQuarkusAppExecutionApi>> as IntegrationHubQuarkusAppExecutionApi\r
  rectangle "==Query API" <<IntegrationHubQuarkusAppQueryApi>> as IntegrationHubQuarkusAppQueryApi\r
}\r
rectangle "==Keycloak" <<Iam>> as Iam\r
\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOidcClient : <color:#8D8D8D>Gestiona sesion\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleProcessDesigner : <color:#8D8D8D>Edita pipelines\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>Consulta ejecuciones\r
IntegrationHubAdminConsoleProcessDesigner .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAdminApi : <color:#8D8D8D>CRUD de catalogos y procesos\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppExecutionApi : <color:#8D8D8D>Ejecuta procesos\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppQueryApi : <color:#8D8D8D>Consulta jobs y auditoria\r
IntegrationHubAdminConsoleOidcClient .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Login y refresh token\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Valida access tokens\r
@enduml\r
`;case"ingestion":return`@startuml\r
title "Fuentes, readers y persistencia"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<FileSourcesFilesystem>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesFtp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesSftp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<FileSourcesRestSource>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
rectangle "==Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine\r
rectangle "==Source Provider Registry" <<IntegrationHubQuarkusAppSourceRegistry>> as IntegrationHubQuarkusAppSourceRegistry\r
rectangle "==Reader Provider Registry" <<IntegrationHubQuarkusAppReaderRegistry>> as IntegrationHubQuarkusAppReaderRegistry\r
rectangle "==Task Provider Registry" <<IntegrationHubQuarkusAppTaskRegistry>> as IntegrationHubQuarkusAppTaskRegistry\r
rectangle "Task Providers" <<IntegrationHubQuarkusAppTaskProviders>> as IntegrationHubQuarkusAppTaskProviders {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusAppTaskProviders>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusAppTaskProviders>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusAppTaskProviders>> dashed\r
\r
  rectangle "==DbWriteTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider\r
}\r
rectangle "==Source Providers" <<IntegrationHubQuarkusAppSourceProviders>> as IntegrationHubQuarkusAppSourceProviders\r
rectangle "==Reader Providers" <<IntegrationHubQuarkusAppReaderProviders>> as IntegrationHubQuarkusAppReaderProviders\r
rectangle "==File System" <<FileSourcesFilesystem>> as FileSourcesFilesystem\r
rectangle "==FTP" <<FileSourcesFtp>> as FileSourcesFtp\r
rectangle "==SFTP" <<FileSourcesSftp>> as FileSourcesSftp\r
rectangle "==REST Source" <<FileSourcesRestSource>> as FileSourcesRestSource\r
rectangle "==PostgreSQL" <<Db>> as Db\r
\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceRegistry : <color:#8D8D8D>Resuelve fuente\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppReaderRegistry : <color:#8D8D8D>Resuelve reader\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskRegistry : <color:#8D8D8D>Resuelve tarea\r
IntegrationHubQuarkusAppSourceRegistry .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceProviders : <color:#8D8D8D>Usa implementations\r
IntegrationHubQuarkusAppReaderRegistry .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppReaderProviders : <color:#8D8D8D>Usa implementations\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider : <color:#8D8D8D>Ejecuta DB_WRITE\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste definiciones y tasks\r
IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Batch insert, update y upsert\r
@enduml\r
`;case"observability":return`@startuml\r
title "Trazas, auditoria y operacion"\r
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
skinparam rectangle<<IntegrationHubAdminConsoleOperationsConsole>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppQueryApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTelemetry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityOtel>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppAuditService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityJaeger>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
rectangle "Admin Console" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole {\r
  skinparam RectangleBorderColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubAdminConsole>> dashed\r
\r
  rectangle "==Operations Console" <<IntegrationHubAdminConsoleOperationsConsole>> as IntegrationHubAdminConsoleOperationsConsole\r
}\r
rectangle "Quarkus Native App" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
  rectangle "==Query API" <<IntegrationHubQuarkusAppQueryApi>> as IntegrationHubQuarkusAppQueryApi\r
  rectangle "==OpenTelemetry Instrumentation" <<IntegrationHubQuarkusAppTelemetry>> as IntegrationHubQuarkusAppTelemetry\r
  rectangle "==Audit Service" <<IntegrationHubQuarkusAppAuditService>> as IntegrationHubQuarkusAppAuditService\r
}\r
rectangle "==OpenTelemetry Collector" <<ObservabilityOtel>> as ObservabilityOtel\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==Jaeger" <<ObservabilityJaeger>> as ObservabilityJaeger\r
\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppQueryApi : <color:#8D8D8D>Consulta jobs y auditoria\r
IntegrationHubQuarkusAppQueryApi .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Consulta eventos\r
ObservabilityOtel .[#8D8D8D,thickness=2].> ObservabilityJaeger : <color:#8D8D8D>Entrega trazas\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> ObservabilityOtel : <color:#8D8D8D>Exporta trazas\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste configuracion, jobs, auditoria y staging\r
@enduml\r
`;case"runtime":return`@startuml\r
title "Scheduler y ejecucion de procesos"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppScheduler>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppExecutionApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
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
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper>>{\r
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
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
rectangle "==Scheduler" <<IntegrationHubQuarkusAppScheduler>> as IntegrationHubQuarkusAppScheduler\r
rectangle "==Execution API" <<IntegrationHubQuarkusAppExecutionApi>> as IntegrationHubQuarkusAppExecutionApi\r
rectangle "Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusAppProcessEngine>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusAppProcessEngine>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusAppProcessEngine>> dashed\r
\r
  rectangle "==ProcessExecutionService" <<IntegrationHubQuarkusAppProcessEngineProcessExecutionService>> as IntegrationHubQuarkusAppProcessEngineProcessExecutionService\r
  rectangle "==ProcessCatalogService" <<IntegrationHubQuarkusAppProcessEngineProcessCatalogService>> as IntegrationHubQuarkusAppProcessEngineProcessCatalogService\r
  rectangle "==JsonConfigurationMapper" <<IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper>> as IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper\r
}\r
rectangle "==Audit Service" <<IntegrationHubQuarkusAppAuditService>> as IntegrationHubQuarkusAppAuditService\r
rectangle "==OpenTelemetry Instrumentation" <<IntegrationHubQuarkusAppTelemetry>> as IntegrationHubQuarkusAppTelemetry\r
rectangle "==Task Provider Registry" <<IntegrationHubQuarkusAppTaskRegistry>> as IntegrationHubQuarkusAppTaskRegistry\r
rectangle "Task Providers" <<IntegrationHubQuarkusAppTaskProviders>> as IntegrationHubQuarkusAppTaskProviders {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusAppTaskProviders>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusAppTaskProviders>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusAppTaskProviders>> dashed\r
\r
  rectangle "==DbWriteTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider\r
  rectangle "==RestCallTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider\r
  rectangle "==NotificationTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider\r
}\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper : <color:#8D8D8D>Lee configuracion JSON\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskRegistry : <color:#8D8D8D>Resuelve TaskProvider\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider : <color:#8D8D8D>Ejecuta DB_WRITE\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider : <color:#8D8D8D>Ejecuta REST_CALL\r
IntegrationHubQuarkusAppProcessEngineProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider : <color:#8D8D8D>Ejecuta NOTIFICATION\r
IntegrationHubQuarkusAppProcessEngineProcessCatalogService .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste definiciones y tasks\r
IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Batch insert, update y upsert\r
IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>Envia payloads\r
IntegrationHubQuarkusAppTaskProvidersNotificationTaskProvider .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>Webhook y notificaciones\r
IntegrationHubQuarkusAppScheduler .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>Dispara procesos programados\r
IntegrationHubQuarkusAppExecutionApi .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>Inicia ejecuciones\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Registra eventos\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTelemetry : <color:#8D8D8D>Crea spans\r
@enduml\r
`;case"access":return`@startuml\r
title "Realm, clientes y autorizacion"\r
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
skinparam person<<PlatformAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<IntegrationAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Operator>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Auditor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<User>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam person<<Admin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleReactApp>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleOidcClient>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleProcessDesigner>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleOperationsConsole>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #AC4D39\r
  FontColor #FBD3CB\r
  BorderColor #853A2D\r
}\r
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
person "==Platform Admin" <<PlatformAdmin>> as PlatformAdmin\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
person "==Operator" <<Operator>> as Operator\r
person "==Auditor" <<Auditor>> as Auditor\r
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
rectangle "Admin Console" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole {\r
  skinparam RectangleBorderColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubAdminConsole>> dashed\r
\r
  rectangle "==React + PatternFly UI" <<IntegrationHubAdminConsoleReactApp>> as IntegrationHubAdminConsoleReactApp\r
  rectangle "==OIDC Client" <<IntegrationHubAdminConsoleOidcClient>> as IntegrationHubAdminConsoleOidcClient\r
  rectangle "==Process Designer" <<IntegrationHubAdminConsoleProcessDesigner>> as IntegrationHubAdminConsoleProcessDesigner\r
  rectangle "==Operations Console" <<IntegrationHubAdminConsoleOperationsConsole>> as IntegrationHubAdminConsoleOperationsConsole\r
}\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "Quarkus Native App" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
  rectangle "==Admin API" <<IntegrationHubQuarkusAppAdminApi>> as IntegrationHubQuarkusAppAdminApi\r
  rectangle "==Execution API" <<IntegrationHubQuarkusAppExecutionApi>> as IntegrationHubQuarkusAppExecutionApi\r
  rectangle "==Query API" <<IntegrationHubQuarkusAppQueryApi>> as IntegrationHubQuarkusAppQueryApi\r
}\r
\r
PlatformAdmin .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>UC-09\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleProcessDesigner : <color:#8D8D8D>UC-01, UC-02, UC-03\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>UC-04, UC-06, UC-08\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>UC-06, UC-07\r
IntegrationHubAdminConsoleOidcClient .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Login y refresh token\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOidcClient : <color:#8D8D8D>Gestiona sesion\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleProcessDesigner : <color:#8D8D8D>Edita pipelines\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>Consulta ejecuciones\r
IntegrationHubAdminConsoleProcessDesigner .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAdminApi : <color:#8D8D8D>CRUD de catalogos y procesos\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppExecutionApi : <color:#8D8D8D>Ejecuta procesos\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppQueryApi : <color:#8D8D8D>Consulta jobs y auditoria\r
User .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Configura fuentes, readers y procesos\r
@enduml\r
`;case"deployment_dev":return`@startuml\r
title "DEV"\r
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
skinparam rectangle<<DevAppDockerHostAdminConsole>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<DevAppDockerHostQuarkusApp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<DevDataDataIam>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<DevDataDataDb>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<DevDataDataOtel>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<DevDataDataJaeger>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
rectangle "app" <<DevApp>> as DevApp {\r
  skinparam RectangleBorderColor<<DevApp>> #737373\r
  skinparam RectangleFontColor<<DevApp>> #737373\r
  skinparam RectangleBorderStyle<<DevApp>> dashed\r
\r
  rectangle "dockerHost" <<DevAppDockerHost>> as DevAppDockerHost {\r
    skinparam RectangleBorderColor<<DevAppDockerHost>> #428a4f\r
    skinparam RectangleFontColor<<DevAppDockerHost>> #428a4f\r
    skinparam RectangleBorderStyle<<DevAppDockerHost>> dashed\r
\r
    rectangle "==Admin Console" <<DevAppDockerHostAdminConsole>> as DevAppDockerHostAdminConsole\r
    rectangle "==Quarkus Native App" <<DevAppDockerHostQuarkusApp>> as DevAppDockerHostQuarkusApp\r
  }\r
}\r
rectangle "data" <<DevData>> as DevData {\r
  skinparam RectangleBorderColor<<DevData>> #737373\r
  skinparam RectangleFontColor<<DevData>> #737373\r
  skinparam RectangleBorderStyle<<DevData>> dashed\r
\r
  rectangle "data" <<DevDataData>> as DevDataData {\r
    skinparam RectangleBorderColor<<DevDataData>> #428a4f\r
    skinparam RectangleFontColor<<DevDataData>> #428a4f\r
    skinparam RectangleBorderStyle<<DevDataData>> dashed\r
\r
    rectangle "==Keycloak" <<DevDataDataIam>> as DevDataDataIam\r
    rectangle "==PostgreSQL" <<DevDataDataDb>> as DevDataDataDb\r
    rectangle "==OpenTelemetry Collector" <<DevDataDataOtel>> as DevDataDataOtel\r
    rectangle "==Jaeger" <<DevDataDataJaeger>> as DevDataDataJaeger\r
  }\r
}\r
\r
DevAppDockerHostAdminConsole .[#8D8D8D,thickness=2].> DevAppDockerHostQuarkusApp : <color:#8D8D8D>[...]\r
DevDataDataOtel .[#8D8D8D,thickness=2].> DevDataDataJaeger : <color:#8D8D8D>Entrega trazas\r
DevAppDockerHostAdminConsole .[#8D8D8D,thickness=2].> DevDataDataIam : <color:#8D8D8D>[...]\r
DevAppDockerHostQuarkusApp .[#8D8D8D,thickness=2].> DevDataDataDb : <color:#8D8D8D>[...]\r
DevAppDockerHostQuarkusApp .[#8D8D8D,thickness=2].> DevDataDataIam : <color:#8D8D8D>Valida access tokens\r
DevAppDockerHostQuarkusApp .[#8D8D8D,thickness=2].> DevDataDataOtel : <color:#8D8D8D>Exporta trazas\r
@enduml\r
`;case"deployment_pre":return`@startuml\r
title "PRE"\r
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
skinparam rectangle<<PreServicesConfigNodeVault>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<PreServicesConfigNodeSharedStorage>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<PreAppPreNode1AdminConsole>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<PreAppPreNode1QuarkusApp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<PreDataDataIam>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<PreDataDataDb>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<PreDataDataOtel>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<PreDataDataJaeger>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
rectangle "services" <<PreServices>> as PreServices {\r
  skinparam RectangleBorderColor<<PreServices>> #737373\r
  skinparam RectangleFontColor<<PreServices>> #737373\r
  skinparam RectangleBorderStyle<<PreServices>> dashed\r
\r
  rectangle "configNode" <<PreServicesConfigNode>> as PreServicesConfigNode {\r
    skinparam RectangleBorderColor<<PreServicesConfigNode>> #428a4f\r
    skinparam RectangleFontColor<<PreServicesConfigNode>> #428a4f\r
    skinparam RectangleBorderStyle<<PreServicesConfigNode>> dashed\r
\r
    rectangle "==Kubernetes Secrets / External Config" <<PreServicesConfigNodeVault>> as PreServicesConfigNodeVault\r
    rectangle "==Shared File Storage" <<PreServicesConfigNodeSharedStorage>> as PreServicesConfigNodeSharedStorage\r
  }\r
}\r
rectangle "app" <<PreApp>> as PreApp {\r
  skinparam RectangleBorderColor<<PreApp>> #737373\r
  skinparam RectangleFontColor<<PreApp>> #737373\r
  skinparam RectangleBorderStyle<<PreApp>> dashed\r
\r
  rectangle "preNode1" <<PreAppPreNode1>> as PreAppPreNode1 {\r
    skinparam RectangleBorderColor<<PreAppPreNode1>> #428a4f\r
    skinparam RectangleFontColor<<PreAppPreNode1>> #428a4f\r
    skinparam RectangleBorderStyle<<PreAppPreNode1>> dashed\r
\r
    rectangle "==Admin Console" <<PreAppPreNode1AdminConsole>> as PreAppPreNode1AdminConsole\r
    rectangle "==Quarkus Native App" <<PreAppPreNode1QuarkusApp>> as PreAppPreNode1QuarkusApp\r
  }\r
}\r
rectangle "data" <<PreData>> as PreData {\r
  skinparam RectangleBorderColor<<PreData>> #737373\r
  skinparam RectangleFontColor<<PreData>> #737373\r
  skinparam RectangleBorderStyle<<PreData>> dashed\r
\r
  rectangle "data" <<PreDataData>> as PreDataData {\r
    skinparam RectangleBorderColor<<PreDataData>> #428a4f\r
    skinparam RectangleFontColor<<PreDataData>> #428a4f\r
    skinparam RectangleBorderStyle<<PreDataData>> dashed\r
\r
    rectangle "==Keycloak" <<PreDataDataIam>> as PreDataDataIam\r
    rectangle "==PostgreSQL" <<PreDataDataDb>> as PreDataDataDb\r
    rectangle "==OpenTelemetry Collector" <<PreDataDataOtel>> as PreDataDataOtel\r
    rectangle "==Jaeger" <<PreDataDataJaeger>> as PreDataDataJaeger\r
  }\r
}\r
\r
PreAppPreNode1AdminConsole .[#8D8D8D,thickness=2].> PreAppPreNode1QuarkusApp : <color:#8D8D8D>[...]\r
PreDataDataOtel .[#8D8D8D,thickness=2].> PreDataDataJaeger : <color:#8D8D8D>Entrega trazas\r
PreAppPreNode1AdminConsole .[#8D8D8D,thickness=2].> PreDataDataIam : <color:#8D8D8D>[...]\r
PreAppPreNode1QuarkusApp .[#8D8D8D,thickness=2].> PreDataDataDb : <color:#8D8D8D>[...]\r
PreAppPreNode1QuarkusApp .[#8D8D8D,thickness=2].> PreDataDataIam : <color:#8D8D8D>Valida access tokens\r
PreAppPreNode1QuarkusApp .[#8D8D8D,thickness=2].> PreDataDataOtel : <color:#8D8D8D>Exporta trazas\r
PreServicesConfigNodeVault .[#8D8D8D,thickness=2].> PreAppPreNode1QuarkusApp : <color:#8D8D8D>Entrega secretos y credenciales\r
PreServicesConfigNodeSharedStorage .[#8D8D8D,thickness=2].> PreAppPreNode1QuarkusApp : <color:#8D8D8D>Comparte archivos locales\r
@enduml\r
`;case"deployment_prod":return`@startuml\r
title "PROD"\r
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
skinparam rectangle<<ProdEdgeLoadBalancerLoadBalancer>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdServicesServicesNodeVault>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdServicesServicesNodeSharedStorage>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdAppAppClusterIngressControllerIngressController>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdAppAppClusterProdNode1AdminConsole>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdAppAppClusterProdNode2AdminConsole>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdAppAppClusterProdNode1QuarkusApp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdAppAppClusterProdNode2QuarkusApp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdDataPostgresHaPostgresPrimaryDb>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdDataPostgresHaPostgresReplicaDb>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdDataKeycloakHaKeycloakNode1Iam>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdDataKeycloakHaKeycloakNode2Iam>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdDataObservabilityNodeOtel>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdDataObservabilityNodeJaeger>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
rectangle "edge" <<ProdEdge>> as ProdEdge {\r
  skinparam RectangleBorderColor<<ProdEdge>> #737373\r
  skinparam RectangleFontColor<<ProdEdge>> #737373\r
  skinparam RectangleBorderStyle<<ProdEdge>> dashed\r
\r
  rectangle "loadBalancer" <<ProdEdgeLoadBalancer>> as ProdEdgeLoadBalancer {\r
    skinparam RectangleBorderColor<<ProdEdgeLoadBalancer>> #428a4f\r
    skinparam RectangleFontColor<<ProdEdgeLoadBalancer>> #428a4f\r
    skinparam RectangleBorderStyle<<ProdEdgeLoadBalancer>> dashed\r
\r
    rectangle "==Load Balancer / Reverse Proxy" <<ProdEdgeLoadBalancerLoadBalancer>> as ProdEdgeLoadBalancerLoadBalancer\r
  }\r
}\r
rectangle "services" <<ProdServices>> as ProdServices {\r
  skinparam RectangleBorderColor<<ProdServices>> #737373\r
  skinparam RectangleFontColor<<ProdServices>> #737373\r
  skinparam RectangleBorderStyle<<ProdServices>> dashed\r
\r
  rectangle "servicesNode" <<ProdServicesServicesNode>> as ProdServicesServicesNode {\r
    skinparam RectangleBorderColor<<ProdServicesServicesNode>> #428a4f\r
    skinparam RectangleFontColor<<ProdServicesServicesNode>> #428a4f\r
    skinparam RectangleBorderStyle<<ProdServicesServicesNode>> dashed\r
\r
    rectangle "==Kubernetes Secrets / External Config" <<ProdServicesServicesNodeVault>> as ProdServicesServicesNodeVault\r
    rectangle "==Shared File Storage" <<ProdServicesServicesNodeSharedStorage>> as ProdServicesServicesNodeSharedStorage\r
  }\r
}\r
rectangle "app" <<ProdApp>> as ProdApp {\r
  skinparam RectangleBorderColor<<ProdApp>> #737373\r
  skinparam RectangleFontColor<<ProdApp>> #737373\r
  skinparam RectangleBorderStyle<<ProdApp>> dashed\r
\r
  rectangle "appCluster" <<ProdAppAppCluster>> as ProdAppAppCluster {\r
    skinparam RectangleBorderColor<<ProdAppAppCluster>> #3b82f6\r
    skinparam RectangleFontColor<<ProdAppAppCluster>> #3b82f6\r
    skinparam RectangleBorderStyle<<ProdAppAppCluster>> dashed\r
\r
    rectangle "ingressController" <<ProdAppAppClusterIngressController>> as ProdAppAppClusterIngressController {\r
      skinparam RectangleBorderColor<<ProdAppAppClusterIngressController>> #428a4f\r
      skinparam RectangleFontColor<<ProdAppAppClusterIngressController>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdAppAppClusterIngressController>> dashed\r
\r
      rectangle "==Ingress Controller" <<ProdAppAppClusterIngressControllerIngressController>> as ProdAppAppClusterIngressControllerIngressController\r
    }\r
    rectangle "prodNode1" <<ProdAppAppClusterProdNode1>> as ProdAppAppClusterProdNode1 {\r
      skinparam RectangleBorderColor<<ProdAppAppClusterProdNode1>> #428a4f\r
      skinparam RectangleFontColor<<ProdAppAppClusterProdNode1>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdAppAppClusterProdNode1>> dashed\r
\r
      rectangle "==Admin Console" <<ProdAppAppClusterProdNode1AdminConsole>> as ProdAppAppClusterProdNode1AdminConsole\r
      rectangle "==Quarkus Native App" <<ProdAppAppClusterProdNode1QuarkusApp>> as ProdAppAppClusterProdNode1QuarkusApp\r
    }\r
    rectangle "prodNode2" <<ProdAppAppClusterProdNode2>> as ProdAppAppClusterProdNode2 {\r
      skinparam RectangleBorderColor<<ProdAppAppClusterProdNode2>> #428a4f\r
      skinparam RectangleFontColor<<ProdAppAppClusterProdNode2>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdAppAppClusterProdNode2>> dashed\r
\r
      rectangle "==Admin Console" <<ProdAppAppClusterProdNode2AdminConsole>> as ProdAppAppClusterProdNode2AdminConsole\r
      rectangle "==Quarkus Native App" <<ProdAppAppClusterProdNode2QuarkusApp>> as ProdAppAppClusterProdNode2QuarkusApp\r
    }\r
  }\r
}\r
rectangle "data" <<ProdData>> as ProdData {\r
  skinparam RectangleBorderColor<<ProdData>> #737373\r
  skinparam RectangleFontColor<<ProdData>> #737373\r
  skinparam RectangleBorderStyle<<ProdData>> dashed\r
\r
  rectangle "postgresHa" <<ProdDataPostgresHa>> as ProdDataPostgresHa {\r
    skinparam RectangleBorderColor<<ProdDataPostgresHa>> #3b82f6\r
    skinparam RectangleFontColor<<ProdDataPostgresHa>> #3b82f6\r
    skinparam RectangleBorderStyle<<ProdDataPostgresHa>> dashed\r
\r
    rectangle "postgresPrimary" <<ProdDataPostgresHaPostgresPrimary>> as ProdDataPostgresHaPostgresPrimary {\r
      skinparam RectangleBorderColor<<ProdDataPostgresHaPostgresPrimary>> #428a4f\r
      skinparam RectangleFontColor<<ProdDataPostgresHaPostgresPrimary>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdDataPostgresHaPostgresPrimary>> dashed\r
\r
      rectangle "==PostgreSQL" <<ProdDataPostgresHaPostgresPrimaryDb>> as ProdDataPostgresHaPostgresPrimaryDb\r
    }\r
    rectangle "postgresReplica" <<ProdDataPostgresHaPostgresReplica>> as ProdDataPostgresHaPostgresReplica {\r
      skinparam RectangleBorderColor<<ProdDataPostgresHaPostgresReplica>> #428a4f\r
      skinparam RectangleFontColor<<ProdDataPostgresHaPostgresReplica>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdDataPostgresHaPostgresReplica>> dashed\r
\r
      rectangle "==PostgreSQL" <<ProdDataPostgresHaPostgresReplicaDb>> as ProdDataPostgresHaPostgresReplicaDb\r
    }\r
  }\r
  rectangle "keycloakHa" <<ProdDataKeycloakHa>> as ProdDataKeycloakHa {\r
    skinparam RectangleBorderColor<<ProdDataKeycloakHa>> #3b82f6\r
    skinparam RectangleFontColor<<ProdDataKeycloakHa>> #3b82f6\r
    skinparam RectangleBorderStyle<<ProdDataKeycloakHa>> dashed\r
\r
    rectangle "keycloakNode1" <<ProdDataKeycloakHaKeycloakNode1>> as ProdDataKeycloakHaKeycloakNode1 {\r
      skinparam RectangleBorderColor<<ProdDataKeycloakHaKeycloakNode1>> #428a4f\r
      skinparam RectangleFontColor<<ProdDataKeycloakHaKeycloakNode1>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdDataKeycloakHaKeycloakNode1>> dashed\r
\r
      rectangle "==Keycloak" <<ProdDataKeycloakHaKeycloakNode1Iam>> as ProdDataKeycloakHaKeycloakNode1Iam\r
    }\r
    rectangle "keycloakNode2" <<ProdDataKeycloakHaKeycloakNode2>> as ProdDataKeycloakHaKeycloakNode2 {\r
      skinparam RectangleBorderColor<<ProdDataKeycloakHaKeycloakNode2>> #428a4f\r
      skinparam RectangleFontColor<<ProdDataKeycloakHaKeycloakNode2>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdDataKeycloakHaKeycloakNode2>> dashed\r
\r
      rectangle "==Keycloak" <<ProdDataKeycloakHaKeycloakNode2Iam>> as ProdDataKeycloakHaKeycloakNode2Iam\r
    }\r
  }\r
  rectangle "observabilityNode" <<ProdDataObservabilityNode>> as ProdDataObservabilityNode {\r
    skinparam RectangleBorderColor<<ProdDataObservabilityNode>> #428a4f\r
    skinparam RectangleFontColor<<ProdDataObservabilityNode>> #428a4f\r
    skinparam RectangleBorderStyle<<ProdDataObservabilityNode>> dashed\r
\r
    rectangle "==OpenTelemetry Collector" <<ProdDataObservabilityNodeOtel>> as ProdDataObservabilityNodeOtel\r
    rectangle "==Jaeger" <<ProdDataObservabilityNodeJaeger>> as ProdDataObservabilityNodeJaeger\r
  }\r
}\r
\r
ProdAppAppClusterProdNode1AdminConsole .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode1QuarkusApp : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode2AdminConsole .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode2QuarkusApp : <color:#8D8D8D>[...]\r
ProdAppAppClusterIngressControllerIngressController .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode1AdminConsole : <color:#8D8D8D>Enruta trafico HTTP interno\r
ProdAppAppClusterIngressControllerIngressController .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode1QuarkusApp : <color:#8D8D8D>Enruta trafico HTTP interno\r
ProdAppAppClusterIngressControllerIngressController .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode2AdminConsole : <color:#8D8D8D>Enruta trafico HTTP interno\r
ProdAppAppClusterIngressControllerIngressController .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode2QuarkusApp : <color:#8D8D8D>Enruta trafico HTTP interno\r
ProdDataObservabilityNodeOtel .[#8D8D8D,thickness=2].> ProdDataObservabilityNodeJaeger : <color:#8D8D8D>Entrega trazas\r
ProdEdgeLoadBalancerLoadBalancer .[#8D8D8D,thickness=2].> ProdAppAppClusterIngressControllerIngressController : <color:#8D8D8D>Reenvia trafico al cluster\r
ProdAppAppClusterProdNode1AdminConsole .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode1Iam : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode1AdminConsole .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode2Iam : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataPostgresHaPostgresPrimaryDb : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataPostgresHaPostgresReplicaDb : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode1Iam : <color:#8D8D8D>Valida access tokens\r
ProdAppAppClusterProdNode1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode2Iam : <color:#8D8D8D>Valida access tokens\r
ProdAppAppClusterProdNode1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataObservabilityNodeOtel : <color:#8D8D8D>Exporta trazas\r
ProdServicesServicesNodeVault .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode1QuarkusApp : <color:#8D8D8D>Entrega secretos y credenciales\r
ProdServicesServicesNodeSharedStorage .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode1QuarkusApp : <color:#8D8D8D>Comparte archivos locales\r
ProdAppAppClusterProdNode2AdminConsole .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode1Iam : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode2AdminConsole .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode2Iam : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataPostgresHaPostgresPrimaryDb : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataPostgresHaPostgresReplicaDb : <color:#8D8D8D>[...]\r
ProdAppAppClusterProdNode2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode1Iam : <color:#8D8D8D>Valida access tokens\r
ProdAppAppClusterProdNode2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode2Iam : <color:#8D8D8D>Valida access tokens\r
ProdAppAppClusterProdNode2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataObservabilityNodeOtel : <color:#8D8D8D>Exporta trazas\r
ProdServicesServicesNodeVault .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode2QuarkusApp : <color:#8D8D8D>Entrega secretos y credenciales\r
ProdServicesServicesNodeSharedStorage .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode2QuarkusApp : <color:#8D8D8D>Comparte archivos locales\r
ProdAppAppClusterIngressController .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode1 : <color:#8D8D8D>Rutea trafico UI y API\r
ProdAppAppClusterIngressController .[#8D8D8D,thickness=2].> ProdAppAppClusterProdNode2 : <color:#8D8D8D>Rutea trafico UI y API\r
ProdEdgeLoadBalancer .[#8D8D8D,thickness=2].> ProdAppAppClusterIngressController : <color:#8D8D8D>HTTPS\r
@enduml\r
`;case"usecase_design_execute":return`@startuml\r
title "Disenar y ejecutar proceso"\r
left to right direction\r
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
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ExternalApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam person<<IntegrationAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleProcessDesigner>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppAdminApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam person<<Operator>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleOperationsConsole>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppExecutionApi>>{\r
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
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
rectangle "Admin Console" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole {\r
  skinparam RectangleBorderColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubAdminConsole>> dashed\r
\r
  rectangle "==Process Designer" <<IntegrationHubAdminConsoleProcessDesigner>> as IntegrationHubAdminConsoleProcessDesigner\r
  rectangle "==Operations Console" <<IntegrationHubAdminConsoleOperationsConsole>> as IntegrationHubAdminConsoleOperationsConsole\r
}\r
rectangle "Quarkus Native App" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
  rectangle "==Admin API" <<IntegrationHubQuarkusAppAdminApi>> as IntegrationHubQuarkusAppAdminApi\r
  rectangle "==Execution API" <<IntegrationHubQuarkusAppExecutionApi>> as IntegrationHubQuarkusAppExecutionApi\r
  rectangle "==Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine\r
  rectangle "==Source Provider Registry" <<IntegrationHubQuarkusAppSourceRegistry>> as IntegrationHubQuarkusAppSourceRegistry\r
  rectangle "==Reader Provider Registry" <<IntegrationHubQuarkusAppReaderRegistry>> as IntegrationHubQuarkusAppReaderRegistry\r
  rectangle "==DbWriteTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider\r
  rectangle "==RestCallTaskProvider" <<IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider>> as IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider\r
}\r
person "==Operator" <<Operator>> as Operator\r
\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleProcessDesigner : <color:#8D8D8D>Configura source, reader y tareas\r
IntegrationHubAdminConsoleProcessDesigner .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAdminApi : <color:#8D8D8D>Guarda process definition\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>Selecciona proceso\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppExecutionApi : <color:#8D8D8D>Ejecuta proceso\r
IntegrationHubQuarkusAppExecutionApi .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>Inicia ejecucion\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceRegistry : <color:#8D8D8D>Obtiene fuente\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppReaderRegistry : <color:#8D8D8D>Lee contenido\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider : <color:#8D8D8D>Persiste registros\r
IntegrationHubQuarkusAppTaskProvidersDbWriteTaskProvider .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Guarda staging/destino\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider : <color:#8D8D8D>Invoca API externa\r
IntegrationHubQuarkusAppTaskProvidersRestCallTaskProvider .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>Envia payload\r
IntegrationHubQuarkusAppExecutionApi .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>Consulta resultado\r
@enduml\r
`;case"usecase_scheduled_audit":return`@startuml\r
title "Ejecucion programada y auditoria"\r
left to right direction\r
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
skinparam rectangle<<IntegrationHubAdminConsoleOperationsConsole>>{\r
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
skinparam rectangle<<IntegrationHubQuarkusAppAuditService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppQueryApi>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityOtel>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
skinparam rectangle<<ObservabilityJaeger>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
skinparam person<<SchedulerActor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTelemetry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam person<<Auditor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
rectangle "==Operations Console" <<IntegrationHubAdminConsoleOperationsConsole>> as IntegrationHubAdminConsoleOperationsConsole\r
rectangle "==Scheduler" <<IntegrationHubQuarkusAppScheduler>> as IntegrationHubQuarkusAppScheduler\r
rectangle "==Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine\r
rectangle "==Audit Service" <<IntegrationHubQuarkusAppAuditService>> as IntegrationHubQuarkusAppAuditService\r
rectangle "==Query API" <<IntegrationHubQuarkusAppQueryApi>> as IntegrationHubQuarkusAppQueryApi\r
rectangle "==OpenTelemetry Collector" <<ObservabilityOtel>> as ObservabilityOtel\r
rectangle "==Jaeger" <<ObservabilityJaeger>> as ObservabilityJaeger\r
person "==Scheduler" <<SchedulerActor>> as SchedulerActor\r
rectangle "==OpenTelemetry Instrumentation" <<IntegrationHubQuarkusAppTelemetry>> as IntegrationHubQuarkusAppTelemetry\r
person "==Auditor" <<Auditor>> as Auditor\r
\r
SchedulerActor .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppScheduler : <color:#8D8D8D>Dispara scheduler\r
IntegrationHubQuarkusAppScheduler .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>Lanza proceso programado\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Registra eventos\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTelemetry : <color:#8D8D8D>Emite spans\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>Consulta auditoria\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppQueryApi : <color:#8D8D8D>Solicita eventos y ejecuciones\r
IntegrationHubQuarkusAppQueryApi .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Lee eventos\r
IntegrationHubQuarkusAppTelemetry .[#8D8D8D,thickness=2].> ObservabilityOtel : <color:#8D8D8D>Exporta trazas\r
ObservabilityOtel .[#8D8D8D,thickness=2].> ObservabilityJaeger : <color:#8D8D8D>Publica visualizacion\r
@enduml\r
`;default:throw new Error("Unknown viewId: "+r)}}export{n as pumlSource};
