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
            persistencelayer [height=2.5,
                label=<<FONT POINT-SIZE="20">Panache Persistence Layer</FONT>>,
                likec4_id="integrationHub.quarkusApp.persistenceLayer",
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
            domainentities [height=2.5,
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
    adminconsole -> processdefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de procesos</FONT></TD></TR></TABLE>>,
        likec4_id=zkbqvn,
        style=dashed];
    adminconsole -> sourcedefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de sources</FONT></TD></TR></TABLE>>,
        likec4_id=knetph,
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
    sourcedefinitionresource -> processcatalogservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega gestion de sources</FONT></TD></TR></TABLE>>,
        likec4_id="24mw7h",
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
    processcatalogservice -> persistencelayer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste definiciones</FONT></TD></TR></TABLE>>,
        likec4_id="1dq7j5n",
        style=dashed,
        weight=3];
    processschedulequeryservice -> persistencelayer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta programaciones</FONT></TD></TR></TABLE>>,
        likec4_id=hk1x8n,
        style=dashed,
        weight=3];
    executionqueryservice -> persistencelayer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones y auditoria</FONT></TD></TR></TABLE>>,
        likec4_id="1edfnbv",
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
    persistencelayer -> domainentities [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee y persiste</FONT></TD></TR></TABLE>>,
        likec4_id=duwfnn,
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
    persistencelayer -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Opera sobre PostgreSQL</FONT></TD></TR></TABLE>>,
        likec4_id=kkoki,
        style=dashed];
    processengine -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert, update y upsert</FONT></TD></TR></TABLE>>,
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
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=process_engine_code,
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
            persistencelayer [height=2.5,
                label=<<FONT POINT-SIZE="20">Panache Persistence Layer</FONT>>,
                likec4_id="integrationHub.quarkusApp.persistenceLayer",
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
    db [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    persistencelayer -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Opera sobre PostgreSQL</FONT></TD></TR></TABLE>>,
        likec4_id=kkoki,
        minlen=1,
        style=dashed,
        weight=2];
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert, update y upsert</FONT></TD></TR></TABLE>>,
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
            graph [color="#1c3979",
                fillcolor="#1a468d",
                label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>DOMAIN ENTITIES</B></FONT>>,
                likec4_depth=2,
                likec4_id="integrationHub.quarkusApp.domainEntities",
                likec4_level=1,
                margin=40,
                style=filled
            ];
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
                processtaskexecutionentity [group="integrationHub.quarkusApp.domainEntities.executionEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ProcessTaskExecution</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.executionEntities.processTaskExecutionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                auditevententity [group="integrationHub.quarkusApp.domainEntities.executionEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">AuditEvent</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.executionEntities.auditEventEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                processexecutionentity [group="integrationHub.quarkusApp.domainEntities.executionEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ProcessExecution</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.executionEntities.processExecutionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
            }
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
                processdefinitionentity [group="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ProcessDefinition</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities.processDefinitionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                processtaskdefinitionentity [group="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ProcessTaskDefinition</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities.processTaskDefinitionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                sourcedefinitionentity [group="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">SourceDefinition</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities.sourceDefinitionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
                readerdefinitionentity [group="integrationHub.quarkusApp.domainEntities.catalogEntities",
                    height=2.5,
                    label=<<FONT POINT-SIZE="20">ReaderDefinition</FONT>>,
                    likec4_id="integrationHub.quarkusApp.domainEntities.catalogEntities.readerDefinitionEntity",
                    likec4_level=3,
                    margin="0.223,0.223",
                    width=4.445];
            }
        }
    }
    processtaskexecutionentity -> processexecutionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">n..1 processExecution</FONT></TD></TR></TABLE>>,
        likec4_id="71110n",
        style=dashed,
        weight=3];
    processtaskexecutionentity -> processtaskdefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">n..1 taskDefinition</FONT></TD></TR></TABLE>>,
        likec4_id="3fktak",
        style=dashed];
    auditevententity -> processexecutionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">n..1 processExecution</FONT></TD></TR></TABLE>>,
        likec4_id=lvhv0y,
        style=dashed,
        weight=3];
    auditevententity -> processtaskdefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..1 taskDefinition</FONT></TD></TR></TABLE>>,
        likec4_id="1snh3bt",
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
    processexecutionentity -> processdefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">n..1 processDefinition</FONT></TD></TR></TABLE>>,
        likec4_id="1bhtebw",
        style=dashed];
    processdefinitionentity -> processtaskdefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">1..n tasks</FONT></TD></TR></TABLE>>,
        likec4_id=kioqpz,
        style=dashed,
        weight=3];
    processtaskdefinitionentity -> sourcedefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..1 sourceDefinition</FONT></TD></TR></TABLE>>,
        likec4_id="6k6wdt",
        minlen=1,
        style=dashed,
        weight=3];
    processtaskdefinitionentity -> readerdefinitionentity [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">0..1 readerDefinition</FONT></TD></TR></TABLE>>,
        likec4_id="1r4tf49",
        style=dashed,
        weight=3];
    readerdefinitionentity -> db [arrowhead=normal,
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
  "persistencelayer" [
    likec4_id = "integrationHub.quarkusApp.persistenceLayer";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Panache Persistence Layer</FONT>>;
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
  "sourcedefinitionresource" -> "processcatalogservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Delega alta de catalogo</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processcatalogservice" -> "persistencelayer" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste source definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "persistencelayer" -> "db" [
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
  "persistencelayer" [
    likec4_id = "integrationHub.quarkusApp.persistenceLayer";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Panache Persistence Layer</FONT>>;
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
  "processdesigner" -> "processdefinitionresource" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra reader definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processdefinitionresource" -> "processcatalogservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Delega alta de catalogo</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processcatalogservice" -> "persistencelayer" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste reader definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "persistencelayer" -> "db" [
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
  "persistencelayer" [
    likec4_id = "integrationHub.quarkusApp.persistenceLayer";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Panache Persistence Layer</FONT>>;
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
  "processcatalogservice" -> "persistencelayer" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste definicion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "persistencelayer" -> "db" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda process definition y tasks</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3516.04,-180 3196,-180 3196,0 3516.04,0 3516.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="3315.44" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1442.04,-180 1122,-180 1122,0 1442.04,0 1442.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1219.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- db -->
<g id="node17" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1872.04,-180 1552,-180 1552,0 1872.04,0 1872.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1657.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node18" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2302.04,-180 1982,-180 1982,0 2302.04,0 2302.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2064.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node19" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.04,-180 2412,-180 2412,0 2732.04,0 2732.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2505.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
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
<g id="edge15" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2086.78,-375.93C2358.36,-314.97 2907.6,-191.67 3186,-129.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3186.5,-131.75 3193.24,-127.54 3185.35,-126.62 3186.5,-131.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2684.37,-240 2684.37,-262.8 2711.36,-262.8 2711.36,-240 2684.37,-240"/>
<text xml:space="preserve" text-anchor="start" x="2687.37" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge14" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1767.17,-332.3C1671.12,-284.53 1549,-223.79 1451.32,-175.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1452.53,-172.88 1444.65,-171.89 1450.2,-177.58 1452.53,-172.88"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1623.86,-240 1623.86,-262.8 1650.85,-262.8 1650.85,-240 1623.86,-240"/>
<text xml:space="preserve" text-anchor="start" x="1626.86" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge16" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1867.42,-322.87C1839.45,-281.14 1806.06,-231.31 1777.4,-188.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1779.59,-187.11 1773.24,-182.34 1775.23,-190.04 1779.59,-187.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1825.97,-240 1825.97,-262.8 1852.96,-262.8 1852.96,-240 1825.97,-240"/>
<text xml:space="preserve" text-anchor="start" x="1828.97" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge17" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1986.62,-322.87C2014.59,-281.14 2047.98,-231.31 2076.64,-188.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2078.81,-190.04 2080.8,-182.34 2074.45,-187.11 2078.81,-190.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2040.97,-240 2040.97,-262.8 2067.96,-262.8 2067.96,-240 2040.97,-240"/>
<text xml:space="preserve" text-anchor="start" x="2043.97" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge18" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2086.87,-332.3C2182.92,-284.53 2305.04,-223.79 2402.72,-175.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2403.84,-177.58 2409.39,-171.89 2401.51,-172.88 2403.84,-177.58"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2268.86,-240 2268.86,-262.8 2365.12,-262.8 2365.12,-240 2268.86,-240"/>
<text xml:space="preserve" text-anchor="start" x="2271.86" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
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
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3606.86,-645.79C3552.77,-526.14 3456.8,-313.88 3400.55,-189.48"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3402.96,-188.45 3397.48,-182.69 3398.18,-190.61 3402.96,-188.45"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3539.91,-401.4 3539.91,-424.2 3586.37,-424.2 3586.37,-401.4 3539.91,-401.4"/>
<text xml:space="preserve" text-anchor="start" x="3542.91" y="-408.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
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
<svg width="2456pt" height="1565pt"
 viewBox="0.00 0.00 2456.00 1565.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1550.25)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#1a468d" stroke="#1c3979" points="8,-249 8,-1286.2 2208,-1286.2 2208,-249 8,-249"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1273.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="743,-621 743,-1225 2003,-1225 2003,-621 743,-621"/>
<text xml:space="preserve" text-anchor="start" x="751" y="-1212.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE APP (FRONT)</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="48,-289 48,-570.2 2168,-570.2 2168,-289 48,-289"/>
<text xml:space="preserve" text-anchor="start" x="56" y="-557.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<!-- reactapp -->
<g id="node1" class="node">
<title>reactapp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1533.02,-1163.8 1212.98,-1163.8 1212.98,-983.8 1533.02,-983.8 1533.02,-1163.8"/>
<text xml:space="preserve" text-anchor="start" x="1277.13" y="-1067.8" font-family="Arial" font-size="20.00" fill="#eff6ff">React + PatternFly UI</text>
</g>
<!-- oidcclient -->
<g id="node2" class="node">
<title>oidcclient</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1963.02,-841 1642.98,-841 1642.98,-661 1963.02,-661 1963.02,-841"/>
<text xml:space="preserve" text-anchor="start" x="1749.66" y="-745" font-family="Arial" font-size="20.00" fill="#eff6ff">OIDC Client</text>
</g>
<!-- processdesigner -->
<g id="node3" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1103.02,-841 782.98,-841 782.98,-661 1103.02,-661 1103.02,-841"/>
<text xml:space="preserve" text-anchor="start" x="864.08" y="-745" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node4" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1533.02,-841 1212.98,-841 1212.98,-661 1533.02,-661 1533.02,-841"/>
<text xml:space="preserve" text-anchor="start" x="1284.62" y="-745" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
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
<!-- processexecutionresource -->
<g id="node7" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1268.02,-509 947.98,-509 947.98,-329 1268.02,-329 1268.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="985.16" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processscheduleresource -->
<g id="node8" class="node">
<title>processscheduleresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-509 1377.98,-509 1377.98,-329 1698.02,-329 1698.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="1417.38" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleResource</text>
</g>
<!-- executionqueryresource -->
<g id="node9" class="node">
<title>executionqueryresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2128.02,-509 1807.98,-509 1807.98,-329 2128.02,-329 2128.02,-509"/>
<text xml:space="preserve" text-anchor="start" x="1854.05" y="-413" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryResource</text>
</g>
<!-- user -->
<g id="node10" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="673.02,-1535.2 352.98,-1535.2 352.98,-1355.2 673.02,-1355.2 673.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="426.83" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node11" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1103.02,-1535.2 782.98,-1535.2 782.98,-1355.2 1103.02,-1355.2 1103.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="805.15" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node12" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1533.02,-1535.2 1212.98,-1535.2 1212.98,-1355.2 1533.02,-1355.2 1533.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="1294.62" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node13" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1963.02,-1535.2 1642.98,-1535.2 1642.98,-1355.2 1963.02,-1355.2 1963.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="1763.54" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node14" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2393.02,-1535.2 2072.98,-1535.2 2072.98,-1355.2 2393.02,-1355.2 2393.02,-1535.2"/>
<text xml:space="preserve" text-anchor="start" x="2201.32" y="-1439.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- iam -->
<g id="node15" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="2426.02,-180 2105.98,-180 2105.98,0 2426.02,0 2426.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="2225.42" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node16" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1996.02,-180 1675.98,-180 1675.98,0 1996.02,0 1996.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="1781.53" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- reactapp&#45;&gt;oidcclient -->
<g id="edge6" class="edge">
<title>reactapp&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1499.6,-983.82C1526.93,-964.25 1555.55,-943.49 1582,-923.8 1614.79,-899.38 1649.89,-872.46 1682.25,-847.32"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1683.71,-849.51 1688.02,-842.83 1680.49,-845.36 1683.71,-849.51"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1606.29,-901 1606.29,-923.8 1712.68,-923.8 1712.68,-901 1606.29,-901"/>
<text xml:space="preserve" text-anchor="start" x="1609.29" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Gestiona sesion</text>
</g>
<!-- reactapp&#45;&gt;processdesigner -->
<g id="edge7" class="edge">
<title>reactapp&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1229.86,-983.83C1200.92,-964.71 1171.06,-944.12 1143.89,-923.8 1112.43,-900.28 1079.55,-873.27 1049.71,-847.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1051.49,-845.82 1044.09,-842.92 1048.07,-849.8 1051.49,-845.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1143.89,-901 1143.89,-923.8 1346,-923.8 1346,-901 1143.89,-901"/>
<text xml:space="preserve" text-anchor="start" x="1146.89" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura catalogos y procesos</text>
</g>
<!-- reactapp&#45;&gt;operationsconsole -->
<g id="edge8" class="edge">
<title>reactapp&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1373,-983.87C1373,-942.67 1373,-893.56 1373,-851.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1375.63,-851.36 1373,-843.86 1370.38,-851.36 1375.63,-851.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1373,-901 1373,-923.8 1554.88,-923.8 1554.88,-901 1373,-901"/>
<text xml:space="preserve" text-anchor="start" x="1376" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta y ejecuta procesos</text>
</g>
<!-- oidcclient&#45;&gt;iam -->
<g id="edge9" class="edge">
<title>oidcclient&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1962.74,-715.43C2044.79,-689.31 2139.04,-644.75 2195,-570.2 2277.7,-460.03 2283.64,-294.67 2277.19,-189.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2279.82,-189.9 2276.71,-182.59 2274.58,-190.25 2279.82,-189.9"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2279.09,-407.6 2279.09,-430.4 2415.83,-430.4 2415.83,-407.6 2279.09,-407.6"/>
<text xml:space="preserve" text-anchor="start" x="2282.09" y="-414.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Login y refresh token</text>
</g>
<!-- processdesigner&#45;&gt;processdefinitionresource -->
<g id="edge10" class="edge">
<title>processdesigner&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M783.04,-701.34C687.57,-669.56 565.39,-624.04 463,-570.2 432.56,-554.19 401.36,-534.55 372.5,-514.82"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="374.18,-512.79 366.52,-510.69 371.2,-517.11 374.18,-512.79"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="525.44,-578.2 525.44,-601 652.04,-601 652.04,-578.2 525.44,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="528.44" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de procesos</text>
</g>
<!-- processdesigner&#45;&gt;sourcedefinitionresource -->
<g id="edge11" class="edge">
<title>processdesigner&#45;&gt;sourcedefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M871.64,-661.13C835.84,-616.56 792.43,-562.5 755.79,-516.86"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="757.9,-515.3 751.16,-511.1 753.81,-518.59 757.9,-515.3"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="818.45,-578.2 818.45,-601 937.26,-601 937.26,-578.2 818.45,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="821.45" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de sources</text>
</g>
<!-- operationsconsole&#45;&gt;processexecutionresource -->
<g id="edge12" class="edge">
<title>operationsconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1301.64,-661.13C1265.84,-616.56 1222.43,-562.5 1185.79,-516.86"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1187.9,-515.3 1181.16,-511.1 1183.81,-518.59 1187.9,-515.3"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1248.45,-578.2 1248.45,-601 1361.84,-601 1361.84,-578.2 1248.45,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="1251.45" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- operationsconsole&#45;&gt;processscheduleresource -->
<g id="edge13" class="edge">
<title>operationsconsole&#45;&gt;processscheduleresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1417.43,-661.13C1439.54,-616.93 1466.3,-563.39 1489,-518"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1491.27,-519.33 1492.28,-511.45 1486.57,-516.98 1491.27,-519.33"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1455.5,-578.2 1455.5,-601 1621.03,-601 1621.03,-578.2 1455.5,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="1458.5" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- operationsconsole&#45;&gt;executionqueryresource -->
<g id="edge14" class="edge">
<title>operationsconsole&#45;&gt;executionqueryresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1510.01,-661.14C1535.38,-646.62 1562.06,-632.57 1588,-621 1658.08,-589.74 1684.05,-603.87 1753,-570.2 1784.56,-554.79 1816.62,-535.03 1846.02,-514.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1847.47,-517.13 1852.15,-510.7 1844.49,-512.81 1847.47,-517.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1733.52,-578.2 1733.52,-601 1941.08,-601 1941.08,-578.2 1733.52,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="1736.52" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoria</text>
</g>
<!-- executionqueryresource&#45;&gt;iam -->
<g id="edge16" class="edge">
<title>executionqueryresource&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2085.56,-289C2116.35,-255.22 2149.02,-219.37 2177.97,-187.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2179.83,-189.45 2182.94,-182.14 2175.95,-185.92 2179.83,-189.45"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1997.5,-234.73 1997.5,-257.53 2135.02,-257.53 2135.02,-234.73 1997.5,-234.73"/>
<text xml:space="preserve" text-anchor="start" x="2000.5" y="-241.93" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- executionqueryresource&#45;&gt;db -->
<g id="edge15" class="edge">
<title>executionqueryresource&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1915.93,-289C1902.57,-255.9 1888.41,-220.83 1875.78,-189.54"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1878.26,-188.68 1873.02,-182.71 1873.39,-190.65 1878.26,-188.68"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1655.31,-234.66 1655.31,-274.26 1893.99,-274.26 1893.99,-234.66 1655.31,-234.66"/>
<text xml:space="preserve" text-anchor="start" x="1658.31" y="-258.66" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="1658.31" y="-241.86" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- user&#45;&gt;reactapp -->
<g id="edge1" class="edge">
<title>user&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M673,-1375.48C768.94,-1334.26 895.02,-1280.11 1013.7,-1229.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1014.69,-1231.56 1020.54,-1226.19 1012.62,-1226.74 1014.69,-1231.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="661.31,-1300.37 661.31,-1323.17 847.86,-1323.17 847.86,-1300.37 661.31,-1300.37"/>
<text xml:space="preserve" text-anchor="start" x="664.31" y="-1307.57" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;reactapp -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1046.54,-1355.25C1089.71,-1318.17 1141.15,-1273.97 1190.29,-1231.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1191.89,-1233.85 1195.86,-1226.97 1188.46,-1229.87 1191.89,-1233.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="879.13,-1290.01 879.13,-1312.81 1122.48,-1312.81 1122.48,-1290.01 879.13,-1290.01"/>
<text xml:space="preserve" text-anchor="start" x="882.13" y="-1297.21" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;reactapp -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1373,-1355.25C1373,-1319.24 1373,-1276.51 1373,-1235.41"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1375.63,-1235.52 1373,-1228.02 1370.38,-1235.52 1375.63,-1235.52"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1165.46,-1290.07 1165.46,-1312.87 1373,-1312.87 1373,-1290.07 1165.46,-1290.07"/>
<text xml:space="preserve" text-anchor="start" x="1168.46" y="-1297.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;reactapp -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1699.46,-1355.25C1656.29,-1318.17 1604.85,-1273.97 1555.71,-1231.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1557.54,-1229.87 1550.14,-1226.97 1554.11,-1233.85 1557.54,-1229.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1510.13,-1290.01 1510.13,-1312.81 1623.52,-1312.81 1623.52,-1290.01 1510.13,-1290.01"/>
<text xml:space="preserve" text-anchor="start" x="1513.13" y="-1297.21" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;reactapp -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2073,-1375.48C1977.06,-1334.26 1850.98,-1280.11 1732.3,-1229.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1733.38,-1226.74 1725.46,-1226.19 1731.31,-1231.56 1733.38,-1226.74"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1699.92,-1300.37 1699.92,-1323.17 1898.14,-1323.17 1898.14,-1300.37 1699.92,-1300.37"/>
<text xml:space="preserve" text-anchor="start" x="1702.92" y="-1307.57" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
</g>
</svg>
`;case"backend_components":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="4183pt" height="2229pt"
 viewBox="0.00 0.00 4183.00 2229.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2213.65)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#1a468d" stroke="#1c3979" points="8,-306.2 8,-1927.8 3068,-1927.8 3068,-306.2 8,-306.2"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1914.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="48,-346.2 48,-1595.8 3028,-1595.8 3028,-346.2 48,-346.2"/>
<text xml:space="preserve" text-anchor="start" x="56" y="-1582.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="436,-8 436,-289.2 2126,-289.2 2126,-8 436,-8"/>
<text xml:space="preserve" text-anchor="start" x="444" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_observability</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="2156,-8 2156,-289.2 3083,-289.2 3083,-8 2156,-8"/>
<text xml:space="preserve" text-anchor="start" x="2164" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">OBSERVABILIDAD</text>
</g>
<!-- telemetry -->
<g id="node1" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="408.02,-1534.6 87.98,-1534.6 87.98,-1354.6 408.02,-1354.6 408.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="107.38" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- processdefinitionresource -->
<g id="node2" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1268.02,-1534.6 947.98,-1534.6 947.98,-1354.6 1268.02,-1354.6 1268.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="987.39" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- sourcedefinitionresource -->
<g id="node3" class="node">
<title>sourcedefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="838.02,-1534.6 517.98,-1534.6 517.98,-1354.6 838.02,-1354.6 838.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="561.83" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinitionResource</text>
</g>
<!-- processexecutionresource -->
<g id="node4" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2988.02,-1534.6 2667.98,-1534.6 2667.98,-1354.6 2988.02,-1354.6 2988.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="2705.16" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processscheduleresource -->
<g id="node5" class="node">
<title>processscheduleresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2128.02,-1534.6 1807.98,-1534.6 1807.98,-1354.6 2128.02,-1354.6 2128.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="1847.38" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleResource</text>
</g>
<!-- executionqueryresource -->
<g id="node6" class="node">
<title>executionqueryresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-1534.6 1377.98,-1534.6 1377.98,-1354.6 1698.02,-1354.6 1698.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="1424.05" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryResource</text>
</g>
<!-- processschedulerservice -->
<g id="node7" class="node">
<title>processschedulerservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2558.02,-1534.6 2237.98,-1534.6 2237.98,-1354.6 2558.02,-1354.6 2558.02,-1534.6"/>
<text xml:space="preserve" text-anchor="start" x="2283.5" y="-1438.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessSchedulerService</text>
</g>
<!-- processcatalogservice -->
<g id="node8" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1268.02,-1211.8 947.98,-1211.8 947.98,-1031.8 1268.02,-1031.8 1268.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="1004.06" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- processschedulequeryservice -->
<g id="node9" class="node">
<title>processschedulequeryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2128.02,-1211.8 1807.98,-1211.8 1807.98,-1031.8 2128.02,-1031.8 2128.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="1829.6" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleQueryService</text>
</g>
<!-- executionqueryservice -->
<g id="node10" class="node">
<title>executionqueryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-1211.8 1377.98,-1211.8 1377.98,-1031.8 1698.02,-1031.8 1698.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="1433.51" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryService</text>
</g>
<!-- processexecutionservice -->
<g id="node11" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2558.02,-1211.8 2237.98,-1211.8 2237.98,-1031.8 2558.02,-1031.8 2558.02,-1211.8"/>
<text xml:space="preserve" text-anchor="start" x="2284.62" y="-1115.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- persistencelayer -->
<g id="node12" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-889 1377.98,-889 1377.98,-709 1698.02,-709 1698.02,-889"/>
<text xml:space="preserve" text-anchor="start" x="1415.71" y="-793" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- processengine -->
<g id="node13" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2558.02,-889 2237.98,-889 2237.98,-709 2558.02,-709 2558.02,-889"/>
<text xml:space="preserve" text-anchor="start" x="2327.96" y="-793" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- auditservice -->
<g id="node14" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2988.02,-889 2667.98,-889 2667.98,-709 2988.02,-709 2988.02,-889"/>
<text xml:space="preserve" text-anchor="start" x="2769.08" y="-793" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- domainentities -->
<g id="node15" class="node">
<title>domainentities</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1698.02,-566.2 1377.98,-566.2 1377.98,-386.2 1698.02,-386.2 1698.02,-566.2"/>
<text xml:space="preserve" text-anchor="start" x="1467.97" y="-470.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Domain Entities</text>
</g>
<!-- adminconsole -->
<g id="node16" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1913.02,-1866.6 1592.98,-1866.6 1592.98,-1686.6 1913.02,-1686.6 1913.02,-1866.6"/>
<text xml:space="preserve" text-anchor="start" x="1631.84" y="-1770.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- filesystem -->
<g id="node17" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2086.02,-228 1765.98,-228 1765.98,-48 2086.02,-48 2086.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="1873.77" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node18" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="796.02,-228 475.98,-228 475.98,-48 796.02,-48 796.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="617.11" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node19" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1226.02,-228 905.98,-228 905.98,-48 1226.02,-48 1226.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="1040.44" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node20" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1656.02,-228 1335.98,-228 1335.98,-48 1656.02,-48 1656.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="1434.87" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- otel -->
<g id="node21" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2516.02,-228 2195.98,-228 2195.98,-48 2516.02,-48 2516.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="2244.85" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node22" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3043.02,-228 2722.98,-228 2722.98,-48 3043.02,-48 3043.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="2852.42" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- user -->
<g id="node23" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1053.02,-2198.6 732.98,-2198.6 732.98,-2018.6 1053.02,-2018.6 1053.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="806.83" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node24" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1483.02,-2198.6 1162.98,-2198.6 1162.98,-2018.6 1483.02,-2018.6 1483.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="1185.15" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node25" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1913.02,-2198.6 1592.98,-2198.6 1592.98,-2018.6 1913.02,-2018.6 1913.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="1674.62" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node26" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2343.02,-2198.6 2022.98,-2198.6 2022.98,-2018.6 2343.02,-2018.6 2343.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="2143.54" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node27" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2773.02,-2198.6 2452.98,-2198.6 2452.98,-2018.6 2773.02,-2018.6 2773.02,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="2581.32" y="-2102.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- iam -->
<g id="node28" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="3473.02,-228 3152.98,-228 3152.98,-48 3473.02,-48 3473.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="3272.42" y="-132" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node29" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3428.02,-566.2 3107.98,-566.2 3107.98,-386.2 3428.02,-386.2 3428.02,-566.2"/>
<text xml:space="preserve" text-anchor="start" x="3213.53" y="-470.2" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node30" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3858.02,-566.2 3537.98,-566.2 3537.98,-386.2 3858.02,-386.2 3858.02,-566.2"/>
<text xml:space="preserve" text-anchor="start" x="3635.75" y="-470.2" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- processdefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge12" class="edge">
<title>processdefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1108,-1354.67C1108,-1313.47 1108,-1264.36 1108,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1110.63,-1222.16 1108,-1214.66 1105.38,-1222.16 1110.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1108,-1271.8 1108,-1294.6 1287.56,-1294.6 1287.56,-1271.8 1108,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="1111" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega gestion de procesos</text>
</g>
<!-- sourcedefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge13" class="edge">
<title>sourcedefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M797.21,-1354.67C854.3,-1312.07 922.72,-1261.03 980.81,-1217.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="982.07,-1220.03 986.51,-1213.44 978.93,-1215.82 982.07,-1220.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="905.89,-1271.8 905.89,-1294.6 1077.66,-1294.6 1077.66,-1271.8 905.89,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="908.89" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega gestion de sources</text>
</g>
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge14" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2728.58,-1354.74C2696.53,-1327.27 2660.39,-1297.5 2626,-1271.8 2601.48,-1253.47 2574.78,-1234.89 2548.57,-1217.34"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2550.29,-1215.34 2542.59,-1213.36 2547.38,-1219.71 2550.29,-1215.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2654.6,-1271.8 2654.6,-1294.6 2768,-1294.6 2768,-1271.8 2654.6,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="2657.6" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecucion</text>
</g>
<!-- processscheduleresource&#45;&gt;processschedulequeryservice -->
<g id="edge15" class="edge">
<title>processscheduleresource&#45;&gt;processschedulequeryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1968,-1354.67C1968,-1313.47 1968,-1264.36 1968,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1970.63,-1222.16 1968,-1214.66 1965.38,-1222.16 1970.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1968,-1271.8 1968,-1294.6 2160.79,-1294.6 2160.79,-1271.8 1968,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="1971" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consulta de schedules</text>
</g>
<!-- executionqueryresource&#45;&gt;executionqueryservice -->
<g id="edge16" class="edge">
<title>executionqueryresource&#45;&gt;executionqueryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-1354.67C1538,-1313.47 1538,-1264.36 1538,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-1222.16 1538,-1214.66 1535.38,-1222.16 1540.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1538,-1271.8 1538,-1294.6 1719.88,-1294.6 1719.88,-1271.8 1538,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="1541" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consultas operativas</text>
</g>
<!-- processschedulerservice&#45;&gt;processexecutionservice -->
<g id="edge17" class="edge">
<title>processschedulerservice&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2398,-1354.67C2398,-1313.47 2398,-1264.36 2398,-1221.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2400.63,-1222.16 2398,-1214.66 2395.38,-1222.16 2400.63,-1222.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2398,-1271.8 2398,-1294.6 2599.32,-1294.6 2599.32,-1271.8 2398,-1271.8"/>
<text xml:space="preserve" text-anchor="start" x="2401" y="-1279" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispara procesos programados</text>
</g>
<!-- processcatalogservice&#45;&gt;persistencelayer -->
<g id="edge19" class="edge">
<title>processcatalogservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1227.21,-1031.87C1284.3,-989.27 1352.72,-938.23 1410.81,-894.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1412.07,-897.23 1416.51,-890.64 1408.93,-893.02 1412.07,-897.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1335.89,-949 1335.89,-971.8 1470.29,-971.8 1470.29,-949 1335.89,-949"/>
<text xml:space="preserve" text-anchor="start" x="1338.89" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones</text>
</g>
<!-- processschedulequeryservice&#45;&gt;persistencelayer -->
<g id="edge20" class="edge">
<title>processschedulequeryservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1873.32,-1032.06C1842.23,-1004.38 1806.93,-974.45 1773,-949 1748.33,-930.49 1721.35,-911.95 1694.75,-894.54"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1696.38,-892.47 1688.66,-890.58 1693.52,-896.87 1696.38,-892.47"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1800.91,-949 1800.91,-971.8 1966.44,-971.8 1966.44,-949 1800.91,-949"/>
<text xml:space="preserve" text-anchor="start" x="1803.91" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- executionqueryservice&#45;&gt;persistencelayer -->
<g id="edge21" class="edge">
<title>executionqueryservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-1031.87C1538,-990.67 1538,-941.56 1538,-899.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-899.36 1538,-891.86 1535.38,-899.36 1540.63,-899.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1538,-949 1538,-971.8 1745.56,-971.8 1745.56,-949 1538,-949"/>
<text xml:space="preserve" text-anchor="start" x="1541" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoria</text>
</g>
<!-- processexecutionservice&#45;&gt;processengine -->
<g id="edge22" class="edge">
<title>processexecutionservice&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2398,-1031.87C2398,-990.67 2398,-941.56 2398,-899.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2400.63,-899.36 2398,-891.86 2395.38,-899.36 2400.63,-899.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2398,-949 2398,-971.8 2424.99,-971.8 2424.99,-949 2398,-949"/>
<text xml:space="preserve" text-anchor="start" x="2401" y="-957.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionservice&#45;&gt;auditservice -->
<g id="edge23" class="edge">
<title>processexecutionservice&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2517.21,-1031.87C2574.3,-989.27 2642.72,-938.23 2700.81,-894.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2702.07,-897.23 2706.51,-890.64 2698.93,-893.02 2702.07,-897.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2625.89,-949 2625.89,-971.8 2736.95,-971.8 2736.95,-949 2625.89,-949"/>
<text xml:space="preserve" text-anchor="start" x="2628.89" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- persistencelayer&#45;&gt;domainentities -->
<g id="edge24" class="edge">
<title>persistencelayer&#45;&gt;domainentities</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1538,-709.07C1538,-667.87 1538,-618.76 1538,-576.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1540.63,-576.56 1538,-569.06 1535.38,-576.56 1540.63,-576.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1538,-626.2 1538,-649 1631.16,-649 1631.16,-626.2 1538,-626.2"/>
<text xml:space="preserve" text-anchor="start" x="1541" y="-633.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee y persiste</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge25" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1697.93,-770.91C1906.6,-735.88 2283.2,-673.73 2606.03,-626.2 2805.2,-596.88 2860.67,-618.79 3055,-566.2 3069.36,-562.31 3084.03,-557.68 3098.63,-552.61"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3099.16,-555.2 3105.35,-550.22 3097.4,-550.25 3099.16,-555.2"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2606.03,-626.2 2606.03,-649 2770,-649 2770,-626.2 2606.03,-626.2"/>
<text xml:space="preserve" text-anchor="start" x="2609.03" y="-633.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Opera sobre PostgreSQL</text>
</g>
<!-- processengine&#45;&gt;db -->
<g id="edge26" class="edge">
<title>processengine&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2558,-730.12C2576.46,-722.78 2595.09,-715.59 2613,-709 2806.75,-637.73 2861.37,-637.79 3055,-566.2 3069.18,-560.96 3083.82,-555.32 3098.45,-549.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3099.26,-552.04 3105.25,-546.83 3097.32,-547.16 3099.26,-552.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2871.57,-626.2 2871.57,-649 3055.78,-649 3055.78,-626.2 2871.57,-626.2"/>
<text xml:space="preserve" text-anchor="start" x="2874.57" y="-633.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- processengine&#45;&gt;externalapi -->
<g id="edge27" class="edge">
<title>processengine&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2557.82,-726.44C2576.19,-719.83 2594.84,-713.82 2613,-709 2816.52,-654.92 2875.29,-683.7 3083,-649 3262.06,-619.08 3309.47,-619.56 3483,-566.2 3497.95,-561.6 3513.29,-556.36 3528.57,-550.78"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3529.11,-553.37 3535.24,-548.31 3527.29,-548.45 3529.11,-553.37"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3222.9,-626.2 3222.9,-649 3249.9,-649 3249.9,-626.2 3222.9,-626.2"/>
<text xml:space="preserve" text-anchor="start" x="3225.9" y="-634.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- domainentities&#45;&gt;filesystem -->
<g id="edge29" class="edge">
<title>domainentities&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1686.87,-346.2C1729.73,-309.07 1775.69,-269.24 1815.76,-234.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1817.2,-236.74 1821.15,-229.85 1813.77,-232.78 1817.2,-236.74"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1622.07,-287.24 1622.07,-310.04 1754.92,-310.04 1754.92,-287.24 1622.07,-287.24"/>
<text xml:space="preserve" text-anchor="start" x="1625.07" y="-294.44" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- domainentities&#45;&gt;ftp -->
<g id="edge30" class="edge">
<title>domainentities&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M992.04,-346.2C943.55,-329.13 895.88,-310.17 851,-289.2 818.57,-274.05 785.79,-254.04 755.92,-233.58"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="757.73,-231.64 750.07,-229.53 754.74,-235.96 757.73,-231.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="729.05,-289.19 729.05,-311.99 850.99,-311.99 850.99,-289.19 729.05,-289.19"/>
<text xml:space="preserve" text-anchor="start" x="732.05" y="-296.39" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- domainentities&#45;&gt;sftp -->
<g id="edge31" class="edge">
<title>domainentities&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1356.9,-346.2C1304.47,-308.86 1248.22,-268.79 1199.29,-233.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1200.86,-231.84 1193.23,-229.62 1197.81,-236.11 1200.86,-231.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1151.72,-286.91 1151.72,-309.71 1273.65,-309.71 1273.65,-286.91 1151.72,-286.91"/>
<text xml:space="preserve" text-anchor="start" x="1154.72" y="-294.11" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- domainentities&#45;&gt;restsource -->
<g id="edge32" class="edge">
<title>domainentities&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1521.88,-346.2C1517.41,-310.36 1512.62,-272.02 1508.39,-238.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1511.03,-238.1 1507.49,-230.98 1505.82,-238.75 1511.03,-238.1"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1345.08,-287.16 1345.08,-309.96 1514.51,-309.96 1514.51,-287.16 1345.08,-287.16"/>
<text xml:space="preserve" text-anchor="start" x="1348.08" y="-294.36" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- domainentities&#45;&gt;otel -->
<g id="edge33" class="edge">
<title>domainentities&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2022.17,-346.2C2067.21,-329.03 2111.49,-310.04 2153,-289.2 2183.4,-273.94 2214.02,-254.13 2241.93,-233.93"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2243.17,-236.28 2247.68,-229.73 2240.07,-232.04 2243.17,-236.28"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2056.75,-289.19 2056.75,-311.99 2153.01,-311.99 2153.01,-289.19 2056.75,-289.19"/>
<text xml:space="preserve" text-anchor="start" x="2059.75" y="-296.39" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- domainentities&#45;&gt;iam -->
<g id="edge28" class="edge">
<title>domainentities&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2790.85,-346.2C2948.11,-325.51 3068.72,-305.56 3110,-289.2 3143.71,-275.84 3176.84,-255.43 3206.23,-233.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3207.54,-236.22 3211.99,-229.63 3204.4,-232 3207.54,-236.22"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2869.64,-313.72 2869.64,-336.52 3007.15,-336.52 3007.15,-313.72 2869.64,-313.72"/>
<text xml:space="preserve" text-anchor="start" x="2872.64" y="-320.92" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- adminconsole&#45;&gt;processdefinitionresource -->
<g id="edge6" class="edge">
<title>adminconsole&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1593.23,-1718.2C1510.58,-1686.18 1409.23,-1643.23 1323,-1595.8 1293.23,-1579.42 1262.54,-1559.83 1234,-1540.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1235.77,-1538.32 1228.11,-1536.22 1232.79,-1542.64 1235.77,-1538.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1379.14,-1603.8 1379.14,-1626.6 1505.74,-1626.6 1505.74,-1603.8 1379.14,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="1382.14" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de procesos</text>
</g>
<!-- adminconsole&#45;&gt;sourcedefinitionresource -->
<g id="edge7" class="edge">
<title>adminconsole&#45;&gt;sourcedefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1593.04,-1761.58C1415.83,-1741.69 1124.55,-1695.87 893,-1595.8 859.48,-1581.31 825.85,-1561.16 795.48,-1540.31"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="797.15,-1538.27 789.49,-1536.14 794.15,-1542.58 797.15,-1538.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="958.93,-1603.8 958.93,-1626.6 1077.74,-1626.6 1077.74,-1603.8 958.93,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="961.93" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de sources</text>
</g>
<!-- adminconsole&#45;&gt;processexecutionresource -->
<g id="edge8" class="edge">
<title>adminconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1912.96,-1761.58C2090.17,-1741.69 2381.45,-1695.87 2613,-1595.8 2646.52,-1581.31 2680.15,-1561.16 2710.52,-1540.31"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2711.85,-1542.58 2716.51,-1536.14 2708.85,-1538.27 2711.85,-1542.58"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2591.33,-1603.8 2591.33,-1626.6 2704.72,-1626.6 2704.72,-1603.8 2591.33,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="2594.33" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- adminconsole&#45;&gt;processscheduleresource -->
<g id="edge9" class="edge">
<title>adminconsole&#45;&gt;processscheduleresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1810.9,-1686.73C1839.82,-1642.34 1874.87,-1588.54 1904.52,-1543.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1906.64,-1544.59 1908.53,-1536.88 1902.24,-1541.73 1906.64,-1544.59"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1860.5,-1603.8 1860.5,-1626.6 2026.03,-1626.6 2026.03,-1603.8 1860.5,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="1863.5" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- adminconsole&#45;&gt;executionqueryresource -->
<g id="edge10" class="edge">
<title>adminconsole&#45;&gt;executionqueryresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1665.28,-1686.61C1648.92,-1667.65 1632.79,-1647.13 1619.44,-1626.6 1602.81,-1601.04 1587.94,-1571.52 1575.61,-1543.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1578.16,-1543.11 1572.74,-1537.3 1573.35,-1545.22 1578.16,-1543.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1619.44,-1603.8 1619.44,-1626.6 1827,-1626.6 1827,-1603.8 1619.44,-1603.8"/>
<text xml:space="preserve" text-anchor="start" x="1622.44" y="-1611" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoria</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge11" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1912.69,-1769.24C2429.62,-1746.55 4024,-1659.25 4024,-1445.6 4024,-1445.6 4024,-1445.6 4024,-475.2 4024,-236.91 3693.58,-167.27 3483.24,-147.08"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3483.73,-144.49 3476.02,-146.4 3483.24,-149.71 3483.73,-144.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4024,-949 4024,-971.8 4152.94,-971.8 4152.94,-949 4024,-949"/>
<text xml:space="preserve" text-anchor="start" x="4027" y="-956.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge18" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2515.91,-138C2578.17,-138 2649.6,-138 2712.81,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2712.77,-140.63 2720.27,-138 2712.77,-135.38 2712.77,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2570.98,-141 2570.98,-163.8 2668.02,-163.8 2668.02,-141 2570.98,-141"/>
<text xml:space="preserve" text-anchor="start" x="2573.98" y="-148.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1052.95,-2022.99C1112.21,-1993.37 1180.54,-1961.19 1244.45,-1935.8 1355.16,-1891.82 1483.24,-1852.04 1583.16,-1823.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1583.65,-1825.96 1590.14,-1821.38 1582.21,-1820.91 1583.65,-1825.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1244.45,-1935.8 1244.45,-1958.6 1431,-1958.6 1431,-1935.8 1244.45,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="1247.45" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1396.4,-2018.81C1422.08,-1990.52 1452.15,-1960.25 1482.65,-1935.8 1513.84,-1910.79 1549.42,-1887.1 1584.29,-1866.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1585.45,-1868.4 1590.53,-1862.29 1582.75,-1863.89 1585.45,-1868.4"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1482.65,-1935.8 1482.65,-1958.6 1726,-1958.6 1726,-1935.8 1482.65,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="1485.65" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;adminconsole -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1753,-2018.73C1753,-1974.9 1753,-1921.88 1753,-1876.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1755.63,-1876.87 1753,-1869.37 1750.38,-1876.87 1755.63,-1876.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1753,-1935.8 1753,-1958.6 1960.54,-1958.6 1960.54,-1935.8 1753,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="1756" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2087.4,-2018.97C2056.41,-1991.44 2021.39,-1961.58 1988,-1935.8 1960.15,-1914.31 1929.52,-1892.47 1899.84,-1872.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1901.67,-1870.24 1893.99,-1868.19 1898.71,-1874.58 1901.67,-1870.24"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2015.68,-1935.8 2015.68,-1958.6 2129.07,-1958.6 2129.07,-1935.8 2015.68,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="2018.68" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;adminconsole -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2452.99,-2040.64C2434.49,-2033.11 2415.86,-2025.63 2398,-2018.6 2237.53,-1955.43 2053.09,-1886.92 1922.65,-1839.15"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1923.75,-1836.76 1915.81,-1836.65 1921.95,-1841.69 1923.75,-1836.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2239.44,-1935.8 2239.44,-1958.6 2437.66,-1958.6 2437.66,-1935.8 2239.44,-1935.8"/>
<text xml:space="preserve" text-anchor="start" x="2242.44" y="-1943" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
</g>
</svg>
`;case"process_engine_code":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="5444pt" height="2291pt"
 viewBox="0.00 0.00 5444.00 2291.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2276.05)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#1c417d" stroke="#1c356c" points="2663,-270.8 2663,-2012 5110,-2012 5110,-270.8 2663,-270.8"/>
<text xml:space="preserve" text-anchor="start" x="2671" y="-1999.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="3563,-1669.6 3563,-1950.8 4393,-1950.8 4393,-1669.6 3563,-1669.6"/>
<text xml:space="preserve" text-anchor="start" x="3571" y="-1937.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE APP (FRONT)</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#29472f" stroke="#1c3021" points="2703,-310.8 2703,-1618.8 5070,-1618.8 5070,-310.8 2703,-310.8"/>
<text xml:space="preserve" text-anchor="start" x="2711" y="-1605.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_processengine</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="3133,-350.8 3133,-964 4823,-964 4823,-350.8 3133,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="3141" y="-951.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">PROCESS ENGINE</text>
</g>
<g id="clust5" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="8,-350.8 8,-632 1698,-632 1698,-350.8 8,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-619.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<g id="clust6" class="cluster">
<title>cluster_observability</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="1728,-350.8 1728,-632 2655,-632 2655,-350.8 1728,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="1736" y="-619.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">OBSERVABILIDAD</text>
</g>
<!-- processdesigner -->
<g id="node1" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3923.02,-1889.6 3602.98,-1889.6 3602.98,-1709.6 3923.02,-1709.6 3923.02,-1889.6"/>
<text xml:space="preserve" text-anchor="start" x="3684.08" y="-1793.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node2" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4353.02,-1889.6 4032.98,-1889.6 4032.98,-1709.6 4353.02,-1709.6 4353.02,-1889.6"/>
<text xml:space="preserve" text-anchor="start" x="4104.62" y="-1793.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- jsonconfigurationmapper -->
<g id="node3" class="node">
<title>jsonconfigurationmapper</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3493.02,-902.8 3172.98,-902.8 3172.98,-722.8 3493.02,-722.8 3493.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="3218.49" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">JsonConfigurationMapper</text>
</g>
<!-- sourceregistry -->
<g id="node4" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3923.02,-902.8 3602.98,-902.8 3602.98,-722.8 3923.02,-722.8 3923.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="3651.85" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node5" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4353.02,-902.8 4032.98,-902.8 4032.98,-722.8 4353.02,-722.8 4353.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="4080.73" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- taskregistry -->
<g id="node6" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4783.02,-902.8 4462.98,-902.8 4462.98,-722.8 4783.02,-722.8 4783.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="4521.86" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- sourceproviders -->
<g id="node7" class="node">
<title>sourceproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3923.02,-570.8 3602.98,-570.8 3602.98,-390.8 3923.02,-390.8 3923.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="3686.3" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Providers</text>
</g>
<!-- readerproviders -->
<g id="node8" class="node">
<title>readerproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4353.02,-570.8 4032.98,-570.8 4032.98,-390.8 4353.02,-390.8 4353.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="4115.19" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Providers</text>
</g>
<!-- taskproviders -->
<g id="node9" class="node">
<title>taskproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4783.02,-570.8 4462.98,-570.8 4462.98,-390.8 4783.02,-390.8 4783.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="4556.32" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Providers</text>
</g>
<!-- telemetry -->
<g id="node10" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3493.02,-1557.6 3172.98,-1557.6 3172.98,-1377.6 3493.02,-1377.6 3493.02,-1557.6"/>
<text xml:space="preserve" text-anchor="start" x="3192.38" y="-1461.6" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- processexecutionresource -->
<g id="node11" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4353.02,-1557.6 4032.98,-1557.6 4032.98,-1377.6 4353.02,-1377.6 4353.02,-1557.6"/>
<text xml:space="preserve" text-anchor="start" x="4070.16" y="-1461.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- persistencelayer -->
<g id="node12" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="5030.02,-1557.6 4709.98,-1557.6 4709.98,-1377.6 5030.02,-1377.6 5030.02,-1557.6"/>
<text xml:space="preserve" text-anchor="start" x="4747.71" y="-1461.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- processexecutionservice -->
<g id="node13" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4353.02,-1234.8 4032.98,-1234.8 4032.98,-1054.8 4353.02,-1054.8 4353.02,-1234.8"/>
<text xml:space="preserve" text-anchor="start" x="4079.62" y="-1138.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- auditservice -->
<g id="node14" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3063.02,-902.8 2742.98,-902.8 2742.98,-722.8 3063.02,-722.8 3063.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="2844.08" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- filesystem -->
<g id="node15" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="368.02,-570.8 47.98,-570.8 47.98,-390.8 368.02,-390.8 368.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="155.77" y="-474.8" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node16" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="798.02,-570.8 477.98,-570.8 477.98,-390.8 798.02,-390.8 798.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="619.11" y="-474.8" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node17" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1228.02,-570.8 907.98,-570.8 907.98,-390.8 1228.02,-390.8 1228.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="1042.44" y="-474.8" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node18" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1658.02,-570.8 1337.98,-570.8 1337.98,-390.8 1658.02,-390.8 1658.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="1436.87" y="-474.8" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- otel -->
<g id="node19" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2088.02,-570.8 1767.98,-570.8 1767.98,-390.8 2088.02,-390.8 2088.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="1816.85" y="-474.8" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node20" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2615.02,-570.8 2294.98,-570.8 2294.98,-390.8 2615.02,-390.8 2615.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="2424.42" y="-474.8" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- user -->
<g id="node21" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3063.02,-2261 2742.98,-2261 2742.98,-2081 3063.02,-2081 3063.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="2816.83" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node22" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3493.02,-2261 3172.98,-2261 3172.98,-2081 3493.02,-2081 3493.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="3195.15" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node23" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3923.02,-2261 3602.98,-2261 3602.98,-2081 3923.02,-2081 3923.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="3684.62" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node24" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4353.02,-2261 4032.98,-2261 4032.98,-2081 4353.02,-2081 4353.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="4153.54" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node25" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4783.02,-2261 4462.98,-2261 4462.98,-2081 4783.02,-2081 4783.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="4591.32" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- db -->
<g id="node26" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="5410.02,-180 5089.98,-180 5089.98,0 5410.02,0 5410.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="5195.53" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node27" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4783.02,-180 4462.98,-180 4462.98,0 4783.02,0 4783.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="4560.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- operationsconsole&#45;&gt;processexecutionresource -->
<g id="edge6" class="edge">
<title>operationsconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4193,-1709.73C4193,-1665.9 4193,-1612.88 4193,-1567.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4195.63,-1567.87 4193,-1560.37 4190.38,-1567.87 4195.63,-1567.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4193,-1626.8 4193,-1649.6 4306.39,-1649.6 4306.39,-1626.8 4193,-1626.8"/>
<text xml:space="preserve" text-anchor="start" x="4196" y="-1634" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- sourceregistry&#45;&gt;sourceproviders -->
<g id="edge21" class="edge">
<title>sourceregistry&#45;&gt;sourceproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3763,-722.93C3763,-679.1 3763,-626.08 3763,-580.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3765.63,-581.07 3763,-573.57 3760.38,-581.07 3765.63,-581.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3763,-640 3763,-662.8 3899.72,-662.8 3899.72,-640 3763,-640"/>
<text xml:space="preserve" text-anchor="start" x="3766" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- readerregistry&#45;&gt;readerproviders -->
<g id="edge22" class="edge">
<title>readerregistry&#45;&gt;readerproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4193,-722.93C4193,-679.1 4193,-626.08 4193,-580.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4195.63,-581.07 4193,-573.57 4190.38,-581.07 4195.63,-581.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4193,-640 4193,-662.8 4329.72,-662.8 4329.72,-640 4193,-640"/>
<text xml:space="preserve" text-anchor="start" x="4196" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskregistry&#45;&gt;taskproviders -->
<g id="edge23" class="edge">
<title>taskregistry&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4514.29,-723.13C4496.06,-697.97 4485.96,-669.37 4496.28,-640 4503.79,-618.6 4515.56,-597.94 4528.96,-579.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4530.92,-580.78 4533.22,-573.18 4526.68,-577.69 4530.92,-580.78"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4496.28,-640 4496.28,-662.8 4633,-662.8 4633,-640 4496.28,-640"/>
<text xml:space="preserve" text-anchor="start" x="4499.28" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskproviders&#45;&gt;db -->
<g id="edge24" class="edge">
<title>taskproviders&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4750.87,-390.99C4818.91,-344.66 4904.47,-287.83 4982.79,-240 5014.31,-220.75 5048.42,-200.96 5081.39,-182.35"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5082.31,-184.84 5087.56,-178.88 5079.74,-180.27 5082.31,-184.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4982.79,-240 4982.79,-262.8 5167,-262.8 5167,-240 4982.79,-240"/>
<text xml:space="preserve" text-anchor="start" x="4985.79" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- taskproviders&#45;&gt;externalapi -->
<g id="edge25" class="edge">
<title>taskproviders&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4623,-391.09C4623,-331.11 4623,-251.85 4623,-189.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4625.63,-190.19 4623,-182.69 4620.38,-190.19 4625.63,-190.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4623,-240 4623,-262.8 4649.99,-262.8 4649.99,-240 4623,-240"/>
<text xml:space="preserve" text-anchor="start" x="4626" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge7" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4193,-1377.67C4193,-1336.47 4193,-1287.36 4193,-1244.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4195.63,-1245.16 4193,-1237.66 4190.38,-1245.16 4195.63,-1245.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4193,-1294.8 4193,-1317.6 4306.41,-1317.6 4306.41,-1294.8 4193,-1294.8"/>
<text xml:space="preserve" text-anchor="start" x="4196" y="-1302" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecucion</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge8" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M5029.78,-1404.94C5133.7,-1353.24 5250,-1268.08 5250,-1145.8 5250,-1145.8 5250,-1145.8 5250,-479.8 5250,-381.29 5250,-268.73 5250,-190.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5252.63,-190.32 5250,-182.82 5247.38,-190.32 5252.63,-190.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="5250,-801.4 5250,-824.2 5413.97,-824.2 5413.97,-801.4 5250,-801.4"/>
<text xml:space="preserve" text-anchor="start" x="5253" y="-808.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Opera sobre PostgreSQL</text>
</g>
<!-- processexecutionservice&#45;&gt;jsonconfigurationmapper -->
<g id="edge11" class="edge">
<title>processexecutionservice&#45;&gt;jsonconfigurationmapper</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4033.27,-1114.98C3899.39,-1087.18 3705.44,-1038.28 3548,-964 3515.72,-948.77 3483.06,-928.79 3453.26,-908.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3455.09,-906.46 3447.43,-904.35 3452.1,-910.78 3455.09,-906.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3614.4,-972 3614.4,-994.8 3772.15,-994.8 3772.15,-972 3614.4,-972"/>
<text xml:space="preserve" text-anchor="start" x="3617.4" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee configuracion JSON</text>
</g>
<!-- processexecutionservice&#45;&gt;sourceregistry -->
<g id="edge12" class="edge">
<title>processexecutionservice&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4077.2,-1054.93C4018.28,-1009.71 3946.63,-954.73 3886.64,-908.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3888.58,-906.87 3881.03,-904.38 3885.38,-911.03 3888.58,-906.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3990.89,-972 3990.89,-994.8 4155.64,-994.8 4155.64,-972 3990.89,-972"/>
<text xml:space="preserve" text-anchor="start" x="3993.89" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve SourceProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;readerregistry -->
<g id="edge13" class="edge">
<title>processexecutionservice&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4193,-1054.93C4193,-1011.1 4193,-958.08 4193,-912.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4195.63,-913.07 4193,-905.57 4190.38,-913.07 4195.63,-913.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4193,-972 4193,-994.8 4359.3,-994.8 4359.3,-972 4193,-972"/>
<text xml:space="preserve" text-anchor="start" x="4196" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve ReaderProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;taskregistry -->
<g id="edge14" class="edge">
<title>processexecutionservice&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4308.8,-1054.93C4367.72,-1009.71 4439.37,-954.73 4499.36,-908.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4500.62,-911.03 4504.97,-904.38 4497.42,-906.87 4500.62,-911.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4408,-972 4408,-994.8 4558.72,-994.8 4558.72,-972 4408,-972"/>
<text xml:space="preserve" text-anchor="start" x="4411" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve TaskProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;taskproviders -->
<g id="edge15" class="edge">
<title>processexecutionservice&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4352.92,-1121.5C4524.24,-1093.95 4779.47,-1041.07 4838,-964 4902.83,-878.63 4876.19,-822.97 4838,-722.8 4817.22,-668.3 4777.83,-618.3 4738.38,-578.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4740.31,-576.35 4733.16,-572.9 4736.59,-580.06 4740.31,-576.35"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4877.25,-801.4 4877.25,-824.2 4904.25,-824.2 4904.25,-801.4 4877.25,-801.4"/>
<text xml:space="preserve" text-anchor="start" x="4880.25" y="-809.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionservice&#45;&gt;auditservice -->
<g id="edge10" class="edge">
<title>processexecutionservice&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4033.11,-1140.61C3815.23,-1131.16 3416.68,-1095.52 3106,-964 3073.3,-950.16 3040.96,-930.03 3012.04,-908.99"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3013.61,-906.89 3006.02,-904.54 3010.49,-911.11 3013.61,-906.89"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3160.95,-972 3160.95,-994.8 3272,-994.8 3272,-972 3160.95,-972"/>
<text xml:space="preserve" text-anchor="start" x="3163.95" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- auditservice&#45;&gt;filesystem -->
<g id="edge16" class="edge">
<title>auditservice&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2703,-810.91C2190.62,-806.49 841.72,-780.63 423,-632 386.86,-619.17 351.23,-598.53 319.68,-576.6"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="321.44,-574.62 313.8,-572.44 318.41,-578.91 321.44,-574.62"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1369.13,-774.05 1369.13,-796.85 1501.98,-796.85 1501.98,-774.05 1369.13,-774.05"/>
<text xml:space="preserve" text-anchor="start" x="1372.13" y="-781.25" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- auditservice&#45;&gt;ftp -->
<g id="edge17" class="edge">
<title>auditservice&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2703,-807.36C2256.15,-795.33 1189.57,-754.34 853,-632 817.15,-618.97 781.75,-598.39 750.33,-576.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="752.12,-574.64 744.48,-572.46 749.1,-578.93 752.12,-574.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1594.96,-759.57 1594.96,-782.37 1716.9,-782.37 1716.9,-759.57 1594.96,-759.57"/>
<text xml:space="preserve" text-anchor="start" x="1597.96" y="-766.77" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;sftp -->
<g id="edge18" class="edge">
<title>auditservice&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2703,-801.96C2329,-781.52 1538.46,-728.2 1283,-632 1247.6,-618.67 1212.53,-598.17 1181.31,-576.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1183.16,-574.65 1175.51,-572.49 1180.14,-578.95 1183.16,-574.65"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1810.04,-743.71 1810.04,-766.51 1931.97,-766.51 1931.97,-743.71 1810.04,-743.71"/>
<text xml:space="preserve" text-anchor="start" x="1813.04" y="-750.91" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;restsource -->
<g id="edge19" class="edge">
<title>auditservice&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2703,-793.72C2409.61,-765.2 1878.15,-705.39 1701,-632 1667.86,-618.27 1635.18,-597.98 1606.03,-576.72"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1607.93,-574.86 1600.34,-572.51 1604.81,-579.08 1607.93,-574.86"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1974.41,-727.56 1974.41,-750.36 2143.84,-750.36 2143.84,-727.56 1974.41,-727.56"/>
<text xml:space="preserve" text-anchor="start" x="1977.41" y="-734.76" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- auditservice&#45;&gt;otel -->
<g id="edge20" class="edge">
<title>auditservice&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2703,-767.72C2569.85,-735.91 2392.09,-688.68 2240,-632 2192.7,-614.37 2142.87,-592.15 2097.24,-570.24"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2098.5,-567.93 2090.6,-567.04 2096.22,-572.66 2098.5,-567.93"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2294.06,-682.92 2294.06,-705.72 2390.32,-705.72 2390.32,-682.92 2294.06,-682.92"/>
<text xml:space="preserve" text-anchor="start" x="2297.06" y="-690.12" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge9" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2087.91,-480.8C2150.17,-480.8 2221.6,-480.8 2284.81,-480.8"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2284.77,-483.43 2292.27,-480.8 2284.77,-478.18 2284.77,-483.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2142.98,-483.8 2142.98,-506.6 2240.02,-506.6 2240.02,-483.8 2142.98,-483.8"/>
<text xml:space="preserve" text-anchor="start" x="2145.98" y="-491" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
<!-- user&#45;&gt;processdesigner -->
<g id="edge1" class="edge">
<title>user&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3063,-2101.28C3201.37,-2041.84 3402.41,-1955.49 3553.58,-1890.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3554.37,-1893.07 3560.22,-1887.7 3552.3,-1888.25 3554.37,-1893.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3126.57,-1993.84 3126.57,-2016.64 3313.12,-2016.64 3313.12,-1993.84 3126.57,-1993.84"/>
<text xml:space="preserve" text-anchor="start" x="3129.57" y="-2001.04" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;processdesigner -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3436.54,-2081.05C3479.71,-2043.97 3531.15,-1999.77 3580.29,-1957.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3581.89,-1959.65 3585.86,-1952.77 3578.46,-1955.67 3581.89,-1959.65"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3512.48,-2015.81 3512.48,-2038.61 3755.83,-2038.61 3755.83,-2015.81 3512.48,-2015.81"/>
<text xml:space="preserve" text-anchor="start" x="3515.48" y="-2023.01" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3763,-2081.05C3763,-2045.04 3763,-2002.31 3763,-1961.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3765.63,-1961.32 3763,-1953.82 3760.38,-1961.32 3765.63,-1961.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3555.46,-1993.07 3555.46,-2015.87 3763,-2015.87 3763,-1993.07 3555.46,-1993.07"/>
<text xml:space="preserve" text-anchor="start" x="3558.46" y="-2000.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catalogos y procesos</text>
</g>
<!-- operator&#45;&gt;processdesigner -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4065.61,-2081.04C4036.21,-2059.24 4005.51,-2035.42 3978,-2012 3958.06,-1995.02 3937.7,-1976.6 3917.84,-1957.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3919.72,-1956.11 3912.46,-1952.88 3916.12,-1959.93 3919.72,-1956.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3864.59,-2011.99 3864.59,-2034.79 3977.99,-2034.79 3977.99,-2011.99 3864.59,-2011.99"/>
<text xml:space="preserve" text-anchor="start" x="3867.59" y="-2019.19" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;processdesigner -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4463.21,-2099.49C4444.79,-2092.67 4426.12,-2086.32 4408,-2081 4261.96,-2038.09 4221.88,-2040.1 4071,-2020 4050.44,-2017.26 3996.84,-2020.67 3978,-2012 3948.58,-1998.46 3920.81,-1979.11 3895.63,-1957.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3897.55,-1955.75 3890.18,-1952.79 3894.1,-1959.7 3897.55,-1955.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4174.97,-2032.98 4174.97,-2055.78 4373.19,-2055.78 4373.19,-2032.98 4174.97,-2032.98"/>
<text xml:space="preserve" text-anchor="start" x="4177.97" y="-2040.18" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria y resultados</text>
</g>
</g>
</svg>
`;case"domain_entities_code":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1020pt" height="2055pt"
 viewBox="0.00 0.00 1020.00 2055.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2040.05)">
<g id="clust1" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#26402b" stroke="#1a2b1e" points="8,-249 8,-2017 982,-2017 982,-249 8,-249"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-2004.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_domainentities</title>
<polygon fill="#1a468d" stroke="#1c3979" points="40,-281 40,-1963.8 950,-1963.8 950,-281 40,-281"/>
<text xml:space="preserve" text-anchor="start" x="48" y="-1950.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">DOMAIN ENTITIES</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_executionentities</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="80,-1298.6 80,-1902.6 910,-1902.6 910,-1298.6 80,-1298.6"/>
<text xml:space="preserve" text-anchor="start" x="88" y="-1889.7" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">EXECUTION</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_catalogentities</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="80,-321 80,-1247.8 910,-1247.8 910,-321 80,-321"/>
<text xml:space="preserve" text-anchor="start" x="88" y="-1234.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">CATALOG</text>
</g>
<!-- processtaskexecutionentity -->
<g id="node1" class="node">
<title>processtaskexecutionentity</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="440.02,-1841.4 119.98,-1841.4 119.98,-1661.4 440.02,-1661.4 440.02,-1841.4"/>
<text xml:space="preserve" text-anchor="start" x="178.29" y="-1745.4" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessTaskExecution</text>
</g>
<!-- auditevententity -->
<g id="node2" class="node">
<title>auditevententity</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="870.02,-1841.4 549.98,-1841.4 549.98,-1661.4 870.02,-1661.4 870.02,-1841.4"/>
<text xml:space="preserve" text-anchor="start" x="661.64" y="-1745.4" font-family="Arial" font-size="20.00" fill="#eff6ff">AuditEvent</text>
</g>
<!-- processexecutionentity -->
<g id="node3" class="node">
<title>processexecutionentity</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="450.02,-1518.6 129.98,-1518.6 129.98,-1338.6 450.02,-1338.6 450.02,-1518.6"/>
<text xml:space="preserve" text-anchor="start" x="209.96" y="-1422.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecution</text>
</g>
<!-- processdefinitionentity -->
<g id="node4" class="node">
<title>processdefinitionentity</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="450.02,-1186.6 129.98,-1186.6 129.98,-1006.6 450.02,-1006.6 450.02,-1186.6"/>
<text xml:space="preserve" text-anchor="start" x="212.19" y="-1090.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinition</text>
</g>
<!-- processtaskdefinitionentity -->
<g id="node5" class="node">
<title>processtaskdefinitionentity</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="450.02,-863.8 129.98,-863.8 129.98,-683.8 450.02,-683.8 450.02,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="190.52" y="-767.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessTaskDefinition</text>
</g>
<!-- sourcedefinitionentity -->
<g id="node6" class="node">
<title>sourcedefinitionentity</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="440.02,-541 119.98,-541 119.98,-361 440.02,-361 440.02,-541"/>
<text xml:space="preserve" text-anchor="start" x="206.63" y="-445" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinition</text>
</g>
<!-- readerdefinitionentity -->
<g id="node7" class="node">
<title>readerdefinitionentity</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="870.02,-541 549.98,-541 549.98,-361 870.02,-361 870.02,-541"/>
<text xml:space="preserve" text-anchor="start" x="635.51" y="-445" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderDefinition</text>
</g>
<!-- db -->
<g id="node8" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="870.02,-180 549.98,-180 549.98,0 870.02,0 870.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="655.53" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- processtaskexecutionentity&#45;&gt;processexecutionentity -->
<g id="edge1" class="edge">
<title>processtaskexecutionentity&#45;&gt;processexecutionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M260.91,-1661.76C257.29,-1635.06 255.41,-1605.66 258.26,-1578.6 259.97,-1562.37 262.69,-1545.31 265.85,-1528.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="268.41,-1529.37 267.28,-1521.51 263.26,-1528.36 268.41,-1529.37"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="258.26,-1578.6 258.26,-1601.4 402,-1601.4 402,-1578.6 258.26,-1578.6"/>
<text xml:space="preserve" text-anchor="start" x="261.26" y="-1585.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">n..1 processExecution</text>
</g>
<!-- processtaskexecutionentity&#45;&gt;processtaskdefinitionentity -->
<g id="edge2" class="edge">
<title>processtaskexecutionentity&#45;&gt;processtaskdefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M439.97,-1682.46C458.44,-1675.13 477.07,-1667.96 495,-1661.4 577.37,-1631.27 631.26,-1672.22 683,-1601.4 688.98,-1593.22 685.25,-1588.48 683,-1578.6 650.11,-1434.35 580.43,-1420.55 538.72,-1278.6 504.37,-1161.73 556.4,-1117.04 505,-1006.6 481.45,-956 442.7,-909.04 404.53,-870.79"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="406.74,-869.29 399.56,-865.88 403.05,-873.02 406.74,-869.29"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="538.72,-1255.8 538.72,-1278.6 656,-1278.6 656,-1255.8 538.72,-1255.8"/>
<text xml:space="preserve" text-anchor="start" x="541.72" y="-1263" font-family="Arial" font-size="14.00" fill="#c9c9c9">n..1 taskDefinition</text>
</g>
<!-- auditevententity&#45;&gt;processexecutionentity -->
<g id="edge3" class="edge">
<title>auditevententity&#45;&gt;processexecutionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M593.56,-1661.47C537.92,-1618.96 471.25,-1568.04 414.58,-1524.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="416.26,-1522.73 408.7,-1520.27 413.07,-1526.91 416.26,-1522.73"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="512.59,-1578.6 512.59,-1601.4 656.34,-1601.4 656.34,-1578.6 512.59,-1578.6"/>
<text xml:space="preserve" text-anchor="start" x="515.59" y="-1585.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">n..1 processExecution</text>
</g>
<!-- auditevententity&#45;&gt;processtaskdefinitionentity -->
<g id="edge4" class="edge">
<title>auditevententity&#45;&gt;processtaskdefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M716.68,-1661.53C721.48,-1560.78 721,-1392.75 679,-1255.8 629.15,-1093.26 606.8,-1046.38 489,-923.8 470.97,-905.04 450.39,-886.84 429.47,-870"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="431.31,-868.11 423.8,-865.49 428.04,-872.22 431.31,-868.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="684.69,-1255.8 684.69,-1278.6 801.97,-1278.6 801.97,-1255.8 684.69,-1255.8"/>
<text xml:space="preserve" text-anchor="start" x="687.69" y="-1263" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..1 taskDefinition</text>
</g>
<!-- processexecutionentity&#45;&gt;processdefinitionentity -->
<g id="edge5" class="edge">
<title>processexecutionentity&#45;&gt;processdefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M285.41,-1338.98C284.56,-1319.12 283.81,-1298.14 283.37,-1278.6 282.78,-1252.1 283.3,-1223.42 284.26,-1196.87"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="286.88,-1197.05 284.55,-1189.45 281.64,-1196.84 286.88,-1197.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="283.37,-1255.8 283.37,-1278.6 424,-1278.6 424,-1255.8 283.37,-1255.8"/>
<text xml:space="preserve" text-anchor="start" x="286.37" y="-1263" font-family="Arial" font-size="14.00" fill="#c9c9c9">n..1 processDefinition</text>
</g>
<!-- processdefinitionentity&#45;&gt;processtaskdefinitionentity -->
<g id="edge6" class="edge">
<title>processdefinitionentity&#45;&gt;processtaskdefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M290,-1006.67C290,-965.47 290,-916.36 290,-873.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="292.63,-874.16 290,-866.66 287.38,-874.16 292.63,-874.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="290,-923.8 290,-946.6 355.92,-946.6 355.92,-923.8 290,-923.8"/>
<text xml:space="preserve" text-anchor="start" x="293" y="-931" font-family="Arial" font-size="14.00" fill="#c9c9c9">1..n tasks</text>
</g>
<!-- processtaskdefinitionentity&#45;&gt;sourcedefinitionentity -->
<g id="edge7" class="edge">
<title>processtaskdefinitionentity&#45;&gt;sourcedefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M287.23,-683.87C285.94,-642.67 284.41,-593.56 283.09,-551.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="285.72,-551.27 282.86,-543.86 280.47,-551.43 285.72,-551.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="285.3,-601 285.3,-623.8 418.93,-623.8 418.93,-601 285.3,-601"/>
<text xml:space="preserve" text-anchor="start" x="288.3" y="-608.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..1 sourceDefinition</text>
</g>
<!-- processtaskdefinitionentity&#45;&gt;readerdefinitionentity -->
<g id="edge8" class="edge">
<title>processtaskdefinitionentity&#45;&gt;readerdefinitionentity</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M406.44,-683.87C462.08,-641.36 528.75,-590.44 585.42,-547.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="586.93,-549.31 591.3,-542.67 583.74,-545.13 586.93,-549.31"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="512.59,-601 512.59,-623.8 644.67,-623.8 644.67,-601 512.59,-601"/>
<text xml:space="preserve" text-anchor="start" x="515.59" y="-608.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">0..1 readerDefinition</text>
</g>
<!-- readerdefinitionentity&#45;&gt;db -->
<g id="edge9" class="edge">
<title>readerdefinitionentity&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M710,-249C710,-228.66 710,-208.7 710,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="712.63,-190.49 710,-182.99 707.38,-190.49 712.63,-190.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="471.32,-214.31 471.32,-253.91 710,-253.91 710,-214.31 471.32,-214.31"/>
<text xml:space="preserve" text-anchor="start" x="474.32" y="-238.31" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="474.32" y="-221.51" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
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
<!-- processcatalogservice -->
<g id="node4" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2277.03,-180 1956.99,-180 1956.99,0 2277.03,0 2277.03,-180"/>
<text xml:space="preserve" text-anchor="start" x="2013.08" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- persistencelayer -->
<g id="node5" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2912.49,-180 2592.45,-180 2592.45,0 2912.49,0 2912.49,-180"/>
<text xml:space="preserve" text-anchor="start" x="2630.17" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
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
<!-- sourcedefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>sourcedefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1650.57,-90C1741.17,-90 1854.72,-90 1946.98,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1946.73,-92.63 1954.23,-90 1946.73,-87.38 1946.73,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1713.88,-93 1713.88,-125.8 1737.88,-125.8 1737.88,-93 1713.88,-93"/>
<text xml:space="preserve" text-anchor="start" x="1721.99" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1740.88,-93 1740.88,-125.8 1893.99,-125.8 1893.99,-93 1740.88,-93"/>
<text xml:space="preserve" text-anchor="start" x="1743.88" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega alta de catalogo</text>
</g>
<!-- processcatalogservice&#45;&gt;persistencelayer -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2276.63,-90C2369.72,-90 2487.3,-90 2582.17,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2581.92,-92.63 2589.42,-90 2581.92,-87.38 2581.92,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2340.03,-93 2340.03,-125.8 2364.03,-125.8 2364.03,-93 2340.03,-93"/>
<text xml:space="preserve" text-anchor="start" x="2348.14" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2367.03,-93 2367.03,-125.8 2529.45,-125.8 2529.45,-93 2367.03,-93"/>
<text xml:space="preserve" text-anchor="start" x="2370.03" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste source definition</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge5" class="edge">
<title>persistencelayer&#45;&gt;db</title>
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
<!-- processdefinitionresource -->
<g id="node3" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1578.5,-180 1258.46,-180 1258.46,0 1578.5,0 1578.5,-180"/>
<text xml:space="preserve" text-anchor="start" x="1297.87" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- processcatalogservice -->
<g id="node4" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2204.65,-180 1884.61,-180 1884.61,0 2204.65,0 2204.65,-180"/>
<text xml:space="preserve" text-anchor="start" x="1940.69" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- persistencelayer -->
<g id="node5" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2838.55,-180 2518.51,-180 2518.51,0 2838.55,0 2838.55,-180"/>
<text xml:space="preserve" text-anchor="start" x="2556.23" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
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
<!-- processdesigner&#45;&gt;processdefinitionresource -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M942.64,-90C1035.81,-90 1153.53,-90 1248.45,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1248.21,-92.63 1255.71,-90 1248.21,-87.38 1248.21,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1006.04,-93 1006.04,-125.8 1030.04,-125.8 1030.04,-93 1006.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="1014.14" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1033.04,-93 1033.04,-125.8 1195.46,-125.8 1195.46,-93 1033.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="1036.04" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra reader definition</text>
</g>
<!-- processdefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>processdefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1578.19,-90C1668.78,-90 1782.33,-90 1874.59,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1874.35,-92.63 1881.85,-90 1874.35,-87.38 1874.35,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1641.5,-93 1641.5,-125.8 1665.5,-125.8 1665.5,-93 1641.5,-93"/>
<text xml:space="preserve" text-anchor="start" x="1649.6" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1668.5,-93 1668.5,-125.8 1821.61,-125.8 1821.61,-93 1668.5,-93"/>
<text xml:space="preserve" text-anchor="start" x="1671.5" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega alta de catalogo</text>
</g>
<!-- processcatalogservice&#45;&gt;persistencelayer -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2204.27,-90C2296.85,-90 2413.64,-90 2508.03,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2508.02,-92.63 2515.52,-90 2508.02,-87.38 2508.02,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2267.65,-93 2267.65,-125.8 2291.65,-125.8 2291.65,-93 2267.65,-93"/>
<text xml:space="preserve" text-anchor="start" x="2275.75" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2294.65,-93 2294.65,-125.8 2455.51,-125.8 2455.51,-93 2294.65,-93"/>
<text xml:space="preserve" text-anchor="start" x="2297.65" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste reader definition</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge5" class="edge">
<title>persistencelayer&#45;&gt;db</title>
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
<svg width="3554pt" height="210pt"
 viewBox="0.00 0.00 3554.00 210.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="984.29,-180 664.25,-180 664.25,0 984.29,0 984.29,-180"/>
<text xml:space="preserve" text-anchor="start" x="745.35" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- processdefinitionresource -->
<g id="node3" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1622.87,-180 1302.83,-180 1302.83,0 1622.87,0 1622.87,-180"/>
<text xml:space="preserve" text-anchor="start" x="1342.24" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- processcatalogservice -->
<g id="node4" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2245.09,-180 1925.05,-180 1925.05,0 2245.09,0 2245.09,-180"/>
<text xml:space="preserve" text-anchor="start" x="1981.13" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- persistencelayer -->
<g id="node5" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2837.74,-180 2517.7,-180 2517.7,0 2837.74,0 2837.74,-180"/>
<text xml:space="preserve" text-anchor="start" x="2555.43" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3523.77,-180 3203.73,-180 3203.73,0 3523.77,0 3523.77,-180"/>
<text xml:space="preserve" text-anchor="start" x="3309.28" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge1" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.65,-90C420.55,-90 551.11,-90 654.01,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="653.98,-92.63 661.48,-90 653.98,-87.38 653.98,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-93 383.04,-125.8 407.04,-125.8 407.04,-93 383.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-93 410.04,-125.8 601.25,-125.8 601.25,-93 410.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Crea proceso y ordena tareas</text>
</g>
<!-- processdesigner&#45;&gt;processdefinitionresource -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M984.27,-90C1078.16,-90 1196.97,-90 1292.6,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1292.43,-92.63 1299.93,-90 1292.43,-87.38 1292.43,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1047.29,-93 1047.29,-125.8 1071.29,-125.8 1071.29,-93 1047.29,-93"/>
<text xml:space="preserve" text-anchor="start" x="1055.4" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1074.29,-93 1074.29,-125.8 1239.83,-125.8 1239.83,-93 1074.29,-93"/>
<text xml:space="preserve" text-anchor="start" x="1077.29" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda process definition</text>
</g>
<!-- processdefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>processdefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1622.77,-90C1712.19,-90 1823.82,-90 1914.86,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1914.77,-92.63 1922.27,-90 1914.77,-87.38 1914.77,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1685.87,-93 1685.87,-125.8 1709.87,-125.8 1709.87,-93 1685.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1693.98" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1712.87,-93 1712.87,-125.8 1862.05,-125.8 1862.05,-93 1712.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1715.87" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida y registra tareas</text>
</g>
<!-- processcatalogservice&#45;&gt;persistencelayer -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2244.74,-90C2325.93,-90 2424.78,-90 2507.43,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2507.42,-92.63 2514.92,-90 2507.42,-87.38 2507.42,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2308.09,-93 2308.09,-125.8 2332.09,-125.8 2332.09,-93 2308.09,-93"/>
<text xml:space="preserve" text-anchor="start" x="2316.2" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2335.09,-93 2335.09,-125.8 2454.7,-125.8 2454.7,-93 2335.09,-93"/>
<text xml:space="preserve" text-anchor="start" x="2338.09" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definicion</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge5" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2837.37,-90C2944.04,-90 3084.5,-90 3193.35,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3193.25,-92.63 3200.75,-90 3193.25,-87.38 3193.25,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2900.74,-93 2900.74,-125.8 2924.74,-125.8 2924.74,-93 2900.74,-93"/>
<text xml:space="preserve" text-anchor="start" x="2908.85" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2927.74,-93 2927.74,-125.8 3140.73,-125.8 3140.73,-93 2927.74,-93"/>
<text xml:space="preserve" text-anchor="start" x="2930.74" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda process definition y tasks</text>
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
