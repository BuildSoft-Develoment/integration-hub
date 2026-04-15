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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catálogos y procesos</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoría y resultados</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reenvía tráfico al cluster</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catálogos y procesos</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoría y resultados</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Autenticación OIDC</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste configuración, jobs, auditoría<BR/>y staging</FONT></TD></TR></TABLE>>,
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
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catálogos y procesos</FONT></TD></TR></TABLE>>];
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
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoría y resultados</FONT></TD></TR></TABLE>>];
    reactapp -> oidcclient [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Gestiona sesión</FONT></TD></TR></TABLE>>,
        likec4_id="1vivoky",
        style=dashed,
        weight=3];
    reactapp -> processdesigner [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura catálogos y procesos</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones y auditoría</FONT></TD></TR></TABLE>>,
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
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste configuración, jobs, auditoría<BR/>y staging</FONT></TD></TR></TABLE>>];
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catálogos y procesos</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoría y resultados</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones y auditoría</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Autenticación OIDC</FONT></TD></TR></TABLE>>,
        likec4_id="1opishk",
        style=dashed];
    processdefinitionresource -> processcatalogservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega gestión de procesos</FONT></TD></TR></TABLE>>,
        likec4_id="11key3f",
        style=dashed,
        weight=2];
    sourcedefinitionresource -> processcatalogservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega gestión de sources</FONT></TD></TR></TABLE>>,
        likec4_id="24mw7h",
        style=dashed,
        weight=2];
    processexecutionresource -> processexecutionservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega ejecución</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones y auditoría</FONT></TD></TR></TABLE>>,
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
            processexecutionresource [height=2.5,
                label=<<FONT POINT-SIZE="20">ProcessExecutionResource</FONT>>,
                likec4_id="integrationHub.quarkusApp.processExecutionResource",
                likec4_level=2,
                margin="0.223,0.223",
                width=4.445];
            telemetry [height=2.5,
                label=<<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>,
                likec4_id="integrationHub.quarkusApp.telemetry",
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
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catálogos y procesos</FONT></TD></TR></TABLE>>];
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
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoría y resultados</FONT></TD></TR></TABLE>>];
    operationsconsole -> processexecutionresource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id=japnt7,
        minlen=1,
        style=dashed];
    processexecutionresource -> processexecutionservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Delega ejecución</FONT></TD></TR></TABLE>>,
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
    processexecutionservice -> auditservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>,
        likec4_id="1urrk5a",
        style=dashed,
        weight=2];
    processexecutionservice -> jsonconfigurationmapper [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee configuración JSON</FONT></TD></TR></TABLE>>,
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
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra catálogos y procesos</FONT></TD></TR></TABLE>>];
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
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta auditoría y resultados</FONT></TD></TR></TABLE>>];
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
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reenvía tráfico al cluster</FONT></TD></TR></TABLE>>;
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
    xlabel = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Balancea tráfico HTTP</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "appservice" -> "adminconsole_1" [
    likec4_id = "18pzovc";
    style = "dashed";
    lhead = "cluster_apppod2";
    xlabel = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Balancea tráfico HTTP</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Define tipo de fuente y parámetros</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Delega alta de catálogo</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Delega alta de catálogo</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste definición</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Solicita ejecución</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processexecutionresource" -> "processexecutionservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Delega ejecución</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>7</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Envía payload</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Lanza ejecución</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Publica visualización</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Solicita autenticación OIDC</FONT></TD></TR></TABLE>>;
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="285.02,-240 285.02,-262.8 448.97,-262.8 448.97,-240 285.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="288.02" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvía tráfico al cluster</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2154.91,-562.8 2154.91,-585.6 2362.44,-585.6 2362.44,-562.8 2154.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2157.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catálogos y procesos</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2770.24,-562.8 2770.24,-585.6 2973.13,-585.6 2973.13,-562.8 2770.24,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2773.24" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoría y resultados</text>
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
<!-- user -->
<g id="node7" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="385.04,-908.8 65,-908.8 65,-728.8 385.04,-728.8 385.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="138.85" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node8" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="815.04,-908.8 495,-908.8 495,-728.8 815.04,-728.8 815.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="517.17" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node9" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1245.04,-908.8 925,-908.8 925,-728.8 1245.04,-728.8 1245.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="1006.64" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node10" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1675.04,-908.8 1355,-908.8 1355,-728.8 1675.04,-728.8 1675.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="1475.56" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node11" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2105.04,-908.8 1785,-908.8 1785,-728.8 2105.04,-728.8 2105.04,-908.8"/>
<text xml:space="preserve" text-anchor="start" x="1913.34" y="-812.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- iam -->
<g id="node12" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="320.04,-228 0,-228 0,-48 320.04,-48 320.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="119.44" y="-132" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node13" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2470.04,-228 2150,-228 2150,-48 2470.04,-48 2470.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="2255.55" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node14" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2900.04,-228 2580,-228 2580,-48 2900.04,-48 2900.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="2677.77" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- otel -->
<g id="node15" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3330.04,-228 3010,-228 3010,-48 3330.04,-48 3330.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="3058.87" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node16" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3857.04,-228 3537,-228 3537,-48 3857.04,-48 3857.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="3666.44" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
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
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M925.26,-479.02C772.17,-466.71 538.67,-432.33 360.08,-336.8 313.25,-311.75 270.1,-272.28 235.96,-235.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="238.27,-233.82 231.29,-230.03 234.39,-237.35 238.27,-233.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="360.08,-305.6 360.08,-328.4 489.02,-328.4 489.02,-305.6 360.08,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="363.08" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticación OIDC</text>
</g>
<!-- quarkusapp&#45;&gt;filesystem -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1505.31,-419.94C1442.33,-396.47 1368.74,-372.1 1300.02,-356.8 1211.59,-337.12 1187,-348.53 1097.17,-336.8 966.72,-319.76 926.92,-338.69 805.02,-289.2 770.7,-275.27 736.48,-255.02 705.76,-233.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="707.33,-231.77 699.68,-229.63 704.32,-236.08 707.33,-231.77"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1097.17,-305.6 1097.17,-328.4 1230.02,-328.4 1230.02,-305.6 1097.17,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1100.17" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- quarkusapp&#45;&gt;ftp -->
<g id="edge13" class="edge">
<title>quarkusapp&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1505.1,-420.9C1422.65,-385.4 1321.52,-338.65 1235.02,-289.2 1206,-272.61 1175.95,-253.19 1147.84,-233.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1149.34,-231.76 1141.67,-229.66 1146.36,-236.08 1149.34,-231.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1314.61,-305.6 1314.61,-328.4 1436.55,-328.4 1436.55,-305.6 1314.61,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1317.61" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;sftp -->
<g id="edge14" class="edge">
<title>quarkusapp&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1571.23,-397.09C1554.44,-378.26 1538.15,-357.72 1525.08,-336.8 1506.04,-306.32 1490.59,-270.25 1478.77,-237.31"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1481.34,-236.71 1476.38,-230.51 1476.39,-238.45 1481.34,-236.71"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1525.08,-305.6 1525.08,-328.4 1647.02,-328.4 1647.02,-305.6 1525.08,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1528.08" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;restsource -->
<g id="edge15" class="edge">
<title>quarkusapp&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1720.11,-396.94C1750.45,-348 1788.16,-287.17 1819.35,-236.87"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1821.57,-238.26 1823.29,-230.5 1817.11,-235.49 1821.57,-238.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1778.97,-305.6 1778.97,-328.4 1948.39,-328.4 1948.39,-305.6 1778.97,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="1781.97" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
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
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1824.87,-424.62C1910.75,-389.31 2017.14,-341.59 2107.02,-289.2 2135.08,-272.84 2163.9,-253.37 2190.69,-233.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2191.98,-236.27 2196.49,-229.73 2188.89,-232.03 2191.98,-236.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2084.41,-297.2 2084.41,-336.8 2327.76,-336.8 2327.76,-297.2 2084.41,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="2087.41" y="-321.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuración, jobs, auditoría</text>
<text xml:space="preserve" text-anchor="start" x="2087.41" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge10" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1824.73,-470.16C2002.67,-448.08 2295.49,-397.65 2525.02,-289.2 2557.19,-274 2589.76,-254.08 2619.48,-233.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2620.62,-236.14 2625.3,-229.72 2617.64,-231.83 2620.62,-236.14"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2503.57,-305.6 2503.57,-328.4 2656.67,-328.4 2656.67,-305.6 2503.57,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="2506.57" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1824.88,-485.61C2075.28,-480.09 2571.08,-447.84 2955.02,-289.2 2989.06,-275.13 3023.06,-254.96 3053.64,-233.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3055.03,-236.17 3059.69,-229.73 3052.03,-231.86 3055.03,-236.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2922.61,-305.6 2922.61,-328.4 3018.87,-328.4 3018.87,-305.6 2922.61,-305.6"/>
<text xml:space="preserve" text-anchor="start" x="2925.61" y="-312.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1085.02,-646 1085.02,-668.8 1292.55,-668.8 1292.55,-646 1085.02,-646"/>
<text xml:space="preserve" text-anchor="start" x="1088.02" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catálogos y procesos</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1564.03,-646 1564.03,-668.8 1766.92,-668.8 1766.92,-646 1564.03,-646"/>
<text xml:space="preserve" text-anchor="start" x="1567.03" y="-653.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoría y resultados</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge16" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3329.93,-138C3392.19,-138 3463.62,-138 3526.83,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3526.79,-140.63 3534.29,-138 3526.79,-135.38 3526.79,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3385,-141 3385,-163.8 3482.04,-163.8 3482.04,-141 3385,-141"/>
<text xml:space="preserve" text-anchor="start" x="3388" y="-148.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1606.29,-901 1606.29,-923.8 1712.67,-923.8 1712.67,-901 1606.29,-901"/>
<text xml:space="preserve" text-anchor="start" x="1609.29" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Gestiona sesión</text>
</g>
<!-- reactapp&#45;&gt;processdesigner -->
<g id="edge7" class="edge">
<title>reactapp&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1229.86,-983.83C1200.93,-964.71 1171.07,-944.12 1143.9,-923.8 1112.44,-900.28 1079.55,-873.27 1049.72,-847.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1051.49,-845.81 1044.09,-842.92 1048.07,-849.8 1051.49,-845.81"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1143.9,-901 1143.9,-923.8 1346,-923.8 1346,-901 1143.9,-901"/>
<text xml:space="preserve" text-anchor="start" x="1146.9" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura catálogos y procesos</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1733.52,-578.2 1733.52,-601 1945.75,-601 1945.75,-578.2 1733.52,-578.2"/>
<text xml:space="preserve" text-anchor="start" x="1736.52" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoría</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1650.65,-234.66 1650.65,-274.26 1893.99,-274.26 1893.99,-234.66 1650.65,-234.66"/>
<text xml:space="preserve" text-anchor="start" x="1653.65" y="-258.66" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuración, jobs, auditoría</text>
<text xml:space="preserve" text-anchor="start" x="1653.65" y="-241.86" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1165.47,-1290.07 1165.47,-1312.87 1373,-1312.87 1373,-1290.07 1165.47,-1290.07"/>
<text xml:space="preserve" text-anchor="start" x="1168.47" y="-1297.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catálogos y procesos</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1695.25,-1300.37 1695.25,-1323.17 1898.14,-1323.17 1898.14,-1300.37 1695.25,-1300.37"/>
<text xml:space="preserve" text-anchor="start" x="1698.25" y="-1307.57" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoría y resultados</text>
</g>
</g>
</svg>
`;case"backend_components":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3887pt" height="1928pt"
 viewBox="0.00 0.00 3887.00 1928.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1912.65)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#1a468d" stroke="#1c3979" points="523.02,-328 523.02,-1626.8 3583.02,-1626.8 3583.02,-328 523.02,-328"/>
<text xml:space="preserve" text-anchor="start" x="531.02" y="-1613.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="563.02,-368 563.02,-1294.8 3543.02,-1294.8 3543.02,-368 563.02,-368"/>
<text xml:space="preserve" text-anchor="start" x="571.02" y="-1281.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="390.02,-8 390.02,-289.2 2080.02,-289.2 2080.02,-8 390.02,-8"/>
<text xml:space="preserve" text-anchor="start" x="398.02" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<!-- telemetry -->
<g id="node1" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="923.04,-1233.6 603,-1233.6 603,-1053.6 923.04,-1053.6 923.04,-1233.6"/>
<text xml:space="preserve" text-anchor="start" x="622.4" y="-1137.6" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- processdefinitionresource -->
<g id="node2" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3073.04,-1233.6 2753,-1233.6 2753,-1053.6 3073.04,-1053.6 3073.04,-1233.6"/>
<text xml:space="preserve" text-anchor="start" x="2792.41" y="-1137.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
</g>
<!-- sourcedefinitionresource -->
<g id="node3" class="node">
<title>sourcedefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2643.04,-1233.6 2323,-1233.6 2323,-1053.6 2643.04,-1053.6 2643.04,-1233.6"/>
<text xml:space="preserve" text-anchor="start" x="2366.85" y="-1137.6" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinitionResource</text>
</g>
<!-- processexecutionresource -->
<g id="node4" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1783.04,-1233.6 1463,-1233.6 1463,-1053.6 1783.04,-1053.6 1783.04,-1233.6"/>
<text xml:space="preserve" text-anchor="start" x="1500.18" y="-1137.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processscheduleresource -->
<g id="node5" class="node">
<title>processscheduleresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2213.04,-1233.6 1893,-1233.6 1893,-1053.6 2213.04,-1053.6 2213.04,-1233.6"/>
<text xml:space="preserve" text-anchor="start" x="1932.4" y="-1137.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleResource</text>
</g>
<!-- executionqueryresource -->
<g id="node6" class="node">
<title>executionqueryresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3503.04,-1233.6 3183,-1233.6 3183,-1053.6 3503.04,-1053.6 3503.04,-1233.6"/>
<text xml:space="preserve" text-anchor="start" x="3229.07" y="-1137.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryResource</text>
</g>
<!-- processschedulerservice -->
<g id="node7" class="node">
<title>processschedulerservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1353.04,-1233.6 1033,-1233.6 1033,-1053.6 1353.04,-1053.6 1353.04,-1233.6"/>
<text xml:space="preserve" text-anchor="start" x="1078.52" y="-1137.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessSchedulerService</text>
</g>
<!-- processcatalogservice -->
<g id="node8" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3047.04,-910.8 2727,-910.8 2727,-730.8 3047.04,-730.8 3047.04,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="2783.08" y="-814.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- processschedulequeryservice -->
<g id="node9" class="node">
<title>processschedulequeryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2617.04,-910.8 2297,-910.8 2297,-730.8 2617.04,-730.8 2617.04,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="2318.62" y="-814.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessScheduleQueryService</text>
</g>
<!-- executionqueryservice -->
<g id="node10" class="node">
<title>executionqueryservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3477.04,-910.8 3157,-910.8 3157,-730.8 3477.04,-730.8 3477.04,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="3212.53" y="-814.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ExecutionQueryService</text>
</g>
<!-- processexecutionservice -->
<g id="node11" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1728.04,-910.8 1408,-910.8 1408,-730.8 1728.04,-730.8 1728.04,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="1454.64" y="-814.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- persistencelayer -->
<g id="node12" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3047.04,-588 2727,-588 2727,-408 3047.04,-408 3047.04,-588"/>
<text xml:space="preserve" text-anchor="start" x="2764.73" y="-492" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- processengine -->
<g id="node13" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1728.04,-588 1408,-588 1408,-408 1728.04,-408 1728.04,-588"/>
<text xml:space="preserve" text-anchor="start" x="1497.98" y="-492" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- auditservice -->
<g id="node14" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2158.04,-588 1838,-588 1838,-408 2158.04,-408 2158.04,-588"/>
<text xml:space="preserve" text-anchor="start" x="1939.1" y="-492" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- adminconsole -->
<g id="node15" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2888.04,-1565.6 2568,-1565.6 2568,-1385.6 2888.04,-1385.6 2888.04,-1565.6"/>
<text xml:space="preserve" text-anchor="start" x="2606.86" y="-1469.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console App (Front)</text>
</g>
<!-- filesystem -->
<g id="node16" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="750.04,-228 430,-228 430,-48 750.04,-48 750.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="537.79" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node17" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1180.04,-228 860,-228 860,-48 1180.04,-48 1180.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1001.13" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node18" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1610.04,-228 1290,-228 1290,-48 1610.04,-48 1610.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1424.46" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node19" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2040.04,-228 1720,-228 1720,-48 2040.04,-48 2040.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1818.89" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- user -->
<g id="node20" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2028.04,-1897.6 1708,-1897.6 1708,-1717.6 2028.04,-1717.6 2028.04,-1897.6"/>
<text xml:space="preserve" text-anchor="start" x="1781.85" y="-1801.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node21" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2458.04,-1897.6 2138,-1897.6 2138,-1717.6 2458.04,-1717.6 2458.04,-1897.6"/>
<text xml:space="preserve" text-anchor="start" x="2160.17" y="-1801.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node22" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2888.04,-1897.6 2568,-1897.6 2568,-1717.6 2888.04,-1717.6 2888.04,-1897.6"/>
<text xml:space="preserve" text-anchor="start" x="2649.64" y="-1801.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node23" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3318.04,-1897.6 2998,-1897.6 2998,-1717.6 3318.04,-1717.6 3318.04,-1897.6"/>
<text xml:space="preserve" text-anchor="start" x="3118.56" y="-1801.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node24" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3748.04,-1897.6 3428,-1897.6 3428,-1717.6 3748.04,-1717.6 3748.04,-1897.6"/>
<text xml:space="preserve" text-anchor="start" x="3556.34" y="-1801.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- iam -->
<g id="node25" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="3857.04,-228 3537,-228 3537,-48 3857.04,-48 3857.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="3656.44" y="-132" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- otel -->
<g id="node26" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2470.04,-228 2150,-228 2150,-48 2470.04,-48 2470.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="2198.87" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node27" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2997.04,-228 2677,-228 2677,-48 2997.04,-48 2997.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="2806.44" y="-132" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- db -->
<g id="node28" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3427.04,-228 3107,-228 3107,-48 3427.04,-48 3427.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="3212.55" y="-132" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node29" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-228 0,-228 0,-48 320.04,-48 320.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="97.77" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- processdefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge12" class="edge">
<title>processdefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2905.81,-1053.67C2902.47,-1012.47 2898.49,-963.36 2895.06,-920.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2897.69,-920.91 2894.46,-913.65 2892.45,-921.33 2897.69,-920.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2900.8,-970.8 2900.8,-993.6 3080.35,-993.6 3080.35,-970.8 2900.8,-970.8"/>
<text xml:space="preserve" text-anchor="start" x="2903.8" y="-978" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega gestión de procesos</text>
</g>
<!-- sourcedefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge13" class="edge">
<title>sourcedefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2595.02,-1053.67C2648.55,-1011.16 2712.68,-960.24 2767.18,-916.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2768.54,-919.23 2772.78,-912.51 2765.28,-915.12 2768.54,-919.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2697.13,-970.8 2697.13,-993.6 2868.9,-993.6 2868.9,-970.8 2697.13,-970.8"/>
<text xml:space="preserve" text-anchor="start" x="2700.13" y="-978" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega gestión de sources</text>
</g>
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge14" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1607.77,-1053.67C1600.71,-1012.47 1592.29,-963.36 1585.02,-920.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1587.62,-920.56 1583.76,-913.61 1582.44,-921.45 1587.62,-920.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1597.17,-970.8 1597.17,-993.6 1710.57,-993.6 1710.57,-970.8 1597.17,-970.8"/>
<text xml:space="preserve" text-anchor="start" x="1600.17" y="-978" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecución</text>
</g>
<!-- processscheduleresource&#45;&gt;processschedulequeryservice -->
<g id="edge15" class="edge">
<title>processscheduleresource&#45;&gt;processschedulequeryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2165.02,-1053.67C2218.55,-1011.16 2282.68,-960.24 2337.18,-916.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2338.54,-919.23 2342.78,-912.51 2335.28,-915.12 2338.54,-919.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2267.13,-970.8 2267.13,-993.6 2459.93,-993.6 2459.93,-970.8 2267.13,-970.8"/>
<text xml:space="preserve" text-anchor="start" x="2270.13" y="-978" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consulta de schedules</text>
</g>
<!-- executionqueryresource&#45;&gt;executionqueryservice -->
<g id="edge16" class="edge">
<title>executionqueryresource&#45;&gt;executionqueryservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3335.81,-1053.67C3332.47,-1012.47 3328.49,-963.36 3325.06,-920.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3327.69,-920.91 3324.46,-913.65 3322.45,-921.33 3327.69,-920.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3330.8,-970.8 3330.8,-993.6 3512.68,-993.6 3512.68,-970.8 3330.8,-970.8"/>
<text xml:space="preserve" text-anchor="start" x="3333.8" y="-978" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega consultas operativas</text>
</g>
<!-- processschedulerservice&#45;&gt;processexecutionservice -->
<g id="edge17" class="edge">
<title>processschedulerservice&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1277.14,-1053.92C1304.56,-1026.39 1335.69,-996.54 1365.7,-970.8 1386.79,-952.72 1409.91,-934.41 1432.74,-917.11"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1434.3,-919.22 1438.71,-912.61 1431.14,-915.03 1434.3,-919.22"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1365.7,-970.8 1365.7,-993.6 1567.02,-993.6 1567.02,-970.8 1365.7,-970.8"/>
<text xml:space="preserve" text-anchor="start" x="1368.7" y="-978" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispara procesos programados</text>
</g>
<!-- processcatalogservice&#45;&gt;persistencelayer -->
<g id="edge19" class="edge">
<title>processcatalogservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2887.02,-730.87C2887.02,-689.67 2887.02,-640.56 2887.02,-598.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2889.65,-598.36 2887.02,-590.86 2884.4,-598.36 2889.65,-598.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2887.02,-648 2887.02,-670.8 3021.42,-670.8 3021.42,-648 2887.02,-648"/>
<text xml:space="preserve" text-anchor="start" x="2890.02" y="-655.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones</text>
</g>
<!-- processschedulequeryservice&#45;&gt;persistencelayer -->
<g id="edge20" class="edge">
<title>processschedulequeryservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2576.23,-730.87C2633.32,-688.27 2701.74,-637.23 2759.83,-593.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2761.09,-596.23 2765.53,-589.64 2757.95,-592.02 2761.09,-596.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2684.91,-648 2684.91,-670.8 2850.44,-670.8 2850.44,-648 2684.91,-648"/>
<text xml:space="preserve" text-anchor="start" x="2687.91" y="-655.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- executionqueryservice&#45;&gt;persistencelayer -->
<g id="edge21" class="edge">
<title>executionqueryservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3197.81,-730.87C3140.72,-688.27 3072.3,-637.23 3014.21,-593.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3016.09,-592.02 3008.51,-589.64 3012.95,-596.23 3016.09,-592.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3114.91,-648 3114.91,-670.8 3327.15,-670.8 3327.15,-648 3114.91,-648"/>
<text xml:space="preserve" text-anchor="start" x="3117.91" y="-655.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoría</text>
</g>
<!-- processexecutionservice&#45;&gt;processengine -->
<g id="edge22" class="edge">
<title>processexecutionservice&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1568.02,-730.87C1568.02,-689.67 1568.02,-640.56 1568.02,-598.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1570.65,-598.36 1568.02,-590.86 1565.4,-598.36 1570.65,-598.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1568.02,-648 1568.02,-670.8 1595.01,-670.8 1595.01,-648 1568.02,-648"/>
<text xml:space="preserve" text-anchor="start" x="1571.02" y="-656.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionservice&#45;&gt;auditservice -->
<g id="edge23" class="edge">
<title>processexecutionservice&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1687.23,-730.87C1744.32,-688.27 1812.74,-637.23 1870.83,-593.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1872.09,-596.23 1876.53,-589.64 1868.95,-592.02 1872.09,-596.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1795.91,-648 1795.91,-670.8 1906.97,-670.8 1906.97,-648 1795.91,-648"/>
<text xml:space="preserve" text-anchor="start" x="1798.91" y="-655.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge24" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2981.44,-408.05C3037.29,-355.43 3108.04,-288.77 3165.15,-234.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3166.89,-236.94 3170.55,-229.88 3163.29,-233.11 3166.89,-236.94"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3094.1,-297.2 3094.1,-320 3258.07,-320 3258.07,-297.2 3094.1,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="3097.1" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Opera sobre PostgreSQL</text>
</g>
<!-- processengine&#45;&gt;db -->
<g id="edge25" class="edge">
<title>processengine&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1654.76,-408.18C1691.15,-376.81 1735.94,-345.1 1783.02,-328 1799.59,-321.98 3035.28,-294.75 3052.02,-289.2 3088.92,-276.97 3125.11,-256.19 3156.98,-233.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3158.35,-236.17 3162.94,-229.68 3155.31,-231.89 3158.35,-236.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2804.78,-297.2 2804.78,-320 2989,-320 2989,-297.2 2804.78,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="2807.78" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- processengine&#45;&gt;externalapi -->
<g id="edge26" class="edge">
<title>processengine&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1408.34,-492.78C1171.16,-481.44 715.86,-440 363.02,-289.2 330.46,-275.28 298.23,-255.19 269.37,-234.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="270.96,-232.12 263.36,-229.78 267.84,-236.34 270.96,-232.12"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="423.92,-297.2 423.92,-320 450.91,-320 450.91,-297.2 423.92,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="426.92" y="-305.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- auditservice&#45;&gt;filesystem -->
<g id="edge28" class="edge">
<title>auditservice&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1859.81,-368C1835.71,-351.72 1809.75,-337.47 1783.02,-328 1754.53,-317.91 1269.22,-321.29 1239.02,-320 1045.82,-311.73 987.3,-353.75 805.02,-289.2 768.87,-276.4 733.24,-255.76 701.69,-233.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="703.44,-231.86 695.8,-229.68 700.41,-236.15 703.44,-231.86"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1137.03,-320.3 1137.03,-343.1 1269.87,-343.1 1269.87,-320.3 1137.03,-320.3"/>
<text xml:space="preserve" text-anchor="start" x="1140.03" y="-327.5" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- auditservice&#45;&gt;ftp -->
<g id="edge29" class="edge">
<title>auditservice&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1857.71,-368C1834.14,-352.04 1808.9,-337.88 1783.02,-328 1756.81,-317.99 1685.01,-321.91 1657.02,-320 1469.4,-307.2 1412.23,-352.15 1235.02,-289.2 1198.88,-276.36 1163.25,-255.72 1131.71,-233.79"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1133.46,-231.81 1125.82,-229.63 1130.43,-236.1 1133.46,-231.81"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1369.88,-320.99 1369.88,-343.79 1491.81,-343.79 1491.81,-320.99 1369.88,-320.99"/>
<text xml:space="preserve" text-anchor="start" x="1372.88" y="-328.19" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;sftp -->
<g id="edge30" class="edge">
<title>auditservice&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1847.06,-368C1826.28,-353.37 1804.63,-339.58 1783.02,-328 1734.36,-301.92 1714.4,-313.89 1665.02,-289.2 1633.79,-273.58 1601.98,-253.85 1572.74,-233.86"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1574.31,-231.75 1566.65,-229.65 1571.33,-236.07 1574.31,-231.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1582.1,-303.78 1582.1,-326.58 1704.04,-326.58 1704.04,-303.78 1582.1,-303.78"/>
<text xml:space="preserve" text-anchor="start" x="1585.1" y="-310.98" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;restsource -->
<g id="edge31" class="edge">
<title>auditservice&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1955.5,-368C1941.34,-325.04 1925.8,-277.9 1912.53,-237.62"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1915.08,-236.98 1910.24,-230.68 1910.09,-238.63 1915.08,-236.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1763.06,-298.17 1763.06,-320.97 1932.48,-320.97 1932.48,-298.17 1763.06,-298.17"/>
<text xml:space="preserve" text-anchor="start" x="1766.06" y="-305.37" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- auditservice&#45;&gt;iam -->
<g id="edge27" class="edge">
<title>auditservice&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2451.71,-368C2524.84,-351.63 2600.12,-337.35 2672.02,-328 2807.12,-310.43 3149.27,-331.44 3285.02,-320 3373.33,-312.56 3399.8,-322.27 3482.02,-289.2 3516.48,-275.34 3550.81,-255.06 3581.6,-233.86"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3583.06,-236.04 3587.7,-229.59 3580.05,-231.74 3583.06,-236.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2883.35,-322.3 2883.35,-345.1 3020.86,-345.1 3020.86,-322.3 2883.35,-322.3"/>
<text xml:space="preserve" text-anchor="start" x="2886.35" y="-329.5" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- auditservice&#45;&gt;otel -->
<g id="edge32" class="edge">
<title>auditservice&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2110.44,-368C2148.5,-324.33 2190.32,-276.35 2225.8,-235.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2227.69,-237.47 2230.64,-230.09 2223.73,-234.02 2227.69,-237.47"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2075.13,-298.07 2075.13,-320.87 2171.39,-320.87 2171.39,-298.07 2075.13,-298.07"/>
<text xml:space="preserve" text-anchor="start" x="2078.13" y="-305.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- adminconsole&#45;&gt;processdefinitionresource -->
<g id="edge6" class="edge">
<title>adminconsole&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2777.84,-1385.73C2802.67,-1341.44 2832.76,-1287.77 2858.24,-1242.32"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2860.41,-1243.81 2861.79,-1235.98 2855.83,-1241.24 2860.41,-1243.81"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2820.52,-1302.8 2820.52,-1325.6 2947.12,-1325.6 2947.12,-1302.8 2820.52,-1302.8"/>
<text xml:space="preserve" text-anchor="start" x="2823.52" y="-1310" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de procesos</text>
</g>
<!-- adminconsole&#45;&gt;sourcedefinitionresource -->
<g id="edge7" class="edge">
<title>adminconsole&#45;&gt;sourcedefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2662.04,-1385.73C2629.02,-1341.25 2588.98,-1287.32 2555.15,-1241.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2557.29,-1240.23 2550.71,-1235.77 2553.07,-1243.36 2557.29,-1240.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2612.87,-1302.8 2612.87,-1325.6 2731.68,-1325.6 2731.68,-1302.8 2612.87,-1302.8"/>
<text xml:space="preserve" text-anchor="start" x="2615.87" y="-1310" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de sources</text>
</g>
<!-- adminconsole&#45;&gt;processexecutionresource -->
<g id="edge8" class="edge">
<title>adminconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2568.26,-1462.13C2385.48,-1443.43 2080.2,-1398.5 1838.02,-1294.8 1804.45,-1280.42 1770.81,-1260.31 1740.44,-1239.47"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1742.1,-1237.43 1734.44,-1235.3 1739.1,-1241.74 1742.1,-1237.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1906.25,-1302.8 1906.25,-1325.6 2019.64,-1325.6 2019.64,-1302.8 1906.25,-1302.8"/>
<text xml:space="preserve" text-anchor="start" x="1909.25" y="-1310" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- adminconsole&#45;&gt;processscheduleresource -->
<g id="edge9" class="edge">
<title>adminconsole&#45;&gt;processscheduleresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2568.2,-1422.68C2477.78,-1390.73 2363.95,-1346.11 2268.02,-1294.8 2237.78,-1278.62 2206.73,-1258.97 2177.95,-1239.27"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2179.66,-1237.26 2171.99,-1235.16 2176.68,-1241.58 2179.66,-1237.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2327.93,-1302.8 2327.93,-1325.6 2493.46,-1325.6 2493.46,-1302.8 2327.93,-1302.8"/>
<text xml:space="preserve" text-anchor="start" x="2330.93" y="-1310" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta programaciones</text>
</g>
<!-- adminconsole&#45;&gt;executionqueryresource -->
<g id="edge10" class="edge">
<title>adminconsole&#45;&gt;executionqueryresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2887.63,-1411C2962.26,-1379.21 3051.37,-1338.29 3128.02,-1294.8 3157.31,-1278.18 3187.61,-1258.63 3215.91,-1239.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3217.05,-1241.63 3221.73,-1235.21 3214.07,-1237.31 3217.05,-1241.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3107.4,-1302.8 3107.4,-1325.6 3319.64,-1325.6 3319.64,-1302.8 3107.4,-1302.8"/>
<text xml:space="preserve" text-anchor="start" x="3110.4" y="-1310" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones y auditoría</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge11" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2887.72,-1470.86C3065.87,-1460.1 3356.99,-1422.39 3570.02,-1294.8 3645.02,-1249.88 3697.02,-1232.02 3697.02,-1144.6 3697.02,-1144.6 3697.02,-1144.6 3697.02,-497 3697.02,-409.47 3697.02,-309.91 3697.02,-238.04"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3699.65,-238.17 3697.02,-230.67 3694.4,-238.17 3699.65,-238.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3697.02,-809.4 3697.02,-832.2 3825.96,-832.2 3825.96,-809.4 3697.02,-809.4"/>
<text xml:space="preserve" text-anchor="start" x="3700.02" y="-816.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticación OIDC</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2027.97,-1721.99C2087.23,-1692.37 2155.56,-1660.19 2219.47,-1634.8 2330.18,-1590.82 2458.26,-1551.04 2558.18,-1522.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2558.67,-1524.96 2565.16,-1520.38 2557.23,-1519.91 2558.67,-1524.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2219.47,-1634.8 2219.47,-1657.6 2406.02,-1657.6 2406.02,-1634.8 2219.47,-1634.8"/>
<text xml:space="preserve" text-anchor="start" x="2222.47" y="-1642" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2371.42,-1717.81C2397.1,-1689.52 2427.17,-1659.25 2457.67,-1634.8 2488.86,-1609.79 2524.44,-1586.1 2559.31,-1565.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2560.47,-1567.4 2565.55,-1561.29 2557.77,-1562.89 2560.47,-1567.4"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2457.67,-1634.8 2457.67,-1657.6 2701.02,-1657.6 2701.02,-1634.8 2457.67,-1634.8"/>
<text xml:space="preserve" text-anchor="start" x="2460.67" y="-1642" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;adminconsole -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2728.02,-1717.73C2728.02,-1673.9 2728.02,-1620.88 2728.02,-1575.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2730.65,-1575.87 2728.02,-1568.37 2725.4,-1575.87 2730.65,-1575.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2728.02,-1634.8 2728.02,-1657.6 2935.55,-1657.6 2935.55,-1634.8 2728.02,-1634.8"/>
<text xml:space="preserve" text-anchor="start" x="2731.02" y="-1642" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catálogos y procesos</text>
</g>
<!-- operator&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3062.42,-1717.97C3031.43,-1690.44 2996.41,-1660.58 2963.02,-1634.8 2935.17,-1613.31 2904.54,-1591.47 2874.86,-1571.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2876.69,-1569.24 2869.01,-1567.19 2873.73,-1573.58 2876.69,-1569.24"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2990.7,-1634.8 2990.7,-1657.6 3104.09,-1657.6 3104.09,-1634.8 2990.7,-1634.8"/>
<text xml:space="preserve" text-anchor="start" x="2993.7" y="-1642" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;adminconsole -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3428.01,-1739.64C3409.51,-1732.11 3390.88,-1724.63 3373.02,-1717.6 3212.55,-1654.43 3028.11,-1585.92 2897.67,-1538.15"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2898.77,-1535.76 2890.83,-1535.65 2896.97,-1540.69 2898.77,-1535.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3214.46,-1634.8 3214.46,-1657.6 3417.34,-1657.6 3417.34,-1634.8 3214.46,-1634.8"/>
<text xml:space="preserve" text-anchor="start" x="3217.46" y="-1642" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoría y resultados</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge18" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2469.93,-138C2532.19,-138 2603.62,-138 2666.83,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2666.79,-140.63 2674.29,-138 2666.79,-135.38 2666.79,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2525,-141 2525,-163.8 2622.04,-163.8 2622.04,-141 2525,-141"/>
<text xml:space="preserve" text-anchor="start" x="2528" y="-148.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
</g>
</svg>
`;case"process_engine_code":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="5436pt" height="2291pt"
 viewBox="0.00 0.00 5436.00 2291.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2276.05)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#1c417d" stroke="#1c356c" points="2655,-270.8 2655,-2012 5102,-2012 5102,-270.8 2655,-270.8"/>
<text xml:space="preserve" text-anchor="start" x="2663" y="-1999.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="3372,-1669.6 3372,-1950.8 4202,-1950.8 4202,-1669.6 3372,-1669.6"/>
<text xml:space="preserve" text-anchor="start" x="3380" y="-1937.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE APP (FRONT)</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#29472f" stroke="#1c3021" points="2695,-310.8 2695,-1618.8 5062,-1618.8 5062,-310.8 2695,-310.8"/>
<text xml:space="preserve" text-anchor="start" x="2703" y="-1605.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">APP SERVICE QUARKUS NATIVE</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_processengine</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="3125,-350.8 3125,-964 4815,-964 4815,-350.8 3125,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="3133" y="-951.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">PROCESS ENGINE</text>
</g>
<g id="clust5" class="cluster">
<title>cluster_filesources</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="8,-350.8 8,-632 1698,-632 1698,-350.8 8,-350.8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-619.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">FUENTES EXTERNAS</text>
</g>
<!-- processdesigner -->
<g id="node1" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3732.02,-1889.6 3411.98,-1889.6 3411.98,-1709.6 3732.02,-1709.6 3732.02,-1889.6"/>
<text xml:space="preserve" text-anchor="start" x="3493.08" y="-1793.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node2" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4162.02,-1889.6 3841.98,-1889.6 3841.98,-1709.6 4162.02,-1709.6 4162.02,-1889.6"/>
<text xml:space="preserve" text-anchor="start" x="3913.62" y="-1793.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- jsonconfigurationmapper -->
<g id="node3" class="node">
<title>jsonconfigurationmapper</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3485.02,-902.8 3164.98,-902.8 3164.98,-722.8 3485.02,-722.8 3485.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="3210.49" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">JsonConfigurationMapper</text>
</g>
<!-- sourceregistry -->
<g id="node4" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3915.02,-902.8 3594.98,-902.8 3594.98,-722.8 3915.02,-722.8 3915.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="3643.85" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node5" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4345.02,-902.8 4024.98,-902.8 4024.98,-722.8 4345.02,-722.8 4345.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="4072.73" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- taskregistry -->
<g id="node6" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4775.02,-902.8 4454.98,-902.8 4454.98,-722.8 4775.02,-722.8 4775.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="4513.86" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- sourceproviders -->
<g id="node7" class="node">
<title>sourceproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3915.02,-570.8 3594.98,-570.8 3594.98,-390.8 3915.02,-390.8 3915.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="3678.3" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Providers</text>
</g>
<!-- readerproviders -->
<g id="node8" class="node">
<title>readerproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4345.02,-570.8 4024.98,-570.8 4024.98,-390.8 4345.02,-390.8 4345.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="4107.19" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Providers</text>
</g>
<!-- taskproviders -->
<g id="node9" class="node">
<title>taskproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4775.02,-570.8 4454.98,-570.8 4454.98,-390.8 4775.02,-390.8 4775.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="4548.32" y="-474.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Providers</text>
</g>
<!-- processexecutionresource -->
<g id="node10" class="node">
<title>processexecutionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4162.02,-1557.6 3841.98,-1557.6 3841.98,-1377.6 4162.02,-1377.6 4162.02,-1557.6"/>
<text xml:space="preserve" text-anchor="start" x="3879.16" y="-1461.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- telemetry -->
<g id="node11" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4592.02,-1557.6 4271.98,-1557.6 4271.98,-1377.6 4592.02,-1377.6 4592.02,-1557.6"/>
<text xml:space="preserve" text-anchor="start" x="4291.38" y="-1461.6" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- persistencelayer -->
<g id="node12" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="5022.02,-1557.6 4701.98,-1557.6 4701.98,-1377.6 5022.02,-1377.6 5022.02,-1557.6"/>
<text xml:space="preserve" text-anchor="start" x="4739.71" y="-1461.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- processexecutionservice -->
<g id="node13" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4162.02,-1234.8 3841.98,-1234.8 3841.98,-1054.8 4162.02,-1054.8 4162.02,-1234.8"/>
<text xml:space="preserve" text-anchor="start" x="3888.62" y="-1138.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- auditservice -->
<g id="node14" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3055.02,-902.8 2734.98,-902.8 2734.98,-722.8 3055.02,-722.8 3055.02,-902.8"/>
<text xml:space="preserve" text-anchor="start" x="2836.08" y="-806.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
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
<!-- user -->
<g id="node19" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2872.02,-2261 2551.98,-2261 2551.98,-2081 2872.02,-2081 2872.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="2625.83" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node20" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3302.02,-2261 2981.98,-2261 2981.98,-2081 3302.02,-2081 3302.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="3004.15" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node21" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3732.02,-2261 3411.98,-2261 3411.98,-2081 3732.02,-2081 3732.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="3493.62" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node22" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4162.02,-2261 3841.98,-2261 3841.98,-2081 4162.02,-2081 4162.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="3962.54" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node23" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="4592.02,-2261 4271.98,-2261 4271.98,-2081 4592.02,-2081 4592.02,-2261"/>
<text xml:space="preserve" text-anchor="start" x="4400.32" y="-2165" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- db -->
<g id="node24" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="5402.02,-180 5081.98,-180 5081.98,0 5402.02,0 5402.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="5187.53" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- otel -->
<g id="node25" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2088.02,-570.8 1767.98,-570.8 1767.98,-390.8 2088.02,-390.8 2088.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="1816.85" y="-474.8" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node26" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2615.02,-570.8 2294.98,-570.8 2294.98,-390.8 2615.02,-390.8 2615.02,-570.8"/>
<text xml:space="preserve" text-anchor="start" x="2424.42" y="-474.8" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- externalapi -->
<g id="node27" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4775.02,-180 4454.98,-180 4454.98,0 4775.02,0 4775.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="4552.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- operationsconsole&#45;&gt;processexecutionresource -->
<g id="edge6" class="edge">
<title>operationsconsole&#45;&gt;processexecutionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4002,-1709.73C4002,-1665.9 4002,-1612.88 4002,-1567.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4004.63,-1567.87 4002,-1560.37 3999.38,-1567.87 4004.63,-1567.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4002,-1626.8 4002,-1649.6 4115.39,-1649.6 4115.39,-1626.8 4002,-1626.8"/>
<text xml:space="preserve" text-anchor="start" x="4005" y="-1634" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- sourceregistry&#45;&gt;sourceproviders -->
<g id="edge21" class="edge">
<title>sourceregistry&#45;&gt;sourceproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3755,-722.93C3755,-679.1 3755,-626.08 3755,-580.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3757.63,-581.07 3755,-573.57 3752.38,-581.07 3757.63,-581.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3755,-640 3755,-662.8 3891.72,-662.8 3891.72,-640 3755,-640"/>
<text xml:space="preserve" text-anchor="start" x="3758" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- readerregistry&#45;&gt;readerproviders -->
<g id="edge22" class="edge">
<title>readerregistry&#45;&gt;readerproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4185,-722.93C4185,-679.1 4185,-626.08 4185,-580.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4187.63,-581.07 4185,-573.57 4182.38,-581.07 4187.63,-581.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4185,-640 4185,-662.8 4321.72,-662.8 4321.72,-640 4185,-640"/>
<text xml:space="preserve" text-anchor="start" x="4188" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskregistry&#45;&gt;taskproviders -->
<g id="edge23" class="edge">
<title>taskregistry&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4506.29,-723.13C4488.06,-697.97 4477.96,-669.37 4488.28,-640 4495.79,-618.6 4507.56,-597.94 4520.96,-579.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4522.92,-580.78 4525.22,-573.18 4518.68,-577.69 4522.92,-580.78"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4488.28,-640 4488.28,-662.8 4625,-662.8 4625,-640 4488.28,-640"/>
<text xml:space="preserve" text-anchor="start" x="4491.28" y="-647.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskproviders&#45;&gt;db -->
<g id="edge24" class="edge">
<title>taskproviders&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4742.87,-390.99C4810.91,-344.66 4896.47,-287.83 4974.79,-240 5006.31,-220.75 5040.42,-200.96 5073.39,-182.35"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5074.31,-184.84 5079.56,-178.88 5071.74,-180.27 5074.31,-184.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4974.79,-240 4974.79,-262.8 5159,-262.8 5159,-240 4974.79,-240"/>
<text xml:space="preserve" text-anchor="start" x="4977.79" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- taskproviders&#45;&gt;externalapi -->
<g id="edge25" class="edge">
<title>taskproviders&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4615,-391.09C4615,-331.11 4615,-251.85 4615,-189.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4617.63,-190.19 4615,-182.69 4612.38,-190.19 4617.63,-190.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4615,-240 4615,-262.8 4641.99,-262.8 4641.99,-240 4615,-240"/>
<text xml:space="preserve" text-anchor="start" x="4618" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge7" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4002,-1377.67C4002,-1336.47 4002,-1287.36 4002,-1244.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4004.63,-1245.16 4002,-1237.66 3999.38,-1245.16 4004.63,-1245.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4002,-1294.8 4002,-1317.6 4115.4,-1317.6 4115.4,-1294.8 4002,-1294.8"/>
<text xml:space="preserve" text-anchor="start" x="4005" y="-1302" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecución</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge8" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M5021.78,-1404.94C5125.7,-1353.24 5242,-1268.08 5242,-1145.8 5242,-1145.8 5242,-1145.8 5242,-479.8 5242,-381.29 5242,-268.73 5242,-190.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5244.63,-190.32 5242,-182.82 5239.38,-190.32 5244.63,-190.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="5242,-801.4 5242,-824.2 5405.97,-824.2 5405.97,-801.4 5242,-801.4"/>
<text xml:space="preserve" text-anchor="start" x="5245" y="-808.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Opera sobre PostgreSQL</text>
</g>
<!-- processexecutionservice&#45;&gt;jsonconfigurationmapper -->
<g id="edge11" class="edge">
<title>processexecutionservice&#45;&gt;jsonconfigurationmapper</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3842.01,-1092.16C3751.1,-1060.23 3636.52,-1015.54 3540,-964 3509.75,-947.85 3478.69,-928.2 3449.91,-908.51"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3451.62,-906.49 3443.95,-904.4 3448.64,-910.82 3451.62,-906.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3600.17,-972 3600.17,-994.8 3757.91,-994.8 3757.91,-972 3600.17,-972"/>
<text xml:space="preserve" text-anchor="start" x="3603.17" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee configuración JSON</text>
</g>
<!-- processexecutionservice&#45;&gt;sourceregistry -->
<g id="edge12" class="edge">
<title>processexecutionservice&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3935.48,-1054.93C3902.19,-1010.45 3861.82,-956.52 3827.71,-910.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3829.83,-909.4 3823.23,-904.96 3825.63,-912.54 3829.83,-909.4"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3885.91,-972 3885.91,-994.8 4050.65,-994.8 4050.65,-972 3885.91,-972"/>
<text xml:space="preserve" text-anchor="start" x="3888.91" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve SourceProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;readerregistry -->
<g id="edge13" class="edge">
<title>processexecutionservice&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4051.28,-1054.93C4075.84,-1010.64 4105.61,-956.97 4130.81,-911.52"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4132.98,-913.02 4134.32,-905.19 4128.39,-910.47 4132.98,-913.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4093.5,-972 4093.5,-994.8 4259.8,-994.8 4259.8,-972 4093.5,-972"/>
<text xml:space="preserve" text-anchor="start" x="4096.5" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve ReaderProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;taskregistry -->
<g id="edge14" class="edge">
<title>processexecutionservice&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4161.75,-1079.68C4235.81,-1047.94 4324.04,-1007.2 4400,-964 4429.27,-947.36 4459.57,-927.79 4487.86,-908.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4489.01,-910.79 4493.69,-904.37 4486.02,-906.47 4489.01,-910.79"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4379.48,-972 4379.48,-994.8 4530.2,-994.8 4530.2,-972 4379.48,-972"/>
<text xml:space="preserve" text-anchor="start" x="4382.48" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve TaskProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;taskproviders -->
<g id="edge15" class="edge">
<title>processexecutionservice&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4161.96,-1132.36C4378.59,-1113.17 4747.72,-1066.07 4830,-964 4897.28,-880.54 4868.19,-822.97 4830,-722.8 4809.22,-668.3 4769.83,-618.3 4730.38,-578.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4732.31,-576.35 4725.16,-572.9 4728.59,-580.06 4732.31,-576.35"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4870.28,-801.4 4870.28,-824.2 4897.27,-824.2 4897.27,-801.4 4870.28,-801.4"/>
<text xml:space="preserve" text-anchor="start" x="4873.28" y="-809.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processexecutionservice&#45;&gt;auditservice -->
<g id="edge10" class="edge">
<title>processexecutionservice&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3842.12,-1133.24C3656.33,-1116.23 3343.83,-1072.8 3098,-964 3065.89,-949.79 3034,-929.77 3005.34,-908.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3006.98,-906.91 2999.39,-904.58 3003.87,-911.14 3006.98,-906.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3166.95,-972 3166.95,-994.8 3278.01,-994.8 3278.01,-972 3166.95,-972"/>
<text xml:space="preserve" text-anchor="start" x="3169.95" y="-979.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- auditservice&#45;&gt;filesystem -->
<g id="edge16" class="edge">
<title>auditservice&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2695,-810.86C2183.78,-806.3 840.19,-780.14 423,-632 386.86,-619.17 351.23,-598.52 319.68,-576.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="321.44,-574.62 313.8,-572.43 318.41,-578.91 321.44,-574.62"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1365.42,-773.81 1365.42,-796.61 1498.27,-796.61 1498.27,-773.81 1365.42,-773.81"/>
<text xml:space="preserve" text-anchor="start" x="1368.42" y="-781.01" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- auditservice&#45;&gt;ftp -->
<g id="edge17" class="edge">
<title>auditservice&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2695,-807.28C2249.43,-795.1 1188.05,-753.85 853,-632 817.16,-618.96 781.75,-598.38 750.33,-576.58"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="752.13,-574.63 744.48,-572.45 749.1,-578.92 752.13,-574.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1590.96,-759.29 1590.96,-782.09 1712.9,-782.09 1712.9,-759.29 1590.96,-759.29"/>
<text xml:space="preserve" text-anchor="start" x="1593.96" y="-766.49" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;sftp -->
<g id="edge18" class="edge">
<title>auditservice&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2695,-801.83C2322.45,-781.23 1536.97,-727.72 1283,-632 1247.6,-618.66 1212.54,-598.16 1181.32,-576.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1183.17,-574.64 1175.52,-572.48 1180.15,-578.94 1183.17,-574.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1806.11,-743.4 1806.11,-766.2 1928.05,-766.2 1928.05,-743.4 1806.11,-743.4"/>
<text xml:space="preserve" text-anchor="start" x="1809.11" y="-750.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- auditservice&#45;&gt;restsource -->
<g id="edge19" class="edge">
<title>auditservice&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2695,-808.9C2453.95,-799.27 2040.48,-762.94 1713,-632 1678.51,-618.21 1644.17,-597.95 1613.38,-576.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1614.93,-574.64 1607.28,-572.49 1611.92,-578.94 1614.93,-574.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1969.5,-749.58 1969.5,-772.38 2138.92,-772.38 2138.92,-749.58 1969.5,-749.58"/>
<text xml:space="preserve" text-anchor="start" x="1972.5" y="-756.78" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- auditservice&#45;&gt;otel -->
<g id="edge20" class="edge">
<title>auditservice&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2695,-766.86C2563.74,-734.95 2389.37,-687.93 2240,-632 2192.73,-614.3 2142.9,-592.05 2097.28,-570.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2098.54,-567.84 2090.64,-566.94 2096.25,-572.56 2098.54,-567.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2290.41,-682.07 2290.41,-704.87 2386.67,-704.87 2386.67,-682.07 2290.41,-682.07"/>
<text xml:space="preserve" text-anchor="start" x="2293.41" y="-689.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- user&#45;&gt;processdesigner -->
<g id="edge1" class="edge">
<title>user&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2872,-2101.28C3010.37,-2041.84 3211.41,-1955.49 3362.58,-1890.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3363.37,-1893.07 3369.22,-1887.7 3361.3,-1888.25 3363.37,-1893.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2935.57,-1993.84 2935.57,-2016.64 3122.12,-2016.64 3122.12,-1993.84 2935.57,-1993.84"/>
<text xml:space="preserve" text-anchor="start" x="2938.57" y="-2001.04" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;processdesigner -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3245.54,-2081.05C3288.71,-2043.97 3340.15,-1999.77 3389.29,-1957.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3390.89,-1959.65 3394.86,-1952.77 3387.46,-1955.67 3390.89,-1959.65"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3321.48,-2015.81 3321.48,-2038.61 3564.83,-2038.61 3564.83,-2015.81 3321.48,-2015.81"/>
<text xml:space="preserve" text-anchor="start" x="3324.48" y="-2023.01" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3572,-2081.05C3572,-2045.04 3572,-2002.31 3572,-1961.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3574.63,-1961.32 3572,-1953.82 3569.38,-1961.32 3574.63,-1961.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3364.47,-1993.07 3364.47,-2015.87 3572,-2015.87 3572,-1993.07 3364.47,-1993.07"/>
<text xml:space="preserve" text-anchor="start" x="3367.47" y="-2000.27" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catálogos y procesos</text>
</g>
<!-- operator&#45;&gt;processdesigner -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3874.61,-2081.04C3845.21,-2059.24 3814.51,-2035.42 3787,-2012 3767.06,-1995.02 3746.7,-1976.6 3726.84,-1957.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3728.72,-1956.11 3721.46,-1952.88 3725.12,-1959.93 3728.72,-1956.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3673.59,-2011.99 3673.59,-2034.79 3786.99,-2034.79 3786.99,-2011.99 3673.59,-2011.99"/>
<text xml:space="preserve" text-anchor="start" x="3676.59" y="-2019.19" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- auditor&#45;&gt;processdesigner -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M4272.21,-2099.49C4253.79,-2092.67 4235.12,-2086.32 4217,-2081 4070.96,-2038.09 4030.88,-2040.1 3880,-2020 3859.44,-2017.26 3805.84,-2020.67 3787,-2012 3757.58,-1998.46 3729.81,-1979.11 3704.63,-1957.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3706.55,-1955.75 3699.18,-1952.79 3703.1,-1959.7 3706.55,-1955.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3983.97,-2032.98 3983.97,-2055.78 4186.86,-2055.78 4186.86,-2032.98 3983.97,-2032.98"/>
<text xml:space="preserve" text-anchor="start" x="3986.97" y="-2040.18" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoría y resultados</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge9" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2087.91,-480.8C2150.17,-480.8 2221.6,-480.8 2284.81,-480.8"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2284.77,-483.43 2292.27,-480.8 2284.77,-478.18 2284.77,-483.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2142.98,-483.8 2142.98,-506.6 2240.02,-506.6 2240.02,-483.8 2142.98,-483.8"/>
<text xml:space="preserve" text-anchor="start" x="2145.98" y="-491" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="860.47,-594.81 860.47,-617.61 1068,-617.61 1068,-594.81 860.47,-594.81"/>
<text xml:space="preserve" text-anchor="start" x="863.47" y="-602.01" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra catálogos y procesos</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1312.31,-561.57 1312.31,-584.37 1515.19,-584.37 1515.19,-561.57 1312.31,-561.57"/>
<text xml:space="preserve" text-anchor="start" x="1315.31" y="-568.77" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoría y resultados</text>
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
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1357.93,-2520.13C1354.03,-2496.71 1350.49,-2471.38 1348.53,-2447.8 1343.03,-2381.64 1349.77,-2307.25 1357.89,-2249.42"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1360.46,-2249.98 1358.93,-2242.18 1355.26,-2249.23 1360.46,-2249.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1348.53,-2425 1348.53,-2447.8 1512.48,-2447.8 1512.48,-2425 1348.53,-2425"/>
<text xml:space="preserve" text-anchor="start" x="1351.53" y="-2432.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvía tráfico al cluster</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge26" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1533.09,-2487.8C1542.9,-2468.42 1546.67,-2447.33 1540.48,-2425 1528.66,-2382.4 1508.28,-2339.78 1485.79,-2301.26"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1488.27,-2300.32 1482.19,-2295.2 1483.76,-2302.99 1488.27,-2300.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1474.22,-2382.71 1474.22,-2405.51 1526.11,-2405.51 1526.11,-2382.71 1474.22,-2382.71"/>
<text xml:space="preserve" text-anchor="start" x="1477.22" y="-2389.91" font-family="Arial" font-size="14.00" fill="#c9c9c9">HTTPS</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1323.69,-1685.18 1323.69,-1707.98 1470.51,-1707.98 1470.51,-1685.18 1323.69,-1685.18"/>
<text xml:space="preserve" text-anchor="start" x="1326.69" y="-1692.38" font-family="Arial" font-size="14.00" fill="#c9c9c9">Balancea tráfico HTTP</text>
</g>
<!-- appservice&#45;&gt;adminconsole_1 -->
<g id="edge25" class="edge">
<title>appservice&#45;&gt;adminconsole_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1320.08,-1748.68C1297.88,-1713.11 1271.53,-1670.9 1245.94,-1629.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1248.3,-1628.74 1242.1,-1623.76 1243.84,-1631.52 1248.3,-1628.74"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1133.61,-1685.18 1133.61,-1707.98 1280.44,-1707.98 1280.44,-1685.18 1133.61,-1685.18"/>
<text xml:space="preserve" text-anchor="start" x="1136.61" y="-1692.38" font-family="Arial" font-size="14.00" fill="#c9c9c9">Balancea tráfico HTTP</text>
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
<text xml:space="preserve" text-anchor="start" x="774.92" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- sourcedefinitionresource -->
<g id="node3" class="node">
<title>sourcedefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1650.88,-180 1330.84,-180 1330.84,0 1650.88,0 1650.88,-180"/>
<text xml:space="preserve" text-anchor="start" x="1374.68" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceDefinitionResource</text>
</g>
<!-- processcatalogservice -->
<g id="node4" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2277.02,-180 1956.98,-180 1956.98,0 2277.02,0 2277.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="2013.06" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- persistencelayer -->
<g id="node5" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2912.47,-180 2592.43,-180 2592.43,0 2912.47,0 2912.47,-180"/>
<text xml:space="preserve" text-anchor="start" x="2630.16" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3544.05,-180 3224.01,-180 3224.01,0 3544.05,0 3544.05,-180"/>
<text xml:space="preserve" text-anchor="start" x="3329.56" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge1" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.74,-90C428.54,-90 572.7,-90 683.67,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="683.44,-92.63 690.94,-90 683.44,-87.38 683.44,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-93 383.04,-125.8 407.04,-125.8 407.04,-93 383.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-93 410.04,-125.8 630.83,-125.8 630.83,-93 410.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Define tipo de fuente y parámetros</text>
</g>
<!-- processdesigner&#45;&gt;sourcedefinitionresource -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;sourcedefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1013.86,-90C1107.34,-90 1225.49,-90 1320.69,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1320.47,-92.63 1327.97,-90 1320.47,-87.38 1320.47,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1076.87,-93 1076.87,-125.8 1100.87,-125.8 1100.87,-93 1076.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1084.97" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1103.87,-93 1103.87,-125.8 1267.84,-125.8 1267.84,-93 1103.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1106.87" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra source definition</text>
</g>
<!-- sourcedefinitionresource&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>sourcedefinitionresource&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1650.57,-90C1741.16,-90 1854.71,-90 1946.97,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1946.72,-92.63 1954.22,-90 1946.72,-87.38 1946.72,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1713.88,-93 1713.88,-125.8 1737.88,-125.8 1737.88,-93 1713.88,-93"/>
<text xml:space="preserve" text-anchor="start" x="1721.98" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1740.88,-93 1740.88,-125.8 1893.98,-125.8 1893.98,-93 1740.88,-93"/>
<text xml:space="preserve" text-anchor="start" x="1743.88" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega alta de catálogo</text>
</g>
<!-- processcatalogservice&#45;&gt;persistencelayer -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2276.62,-90C2369.7,-90 2487.29,-90 2582.16,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2581.91,-92.63 2589.41,-90 2581.91,-87.38 2581.91,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2340.02,-93 2340.02,-125.8 2364.02,-125.8 2364.02,-93 2340.02,-93"/>
<text xml:space="preserve" text-anchor="start" x="2348.13" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2367.02,-93 2367.02,-125.8 2529.43,-125.8 2529.43,-93 2367.02,-93"/>
<text xml:space="preserve" text-anchor="start" x="2370.02" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste source definition</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge5" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2912.32,-90C3004.31,-90 3120.07,-90 3213.77,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3213.68,-92.63 3221.18,-90 3213.68,-87.38 3213.68,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2975.47,-93 2975.47,-125.8 2999.47,-125.8 2999.47,-93 2975.47,-93"/>
<text xml:space="preserve" text-anchor="start" x="2983.58" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3002.47,-93 3002.47,-125.8 3161.01,-125.8 3161.01,-93 3002.47,-93"/>
<text xml:space="preserve" text-anchor="start" x="3005.47" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda source definition</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2204.64,-180 1884.6,-180 1884.6,0 2204.64,0 2204.64,-180"/>
<text xml:space="preserve" text-anchor="start" x="1940.68" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- persistencelayer -->
<g id="node5" class="node">
<title>persistencelayer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2838.54,-180 2518.5,-180 2518.5,0 2838.54,0 2838.54,-180"/>
<text xml:space="preserve" text-anchor="start" x="2556.23" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3468.57,-180 3148.53,-180 3148.53,0 3468.57,0 3468.57,-180"/>
<text xml:space="preserve" text-anchor="start" x="3254.07" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
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
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1874.34,-92.63 1881.84,-90 1874.34,-87.38 1874.34,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1641.5,-93 1641.5,-125.8 1665.5,-125.8 1665.5,-93 1641.5,-93"/>
<text xml:space="preserve" text-anchor="start" x="1649.6" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1668.5,-93 1668.5,-125.8 1821.6,-125.8 1821.6,-93 1668.5,-93"/>
<text xml:space="preserve" text-anchor="start" x="1671.5" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega alta de catálogo</text>
</g>
<!-- processcatalogservice&#45;&gt;persistencelayer -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;persistencelayer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2204.26,-90C2296.85,-90 2413.63,-90 2508.02,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2508.02,-92.63 2515.52,-90 2508.02,-87.38 2508.02,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2267.64,-93 2267.64,-125.8 2291.64,-125.8 2291.64,-93 2267.64,-93"/>
<text xml:space="preserve" text-anchor="start" x="2275.75" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2294.64,-93 2294.64,-125.8 2455.5,-125.8 2455.5,-93 2294.64,-93"/>
<text xml:space="preserve" text-anchor="start" x="2297.64" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste reader definition</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge5" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2838.4,-90C2930,-90 3045.1,-90 3138.38,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3138.25,-92.63 3145.75,-90 3138.25,-87.38 3138.25,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2901.54,-93 2901.54,-125.8 2925.54,-125.8 2925.54,-93 2901.54,-93"/>
<text xml:space="preserve" text-anchor="start" x="2909.65" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2928.54,-93 2928.54,-125.8 3085.53,-125.8 3085.53,-93 2928.54,-93"/>
<text xml:space="preserve" text-anchor="start" x="2931.54" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda reader definition</text>
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
<text xml:space="preserve" text-anchor="start" x="2555.42" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Panache Persistence Layer</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3523.77,-180 3203.73,-180 3203.73,0 3523.77,0 3523.77,-180"/>
<text xml:space="preserve" text-anchor="start" x="3309.27" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
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
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2244.74,-90C2325.92,-90 2424.78,-90 2507.43,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2507.41,-92.63 2514.91,-90 2507.41,-87.38 2507.41,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2308.09,-93 2308.09,-125.8 2332.09,-125.8 2332.09,-93 2308.09,-93"/>
<text xml:space="preserve" text-anchor="start" x="2316.2" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2335.09,-93 2335.09,-125.8 2454.7,-125.8 2454.7,-93 2335.09,-93"/>
<text xml:space="preserve" text-anchor="start" x="2338.09" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definición</text>
</g>
<!-- persistencelayer&#45;&gt;db -->
<g id="edge5" class="edge">
<title>persistencelayer&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2837.37,-90C2944.04,-90 3084.49,-90 3193.34,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3193.25,-92.63 3200.75,-90 3193.25,-87.38 3193.25,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2900.74,-93 2900.74,-125.8 2924.74,-125.8 2924.74,-93 2900.74,-93"/>
<text xml:space="preserve" text-anchor="start" x="2908.84" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
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
<polygon fill="#194b9e" stroke="#1b3d88" points="2372.66,-8 2372.66,-1159 2772.7,-1159 2772.7,-8 2372.66,-8"/>
<text xml:space="preserve" text-anchor="start" x="2380.66" y="-1146.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">PROCESS ENGINE</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1548.93,-373 1228.89,-373 1228.89,-193 1548.93,-193 1548.93,-373"/>
<text xml:space="preserve" text-anchor="start" x="1266.08" y="-277" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionResource</text>
</g>
<!-- processexecutionservice -->
<g id="node4" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2135.37,-373 1815.33,-373 1815.33,-193 2135.37,-193 2135.37,-373"/>
<text xml:space="preserve" text-anchor="start" x="1861.97" y="-277" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node5" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.7,-518 2412.66,-518 2412.66,-338 2732.7,-338 2732.7,-518"/>
<text xml:space="preserve" text-anchor="start" x="2477.66" y="-422" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- restcalltaskprovider -->
<g id="node6" class="node">
<title>restcalltaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.7,-228 2412.66,-228 2412.66,-48 2732.7,-48 2732.7,-228"/>
<text xml:space="preserve" text-anchor="start" x="2475.99" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">RestCallTaskProvider</text>
</g>
<!-- db -->
<g id="node7" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3368.18,-518 3048.14,-518 3048.14,-338 3368.18,-338 3368.18,-518"/>
<text xml:space="preserve" text-anchor="start" x="3153.69" y="-422" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node8" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3368.18,-228 3048.14,-228 3048.14,-48 3368.18,-48 3368.18,-228"/>
<text xml:space="preserve" text-anchor="start" x="3145.91" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- sourceregistry -->
<g id="node9" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.7,-808 2412.66,-808 2412.66,-628 2732.7,-628 2732.7,-808"/>
<text xml:space="preserve" text-anchor="start" x="2461.53" y="-712" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node10" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2732.7,-1098 2412.66,-1098 2412.66,-918 2732.7,-918 2732.7,-1098"/>
<text xml:space="preserve" text-anchor="start" x="2460.42" y="-1002" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
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
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1051.73,-286 1051.73,-318.8 1165.89,-318.8 1165.89,-286 1051.73,-286"/>
<text xml:space="preserve" text-anchor="start" x="1054.73" y="-298.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Solicita ejecución</text>
</g>
<!-- processexecutionresource&#45;&gt;processexecutionservice -->
<g id="edge3" class="edge">
<title>processexecutionresource&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1548.84,-283C1628.26,-283 1724.39,-283 1805.18,-283"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1804.93,-285.63 1812.43,-283 1804.93,-280.38 1804.93,-285.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1611.93,-286 1611.93,-318.8 1635.93,-318.8 1635.93,-286 1611.93,-286"/>
<text xml:space="preserve" text-anchor="start" x="1620.04" y="-299.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1638.93,-286 1638.93,-318.8 1752.33,-318.8 1752.33,-286 1638.93,-286"/>
<text xml:space="preserve" text-anchor="start" x="1641.93" y="-298.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Delega ejecución</text>
</g>
<!-- processexecutionservice&#45;&gt;dbwritetaskprovider -->
<g id="edge4" class="edge">
<title>processexecutionservice&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2135.11,-321.67C2217.69,-341.78 2318.66,-366.37 2402.69,-386.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2402,-389.37 2409.91,-388.6 2403.24,-384.27 2402,-389.37"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2203.44,-375.75 2203.44,-408.55 2227.44,-408.55 2227.44,-375.75 2203.44,-375.75"/>
<text xml:space="preserve" text-anchor="start" x="2211.55" y="-388.95" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2230.44,-375.75 2230.44,-408.55 2344.59,-408.55 2344.59,-375.75 2230.44,-375.75"/>
<text xml:space="preserve" text-anchor="start" x="2233.44" y="-387.95" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste registros</text>
</g>
<!-- processexecutionservice&#45;&gt;restcalltaskprovider -->
<g id="edge6" class="edge">
<title>processexecutionservice&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2135.11,-244.33C2217.69,-224.22 2318.66,-199.63 2402.69,-179.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2403.24,-181.73 2409.91,-177.4 2402,-176.63 2403.24,-181.73"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2198.37,-230.75 2198.37,-263.55 2222.37,-263.55 2222.37,-230.75 2198.37,-230.75"/>
<text xml:space="preserve" text-anchor="start" x="2206.48" y="-243.95" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2225.37,-230.75 2225.37,-263.55 2349.66,-263.55 2349.66,-230.75 2225.37,-230.75"/>
<text xml:space="preserve" text-anchor="start" x="2228.37" y="-242.95" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca API externa</text>
</g>
<!-- dbwritetaskprovider&#45;&gt;db -->
<g id="edge5" class="edge">
<title>dbwritetaskprovider&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2732.31,-428C2825.48,-428 2943.21,-428 3038.13,-428"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3037.88,-430.63 3045.38,-428 3037.88,-425.38 3037.88,-430.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2795.7,-431 2795.7,-463.8 2819.7,-463.8 2819.7,-431 2795.7,-431"/>
<text xml:space="preserve" text-anchor="start" x="2803.81" y="-444.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2822.7,-431 2822.7,-463.8 2985.14,-463.8 2985.14,-431 2822.7,-431"/>
<text xml:space="preserve" text-anchor="start" x="2825.7" y="-443.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda staging o destino</text>
</g>
<!-- restcalltaskprovider&#45;&gt;externalapi -->
<g id="edge7" class="edge">
<title>restcalltaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2732.31,-138C2825.48,-138 2943.21,-138 3038.13,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3037.88,-140.63 3045.38,-138 3037.88,-135.38 3037.88,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2827.61,-141 2827.61,-173.8 2851.61,-173.8 2851.61,-141 2827.61,-141"/>
<text xml:space="preserve" text-anchor="start" x="2835.72" y="-154.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">7</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2854.61,-141 2854.61,-173.8 2953.23,-173.8 2953.23,-141 2854.61,-141"/>
<text xml:space="preserve" text-anchor="start" x="2857.61" y="-153.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Envía payload</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1560.62,-180 1240.58,-180 1240.58,0 1560.62,0 1560.62,-180"/>
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
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="1560.62,-470 1240.58,-470 1240.58,-290 1560.62,-290 1560.62,-470"/>
<text xml:space="preserve" text-anchor="start" x="1289.45" y="-374" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node8" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2168.83,-470 1848.79,-470 1848.79,-290 2168.83,-290 2168.83,-470"/>
<text xml:space="preserve" text-anchor="start" x="1978.24" y="-374" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
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
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.15,-90C1057.9,-90 1151.55,-90 1230.63,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1230.16,-92.63 1237.66,-90 1230.16,-87.38 1230.16,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1043.4,-93 1043.4,-125.8 1067.4,-125.8 1067.4,-93 1043.4,-93"/>
<text xml:space="preserve" text-anchor="start" x="1051.51" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1070.4,-93 1070.4,-125.8 1177.58,-125.8 1177.58,-93 1070.4,-93"/>
<text xml:space="preserve" text-anchor="start" x="1073.4" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lanza ejecución</text>
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
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.15,-380C1057.9,-380 1151.55,-380 1230.63,-380"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1230.16,-382.63 1237.66,-380 1230.16,-377.38 1230.16,-382.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1048.86,-383 1048.86,-415.8 1072.86,-415.8 1072.86,-383 1048.86,-383"/>
<text xml:space="preserve" text-anchor="start" x="1056.97" y="-396.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1075.86,-383 1075.86,-415.8 1172.12,-415.8 1172.12,-383 1075.86,-383"/>
<text xml:space="preserve" text-anchor="start" x="1078.86" y="-395.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge6" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1560.48,-380C1645.94,-380 1751.34,-380 1838.36,-380"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1838.35,-382.63 1845.85,-380 1838.35,-377.38 1838.35,-382.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1623.62,-383 1623.62,-415.8 1647.62,-415.8 1647.62,-383 1623.62,-383"/>
<text xml:space="preserve" text-anchor="start" x="1631.73" y="-396.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1650.62,-383 1650.62,-415.8 1785.79,-415.8 1785.79,-383 1650.62,-383"/>
<text xml:space="preserve" text-anchor="start" x="1653.62" y="-395.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica visualización</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1611.14,-419 1291.1,-419 1291.1,-239 1611.14,-239 1611.14,-419"/>
<text xml:space="preserve" text-anchor="start" x="1397.77" y="-323" font-family="Arial" font-size="20.00" fill="#eff6ff">OIDC Client</text>
</g>
<!-- processdefinitionresource -->
<g id="node4" class="node">
<title>processdefinitionresource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2234.15,-265 1914.11,-265 1914.11,-85 2234.15,-85 2234.15,-265"/>
<text xml:space="preserve" text-anchor="start" x="1953.52" y="-169" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessDefinitionResource</text>
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
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.93,-258.84C492.57,-273.49 776.54,-296.45 1021.69,-311 1106.95,-316.06 1201.83,-320.2 1280.59,-323.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1280.48,-325.85 1288.08,-323.51 1280.68,-320.6 1280.48,-325.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="709.68,-310.03 709.68,-342.83 733.68,-342.83 733.68,-310.03 709.68,-310.03"/>
<text xml:space="preserve" text-anchor="start" x="717.79" y="-323.23" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="736.68,-310.03 736.68,-342.83 893.67,-342.83 893.67,-310.03 736.68,-310.03"/>
<text xml:space="preserve" text-anchor="start" x="739.68" y="-322.23" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida acceso a consola</text>
</g>
<!-- iam&#45;&gt;oidcclient -->
<g id="edge3" class="edge">
<title>iam&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M971.26,-152.23C1070.1,-188.72 1194.22,-234.54 1291.33,-270.38"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="972.26,-149.8 964.31,-149.67 970.44,-154.73 972.26,-149.8"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1024.69,-247.87 1024.69,-280.67 1048.69,-280.67 1048.69,-247.87 1024.69,-247.87"/>
<text xml:space="preserve" text-anchor="start" x="1032.8" y="-261.07" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1051.69,-247.87 1051.69,-280.67 1228.1,-280.67 1228.1,-247.87 1051.69,-247.87"/>
<text xml:space="preserve" text-anchor="start" x="1054.69" y="-260.07" font-family="Arial" font-size="14.00" fill="#c9c9c9">Solicita autenticación OIDC</text>
</g>
<!-- iam&#45;&gt;processdefinitionresource -->
<g id="edge5" class="edge">
<title>iam&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M971.79,-101.31C1218.5,-117.82 1673.83,-148.28 1914.48,-164.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="972.33,-98.72 964.67,-100.84 971.98,-103.96 972.33,-98.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1370.03,-146.71 1370.03,-179.51 1394.03,-179.51 1394.03,-146.71 1370.03,-146.71"/>
<text xml:space="preserve" text-anchor="start" x="1378.14" y="-159.91" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1397.03,-146.71 1397.03,-179.51 1532.21,-179.51 1532.21,-146.71 1397.03,-146.71"/>
<text xml:space="preserve" text-anchor="start" x="1400.03" y="-158.91" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida tokens y roles</text>
</g>
<!-- oidcclient&#45;&gt;processdefinitionresource -->
<g id="edge4" class="edge">
<title>oidcclient&#45;&gt;processdefinitionresource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1610.84,-289.64C1700.55,-267.39 1812.68,-239.59 1904.04,-216.93"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1904.64,-219.49 1911.29,-215.13 1903.38,-214.39 1904.64,-219.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1674.14,-273.32 1674.14,-306.12 1698.14,-306.12 1698.14,-273.32 1674.14,-273.32"/>
<text xml:space="preserve" text-anchor="start" x="1682.25" y="-286.52" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1701.14,-273.32 1701.14,-306.12 1851.11,-306.12 1851.11,-273.32 1701.14,-273.32"/>
<text xml:space="preserve" text-anchor="start" x="1704.14" y="-285.52" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
</g>
</svg>
`;default:throw new Error("Unknown viewId: "+e)}}export{n as dotSource,t as svgSource};
