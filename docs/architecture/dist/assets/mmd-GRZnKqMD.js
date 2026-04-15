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
  AppService@{ shape: rectangle, label: "Integration Hub Service" }\r
  Vault@{ shape: rectangle, label: "Kubernetes Secrets / External Config" }\r
  SharedStorage@{ shape: rectangle, label: "Shared File Storage" }\r
  LoadBalancer@{ shape: rectangle, label: "Load Balancer / Reverse Proxy" }\r
  IntegrationHub@{ shape: rectangle, label: "Integration Hub Platform" }\r
  IngressController@{ shape: rectangle, label: "Ingress Controller" }\r
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
title: "Usuario y ecosistema externo"\r
---\r
graph TB\r
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
  IntegrationHub@{ shape: rectangle, label: "Integration Hub Platform" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  FileSources@{ shape: rectangle, label: "Fuentes externas" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  Observability@{ shape: rectangle, label: "Observabilidad" }\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHub\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHub\r
  IntegrationHub -. "\`[...]\`" .-> Iam\r
  IntegrationHub -. "\`[...]\`" .-> FileSources\r
  IntegrationHub -. "\`[...]\`" .-> ExternalApi\r
  IntegrationHub -. "\`Exporta trazas\`" .-> Observability\r
`;case"containers":return`---\r
title: "Zoom a la plataforma"\r
---\r
graph TB\r
  User@{ icon: "fa:user", shape: rounded, label: "Usuario de negocio" }\r
  Admin@{ icon: "fa:user", shape: rounded, label: "Administrador de integraciones" }\r
  IntegrationHubAdminConsole@{ shape: rectangle, label: "Admin Console App (Front)" }\r
  IntegrationHubQuarkusApp@{ shape: rectangle, label: "App Service Quarkus Native" }\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r
  Auditor@{ icon: "fa:user", shape: rounded, label: "Auditor" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  subgraph FileSources["\`Fuentes externas\`"]\r
    FileSources.Filesystem@{ shape: rectangle, label: "File System" }\r
    FileSources.Ftp@{ shape: rectangle, label: "FTP" }\r
    FileSources.Sftp@{ shape: rectangle, label: "SFTP" }\r
    FileSources.RestSource@{ shape: rectangle, label: "REST Source" }\r
  end\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  ObservabilityJaeger@{ shape: rectangle, label: "Jaeger" }\r
  IntegrationHubAdminConsole -. "\`Invoca APIs protegidas\`" .-> IntegrationHubQuarkusApp\r
  User -. "\`Consulta estado y resultados\`" .-> IntegrationHubAdminConsole\r
  Admin -. "\`Configura fuentes, readers y procesos\`" .-> IntegrationHubAdminConsole\r
  IntegrationHubAdminConsole -. "\`Autenticacion OIDC\`" .-> Iam\r
  IntegrationHubQuarkusApp -. "\`Valida access tokens\`" .-> Iam\r
  IntegrationHubQuarkusApp -. "\`Persiste configuracion, jobs, auditoria y staging\`" .-> Db\r
  IntegrationHubQuarkusApp -. "\`Lee archivos locales\`" .-> FileSources.Filesystem\r
  IntegrationHubQuarkusApp -. "\`Descarga archivos\`" .-> FileSources.Ftp\r
  IntegrationHubQuarkusApp -. "\`Descarga archivos\`" .-> FileSources.Sftp\r
  IntegrationHubQuarkusApp -. "\`Obtiene payloads remotos\`" .-> FileSources.RestSource\r
  IntegrationHubQuarkusApp -. "\`Invoca APIs de negocio\`" .-> ExternalApi\r
  IntegrationHubQuarkusApp -. "\`Exporta trazas\`" .-> ObservabilityOtel\r
  ObservabilityOtel -. "\`Entrega trazas\`" .-> ObservabilityJaeger\r
`;case"frontend_components":return`---\r
title: "Zoom a Admin Console App (Front)"\r
---\r
graph TB\r
  IntegrationHubAdminConsoleReactApp@{ shape: rectangle, label: "React + PatternFly UI" }\r
  IntegrationHubAdminConsoleOidcClient@{ shape: rectangle, label: "OIDC Client" }\r
  IntegrationHubAdminConsoleProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
  IntegrationHubAdminConsoleOperationsConsole@{ shape: rectangle, label: "Operations Console" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  IntegrationHubQuarkusAppProcessDefinitionResource@{ shape: rectangle, label: "ProcessDefinitionResource" }\r
  IntegrationHubQuarkusAppProcessExecutionResource@{ shape: rectangle, label: "ProcessExecutionResource" }\r
  IntegrationHubQuarkusAppProcessScheduleResource@{ shape: rectangle, label: "ProcessScheduleResource" }\r
  IntegrationHubQuarkusAppExecutionQueryResource@{ shape: rectangle, label: "ExecutionQueryResource" }\r
  IntegrationHubAdminConsoleReactApp -. "\`Gestiona sesion\`" .-> IntegrationHubAdminConsoleOidcClient\r
  IntegrationHubAdminConsoleReactApp -. "\`Configura catalogos y procesos\`" .-> IntegrationHubAdminConsoleProcessDesigner\r
  IntegrationHubAdminConsoleReactApp -. "\`Consulta y ejecuta procesos\`" .-> IntegrationHubAdminConsoleOperationsConsole\r
  IntegrationHubAdminConsoleOidcClient -. "\`Login y refresh token\`" .-> Iam\r
  IntegrationHubAdminConsoleProcessDesigner -. "\`CRUD de definiciones\`" .-> IntegrationHubQuarkusAppProcessDefinitionResource\r
  IntegrationHubAdminConsoleOperationsConsole -. "\`Ejecuta procesos\`" .-> IntegrationHubQuarkusAppProcessExecutionResource\r
  IntegrationHubAdminConsoleOperationsConsole -. "\`Consulta programaciones\`" .-> IntegrationHubQuarkusAppProcessScheduleResource\r
  IntegrationHubAdminConsoleOperationsConsole -. "\`Consulta ejecuciones y auditoria\`" .-> IntegrationHubQuarkusAppExecutionQueryResource\r
`;case"backend_components":return`---\r
title: "Zoom a App Service Quarkus Native"\r
---\r
graph TB\r
  IntegrationHubQuarkusAppProcessDefinitionResource@{ shape: rectangle, label: "ProcessDefinitionResource" }\r
  IntegrationHubQuarkusAppProcessExecutionResource@{ shape: rectangle, label: "ProcessExecutionResource" }\r
  IntegrationHubQuarkusAppProcessScheduleResource@{ shape: rectangle, label: "ProcessScheduleResource" }\r
  IntegrationHubQuarkusAppExecutionQueryResource@{ shape: rectangle, label: "ExecutionQueryResource" }\r
  IntegrationHubQuarkusAppProcessSchedulerService@{ shape: rectangle, label: "ProcessSchedulerService" }\r
  Iam@{ shape: rectangle, label: "Keycloak" }\r
  subgraph FileSources["\`Fuentes externas\`"]\r
    FileSources.Filesystem@{ shape: rectangle, label: "File System" }\r
    FileSources.Ftp@{ shape: rectangle, label: "FTP" }\r
    FileSources.Sftp@{ shape: rectangle, label: "SFTP" }\r
    FileSources.RestSource@{ shape: rectangle, label: "REST Source" }\r
  end\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  IntegrationHubQuarkusAppProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  IntegrationHubQuarkusAppProcessScheduleQueryService@{ shape: rectangle, label: "ProcessScheduleQueryService" }\r
  IntegrationHubQuarkusAppExecutionQueryService@{ shape: rectangle, label: "ExecutionQueryService" }\r
  IntegrationHubQuarkusAppProcessExecutionService@{ shape: rectangle, label: "ProcessExecutionService" }\r
  ObservabilityJaeger@{ shape: rectangle, label: "Jaeger" }\r
  IntegrationHubQuarkusAppPersistenceLayer@{ shape: rectangle, label: "Panache Persistence Layer" }\r
  IntegrationHubQuarkusAppProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  IntegrationHubQuarkusAppTelemetry@{ shape: rectangle, label: "OpenTelemetry Instrumentation" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  IntegrationHubQuarkusAppProcessDefinitionResource -. "\`Delega gestion de procesos\`" .-> IntegrationHubQuarkusAppProcessCatalogService\r
  IntegrationHubQuarkusAppProcessExecutionResource -. "\`Delega ejecucion\`" .-> IntegrationHubQuarkusAppProcessExecutionService\r
  IntegrationHubQuarkusAppProcessScheduleResource -. "\`Delega consulta de schedules\`" .-> IntegrationHubQuarkusAppProcessScheduleQueryService\r
  IntegrationHubQuarkusAppExecutionQueryResource -. "\`Delega consultas operativas\`" .-> IntegrationHubQuarkusAppExecutionQueryService\r
  IntegrationHubQuarkusAppProcessCatalogService -. "\`Persiste definiciones\`" .-> IntegrationHubQuarkusAppPersistenceLayer\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Orquesta tareas\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Registra eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppProcessSchedulerService -. "\`Dispara procesos programados\`" .-> IntegrationHubQuarkusAppProcessExecutionService\r
  IntegrationHubQuarkusAppProcessScheduleQueryService -. "\`Consulta programaciones\`" .-> IntegrationHubQuarkusAppPersistenceLayer\r
  IntegrationHubQuarkusAppExecutionQueryService -. "\`Consulta ejecuciones y auditoria\`" .-> IntegrationHubQuarkusAppPersistenceLayer\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Registra eventos\`" .-> IntegrationHubQuarkusAppAuditService\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Crea spans\`" .-> IntegrationHubQuarkusAppTelemetry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Batch insert, update y upsert\`" .-> Db\r
  IntegrationHubQuarkusAppPersistenceLayer -. "\`Opera sobre PostgreSQL\`" .-> Db\r
  IntegrationHubQuarkusAppProcessEngine -. "\`[...]\`" .-> ExternalApi\r
  ObservabilityOtel -. "\`Entrega trazas\`" .-> ObservabilityJaeger\r
`;case"execution_query_layers":return`---\r
title: "Zoom a ExecutionQueryResource"\r
---\r
graph TB\r
  IntegrationHubQuarkusAppExecutionQueryResource@{ shape: rectangle, label: "ExecutionQueryResource" }\r
  IntegrationHubQuarkusAppExecutionQueryService@{ shape: rectangle, label: "ExecutionQueryService" }\r
  IntegrationHubQuarkusAppPersistenceLayer@{ shape: rectangle, label: "Panache Persistence Layer" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  IntegrationHubQuarkusAppExecutionQueryResource -. "\`Delega consultas operativas\`" .-> IntegrationHubQuarkusAppExecutionQueryService\r
  IntegrationHubQuarkusAppExecutionQueryService -. "\`Consulta ejecuciones y auditoria\`" .-> IntegrationHubQuarkusAppPersistenceLayer\r
  IntegrationHubQuarkusAppPersistenceLayer -. "\`Opera sobre PostgreSQL\`" .-> Db\r
`;case"deployment_dev":return`---\r
title: "DEV"\r
---\r
graph TB\r
  subgraph DevApp["\`app\`"]\r
    subgraph DevApp.DockerHost["\`dockerHost\`"]\r
      DevApp.DockerHost.AdminConsole@{ shape: rectangle, label: "Admin Console App (Front)" }\r
      DevApp.DockerHost.QuarkusApp@{ shape: rectangle, label: "App Service Quarkus Native" }\r
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
      PreApp.PreNode1.AdminConsole@{ shape: rectangle, label: "Admin Console App (Front)" }\r
      PreApp.PreNode1.QuarkusApp@{ shape: rectangle, label: "App Service Quarkus Native" }\r
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
`;case"deployment_prod":return'---\r\ntitle: "PROD"\r\n---\r\ngraph TB\r\n  subgraph ProdEdge["`edge`"]\r\n    subgraph ProdEdge.LoadBalancer["`loadBalancer`"]\r\n      ProdEdge.LoadBalancer.LoadBalancer@{ shape: rectangle, label: "Load Balancer / Reverse Proxy" }\r\n    end\r\n  end\r\n  subgraph ProdServices["`services`"]\r\n    subgraph ProdServices.ServicesNode["`servicesNode`"]\r\n      ProdServices.ServicesNode.Vault@{ shape: rectangle, label: "Kubernetes Secrets / External Config" }\r\n      ProdServices.ServicesNode.SharedStorage@{ shape: rectangle, label: "Shared File Storage" }\r\n    end\r\n  end\r\n  subgraph ProdApp["`app`"]\r\n    subgraph ProdApp.AppCluster["`appCluster`"]\r\n      subgraph ProdApp.AppCluster.IngressController["`ingressController`"]\r\n        ProdApp.AppCluster.IngressController.IngressController@{ shape: rectangle, label: "Ingress Controller" }\r\n      end\r\n      ProdApp.AppCluster.AppService@{ shape: rectangle, label: "Integration Hub Service" }\r\n      subgraph ProdApp.AppCluster.AppPod1["`appPod1`"]\r\n        ProdApp.AppCluster.AppPod1.AdminConsole@{ shape: rectangle, label: "Admin Console App (Front)" }\r\n        ProdApp.AppCluster.AppPod1.QuarkusApp@{ shape: rectangle, label: "App Service Quarkus Native" }\r\n      end\r\n      subgraph ProdApp.AppCluster.AppPod2["`appPod2`"]\r\n        ProdApp.AppCluster.AppPod2.AdminConsole@{ shape: rectangle, label: "Admin Console App (Front)" }\r\n        ProdApp.AppCluster.AppPod2.QuarkusApp@{ shape: rectangle, label: "App Service Quarkus Native" }\r\n      end\r\n    end\r\n  end\r\n  subgraph ProdData["`data`"]\r\n    subgraph ProdData.PostgresHa["`postgresHa`"]\r\n      subgraph ProdData.PostgresHa.PostgresPrimary["`postgresPrimary`"]\r\n        ProdData.PostgresHa.PostgresPrimary.Db@{ shape: rectangle, label: "PostgreSQL" }\r\n      end\r\n      subgraph ProdData.PostgresHa.PostgresReplica["`postgresReplica`"]\r\n        ProdData.PostgresHa.PostgresReplica.Db@{ shape: rectangle, label: "PostgreSQL" }\r\n      end\r\n    end\r\n    subgraph ProdData.KeycloakHa["`keycloakHa`"]\r\n      subgraph ProdData.KeycloakHa.KeycloakNode1["`keycloakNode1`"]\r\n        ProdData.KeycloakHa.KeycloakNode1.Iam@{ shape: rectangle, label: "Keycloak" }\r\n      end\r\n      subgraph ProdData.KeycloakHa.KeycloakNode2["`keycloakNode2`"]\r\n        ProdData.KeycloakHa.KeycloakNode2.Iam@{ shape: rectangle, label: "Keycloak" }\r\n      end\r\n    end\r\n    subgraph ProdData.ObservabilityNode["`observabilityNode`"]\r\n      ProdData.ObservabilityNode.Otel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r\n      ProdData.ObservabilityNode.Jaeger@{ shape: rectangle, label: "Jaeger" }\r\n    end\r\n  end\r\n  ProdApp.AppCluster.AppPod1.AdminConsole -. "`[...]`" .-> ProdApp.AppCluster.AppPod1.QuarkusApp\r\n  ProdApp.AppCluster.AppPod2.AdminConsole -. "`[...]`" .-> ProdApp.AppCluster.AppPod2.QuarkusApp\r\n  ProdData.ObservabilityNode.Otel -. "`Entrega trazas`" .-> ProdData.ObservabilityNode.Jaeger\r\n  ProdEdge.LoadBalancer.LoadBalancer -. "`Reenvia trafico al cluster`" .-> ProdApp.AppCluster.IngressController.IngressController\r\n  ProdApp.AppCluster.AppPod1.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.AppPod1.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresPrimary.Db\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresReplica.Db\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.AppPod1.QuarkusApp -. "`Exporta trazas`" .-> ProdData.ObservabilityNode.Otel\r\n  ProdServices.ServicesNode.Vault -. "`Entrega secretos y credenciales`" .-> ProdApp.AppCluster.AppPod1.QuarkusApp\r\n  ProdServices.ServicesNode.SharedStorage -. "`Comparte archivos locales`" .-> ProdApp.AppCluster.AppPod1.QuarkusApp\r\n  ProdApp.AppCluster.AppPod2.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.AppPod2.AdminConsole -. "`[...]`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresPrimary.Db\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`[...]`" .-> ProdData.PostgresHa.PostgresReplica.Db\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode1.Iam\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`Valida access tokens`" .-> ProdData.KeycloakHa.KeycloakNode2.Iam\r\n  ProdApp.AppCluster.AppPod2.QuarkusApp -. "`Exporta trazas`" .-> ProdData.ObservabilityNode.Otel\r\n  ProdServices.ServicesNode.Vault -. "`Entrega secretos y credenciales`" .-> ProdApp.AppCluster.AppPod2.QuarkusApp\r\n  ProdServices.ServicesNode.SharedStorage -. "`Comparte archivos locales`" .-> ProdApp.AppCluster.AppPod2.QuarkusApp\r\n  ProdApp.AppCluster.IngressController -. "`Ruta UI y API`" .-> ProdApp.AppCluster.AppService\r\n  ProdApp.AppCluster.AppService -. "`Balancea trafico HTTP`" .-> ProdApp.AppCluster.AppPod1\r\n  ProdApp.AppCluster.AppService -. "`Balancea trafico HTTP`" .-> ProdApp.AppCluster.AppPod2\r\n  ProdEdge.LoadBalancer -. "`HTTPS`" .-> ProdApp.AppCluster.IngressController\r\n';case"usecase_uc01_source":return`---\r
title: "UC-01 Configurar fuente"\r
---\r
graph LR\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  IntegrationHubAdminConsoleProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
  IntegrationHubQuarkusAppProcessDefinitionResource@{ shape: rectangle, label: "ProcessDefinitionResource" }\r
  IntegrationHubQuarkusAppProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  IntegrationHubQuarkusAppPersistenceLayer@{ shape: rectangle, label: "Panache Persistence Layer" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  IntegrationAdmin -. "\`Define tipo de fuente y parametros\`" .-> IntegrationHubAdminConsoleProcessDesigner\r
  IntegrationHubAdminConsoleProcessDesigner -. "\`Registra source definition\`" .-> IntegrationHubQuarkusAppProcessDefinitionResource\r
  IntegrationHubQuarkusAppProcessDefinitionResource -. "\`Delega alta de catalogo\`" .-> IntegrationHubQuarkusAppProcessCatalogService\r
  IntegrationHubQuarkusAppProcessCatalogService -. "\`Persiste source definition\`" .-> IntegrationHubQuarkusAppPersistenceLayer\r
  IntegrationHubQuarkusAppPersistenceLayer -. "\`Guarda source definition\`" .-> Db\r
`;case"usecase_uc02_reader":return`---\r
title: "UC-02 Configurar reader"\r
---\r
graph LR\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  IntegrationHubAdminConsoleProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
  IntegrationHubQuarkusAppProcessDefinitionResource@{ shape: rectangle, label: "ProcessDefinitionResource" }\r
  IntegrationHubQuarkusAppProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  IntegrationHubQuarkusAppPersistenceLayer@{ shape: rectangle, label: "Panache Persistence Layer" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  IntegrationAdmin -. "\`Define formato y layout\`" .-> IntegrationHubAdminConsoleProcessDesigner\r
  IntegrationHubAdminConsoleProcessDesigner -. "\`Registra reader definition\`" .-> IntegrationHubQuarkusAppProcessDefinitionResource\r
  IntegrationHubQuarkusAppProcessDefinitionResource -. "\`Delega alta de catalogo\`" .-> IntegrationHubQuarkusAppProcessCatalogService\r
  IntegrationHubQuarkusAppProcessCatalogService -. "\`Persiste reader definition\`" .-> IntegrationHubQuarkusAppPersistenceLayer\r
  IntegrationHubQuarkusAppPersistenceLayer -. "\`Guarda reader definition\`" .-> Db\r
`;case"usecase_uc03_process":return`---\r
title: "UC-03 Disenar proceso"\r
---\r
graph LR\r
  IntegrationAdmin@{ icon: "fa:user", shape: rounded, label: "Integration Admin" }\r
  IntegrationHubAdminConsoleProcessDesigner@{ shape: rectangle, label: "Process Designer" }\r
  IntegrationHubQuarkusAppProcessDefinitionResource@{ shape: rectangle, label: "ProcessDefinitionResource" }\r
  IntegrationHubQuarkusAppProcessCatalogService@{ shape: rectangle, label: "ProcessCatalogService" }\r
  IntegrationHubQuarkusAppPersistenceLayer@{ shape: rectangle, label: "Panache Persistence Layer" }\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  IntegrationAdmin -. "\`Crea proceso y ordena tareas\`" .-> IntegrationHubAdminConsoleProcessDesigner\r
  IntegrationHubAdminConsoleProcessDesigner -. "\`Guarda process definition\`" .-> IntegrationHubQuarkusAppProcessDefinitionResource\r
  IntegrationHubQuarkusAppProcessDefinitionResource -. "\`Valida y registra tareas\`" .-> IntegrationHubQuarkusAppProcessCatalogService\r
  IntegrationHubQuarkusAppProcessCatalogService -. "\`Persiste definicion\`" .-> IntegrationHubQuarkusAppPersistenceLayer\r
  IntegrationHubQuarkusAppPersistenceLayer -. "\`Guarda process definition y tasks\`" .-> Db\r
`;case"usecase_uc04_manual_execution":return`---\r
title: "UC-04 Ejecutar proceso manualmente"\r
---\r
graph LR\r
  Operator@{ icon: "fa:user", shape: rounded, label: "Operator" }\r
  IntegrationHubAdminConsoleOperationsConsole@{ shape: rectangle, label: "Operations Console" }\r
  IntegrationHubQuarkusAppProcessExecutionResource@{ shape: rectangle, label: "ProcessExecutionResource" }\r
  IntegrationHubQuarkusAppProcessExecutionService@{ shape: rectangle, label: "ProcessExecutionService" }\r
  subgraph IntegrationHubQuarkusAppProcessEngine["\`Process Engine\`"]\r
    IntegrationHubQuarkusAppProcessEngine.SourceRegistry@{ shape: rectangle, label: "Source Provider Registry" }\r
    IntegrationHubQuarkusAppProcessEngine.ReaderRegistry@{ shape: rectangle, label: "Reader Provider Registry" }\r
    IntegrationHubQuarkusAppProcessEngine.TaskProvidersDbWriteTaskProvider@{ shape: rectangle, label: "DbWriteTaskProvider" }\r
    IntegrationHubQuarkusAppProcessEngine.TaskProvidersRestCallTaskProvider@{ shape: rectangle, label: "RestCallTaskProvider" }\r
  end\r
  Db@{ shape: rectangle, label: "PostgreSQL" }\r
  ExternalApi@{ shape: rectangle, label: "APIs externas" }\r
  Operator -. "\`Selecciona proceso activo\`" .-> IntegrationHubAdminConsoleOperationsConsole\r
  IntegrationHubAdminConsoleOperationsConsole -. "\`Solicita ejecucion\`" .-> IntegrationHubQuarkusAppProcessExecutionResource\r
  IntegrationHubQuarkusAppProcessExecutionResource -. "\`Delega ejecucion\`" .-> IntegrationHubQuarkusAppProcessExecutionService\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Orquesta el proceso\`" .-> IntegrationHubQuarkusAppProcessEngine\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Resuelve fuente\`" .-> IntegrationHubQuarkusAppProcessEngine.SourceRegistry\r
  IntegrationHubQuarkusAppProcessEngine -. "\`Lee contenido\`" .-> IntegrationHubQuarkusAppProcessEngine.ReaderRegistry\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Persiste registros\`" .-> IntegrationHubQuarkusAppProcessEngine.TaskProvidersDbWriteTaskProvider\r
  IntegrationHubQuarkusAppProcessEngine.TaskProvidersDbWriteTaskProvider -. "\`Guarda staging o destino\`" .-> Db\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Invoca API externa\`" .-> IntegrationHubQuarkusAppProcessEngine.TaskProvidersRestCallTaskProvider\r
  IntegrationHubQuarkusAppProcessEngine.TaskProvidersRestCallTaskProvider -. "\`Envia payload\`" .-> ExternalApi\r
`;case"usecase_uc05_scheduled_execution":return`---\r
title: "UC-05 Ejecutar proceso programado"\r
---\r
graph LR\r
  SchedulerActor@{ icon: "fa:user", shape: rounded, label: "Scheduler" }\r
  IntegrationHubQuarkusAppProcessSchedulerService@{ shape: rectangle, label: "ProcessSchedulerService" }\r
  IntegrationHubQuarkusAppProcessExecutionService@{ shape: rectangle, label: "ProcessExecutionService" }\r
  IntegrationHubQuarkusAppProcessEngine@{ shape: rectangle, label: "Process Engine" }\r
  IntegrationHubQuarkusAppAuditService@{ shape: rectangle, label: "Audit Service" }\r
  IntegrationHubQuarkusAppTelemetry@{ shape: rectangle, label: "OpenTelemetry Instrumentation" }\r
  ObservabilityOtel@{ shape: rectangle, label: "OpenTelemetry Collector" }\r
  ObservabilityJaeger@{ shape: rectangle, label: "Jaeger" }\r
  SchedulerActor -. "\`Detecta proceso programado\`" .-> IntegrationHubQuarkusAppProcessSchedulerService\r
  IntegrationHubQuarkusAppProcessSchedulerService -. "\`Lanza ejecucion\`" .-> IntegrationHubQuarkusAppProcessExecutionService\r
  IntegrationHubQuarkusAppProcessExecutionService -. "\`Orquesta el proceso\`" .-> IntegrationHubQuarkusAppProcessEngine\r
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
  IntegrationHubQuarkusAppProcessDefinitionResource@{ shape: rectangle, label: "ProcessDefinitionResource" }\r
  PlatformAdmin -. "\`Administra clientes y roles\`" .-> Iam\r
  PlatformAdmin -. "\`Valida acceso a consola\`" .-> IntegrationHubAdminConsoleOidcClient\r
  IntegrationHubAdminConsoleOidcClient -. "\`Solicita autenticacion OIDC\`" .-> Iam\r
  IntegrationHubAdminConsoleOidcClient -. "\`Invoca APIs protegidas\`" .-> IntegrationHubQuarkusAppProcessDefinitionResource\r
  IntegrationHubQuarkusAppProcessDefinitionResource -. "\`Valida tokens y roles\`" .-> Iam\r
`;default:throw new Error("Unknown viewId: "+e)}}export{r as mmdSource};
