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
    vault [height=2.5,
        label=<<FONT POINT-SIZE="20">Secrets / Vault corporativo</FONT>>,
        likec4_id=vault,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    platformadmin -> vault [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-10</FONT></TD></TR></TABLE>>,
        likec4_id=l12uhs,
        style=dashed];
    iam [height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    platformadmin -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-09</FONT></TD></TR></TABLE>>,
        likec4_id="14wz0sf",
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-01, UC-02, UC-03</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-04, UC-06, UC-08</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-06, UC-07</FONT></TD></TR></TABLE>>,
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
    infrateam -> loadbalancer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-10</FONT></TD></TR></TABLE>>,
        likec4_id="1eu1w53",
        style=dashed];
    sharedstorage [height=2.5,
        label=<<FONT POINT-SIZE="20">Shared File Storage</FONT>>,
        likec4_id=sharedStorage,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    infrateam -> sharedstorage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-10</FONT></TD></TR></TABLE>>,
        likec4_id=fng3it,
        style=dashed];
    ingresscontroller [height=2.5,
        label=<<FONT POINT-SIZE="20">Ingress Controller</FONT>>,
        likec4_id=ingressController,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    infrateam -> ingresscontroller [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-10</FONT></TD></TR></TABLE>>,
        likec4_id="9e4b66",
        style=dashed];
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
    vault -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>,
        likec4_id=pf815d,
        style=dashed];
    loadbalancer -> ingresscontroller [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reenvia trafico al cluster</FONT></TD></TR></TABLE>>,
        likec4_id="1c6jo3",
        style=dashed];
    sharedstorage -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>,
        likec4_id=zzshdn,
        style=dashed];
    ingresscontroller -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>,
        likec4_id="1x6laww",
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
            label=<<FONT POINT-SIZE="20">Admin Console</FONT>>,
            likec4_id="integrationHub.adminConsole",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        quarkusapp [color="#2d5d39",
            fillcolor="#428a4f",
            fontcolor="#f8fafc",
            height=2.5,
            label=<<FONT POINT-SIZE="20">Quarkus Native App</FONT>>,
            likec4_id="integrationHub.quarkusApp",
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-01, UC-02, UC-03</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-04, UC-06, UC-08</FONT></TD></TR></TABLE>>,
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-06, UC-07</FONT></TD></TR></TABLE>>,
        likec4_id="17jgu5p",
        minlen=1,
        style=dashed];
    scheduleractor [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Scheduler</FONT>>,
        likec4_id=schedulerActor,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    scheduleractor -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-05</FONT></TD></TR></TABLE>>,
        likec4_id=yy34ki,
        minlen=1,
        style=dashed];
    ingresscontroller [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Ingress Controller</FONT>>,
        likec4_id=ingressController,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    ingresscontroller -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>,
        likec4_id="3x5xy",
        style=dashed];
    ingresscontroller -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>,
        likec4_id="12kszv9",
        style=dashed];
    vault [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Secrets / Vault corporativo</FONT>>,
        likec4_id=vault,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    vault -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>,
        likec4_id=jya4tg,
        minlen=1,
        style=dashed];
    sharedstorage [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Shared File Storage</FONT>>,
        likec4_id=sharedStorage,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sharedstorage -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>,
        likec4_id=u8iy4u,
        minlen=1,
        style=dashed];
    adminconsole -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Invoca APIs protegidas</FONT></TD></TR></TABLE>>,
        likec4_id="1a10361",
        minlen=0,
        style=dashed,
        weight=2];
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
        style=dashed];
    quarkusapp -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>,
        likec4_id="2rsnuj",
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
    quarkusapp -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste configuracion, jobs, auditoria<BR/>y staging</FONT></TD></TR></TABLE>>,
        likec4_id=u7uyew,
        minlen=1,
        style=dashed];
    filesources [height=2.5,
        label=<<FONT POINT-SIZE="20">Fuentes externas</FONT>>,
        likec4_id=fileSources,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> filesources [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1v0ckl2",
        minlen=1,
        style=dashed];
    observability [height=2.5,
        label=<<FONT POINT-SIZE="20">Observabilidad</FONT>>,
        likec4_id=observability,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> observability [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>,
        likec4_id="1882dk3",
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
    user [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    loadbalancer [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Load Balancer / Reverse Proxy</FONT>>,
        likec4_id=loadBalancer,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> loadbalancer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Accede por HTTPS</FONT></TD></TR></TABLE>>,
        likec4_id=nym6ix,
        style=dashed,
        weight=2];
    adminconsole [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Admin Console</FONT>>,
        likec4_id="integrationHub.adminConsole",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta estado y resultados</FONT></TD></TR></TABLE>>,
        likec4_id=h9yk6k,
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
        style=dashed,
        weight=2];
    admin -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura fuentes, readers y procesos</FONT></TD></TR></TABLE>>,
        likec4_id=r57alu,
        style=dashed];
    vault [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Secrets / Vault corporativo</FONT>>,
        likec4_id=vault,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Quarkus Native App</FONT>>,
        likec4_id="integrationHub.quarkusApp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    vault -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>,
        likec4_id=jya4tg,
        minlen=1,
        style=dashed,
        weight=2];
    sharedstorage [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Shared File Storage</FONT>>,
        likec4_id=sharedStorage,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sharedstorage -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>,
        likec4_id=u8iy4u,
        minlen=1,
        style=dashed,
        weight=2];
    ingresscontroller [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Ingress Controller</FONT>>,
        likec4_id=ingressController,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    loadbalancer -> ingresscontroller [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reenvia trafico al cluster</FONT></TD></TR></TABLE>>,
        likec4_id="1c6jo3",
        style=dashed,
        weight=2];
    ingresscontroller -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>,
        likec4_id="3x5xy",
        style=dashed];
    ingresscontroller -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>,
        likec4_id="12kszv9",
        style=dashed,
        weight=2];
    adminconsole -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Invoca APIs protegidas</FONT></TD></TR></TABLE>>,
        likec4_id="1a10361",
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
    filesystem [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">File System</FONT>>,
        likec4_id="fileSources.filesystem",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> filesystem [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee archivos locales</FONT></TD></TR></TABLE>>,
        likec4_id=wqaa63,
        minlen=1,
        style=dashed];
    ftp [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">FTP</FONT>>,
        likec4_id="fileSources.ftp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> ftp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Descarga archivos</FONT></TD></TR></TABLE>>,
        likec4_id="149d2yi",
        minlen=1,
        style=dashed];
    sftp [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">SFTP</FONT>>,
        likec4_id="fileSources.sftp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> sftp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Descarga archivos</FONT></TD></TR></TABLE>>,
        likec4_id="1e0p695",
        minlen=1,
        style=dashed];
    restsource [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">REST Source</FONT>>,
        likec4_id="fileSources.restSource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> restsource [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Obtiene payloads remotos</FONT></TD></TR></TABLE>>,
        likec4_id="1khipf9",
        minlen=1,
        style=dashed];
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
        minlen=1,
        style=dashed,
        weight=3];
}
`;case"components":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=components,
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
    adminapi [height=2.5,
        label=<<FONT POINT-SIZE="20">Admin API</FONT>>,
        likec4_id="integrationHub.quarkusApp.adminApi",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine [height=2.5,
        label=<<FONT POINT-SIZE="20">Process Engine</FONT>>,
        likec4_id="integrationHub.quarkusApp.processEngine",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    adminapi -> processengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Configura definiciones</FONT></TD></TR></TABLE>>,
        likec4_id="11y4jw8",
        minlen=1,
        style=dashed,
        weight=3];
    executionapi [height=2.5,
        label=<<FONT POINT-SIZE="20">Execution API</FONT>>,
        likec4_id="integrationHub.quarkusApp.executionApi",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    executionapi -> processengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Inicia ejecuciones</FONT></TD></TR></TABLE>>,
        likec4_id="7vniqt",
        minlen=1,
        style=dashed,
        weight=3];
    queryapi [height=2.5,
        label=<<FONT POINT-SIZE="20">Query API</FONT>>,
        likec4_id="integrationHub.quarkusApp.queryApi",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditservice [height=2.5,
        label=<<FONT POINT-SIZE="20">Audit Service</FONT>>,
        likec4_id="integrationHub.quarkusApp.auditService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    queryapi -> auditservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta eventos</FONT></TD></TR></TABLE>>,
        likec4_id="1ed7n48",
        minlen=1,
        style=dashed];
    scheduler [height=2.5,
        label=<<FONT POINT-SIZE="20">Scheduler</FONT>>,
        likec4_id="integrationHub.quarkusApp.scheduler",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    scheduler -> processengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Dispara procesos programados</FONT></TD></TR></TABLE>>,
        likec4_id="1w585h4",
        minlen=1,
        style=dashed,
        weight=3];
    sourceregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Source Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.sourceRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> sourceregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve fuente</FONT></TD></TR></TABLE>>,
        likec4_id="14xch3",
        style=dashed,
        weight=3];
    readerregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Reader Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.readerRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> readerregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve reader</FONT></TD></TR></TABLE>>,
        likec4_id="11hsean",
        style=dashed,
        weight=3];
    taskregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Task Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> taskregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve tarea</FONT></TD></TR></TABLE>>,
        likec4_id=jjpw1j,
        style=dashed,
        weight=3];
    processengine -> auditservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>,
        likec4_id=s1rji7,
        style=dashed,
        weight=3];
    telemetry [height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>,
        likec4_id="integrationHub.quarkusApp.telemetry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> telemetry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Crea spans</FONT></TD></TR></TABLE>>,
        likec4_id=bq8fnk,
        minlen=1,
        style=dashed,
        weight=3];
    taskproviders [height=2.5,
        label=<<FONT POINT-SIZE="20">Task Providers</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskProviders",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> taskproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1jkpg40",
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
    processengine -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste definiciones y tasks</FONT></TD></TR></TABLE>>,
        likec4_id="17os38z",
        style=dashed];
    sourceproviders [height=2.5,
        label=<<FONT POINT-SIZE="20">Source Providers</FONT>>,
        likec4_id="integrationHub.quarkusApp.sourceProviders",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sourceregistry -> sourceproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id="93grpp",
        minlen=1,
        style=dashed];
    readerproviders [height=2.5,
        label=<<FONT POINT-SIZE="20">Reader Providers</FONT>>,
        likec4_id="integrationHub.quarkusApp.readerProviders",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    readerregistry -> readerproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id=xvhl3h,
        minlen=1,
        style=dashed];
    taskregistry -> taskproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id="1p5uurx",
        style=dashed,
        weight=3];
    taskproviders -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert, update y upsert</FONT></TD></TR></TABLE>>,
        likec4_id="1uhkw15",
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    taskproviders -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1iimluy",
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
    filesystem [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">File System</FONT>>,
        likec4_id="fileSources.filesystem",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    iam -> filesystem [style=invis];
    ftp [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">FTP</FONT>>,
        likec4_id="fileSources.ftp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    filesystem -> ftp [style=invis];
    sftp [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">SFTP</FONT>>,
        likec4_id="fileSources.sftp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    ftp -> sftp [style=invis];
    restsource [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">REST Source</FONT>>,
        likec4_id="fileSources.restSource",
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
    restsource -> otel [style=invis];
}
`;case"engine":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=engine,
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
    processexecutionservice [height=2.5,
        label=<<FONT POINT-SIZE="20">ProcessExecutionService</FONT>>,
        likec4_id="integrationHub.quarkusApp.processEngine.processExecutionService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    jsonconfigurationmapper [height=2.5,
        label=<<FONT POINT-SIZE="20">JsonConfigurationMapper</FONT>>,
        likec4_id="integrationHub.quarkusApp.processEngine.jsonConfigurationMapper",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> jsonconfigurationmapper [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee configuracion JSON</FONT></TD></TR></TABLE>>,
        likec4_id=d80p7h,
        minlen=1,
        style=dashed,
        weight=3];
    sourceregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Source Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.sourceRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> sourceregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve SourceProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1dkvuwd",
        minlen=1,
        style=dashed,
        weight=2];
    readerregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Reader Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.readerRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> readerregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve ReaderProvider</FONT></TD></TR></TABLE>>,
        likec4_id=ws3xqt,
        minlen=1,
        style=dashed,
        weight=2];
    taskregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Task Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> taskregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve TaskProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1fyk7gd",
        minlen=1,
        style=dashed,
        weight=2];
    dbwritetaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">DbWriteTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskProviders.dbWriteTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> dbwritetaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta DB_WRITE</FONT></TD></TR></TABLE>>,
        likec4_id="1c7wn1f",
        style=dashed,
        weight=2];
    restcalltaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">RestCallTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskProviders.restCallTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> restcalltaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta REST_CALL</FONT></TD></TR></TABLE>>,
        likec4_id="1kqix1m",
        style=dashed,
        weight=2];
    notificationtaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">NotificationTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskProviders.notificationTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> notificationtaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta NOTIFICATION</FONT></TD></TR></TABLE>>,
        likec4_id="1qft1bp",
        style=dashed,
        weight=2];
    processcatalogservice [height=2.5,
        label=<<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>,
        likec4_id="integrationHub.quarkusApp.processEngine.processCatalogService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    db [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processcatalogservice -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste definiciones y tasks</FONT></TD></TR></TABLE>>,
        likec4_id="188x108",
        minlen=1,
        style=dashed];
    dbwritetaskprovider -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert, update y upsert</FONT></TD></TR></TABLE>>,
        likec4_id="13wv8z4",
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    restcalltaskprovider -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Envia payloads</FONT></TD></TR></TABLE>>,
        likec4_id=gf957e,
        style=dashed];
    notificationtaskprovider -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Webhook y notificaciones</FONT></TD></TR></TABLE>>,
        likec4_id="347rad",
        style=dashed];
    auditservice [height=2.5,
        label=<<FONT POINT-SIZE="20">Audit Service</FONT>>,
        likec4_id="integrationHub.quarkusApp.auditService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    telemetry [height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>,
        likec4_id="integrationHub.quarkusApp.telemetry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditservice -> telemetry [style=invis];
}
`;case"security":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=security,
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
    subgraph cluster_adminconsole {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>ADMIN CONSOLE</B></FONT>>,
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
    subgraph cluster_quarkusapp {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>QUARKUS NATIVE APP</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.quarkusApp",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        adminapi [height=2.5,
            label=<<FONT POINT-SIZE="20">Admin API</FONT>>,
            likec4_id="integrationHub.quarkusApp.adminApi",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        executionapi [height=2.5,
            label=<<FONT POINT-SIZE="20">Execution API</FONT>>,
            likec4_id="integrationHub.quarkusApp.executionApi",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        queryapi [height=2.5,
            label=<<FONT POINT-SIZE="20">Query API</FONT>>,
            likec4_id="integrationHub.quarkusApp.queryApi",
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
    loadbalancer [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Load Balancer / Reverse Proxy</FONT>>,
        likec4_id=loadBalancer,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> loadbalancer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Accede por HTTPS</FONT></TD></TR></TABLE>>,
        likec4_id=nym6ix,
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
    admin -> loadbalancer [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Administra por HTTPS</FONT></TD></TR></TABLE>>,
        likec4_id="14x0ujb",
        minlen=1,
        style=dashed];
    ingresscontroller [color="#525252",
        fillcolor="#737373",
        fontcolor="#fafafa",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Ingress Controller</FONT>>,
        likec4_id=ingressController,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    loadbalancer -> ingresscontroller [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reenvia trafico al cluster</FONT></TD></TR></TABLE>>,
        likec4_id="1c6jo3",
        style=dashed,
        weight=2];
    ingresscontroller -> reactapp [arrowhead=normal,
        lhead=cluster_adminconsole,
        likec4_id="3x5xy",
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>];
    ingresscontroller -> adminapi [arrowhead=normal,
        lhead=cluster_quarkusapp,
        likec4_id="12kszv9",
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>];
    reactapp -> oidcclient [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Gestiona sesion</FONT></TD></TR></TABLE>>,
        likec4_id="1vivoky",
        style=dashed,
        weight=3];
    reactapp -> processdesigner [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Edita pipelines</FONT></TD></TR></TABLE>>,
        likec4_id=phit6s,
        style=dashed,
        weight=3];
    reactapp -> operationsconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones</FONT></TD></TR></TABLE>>,
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
    processdesigner -> adminapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de catalogos y procesos</FONT></TD></TR></TABLE>>,
        likec4_id="1p5joa8",
        style=dashed];
    operationsconsole -> executionapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id="1ilkt9u",
        minlen=1,
        style=dashed];
    operationsconsole -> queryapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta jobs y auditoria</FONT></TD></TR></TABLE>>,
        likec4_id="1aggz9m",
        style=dashed];
    queryapi -> iam [arrowhead=normal,
        likec4_id="2rsnuj",
        ltail=cluster_quarkusapp,
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>];
}
`;case"ingestion":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=ingestion,
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
    subgraph cluster_taskproviders {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>TASK PROVIDERS</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.quarkusApp.taskProviders",
            likec4_level=0,
            margin=32,
            style=filled
        ];
        dbwritetaskprovider [height=2.5,
            label=<<FONT POINT-SIZE="20">DbWriteTaskProvider</FONT>>,
            likec4_id="integrationHub.quarkusApp.taskProviders.dbWriteTaskProvider",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    processengine [height=2.5,
        label=<<FONT POINT-SIZE="20">Process Engine</FONT>>,
        likec4_id="integrationHub.quarkusApp.processEngine",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sourceregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Source Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.sourceRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> sourceregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve fuente</FONT></TD></TR></TABLE>>,
        likec4_id="14xch3",
        style=dashed,
        weight=3];
    readerregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Reader Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.readerRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> readerregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve reader</FONT></TD></TR></TABLE>>,
        likec4_id="11hsean",
        style=dashed,
        weight=3];
    taskregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Task Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> taskregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve tarea</FONT></TD></TR></TABLE>>,
        likec4_id=jjpw1j,
        minlen=1,
        style=dashed,
        weight=3];
    processengine -> dbwritetaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta DB_WRITE</FONT></TD></TR></TABLE>>,
        likec4_id=hz70vd,
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
    processengine -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste definiciones y tasks</FONT></TD></TR></TABLE>>,
        likec4_id="17os38z",
        style=dashed,
        weight=2];
    sourceproviders [height=2.5,
        label=<<FONT POINT-SIZE="20">Source Providers</FONT>>,
        likec4_id="integrationHub.quarkusApp.sourceProviders",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sourceregistry -> sourceproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id="93grpp",
        minlen=1,
        style=dashed];
    readerproviders [height=2.5,
        label=<<FONT POINT-SIZE="20">Reader Providers</FONT>>,
        likec4_id="integrationHub.quarkusApp.readerProviders",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    readerregistry -> readerproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id=xvhl3h,
        minlen=1,
        style=dashed];
    dbwritetaskprovider -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert, update y upsert</FONT></TD></TR></TABLE>>,
        likec4_id="13wv8z4",
        style=dashed];
    filesystem [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">File System</FONT>>,
        likec4_id="fileSources.filesystem",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    ftp [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">FTP</FONT>>,
        likec4_id="fileSources.ftp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    filesystem -> ftp [style=invis];
    sftp [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">SFTP</FONT>>,
        likec4_id="fileSources.sftp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    ftp -> sftp [style=invis];
    restsource [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">REST Source</FONT>>,
        likec4_id="fileSources.restSource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sftp -> restsource [style=invis];
}
`;case"observability":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=observability,
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
    subgraph cluster_adminconsole {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>ADMIN CONSOLE</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.adminConsole",
            likec4_level=0,
            margin=32,
            style=filled
        ];
        operationsconsole [height=2.5,
            label=<<FONT POINT-SIZE="20">Operations Console</FONT>>,
            likec4_id="integrationHub.adminConsole.operationsConsole",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    subgraph cluster_quarkusapp {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>QUARKUS NATIVE APP</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.quarkusApp",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        queryapi [height=2.5,
            label=<<FONT POINT-SIZE="20">Query API</FONT>>,
            likec4_id="integrationHub.quarkusApp.queryApi",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        telemetry [height=2.5,
            label=<<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>,
            likec4_id="integrationHub.quarkusApp.telemetry",
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
    operationsconsole -> queryapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta jobs y auditoria</FONT></TD></TR></TABLE>>,
        likec4_id="1aggz9m",
        minlen=1,
        style=dashed];
    queryapi -> auditservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta eventos</FONT></TD></TR></TABLE>>,
        likec4_id="1ed7n48",
        minlen=0,
        style=dashed,
        weight=3];
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
    db [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    auditservice -> otel [arrowhead=normal,
        likec4_id=ri53sv,
        ltail=cluster_quarkusapp,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>];
    auditservice -> db [arrowhead=normal,
        likec4_id=u7uyew,
        ltail=cluster_quarkusapp,
        minlen=1,
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste configuracion, jobs, auditoria<BR/>y staging</FONT></TD></TR></TABLE>>];
}
`;case"runtime":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=runtime,
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
    subgraph cluster_processengine {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>PROCESS ENGINE</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.quarkusApp.processEngine",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        processexecutionservice [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessExecutionService</FONT>>,
            likec4_id="integrationHub.quarkusApp.processEngine.processExecutionService",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        processcatalogservice [height=2.5,
            label=<<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>,
            likec4_id="integrationHub.quarkusApp.processEngine.processCatalogService",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        jsonconfigurationmapper [height=2.5,
            label=<<FONT POINT-SIZE="20">JsonConfigurationMapper</FONT>>,
            likec4_id="integrationHub.quarkusApp.processEngine.jsonConfigurationMapper",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    subgraph cluster_taskproviders {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>TASK PROVIDERS</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.quarkusApp.taskProviders",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        dbwritetaskprovider [height=2.5,
            label=<<FONT POINT-SIZE="20">DbWriteTaskProvider</FONT>>,
            likec4_id="integrationHub.quarkusApp.taskProviders.dbWriteTaskProvider",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        restcalltaskprovider [height=2.5,
            label=<<FONT POINT-SIZE="20">RestCallTaskProvider</FONT>>,
            likec4_id="integrationHub.quarkusApp.taskProviders.restCallTaskProvider",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        notificationtaskprovider [height=2.5,
            label=<<FONT POINT-SIZE="20">NotificationTaskProvider</FONT>>,
            likec4_id="integrationHub.quarkusApp.taskProviders.notificationTaskProvider",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    scheduler [height=2.5,
        label=<<FONT POINT-SIZE="20">Scheduler</FONT>>,
        likec4_id="integrationHub.quarkusApp.scheduler",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    scheduler -> processexecutionservice [arrowhead=normal,
        lhead=cluster_processengine,
        likec4_id="1w585h4",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Dispara procesos programados</FONT></TD></TR></TABLE>>];
    executionapi [height=2.5,
        label=<<FONT POINT-SIZE="20">Execution API</FONT>>,
        likec4_id="integrationHub.quarkusApp.executionApi",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    executionapi -> processexecutionservice [arrowhead=normal,
        lhead=cluster_processengine,
        likec4_id="7vniqt",
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Inicia ejecuciones</FONT></TD></TR></TABLE>>];
    processexecutionservice -> jsonconfigurationmapper [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee configuracion JSON</FONT></TD></TR></TABLE>>,
        likec4_id=d80p7h,
        minlen=0,
        style=dashed,
        weight=3];
    taskregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Task Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> taskregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve TaskProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1fyk7gd",
        minlen=1,
        style=dashed,
        weight=2];
    processexecutionservice -> dbwritetaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta DB_WRITE</FONT></TD></TR></TABLE>>,
        likec4_id="1c7wn1f",
        style=dashed,
        weight=2];
    processexecutionservice -> restcalltaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta REST_CALL</FONT></TD></TR></TABLE>>,
        likec4_id="1kqix1m",
        style=dashed,
        weight=2];
    processexecutionservice -> notificationtaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta NOTIFICATION</FONT></TD></TR></TABLE>>,
        likec4_id="1qft1bp",
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
    processcatalogservice -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste definiciones y tasks</FONT></TD></TR></TABLE>>,
        likec4_id="188x108",
        minlen=1,
        style=dashed];
    auditservice [height=2.5,
        label=<<FONT POINT-SIZE="20">Audit Service</FONT>>,
        likec4_id="integrationHub.quarkusApp.auditService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    telemetry [height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry Instrumentation</FONT>>,
        likec4_id="integrationHub.quarkusApp.telemetry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    jsonconfigurationmapper -> auditservice [arrowhead=normal,
        likec4_id=s1rji7,
        ltail=cluster_processengine,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>];
    jsonconfigurationmapper -> telemetry [arrowhead=normal,
        likec4_id=bq8fnk,
        ltail=cluster_processengine,
        minlen=1,
        style=dashed,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Crea spans</FONT></TD></TR></TABLE>>];
    dbwritetaskprovider -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert, update y upsert</FONT></TD></TR></TABLE>>,
        likec4_id="13wv8z4",
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    restcalltaskprovider -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Envia payloads</FONT></TD></TR></TABLE>>,
        likec4_id=gf957e,
        style=dashed];
    notificationtaskprovider -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Webhook y notificaciones</FONT></TD></TR></TABLE>>,
        likec4_id="347rad",
        style=dashed];
}
`;case"access":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=access,
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
    subgraph cluster_adminconsole {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>ADMIN CONSOLE</B></FONT>>,
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
    subgraph cluster_quarkusapp {
        graph [color="#1e3524",
            fillcolor="#2c4e32",
            label=<<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>QUARKUS NATIVE APP</B></FONT>>,
            likec4_depth=1,
            likec4_id="integrationHub.quarkusApp",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        adminapi [height=2.5,
            label=<<FONT POINT-SIZE="20">Admin API</FONT>>,
            likec4_id="integrationHub.quarkusApp.adminApi",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        executionapi [height=2.5,
            label=<<FONT POINT-SIZE="20">Execution API</FONT>>,
            likec4_id="integrationHub.quarkusApp.executionApi",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        queryapi [height=2.5,
            label=<<FONT POINT-SIZE="20">Query API</FONT>>,
            likec4_id="integrationHub.quarkusApp.queryApi",
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
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-01, UC-02, UC-03</FONT></TD></TR></TABLE>>,
        likec4_id=jmm1kc,
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
    operator -> operationsconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-04, UC-06, UC-08</FONT></TD></TR></TABLE>>,
        likec4_id="1ydkwqq",
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
    auditor -> operationsconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-06, UC-07</FONT></TD></TR></TABLE>>,
        likec4_id=f1xb2q,
        minlen=1,
        style=dashed];
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
    reactapp -> oidcclient [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Gestiona sesion</FONT></TD></TR></TABLE>>,
        likec4_id="1vivoky",
        style=dashed,
        weight=3];
    reactapp -> processdesigner [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Edita pipelines</FONT></TD></TR></TABLE>>,
        likec4_id=phit6s,
        style=dashed,
        weight=3];
    reactapp -> operationsconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta ejecuciones</FONT></TD></TR></TABLE>>,
        likec4_id=c9w5tn,
        style=dashed,
        weight=3];
    oidcclient -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Login y refresh token</FONT></TD></TR></TABLE>>,
        likec4_id=ybw1bi,
        style=dashed];
    processdesigner -> adminapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">CRUD de catalogos y procesos</FONT></TD></TR></TABLE>>,
        likec4_id="1p5joa8",
        minlen=1,
        style=dashed];
    operationsconsole -> executionapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta procesos</FONT></TD></TR></TABLE>>,
        likec4_id="1ilkt9u",
        minlen=1,
        style=dashed];
    operationsconsole -> queryapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Consulta jobs y auditoria</FONT></TD></TR></TABLE>>,
        likec4_id="1aggz9m",
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
    label = <<FONT POINT-SIZE="20">Admin Console</FONT>>;
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
    label = <<FONT POINT-SIZE="20">Quarkus Native App</FONT>>;
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
  "adminconsole" [
    likec4_id = "pre.app.preNode1.adminConsole";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Admin Console</FONT>>;
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
    label = <<FONT POINT-SIZE="20">Quarkus Native App</FONT>>;
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
    label = <<FONT POINT-SIZE="20">Secrets / Vault corporativo</FONT>>;
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
    likec4_id = "prod.app.appCluster.prodNode1.adminConsole";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Admin Console</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "adminconsole_1" [
    likec4_id = "prod.app.appCluster.prodNode2.adminConsole";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Admin Console</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "quarkusapp" [
    likec4_id = "prod.app.appCluster.prodNode1.quarkusApp";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Quarkus Native App</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "quarkusapp_1" [
    likec4_id = "prod.app.appCluster.prodNode2.quarkusApp";
    likec4_level = 3;
    label = <<FONT POINT-SIZE="20">Quarkus Native App</FONT>>;
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
      subgraph "cluster_prodnode1" {
        likec4_id = "prod.app.appCluster.prodNode1";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 50;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>PRODNODE1</B></FONT>>;
        "adminconsole";
        "quarkusapp";
      }
      subgraph "cluster_prodnode2" {
        likec4_id = "prod.app.appCluster.prodNode2";
        likec4_level = 2;
        likec4_depth = 1;
        fillcolor = "#2c4e32";
        color = "#1e3524";
        style = "filled";
        margin = 50;
        label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>PRODNODE2</B></FONT>>;
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
    likec4_id = "wzfrnj";
    style = "dashed";
    weight = 7;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole_1" -> "quarkusapp_1" [
    likec4_id = "mor5gf";
    style = "dashed";
    weight = 7;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "ingresscontroller" -> "adminconsole" [
    likec4_id = "176orss";
    style = "dashed";
    weight = 5;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "ingresscontroller" -> "quarkusapp" [
    likec4_id = "1loj62n";
    style = "dashed";
    weight = 5;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "ingresscontroller" -> "adminconsole_1" [
    likec4_id = "1e8kyn";
    style = "dashed";
    weight = 5;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "ingresscontroller" -> "quarkusapp_1" [
    likec4_id = "54gj8c";
    style = "dashed";
    weight = 5;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Enruta trafico HTTP interno</FONT></TD></TR></TABLE>>;
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
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reenvia trafico al cluster</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole" -> "iam" [
    likec4_id = "itq09n";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole" -> "iam_1" [
    likec4_id = "ix4dug";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "db" [
    likec4_id = "1sfwio6";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "db_1" [
    likec4_id = "xotlbe";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "iam" [
    likec4_id = "1mhmg3c";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "iam_1" [
    likec4_id = "1mgyh4r";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp" -> "otel" [
    likec4_id = "kx8mo4";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "vault" -> "quarkusapp" [
    likec4_id = "3vkc1t";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "sharedstorage" -> "quarkusapp" [
    likec4_id = "11m6oob";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole_1" -> "iam" [
    likec4_id = "1wsfnyw";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminconsole_1" -> "iam_1" [
    likec4_id = "1wp1ae3";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "db" [
    likec4_id = "cb5t0l";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "db_1" [
    likec4_id = "1iqdsax";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "iam" [
    likec4_id = "1c1wqj";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "iam_1" [
    likec4_id = "1cpozc";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "quarkusapp_1" -> "otel" [
    likec4_id = "17a0io7";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "vault" -> "quarkusapp_1" [
    likec4_id = "1ysrdk2";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega secretos y credenciales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "sharedstorage" -> "quarkusapp_1" [
    likec4_id = "1k383t4";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Comparte archivos locales</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "ingresscontroller" -> "adminconsole" [
    likec4_id = "7qa0q7";
    style = "dashed";
    lhead = "cluster_prodnode1";
    ltail = "cluster_ingresscontroller";
    weight = 4;
    xlabel = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Rutea trafico UI y API</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "ingresscontroller" -> "adminconsole_1" [
    likec4_id = "7qa0q4";
    style = "dashed";
    lhead = "cluster_prodnode2";
    ltail = "cluster_ingresscontroller";
    weight = 4;
    xlabel = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Rutea trafico UI y API</FONT></TD></TR></TABLE>>;
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
}`;case"usecase_design_execute":return`digraph {
  likec4_viewId = "usecase_design_execute";
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
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Process Designer</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "adminapi" [
    likec4_id = "integrationHub.quarkusApp.adminApi";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Admin API</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
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
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Operations Console</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "executionapi" [
    likec4_id = "integrationHub.quarkusApp.executionApi";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Execution API</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processengine" [
    likec4_id = "integrationHub.quarkusApp.processEngine";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Process Engine</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "sourceregistry" [
    likec4_id = "integrationHub.quarkusApp.sourceRegistry";
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
    likec4_id = "integrationHub.quarkusApp.readerRegistry";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Reader Provider Registry</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "dbwritetaskprovider" [
    likec4_id = "integrationHub.quarkusApp.taskProviders.dbWriteTaskProvider";
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
    likec4_id = "integrationHub.quarkusApp.taskProviders.restCallTaskProvider";
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">RestCallTaskProvider</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  subgraph "cluster_adminconsole" {
    likec4_id = "integrationHub.adminConsole";
    likec4_level = 0;
    likec4_depth = 1;
    fillcolor = "#2c4e32";
    color = "#1e3524";
    style = "filled";
    margin = 40;
    label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>ADMIN CONSOLE</B></FONT>>;
    "processdesigner";
    "operationsconsole";
  }
  subgraph "cluster_quarkusapp" {
    likec4_id = "integrationHub.quarkusApp";
    likec4_level = 0;
    likec4_depth = 1;
    fillcolor = "#2c4e32";
    color = "#1e3524";
    style = "filled";
    margin = 40;
    label = <<FONT POINT-SIZE="11" COLOR="#c2f0c2b3"><B>QUARKUS NATIVE APP</B></FONT>>;
    "adminapi";
    "executionapi";
    "processengine";
    "sourceregistry";
    "readerregistry";
    "dbwritetaskprovider";
    "restcalltaskprovider";
  }
  "integrationadmin" -> "processdesigner" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Configura source, reader y tareas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processdesigner" -> "adminapi" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda process definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "operator" -> "operationsconsole" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Selecciona proceso</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "operationsconsole" -> "executionapi" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Ejecuta proceso</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "executionapi" -> "processengine" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Inicia ejecucion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "sourceregistry" [
    likec4_id = "step-06";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Obtiene fuente</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "readerregistry" [
    likec4_id = "step-07";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>7</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Lee contenido</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "dbwritetaskprovider" [
    likec4_id = "step-08";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>8</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste registros</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "db" -> "dbwritetaskprovider" [
    likec4_id = "step-09";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>9</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda staging/destino</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
  "processengine" -> "restcalltaskprovider" [
    likec4_id = "step-10";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>10</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Invoca API externa</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "externalapi" -> "restcalltaskprovider" [
    likec4_id = "step-11";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>11</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Envia payload</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
  "operationsconsole" -> "executionapi" [
    likec4_id = "step-12";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>12</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Consulta resultado</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
}`;case"usecase_scheduled_audit":return`digraph {
  likec4_viewId = "usecase_scheduled_audit";
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
  "scheduler" [
    likec4_id = "integrationHub.quarkusApp.scheduler";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Scheduler</FONT>>;
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
  "queryapi" [
    likec4_id = "integrationHub.quarkusApp.queryApi";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Query API</FONT>>;
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
  "auditor" [
    likec4_id = "auditor";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Auditor</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#A35829";
    fontcolor = "#FFE0C2";
    color = "#7E451D";
  ];
  "scheduler" -> "scheduleractor" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Dispara scheduler</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
  "scheduler" -> "processengine" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Lanza proceso programado</FONT></TD></TR></TABLE>>;
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
  "operationsconsole" -> "auditor" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Consulta auditoria</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
  "operationsconsole" -> "queryapi" [
    likec4_id = "step-06";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Solicita eventos y ejecuciones</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "auditservice" -> "queryapi" [
    likec4_id = "step-07";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>7</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Lee eventos</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
  "otel" -> "telemetry" [
    likec4_id = "step-08";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>8</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowtail = "normal";
    dir = "back";
  ];
  "otel" -> "jaeger" [
    likec4_id = "step-09";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>9</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Publica visualizacion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
}`;default:throw new Error("Unknown viewId: "+e)}}function t(e){switch(e){case"index":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3734pt" height="1501pt"
 viewBox="0.00 0.00 3734.00 1501.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1486.25)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1971.04,-1471.2 1651,-1471.2 1651,-1291.2 1971.04,-1291.2 1971.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="1724.85" y="-1375.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- loadbalancer -->
<g id="node2" class="node">
<title>loadbalancer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1528.04,-1148.4 1208,-1148.4 1208,-968.4 1528.04,-968.4 1528.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1229.62" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Load Balancer / Reverse Proxy</text>
</g>
<!-- integrationhub -->
<g id="node3" class="node">
<title>integrationhub</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2115.04,-502.8 1795,-502.8 1795,-322.8 2115.04,-322.8 2115.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1846.63" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Platform</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1035.04,-1471.2 715,-1471.2 715,-1291.2 1035.04,-1291.2 1035.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="737.17" y="-1375.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- platformadmin -->
<g id="node5" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-1471.2 0,-1471.2 0,-1291.2 320.04,-1291.2 320.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="91.67" y="-1375.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- vault -->
<g id="node6" class="node">
<title>vault</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="560.04,-1148.4 240,-1148.4 240,-968.4 560.04,-968.4 560.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="282.74" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Secrets / Vault corporativo</text>
</g>
<!-- iam -->
<g id="node7" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="840.04,-180 520,-180 520,0 840.04,0 840.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="639.44" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- integrationadmin -->
<g id="node8" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2414.04,-1471.2 2094,-1471.2 2094,-1291.2 2414.04,-1291.2 2414.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="2175.64" y="-1375.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node9" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2844.04,-1471.2 2524,-1471.2 2524,-1291.2 2844.04,-1291.2 2844.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="2644.56" y="-1375.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node10" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3274.04,-1471.2 2954,-1471.2 2954,-1291.2 3274.04,-1291.2 3274.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="3082.34" y="-1375.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- infrateam -->
<g id="node11" class="node">
<title>infrateam</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1528.04,-1471.2 1208,-1471.2 1208,-1291.2 1528.04,-1291.2 1528.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="1256.29" y="-1375.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Equipo de infraestructura</text>
</g>
<!-- sharedstorage -->
<g id="node12" class="node">
<title>sharedstorage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1958.04,-1148.4 1638,-1148.4 1638,-968.4 1958.04,-968.4 1958.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1709.08" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared File Storage</text>
</g>
<!-- ingresscontroller -->
<g id="node13" class="node">
<title>ingresscontroller</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1528.04,-825.6 1208,-825.6 1208,-645.6 1528.04,-645.6 1528.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1289.1" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Ingress Controller</text>
</g>
<!-- scheduleractor -->
<g id="node14" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3704.04,-1471.2 3384,-1471.2 3384,-1291.2 3704.04,-1291.2 3704.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="3498.99" y="-1375.2" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- externalapi -->
<g id="node15" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1470.04,-180 1150,-180 1150,0 1470.04,0 1470.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1247.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- db -->
<g id="node16" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1900.04,-180 1580,-180 1580,0 1900.04,0 1900.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1685.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node17" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2330.04,-180 2010,-180 2010,0 2330.04,0 2330.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2092.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node18" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2760.04,-180 2440,-180 2440,0 2760.04,0 2760.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2533.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- user&#45;&gt;loadbalancer -->
<g id="edge1" class="edge">
<title>user&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1748.39,-1291.64C1725.09,-1262.73 1696.97,-1232.02 1667.02,-1208.4 1627.93,-1177.57 1581.44,-1150.67 1536.9,-1128.52"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1538.33,-1126.3 1530.45,-1125.34 1536.02,-1131.01 1538.33,-1126.3"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1690.06,-1208.4 1690.06,-1231.2 1816.66,-1231.2 1816.66,-1208.4 1690.06,-1208.4"/>
<text xml:space="preserve" text-anchor="start" x="1693.06" y="-1215.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Accede por HTTPS</text>
</g>
<!-- user&#45;&gt;integrationhub -->
<g id="edge2" class="edge">
<title>user&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1909.47,-1291.38C1947.76,-1251.43 1988.3,-1201.36 2013.02,-1148.4 2108.03,-944.87 2112.99,-864.81 2064.02,-645.6 2053.74,-599.6 2033.29,-551.95 2012.85,-511.91"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2015.25,-510.84 2009.47,-505.38 2010.59,-513.25 2015.25,-510.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2093.81,-885.6 2093.81,-908.4 2280.36,-908.4 2280.36,-885.6 2093.81,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="2096.81" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge15" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1368.02,-968.47C1368.02,-927.27 1368.02,-878.16 1368.02,-835.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1370.65,-835.96 1368.02,-828.46 1365.4,-835.96 1370.65,-835.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1368.02,-885.6 1368.02,-908.4 1527.31,-908.4 1527.31,-885.6 1368.02,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="1371.02" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvia trafico al cluster</text>
</g>
<!-- integrationhub&#45;&gt;iam -->
<g id="edge19" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1795.15,-371.58C1553.58,-310.79 1097.51,-196.04 850.06,-133.78"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="850.74,-131.25 842.83,-131.96 849.46,-136.34 850.74,-131.25"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1355.75,-240 1355.75,-262.8 1382.74,-262.8 1382.74,-240 1355.75,-240"/>
<text xml:space="preserve" text-anchor="start" x="1358.75" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge18" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1795.17,-332.3C1699.12,-284.53 1577,-223.79 1479.32,-175.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1480.53,-172.88 1472.65,-171.89 1478.2,-177.58 1480.53,-172.88"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1651.86,-240 1651.86,-262.8 1678.85,-262.8 1678.85,-240 1651.86,-240"/>
<text xml:space="preserve" text-anchor="start" x="1654.86" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge20" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1895.42,-322.87C1867.45,-281.14 1834.06,-231.31 1805.4,-188.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1807.59,-187.11 1801.24,-182.34 1803.23,-190.04 1807.59,-187.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1853.97,-240 1853.97,-262.8 1880.96,-262.8 1880.96,-240 1853.97,-240"/>
<text xml:space="preserve" text-anchor="start" x="1856.97" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge21" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2014.62,-322.87C2042.59,-281.14 2075.98,-231.31 2104.64,-188.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2106.81,-190.04 2108.8,-182.34 2102.45,-187.11 2106.81,-190.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2068.97,-240 2068.97,-262.8 2095.96,-262.8 2095.96,-240 2068.97,-240"/>
<text xml:space="preserve" text-anchor="start" x="2071.97" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge22" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2114.87,-332.3C2210.92,-284.53 2333.04,-223.79 2430.72,-175.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2431.84,-177.58 2437.39,-171.89 2429.51,-172.88 2431.84,-177.58"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2296.86,-240 2296.86,-262.8 2393.12,-262.8 2393.12,-240 2296.86,-240"/>
<text xml:space="preserve" text-anchor="start" x="2299.86" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- admin&#45;&gt;loadbalancer -->
<g id="edge3" class="edge">
<title>admin&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1011.69,-1291.27C1077.42,-1248.5 1156.23,-1197.21 1223.01,-1153.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1224.12,-1156.17 1228.97,-1149.88 1221.25,-1151.77 1224.12,-1156.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1136.3,-1208.4 1136.3,-1231.2 1282.34,-1231.2 1282.34,-1208.4 1136.3,-1208.4"/>
<text xml:space="preserve" text-anchor="start" x="1139.3" y="-1215.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra por HTTPS</text>
</g>
<!-- admin&#45;&gt;integrationhub -->
<g id="edge4" class="edge">
<title>admin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M853.62,-1291.54C833.51,-1188.77 814.58,-1016.75 874.67,-885.6 1031.67,-542.93 1521.89,-449.12 1784.65,-423.45"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1784.82,-426.07 1792.04,-422.75 1784.33,-420.85 1784.82,-426.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="874.67,-885.6 874.67,-908.4 1118.02,-908.4 1118.02,-885.6 874.67,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="877.67" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- platformadmin&#45;&gt;vault -->
<g id="edge5" class="edge">
<title>platformadmin&#45;&gt;vault</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M226.55,-1291.27C257.9,-1249.37 295.36,-1199.3 327.43,-1156.43"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="329.36,-1158.23 331.75,-1150.65 325.16,-1155.09 329.36,-1158.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="287.22,-1208.4 287.22,-1231.2 333.67,-1231.2 333.67,-1208.4 287.22,-1208.4"/>
<text xml:space="preserve" text-anchor="start" x="290.22" y="-1215.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge6" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M122.8,-1291.33C99.56,-1227.87 74.02,-1139.84 74.02,-1059.4 74.02,-1059.4 74.02,-1059.4 74.02,-411.8 74.02,-213.58 330.42,-137.5 509.66,-108.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="510.02,-111.13 517.02,-107.37 509.2,-105.94 510.02,-111.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="74.02,-724.2 74.02,-747 120.48,-747 120.48,-724.2 74.02,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="77.02" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
</g>
<!-- vault&#45;&gt;integrationhub -->
<g id="edge14" class="edge">
<title>vault&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M389.02,-968.42C382.8,-877.67 387.63,-737.5 459.81,-645.6 520.55,-568.25 569.71,-587.06 665.02,-562.8 1058.03,-462.76 1535.65,-429.74 1784.93,-418.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1784.76,-421.59 1792.14,-418.65 1784.54,-416.34 1784.76,-421.59"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="459.81,-724.2 459.81,-747 665.02,-747 665.02,-724.2 459.81,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="462.81" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- integrationadmin&#45;&gt;integrationhub -->
<g id="edge7" class="edge">
<title>integrationadmin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2282.5,-1291.64C2310.34,-1191.53 2343.63,-1024.43 2307.02,-885.6 2264.96,-726.14 2227.97,-690.83 2124.02,-562.8 2109.13,-544.47 2091.87,-526.49 2074.18,-509.73"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2076.06,-507.89 2068.79,-504.69 2072.47,-511.73 2076.06,-507.89"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2311.76,-885.6 2311.76,-908.4 2454.69,-908.4 2454.69,-885.6 2311.76,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="2314.76" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;01, UC&#45;02, UC&#45;03</text>
</g>
<!-- operator&#45;&gt;integrationhub -->
<g id="edge8" class="edge">
<title>operator&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2658.9,-1291.3C2613.15,-1142.51 2503.89,-840.27 2323.02,-645.6 2266.95,-585.25 2191.83,-534.24 2124.08,-495.57"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2125.46,-493.33 2117.64,-491.92 2122.88,-497.9 2125.46,-493.33"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2502.3,-885.6 2502.3,-908.4 2645.23,-908.4 2645.23,-885.6 2502.3,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="2505.3" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;04, UC&#45;06, UC&#45;08</text>
</g>
<!-- auditor&#45;&gt;integrationhub -->
<g id="edge9" class="edge">
<title>auditor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3051.88,-1291.32C2945.66,-1143.89 2716.8,-845.26 2472.02,-645.6 2414.21,-598.45 2393.23,-595.17 2326.02,-562.8 2261.48,-531.71 2188.69,-501.48 2124.78,-476.46"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2125.77,-474.02 2117.83,-473.74 2123.86,-478.92 2125.77,-474.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2738.4,-885.6 2738.4,-908.4 2833.09,-908.4 2833.09,-885.6 2738.4,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="2741.4" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;06, UC&#45;07</text>
</g>
<!-- infrateam&#45;&gt;loadbalancer -->
<g id="edge10" class="edge">
<title>infrateam&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1368.02,-1291.27C1368.02,-1250.07 1368.02,-1200.96 1368.02,-1158.57"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1370.65,-1158.76 1368.02,-1151.26 1365.4,-1158.76 1370.65,-1158.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1368.02,-1208.4 1368.02,-1231.2 1414.48,-1231.2 1414.48,-1208.4 1368.02,-1208.4"/>
<text xml:space="preserve" text-anchor="start" x="1371.02" y="-1215.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- infrateam&#45;&gt;sharedstorage -->
<g id="edge11" class="edge">
<title>infrateam&#45;&gt;sharedstorage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1486.51,-1291.4C1522.19,-1264.69 1561.45,-1235.33 1597.56,-1208.4 1620.99,-1190.93 1645.97,-1172.33 1670.06,-1154.42"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1671.31,-1156.76 1675.77,-1150.17 1668.18,-1152.54 1671.31,-1156.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1597.56,-1208.4 1597.56,-1231.2 1644.02,-1231.2 1644.02,-1208.4 1597.56,-1208.4"/>
<text xml:space="preserve" text-anchor="start" x="1600.56" y="-1215.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- infrateam&#45;&gt;ingresscontroller -->
<g id="edge12" class="edge">
<title>infrateam&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1226.26,-1291.29C1179.07,-1253.56 1132.07,-1205.11 1106.56,-1148.4 1073.75,-1075.44 1073.75,-1041.36 1106.56,-968.4 1130.63,-914.91 1173.81,-868.75 1218.25,-832.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1219.74,-834.19 1223.91,-827.42 1216.43,-830.12 1219.74,-834.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1106.56,-1047 1106.56,-1069.8 1153.02,-1069.8 1153.02,-1047 1106.56,-1047"/>
<text xml:space="preserve" text-anchor="start" x="1109.56" y="-1054.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- sharedstorage&#45;&gt;integrationhub -->
<g id="edge16" class="edge">
<title>sharedstorage&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1808.92,-968.44C1820.31,-884.36 1840.66,-755.13 1870.06,-645.6 1882.02,-601.05 1898.94,-552.99 1914.53,-512.24"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1916.92,-513.36 1917.17,-505.42 1912.02,-511.47 1916.92,-513.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1870.06,-724.2 1870.06,-747 2041.02,-747 2041.02,-724.2 1870.06,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="1873.06" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- ingresscontroller&#45;&gt;integrationhub -->
<g id="edge17" class="edge">
<title>ingresscontroller&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1435.62,-645.77C1461.73,-616.16 1493.54,-585.07 1527.62,-562.8 1605.61,-511.84 1703.03,-476.12 1785.15,-452.46"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1785.68,-455.04 1792.18,-450.46 1784.25,-449.99 1785.68,-455.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1527.62,-562.8 1527.62,-585.6 1704.02,-585.6 1704.02,-562.8 1527.62,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1530.62" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- scheduleractor&#45;&gt;integrationhub -->
<g id="edge13" class="edge">
<title>scheduleractor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3456.03,-1291.31C3303.43,-1141.19 2974.71,-835.31 2649.02,-645.6 2560.54,-594.06 2530.74,-596.43 2434.02,-562.8 2332.23,-527.41 2216.93,-491.42 2124.96,-463.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2125.84,-461.2 2117.9,-461.55 2124.33,-466.23 2125.84,-461.2"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3019.56,-885.6 3019.56,-908.4 3066.02,-908.4 3066.02,-885.6 3019.56,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="3022.56" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;05</text>
</g>
</g>
</svg>
`;case"context":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3790pt" height="882pt"
 viewBox="0.00 0.00 3790.00 882.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 866.65)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="1672.02,-299.6 1672.02,-580.8 2652.02,-580.8 2652.02,-299.6 1672.02,-299.6"/>
<text xml:space="preserve" text-anchor="start" x="1680.02" y="-567.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<!-- adminconsole -->
<g id="node1" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2032.04,-519.6 1712,-519.6 1712,-339.6 2032.04,-339.6 2032.04,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="1804.21" y="-423.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2612.04,-519.6 2292,-519.6 2292,-339.6 2612.04,-339.6 2612.04,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="2362.53" y="-423.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- user -->
<g id="node3" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="750.04,-851.6 430,-851.6 430,-671.6 750.04,-671.6 750.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="503.85" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1180.04,-851.6 860,-851.6 860,-671.6 1180.04,-671.6 1180.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="882.17" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node5" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1610.04,-851.6 1290,-851.6 1290,-671.6 1610.04,-671.6 1610.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="1371.64" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node6" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2040.04,-851.6 1720,-851.6 1720,-671.6 2040.04,-671.6 2040.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="1840.56" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node7" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-851.6 0,-851.6 0,-671.6 320.04,-671.6 320.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="128.34" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- scheduleractor -->
<g id="node8" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3760.04,-851.6 3440,-851.6 3440,-671.6 3760.04,-671.6 3760.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="3554.99" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- ingresscontroller -->
<g id="node9" class="node">
<title>ingresscontroller</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2470.04,-851.6 2150,-851.6 2150,-671.6 2470.04,-671.6 2470.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="2231.1" y="-755.6" font-family="Arial" font-size="20.00" fill="#fafafa">Ingress Controller</text>
</g>
<!-- vault -->
<g id="node10" class="node">
<title>vault</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2900.04,-851.6 2580,-851.6 2580,-671.6 2900.04,-671.6 2900.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="2622.74" y="-755.6" font-family="Arial" font-size="20.00" fill="#fafafa">Secrets / Vault corporativo</text>
</g>
<!-- sharedstorage -->
<g id="node11" class="node">
<title>sharedstorage</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3330.04,-851.6 3010,-851.6 3010,-671.6 3330.04,-671.6 3330.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="3081.08" y="-755.6" font-family="Arial" font-size="20.00" fill="#fafafa">Shared File Storage</text>
</g>
<!-- iam -->
<g id="node12" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="1892.04,-180 1572,-180 1572,0 1892.04,0 1892.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1691.44" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- externalapi -->
<g id="node13" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2322.04,-180 2002,-180 2002,0 2322.04,0 2322.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2099.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- db -->
<g id="node14" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2752.04,-180 2432,-180 2432,0 2752.04,0 2752.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2537.55" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node15" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3182.04,-180 2862,-180 2862,0 3182.04,0 3182.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2944.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node16" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3612.04,-180 3292,-180 3292,0 3612.04,0 3612.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="3385.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge11" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2031.66,-429.6C2109.4,-429.6 2202.93,-429.6 2282,-429.6"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2281.54,-432.23 2289.04,-429.6 2281.54,-426.98 2281.54,-432.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2087.03,-432.6 2087.03,-455.4 2237.01,-455.4 2237.01,-432.6 2087.03,-432.6"/>
<text xml:space="preserve" text-anchor="start" x="2090.03" y="-439.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge12" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1751.16,-339.81C1734.47,-321.86 1719.75,-301.64 1710.08,-279.6 1697.88,-251.8 1697.3,-219.6 1701.55,-189.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1704.08,-190.55 1702.69,-182.72 1698.9,-189.71 1704.08,-190.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1710.08,-248.4 1710.08,-271.2 1839.02,-271.2 1839.02,-248.4 1710.08,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="1713.08" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge14" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2292,-353.81C2241.31,-330.09 2185.05,-303.76 2133.5,-279.6 2057.11,-243.79 1972.56,-204.08 1900.84,-170.38"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1902.35,-168.19 1894.45,-167.37 1900.12,-172.94 1902.35,-168.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2133.5,-248.4 2133.5,-271.2 2271.02,-271.2 2271.02,-248.4 2133.5,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="2136.5" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge13" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2375.83,-339.9C2335.69,-293.17 2286.39,-235.78 2245.25,-187.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2247.31,-186.26 2240.43,-182.28 2243.33,-189.68 2247.31,-186.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2315.72,-248.4 2315.72,-271.2 2468.81,-271.2 2468.81,-248.4 2315.72,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="2318.72" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge15" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2488.8,-339.9C2507.94,-293.75 2531.39,-237.2 2551.1,-189.67"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2553.51,-190.72 2553.96,-182.78 2548.66,-188.71 2553.51,-190.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2526.22,-240 2526.22,-279.6 2764.9,-279.6 2764.9,-240 2526.22,-240"/>
<text xml:space="preserve" text-anchor="start" x="2529.22" y="-264" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="2529.22" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;filesources -->
<g id="edge16" class="edge">
<title>quarkusapp&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2611.83,-369.19C2670.3,-344.74 2735.84,-314.04 2792.02,-279.6 2835.59,-252.89 2879.84,-218.65 2917.74,-186.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2919.4,-188.72 2923.42,-181.87 2916,-184.72 2919.4,-188.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2845.97,-248.4 2845.97,-271.2 2872.96,-271.2 2872.96,-248.4 2845.97,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="2848.97" y="-256.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;observability -->
<g id="edge17" class="edge">
<title>quarkusapp&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2611.99,-382.33C2771.58,-335.14 3023.13,-257.97 3237.02,-180 3251.87,-174.59 3267.21,-168.75 3282.53,-162.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3283.23,-165.29 3289.25,-160.09 3281.31,-160.4 3283.23,-165.29"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3045.03,-248.4 3045.03,-271.2 3141.29,-271.2 3141.29,-248.4 3045.03,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="3048.03" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M749.99,-691.69C768.41,-684.56 787.04,-677.7 805.02,-671.6 1114.02,-566.81 1488.86,-494.12 1701.98,-457.65"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1702.39,-460.24 1709.34,-456.4 1701.51,-455.07 1702.39,-460.24"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1063.46,-588.8 1063.46,-611.6 1250.01,-611.6 1250.01,-588.8 1063.46,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="1066.46" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1179.93,-677.97C1240.98,-647.97 1311.75,-615.04 1377.67,-588.8 1483.81,-546.56 1606.05,-507.36 1702.43,-478.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1702.92,-481.14 1709.36,-476.48 1701.42,-476.11 1702.92,-481.14"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1377.67,-588.8 1377.67,-611.6 1621.02,-611.6 1621.02,-588.8 1377.67,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="1380.67" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;adminconsole -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1563.66,-671.73C1621.37,-626.61 1691.52,-571.75 1750.32,-525.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1751.86,-527.89 1756.16,-521.21 1748.63,-523.76 1751.86,-527.89"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1661.02,-588.8 1661.02,-611.6 1803.94,-611.6 1803.94,-588.8 1661.02,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="1664.02" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;01, UC&#45;02, UC&#45;03</text>
</g>
<!-- operator&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1871.73,-671.64C1870.22,-651.89 1868.87,-631.05 1868.1,-611.6 1867.04,-585.12 1867.1,-556.45 1867.67,-529.91"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1870.29,-530.05 1867.84,-522.49 1865.04,-529.92 1870.29,-530.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1868.1,-588.8 1868.1,-611.6 2011.02,-611.6 2011.02,-588.8 1868.1,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="1871.1" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;04, UC&#45;06, UC&#45;08</text>
</g>
<!-- auditor&#45;&gt;adminconsole -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M320.01,-689.66C338.35,-682.94 356.95,-676.74 375.02,-671.6 845.24,-537.92 1421.01,-471.37 1701.75,-444.9"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1701.79,-447.53 1709.01,-444.22 1701.3,-442.3 1701.79,-447.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="697.27,-588.8 697.27,-611.6 791.96,-611.6 791.96,-588.8 697.27,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="700.27" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;06, UC&#45;07</text>
</g>
<!-- scheduleractor&#45;&gt;quarkusapp -->
<g id="edge6" class="edge">
<title>scheduleractor&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3440.03,-691.77C3421.6,-684.62 3402.99,-677.74 3385.02,-671.6 3123.34,-582.2 2810.62,-507.78 2621.86,-466.26"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2622.69,-463.75 2614.8,-464.71 2621.57,-468.88 2622.69,-463.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3183.75,-588.8 3183.75,-611.6 3230.2,-611.6 3230.2,-588.8 3183.75,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="3186.75" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;05</text>
</g>
<!-- ingresscontroller&#45;&gt;adminconsole -->
<g id="edge7" class="edge">
<title>ingresscontroller&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2192.07,-671.73C2132.05,-626.51 2059.07,-571.53 1997.96,-525.49"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1999.79,-523.58 1992.22,-521.16 1996.63,-527.77 1999.79,-523.58"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2104.15,-588.8 2104.15,-611.6 2280.55,-611.6 2280.55,-588.8 2104.15,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="2107.15" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- ingresscontroller&#45;&gt;quarkusapp -->
<g id="edge8" class="edge">
<title>ingresscontroller&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2348.26,-671.73C2367.24,-627.62 2390.22,-574.21 2409.73,-528.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2412.08,-530.05 2412.64,-522.12 2407.26,-527.97 2412.08,-530.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2381.02,-588.8 2381.02,-611.6 2557.42,-611.6 2557.42,-588.8 2381.02,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="2384.02" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- vault&#45;&gt;quarkusapp -->
<g id="edge9" class="edge">
<title>vault&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2662.46,-671.73C2623.48,-627.07 2576.18,-572.87 2536.31,-527.18"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2538.37,-525.55 2531.46,-521.62 2534.41,-529 2538.37,-525.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2604.66,-588.8 2604.66,-611.6 2809.87,-611.6 2809.87,-588.8 2604.66,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="2607.66" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp -->
<g id="edge10" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3010.08,-674.53C2955.66,-646.2 2894.15,-615.21 2837.02,-588.8 2767.17,-556.5 2688.81,-523.7 2621.11,-496.4"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2622.38,-494.08 2614.44,-493.72 2620.42,-498.95 2622.38,-494.08"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2883.08,-588.8 2883.08,-611.6 3054.03,-611.6 3054.03,-588.8 2883.08,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="2886.08" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
</g>
</svg>
`;case"containers":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3360pt" height="2164pt"
 viewBox="0.00 0.00 3360.00 2164.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2148.65)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1351.04,-2133.6 1031,-2133.6 1031,-1953.6 1351.04,-1953.6 1351.04,-2133.6"/>
<text xml:space="preserve" text-anchor="start" x="1104.85" y="-2037.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- loadbalancer -->
<g id="node2" class="node">
<title>loadbalancer</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="1198.04,-1810.8 878,-1810.8 878,-1630.8 1198.04,-1630.8 1198.04,-1810.8"/>
<text xml:space="preserve" text-anchor="start" x="899.62" y="-1714.8" font-family="Arial" font-size="20.00" fill="#fafafa">Load Balancer / Reverse Proxy</text>
</g>
<!-- adminconsole -->
<g id="node3" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1027.04,-1165.2 707,-1165.2 707,-985.2 1027.04,-985.2 1027.04,-1165.2"/>
<text xml:space="preserve" text-anchor="start" x="799.21" y="-1069.2" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="921.04,-2133.6 601,-2133.6 601,-1953.6 921.04,-1953.6 921.04,-2133.6"/>
<text xml:space="preserve" text-anchor="start" x="623.17" y="-2037.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- vault -->
<g id="node5" class="node">
<title>vault</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="1800.04,-2133.6 1480,-2133.6 1480,-1953.6 1800.04,-1953.6 1800.04,-2133.6"/>
<text xml:space="preserve" text-anchor="start" x="1522.74" y="-2037.6" font-family="Arial" font-size="20.00" fill="#fafafa">Secrets / Vault corporativo</text>
</g>
<!-- quarkusapp -->
<g id="node6" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1407.04,-842.4 1087,-842.4 1087,-662.4 1407.04,-662.4 1407.04,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="1157.53" y="-746.4" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- sharedstorage -->
<g id="node7" class="node">
<title>sharedstorage</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="488.04,-2133.6 168,-2133.6 168,-1953.6 488.04,-1953.6 488.04,-2133.6"/>
<text xml:space="preserve" text-anchor="start" x="239.08" y="-2037.6" font-family="Arial" font-size="20.00" fill="#fafafa">Shared File Storage</text>
</g>
<!-- ingresscontroller -->
<g id="node8" class="node">
<title>ingresscontroller</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="1198.04,-1488 878,-1488 878,-1308 1198.04,-1308 1198.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="959.1" y="-1392" font-family="Arial" font-size="20.00" fill="#fafafa">Ingress Controller</text>
</g>
<!-- iam -->
<g id="node9" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="119.44" y="-406.8" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node10" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3330.04,-502.8 3010,-502.8 3010,-322.8 3330.04,-322.8 3330.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="3115.55" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- filesystem -->
<g id="node11" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="750.04,-502.8 430,-502.8 430,-322.8 750.04,-322.8 750.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="537.79" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node12" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1180.04,-502.8 860,-502.8 860,-322.8 1180.04,-322.8 1180.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1001.13" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node13" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1610.04,-502.8 1290,-502.8 1290,-322.8 1610.04,-322.8 1610.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1424.46" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node14" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2040.04,-502.8 1720,-502.8 1720,-322.8 2040.04,-322.8 2040.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1818.89" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- externalapi -->
<g id="node15" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-502.8 2150,-502.8 2150,-322.8 2470.04,-322.8 2470.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2247.77" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- otel -->
<g id="node16" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2900.04,-502.8 2580,-502.8 2580,-322.8 2900.04,-322.8 2900.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2628.87" y="-406.8" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node17" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2900.04,-180 2580,-180 2580,0 2900.04,0 2900.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2709.44" y="-84" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- user&#45;&gt;loadbalancer -->
<g id="edge1" class="edge">
<title>user&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1148.6,-1953.67C1128.79,-1912.12 1105.14,-1862.53 1084.81,-1819.9"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1087.29,-1819 1081.69,-1813.36 1082.55,-1821.26 1087.29,-1819"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1119.11,-1870.8 1119.11,-1893.6 1245.71,-1893.6 1245.71,-1870.8 1119.11,-1870.8"/>
<text xml:space="preserve" text-anchor="start" x="1122.11" y="-1878" font-family="Arial" font-size="14.00" fill="#c9c9c9">Accede por HTTPS</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1249.22,-1953.84C1259.05,-1934.7 1267.77,-1914.05 1273.02,-1893.6 1337.84,-1641.38 1363.18,-1543.97 1253.02,-1308 1212.07,-1220.27 1120.39,-1163.18 1036.66,-1127.6"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1037.75,-1125.21 1029.81,-1124.75 1035.73,-1130.06 1037.75,-1125.21"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1328.08,-1548 1328.08,-1570.8 1514.63,-1570.8 1514.63,-1548 1328.08,-1548"/>
<text xml:space="preserve" text-anchor="start" x="1331.08" y="-1555.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge7" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1038.02,-1630.87C1038.02,-1589.67 1038.02,-1540.56 1038.02,-1498.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1040.65,-1498.36 1038.02,-1490.86 1035.4,-1498.36 1040.65,-1498.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1038.02,-1548 1038.02,-1570.8 1197.31,-1570.8 1197.31,-1548 1038.02,-1548"/>
<text xml:space="preserve" text-anchor="start" x="1041.02" y="-1555.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvia trafico al cluster</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge10" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M934.58,-985.3C958.12,-957.16 985.76,-927.01 1014.05,-902.4 1035.84,-883.44 1060.25,-865.17 1084.85,-848.3"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1086.32,-850.48 1091.05,-844.09 1083.37,-846.13 1086.32,-850.48"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1014.05,-902.4 1014.05,-925.2 1164.02,-925.2 1164.02,-902.4 1014.05,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="1017.05" y="-909.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge11" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M772.04,-985.48C639.35,-861.54 399.45,-637.45 262.74,-509.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="264.58,-507.88 257.31,-504.67 261,-511.71 264.58,-507.88"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="618.16,-741 618.16,-763.8 747.1,-763.8 747.1,-741 618.16,-741"/>
<text xml:space="preserve" text-anchor="start" x="621.16" y="-748.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- admin&#45;&gt;loadbalancer -->
<g id="edge3" class="edge">
<title>admin&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M837.81,-1953.67C874.06,-1911.68 917.4,-1861.49 954.47,-1818.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="956.43,-1820.31 959.34,-1812.92 952.45,-1816.88 956.43,-1820.31"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="907.83,-1870.8 907.83,-1893.6 1053.86,-1893.6 1053.86,-1870.8 907.83,-1870.8"/>
<text xml:space="preserve" text-anchor="start" x="910.83" y="-1878" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra por HTTPS</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M757.05,-1953.83C753.81,-1854.59 752,-1689.26 767.67,-1548 782.14,-1417.56 816.15,-1269.93 840.34,-1175.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="842.87,-1175.78 842.19,-1167.87 837.79,-1174.48 842.87,-1175.78"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="767.67,-1548 767.67,-1570.8 1011.02,-1570.8 1011.02,-1548 767.67,-1548"/>
<text xml:space="preserve" text-anchor="start" x="770.67" y="-1555.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- vault&#45;&gt;quarkusapp -->
<g id="edge5" class="edge">
<title>vault&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1640.02,-1953.75C1640.02,-1889.35 1640.02,-1800.19 1640.02,-1721.8 1640.02,-1721.8 1640.02,-1721.8 1640.02,-1074.2 1640.02,-950.96 1522.62,-866.61 1416.15,-815.44"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1417.51,-813.18 1409.6,-812.35 1415.26,-817.93 1417.51,-813.18"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1640.02,-1386.6 1640.02,-1409.4 1845.23,-1409.4 1845.23,-1386.6 1640.02,-1386.6"/>
<text xml:space="preserve" text-anchor="start" x="1643.02" y="-1393.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1087.39,-711.77C911.22,-666.68 620.13,-588.16 375.02,-502.8 360.09,-497.6 344.7,-491.91 329.35,-486.01"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.56,-483.66 322.61,-483.4 328.66,-488.55 330.56,-483.66"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="683.77,-571.2 683.77,-594 821.28,-594 821.28,-571.2 683.77,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="686.77" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge13" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1406.82,-743.26C1712.97,-724.37 2400.98,-666 2955.02,-502.8 2970.02,-498.38 2985.4,-493.26 3000.71,-487.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3001.24,-490.36 3007.38,-485.32 2999.43,-485.43 3001.24,-490.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2681.99,-562.8 2681.99,-602.4 2920.68,-602.4 2920.68,-562.8 2681.99,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2684.99" y="-586.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="2684.99" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;filesystem -->
<g id="edge14" class="edge">
<title>quarkusapp&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1087.14,-669.25C987.68,-618.14 859.93,-552.49 758.84,-500.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="760.33,-498.36 752.45,-497.27 757.93,-503.03 760.33,-498.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="938.22,-571.2 938.22,-594 1071.07,-594 1071.07,-571.2 938.22,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="941.22" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- quarkusapp&#45;&gt;ftp -->
<g id="edge15" class="edge">
<title>quarkusapp&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1187.38,-662.7C1156.09,-616.16 1117.69,-559.06 1085.57,-511.29"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1087.91,-510.06 1081.54,-505.3 1083.55,-512.99 1087.91,-510.06"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1140.33,-571.2 1140.33,-594 1262.26,-594 1262.26,-571.2 1140.33,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1143.33" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;sftp -->
<g id="edge16" class="edge">
<title>quarkusapp&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1300.36,-662.7C1328.28,-616.26 1362.53,-559.29 1391.22,-511.58"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1393.34,-513.16 1394.95,-505.38 1388.84,-510.46 1393.34,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1354.61,-571.2 1354.61,-594 1476.54,-594 1476.54,-571.2 1354.61,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1357.61" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;restsource -->
<g id="edge17" class="edge">
<title>quarkusapp&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1406.75,-666.21C1499.62,-616.68 1616.59,-554.3 1711,-503.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1712.01,-506.38 1717.39,-500.53 1709.54,-501.75 1712.01,-506.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1582.5,-571.2 1582.5,-594 1751.93,-594 1751.93,-571.2 1582.5,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1585.5" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge18" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1406.82,-711.07C1578.77,-666.18 1859.29,-588.55 2095.02,-502.8 2109.87,-497.4 2125.21,-491.56 2140.54,-485.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2141.24,-488.11 2147.25,-482.92 2139.31,-483.22 2141.24,-488.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1911.84,-571.2 1911.84,-594 2064.93,-594 2064.93,-571.2 1911.84,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1914.84" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge19" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1406.91,-732.54C1651.87,-700.94 2132.89,-628.1 2525.02,-502.8 2540,-498.01 2555.39,-492.63 2570.73,-486.93"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2571.33,-489.51 2577.43,-484.41 2569.49,-484.59 2571.33,-489.51"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2285.67,-571.2 2285.67,-594 2381.93,-594 2381.93,-571.2 2285.67,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="2288.67" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp -->
<g id="edge6" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M328.02,-1953.75C328.02,-1889.35 328.02,-1800.19 328.02,-1721.8 328.02,-1721.8 328.02,-1721.8 328.02,-1074.2 328.02,-995.76 811.46,-862.35 1077.07,-794.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1077.64,-797.53 1084.27,-793.14 1076.36,-792.44 1077.64,-797.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="328.02,-1386.6 328.02,-1409.4 498.98,-1409.4 498.98,-1386.6 328.02,-1386.6"/>
<text xml:space="preserve" text-anchor="start" x="331.02" y="-1393.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- ingresscontroller&#45;&gt;adminconsole -->
<g id="edge8" class="edge">
<title>ingresscontroller&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M990.61,-1308.07C968.47,-1266.52 942.04,-1216.93 919.31,-1174.3"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="921.64,-1173.08 915.79,-1167.7 917.01,-1175.55 921.64,-1173.08"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="957.65,-1225.2 957.65,-1248 1134.05,-1248 1134.05,-1225.2 957.65,-1225.2"/>
<text xml:space="preserve" text-anchor="start" x="960.65" y="-1232.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- ingresscontroller&#45;&gt;quarkusapp -->
<g id="edge9" class="edge">
<title>ingresscontroller&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1123.55,-1308.3C1137.95,-1289.54 1151.35,-1269.03 1161.02,-1248 1220,-1119.78 1238.78,-955.86 1244.61,-852.72"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1247.22,-852.96 1245,-845.33 1241.98,-852.68 1247.22,-852.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1231.57,-1063.8 1231.57,-1086.6 1407.97,-1086.6 1407.97,-1063.8 1231.57,-1063.8"/>
<text xml:space="preserve" text-anchor="start" x="1234.57" y="-1071" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge20" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2740.02,-322.87C2740.02,-281.67 2740.02,-232.56 2740.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2742.65,-190.36 2740.02,-182.86 2737.4,-190.36 2742.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2740.02,-240 2740.02,-262.8 2837.07,-262.8 2837.07,-240 2740.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="2743.02" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
</g>
</svg>
`;case"components":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3416pt" height="1501pt"
 viewBox="0.00 0.00 3416.00 1501.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1486.25)">
<!-- adminapi -->
<g id="node1" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="997.04,-1471.2 677,-1471.2 677,-1291.2 997.04,-1291.2 997.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="789.78" y="-1375.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- processengine -->
<g id="node2" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1427.04,-1148.4 1107,-1148.4 1107,-968.4 1427.04,-968.4 1427.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1196.98" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- executionapi -->
<g id="node3" class="node">
<title>executionapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1427.04,-1471.2 1107,-1471.2 1107,-1291.2 1427.04,-1291.2 1427.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="1204.21" y="-1375.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Execution API</text>
</g>
<!-- queryapi -->
<g id="node4" class="node">
<title>queryapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2526.04,-1471.2 2206,-1471.2 2206,-1291.2 2526.04,-1291.2 2526.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="2319.89" y="-1375.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Query API</text>
</g>
<!-- auditservice -->
<g id="node5" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2509.04,-825.6 2189,-825.6 2189,-645.6 2509.04,-645.6 2509.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2290.1" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- scheduler -->
<g id="node6" class="node">
<title>scheduler</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1857.04,-1471.2 1537,-1471.2 1537,-1291.2 1857.04,-1291.2 1857.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="1651.99" y="-1375.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Scheduler</text>
</g>
<!-- sourceregistry -->
<g id="node7" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-825.6 0,-825.6 0,-645.6 320.04,-645.6 320.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="48.87" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node8" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-825.6 430,-825.6 430,-645.6 750.04,-645.6 750.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="477.75" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- taskregistry -->
<g id="node9" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1857.04,-825.6 1537,-825.6 1537,-645.6 1857.04,-645.6 1857.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1595.88" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- telemetry -->
<g id="node10" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1427.04,-825.6 1107,-825.6 1107,-645.6 1427.04,-645.6 1427.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1126.4" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- taskproviders -->
<g id="node11" class="node">
<title>taskproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1805.04,-502.8 1485,-502.8 1485,-322.8 1805.04,-322.8 1805.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1578.34" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Providers</text>
</g>
<!-- db -->
<g id="node12" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2183.04,-180 1863,-180 1863,0 2183.04,0 2183.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1968.55" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- sourceproviders -->
<g id="node13" class="node">
<title>sourceproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="83.32" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Providers</text>
</g>
<!-- readerproviders -->
<g id="node14" class="node">
<title>readerproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-502.8 430,-502.8 430,-322.8 750.04,-322.8 750.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="512.21" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Providers</text>
</g>
<!-- externalapi -->
<g id="node15" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1753.04,-180 1433,-180 1433,0 1753.04,0 1753.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1530.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- iam -->
<g id="node16" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="2956.04,-1471.2 2636,-1471.2 2636,-1291.2 2956.04,-1291.2 2956.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="2755.44" y="-1375.2" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- filesystem -->
<g id="node17" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2956.04,-1148.4 2636,-1148.4 2636,-968.4 2956.04,-968.4 2956.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="2743.79" y="-1052.4" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node18" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2956.04,-825.6 2636,-825.6 2636,-645.6 2956.04,-645.6 2956.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2777.13" y="-729.6" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node19" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2956.04,-502.8 2636,-502.8 2636,-322.8 2956.04,-322.8 2956.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2770.46" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node20" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3386.04,-1471.2 3066,-1471.2 3066,-1291.2 3386.04,-1291.2 3386.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="3164.89" y="-1375.2" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- otel -->
<g id="node21" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3386.04,-1148.4 3066,-1148.4 3066,-968.4 3386.04,-968.4 3386.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="3114.87" y="-1052.4" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- adminapi&#45;&gt;processengine -->
<g id="edge1" class="edge">
<title>adminapi&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M956.23,-1291.27C1013.32,-1248.67 1081.74,-1197.63 1139.83,-1154.29"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1141.09,-1156.63 1145.53,-1150.04 1137.95,-1152.42 1141.09,-1156.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1064.91,-1208.4 1064.91,-1231.2 1209.44,-1231.2 1209.44,-1208.4 1064.91,-1208.4"/>
<text xml:space="preserve" text-anchor="start" x="1067.91" y="-1215.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura definiciones</text>
</g>
<!-- processengine&#45;&gt;auditservice -->
<g id="edge8" class="edge">
<title>processengine&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1426.7,-1046.42C1594.35,-1030.74 1863.19,-993.7 2080.02,-908.4 2129.57,-888.91 2179.83,-859.84 2223.27,-831.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2224.57,-833.43 2229.35,-827.08 2221.65,-829.06 2224.57,-833.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2127.51,-885.6 2127.51,-908.4 2238.57,-908.4 2238.57,-885.6 2127.51,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="2130.51" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- processengine&#45;&gt;sourceregistry -->
<g id="edge5" class="edge">
<title>processengine&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1107.09,-1026.69C972.97,-999.62 776.96,-957.01 608.84,-908.4 502.94,-877.78 477.95,-865.1 375.02,-825.6 360.18,-819.91 344.83,-813.86 329.47,-807.71"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.66,-805.36 322.72,-804.99 328.7,-810.23 330.66,-805.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="608.84,-885.6 608.84,-908.4 716.02,-908.4 716.02,-885.6 608.84,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="611.84" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve fuente</text>
</g>
<!-- processengine&#45;&gt;readerregistry -->
<g id="edge6" class="edge">
<title>processengine&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1107.12,-1027.51C1007.99,-1004.52 880.52,-966.63 778.3,-908.4 742.67,-888.11 708.18,-860 678.65,-832.4"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="680.71,-830.72 673.46,-827.47 677.1,-834.54 680.71,-830.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="778.3,-885.6 778.3,-908.4 887.02,-908.4 887.02,-885.6 778.3,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="781.3" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve reader</text>
</g>
<!-- processengine&#45;&gt;taskregistry -->
<g id="edge7" class="edge">
<title>processengine&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1386.23,-968.47C1443.32,-925.87 1511.74,-874.83 1569.83,-831.49"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1571.09,-833.83 1575.53,-827.24 1567.95,-829.62 1571.09,-833.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1494.91,-885.6 1494.91,-908.4 1595.08,-908.4 1595.08,-885.6 1494.91,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="1497.91" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve tarea</text>
</g>
<!-- processengine&#45;&gt;telemetry -->
<g id="edge9" class="edge">
<title>processengine&#45;&gt;telemetry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1267.02,-968.47C1267.02,-927.27 1267.02,-878.16 1267.02,-835.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1269.65,-835.96 1267.02,-828.46 1264.4,-835.96 1269.65,-835.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1267.02,-885.6 1267.02,-908.4 1344.61,-908.4 1344.61,-885.6 1267.02,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="1270.02" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Crea spans</text>
</g>
<!-- processengine&#45;&gt;taskproviders -->
<g id="edge10" class="edge">
<title>processengine&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1137.83,-968.41C1093.39,-930.17 1048.84,-881.38 1025.03,-825.6 993.62,-752.02 979.43,-711.33 1025.03,-645.6 1125.63,-500.58 1328.7,-446.13 1475.06,-425.78"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1474.98,-428.44 1482.06,-424.84 1474.28,-423.24 1474.98,-428.44"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1025.03,-724.2 1025.03,-747 1052.02,-747 1052.02,-724.2 1025.03,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="1028.03" y="-732.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- processengine&#45;&gt;db -->
<g id="edge11" class="edge">
<title>processengine&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1426.8,-1045.21C1575.97,-1024.85 1792.94,-970.51 1912.02,-825.6 2062.32,-642.71 2054.16,-344.48 2037.5,-190.3"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2040.12,-190.08 2036.68,-182.91 2034.9,-190.66 2040.12,-190.08"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2025.48,-562.8 2025.48,-585.6 2207.34,-585.6 2207.34,-562.8 2025.48,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2028.48" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones y tasks</text>
</g>
<!-- executionapi&#45;&gt;processengine -->
<g id="edge2" class="edge">
<title>executionapi&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1267.02,-1291.27C1267.02,-1250.07 1267.02,-1200.96 1267.02,-1158.57"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1269.65,-1158.76 1267.02,-1151.26 1264.4,-1158.76 1269.65,-1158.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1267.02,-1208.4 1267.02,-1231.2 1383.53,-1231.2 1383.53,-1208.4 1267.02,-1208.4"/>
<text xml:space="preserve" text-anchor="start" x="1270.02" y="-1215.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Inicia ejecuciones</text>
</g>
<!-- queryapi&#45;&gt;auditservice -->
<g id="edge3" class="edge">
<title>queryapi&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2363.67,-1291.39C2360.52,-1171.98 2354.93,-960.33 2351.64,-835.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2354.27,-835.99 2351.45,-828.56 2349.02,-836.13 2354.27,-835.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2359.76,-1047 2359.76,-1069.8 2473.94,-1069.8 2473.94,-1047 2359.76,-1047"/>
<text xml:space="preserve" text-anchor="start" x="2362.76" y="-1054.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta eventos</text>
</g>
<!-- scheduler&#45;&gt;processengine -->
<g id="edge4" class="edge">
<title>scheduler&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1577.81,-1291.27C1520.72,-1248.67 1452.3,-1197.63 1394.21,-1154.29"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1396.09,-1152.42 1388.51,-1150.04 1392.95,-1156.63 1396.09,-1152.42"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1494.91,-1208.4 1494.91,-1231.2 1696.23,-1231.2 1696.23,-1208.4 1494.91,-1208.4"/>
<text xml:space="preserve" text-anchor="start" x="1497.91" y="-1215.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispara procesos programados</text>
</g>
<!-- sourceregistry&#45;&gt;sourceproviders -->
<g id="edge12" class="edge">
<title>sourceregistry&#45;&gt;sourceproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M160.02,-645.67C160.02,-604.47 160.02,-555.36 160.02,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="162.65,-513.16 160.02,-505.66 157.4,-513.16 162.65,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="160.02,-562.8 160.02,-585.6 296.74,-585.6 296.74,-562.8 160.02,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="163.02" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- readerregistry&#45;&gt;readerproviders -->
<g id="edge13" class="edge">
<title>readerregistry&#45;&gt;readerproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M590.02,-645.67C590.02,-604.47 590.02,-555.36 590.02,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="592.65,-513.16 590.02,-505.66 587.4,-513.16 592.65,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="590.02,-562.8 590.02,-585.6 726.74,-585.6 726.74,-562.8 590.02,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="593.02" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskregistry&#45;&gt;taskproviders -->
<g id="edge14" class="edge">
<title>taskregistry&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1682.6,-645.67C1675.93,-604.47 1667.97,-555.36 1661.09,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1663.69,-512.6 1659.9,-505.62 1658.51,-513.44 1663.69,-512.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1672.58,-562.8 1672.58,-585.6 1809.3,-585.6 1809.3,-562.8 1672.58,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1675.58" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskproviders&#45;&gt;db -->
<g id="edge15" class="edge">
<title>taskproviders&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1690.81,-323C1708.48,-294.23 1730.57,-263.67 1755.81,-240 1784.74,-212.87 1819.52,-188.89 1854.29,-168.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1855.32,-170.96 1860.5,-164.94 1852.7,-166.42 1855.32,-170.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1755.81,-240 1755.81,-262.8 1940.02,-262.8 1940.02,-240 1755.81,-240"/>
<text xml:space="preserve" text-anchor="start" x="1758.81" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- taskproviders&#45;&gt;externalapi -->
<g id="edge16" class="edge">
<title>taskproviders&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1607.85,-322.91C1601.29,-303.44 1595.46,-282.69 1592.03,-262.8 1588.01,-239.5 1586.57,-214.16 1586.51,-190.27"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1589.13,-190.32 1586.55,-182.8 1583.88,-190.29 1589.13,-190.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1592.03,-240 1592.03,-262.8 1619.02,-262.8 1619.02,-240 1592.03,-240"/>
<text xml:space="preserve" text-anchor="start" x="1595.03" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- iam&#45;&gt;filesystem -->
<!-- filesystem&#45;&gt;ftp -->
<!-- ftp&#45;&gt;sftp -->
<!-- restsource&#45;&gt;otel -->
</g>
</svg>
`;case"engine":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3762pt" height="856pt"
 viewBox="0.00 0.00 3762.00 856.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 840.65)">
<!-- processexecutionservice -->
<g id="node1" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-825.6 1290,-825.6 1290,-645.6 1610.04,-645.6 1610.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1336.64" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- jsonconfigurationmapper -->
<g id="node2" class="node">
<title>jsonconfigurationmapper</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-502.8 1290,-502.8 1290,-322.8 1610.04,-322.8 1610.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1335.51" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">JsonConfigurationMapper</text>
</g>
<!-- sourceregistry -->
<g id="node3" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2900.04,-502.8 2580,-502.8 2580,-322.8 2900.04,-322.8 2900.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2628.87" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node4" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="47.75" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- taskregistry -->
<g id="node5" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-502.8 430,-502.8 430,-322.8 750.04,-322.8 750.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="488.88" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node6" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-502.8 2150,-502.8 2150,-322.8 2470.04,-322.8 2470.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2215" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- restcalltaskprovider -->
<g id="node7" class="node">
<title>restcalltaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-502.8 1720,-502.8 1720,-322.8 2040.04,-322.8 2040.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1783.33" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">RestCallTaskProvider</text>
</g>
<!-- notificationtaskprovider -->
<g id="node8" class="node">
<title>notificationtaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-502.8 860,-502.8 860,-322.8 1180.04,-322.8 1180.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="911.65" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">NotificationTaskProvider</text>
</g>
<!-- processcatalogservice -->
<g id="node9" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3280.04,-825.6 2960,-825.6 2960,-645.6 3280.04,-645.6 3280.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3016.08" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- db -->
<g id="node10" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3016.04,-180 2696,-180 2696,0 3016.04,0 3016.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2801.55" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node11" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-180 1290,-180 1290,0 1610.04,0 1610.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1387.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- auditservice -->
<g id="node12" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3732.04,-825.6 3412,-825.6 3412,-645.6 3732.04,-645.6 3732.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3513.1" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- telemetry -->
<g id="node13" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3732.04,-502.8 3412,-502.8 3412,-322.8 3732.04,-322.8 3732.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="3431.4" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- processexecutionservice&#45;&gt;jsonconfigurationmapper -->
<g id="edge1" class="edge">
<title>processexecutionservice&#45;&gt;jsonconfigurationmapper</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1450.02,-645.67C1450.02,-604.47 1450.02,-555.36 1450.02,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1452.65,-513.16 1450.02,-505.66 1447.4,-513.16 1452.65,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1450.02,-562.8 1450.02,-585.6 1607.77,-585.6 1607.77,-562.8 1450.02,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1453.02" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee configuracion JSON</text>
</g>
<!-- processexecutionservice&#45;&gt;sourceregistry -->
<g id="edge2" class="edge">
<title>processexecutionservice&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1609.9,-709.4C1821.94,-673.89 2206.53,-602.17 2525.02,-502.8 2539.95,-498.14 2555.28,-492.86 2570.55,-487.24"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2571.1,-489.84 2577.21,-484.76 2569.27,-484.92 2571.1,-489.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2293.24,-562.8 2293.24,-585.6 2457.99,-585.6 2457.99,-562.8 2293.24,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2296.24" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve SourceProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;readerregistry -->
<g id="edge3" class="edge">
<title>processexecutionservice&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1290.14,-709.4C1078.1,-673.89 693.51,-602.17 375.02,-502.8 360.09,-498.14 344.76,-492.86 329.49,-487.24"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.77,-484.92 322.83,-484.76 328.94,-489.84 330.77,-484.92"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="665.99,-562.8 665.99,-585.6 832.29,-585.6 832.29,-562.8 665.99,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="668.99" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve ReaderProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;taskregistry -->
<g id="edge4" class="edge">
<title>processexecutionservice&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1290.2,-679.54C1159.2,-633.83 969.29,-566.28 805.02,-502.8 790.2,-497.07 774.85,-491 759.5,-484.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="760.69,-482.48 752.75,-482.11 758.72,-487.35 760.69,-482.48"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1016.81,-562.8 1016.81,-585.6 1167.53,-585.6 1167.53,-562.8 1016.81,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1019.81" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve TaskProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;dbwritetaskprovider -->
<g id="edge5" class="edge">
<title>processexecutionservice&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1609.84,-679.54C1740.84,-633.83 1930.75,-566.28 2095.02,-502.8 2109.84,-497.07 2125.19,-491 2140.54,-484.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2141.32,-487.35 2147.29,-482.11 2139.35,-482.48 2141.32,-487.35"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1918.83,-562.8 1918.83,-585.6 2047.75,-585.6 2047.75,-562.8 1918.83,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1921.83" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta DB_WRITE</text>
</g>
<!-- processexecutionservice&#45;&gt;restcalltaskprovider -->
<g id="edge6" class="edge">
<title>processexecutionservice&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1569.23,-645.67C1626.32,-603.07 1694.74,-552.03 1752.83,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1754.09,-511.03 1758.53,-504.44 1750.95,-506.82 1754.09,-511.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1677.91,-562.8 1677.91,-585.6 1814.64,-585.6 1814.64,-562.8 1677.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1680.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta REST_CALL</text>
</g>
<!-- processexecutionservice&#45;&gt;notificationtaskprovider -->
<g id="edge7" class="edge">
<title>processexecutionservice&#45;&gt;notificationtaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1330.81,-645.67C1273.72,-603.07 1205.3,-552.03 1147.21,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1149.09,-506.82 1141.51,-504.44 1145.95,-511.03 1149.09,-506.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1247.91,-562.8 1247.91,-585.6 1403.27,-585.6 1403.27,-562.8 1247.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1250.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta NOTIFICATION</text>
</g>
<!-- dbwritetaskprovider&#45;&gt;db -->
<g id="edge9" class="edge">
<title>dbwritetaskprovider&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2461.39,-322.87C2534.32,-280.01 2621.82,-228.6 2695.87,-185.1"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2697.09,-187.43 2702.22,-181.36 2694.43,-182.9 2697.09,-187.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2599.39,-240 2599.39,-262.8 2783.6,-262.8 2783.6,-240 2599.39,-240"/>
<text xml:space="preserve" text-anchor="start" x="2602.39" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- restcalltaskprovider&#45;&gt;externalapi -->
<g id="edge10" class="edge">
<title>restcalltaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1760.81,-322.87C1703.72,-280.27 1635.3,-229.23 1577.21,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1579.09,-184.02 1571.51,-181.64 1575.95,-188.23 1579.09,-184.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1677.91,-240 1677.91,-262.8 1778.86,-262.8 1778.86,-240 1677.91,-240"/>
<text xml:space="preserve" text-anchor="start" x="1680.91" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Envia payloads</text>
</g>
<!-- notificationtaskprovider&#45;&gt;externalapi -->
<g id="edge11" class="edge">
<title>notificationtaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1139.23,-322.87C1196.32,-280.27 1264.74,-229.23 1322.83,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1324.09,-188.23 1328.53,-181.64 1320.95,-184.02 1324.09,-188.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1247.91,-240 1247.91,-262.8 1412.66,-262.8 1412.66,-240 1247.91,-240"/>
<text xml:space="preserve" text-anchor="start" x="1250.91" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Webhook y notificaciones</text>
</g>
<!-- processcatalogservice&#45;&gt;db -->
<g id="edge8" class="edge">
<title>processcatalogservice&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3085.03,-645.6C3052.02,-562.04 3000.89,-433.64 2955.02,-322.8 2936.86,-278.91 2916.3,-230.57 2898.64,-189.44"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2901.14,-188.6 2895.77,-182.74 2896.31,-190.67 2901.14,-188.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3026.39,-401.4 3026.39,-424.2 3208.24,-424.2 3208.24,-401.4 3026.39,-401.4"/>
<text xml:space="preserve" text-anchor="start" x="3029.39" y="-408.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones y tasks</text>
</g>
<!-- auditservice&#45;&gt;telemetry -->
</g>
</svg>
`;case"security":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1632pt" height="2122pt"
 viewBox="0.00 0.00 1632.00 2122.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2106.65)">
<g id="clust1" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="8,-593 8,-1197 1268,-1197 1268,-593 8,-593"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1184.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="334,-261 334,-542.2 1594,-542.2 1594,-261 334,-261"/>
<text xml:space="preserve" text-anchor="start" x="342" y="-529.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">QUARKUS NATIVE APP</text>
</g>
<!-- reactapp -->
<g id="node1" class="node">
<title>reactapp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-1135.8 477.98,-1135.8 477.98,-955.8 798.02,-955.8 798.02,-1135.8"/>
<text xml:space="preserve" text-anchor="start" x="542.13" y="-1039.8" font-family="Arial" font-size="20.00" fill="#eff6ff">React + PatternFly UI</text>
</g>
<!-- oidcclient -->
<g id="node2" class="node">
<title>oidcclient</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="368.02,-813 47.98,-813 47.98,-633 368.02,-633 368.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="154.66" y="-717" font-family="Arial" font-size="20.00" fill="#eff6ff">OIDC Client</text>
</g>
<!-- processdesigner -->
<g id="node3" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-813 907.98,-813 907.98,-633 1228.02,-633 1228.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="989.08" y="-717" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node4" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-813 477.98,-813 477.98,-633 798.02,-633 798.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="549.62" y="-717" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- adminapi -->
<g id="node5" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1554.02,-481 1233.98,-481 1233.98,-301 1554.02,-301 1554.02,-481"/>
<text xml:space="preserve" text-anchor="start" x="1346.76" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- executionapi -->
<g id="node6" class="node">
<title>executionapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="694.02,-481 373.98,-481 373.98,-301 694.02,-301 694.02,-481"/>
<text xml:space="preserve" text-anchor="start" x="471.19" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Execution API</text>
</g>
<!-- queryapi -->
<g id="node7" class="node">
<title>queryapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1124.02,-481 803.98,-481 803.98,-301 1124.02,-301 1124.02,-481"/>
<text xml:space="preserve" text-anchor="start" x="917.87" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Query API</text>
</g>
<!-- user -->
<g id="node8" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="961.02,-2091.6 640.98,-2091.6 640.98,-1911.6 961.02,-1911.6 961.02,-2091.6"/>
<text xml:space="preserve" text-anchor="start" x="714.83" y="-1995.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- loadbalancer -->
<g id="node9" class="node">
<title>loadbalancer</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="1176.02,-1768.8 855.98,-1768.8 855.98,-1588.8 1176.02,-1588.8 1176.02,-1768.8"/>
<text xml:space="preserve" text-anchor="start" x="877.6" y="-1672.8" font-family="Arial" font-size="20.00" fill="#fafafa">Load Balancer / Reverse Proxy</text>
</g>
<!-- admin -->
<g id="node10" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1391.02,-2091.6 1070.98,-2091.6 1070.98,-1911.6 1391.02,-1911.6 1391.02,-2091.6"/>
<text xml:space="preserve" text-anchor="start" x="1093.15" y="-1995.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- ingresscontroller -->
<g id="node11" class="node">
<title>ingresscontroller</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="1176.02,-1446 855.98,-1446 855.98,-1266 1176.02,-1266 1176.02,-1446"/>
<text xml:space="preserve" text-anchor="start" x="937.08" y="-1350" font-family="Arial" font-size="20.00" fill="#fafafa">Ingress Controller</text>
</g>
<!-- iam -->
<g id="node12" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="1124.02,-180 803.98,-180 803.98,0 1124.02,0 1124.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="923.42" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- reactapp&#45;&gt;oidcclient -->
<g id="edge6" class="edge">
<title>reactapp&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M518.79,-955.87C461.7,-913.27 393.28,-862.23 335.19,-818.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="337.07,-817.02 329.49,-814.64 333.93,-821.23 337.07,-817.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="435.89,-873 435.89,-895.8 542.29,-895.8 542.29,-873 435.89,-873"/>
<text xml:space="preserve" text-anchor="start" x="438.89" y="-880.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Gestiona sesion</text>
</g>
<!-- reactapp&#45;&gt;processdesigner -->
<g id="edge7" class="edge">
<title>reactapp&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M757.21,-955.87C814.3,-913.27 882.72,-862.23 940.81,-818.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="942.07,-821.23 946.51,-814.64 938.93,-817.02 942.07,-821.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="865.89,-873 865.89,-895.8 962.95,-895.8 962.95,-873 865.89,-873"/>
<text xml:space="preserve" text-anchor="start" x="868.89" y="-880.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Edita pipelines</text>
</g>
<!-- reactapp&#45;&gt;operationsconsole -->
<g id="edge8" class="edge">
<title>reactapp&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M638,-955.87C638,-914.67 638,-865.56 638,-823.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="640.63,-823.36 638,-815.86 635.38,-823.36 640.63,-823.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="638,-873 638,-895.8 777.08,-895.8 777.08,-873 638,-873"/>
<text xml:space="preserve" text-anchor="start" x="641" y="-880.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones</text>
</g>
<!-- oidcclient&#45;&gt;iam -->
<g id="edge9" class="edge">
<title>oidcclient&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M167.62,-633.22C128.2,-531.66 85.44,-365.91 170.26,-261 247.13,-165.91 584.51,-121.62 793.9,-102.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="793.82,-105.6 801.06,-102.32 793.36,-100.37 793.82,-105.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="170.26,-379.6 170.26,-402.4 307,-402.4 307,-379.6 170.26,-379.6"/>
<text xml:space="preserve" text-anchor="start" x="173.26" y="-386.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Login y refresh token</text>
</g>
<!-- processdesigner&#45;&gt;adminapi -->
<g id="edge10" class="edge">
<title>processdesigner&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1069.57,-633.24C1074.74,-602.73 1086.12,-571.03 1109.69,-550.2 1121.31,-539.93 1164.5,-547.7 1179,-542.2 1214.37,-528.79 1249.43,-508.27 1280.65,-486.66"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1281.82,-489.04 1286.45,-482.58 1278.8,-484.75 1281.82,-489.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1109.69,-550.2 1109.69,-573 1311,-573 1311,-550.2 1109.69,-550.2"/>
<text xml:space="preserve" text-anchor="start" x="1112.69" y="-557.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de catalogos y procesos</text>
</g>
<!-- operationsconsole&#45;&gt;executionapi -->
<g id="edge11" class="edge">
<title>operationsconsole&#45;&gt;executionapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M578.26,-633.09C567.78,-613.96 558.15,-593.35 551.61,-573 543.29,-547.15 538.58,-518.24 535.98,-491.24"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="538.62,-491.25 535.35,-484.01 533.39,-491.71 538.62,-491.25"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="551.61,-550.2 551.61,-573 665,-573 665,-550.2 551.61,-550.2"/>
<text xml:space="preserve" text-anchor="start" x="554.61" y="-557.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- operationsconsole&#45;&gt;queryapi -->
<g id="edge12" class="edge">
<title>operationsconsole&#45;&gt;queryapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M725.79,-633.13C770.1,-588.28 823.9,-533.82 869.15,-488.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="870.8,-490.07 874.21,-482.89 867.07,-486.38 870.8,-490.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="801,-550.2 801,-573 960.31,-573 960.31,-550.2 801,-550.2"/>
<text xml:space="preserve" text-anchor="start" x="804" y="-557.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta jobs y auditoria</text>
</g>
<!-- queryapi&#45;&gt;iam -->
<g id="edge13" class="edge">
<title>queryapi&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M964,-261C964,-237.31 964,-212.93 964,-190.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="966.63,-190.34 964,-182.84 961.38,-190.34 966.63,-190.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="826.48,-220.25 826.48,-243.05 964,-243.05 964,-220.25 826.48,-220.25"/>
<text xml:space="preserve" text-anchor="start" x="829.48" y="-227.45" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- user&#45;&gt;loadbalancer -->
<g id="edge1" class="edge">
<title>user&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M860.6,-1911.67C888.57,-1869.94 921.96,-1820.11 950.62,-1777.36"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="952.79,-1778.84 954.78,-1771.14 948.43,-1775.91 952.79,-1778.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="914.95,-1828.8 914.95,-1851.6 1041.55,-1851.6 1041.55,-1828.8 914.95,-1828.8"/>
<text xml:space="preserve" text-anchor="start" x="917.95" y="-1836" font-family="Arial" font-size="14.00" fill="#c9c9c9">Accede por HTTPS</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge3" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1016,-1588.87C1016,-1547.67 1016,-1498.56 1016,-1456.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1018.63,-1456.36 1016,-1448.86 1013.38,-1456.36 1018.63,-1456.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1016,-1506 1016,-1528.8 1175.29,-1528.8 1175.29,-1506 1016,-1506"/>
<text xml:space="preserve" text-anchor="start" x="1019" y="-1513.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvia trafico al cluster</text>
</g>
<!-- admin&#45;&gt;loadbalancer -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1171.4,-1911.67C1143.43,-1869.94 1110.04,-1820.11 1081.38,-1777.36"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1083.57,-1775.91 1077.22,-1771.14 1079.21,-1778.84 1083.57,-1775.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1129.95,-1828.8 1129.95,-1851.6 1275.98,-1851.6 1275.98,-1828.8 1129.95,-1828.8"/>
<text xml:space="preserve" text-anchor="start" x="1132.95" y="-1836" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra por HTTPS</text>
</g>
<!-- ingresscontroller&#45;&gt;reactapp -->
<g id="edge4" class="edge">
<title>ingresscontroller&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M906.92,-1266.06C882.85,-1246.43 856.65,-1225.08 830.37,-1203.65"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="832.03,-1201.62 824.56,-1198.91 828.71,-1205.69 832.03,-1201.62"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="687.94,-1231.35 687.94,-1254.15 864.34,-1254.15 864.34,-1231.35 687.94,-1231.35"/>
<text xml:space="preserve" text-anchor="start" x="690.94" y="-1238.55" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- ingresscontroller&#45;&gt;adminapi -->
<g id="edge5" class="edge">
<title>ingresscontroller&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1175.95,-1296.95C1221.32,-1272.84 1266.17,-1240.16 1295,-1197 1423.85,-1004.12 1427.87,-726.14 1414.35,-552.45"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1416.99,-552.48 1413.77,-545.22 1411.76,-552.9 1416.99,-552.48"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1219.54,-939.93 1219.54,-962.73 1395.94,-962.73 1395.94,-939.93 1219.54,-939.93"/>
<text xml:space="preserve" text-anchor="start" x="1222.54" y="-947.13" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
</g>
</svg>
`;case"ingestion":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2497pt" height="1158pt"
 viewBox="0.00 0.00 2497.00 1158.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1142.85)">
<g id="clust1" class="cluster">
<title>cluster_taskproviders</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="825.02,-591.8 825.02,-857 1209.02,-857 1209.02,-591.8 825.02,-591.8"/>
<text xml:space="preserve" text-anchor="start" x="833.02" y="-844.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">TASK PROVIDERS</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node1" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1177.04,-803.8 857,-803.8 857,-623.8 1177.04,-623.8 1177.04,-803.8"/>
<text xml:space="preserve" text-anchor="start" x="922" y="-707.8" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- processengine -->
<g id="node2" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1177.04,-1127.8 857,-1127.8 857,-947.8 1177.04,-947.8 1177.04,-1127.8"/>
<text xml:space="preserve" text-anchor="start" x="946.98" y="-1031.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- sourceregistry -->
<g id="node3" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="345.04,-803.8 25,-803.8 25,-623.8 345.04,-623.8 345.04,-803.8"/>
<text xml:space="preserve" text-anchor="start" x="73.87" y="-707.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node4" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2037.04,-803.8 1717,-803.8 1717,-623.8 2037.04,-623.8 2037.04,-803.8"/>
<text xml:space="preserve" text-anchor="start" x="1764.75" y="-707.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- taskregistry -->
<g id="node5" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1607.04,-803.8 1287,-803.8 1287,-623.8 1607.04,-623.8 1607.04,-803.8"/>
<text xml:space="preserve" text-anchor="start" x="1345.88" y="-707.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="750.04,-481 430,-481 430,-301 750.04,-301 750.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="535.55" y="-385" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- sourceproviders -->
<g id="node7" class="node">
<title>sourceproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-481 0,-481 0,-301 320.04,-301 320.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="83.32" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Providers</text>
</g>
<!-- readerproviders -->
<g id="node8" class="node">
<title>readerproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2037.04,-481 1717,-481 1717,-301 2037.04,-301 2037.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="1799.21" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Providers</text>
</g>
<!-- filesystem -->
<g id="node9" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2467.04,-1127.8 2147,-1127.8 2147,-947.8 2467.04,-947.8 2467.04,-1127.8"/>
<text xml:space="preserve" text-anchor="start" x="2254.79" y="-1031.8" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node10" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2467.04,-803.8 2147,-803.8 2147,-623.8 2467.04,-623.8 2467.04,-803.8"/>
<text xml:space="preserve" text-anchor="start" x="2288.13" y="-707.8" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node11" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2467.04,-481 2147,-481 2147,-301 2467.04,-301 2467.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="2281.46" y="-385" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node12" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2467.04,-180 2147,-180 2147,0 2467.04,0 2467.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2245.89" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- dbwritetaskprovider&#45;&gt;db -->
<g id="edge8" class="edge">
<title>dbwritetaskprovider&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M898.64,-623.87C841.95,-581.27 774.01,-530.23 716.33,-486.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="718.25,-485.05 710.68,-482.65 715.1,-489.25 718.25,-485.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="816.32,-541 816.32,-563.8 1000.54,-563.8 1000.54,-541 816.32,-541"/>
<text xml:space="preserve" text-anchor="start" x="819.32" y="-548.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- processengine&#45;&gt;dbwritetaskprovider -->
<g id="edge4" class="edge">
<title>processengine&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1017.02,-947.96C1017.02,-906.43 1017.02,-856.82 1017.02,-814.06"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1019.65,-814.16 1017.02,-806.66 1014.4,-814.16 1019.65,-814.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1017.02,-865 1017.02,-887.8 1145.94,-887.8 1145.94,-865 1017.02,-865"/>
<text xml:space="preserve" text-anchor="start" x="1020.02" y="-872.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta DB_WRITE</text>
</g>
<!-- processengine&#45;&gt;sourceregistry -->
<g id="edge1" class="edge">
<title>processengine&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M857.08,-1022.5C722.16,-1005.24 527.22,-967.81 374.84,-887.8 337.36,-868.12 301.56,-839.23 271.37,-810.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="273.23,-808.83 266,-805.54 269.59,-812.62 273.23,-808.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="374.84,-865 374.84,-887.8 482.02,-887.8 482.02,-865 374.84,-865"/>
<text xml:space="preserve" text-anchor="start" x="377.84" y="-872.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve fuente</text>
</g>
<!-- processengine&#45;&gt;readerregistry -->
<g id="edge2" class="edge">
<title>processengine&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1176.94,-1006.8C1310.5,-978.35 1503.91,-929.15 1662.02,-857 1691.17,-843.7 1720.83,-826.72 1748.43,-809.15"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1749.5,-811.59 1754.39,-805.32 1746.66,-807.17 1749.5,-811.59"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1629.06,-865 1629.06,-887.8 1737.79,-887.8 1737.79,-865 1629.06,-865"/>
<text xml:space="preserve" text-anchor="start" x="1632.06" y="-872.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve reader</text>
</g>
<!-- processengine&#45;&gt;taskregistry -->
<g id="edge3" class="edge">
<title>processengine&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1135.66,-947.96C1193,-905.02 1261.86,-853.45 1320.23,-809.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1321.54,-812.04 1325.97,-805.44 1318.4,-807.84 1321.54,-812.04"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1244.91,-865 1244.91,-887.8 1345.08,-887.8 1345.08,-865 1244.91,-865"/>
<text xml:space="preserve" text-anchor="start" x="1247.91" y="-872.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve tarea</text>
</g>
<!-- processengine&#45;&gt;db -->
<g id="edge5" class="edge">
<title>processengine&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M857.08,-1006.93C770.94,-982.03 671.29,-937.12 616.17,-857 542.06,-749.29 551.13,-592.13 567.88,-490.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="570.44,-491.56 569.12,-483.73 565.27,-490.67 570.44,-491.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="616.17,-702.4 616.17,-725.2 798.02,-725.2 798.02,-702.4 616.17,-702.4"/>
<text xml:space="preserve" text-anchor="start" x="619.17" y="-709.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones y tasks</text>
</g>
<!-- sourceregistry&#45;&gt;sourceproviders -->
<g id="edge6" class="edge">
<title>sourceregistry&#45;&gt;sourceproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M178.09,-623.87C174.88,-582.67 171.05,-533.56 167.75,-491.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="170.38,-491.12 167.18,-483.85 165.14,-491.53 170.38,-491.12"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="173.27,-541 173.27,-563.8 309.99,-563.8 309.99,-541 173.27,-541"/>
<text xml:space="preserve" text-anchor="start" x="176.27" y="-548.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- readerregistry&#45;&gt;readerproviders -->
<g id="edge7" class="edge">
<title>readerregistry&#45;&gt;readerproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1877.02,-623.87C1877.02,-582.67 1877.02,-533.56 1877.02,-491.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1879.65,-491.36 1877.02,-483.86 1874.4,-491.36 1879.65,-491.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1877.02,-541 1877.02,-563.8 2013.74,-563.8 2013.74,-541 1877.02,-541"/>
<text xml:space="preserve" text-anchor="start" x="1880.02" y="-548.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- filesystem&#45;&gt;ftp -->
<!-- ftp&#45;&gt;sftp -->
<!-- sftp&#45;&gt;restsource -->
</g>
</svg>
`;case"observability":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1785pt" height="904pt"
 viewBox="0.00 0.00 1785.00 904.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 889.25)">
<g id="clust1" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="381.02,-601 381.02,-866.2 765.02,-866.2 765.02,-601 381.02,-601"/>
<text xml:space="preserve" text-anchor="start" x="389.02" y="-853.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="373.02,-261 373.02,-542.2 1747.02,-542.2 1747.02,-261 373.02,-261"/>
<text xml:space="preserve" text-anchor="start" x="381.02" y="-529.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">QUARKUS NATIVE APP</text>
</g>
<!-- operationsconsole -->
<g id="node1" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="733.04,-813 413,-813 413,-633 733.04,-633 733.04,-813"/>
<text xml:space="preserve" text-anchor="start" x="484.64" y="-717" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- queryapi -->
<g id="node2" class="node">
<title>queryapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="733.04,-481 413,-481 413,-301 733.04,-301 733.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="526.89" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Query API</text>
</g>
<!-- telemetry -->
<g id="node3" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1707.04,-481 1387,-481 1387,-301 1707.04,-301 1707.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="1406.4" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- auditservice -->
<g id="node4" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1277.04,-481 957,-481 957,-301 1277.04,-301 1277.04,-481"/>
<text xml:space="preserve" text-anchor="start" x="1058.1" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- otel -->
<g id="node5" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="48.87" y="-84" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node6" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="847.04,-180 527,-180 527,0 847.04,0 847.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="656.44" y="-84" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- db -->
<g id="node7" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1277.04,-180 957,-180 957,0 1277.04,0 1277.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1062.55" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- operationsconsole&#45;&gt;queryapi -->
<g id="edge1" class="edge">
<title>operationsconsole&#45;&gt;queryapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M573.02,-633.13C573.02,-589.3 573.02,-536.28 573.02,-491.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="575.65,-491.27 573.02,-483.77 570.4,-491.27 575.65,-491.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="573.02,-550.2 573.02,-573 732.33,-573 732.33,-550.2 573.02,-550.2"/>
<text xml:space="preserve" text-anchor="start" x="576.02" y="-557.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta jobs y auditoria</text>
</g>
<!-- queryapi&#45;&gt;auditservice -->
<g id="edge2" class="edge">
<title>queryapi&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M732.93,-391C800.16,-391 878.47,-391 946.78,-391"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="946.69,-393.63 954.19,-391 946.69,-388.38 946.69,-393.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="787.93,-394 787.93,-416.8 902.11,-416.8 902.11,-394 787.93,-394"/>
<text xml:space="preserve" text-anchor="start" x="790.93" y="-401.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta eventos</text>
</g>
<!-- auditservice&#45;&gt;otel -->
<g id="edge4" class="edge">
<title>auditservice&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M788.02,-261C650.05,-216.45 611.97,-217.89 472.02,-180 425.8,-167.49 375.87,-153.47 329.79,-140.33"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.56,-137.82 322.63,-138.28 329.12,-142.86 330.56,-137.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="464.79,-202.38 464.79,-225.18 561.05,-225.18 561.05,-202.38 464.79,-202.38"/>
<text xml:space="preserve" text-anchor="start" x="467.79" y="-209.58" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- auditservice&#45;&gt;db -->
<g id="edge5" class="edge">
<title>auditservice&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1117.02,-261C1117.02,-237.31 1117.02,-212.93 1117.02,-190.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1119.65,-190.34 1117.02,-182.84 1114.4,-190.34 1119.65,-190.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="878.34,-220.25 878.34,-259.85 1117.02,-259.85 1117.02,-220.25 878.34,-220.25"/>
<text xml:space="preserve" text-anchor="start" x="881.34" y="-244.25" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="881.34" y="-227.45" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge3" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.93,-90C382.19,-90 453.62,-90 516.83,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="516.79,-92.63 524.29,-90 516.79,-87.38 516.79,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="375,-93 375,-115.8 472.04,-115.8 472.04,-93 375,-93"/>
<text xml:space="preserve" text-anchor="start" x="378" y="-100.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
</g>
</svg>
`;case"runtime":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2950pt" height="1239pt"
 viewBox="0.00 0.00 2950.00 1239.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1224.25)">
<g id="clust1" class="cluster">
<title>cluster_processengine</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="868,-636 868,-938.4 2128,-938.4 2128,-636 868,-636"/>
<text xml:space="preserve" text-anchor="start" x="876" y="-925.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">PROCESS ENGINE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_taskproviders</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="8,-282.8 8,-585.2 1268,-585.2 1268,-282.8 8,-282.8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-572.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">TASK PROVIDERS</text>
</g>
<!-- processexecutionservice -->
<g id="node1" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-856 907.98,-856 907.98,-676 1228.02,-676 1228.02,-856"/>
<text xml:space="preserve" text-anchor="start" x="954.62" y="-760" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- processcatalogservice -->
<g id="node2" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1658.02,-856 1337.98,-856 1337.98,-676 1658.02,-676 1658.02,-856"/>
<text xml:space="preserve" text-anchor="start" x="1394.06" y="-760" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- jsonconfigurationmapper -->
<g id="node3" class="node">
<title>jsonconfigurationmapper</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2088.02,-856 1767.98,-856 1767.98,-676 2088.02,-676 2088.02,-856"/>
<text xml:space="preserve" text-anchor="start" x="1813.49" y="-760" font-family="Arial" font-size="20.00" fill="#eff6ff">JsonConfigurationMapper</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node4" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-502.8 907.98,-502.8 907.98,-322.8 1228.02,-322.8 1228.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="972.98" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- restcalltaskprovider -->
<g id="node5" class="node">
<title>restcalltaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-502.8 477.98,-502.8 477.98,-322.8 798.02,-322.8 798.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="541.31" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">RestCallTaskProvider</text>
</g>
<!-- notificationtaskprovider -->
<g id="node6" class="node">
<title>notificationtaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="368.02,-502.8 47.98,-502.8 47.98,-322.8 368.02,-322.8 368.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="99.63" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">NotificationTaskProvider</text>
</g>
<!-- scheduler -->
<g id="node7" class="node">
<title>scheduler</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="943.02,-1209.2 622.98,-1209.2 622.98,-1029.2 943.02,-1029.2 943.02,-1209.2"/>
<text xml:space="preserve" text-anchor="start" x="737.97" y="-1113.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Scheduler</text>
</g>
<!-- executionapi -->
<g id="node8" class="node">
<title>executionapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1373.02,-1209.2 1052.98,-1209.2 1052.98,-1029.2 1373.02,-1029.2 1373.02,-1209.2"/>
<text xml:space="preserve" text-anchor="start" x="1150.19" y="-1113.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Execution API</text>
</g>
<!-- taskregistry -->
<g id="node9" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1658.02,-502.8 1337.98,-502.8 1337.98,-322.8 1658.02,-322.8 1658.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1396.86" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- db -->
<g id="node10" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1774.02,-180 1453.98,-180 1453.98,0 1774.02,0 1774.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="1559.53" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- auditservice -->
<g id="node11" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2920.02,-502.8 2599.98,-502.8 2599.98,-322.8 2920.02,-322.8 2920.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2701.08" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- telemetry -->
<g id="node12" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2490.02,-502.8 2169.98,-502.8 2169.98,-322.8 2490.02,-322.8 2490.02,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2189.38" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- externalapi -->
<g id="node13" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="565.02,-180 244.98,-180 244.98,0 565.02,0 565.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="342.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- processexecutionservice&#45;&gt;jsonconfigurationmapper -->
<g id="edge3" class="edge">
<title>processexecutionservice&#45;&gt;jsonconfigurationmapper</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1158.28,-855.87C1194.06,-885.5 1237.51,-914.78 1283,-930.17 1373.52,-960.77 1622.48,-960.77 1713,-930.17 1755.11,-915.93 1795.48,-889.77 1829.63,-862.46"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1831.22,-864.55 1835.38,-857.78 1827.9,-860.48 1831.22,-864.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1419.12,-946.4 1419.12,-969.2 1576.88,-969.2 1576.88,-946.4 1419.12,-946.4"/>
<text xml:space="preserve" text-anchor="start" x="1422.12" y="-953.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee configuracion JSON</text>
</g>
<!-- processexecutionservice&#45;&gt;dbwritetaskprovider -->
<g id="edge5" class="edge">
<title>processexecutionservice&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1068,-676.38C1068,-626.66 1068,-564.51 1068,-513.15"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1070.63,-513.23 1068,-505.73 1065.38,-513.23 1070.63,-513.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1068,-593.2 1068,-616 1196.92,-616 1196.92,-593.2 1068,-593.2"/>
<text xml:space="preserve" text-anchor="start" x="1071" y="-600.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta DB_WRITE</text>
</g>
<!-- processexecutionservice&#45;&gt;restcalltaskprovider -->
<g id="edge6" class="edge">
<title>processexecutionservice&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M959.22,-676.15C896.82,-625.19 818.49,-561.21 754.8,-509.19"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="756.52,-507.21 749.05,-504.5 753.2,-511.28 756.52,-507.21"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="878.74,-593.2 878.74,-616 1015.48,-616 1015.48,-593.2 878.74,-593.2"/>
<text xml:space="preserve" text-anchor="start" x="881.74" y="-600.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta REST_CALL</text>
</g>
<!-- processexecutionservice&#45;&gt;notificationtaskprovider -->
<g id="edge7" class="edge">
<title>processexecutionservice&#45;&gt;notificationtaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M908.03,-738.93C773.35,-712.72 578.4,-664.62 423,-585.2 383.55,-565.04 344.45,-536.97 310.62,-509.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="312.38,-507.42 304.93,-504.68 309.04,-511.47 312.38,-507.42"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="488.55,-593.2 488.55,-616 643.91,-616 643.91,-593.2 488.55,-593.2"/>
<text xml:space="preserve" text-anchor="start" x="491.55" y="-600.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta NOTIFICATION</text>
</g>
<!-- processexecutionservice&#45;&gt;taskregistry -->
<g id="edge4" class="edge">
<title>processexecutionservice&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1181.71,-676.07C1218.1,-647.31 1258.42,-615.12 1295,-585.2 1324.74,-560.87 1356.63,-534.23 1386.11,-509.35"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1387.6,-511.53 1391.63,-504.68 1384.21,-507.51 1387.6,-511.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1282.92,-593.2 1282.92,-616 1433.65,-616 1433.65,-593.2 1282.92,-593.2"/>
<text xml:space="preserve" text-anchor="start" x="1285.92" y="-600.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve TaskProvider</text>
</g>
<!-- processcatalogservice&#45;&gt;db -->
<g id="edge8" class="edge">
<title>processcatalogservice&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1640.6,-676.18C1669.85,-650.67 1696.67,-620.14 1713,-585.2 1769.9,-463.44 1744.72,-413.4 1713,-282.8 1705.19,-250.62 1690.97,-217.81 1675.71,-188.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1678.21,-187.75 1672.37,-182.37 1673.58,-190.22 1678.21,-187.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1746.88,-401.4 1746.88,-424.2 1928.73,-424.2 1928.73,-401.4 1746.88,-401.4"/>
<text xml:space="preserve" text-anchor="start" x="1749.88" y="-408.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones y tasks</text>
</g>
<!-- jsonconfigurationmapper&#45;&gt;auditservice -->
<g id="edge9" class="edge">
<title>jsonconfigurationmapper&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2128,-727.48C2252.56,-699.17 2413.54,-653.35 2545,-585.2 2584.23,-564.86 2623.21,-536.81 2656.98,-509.3"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2658.54,-511.41 2662.66,-504.62 2655.2,-507.36 2658.54,-511.41"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2296.91,-645.4 2296.91,-668.2 2407.97,-668.2 2407.97,-645.4 2296.91,-645.4"/>
<text xml:space="preserve" text-anchor="start" x="2299.91" y="-652.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- jsonconfigurationmapper&#45;&gt;telemetry -->
<g id="edge10" class="edge">
<title>jsonconfigurationmapper&#45;&gt;telemetry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2075.66,-636C2123.56,-594.15 2175.82,-548.49 2220.44,-509.51"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2222.17,-511.49 2226.09,-504.58 2218.71,-507.54 2222.17,-511.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2074.57,-569.16 2074.57,-591.96 2152.17,-591.96 2152.17,-569.16 2074.57,-569.16"/>
<text xml:space="preserve" text-anchor="start" x="2077.57" y="-576.36" font-family="Arial" font-size="14.00" fill="#c9c9c9">Crea spans</text>
</g>
<!-- dbwritetaskprovider&#45;&gt;db -->
<g id="edge11" class="edge">
<title>dbwritetaskprovider&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1215.57,-322.85C1238.13,-309.38 1261.16,-295.68 1283,-282.8 1337.46,-250.68 1397.19,-215.93 1450.74,-184.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1451.83,-187.35 1457.01,-181.32 1449.2,-182.8 1451.83,-187.35"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1355.31,-240 1355.31,-262.8 1539.53,-262.8 1539.53,-240 1355.31,-240"/>
<text xml:space="preserve" text-anchor="start" x="1358.31" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert, update y upsert</text>
</g>
<!-- restcalltaskprovider&#45;&gt;externalapi -->
<g id="edge12" class="edge">
<title>restcalltaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M573.41,-322.87C543.04,-281.06 506.76,-231.11 475.66,-188.29"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="477.83,-186.8 471.3,-182.28 473.58,-189.89 477.83,-186.8"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="528.49,-240 528.49,-262.8 629.44,-262.8 629.44,-240 528.49,-240"/>
<text xml:space="preserve" text-anchor="start" x="531.49" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Envia payloads</text>
</g>
<!-- notificationtaskprovider&#45;&gt;externalapi -->
<g id="edge13" class="edge">
<title>notificationtaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M227.03,-322.83C235.16,-295.14 246.31,-265.27 261.25,-240 272.12,-221.62 285.68,-203.75 300.11,-187.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="301.77,-189.22 304.78,-181.86 297.84,-185.74 301.77,-189.22"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="261.25,-240 261.25,-262.8 426,-262.8 426,-240 261.25,-240"/>
<text xml:space="preserve" text-anchor="start" x="264.25" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Webhook y notificaciones</text>
</g>
<!-- scheduler&#45;&gt;processexecutionservice -->
<g id="edge1" class="edge">
<title>scheduler&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M854.92,-1029.58C875.58,-1004.12 898.88,-975.4 922.3,-946.54"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="924.32,-948.23 927,-940.75 920.24,-944.92 924.32,-948.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="690.79,-983.75 690.79,-1006.55 892.11,-1006.55 892.11,-983.75 690.79,-983.75"/>
<text xml:space="preserve" text-anchor="start" x="693.79" y="-990.95" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispara procesos programados</text>
</g>
<!-- executionapi&#45;&gt;processexecutionservice -->
<g id="edge2" class="edge">
<title>executionapi&#45;&gt;processexecutionservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1176.41,-1029.58C1166.08,-1004.56 1154.45,-976.38 1142.74,-948.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1145.21,-947.13 1139.92,-941.2 1140.36,-949.13 1145.21,-947.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1041.18,-984.24 1041.18,-1007.04 1157.69,-1007.04 1157.69,-984.24 1041.18,-984.24"/>
<text xml:space="preserve" text-anchor="start" x="1044.18" y="-991.44" font-family="Arial" font-size="14.00" fill="#c9c9c9">Inicia ejecuciones</text>
</g>
</g>
</svg>
`;case"access":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2877pt" height="1223pt"
 viewBox="0.00 0.00 2877.00 1223.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1208.05)">
<g id="clust1" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="797.02,-340 797.02,-944 2057.02,-944 2057.02,-340 797.02,-340"/>
<text xml:space="preserve" text-anchor="start" x="805.02" y="-931.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="866.02,-8 866.02,-289.2 2126.02,-289.2 2126.02,-8 866.02,-8"/>
<text xml:space="preserve" text-anchor="start" x="874.02" y="-276.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">QUARKUS NATIVE APP</text>
</g>
<!-- reactapp -->
<g id="node1" class="node">
<title>reactapp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1587.04,-882.8 1267,-882.8 1267,-702.8 1587.04,-702.8 1587.04,-882.8"/>
<text xml:space="preserve" text-anchor="start" x="1331.15" y="-786.8" font-family="Arial" font-size="20.00" fill="#eff6ff">React + PatternFly UI</text>
</g>
<!-- oidcclient -->
<g id="node2" class="node">
<title>oidcclient</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1587.04,-560 1267,-560 1267,-380 1587.04,-380 1587.04,-560"/>
<text xml:space="preserve" text-anchor="start" x="1373.68" y="-464" font-family="Arial" font-size="20.00" fill="#eff6ff">OIDC Client</text>
</g>
<!-- processdesigner -->
<g id="node3" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1157.04,-560 837,-560 837,-380 1157.04,-380 1157.04,-560"/>
<text xml:space="preserve" text-anchor="start" x="918.1" y="-464" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node4" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2017.04,-560 1697,-560 1697,-380 2017.04,-380 2017.04,-560"/>
<text xml:space="preserve" text-anchor="start" x="1768.64" y="-464" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- adminapi -->
<g id="node5" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1226.04,-228 906,-228 906,-48 1226.04,-48 1226.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1018.78" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- executionapi -->
<g id="node6" class="node">
<title>executionapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1656.04,-228 1336,-228 1336,-48 1656.04,-48 1656.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1433.21" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">Execution API</text>
</g>
<!-- queryapi -->
<g id="node7" class="node">
<title>queryapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2086.04,-228 1766,-228 1766,-48 2086.04,-48 2086.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="1879.89" y="-132" font-family="Arial" font-size="20.00" fill="#eff6ff">Query API</text>
</g>
<!-- platformadmin -->
<g id="node8" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-228 0,-228 0,-48 320.04,-48 320.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="91.67" y="-132" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- iam -->
<g id="node9" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="796.04,-228 476,-228 476,-48 796.04,-48 796.04,-228"/>
<text xml:space="preserve" text-anchor="start" x="595.44" y="-132" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- integrationadmin -->
<g id="node10" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="757.04,-882.8 437,-882.8 437,-702.8 757.04,-702.8 757.04,-882.8"/>
<text xml:space="preserve" text-anchor="start" x="518.64" y="-786.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node11" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2417.04,-882.8 2097,-882.8 2097,-702.8 2417.04,-702.8 2417.04,-882.8"/>
<text xml:space="preserve" text-anchor="start" x="2217.56" y="-786.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node12" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2847.04,-882.8 2527,-882.8 2527,-702.8 2847.04,-702.8 2847.04,-882.8"/>
<text xml:space="preserve" text-anchor="start" x="2655.34" y="-786.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- user -->
<g id="node13" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1372.04,-1193 1052,-1193 1052,-1013 1372.04,-1013 1372.04,-1193"/>
<text xml:space="preserve" text-anchor="start" x="1125.85" y="-1097" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node14" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1802.04,-1193 1482,-1193 1482,-1013 1802.04,-1013 1802.04,-1193"/>
<text xml:space="preserve" text-anchor="start" x="1504.17" y="-1097" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- reactapp&#45;&gt;oidcclient -->
<g id="edge7" class="edge">
<title>reactapp&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1427.02,-702.87C1427.02,-661.67 1427.02,-612.56 1427.02,-570.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1429.65,-570.36 1427.02,-562.86 1424.4,-570.36 1429.65,-570.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1427.02,-620 1427.02,-642.8 1533.41,-642.8 1533.41,-620 1427.02,-620"/>
<text xml:space="preserve" text-anchor="start" x="1430.02" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Gestiona sesion</text>
</g>
<!-- reactapp&#45;&gt;processdesigner -->
<g id="edge8" class="edge">
<title>reactapp&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1307.81,-702.87C1250.72,-660.27 1182.3,-609.23 1124.21,-565.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1126.09,-564.02 1118.51,-561.64 1122.95,-568.23 1126.09,-564.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1224.91,-620 1224.91,-642.8 1321.97,-642.8 1321.97,-620 1224.91,-620"/>
<text xml:space="preserve" text-anchor="start" x="1227.91" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Edita pipelines</text>
</g>
<!-- reactapp&#45;&gt;operationsconsole -->
<g id="edge9" class="edge">
<title>reactapp&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1546.23,-702.87C1603.32,-660.27 1671.74,-609.23 1729.83,-565.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1731.09,-568.23 1735.53,-561.64 1727.95,-564.02 1731.09,-568.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1654.91,-620 1654.91,-642.8 1794,-642.8 1794,-620 1654.91,-620"/>
<text xml:space="preserve" text-anchor="start" x="1657.91" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones</text>
</g>
<!-- oidcclient&#45;&gt;iam -->
<g id="edge10" class="edge">
<title>oidcclient&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1364.65,-380.15C1336.72,-347.83 1300.85,-314.91 1260.02,-297.2 1217.1,-278.58 883.31,-304.27 839.02,-289.2 803.64,-277.16 769.32,-256.49 739.27,-234.27"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="740.9,-232.2 733.33,-229.78 737.74,-236.4 740.9,-232.2"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1299.27,-297.2 1299.27,-320 1436.01,-320 1436.01,-297.2 1299.27,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="1302.27" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Login y refresh token</text>
</g>
<!-- processdesigner&#45;&gt;adminapi -->
<g id="edge11" class="edge">
<title>processdesigner&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1015.6,-380.13C1024.79,-336.21 1035.9,-283.06 1045.35,-237.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1047.88,-238.58 1046.85,-230.7 1042.74,-237.51 1047.88,-238.58"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1031.52,-297.2 1031.52,-320 1232.83,-320 1232.83,-297.2 1031.52,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="1034.52" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de catalogos y procesos</text>
</g>
<!-- operationsconsole&#45;&gt;executionapi -->
<g id="edge12" class="edge">
<title>operationsconsole&#45;&gt;executionapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1759.8,-380.13C1710.64,-335.19 1650.92,-280.6 1600.75,-234.73"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1602.64,-232.91 1595.33,-229.78 1599.1,-236.78 1602.64,-232.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1687.34,-297.2 1687.34,-320 1800.74,-320 1800.74,-297.2 1687.34,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="1690.34" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- operationsconsole&#45;&gt;queryapi -->
<g id="edge13" class="edge">
<title>operationsconsole&#45;&gt;queryapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1875.6,-380.13C1884.79,-336.21 1895.9,-283.06 1905.35,-237.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1907.88,-238.58 1906.85,-230.7 1902.74,-237.51 1907.88,-238.58"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1891.52,-297.2 1891.52,-320 2050.83,-320 2050.83,-297.2 1891.52,-297.2"/>
<text xml:space="preserve" text-anchor="start" x="1894.52" y="-304.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta jobs y auditoria</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge1" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.85,-138C366.77,-138 418.26,-138 465.81,-138"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="465.68,-140.63 473.18,-138 465.68,-135.38 465.68,-140.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="374.79,-141 374.79,-163.8 421.25,-163.8 421.25,-141 374.79,-141"/>
<text xml:space="preserve" text-anchor="start" x="377.79" y="-148.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge2" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M707.91,-702.87C760.91,-660.36 824.4,-609.44 878.37,-566.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="879.69,-568.46 883.9,-561.72 876.41,-564.37 879.69,-568.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="809.01,-620 809.01,-642.8 951.94,-642.8 951.94,-620 809.01,-620"/>
<text xml:space="preserve" text-anchor="start" x="812.01" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;01, UC&#45;02, UC&#45;03</text>
</g>
<!-- operator&#45;&gt;operationsconsole -->
<g id="edge3" class="edge">
<title>operator&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2146.13,-702.87C2093.13,-660.36 2029.64,-609.44 1975.67,-566.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1977.63,-564.37 1970.14,-561.72 1974.35,-568.46 1977.63,-564.37"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2069.01,-620 2069.01,-642.8 2211.94,-642.8 2211.94,-620 2069.01,-620"/>
<text xml:space="preserve" text-anchor="start" x="2072.01" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;04, UC&#45;06, UC&#45;08</text>
</g>
<!-- auditor&#45;&gt;operationsconsole -->
<g id="edge4" class="edge">
<title>auditor&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2527.28,-725.01C2508.69,-717.43 2489.96,-709.89 2472.02,-702.8 2322.06,-643.52 2150.26,-579.05 2026.42,-533.19"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2027.62,-530.83 2019.68,-530.69 2025.8,-535.76 2027.62,-530.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2303.75,-620 2303.75,-642.8 2398.44,-642.8 2398.44,-620 2303.75,-620"/>
<text xml:space="preserve" text-anchor="start" x="2306.75" y="-627.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;06, UC&#45;07</text>
</g>
<!-- user&#45;&gt;reactapp -->
<g id="edge5" class="edge">
<title>user&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1273.92,-1013.27C1287.23,-994.18 1301.69,-973.46 1316.23,-952.61"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1318.37,-954.13 1320.51,-946.48 1314.07,-951.13 1318.37,-954.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1111.74,-978.34 1111.74,-1001.14 1298.29,-1001.14 1298.29,-978.34 1111.74,-978.34"/>
<text xml:space="preserve" text-anchor="start" x="1114.74" y="-985.54" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;reactapp -->
<g id="edge6" class="edge">
<title>admin&#45;&gt;reactapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1580.12,-1013.27C1566.81,-994.18 1552.35,-973.46 1537.81,-952.61"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1539.97,-951.13 1533.53,-946.48 1535.67,-954.13 1539.97,-951.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1312.4,-978.34 1312.4,-1001.14 1555.75,-1001.14 1555.75,-978.34 1312.4,-978.34"/>
<text xml:space="preserve" text-anchor="start" x="1315.4" y="-985.54" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
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
<text xml:space="preserve" text-anchor="start" x="650.19" y="-1264.8" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="878.02,-1028 557.98,-1028 557.98,-848 878.02,-848 878.02,-1028"/>
<text xml:space="preserve" text-anchor="start" x="628.51" y="-932" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
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
<svg width="1430pt" height="1523pt"
 viewBox="0.00 0.00 1430.00 1523.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1508.25)">
<g id="clust1" class="cluster">
<title>cluster_app</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="476,-766 476,-1485.2 960,-1485.2 960,-766 476,-766"/>
<text xml:space="preserve" text-anchor="start" x="484" y="-1472.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">APP</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_prenode1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="508,-798 508,-1432 928,-1432 928,-798 508,-798"/>
<text xml:space="preserve" text-anchor="start" x="516" y="-1419.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">PRENODE1</text>
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
<text xml:space="preserve" text-anchor="start" x="650.19" y="-1264.8" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="878.02,-1028 557.98,-1028 557.98,-848 878.02,-848 878.02,-1028"/>
<text xml:space="preserve" text-anchor="start" x="628.51" y="-932" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
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
`;case"deployment_prod":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3767pt" height="2555pt"
 viewBox="0.00 0.00 3767.00 2555.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2540.05)">
<g id="clust1" class="cluster">
<title>cluster_edge</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="1441.48,-2166.6 1441.48,-2517 1889.48,-2517 1889.48,-2166.6 1441.48,-2166.6"/>
<text xml:space="preserve" text-anchor="start" x="1449.48" y="-2504.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">EDGE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_loadbalancer</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1473.48,-2198.6 1473.48,-2463.8 1857.48,-2463.8 1857.48,-2198.6 1473.48,-2198.6"/>
<text xml:space="preserve" text-anchor="start" x="1481.48" y="-2450.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">LOADBALANCER</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_services</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="2794.48,-1288 2794.48,-1674.4 3728.48,-1674.4 3728.48,-1288 2794.48,-1288"/>
<text xml:space="preserve" text-anchor="start" x="2802.48" y="-1661.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">SERVICES</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_servicesnode</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="2826.48,-1320 2826.48,-1621.2 3696.48,-1621.2 3696.48,-1320 2826.48,-1320"/>
<text xml:space="preserve" text-anchor="start" x="2834.48" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">SERVICESNODE</text>
</g>
<g id="clust5" class="cluster">
<title>cluster_app</title>
<polygon fill="#393939" stroke="#292929" points="848.48,-880.2 848.48,-2127.8 2704.48,-2127.8 2704.48,-880.2 848.48,-880.2"/>
<text xml:space="preserve" text-anchor="start" x="856.48" y="-2114.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">APP</text>
</g>
<g id="clust6" class="cluster">
<title>cluster_appcluster</title>
<polygon fill="#1a468d" stroke="#1c3979" points="880.48,-912.2 880.48,-2074.6 2672.48,-2074.6 2672.48,-912.2 880.48,-912.2"/>
<text xml:space="preserve" text-anchor="start" x="888.48" y="-2061.7" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">APPCLUSTER</text>
</g>
<g id="clust7" class="cluster">
<title>cluster_ingresscontroller</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1473.48,-1738.2 1473.48,-2003.4 1857.48,-2003.4 1857.48,-1738.2 1473.48,-1738.2"/>
<text xml:space="preserve" text-anchor="start" x="1481.48" y="-1990.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">INGRESSCONTROLLER</text>
</g>
<g id="clust8" class="cluster">
<title>cluster_prodnode1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1816.48,-962.2 1816.48,-1621.2 2236.48,-1621.2 2236.48,-962.2 1816.48,-962.2"/>
<text xml:space="preserve" text-anchor="start" x="1824.48" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">PRODNODE1</text>
</g>
<g id="clust9" class="cluster">
<title>cluster_prodnode2</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="930.48,-962.2 930.48,-1621.2 1350.48,-1621.2 1350.48,-962.2 930.48,-962.2"/>
<text xml:space="preserve" text-anchor="start" x="938.48" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">PRODNODE2</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1825.5,-2410.6 1505.46,-2410.6 1505.46,-2230.6 1825.5,-2230.6 1825.5,-2410.6"/>
<text xml:space="preserve" text-anchor="start" x="1527.07" y="-2314.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Load Balancer / Reverse Proxy</text>
</g>
<!-- vault -->
<g id="node2" class="node">
<title>vault</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3196.5,-1550 2876.46,-1550 2876.46,-1370 3196.5,-1370 3196.5,-1550"/>
<text xml:space="preserve" text-anchor="start" x="2919.2" y="-1454" font-family="Arial" font-size="20.00" fill="#eff6ff">Secrets / Vault corporativo</text>
</g>
<!-- sharedstorage -->
<g id="node3" class="node">
<title>sharedstorage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3646.5,-1550 3326.46,-1550 3326.46,-1370 3646.5,-1370 3646.5,-1550"/>
<text xml:space="preserve" text-anchor="start" x="3397.54" y="-1454" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared File Storage</text>
</g>
<!-- ingresscontroller -->
<g id="node4" class="node">
<title>ingresscontroller</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1825.5,-1950.2 1505.46,-1950.2 1505.46,-1770.2 1825.5,-1770.2 1825.5,-1950.2"/>
<text xml:space="preserve" text-anchor="start" x="1586.56" y="-1854.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Ingress Controller</text>
</g>
<!-- adminconsole -->
<g id="node5" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2186.5,-1550 1866.46,-1550 1866.46,-1370 2186.5,-1370 2186.5,-1550"/>
<text xml:space="preserve" text-anchor="start" x="1958.66" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- adminconsole_1 -->
<g id="node6" class="node">
<title>adminconsole_1</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1300.5,-1550 980.46,-1550 980.46,-1370 1300.5,-1370 1300.5,-1550"/>
<text xml:space="preserve" text-anchor="start" x="1072.66" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node7" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2186.5,-1192.2 1866.46,-1192.2 1866.46,-1012.2 2186.5,-1012.2 2186.5,-1192.2"/>
<text xml:space="preserve" text-anchor="start" x="1936.99" y="-1096.2" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- quarkusapp_1 -->
<g id="node8" class="node">
<title>quarkusapp_1</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1300.5,-1192.2 980.46,-1192.2 980.46,-1012.2 1300.5,-1012.2 1300.5,-1192.2"/>
<text xml:space="preserve" text-anchor="start" x="1050.99" y="-1096.2" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- db -->
<g id="node9" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2051.5,-645.8 1731.46,-645.8 1731.46,-465.8 2051.5,-465.8 2051.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="1837" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- db_1 -->
<g id="node10" class="node">
<title>db_1</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2501.5,-645.8 2181.46,-645.8 2181.46,-465.8 2501.5,-465.8 2501.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="2287" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- iam -->
<g id="node11" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1047.5,-645.8 727.46,-645.8 727.46,-465.8 1047.5,-465.8 1047.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="846.9" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- iam_1 -->
<g id="node12" class="node">
<title>iam_1</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="597.5,-645.8 277.46,-645.8 277.46,-465.8 597.5,-465.8 597.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="396.9" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- otel -->
<g id="node13" class="node">
<title>otel</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1549.5,-645.8 1229.46,-645.8 1229.46,-465.8 1549.5,-465.8 1549.5,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="1278.32" y="-549.8" font-family="Arial" font-size="20.00" fill="#f8fafc">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node14" class="node">
<title>jaeger</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1549.5,-288 1229.46,-288 1229.46,-108 1549.5,-108 1549.5,-288"/>
<text xml:space="preserve" text-anchor="start" x="1358.9" y="-192" font-family="Arial" font-size="20.00" fill="#f8fafc">Jaeger</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge8" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1567.16,-2230.76C1549.19,-2209.09 1533.03,-2184.59 1523.19,-2158.6 1497.21,-2089.98 1532.93,-2015.5 1575.07,-1958.25"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1577.1,-1959.92 1579.51,-1952.35 1572.9,-1956.76 1577.1,-1959.92"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1523.19,-2135.8 1523.19,-2158.6 1682.48,-2158.6 1682.48,-2135.8 1523.19,-2135.8"/>
<text xml:space="preserve" text-anchor="start" x="1526.19" y="-2143" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvia trafico al cluster</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge29" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1703.07,-2198.6C1706.1,-2185.21 1708.68,-2171.69 1710.48,-2158.6 1716.95,-2111.4 1713.09,-2060.08 1705.45,-2013.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1708.07,-2013.33 1704.22,-2006.38 1702.9,-2014.22 1708.07,-2013.33"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1661.82,-2100.78 1661.82,-2123.58 1713.71,-2123.58 1713.71,-2100.78 1661.82,-2100.78"/>
<text xml:space="preserve" text-anchor="start" x="1664.82" y="-2107.98" font-family="Arial" font-size="14.00" fill="#c9c9c9">HTTPS</text>
</g>
<!-- vault&#45;&gt;quarkusapp -->
<g id="edge16" class="edge">
<title>vault&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3095.56,-1370.1C3113.23,-1331.68 3121.56,-1288.47 3094.48,-1257.2 3036.58,-1190.36 2483.05,-1138.34 2196.54,-1115.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2197.17,-1113.05 2189.48,-1115.08 2196.75,-1118.29 2197.17,-1113.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3107.7,-1257.2 3107.7,-1280 3312.91,-1280 3312.91,-1257.2 3107.7,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="3110.7" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- vault&#45;&gt;quarkusapp_1 -->
<g id="edge25" class="edge">
<title>vault&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2876.84,-1372.92C2809.99,-1340.79 2730.32,-1307.42 2654.48,-1288 2611.62,-1277.03 2599.29,-1284.28 2555.26,-1280 2212.1,-1246.63 2126.56,-1235.31 1784.48,-1192.2 1623.66,-1171.93 1440.61,-1146.39 1310.87,-1127.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1311.25,-1125.28 1303.45,-1126.82 1310.5,-1130.48 1311.25,-1125.28"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2555.26,-1257.2 2555.26,-1280 2760.48,-1280 2760.48,-1257.2 2555.26,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2558.26" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp -->
<g id="edge17" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3445.79,-1370.14C3422.19,-1328.91 3388.37,-1283.33 3344.48,-1257.2 3154.43,-1144.07 2508.04,-1114.01 2196.75,-1106.05"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2196.86,-1103.43 2189.3,-1105.86 2196.73,-1108.68 2196.86,-1103.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3371.35,-1257.2 3371.35,-1280 3542.31,-1280 3542.31,-1257.2 3371.35,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="3374.35" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp_1 -->
<g id="edge26" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3396.64,-1370C3358.26,-1337.85 3310.93,-1305.26 3261.48,-1288 3222.66,-1274.45 2932.34,-1284.91 2891.52,-1280 2844.95,-1274.4 2834.91,-1263.8 2788.48,-1257.2 2345.77,-1194.27 2229.36,-1237.28 1784.48,-1192.2 1623.05,-1175.84 1439.85,-1149.79 1310.23,-1130.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1311.01,-1127.56 1303.2,-1129.02 1310.22,-1132.75 1311.01,-1127.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2891.52,-1257.2 2891.52,-1280 3062.48,-1280 3062.48,-1257.2 2891.52,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2894.52" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- ingresscontroller&#45;&gt;adminconsole -->
<g id="edge3" class="edge">
<title>ingresscontroller&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1716.52,-1770.53C1735,-1741.3 1757.03,-1709.38 1780.08,-1682.4 1818.14,-1637.84 1864.95,-1593.67 1907.5,-1556.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1909.15,-1558.69 1913.11,-1551.8 1905.72,-1554.72 1909.15,-1558.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1780.08,-1682.4 1780.08,-1705.2 1956.48,-1705.2 1956.48,-1682.4 1780.08,-1682.4"/>
<text xml:space="preserve" text-anchor="start" x="1783.08" y="-1689.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- ingresscontroller&#45;&gt;adminconsole -->
<g id="edge27" class="edge">
<title>ingresscontroller&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1857.48,-1802.06C1905.5,-1779.15 1952.41,-1747.76 1984.48,-1705.2 2000.75,-1683.6 2011.56,-1657.89 2018.61,-1631.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2021.16,-1632.05 2020.41,-1624.13 2016.06,-1630.78 2021.16,-1632.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1819.5,-1732.88 1819.5,-1755.68 1960.11,-1755.68 1960.11,-1732.88 1819.5,-1732.88"/>
<text xml:space="preserve" text-anchor="start" x="1822.5" y="-1740.08" font-family="Arial" font-size="14.00" fill="#c9c9c9">Rutea trafico UI y API</text>
</g>
<!-- ingresscontroller&#45;&gt;adminconsole_1 -->
<g id="edge5" class="edge">
<title>ingresscontroller&#45;&gt;adminconsole_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1505.79,-1819.75C1432.77,-1795.72 1348.78,-1759.03 1286.08,-1705.2 1240.34,-1665.93 1205.1,-1608.56 1180.76,-1559.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1183.14,-1558.19 1177.51,-1552.59 1178.42,-1560.48 1183.14,-1558.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1286.08,-1682.4 1286.08,-1705.2 1462.48,-1705.2 1462.48,-1682.4 1286.08,-1682.4"/>
<text xml:space="preserve" text-anchor="start" x="1289.08" y="-1689.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- ingresscontroller&#45;&gt;adminconsole_1 -->
<g id="edge28" class="edge">
<title>ingresscontroller&#45;&gt;adminconsole_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1557.63,-1738.2C1531.87,-1712.21 1507.06,-1690.18 1490.48,-1682.4 1453.32,-1664.97 1436.46,-1689.96 1398.48,-1674.4 1369.1,-1662.36 1340.52,-1645.75 1313.73,-1627.06"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1315.57,-1625.15 1307.94,-1622.95 1312.53,-1629.43 1315.57,-1625.15"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1290.57,-1656.7 1290.57,-1679.5 1431.17,-1679.5 1431.17,-1656.7 1290.57,-1656.7"/>
<text xml:space="preserve" text-anchor="start" x="1293.57" y="-1663.9" font-family="Arial" font-size="14.00" fill="#c9c9c9">Rutea trafico UI y API</text>
</g>
<!-- ingresscontroller&#45;&gt;quarkusapp -->
<g id="edge4" class="edge">
<title>ingresscontroller&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1825.26,-1830.64C1980.66,-1799.23 2200.54,-1743.87 2251.48,-1674.4 2353.02,-1535.9 2324.87,-1443.26 2251.48,-1288 2235.36,-1253.91 2209.54,-1224 2181.03,-1198.73"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2183.01,-1196.97 2175.62,-1194.05 2179.58,-1200.94 2183.01,-1196.97"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2317.49,-1448.6 2317.49,-1471.4 2493.89,-1471.4 2493.89,-1448.6 2317.49,-1448.6"/>
<text xml:space="preserve" text-anchor="start" x="2320.49" y="-1455.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- ingresscontroller&#45;&gt;quarkusapp_1 -->
<g id="edge6" class="edge">
<title>ingresscontroller&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1631.86,-1770.25C1584.4,-1652.02 1489.52,-1440.33 1365.48,-1288 1339.18,-1255.7 1306.5,-1225.05 1274.27,-1198.33"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1276.34,-1196.63 1268.88,-1193.91 1273.01,-1200.69 1276.34,-1196.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1590.22,-1448.6 1590.22,-1471.4 1766.62,-1471.4 1766.62,-1448.6 1590.22,-1448.6"/>
<text xml:space="preserve" text-anchor="start" x="1593.22" y="-1455.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Enruta trafico HTTP interno</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge1" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2026.48,-1370.13C2026.48,-1319.19 2026.48,-1255.12 2026.48,-1202.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2029.1,-1202.69 2026.48,-1195.19 2023.85,-1202.69 2029.1,-1202.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2026.48,-1257.2 2026.48,-1280 2053.47,-1280 2053.47,-1257.2 2026.48,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2029.48" y="-1265.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge9" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.91,-1370.12C1896.91,-1337.77 1848.75,-1305 1798.48,-1288 1774.79,-1279.99 918.52,-1294.94 898.48,-1280 710.08,-1139.53 791.26,-817.94 848.55,-655.12"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="850.89,-656.38 850.93,-648.43 845.94,-654.62 850.89,-656.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="820.52,-1090.8 820.52,-1113.6 847.51,-1113.6 847.51,-1090.8 820.52,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="823.52" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole&#45;&gt;iam_1 -->
<g id="edge10" class="edge">
<title>adminconsole&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.92,-1370.1C1896.92,-1337.76 1848.75,-1304.99 1798.48,-1288 1748.16,-1270.99 892.89,-1296.71 842.48,-1280 581.35,-1193.46 484.38,-832.9 452,-655.82"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="454.63,-655.61 450.73,-648.69 449.47,-656.54 454.63,-655.61"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="691.06,-1090.8 691.06,-1113.6 718.05,-1113.6 718.05,-1090.8 691.06,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="694.06" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
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
<g id="edge18" class="edge">
<title>adminconsole_1&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.64,-1428.64C769.25,-1384.87 414.5,-1297.6 338.48,-1192.2 257.37,-1079.73 246.46,-983.93 338.48,-880.2 386.46,-826.12 598.37,-876.67 661.48,-841.4 737.75,-798.77 797.64,-718.98 836.55,-654.71"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="838.76,-656.13 840.35,-648.35 834.25,-653.44 838.76,-656.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="338.48,-1090.8 338.48,-1113.6 365.48,-1113.6 365.48,-1090.8 338.48,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="341.48" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole_1&#45;&gt;iam_1 -->
<g id="edge19" class="edge">
<title>adminconsole_1&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.61,-1454.86C777.7,-1441.2 428.42,-1388.39 214.48,-1192.2 85.94,-1074.32 -56.72,-1004.28 23.48,-849.4 75.07,-749.75 177.96,-676.78 268.26,-628.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="269.42,-630.99 274.84,-625.17 266.98,-626.35 269.42,-630.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="214.48,-1090.8 214.48,-1113.6 241.48,-1113.6 241.48,-1090.8 214.48,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="217.48" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2133.33,-1012.39C2181.68,-961.65 2219.41,-898.55 2176.48,-849.4 2167.77,-839.44 2128.98,-847.94 2117.48,-841.4 2041.66,-798.27 1981.82,-718.72 1942.81,-654.67"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1945.12,-653.41 1939.01,-648.34 1940.62,-656.12 1945.12,-653.41"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2188.55,-849.4 2188.55,-872.2 2215.55,-872.2 2215.55,-849.4 2188.55,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2191.55" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;db_1 -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;db_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2186.32,-1070.08C2295.39,-1039.63 2432.05,-981.26 2500.48,-872.2 2544.79,-801.57 2497.18,-716.99 2442.78,-653.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2445.01,-651.76 2438.11,-647.82 2441.04,-655.2 2445.01,-651.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2508.96,-849.4 2508.96,-872.2 2535.95,-872.2 2535.95,-849.4 2508.96,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2511.96" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge13" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.02,-1012.27C1868.24,-953.74 1772.27,-882.11 1672.48,-849.4 1644.76,-840.31 1174.08,-853.37 1147.48,-841.4 1061.44,-802.68 991.32,-720.3 945.67,-654.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="948.05,-652.91 941.66,-648.19 943.71,-655.87 948.05,-652.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1726.97,-849.4 1726.97,-872.2 1864.49,-872.2 1864.49,-849.4 1726.97,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1729.97" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;iam_1 -->
<g id="edge14" class="edge">
<title>quarkusapp&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1866.58,-1017.71C1742.83,-957.91 1565.15,-882.36 1399.48,-849.4 1379.42,-845.41 681.84,-850.39 663.48,-841.4 583.76,-802.37 523.4,-720.29 485.21,-654.26"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="487.69,-653.32 481.7,-648.1 483.13,-655.91 487.69,-653.32"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1488.6,-849.4 1488.6,-872.2 1626.12,-872.2 1626.12,-849.4 1488.6,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1491.6" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge15" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2022.77,-1012.43C2015.3,-956.13 1995.6,-887.04 1945.48,-849.4 1920.77,-830.84 1695.78,-853.8 1667.48,-841.4 1578.29,-802.32 1503.03,-719.98 1453.4,-653.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1455.56,-652.38 1448.98,-647.92 1451.34,-655.51 1455.56,-652.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1966.04,-849.4 1966.04,-872.2 2062.31,-872.2 2062.31,-849.4 1966.04,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1969.04" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- quarkusapp_1&#45;&gt;db -->
<g id="edge20" class="edge">
<title>quarkusapp_1&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1189.07,-1012.49C1226.09,-954.67 1282.85,-883.79 1354.48,-849.4 1382.24,-836.07 1603.49,-854.23 1631.48,-841.4 1717.1,-802.16 1787.15,-720.06 1832.88,-654.08"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1834.84,-655.87 1836.91,-648.2 1830.5,-652.9 1834.84,-655.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1354.48,-849.4 1354.48,-872.2 1381.48,-872.2 1381.48,-849.4 1354.48,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1357.48" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp_1&#45;&gt;db_1 -->
<g id="edge21" class="edge">
<title>quarkusapp_1&#45;&gt;db_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1300.2,-1030.67C1428.3,-977.98 1614.21,-910.12 1784.48,-880.2 1797.15,-877.97 2237.23,-879.98 2247.48,-872.2 2313.22,-822.3 2334.7,-728.29 2340.94,-655.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2343.52,-656.46 2341.48,-648.78 2338.29,-656.06 2343.52,-656.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2266.98,-849.4 2266.98,-872.2 2293.98,-872.2 2293.98,-849.4 2266.98,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2269.98" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp_1&#45;&gt;iam -->
<g id="edge22" class="edge">
<title>quarkusapp_1&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1039.92,-1012.44C1001.72,-973.25 961.54,-924.27 936.96,-872.2 904.95,-804.4 892.95,-720.2 888.76,-655.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="891.4,-656.05 888.33,-648.72 886.16,-656.36 891.4,-656.05"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="936.96,-849.4 936.96,-872.2 1074.48,-872.2 1074.48,-849.4 936.96,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="939.96" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp_1&#45;&gt;iam_1 -->
<g id="edge23" class="edge">
<title>quarkusapp_1&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1060.88,-1012.47C1011.98,-964.32 945.11,-908.91 873.48,-880.2 850.21,-870.87 785.58,-876.9 760.96,-872.2 716.33,-863.69 700.9,-867.16 663.48,-841.4 592.99,-792.88 533.76,-715.9 493.64,-654.22"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="496.01,-653.06 489.75,-648.17 491.6,-655.9 496.01,-653.06"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="760.96,-849.4 760.96,-872.2 898.48,-872.2 898.48,-849.4 760.96,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="763.96" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp_1&#45;&gt;otel -->
<g id="edge24" class="edge">
<title>quarkusapp_1&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1110.76,-1012.47C1099.06,-962.93 1092.71,-900.99 1113.22,-849.4 1143.84,-772.36 1205.44,-703.86 1262.71,-652.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1264.26,-654.69 1268.13,-647.75 1260.78,-650.76 1264.26,-654.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1113.22,-849.4 1113.22,-872.2 1209.48,-872.2 1209.48,-849.4 1113.22,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1116.22" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge7" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1389.48,-465.93C1389.48,-414.99 1389.48,-350.92 1389.48,-298.33"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1392.1,-298.49 1389.48,-290.99 1386.85,-298.49 1392.1,-298.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1389.48,-353 1389.48,-375.8 1486.52,-375.8 1486.52,-353 1389.48,-353"/>
<text xml:space="preserve" text-anchor="start" x="1392.48" y="-360.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
</g>
</g>
</svg>
`;case"usecase_design_execute":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2923pt" height="1621pt"
 viewBox="0.00 0.00 2923.00 1621.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1606.05)">
<g id="clust1" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="647.59,-727 647.59,-1298 1047.63,-1298 1047.63,-727 647.59,-727"/>
<text xml:space="preserve" text-anchor="start" x="655.59" y="-1285.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1286.17,-220 1286.17,-1371 2884.78,-1371 2884.78,-220 1286.17,-220"/>
<text xml:space="preserve" text-anchor="start" x="1294.17" y="-1358.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">QUARKUS NATIVE APP</text>
</g>
<!-- db -->
<g id="node1" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2220.97,-1591 1900.93,-1591 1900.93,-1411 2220.97,-1411 2220.97,-1591"/>
<text xml:space="preserve" text-anchor="start" x="2006.48" y="-1495" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node2" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2220.97,-180 1900.93,-180 1900.93,0 2220.97,0 2220.97,-180"/>
<text xml:space="preserve" text-anchor="start" x="1998.7" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- integrationadmin -->
<g id="node3" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-1237 0,-1237 0,-1057 320.04,-1057 320.04,-1237"/>
<text xml:space="preserve" text-anchor="start" x="81.64" y="-1141" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- processdesigner -->
<g id="node4" class="node">
<title>processdesigner</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1007.63,-1237 687.59,-1237 687.59,-1057 1007.63,-1057 1007.63,-1237"/>
<text xml:space="preserve" text-anchor="start" x="768.69" y="-1141" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- adminapi -->
<g id="node5" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1646.21,-1237 1326.17,-1237 1326.17,-1057 1646.21,-1057 1646.21,-1237"/>
<text xml:space="preserve" text-anchor="start" x="1438.95" y="-1141" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- operator -->
<g id="node6" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-947 0,-947 0,-767 320.04,-767 320.04,-947"/>
<text xml:space="preserve" text-anchor="start" x="120.56" y="-851" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- operationsconsole -->
<g id="node7" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1007.63,-947 687.59,-947 687.59,-767 1007.63,-767 1007.63,-947"/>
<text xml:space="preserve" text-anchor="start" x="759.23" y="-851" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- executionapi -->
<g id="node8" class="node">
<title>executionapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1646.21,-870 1326.17,-870 1326.17,-690 1646.21,-690 1646.21,-870"/>
<text xml:space="preserve" text-anchor="start" x="1423.38" y="-774" font-family="Arial" font-size="20.00" fill="#eff6ff">Execution API</text>
</g>
<!-- processengine -->
<g id="node9" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2220.97,-870 1900.93,-870 1900.93,-690 2220.97,-690 2220.97,-870"/>
<text xml:space="preserve" text-anchor="start" x="1990.91" y="-774" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- sourceregistry -->
<g id="node10" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2844.78,-730 2524.74,-730 2524.74,-550 2844.78,-550 2844.78,-730"/>
<text xml:space="preserve" text-anchor="start" x="2573.6" y="-634" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node11" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2844.78,-1020 2524.74,-1020 2524.74,-840 2844.78,-840 2844.78,-1020"/>
<text xml:space="preserve" text-anchor="start" x="2572.49" y="-924" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node12" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2844.78,-1310 2524.74,-1310 2524.74,-1130 2844.78,-1130 2844.78,-1310"/>
<text xml:space="preserve" text-anchor="start" x="2589.74" y="-1214" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- restcalltaskprovider -->
<g id="node13" class="node">
<title>restcalltaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2844.78,-440 2524.74,-440 2524.74,-260 2844.78,-260 2844.78,-440"/>
<text xml:space="preserve" text-anchor="start" x="2588.06" y="-344" font-family="Arial" font-size="20.00" fill="#eff6ff">RestCallTaskProvider</text>
</g>
<!-- db&#45;&gt;dbwritetaskprovider -->
<g id="edge9" class="edge">
<title>db&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2230.24,-1424.95C2321.93,-1383.51 2434.75,-1332.53 2524.92,-1291.78"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2229.38,-1422.46 2223.63,-1427.94 2231.54,-1427.24 2229.38,-1422.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2283.97,-1396.93 2283.97,-1429.73 2307.97,-1429.73 2307.97,-1396.93 2283.97,-1396.93"/>
<text xml:space="preserve" text-anchor="start" x="2292.08" y="-1410.13" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">9</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2310.97,-1396.93 2310.97,-1429.73 2461.74,-1429.73 2461.74,-1396.93 2310.97,-1396.93"/>
<text xml:space="preserve" text-anchor="start" x="2313.97" y="-1409.13" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda staging/destino</text>
</g>
<!-- externalapi&#45;&gt;restcalltaskprovider -->
<g id="edge11" class="edge">
<title>externalapi&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2230.52,-160.48C2322.16,-198.8 2434.84,-245.92 2524.92,-283.58"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2231.6,-158.09 2223.66,-157.62 2229.57,-162.93 2231.6,-158.09"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2308.59,-253.93 2308.59,-286.73 2340.16,-286.73 2340.16,-253.93 2308.59,-253.93"/>
<text xml:space="preserve" text-anchor="start" x="2316.59" y="-267.13" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">11</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2343.16,-253.93 2343.16,-286.73 2437.12,-286.73 2437.12,-253.93 2343.16,-253.93"/>
<text xml:space="preserve" text-anchor="start" x="2346.16" y="-266.13" font-family="Arial" font-size="14.00" fill="#c9c9c9">Envia payload</text>
</g>
<!-- integrationadmin&#45;&gt;processdesigner -->
<g id="edge1" class="edge">
<title>integrationadmin&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M320.03,-1147C427.14,-1147 568.23,-1147 677.41,-1147"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="677.34,-1149.63 684.84,-1147 677.34,-1144.38 677.34,-1149.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-1150 383.04,-1182.8 407.04,-1182.8 407.04,-1150 383.04,-1150"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-1163.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-1150 410.04,-1182.8 624.59,-1182.8 624.59,-1150 410.04,-1150"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-1162.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura source, reader y tareas</text>
</g>
<!-- processdesigner&#45;&gt;adminapi -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1007.6,-1147C1101.5,-1147 1220.31,-1147 1315.93,-1147"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1315.76,-1149.63 1323.26,-1147 1315.76,-1144.38 1315.76,-1149.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1070.63,-1150 1070.63,-1182.8 1094.63,-1182.8 1094.63,-1150 1070.63,-1150"/>
<text xml:space="preserve" text-anchor="start" x="1078.74" y="-1163.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1097.63,-1150 1097.63,-1182.8 1263.17,-1182.8 1263.17,-1150 1097.63,-1150"/>
<text xml:space="preserve" text-anchor="start" x="1100.63" y="-1162.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda process definition</text>
</g>
<!-- operator&#45;&gt;operationsconsole -->
<g id="edge3" class="edge">
<title>operator&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M320.03,-857C427.14,-857 568.23,-857 677.41,-857"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="677.34,-859.63 684.84,-857 677.34,-854.38 677.34,-859.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="426.22,-860 426.22,-892.8 450.22,-892.8 450.22,-860 426.22,-860"/>
<text xml:space="preserve" text-anchor="start" x="434.33" y="-873.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="453.22,-860 453.22,-892.8 581.41,-892.8 581.41,-860 453.22,-860"/>
<text xml:space="preserve" text-anchor="start" x="456.22" y="-872.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Selecciona proceso</text>
</g>
<!-- operationsconsole&#45;&gt;executionapi -->
<g id="edge4" class="edge">
<title>operationsconsole&#45;&gt;executionapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1007.6,-837.77C1101.5,-826.41 1220.31,-812.04 1315.93,-800.47"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1316.16,-803.09 1323.29,-799.58 1315.53,-797.88 1316.16,-803.09"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1100.2,-832.9 1100.2,-865.7 1124.2,-865.7 1124.2,-832.9 1100.2,-832.9"/>
<text xml:space="preserve" text-anchor="start" x="1108.31" y="-846.1" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1127.2,-832.9 1127.2,-865.7 1233.6,-865.7 1233.6,-832.9 1127.2,-832.9"/>
<text xml:space="preserve" text-anchor="start" x="1130.2" y="-845.1" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta proceso</text>
</g>
<!-- operationsconsole&#45;&gt;executionapi -->
<g id="edge12" class="edge">
<title>operationsconsole&#45;&gt;executionapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1004.92,-762.94C1025.43,-754.04 1046.63,-746.41 1067.63,-741.2 1151.54,-720.38 1247.45,-727.23 1326.18,-740.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1004.09,-760.44 998.31,-765.89 1006.23,-765.23 1004.09,-760.44"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1088.24,-744.2 1088.24,-777 1119.82,-777 1119.82,-744.2 1088.24,-744.2"/>
<text xml:space="preserve" text-anchor="start" x="1096.24" y="-757.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">12</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1122.82,-744.2 1122.82,-777 1245.55,-777 1245.55,-744.2 1122.82,-744.2"/>
<text xml:space="preserve" text-anchor="start" x="1125.82" y="-756.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta resultado</text>
</g>
<!-- executionapi&#45;&gt;processengine -->
<g id="edge5" class="edge">
<title>executionapi&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1645.97,-780C1722.17,-780 1813.52,-780 1891,-780"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1890.83,-782.63 1898.33,-780 1890.83,-777.38 1890.83,-782.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1709.21,-783 1709.21,-815.8 1733.21,-815.8 1733.21,-783 1709.21,-783"/>
<text xml:space="preserve" text-anchor="start" x="1717.31" y="-796.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1736.21,-783 1736.21,-815.8 1837.93,-815.8 1837.93,-783 1736.21,-783"/>
<text xml:space="preserve" text-anchor="start" x="1739.21" y="-795.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Inicia ejecucion</text>
</g>
<!-- processengine&#45;&gt;sourceregistry -->
<g id="edge6" class="edge">
<title>processengine&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2220.72,-735.25C2240.94,-729.96 2261.41,-724.81 2280.97,-720.2 2357.36,-702.19 2442.52,-684.84 2514.79,-670.91"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2515.06,-673.54 2521.93,-669.54 2514.07,-668.38 2515.06,-673.54"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2310.43,-723.2 2310.43,-756 2334.43,-756 2334.43,-723.2 2310.43,-723.2"/>
<text xml:space="preserve" text-anchor="start" x="2318.54" y="-736.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2337.43,-723.2 2337.43,-756 2435.28,-756 2435.28,-723.2 2337.43,-723.2"/>
<text xml:space="preserve" text-anchor="start" x="2340.43" y="-735.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene fuente</text>
</g>
<!-- processengine&#45;&gt;readerregistry -->
<g id="edge7" class="edge">
<title>processengine&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2220.87,-818.34C2310.78,-840.03 2423.19,-867.14 2514.72,-889.22"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2514.07,-891.77 2521.98,-890.97 2515.3,-886.66 2514.07,-891.77"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2312.37,-875.85 2312.37,-908.65 2336.37,-908.65 2336.37,-875.85 2312.37,-875.85"/>
<text xml:space="preserve" text-anchor="start" x="2320.48" y="-889.05" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">7</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2339.37,-875.85 2339.37,-908.65 2433.34,-908.65 2433.34,-875.85 2339.37,-875.85"/>
<text xml:space="preserve" text-anchor="start" x="2342.37" y="-888.05" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee contenido</text>
</g>
<!-- processengine&#45;&gt;dbwritetaskprovider -->
<g id="edge8" class="edge">
<title>processengine&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2185.02,-869.96C2216.24,-892.61 2249.77,-916.79 2280.97,-939 2368.44,-1001.25 2467.3,-1070.24 2545.19,-1124.29"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2543.48,-1126.29 2551.14,-1128.41 2546.47,-1121.98 2543.48,-1126.29"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2302.28,-1066.09 2302.28,-1098.89 2326.28,-1098.89 2326.28,-1066.09 2302.28,-1066.09"/>
<text xml:space="preserve" text-anchor="start" x="2310.39" y="-1079.29" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">8</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2329.28,-1066.09 2329.28,-1098.89 2443.43,-1098.89 2443.43,-1066.09 2329.28,-1066.09"/>
<text xml:space="preserve" text-anchor="start" x="2332.28" y="-1078.29" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste registros</text>
</g>
<!-- processengine&#45;&gt;restcalltaskprovider -->
<g id="edge10" class="edge">
<title>processengine&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2179.53,-690.11C2212.1,-665.74 2247.67,-639.63 2280.97,-616.2 2363.82,-557.92 2458.2,-495.35 2534.77,-445.52"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2536.14,-447.75 2541,-441.46 2533.28,-443.35 2536.14,-447.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2293.42,-619.2 2293.42,-652 2325,-652 2325,-619.2 2293.42,-619.2"/>
<text xml:space="preserve" text-anchor="start" x="2301.42" y="-632.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">10</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2328,-619.2 2328,-652 2452.28,-652 2452.28,-619.2 2328,-619.2"/>
<text xml:space="preserve" text-anchor="start" x="2331" y="-631.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca API externa</text>
</g>
</g>
</svg>
`;case"usecase_scheduled_audit":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2274pt" height="1228pt"
 viewBox="0.00 0.00 2274.00 1228.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1213.05)">
<!-- operationsconsole -->
<g id="node1" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1578.52,-1189 1258.48,-1189 1258.48,-1009 1578.52,-1009 1578.52,-1189"/>
<text xml:space="preserve" text-anchor="start" x="1330.11" y="-1093" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- scheduler -->
<g id="node2" class="node">
<title>scheduler</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-257 0,-257 0,-77 320.04,-77 320.04,-257"/>
<text xml:space="preserve" text-anchor="start" x="114.99" y="-161" font-family="Arial" font-size="20.00" fill="#eff6ff">Scheduler</text>
</g>
<!-- processengine -->
<g id="node3" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="970.3,-760 650.26,-760 650.26,-580 970.3,-580 970.3,-760"/>
<text xml:space="preserve" text-anchor="start" x="740.24" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- auditservice -->
<g id="node4" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1578.52,-890 1258.48,-890 1258.48,-710 1578.52,-710 1578.52,-890"/>
<text xml:space="preserve" text-anchor="start" x="1359.58" y="-794" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- queryapi -->
<g id="node5" class="node">
<title>queryapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2244.33,-899 1924.29,-899 1924.29,-719 2244.33,-719 2244.33,-899"/>
<text xml:space="preserve" text-anchor="start" x="2038.18" y="-803" font-family="Arial" font-size="20.00" fill="#eff6ff">Query API</text>
</g>
<!-- otel -->
<g id="node6" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="970.3,-470 650.26,-470 650.26,-290 970.3,-290 970.3,-470"/>
<text xml:space="preserve" text-anchor="start" x="699.13" y="-374" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node7" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="1578.52,-310 1258.48,-310 1258.48,-130 1578.52,-130 1578.52,-310"/>
<text xml:space="preserve" text-anchor="start" x="1387.92" y="-214" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- scheduleractor -->
<g id="node8" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="970.3,-180 650.26,-180 650.26,0 970.3,0 970.3,-180"/>
<text xml:space="preserve" text-anchor="start" x="765.25" y="-84" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- telemetry -->
<g id="node9" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1578.52,-600 1258.48,-600 1258.48,-420 1578.52,-420 1578.52,-600"/>
<text xml:space="preserve" text-anchor="start" x="1277.88" y="-504" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- auditor -->
<g id="node10" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2244.33,-1198 1924.29,-1198 1924.29,-1018 2244.33,-1018 2244.33,-1198"/>
<text xml:space="preserve" text-anchor="start" x="2052.63" y="-1102" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- operationsconsole&#45;&gt;queryapi -->
<g id="edge6" class="edge">
<title>operationsconsole&#45;&gt;queryapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1578.5,-1029.54C1680.04,-985.18 1811.54,-927.73 1914.87,-882.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1915.86,-885.02 1921.68,-879.61 1913.76,-880.21 1915.86,-885.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1641.52,-999.92 1641.52,-1032.72 1665.52,-1032.72 1665.52,-999.92 1641.52,-999.92"/>
<text xml:space="preserve" text-anchor="start" x="1649.63" y="-1013.12" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1668.52,-999.92 1668.52,-1032.72 1861.29,-1032.72 1861.29,-999.92 1668.52,-999.92"/>
<text xml:space="preserve" text-anchor="start" x="1671.52" y="-1012.12" font-family="Arial" font-size="14.00" fill="#c9c9c9">Solicita eventos y ejecuciones</text>
</g>
<!-- operationsconsole&#45;&gt;auditor -->
<g id="edge5" class="edge">
<title>operationsconsole&#45;&gt;auditor</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1588.72,-1101.29C1691.98,-1102.69 1823.15,-1104.47 1924.46,-1105.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1589.06,-1098.67 1581.52,-1101.2 1588.99,-1103.92 1589.06,-1098.67"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1678.48,-1107.83 1678.48,-1140.63 1702.48,-1140.63 1702.48,-1107.83 1678.48,-1107.83"/>
<text xml:space="preserve" text-anchor="start" x="1686.59" y="-1121.03" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1705.48,-1107.83 1705.48,-1140.63 1824.33,-1140.63 1824.33,-1107.83 1705.48,-1107.83"/>
<text xml:space="preserve" text-anchor="start" x="1708.48" y="-1120.03" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta auditoria</text>
</g>
<!-- scheduler&#45;&gt;processengine -->
<g id="edge2" class="edge">
<title>scheduler&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M276.92,-256.93C391.91,-346.15 567.53,-482.42 685.27,-573.78"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="683.37,-575.63 690.9,-578.15 686.59,-571.48 683.37,-575.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-495.94 383.04,-528.74 407.04,-528.74 407.04,-495.94 383.04,-495.94"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-509.14" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-495.94 410.04,-528.74 587.26,-528.74 587.26,-495.94 410.04,-495.94"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-508.14" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lanza proceso programado</text>
</g>
<!-- scheduler&#45;&gt;scheduleractor -->
<g id="edge1" class="edge">
<title>scheduler&#45;&gt;scheduleractor</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M330.42,-146.88C429.29,-135.14 553.26,-120.41 650.29,-108.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.16,-144.27 323.02,-147.76 330.78,-149.48 330.16,-144.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="412.23,-142.9 412.23,-175.7 436.23,-175.7 436.23,-142.9 412.23,-142.9"/>
<text xml:space="preserve" text-anchor="start" x="420.34" y="-156.1" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="439.23,-142.9 439.23,-175.7 558.07,-175.7 558.07,-142.9 439.23,-142.9"/>
<text xml:space="preserve" text-anchor="start" x="442.23" y="-155.1" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispara scheduler</text>
</g>
<!-- processengine&#45;&gt;auditservice -->
<g id="edge3" class="edge">
<title>processengine&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M970.16,-704.07C1055.7,-722.42 1161.23,-745.05 1248.31,-763.72"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1247.72,-766.28 1255.6,-765.28 1248.82,-761.14 1247.72,-766.28"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1045.36,-753.47 1045.36,-786.27 1069.36,-786.27 1069.36,-753.47 1045.36,-753.47"/>
<text xml:space="preserve" text-anchor="start" x="1053.47" y="-766.67" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1072.36,-753.47 1072.36,-786.27 1183.42,-786.27 1183.42,-753.47 1072.36,-753.47"/>
<text xml:space="preserve" text-anchor="start" x="1075.36" y="-765.67" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- processengine&#45;&gt;telemetry -->
<g id="edge4" class="edge">
<title>processengine&#45;&gt;telemetry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M970.16,-628.07C1055.79,-605.47 1161.45,-577.58 1248.57,-554.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1249.05,-557.17 1255.63,-552.72 1247.71,-552.1 1249.05,-557.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1059.37,-612.04 1059.37,-644.84 1083.37,-644.84 1083.37,-612.04 1059.37,-612.04"/>
<text xml:space="preserve" text-anchor="start" x="1067.48" y="-625.24" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1086.37,-612.04 1086.37,-644.84 1169.41,-644.84 1169.41,-612.04 1086.37,-612.04"/>
<text xml:space="preserve" text-anchor="start" x="1089.37" y="-624.24" font-family="Arial" font-size="14.00" fill="#c9c9c9">Emite spans</text>
</g>
<!-- auditservice&#45;&gt;queryapi -->
<g id="edge7" class="edge">
<title>auditservice&#45;&gt;queryapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1588.88,-781.46C1605.64,-780.13 1622.4,-779 1638.52,-778.2 1738.74,-773.22 1764.19,-771.2 1864.29,-778.2 1883.83,-779.57 1904.27,-781.61 1924.49,-784.01"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1588.74,-778.84 1581.48,-782.06 1589.17,-784.07 1588.74,-778.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1696.76,-781.2 1696.76,-814 1720.76,-814 1720.76,-781.2 1696.76,-781.2"/>
<text xml:space="preserve" text-anchor="start" x="1704.87" y="-794.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">7</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1723.76,-781.2 1723.76,-814 1806.05,-814 1806.05,-781.2 1723.76,-781.2"/>
<text xml:space="preserve" text-anchor="start" x="1726.76" y="-793.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee eventos</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge9" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M970.16,-338.07C1055.79,-315.47 1161.45,-287.58 1248.57,-264.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1249.05,-267.17 1255.63,-262.72 1247.71,-262.1 1249.05,-267.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1033.3,-322.04 1033.3,-354.84 1057.3,-354.84 1057.3,-322.04 1033.3,-322.04"/>
<text xml:space="preserve" text-anchor="start" x="1041.41" y="-335.24" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">9</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1060.3,-322.04 1060.3,-354.84 1195.48,-354.84 1195.48,-322.04 1060.3,-322.04"/>
<text xml:space="preserve" text-anchor="start" x="1063.3" y="-334.24" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica visualizacion</text>
</g>
<!-- otel&#45;&gt;telemetry -->
<g id="edge8" class="edge">
<title>otel&#45;&gt;telemetry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.53,-400.54C1048.7,-410.31 1127.78,-423.54 1198.48,-440.2 1218.1,-444.82 1238.5,-450.34 1258.61,-456.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="980.91,-397.94 973.12,-399.49 980.18,-403.14 980.91,-397.94"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1052.76,-443.2 1052.76,-476 1076.76,-476 1076.76,-443.2 1052.76,-443.2"/>
<text xml:space="preserve" text-anchor="start" x="1060.87" y="-456.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">8</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1079.76,-443.2 1079.76,-476 1176.02,-476 1176.02,-443.2 1079.76,-443.2"/>
<text xml:space="preserve" text-anchor="start" x="1082.76" y="-455.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
</g>
</svg>
`;default:throw new Error("Unknown viewId: "+e)}}export{n as dotSource,t as svgSource};
