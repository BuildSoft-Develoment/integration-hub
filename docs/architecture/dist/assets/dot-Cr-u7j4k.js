function n(e){switch(e){case"index":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=index,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        label="\\N",
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    user [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    loadbalancer [height=2.5,
        label=<<FONT POINT-SIZE="20">Load Balancer / Reverse Proxy</FONT>>,
        likec4_id=loadBalancer,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> loadbalancer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Accede por HTTPS</FONT></TD></TR></TABLE>>,
        likec4_id=nym6ix,
        style=dashed];
    integrationhub [height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Hub Platform</FONT>>,
        likec4_id=integrationHub,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta estado y resultados</FONT></TD></TR></TABLE>>,
        likec4_id=iqr0hm,
        style=dashed];
    admin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Administrador de integraciones</FONT>>,
        likec4_id=admin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    admin -> loadbalancer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra por HTTPS</FONT></TD></TR></TABLE>>,
        likec4_id="14x0ujb",
        style=dashed];
    admin -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura fuentes, readers y procesos</FONT></TD></TR></TABLE>>,
        likec4_id="1kzlv6s",
        style=dashed];
    platformadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Platform Admin</FONT>>,
        likec4_id=platformAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    iam [height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    platformadmin -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-09</FONT></TD></TR></TABLE>>,
        likec4_id="14wz0sf",
        minlen=1,
        style=dashed];
    integrationadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Admin</FONT>>,
        likec4_id=integrationAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationadmin -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catalogos y procesos</FONT></TD></TR></TABLE>>,
        likec4_id=qf4em2,
        minlen=1,
        style=dashed];
    operator [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Operator</FONT>>,
        likec4_id=operator,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id=h8pkej,
        minlen=1,
        style=dashed];
    auditor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Auditor</FONT>>,
        likec4_id=auditor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditor -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoria y resultados</FONT></TD></TR></TABLE>>,
        likec4_id="1szsumz",
        minlen=1,
        style=dashed];
    infrateam [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Equipo de infraestructura</FONT>>,
        likec4_id=infraTeam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    appservice [height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Hub Service</FONT>>,
        likec4_id=appService,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    infrateam -> appservice [style=invis];
    scheduleractor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Scheduler</FONT>>,
        likec4_id=schedulerActor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    scheduleractor -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-05</FONT></TD></TR></TABLE>>,
        likec4_id=cp53iv,
        minlen=1,
        style=dashed];
    vault [height=2.5,
        label=<<FONT POINT-SIZE="20">Kubernetes Secrets / External Config</FONT>>,
        likec4_id=vault,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    vault -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>,
        likec4_id=pf815d,
        minlen=1,
        style=dashed];
    sharedstorage [height=2.5,
        label=<<FONT POINT-SIZE="20">Shared File Storage</FONT>>,
        likec4_id=sharedStorage,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sharedstorage -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>,
        likec4_id=zzshdn,
        minlen=1,
        style=dashed];
    ingresscontroller [height=2.5,
        label=<<FONT POINT-SIZE="20">Ingress Controller</FONT>>,
        likec4_id=ingressController,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    loadbalancer -> ingresscontroller [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reenvia trafico al cluster</FONT></TD></TR></TABLE>>,
        likec4_id="1c6jo3",
        minlen=1,
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=l8cdri,
        minlen=1,
        style=dashed];
    externaldatabases [height=2.5,
        label=<<FONT POINT-SIZE="20">External Databases</FONT>>,
        likec4_id=externalDatabases,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> externaldatabases [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1nprra8",
        minlen=1,
        style=dashed];
    integrationhub -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1kp9nim",
        style=dashed];
    db [height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1uai625",
        minlen=1,
        style=dashed];
    filesources [height=2.5,
        label=<<FONT POINT-SIZE="20">Fuentes externas</FONT>>,
        likec4_id=fileSources,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> filesources [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=km1h37,
        minlen=1,
        style=dashed];
    observability [height=2.5,
        label=<<FONT POINT-SIZE="20">Observabilidad</FONT>>,
        likec4_id=observability,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> observability [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>,
        likec4_id="1wog11y",
        minlen=1,
        style=dashed];
}
`;case"context":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=context,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        label="\\N",
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    user [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub [height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Hub Platform</FONT>>,
        likec4_id=integrationHub,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta estado y resultados</FONT></TD></TR></TABLE>>,
        likec4_id=iqr0hm,
        minlen=1,
        style=dashed];
    admin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Administrador de integraciones</FONT>>,
        likec4_id=admin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    admin -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura fuentes, readers y procesos</FONT></TD></TR></TABLE>>,
        likec4_id="1kzlv6s",
        minlen=1,
        style=dashed];
    iam [color="#853A2D",
        fillcolor="#AC4D39",
        fontcolor="#FBD3CB",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1kp9nim",
        minlen=1,
        style=dashed];
    filesources [height=2.5,
        label=<<FONT POINT-SIZE="20">Fuentes externas</FONT>>,
        likec4_id=fileSources,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> filesources [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=km1h37,
        minlen=1,
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=l8cdri,
        minlen=1,
        style=dashed];
    observability [height=2.5,
        label=<<FONT POINT-SIZE="20">Observabilidad</FONT>>,
        likec4_id=observability,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationhub -> observability [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>,
        likec4_id="1wog11y",
        minlen=1,
        style=dashed];
}
`;case"containers":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=containers,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        label="\\N",
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    subgraph cluster_integrationhub {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>INTEGRATION HUB PLATFORM</B></FONT>>,
            likec4_depth=1,
            likec4_id=integrationHub,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        adminconsole [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">Admin Console App (Front)</FONT>>,
            likec4_id="integrationHub.adminConsole",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        quarkusapp [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">App Service Quarkus Native</FONT>>,
            likec4_id="integrationHub.quarkusApp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    subgraph cluster_filesources {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>FUENTES EXTERNAS</B></FONT>>,
            likec4_depth=1,
            likec4_id=fileSources,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        filesystem [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">File System</FONT>>,
            likec4_id="fileSources.filesystem",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        ftp [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">FTP</FONT>>,
            likec4_id="fileSources.ftp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        sftp [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">SFTP</FONT>>,
            likec4_id="fileSources.sftp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        restsource [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">REST Source</FONT>>,
            likec4_id="fileSources.restSource",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    subgraph cluster_observability {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>OBSERVABILIDAD</B></FONT>>,
            likec4_depth=1,
            likec4_id=observability,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        otel [color="#525252",
            fillcolor="#737373",
            fontcolor="#fafafa",
            height=2.5,
            label=<<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>,
            likec4_id="observability.otel",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        jaeger [color="#525252",
            fillcolor="#737373",
            fontcolor="#fafafa",
            height=2.5,
            label=<<FONT POINT-SIZE="20">Jaeger</FONT>>,
            likec4_id="observability.jaeger",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    user [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta estado y resultados</FONT></TD></TR></TABLE>>,
        likec4_id=h9yk6k,
        minlen=1,
        style=dashed];
    admin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Administrador de integraciones</FONT>>,
        likec4_id=admin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    admin -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura fuentes, readers y procesos</FONT></TD></TR></TABLE>>,
        likec4_id=r57alu,
        minlen=1,
        style=dashed];
    integrationadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Admin</FONT>>,
        likec4_id=integrationAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationadmin -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catalogos y procesos</FONT></TD></TR></TABLE>>,
        likec4_id="11r625o",
        minlen=1,
        style=dashed];
    operator [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Operator</FONT>>,
        likec4_id=operator,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id="1sx4nct",
        minlen=1,
        style=dashed];
    auditor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Auditor</FONT>>,
        likec4_id=auditor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditor -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoria y resultados</FONT></TD></TR></TABLE>>,
        likec4_id="17jgu5p",
        minlen=1,
        style=dashed];
    adminconsole -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Invoca APIs protegidas</FONT></TD></TR></TABLE>>,
        likec4_id="1a10361",
        minlen=0,
        style=dashed,
        weight=3];
    iam [color="#853A2D",
        fillcolor="#AC4D39",
        fontcolor="#FBD3CB",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    adminconsole -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Autenticacion OIDC</FONT></TD></TR></TABLE>>,
        likec4_id="1opishk",
        style=dashed];
    quarkusapp -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>,
        likec4_id="2rsnuj",
        style=dashed,
        weight=2];
    db [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste configuracion, jobs, auditoria<BR/>y staging</FONT></TD></TR></TABLE>>,
        likec4_id=u7uyew,
        minlen=1,
        style=dashed,
        weight=2];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Invoca APIs de negocio</FONT></TD></TR></TABLE>>,
        likec4_id="4o4t7f",
        minlen=1,
        style=dashed,
        weight=2];
    quarkusapp -> filesystem [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee archivos locales</FONT></TD></TR></TABLE>>,
        likec4_id=wqaa63,
        minlen=1,
        style=dashed];
    quarkusapp -> ftp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Descarga archivos</FONT></TD></TR></TABLE>>,
        likec4_id="149d2yi",
        minlen=1,
        style=dashed];
    quarkusapp -> sftp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Descarga archivos</FONT></TD></TR></TABLE>>,
        likec4_id="1e0p695",
        minlen=1,
        style=dashed];
    quarkusapp -> restsource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Obtiene payloads remotos</FONT></TD></TR></TABLE>>,
        likec4_id="1khipf9",
        minlen=1,
        style=dashed];
    quarkusapp -> otel [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>,
        likec4_id=ri53sv,
        style=dashed];
    otel -> jaeger [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega trazas</FONT></TD></TR></TABLE>>,
        likec4_id="1iigvl2",
        minlen=0,
        style=dashed,
        weight=3];
}
`;case"frontend_components":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=frontend_components,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    subgraph cluster_integrationhub {
        graph [color="#1c3979",
            fillcolor="#1a468d",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>INTEGRATION HUB PLATFORM</B></FONT>>,
            likec4_depth=2,
            likec4_id=integrationHub,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        subgraph cluster_adminconsole {
            graph [color="#1e3524",
                fillcolor="#2c4e32",
                label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>ADMIN CONSOLE APP (FRONT)</B></FONT>>,
                likec4_depth=1,
                likec4_id="integrationHub.adminConsole",
                likec4_level=1,
                margin=40,
                style=filled
            ];
            reactapp [group="integrationHub.adminConsole",
                height=2.5,
                label=<<FONT POINT-SIZE="20">React + PatternFly UI</FONT>>,
                likec4_id="integrationHub.adminConsole.reactApp",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            oidcclient [group="integrationHub.adminConsole",
                height=2.5,
                label=<<FONT POINT-SIZE="20">OIDC Client</FONT>>,
                likec4_id="integrationHub.adminConsole.oidcClient",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processdesigner [group="integrationHub.adminConsole",
                height=2.5,
                label=<<FONT POINT-SIZE="20">Process Designer</FONT>>,
                likec4_id="integrationHub.adminConsole.processDesigner",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            operationsconsole [group="integrationHub.adminConsole",
                height=2.5,
                label=<<FONT POINT-SIZE="20">Operations Console</FONT>>,
                likec4_id="integrationHub.adminConsole.operationsConsole",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
        }
        subgraph cluster_quarkusapp {
            graph [color="#1e3524",
                fillcolor="#2c4e32",
                label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>APP SERVICE QUARKUS NATIVE</B></FONT>>,
                likec4_depth=1,
                likec4_id="integrationHub.quarkusApp",
                likec4_level=1,
                margin=40,
                style=filled
            ];
            processdefinitionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessDefinitionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.processDefinitionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            sourcedefinitionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">SourceDefinitionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.sourceDefinitionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            readerdefinitionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ReaderDefinitionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.readerDefinitionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processexecutionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessExecutionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.processExecutionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processscheduleresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessScheduleResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.processScheduleResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            executionqueryresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ExecutionQueryResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.executionQueryResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
        }
    }
    user [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> reactapp [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id=h9yk6k,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta estado y resultados</FONT></TD></TR></TABLE>>];
    admin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Administrador de integraciones</FONT>>,
        likec4_id=admin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    admin -> reactapp [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id=r57alu,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura fuentes, readers y procesos</FONT></TD></TR></TABLE>>];
    integrationadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Admin</FONT>>,
        likec4_id=integrationAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationadmin -> reactapp [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="11r625o",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catalogos y procesos</FONT></TD></TR></TABLE>>];
    operator [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Operator</FONT>>,
        likec4_id=operator,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator -> reactapp [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="1sx4nct",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>];
    auditor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Auditor</FONT>>,
        likec4_id=auditor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditor -> reactapp [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="17jgu5p",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoria y resultados</FONT></TD></TR></TABLE>>];
    reactapp -> oidcclient [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Gestiona sesion</FONT></TD></TR></TABLE>>,
        likec4_id="1vivoky",
        style=dashed,
        weight=3];
    reactapp -> processdesigner [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura catalogos y procesos</FONT></TD></TR></TABLE>>,
        likec4_id=phit6s,
        style=dashed,
        weight=3];
    reactapp -> operationsconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta y ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id=c9w5tn,
        style=dashed,
        weight=3];
    iam [color="#853A2D",
        fillcolor="#AC4D39",
        fontcolor="#FBD3CB",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    oidcclient -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Login y refresh token</FONT></TD></TR></TABLE>>,
        likec4_id=ybw1bi,
        style=dashed];
    processdesigner -> processdefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de procesos</FONT></TD></TR></TABLE>>,
        likec4_id=tif83,
        minlen=1,
        style=dashed];
    processdesigner -> sourcedefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de sources</FONT></TD></TR></TABLE>>,
        likec4_id="1f78eud",
        minlen=1,
        style=dashed];
    processdesigner -> readerdefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de readers</FONT></TD></TR></TABLE>>,
        likec4_id=gxcj8d,
        minlen=1,
        style=dashed];
    operationsconsole -> processexecutionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id=japnt7,
        minlen=1,
        style=dashed];
    operationsconsole -> processscheduleresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta programaciones</FONT></TD></TR></TABLE>>,
        likec4_id=khsy9o,
        minlen=1,
        style=dashed];
    operationsconsole -> executionqueryresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones y auditoria</FONT></TD></TR></TABLE>>,
        likec4_id="500sqy",
        style=dashed];
    db [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    executionqueryresource -> db [arrowhead=normal,
        likec4_id=u7uyew,
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste configuracion, jobs, auditoria<BR/>y staging</FONT></TD></TR></TABLE>>];
    executionqueryresource -> iam [arrowhead=normal,
        likec4_id="2rsnuj",
        ltail=cluster_quarkusapp,
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>];
}
`;case"backend_components":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=backend_components,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    subgraph cluster_integrationhub {
        graph [color="#1c3979",
            fillcolor="#1a468d",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>INTEGRATION HUB PLATFORM</B></FONT>>,
            likec4_depth=2,
            likec4_id=integrationHub,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        subgraph cluster_quarkusapp {
            graph [color="#1e3524",
                fillcolor="#2c4e32",
                label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>APP SERVICE QUARKUS NATIVE</B></FONT>>,
                likec4_depth=1,
                likec4_id="integrationHub.quarkusApp",
                likec4_level=1,
                margin=40,
                style=filled
            ];
            telemetry [height=2.5,
                label=<<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>,
                likec4_id="integrationHub.quarkusApp.telemetry",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            packages [height=2.5,
                label=<<FONT POINT-SIZE="20">Package Structure</FONT>>,
                likec4_id="integrationHub.quarkusApp.packages",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processdefinitionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessDefinitionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.processDefinitionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            sourcedefinitionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">SourceDefinitionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.sourceDefinitionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            readerdefinitionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ReaderDefinitionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.readerDefinitionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processexecutionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessExecutionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.processExecutionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processscheduleresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessScheduleResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.processScheduleResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            executionqueryresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ExecutionQueryResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.executionQueryResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processschedulerservice [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessSchedulerService</FONT>>,
                likec4_id="integrationHub.quarkusApp.processSchedulerService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processcatalogservice [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>,
                likec4_id="integrationHub.quarkusApp.processCatalogService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            sourcecatalogservice [height=2.5,
                label=<<FONT POINT-SIZE="20">SourceCatalogService</FONT>>,
                likec4_id="integrationHub.quarkusApp.sourceCatalogService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            readercatalogservice [height=2.5,
                label=<<FONT POINT-SIZE="20">ReaderCatalogService</FONT>>,
                likec4_id="integrationHub.quarkusApp.readerCatalogService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processschedulequeryservice [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessScheduleQueryService</FONT>>,
                likec4_id="integrationHub.quarkusApp.processScheduleQueryService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            executionqueryservice [height=2.5,
                label=<<FONT POINT-SIZE="20">ExecutionQueryService</FONT>>,
                likec4_id="integrationHub.quarkusApp.executionQueryService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processexecutionservice [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessExecutionService</FONT>>,
                likec4_id="integrationHub.quarkusApp.processExecutionService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            repositories [height=2.5,
                label=<<FONT POINT-SIZE="20">Repositories</FONT>>,
                likec4_id="integrationHub.quarkusApp.repositories",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processengine [height=2.5,
                label=<<FONT POINT-SIZE="20">Process Engine</FONT>>,
                likec4_id="integrationHub.quarkusApp.processEngine",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            auditservice [height=2.5,
                label=<<FONT POINT-SIZE="20">Audit Service</FONT>>,
                likec4_id="integrationHub.quarkusApp.auditService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            domainentities [color="#e2a90c",
                fillcolor="#fec119",
                fontcolor="#4d2a00",
                height=2.5,
                label=<<FONT POINT-SIZE="20">Domain Entities</FONT>>,
                likec4_id="integrationHub.quarkusApp.domainEntities",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
        }
        adminconsole [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">Admin Console App (Front)</FONT>>,
            likec4_id="integrationHub.adminConsole",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    subgraph cluster_filesources {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>FUENTES EXTERNAS</B></FONT>>,
            likec4_depth=1,
            likec4_id=fileSources,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        filesystem [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">File System</FONT>>,
            likec4_id="fileSources.filesystem",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        ftp [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">FTP</FONT>>,
            likec4_id="fileSources.ftp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        sftp [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">SFTP</FONT>>,
            likec4_id="fileSources.sftp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        restsource [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">REST Source</FONT>>,
            likec4_id="fileSources.restSource",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    subgraph cluster_observability {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>OBSERVABILIDAD</B></FONT>>,
            likec4_depth=1,
            likec4_id=observability,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        otel [color="#525252",
            fillcolor="#737373",
            fontcolor="#fafafa",
            height=2.5,
            label=<<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>,
            likec4_id="observability.otel",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        jaeger [color="#525252",
            fillcolor="#737373",
            fontcolor="#fafafa",
            height=2.5,
            label=<<FONT POINT-SIZE="20">Jaeger</FONT>>,
            likec4_id="observability.jaeger",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    user [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta estado y resultados</FONT></TD></TR></TABLE>>,
        likec4_id=h9yk6k,
        minlen=1,
        style=dashed];
    admin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Administrador de integraciones</FONT>>,
        likec4_id=admin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    admin -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura fuentes, readers y procesos</FONT></TD></TR></TABLE>>,
        likec4_id=r57alu,
        minlen=1,
        style=dashed];
    integrationadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Admin</FONT>>,
        likec4_id=integrationAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationadmin -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catalogos y procesos</FONT></TD></TR></TABLE>>,
        likec4_id="11r625o",
        minlen=1,
        style=dashed];
    operator [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Operator</FONT>>,
        likec4_id=operator,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id="1sx4nct",
        minlen=1,
        style=dashed];
    auditor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Auditor</FONT>>,
        likec4_id=auditor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditor -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoria y resultados</FONT></TD></TR></TABLE>>,
        likec4_id="17jgu5p",
        minlen=1,
        style=dashed];
    telemetry -> packages [style=invis];
    adminconsole -> processdefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de procesos</FONT></TD></TR></TABLE>>,
        likec4_id=zkbqvn,
        style=dashed];
    adminconsole -> sourcedefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de sources</FONT></TD></TR></TABLE>>,
        likec4_id=knetph,
        style=dashed];
    adminconsole -> readerdefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de readers</FONT></TD></TR></TABLE>>,
        likec4_id="9jwv1",
        style=dashed];
    adminconsole -> processexecutionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id=pg2q8k,
        style=dashed];
    adminconsole -> processscheduleresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta programaciones</FONT></TD></TR></TABLE>>,
        likec4_id="1ys0h1f",
        style=dashed];
    adminconsole -> executionqueryresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones y auditoria</FONT></TD></TR></TABLE>>,
        likec4_id=j5xwk5,
        style=dashed];
    iam [color="#853A2D",
        fillcolor="#AC4D39",
        fontcolor="#FBD3CB",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    adminconsole -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Autenticacion OIDC</FONT></TD></TR></TABLE>>,
        likec4_id="1opishk",
        style=dashed];
    processdefinitionresource -> processcatalogservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega gestion de procesos</FONT></TD></TR></TABLE>>,
        likec4_id="11key3f",
        style=dashed,
        weight=2];
    sourcedefinitionresource -> sourcecatalogservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega gestion de sources</FONT></TD></TR></TABLE>>,
        likec4_id="1srq5sr",
        style=dashed,
        weight=2];
    readerdefinitionresource -> readercatalogservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega gestion de readers</FONT></TD></TR></TABLE>>,
        likec4_id="1x4svdn",
        style=dashed,
        weight=2];
    processexecutionresource -> processexecutionservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega ejecucion</FONT></TD></TR></TABLE>>,
        likec4_id="2frpj1",
        style=dashed,
        weight=2];
    processscheduleresource -> processschedulequeryservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega consulta de schedules</FONT></TD></TR></TABLE>>,
        likec4_id=bi7mk7,
        style=dashed,
        weight=2];
    executionqueryresource -> executionqueryservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega consultas operativas</FONT></TD></TR></TABLE>>,
        likec4_id=gok1ct,
        style=dashed,
        weight=2];
    processschedulerservice -> processexecutionservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Dispara procesos programados</FONT></TD></TR></TABLE>>,
        likec4_id="1h8944v",
        minlen=1,
        style=dashed];
    otel -> jaeger [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega trazas</FONT></TD></TR></TABLE>>,
        likec4_id="1iigvl2",
        minlen=0,
        style=dashed,
        weight=3];
    processcatalogservice -> repositories [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="9b937v",
        style=dashed,
        weight=3];
    sourcecatalogservice -> repositories [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste sources</FONT></TD></TR></TABLE>>,
        likec4_id=lx676l,
        style=dashed,
        weight=3];
    readercatalogservice -> repositories [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste readers</FONT></TD></TR></TABLE>>,
        likec4_id="5k1dk5",
        style=dashed,
        weight=3];
    processschedulequeryservice -> repositories [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta programaciones</FONT></TD></TR></TABLE>>,
        likec4_id="1t1g0c7",
        style=dashed,
        weight=3];
    executionqueryservice -> repositories [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1ytq8yz",
        style=dashed,
        weight=3];
    processexecutionservice -> processengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=tm2t2j,
        style=dashed,
        weight=3];
    processexecutionservice -> auditservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>,
        likec4_id="1urrk5a",
        minlen=1,
        style=dashed];
    repositories -> domainentities [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee y persiste</FONT></TD></TR></TABLE>>,
        likec4_id=x7mcqb,
        style=dashed,
        weight=3];
    db [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    repositories -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Opera sobre PostgreSQL</FONT></TD></TR></TABLE>>,
        likec4_id="1kwuhua",
        style=dashed];
    processengine -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert, update y upsert internos</FONT></TD></TR></TABLE>>,
        likec4_id="17os38z",
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1q4strk",
        minlen=1,
        style=dashed];
    domainentities -> iam [arrowhead=normal,
        likec4_id="2rsnuj",
        ltail=cluster_quarkusapp,
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>];
    domainentities -> filesystem [arrowhead=normal,
        likec4_id=wqaa63,
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee archivos locales</FONT></TD></TR></TABLE>>];
    domainentities -> ftp [arrowhead=normal,
        likec4_id="149d2yi",
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Descarga archivos</FONT></TD></TR></TABLE>>];
    domainentities -> sftp [arrowhead=normal,
        likec4_id="1e0p695",
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Descarga archivos</FONT></TD></TR></TABLE>>];
    domainentities -> restsource [arrowhead=normal,
        likec4_id="1khipf9",
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Obtiene payloads remotos</FONT></TD></TR></TABLE>>];
    domainentities -> otel [arrowhead=normal,
        likec4_id=ri53sv,
        ltail=cluster_quarkusapp,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>];
}
`;case"process_engine_code":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        clusterrank=global,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=process_engine_code,
        newrank=true,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    subgraph cluster_integrationhub {
        graph [color="#1c356c",
            fillcolor="#1c417d",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>INTEGRATION HUB PLATFORM</B></FONT>>,
            likec4_depth=3,
            likec4_id=integrationHub,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        subgraph cluster_adminconsole {
            graph [color="#1e3524",
                fillcolor="#2c4e32",
                label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>ADMIN CONSOLE APP (FRONT)</B></FONT>>,
                likec4_depth=1,
                likec4_id="integrationHub.adminConsole",
                likec4_level=1,
                margin=40,
                style=filled
            ];
            processdesigner [height=2.5,
                label=<<FONT POINT-SIZE="20">Process Designer</FONT>>,
                likec4_id="integrationHub.adminConsole.processDesigner",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            operationsconsole [height=2.5,
                label=<<FONT POINT-SIZE="20">Operations Console</FONT>>,
                likec4_id="integrationHub.adminConsole.operationsConsole",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
        }
        subgraph cluster_quarkusapp {
            graph [color="#1c3021",
                fillcolor="#29472f",
                label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>APP SERVICE QUARKUS NATIVE</B></FONT>>,
                likec4_depth=2,
                likec4_id="integrationHub.quarkusApp",
                likec4_level=1,
                margin=40,
                style=filled
            ];
            subgraph cluster_repositories {
                graph [color="#1b3d88",
                    fillcolor="#194b9e",
                    label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>REPOSITORIES</B></FONT>>,
                    likec4_depth=1,
                    likec4_id="integrationHub.quarkusApp.repositories",
                    likec4_level=2,
                    margin=40,
                    style=filled
                ];
                {
                    graph [rank=same];
                    processdefinitionrepository [height=2.5,
                        label=<<FONT POINT-SIZE="20">ProcessDefinitionRepository</FONT>>,
                        likec4_id="integrationHub.quarkusApp.repositories.processDefinitionRepository",
                        likec4_level=3,
                        margin="0.223,0.223",
                        width=4.445];
                    sourcedefinitionrepository [height=2.5,
                        label=<<FONT POINT-SIZE="20">SourceDefinitionRepository</FONT>>,
                        likec4_id="integrationHub.quarkusApp.repositories.sourceDefinitionRepository",
                        likec4_level=3,
                        margin="0.223,0.223",
                        width=4.445];
                    readerdefinitionrepository [height=2.5,
                        label=<<FONT POINT-SIZE="20">ReaderDefinitionRepository</FONT>>,
                        likec4_id="integrationHub.quarkusApp.repositories.readerDefinitionRepository",
                        likec4_level=3,
                        margin="0.223,0.223",
                        width=4.445];
                }
                {
                    graph [rank=same];
                    processtaskdefinitionrepository [height=2.5,
                        label=<<FONT POINT-SIZE="20">ProcessTaskDefinitionRepository</FONT>>,
                        likec4_id="integrationHub.quarkusApp.repositories.processTaskDefinitionRepository",
                        likec4_level=3,
                        margin="0.223,0.223",
                        width=4.445];
                    processexecutionrepository [height=2.5,
                        label=<<FONT POINT-SIZE="20">ProcessExecutionRepository</FONT>>,
                        likec4_id="integrationHub.quarkusApp.repositories.processExecutionRepository",
                        likec4_level=3,
                        margin="0.223,0.223",
                        width=4.445];
                    processtaskexecutionrepository [height=2.5,
                        label=<<FONT POINT-SIZE="20">ProcessTaskExecutionRepository</FONT>>,
                        likec4_id="integrationHub.quarkusApp.repositories.processTaskExecutionRepository",
                        likec4_level=3,
                        margin="0.223,0.223",
                        width=4.445];
                }
                processdefinitionrepository -> processtaskdefinitionrepository [minlen=1,
                    style=invis];
                auditeventrepository [height=2.5,
                    label=<<FONT POINT-SIZE="20">AuditEventRepository</FONT>>,
                    likec4_id="integrationHub.quarkusApp.repositories.auditEventRepository",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                processtaskdefinitionrepository -> auditeventrepository [style=invis];
            }
            subgraph cluster_processengine {
                graph [color="#1b3d88",
                    fillcolor="#194b9e",
                    label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>PROCESS ENGINE</B></FONT>>,
                    likec4_depth=1,
                    likec4_id="integrationHub.quarkusApp.processEngine",
                    likec4_level=2,
                    margin=40,
                    style=filled
                ];
                jsonconfigurationmapper [height=2.5,
                    label=<<FONT POINT-SIZE="20">JsonConfigurationMapper</FONT>>,
                    likec4_id="integrationHub.quarkusApp.processEngine.jsonConfigurationMapper",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                sourceregistry [group="integrationHub.quarkusApp.processEngine",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">Source Provider Registry</FONT>>,
                    likec4_id="integrationHub.quarkusApp.processEngine.sourceRegistry",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                readerregistry [group="integrationHub.quarkusApp.processEngine",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">Reader Provider Registry</FONT>>,
                    likec4_id="integrationHub.quarkusApp.processEngine.readerRegistry",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                taskregistry [group="integrationHub.quarkusApp.processEngine",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">Task Provider Registry</FONT>>,
                    likec4_id="integrationHub.quarkusApp.processEngine.taskRegistry",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                sourceproviders [group="integrationHub.quarkusApp.processEngine",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">Source Providers</FONT>>,
                    likec4_id="integrationHub.quarkusApp.processEngine.sourceProviders",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                readerproviders [group="integrationHub.quarkusApp.processEngine",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">Reader Providers</FONT>>,
                    likec4_id="integrationHub.quarkusApp.processEngine.readerProviders",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                taskproviders [group="integrationHub.quarkusApp.processEngine",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">Task Providers</FONT>>,
                    likec4_id="integrationHub.quarkusApp.processEngine.taskProviders",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
            }
            telemetry [height=2.5,
                label=<<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>,
                likec4_id="integrationHub.quarkusApp.telemetry",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processexecutionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessExecutionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.processExecutionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            processexecutionservice [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessExecutionService</FONT>>,
                likec4_id="integrationHub.quarkusApp.processExecutionService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            auditservice [height=2.5,
                label=<<FONT POINT-SIZE="20">Audit Service</FONT>>,
                likec4_id="integrationHub.quarkusApp.auditService",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
        }
    }
    subgraph cluster_filesources {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>FUENTES EXTERNAS</B></FONT>>,
            likec4_depth=1,
            likec4_id=fileSources,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        filesystem [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">File System</FONT>>,
            likec4_id="fileSources.filesystem",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        ftp [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">FTP</FONT>>,
            likec4_id="fileSources.ftp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        sftp [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">SFTP</FONT>>,
            likec4_id="fileSources.sftp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        restsource [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">REST Source</FONT>>,
            likec4_id="fileSources.restSource",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    subgraph cluster_observability {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>OBSERVABILIDAD</B></FONT>>,
            likec4_depth=1,
            likec4_id=observability,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        otel [color="#525252",
            fillcolor="#737373",
            fontcolor="#fafafa",
            height=2.5,
            label=<<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>,
            likec4_id="observability.otel",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        jaeger [color="#525252",
            fillcolor="#737373",
            fontcolor="#fafafa",
            height=2.5,
            label=<<FONT POINT-SIZE="20">Jaeger</FONT>>,
            likec4_id="observability.jaeger",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    telemetry -> sourcedefinitionrepository [style=invis];
    sourcedefinitionrepository -> readerdefinitionrepository [style=invis];
    readerdefinitionrepository -> processexecutionrepository [style=invis];
    db [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditeventrepository -> db [arrowhead=normal,
        likec4_id="1kwuhua",
        ltail=cluster_repositories,
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Opera sobre PostgreSQL</FONT></TD></TR></TABLE>>];
    user [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> processdesigner [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id=h9yk6k,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta estado y resultados</FONT></TD></TR></TABLE>>];
    admin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Administrador de integraciones</FONT>>,
        likec4_id=admin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    admin -> processdesigner [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id=r57alu,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura fuentes, readers y procesos</FONT></TD></TR></TABLE>>];
    integrationadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Admin</FONT>>,
        likec4_id=integrationAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationadmin -> processdesigner [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="11r625o",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catalogos y procesos</FONT></TD></TR></TABLE>>];
    operator [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Operator</FONT>>,
        likec4_id=operator,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator -> processdesigner [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="1sx4nct",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>];
    auditor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Auditor</FONT>>,
        likec4_id=auditor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditor -> processdesigner [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="17jgu5p",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoria y resultados</FONT></TD></TR></TABLE>>];
    operationsconsole -> processexecutionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id=japnt7,
        minlen=1,
        style=dashed];
    processexecutionresource -> processexecutionservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega ejecucion</FONT></TD></TR></TABLE>>,
        likec4_id="2frpj1",
        style=dashed,
        weight=3];
    otel -> jaeger [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega trazas</FONT></TD></TR></TABLE>>,
        likec4_id="1iigvl2",
        minlen=0,
        style=dashed,
        weight=3];
    processexecutionservice -> auditservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>,
        likec4_id="1urrk5a",
        style=dashed,
        weight=2];
    processexecutionservice -> jsonconfigurationmapper [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee configuracion JSON</FONT></TD></TR></TABLE>>,
        likec4_id=lm6ie,
        minlen=1,
        style=dashed];
    processexecutionservice -> sourceregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve SourceProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1czsm99",
        style=dashed];
    processexecutionservice -> readerregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve ReaderProvider</FONT></TD></TR></TABLE>>,
        likec4_id=w70p3p,
        style=dashed];
    processexecutionservice -> taskregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve TaskProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1o8r5ml",
        style=dashed];
    processexecutionservice -> taskproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=dhgjbu,
        style=dashed,
        weight=3];
    auditservice -> filesystem [arrowhead=normal,
        likec4_id=wqaa63,
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee archivos locales</FONT></TD></TR></TABLE>>];
    auditservice -> ftp [arrowhead=normal,
        likec4_id="149d2yi",
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Descarga archivos</FONT></TD></TR></TABLE>>];
    auditservice -> sftp [arrowhead=normal,
        likec4_id="1e0p695",
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Descarga archivos</FONT></TD></TR></TABLE>>];
    auditservice -> restsource [arrowhead=normal,
        likec4_id="1khipf9",
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Obtiene payloads remotos</FONT></TD></TR></TABLE>>];
    auditservice -> otel [arrowhead=normal,
        likec4_id=ri53sv,
        ltail=cluster_quarkusapp,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>];
    sourceregistry -> sourceproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id="1lkgood",
        minlen=1,
        style=dashed,
        weight=2];
    readerregistry -> readerproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id="1yewvcd",
        minlen=1,
        style=dashed,
        weight=2];
    taskregistry -> taskproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id=d3eigd,
        style=dashed,
        weight=4];
    taskproviders -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert, update y upsert internos</FONT></TD></TR></TABLE>>,
        likec4_id=tv9dcy,
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    taskproviders -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=ito3ep,
        minlen=1,
        style=dashed];
}
`;case"package_structure_code":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=package_structure_code,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    subgraph cluster_quarkusapp {
        graph [color="#1a2b1e",
            fillcolor="#26402b",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>APP SERVICE QUARKUS NATIVE</B></FONT>>,
            likec4_depth=3,
            likec4_id="integrationHub.quarkusApp",
            likec4_level=0,
            margin=32,
            style=filled
        ];
        subgraph cluster_packages {
            graph [color="#1c3979",
                fillcolor="#1a468d",
                label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>PACKAGE STRUCTURE</B></FONT>>,
                likec4_depth=2,
                likec4_id="integrationHub.quarkusApp.packages",
                likec4_level=1,
                margin=40,
                style=filled
            ];
            subgraph cluster_providerpackage {
                graph [color="#1b3d88",
                    fillcolor="#194b9e",
                    label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>PROVIDER</B></FONT>>,
                    likec4_depth=1,
                    likec4_id="integrationHub.quarkusApp.packages.providerPackage",
                    likec4_level=2,
                    margin=40,
                    style=filled
                ];
                providersourcepackage [height=2.5,
                    label=<<FONT POINT-SIZE="20">provider.source</FONT>>,
                    likec4_id="integrationHub.quarkusApp.packages.providerPackage.providerSourcePackage",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                providerreaderpackage [height=2.5,
                    label=<<FONT POINT-SIZE="20">provider.reader</FONT>>,
                    likec4_id="integrationHub.quarkusApp.packages.providerPackage.providerReaderPackage",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                providertaskpackage [height=2.5,
                    label=<<FONT POINT-SIZE="20">provider.task</FONT>>,
                    likec4_id="integrationHub.quarkusApp.packages.providerPackage.providerTaskPackage",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
            }
            apipackage [height=2.5,
                label=<<FONT POINT-SIZE="20">api</FONT>>,
                likec4_id="integrationHub.quarkusApp.packages.apiPackage",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            apiquerypackage [height=2.5,
                label=<<FONT POINT-SIZE="20">api.query</FONT>>,
                likec4_id="integrationHub.quarkusApp.packages.apiQueryPackage",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            servicepackage [height=2.5,
                label=<<FONT POINT-SIZE="20">service</FONT>>,
                likec4_id="integrationHub.quarkusApp.packages.servicePackage",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            repositorypackage [height=2.5,
                label=<<FONT POINT-SIZE="20">repository</FONT>>,
                likec4_id="integrationHub.quarkusApp.packages.repositoryPackage",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            spipackage [height=2.5,
                label=<<FONT POINT-SIZE="20">spi</FONT>>,
                likec4_id="integrationHub.quarkusApp.packages.spiPackage",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            domainpackage [height=2.5,
                label=<<FONT POINT-SIZE="20">domain</FONT>>,
                likec4_id="integrationHub.quarkusApp.packages.domainPackage",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            entitypackage [height=2.5,
                label=<<FONT POINT-SIZE="20">entity</FONT>>,
                likec4_id="integrationHub.quarkusApp.packages.entityPackage",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
        }
    }
    providersourcepackage -> spipackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Implementa SourceProvider</FONT></TD></TR></TABLE>>,
        likec4_id=lpev1l,
        minlen=1,
        style=dashed];
    providerreaderpackage -> spipackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Implementa ReaderProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1wu2i6p",
        minlen=1,
        style=dashed];
    providertaskpackage -> repositorypackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Colabora con persistencia</FONT></TD></TR></TABLE>>,
        likec4_id="15315sh",
        style=dashed];
    providertaskpackage -> spipackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Implementa TaskProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1rzikhl",
        style=dashed];
    providertaskpackage -> domainpackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa estados y tipos</FONT></TD></TR></TABLE>>,
        likec4_id="1dgq84z",
        style=dashed];
    apipackage -> apiquerypackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Expone DTOs y respuestas</FONT></TD></TR></TABLE>>,
        likec4_id="10nmlpc",
        style=dashed];
    apipackage -> servicepackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Invoca servicios</FONT></TD></TR></TABLE>>,
        likec4_id=s0i0bz,
        style=dashed];
    apiquerypackage -> servicepackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consume consultas</FONT></TD></TR></TABLE>>,
        likec4_id="7mh78l",
        style=dashed];
    servicepackage -> repositorypackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Accede a persistencia</FONT></TD></TR></TABLE>>,
        likec4_id="88qqfp",
        style=dashed,
        weight=2];
    servicepackage -> spipackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Orquesta contratos</FONT></TD></TR></TABLE>>,
        likec4_id="110me4d",
        style=dashed,
        weight=2];
    servicepackage -> domainpackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa enums y tipos</FONT></TD></TR></TABLE>>,
        likec4_id="9fmhrr",
        style=dashed,
        weight=2];
    repositorypackage -> entitypackage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste entidades</FONT></TD></TR></TABLE>>,
        likec4_id=kjx3kj,
        minlen=1,
        style=dashed,
        weight=2];
}
`;case"domain_entities_code":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=domain_entities_code,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    subgraph cluster_quarkusapp {
        graph [color="#1a2b1e",
            fillcolor="#26402b",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>APP SERVICE QUARKUS NATIVE</B></FONT>>,
            likec4_depth=3,
            likec4_id="integrationHub.quarkusApp",
            likec4_level=0,
            margin=32,
            style=filled
        ];
        subgraph cluster_domainentities {
            graph [color="#6e5615",
                fillcolor="#866714",
                label=<<FONT POINT-SIZE="11" COLOR="#5f3a00b3"><B>DOMAIN ENTITIES</B></FONT>>,
                likec4_depth=2,
                likec4_id="integrationHub.quarkusApp.domainEntities",
                likec4_level=1,
                margin=40,
                style=filled
            ];
            subgraph cluster_catalogentities {
                graph [color="#1b3d88",
                    fillcolor="#194b9e",
                    label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>CATALOG</B></FONT>>,
                    likec4_depth=1,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    likec4_level=2,
                    margin=40,
                    style=filled
                ];
                sourcedefinitionentity [color="#e2a90c",
                    fillcolor="#fec119",
                    fontcolor="#4d2a00",
                    group="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">SourceDefinition</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities.sourceDefinitionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                readerdefinitionentity [color="#e2a90c",
                    fillcolor="#fec119",
                    fontcolor="#4d2a00",
                    group="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ReaderDefinition</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities.readerDefinitionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                processdefinitionentity [color="#e2a90c",
                    fillcolor="#fec119",
                    fontcolor="#4d2a00",
                    group="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ProcessDefinition</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities.processDefinitionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                processtaskdefinitionentity [color="#e2a90c",
                    fillcolor="#fec119",
                    fontcolor="#4d2a00",
                    group="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ProcessTaskDefinition</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities.processTaskDefinitionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
            }
            subgraph cluster_executionentities {
                graph [color="#1b3d88",
                    fillcolor="#194b9e",
                    label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>EXECUTION</B></FONT>>,
                    likec4_depth=1,
                    likec4_id="integrationHub.quarkusApp.domainEntities.executionEntities",
                    likec4_level=2,
                    margin=40,
                    style=filled
                ];
                processexecutionentity [color="#e2a90c",
                    fillcolor="#fec119",
                    fontcolor="#4d2a00",
                    group="integrationHub.quarkusApp.domainEntities.executionEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ProcessExecution</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.executionEntities.processExecutionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                processtaskexecutionentity [color="#e2a90c",
                    fillcolor="#fec119",
                    fontcolor="#4d2a00",
                    group="integrationHub.quarkusApp.domainEntities.executionEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ProcessTaskExecution</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.executionEntities.processTaskExecutionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                auditevententity [color="#e2a90c",
                    fillcolor="#fec119",
                    fontcolor="#4d2a00",
                    group="integrationHub.quarkusApp.domainEntities.executionEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">AuditEvent</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.executionEntities.auditEventEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
            }
        }
    }
    sourcedefinitionentity -> processtaskdefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..n taskDefinitions</FONT></TD></TR></TABLE>>,
        likec4_id="1w1mvld",
        minlen=1,
        style=dashed,
        weight=3];
    readerdefinitionentity -> processtaskdefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..n taskDefinitions</FONT></TD></TR></TABLE>>,
        likec4_id=q0dvnt,
        minlen=1,
        style=dashed,
        weight=3];
    processdefinitionentity -> processtaskdefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..n taskDefinitions</FONT></TD></TR></TABLE>>,
        likec4_id=kioqpz,
        style=dashed,
        weight=3];
    processdefinitionentity -> processexecutionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..n processExecutions</FONT></TD></TR></TABLE>>,
        likec4_id="22o4ss",
        style=dashed];
    db [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processtaskdefinitionentity -> processtaskexecutionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..n taskExecutions</FONT></TD></TR></TABLE>>,
        likec4_id="11i7mwc",
        style=dashed];
    processtaskdefinitionentity -> auditevententity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..n auditEvents</FONT></TD></TR></TABLE>>,
        likec4_id="14acg0p",
        style=dashed];
    processexecutionentity -> processtaskexecutionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..n taskExecutions</FONT></TD></TR></TABLE>>,
        likec4_id="1wka5wn",
        style=dashed,
        weight=3];
    processexecutionentity -> auditevententity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..n auditEvents</FONT></TD></TR></TABLE>>,
        likec4_id="1erm5ea",
        style=dashed,
        weight=3];
    auditevententity -> db [arrowhead=normal,
        likec4_id=u7uyew,
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste configuracion, jobs, auditoria<BR/>y staging</FONT></TD></TR></TABLE>>];
}
`;case"security_overview":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=security_overview,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2
    ];
    subgraph cluster_quarkusapp {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>APP SERVICE QUARKUS NATIVE</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.quarkusApp",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        processdefinitionresource [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessDefinitionResource</FONT>>,
            likec4_id="integrationHub.quarkusApp.processDefinitionResource",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        processexecutionresource [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessExecutionResource</FONT>>,
            likec4_id="integrationHub.quarkusApp.processExecutionResource",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    subgraph cluster_adminconsole {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>ADMIN CONSOLE APP (FRONT)</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.adminConsole",
            likec4_level=0,
            margin=32,
            style=filled
        ];
        oidcclient [height=2.5,
            label=<<FONT POINT-SIZE="20">OIDC Client</FONT>>,
            likec4_id="integrationHub.adminConsole.oidcClient",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    platformadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Platform Admin</FONT>>,
        likec4_id=platformAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    iam [color="#853A2D",
        fillcolor="#AC4D39",
        fontcolor="#FBD3CB",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    platformadmin -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-09</FONT></TD></TR></TABLE>>,
        likec4_id="14wz0sf",
        minlen=0,
        style=dashed,
        weight=3];
    user [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> oidcclient [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id=h9yk6k,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta estado y resultados</FONT></TD></TR></TABLE>>];
    admin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Administrador de integraciones</FONT>>,
        likec4_id=admin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    admin -> oidcclient [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id=r57alu,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura fuentes, readers y procesos</FONT></TD></TR></TABLE>>];
    integrationadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Admin</FONT>>,
        likec4_id=integrationAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationadmin -> oidcclient [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="11r625o",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catalogos y procesos</FONT></TD></TR></TABLE>>];
    operator [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Operator</FONT>>,
        likec4_id=operator,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator -> oidcclient [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="1sx4nct",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>];
    auditor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Auditor</FONT>>,
        likec4_id=auditor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditor -> oidcclient [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="17jgu5p",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoria y resultados</FONT></TD></TR></TABLE>>];
    oidcclient -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Login y refresh token</FONT></TD></TR></TABLE>>,
        likec4_id=ybw1bi,
        style=dashed];
    processexecutionresource -> iam [arrowhead=normal,
        likec4_id="2rsnuj",
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>];
}
`;case"deployment_dev":return`digraph {
  likec4_viewId = "deployment_dev";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "TB";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.806;
  ranksep = 1.806;
  pad = 0.209;
  fontname = "Arial";
  newrank = true;
  clusterrank = "global";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "adminconsole" [
    likec4_id = "dev.app.dockerHost.adminConsole";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Admin Console App (Front)</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "quarkusapp" [
    likec4_id = "dev.app.dockerHost.quarkusApp";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">App Service Quarkus Native</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "iam" [
    likec4_id = "dev.data.data.iam";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Keycloak</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "db" [
    likec4_id = "dev.data.data.db";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">PostgreSQL</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "otel" [
    likec4_id = "dev.data.data.otel";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "jaeger" [
    likec4_id = "dev.data.data.jaeger";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Jaeger</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  subgraph "cluster_app" {
    likec4_id = "dev.app";
    likec4_level = 0;
    likec4_depth = 2;
    fillcolor = "#3f3f3f";
    color = "#2d2d2d";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>APP</B></FONT>>;
    subgraph "cluster_dockerhost" {
      likec4_id = "dev.app.dockerHost";
      likec4_level = 1;
      likec4_depth = 1;
      fillcolor = "#2c4e32";
      color = "#1e3524";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>DOCKERHOST</B></FONT>>;
      "adminconsole";
      "quarkusapp";
    }
  }
  subgraph "cluster_data" {
    likec4_id = "dev.data";
    likec4_level = 0;
    likec4_depth = 2;
    fillcolor = "#3f3f3f";
    color = "#2d2d2d";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>DATA</B></FONT>>;
    subgraph "cluster_data_1" {
      likec4_id = "dev.data.data";
      likec4_level = 1;
      likec4_depth = 1;
      fillcolor = "#2c4e32";
      color = "#1e3524";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>DATA</B></FONT>>;
      "iam";
      "db";
      "otel";
      "jaeger";
    }
  }
  "adminconsole" -> "quarkusapp" [
    likec4_id = "tbn4in";
    style = "dashed";
    weight = 5;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "otel" -> "jaeger" [
    likec4_id = "19v1v8w";
    style = "dashed";
    weight = 5;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole" -> "iam" [
    likec4_id = "99ohlg";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "db" [
    likec4_id = "18kl21g";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "iam" [
    likec4_id = "1e920yf";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "otel" [
    likec4_id = "ol7olc";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
}`;case"deployment_pre":return`digraph {
  likec4_viewId = "deployment_pre";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "TB";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.806;
  ranksep = 1.806;
  pad = 0.209;
  fontname = "Arial";
  newrank = true;
  clusterrank = "global";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "vault" [
    likec4_id = "pre.services.configNode.vault";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Kubernetes Secrets / External Config</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "sharedstorage" [
    likec4_id = "pre.services.configNode.sharedStorage";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Shared File Storage</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "adminconsole" [
    likec4_id = "pre.app.preNode1.adminConsole";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Admin Console App (Front)</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "quarkusapp" [
    likec4_id = "pre.app.preNode1.quarkusApp";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">App Service Quarkus Native</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "iam" [
    likec4_id = "pre.data.data.iam";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Keycloak</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "db" [
    likec4_id = "pre.data.data.db";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">PostgreSQL</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "otel" [
    likec4_id = "pre.data.data.otel";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "jaeger" [
    likec4_id = "pre.data.data.jaeger";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Jaeger</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  subgraph "cluster_services" {
    likec4_id = "pre.services";
    likec4_level = 0;
    likec4_depth = 2;
    fillcolor = "#3f3f3f";
    color = "#2d2d2d";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>SERVICES</B></FONT>>;
    subgraph "cluster_confignode" {
      likec4_id = "pre.services.configNode";
      likec4_level = 1;
      likec4_depth = 1;
      fillcolor = "#2c4e32";
      color = "#1e3524";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>CONFIGNODE</B></FONT>>;
      "vault";
      "sharedstorage";
    }
  }
  subgraph "cluster_app" {
    likec4_id = "pre.app";
    likec4_level = 0;
    likec4_depth = 2;
    fillcolor = "#3f3f3f";
    color = "#2d2d2d";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>APP</B></FONT>>;
    subgraph "cluster_prenode1" {
      likec4_id = "pre.app.preNode1";
      likec4_level = 1;
      likec4_depth = 1;
      fillcolor = "#2c4e32";
      color = "#1e3524";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>PRENODE1</B></FONT>>;
      "adminconsole";
      "quarkusapp";
    }
  }
  subgraph "cluster_data" {
    likec4_id = "pre.data";
    likec4_level = 0;
    likec4_depth = 2;
    fillcolor = "#3f3f3f";
    color = "#2d2d2d";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>DATA</B></FONT>>;
    subgraph "cluster_data_1" {
      likec4_id = "pre.data.data";
      likec4_level = 1;
      likec4_depth = 1;
      fillcolor = "#2c4e32";
      color = "#1e3524";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>DATA</B></FONT>>;
      "iam";
      "db";
      "otel";
      "jaeger";
    }
  }
  "adminconsole" -> "quarkusapp" [
    likec4_id = "acqten";
    style = "dashed";
    weight = 5;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "otel" -> "jaeger" [
    likec4_id = "17gg0ts";
    style = "dashed";
    weight = 5;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole" -> "iam" [
    likec4_id = "1e241xy";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "db" [
    likec4_id = "1k57cye";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "iam" [
    likec4_id = "5ytiol";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "otel" [
    likec4_id = "1iv14zm";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "vault" -> "quarkusapp" [
    likec4_id = "1cl81ji";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "sharedstorage" -> "quarkusapp" [
    likec4_id = "6gg1pg";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
}`;case"deployment_prod":return`digraph {
  likec4_viewId = "deployment_prod";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "TB";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.806;
  ranksep = 1.806;
  pad = 0.209;
  fontname = "Arial";
  newrank = true;
  clusterrank = "global";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "loadbalancer" [
    likec4_id = "prod.edge.loadBalancer.loadBalancer";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Load Balancer / Reverse Proxy</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "vault" [
    likec4_id = "prod.services.servicesNode.vault";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Kubernetes Secrets / External Config</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "sharedstorage" [
    likec4_id = "prod.services.servicesNode.sharedStorage";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Shared File Storage</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "appservice" [
    likec4_id = "prod.app.appCluster.appService";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Integration Hub Service</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "ingresscontroller" [
    likec4_id = "prod.app.appCluster.ingressController.ingressController";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Ingress Controller</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "adminconsole" [
    likec4_id = "prod.app.appCluster.appPod1.adminConsole";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Admin Console App (Front)</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "adminconsole_1" [
    likec4_id = "prod.app.appCluster.appPod2.adminConsole";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Admin Console App (Front)</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "quarkusapp" [
    likec4_id = "prod.app.appCluster.appPod1.quarkusApp";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">App Service Quarkus Native</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "quarkusapp_1" [
    likec4_id = "prod.app.appCluster.appPod2.quarkusApp";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">App Service Quarkus Native</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "db" [
    likec4_id = "prod.data.postgresHa.postgresPrimary.db";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">PostgreSQL</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "db_1" [
    likec4_id = "prod.data.postgresHa.postgresReplica.db";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">PostgreSQL</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "iam" [
    likec4_id = "prod.data.keycloakHa.keycloakNode1.iam";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Keycloak</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "iam_1" [
    likec4_id = "prod.data.keycloakHa.keycloakNode2.iam";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Keycloak</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "otel" [
    likec4_id = "prod.data.observabilityNode.otel";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "jaeger" [
    likec4_id = "prod.data.observabilityNode.jaeger";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Jaeger</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  subgraph "cluster_edge" {
    likec4_id = "prod.edge";
    likec4_level = 0;
    likec4_depth = 2;
    fillcolor = "#3f3f3f";
    color = "#2d2d2d";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>EDGE</B></FONT>>;
    subgraph "cluster_loadbalancer" {
      likec4_id = "prod.edge.loadBalancer";
      likec4_level = 1;
      likec4_depth = 1;
      fillcolor = "#2c4e32";
      color = "#1e3524";
      style = "filled";
      margin = 32;
      label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>LOADBALANCER</B></FONT>>;
      "loadbalancer";
    }
  }
  subgraph "cluster_services" {
    likec4_id = "prod.services";
    likec4_level = 0;
    likec4_depth = 2;
    fillcolor = "#3f3f3f";
    color = "#2d2d2d";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>SERVICES</B></FONT>>;
    subgraph "cluster_servicesnode" {
      likec4_id = "prod.services.servicesNode";
      likec4_level = 1;
      likec4_depth = 1;
      fillcolor = "#2c4e32";
      color = "#1e3524";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>SERVICESNODE</B></FONT>>;
      "vault";
      "sharedstorage";
    }
  }
  subgraph "cluster_app" {
    likec4_id = "prod.app";
    likec4_level = 0;
    likec4_depth = 3;
    fillcolor = "#393939";
    color = "#292929";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>APP</B></FONT>>;
    subgraph "cluster_appcluster" {
      likec4_id = "prod.app.appCluster";
      likec4_level = 1;
      likec4_depth = 2;
      fillcolor = "#1a468d";
      color = "#1c3979";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>APPCLUSTER</B></FONT>>;
      "appservice";
      subgraph "cluster_ingresscontroller" {
        likec4_id = "prod.app.appCluster.ingressController";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 32;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>INGRESSCONTROLLER</B></FONT>>;
        "ingresscontroller";
      }
      subgraph "cluster_apppod1" {
        likec4_id = "prod.app.appCluster.appPod1";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 50;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>APPPOD1</B></FONT>>;
        "adminconsole";
        "quarkusapp";
      }
      subgraph "cluster_apppod2" {
        likec4_id = "prod.app.appCluster.appPod2";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 50;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>APPPOD2</B></FONT>>;
        "adminconsole_1";
        "quarkusapp_1";
      }
    }
  }
  subgraph "cluster_data" {
    likec4_id = "prod.data";
    likec4_level = 0;
    likec4_depth = 3;
    fillcolor = "#393939";
    color = "#292929";
    style = "filled";
    margin = 50;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>DATA</B></FONT>>;
    subgraph "cluster_postgresha" {
      likec4_id = "prod.data.postgresHa";
      likec4_level = 1;
      likec4_depth = 2;
      fillcolor = "#1a468d";
      color = "#1c3979";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>POSTGRESHA</B></FONT>>;
      subgraph "cluster_postgresprimary" {
        likec4_id = "prod.data.postgresHa.postgresPrimary";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 32;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>POSTGRESPRIMARY</B></FONT>>;
        "db";
      }
      subgraph "cluster_postgresreplica" {
        likec4_id = "prod.data.postgresHa.postgresReplica";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 32;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>POSTGRESREPLICA</B></FONT>>;
        "db_1";
      }
    }
    subgraph "cluster_keycloakha" {
      likec4_id = "prod.data.keycloakHa";
      likec4_level = 1;
      likec4_depth = 2;
      fillcolor = "#1a468d";
      color = "#1c3979";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>KEYCLOAKHA</B></FONT>>;
      subgraph "cluster_keycloaknode1" {
        likec4_id = "prod.data.keycloakHa.keycloakNode1";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 32;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>KEYCLOAKNODE1</B></FONT>>;
        "iam";
      }
      subgraph "cluster_keycloaknode2" {
        likec4_id = "prod.data.keycloakHa.keycloakNode2";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 32;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>KEYCLOAKNODE2</B></FONT>>;
        "iam_1";
      }
    }
    subgraph "cluster_observabilitynode" {
      likec4_id = "prod.data.observabilityNode";
      likec4_level = 1;
      likec4_depth = 1;
      fillcolor = "#2c4e32";
      color = "#1e3524";
      style = "filled";
      margin = 50;
      label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>OBSERVABILITYNODE</B></FONT>>;
      "otel";
      "jaeger";
    }
  }
  subgraph {
    rank = "same";
    "adminconsole";
    "adminconsole_1";
  }
  subgraph {
    rank = "same";
    "quarkusapp";
    "quarkusapp_1";
  }
  subgraph {
    rank = "same";
    "db";
    "db_1";
  }
  subgraph {
    rank = "same";
    "iam";
    "iam_1";
  }
  "adminconsole" -> "quarkusapp" [
    likec4_id = "1d8ik4f";
    style = "dashed";
    weight = 7;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole_1" -> "quarkusapp_1" [
    likec4_id = "1hc9urj";
    style = "dashed";
    weight = 7;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "otel" -> "jaeger" [
    likec4_id = "1itrp1s";
    style = "dashed";
    weight = 6;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "loadbalancer" -> "ingresscontroller" [
    likec4_id = "san2uz";
    style = "dashed";
    weight = 6;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reenvia trafico al cluster</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole" -> "iam" [
    likec4_id = "j70z60";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole" -> "iam_1" [
    likec4_id = "j3mll7";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "db" [
    likec4_id = "12qgylx";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "db_1" [
    likec4_id = "8pb5p5";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "iam" [
    likec4_id = "austez";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "iam_1" [
    likec4_id = "avglns";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "otel" [
    likec4_id = "q4s2af";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "vault" -> "quarkusapp" [
    likec4_id = "1e1zupe";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "sharedstorage" -> "quarkusapp" [
    likec4_id = "mf34wo";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole_1" -> "iam" [
    likec4_id = "149fdfv";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole_1" -> "iam_1" [
    likec4_id = "14ctr0o";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "db" [
    likec4_id = "ju3mae";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "db_1" [
    likec4_id = "1mov0oq";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "iam" [
    likec4_id = "1w0dcrs";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "iam_1" [
    likec4_id = "1vzpdt7";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "otel" [
    likec4_id = "3s06ac";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "vault" -> "quarkusapp_1" [
    likec4_id = "8vqd3l";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "sharedstorage" -> "quarkusapp_1" [
    likec4_id = "9b3n3v";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "ingresscontroller" -> "appservice" [
    likec4_id = "1urgqob";
    style = "dashed";
    ltail = "cluster_ingresscontroller";
    weight = 4;
    xlabel = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ruta UI y API</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "appservice" -> "adminconsole" [
    likec4_id = "18pzovf";
    style = "dashed";
    lhead = "cluster_apppod1";
    xlabel = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Balancea trafico HTTP</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "appservice" -> "adminconsole_1" [
    likec4_id = "18pzovc";
    style = "dashed";
    lhead = "cluster_apppod2";
    xlabel = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Balancea trafico HTTP</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "loadbalancer" -> "ingresscontroller" [
    likec4_id = "1vdwtwi";
    style = "dashed";
    lhead = "cluster_ingresscontroller";
    ltail = "cluster_loadbalancer";
    xlabel = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">HTTPS</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
}`;case"usecase_uc01_source":return`digraph {
  likec4_viewId = "usecase_uc01_source";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "LR";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.528;
  ranksep = 1.667;
  pad = 0.209;
  fontname = "Arial";
  ordering = "in";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "integrationadmin" [
    likec4_id = "integrationAdmin";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Integration Admin</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#A35829";
    fontcolor = "#FFE0C2";
    color = "#7E451D";
  ];
  "processdesigner" [
    likec4_id = "integrationHub.adminConsole.processDesigner";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Process Designer</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "sourcedefinitionresource" [
    likec4_id = "integrationHub.quarkusApp.sourceDefinitionResource";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">SourceDefinitionResource</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "sourcecatalogservice" [
    likec4_id = "integrationHub.quarkusApp.sourceCatalogService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">SourceCatalogService</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "sourcedefinitionrepository" [
    likec4_id = "integrationHub.quarkusApp.repositories.sourceDefinitionRepository";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">SourceDefinitionRepository</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "db" [
    likec4_id = "db";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">PostgreSQL</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "integrationadmin" -> "processdesigner" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Define tipo de fuente y parametros</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processdesigner" -> "sourcedefinitionresource" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra source definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "sourcedefinitionresource" -> "sourcecatalogservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Delega alta de catalogo</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "sourcecatalogservice" -> "sourcedefinitionrepository" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste source definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "sourcedefinitionrepository" -> "db" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda source definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
}`;case"usecase_uc02_reader":return`digraph {
  likec4_viewId = "usecase_uc02_reader";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "LR";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.528;
  ranksep = 1.667;
  pad = 0.209;
  fontname = "Arial";
  ordering = "in";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "integrationadmin" [
    likec4_id = "integrationAdmin";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Integration Admin</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#A35829";
    fontcolor = "#FFE0C2";
    color = "#7E451D";
  ];
  "processdesigner" [
    likec4_id = "integrationHub.adminConsole.processDesigner";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Process Designer</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "readerdefinitionresource" [
    likec4_id = "integrationHub.quarkusApp.readerDefinitionResource";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ReaderDefinitionResource</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "readercatalogservice" [
    likec4_id = "integrationHub.quarkusApp.readerCatalogService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ReaderCatalogService</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "readerdefinitionrepository" [
    likec4_id = "integrationHub.quarkusApp.repositories.readerDefinitionRepository";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ReaderDefinitionRepository</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "db" [
    likec4_id = "db";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">PostgreSQL</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "integrationadmin" -> "processdesigner" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Define formato y layout</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processdesigner" -> "readerdefinitionresource" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra reader definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "readerdefinitionresource" -> "readercatalogservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Delega alta de catalogo</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "readercatalogservice" -> "readerdefinitionrepository" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste reader definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "readerdefinitionrepository" -> "db" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda reader definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
}`;case"usecase_uc03_process":return`digraph {
  likec4_viewId = "usecase_uc03_process";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "LR";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.528;
  ranksep = 1.667;
  pad = 0.209;
  fontname = "Arial";
  ordering = "in";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "integrationadmin" [
    likec4_id = "integrationAdmin";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Integration Admin</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#A35829";
    fontcolor = "#FFE0C2";
    color = "#7E451D";
  ];
  "processdesigner" [
    likec4_id = "integrationHub.adminConsole.processDesigner";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Process Designer</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "db" [
    likec4_id = "db";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">PostgreSQL</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "processdefinitionresource" [
    likec4_id = "integrationHub.quarkusApp.processDefinitionResource";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessDefinitionResource</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processcatalogservice" [
    likec4_id = "integrationHub.quarkusApp.processCatalogService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processdefinitionrepository" [
    likec4_id = "integrationHub.quarkusApp.repositories.processDefinitionRepository";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessDefinitionRepository</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processtaskdefinitionrepository" [
    likec4_id = "integrationHub.quarkusApp.repositories.processTaskDefinitionRepository";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessTaskDefinitionRepository</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "readerdefinitionresource" [
    likec4_id = "integrationHub.quarkusApp.readerDefinitionResource";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ReaderDefinitionResource</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "readercatalogservice" [
    likec4_id = "integrationHub.quarkusApp.readerCatalogService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ReaderCatalogService</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "readerdefinitionrepository" [
    likec4_id = "integrationHub.quarkusApp.repositories.readerDefinitionRepository";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ReaderDefinitionRepository</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "integrationadmin" -> "processdesigner" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Crea proceso y ordena tareas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processdesigner" -> "processdefinitionresource" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda process definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processdefinitionresource" -> "processcatalogservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Valida y registra tareas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processcatalogservice" -> "processdefinitionrepository" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste definicion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processcatalogservice" -> "processtaskdefinitionrepository" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste tasks</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "db" -> "processdefinitionrepository" [
    likec4_id = "step-06";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda process definition</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
  "db" -> "processtaskdefinitionrepository" [
    likec4_id = "step-07";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>7</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda process tasks</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
}`;case"usecase_uc04_manual_execution":return`digraph {
  likec4_viewId = "usecase_uc04_manual_execution";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "LR";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.528;
  ranksep = 1.667;
  pad = 0.209;
  fontname = "Arial";
  ordering = "in";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "operator" [
    likec4_id = "operator";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Operator</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#A35829";
    fontcolor = "#FFE0C2";
    color = "#7E451D";
  ];
  "operationsconsole" [
    likec4_id = "integrationHub.adminConsole.operationsConsole";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Operations Console</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processexecutionresource" [
    likec4_id = "integrationHub.quarkusApp.processExecutionResource";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessExecutionResource</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processexecutionservice" [
    likec4_id = "integrationHub.quarkusApp.processExecutionService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessExecutionService</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "dbwritetaskprovider" [
    likec4_id = "integrationHub.quarkusApp.processEngine.taskProviders.dbWriteTaskProvider";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">DbWriteTaskProvider</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "restcalltaskprovider" [
    likec4_id = "integrationHub.quarkusApp.processEngine.taskProviders.restCallTaskProvider";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">RestCallTaskProvider</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "db" [
    likec4_id = "db";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">PostgreSQL</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "externalapi" [
    likec4_id = "externalApi";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">APIs externas</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "sourceregistry" [
    likec4_id = "integrationHub.quarkusApp.processEngine.sourceRegistry";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Source Provider Registry</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "readerregistry" [
    likec4_id = "integrationHub.quarkusApp.processEngine.readerRegistry";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Reader Provider Registry</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  subgraph "cluster_processengine" {
    likec4_id = "integrationHub.quarkusApp.processEngine";
    likec4_level = 0;
    likec4_depth = 1;
    fillcolor = "#194b9e";
    color = "#1b3d88";
    style = "filled";
    margin = 40;
    label = <<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>PROCESS ENGINE</B></FONT>>;
    "sourceregistry";
    "readerregistry";
    "dbwritetaskprovider";
    "restcalltaskprovider";
  }
  "operator" -> "operationsconsole" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Selecciona proceso activo</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "operationsconsole" -> "processexecutionresource" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Solicita ejecucion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processexecutionresource" -> "processexecutionservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Delega ejecucion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processexecutionservice" -> "dbwritetaskprovider" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste registros</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "dbwritetaskprovider" -> "db" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda staging o destino</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processexecutionservice" -> "restcalltaskprovider" [
    likec4_id = "step-06";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Invoca API externa</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "restcalltaskprovider" -> "externalapi" [
    likec4_id = "step-07";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>7</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Envia payload</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
}`;case"usecase_uc05_scheduled_execution":return`digraph {
  likec4_viewId = "usecase_uc05_scheduled_execution";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "LR";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.528;
  ranksep = 1.667;
  pad = 0.209;
  fontname = "Arial";
  ordering = "in";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "scheduleractor" [
    likec4_id = "schedulerActor";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Scheduler</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#A35829";
    fontcolor = "#FFE0C2";
    color = "#7E451D";
  ];
  "processschedulerservice" [
    likec4_id = "integrationHub.quarkusApp.processSchedulerService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessSchedulerService</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processexecutionservice" [
    likec4_id = "integrationHub.quarkusApp.processExecutionService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessExecutionService</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processengine" [
    likec4_id = "integrationHub.quarkusApp.processEngine";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Process Engine</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "auditservice" [
    likec4_id = "integrationHub.quarkusApp.auditService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Audit Service</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "telemetry" [
    likec4_id = "integrationHub.quarkusApp.telemetry";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "otel" [
    likec4_id = "observability.otel";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#737373";
    fontcolor = "#fafafa";
    color = "#525252";
  ];
  "jaeger" [
    likec4_id = "observability.jaeger";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Jaeger</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#737373";
    fontcolor = "#fafafa";
    color = "#525252";
  ];
  subgraph "cluster_observability" {
    likec4_id = "observability";
    likec4_level = 0;
    likec4_depth = 1;
    fillcolor = "#194b9e";
    color = "#1b3d88";
    style = "filled";
    margin = 40;
    label = <<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>OBSERVABILIDAD</B></FONT>>;
    "otel";
    "jaeger";
  }
  "scheduleractor" -> "processschedulerservice" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Detecta proceso programado</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processschedulerservice" -> "processexecutionservice" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Lanza ejecucion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processexecutionservice" -> "processengine" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Orquesta la ejecucion del motor</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "auditservice" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "telemetry" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Emite spans</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "telemetry" -> "otel" [
    likec4_id = "step-06";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "otel" -> "jaeger" [
    likec4_id = "step-07";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>7</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Publica visualizacion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
}`;case"usecase_uc09_access":return`digraph {
  likec4_viewId = "usecase_uc09_access";
  bgcolor = "transparent";
  layout = "dot";
  compound = true;
  rankdir = "LR";
  splines = "spline";
  outputorder = "nodesfirst";
  nodesep = 1.528;
  ranksep = 1.667;
  pad = 0.209;
  fontname = "Arial";
  ordering = "in";
  graph [
    fontsize = 20;
    labeljust = "l";
    labelloc = "t";
  ];
  edge [
    arrowsize = 0.75;
    fontname = "Arial";
    fontsize = 14;
    penwidth = 2;
    color = "#8D8D8D";
    fontcolor = "#C9C9C9";
  ];
  node [
    fontname = "Arial";
    shape = "rect";
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
    style = "filled";
    penwidth = 0;
  ];
  "platformadmin" [
    likec4_id = "platformAdmin";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Platform Admin</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#A35829";
    fontcolor = "#FFE0C2";
    color = "#7E451D";
  ];
  "iam" [
    likec4_id = "iam";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Keycloak</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#AC4D39";
    fontcolor = "#FBD3CB";
    color = "#853A2D";
  ];
  "oidcclient" [
    likec4_id = "integrationHub.adminConsole.oidcClient";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">OIDC Client</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processdefinitionresource" [
    likec4_id = "integrationHub.quarkusApp.processDefinitionResource";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessDefinitionResource</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "platformadmin" -> "iam" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Administra clientes y roles</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "platformadmin" -> "oidcclient" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Valida acceso a consola</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "iam" -> "oidcclient" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Solicita autenticacion OIDC</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
  "oidcclient" -> "processdefinitionresource" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Invoca APIs protegidas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "iam" -> "processdefinitionresource" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Valida tokens y roles</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
}`;default:throw new Error("Unknown viewId: "+e)}}function t(e){switch(e){case"index":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="4267pt" height="856pt"
 viewBox="0.00 0.00 4267.00 856.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 840.65)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="753.04,-825.6 433,-825.6 433,-645.6 753.04,-645.6 753.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="506.85" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- loadbalancer -->
<g id="node2" class="node">
<title>loadbalancer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="445.04,-502.8 125,-502.8 125,-322.8 445.04,-322.8 445.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="146.62" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Load Balancer / Reverse Proxy</text>
</g>
<!-- integrationhub -->
<g id="node3" class="node">
<title>integrationhub</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2087.04,-502.8 1767,-502.8 1767,-322.8 2087.04,-322.8 2087.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1818.63" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Platform</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-825.6 0,-825.6 0,-645.6 320.04,-645.6 320.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="22.17" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- platformadmin -->
<g id="node5" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3807.04,-825.6 3487,-825.6 3487,-645.6 3807.04,-645.6 3807.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3578.67" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- iam -->
<g id="node6" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3606.04,-180 3286,-180 3286,0 3606.04,0 3606.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="3405.44" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- integrationadmin -->
<g id="node7" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2517.04,-825.6 2197,-825.6 2197,-645.6 2517.04,-645.6 2517.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2278.64" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node8" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2947.04,-825.6 2627,-825.6 2627,-645.6 2947.04,-645.6 2947.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2747.56" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node9" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3377.04,-825.6 3057,-825.6 3057,-645.6 3377.04,-645.6 3377.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3185.34" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- infrateam -->
<g id="node10" class="node">
<title>infrateam</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4237.04,-825.6 3917,-825.6 3917,-645.6 4237.04,-645.6 4237.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3965.29" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Equipo de infraestructura</text>
</g>
<!-- appservice -->
<g id="node11" class="node">
<title>appservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4237.04,-502.8 3917,-502.8 3917,-322.8 4237.04,-322.8 4237.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="3972.52" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Service</text>
</g>
<!-- scheduleractor -->
<g id="node12" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1185.04,-825.6 865,-825.6 865,-645.6 1185.04,-645.6 1185.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="979.99" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- vault -->
<g id="node13" class="node">
<title>vault</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1656.61,-825.6 1295.43,-825.6 1295.43,-645.6 1656.61,-645.6 1656.61,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1311.49" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Kubernetes Secrets / External Config</text>
</g>
<!-- sharedstorage -->
<g id="node14" class="node">
<title>sharedstorage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2087.04,-825.6 1767,-825.6 1767,-645.6 2087.04,-645.6 2087.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1838.08" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared File Storage</text>
</g>
<!-- ingresscontroller -->
<g id="node15" class="node">
<title>ingresscontroller</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="445.04,-180 125,-180 125,0 445.04,0 445.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="206.1" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Ingress Controller</text>
</g>
<!-- externalapi -->
<g id="node16" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1657.04,-180 1337,-180 1337,0 1657.04,0 1657.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1434.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- externaldatabases -->
<g id="node17" class="node">
<title>externaldatabases</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2087.04,-180 1767,-180 1767,0 2087.04,0 2087.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1839.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">External Databases</text>
</g>
<!-- db -->
<g id="node18" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2517.04,-180 2197,-180 2197,0 2517.04,0 2517.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2302.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node19" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2947.04,-180 2627,-180 2627,0 2947.04,0 2947.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2709.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node20" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1227.04,-180 907,-180 907,0 1227.04,0 1227.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1000.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- user&#45;&gt;loadbalancer -->
<g id="edge1" class="edge">
<title>user&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M459.44,-645.66C436.13,-627.22 413.09,-606.87 393.42,-585.6 372.88,-563.38 353.93,-536.76 337.81,-511.18"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="340.24,-510.11 334.05,-505.12 335.78,-512.88 340.24,-510.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="393.42,-562.8 393.42,-585.6 520.02,-585.6 520.02,-562.8 393.42,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="396.42" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Accede por HTTPS</text>
</g>
<!-- user&#45;&gt;integrationhub -->
<g id="edge2" class="edge">
<title>user&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M753.02,-665.28C772.06,-658.14 791.35,-651.39 810.02,-645.6 1138.69,-543.69 1535.73,-473.34 1756.96,-438.65"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1757.36,-441.25 1764.37,-437.49 1756.55,-436.06 1757.36,-441.25"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1112.15,-562.8 1112.15,-585.6 1298.7,-585.6 1298.7,-562.8 1112.15,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1115.15" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge13" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M285.02,-322.87C285.02,-281.67 285.02,-232.56 285.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="287.65,-190.36 285.02,-182.86 282.4,-190.36 287.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="285.02,-240 285.02,-262.8 444.31,-262.8 444.31,-240 285.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="288.02" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvia trafico al cluster</text>
</g>
<!-- integrationhub&#45;&gt;iam -->
<g id="edge16" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2086.71,-378.08C2375.17,-317.15 2980.56,-189.3 3276.24,-126.86"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3276.43,-129.5 3283.23,-125.38 3275.35,-124.36 3276.43,-129.5"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2732.07,-240 2732.07,-262.8 2759.06,-262.8 2759.06,-240 2732.07,-240"/>
<text xml:space="preserve" text-anchor="start" x="2735.07" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge14" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1807.81,-322.87C1750.72,-280.27 1682.3,-229.23 1624.21,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1626.09,-184.02 1618.51,-181.64 1622.95,-188.23 1626.09,-184.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1724.91,-240 1724.91,-262.8 1751.91,-262.8 1751.91,-240 1724.91,-240"/>
<text xml:space="preserve" text-anchor="start" x="1727.91" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externaldatabases -->
<g id="edge15" class="edge">
<title>integrationhub&#45;&gt;externaldatabases</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1927.02,-322.87C1927.02,-281.67 1927.02,-232.56 1927.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1929.65,-190.36 1927.02,-182.86 1924.4,-190.36 1929.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1927.02,-240 1927.02,-262.8 1954.01,-262.8 1954.01,-240 1927.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="1930.02" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge17" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2046.23,-322.87C2103.32,-280.27 2171.74,-229.23 2229.83,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2231.09,-188.23 2235.53,-181.64 2227.95,-184.02 2231.09,-188.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2154.91,-240 2154.91,-262.8 2181.91,-262.8 2181.91,-240 2154.91,-240"/>
<text xml:space="preserve" text-anchor="start" x="2157.91" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge18" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2086.84,-356.74C2217.84,-311.03 2407.75,-243.48 2572.02,-180 2586.84,-174.27 2602.19,-168.2 2617.54,-162.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2618.32,-164.55 2624.29,-159.31 2616.35,-159.68 2618.32,-164.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2395.83,-240 2395.83,-262.8 2422.82,-262.8 2422.82,-240 2395.83,-240"/>
<text xml:space="preserve" text-anchor="start" x="2398.83" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge19" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1767.2,-356.74C1636.2,-311.03 1446.29,-243.48 1282.02,-180 1267.2,-174.27 1251.85,-168.2 1236.5,-162.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1237.69,-159.68 1229.75,-159.31 1235.72,-164.55 1237.69,-159.68"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1493.81,-240 1493.81,-262.8 1590.07,-262.8 1590.07,-240 1493.81,-240"/>
<text xml:space="preserve" text-anchor="start" x="1496.81" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- admin&#45;&gt;loadbalancer -->
<g id="edge3" class="edge">
<title>admin&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M127.11,-645.84C121.77,-618.45 121.06,-588.69 131.99,-562.8 139.92,-544.01 151.5,-526.42 164.81,-510.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="166.6,-512.32 169.5,-504.92 162.62,-508.89 166.6,-512.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="131.99,-562.8 131.99,-585.6 278.02,-585.6 278.02,-562.8 131.99,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="134.99" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra por HTTPS</text>
</g>
<!-- admin&#45;&gt;integrationhub -->
<g id="edge4" class="edge">
<title>admin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.83,-665.45C339.24,-658.22 358.95,-651.4 378.02,-645.6 865.08,-497.49 1468.19,-442.04 1757.12,-422.93"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1756.94,-425.58 1764.25,-422.47 1756.59,-420.34 1756.94,-425.58"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="667.48,-562.8 667.48,-585.6 910.83,-585.6 910.83,-562.8 667.48,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="670.48" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3619.28,-645.79C3581.95,-526.26 3515.76,-314.31 3476.89,-189.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3479.44,-189.2 3474.7,-182.82 3474.43,-190.77 3479.44,-189.2"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3573.04,-401.4 3573.04,-424.2 3619.49,-424.2 3619.49,-401.4 3573.04,-401.4"/>
<text xml:space="preserve" text-anchor="start" x="3576.04" y="-408.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
</g>
<!-- integrationadmin&#45;&gt;integrationhub -->
<g id="edge6" class="edge">
<title>integrationadmin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2237.81,-645.67C2180.72,-603.07 2112.3,-552.03 2054.21,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2056.09,-506.82 2048.51,-504.44 2052.95,-511.03 2056.09,-506.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2154.91,-562.8 2154.91,-585.6 2362.45,-585.6 2362.45,-562.8 2154.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2157.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;integrationhub -->
<g id="edge7" class="edge">
<title>operator&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2627.23,-661.48C2555.11,-629.56 2468.44,-592.67 2389.02,-562.8 2293.32,-526.81 2184.55,-491.46 2096.61,-464.24"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2097.64,-461.81 2089.7,-462.1 2096.09,-466.82 2097.64,-461.81"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2443.98,-562.8 2443.98,-585.6 2557.38,-585.6 2557.38,-562.8 2443.98,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2446.98" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;integrationhub -->
<g id="edge8" class="edge">
<title>auditor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3057.05,-664.69C3038.66,-657.76 3020.05,-651.22 3002.02,-645.6 2688.5,-547.78 2310.94,-476.76 2096.96,-440.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2097.71,-438.15 2089.88,-439.5 2096.84,-443.33 2097.71,-438.15"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2770.24,-562.8 2770.24,-585.6 2968.46,-585.6 2968.46,-562.8 2770.24,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2773.24" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
<!-- infrateam&#45;&gt;appservice -->
<!-- scheduleractor&#45;&gt;integrationhub -->
<g id="edge10" class="edge">
<title>scheduleractor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1184.81,-667.07C1203.35,-659.64 1222.05,-652.34 1240.02,-645.6 1414.67,-580.07 1617.33,-512.73 1757.05,-467.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1757.79,-470.16 1764.12,-465.36 1756.18,-465.16 1757.79,-470.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1465.21,-562.8 1465.21,-585.6 1511.67,-585.6 1511.67,-562.8 1465.21,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1468.21" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;05</text>
</g>
<!-- vault&#45;&gt;integrationhub -->
<g id="edge11" class="edge">
<title>vault&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1584.92,-645.78C1619.53,-618.46 1658.3,-588.76 1694.81,-562.8 1720.35,-544.64 1748,-526.03 1775.01,-508.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1776.37,-510.64 1781.22,-504.35 1773.5,-506.24 1776.37,-510.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1694.81,-562.8 1694.81,-585.6 1900.02,-585.6 1900.02,-562.8 1694.81,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1697.81" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- sharedstorage&#45;&gt;integrationhub -->
<g id="edge12" class="edge">
<title>sharedstorage&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1927.02,-645.67C1927.02,-604.47 1927.02,-555.36 1927.02,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1929.65,-513.16 1927.02,-505.66 1924.4,-513.16 1929.65,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1927.02,-562.8 1927.02,-585.6 2097.98,-585.6 2097.98,-562.8 1927.02,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1930.02" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
</g>
</svg>
`;case"context":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1640pt" height="856pt"
 viewBox="0.00 0.00 1640.00 856.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 840.65)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="750.04,-825.6 430,-825.6 430,-645.6 750.04,-645.6 750.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="503.85" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- integrationhub -->
<g id="node2" class="node">
<title>integrationhub</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="965.04,-502.8 645,-502.8 645,-322.8 965.04,-322.8 965.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="696.63" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Platform</text>
</g>
<!-- admin -->
<g id="node3" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1180.04,-825.6 860,-825.6 860,-645.6 1180.04,-645.6 1180.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="882.17" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- iam -->
<g id="node4" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="119.44" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- filesources -->
<g id="node5" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-180 430,-180 430,0 750.04,0 750.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="512.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- externalapi -->
<g id="node6" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-180 860,-180 860,0 1180.04,0 1180.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="957.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- observability -->
<g id="node7" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-180 1290,-180 1290,0 1610.04,0 1610.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1383.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- user&#45;&gt;integrationhub -->
<g id="edge1" class="edge">
<title>user&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M643.2,-645.95C659.84,-618.98 678.55,-589.44 696.47,-562.8 707.91,-545.8 720.41,-527.98 732.74,-510.82"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="734.74,-512.53 737,-504.91 730.48,-509.46 734.74,-512.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="696.47,-562.8 696.47,-585.6 883.02,-585.6 883.02,-562.8 696.47,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="699.47" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- integrationhub&#45;&gt;iam -->
<g id="edge3" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M645.17,-332.3C549.12,-284.53 427,-223.79 329.32,-175.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.53,-172.88 322.65,-171.89 328.2,-177.58 330.53,-172.88"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="501.86,-240 501.86,-262.8 528.85,-262.8 528.85,-240 501.86,-240"/>
<text xml:space="preserve" text-anchor="start" x="504.86" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge4" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M745.42,-322.87C717.45,-281.14 684.06,-231.31 655.4,-188.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="657.59,-187.11 651.24,-182.34 653.23,-190.04 657.59,-187.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="703.97,-240 703.97,-262.8 730.96,-262.8 730.96,-240 703.97,-240"/>
<text xml:space="preserve" text-anchor="start" x="706.97" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge5" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M864.62,-322.87C892.59,-281.14 925.98,-231.31 954.64,-188.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="956.81,-190.04 958.8,-182.34 952.45,-187.11 956.81,-190.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="918.97,-240 918.97,-262.8 945.96,-262.8 945.96,-240 918.97,-240"/>
<text xml:space="preserve" text-anchor="start" x="921.97" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge6" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M964.87,-332.3C1060.92,-284.53 1183.04,-223.79 1280.72,-175.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1281.84,-177.58 1287.39,-171.89 1279.51,-172.88 1281.84,-177.58"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1146.86,-240 1146.86,-262.8 1243.12,-262.8 1243.12,-240 1146.86,-240"/>
<text xml:space="preserve" text-anchor="start" x="1149.86" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- admin&#45;&gt;integrationhub -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M961.31,-645.76C943.6,-619.06 924.06,-589.7 906.02,-562.8 894.8,-546.07 882.83,-528.32 871.19,-511.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="873.59,-509.98 867.21,-505.24 869.24,-512.92 873.59,-509.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="918.46,-562.8 918.46,-585.6 1161.81,-585.6 1161.81,-562.8 918.46,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="921.46" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
</g>
</svg>
`;case"containers":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3887pt" height="939pt"
 viewBox="0.00 0.00 3887.00 939.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 923.85)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="885.02,-356.8 885.02,-638 1865.02,-638 1865.02,-356.8 885.02,-356.8"/>
<text xml:space="preserve" text-anchor="start" x="893.02" y="-625.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="390.02,-8 390.02,-289.2 2080.02,-289.2 2080.02,-8 390.02,-8"/>
<text xml:space="preserve" text-anchor="start" x="398.02" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_observability</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="2110.02,-8 2110.02,-289.2 3037.02,-289.2 3037.02,-8 2110.02,-8"/>
<text xml:space="preserve" text-anchor="start" x="2118.02" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">OBSERVABILIDAD</text>
</g>
<!-- adminconsole -->
<g id="node1" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1245.04,-576.8 925,-576.8 925,-396.8 1245.04,-396.8 1245.04,-576.8"/>
<text xml:space="preserve" text-anchor="start" x="963.86" y="-480.8" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1825.04,-576.8 1505,-576.8 1505,-396.8 1825.04,-396.8 1825.04,-576.8"/>
<text xml:space="preserve" text-anchor="start" x="1539.41" y="-480.8" font-family="Arial" font-size="20.00" fill="#f8fafc">App Service Quarkus Native</text>
</g>
<!-- filesystem -->
<g id="node3" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="750.04,-228 430,-228 430,-48 750.04,-48 750.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="537.79" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node4" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1180.04,-228 860,-228 860,-48 1180.04,-48 1180.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1001.13" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node5" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1610.04,-228 1290,-228 1290,-48 1610.04,-48 1610.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1424.46" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node6" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2040.04,-228 1720,-228 1720,-48 2040.04,-48 2040.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1818.89" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- otel -->
<g id="node7" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2470.04,-228 2150,-228 2150,-48 2470.04,-48 2470.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="2198.87" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node8" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2997.04,-228 2677,-228 2677,-48 2997.04,-48 2997.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="2806.44" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- user -->
<g id="node9" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="385.04,-908.8 65,-908.8 65,-728.8 385.04,-728.8 385.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="138.85" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node10" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="815.04,-908.8 495,-908.8 495,-728.8 815.04,-728.8 815.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="517.17" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node11" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1245.04,-908.8 925,-908.8 925,-728.8 1245.04,-728.8 1245.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="1006.64" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node12" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1675.04,-908.8 1355,-908.8 1355,-728.8 1675.04,-728.8 1675.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="1475.56" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node13" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2105.04,-908.8 1785,-908.8 1785,-728.8 2105.04,-728.8 2105.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="1913.34" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- iam -->
<g id="node14" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="320.04,-228 0,-228 0,-48 320.04,-48 320.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="119.44" y="-132" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node15" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3427.04,-228 3107,-228 3107,-48 3427.04,-48 3427.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="3212.55" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node16" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3857.04,-228 3537,-228 3537,-48 3857.04,-48 3857.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="3634.77" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge6" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1244.66,-486.8C1322.4,-486.8 1415.93,-486.8 1495,-486.8"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1494.54,-489.43 1502.04,-486.8 1494.54,-484.18 1494.54,-489.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1300.03,-489.8 1300.03,-512.6 1450.01,-512.6 1450.01,-489.8 1300.03,-489.8"/>
<text xml:space="preserve" text-anchor="start" x="1303.03" y="-497" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge7" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M925.25,-479.02C772.16,-466.71 538.66,-432.33 360.08,-336.8 313.24,-311.75 270.09,-272.28 235.96,-235.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="238.27,-233.82 231.29,-230.03 234.38,-237.35 238.27,-233.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="360.08,-305.6 360.08,-328.4 489.02,-328.4 489.02,-305.6 360.08,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="363.08" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- quarkusapp&#45;&gt;filesystem -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1505.31,-419.94C1442.33,-396.47 1368.74,-372.1 1300.02,-356.8 1211.59,-337.12 1187,-348.53 1097.17,-336.8 966.72,-319.76 926.92,-338.69 805.02,-289.2 770.7,-275.27 736.48,-255.02 705.76,-233.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="707.33,-231.77 699.68,-229.63 704.32,-236.08 707.33,-231.77"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1097.17,-305.6 1097.17,-328.4 1230.02,-328.4 1230.02,-305.6 1097.17,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1100.17" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- quarkusapp&#45;&gt;ftp -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1505.1,-420.9C1422.65,-385.4 1321.52,-338.65 1235.02,-289.2 1206,-272.61 1175.95,-253.19 1147.84,-233.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1149.34,-231.76 1141.67,-229.66 1146.36,-236.08 1149.34,-231.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1314.61,-305.6 1314.61,-328.4 1436.55,-328.4 1436.55,-305.6 1314.61,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1317.61" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;sftp -->
<g id="edge13" class="edge">
<title>quarkusapp&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1571.23,-397.09C1554.44,-378.26 1538.15,-357.72 1525.08,-336.8 1506.04,-306.32 1490.59,-270.25 1478.77,-237.31"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1481.34,-236.71 1476.38,-230.51 1476.39,-238.45 1481.34,-236.71"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1525.08,-305.6 1525.08,-328.4 1647.02,-328.4 1647.02,-305.6 1525.08,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1528.08" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;restsource -->
<g id="edge14" class="edge">
<title>quarkusapp&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1720.11,-396.94C1750.45,-348 1788.16,-287.17 1819.35,-236.87"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1821.57,-238.26 1823.29,-230.5 1817.11,-235.49 1821.57,-238.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1778.97,-305.6 1778.97,-328.4 1948.39,-328.4 1948.39,-305.6 1778.97,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1781.97" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge15" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1824.87,-424.62C1910.75,-389.31 2017.14,-341.59 2107.02,-289.2 2135.08,-272.84 2163.9,-253.37 2190.69,-233.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2191.98,-236.27 2196.49,-229.73 2188.89,-232.03 2191.98,-236.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2084.41,-305.6 2084.41,-328.4 2180.67,-328.4 2180.67,-305.6 2084.41,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="2087.41" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge8" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1505.35,-417.35C1442.54,-393.63 1369.05,-369.75 1300.02,-356.8 1020.97,-304.43 942.44,-377.86 661.5,-336.8 593.5,-326.86 579.91,-307.9 512.02,-297.2 479.27,-292.04 394.22,-300.42 363.02,-289.2 328.23,-276.69 294.34,-256.12 264.52,-234.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="266.22,-232.16 258.65,-229.76 263.07,-236.36 266.22,-232.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="661.5,-305.6 661.5,-328.4 799.02,-328.4 799.02,-305.6 661.5,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="664.5" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge9" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1825.01,-473.28C2142.8,-446.8 2842.05,-380 3064.02,-289.2 3097.31,-275.58 3130.11,-255.27 3159.31,-233.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3160.56,-236.29 3165.02,-229.71 3157.43,-232.07 3160.56,-236.29"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3025.35,-297.2 3025.35,-336.8 3264.03,-336.8 3264.03,-297.2 3025.35,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="3028.35" y="-321.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="3028.35" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge10" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1825.03,-479.26C2117.75,-465.49 2758.41,-427.03 3291.02,-336.8 3377.28,-322.19 3402.39,-325.43 3482.02,-289.2 3514.79,-274.29 3547.82,-254.26 3577.84,-233.7"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3579.06,-236.05 3583.73,-229.62 3576.07,-231.73 3579.06,-236.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3459.65,-305.6 3459.65,-328.4 3612.75,-328.4 3612.75,-305.6 3459.65,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="3462.65" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge16" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2469.93,-138C2532.19,-138 2603.62,-138 2666.83,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2666.79,-140.63 2674.29,-138 2666.79,-135.38 2666.79,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2525,-141 2525,-163.8 2622.04,-163.8 2622.04,-141 2525,-141"/>
<text xml:space="preserve" text-anchor="start" x="2528" y="-148.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M384.97,-733.19C444.23,-703.57 512.56,-671.39 576.47,-646 687.18,-602.02 815.26,-562.24 915.18,-533.57"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="915.67,-536.16 922.16,-531.58 914.23,-531.11 915.67,-536.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="576.47,-646 576.47,-668.8 763.02,-668.8 763.02,-646 576.47,-646"/>
<text xml:space="preserve" text-anchor="start" x="579.47" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M728.42,-729.01C754.1,-700.72 784.17,-670.45 814.67,-646 845.86,-620.99 881.44,-597.3 916.31,-576.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="917.47,-578.6 922.55,-572.49 914.77,-574.09 917.47,-578.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="814.67,-646 814.67,-668.8 1058.02,-668.8 1058.02,-646 814.67,-646"/>
<text xml:space="preserve" text-anchor="start" x="817.67" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;adminconsole -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1085.02,-728.93C1085.02,-685.1 1085.02,-632.08 1085.02,-586.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1087.65,-587.07 1085.02,-579.57 1082.4,-587.07 1087.65,-587.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1085.02,-646 1085.02,-668.8 1292.56,-668.8 1292.56,-646 1085.02,-646"/>
<text xml:space="preserve" text-anchor="start" x="1088.02" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1419.42,-729.17C1388.43,-701.64 1353.41,-671.78 1320.02,-646 1292.17,-624.51 1261.54,-602.67 1231.86,-582.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1233.69,-580.44 1226.01,-578.39 1230.73,-584.78 1233.69,-580.44"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1347.7,-646 1347.7,-668.8 1461.09,-668.8 1461.09,-646 1347.7,-646"/>
<text xml:space="preserve" text-anchor="start" x="1350.7" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;adminconsole -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1785.2,-750.35C1766.66,-742.91 1747.97,-735.58 1730.02,-728.8 1623.67,-688.64 1597.62,-676.17 1488.02,-646 1471.38,-641.42 1466.51,-643.08 1450.02,-638 1384.91,-617.93 1315.31,-590.8 1254.54,-565.11"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1255.58,-562.7 1247.65,-562.18 1253.53,-567.53 1255.58,-562.7"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1564.03,-646 1564.03,-668.8 1762.25,-668.8 1762.25,-646 1564.03,-646"/>
<text xml:space="preserve" text-anchor="start" x="1567.03" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
</g>
</svg>
`;case"frontend_components":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2886pt" height="1565pt"
 viewBox="0.00 0.00 2886.00 1565.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1550.25)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#1a468d" stroke="#1c3979" points="8,-249 8,-1286.2 2638,-1286.2 2638,-249 8,-249"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1273.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="908,-621 908,-1225 2168,-1225 2168,-621 908,-621"/>
<text xml:space="preserve" text-anchor="start" x="916" y="-1212.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE APP (FRONT)</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="48,-289 48,-570.2 2598,-570.2 2598,-289 48,-289"/>
<text xml:space="preserve" text-anchor="start" x="56" y="-557.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<!-- reactapp -->
<g id="node1" class="node">
<title>reactapp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-1163.8 1377.98,-1163.8 1377.98,-983.8 1698.02,-983.8 1698.02,-1163.8"/>
<text xml:space="preserve" text-anchor="start" x="1442.13" y="-1067.8" font-family="Arial" font-size="20.00" fill="#eff6ff">React + PatternFly UI</text>
</g>
<!-- oidcclient -->
<g id="node2" class="node">
<title>oidcclient</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2128.02,-841 1807.98,-841 1807.98,-661 2128.02,-661 2128.02,-841"/>
<text xml:space="preserve" text-anchor="start" x="1914.66" y="-745" font-family="Arial" font-size="20.00" fill="#eff6ff">OIDC Client</text>
</g>
<!-- processdesigner -->
<g id="node3" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1268.02,-841 947.98,-841 947.98,-661 1268.02,-661 1268.02,-841"/>
<text xml:space="preserve" text-anchor="start" x="1029.08" y="-745" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node4" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-841 1377.98,-841 1377.98,-661 1698.02,-661 1698.02,-841"/>
<text xml:space="preserve" text-anchor="start" x="1449.62" y="-745" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- processdefinitionresource -->
<g id="node5" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="408.02,-509 87.98,-509 87.98,-329 408.02,-329 408.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="127.39" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- sourcedefinitionresource -->
<g id="node6" class="node">
<title>sourcedefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="838.02,-509 517.98,-509 517.98,-329 838.02,-329 838.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="561.83" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinitionResource</text>
</g>
<!-- readerdefinitionresource -->
<g id="node7" class="node">
<title>readerdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1268.02,-509 947.98,-509 947.98,-329 1268.02,-329 1268.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="990.71" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderDefinitionResource</text>
</g>
<!-- processexecutionresource -->
<g id="node8" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-509 1377.98,-509 1377.98,-329 1698.02,-329 1698.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="1415.16" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processscheduleresource -->
<g id="node9" class="node">
<title>processscheduleresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2128.02,-509 1807.98,-509 1807.98,-329 2128.02,-329 2128.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="1847.38" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleResource</text>
</g>
<!-- executionqueryresource -->
<g id="node10" class="node">
<title>executionqueryresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2558.02,-509 2237.98,-509 2237.98,-329 2558.02,-329 2558.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="2284.05" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryResource</text>
</g>
<!-- user -->
<g id="node11" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="838.02,-1535.2 517.98,-1535.2 517.98,-1355.2 838.02,-1355.2 838.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="591.83" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node12" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1268.02,-1535.2 947.98,-1535.2 947.98,-1355.2 1268.02,-1355.2 1268.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="970.15" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node13" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1698.02,-1535.2 1377.98,-1535.2 1377.98,-1355.2 1698.02,-1355.2 1698.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="1459.62" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node14" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2128.02,-1535.2 1807.98,-1535.2 1807.98,-1355.2 2128.02,-1355.2 2128.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="1928.54" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node15" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2558.02,-1535.2 2237.98,-1535.2 2237.98,-1355.2 2558.02,-1355.2 2558.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="2366.32" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- iam -->
<g id="node16" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="2856.02,-180 2535.98,-180 2535.98,0 2856.02,0 2856.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="2655.42" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node17" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2426.02,-180 2105.98,-180 2105.98,0 2426.02,0 2426.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="2211.53" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- reactapp&#45;&gt;oidcclient -->
<g id="edge6" class="edge">
<title>reactapp&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1664.6,-983.82C1691.93,-964.25 1720.55,-943.49 1747,-923.8 1779.79,-899.38 1814.89,-872.46 1847.25,-847.32"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1848.71,-849.51 1853.02,-842.83 1845.49,-845.36 1848.71,-849.51"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1771.29,-901 1771.29,-923.8 1877.68,-923.8 1877.68,-901 1771.29,-901"/>
<text xml:space="preserve" text-anchor="start" x="1774.29" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Gestiona sesion</text>
</g>
<!-- reactapp&#45;&gt;processdesigner -->
<g id="edge7" class="edge">
<title>reactapp&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1394.86,-983.83C1365.92,-964.71 1336.06,-944.12 1308.89,-923.8 1277.43,-900.28 1244.55,-873.27 1214.71,-847.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1216.49,-845.82 1209.09,-842.92 1213.07,-849.8 1216.49,-845.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1308.89,-901 1308.89,-923.8 1511,-923.8 1511,-901 1308.89,-901"/>
<text xml:space="preserve" text-anchor="start" x="1311.89" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura catalogos y procesos</text>
</g>
<!-- reactapp&#45;&gt;operationsconsole -->
<g id="edge8" class="edge">
<title>reactapp&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-983.87C1538,-942.67 1538,-893.56 1538,-851.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-851.36 1538,-843.86 1535.38,-851.36 1540.63,-851.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1538,-901 1538,-923.8 1719.88,-923.8 1719.88,-901 1538,-901"/>
<text xml:space="preserve" text-anchor="start" x="1541" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta y ejecuta procesos</text>
</g>
<!-- oidcclient&#45;&gt;iam -->
<g id="edge9" class="edge">
<title>oidcclient&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2127.65,-726.64C2300.25,-698.01 2559.54,-644.03 2625,-570.2 2717.16,-466.26 2719.95,-296.96 2710.33,-189.91"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2712.98,-189.98 2709.65,-182.76 2707.75,-190.48 2712.98,-189.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2714.06,-407.6 2714.06,-430.4 2850.81,-430.4 2850.81,-407.6 2714.06,-407.6"/>
<text xml:space="preserve" text-anchor="start" x="2717.06" y="-414.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Login y refresh token</text>
</g>
<!-- processdesigner&#45;&gt;processdefinitionresource -->
<g id="edge10" class="edge">
<title>processdesigner&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M948.27,-721.18C814.39,-693.38 620.44,-644.48 463,-570.2 430.72,-554.97 398.06,-534.99 368.26,-514.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="370.09,-512.66 362.43,-510.55 367.1,-516.98 370.09,-512.66"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="529.4,-578.2 529.4,-601 656,-601 656,-578.2 529.4,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="532.4" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de procesos</text>
</g>
<!-- processdesigner&#45;&gt;sourcedefinitionresource -->
<g id="edge11" class="edge">
<title>processdesigner&#45;&gt;sourcedefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M992.2,-661.13C933.28,-615.91 861.63,-560.93 801.64,-514.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="803.58,-513.07 796.03,-510.58 800.38,-517.23 803.58,-513.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="905.89,-578.2 905.89,-601 1024.71,-601 1024.71,-578.2 905.89,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="908.89" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de sources</text>
</g>
<!-- processdesigner&#45;&gt;readerdefinitionresource -->
<g id="edge12" class="edge">
<title>processdesigner&#45;&gt;readerdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1108,-661.13C1108,-617.3 1108,-564.28 1108,-519.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1110.63,-519.27 1108,-511.77 1105.38,-519.27 1110.63,-519.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1108,-578.2 1108,-601 1225.26,-601 1225.26,-578.2 1108,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="1111" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de readers</text>
</g>
<!-- operationsconsole&#45;&gt;processexecutionresource -->
<g id="edge13" class="edge">
<title>operationsconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-661.13C1538,-617.3 1538,-564.28 1538,-519.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-519.27 1538,-511.77 1535.38,-519.27 1540.63,-519.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1538,-578.2 1538,-601 1651.39,-601 1651.39,-578.2 1538,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="1541" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- operationsconsole&#45;&gt;processscheduleresource -->
<g id="edge14" class="edge">
<title>operationsconsole&#45;&gt;processscheduleresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1653.8,-661.13C1712.72,-615.91 1784.37,-560.93 1844.36,-514.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1845.62,-517.23 1849.97,-510.58 1842.42,-513.07 1845.62,-517.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1753,-578.2 1753,-601 1918.53,-601 1918.53,-578.2 1753,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="1756" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- operationsconsole&#45;&gt;executionqueryresource -->
<g id="edge15" class="edge">
<title>operationsconsole&#45;&gt;executionqueryresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1665.76,-661.07C1693.46,-645.35 1723.37,-630.88 1753,-621 1834.81,-593.72 1860.34,-611 1946,-601 2051.5,-588.68 2083.95,-608.56 2183,-570.2 2218.08,-556.61 2252.91,-536.15 2284,-514.67"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2285.13,-517.08 2289.76,-510.63 2282.11,-512.79 2285.13,-517.08"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2160.44,-578.2 2160.44,-601 2368,-601 2368,-578.2 2160.44,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="2163.44" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoria</text>
</g>
<!-- executionqueryresource&#45;&gt;iam -->
<g id="edge17" class="edge">
<title>executionqueryresource&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2515.56,-289C2546.35,-255.22 2579.02,-219.37 2607.97,-187.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2609.83,-189.45 2612.94,-182.14 2605.95,-185.92 2609.83,-189.45"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2427.5,-234.73 2427.5,-257.53 2565.02,-257.53 2565.02,-234.73 2427.5,-234.73"/>
<text xml:space="preserve" text-anchor="start" x="2430.5" y="-241.93" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- executionqueryresource&#45;&gt;db -->
<g id="edge16" class="edge">
<title>executionqueryresource&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2345.93,-289C2332.57,-255.9 2318.41,-220.83 2305.78,-189.54"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2308.26,-188.68 2303.02,-182.71 2303.39,-190.65 2308.26,-188.68"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2085.31,-234.66 2085.31,-274.26 2323.99,-274.26 2323.99,-234.66 2085.31,-234.66"/>
<text xml:space="preserve" text-anchor="start" x="2088.31" y="-258.66" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="2088.31" y="-241.86" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- user&#45;&gt;reactapp -->
<g id="edge1" class="edge">
<title>user&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M838,-1375.48C933.94,-1334.26 1060.02,-1280.11 1178.7,-1229.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1179.69,-1231.56 1185.54,-1226.19 1177.62,-1226.74 1179.69,-1231.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="826.31,-1300.37 826.31,-1323.17 1012.86,-1323.17 1012.86,-1300.37 826.31,-1300.37"/>
<text xml:space="preserve" text-anchor="start" x="829.31" y="-1307.57" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;reactapp -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1211.54,-1355.25C1254.71,-1318.17 1306.15,-1273.97 1355.29,-1231.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1356.89,-1233.85 1360.86,-1226.97 1353.46,-1229.87 1356.89,-1233.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1044.13,-1290.01 1044.13,-1312.81 1287.48,-1312.81 1287.48,-1290.01 1044.13,-1290.01"/>
<text xml:space="preserve" text-anchor="start" x="1047.13" y="-1297.21" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;reactapp -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-1355.25C1538,-1319.24 1538,-1276.51 1538,-1235.41"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-1235.52 1538,-1228.02 1535.38,-1235.52 1540.63,-1235.52"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1330.46,-1290.07 1330.46,-1312.87 1538,-1312.87 1538,-1290.07 1330.46,-1290.07"/>
<text xml:space="preserve" text-anchor="start" x="1333.46" y="-1297.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;reactapp -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1864.46,-1355.25C1821.29,-1318.17 1769.85,-1273.97 1720.71,-1231.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1722.54,-1229.87 1715.14,-1226.97 1719.11,-1233.85 1722.54,-1229.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1675.13,-1290.01 1675.13,-1312.81 1788.52,-1312.81 1788.52,-1290.01 1675.13,-1290.01"/>
<text xml:space="preserve" text-anchor="start" x="1678.13" y="-1297.21" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;reactapp -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2238,-1375.48C2142.06,-1334.26 2015.98,-1280.11 1897.3,-1229.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1898.38,-1226.74 1890.46,-1226.19 1896.31,-1231.56 1898.38,-1226.74"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1864.92,-1300.37 1864.92,-1323.17 2063.14,-1323.17 2063.14,-1300.37 1864.92,-1300.37"/>
<text xml:space="preserve" text-anchor="start" x="1867.92" y="-1307.57" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
</g>
</svg>
`;case"backend_components":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="4613pt" height="2229pt"
 viewBox="0.00 0.00 4613.00 2229.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2213.65)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#1a468d" stroke="#1c3979" points="8,-306.2 8,-1927.8 3498,-1927.8 3498,-306.2 8,-306.2"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1914.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="48,-346.2 48,-1595.8 3458,-1595.8 3458,-346.2 48,-346.2"/>
<text xml:space="preserve" text-anchor="start" x="56" y="-1582.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="225,-8 225,-289.2 1915,-289.2 1915,-8 225,-8"/>
<text xml:space="preserve" text-anchor="start" x="233" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_observability</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="1945,-8 1945,-289.2 2872,-289.2 2872,-8 1945,-8"/>
<text xml:space="preserve" text-anchor="start" x="1953" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">OBSERVABILIDAD</text>
</g>
<!-- telemetry -->
<g id="node1" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="408.02,-1534.6 87.98,-1534.6 87.98,-1354.6 408.02,-1354.6 408.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="107.38" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- packages -->
<g id="node2" class="node">
<title>packages</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="408.02,-1211.8 87.98,-1211.8 87.98,-1031.8 408.02,-1031.8 408.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="165.73" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Package Structure</text>
</g>
<!-- processdefinitionresource -->
<g id="node3" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2128.02,-1534.6 1807.98,-1534.6 1807.98,-1354.6 2128.02,-1354.6 2128.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="1847.39" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- sourcedefinitionresource -->
<g id="node4" class="node">
<title>sourcedefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="838.02,-1534.6 517.98,-1534.6 517.98,-1354.6 838.02,-1354.6 838.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="561.83" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinitionResource</text>
</g>
<!-- readerdefinitionresource -->
<g id="node5" class="node">
<title>readerdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1268.02,-1534.6 947.98,-1534.6 947.98,-1354.6 1268.02,-1354.6 1268.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="990.71" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderDefinitionResource</text>
</g>
<!-- processexecutionresource -->
<g id="node6" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3418.02,-1534.6 3097.98,-1534.6 3097.98,-1354.6 3418.02,-1354.6 3418.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="3135.16" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processscheduleresource -->
<g id="node7" class="node">
<title>processscheduleresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2558.02,-1534.6 2237.98,-1534.6 2237.98,-1354.6 2558.02,-1354.6 2558.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="2277.38" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleResource</text>
</g>
<!-- executionqueryresource -->
<g id="node8" class="node">
<title>executionqueryresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-1534.6 1377.98,-1534.6 1377.98,-1354.6 1698.02,-1354.6 1698.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="1424.05" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryResource</text>
</g>
<!-- processschedulerservice -->
<g id="node9" class="node">
<title>processschedulerservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2988.02,-1534.6 2667.98,-1534.6 2667.98,-1354.6 2988.02,-1354.6 2988.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="2713.5" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessSchedulerService</text>
</g>
<!-- processcatalogservice -->
<g id="node10" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2128.02,-1211.8 1807.98,-1211.8 1807.98,-1031.8 2128.02,-1031.8 2128.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="1864.06" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- sourcecatalogservice -->
<g id="node11" class="node">
<title>sourcecatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="838.02,-1211.8 517.98,-1211.8 517.98,-1031.8 838.02,-1031.8 838.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="578.5" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceCatalogService</text>
</g>
<!-- readercatalogservice -->
<g id="node12" class="node">
<title>readercatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1268.02,-1211.8 947.98,-1211.8 947.98,-1031.8 1268.02,-1031.8 1268.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="1007.39" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderCatalogService</text>
</g>
<!-- processschedulequeryservice -->
<g id="node13" class="node">
<title>processschedulequeryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2558.02,-1211.8 2237.98,-1211.8 2237.98,-1031.8 2558.02,-1031.8 2558.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="2259.6" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleQueryService</text>
</g>
<!-- executionqueryservice -->
<g id="node14" class="node">
<title>executionqueryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-1211.8 1377.98,-1211.8 1377.98,-1031.8 1698.02,-1031.8 1698.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="1433.51" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryService</text>
</g>
<!-- processexecutionservice -->
<g id="node15" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3418.02,-1211.8 3097.98,-1211.8 3097.98,-1031.8 3418.02,-1031.8 3418.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="3144.62" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- repositories -->
<g id="node16" class="node">
<title>repositories</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-889 1377.98,-889 1377.98,-709 1698.02,-709 1698.02,-889"/>
<text xml:space="preserve" text-anchor="start" x="1482.42" y="-793" font-family="Arial" font-size="20.00" fill="#eff6ff">Repositories</text>
</g>
<!-- processengine -->
<g id="node17" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3418.02,-889 3097.98,-889 3097.98,-709 3418.02,-709 3418.02,-889"/>
<text xml:space="preserve" text-anchor="start" x="3187.96" y="-793" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- auditservice -->
<g id="node18" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2988.02,-889 2667.98,-889 2667.98,-709 2988.02,-709 2988.02,-889"/>
<text xml:space="preserve" text-anchor="start" x="2769.08" y="-793" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- domainentities -->
<g id="node19" class="node">
<title>domainentities</title>
<polygon fill="#fec119" stroke="#e2a90c" stroke-width="0" points="1698.02,-566.2 1377.98,-566.2 1377.98,-386.2 1698.02,-386.2 1698.02,-566.2"/>
<text xml:space="preserve" text-anchor="start" x="1467.97" y="-470.2" font-family="Arial" font-size="20.00" fill="#4d2a00">Domain Entities</text>
</g>
<!-- adminconsole -->
<g id="node20" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2128.02,-1866.6 1807.98,-1866.6 1807.98,-1686.6 2128.02,-1686.6 2128.02,-1866.6"/>
<text xml:space="preserve" text-anchor="start" x="1846.84" y="-1770.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- filesystem -->
<g id="node21" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1875.02,-228 1554.98,-228 1554.98,-48 1875.02,-48 1875.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="1662.77" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node22" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="585.02,-228 264.98,-228 264.98,-48 585.02,-48 585.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="406.11" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node23" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1015.02,-228 694.98,-228 694.98,-48 1015.02,-48 1015.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="829.44" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node24" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1445.02,-228 1124.98,-228 1124.98,-48 1445.02,-48 1445.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="1223.87" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- otel -->
<g id="node25" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2305.02,-228 1984.98,-228 1984.98,-48 2305.02,-48 2305.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="2033.85" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node26" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2832.02,-228 2511.98,-228 2511.98,-48 2832.02,-48 2832.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="2641.42" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- user -->
<g id="node27" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1268.02,-2198.6 947.98,-2198.6 947.98,-2018.6 1268.02,-2018.6 1268.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="1021.83" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node28" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1698.02,-2198.6 1377.98,-2198.6 1377.98,-2018.6 1698.02,-2018.6 1698.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="1400.15" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node29" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2128.02,-2198.6 1807.98,-2198.6 1807.98,-2018.6 2128.02,-2018.6 2128.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="1889.62" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node30" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2558.02,-2198.6 2237.98,-2198.6 2237.98,-2018.6 2558.02,-2018.6 2558.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="2358.54" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node31" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2988.02,-2198.6 2667.98,-2198.6 2667.98,-2018.6 2988.02,-2018.6 2988.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="2796.32" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- iam -->
<g id="node32" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="3262.02,-228 2941.98,-228 2941.98,-48 3262.02,-48 3262.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="3061.42" y="-132" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node33" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3858.02,-566.2 3537.98,-566.2 3537.98,-386.2 3858.02,-386.2 3858.02,-566.2"/>
<text xml:space="preserve" text-anchor="start" x="3643.53" y="-470.2" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node34" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4288.02,-566.2 3967.98,-566.2 3967.98,-386.2 4288.02,-386.2 4288.02,-566.2"/>
<text xml:space="preserve" text-anchor="start" x="4065.75" y="-470.2" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- telemetry&#45;&gt;packages -->
<!-- processdefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge14" class="edge">
<title>processdefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1968,-1354.67C1968,-1313.47 1968,-1264.36 1968,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1970.63,-1222.16 1968,-1214.66 1965.38,-1222.16 1970.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1968,-1271.8 1968,-1294.6 2147.56,-1294.6 2147.56,-1271.8 1968,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="1971" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega gestion de procesos</text>
</g>
<!-- sourcedefinitionresource&#45;&gt;sourcecatalogservice -->
<g id="edge15" class="edge">
<title>sourcedefinitionresource&#45;&gt;sourcecatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M678,-1354.67C678,-1313.47 678,-1264.36 678,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="680.63,-1222.16 678,-1214.66 675.38,-1222.16 680.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="678,-1271.8 678,-1294.6 849.77,-1294.6 849.77,-1271.8 678,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="681" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega gestion de sources</text>
</g>
<!-- readerdefinitionresource&#45;&gt;readercatalogservice -->
<g id="edge16" class="edge">
<title>readerdefinitionresource&#45;&gt;readercatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1108,-1354.67C1108,-1313.47 1108,-1264.36 1108,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1110.63,-1222.16 1108,-1214.66 1105.38,-1222.16 1110.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1108,-1271.8 1108,-1294.6 1278.22,-1294.6 1278.22,-1271.8 1108,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="1111" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega gestion de readers</text>
</g>
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge17" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3258,-1354.67C3258,-1313.47 3258,-1264.36 3258,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3260.63,-1222.16 3258,-1214.66 3255.38,-1222.16 3260.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3258,-1271.8 3258,-1294.6 3371.41,-1294.6 3371.41,-1271.8 3258,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="3261" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecucion</text>
</g>
<!-- processscheduleresource&#45;&gt;processschedulequeryservice -->
<g id="edge18" class="edge">
<title>processscheduleresource&#45;&gt;processschedulequeryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2398,-1354.67C2398,-1313.47 2398,-1264.36 2398,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2400.63,-1222.16 2398,-1214.66 2395.38,-1222.16 2400.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2398,-1271.8 2398,-1294.6 2590.79,-1294.6 2590.79,-1271.8 2398,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="2401" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consulta de schedules</text>
</g>
<!-- executionqueryresource&#45;&gt;executionqueryservice -->
<g id="edge19" class="edge">
<title>executionqueryresource&#45;&gt;executionqueryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-1354.67C1538,-1313.47 1538,-1264.36 1538,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-1222.16 1538,-1214.66 1535.38,-1222.16 1540.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1538,-1271.8 1538,-1294.6 1719.88,-1294.6 1719.88,-1271.8 1538,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="1541" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consultas operativas</text>
</g>
<!-- processschedulerservice&#45;&gt;processexecutionservice -->
<g id="edge20" class="edge">
<title>processschedulerservice&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2927.24,-1354.71C2959.24,-1327.25 2995.33,-1297.48 3029.68,-1271.8 3054.23,-1253.45 3080.96,-1234.86 3107.21,-1217.31"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3108.4,-1219.67 3113.19,-1213.33 3105.49,-1215.3 3108.4,-1219.67"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3029.68,-1271.8 3029.68,-1294.6 3231,-1294.6 3231,-1271.8 3029.68,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="3032.68" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispara procesos programados</text>
</g>
<!-- processcatalogservice&#45;&gt;repositories -->
<g id="edge22" class="edge">
<title>processcatalogservice&#45;&gt;repositories</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1848.79,-1031.87C1791.7,-989.27 1723.28,-938.23 1665.19,-894.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1667.07,-893.02 1659.49,-890.64 1663.93,-897.23 1667.07,-893.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1765.89,-949 1765.89,-971.8 1792.89,-971.8 1792.89,-949 1765.89,-949"/>
<text xml:space="preserve" text-anchor="start" x="1768.89" y="-957.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- sourcecatalogservice&#45;&gt;repositories -->
<g id="edge23" class="edge">
<title>sourcecatalogservice&#45;&gt;repositories</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M837.92,-1053.62C856.44,-1046.13 875.1,-1038.72 893,-1031.8 1053.26,-969.87 1237.92,-904.06 1368.48,-858.45"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1369.11,-861.01 1375.32,-856.06 1367.38,-856.06 1369.11,-861.01"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1104.79,-949 1104.79,-971.8 1214.27,-971.8 1214.27,-949 1104.79,-949"/>
<text xml:space="preserve" text-anchor="start" x="1107.79" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste sources</text>
</g>
<!-- readercatalogservice&#45;&gt;repositories -->
<g id="edge24" class="edge">
<title>readercatalogservice&#45;&gt;repositories</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1227.21,-1031.87C1284.3,-989.27 1352.72,-938.23 1410.81,-894.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1412.07,-897.23 1416.51,-890.64 1408.93,-893.02 1412.07,-897.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1335.89,-949 1335.89,-971.8 1443.82,-971.8 1443.82,-949 1335.89,-949"/>
<text xml:space="preserve" text-anchor="start" x="1338.89" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste readers</text>
</g>
<!-- processschedulequeryservice&#45;&gt;repositories -->
<g id="edge25" class="edge">
<title>processschedulequeryservice&#45;&gt;repositories</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2238.08,-1053.62C2219.56,-1046.13 2200.9,-1038.72 2183,-1031.8 2022.74,-969.87 1838.08,-904.06 1707.52,-858.45"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1708.62,-856.06 1700.68,-856.06 1706.89,-861.01 1708.62,-856.06"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2006.81,-949 2006.81,-971.8 2172.34,-971.8 2172.34,-949 2006.81,-949"/>
<text xml:space="preserve" text-anchor="start" x="2009.81" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- executionqueryservice&#45;&gt;repositories -->
<g id="edge26" class="edge">
<title>executionqueryservice&#45;&gt;repositories</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-1031.87C1538,-990.67 1538,-941.56 1538,-899.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-899.36 1538,-891.86 1535.38,-899.36 1540.63,-899.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1538,-949 1538,-971.8 1564.99,-971.8 1564.99,-949 1538,-949"/>
<text xml:space="preserve" text-anchor="start" x="1541" y="-957.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionservice&#45;&gt;processengine -->
<g id="edge27" class="edge">
<title>processexecutionservice&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3258,-1031.87C3258,-990.67 3258,-941.56 3258,-899.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3260.63,-899.36 3258,-891.86 3255.38,-899.36 3260.63,-899.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3258,-949 3258,-971.8 3284.99,-971.8 3284.99,-949 3258,-949"/>
<text xml:space="preserve" text-anchor="start" x="3261" y="-957.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionservice&#45;&gt;auditservice -->
<g id="edge28" class="edge">
<title>processexecutionservice&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3138.79,-1031.87C3081.7,-989.27 3013.28,-938.23 2955.19,-894.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2957.07,-893.02 2949.49,-890.64 2953.93,-897.23 2957.07,-893.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3055.89,-949 3055.89,-971.8 3166.95,-971.8 3166.95,-949 3055.89,-949"/>
<text xml:space="preserve" text-anchor="start" x="3058.89" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- repositories&#45;&gt;domainentities -->
<g id="edge29" class="edge">
<title>repositories&#45;&gt;domainentities</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-709.07C1538,-667.87 1538,-618.76 1538,-576.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-576.56 1538,-569.06 1535.38,-576.56 1540.63,-576.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1538,-626.2 1538,-649 1631.16,-649 1631.16,-626.2 1538,-626.2"/>
<text xml:space="preserve" text-anchor="start" x="1541" y="-633.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee y persiste</text>
</g>
<!-- repositories&#45;&gt;db -->
<g id="edge30" class="edge">
<title>repositories&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1697.75,-784.73C2100.12,-750.37 3147.25,-655.02 3485,-566.2 3499.39,-562.42 3514.08,-557.86 3528.69,-552.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3529.21,-555.43 3535.42,-550.47 3527.47,-550.48 3529.21,-555.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3165.45,-626.2 3165.45,-649 3329.43,-649 3329.43,-626.2 3165.45,-626.2"/>
<text xml:space="preserve" text-anchor="start" x="3168.45" y="-633.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Opera sobre PostgreSQL</text>
</g>
<!-- processengine&#45;&gt;db -->
<g id="edge31" class="edge">
<title>processengine&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3379.98,-709.07C3438.4,-666.47 3508.41,-615.43 3567.85,-572.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3569.2,-574.35 3573.72,-567.81 3566.11,-570.11 3569.2,-574.35"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3491.19,-626.2 3491.19,-649 3729.1,-649 3729.1,-626.2 3491.19,-626.2"/>
<text xml:space="preserve" text-anchor="start" x="3494.19" y="-633.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert internos</text>
</g>
<!-- processengine&#45;&gt;externalapi -->
<g id="edge32" class="edge">
<title>processengine&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3417.75,-756.43C3516.39,-729.23 3644.9,-691.03 3756,-649 3823.54,-623.45 3896,-591.15 3958.87,-561.47"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3959.68,-563.99 3965.34,-558.41 3957.44,-559.24 3959.68,-563.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3807.81,-626.2 3807.81,-649 3834.8,-649 3834.8,-626.2 3807.81,-626.2"/>
<text xml:space="preserve" text-anchor="start" x="3810.81" y="-634.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- domainentities&#45;&gt;filesystem -->
<g id="edge34" class="edge">
<title>domainentities&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1605.91,-346.2C1624.95,-310.05 1645.32,-271.35 1663.25,-237.29"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1665.57,-238.52 1666.75,-230.66 1660.93,-236.07 1665.57,-238.52"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1504.2,-287.07 1504.2,-309.87 1637.04,-309.87 1637.04,-287.07 1504.2,-287.07"/>
<text xml:space="preserve" text-anchor="start" x="1507.2" y="-294.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- domainentities&#45;&gt;ftp -->
<g id="edge35" class="edge">
<title>domainentities&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M794.46,-346.2C741.4,-329.41 689.4,-310.5 640,-289.2 606.46,-274.74 572.83,-254.6 542.47,-233.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="544.13,-231.71 536.47,-229.59 541.13,-236.02 544.13,-231.71"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="518.06,-289.2 518.06,-312 639.99,-312 639.99,-289.2 518.06,-289.2"/>
<text xml:space="preserve" text-anchor="start" x="521.06" y="-296.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- domainentities&#45;&gt;sftp -->
<g id="edge36" class="edge">
<title>domainentities&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1187.32,-346.2C1147.13,-328.38 1107.24,-309.26 1070,-289.2 1039.9,-272.99 1008.96,-253.36 980.26,-233.72"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="981.99,-231.73 974.32,-229.63 979.01,-236.05 981.99,-231.73"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="948.04,-289.19 948.04,-311.99 1069.98,-311.99 1069.98,-289.19 948.04,-289.19"/>
<text xml:space="preserve" text-anchor="start" x="951.04" y="-296.39" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- domainentities&#45;&gt;restsource -->
<g id="edge37" class="edge">
<title>domainentities&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1440.93,-346.2C1413.41,-309.64 1383.92,-270.45 1358.08,-236.11"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1360.39,-234.81 1353.78,-230.4 1356.19,-237.97 1360.39,-234.81"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1227.15,-287.26 1227.15,-310.06 1396.57,-310.06 1396.57,-287.26 1227.15,-287.26"/>
<text xml:space="preserve" text-anchor="start" x="1230.15" y="-294.46" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- domainentities&#45;&gt;otel -->
<g id="edge38" class="edge">
<title>domainentities&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1836.64,-346.2C1872.71,-328.15 1908.59,-308.97 1942,-289.2 1969.87,-272.71 1998.55,-253.24 2025.27,-233.87"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2026.53,-236.19 2031.04,-229.65 2023.44,-231.95 2026.53,-236.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1845.78,-289.18 1845.78,-311.98 1942.04,-311.98 1942.04,-289.18 1845.78,-289.18"/>
<text xml:space="preserve" text-anchor="start" x="1848.78" y="-296.38" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- domainentities&#45;&gt;iam -->
<g id="edge33" class="edge">
<title>domainentities&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2683.41,-346.2C2773.38,-328.7 2848.75,-309.64 2899,-289.2 2932.31,-275.65 2965.12,-255.35 2994.33,-234.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2995.58,-236.38 3000.04,-229.8 2992.45,-232.16 2995.58,-236.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2711.49,-306.69 2711.49,-329.49 2849.01,-329.49 2849.01,-306.69 2711.49,-306.69"/>
<text xml:space="preserve" text-anchor="start" x="2714.49" y="-313.89" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- adminconsole&#45;&gt;processdefinitionresource -->
<g id="edge7" class="edge">
<title>adminconsole&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1968,-1686.73C1968,-1642.9 1968,-1589.88 1968,-1544.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1970.63,-1544.87 1968,-1537.37 1965.38,-1544.87 1970.63,-1544.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1968,-1603.8 1968,-1626.6 2094.6,-1626.6 2094.6,-1603.8 1968,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="1971" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de procesos</text>
</g>
<!-- adminconsole&#45;&gt;sourcedefinitionresource -->
<g id="edge8" class="edge">
<title>adminconsole&#45;&gt;sourcedefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1808.08,-1770.74C1592.68,-1759.38 1200.87,-1721.55 893,-1595.8 858.8,-1581.83 824.69,-1561.64 794.04,-1540.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="795.63,-1538.46 787.98,-1536.33 792.63,-1542.77 795.63,-1538.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="947.62,-1603.8 947.62,-1626.6 1066.43,-1626.6 1066.43,-1603.8 947.62,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="950.62" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de sources</text>
</g>
<!-- adminconsole&#45;&gt;readerdefinitionresource -->
<g id="edge9" class="edge">
<title>adminconsole&#45;&gt;readerdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1808.27,-1746.78C1674.39,-1718.98 1480.44,-1670.08 1323,-1595.8 1290.72,-1580.57 1258.06,-1560.59 1228.26,-1540.19"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1230.09,-1538.26 1222.43,-1536.15 1227.1,-1542.58 1230.09,-1538.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1389.4,-1603.8 1389.4,-1626.6 1506.66,-1626.6 1506.66,-1603.8 1389.4,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="1392.4" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de readers</text>
</g>
<!-- adminconsole&#45;&gt;processexecutionresource -->
<g id="edge10" class="edge">
<title>adminconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2127.92,-1770.74C2343.32,-1759.38 2735.13,-1721.55 3043,-1595.8 3077.2,-1581.83 3111.31,-1561.64 3141.96,-1540.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3143.37,-1542.77 3148.02,-1536.33 3140.37,-1538.46 3143.37,-1542.77"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3015.89,-1603.8 3015.89,-1626.6 3129.28,-1626.6 3129.28,-1603.8 3015.89,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="3018.89" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- adminconsole&#45;&gt;processscheduleresource -->
<g id="edge11" class="edge">
<title>adminconsole&#45;&gt;processscheduleresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2083.8,-1686.73C2142.72,-1641.51 2214.37,-1586.53 2274.36,-1540.49"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2275.62,-1542.83 2279.97,-1536.18 2272.42,-1538.67 2275.62,-1542.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2183,-1603.8 2183,-1626.6 2348.53,-1626.6 2348.53,-1603.8 2183,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="2186" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- adminconsole&#45;&gt;executionqueryresource -->
<g id="edge12" class="edge">
<title>adminconsole&#45;&gt;executionqueryresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1819.13,-1686.77C1790.06,-1667.84 1760.28,-1647.29 1733.44,-1626.6 1699.69,-1600.6 1664.93,-1569.88 1634.25,-1541.19"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1636.42,-1539.63 1629.15,-1536.41 1632.82,-1543.46 1636.42,-1539.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1733.44,-1603.8 1733.44,-1626.6 1941,-1626.6 1941,-1603.8 1733.44,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="1736.44" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoria</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge13" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2127.77,-1771.27C2677,-1754.3 4454,-1681.18 4454,-1445.6 4454,-1445.6 4454,-1445.6 4454,-475.2 4454,-385.34 4419.05,-354.07 4343,-306.2 4168.27,-196.22 3569.69,-157.4 3272.38,-144.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3272.56,-142.07 3264.95,-144.37 3272.34,-147.31 3272.56,-142.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4454,-949 4454,-971.8 4582.94,-971.8 4582.94,-949 4454,-949"/>
<text xml:space="preserve" text-anchor="start" x="4457" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge21" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2304.91,-138C2367.17,-138 2438.6,-138 2501.81,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2501.77,-140.63 2509.27,-138 2501.77,-135.38 2501.77,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2359.98,-141 2359.98,-163.8 2457.02,-163.8 2457.02,-141 2359.98,-141"/>
<text xml:space="preserve" text-anchor="start" x="2362.98" y="-148.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1267.95,-2022.99C1327.21,-1993.37 1395.54,-1961.19 1459.45,-1935.8 1570.16,-1891.82 1698.24,-1852.04 1798.16,-1823.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1798.65,-1825.96 1805.14,-1821.38 1797.21,-1820.91 1798.65,-1825.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1459.45,-1935.8 1459.45,-1958.6 1646,-1958.6 1646,-1935.8 1459.45,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="1462.45" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1611.4,-2018.81C1637.08,-1990.52 1667.15,-1960.25 1697.65,-1935.8 1728.84,-1910.79 1764.42,-1887.1 1799.29,-1866.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1800.45,-1868.4 1805.53,-1862.29 1797.75,-1863.89 1800.45,-1868.4"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1697.65,-1935.8 1697.65,-1958.6 1941,-1958.6 1941,-1935.8 1697.65,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="1700.65" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;adminconsole -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1968,-2018.73C1968,-1974.9 1968,-1921.88 1968,-1876.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1970.63,-1876.87 1968,-1869.37 1965.38,-1876.87 1970.63,-1876.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1968,-1935.8 1968,-1958.6 2175.54,-1958.6 2175.54,-1935.8 1968,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="1971" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2302.4,-2018.97C2271.41,-1991.44 2236.39,-1961.58 2203,-1935.8 2175.15,-1914.31 2144.52,-1892.47 2114.84,-1872.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2116.67,-1870.24 2108.99,-1868.19 2113.71,-1874.58 2116.67,-1870.24"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2230.68,-1935.8 2230.68,-1958.6 2344.07,-1958.6 2344.07,-1935.8 2230.68,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="2233.68" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;adminconsole -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2667.99,-2040.64C2649.49,-2033.11 2630.86,-2025.63 2613,-2018.6 2452.53,-1955.43 2268.09,-1886.92 2137.65,-1839.15"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2138.75,-1836.76 2130.81,-1836.65 2136.95,-1841.69 2138.75,-1836.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2454.44,-1935.8 2454.44,-1958.6 2652.66,-1958.6 2652.66,-1935.8 2454.44,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="2457.44" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
</g>
</svg>
`;case"process_engine_code":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="7038pt" height="2059pt"
 viewBox="0.00 0.00 7038.00 2059.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2044.25)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#1c417d" stroke="#1c356c" points="8,-270.8 8,-2021.2 4345,-2021.2 4345,-270.8 8,-270.8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-2008.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="3905,-1346.8 3905,-1960 4305,-1960 4305,-1346.8 3905,-1346.8"/>
<text xml:space="preserve" text-anchor="start" x="3913" y="-1947.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE APP (FRONT)</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#29472f" stroke="#1c3021" points="48,-310.8 48,-1628 3865,-1628 3865,-310.8 48,-310.8"/>
<text xml:space="preserve" text-anchor="start" x="56" y="-1615.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_repositories</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="88,-350.8 88,-1296 1458,-1296 1458,-350.8 88,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="96" y="-1283.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">REPOSITORIES</text>
</g>
<g id="clust7" class="cluster">
<title>cluster_processengine</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="1498,-350.8 1498,-964 3188,-964 3188,-350.8 1498,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="1506" y="-951.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">PROCESS ENGINE</text>
</g>
<g id="clust8" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="4353,-350.8 4353,-632 6043,-632 6043,-350.8 4353,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="4361" y="-619.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<g id="clust9" class="cluster">
<title>cluster_observability</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="6073,-350.8 6073,-632 7000,-632 7000,-350.8 6073,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="6081" y="-619.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">OBSERVABILIDAD</text>
</g>
<!-- processdesigner -->
<g id="node1" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4265.02,-1566.8 3944.98,-1566.8 3944.98,-1386.8 4265.02,-1386.8 4265.02,-1566.8"/>
<text xml:space="preserve" text-anchor="start" x="4026.08" y="-1470.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node2" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4265.02,-1898.8 3944.98,-1898.8 3944.98,-1718.8 4265.02,-1718.8 4265.02,-1898.8"/>
<text xml:space="preserve" text-anchor="start" x="4016.62" y="-1802.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- processdefinitionrepository -->
<g id="node3" class="node">
<title>processdefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="448.02,-1234.8 127.98,-1234.8 127.98,-1054.8 448.02,-1054.8 448.02,-1234.8"/>
<text xml:space="preserve" text-anchor="start" x="162.39" y="-1138.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionRepository</text>
</g>
<!-- sourcedefinitionrepository -->
<g id="node4" class="node">
<title>sourcedefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="878.02,-1234.8 557.98,-1234.8 557.98,-1054.8 878.02,-1054.8 878.02,-1234.8"/>
<text xml:space="preserve" text-anchor="start" x="596.83" y="-1138.8" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinitionRepository</text>
</g>
<!-- readerdefinitionrepository -->
<g id="node5" class="node">
<title>readerdefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1418.02,-1234.8 1097.98,-1234.8 1097.98,-1054.8 1418.02,-1054.8 1418.02,-1234.8"/>
<text xml:space="preserve" text-anchor="start" x="1135.71" y="-1138.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderDefinitionRepository</text>
</g>
<!-- processtaskdefinitionrepository -->
<g id="node6" class="node">
<title>processtaskdefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="500.34,-902.8 173.66,-902.8 173.66,-722.8 500.34,-722.8 500.34,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="189.72" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessTaskDefinitionRepository</text>
</g>
<!-- processexecutionrepository -->
<g id="node7" class="node">
<title>processexecutionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="976.02,-902.8 655.98,-902.8 655.98,-722.8 976.02,-722.8 976.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="688.16" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionRepository</text>
</g>
<!-- processtaskexecutionrepository -->
<g id="node8" class="node">
<title>processtaskexecutionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1417.56,-902.8 1086.44,-902.8 1086.44,-722.8 1417.56,-722.8 1417.56,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="1102.49" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessTaskExecutionRepository</text>
</g>
<!-- auditeventrepository -->
<g id="node9" class="node">
<title>auditeventrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1187.02,-570.8 866.98,-570.8 866.98,-390.8 1187.02,-390.8 1187.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="930.84" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">AuditEventRepository</text>
</g>
<!-- jsonconfigurationmapper -->
<g id="node10" class="node">
<title>jsonconfigurationmapper</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1858.02,-902.8 1537.98,-902.8 1537.98,-722.8 1858.02,-722.8 1858.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="1583.49" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">JsonConfigurationMapper</text>
</g>
<!-- sourceregistry -->
<g id="node11" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2288.02,-902.8 1967.98,-902.8 1967.98,-722.8 2288.02,-722.8 2288.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="2016.85" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node12" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2718.02,-902.8 2397.98,-902.8 2397.98,-722.8 2718.02,-722.8 2718.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="2445.73" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- taskregistry -->
<g id="node13" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3148.02,-902.8 2827.98,-902.8 2827.98,-722.8 3148.02,-722.8 3148.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="2886.86" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- sourceproviders -->
<g id="node14" class="node">
<title>sourceproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2288.02,-570.8 1967.98,-570.8 1967.98,-390.8 2288.02,-390.8 2288.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="2051.3" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Providers</text>
</g>
<!-- readerproviders -->
<g id="node15" class="node">
<title>readerproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2718.02,-570.8 2397.98,-570.8 2397.98,-390.8 2718.02,-390.8 2718.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="2480.19" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Providers</text>
</g>
<!-- taskproviders -->
<g id="node16" class="node">
<title>taskproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3148.02,-570.8 2827.98,-570.8 2827.98,-390.8 3148.02,-390.8 3148.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="2921.32" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Providers</text>
</g>
<!-- telemetry -->
<g id="node17" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="878.02,-1566.8 557.98,-1566.8 557.98,-1386.8 878.02,-1386.8 878.02,-1566.8"/>
<text xml:space="preserve" text-anchor="start" x="577.38" y="-1470.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- processexecutionresource -->
<g id="node18" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3528.02,-1566.8 3207.98,-1566.8 3207.98,-1386.8 3528.02,-1386.8 3528.02,-1566.8"/>
<text xml:space="preserve" text-anchor="start" x="3245.16" y="-1470.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processexecutionservice -->
<g id="node19" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3528.02,-1234.8 3207.98,-1234.8 3207.98,-1054.8 3528.02,-1054.8 3528.02,-1234.8"/>
<text xml:space="preserve" text-anchor="start" x="3254.62" y="-1138.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- auditservice -->
<g id="node20" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3825.02,-902.8 3504.98,-902.8 3504.98,-722.8 3825.02,-722.8 3825.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="3606.08" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- filesystem -->
<g id="node21" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="4713.02,-570.8 4392.98,-570.8 4392.98,-390.8 4713.02,-390.8 4713.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="4500.77" y="-474.8" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node22" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="5143.02,-570.8 4822.98,-570.8 4822.98,-390.8 5143.02,-390.8 5143.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="4964.11" y="-474.8" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node23" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="5573.02,-570.8 5252.98,-570.8 5252.98,-390.8 5573.02,-390.8 5573.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="5387.44" y="-474.8" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node24" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="6003.02,-570.8 5682.98,-570.8 5682.98,-390.8 6003.02,-390.8 6003.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="5781.87" y="-474.8" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- otel -->
<g id="node25" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="6433.02,-570.8 6112.98,-570.8 6112.98,-390.8 6433.02,-390.8 6433.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="6161.85" y="-474.8" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node26" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="6960.02,-570.8 6639.98,-570.8 6639.98,-390.8 6960.02,-390.8 6960.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="6769.42" y="-474.8" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- db -->
<g id="node27" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1187.02,-180 866.98,-180 866.98,0 1187.02,0 1187.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="972.53" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- user -->
<g id="node28" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4705.02,-1898.8 4384.98,-1898.8 4384.98,-1718.8 4705.02,-1718.8 4705.02,-1898.8"/>
<text xml:space="preserve" text-anchor="start" x="4458.83" y="-1802.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node29" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="5135.02,-1898.8 4814.98,-1898.8 4814.98,-1718.8 5135.02,-1718.8 5135.02,-1898.8"/>
<text xml:space="preserve" text-anchor="start" x="4837.15" y="-1802.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node30" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="5565.02,-1898.8 5244.98,-1898.8 5244.98,-1718.8 5565.02,-1718.8 5565.02,-1898.8"/>
<text xml:space="preserve" text-anchor="start" x="5326.62" y="-1802.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node31" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="5995.02,-1898.8 5674.98,-1898.8 5674.98,-1718.8 5995.02,-1718.8 5995.02,-1898.8"/>
<text xml:space="preserve" text-anchor="start" x="5795.54" y="-1802.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node32" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="6425.02,-1898.8 6104.98,-1898.8 6104.98,-1718.8 6425.02,-1718.8 6425.02,-1898.8"/>
<text xml:space="preserve" text-anchor="start" x="6233.32" y="-1802.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- externalapi -->
<g id="node33" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3148.02,-180 2827.98,-180 2827.98,0 3148.02,0 3148.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="2925.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- operationsconsole&#45;&gt;processexecutionresource -->
<g id="edge12" class="edge">
<title>operationsconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3945.08,-1736.19C3824.7,-1682.29 3660.05,-1608.57 3537.42,-1553.66"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3538.6,-1551.31 3530.69,-1550.64 3536.46,-1556.11 3538.6,-1551.31"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3758.6,-1636 3758.6,-1658.8 3871.99,-1658.8 3871.99,-1636 3758.6,-1636"/>
<text xml:space="preserve" text-anchor="start" x="3761.6" y="-1643.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- processdefinitionrepository&#45;&gt;processtaskdefinitionrepository -->
<!-- sourcedefinitionrepository&#45;&gt;readerdefinitionrepository -->
<!-- readerdefinitionrepository&#45;&gt;processexecutionrepository -->
<!-- processtaskdefinitionrepository&#45;&gt;auditeventrepository -->
<!-- auditeventrepository&#45;&gt;db -->
<g id="edge6" class="edge">
<title>auditeventrepository&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1027,-350.8C1027,-298.37 1027,-238.74 1027,-189.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1029.63,-190.19 1027,-182.69 1024.38,-190.19 1029.63,-190.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="863.03,-265.12 863.03,-287.92 1027,-287.92 1027,-265.12 863.03,-265.12"/>
<text xml:space="preserve" text-anchor="start" x="866.03" y="-272.32" font-family="Arial" font-size="14.00" fill="#c9c9c9">Opera sobre PostgreSQL</text>
</g>
<!-- sourceregistry&#45;&gt;sourceproviders -->
<g id="edge26" class="edge">
<title>sourceregistry&#45;&gt;sourceproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2128,-722.93C2128,-679.1 2128,-626.08 2128,-580.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2130.63,-581.07 2128,-573.57 2125.38,-581.07 2130.63,-581.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2128,-640 2128,-662.8 2264.72,-662.8 2264.72,-640 2128,-640"/>
<text xml:space="preserve" text-anchor="start" x="2131" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- readerregistry&#45;&gt;readerproviders -->
<g id="edge27" class="edge">
<title>readerregistry&#45;&gt;readerproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2558,-722.93C2558,-679.1 2558,-626.08 2558,-580.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2560.63,-581.07 2558,-573.57 2555.38,-581.07 2560.63,-581.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2558,-640 2558,-662.8 2694.72,-662.8 2694.72,-640 2558,-640"/>
<text xml:space="preserve" text-anchor="start" x="2561" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskregistry&#45;&gt;taskproviders -->
<g id="edge28" class="edge">
<title>taskregistry&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2879.29,-723.13C2861.06,-697.97 2850.96,-669.37 2861.28,-640 2868.79,-618.6 2880.56,-597.94 2893.96,-579.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2895.92,-580.78 2898.22,-573.18 2891.68,-577.69 2895.92,-580.78"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2861.28,-640 2861.28,-662.8 2998,-662.8 2998,-640 2861.28,-640"/>
<text xml:space="preserve" text-anchor="start" x="2864.28" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskproviders&#45;&gt;db -->
<g id="edge29" class="edge">
<title>taskproviders&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2920.95,-390.85C2882.7,-347 2830.9,-297.84 2773,-270.8 2755.2,-262.49 1632.75,-150.86 1197.17,-107.79"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1197.74,-105.21 1190.02,-107.08 1197.23,-110.43 1197.74,-105.21"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2697.45,-240 2697.45,-262.8 2935.36,-262.8 2935.36,-240 2697.45,-240"/>
<text xml:space="preserve" text-anchor="start" x="2700.45" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert internos</text>
</g>
<!-- taskproviders&#45;&gt;externalapi -->
<g id="edge30" class="edge">
<title>taskproviders&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2988,-391.09C2988,-331.11 2988,-251.85 2988,-189.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2990.63,-190.19 2988,-182.69 2985.38,-190.19 2990.63,-190.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2988,-240 2988,-262.8 3014.99,-262.8 3014.99,-240 2988,-240"/>
<text xml:space="preserve" text-anchor="start" x="2991" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- telemetry&#45;&gt;sourcedefinitionrepository -->
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge13" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3368,-1386.93C3368,-1343.1 3368,-1290.08 3368,-1244.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3370.63,-1245.07 3368,-1237.57 3365.38,-1245.07 3370.63,-1245.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3368,-1304 3368,-1326.8 3481.41,-1326.8 3481.41,-1304 3368,-1304"/>
<text xml:space="preserve" text-anchor="start" x="3371" y="-1311.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecucion</text>
</g>
<!-- processexecutionservice&#45;&gt;jsonconfigurationmapper -->
<g id="edge16" class="edge">
<title>processexecutionservice&#45;&gt;jsonconfigurationmapper</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3208.14,-1133.8C2881.11,-1111.76 2146.85,-1053.73 1913,-964 1877.78,-950.49 1842.84,-929.99 1811.69,-908.44"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1813.55,-906.55 1805.91,-904.39 1810.54,-910.84 1813.55,-906.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2001.23,-972 2001.23,-994.8 2158.99,-994.8 2158.99,-972 2001.23,-972"/>
<text xml:space="preserve" text-anchor="start" x="2004.23" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee configuracion JSON</text>
</g>
<!-- processexecutionservice&#45;&gt;sourceregistry -->
<g id="edge17" class="edge">
<title>processexecutionservice&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3208.42,-1137.16C3001.6,-1123.83 2633.13,-1083.84 2343,-964 2308.86,-949.9 2274.77,-929.65 2244.12,-908.57"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2245.71,-906.48 2238.05,-904.34 2242.7,-910.78 2245.71,-906.48"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2421.62,-972 2421.62,-994.8 2586.36,-994.8 2586.36,-972 2421.62,-972"/>
<text xml:space="preserve" text-anchor="start" x="2424.62" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve SourceProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;readerregistry -->
<g id="edge18" class="edge">
<title>processexecutionservice&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3208.19,-1110.07C3085.38,-1080.73 2913.54,-1032.17 2773,-964 2741.31,-948.63 2709.13,-928.83 2679.67,-908.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2681.17,-906.53 2673.51,-904.43 2678.19,-910.85 2681.17,-906.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2834.31,-972 2834.31,-994.8 3000.61,-994.8 3000.61,-972 2834.31,-972"/>
<text xml:space="preserve" text-anchor="start" x="2837.31" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve ReaderProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;taskregistry -->
<g id="edge19" class="edge">
<title>processexecutionservice&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3259.21,-1054.94C3224.64,-1026.25 3186.45,-994.09 3152,-964 3132.14,-946.66 3111.21,-927.89 3091.19,-909.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3093.12,-907.88 3085.81,-904.77 3089.58,-911.76 3093.12,-907.88"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3186.81,-972 3186.81,-994.8 3337.54,-994.8 3337.54,-972 3186.81,-972"/>
<text xml:space="preserve" text-anchor="start" x="3189.81" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve TaskProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;taskproviders -->
<g id="edge20" class="edge">
<title>processexecutionservice&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3374.46,-1054.91C3374.04,-1027.79 3371.11,-998.23 3363,-972 3314.22,-814.28 3188.32,-668.84 3095.8,-578.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3097.73,-576.25 3090.52,-572.89 3094.06,-580 3097.73,-576.25"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3360.22,-801.4 3360.22,-824.2 3387.21,-824.2 3387.21,-801.4 3360.22,-801.4"/>
<text xml:space="preserve" text-anchor="start" x="3363.22" y="-809.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionservice&#45;&gt;auditservice -->
<g id="edge15" class="edge">
<title>processexecutionservice&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3447.98,-1054.93C3488.26,-1010.18 3537.16,-955.85 3578.33,-910.1"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3580.04,-912.12 3583.11,-904.79 3576.14,-908.61 3580.04,-912.12"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3516.5,-972 3516.5,-994.8 3627.55,-994.8 3627.55,-972 3516.5,-972"/>
<text xml:space="preserve" text-anchor="start" x="3519.5" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- auditservice&#45;&gt;filesystem -->
<g id="edge21" class="edge">
<title>auditservice&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3865,-737.48C4021.15,-679.45 4235.7,-599.72 4383.48,-544.8"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4384.05,-547.39 4390.17,-542.31 4382.22,-542.46 4384.05,-547.39"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3996.14,-639.37 3996.14,-662.17 4128.99,-662.17 4128.99,-639.37 3996.14,-639.37"/>
<text xml:space="preserve" text-anchor="start" x="3999.14" y="-646.57" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- auditservice&#45;&gt;ftp -->
<g id="edge22" class="edge">
<title>auditservice&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3865,-805.82C4091.66,-793.08 4468.5,-753.61 4768,-632 4802.32,-618.07 4836.54,-597.82 4867.26,-576.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4868.7,-578.88 4873.34,-572.43 4865.69,-574.57 4868.7,-578.88"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4259.43,-742.98 4259.43,-765.78 4381.37,-765.78 4381.37,-742.98 4259.43,-742.98"/>
<text xml:space="preserve" text-anchor="start" x="4262.43" y="-750.18" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;sftp -->
<g id="edge23" class="edge">
<title>auditservice&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3865,-800.5C4223.12,-778.27 4958.78,-722.94 5198,-632 5233.26,-618.6 5268.22,-598.14 5299.37,-576.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5300.52,-578.99 5305.15,-572.54 5297.51,-574.7 5300.52,-578.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4470.42,-740.24 4470.42,-763.04 4592.35,-763.04 4592.35,-740.24 4470.42,-740.24"/>
<text xml:space="preserve" text-anchor="start" x="4473.42" y="-747.44" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;restsource -->
<g id="edge24" class="edge">
<title>auditservice&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3865,-806.45C4297.78,-792.79 5307.94,-749.04 5628,-632 5663.82,-618.9 5699.22,-598.29 5730.64,-576.49"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5731.87,-578.84 5736.49,-572.37 5728.84,-574.55 5731.87,-578.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4638.11,-756.5 4638.11,-779.3 4807.54,-779.3 4807.54,-756.5 4638.11,-756.5"/>
<text xml:space="preserve" text-anchor="start" x="4641.11" y="-763.7" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- auditservice&#45;&gt;otel -->
<g id="edge25" class="edge">
<title>auditservice&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3865,-811.04C4366.77,-806.88 5667.6,-781.54 6070,-632 6104.46,-619.19 6138.13,-598.66 6167.83,-576.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="6169.24,-579.05 6173.67,-572.46 6166.1,-574.85 6169.24,-579.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4929.68,-774.79 4929.68,-797.59 5025.94,-797.59 5025.94,-774.79 4929.68,-774.79"/>
<text xml:space="preserve" text-anchor="start" x="4932.68" y="-781.99" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge14" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M6432.91,-480.8C6495.17,-480.8 6566.6,-480.8 6629.81,-480.8"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="6629.77,-483.43 6637.27,-480.8 6629.77,-478.18 6629.77,-483.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="6487.98,-483.8 6487.98,-506.6 6585.02,-506.6 6585.02,-483.8 6487.98,-483.8"/>
<text xml:space="preserve" text-anchor="start" x="6490.98" y="-491" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
<!-- user&#45;&gt;processdesigner -->
<g id="edge7" class="edge">
<title>user&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4529.19,-1718.88C4520.3,-1689.6 4506.46,-1658.75 4485,-1636 4439.14,-1587.37 4376.06,-1553.16 4314.47,-1529.32"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4315.77,-1527.01 4307.83,-1526.81 4313.91,-1531.92 4315.77,-1527.01"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4250.66,-1594.28 4250.66,-1617.08 4437.21,-1617.08 4437.21,-1594.28 4250.66,-1594.28"/>
<text xml:space="preserve" text-anchor="start" x="4253.66" y="-1601.48" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;processdesigner -->
<g id="edge8" class="edge">
<title>admin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4962.43,-1718.99C4953.83,-1688.66 4939.36,-1657.1 4915,-1636 4827.03,-1559.8 4524.54,-1516.61 4315.2,-1495.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4315.73,-1492.63 4308.01,-1494.48 4315.2,-1497.85 4315.73,-1492.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4417.27,-1545.06 4417.27,-1567.86 4660.63,-1567.86 4660.63,-1545.06 4417.27,-1545.06"/>
<text xml:space="preserve" text-anchor="start" x="4420.27" y="-1552.26" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge9" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M5393.42,-1719C5384.94,-1688.29 5370.29,-1656.48 5345,-1636 5191.22,-1511.43 4627.2,-1484.06 4315.52,-1478.62"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4315.57,-1475.99 4308.02,-1478.49 4315.48,-1481.24 4315.57,-1475.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4681.94,-1512.64 4681.94,-1535.44 4889.48,-1535.44 4889.48,-1512.64 4681.94,-1512.64"/>
<text xml:space="preserve" text-anchor="start" x="4684.94" y="-1519.84" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;processdesigner -->
<g id="edge10" class="edge">
<title>operator&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M5823.89,-1719.01C5815.47,-1688.11 5800.74,-1656.17 5775,-1636 5662.36,-1547.75 4738.37,-1501.76 4315.21,-1485.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4315.62,-1482.55 4308.02,-1484.88 4315.42,-1487.79 4315.62,-1482.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="5048.17,-1533.71 5048.17,-1556.51 5161.56,-1556.51 5161.56,-1533.71 5048.17,-1533.71"/>
<text xml:space="preserve" text-anchor="start" x="5051.17" y="-1540.91" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;processdesigner -->
<g id="edge11" class="edge">
<title>auditor&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M6254.22,-1719.19C6245.85,-1688.12 6231.06,-1656.01 6205,-1636 6057.5,-1522.7 4817.75,-1489.57 4315.27,-1480.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4315.57,-1478.12 4308.03,-1480.61 4315.48,-1483.37 4315.57,-1478.12"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="5195.04,-1519.19 5195.04,-1541.99 5393.26,-1541.99 5393.26,-1519.19 5195.04,-1519.19"/>
<text xml:space="preserve" text-anchor="start" x="5198.04" y="-1526.39" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
</g>
</svg>
`;case"package_structure_code":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2317pt" height="1713pt"
 viewBox="0.00 0.00 2317.00 1713.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1697.85)">
<g id="clust1" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#26402b" stroke="#1a2b1e" points="8,-8 8,-1674.8 2279,-1674.8 2279,-8 8,-8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1661.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_packages</title>
<polygon fill="#1a468d" stroke="#1c3979" points="40,-40 40,-1621.6 2247,-1621.6 2247,-40 40,-40"/>
<text xml:space="preserve" text-anchor="start" x="48" y="-1608.7" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">PACKAGE STRUCTURE</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_providerpackage</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="80,-685.6 80,-966.8 1340,-966.8 1340,-685.6 80,-685.6"/>
<text xml:space="preserve" text-anchor="start" x="88" y="-953.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">PROVIDER</text>
</g>
<!-- providersourcepackage -->
<g id="node1" class="node">
<title>providersourcepackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="870.02,-905.6 549.98,-905.6 549.98,-725.6 870.02,-725.6 870.02,-905.6"/>
<text xml:space="preserve" text-anchor="start" x="641.08" y="-809.6" font-family="Arial" font-size="20.00" fill="#eff6ff">provider.source</text>
</g>
<!-- providerreaderpackage -->
<g id="node2" class="node">
<title>providerreaderpackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="440.02,-905.6 119.98,-905.6 119.98,-725.6 440.02,-725.6 440.02,-905.6"/>
<text xml:space="preserve" text-anchor="start" x="212.19" y="-809.6" font-family="Arial" font-size="20.00" fill="#eff6ff">provider.reader</text>
</g>
<!-- providertaskpackage -->
<g id="node3" class="node">
<title>providertaskpackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1300.02,-905.6 979.98,-905.6 979.98,-725.6 1300.02,-725.6 1300.02,-905.6"/>
<text xml:space="preserve" text-anchor="start" x="1082.75" y="-809.6" font-family="Arial" font-size="20.00" fill="#eff6ff">provider.task</text>
</g>
<!-- apipackage -->
<g id="node4" class="node">
<title>apipackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2029.02,-1560.4 1708.98,-1560.4 1708.98,-1380.4 2029.02,-1380.4 2029.02,-1560.4"/>
<text xml:space="preserve" text-anchor="start" x="1855.66" y="-1464.4" font-family="Arial" font-size="20.00" fill="#eff6ff">api</text>
</g>
<!-- apiquerypackage -->
<g id="node5" class="node">
<title>apiquerypackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1744.02,-1237.6 1423.98,-1237.6 1423.98,-1057.6 1744.02,-1057.6 1744.02,-1237.6"/>
<text xml:space="preserve" text-anchor="start" x="1542.86" y="-1141.6" font-family="Arial" font-size="20.00" fill="#eff6ff">api.query</text>
</g>
<!-- servicepackage -->
<g id="node6" class="node">
<title>servicepackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1988.02,-905.6 1667.98,-905.6 1667.98,-725.6 1988.02,-725.6 1988.02,-905.6"/>
<text xml:space="preserve" text-anchor="start" x="1796.33" y="-809.6" font-family="Arial" font-size="20.00" fill="#eff6ff">service</text>
</g>
<!-- repositorypackage -->
<g id="node7" class="node">
<title>repositorypackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1777.02,-582.8 1456.98,-582.8 1456.98,-402.8 1777.02,-402.8 1777.02,-582.8"/>
<text xml:space="preserve" text-anchor="start" x="1573.09" y="-486.8" font-family="Arial" font-size="20.00" fill="#eff6ff">repository</text>
</g>
<!-- spipackage -->
<g id="node8" class="node">
<title>spipackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="941.02,-582.8 620.98,-582.8 620.98,-402.8 941.02,-402.8 941.02,-582.8"/>
<text xml:space="preserve" text-anchor="start" x="768.22" y="-486.8" font-family="Arial" font-size="20.00" fill="#eff6ff">spi</text>
</g>
<!-- domainpackage -->
<g id="node9" class="node">
<title>domainpackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2207.02,-582.8 1886.98,-582.8 1886.98,-402.8 2207.02,-402.8 2207.02,-582.8"/>
<text xml:space="preserve" text-anchor="start" x="2014.2" y="-486.8" font-family="Arial" font-size="20.00" fill="#eff6ff">domain</text>
</g>
<!-- entitypackage -->
<g id="node10" class="node">
<title>entitypackage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1777.02,-260 1456.98,-260 1456.98,-80 1777.02,-80 1777.02,-260"/>
<text xml:space="preserve" text-anchor="start" x="1593.1" y="-164" font-family="Arial" font-size="20.00" fill="#eff6ff">entity</text>
</g>
<!-- providersourcepackage&#45;&gt;spipackage -->
<g id="edge1" class="edge">
<title>providersourcepackage&#45;&gt;spipackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M561.98,-725.73C510.56,-694.69 465.32,-667.09 464.48,-665.6 459.51,-656.77 459.05,-651.36 464.48,-642.8 497.7,-590.44 554.76,-556.15 611.37,-533.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="612.29,-536.3 618.36,-531.17 610.42,-531.39 612.29,-536.3"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="464.48,-642.8 464.48,-665.6 644,-665.6 644,-642.8 464.48,-642.8"/>
<text xml:space="preserve" text-anchor="start" x="467.48" y="-650" font-family="Arial" font-size="14.00" fill="#c9c9c9">Implementa SourceProvider</text>
</g>
<!-- providerreaderpackage&#45;&gt;spipackage -->
<g id="edge2" class="edge">
<title>providerreaderpackage&#45;&gt;spipackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M241.38,-726.02C234.84,-697.1 235.06,-666.39 252.92,-642.8 296.49,-585.23 473.61,-543.6 610.85,-519.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="611.16,-521.82 618.09,-517.94 610.25,-516.65 611.16,-521.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="252.92,-642.8 252.92,-665.6 434,-665.6 434,-642.8 252.92,-642.8"/>
<text xml:space="preserve" text-anchor="start" x="255.92" y="-650" font-family="Arial" font-size="14.00" fill="#c9c9c9">Implementa ReaderProvider</text>
</g>
<!-- providertaskpackage&#45;&gt;repositorypackage -->
<g id="edge3" class="edge">
<title>providertaskpackage&#45;&gt;repositorypackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1046.49,-725.64C1028.38,-698.09 1020.38,-668.3 1040.13,-642.8 1089.82,-578.65 1295.28,-537.16 1446.91,-514.66"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1447.24,-517.26 1454.28,-513.58 1446.48,-512.07 1447.24,-517.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1040.13,-642.8 1040.13,-665.6 1208,-665.6 1208,-642.8 1040.13,-642.8"/>
<text xml:space="preserve" text-anchor="start" x="1043.13" y="-650" font-family="Arial" font-size="14.00" fill="#c9c9c9">Colabora con persistencia</text>
</g>
<!-- providertaskpackage&#45;&gt;spipackage -->
<g id="edge4" class="edge">
<title>providertaskpackage&#45;&gt;spipackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1011.53,-725.73C984,-710.11 954.34,-695.66 925,-685.6 889.96,-673.58 784.07,-693.32 759.5,-665.6 741.82,-645.65 738.96,-618.91 742.79,-592.48"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="745.33,-593.2 744.04,-585.36 740.16,-592.29 745.33,-593.2"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="759.5,-642.8 759.5,-665.6 925,-665.6 925,-642.8 759.5,-642.8"/>
<text xml:space="preserve" text-anchor="start" x="762.5" y="-650" font-family="Arial" font-size="14.00" fill="#c9c9c9">Implementa TaskProvider</text>
</g>
<!-- providertaskpackage&#45;&gt;domainpackage -->
<g id="edge5" class="edge">
<title>providertaskpackage&#45;&gt;domainpackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1212.52,-725.95C1243.16,-694.48 1281.37,-662.11 1322.83,-642.8 1529.39,-546.61 1611.5,-640.25 1832,-582.8 1846.91,-578.91 1862.15,-574.21 1877.29,-569.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1878.16,-571.5 1884.37,-566.54 1876.42,-566.54 1878.16,-571.5"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1322.83,-642.8 1322.83,-665.6 1451,-665.6 1451,-642.8 1322.83,-642.8"/>
<text xml:space="preserve" text-anchor="start" x="1325.83" y="-650" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa estados y tipos</text>
</g>
<!-- apipackage&#45;&gt;apiquerypackage -->
<g id="edge6" class="edge">
<title>apipackage&#45;&gt;apiquerypackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1789.99,-1380.47C1752.62,-1338.4 1707.92,-1288.08 1669.72,-1245.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1671.87,-1243.56 1664.93,-1239.69 1667.95,-1247.04 1671.87,-1243.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1735.05,-1297.6 1735.05,-1320.4 1912.23,-1320.4 1912.23,-1297.6 1735.05,-1297.6"/>
<text xml:space="preserve" text-anchor="start" x="1738.05" y="-1304.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Expone DTOs y respuestas</text>
</g>
<!-- apipackage&#45;&gt;servicepackage -->
<g id="edge7" class="edge">
<title>apipackage&#45;&gt;servicepackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1924.2,-1380.48C1935.02,-1354.53 1942.19,-1325.6 1939,-1297.6 1923.71,-1163.34 1885.15,-1012 1857.78,-915.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1860.33,-914.93 1855.75,-908.43 1855.28,-916.37 1860.33,-914.93"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1929.86,-1136.2 1929.86,-1159 2035.45,-1159 2035.45,-1136.2 1929.86,-1136.2"/>
<text xml:space="preserve" text-anchor="start" x="1932.86" y="-1143.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca servicios</text>
</g>
<!-- apiquerypackage&#45;&gt;servicepackage -->
<g id="edge8" class="edge">
<title>apiquerypackage&#45;&gt;servicepackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1649.71,-1057.73C1682.6,-1013.25 1722.47,-959.32 1756.17,-913.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1758.24,-915.37 1760.59,-907.77 1754.02,-912.24 1758.24,-915.37"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1706,-974.8 1706,-997.6 1834.95,-997.6 1834.95,-974.8 1706,-974.8"/>
<text xml:space="preserve" text-anchor="start" x="1709" y="-982" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consume consultas</text>
</g>
<!-- servicepackage&#45;&gt;repositorypackage -->
<g id="edge9" class="edge">
<title>servicepackage&#45;&gt;repositorypackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1769.5,-725.67C1742.06,-683.94 1709.29,-634.11 1681.17,-591.36"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1683.4,-589.98 1677.09,-585.16 1679.02,-592.87 1683.4,-589.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1728.83,-642.8 1728.83,-665.6 1871.79,-665.6 1871.79,-642.8 1728.83,-642.8"/>
<text xml:space="preserve" text-anchor="start" x="1731.83" y="-650" font-family="Arial" font-size="14.00" fill="#c9c9c9">Accede a persistencia</text>
</g>
<!-- servicepackage&#45;&gt;spipackage -->
<g id="edge10" class="edge">
<title>servicepackage&#45;&gt;spipackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1668.01,-726.86C1608.44,-696.91 1539.39,-665.33 1474,-642.8 1300.16,-582.9 1093.17,-542.17 950.95,-518.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="951.64,-516.08 943.81,-517.46 950.79,-521.26 951.64,-516.08"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1534.16,-642.8 1534.16,-665.6 1659.23,-665.6 1659.23,-642.8 1534.16,-642.8"/>
<text xml:space="preserve" text-anchor="start" x="1537.16" y="-650" font-family="Arial" font-size="14.00" fill="#c9c9c9">Orquesta contratos</text>
</g>
<!-- servicepackage&#45;&gt;domainpackage -->
<g id="edge11" class="edge">
<title>servicepackage&#45;&gt;domainpackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1888.71,-725.67C1917.25,-683.86 1951.35,-633.91 1980.58,-591.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1982.59,-592.8 1984.65,-585.13 1978.26,-589.84 1982.59,-592.8"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1944.07,-642.8 1944.07,-665.6 2065.22,-665.6 2065.22,-642.8 1944.07,-642.8"/>
<text xml:space="preserve" text-anchor="start" x="1947.07" y="-650" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa enums y tipos</text>
</g>
<!-- repositorypackage&#45;&gt;entitypackage -->
<g id="edge12" class="edge">
<title>repositorypackage&#45;&gt;entitypackage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1617,-402.87C1617,-361.67 1617,-312.56 1617,-270.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1619.63,-270.36 1617,-262.86 1614.38,-270.36 1619.63,-270.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1617,-320 1617,-342.8 1738.18,-342.8 1738.18,-320 1617,-320"/>
<text xml:space="preserve" text-anchor="start" x="1620" y="-327.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste entidades</text>
</g>
</g>
</svg>
`;case"domain_entities_code":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2320pt" height="1409pt"
 viewBox="0.00 0.00 2320.00 1409.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1394.45)">
<g id="clust1" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#26402b" stroke="#1a2b1e" points="8,-249 8,-1371.4 2282,-1371.4 2282,-249 8,-249"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1358.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_domainentities</title>
<polygon fill="#866714" stroke="#6e5615" points="40,-281 40,-1318.2 2250,-1318.2 2250,-281 40,-281"/>
<text xml:space="preserve" text-anchor="start" x="48" y="-1305.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#5f3a00" fill-opacity="0.701961">DOMAIN ENTITIES</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_catalogentities</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="80,-643.8 80,-1257 1340,-1257 1340,-643.8 80,-643.8"/>
<text xml:space="preserve" text-anchor="start" x="88" y="-1244.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">CATALOG</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_executionentities</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="1380,-321 1380,-925 2210,-925 2210,-321 1380,-321"/>
<text xml:space="preserve" text-anchor="start" x="1388" y="-912.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">EXECUTION</text>
</g>
<!-- sourcedefinitionentity -->
<g id="node1" class="node">
<title>sourcedefinitionentity</title>
<polygon fill="#fec119" stroke="#e2a90c" stroke-width="0" points="440.02,-1195.8 119.98,-1195.8 119.98,-1015.8 440.02,-1015.8 440.02,-1195.8"/>
<text xml:space="preserve" text-anchor="start" x="206.63" y="-1099.8" font-family="Arial" font-size="20.00" fill="#4d2a00">SourceDefinition</text>
</g>
<!-- readerdefinitionentity -->
<g id="node2" class="node">
<title>readerdefinitionentity</title>
<polygon fill="#fec119" stroke="#e2a90c" stroke-width="0" points="870.02,-1195.8 549.98,-1195.8 549.98,-1015.8 870.02,-1015.8 870.02,-1195.8"/>
<text xml:space="preserve" text-anchor="start" x="635.51" y="-1099.8" font-family="Arial" font-size="20.00" fill="#4d2a00">ReaderDefinition</text>
</g>
<!-- processdefinitionentity -->
<g id="node3" class="node">
<title>processdefinitionentity</title>
<polygon fill="#fec119" stroke="#e2a90c" stroke-width="0" points="1300.02,-1195.8 979.98,-1195.8 979.98,-1015.8 1300.02,-1015.8 1300.02,-1195.8"/>
<text xml:space="preserve" text-anchor="start" x="1062.19" y="-1099.8" font-family="Arial" font-size="20.00" fill="#4d2a00">ProcessDefinition</text>
</g>
<!-- processtaskdefinitionentity -->
<g id="node4" class="node">
<title>processtaskdefinitionentity</title>
<polygon fill="#fec119" stroke="#e2a90c" stroke-width="0" points="870.02,-863.8 549.98,-863.8 549.98,-683.8 870.02,-683.8 870.02,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="610.52" y="-767.8" font-family="Arial" font-size="20.00" fill="#4d2a00">ProcessTaskDefinition</text>
</g>
<!-- processexecutionentity -->
<g id="node5" class="node">
<title>processexecutionentity</title>
<polygon fill="#fec119" stroke="#e2a90c" stroke-width="0" points="1740.02,-863.8 1419.98,-863.8 1419.98,-683.8 1740.02,-683.8 1740.02,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="1499.96" y="-767.8" font-family="Arial" font-size="20.00" fill="#4d2a00">ProcessExecution</text>
</g>
<!-- processtaskexecutionentity -->
<g id="node6" class="node">
<title>processtaskexecutionentity</title>
<polygon fill="#fec119" stroke="#e2a90c" stroke-width="0" points="1740.02,-541 1419.98,-541 1419.98,-361 1740.02,-361 1740.02,-541"/>
<text xml:space="preserve" text-anchor="start" x="1478.29" y="-445" font-family="Arial" font-size="20.00" fill="#4d2a00">ProcessTaskExecution</text>
</g>
<!-- auditevententity -->
<g id="node7" class="node">
<title>auditevententity</title>
<polygon fill="#fec119" stroke="#e2a90c" stroke-width="0" points="2170.02,-541 1849.98,-541 1849.98,-361 2170.02,-361 2170.02,-541"/>
<text xml:space="preserve" text-anchor="start" x="1961.64" y="-445" font-family="Arial" font-size="20.00" fill="#4d2a00">AuditEvent</text>
</g>
<!-- db -->
<g id="node8" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2170.02,-180 1849.98,-180 1849.98,0 2170.02,0 2170.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="1955.53" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- sourcedefinitionentity&#45;&gt;processtaskdefinitionentity -->
<g id="edge1" class="edge">
<title>sourcedefinitionentity&#45;&gt;processtaskdefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M395.8,-1015.93C454.72,-970.71 526.37,-915.73 586.36,-869.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="587.62,-872.03 591.97,-865.38 584.42,-867.87 587.62,-872.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="495,-933 495,-955.8 619.28,-955.8 619.28,-933 495,-933"/>
<text xml:space="preserve" text-anchor="start" x="498" y="-940.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..n taskDefinitions</text>
</g>
<!-- readerdefinitionentity&#45;&gt;processtaskdefinitionentity -->
<g id="edge2" class="edge">
<title>readerdefinitionentity&#45;&gt;processtaskdefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M710,-1015.93C710,-972.1 710,-919.08 710,-873.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="712.63,-874.07 710,-866.57 707.38,-874.07 712.63,-874.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="710,-933 710,-955.8 834.28,-955.8 834.28,-933 710,-933"/>
<text xml:space="preserve" text-anchor="start" x="713" y="-940.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..n taskDefinitions</text>
</g>
<!-- processdefinitionentity&#45;&gt;processtaskdefinitionentity -->
<g id="edge3" class="edge">
<title>processdefinitionentity&#45;&gt;processtaskdefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1024.2,-1015.93C965.28,-970.71 893.63,-915.73 833.64,-869.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="835.58,-867.87 828.03,-865.38 832.38,-872.03 835.58,-867.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="937.89,-933 937.89,-955.8 1062.18,-955.8 1062.18,-933 937.89,-933"/>
<text xml:space="preserve" text-anchor="start" x="940.89" y="-940.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..n taskDefinitions</text>
</g>
<!-- processdefinitionentity&#45;&gt;processexecutionentity -->
<g id="edge4" class="edge">
<title>processdefinitionentity&#45;&gt;processexecutionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1258.49,-1015.93C1318.78,-970.71 1392.1,-915.73 1453.49,-869.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1454.83,-871.96 1459.26,-865.36 1451.68,-867.76 1454.83,-871.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1360,-933 1360,-955.8 1510.74,-955.8 1510.74,-933 1360,-933"/>
<text xml:space="preserve" text-anchor="start" x="1363" y="-940.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..n processExecutions</text>
</g>
<!-- processtaskdefinitionentity&#45;&gt;processtaskexecutionentity -->
<g id="edge5" class="edge">
<title>processtaskdefinitionentity&#45;&gt;processtaskexecutionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M837.94,-683.91C884.95,-654.29 939.66,-623.22 992.6,-601 1128.01,-544.18 1290.37,-505.02 1410.05,-481.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1410.22,-483.81 1417.07,-479.78 1409.21,-478.66 1410.22,-483.81"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="992.6,-601 992.6,-623.8 1120,-623.8 1120,-601 992.6,-601"/>
<text xml:space="preserve" text-anchor="start" x="995.6" y="-608.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..n taskExecutions</text>
</g>
<!-- processtaskdefinitionentity&#45;&gt;auditevententity -->
<g id="edge6" class="edge">
<title>processtaskdefinitionentity&#45;&gt;auditevententity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M869.98,-732.63C1018.79,-695.95 1246.95,-641.44 1446.6,-601 1600.6,-569.81 1644.06,-584.65 1795,-541 1810.02,-536.66 1825.42,-531.59 1840.74,-526.12"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1841.26,-528.72 1847.41,-523.7 1839.46,-523.79 1841.26,-528.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1446.6,-601 1446.6,-623.8 1553,-623.8 1553,-601 1446.6,-601"/>
<text xml:space="preserve" text-anchor="start" x="1449.6" y="-608.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..n auditEvents</text>
</g>
<!-- processexecutionentity&#45;&gt;processtaskexecutionentity -->
<g id="edge7" class="edge">
<title>processexecutionentity&#45;&gt;processtaskexecutionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1580,-683.87C1580,-642.67 1580,-593.56 1580,-551.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1582.63,-551.36 1580,-543.86 1577.38,-551.36 1582.63,-551.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1580,-601 1580,-623.8 1707.4,-623.8 1707.4,-601 1580,-601"/>
<text xml:space="preserve" text-anchor="start" x="1583" y="-608.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..n taskExecutions</text>
</g>
<!-- processexecutionentity&#45;&gt;auditevententity -->
<g id="edge8" class="edge">
<title>processexecutionentity&#45;&gt;auditevententity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1699.21,-683.87C1756.3,-641.27 1824.72,-590.23 1882.81,-546.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1884.07,-549.23 1888.51,-542.64 1880.93,-545.02 1884.07,-549.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1807.89,-601 1807.89,-623.8 1914.29,-623.8 1914.29,-601 1807.89,-601"/>
<text xml:space="preserve" text-anchor="start" x="1810.89" y="-608.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..n auditEvents</text>
</g>
<!-- auditevententity&#45;&gt;db -->
<g id="edge9" class="edge">
<title>auditevententity&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2010,-249C2010,-228.66 2010,-208.7 2010,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2012.63,-190.49 2010,-182.99 2007.38,-190.49 2012.63,-190.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1771.32,-214.31 1771.32,-253.91 2010,-253.91 2010,-214.31 1771.32,-214.31"/>
<text xml:space="preserve" text-anchor="start" x="1774.32" y="-238.31" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="1774.32" y="-221.51" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
</g>
</svg>
`;case"security_overview":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2118pt" height="843pt"
 viewBox="0.00 0.00 2118.00 843.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 828.05)">
<g id="clust1" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="8,-282.8 8,-564 838,-564 838,-282.8 8,-282.8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-551.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="876,-290.8 876,-556 1260,-556 1260,-290.8 876,-290.8"/>
<text xml:space="preserve" text-anchor="start" x="884" y="-543.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE APP (FRONT)</text>
</g>
<!-- processdefinitionresource -->
<g id="node1" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="368.02,-502.8 47.98,-502.8 47.98,-322.8 368.02,-322.8 368.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="87.39" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- processexecutionresource -->
<g id="node2" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-502.8 477.98,-502.8 477.98,-322.8 798.02,-322.8 798.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="515.16" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- oidcclient -->
<g id="node3" class="node">
<title>oidcclient</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-502.8 907.98,-502.8 907.98,-322.8 1228.02,-322.8 1228.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1014.66" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OIDC Client</text>
</g>
<!-- platformadmin -->
<g id="node4" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="322.02,-180 1.98,-180 1.98,0 322.02,0 322.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="93.65" y="-84" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- iam -->
<g id="node5" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="798.02,-180 477.98,-180 477.98,0 798.02,0 798.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="597.42" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- user -->
<g id="node6" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="368.02,-813 47.98,-813 47.98,-633 368.02,-633 368.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="121.83" y="-717" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node7" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="798.02,-813 477.98,-813 477.98,-633 798.02,-633 798.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="500.15" y="-717" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node8" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1228.02,-813 907.98,-813 907.98,-633 1228.02,-633 1228.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="989.62" y="-717" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node9" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1658.02,-813 1337.98,-813 1337.98,-633 1658.02,-633 1658.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="1458.54" y="-717" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node10" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2088.02,-813 1767.98,-813 1767.98,-633 2088.02,-633 2088.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="1896.32" y="-717" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- processexecutionresource&#45;&gt;iam -->
<g id="edge8" class="edge">
<title>processexecutionresource&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M638,-282.8C638,-251.93 638,-219.45 638,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="640.63,-190.36 638,-182.86 635.38,-190.36 640.63,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="500.48,-231.13 500.48,-253.93 638,-253.93 638,-231.13 500.48,-231.13"/>
<text xml:space="preserve" text-anchor="start" x="503.48" y="-238.33" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- oidcclient&#45;&gt;iam -->
<g id="edge7" class="edge">
<title>oidcclient&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M948.79,-322.87C891.7,-280.27 823.28,-229.23 765.19,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="767.07,-184.02 759.49,-181.64 763.93,-188.23 767.07,-184.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="865.89,-240 865.89,-262.8 1002.64,-262.8 1002.64,-240 865.89,-240"/>
<text xml:space="preserve" text-anchor="start" x="868.89" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Login y refresh token</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge1" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M321.83,-90C368.75,-90 420.24,-90 467.79,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="467.66,-92.63 475.16,-90 467.66,-87.38 467.66,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="376.77,-93 376.77,-115.8 423.23,-115.8 423.23,-93 376.77,-93"/>
<text xml:space="preserve" text-anchor="start" x="379.77" y="-100.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
</g>
<!-- user&#45;&gt;oidcclient -->
<g id="edge2" class="edge">
<title>user&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M367.96,-650.94C386.3,-644.25 404.91,-638.08 423,-633 446.93,-626.28 842.07,-573.59 865,-564 867.77,-562.84 870.54,-561.64 873.3,-560.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="874.25,-562.85 879.93,-557.28 872.02,-558.09 874.25,-562.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="438.84,-602.33 438.84,-625.13 625.39,-625.13 625.39,-602.33 438.84,-602.33"/>
<text xml:space="preserve" text-anchor="start" x="441.84" y="-609.53" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;oidcclient -->
<g id="edge3" class="edge">
<title>admin&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M767.21,-633.03C799.29,-610.67 833.5,-586.61 865,-564 865.92,-563.34 866.84,-562.68 867.76,-562.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="869.11,-564.28 873.66,-557.77 866.04,-560.02 869.11,-564.28"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="578.38,-571.99 578.38,-594.79 821.73,-594.79 821.73,-571.99 578.38,-571.99"/>
<text xml:space="preserve" text-anchor="start" x="581.38" y="-579.19" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;oidcclient -->
<g id="edge4" class="edge">
<title>integrationadmin&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1068,-633.27C1068,-612.32 1068,-589.39 1068,-566.5"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1070.63,-566.52 1068,-559.02 1065.38,-566.52 1070.63,-566.52"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="860.46,-594.81 860.46,-617.61 1068,-617.61 1068,-594.81 860.46,-594.81"/>
<text xml:space="preserve" text-anchor="start" x="863.46" y="-602.01" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;oidcclient -->
<g id="edge5" class="edge">
<title>operator&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1373.91,-633.06C1340.83,-609.35 1304.22,-583.11 1268.16,-557.27"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1270.08,-555.41 1262.46,-553.18 1267.02,-559.68 1270.08,-555.41"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1203.32,-592.07 1203.32,-614.87 1316.72,-614.87 1316.72,-592.07 1203.32,-592.07"/>
<text xml:space="preserve" text-anchor="start" x="1206.32" y="-599.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;oidcclient -->
<g id="edge6" class="edge">
<title>auditor&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1768.2,-654.51C1749.66,-647.08 1730.96,-639.76 1713,-633 1565.88,-577.62 1397.65,-520.65 1269.9,-478.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1270.82,-476.22 1262.87,-476.37 1269.18,-481.21 1270.82,-476.22"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1316.97,-561.57 1316.97,-584.37 1515.19,-584.37 1515.19,-561.57 1316.97,-561.57"/>
<text xml:space="preserve" text-anchor="start" x="1319.97" y="-568.77" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
</g>
</svg>
`;case"deployment_dev":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1430pt" height="1523pt"
 viewBox="0.00 0.00 1430.00 1523.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1508.25)">
<g id="clust1" class="cluster">
<title>cluster_app</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="476,-766 476,-1485.2 960,-1485.2 960,-766 476,-766"/>
<text xml:space="preserve" text-anchor="start" x="484" y="-1472.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">APP</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_dockerhost</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="508,-798 508,-1432 928,-1432 928,-798 508,-798"/>
<text xml:space="preserve" text-anchor="start" x="516" y="-1419.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">DOCKERHOST</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_data</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="8,-8 8,-727.2 1392,-727.2 1392,-8 8,-8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-714.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">DATA</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_data_1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="40,-40 40,-674 1360,-674 1360,-40 40,-40"/>
<text xml:space="preserve" text-anchor="start" x="48" y="-661.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">DATA</text>
</g>
<!-- adminconsole -->
<g id="node1" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="878.02,-1360.8 557.98,-1360.8 557.98,-1180.8 878.02,-1180.8 878.02,-1360.8"/>
<text xml:space="preserve" text-anchor="start" x="596.84" y="-1264.8" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="878.02,-1028 557.98,-1028 557.98,-848 878.02,-848 878.02,-1028"/>
<text xml:space="preserve" text-anchor="start" x="592.39" y="-932" font-family="Arial" font-size="20.00" fill="#f8fafc">App Service Quarkus Native</text>
</g>
<!-- iam -->
<g id="node3" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1310.02,-602.8 989.98,-602.8 989.98,-422.8 1310.02,-422.8 1310.02,-602.8"/>
<text xml:space="preserve" text-anchor="start" x="1109.42" y="-506.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- db -->
<g id="node4" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="410.02,-602.8 89.98,-602.8 89.98,-422.8 410.02,-422.8 410.02,-602.8"/>
<text xml:space="preserve" text-anchor="start" x="195.53" y="-506.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- otel -->
<g id="node5" class="node">
<title>otel</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="860.02,-602.8 539.98,-602.8 539.98,-422.8 860.02,-422.8 860.02,-602.8"/>
<text xml:space="preserve" text-anchor="start" x="588.85" y="-506.8" font-family="Arial" font-size="20.00" fill="#f8fafc">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node6" class="node">
<title>jaeger</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="860.02,-270 539.98,-270 539.98,-90 860.02,-90 860.02,-270"/>
<text xml:space="preserve" text-anchor="start" x="669.42" y="-174" font-family="Arial" font-size="20.00" fill="#f8fafc">Jaeger</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge1" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M718,-1181.15C718,-1137.12 718,-1083.76 718,-1038.35"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="720.63,-1038.42 718,-1030.92 715.38,-1038.42 720.63,-1038.42"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="718,-1093 718,-1115.8 744.99,-1115.8 744.99,-1093 718,-1093"/>
<text xml:space="preserve" text-anchor="start" x="721" y="-1101.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge3" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M812.25,-1180.98C855.33,-1137.42 905.08,-1082.65 943,-1028 1019.48,-917.77 1028.84,-882.83 1078,-758 1096.45,-711.16 1112.73,-657.67 1125.12,-612.71"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1127.63,-613.51 1127.07,-605.58 1122.56,-612.13 1127.63,-613.51"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1074.78,-926.6 1074.78,-949.4 1101.77,-949.4 1101.77,-926.6 1074.78,-926.6"/>
<text xml:space="preserve" text-anchor="start" x="1077.78" y="-934.8" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M795.22,-848.05C829.35,-811.14 871.08,-769.12 912.48,-735.2 917.59,-731.02 919.8,-731.27 925,-727.2 970.61,-691.52 1017.61,-648.16 1056.78,-609.86"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1058.33,-612.02 1061.84,-604.89 1054.65,-608.27 1058.33,-612.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="912.48,-735.2 912.48,-758 1050,-758 1050,-735.2 912.48,-735.2"/>
<text xml:space="preserve" text-anchor="start" x="915.48" y="-742.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge4" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M613.01,-848.21C569.85,-811.24 519.63,-767.59 475,-727.2 433.19,-689.36 387.94,-646.77 349.05,-609.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="351.29,-608.15 344.05,-604.87 347.66,-611.95 351.29,-608.15"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="507.51,-735.2 507.51,-758 534.5,-758 534.5,-735.2 507.51,-735.2"/>
<text xml:space="preserve" text-anchor="start" x="510.51" y="-743.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge6" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M694.6,-848.4C688.11,-819.76 681.96,-787.73 678.74,-758 673.57,-710.31 677.07,-657.27 682.62,-612.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="685.19,-613.4 683.56,-605.63 679.99,-612.72 685.19,-613.4"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="678.74,-735.2 678.74,-758 775,-758 775,-735.2 678.74,-735.2"/>
<text xml:space="preserve" text-anchor="start" x="681.74" y="-742.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge2" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M700,-423.15C700,-379.12 700,-325.76 700,-280.35"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="702.63,-280.42 700,-272.92 697.38,-280.42 702.63,-280.42"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="700,-335 700,-357.8 797.05,-357.8 797.05,-335 700,-335"/>
<text xml:space="preserve" text-anchor="start" x="703" y="-342.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
</g>
</svg>
`;case"deployment_pre":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1951pt" height="1548pt"
 viewBox="0.00 0.00 1951.00 1548.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1533.25)">
<g id="clust1" class="cluster">
<title>cluster_services</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="8,-1123.8 8,-1510.2 984,-1510.2 984,-1123.8 8,-1123.8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1497.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">SERVICES</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_confignode</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="40,-1155.8 40,-1457 952,-1457 952,-1155.8 40,-1155.8"/>
<text xml:space="preserve" text-anchor="start" x="48" y="-1444.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">CONFIGNODE</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_app</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="992,-766 992,-1510.2 1476,-1510.2 1476,-766 992,-766"/>
<text xml:space="preserve" text-anchor="start" x="1000" y="-1497.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">APP</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_prenode1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1024,-798 1024,-1457 1444,-1457 1444,-798 1024,-798"/>
<text xml:space="preserve" text-anchor="start" x="1032" y="-1444.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">PRENODE1</text>
</g>
<g id="clust5" class="cluster">
<title>cluster_data</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="529,-8 529,-727.2 1913,-727.2 1913,-8 529,-8"/>
<text xml:space="preserve" text-anchor="start" x="537" y="-714.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">DATA</text>
</g>
<g id="clust6" class="cluster">
<title>cluster_data_1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="561,-40 561,-674 1881,-674 1881,-40 561,-40"/>
<text xml:space="preserve" text-anchor="start" x="569" y="-661.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">DATA</text>
</g>
<!-- vault -->
<g id="node1" class="node">
<title>vault</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="451.59,-1385.8 90.41,-1385.8 90.41,-1205.8 451.59,-1205.8 451.59,-1385.8"/>
<text xml:space="preserve" text-anchor="start" x="106.47" y="-1289.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Kubernetes Secrets / External Config</text>
</g>
<!-- sharedstorage -->
<g id="node2" class="node">
<title>sharedstorage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="902.02,-1385.8 581.98,-1385.8 581.98,-1205.8 902.02,-1205.8 902.02,-1385.8"/>
<text xml:space="preserve" text-anchor="start" x="653.06" y="-1289.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared File Storage</text>
</g>
<!-- adminconsole -->
<g id="node3" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1394.02,-1385.8 1073.98,-1385.8 1073.98,-1205.8 1394.02,-1205.8 1394.02,-1385.8"/>
<text xml:space="preserve" text-anchor="start" x="1112.84" y="-1289.8" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- quarkusapp -->
<g id="node4" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1394.02,-1028 1073.98,-1028 1073.98,-848 1394.02,-848 1394.02,-1028"/>
<text xml:space="preserve" text-anchor="start" x="1108.39" y="-932" font-family="Arial" font-size="20.00" fill="#f8fafc">App Service Quarkus Native</text>
</g>
<!-- iam -->
<g id="node5" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1831.02,-602.8 1510.98,-602.8 1510.98,-422.8 1831.02,-422.8 1831.02,-602.8"/>
<text xml:space="preserve" text-anchor="start" x="1630.42" y="-506.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="931.02,-602.8 610.98,-602.8 610.98,-422.8 931.02,-422.8 931.02,-602.8"/>
<text xml:space="preserve" text-anchor="start" x="716.53" y="-506.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- otel -->
<g id="node7" class="node">
<title>otel</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1381.02,-602.8 1060.98,-602.8 1060.98,-422.8 1381.02,-422.8 1381.02,-602.8"/>
<text xml:space="preserve" text-anchor="start" x="1109.85" y="-506.8" font-family="Arial" font-size="20.00" fill="#f8fafc">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node8" class="node">
<title>jaeger</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1381.02,-270 1060.98,-270 1060.98,-90 1381.02,-90 1381.02,-270"/>
<text xml:space="preserve" text-anchor="start" x="1190.42" y="-174" font-family="Arial" font-size="20.00" fill="#f8fafc">Jaeger</text>
</g>
<!-- vault&#45;&gt;quarkusapp -->
<g id="edge7" class="edge">
<title>vault&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M381.04,-1205.84C421.84,-1176.31 469.72,-1145.48 517,-1123.8 694.91,-1042.24 914.81,-992.33 1063.83,-965.27"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1064.09,-967.89 1071.01,-963.97 1063.16,-962.72 1064.09,-967.89"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="572.01,-1093 572.01,-1115.8 777.23,-1115.8 777.23,-1093 572.01,-1093"/>
<text xml:space="preserve" text-anchor="start" x="575.01" y="-1100.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp -->
<g id="edge8" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M864.88,-1205.93C937.24,-1153.61 1028.73,-1087.44 1102.53,-1034.08"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1103.99,-1036.26 1108.53,-1029.74 1100.91,-1032.01 1103.99,-1036.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1017.46,-1093 1017.46,-1115.8 1188.42,-1115.8 1188.42,-1093 1017.46,-1093"/>
<text xml:space="preserve" text-anchor="start" x="1020.46" y="-1100.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge1" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1234,-1205.93C1234,-1154.99 1234,-1090.92 1234,-1038.33"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1236.63,-1038.49 1234,-1030.99 1231.38,-1038.49 1236.63,-1038.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1234,-1093 1234,-1115.8 1260.99,-1115.8 1260.99,-1093 1234,-1093"/>
<text xml:space="preserve" text-anchor="start" x="1237" y="-1101.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge3" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1317.65,-1205.87C1362.48,-1155.78 1416.98,-1090.83 1459,-1028 1534.15,-915.64 1548.54,-883.4 1599,-758 1617.79,-711.3 1634.11,-657.82 1646.44,-612.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1648.95,-613.63 1648.38,-605.71 1643.88,-612.26 1648.95,-613.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1595.69,-926.6 1595.69,-949.4 1622.68,-949.4 1622.68,-926.6 1595.69,-926.6"/>
<text xml:space="preserve" text-anchor="start" x="1598.69" y="-934.8" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1313.53,-848.2C1348.59,-811.32 1391.35,-769.27 1433.48,-735.2 1438.62,-731.05 1440.8,-731.27 1446,-727.2 1491.61,-691.52 1538.61,-648.16 1577.78,-609.86"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1579.33,-612.02 1582.84,-604.89 1575.65,-608.27 1579.33,-612.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1433.48,-735.2 1433.48,-758 1571,-758 1571,-735.2 1433.48,-735.2"/>
<text xml:space="preserve" text-anchor="start" x="1436.48" y="-742.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge4" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1131.65,-848.22C1089.35,-811.16 1040,-767.44 996,-727.2 954.39,-689.15 909.17,-646.52 870.25,-609.42"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="872.49,-607.93 865.25,-604.65 868.87,-611.72 872.49,-607.93"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1027.95,-735.2 1027.95,-758 1054.94,-758 1054.94,-735.2 1027.95,-735.2"/>
<text xml:space="preserve" text-anchor="start" x="1030.95" y="-743.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge6" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1213.58,-848.25C1207.91,-819.61 1202.55,-787.61 1199.74,-758 1195.21,-710.25 1198.79,-657.2 1204.22,-612.78"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1206.79,-613.34 1205.14,-605.57 1201.59,-612.68 1206.79,-613.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1199.74,-735.2 1199.74,-758 1296,-758 1296,-735.2 1199.74,-735.2"/>
<text xml:space="preserve" text-anchor="start" x="1202.74" y="-742.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge2" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1221,-423.15C1221,-379.12 1221,-325.76 1221,-280.35"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1223.63,-280.42 1221,-272.92 1218.38,-280.42 1223.63,-280.42"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1221,-335 1221,-357.8 1318.05,-357.8 1318.05,-335 1221,-335"/>
<text xml:space="preserve" text-anchor="start" x="1224" y="-342.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
</g>
</svg>
`;case"deployment_prod":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3096pt" height="2844pt"
 viewBox="0.00 0.00 3096.00 2844.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2829.25)">
<g id="clust1" class="cluster">
<title>cluster_edge</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="1151.48,-2455.8 1151.48,-2806.2 1599.48,-2806.2 1599.48,-2455.8 1151.48,-2455.8"/>
<text xml:space="preserve" text-anchor="start" x="1159.48" y="-2793.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">EDGE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_loadbalancer</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1183.48,-2487.8 1183.48,-2753 1567.48,-2753 1567.48,-2487.8 1183.48,-2487.8"/>
<text xml:space="preserve" text-anchor="start" x="1191.48" y="-2740.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">LOADBALANCER</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_services</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="2081.48,-1288 2081.48,-1674.4 3057.48,-1674.4 3057.48,-1288 2081.48,-1288"/>
<text xml:space="preserve" text-anchor="start" x="2089.48" y="-1661.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">SERVICES</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_servicesnode</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="2113.48,-1320 2113.48,-1621.2 3025.48,-1621.2 3025.48,-1320 2113.48,-1320"/>
<text xml:space="preserve" text-anchor="start" x="2121.48" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">SERVICESNODE</text>
</g>
<g id="clust5" class="cluster">
<title>cluster_app</title>
<polygon fill="#393939" stroke="#292929" points="848.48,-880.2 848.48,-2417 1902.48,-2417 1902.48,-880.2 848.48,-880.2"/>
<text xml:space="preserve" text-anchor="start" x="856.48" y="-2404.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">APP</text>
</g>
<g id="clust6" class="cluster">
<title>cluster_appcluster</title>
<polygon fill="#1a468d" stroke="#1c3979" points="880.48,-912.2 880.48,-2363.8 1870.48,-2363.8 1870.48,-912.2 880.48,-912.2"/>
<text xml:space="preserve" text-anchor="start" x="888.48" y="-2350.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">APPCLUSTER</text>
</g>
<g id="clust7" class="cluster">
<title>cluster_ingresscontroller</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1183.48,-2027.4 1183.48,-2292.6 1567.48,-2292.6 1567.48,-2027.4 1183.48,-2027.4"/>
<text xml:space="preserve" text-anchor="start" x="1191.48" y="-2279.7" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">INGRESSCONTROLLER</text>
</g>
<g id="clust8" class="cluster">
<title>cluster_apppod1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1400.48,-962.2 1400.48,-1621.2 1820.48,-1621.2 1820.48,-962.2 1400.48,-962.2"/>
<text xml:space="preserve" text-anchor="start" x="1408.48" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APPPOD1</text>
</g>
<g id="clust9" class="cluster">
<title>cluster_apppod2</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="930.48,-962.2 930.48,-1621.2 1350.48,-1621.2 1350.48,-962.2 930.48,-962.2"/>
<text xml:space="preserve" text-anchor="start" x="938.48" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APPPOD2</text>
</g>
<g id="clust10" class="cluster">
<title>cluster_data</title>
<polygon fill="#393939" stroke="#292929" points="145.48,-8 145.48,-841.4 2633.48,-841.4 2633.48,-8 145.48,-8"/>
<text xml:space="preserve" text-anchor="start" x="153.48" y="-828.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">DATA</text>
</g>
<g id="clust11" class="cluster">
<title>cluster_postgresha</title>
<polygon fill="#1a468d" stroke="#1c3979" points="1649.48,-383.8 1649.48,-770.2 2583.48,-770.2 2583.48,-383.8 1649.48,-383.8"/>
<text xml:space="preserve" text-anchor="start" x="1657.48" y="-757.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">POSTGRESHA</text>
</g>
<g id="clust12" class="cluster">
<title>cluster_postgresprimary</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1699.48,-433.8 1699.48,-699 2083.48,-699 2083.48,-433.8 1699.48,-433.8"/>
<text xml:space="preserve" text-anchor="start" x="1707.48" y="-686.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">POSTGRESPRIMARY</text>
</g>
<g id="clust13" class="cluster">
<title>cluster_postgresreplica</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="2149.48,-433.8 2149.48,-699 2533.48,-699 2533.48,-433.8 2149.48,-433.8"/>
<text xml:space="preserve" text-anchor="start" x="2157.48" y="-686.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">POSTGRESREPLICA</text>
</g>
<g id="clust14" class="cluster">
<title>cluster_keycloakha</title>
<polygon fill="#1a468d" stroke="#1c3979" points="195.48,-383.8 195.48,-770.2 1129.48,-770.2 1129.48,-383.8 195.48,-383.8"/>
<text xml:space="preserve" text-anchor="start" x="203.48" y="-757.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">KEYCLOAKHA</text>
</g>
<g id="clust15" class="cluster">
<title>cluster_keycloaknode1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="695.48,-433.8 695.48,-699 1079.48,-699 1079.48,-433.8 695.48,-433.8"/>
<text xml:space="preserve" text-anchor="start" x="703.48" y="-686.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">KEYCLOAKNODE1</text>
</g>
<g id="clust16" class="cluster">
<title>cluster_keycloaknode2</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="245.48,-433.8 245.48,-699 629.48,-699 629.48,-433.8 245.48,-433.8"/>
<text xml:space="preserve" text-anchor="start" x="253.48" y="-686.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">KEYCLOAKNODE2</text>
</g>
<g id="clust17" class="cluster">
<title>cluster_observabilitynode</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1179.48,-58 1179.48,-717 1599.48,-717 1599.48,-58 1179.48,-58"/>
<text xml:space="preserve" text-anchor="start" x="1187.48" y="-704.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">OBSERVABILITYNODE</text>
</g>
<!-- loadbalancer -->
<g id="node1" class="node">
<title>loadbalancer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1535.5,-2699.8 1215.46,-2699.8 1215.46,-2519.8 1535.5,-2519.8 1535.5,-2699.8"/>
<text xml:space="preserve" text-anchor="start" x="1237.07" y="-2603.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Load Balancer / Reverse Proxy</text>
</g>
<!-- vault -->
<g id="node2" class="node">
<title>vault</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2525.06,-1550 2163.89,-1550 2163.89,-1370 2525.06,-1370 2525.06,-1550"/>
<text xml:space="preserve" text-anchor="start" x="2179.95" y="-1454" font-family="Arial" font-size="20.00" fill="#eff6ff">Kubernetes Secrets / External Config</text>
</g>
<!-- sharedstorage -->
<g id="node3" class="node">
<title>sharedstorage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2975.5,-1550 2655.46,-1550 2655.46,-1370 2975.5,-1370 2975.5,-1550"/>
<text xml:space="preserve" text-anchor="start" x="2726.54" y="-1454" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared File Storage</text>
</g>
<!-- appservice -->
<g id="node4" class="node">
<title>appservice</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1535.5,-1928.4 1215.46,-1928.4 1215.46,-1748.4 1535.5,-1748.4 1535.5,-1928.4"/>
<text xml:space="preserve" text-anchor="start" x="1270.97" y="-1832.4" font-family="Arial" font-size="20.00" fill="#f8fafc">Integration Hub Service</text>
</g>
<!-- ingresscontroller -->
<g id="node5" class="node">
<title>ingresscontroller</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1535.5,-2239.4 1215.46,-2239.4 1215.46,-2059.4 1535.5,-2059.4 1535.5,-2239.4"/>
<text xml:space="preserve" text-anchor="start" x="1296.56" y="-2143.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Ingress Controller</text>
</g>
<!-- adminconsole -->
<g id="node6" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1770.5,-1550 1450.46,-1550 1450.46,-1370 1770.5,-1370 1770.5,-1550"/>
<text xml:space="preserve" text-anchor="start" x="1489.31" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- adminconsole_1 -->
<g id="node7" class="node">
<title>adminconsole_1</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1300.5,-1550 980.46,-1550 980.46,-1370 1300.5,-1370 1300.5,-1550"/>
<text xml:space="preserve" text-anchor="start" x="1019.31" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- quarkusapp -->
<g id="node8" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1770.5,-1192.2 1450.46,-1192.2 1450.46,-1012.2 1770.5,-1012.2 1770.5,-1192.2"/>
<text xml:space="preserve" text-anchor="start" x="1484.87" y="-1096.2" font-family="Arial" font-size="20.00" fill="#f8fafc">App Service Quarkus Native</text>
</g>
<!-- quarkusapp_1 -->
<g id="node9" class="node">
<title>quarkusapp_1</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1300.5,-1192.2 980.46,-1192.2 980.46,-1012.2 1300.5,-1012.2 1300.5,-1192.2"/>
<text xml:space="preserve" text-anchor="start" x="1014.87" y="-1096.2" font-family="Arial" font-size="20.00" fill="#f8fafc">App Service Quarkus Native</text>
</g>
<!-- db -->
<g id="node10" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2051.5,-645.8 1731.46,-645.8 1731.46,-465.8 2051.5,-465.8 2051.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="1837" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- db_1 -->
<g id="node11" class="node">
<title>db_1</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2501.5,-645.8 2181.46,-645.8 2181.46,-465.8 2501.5,-465.8 2501.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="2287" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- iam -->
<g id="node12" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1047.5,-645.8 727.46,-645.8 727.46,-465.8 1047.5,-465.8 1047.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="846.9" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- iam_1 -->
<g id="node13" class="node">
<title>iam_1</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="597.5,-645.8 277.46,-645.8 277.46,-465.8 597.5,-465.8 597.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="396.9" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- otel -->
<g id="node14" class="node">
<title>otel</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1549.5,-645.8 1229.46,-645.8 1229.46,-465.8 1549.5,-465.8 1549.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="1278.32" y="-549.8" font-family="Arial" font-size="20.00" fill="#f8fafc">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node15" class="node">
<title>jaeger</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1549.5,-288 1229.46,-288 1229.46,-108 1549.5,-108 1549.5,-288"/>
<text xml:space="preserve" text-anchor="start" x="1358.9" y="-192" font-family="Arial" font-size="20.00" fill="#f8fafc">Jaeger</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge4" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1357.71,-2520.14C1353.77,-2496.72 1350.17,-2471.39 1348.19,-2447.8 1342.62,-2381.64 1349.45,-2307.25 1357.67,-2249.42"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1360.24,-2249.98 1358.73,-2242.18 1355.05,-2249.22 1360.24,-2249.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1348.19,-2425 1348.19,-2447.8 1507.48,-2447.8 1507.48,-2425 1348.19,-2425"/>
<text xml:space="preserve" text-anchor="start" x="1351.19" y="-2432.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvia trafico al cluster</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge26" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1527.99,-2487.8C1537.69,-2468.36 1541.49,-2447.25 1535.48,-2425 1524.01,-2382.53 1504.16,-2339.88 1482.27,-2301.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1484.8,-2300.41 1478.78,-2295.22 1480.25,-2303.03 1484.8,-2300.41"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1469.62,-2382.79 1469.62,-2405.59 1521.51,-2405.59 1521.51,-2382.79 1469.62,-2382.79"/>
<text xml:space="preserve" text-anchor="start" x="1472.62" y="-2389.99" font-family="Arial" font-size="14.00" fill="#c9c9c9">HTTPS</text>
</g>
<!-- vault&#45;&gt;quarkusapp -->
<g id="edge12" class="edge">
<title>vault&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2482.28,-1370.13C2520.3,-1334.88 2543.56,-1294.04 2512.48,-1257.2 2420.68,-1148.4 2015.37,-1116.46 1780.48,-1107.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1780.74,-1104.47 1773.15,-1106.8 1780.54,-1109.72 1780.74,-1104.47"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2524.71,-1257.2 2524.71,-1280 2729.92,-1280 2729.92,-1257.2 2524.71,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2527.71" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- vault&#45;&gt;quarkusapp_1 -->
<g id="edge21" class="edge">
<title>vault&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2164.05,-1372C2072.62,-1331.29 1958.72,-1285.62 1852.48,-1257.2 1642.81,-1201.12 1578.62,-1246.49 1368.48,-1192.2 1349.3,-1187.24 1329.54,-1181.14 1310.05,-1174.47"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1311.01,-1172.03 1303.06,-1172.04 1309.28,-1176.99 1311.01,-1172.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1921.73,-1257.2 1921.73,-1280 2126.95,-1280 2126.95,-1257.2 1921.73,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="1924.73" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp -->
<g id="edge13" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2813.23,-1370.16C2807.42,-1329.97 2793.41,-1285.28 2761.48,-1257.2 2619.16,-1132.08 2065.19,-1107.68 1780.89,-1103.54"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1781.03,-1100.92 1773.5,-1103.44 1780.96,-1106.17 1781.03,-1100.92"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2779.93,-1257.2 2779.93,-1280 2950.89,-1280 2950.89,-1257.2 2779.93,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2782.93" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp_1 -->
<g id="edge22" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2725.58,-1370.17C2687.19,-1338.05 2639.87,-1305.43 2590.48,-1288 2561.03,-1277.61 2340.63,-1282.78 2309.52,-1280 2241.9,-1273.96 2225.91,-1265.05 2158.48,-1257.2 1808.55,-1216.44 1711.73,-1271.53 1368.48,-1192.2 1349.26,-1187.76 1329.52,-1182 1310.08,-1175.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1311.06,-1173.12 1303.12,-1173.2 1309.38,-1178.09 1311.06,-1173.12"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2309.52,-1257.2 2309.52,-1280 2480.48,-1280 2480.48,-1257.2 2309.52,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2312.52" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- appservice&#45;&gt;adminconsole -->
<g id="edge24" class="edge">
<title>appservice&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1430.87,-1748.68C1453.07,-1713.11 1479.43,-1670.9 1505.01,-1629.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1507.11,-1631.52 1508.86,-1623.76 1502.66,-1628.74 1507.11,-1631.52"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1323.68,-1685.18 1323.68,-1707.98 1470.51,-1707.98 1470.51,-1685.18 1323.68,-1685.18"/>
<text xml:space="preserve" text-anchor="start" x="1326.68" y="-1692.38" font-family="Arial" font-size="14.00" fill="#c9c9c9">Balancea trafico HTTP</text>
</g>
<!-- appservice&#45;&gt;adminconsole_1 -->
<g id="edge25" class="edge">
<title>appservice&#45;&gt;adminconsole_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1320.08,-1748.68C1297.88,-1713.11 1271.53,-1670.9 1245.94,-1629.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1248.3,-1628.74 1242.1,-1623.76 1243.84,-1631.52 1248.3,-1628.74"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1133.61,-1685.18 1133.61,-1707.98 1280.44,-1707.98 1280.44,-1685.18 1133.61,-1685.18"/>
<text xml:space="preserve" text-anchor="start" x="1136.61" y="-1692.38" font-family="Arial" font-size="14.00" fill="#c9c9c9">Balancea trafico HTTP</text>
</g>
<!-- ingresscontroller&#45;&gt;appservice -->
<g id="edge23" class="edge">
<title>ingresscontroller&#45;&gt;appservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1375.48,-2027.4C1375.48,-1997.97 1375.48,-1966.83 1375.48,-1938.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1378.1,-1938.8 1375.48,-1931.3 1372.85,-1938.8 1378.1,-1938.8"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1284.67,-1977.63 1284.67,-2000.43 1375.48,-2000.43 1375.48,-1977.63 1284.67,-1977.63"/>
<text xml:space="preserve" text-anchor="start" x="1287.67" y="-1984.83" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ruta UI y API</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge1" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1610.48,-1370.13C1610.48,-1319.19 1610.48,-1255.12 1610.48,-1202.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1613.1,-1202.69 1610.48,-1195.19 1607.85,-1202.69 1613.1,-1202.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1610.48,-1257.2 1610.48,-1280 1637.47,-1280 1637.47,-1257.2 1610.48,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="1613.48" y="-1265.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1519.58,-1370.08C1480.61,-1337.84 1432.56,-1305.16 1382.48,-1288 1357.04,-1279.29 919.97,-1296.16 898.48,-1280 710.74,-1138.9 791.44,-817.98 848.56,-655.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="850.89,-656.55 850.93,-648.6 845.94,-654.79 850.89,-656.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="820.74,-1090.8 820.74,-1113.6 847.73,-1113.6 847.73,-1090.8 820.74,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="823.74" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole&#45;&gt;iam_1 -->
<g id="edge6" class="edge">
<title>adminconsole&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1519.59,-1370.04C1480.63,-1337.79 1432.58,-1305.11 1382.48,-1288 1325.69,-1268.6 899.38,-1299.06 842.48,-1280 779.82,-1259.01 764.06,-1243.57 722.48,-1192.2 588.55,-1026.71 504.02,-788.24 464.3,-655.5"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="466.91,-655.08 462.26,-648.64 461.88,-656.58 466.91,-655.08"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="722.48,-1090.8 722.48,-1113.6 749.48,-1113.6 749.48,-1090.8 722.48,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="725.48" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole_1&#45;&gt;quarkusapp_1 -->
<g id="edge2" class="edge">
<title>adminconsole_1&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1140.48,-1370.13C1140.48,-1319.19 1140.48,-1255.12 1140.48,-1202.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1143.1,-1202.69 1140.48,-1195.19 1137.85,-1202.69 1143.1,-1202.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1140.48,-1257.2 1140.48,-1280 1167.47,-1280 1167.47,-1257.2 1140.48,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="1143.48" y="-1265.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole_1&#45;&gt;iam -->
<g id="edge14" class="edge">
<title>adminconsole_1&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.64,-1428.64C769.25,-1384.87 414.5,-1297.6 338.48,-1192.2 257.37,-1079.73 246.46,-983.93 338.48,-880.2 386.46,-826.12 598.37,-876.67 661.48,-841.4 737.75,-798.77 797.64,-718.98 836.55,-654.71"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="838.76,-656.13 840.35,-648.35 834.25,-653.44 838.76,-656.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="338.48,-1090.8 338.48,-1113.6 365.48,-1113.6 365.48,-1090.8 338.48,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="341.48" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole_1&#45;&gt;iam_1 -->
<g id="edge15" class="edge">
<title>adminconsole_1&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.61,-1454.86C777.7,-1441.2 428.42,-1388.39 214.48,-1192.2 85.94,-1074.32 -56.72,-1004.28 23.48,-849.4 75.07,-749.75 177.96,-676.78 268.26,-628.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="269.42,-630.99 274.84,-625.17 266.98,-626.35 269.42,-630.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="214.48,-1090.8 214.48,-1113.6 241.48,-1113.6 241.48,-1090.8 214.48,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="217.48" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge7" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1770.39,-1070.44C1880.01,-1040.13 2017.6,-981.77 2086.48,-872.2 2132.58,-798.86 2076.34,-715.48 2012.61,-652.87"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2014.6,-651.15 2007.39,-647.83 2010.96,-654.93 2014.6,-651.15"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2095.27,-849.4 2095.27,-872.2 2122.26,-872.2 2122.26,-849.4 2095.27,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2098.27" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;db_1 -->
<g id="edge8" class="edge">
<title>quarkusapp&#45;&gt;db_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1770.19,-1083.38C2001.48,-1053.91 2411.76,-986.63 2500.48,-872.2 2552.39,-805.24 2501.94,-718.68 2444.51,-653.18"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2446.81,-651.81 2439.86,-647.96 2442.89,-655.31 2446.81,-651.81"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2510.37,-849.4 2510.37,-872.2 2537.36,-872.2 2537.36,-849.4 2510.37,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2513.37" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge9" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1668.76,-1012.22C1696.12,-958.36 1714.49,-892.06 1672.48,-849.4 1662.24,-839.01 1160.78,-847.39 1147.48,-841.4 1061.44,-802.68 991.32,-720.3 945.67,-654.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="948.05,-652.91 941.66,-648.19 943.71,-655.87 948.05,-652.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1687.78,-849.4 1687.78,-872.2 1825.29,-872.2 1825.29,-849.4 1687.78,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1690.78" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;iam_1 -->
<g id="edge10" class="edge">
<title>quarkusapp&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1563.25,-1012.43C1526.98,-954.38 1471,-883.26 1399.48,-849.4 1362.52,-831.91 700.2,-859.38 663.48,-841.4 583.76,-802.37 523.4,-720.29 485.21,-654.26"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="487.69,-653.32 481.7,-648.1 483.13,-655.91 487.69,-653.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1437.45,-849.4 1437.45,-872.2 1574.97,-872.2 1574.97,-849.4 1437.45,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1440.45" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1770.47,-1049.22C1890.65,-1002.25 2022.35,-928.52 1945.48,-849.4 1934.71,-838.32 1681.63,-847.6 1667.48,-841.4 1578.29,-802.32 1503.03,-719.98 1453.4,-653.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1455.56,-652.38 1448.98,-647.92 1451.34,-655.51 1455.56,-652.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1958.27,-849.4 1958.27,-872.2 2054.53,-872.2 2054.53,-849.4 1958.27,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1961.27" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- quarkusapp_1&#45;&gt;db -->
<g id="edge16" class="edge">
<title>quarkusapp_1&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1189.07,-1012.49C1226.09,-954.67 1282.85,-883.79 1354.48,-849.4 1382.24,-836.07 1603.49,-854.23 1631.48,-841.4 1717.1,-802.16 1787.15,-720.06 1832.88,-654.08"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1834.84,-655.87 1836.91,-648.2 1830.5,-652.9 1834.84,-655.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1354.48,-849.4 1354.48,-872.2 1381.48,-872.2 1381.48,-849.4 1354.48,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1357.48" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp_1&#45;&gt;db_1 -->
<g id="edge17" class="edge">
<title>quarkusapp_1&#45;&gt;db_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1204.34,-1012.24C1245.1,-963.36 1302.58,-907.29 1368.48,-880.2 1388.67,-871.9 2135.56,-883.1 2154.48,-872.2 2235.1,-825.73 2284.62,-729.48 2312.28,-655.46"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2314.72,-656.42 2314.83,-648.48 2309.79,-654.62 2314.72,-656.42"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2186.56,-849.4 2186.56,-872.2 2213.55,-872.2 2213.55,-849.4 2186.56,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2189.56" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp_1&#45;&gt;iam -->
<g id="edge18" class="edge">
<title>quarkusapp_1&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1039.92,-1012.44C1001.72,-973.25 961.54,-924.27 936.96,-872.2 904.95,-804.4 892.95,-720.2 888.76,-655.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="891.4,-656.05 888.33,-648.72 886.16,-656.36 891.4,-656.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="936.96,-849.4 936.96,-872.2 1074.48,-872.2 1074.48,-849.4 936.96,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="939.96" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp_1&#45;&gt;iam_1 -->
<g id="edge19" class="edge">
<title>quarkusapp_1&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1060.88,-1012.47C1011.98,-964.32 945.11,-908.91 873.48,-880.2 850.21,-870.87 785.58,-876.9 760.96,-872.2 716.33,-863.69 700.9,-867.16 663.48,-841.4 592.99,-792.88 533.76,-715.9 493.64,-654.22"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="496.01,-653.06 489.75,-648.17 491.6,-655.9 496.01,-653.06"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="760.96,-849.4 760.96,-872.2 898.48,-872.2 898.48,-849.4 760.96,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="763.96" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp_1&#45;&gt;otel -->
<g id="edge20" class="edge">
<title>quarkusapp_1&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1110.76,-1012.47C1099.06,-962.93 1092.71,-900.99 1113.22,-849.4 1143.84,-772.36 1205.44,-703.86 1262.71,-652.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1264.26,-654.69 1268.13,-647.75 1260.78,-650.76 1264.26,-654.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1113.22,-849.4 1113.22,-872.2 1209.48,-872.2 1209.48,-849.4 1113.22,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1116.22" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge3" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1389.48,-465.93C1389.48,-414.99 1389.48,-350.92 1389.48,-298.33"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1392.1,-298.49 1389.48,-290.99 1386.85,-298.49 1392.1,-298.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1389.48,-353 1389.48,-375.8 1486.52,-375.8 1486.52,-353 1389.48,-353"/>
<text xml:space="preserve" text-anchor="start" x="1392.48" y="-360.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
</g>
</svg>
`;case"usecase_uc01_source":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3574pt" height="210pt"
 viewBox="0.00 0.00 3574.00 210.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 195.05)">
<!-- integrationadmin -->
<g id="node1" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="81.64" y="-84" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- processdesigner -->
<g id="node2" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1013.87,-180 693.83,-180 693.83,0 1013.87,0 1013.87,-180"/>
<text xml:space="preserve" text-anchor="start" x="774.93" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- sourcedefinitionresource -->
<g id="node3" class="node">
<title>sourcedefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1650.88,-180 1330.84,-180 1330.84,0 1650.88,0 1650.88,-180"/>
<text xml:space="preserve" text-anchor="start" x="1374.69" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinitionResource</text>
</g>
<!-- sourcecatalogservice -->
<g id="node4" class="node">
<title>sourcecatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2277.03,-180 1956.99,-180 1956.99,0 2277.03,0 2277.03,-180"/>
<text xml:space="preserve" text-anchor="start" x="2017.52" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceCatalogService</text>
</g>
<!-- sourcedefinitionrepository -->
<g id="node5" class="node">
<title>sourcedefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2912.49,-180 2592.45,-180 2592.45,0 2912.49,0 2912.49,-180"/>
<text xml:space="preserve" text-anchor="start" x="2631.29" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinitionRepository</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3544.06,-180 3224.02,-180 3224.02,0 3544.06,0 3544.06,-180"/>
<text xml:space="preserve" text-anchor="start" x="3329.57" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge1" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.74,-90C428.54,-90 572.7,-90 683.68,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="683.45,-92.63 690.95,-90 683.45,-87.38 683.45,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-93 383.04,-125.8 407.04,-125.8 407.04,-93 383.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-93 410.04,-125.8 630.83,-125.8 630.83,-93 410.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Define tipo de fuente y parametros</text>
</g>
<!-- processdesigner&#45;&gt;sourcedefinitionresource -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;sourcedefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1013.86,-90C1107.35,-90 1225.5,-90 1320.69,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1320.48,-92.63 1327.98,-90 1320.48,-87.38 1320.48,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1076.87,-93 1076.87,-125.8 1100.87,-125.8 1100.87,-93 1076.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1084.98" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1103.87,-93 1103.87,-125.8 1267.84,-125.8 1267.84,-93 1103.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1106.87" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra source definition</text>
</g>
<!-- sourcedefinitionresource&#45;&gt;sourcecatalogservice -->
<g id="edge3" class="edge">
<title>sourcedefinitionresource&#45;&gt;sourcecatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1650.57,-90C1741.17,-90 1854.72,-90 1946.98,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1946.73,-92.63 1954.23,-90 1946.73,-87.38 1946.73,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1713.88,-93 1713.88,-125.8 1737.88,-125.8 1737.88,-93 1713.88,-93"/>
<text xml:space="preserve" text-anchor="start" x="1721.99" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1740.88,-93 1740.88,-125.8 1893.99,-125.8 1893.99,-93 1740.88,-93"/>
<text xml:space="preserve" text-anchor="start" x="1743.88" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega alta de catalogo</text>
</g>
<!-- sourcecatalogservice&#45;&gt;sourcedefinitionrepository -->
<g id="edge4" class="edge">
<title>sourcecatalogservice&#45;&gt;sourcedefinitionrepository</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2276.63,-90C2369.72,-90 2487.3,-90 2582.17,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2581.92,-92.63 2589.42,-90 2581.92,-87.38 2581.92,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2340.03,-93 2340.03,-125.8 2364.03,-125.8 2364.03,-93 2340.03,-93"/>
<text xml:space="preserve" text-anchor="start" x="2348.14" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2367.03,-93 2367.03,-125.8 2529.45,-125.8 2529.45,-93 2367.03,-93"/>
<text xml:space="preserve" text-anchor="start" x="2370.03" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste source definition</text>
</g>
<!-- sourcedefinitionrepository&#45;&gt;db -->
<g id="edge5" class="edge">
<title>sourcedefinitionrepository&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2912.34,-90C3004.33,-90 3120.08,-90 3213.78,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3213.7,-92.63 3221.2,-90 3213.7,-87.38 3213.7,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2975.49,-93 2975.49,-125.8 2999.49,-125.8 2999.49,-93 2975.49,-93"/>
<text xml:space="preserve" text-anchor="start" x="2983.59" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3002.49,-93 3002.49,-125.8 3161.02,-125.8 3161.02,-93 3002.49,-93"/>
<text xml:space="preserve" text-anchor="start" x="3005.49" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda source definition</text>
</g>
</g>
</svg>
`;case"usecase_uc02_reader":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3499pt" height="210pt"
 viewBox="0.00 0.00 3499.00 210.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 195.05)">
<!-- integrationadmin -->
<g id="node1" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="81.64" y="-84" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- processdesigner -->
<g id="node2" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="943.04,-180 623,-180 623,0 943.04,0 943.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="704.1" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- readerdefinitionresource -->
<g id="node3" class="node">
<title>readerdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1578.5,-180 1258.46,-180 1258.46,0 1578.5,0 1578.5,-180"/>
<text xml:space="preserve" text-anchor="start" x="1301.19" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderDefinitionResource</text>
</g>
<!-- readercatalogservice -->
<g id="node4" class="node">
<title>readercatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2204.65,-180 1884.61,-180 1884.61,0 2204.65,0 2204.65,-180"/>
<text xml:space="preserve" text-anchor="start" x="1944.02" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderCatalogService</text>
</g>
<!-- readerdefinitionrepository -->
<g id="node5" class="node">
<title>readerdefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2838.55,-180 2518.51,-180 2518.51,0 2838.55,0 2838.55,-180"/>
<text xml:space="preserve" text-anchor="start" x="2556.24" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderDefinitionRepository</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3468.57,-180 3148.53,-180 3148.53,0 3468.57,0 3468.57,-180"/>
<text xml:space="preserve" text-anchor="start" x="3254.08" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge1" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.73,-90C409.35,-90 521.35,-90 612.65,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="612.59,-92.63 620.09,-90 612.59,-87.38 612.59,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-93 383.04,-125.8 407.04,-125.8 407.04,-93 383.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-93 410.04,-125.8 560,-125.8 560,-93 410.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Define formato y layout</text>
</g>
<!-- processdesigner&#45;&gt;readerdefinitionresource -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;readerdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M942.64,-90C1035.81,-90 1153.53,-90 1248.45,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1248.21,-92.63 1255.71,-90 1248.21,-87.38 1248.21,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1006.04,-93 1006.04,-125.8 1030.04,-125.8 1030.04,-93 1006.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="1014.14" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1033.04,-93 1033.04,-125.8 1195.46,-125.8 1195.46,-93 1033.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="1036.04" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra reader definition</text>
</g>
<!-- readerdefinitionresource&#45;&gt;readercatalogservice -->
<g id="edge3" class="edge">
<title>readerdefinitionresource&#45;&gt;readercatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1578.19,-90C1668.78,-90 1782.33,-90 1874.59,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1874.35,-92.63 1881.85,-90 1874.35,-87.38 1874.35,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1641.5,-93 1641.5,-125.8 1665.5,-125.8 1665.5,-93 1641.5,-93"/>
<text xml:space="preserve" text-anchor="start" x="1649.6" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1668.5,-93 1668.5,-125.8 1821.61,-125.8 1821.61,-93 1668.5,-93"/>
<text xml:space="preserve" text-anchor="start" x="1671.5" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega alta de catalogo</text>
</g>
<!-- readercatalogservice&#45;&gt;readerdefinitionrepository -->
<g id="edge4" class="edge">
<title>readercatalogservice&#45;&gt;readerdefinitionrepository</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2204.27,-90C2296.85,-90 2413.64,-90 2508.03,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2508.02,-92.63 2515.52,-90 2508.02,-87.38 2508.02,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2267.65,-93 2267.65,-125.8 2291.65,-125.8 2291.65,-93 2267.65,-93"/>
<text xml:space="preserve" text-anchor="start" x="2275.75" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2294.65,-93 2294.65,-125.8 2455.51,-125.8 2455.51,-93 2294.65,-93"/>
<text xml:space="preserve" text-anchor="start" x="2297.65" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste reader definition</text>
</g>
<!-- readerdefinitionrepository&#45;&gt;db -->
<g id="edge5" class="edge">
<title>readerdefinitionrepository&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2838.41,-90C2930,-90 3045.11,-90 3138.39,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3138.25,-92.63 3145.75,-90 3138.25,-87.38 3138.25,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2901.55,-93 2901.55,-125.8 2925.55,-125.8 2925.55,-93 2901.55,-93"/>
<text xml:space="preserve" text-anchor="start" x="2909.66" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2928.55,-93 2928.55,-125.8 3085.53,-125.8 3085.53,-93 2928.55,-93"/>
<text xml:space="preserve" text-anchor="start" x="2931.55" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda reader definition</text>
</g>
</g>
</svg>
`;case"usecase_uc03_process":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2920pt" height="1407pt"
 viewBox="0.00 0.00 2920.00 1407.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1391.49)">
<!-- integrationadmin -->
<g id="node1" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-506.44 0,-506.44 0,-326.44 320.04,-326.44 320.04,-506.44"/>
<text xml:space="preserve" text-anchor="start" x="81.64" y="-410.44" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- processdesigner -->
<g id="node2" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="984.29,-506.44 664.25,-506.44 664.25,-326.44 984.29,-326.44 984.29,-506.44"/>
<text xml:space="preserve" text-anchor="start" x="745.35" y="-410.44" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- db -->
<g id="node3" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2245.09,-207.44 1925.05,-207.44 1925.05,-27.44 2245.09,-27.44 2245.09,-207.44"/>
<text xml:space="preserve" text-anchor="start" x="2030.6" y="-111.44" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- processdefinitionresource -->
<g id="node4" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1622.87,-506.44 1302.83,-506.44 1302.83,-326.44 1622.87,-326.44 1622.87,-506.44"/>
<text xml:space="preserve" text-anchor="start" x="1342.24" y="-410.44" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- processcatalogservice -->
<g id="node5" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2245.09,-506.44 1925.05,-506.44 1925.05,-326.44 2245.09,-326.44 2245.09,-506.44"/>
<text xml:space="preserve" text-anchor="start" x="1981.13" y="-410.44" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- processdefinitionrepository -->
<g id="node6" class="node">
<title>processdefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2886.98,-545.44 2566.94,-545.44 2566.94,-365.44 2886.98,-365.44 2886.98,-545.44"/>
<text xml:space="preserve" text-anchor="start" x="2601.35" y="-449.44" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionRepository</text>
</g>
<!-- processtaskdefinitionrepository -->
<g id="node7" class="node">
<title>processtaskdefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2890.3,-212.44 2563.63,-212.44 2563.63,-32.44 2890.3,-32.44 2890.3,-212.44"/>
<text xml:space="preserve" text-anchor="start" x="2579.68" y="-116.44" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessTaskDefinitionRepository</text>
</g>
<!-- readerdefinitionresource -->
<g id="node8" class="node">
<title>readerdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-796.44 0,-796.44 0,-616.44 320.04,-616.44 320.04,-796.44"/>
<text xml:space="preserve" text-anchor="start" x="42.73" y="-700.44" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderDefinitionResource</text>
</g>
<!-- readercatalogservice -->
<g id="node9" class="node">
<title>readercatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-1086.44 0,-1086.44 0,-906.44 320.04,-906.44 320.04,-1086.44"/>
<text xml:space="preserve" text-anchor="start" x="59.41" y="-990.44" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderCatalogService</text>
</g>
<!-- readerdefinitionrepository -->
<g id="node10" class="node">
<title>readerdefinitionrepository</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-1376.44 0,-1376.44 0,-1196.44 320.04,-1196.44 320.04,-1376.44"/>
<text xml:space="preserve" text-anchor="start" x="37.73" y="-1280.44" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderDefinitionRepository</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge1" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.65,-416.44C420.55,-416.44 551.11,-416.44 654.01,-416.44"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="653.98,-419.07 661.48,-416.44 653.98,-413.82 653.98,-419.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-419.44 383.04,-452.24 407.04,-452.24 407.04,-419.44 383.04,-419.44"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-432.64" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-419.44 410.04,-452.24 601.25,-452.24 601.25,-419.44 410.04,-419.44"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-431.64" font-family="Arial" font-size="14.00" fill="#c9c9c9">Crea proceso y ordena tareas</text>
</g>
<!-- processdesigner&#45;&gt;processdefinitionresource -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M984.27,-416.44C1078.16,-416.44 1196.97,-416.44 1292.6,-416.44"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1292.43,-419.07 1299.93,-416.44 1292.43,-413.82 1292.43,-419.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1047.29,-419.44 1047.29,-452.24 1071.29,-452.24 1071.29,-419.44 1047.29,-419.44"/>
<text xml:space="preserve" text-anchor="start" x="1055.4" y="-432.64" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1074.29,-419.44 1074.29,-452.24 1239.83,-452.24 1239.83,-419.44 1074.29,-419.44"/>
<text xml:space="preserve" text-anchor="start" x="1077.29" y="-431.64" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda process definition</text>
</g>
<!-- db&#45;&gt;processdefinitionrepository -->
<g id="edge6" class="edge">
<title>db&#45;&gt;processdefinitionrepository</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2255.25,-102.82C2336.26,-103.82 2431.16,-117.42 2503.63,-164.64 2547.95,-193.52 2532.88,-224.4 2563.63,-267.44 2587.44,-300.78 2615.93,-335.26 2642.36,-365.45"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2255.48,-100.19 2247.96,-102.77 2255.45,-105.44 2255.48,-100.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2308.09,-167.64 2308.09,-200.44 2332.09,-200.44 2332.09,-167.64 2308.09,-167.64"/>
<text xml:space="preserve" text-anchor="start" x="2316.2" y="-180.84" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2335.09,-167.64 2335.09,-200.44 2500.63,-200.44 2500.63,-167.64 2335.09,-167.64"/>
<text xml:space="preserve" text-anchor="start" x="2338.09" y="-179.84" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda process definition</text>
</g>
<!-- db&#45;&gt;processtaskdefinitionrepository -->
<g id="edge7" class="edge">
<title>db&#45;&gt;processtaskdefinitionrepository</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2254.77,-29.53C2271.44,-23.51 2288.38,-18.37 2305.09,-14.64 2391.21,4.56 2417.63,5.11 2503.63,-14.64 2523.69,-19.25 2544.05,-25.92 2563.89,-33.72"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2253.94,-27.04 2247.83,-32.11 2255.77,-31.96 2253.94,-27.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2319.77,-17.64 2319.77,-50.44 2343.77,-50.44 2343.77,-17.64 2319.77,-17.64"/>
<text xml:space="preserve" text-anchor="start" x="2327.88" y="-30.84" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">7</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2346.77,-17.64 2346.77,-50.44 2488.94,-50.44 2488.94,-17.64 2346.77,-17.64"/>
<text xml:space="preserve" text-anchor="start" x="2349.77" y="-29.84" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda process tasks</text>
</g>
<!-- processdefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>processdefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1622.77,-416.44C1712.19,-416.44 1823.82,-416.44 1914.86,-416.44"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1914.77,-419.07 1922.27,-416.44 1914.77,-413.82 1914.77,-419.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1685.87,-419.44 1685.87,-452.24 1709.87,-452.24 1709.87,-419.44 1685.87,-419.44"/>
<text xml:space="preserve" text-anchor="start" x="1693.98" y="-432.64" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1712.87,-419.44 1712.87,-452.24 1862.05,-452.24 1862.05,-419.44 1712.87,-419.44"/>
<text xml:space="preserve" text-anchor="start" x="1715.87" y="-431.64" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida y registra tareas</text>
</g>
<!-- processcatalogservice&#45;&gt;processdefinitionrepository -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;processdefinitionrepository</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2245.07,-426.13C2339.8,-431.91 2459.98,-439.23 2556.5,-445.11"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2556.28,-447.73 2563.93,-445.57 2556.6,-442.49 2556.28,-447.73"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2331.05,-444.71 2331.05,-477.51 2355.05,-477.51 2355.05,-444.71 2331.05,-444.71"/>
<text xml:space="preserve" text-anchor="start" x="2339.16" y="-457.91" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2358.05,-444.71 2358.05,-477.51 2477.66,-477.51 2477.66,-444.71 2358.05,-444.71"/>
<text xml:space="preserve" text-anchor="start" x="2361.05" y="-456.91" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definicion</text>
</g>
<!-- processcatalogservice&#45;&gt;processtaskdefinitionrepository -->
<g id="edge5" class="edge">
<title>processcatalogservice&#45;&gt;processtaskdefinitionrepository</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2244.76,-347.23C2322.97,-312.74 2418.55,-270.04 2503.63,-230.44 2520.12,-222.76 2537.25,-214.67 2554.35,-206.5"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2555.48,-208.87 2561.12,-203.27 2553.22,-204.13 2555.48,-208.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2344.29,-321.42 2344.29,-354.22 2368.29,-354.22 2368.29,-321.42 2344.29,-321.42"/>
<text xml:space="preserve" text-anchor="start" x="2352.4" y="-334.62" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2371.29,-321.42 2371.29,-354.22 2464.43,-354.22 2464.43,-321.42 2371.29,-321.42"/>
<text xml:space="preserve" text-anchor="start" x="2374.29" y="-333.62" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste tasks</text>
</g>
</g>
</svg>
`;case"usecase_uc04_manual_execution":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3398pt" height="1197pt"
 viewBox="0.00 0.00 3398.00 1197.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1182.05)">
<g id="clust1" class="cluster">
<title>cluster_processengine</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="2372.67,-8 2372.67,-1159 2772.71,-1159 2772.71,-8 2372.67,-8"/>
<text xml:space="preserve" text-anchor="start" x="2380.67" y="-1146.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">PROCESS ENGINE</text>
</g>
<!-- operator -->
<g id="node1" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-373 0,-373 0,-193 320.04,-193 320.04,-373"/>
<text xml:space="preserve" text-anchor="start" x="120.56" y="-277" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- operationsconsole -->
<g id="node2" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="961.73,-373 641.69,-373 641.69,-193 961.73,-193 961.73,-373"/>
<text xml:space="preserve" text-anchor="start" x="713.32" y="-277" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- processexecutionresource -->
<g id="node3" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1548.94,-373 1228.9,-373 1228.9,-193 1548.94,-193 1548.94,-373"/>
<text xml:space="preserve" text-anchor="start" x="1266.08" y="-277" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processexecutionservice -->
<g id="node4" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2135.39,-373 1815.35,-373 1815.35,-193 2135.39,-193 2135.39,-373"/>
<text xml:space="preserve" text-anchor="start" x="1861.98" y="-277" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node5" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.71,-518 2412.67,-518 2412.67,-338 2732.71,-338 2732.71,-518"/>
<text xml:space="preserve" text-anchor="start" x="2477.68" y="-422" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- restcalltaskprovider -->
<g id="node6" class="node">
<title>restcalltaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.71,-228 2412.67,-228 2412.67,-48 2732.71,-48 2732.71,-228"/>
<text xml:space="preserve" text-anchor="start" x="2476" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">RestCallTaskProvider</text>
</g>
<!-- db -->
<g id="node7" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3368.2,-518 3048.16,-518 3048.16,-338 3368.2,-338 3368.2,-518"/>
<text xml:space="preserve" text-anchor="start" x="3153.7" y="-422" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node8" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3368.2,-228 3048.16,-228 3048.16,-48 3368.2,-48 3368.2,-228"/>
<text xml:space="preserve" text-anchor="start" x="3145.92" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- sourceregistry -->
<g id="node9" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.71,-808 2412.67,-808 2412.67,-628 2732.71,-628 2732.71,-808"/>
<text xml:space="preserve" text-anchor="start" x="2461.54" y="-712" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node10" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.71,-1098 2412.67,-1098 2412.67,-918 2732.71,-918 2732.71,-1098"/>
<text xml:space="preserve" text-anchor="start" x="2460.43" y="-1002" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- operator&#45;&gt;operationsconsole -->
<g id="edge1" class="edge">
<title>operator&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.97,-283C414.66,-283 534.81,-283 631.3,-283"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="631.22,-285.63 638.72,-283 631.22,-280.38 631.22,-285.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-286 383.04,-318.8 407.04,-318.8 407.04,-286 383.04,-286"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-299.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-286 410.04,-318.8 578.69,-318.8 578.69,-286 410.04,-286"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-298.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Selecciona proceso activo</text>
</g>
<!-- operationsconsole&#45;&gt;processexecutionresource -->
<g id="edge2" class="edge">
<title>operationsconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M961.46,-283C1041.15,-283 1137.72,-283 1218.8,-283"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1218.59,-285.63 1226.09,-283 1218.59,-280.38 1218.59,-285.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1024.73,-286 1024.73,-318.8 1048.73,-318.8 1048.73,-286 1024.73,-286"/>
<text xml:space="preserve" text-anchor="start" x="1032.83" y="-299.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1051.73,-286 1051.73,-318.8 1165.9,-318.8 1165.9,-286 1051.73,-286"/>
<text xml:space="preserve" text-anchor="start" x="1054.73" y="-298.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Solicita ejecucion</text>
</g>
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge3" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1548.85,-283C1628.27,-283 1724.4,-283 1805.19,-283"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1804.94,-285.63 1812.44,-283 1804.94,-280.38 1804.94,-285.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1611.94,-286 1611.94,-318.8 1635.94,-318.8 1635.94,-286 1611.94,-286"/>
<text xml:space="preserve" text-anchor="start" x="1620.05" y="-299.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1638.94,-286 1638.94,-318.8 1752.35,-318.8 1752.35,-286 1638.94,-286"/>
<text xml:space="preserve" text-anchor="start" x="1641.94" y="-298.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecucion</text>
</g>
<!-- processexecutionservice&#45;&gt;dbwritetaskprovider -->
<g id="edge4" class="edge">
<title>processexecutionservice&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2135.12,-321.67C2217.7,-341.78 2318.67,-366.37 2402.7,-386.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2402.02,-389.37 2409.92,-388.6 2403.26,-384.27 2402.02,-389.37"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2203.46,-375.75 2203.46,-408.55 2227.46,-408.55 2227.46,-375.75 2203.46,-375.75"/>
<text xml:space="preserve" text-anchor="start" x="2211.56" y="-388.95" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2230.46,-375.75 2230.46,-408.55 2344.6,-408.55 2344.6,-375.75 2230.46,-375.75"/>
<text xml:space="preserve" text-anchor="start" x="2233.46" y="-387.95" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste registros</text>
</g>
<!-- processexecutionservice&#45;&gt;restcalltaskprovider -->
<g id="edge6" class="edge">
<title>processexecutionservice&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2135.12,-244.33C2217.7,-224.22 2318.67,-199.63 2402.7,-179.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2403.26,-181.73 2409.92,-177.4 2402.02,-176.63 2403.26,-181.73"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2198.39,-230.75 2198.39,-263.55 2222.39,-263.55 2222.39,-230.75 2198.39,-230.75"/>
<text xml:space="preserve" text-anchor="start" x="2206.49" y="-243.95" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2225.39,-230.75 2225.39,-263.55 2349.67,-263.55 2349.67,-230.75 2225.39,-230.75"/>
<text xml:space="preserve" text-anchor="start" x="2228.39" y="-242.95" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca API externa</text>
</g>
<!-- dbwritetaskprovider&#45;&gt;db -->
<g id="edge5" class="edge">
<title>dbwritetaskprovider&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2732.32,-428C2825.5,-428 2943.22,-428 3038.14,-428"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3037.9,-430.63 3045.4,-428 3037.9,-425.38 3037.9,-430.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2795.71,-431 2795.71,-463.8 2819.71,-463.8 2819.71,-431 2795.71,-431"/>
<text xml:space="preserve" text-anchor="start" x="2803.82" y="-444.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2822.71,-431 2822.71,-463.8 2985.16,-463.8 2985.16,-431 2822.71,-431"/>
<text xml:space="preserve" text-anchor="start" x="2825.71" y="-443.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda staging o destino</text>
</g>
<!-- restcalltaskprovider&#45;&gt;externalapi -->
<g id="edge7" class="edge">
<title>restcalltaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2732.32,-138C2825.5,-138 2943.22,-138 3038.14,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3037.9,-140.63 3045.4,-138 3037.9,-135.38 3037.9,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2829.96,-141 2829.96,-173.8 2853.96,-173.8 2853.96,-141 2829.96,-141"/>
<text xml:space="preserve" text-anchor="start" x="2838.07" y="-154.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">7</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2856.96,-141 2856.96,-173.8 2950.91,-173.8 2950.91,-141 2856.96,-141"/>
<text xml:space="preserve" text-anchor="start" x="2859.96" y="-153.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Envia payload</text>
</g>
</g>
</svg>
`;case"usecase_uc05_scheduled_execution":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="4077pt" height="548pt"
 viewBox="0.00 0.00 4077.00 548.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 533.05)">
<g id="clust1" class="cluster">
<title>cluster_observability</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="3030.69,-8 3030.69,-289 4038.95,-289 4038.95,-8 3030.69,-8"/>
<text xml:space="preserve" text-anchor="start" x="3038.69" y="-276.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">OBSERVABILIDAD</text>
</g>
<!-- scheduleractor -->
<g id="node1" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-373 0,-373 0,-193 320.04,-193 320.04,-373"/>
<text xml:space="preserve" text-anchor="start" x="114.99" y="-277" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- processschedulerservice -->
<g id="node2" class="node">
<title>processschedulerservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="980.4,-373 660.36,-373 660.36,-193 980.4,-193 980.4,-373"/>
<text xml:space="preserve" text-anchor="start" x="705.89" y="-277" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessSchedulerService</text>
</g>
<!-- processexecutionservice -->
<g id="node3" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1560.63,-373 1240.59,-373 1240.59,-193 1560.63,-193 1560.63,-373"/>
<text xml:space="preserve" text-anchor="start" x="1287.22" y="-277" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- processengine -->
<g id="node4" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2237.33,-373 1917.29,-373 1917.29,-193 2237.33,-193 2237.33,-373"/>
<text xml:space="preserve" text-anchor="start" x="2007.27" y="-277" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- auditservice -->
<g id="node5" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2821.42,-518 2501.38,-518 2501.38,-338 2821.42,-338 2821.42,-518"/>
<text xml:space="preserve" text-anchor="start" x="2602.49" y="-422" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- telemetry -->
<g id="node6" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2821.42,-228 2501.38,-228 2501.38,-48 2821.42,-48 2821.42,-228"/>
<text xml:space="preserve" text-anchor="start" x="2520.78" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- otel -->
<g id="node7" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3390.73,-228 3070.69,-228 3070.69,-48 3390.73,-48 3390.73,-228"/>
<text xml:space="preserve" text-anchor="start" x="3119.55" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node8" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3998.95,-228 3678.91,-228 3678.91,-48 3998.95,-48 3998.95,-228"/>
<text xml:space="preserve" text-anchor="start" x="3808.35" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- scheduleractor&#45;&gt;processschedulerservice -->
<g id="edge1" class="edge">
<title>scheduleractor&#45;&gt;processschedulerservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.97,-283C419.76,-283 548.34,-283 650.05,-283"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="649.9,-285.63 657.4,-283 649.9,-280.38 649.9,-285.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-286 383.04,-318.8 407.04,-318.8 407.04,-286 383.04,-286"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-299.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-286 410.04,-318.8 597.36,-318.8 597.36,-286 410.04,-286"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-298.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Detecta proceso programado</text>
</g>
<!-- processschedulerservice&#45;&gt;processexecutionservice -->
<g id="edge2" class="edge">
<title>processschedulerservice&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.15,-283C1057.9,-283 1151.56,-283 1230.63,-283"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1230.17,-285.63 1237.67,-283 1230.17,-280.38 1230.17,-285.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1043.4,-286 1043.4,-318.8 1067.4,-318.8 1067.4,-286 1043.4,-286"/>
<text xml:space="preserve" text-anchor="start" x="1051.51" y="-299.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1070.4,-286 1070.4,-318.8 1177.59,-318.8 1177.59,-286 1070.4,-286"/>
<text xml:space="preserve" text-anchor="start" x="1073.4" y="-298.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lanza ejecucion</text>
</g>
<!-- processexecutionservice&#45;&gt;processengine -->
<g id="edge3" class="edge">
<title>processexecutionservice&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1560.22,-283C1664.46,-283 1800.71,-283 1907.04,-283"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1907.03,-285.63 1914.53,-283 1907.03,-280.38 1907.03,-285.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1623.63,-286 1623.63,-318.8 1647.63,-318.8 1647.63,-286 1623.63,-286"/>
<text xml:space="preserve" text-anchor="start" x="1631.74" y="-299.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1650.63,-286 1650.63,-318.8 1854.29,-318.8 1854.29,-286 1650.63,-286"/>
<text xml:space="preserve" text-anchor="start" x="1653.63" y="-298.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Orquesta la ejecucion del motor</text>
</g>
<!-- processengine&#45;&gt;auditservice -->
<g id="edge4" class="edge">
<title>processengine&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2236.99,-322.53C2315.84,-342.17 2411.16,-365.91 2491.38,-385.9"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2490.74,-388.44 2498.65,-387.71 2492.01,-383.35 2490.74,-388.44"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2300.33,-375.75 2300.33,-408.55 2324.33,-408.55 2324.33,-375.75 2300.33,-375.75"/>
<text xml:space="preserve" text-anchor="start" x="2308.44" y="-388.95" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2327.33,-375.75 2327.33,-408.55 2438.38,-408.55 2438.38,-375.75 2327.33,-375.75"/>
<text xml:space="preserve" text-anchor="start" x="2330.33" y="-387.95" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- processengine&#45;&gt;telemetry -->
<g id="edge5" class="edge">
<title>processengine&#45;&gt;telemetry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2236.99,-243.47C2315.84,-223.83 2411.16,-200.09 2491.38,-180.1"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2492.01,-182.65 2498.65,-178.29 2490.74,-177.56 2492.01,-182.65"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2314.34,-230.75 2314.34,-263.55 2338.34,-263.55 2338.34,-230.75 2314.34,-230.75"/>
<text xml:space="preserve" text-anchor="start" x="2322.45" y="-243.95" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2341.34,-230.75 2341.34,-263.55 2424.37,-263.55 2424.37,-230.75 2341.34,-230.75"/>
<text xml:space="preserve" text-anchor="start" x="2344.34" y="-242.95" font-family="Arial" font-size="14.00" fill="#c9c9c9">Emite spans</text>
</g>
<!-- telemetry&#45;&gt;otel -->
<g id="edge6" class="edge">
<title>telemetry&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2821.18,-138C2895.85,-138 2984.93,-138 3060.82,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3060.44,-140.63 3067.94,-138 3060.44,-135.38 3060.44,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2884.42,-141 2884.42,-173.8 2908.42,-173.8 2908.42,-141 2884.42,-141"/>
<text xml:space="preserve" text-anchor="start" x="2892.53" y="-154.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2911.42,-141 2911.42,-173.8 3007.69,-173.8 3007.69,-141 2911.42,-141"/>
<text xml:space="preserve" text-anchor="start" x="2914.42" y="-153.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge7" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3390.59,-138C3476.04,-138 3581.44,-138 3668.47,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3668.46,-140.63 3675.96,-138 3668.46,-135.38 3668.46,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3453.73,-141 3453.73,-173.8 3477.73,-173.8 3477.73,-141 3453.73,-141"/>
<text xml:space="preserve" text-anchor="start" x="3461.83" y="-154.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">7</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3480.73,-141 3480.73,-173.8 3615.91,-173.8 3615.91,-141 3480.73,-141"/>
<text xml:space="preserve" text-anchor="start" x="3483.73" y="-153.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica visualizacion</text>
</g>
</g>
</svg>
`;case"usecase_uc09_access":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2264pt" height="449pt"
 viewBox="0.00 0.00 2264.00 449.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 434.05)">
<!-- platformadmin -->
<g id="node1" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-335 0,-335 0,-155 320.04,-155 320.04,-335"/>
<text xml:space="preserve" text-anchor="start" x="91.67" y="-239" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- iam -->
<g id="node2" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="961.69,-180 641.65,-180 641.65,0 961.69,0 961.69,-180"/>
<text xml:space="preserve" text-anchor="start" x="761.1" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- oidcclient -->
<g id="node3" class="node">
<title>oidcclient</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1611.15,-419 1291.11,-419 1291.11,-239 1611.15,-239 1611.15,-419"/>
<text xml:space="preserve" text-anchor="start" x="1397.78" y="-323" font-family="Arial" font-size="20.00" fill="#eff6ff">OIDC Client</text>
</g>
<!-- processdefinitionresource -->
<g id="node4" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2234.16,-265 1914.12,-265 1914.12,-85 2234.16,-85 2234.16,-265"/>
<text xml:space="preserve" text-anchor="start" x="1953.53" y="-169" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge1" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.96,-206.49C414.75,-183.52 535.03,-154.37 631.56,-130.98"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="632.11,-133.55 638.78,-129.23 630.87,-128.45 632.11,-133.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-193.44 383.04,-226.24 407.04,-226.24 407.04,-193.44 383.04,-193.44"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-206.64" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-193.44 410.04,-226.24 578.65,-226.24 578.65,-193.44 410.04,-193.44"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-205.64" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra clientes y roles</text>
</g>
<!-- platformadmin&#45;&gt;oidcclient -->
<g id="edge2" class="edge">
<title>platformadmin&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.93,-258.84C492.57,-273.49 776.54,-296.45 1021.69,-311 1106.95,-316.06 1201.84,-320.2 1280.6,-323.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1280.49,-325.85 1288.08,-323.51 1280.69,-320.6 1280.49,-325.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="709.68,-310.03 709.68,-342.83 733.68,-342.83 733.68,-310.03 709.68,-310.03"/>
<text xml:space="preserve" text-anchor="start" x="717.79" y="-323.23" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="736.68,-310.03 736.68,-342.83 893.67,-342.83 893.67,-310.03 736.68,-310.03"/>
<text xml:space="preserve" text-anchor="start" x="739.68" y="-322.23" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida acceso a consola</text>
</g>
<!-- iam&#45;&gt;oidcclient -->
<g id="edge3" class="edge">
<title>iam&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M971.26,-152.23C1070.11,-188.72 1194.23,-234.54 1291.33,-270.38"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="972.26,-149.8 964.31,-149.67 970.44,-154.73 972.26,-149.8"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1024.69,-247.87 1024.69,-280.67 1048.69,-280.67 1048.69,-247.87 1024.69,-247.87"/>
<text xml:space="preserve" text-anchor="start" x="1032.8" y="-261.07" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1051.69,-247.87 1051.69,-280.67 1228.11,-280.67 1228.11,-247.87 1051.69,-247.87"/>
<text xml:space="preserve" text-anchor="start" x="1054.69" y="-260.07" font-family="Arial" font-size="14.00" fill="#c9c9c9">Solicita autenticacion OIDC</text>
</g>
<!-- iam&#45;&gt;processdefinitionresource -->
<g id="edge5" class="edge">
<title>iam&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M971.79,-101.31C1218.5,-117.82 1673.84,-148.28 1914.49,-164.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="972.33,-98.72 964.67,-100.84 971.98,-103.96 972.33,-98.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1370.04,-146.71 1370.04,-179.51 1394.04,-179.51 1394.04,-146.71 1370.04,-146.71"/>
<text xml:space="preserve" text-anchor="start" x="1378.14" y="-159.91" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1397.04,-146.71 1397.04,-179.51 1532.22,-179.51 1532.22,-146.71 1397.04,-146.71"/>
<text xml:space="preserve" text-anchor="start" x="1400.04" y="-158.91" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida tokens y roles</text>
</g>
<!-- oidcclient&#45;&gt;processdefinitionresource -->
<g id="edge4" class="edge">
<title>oidcclient&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1610.84,-289.64C1700.56,-267.39 1812.69,-239.59 1904.05,-216.93"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1904.65,-219.49 1911.3,-215.13 1903.38,-214.39 1904.65,-219.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1674.15,-273.32 1674.15,-306.12 1698.15,-306.12 1698.15,-273.32 1674.15,-273.32"/>
<text xml:space="preserve" text-anchor="start" x="1682.25" y="-286.52" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1701.15,-273.32 1701.15,-306.12 1851.12,-306.12 1851.12,-273.32 1701.15,-273.32"/>
<text xml:space="preserve" text-anchor="start" x="1704.15" y="-285.52" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
</g>
</svg>
`;default:throw new Error("Unknown viewId: "+e)}}export{n as dotSource,t as svgSource};
