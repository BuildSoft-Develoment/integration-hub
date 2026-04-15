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
skinparam rectangle<<AppService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Vault>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<SharedStorage>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<LoadBalancer>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHub>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IngressController>>{\r
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
rectangle "==Integration Hub Service" <<AppService>> as AppService\r
rectangle "==Kubernetes Secrets / External Config" <<Vault>> as Vault\r
rectangle "==Shared File Storage" <<SharedStorage>> as SharedStorage\r
rectangle "==Load Balancer / Reverse Proxy" <<LoadBalancer>> as LoadBalancer\r
rectangle "==Integration Hub Platform" <<IntegrationHub>> as IntegrationHub\r
rectangle "==Ingress Controller" <<IngressController>> as IngressController\r
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
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Administra catalogos y procesos\r
Operator .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Ejecuta procesos\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Consulta auditoria y resultados\r
SchedulerActor .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>UC-05\r
IntegrationHub .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>[...]\r
LoadBalancer .[#8D8D8D,thickness=2].> IngressController : <color:#8D8D8D>Reenvia trafico al cluster\r
Vault .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Entrega secretos y credenciales\r
SharedStorage .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Comparte archivos locales\r
IntegrationHub .[#8D8D8D,thickness=2].> FileSources : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Observability : <color:#8D8D8D>Exporta trazas\r
@enduml\r
`;case"context":return`@startuml\r
title "Usuario y ecosistema externo"\r
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
skinparam rectangle<<FileSources>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
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
rectangle "==Integration Hub Platform" <<IntegrationHub>> as IntegrationHub\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==Fuentes externas" <<FileSources>> as FileSources\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
rectangle "==Observabilidad" <<Observability>> as Observability\r
\r
User .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHub : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationHub .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> FileSources : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>[...]\r
IntegrationHub .[#8D8D8D,thickness=2].> Observability : <color:#8D8D8D>Exporta trazas\r
@enduml\r
`;case"containers":return`@startuml\r
title "Zoom a la plataforma"\r
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
rectangle "Integration Hub Platform" <<IntegrationHub>> as IntegrationHub {\r
  skinparam RectangleBorderColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHub>> dashed\r
\r
  rectangle "==Admin Console App (Front)" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole\r
  rectangle "==App Service Quarkus Native" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp\r
}\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "Fuentes externas" <<FileSources>> as FileSources {\r
  skinparam RectangleBorderColor<<FileSources>> #3b82f6\r
  skinparam RectangleFontColor<<FileSources>> #3b82f6\r
  skinparam RectangleBorderStyle<<FileSources>> dashed\r
\r
  rectangle "==File System" <<FileSourcesFilesystem>> as FileSourcesFilesystem\r
  rectangle "==FTP" <<FileSourcesFtp>> as FileSourcesFtp\r
  rectangle "==SFTP" <<FileSourcesSftp>> as FileSourcesSftp\r
  rectangle "==REST Source" <<FileSourcesRestSource>> as FileSourcesRestSource\r
}\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
rectangle "Observabilidad" <<Observability>> as Observability {\r
  skinparam RectangleBorderColor<<Observability>> #3b82f6\r
  skinparam RectangleFontColor<<Observability>> #3b82f6\r
  skinparam RectangleBorderStyle<<Observability>> dashed\r
\r
  rectangle "==OpenTelemetry Collector" <<ObservabilityOtel>> as ObservabilityOtel\r
  rectangle "==Jaeger" <<ObservabilityJaeger>> as ObservabilityJaeger\r
}\r
\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusApp : <color:#8D8D8D>Invoca APIs protegidas\r
User .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Administra catalogos y procesos\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Ejecuta procesos\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta auditoria y resultados\r
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
`;case"frontend_components":return`@startuml\r
title "Zoom a Admin Console App (Front)"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppProcessDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppSourceDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessScheduleResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppExecutionQueryResource>>{\r
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
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
person "==Operator" <<Operator>> as Operator\r
person "==Auditor" <<Auditor>> as Auditor\r
rectangle "Integration Hub Platform" <<IntegrationHub>> as IntegrationHub {\r
  skinparam RectangleBorderColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHub>> dashed\r
\r
  rectangle "Admin Console App (Front)" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole {\r
    skinparam RectangleBorderColor<<IntegrationHubAdminConsole>> #428a4f\r
    skinparam RectangleFontColor<<IntegrationHubAdminConsole>> #428a4f\r
    skinparam RectangleBorderStyle<<IntegrationHubAdminConsole>> dashed\r
\r
    rectangle "==React + PatternFly UI" <<IntegrationHubAdminConsoleReactApp>> as IntegrationHubAdminConsoleReactApp\r
    rectangle "==OIDC Client" <<IntegrationHubAdminConsoleOidcClient>> as IntegrationHubAdminConsoleOidcClient\r
    rectangle "==Process Designer" <<IntegrationHubAdminConsoleProcessDesigner>> as IntegrationHubAdminConsoleProcessDesigner\r
    rectangle "==Operations Console" <<IntegrationHubAdminConsoleOperationsConsole>> as IntegrationHubAdminConsoleOperationsConsole\r
  }\r
  rectangle "App Service Quarkus Native" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
    skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
    rectangle "==ProcessDefinitionResource" <<IntegrationHubQuarkusAppProcessDefinitionResource>> as IntegrationHubQuarkusAppProcessDefinitionResource\r
    rectangle "==SourceDefinitionResource" <<IntegrationHubQuarkusAppSourceDefinitionResource>> as IntegrationHubQuarkusAppSourceDefinitionResource\r
    rectangle "==ProcessExecutionResource" <<IntegrationHubQuarkusAppProcessExecutionResource>> as IntegrationHubQuarkusAppProcessExecutionResource\r
    rectangle "==ProcessScheduleResource" <<IntegrationHubQuarkusAppProcessScheduleResource>> as IntegrationHubQuarkusAppProcessScheduleResource\r
    rectangle "==ExecutionQueryResource" <<IntegrationHubQuarkusAppExecutionQueryResource>> as IntegrationHubQuarkusAppExecutionQueryResource\r
  }\r
}\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==Keycloak" <<Iam>> as Iam\r
\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOidcClient : <color:#8D8D8D>Gestiona sesion\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleProcessDesigner : <color:#8D8D8D>Configura catalogos y procesos\r
IntegrationHubAdminConsoleReactApp .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>Consulta y ejecuta procesos\r
IntegrationHubAdminConsoleOidcClient .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Login y refresh token\r
IntegrationHubAdminConsoleProcessDesigner .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessDefinitionResource : <color:#8D8D8D>CRUD de procesos\r
IntegrationHubAdminConsoleProcessDesigner .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceDefinitionResource : <color:#8D8D8D>CRUD de sources\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionResource : <color:#8D8D8D>Ejecuta procesos\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessScheduleResource : <color:#8D8D8D>Consulta programaciones\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppExecutionQueryResource : <color:#8D8D8D>Consulta ejecuciones y auditoria\r
User .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Administra catalogos y procesos\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Ejecuta procesos\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta auditoria y resultados\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste configuracion, jobs, auditoria y staging\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Valida access tokens\r
@enduml\r
`;case"backend_components":return`@startuml\r
title "Zoom a App Service Quarkus Native"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppTelemetry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubAdminConsole>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppSourceDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessScheduleResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppExecutionQueryResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessSchedulerService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #AC4D39\r
  FontColor #FBD3CB\r
  BorderColor #853A2D\r
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
skinparam rectangle<<IntegrationHubQuarkusAppProcessCatalogService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessScheduleQueryService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppExecutionQueryService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityJaeger>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppPersistenceLayer>>{\r
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
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntities>>{\r
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
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
person "==Operator" <<Operator>> as Operator\r
person "==Auditor" <<Auditor>> as Auditor\r
rectangle "Integration Hub Platform" <<IntegrationHub>> as IntegrationHub {\r
  skinparam RectangleBorderColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHub>> dashed\r
\r
  rectangle "App Service Quarkus Native" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
    skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
    rectangle "==OpenTelemetry Instrumentation" <<IntegrationHubQuarkusAppTelemetry>> as IntegrationHubQuarkusAppTelemetry\r
    rectangle "==ProcessDefinitionResource" <<IntegrationHubQuarkusAppProcessDefinitionResource>> as IntegrationHubQuarkusAppProcessDefinitionResource\r
    rectangle "==SourceDefinitionResource" <<IntegrationHubQuarkusAppSourceDefinitionResource>> as IntegrationHubQuarkusAppSourceDefinitionResource\r
    rectangle "==ProcessExecutionResource" <<IntegrationHubQuarkusAppProcessExecutionResource>> as IntegrationHubQuarkusAppProcessExecutionResource\r
    rectangle "==ProcessScheduleResource" <<IntegrationHubQuarkusAppProcessScheduleResource>> as IntegrationHubQuarkusAppProcessScheduleResource\r
    rectangle "==ExecutionQueryResource" <<IntegrationHubQuarkusAppExecutionQueryResource>> as IntegrationHubQuarkusAppExecutionQueryResource\r
    rectangle "==ProcessSchedulerService" <<IntegrationHubQuarkusAppProcessSchedulerService>> as IntegrationHubQuarkusAppProcessSchedulerService\r
    rectangle "==ProcessCatalogService" <<IntegrationHubQuarkusAppProcessCatalogService>> as IntegrationHubQuarkusAppProcessCatalogService\r
    rectangle "==ProcessScheduleQueryService" <<IntegrationHubQuarkusAppProcessScheduleQueryService>> as IntegrationHubQuarkusAppProcessScheduleQueryService\r
    rectangle "==ExecutionQueryService" <<IntegrationHubQuarkusAppExecutionQueryService>> as IntegrationHubQuarkusAppExecutionQueryService\r
    rectangle "==ProcessExecutionService" <<IntegrationHubQuarkusAppProcessExecutionService>> as IntegrationHubQuarkusAppProcessExecutionService\r
    rectangle "==Panache Persistence Layer" <<IntegrationHubQuarkusAppPersistenceLayer>> as IntegrationHubQuarkusAppPersistenceLayer\r
    rectangle "==Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine\r
    rectangle "==Audit Service" <<IntegrationHubQuarkusAppAuditService>> as IntegrationHubQuarkusAppAuditService\r
    rectangle "==Domain Entities" <<IntegrationHubQuarkusAppDomainEntities>> as IntegrationHubQuarkusAppDomainEntities\r
  }\r
  rectangle "==Admin Console App (Front)" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole\r
}\r
rectangle "Fuentes externas" <<FileSources>> as FileSources {\r
  skinparam RectangleBorderColor<<FileSources>> #3b82f6\r
  skinparam RectangleFontColor<<FileSources>> #3b82f6\r
  skinparam RectangleBorderStyle<<FileSources>> dashed\r
\r
  rectangle "==File System" <<FileSourcesFilesystem>> as FileSourcesFilesystem\r
  rectangle "==FTP" <<FileSourcesFtp>> as FileSourcesFtp\r
  rectangle "==SFTP" <<FileSourcesSftp>> as FileSourcesSftp\r
  rectangle "==REST Source" <<FileSourcesRestSource>> as FileSourcesRestSource\r
}\r
rectangle "Observabilidad" <<Observability>> as Observability {\r
  skinparam RectangleBorderColor<<Observability>> #3b82f6\r
  skinparam RectangleFontColor<<Observability>> #3b82f6\r
  skinparam RectangleBorderStyle<<Observability>> dashed\r
\r
  rectangle "==OpenTelemetry Collector" <<ObservabilityOtel>> as ObservabilityOtel\r
  rectangle "==Jaeger" <<ObservabilityJaeger>> as ObservabilityJaeger\r
}\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
\r
IntegrationHubQuarkusAppProcessDefinitionResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessCatalogService : <color:#8D8D8D>Delega gestion de procesos\r
IntegrationHubQuarkusAppSourceDefinitionResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessCatalogService : <color:#8D8D8D>Delega gestion de sources\r
IntegrationHubQuarkusAppProcessExecutionResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionService : <color:#8D8D8D>Delega ejecucion\r
IntegrationHubQuarkusAppProcessScheduleResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessScheduleQueryService : <color:#8D8D8D>Delega consulta de schedules\r
IntegrationHubQuarkusAppExecutionQueryResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppExecutionQueryService : <color:#8D8D8D>Delega consultas operativas\r
IntegrationHubQuarkusAppProcessCatalogService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppPersistenceLayer : <color:#8D8D8D>Persiste definiciones\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>[...]\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Registra eventos\r
IntegrationHubQuarkusAppProcessSchedulerService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionService : <color:#8D8D8D>Dispara procesos programados\r
IntegrationHubQuarkusAppProcessScheduleQueryService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppPersistenceLayer : <color:#8D8D8D>Consulta programaciones\r
IntegrationHubQuarkusAppExecutionQueryService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppPersistenceLayer : <color:#8D8D8D>Consulta ejecuciones y auditoria\r
IntegrationHubQuarkusAppPersistenceLayer .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntities : <color:#8D8D8D>Lee y persiste\r
User .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Administra catalogos y procesos\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Ejecuta procesos\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta auditoria y resultados\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessDefinitionResource : <color:#8D8D8D>CRUD de procesos\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceDefinitionResource : <color:#8D8D8D>CRUD de sources\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionResource : <color:#8D8D8D>Ejecuta procesos\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessScheduleResource : <color:#8D8D8D>Consulta programaciones\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppExecutionQueryResource : <color:#8D8D8D>Consulta ejecuciones y auditoria\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Batch insert, update y upsert\r
IntegrationHubQuarkusAppPersistenceLayer .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Opera sobre PostgreSQL\r
IntegrationHubAdminConsole .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Autenticacion OIDC\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>[...]\r
ObservabilityOtel .[#8D8D8D,thickness=2].> ObservabilityJaeger : <color:#8D8D8D>Entrega trazas\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Valida access tokens\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesFilesystem : <color:#8D8D8D>Lee archivos locales\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesFtp : <color:#8D8D8D>Descarga archivos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesSftp : <color:#8D8D8D>Descarga archivos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesRestSource : <color:#8D8D8D>Obtiene payloads remotos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> ObservabilityOtel : <color:#8D8D8D>Exporta trazas\r
@enduml\r
`;case"process_engine_code":return`@startuml\r
title "Zoom a Process Engine"\r
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
skinparam rectangle<<IntegrationHubAdminConsoleProcessDesigner>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppTelemetry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
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
skinparam rectangle<<IntegrationHubAdminConsoleOperationsConsole>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppPersistenceLayer>>{\r
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
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ObservabilityJaeger>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppAuditService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineSourceRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineReaderRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineTaskRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineSourceProviders>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineReaderProviders>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineTaskProviders>>{\r
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
rectangle "Integration Hub Platform" <<IntegrationHub>> as IntegrationHub {\r
  skinparam RectangleBorderColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHub>> dashed\r
\r
  rectangle "Admin Console App (Front)" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole {\r
    skinparam RectangleBorderColor<<IntegrationHubAdminConsole>> #428a4f\r
    skinparam RectangleFontColor<<IntegrationHubAdminConsole>> #428a4f\r
    skinparam RectangleBorderStyle<<IntegrationHubAdminConsole>> dashed\r
\r
    rectangle "==Process Designer" <<IntegrationHubAdminConsoleProcessDesigner>> as IntegrationHubAdminConsoleProcessDesigner\r
    rectangle "==Operations Console" <<IntegrationHubAdminConsoleOperationsConsole>> as IntegrationHubAdminConsoleOperationsConsole\r
  }\r
  rectangle "App Service Quarkus Native" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
    skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
    rectangle "==OpenTelemetry Instrumentation" <<IntegrationHubQuarkusAppTelemetry>> as IntegrationHubQuarkusAppTelemetry\r
    rectangle "==ProcessExecutionResource" <<IntegrationHubQuarkusAppProcessExecutionResource>> as IntegrationHubQuarkusAppProcessExecutionResource\r
    rectangle "==Panache Persistence Layer" <<IntegrationHubQuarkusAppPersistenceLayer>> as IntegrationHubQuarkusAppPersistenceLayer\r
    rectangle "==ProcessExecutionService" <<IntegrationHubQuarkusAppProcessExecutionService>> as IntegrationHubQuarkusAppProcessExecutionService\r
    rectangle "Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine {\r
      skinparam RectangleBorderColor<<IntegrationHubQuarkusAppProcessEngine>> #3b82f6\r
      skinparam RectangleFontColor<<IntegrationHubQuarkusAppProcessEngine>> #3b82f6\r
      skinparam RectangleBorderStyle<<IntegrationHubQuarkusAppProcessEngine>> dashed\r
\r
      rectangle "==JsonConfigurationMapper" <<IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper>> as IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper\r
      rectangle "==Source Provider Registry" <<IntegrationHubQuarkusAppProcessEngineSourceRegistry>> as IntegrationHubQuarkusAppProcessEngineSourceRegistry\r
      rectangle "==Reader Provider Registry" <<IntegrationHubQuarkusAppProcessEngineReaderRegistry>> as IntegrationHubQuarkusAppProcessEngineReaderRegistry\r
      rectangle "==Task Provider Registry" <<IntegrationHubQuarkusAppProcessEngineTaskRegistry>> as IntegrationHubQuarkusAppProcessEngineTaskRegistry\r
      rectangle "==Source Providers" <<IntegrationHubQuarkusAppProcessEngineSourceProviders>> as IntegrationHubQuarkusAppProcessEngineSourceProviders\r
      rectangle "==Reader Providers" <<IntegrationHubQuarkusAppProcessEngineReaderProviders>> as IntegrationHubQuarkusAppProcessEngineReaderProviders\r
      rectangle "==Task Providers" <<IntegrationHubQuarkusAppProcessEngineTaskProviders>> as IntegrationHubQuarkusAppProcessEngineTaskProviders\r
    }\r
    rectangle "==Audit Service" <<IntegrationHubQuarkusAppAuditService>> as IntegrationHubQuarkusAppAuditService\r
  }\r
}\r
rectangle "Fuentes externas" <<FileSources>> as FileSources {\r
  skinparam RectangleBorderColor<<FileSources>> #3b82f6\r
  skinparam RectangleFontColor<<FileSources>> #3b82f6\r
  skinparam RectangleBorderStyle<<FileSources>> dashed\r
\r
  rectangle "==File System" <<FileSourcesFilesystem>> as FileSourcesFilesystem\r
  rectangle "==FTP" <<FileSourcesFtp>> as FileSourcesFtp\r
  rectangle "==SFTP" <<FileSourcesSftp>> as FileSourcesSftp\r
  rectangle "==REST Source" <<FileSourcesRestSource>> as FileSourcesRestSource\r
}\r
rectangle "Observabilidad" <<Observability>> as Observability {\r
  skinparam RectangleBorderColor<<Observability>> #3b82f6\r
  skinparam RectangleFontColor<<Observability>> #3b82f6\r
  skinparam RectangleBorderStyle<<Observability>> dashed\r
\r
  rectangle "==OpenTelemetry Collector" <<ObservabilityOtel>> as ObservabilityOtel\r
  rectangle "==Jaeger" <<ObservabilityJaeger>> as ObservabilityJaeger\r
}\r
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
person "==Operator" <<Operator>> as Operator\r
person "==Auditor" <<Auditor>> as Auditor\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionResource : <color:#8D8D8D>Ejecuta procesos\r
IntegrationHubQuarkusAppProcessExecutionResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionService : <color:#8D8D8D>Delega ejecucion\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineJsonConfigurationMapper : <color:#8D8D8D>Lee configuracion JSON\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineSourceRegistry : <color:#8D8D8D>Resuelve SourceProvider\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineReaderRegistry : <color:#8D8D8D>Resuelve ReaderProvider\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineTaskRegistry : <color:#8D8D8D>Resuelve TaskProvider\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineTaskProviders : <color:#8D8D8D>[...]\r
IntegrationHubQuarkusAppProcessEngineSourceRegistry .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineSourceProviders : <color:#8D8D8D>Usa implementations\r
IntegrationHubQuarkusAppProcessEngineReaderRegistry .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineReaderProviders : <color:#8D8D8D>Usa implementations\r
IntegrationHubQuarkusAppProcessEngineTaskRegistry .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineTaskProviders : <color:#8D8D8D>Usa implementations\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Registra eventos\r
IntegrationHubQuarkusAppProcessEngineTaskProviders .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Batch insert, update y upsert\r
IntegrationHubQuarkusAppPersistenceLayer .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Opera sobre PostgreSQL\r
IntegrationHubQuarkusAppProcessEngineTaskProviders .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>[...]\r
ObservabilityOtel .[#8D8D8D,thickness=2].> ObservabilityJaeger : <color:#8D8D8D>Entrega trazas\r
User .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Administra catalogos y procesos\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Ejecuta procesos\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta auditoria y resultados\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesFilesystem : <color:#8D8D8D>Lee archivos locales\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesFtp : <color:#8D8D8D>Descarga archivos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesSftp : <color:#8D8D8D>Descarga archivos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> FileSourcesRestSource : <color:#8D8D8D>Obtiene payloads remotos\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> ObservabilityOtel : <color:#8D8D8D>Exporta trazas\r
@enduml\r
`;case"domain_catalog_entities_code":return`@startuml\r
title "Catalog"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesSourceDefinitionEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesReaderDefinitionEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
rectangle "Integration Hub Platform" <<IntegrationHub>> as IntegrationHub {\r
  skinparam RectangleBorderColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHub>> dashed\r
\r
  rectangle "App Service Quarkus Native" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
    skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
    rectangle "Domain Entities" <<IntegrationHubQuarkusAppDomainEntities>> as IntegrationHubQuarkusAppDomainEntities {\r
      skinparam RectangleBorderColor<<IntegrationHubQuarkusAppDomainEntities>> #3b82f6\r
      skinparam RectangleFontColor<<IntegrationHubQuarkusAppDomainEntities>> #3b82f6\r
      skinparam RectangleBorderStyle<<IntegrationHubQuarkusAppDomainEntities>> dashed\r
\r
      rectangle "==ProcessDefinition" <<IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity>> as IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity\r
      rectangle "==ProcessTaskDefinition" <<IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity>> as IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity\r
      rectangle "==SourceDefinition" <<IntegrationHubQuarkusAppDomainEntitiesSourceDefinitionEntity>> as IntegrationHubQuarkusAppDomainEntitiesSourceDefinitionEntity\r
      rectangle "==ReaderDefinition" <<IntegrationHubQuarkusAppDomainEntitiesReaderDefinitionEntity>> as IntegrationHubQuarkusAppDomainEntitiesReaderDefinitionEntity\r
    }\r
  }\r
}\r
rectangle "==PostgreSQL" <<Db>> as Db\r
\r
IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity : <color:#8D8D8D>1..n tasks\r
IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesSourceDefinitionEntity : <color:#8D8D8D>0..1 sourceDefinition\r
IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesReaderDefinitionEntity : <color:#8D8D8D>0..1 readerDefinition\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste configuracion, jobs, auditoria y staging\r
@enduml\r
`;case"domain_execution_entities_code":return`@startuml\r
title "Execution"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesProcessTaskExecutionEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesAuditEventEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesProcessExecutionEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
rectangle "Integration Hub Platform" <<IntegrationHub>> as IntegrationHub {\r
  skinparam RectangleBorderColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHub>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHub>> dashed\r
\r
  rectangle "App Service Quarkus Native" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
    skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
    skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
    rectangle "Domain Entities" <<IntegrationHubQuarkusAppDomainEntities>> as IntegrationHubQuarkusAppDomainEntities {\r
      skinparam RectangleBorderColor<<IntegrationHubQuarkusAppDomainEntities>> #3b82f6\r
      skinparam RectangleFontColor<<IntegrationHubQuarkusAppDomainEntities>> #3b82f6\r
      skinparam RectangleBorderStyle<<IntegrationHubQuarkusAppDomainEntities>> dashed\r
\r
      rectangle "==ProcessTaskExecution" <<IntegrationHubQuarkusAppDomainEntitiesProcessTaskExecutionEntity>> as IntegrationHubQuarkusAppDomainEntitiesProcessTaskExecutionEntity\r
      rectangle "==AuditEvent" <<IntegrationHubQuarkusAppDomainEntitiesAuditEventEntity>> as IntegrationHubQuarkusAppDomainEntitiesAuditEventEntity\r
      rectangle "==ProcessExecution" <<IntegrationHubQuarkusAppDomainEntitiesProcessExecutionEntity>> as IntegrationHubQuarkusAppDomainEntitiesProcessExecutionEntity\r
      rectangle "==ProcessDefinition" <<IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity>> as IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity\r
      rectangle "==ProcessTaskDefinition" <<IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity>> as IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity\r
    }\r
  }\r
}\r
rectangle "==PostgreSQL" <<Db>> as Db\r
\r
IntegrationHubQuarkusAppDomainEntitiesProcessTaskExecutionEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesProcessExecutionEntity : <color:#8D8D8D>n..1 processExecution\r
IntegrationHubQuarkusAppDomainEntitiesAuditEventEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesProcessExecutionEntity : <color:#8D8D8D>n..1 processExecution\r
IntegrationHubQuarkusAppDomainEntitiesProcessExecutionEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity : <color:#8D8D8D>n..1 processDefinition\r
IntegrationHubQuarkusAppDomainEntitiesProcessTaskExecutionEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity : <color:#8D8D8D>n..1 taskDefinition\r
IntegrationHubQuarkusAppDomainEntitiesAuditEventEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity : <color:#8D8D8D>0..1 taskDefinition\r
IntegrationHubQuarkusAppDomainEntitiesProcessDefinitionEntity .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppDomainEntitiesProcessTaskDefinitionEntity : <color:#8D8D8D>1..n tasks\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Persiste configuracion, jobs, auditoria y staging\r
@enduml\r
`;case"security_overview":return`@startuml\r
title "OIDC, roles y control de acceso"\r
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
skinparam rectangle<<IntegrationHubAdminConsoleOidcClient>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #AC4D39\r
  FontColor #FBD3CB\r
  BorderColor #853A2D\r
}\r
person "==Platform Admin" <<PlatformAdmin>> as PlatformAdmin\r
person "==Usuario de negocio" <<User>> as User\r
person "==Administrador de integraciones" <<Admin>> as Admin\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
person "==Operator" <<Operator>> as Operator\r
person "==Auditor" <<Auditor>> as Auditor\r
rectangle "App Service Quarkus Native" <<IntegrationHubQuarkusApp>> as IntegrationHubQuarkusApp {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusApp>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusApp>> dashed\r
\r
  rectangle "==ProcessDefinitionResource" <<IntegrationHubQuarkusAppProcessDefinitionResource>> as IntegrationHubQuarkusAppProcessDefinitionResource\r
  rectangle "==ProcessExecutionResource" <<IntegrationHubQuarkusAppProcessExecutionResource>> as IntegrationHubQuarkusAppProcessExecutionResource\r
}\r
rectangle "Admin Console App (Front)" <<IntegrationHubAdminConsole>> as IntegrationHubAdminConsole {\r
  skinparam RectangleBorderColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleFontColor<<IntegrationHubAdminConsole>> #428a4f\r
  skinparam RectangleBorderStyle<<IntegrationHubAdminConsole>> dashed\r
\r
  rectangle "==OIDC Client" <<IntegrationHubAdminConsoleOidcClient>> as IntegrationHubAdminConsoleOidcClient\r
}\r
rectangle "==Keycloak" <<Iam>> as Iam\r
\r
PlatformAdmin .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>UC-09\r
IntegrationHubAdminConsoleOidcClient .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Login y refresh token\r
User .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta estado y resultados\r
Admin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Configura fuentes, readers y procesos\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Administra catalogos y procesos\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Ejecuta procesos\r
Auditor .[#8D8D8D,thickness=2].> IntegrationHubAdminConsole : <color:#8D8D8D>Consulta auditoria y resultados\r
IntegrationHubQuarkusApp .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Valida access tokens\r
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
    rectangle "==Admin Console App (Front)" <<DevAppDockerHostAdminConsole>> as DevAppDockerHostAdminConsole\r
    rectangle "==App Service Quarkus Native" <<DevAppDockerHostQuarkusApp>> as DevAppDockerHostQuarkusApp\r
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
    rectangle "==Admin Console App (Front)" <<PreAppPreNode1AdminConsole>> as PreAppPreNode1AdminConsole\r
    rectangle "==App Service Quarkus Native" <<PreAppPreNode1QuarkusApp>> as PreAppPreNode1QuarkusApp\r
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
skinparam rectangle<<ProdAppAppClusterAppService>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdAppAppClusterIngressControllerIngressController>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<ProdAppAppClusterAppPod1AdminConsole>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdAppAppClusterAppPod2AdminConsole>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdAppAppClusterAppPod1QuarkusApp>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
skinparam rectangle<<ProdAppAppClusterAppPod2QuarkusApp>>{\r
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
    rectangle "==Integration Hub Service" <<ProdAppAppClusterAppService>> as ProdAppAppClusterAppService\r
    rectangle "appPod1" <<ProdAppAppClusterAppPod1>> as ProdAppAppClusterAppPod1 {\r
      skinparam RectangleBorderColor<<ProdAppAppClusterAppPod1>> #428a4f\r
      skinparam RectangleFontColor<<ProdAppAppClusterAppPod1>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdAppAppClusterAppPod1>> dashed\r
\r
      rectangle "==Admin Console App (Front)" <<ProdAppAppClusterAppPod1AdminConsole>> as ProdAppAppClusterAppPod1AdminConsole\r
      rectangle "==App Service Quarkus Native" <<ProdAppAppClusterAppPod1QuarkusApp>> as ProdAppAppClusterAppPod1QuarkusApp\r
    }\r
    rectangle "appPod2" <<ProdAppAppClusterAppPod2>> as ProdAppAppClusterAppPod2 {\r
      skinparam RectangleBorderColor<<ProdAppAppClusterAppPod2>> #428a4f\r
      skinparam RectangleFontColor<<ProdAppAppClusterAppPod2>> #428a4f\r
      skinparam RectangleBorderStyle<<ProdAppAppClusterAppPod2>> dashed\r
\r
      rectangle "==Admin Console App (Front)" <<ProdAppAppClusterAppPod2AdminConsole>> as ProdAppAppClusterAppPod2AdminConsole\r
      rectangle "==App Service Quarkus Native" <<ProdAppAppClusterAppPod2QuarkusApp>> as ProdAppAppClusterAppPod2QuarkusApp\r
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
ProdAppAppClusterAppPod1AdminConsole .[#8D8D8D,thickness=2].> ProdAppAppClusterAppPod1QuarkusApp : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod2AdminConsole .[#8D8D8D,thickness=2].> ProdAppAppClusterAppPod2QuarkusApp : <color:#8D8D8D>[...]\r
ProdDataObservabilityNodeOtel .[#8D8D8D,thickness=2].> ProdDataObservabilityNodeJaeger : <color:#8D8D8D>Entrega trazas\r
ProdEdgeLoadBalancerLoadBalancer .[#8D8D8D,thickness=2].> ProdAppAppClusterIngressControllerIngressController : <color:#8D8D8D>Reenvia trafico al cluster\r
ProdAppAppClusterAppPod1AdminConsole .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode1Iam : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod1AdminConsole .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode2Iam : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataPostgresHaPostgresPrimaryDb : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataPostgresHaPostgresReplicaDb : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode1Iam : <color:#8D8D8D>Valida access tokens\r
ProdAppAppClusterAppPod1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode2Iam : <color:#8D8D8D>Valida access tokens\r
ProdAppAppClusterAppPod1QuarkusApp .[#8D8D8D,thickness=2].> ProdDataObservabilityNodeOtel : <color:#8D8D8D>Exporta trazas\r
ProdServicesServicesNodeVault .[#8D8D8D,thickness=2].> ProdAppAppClusterAppPod1QuarkusApp : <color:#8D8D8D>Entrega secretos y credenciales\r
ProdServicesServicesNodeSharedStorage .[#8D8D8D,thickness=2].> ProdAppAppClusterAppPod1QuarkusApp : <color:#8D8D8D>Comparte archivos locales\r
ProdAppAppClusterAppPod2AdminConsole .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode1Iam : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod2AdminConsole .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode2Iam : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataPostgresHaPostgresPrimaryDb : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataPostgresHaPostgresReplicaDb : <color:#8D8D8D>[...]\r
ProdAppAppClusterAppPod2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode1Iam : <color:#8D8D8D>Valida access tokens\r
ProdAppAppClusterAppPod2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataKeycloakHaKeycloakNode2Iam : <color:#8D8D8D>Valida access tokens\r
ProdAppAppClusterAppPod2QuarkusApp .[#8D8D8D,thickness=2].> ProdDataObservabilityNodeOtel : <color:#8D8D8D>Exporta trazas\r
ProdServicesServicesNodeVault .[#8D8D8D,thickness=2].> ProdAppAppClusterAppPod2QuarkusApp : <color:#8D8D8D>Entrega secretos y credenciales\r
ProdServicesServicesNodeSharedStorage .[#8D8D8D,thickness=2].> ProdAppAppClusterAppPod2QuarkusApp : <color:#8D8D8D>Comparte archivos locales\r
ProdAppAppClusterIngressController .[#8D8D8D,thickness=2].> ProdAppAppClusterAppService : <color:#8D8D8D>Ruta UI y API\r
ProdAppAppClusterAppService .[#8D8D8D,thickness=2].> ProdAppAppClusterAppPod1 : <color:#8D8D8D>Balancea trafico HTTP\r
ProdAppAppClusterAppService .[#8D8D8D,thickness=2].> ProdAppAppClusterAppPod2 : <color:#8D8D8D>Balancea trafico HTTP\r
ProdEdgeLoadBalancer .[#8D8D8D,thickness=2].> ProdAppAppClusterIngressController : <color:#8D8D8D>HTTPS\r
@enduml\r
`;case"usecase_uc01_source":return`@startuml\r
title "UC-01 Configurar fuente"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppSourceDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessCatalogService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppPersistenceLayer>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
rectangle "==Process Designer" <<IntegrationHubAdminConsoleProcessDesigner>> as IntegrationHubAdminConsoleProcessDesigner\r
rectangle "==SourceDefinitionResource" <<IntegrationHubQuarkusAppSourceDefinitionResource>> as IntegrationHubQuarkusAppSourceDefinitionResource\r
rectangle "==ProcessCatalogService" <<IntegrationHubQuarkusAppProcessCatalogService>> as IntegrationHubQuarkusAppProcessCatalogService\r
rectangle "==Panache Persistence Layer" <<IntegrationHubQuarkusAppPersistenceLayer>> as IntegrationHubQuarkusAppPersistenceLayer\r
rectangle "==PostgreSQL" <<Db>> as Db\r
\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleProcessDesigner : <color:#8D8D8D>Define tipo de fuente y parametros\r
IntegrationHubAdminConsoleProcessDesigner .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppSourceDefinitionResource : <color:#8D8D8D>Registra source definition\r
IntegrationHubQuarkusAppSourceDefinitionResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessCatalogService : <color:#8D8D8D>Delega alta de catalogo\r
IntegrationHubQuarkusAppProcessCatalogService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppPersistenceLayer : <color:#8D8D8D>Persiste source definition\r
IntegrationHubQuarkusAppPersistenceLayer .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Guarda source definition\r
@enduml\r
`;case"usecase_uc02_reader":return`@startuml\r
title "UC-02 Configurar reader"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppProcessDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessCatalogService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppPersistenceLayer>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
rectangle "==Process Designer" <<IntegrationHubAdminConsoleProcessDesigner>> as IntegrationHubAdminConsoleProcessDesigner\r
rectangle "==ProcessDefinitionResource" <<IntegrationHubQuarkusAppProcessDefinitionResource>> as IntegrationHubQuarkusAppProcessDefinitionResource\r
rectangle "==ProcessCatalogService" <<IntegrationHubQuarkusAppProcessCatalogService>> as IntegrationHubQuarkusAppProcessCatalogService\r
rectangle "==Panache Persistence Layer" <<IntegrationHubQuarkusAppPersistenceLayer>> as IntegrationHubQuarkusAppPersistenceLayer\r
rectangle "==PostgreSQL" <<Db>> as Db\r
\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleProcessDesigner : <color:#8D8D8D>Define formato y layout\r
IntegrationHubAdminConsoleProcessDesigner .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessDefinitionResource : <color:#8D8D8D>Registra reader definition\r
IntegrationHubQuarkusAppProcessDefinitionResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessCatalogService : <color:#8D8D8D>Delega alta de catalogo\r
IntegrationHubQuarkusAppProcessCatalogService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppPersistenceLayer : <color:#8D8D8D>Persiste reader definition\r
IntegrationHubQuarkusAppPersistenceLayer .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Guarda reader definition\r
@enduml\r
`;case"usecase_uc03_process":return`@startuml\r
title "UC-03 Disenar proceso"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppProcessDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessCatalogService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppPersistenceLayer>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<Db>>{\r
  BackgroundColor #428a4f\r
  FontColor #f8fafc\r
  BorderColor #2d5d39\r
}\r
person "==Integration Admin" <<IntegrationAdmin>> as IntegrationAdmin\r
rectangle "==Process Designer" <<IntegrationHubAdminConsoleProcessDesigner>> as IntegrationHubAdminConsoleProcessDesigner\r
rectangle "==ProcessDefinitionResource" <<IntegrationHubQuarkusAppProcessDefinitionResource>> as IntegrationHubQuarkusAppProcessDefinitionResource\r
rectangle "==ProcessCatalogService" <<IntegrationHubQuarkusAppProcessCatalogService>> as IntegrationHubQuarkusAppProcessCatalogService\r
rectangle "==Panache Persistence Layer" <<IntegrationHubQuarkusAppPersistenceLayer>> as IntegrationHubQuarkusAppPersistenceLayer\r
rectangle "==PostgreSQL" <<Db>> as Db\r
\r
IntegrationAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleProcessDesigner : <color:#8D8D8D>Crea proceso y ordena tareas\r
IntegrationHubAdminConsoleProcessDesigner .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessDefinitionResource : <color:#8D8D8D>Guarda process definition\r
IntegrationHubQuarkusAppProcessDefinitionResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessCatalogService : <color:#8D8D8D>Valida y registra tareas\r
IntegrationHubQuarkusAppProcessCatalogService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppPersistenceLayer : <color:#8D8D8D>Persiste definicion\r
IntegrationHubQuarkusAppPersistenceLayer .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Guarda process definition y tasks\r
@enduml\r
`;case"usecase_uc04_manual_execution":return`@startuml\r
title "UC-04 Ejecutar proceso manualmente"\r
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
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineTaskProvidersDbWriteTaskProvider>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineTaskProvidersRestCallTaskProvider>>{\r
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
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineSourceRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessEngineReaderRegistry>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
person "==Operator" <<Operator>> as Operator\r
rectangle "==Operations Console" <<IntegrationHubAdminConsoleOperationsConsole>> as IntegrationHubAdminConsoleOperationsConsole\r
rectangle "==ProcessExecutionResource" <<IntegrationHubQuarkusAppProcessExecutionResource>> as IntegrationHubQuarkusAppProcessExecutionResource\r
rectangle "==ProcessExecutionService" <<IntegrationHubQuarkusAppProcessExecutionService>> as IntegrationHubQuarkusAppProcessExecutionService\r
rectangle "Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine {\r
  skinparam RectangleBorderColor<<IntegrationHubQuarkusAppProcessEngine>> #3b82f6\r
  skinparam RectangleFontColor<<IntegrationHubQuarkusAppProcessEngine>> #3b82f6\r
  skinparam RectangleBorderStyle<<IntegrationHubQuarkusAppProcessEngine>> dashed\r
\r
  rectangle "==DbWriteTaskProvider" <<IntegrationHubQuarkusAppProcessEngineTaskProvidersDbWriteTaskProvider>> as IntegrationHubQuarkusAppProcessEngineTaskProvidersDbWriteTaskProvider\r
  rectangle "==RestCallTaskProvider" <<IntegrationHubQuarkusAppProcessEngineTaskProvidersRestCallTaskProvider>> as IntegrationHubQuarkusAppProcessEngineTaskProvidersRestCallTaskProvider\r
  rectangle "==Source Provider Registry" <<IntegrationHubQuarkusAppProcessEngineSourceRegistry>> as IntegrationHubQuarkusAppProcessEngineSourceRegistry\r
  rectangle "==Reader Provider Registry" <<IntegrationHubQuarkusAppProcessEngineReaderRegistry>> as IntegrationHubQuarkusAppProcessEngineReaderRegistry\r
}\r
rectangle "==PostgreSQL" <<Db>> as Db\r
rectangle "==APIs externas" <<ExternalApi>> as ExternalApi\r
\r
Operator .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOperationsConsole : <color:#8D8D8D>Selecciona proceso activo\r
IntegrationHubAdminConsoleOperationsConsole .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionResource : <color:#8D8D8D>Solicita ejecucion\r
IntegrationHubQuarkusAppProcessExecutionResource .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionService : <color:#8D8D8D>Delega ejecucion\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineTaskProvidersDbWriteTaskProvider : <color:#8D8D8D>Persiste registros\r
IntegrationHubQuarkusAppProcessEngineTaskProvidersDbWriteTaskProvider .[#8D8D8D,thickness=2].> Db : <color:#8D8D8D>Guarda staging o destino\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngineTaskProvidersRestCallTaskProvider : <color:#8D8D8D>Invoca API externa\r
IntegrationHubQuarkusAppProcessEngineTaskProvidersRestCallTaskProvider .[#8D8D8D,thickness=2].> ExternalApi : <color:#8D8D8D>Envia payload\r
@enduml\r
`;case"usecase_uc05_scheduled_execution":return`@startuml\r
title "UC-05 Ejecutar proceso programado"\r
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
skinparam person<<SchedulerActor>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessSchedulerService>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessExecutionService>>{\r
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
skinparam rectangle<<ObservabilityJaeger>>{\r
  BackgroundColor #737373\r
  FontColor #fafafa\r
  BorderColor #525252\r
}\r
person "==Scheduler" <<SchedulerActor>> as SchedulerActor\r
rectangle "==ProcessSchedulerService" <<IntegrationHubQuarkusAppProcessSchedulerService>> as IntegrationHubQuarkusAppProcessSchedulerService\r
rectangle "==ProcessExecutionService" <<IntegrationHubQuarkusAppProcessExecutionService>> as IntegrationHubQuarkusAppProcessExecutionService\r
rectangle "==Process Engine" <<IntegrationHubQuarkusAppProcessEngine>> as IntegrationHubQuarkusAppProcessEngine\r
rectangle "==Audit Service" <<IntegrationHubQuarkusAppAuditService>> as IntegrationHubQuarkusAppAuditService\r
rectangle "==OpenTelemetry Instrumentation" <<IntegrationHubQuarkusAppTelemetry>> as IntegrationHubQuarkusAppTelemetry\r
rectangle "Observabilidad" <<Observability>> as Observability {\r
  skinparam RectangleBorderColor<<Observability>> #3b82f6\r
  skinparam RectangleFontColor<<Observability>> #3b82f6\r
  skinparam RectangleBorderStyle<<Observability>> dashed\r
\r
  rectangle "==OpenTelemetry Collector" <<ObservabilityOtel>> as ObservabilityOtel\r
  rectangle "==Jaeger" <<ObservabilityJaeger>> as ObservabilityJaeger\r
}\r
\r
SchedulerActor .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessSchedulerService : <color:#8D8D8D>Detecta proceso programado\r
IntegrationHubQuarkusAppProcessSchedulerService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessExecutionService : <color:#8D8D8D>Lanza ejecucion\r
IntegrationHubQuarkusAppProcessExecutionService .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessEngine : <color:#8D8D8D>Orquesta la ejecucion del motor\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppAuditService : <color:#8D8D8D>Registra eventos\r
IntegrationHubQuarkusAppProcessEngine .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppTelemetry : <color:#8D8D8D>Emite spans\r
IntegrationHubQuarkusAppTelemetry .[#8D8D8D,thickness=2].> ObservabilityOtel : <color:#8D8D8D>Exporta trazas\r
ObservabilityOtel .[#8D8D8D,thickness=2].> ObservabilityJaeger : <color:#8D8D8D>Publica visualizacion\r
@enduml\r
`;case"usecase_uc09_access":return`@startuml\r
title "UC-09 Administrar acceso"\r
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
skinparam person<<PlatformAdmin>>{\r
  BackgroundColor #A35829\r
  FontColor #FFE0C2\r
  BorderColor #7E451D\r
}\r
skinparam rectangle<<Iam>>{\r
  BackgroundColor #AC4D39\r
  FontColor #FBD3CB\r
  BorderColor #853A2D\r
}\r
skinparam rectangle<<IntegrationHubAdminConsoleOidcClient>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
skinparam rectangle<<IntegrationHubQuarkusAppProcessDefinitionResource>>{\r
  BackgroundColor #3b82f6\r
  FontColor #eff6ff\r
  BorderColor #2563eb\r
}\r
person "==Platform Admin" <<PlatformAdmin>> as PlatformAdmin\r
rectangle "==Keycloak" <<Iam>> as Iam\r
rectangle "==OIDC Client" <<IntegrationHubAdminConsoleOidcClient>> as IntegrationHubAdminConsoleOidcClient\r
rectangle "==ProcessDefinitionResource" <<IntegrationHubQuarkusAppProcessDefinitionResource>> as IntegrationHubQuarkusAppProcessDefinitionResource\r
\r
PlatformAdmin .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Administra clientes y roles\r
PlatformAdmin .[#8D8D8D,thickness=2].> IntegrationHubAdminConsoleOidcClient : <color:#8D8D8D>Valida acceso a consola\r
IntegrationHubAdminConsoleOidcClient .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Solicita autenticacion OIDC\r
IntegrationHubAdminConsoleOidcClient .[#8D8D8D,thickness=2].> IntegrationHubQuarkusAppProcessDefinitionResource : <color:#8D8D8D>Invoca APIs protegidas\r
IntegrationHubQuarkusAppProcessDefinitionResource .[#8D8D8D,thickness=2].> Iam : <color:#8D8D8D>Valida tokens y roles\r
@enduml\r
`;default:throw new Error("Unknown viewId: "+r)}}export{n as pumlSource};
