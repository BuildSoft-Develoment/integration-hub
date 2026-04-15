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
    operator [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Operator</FONT>>,
        likec4_id=operator,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationadmin -> operator [style=invis];
    auditor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Auditor</FONT>>,
        likec4_id=auditor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator -> auditor [style=invis];
    infrateam [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Equipo de infraestructura</FONT>>,
        likec4_id=infraTeam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditor -> infrateam [style=invis];
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
    appservice [height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Hub Service</FONT>>,
        likec4_id=appService,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
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
    otel [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>,
        likec4_id="observability.otel",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> otel [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>,
        likec4_id=ri53sv,
        style=dashed];
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
    integrationadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Admin</FONT>>,
        likec4_id=integrationAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Operator</FONT>>,
        likec4_id=operator,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    integrationadmin -> operator [style=invis];
    auditor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Auditor</FONT>>,
        likec4_id=auditor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operator -> auditor [style=invis];
    jaeger [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Jaeger</FONT>>,
        likec4_id="observability.jaeger",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
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
    subgraph cluster_adminconsole {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>ADMIN CONSOLE APP (FRONT)</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.adminConsole",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        reactapp [group="integrationHub.adminConsole",
            height=2.5,
            label=<<FONT POINT-SIZE="20">React + PatternFly UI</FONT>>,
            likec4_id="integrationHub.adminConsole.reactApp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        oidcclient [group="integrationHub.adminConsole",
            height=2.5,
            label=<<FONT POINT-SIZE="20">OIDC Client</FONT>>,
            likec4_id="integrationHub.adminConsole.oidcClient",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        processdesigner [group="integrationHub.adminConsole",
            height=2.5,
            label=<<FONT POINT-SIZE="20">Process Designer</FONT>>,
            likec4_id="integrationHub.adminConsole.processDesigner",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        operationsconsole [group="integrationHub.adminConsole",
            height=2.5,
            label=<<FONT POINT-SIZE="20">Operations Console</FONT>>,
            likec4_id="integrationHub.adminConsole.operationsConsole",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
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
        minlen=1,
        style=dashed];
    processdefinitionresource [height=2.5,
        label=<<FONT POINT-SIZE="20">ProcessDefinitionResource</FONT>>,
        likec4_id="integrationHub.quarkusApp.processDefinitionResource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processdesigner -> processdefinitionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de definiciones</FONT></TD></TR></TABLE>>,
        likec4_id=tif83,
        minlen=1,
        style=dashed];
    processexecutionresource [height=2.5,
        label=<<FONT POINT-SIZE="20">ProcessExecutionResource</FONT>>,
        likec4_id="integrationHub.quarkusApp.processExecutionResource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operationsconsole -> processexecutionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id=japnt7,
        minlen=1,
        style=dashed];
    processscheduleresource [height=2.5,
        label=<<FONT POINT-SIZE="20">ProcessScheduleResource</FONT>>,
        likec4_id="integrationHub.quarkusApp.processScheduleResource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operationsconsole -> processscheduleresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta programaciones</FONT></TD></TR></TABLE>>,
        likec4_id=khsy9o,
        minlen=1,
        style=dashed];
    executionqueryresource [height=2.5,
        label=<<FONT POINT-SIZE="20">ExecutionQueryResource</FONT>>,
        likec4_id="integrationHub.quarkusApp.executionQueryResource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    operationsconsole -> executionqueryresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones y auditoria</FONT></TD></TR></TABLE>>,
        likec4_id="500sqy",
        minlen=1,
        style=dashed];
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
        processscheduleresource [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessScheduleResource</FONT>>,
            likec4_id="integrationHub.quarkusApp.processScheduleResource",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        executionqueryresource [height=2.5,
            label=<<FONT POINT-SIZE="20">ExecutionQueryResource</FONT>>,
            likec4_id="integrationHub.quarkusApp.executionQueryResource",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        processschedulerservice [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessSchedulerService</FONT>>,
            likec4_id="integrationHub.quarkusApp.processSchedulerService",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        telemetry [height=2.5,
            label=<<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>,
            likec4_id="integrationHub.quarkusApp.telemetry",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        processcatalogservice [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>,
            likec4_id="integrationHub.quarkusApp.processCatalogService",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        processschedulequeryservice [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessScheduleQueryService</FONT>>,
            likec4_id="integrationHub.quarkusApp.processScheduleQueryService",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        executionqueryservice [height=2.5,
            label=<<FONT POINT-SIZE="20">ExecutionQueryService</FONT>>,
            likec4_id="integrationHub.quarkusApp.executionQueryService",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        processexecutionservice [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessExecutionService</FONT>>,
            likec4_id="integrationHub.quarkusApp.processExecutionService",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        persistencelayer [height=2.5,
            label=<<FONT POINT-SIZE="20">Panache Persistence Layer</FONT>>,
            likec4_id="integrationHub.quarkusApp.persistenceLayer",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        processengine [height=2.5,
            label=<<FONT POINT-SIZE="20">Process Engine</FONT>>,
            likec4_id="integrationHub.quarkusApp.processEngine",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        auditservice [height=2.5,
            label=<<FONT POINT-SIZE="20">Audit Service</FONT>>,
            likec4_id="integrationHub.quarkusApp.auditService",
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
    processdefinitionresource -> processcatalogservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega gestion de procesos</FONT></TD></TR></TABLE>>,
        likec4_id="11key3f",
        minlen=1,
        style=dashed];
    processexecutionresource -> processexecutionservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega ejecucion</FONT></TD></TR></TABLE>>,
        likec4_id="2frpj1",
        minlen=1,
        style=dashed];
    processscheduleresource -> processschedulequeryservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega consulta de schedules</FONT></TD></TR></TABLE>>,
        likec4_id=bi7mk7,
        minlen=1,
        style=dashed];
    executionqueryresource -> executionqueryservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega consultas operativas</FONT></TD></TR></TABLE>>,
        likec4_id=gok1ct,
        minlen=1,
        style=dashed];
    processschedulerservice -> processexecutionservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Dispara procesos programados</FONT></TD></TR></TABLE>>,
        likec4_id="1h8944v",
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
    otel [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>,
        likec4_id="observability.otel",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    jaeger [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Jaeger</FONT>>,
        likec4_id="observability.jaeger",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
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
    auditservice -> iam [arrowhead=normal,
        likec4_id="2rsnuj",
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>];
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
}
`;case"execution_query_layers":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=execution_query_layers,
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
    executionqueryresource [height=2.5,
        label=<<FONT POINT-SIZE="20">ExecutionQueryResource</FONT>>,
        likec4_id="integrationHub.quarkusApp.executionQueryResource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    executionqueryservice [height=2.5,
        label=<<FONT POINT-SIZE="20">ExecutionQueryService</FONT>>,
        likec4_id="integrationHub.quarkusApp.executionQueryService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    executionqueryresource -> executionqueryservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega consultas operativas</FONT></TD></TR></TABLE>>,
        likec4_id=gok1ct,
        minlen=1,
        style=dashed];
    persistencelayer [height=2.5,
        label=<<FONT POINT-SIZE="20">Panache Persistence Layer</FONT>>,
        likec4_id="integrationHub.quarkusApp.persistenceLayer",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    executionqueryservice -> persistencelayer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones y auditoria</FONT></TD></TR></TABLE>>,
        likec4_id="1edfnbv",
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
        style=dashed];
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Define tipo de fuente y parametros</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processdesigner" -> "processdefinitionresource" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra source definition</FONT></TD></TR></TABLE>>;
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
    likec4_level = 0;
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
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Jaeger</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#737373";
    fontcolor = "#fafafa";
    color = "#525252";
  ];
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
  "processengine" -> "auditservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "telemetry" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Emite spans</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "telemetry" -> "otel" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "otel" -> "jaeger" [
    likec4_id = "step-06";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Publica visualizacion</FONT></TD></TR></TABLE>>;
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
<svg width="3460pt" height="1157pt"
 viewBox="0.00 0.00 3460.00 1157.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1141.65)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="321.04,-1126.6 1,-1126.6 1,-946.6 321.04,-946.6 321.04,-1126.6"/>
<text xml:space="preserve" text-anchor="start" x="74.85" y="-1030.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- loadbalancer -->
<g id="node2" class="node">
<title>loadbalancer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-803.8 0,-803.8 0,-623.8 320.04,-623.8 320.04,-803.8"/>
<text xml:space="preserve" text-anchor="start" x="21.62" y="-707.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Load Balancer / Reverse Proxy</text>
</g>
<!-- integrationhub -->
<g id="node3" class="node">
<title>integrationhub</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1622.04,-803.8 1302,-803.8 1302,-623.8 1622.04,-623.8 1622.04,-803.8"/>
<text xml:space="preserve" text-anchor="start" x="1353.63" y="-707.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Platform</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="808.04,-1126.6 488,-1126.6 488,-946.6 808.04,-946.6 808.04,-1126.6"/>
<text xml:space="preserve" text-anchor="start" x="510.17" y="-1030.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- platformadmin -->
<g id="node5" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2570.04,-1126.6 2250,-1126.6 2250,-946.6 2570.04,-946.6 2570.04,-1126.6"/>
<text xml:space="preserve" text-anchor="start" x="2341.67" y="-1030.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- iam -->
<g id="node6" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2526.04,-481 2206,-481 2206,-301 2526.04,-301 2526.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="2325.44" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- integrationadmin -->
<g id="node7" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3000.04,-1126.6 2680,-1126.6 2680,-946.6 3000.04,-946.6 3000.04,-1126.6"/>
<text xml:space="preserve" text-anchor="start" x="2761.64" y="-1030.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node8" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3000.04,-803.8 2680,-803.8 2680,-623.8 3000.04,-623.8 3000.04,-803.8"/>
<text xml:space="preserve" text-anchor="start" x="2800.56" y="-707.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node9" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3000.04,-481 2680,-481 2680,-301 3000.04,-301 3000.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="2808.34" y="-385" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- infrateam -->
<g id="node10" class="node">
<title>infrateam</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3000.04,-180 2680,-180 2680,0 3000.04,0 3000.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2728.29" y="-84" font-family="Arial" font-size="20.00" fill="#ffe0c2">Equipo de infraestructura</text>
</g>
<!-- scheduleractor -->
<g id="node11" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1238.04,-1126.6 918,-1126.6 918,-946.6 1238.04,-946.6 1238.04,-1126.6"/>
<text xml:space="preserve" text-anchor="start" x="1032.99" y="-1030.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- appservice -->
<g id="node12" class="node">
<title>appservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3430.04,-1126.6 3110,-1126.6 3110,-946.6 3430.04,-946.6 3430.04,-1126.6"/>
<text xml:space="preserve" text-anchor="start" x="3165.52" y="-1030.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Service</text>
</g>
<!-- vault -->
<g id="node13" class="node">
<title>vault</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1709.61,-1126.6 1348.43,-1126.6 1348.43,-946.6 1709.61,-946.6 1709.61,-1126.6"/>
<text xml:space="preserve" text-anchor="start" x="1364.49" y="-1030.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Kubernetes Secrets / External Config</text>
</g>
<!-- sharedstorage -->
<g id="node14" class="node">
<title>sharedstorage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2140.04,-1126.6 1820,-1126.6 1820,-946.6 2140.04,-946.6 2140.04,-1126.6"/>
<text xml:space="preserve" text-anchor="start" x="1891.08" y="-1030.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared File Storage</text>
</g>
<!-- ingresscontroller -->
<g id="node15" class="node">
<title>ingresscontroller</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-481 0,-481 0,-301 320.04,-301 320.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="81.1" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Ingress Controller</text>
</g>
<!-- externalapi -->
<g id="node16" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="784.04,-481 464,-481 464,-301 784.04,-301 784.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="561.77" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- db -->
<g id="node17" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1214.04,-481 894,-481 894,-301 1214.04,-301 1214.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="999.55" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node18" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1644.04,-481 1324,-481 1324,-301 1644.04,-301 1644.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="1406.75" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node19" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2074.04,-481 1754,-481 1754,-301 2074.04,-301 2074.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="1847.32" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- user&#45;&gt;loadbalancer -->
<g id="edge1" class="edge">
<title>user&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M105.22,-946.61C95.8,-927.48 87.45,-906.9 82.42,-886.6 76.34,-862.03 81.01,-836.62 90.5,-813.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="92.88,-814.23 93.47,-806.31 88.07,-812.14 92.88,-814.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="82.42,-863.8 82.42,-886.6 209.02,-886.6 209.02,-863.8 82.42,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="85.42" y="-871" font-family="Arial" font-size="14.00" fill="#c9c9c9">Accede por HTTPS</text>
</g>
<!-- user&#45;&gt;integrationhub -->
<g id="edge2" class="edge">
<title>user&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M222.75,-946.79C249.17,-915.5 282.68,-883.29 320.47,-863.8 486.03,-778.4 1015.79,-738.37 1291.54,-722.91"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1291.69,-725.53 1299.03,-722.5 1291.4,-720.29 1291.69,-725.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="320.47,-863.8 320.47,-886.6 507.02,-886.6 507.02,-863.8 320.47,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="323.47" y="-871" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge12" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M160.02,-623.87C160.02,-582.67 160.02,-533.56 160.02,-491.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="162.65,-491.36 160.02,-483.86 157.4,-491.36 162.65,-491.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="160.02,-541 160.02,-563.8 319.31,-563.8 319.31,-541 160.02,-541"/>
<text xml:space="preserve" text-anchor="start" x="163.02" y="-548.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvia trafico al cluster</text>
</g>
<!-- integrationhub&#45;&gt;iam -->
<g id="edge14" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1621.78,-658.52C1757.14,-612.23 1956.23,-543.46 2129.02,-481 2150.9,-473.09 2173.87,-464.65 2196.53,-456.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2197.27,-458.75 2203.39,-453.68 2195.44,-453.83 2197.27,-458.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1946.32,-541 1946.32,-563.8 1973.31,-563.8 1973.31,-541 1946.32,-541"/>
<text xml:space="preserve" text-anchor="start" x="1949.32" y="-549.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge13" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1302.01,-655.08C1175.8,-609.11 995.57,-542.5 839.02,-481 824.23,-475.19 808.91,-469.06 793.57,-462.86"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="794.76,-460.51 786.82,-460.12 792.79,-465.37 794.76,-460.51"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1043.8,-541 1043.8,-563.8 1070.8,-563.8 1070.8,-541 1043.8,-541"/>
<text xml:space="preserve" text-anchor="start" x="1046.8" y="-549.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge15" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1348.91,-623.87C1294.85,-581.36 1230.09,-530.44 1175.04,-487.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1176.89,-485.27 1169.37,-482.7 1173.65,-489.4 1176.89,-485.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1270.25,-541 1270.25,-563.8 1297.25,-563.8 1297.25,-541 1270.25,-541"/>
<text xml:space="preserve" text-anchor="start" x="1273.25" y="-549.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge16" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1468.12,-623.87C1470.94,-582.67 1474.31,-533.56 1477.22,-491.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1479.83,-491.51 1477.72,-483.85 1474.59,-491.15 1479.83,-491.51"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1473.68,-541 1473.68,-563.8 1500.67,-563.8 1500.67,-541 1473.68,-541"/>
<text xml:space="preserve" text-anchor="start" x="1476.68" y="-549.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge17" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1587.33,-623.87C1647.34,-581.27 1719.26,-530.23 1780.32,-486.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1781.8,-489.06 1786.39,-482.58 1778.76,-484.78 1781.8,-489.06"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1701.57,-541 1701.57,-563.8 1797.83,-563.8 1797.83,-541 1701.57,-541"/>
<text xml:space="preserve" text-anchor="start" x="1704.57" y="-548.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- admin&#45;&gt;loadbalancer -->
<g id="edge3" class="edge">
<title>admin&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M603.3,-946.66C585.05,-917.2 561.67,-886.25 534.02,-863.8 474.81,-815.72 398.13,-781.56 329.63,-758.19"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.83,-755.82 322.89,-755.92 329.16,-760.8 330.83,-755.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="554.5,-863.8 554.5,-886.6 700.53,-886.6 700.53,-863.8 554.5,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="557.5" y="-871" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra por HTTPS</text>
</g>
<!-- admin&#45;&gt;integrationhub -->
<g id="edge4" class="edge">
<title>admin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M807.9,-947.94C863.85,-919.1 927.68,-888.2 987.67,-863.8 1086.61,-823.55 1200.73,-787.4 1292.24,-760.79"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1292.77,-763.37 1299.24,-758.76 1291.31,-758.33 1292.77,-763.37"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="987.67,-863.8 987.67,-886.6 1231.02,-886.6 1231.02,-863.8 987.67,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="990.67" y="-871" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2403.95,-946.79C2395.79,-827.38 2381.32,-615.73 2372.8,-491.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2375.44,-491.26 2372.31,-483.96 2370.2,-491.62 2375.44,-491.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2393.82,-702.4 2393.82,-725.2 2440.28,-725.2 2440.28,-702.4 2393.82,-702.4"/>
<text xml:space="preserve" text-anchor="start" x="2396.82" y="-709.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
</g>
<!-- integrationadmin&#45;&gt;operator -->
<!-- operator&#45;&gt;auditor -->
<!-- auditor&#45;&gt;infrateam -->
<!-- scheduleractor&#45;&gt;integrationhub -->
<g id="edge9" class="edge">
<title>scheduleractor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1184.48,-946.67C1235.25,-904.25 1296.06,-853.45 1347.8,-810.22"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1349.29,-812.39 1353.37,-805.57 1345.93,-808.36 1349.29,-812.39"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1281.53,-863.8 1281.53,-886.6 1327.99,-886.6 1327.99,-863.8 1281.53,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="1284.53" y="-871" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;05</text>
</g>
<!-- vault&#45;&gt;integrationhub -->
<g id="edge10" class="edge">
<title>vault&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1510.45,-946.67C1501.82,-905.38 1491.54,-856.15 1482.68,-813.7"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1485.29,-813.4 1481.19,-806.59 1480.15,-814.47 1485.29,-813.4"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1497.53,-863.8 1497.53,-886.6 1702.74,-886.6 1702.74,-863.8 1497.53,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="1500.53" y="-871" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- sharedstorage&#45;&gt;integrationhub -->
<g id="edge11" class="edge">
<title>sharedstorage&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1855.66,-946.72C1816.03,-919.32 1771.65,-889.6 1730.02,-863.8 1698.35,-844.17 1663.96,-824.14 1630.71,-805.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1632.29,-803.27 1624.46,-801.88 1629.71,-807.84 1632.29,-803.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1764.87,-863.8 1764.87,-886.6 1935.83,-886.6 1935.83,-863.8 1764.87,-863.8"/>
<text xml:space="preserve" text-anchor="start" x="1767.87" y="-871" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
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
<svg width="4317pt" height="939pt"
 viewBox="0.00 0.00 4317.00 939.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 923.85)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="965.02,-356.8 965.02,-638 1945.02,-638 1945.02,-356.8 965.02,-356.8"/>
<text xml:space="preserve" text-anchor="start" x="973.02" y="-625.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="390.02,-8 390.02,-289.2 2080.02,-289.2 2080.02,-8 390.02,-8"/>
<text xml:space="preserve" text-anchor="start" x="398.02" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<!-- adminconsole -->
<g id="node1" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1325.04,-576.8 1005,-576.8 1005,-396.8 1325.04,-396.8 1325.04,-576.8"/>
<text xml:space="preserve" text-anchor="start" x="1043.86" y="-480.8" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1905.04,-576.8 1585,-576.8 1585,-396.8 1905.04,-396.8 1905.04,-576.8"/>
<text xml:space="preserve" text-anchor="start" x="1619.41" y="-480.8" font-family="Arial" font-size="20.00" fill="#f8fafc">App Service Quarkus Native</text>
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
<!-- user -->
<g id="node7" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1110.04,-908.8 790,-908.8 790,-728.8 1110.04,-728.8 1110.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="863.85" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node8" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1540.04,-908.8 1220,-908.8 1220,-728.8 1540.04,-728.8 1540.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="1242.17" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- iam -->
<g id="node9" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="320.04,-228 0,-228 0,-48 320.04,-48 320.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="119.44" y="-132" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node10" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2470.04,-228 2150,-228 2150,-48 2470.04,-48 2470.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="2255.55" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node11" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2900.04,-228 2580,-228 2580,-48 2900.04,-48 2900.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="2677.77" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- otel -->
<g id="node12" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3330.04,-228 3010,-228 3010,-48 3330.04,-48 3330.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="3058.87" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- integrationadmin -->
<g id="node13" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4287.04,-908.8 3967,-908.8 3967,-728.8 4287.04,-728.8 4287.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="4048.64" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node14" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4287.04,-576.8 3967,-576.8 3967,-396.8 4287.04,-396.8 4287.04,-576.8"/>
<text xml:space="preserve" text-anchor="start" x="4087.56" y="-480.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node15" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4287.04,-228 3967,-228 3967,-48 4287.04,-48 4287.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="4095.34" y="-132" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- jaeger -->
<g id="node16" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3857.04,-228 3537,-228 3537,-48 3857.04,-48 3857.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="3666.44" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge3" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1324.66,-486.8C1402.4,-486.8 1495.93,-486.8 1575,-486.8"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1574.54,-489.43 1582.04,-486.8 1574.54,-484.18 1574.54,-489.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1380.03,-489.8 1380.03,-512.6 1530.01,-512.6 1530.01,-489.8 1380.03,-489.8"/>
<text xml:space="preserve" text-anchor="start" x="1383.03" y="-497" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge4" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1005.34,-478.18C844.56,-465.27 592.82,-430.49 396.08,-336.8 343.36,-311.7 292.66,-272.02 251.86,-234.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="253.87,-233.05 246.58,-229.89 250.31,-236.91 253.87,-233.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="396.08,-305.6 396.08,-328.4 525.02,-328.4 525.02,-305.6 396.08,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="399.08" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- quarkusapp&#45;&gt;filesystem -->
<g id="edge9" class="edge">
<title>quarkusapp&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1585.07,-418.77C1522.22,-395.23 1448.78,-371.11 1380.02,-356.8 1256.64,-331.13 1222.35,-351.39 1097.17,-336.8 1031.84,-329.18 865.97,-313.94 805.02,-289.2 770.7,-275.27 736.48,-255.02 705.76,-233.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="707.33,-231.77 699.68,-229.63 704.32,-236.08 707.33,-231.77"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1097.17,-305.6 1097.17,-328.4 1230.02,-328.4 1230.02,-305.6 1097.17,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1100.17" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- quarkusapp&#45;&gt;ftp -->
<g id="edge10" class="edge">
<title>quarkusapp&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1585.24,-428.99C1460.24,-383.66 1297.49,-322.43 1235.02,-289.2 1204.74,-273.1 1173.67,-253.47 1144.9,-233.78"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1146.6,-231.77 1138.94,-229.67 1143.62,-236.09 1146.6,-231.77"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1341.27,-305.6 1341.27,-328.4 1463.21,-328.4 1463.21,-305.6 1341.27,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1344.27" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;sftp -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1669.43,-396.94C1627.55,-347.7 1575.41,-286.41 1532.48,-235.93"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1534.49,-234.25 1527.63,-230.23 1530.49,-237.65 1534.49,-234.25"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1615.18,-305.6 1615.18,-328.4 1737.12,-328.4 1737.12,-305.6 1615.18,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1618.18" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;restsource -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1779.61,-396.94C1798.58,-348.2 1822.15,-287.67 1841.68,-237.5"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1844.03,-238.69 1844.3,-230.75 1839.14,-236.79 1844.03,-238.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1816.57,-305.6 1816.57,-328.4 1985.99,-328.4 1985.99,-305.6 1816.57,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1819.57" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1585.37,-417.23C1522.57,-393.49 1449.07,-369.64 1380.02,-356.8 1068.12,-298.8 978.89,-392.12 666.5,-336.8 611.83,-327.12 602.62,-307.3 548.02,-297.2 507.56,-289.72 401.81,-302.93 363.02,-289.2 328.08,-276.83 294.07,-256.25 264.19,-234.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="265.87,-232.21 258.3,-229.8 262.72,-236.41 265.87,-232.21"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="666.5,-305.6 666.5,-328.4 804.02,-328.4 804.02,-305.6 666.5,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="669.5" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge6" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1905.02,-405.08C1969,-371.22 2042.63,-330.22 2107.02,-289.2 2133.63,-272.25 2161.32,-252.96 2187.38,-233.98"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2188.83,-236.17 2193.33,-229.63 2185.73,-231.93 2188.83,-236.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2088.25,-297.2 2088.25,-336.8 2326.93,-336.8 2326.93,-297.2 2088.25,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="2091.25" y="-321.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="2091.25" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge7" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1905.04,-464.05C2067.17,-437.8 2322.29,-384.8 2525.02,-289.2 2557.3,-273.98 2589.97,-254 2619.76,-233.6"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2620.92,-235.99 2625.6,-229.56 2617.93,-231.67 2620.92,-235.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2505.46,-305.6 2505.46,-328.4 2658.56,-328.4 2658.56,-305.6 2505.46,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="2508.46" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge8" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1904.58,-482.98C2142.23,-473.75 2599.34,-436.43 2955.02,-289.2 2989.05,-275.11 3023.05,-254.93 3053.63,-233.91"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3055.02,-236.14 3059.67,-229.7 3052.02,-231.83 3055.02,-236.14"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2924.58,-305.6 2924.58,-328.4 3020.84,-328.4 3020.84,-305.6 2924.58,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="2927.58" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1003.94,-729.02C1020.53,-702.18 1039.02,-672.74 1056.47,-646 1069.45,-626.11 1083.62,-605.02 1097.31,-584.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1099.37,-586.59 1101.44,-578.91 1095.04,-583.62 1099.37,-586.59"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1056.47,-646 1056.47,-668.8 1243.02,-668.8 1243.02,-646 1056.47,-646"/>
<text xml:space="preserve" text-anchor="start" x="1059.47" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1322.12,-728.93C1293.2,-684.54 1258.15,-630.74 1228.5,-585.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1230.78,-583.93 1224.49,-579.08 1226.38,-586.79 1230.78,-583.93"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1278.97,-646 1278.97,-668.8 1522.32,-668.8 1522.32,-646 1278.97,-646"/>
<text xml:space="preserve" text-anchor="start" x="1281.97" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge15" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3329.93,-138C3392.19,-138 3463.62,-138 3526.83,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3526.79,-140.63 3534.29,-138 3526.79,-135.38 3526.79,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3385,-141 3385,-163.8 3482.04,-163.8 3482.04,-141 3385,-141"/>
<text xml:space="preserve" text-anchor="start" x="3388" y="-148.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
<!-- integrationadmin&#45;&gt;operator -->
<!-- operator&#45;&gt;auditor -->
</g>
</svg>
`;case"frontend_components":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2118pt" height="925pt"
 viewBox="0.00 0.00 2118.00 925.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 909.85)">
<g id="clust1" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="8,-282.8 8,-886.8 1268,-886.8 1268,-282.8 8,-282.8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-873.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE APP (FRONT)</text>
</g>
<!-- reactapp -->
<g id="node1" class="node">
<title>reactapp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-825.6 477.98,-825.6 477.98,-645.6 798.02,-645.6 798.02,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="542.13" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">React + PatternFly UI</text>
</g>
<!-- oidcclient -->
<g id="node2" class="node">
<title>oidcclient</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="368.02,-502.8 47.98,-502.8 47.98,-322.8 368.02,-322.8 368.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="154.66" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OIDC Client</text>
</g>
<!-- processdesigner -->
<g id="node3" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-502.8 477.98,-502.8 477.98,-322.8 798.02,-322.8 798.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="559.08" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node4" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-502.8 907.98,-502.8 907.98,-322.8 1228.02,-322.8 1228.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="979.62" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- iam -->
<g id="node5" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="368.02,-180 47.98,-180 47.98,0 368.02,0 368.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="167.42" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- processdefinitionresource -->
<g id="node6" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-180 477.98,-180 477.98,0 798.02,0 798.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="517.39" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- processexecutionresource -->
<g id="node7" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-180 907.98,-180 907.98,0 1228.02,0 1228.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="945.16" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processscheduleresource -->
<g id="node8" class="node">
<title>processscheduleresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1658.02,-180 1337.98,-180 1337.98,0 1658.02,0 1658.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="1377.38" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleResource</text>
</g>
<!-- executionqueryresource -->
<g id="node9" class="node">
<title>executionqueryresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2088.02,-180 1767.98,-180 1767.98,0 2088.02,0 2088.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="1814.05" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryResource</text>
</g>
<!-- reactapp&#45;&gt;oidcclient -->
<g id="edge1" class="edge">
<title>reactapp&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M518.79,-645.67C461.7,-603.07 393.28,-552.03 335.19,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="337.07,-506.82 329.49,-504.44 333.93,-511.03 337.07,-506.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="435.89,-562.8 435.89,-585.6 542.29,-585.6 542.29,-562.8 435.89,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="438.89" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Gestiona sesion</text>
</g>
<!-- reactapp&#45;&gt;processdesigner -->
<g id="edge2" class="edge">
<title>reactapp&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M638,-645.67C638,-604.47 638,-555.36 638,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="640.63,-513.16 638,-505.66 635.38,-513.16 640.63,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="638,-562.8 638,-585.6 840.11,-585.6 840.11,-562.8 638,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="641" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura catalogos y procesos</text>
</g>
<!-- reactapp&#45;&gt;operationsconsole -->
<g id="edge3" class="edge">
<title>reactapp&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M781.06,-645.62C809.99,-626.5 839.84,-605.91 867,-585.6 898.47,-562.07 931.37,-535.07 961.22,-509.54"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="962.87,-511.59 966.85,-504.71 959.45,-507.6 962.87,-511.59"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="895.5,-562.8 895.5,-585.6 1077.37,-585.6 1077.37,-562.8 895.5,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="898.5" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta y ejecuta procesos</text>
</g>
<!-- oidcclient&#45;&gt;iam -->
<g id="edge4" class="edge">
<title>oidcclient&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M208,-322.87C208,-281.67 208,-232.56 208,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="210.63,-190.36 208,-182.86 205.38,-190.36 210.63,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="208,-240 208,-262.8 344.74,-262.8 344.74,-240 208,-240"/>
<text xml:space="preserve" text-anchor="start" x="211" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Login y refresh token</text>
</g>
<!-- processdesigner&#45;&gt;processdefinitionresource -->
<g id="edge5" class="edge">
<title>processdesigner&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M638,-322.87C638,-281.67 638,-232.56 638,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="640.63,-190.36 638,-182.86 635.38,-190.36 640.63,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="638,-240 638,-262.8 781.73,-262.8 781.73,-240 638,-240"/>
<text xml:space="preserve" text-anchor="start" x="641" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de definiciones</text>
</g>
<!-- operationsconsole&#45;&gt;processexecutionresource -->
<g id="edge6" class="edge">
<title>operationsconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1068,-322.87C1068,-281.67 1068,-232.56 1068,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1070.63,-190.36 1068,-182.86 1065.38,-190.36 1070.63,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1068,-240 1068,-262.8 1181.39,-262.8 1181.39,-240 1068,-240"/>
<text xml:space="preserve" text-anchor="start" x="1071" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- operationsconsole&#45;&gt;processscheduleresource -->
<g id="edge7" class="edge">
<title>operationsconsole&#45;&gt;processscheduleresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1187.21,-322.87C1244.3,-280.27 1312.72,-229.23 1370.81,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1372.07,-188.23 1376.51,-181.64 1368.93,-184.02 1372.07,-188.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1295.89,-240 1295.89,-262.8 1461.42,-262.8 1461.42,-240 1295.89,-240"/>
<text xml:space="preserve" text-anchor="start" x="1298.89" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- operationsconsole&#45;&gt;executionqueryresource -->
<g id="edge8" class="edge">
<title>operationsconsole&#45;&gt;executionqueryresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1227.95,-357.07C1359.03,-311.56 1548.97,-244.1 1713,-180 1727.8,-174.22 1743.13,-168.11 1758.47,-161.91"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1759.25,-164.43 1765.22,-159.18 1757.28,-159.56 1759.25,-164.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1554.81,-240 1554.81,-262.8 1762.38,-262.8 1762.38,-240 1554.81,-240"/>
<text xml:space="preserve" text-anchor="start" x="1557.81" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoria</text>
</g>
</g>
</svg>
`;case"backend_components":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="4365pt" height="1305pt"
 viewBox="0.00 0.00 4365.00 1305.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1289.85)">
<g id="clust1" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="8,-340 8,-1266.8 2558,-1266.8 2558,-340 8,-340"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1253.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="1298,-8 1298,-289.2 2988,-289.2 2988,-8 1298,-8"/>
<text xml:space="preserve" text-anchor="start" x="1306" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<!-- processdefinitionresource -->
<g id="node1" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="368.02,-1205.6 47.98,-1205.6 47.98,-1025.6 368.02,-1025.6 368.02,-1205.6"/>
<text xml:space="preserve" text-anchor="start" x="87.39" y="-1109.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- processexecutionresource -->
<g id="node2" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2088.02,-1205.6 1767.98,-1205.6 1767.98,-1025.6 2088.02,-1025.6 2088.02,-1205.6"/>
<text xml:space="preserve" text-anchor="start" x="1805.16" y="-1109.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processscheduleresource -->
<g id="node3" class="node">
<title>processscheduleresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-1205.6 477.98,-1205.6 477.98,-1025.6 798.02,-1025.6 798.02,-1205.6"/>
<text xml:space="preserve" text-anchor="start" x="517.38" y="-1109.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleResource</text>
</g>
<!-- executionqueryresource -->
<g id="node4" class="node">
<title>executionqueryresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-1205.6 907.98,-1205.6 907.98,-1025.6 1228.02,-1025.6 1228.02,-1205.6"/>
<text xml:space="preserve" text-anchor="start" x="954.05" y="-1109.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryResource</text>
</g>
<!-- processschedulerservice -->
<g id="node5" class="node">
<title>processschedulerservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1658.02,-1205.6 1337.98,-1205.6 1337.98,-1025.6 1658.02,-1025.6 1658.02,-1205.6"/>
<text xml:space="preserve" text-anchor="start" x="1383.5" y="-1109.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessSchedulerService</text>
</g>
<!-- telemetry -->
<g id="node6" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2518.02,-1205.6 2197.98,-1205.6 2197.98,-1025.6 2518.02,-1025.6 2518.02,-1205.6"/>
<text xml:space="preserve" text-anchor="start" x="2217.38" y="-1109.6" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- processcatalogservice -->
<g id="node7" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="368.02,-882.8 47.98,-882.8 47.98,-702.8 368.02,-702.8 368.02,-882.8"/>
<text xml:space="preserve" text-anchor="start" x="104.06" y="-786.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- processschedulequeryservice -->
<g id="node8" class="node">
<title>processschedulequeryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-882.8 477.98,-882.8 477.98,-702.8 798.02,-702.8 798.02,-882.8"/>
<text xml:space="preserve" text-anchor="start" x="499.6" y="-786.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleQueryService</text>
</g>
<!-- executionqueryservice -->
<g id="node9" class="node">
<title>executionqueryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-882.8 907.98,-882.8 907.98,-702.8 1228.02,-702.8 1228.02,-882.8"/>
<text xml:space="preserve" text-anchor="start" x="963.51" y="-786.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryService</text>
</g>
<!-- processexecutionservice -->
<g id="node10" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1658.02,-882.8 1337.98,-882.8 1337.98,-702.8 1658.02,-702.8 1658.02,-882.8"/>
<text xml:space="preserve" text-anchor="start" x="1384.62" y="-786.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- persistencelayer -->
<g id="node11" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-560 477.98,-560 477.98,-380 798.02,-380 798.02,-560"/>
<text xml:space="preserve" text-anchor="start" x="515.71" y="-464" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- processengine -->
<g id="node12" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1658.02,-560 1337.98,-560 1337.98,-380 1658.02,-380 1658.02,-560"/>
<text xml:space="preserve" text-anchor="start" x="1427.96" y="-464" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- auditservice -->
<g id="node13" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2518.02,-560 2197.98,-560 2197.98,-380 2518.02,-380 2518.02,-560"/>
<text xml:space="preserve" text-anchor="start" x="2299.08" y="-464" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- filesystem -->
<g id="node14" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1658.02,-228 1337.98,-228 1337.98,-48 1658.02,-48 1658.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="1445.77" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node15" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2088.02,-228 1767.98,-228 1767.98,-48 2088.02,-48 2088.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="1909.11" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node16" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2518.02,-228 2197.98,-228 2197.98,-48 2518.02,-48 2518.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="2332.44" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node17" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2948.02,-228 2627.98,-228 2627.98,-48 2948.02,-48 2948.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="2726.87" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- iam -->
<g id="node18" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="3378.02,-228 3057.98,-228 3057.98,-48 3378.02,-48 3378.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="3177.42" y="-132" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- otel -->
<g id="node19" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3808.02,-228 3487.98,-228 3487.98,-48 3808.02,-48 3808.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="3536.85" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node20" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="4335.02,-228 4014.98,-228 4014.98,-48 4335.02,-48 4335.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="4144.42" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- db -->
<g id="node21" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="798.02,-228 477.98,-228 477.98,-48 798.02,-48 798.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="583.53" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node22" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-228 907.98,-228 907.98,-48 1228.02,-48 1228.02,-228"/>
<text xml:space="preserve" text-anchor="start" x="1005.75" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- processdefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge1" class="edge">
<title>processdefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M208,-1025.67C208,-984.47 208,-935.36 208,-892.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="210.63,-893.16 208,-885.66 205.38,-893.16 210.63,-893.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="208,-942.8 208,-965.6 387.56,-965.6 387.56,-942.8 208,-942.8"/>
<text xml:space="preserve" text-anchor="start" x="211" y="-950" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega gestion de procesos</text>
</g>
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge2" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1828.58,-1025.74C1796.53,-998.27 1760.39,-968.5 1726,-942.8 1701.48,-924.47 1674.78,-905.89 1648.57,-888.34"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1650.29,-886.34 1642.59,-884.36 1647.38,-890.71 1650.29,-886.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1754.6,-942.8 1754.6,-965.6 1868,-965.6 1868,-942.8 1754.6,-942.8"/>
<text xml:space="preserve" text-anchor="start" x="1757.6" y="-950" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecucion</text>
</g>
<!-- processscheduleresource&#45;&gt;processschedulequeryservice -->
<g id="edge3" class="edge">
<title>processscheduleresource&#45;&gt;processschedulequeryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M638,-1025.67C638,-984.47 638,-935.36 638,-892.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="640.63,-893.16 638,-885.66 635.38,-893.16 640.63,-893.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="638,-942.8 638,-965.6 830.79,-965.6 830.79,-942.8 638,-942.8"/>
<text xml:space="preserve" text-anchor="start" x="641" y="-950" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consulta de schedules</text>
</g>
<!-- executionqueryresource&#45;&gt;executionqueryservice -->
<g id="edge4" class="edge">
<title>executionqueryresource&#45;&gt;executionqueryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1068,-1025.67C1068,-984.47 1068,-935.36 1068,-892.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1070.63,-893.16 1068,-885.66 1065.38,-893.16 1070.63,-893.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1068,-942.8 1068,-965.6 1249.88,-965.6 1249.88,-942.8 1068,-942.8"/>
<text xml:space="preserve" text-anchor="start" x="1071" y="-950" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consultas operativas</text>
</g>
<!-- processschedulerservice&#45;&gt;processexecutionservice -->
<g id="edge5" class="edge">
<title>processschedulerservice&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1498,-1025.67C1498,-984.47 1498,-935.36 1498,-892.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1500.63,-893.16 1498,-885.66 1495.38,-893.16 1500.63,-893.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1498,-942.8 1498,-965.6 1699.32,-965.6 1699.32,-942.8 1498,-942.8"/>
<text xml:space="preserve" text-anchor="start" x="1501" y="-950" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispara procesos programados</text>
</g>
<!-- processcatalogservice&#45;&gt;persistencelayer -->
<g id="edge7" class="edge">
<title>processcatalogservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M327.21,-702.87C384.3,-660.27 452.72,-609.23 510.81,-565.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="512.07,-568.23 516.51,-561.64 508.93,-564.02 512.07,-568.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="435.89,-620 435.89,-642.8 570.29,-642.8 570.29,-620 435.89,-620"/>
<text xml:space="preserve" text-anchor="start" x="438.89" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones</text>
</g>
<!-- processschedulequeryservice&#45;&gt;persistencelayer -->
<g id="edge8" class="edge">
<title>processschedulequeryservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M638,-702.87C638,-661.67 638,-612.56 638,-570.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="640.63,-570.36 638,-562.86 635.38,-570.36 640.63,-570.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="638,-620 638,-642.8 803.53,-642.8 803.53,-620 638,-620"/>
<text xml:space="preserve" text-anchor="start" x="641" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- executionqueryservice&#45;&gt;persistencelayer -->
<g id="edge9" class="edge">
<title>executionqueryservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M948.79,-702.87C891.7,-660.27 823.28,-609.23 765.19,-565.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="767.07,-564.02 759.49,-561.64 763.93,-568.23 767.07,-564.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="865.89,-620 865.89,-642.8 1073.46,-642.8 1073.46,-620 865.89,-620"/>
<text xml:space="preserve" text-anchor="start" x="868.89" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoria</text>
</g>
<!-- processexecutionservice&#45;&gt;processengine -->
<g id="edge10" class="edge">
<title>processexecutionservice&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1498,-702.87C1498,-661.67 1498,-612.56 1498,-570.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1500.63,-570.36 1498,-562.86 1495.38,-570.36 1500.63,-570.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1498,-620 1498,-642.8 1524.99,-642.8 1524.99,-620 1498,-620"/>
<text xml:space="preserve" text-anchor="start" x="1501" y="-628.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionservice&#45;&gt;auditservice -->
<g id="edge11" class="edge">
<title>processexecutionservice&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1658,-732.12C1808.97,-675.8 2034.54,-591.66 2188.54,-534.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2189.17,-536.78 2195.28,-531.7 2187.33,-531.86 2189.17,-536.78"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1953.79,-620 1953.79,-642.8 2064.84,-642.8 2064.84,-620 1953.79,-620"/>
<text xml:space="preserve" text-anchor="start" x="1956.79" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge12" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M622.73,-380.2C619.94,-360.45 617.46,-339.56 616.03,-320 614.07,-293.27 615.81,-264.41 619.02,-237.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="621.58,-238.45 619.93,-230.68 616.37,-237.78 621.58,-238.45"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="616.03,-297.2 616.03,-320 780,-320 780,-297.2 616.03,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="619.03" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Opera sobre PostgreSQL</text>
</g>
<!-- processengine&#45;&gt;db -->
<g id="edge13" class="edge">
<title>processengine&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1338.27,-440.18C1204.39,-412.38 1010.44,-363.48 853,-289.2 820.72,-273.97 788.06,-253.99 758.26,-233.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="760.09,-231.66 752.43,-229.55 757.1,-235.98 760.09,-231.66"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="919.4,-297.2 919.4,-320 1103.61,-320 1103.61,-297.2 919.4,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="922.4" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- processengine&#45;&gt;externalapi -->
<g id="edge14" class="edge">
<title>processengine&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1382.2,-380.13C1323.28,-334.91 1251.63,-279.93 1191.64,-233.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1193.58,-232.07 1186.03,-229.58 1190.38,-236.23 1193.58,-232.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1295.89,-297.2 1295.89,-320 1322.89,-320 1322.89,-297.2 1295.89,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="1298.89" y="-305.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- auditservice&#45;&gt;filesystem -->
<g id="edge16" class="edge">
<title>auditservice&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1835.83,-340C1793.62,-324.6 1752.18,-307.68 1713,-289.2 1680.72,-273.97 1648.06,-253.99 1618.26,-233.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1620.09,-231.66 1612.43,-229.55 1617.1,-235.98 1620.09,-231.66"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1580.13,-289.19 1580.13,-311.99 1712.98,-311.99 1712.98,-289.19 1580.13,-289.19"/>
<text xml:space="preserve" text-anchor="start" x="1583.13" y="-296.39" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- auditservice&#45;&gt;ftp -->
<g id="edge17" class="edge">
<title>auditservice&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2189.91,-340C2143.83,-304.64 2094.73,-266.95 2051.64,-233.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2053.58,-232.07 2046.03,-229.58 2050.38,-236.23 2053.58,-232.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1994.97,-283.98 1994.97,-306.78 2116.91,-306.78 2116.91,-283.98 1994.97,-283.98"/>
<text xml:space="preserve" text-anchor="start" x="1997.97" y="-291.18" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;sftp -->
<g id="edge18" class="edge">
<title>auditservice&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2358,-340C2358,-306.15 2358,-270.16 2358,-238.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2360.63,-238.27 2358,-230.77 2355.38,-238.27 2360.63,-238.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2236.06,-283.95 2236.06,-306.75 2358,-306.75 2358,-283.95 2236.06,-283.95"/>
<text xml:space="preserve" text-anchor="start" x="2239.06" y="-291.15" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;restsource -->
<g id="edge19" class="edge">
<title>auditservice&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2526.09,-340C2572.17,-304.64 2621.27,-266.95 2664.36,-233.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2665.62,-236.23 2669.97,-229.58 2662.42,-232.07 2665.62,-236.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2429.66,-283.98 2429.66,-306.78 2599.09,-306.78 2599.09,-283.98 2429.66,-283.98"/>
<text xml:space="preserve" text-anchor="start" x="2432.66" y="-291.18" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- auditservice&#45;&gt;iam -->
<g id="edge15" class="edge">
<title>auditservice&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2558,-434.33C2691.85,-406.36 2869.47,-359.87 3015,-289.2 3045.87,-274.21 3076.84,-254.34 3104.96,-233.99"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3106.26,-236.29 3110.76,-229.74 3103.16,-232.05 3106.26,-236.29"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2707.02,-357.86 2707.02,-380.66 2844.53,-380.66 2844.53,-357.86 2707.02,-357.86"/>
<text xml:space="preserve" text-anchor="start" x="2710.02" y="-365.06" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- auditservice&#45;&gt;otel -->
<g id="edge20" class="edge">
<title>auditservice&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2558,-461.83C2779.43,-447.99 3143.36,-407.5 3433,-289.2 3467.2,-275.23 3501.31,-255.04 3531.96,-233.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3533.37,-236.17 3538.02,-229.73 3530.37,-231.86 3533.37,-236.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2963.8,-397.82 2963.8,-420.62 3060.06,-420.62 3060.06,-397.82 2963.8,-397.82"/>
<text xml:space="preserve" text-anchor="start" x="2966.8" y="-405.02" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge6" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3807.91,-138C3870.17,-138 3941.6,-138 4004.81,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4004.77,-140.63 4012.27,-138 4004.77,-135.38 4004.77,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3862.98,-141 3862.98,-163.8 3960.02,-163.8 3960.02,-141 3862.98,-141"/>
<text xml:space="preserve" text-anchor="start" x="3865.98" y="-148.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
</g>
</svg>
`;case"execution_query_layers":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="398pt" height="1178pt"
 viewBox="0.00 0.00 398.00 1178.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1163.45)">
<!-- executionqueryresource -->
<g id="node1" class="node">
<title>executionqueryresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-1148.4 0,-1148.4 0,-968.4 320.04,-968.4 320.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="46.07" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryResource</text>
</g>
<!-- executionqueryservice -->
<g id="node2" class="node">
<title>executionqueryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-825.6 0,-825.6 0,-645.6 320.04,-645.6 320.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="55.53" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryService</text>
</g>
<!-- persistencelayer -->
<g id="node3" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="37.73" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- db -->
<g id="node4" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="105.55" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- executionqueryresource&#45;&gt;executionqueryservice -->
<g id="edge1" class="edge">
<title>executionqueryresource&#45;&gt;executionqueryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M160.02,-968.47C160.02,-927.27 160.02,-878.16 160.02,-835.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="162.65,-835.96 160.02,-828.46 157.4,-835.96 162.65,-835.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="160.02,-885.6 160.02,-908.4 341.9,-908.4 341.9,-885.6 160.02,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="163.02" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consultas operativas</text>
</g>
<!-- executionqueryservice&#45;&gt;persistencelayer -->
<g id="edge2" class="edge">
<title>executionqueryservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M160.02,-645.67C160.02,-604.47 160.02,-555.36 160.02,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="162.65,-513.16 160.02,-505.66 157.4,-513.16 162.65,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="160.02,-562.8 160.02,-585.6 367.58,-585.6 367.58,-562.8 160.02,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="163.02" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoria</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge3" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M160.02,-322.87C160.02,-281.67 160.02,-232.56 160.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="162.65,-190.36 160.02,-182.86 157.4,-190.36 162.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="160.02,-240 160.02,-262.8 323.99,-262.8 323.99,-240 160.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="163.02" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Opera sobre PostgreSQL</text>
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
<!-- processdefinitionresource -->
<g id="node3" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1650.88,-180 1330.84,-180 1330.84,0 1650.88,0 1650.88,-180"/>
<text xml:space="preserve" text-anchor="start" x="1370.25" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
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
<!-- processdesigner&#45;&gt;processdefinitionresource -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1013.86,-90C1107.35,-90 1225.5,-90 1320.69,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1320.48,-92.63 1327.98,-90 1320.48,-87.38 1320.48,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1076.87,-93 1076.87,-125.8 1100.87,-125.8 1100.87,-93 1076.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1084.98" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1103.87,-93 1103.87,-125.8 1267.84,-125.8 1267.84,-93 1103.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1106.87" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra source definition</text>
</g>
<!-- processdefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>processdefinitionresource&#45;&gt;processcatalogservice</title>
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
<svg width="2199pt" height="790pt"
 viewBox="0.00 0.00 2199.00 790.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 775.05)">
<!-- scheduleractor -->
<g id="node1" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="114.99" y="-84" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- processschedulerservice -->
<g id="node2" class="node">
<title>processschedulerservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="980.4,-180 660.36,-180 660.36,0 980.4,0 980.4,-180"/>
<text xml:space="preserve" text-anchor="start" x="705.89" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessSchedulerService</text>
</g>
<!-- processexecutionservice -->
<g id="node3" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1560.63,-180 1240.59,-180 1240.59,0 1560.63,0 1560.63,-180"/>
<text xml:space="preserve" text-anchor="start" x="1287.22" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- processengine -->
<g id="node4" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-683 0,-683 0,-503 320.04,-503 320.04,-683"/>
<text xml:space="preserve" text-anchor="start" x="89.98" y="-587" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- auditservice -->
<g id="node5" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="980.4,-760 660.36,-760 660.36,-580 980.4,-580 980.4,-760"/>
<text xml:space="preserve" text-anchor="start" x="761.47" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- telemetry -->
<g id="node6" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="980.4,-470 660.36,-470 660.36,-290 980.4,-290 980.4,-470"/>
<text xml:space="preserve" text-anchor="start" x="679.76" y="-374" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- otel -->
<g id="node7" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="1560.63,-470 1240.59,-470 1240.59,-290 1560.63,-290 1560.63,-470"/>
<text xml:space="preserve" text-anchor="start" x="1289.46" y="-374" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node8" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2168.85,-470 1848.81,-470 1848.81,-290 2168.85,-290 2168.85,-470"/>
<text xml:space="preserve" text-anchor="start" x="1978.25" y="-374" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- scheduleractor&#45;&gt;processschedulerservice -->
<g id="edge1" class="edge">
<title>scheduleractor&#45;&gt;processschedulerservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.97,-90C419.76,-90 548.34,-90 650.05,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="649.9,-92.63 657.4,-90 649.9,-87.38 649.9,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-93 383.04,-125.8 407.04,-125.8 407.04,-93 383.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-93 410.04,-125.8 597.36,-125.8 597.36,-93 410.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Detecta proceso programado</text>
</g>
<!-- processschedulerservice&#45;&gt;processexecutionservice -->
<g id="edge2" class="edge">
<title>processschedulerservice&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.15,-90C1057.9,-90 1151.56,-90 1230.63,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1230.17,-92.63 1237.67,-90 1230.17,-87.38 1230.17,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1043.4,-93 1043.4,-125.8 1067.4,-125.8 1067.4,-93 1043.4,-93"/>
<text xml:space="preserve" text-anchor="start" x="1051.51" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1070.4,-93 1070.4,-125.8 1177.59,-125.8 1177.59,-93 1070.4,-93"/>
<text xml:space="preserve" text-anchor="start" x="1073.4" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lanza ejecucion</text>
</g>
<!-- processengine&#45;&gt;auditservice -->
<g id="edge3" class="edge">
<title>processengine&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.97,-611.59C419.76,-623.26 548.34,-638.3 650.05,-650.19"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="649.67,-652.79 657.42,-651.06 650.28,-647.58 649.67,-652.79"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="421.17,-645.9 421.17,-678.7 445.17,-678.7 445.17,-645.9 421.17,-645.9"/>
<text xml:space="preserve" text-anchor="start" x="429.28" y="-659.1" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="448.17,-645.9 448.17,-678.7 559.23,-678.7 559.23,-645.9 448.17,-645.9"/>
<text xml:space="preserve" text-anchor="start" x="451.17" y="-658.1" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- processengine&#45;&gt;telemetry -->
<g id="edge4" class="edge">
<title>processengine&#45;&gt;telemetry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.97,-541.57C419.96,-509.22 548.86,-467.52 650.66,-434.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="651.22,-437.16 657.55,-432.36 649.6,-432.17 651.22,-437.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="435.18,-521.02 435.18,-553.82 459.18,-553.82 459.18,-521.02 435.18,-521.02"/>
<text xml:space="preserve" text-anchor="start" x="443.29" y="-534.22" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="462.18,-521.02 462.18,-553.82 545.22,-553.82 545.22,-521.02 462.18,-521.02"/>
<text xml:space="preserve" text-anchor="start" x="465.18" y="-533.22" font-family="Arial" font-size="14.00" fill="#c9c9c9">Emite spans</text>
</g>
<!-- telemetry&#45;&gt;otel -->
<g id="edge5" class="edge">
<title>telemetry&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.15,-380C1057.9,-380 1151.56,-380 1230.63,-380"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1230.17,-382.63 1237.67,-380 1230.17,-377.38 1230.17,-382.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1048.87,-383 1048.87,-415.8 1072.87,-415.8 1072.87,-383 1048.87,-383"/>
<text xml:space="preserve" text-anchor="start" x="1056.97" y="-396.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1075.87,-383 1075.87,-415.8 1172.13,-415.8 1172.13,-383 1075.87,-383"/>
<text xml:space="preserve" text-anchor="start" x="1078.87" y="-395.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge6" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1560.49,-380C1645.95,-380 1751.35,-380 1838.37,-380"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1838.36,-382.63 1845.86,-380 1838.36,-377.38 1838.36,-382.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1623.63,-383 1623.63,-415.8 1647.63,-415.8 1647.63,-383 1623.63,-383"/>
<text xml:space="preserve" text-anchor="start" x="1631.74" y="-396.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1650.63,-383 1650.63,-415.8 1785.81,-415.8 1785.81,-383 1650.63,-383"/>
<text xml:space="preserve" text-anchor="start" x="1653.63" y="-395.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica visualizacion</text>
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
