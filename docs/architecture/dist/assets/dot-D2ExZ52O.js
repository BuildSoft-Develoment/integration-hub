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
        label=<<FONT POINT-SIZE="20">Kubernetes Secrets / External Config</FONT>>,
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
    appservice [height=2.5,
        label=<<FONT POINT-SIZE="20">Integration Hub Service</FONT>>,
        likec4_id=appService,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
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
        label=<<FONT POINT-SIZE="20">Source Providers</FONT>>,
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
        minlen=1,
        style=dashed];
    integrationhub -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1kp9nim",
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
    integrationhub -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="1uai625",
        minlen=1,
        style=dashed];
    filesources [height=2.5,
        label=<<FONT POINT-SIZE="20">Source Providers</FONT>>,
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
    quarkusapp [color="#2d5d39",
        fillcolor="#428a4f",
        fontcolor="#f8fafc",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Quarkus Native App</FONT>>,
        likec4_id="integrationHub.quarkusApp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
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
    admin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Administrador de integraciones</FONT>>,
        likec4_id=admin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    user -> admin [style=invis];
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
    label = <<FONT POINT-SIZE="20">Admin Console</FONT>>;
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
    label = <<FONT POINT-SIZE="20">Admin Console</FONT>>;
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
    label = <<FONT POINT-SIZE="20">Quarkus Native App</FONT>>;
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
  "adminapi" [
    likec4_id = "integrationHub.quarkusApp.adminApi";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Admin API</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processcatalogservice" [
    likec4_id = "integrationHub.quarkusApp.processEngine.processCatalogService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>;
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
  "processdesigner" -> "adminapi" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra source definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminapi" -> "processcatalogservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste catalogo</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processcatalogservice" -> "db" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda source definition</FONT></TD></TR></TABLE>>;
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
  "adminapi" [
    likec4_id = "integrationHub.quarkusApp.adminApi";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Admin API</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processcatalogservice" [
    likec4_id = "integrationHub.quarkusApp.processEngine.processCatalogService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>;
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
  "processdesigner" -> "adminapi" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra reader definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminapi" -> "processcatalogservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste catalogo</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processcatalogservice" -> "db" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda reader definition</FONT></TD></TR></TABLE>>;
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
  "adminapi" [
    likec4_id = "integrationHub.quarkusApp.adminApi";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Admin API</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "processcatalogservice" [
    likec4_id = "integrationHub.quarkusApp.processEngine.processCatalogService";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>;
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
  "processdesigner" -> "adminapi" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda process definition</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "adminapi" -> "processcatalogservice" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Valida y registra tareas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processcatalogservice" -> "db" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda process definition y task<BR/>definitions</FONT></TD></TR></TABLE>>;
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
  "executionapi" [
    likec4_id = "integrationHub.quarkusApp.executionApi";
    likec4_level = 0;
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
    likec4_level = 0;
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
    likec4_level = 0;
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
    likec4_level = 0;
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
    likec4_level = 0;
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
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">RestCallTaskProvider</FONT>>;
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
  "operator" -> "operationsconsole" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Selecciona proceso activo</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "operationsconsole" -> "executionapi" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Solicita ejecucion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "executionapi" -> "processengine" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Inicia ejecucion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "sourceregistry" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Resuelve fuente</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "readerregistry" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Lee contenido</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "dbwritetaskprovider" [
    likec4_id = "step-06";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Persiste registros</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "dbwritetaskprovider" -> "db" [
    likec4_id = "step-07";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>7</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Guarda staging o destino</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "restcalltaskprovider" [
    likec4_id = "step-08";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>8</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Invoca API externa</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "restcalltaskprovider" -> "externalapi" [
    likec4_id = "step-09";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>9</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Envia payload</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "auditservice" [
    likec4_id = "step-10";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>10</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>;
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
  "sourceregistry" [
    likec4_id = "integrationHub.quarkusApp.sourceRegistry";
    likec4_level = 0;
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
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Reader Provider Registry</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#3b82f6";
    fontcolor = "#eff6ff";
    color = "#2563eb";
  ];
  "taskregistry" [
    likec4_id = "integrationHub.quarkusApp.taskRegistry";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Task Provider Registry</FONT>>;
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
  "scheduleractor" -> "scheduler" [
    likec4_id = "step-01";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>1</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Detecta proceso programado</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "scheduler" -> "processengine" [
    likec4_id = "step-02";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>2</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Lanza ejecucion</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "sourceregistry" [
    likec4_id = "step-03";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>3</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Resuelve fuente</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "readerregistry" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Lee contenido</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "taskregistry" [
    likec4_id = "step-05";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>5</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Ejecuta tareas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "auditservice" [
    likec4_id = "step-06";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>6</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "processengine" -> "telemetry" [
    likec4_id = "step-07";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>7</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Emite spans</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "telemetry" -> "otel" [
    likec4_id = "step-08";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>8</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "otel" -> "jaeger" [
    likec4_id = "step-09";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>9</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Publica visualizacion</FONT></TD></TR></TABLE>>;
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
  "adminapi" [
    likec4_id = "integrationHub.quarkusApp.adminApi";
    likec4_level = 0;
    label = <<FONT POINT-SIZE="20">Admin API</FONT>>;
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
  "oidcclient" -> "adminapi" [
    likec4_id = "step-04";
    style = "dashed";
    label = <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3"><TR><TD><TABLE BORDER="0" CELLPADDING="6" BGCOLOR="#18191BA0"><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="14"><B>4</B></FONT></TD></TR></TABLE></TD><TD BGCOLOR="#18191BA0" CELLPADDING="3"><FONT POINT-SIZE="14">Invoca APIs protegidas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "iam" -> "adminapi" [
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
<svg width="4305pt" height="1178pt"
 viewBox="0.00 0.00 4305.00 1178.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1163.45)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1024.5,-1148.4 704.46,-1148.4 704.46,-968.4 1024.5,-968.4 1024.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="778.31" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- loadbalancer -->
<g id="node2" class="node">
<title>loadbalancer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="877.5,-825.6 557.46,-825.6 557.46,-645.6 877.5,-645.6 877.5,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="579.08" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Load Balancer / Reverse Proxy</text>
</g>
<!-- integrationhub -->
<g id="node3" class="node">
<title>integrationhub</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2490.5,-502.8 2170.46,-502.8 2170.46,-322.8 2490.5,-322.8 2490.5,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2222.09" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Platform</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1514.5,-1148.4 1194.46,-1148.4 1194.46,-968.4 1514.5,-968.4 1514.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1216.63" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- platformadmin -->
<g id="node5" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3844.5,-1148.4 3524.46,-1148.4 3524.46,-968.4 3844.5,-968.4 3844.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="3616.12" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- vault -->
<g id="node6" class="node">
<title>vault</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3583.07,-825.6 3221.89,-825.6 3221.89,-645.6 3583.07,-645.6 3583.07,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3237.95" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Kubernetes Secrets / External Config</text>
</g>
<!-- iam -->
<g id="node7" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3751.5,-180 3431.46,-180 3431.46,0 3751.5,0 3751.5,-180"/>
<text xml:space="preserve" text-anchor="start" x="3550.9" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- integrationadmin -->
<g id="node8" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3321.5,-1148.4 3001.46,-1148.4 3001.46,-968.4 3321.5,-968.4 3321.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="3083.1" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node9" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2031.5,-1148.4 1711.46,-1148.4 1711.46,-968.4 2031.5,-968.4 2031.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1832.02" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node10" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2461.5,-1148.4 2141.46,-1148.4 2141.46,-968.4 2461.5,-968.4 2461.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="2269.79" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- infrateam -->
<g id="node11" class="node">
<title>infrateam</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="447.5,-1148.4 127.46,-1148.4 127.46,-968.4 447.5,-968.4 447.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="175.75" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Equipo de infraestructura</text>
</g>
<!-- sharedstorage -->
<g id="node12" class="node">
<title>sharedstorage</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="447.5,-825.6 127.46,-825.6 127.46,-645.6 447.5,-645.6 447.5,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="198.54" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared File Storage</text>
</g>
<!-- ingresscontroller -->
<g id="node13" class="node">
<title>ingresscontroller</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="504.5,-502.8 184.46,-502.8 184.46,-322.8 504.5,-322.8 504.5,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="265.56" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Ingress Controller</text>
</g>
<!-- scheduleractor -->
<g id="node14" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2891.5,-1148.4 2571.46,-1148.4 2571.46,-968.4 2891.5,-968.4 2891.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="2686.45" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- appservice -->
<g id="node15" class="node">
<title>appservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4274.5,-1148.4 3954.46,-1148.4 3954.46,-968.4 4274.5,-968.4 4274.5,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="4009.98" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Service</text>
</g>
<!-- externalapi -->
<g id="node16" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2855.5,-180 2535.46,-180 2535.46,0 2855.5,0 2855.5,-180"/>
<text xml:space="preserve" text-anchor="start" x="2633.23" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- db -->
<g id="node17" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3285.5,-180 2965.46,-180 2965.46,0 3285.5,0 3285.5,-180"/>
<text xml:space="preserve" text-anchor="start" x="3071.01" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node18" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1995.5,-180 1675.46,-180 1675.46,0 1995.5,0 1995.5,-180"/>
<text xml:space="preserve" text-anchor="start" x="1758.78" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Providers</text>
</g>
<!-- observability -->
<g id="node19" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2425.5,-180 2105.46,-180 2105.46,0 2425.5,0 2425.5,-180"/>
<text xml:space="preserve" text-anchor="start" x="2198.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- user&#45;&gt;loadbalancer -->
<g id="edge1" class="edge">
<title>user&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M823.73,-968.47C804.73,-927.01 782.06,-877.54 762.55,-834.96"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="764.95,-833.91 759.44,-828.18 760.18,-836.09 764.95,-833.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="795.39,-885.6 795.39,-908.4 921.99,-908.4 921.99,-885.6 795.39,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="798.39" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Accede por HTTPS</text>
</g>
<!-- user&#45;&gt;integrationhub -->
<g id="edge2" class="edge">
<title>user&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M940.12,-968.82C1025.8,-874.28 1174.26,-727.14 1332.93,-645.6 1602.16,-507.24 1954.49,-450.39 2160.31,-427.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2160.43,-430.45 2167.6,-427.04 2159.86,-425.24 2160.43,-430.45"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1332.93,-724.2 1332.93,-747 1519.48,-747 1519.48,-724.2 1332.93,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="1335.93" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- loadbalancer&#45;&gt;ingresscontroller -->
<g id="edge15" class="edge">
<title>loadbalancer&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M616.84,-645.71C586.32,-618.93 552.63,-589.56 521.48,-562.8 501.22,-545.39 479.54,-526.98 458.54,-509.25"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="460.27,-507.27 452.85,-504.44 456.89,-511.28 460.27,-507.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="542.89,-562.8 542.89,-585.6 702.18,-585.6 702.18,-562.8 542.89,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="545.89" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reenvia trafico al cluster</text>
</g>
<!-- integrationhub&#45;&gt;iam -->
<g id="edge18" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2490.25,-381.06C2690.6,-341.16 3043.8,-266.33 3340.48,-180 3366.97,-172.29 3394.75,-163.34 3421.77,-154.15"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3422.58,-156.64 3428.83,-151.73 3420.88,-151.68 3422.58,-156.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3093.52,-240 3093.52,-262.8 3120.51,-262.8 3120.51,-240 3093.52,-240"/>
<text xml:space="preserve" text-anchor="start" x="3096.52" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge17" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2431.67,-322.87C2479.83,-280.53 2537.49,-229.86 2586.6,-186.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2588.24,-188.75 2592.14,-181.83 2584.77,-184.81 2588.24,-188.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2523.92,-240 2523.92,-262.8 2550.92,-262.8 2550.92,-240 2523.92,-240"/>
<text xml:space="preserve" text-anchor="start" x="2526.92" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge19" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2490.4,-348.5C2607,-302.19 2768.72,-237.66 2910.48,-180 2925.28,-173.98 2940.63,-167.7 2956.02,-161.38"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2956.86,-163.87 2962.8,-158.59 2954.87,-159.01 2956.86,-163.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2751.42,-240 2751.42,-262.8 2778.41,-262.8 2778.41,-240 2751.42,-240"/>
<text xml:space="preserve" text-anchor="start" x="2754.42" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge20" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2193.25,-322.87C2127.26,-280.1 2048.13,-228.81 1981.08,-185.36"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1982.81,-183.35 1975.08,-181.48 1979.95,-187.76 1982.81,-183.35"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2097.82,-240 2097.82,-262.8 2124.81,-262.8 2124.81,-240 2097.82,-240"/>
<text xml:space="preserve" text-anchor="start" x="2100.82" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge21" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2312.46,-322.87C2304.09,-281.58 2294.12,-232.35 2285.52,-189.9"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2288.14,-189.63 2284.08,-182.8 2283,-190.67 2288.14,-189.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2299.93,-240 2299.93,-262.8 2396.19,-262.8 2396.19,-240 2299.93,-240"/>
<text xml:space="preserve" text-anchor="start" x="2302.93" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- admin&#45;&gt;loadbalancer -->
<g id="edge3" class="edge">
<title>admin&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1194.56,-976.86C1100.66,-929.58 982.08,-869.86 886.63,-821.79"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="888.05,-819.56 880.17,-818.53 885.69,-824.25 888.05,-819.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1055.08,-885.6 1055.08,-908.4 1201.11,-908.4 1201.11,-885.6 1055.08,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="1058.08" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Administra por HTTPS</text>
</g>
<!-- admin&#45;&gt;integrationhub -->
<g id="edge4" class="edge">
<title>admin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1420.33,-968.69C1492.18,-877.17 1614.88,-735.47 1748.13,-645.6 1875.49,-559.7 2039.49,-498.05 2160.97,-460.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2161.48,-462.62 2167.86,-457.88 2159.92,-457.6 2161.48,-462.62"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1748.13,-724.2 1748.13,-747 1991.48,-747 1991.48,-724.2 1748.13,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="1751.13" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- platformadmin&#45;&gt;vault -->
<g id="edge5" class="edge">
<title>platformadmin&#45;&gt;vault</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3606.3,-968.47C3569.32,-926.4 3525.09,-876.08 3487.3,-833.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3489.49,-831.6 3482.56,-827.7 3485.54,-835.07 3489.49,-831.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3551.93,-885.6 3551.93,-908.4 3598.39,-908.4 3598.39,-885.6 3551.93,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="3554.93" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge6" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3675.94,-968.65C3658.55,-788.01 3619.17,-378.78 3601,-189.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3603.64,-189.95 3600.31,-182.73 3598.41,-190.45 3603.64,-189.95"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3639.05,-562.8 3639.05,-585.6 3685.51,-585.6 3685.51,-562.8 3639.05,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="3642.05" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
</g>
<!-- vault&#45;&gt;integrationhub -->
<g id="edge14" class="edge">
<title>vault&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3242.27,-645.64C3183.61,-615.92 3115.84,-584.81 3051.48,-562.8 2867.93,-500.04 2648.62,-459.32 2500.45,-436.58"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2501.15,-434.03 2493.34,-435.49 2500.36,-439.22 2501.15,-434.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3111.24,-562.8 3111.24,-585.6 3316.46,-585.6 3316.46,-562.8 3111.24,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="3114.24" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- integrationadmin&#45;&gt;integrationhub -->
<g id="edge7" class="edge">
<title>integrationadmin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3056.97,-968.5C2956.2,-883.61 2798.61,-753.08 2657.48,-645.6 2596.53,-599.19 2527.54,-549.83 2468.68,-508.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2470.2,-506.5 2462.55,-504.35 2467.2,-510.8 2470.2,-506.5"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2882.94,-724.2 2882.94,-747 3025.86,-747 3025.86,-724.2 2882.94,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="2885.94" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;01, UC&#45;02, UC&#45;03</text>
</g>
<!-- operator&#45;&gt;integrationhub -->
<g id="edge8" class="edge">
<title>operator&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1926.39,-968.53C1979.49,-883.95 2063.33,-753.88 2142.55,-645.6 2175.75,-600.23 2214.57,-551.67 2248.28,-510.78"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2250.27,-512.5 2253.03,-505.05 2246.23,-509.15 2250.27,-512.5"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2142.55,-724.2 2142.55,-747 2285.48,-747 2285.48,-724.2 2142.55,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="2145.55" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;04, UC&#45;06, UC&#45;08</text>
</g>
<!-- auditor&#45;&gt;integrationhub -->
<g id="edge9" class="edge">
<title>auditor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2305.48,-968.59C2310.86,-849.18 2320.4,-637.53 2326.01,-513.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2328.62,-513.37 2326.34,-505.76 2323.38,-513.13 2328.62,-513.37"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2319.8,-724.2 2319.8,-747 2414.49,-747 2414.49,-724.2 2319.8,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="2322.8" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;06, UC&#45;07</text>
</g>
<!-- infrateam&#45;&gt;loadbalancer -->
<g id="edge10" class="edge">
<title>infrateam&#45;&gt;loadbalancer</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M406.69,-968.47C463.78,-925.87 532.19,-874.83 590.29,-831.49"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="591.54,-833.83 595.99,-827.24 588.4,-829.62 591.54,-833.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="515.37,-885.6 515.37,-908.4 561.83,-908.4 561.83,-885.6 515.37,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="518.37" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- infrateam&#45;&gt;sharedstorage -->
<g id="edge11" class="edge">
<title>infrateam&#45;&gt;sharedstorage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M287.48,-968.47C287.48,-927.27 287.48,-878.16 287.48,-835.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="290.1,-835.96 287.48,-828.46 284.85,-835.96 290.1,-835.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="287.48,-885.6 287.48,-908.4 333.93,-908.4 333.93,-885.6 287.48,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="290.48" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- infrateam&#45;&gt;ingresscontroller -->
<g id="edge12" class="edge">
<title>infrateam&#45;&gt;ingresscontroller</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M145.72,-968.49C98.53,-930.76 51.53,-882.31 26.02,-825.6 -6.8,-752.64 -10.26,-716.9 26.02,-645.6 58.47,-581.85 117.57,-531.5 176.13,-494.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="177.23,-496.64 182.19,-490.44 174.44,-492.19 177.23,-496.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="26.02,-724.2 26.02,-747 72.48,-747 72.48,-724.2 26.02,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="29.02" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- sharedstorage&#45;&gt;integrationhub -->
<g id="edge16" class="edge">
<title>sharedstorage&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M285.4,-646.01C289.45,-615.33 299.9,-583.48 323.52,-562.8 392.25,-502.64 1688.2,-441.33 2160.3,-420.9"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2160.21,-423.53 2167.59,-420.59 2159.98,-418.29 2160.21,-423.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="323.52,-562.8 323.52,-585.6 494.48,-585.6 494.48,-562.8 323.52,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="326.52" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- scheduleractor&#45;&gt;integrationhub -->
<g id="edge13" class="edge">
<title>scheduleractor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2676.14,-968.59C2601.45,-848.7 2468.82,-635.83 2391.37,-511.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2393.69,-510.28 2387.49,-505.3 2389.23,-513.06 2393.69,-510.28"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2583.88,-724.2 2583.88,-747 2630.34,-747 2630.34,-724.2 2583.88,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="2586.88" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;05</text>
</g>
</g>
</svg>
`;case"context":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3360pt" height="856pt"
 viewBox="0.00 0.00 3360.00 856.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 840.65)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2900.04,-825.6 2580,-825.6 2580,-645.6 2900.04,-645.6 2900.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2653.85" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- integrationhub -->
<g id="node2" class="node">
<title>integrationhub</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-502.8 1290,-502.8 1290,-322.8 1610.04,-322.8 1610.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1341.63" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Platform</text>
</g>
<!-- admin -->
<g id="node3" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="750.04,-825.6 430,-825.6 430,-645.6 750.04,-645.6 750.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="452.17" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node4" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1180.04,-825.6 860,-825.6 860,-645.6 1180.04,-645.6 1180.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="941.64" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node5" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1610.04,-825.6 1290,-825.6 1290,-645.6 1610.04,-645.6 1610.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1410.56" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node6" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2040.04,-825.6 1720,-825.6 1720,-645.6 2040.04,-645.6 2040.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1848.34" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- infrateam -->
<g id="node7" class="node">
<title>infrateam</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3330.04,-825.6 3010,-825.6 3010,-645.6 3330.04,-645.6 3330.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3058.29" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Equipo de infraestructura</text>
</g>
<!-- scheduleractor -->
<g id="node8" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2470.04,-825.6 2150,-825.6 2150,-645.6 2470.04,-645.6 2470.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2264.99" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- platformadmin -->
<g id="node9" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-825.6 0,-825.6 0,-645.6 320.04,-645.6 320.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="91.67" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- iam -->
<g id="node10" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="428.04,-180 108,-180 108,0 428.04,0 428.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="227.44" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node11" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1073.04,-180 753,-180 753,0 1073.04,0 1073.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="858.55" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node12" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1503.04,-180 1183,-180 1183,0 1503.04,0 1503.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1266.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Providers</text>
</g>
<!-- externalapi -->
<g id="node13" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1933.04,-180 1613,-180 1613,0 1933.04,0 1933.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1710.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- observability -->
<g id="node14" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2363.04,-180 2043,-180 2043,0 2363.04,0 2363.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2136.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- user&#45;&gt;integrationhub -->
<g id="edge1" class="edge">
<title>user&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2580.05,-664.69C2561.66,-657.76 2543.05,-651.22 2525.02,-645.6 2211.5,-547.78 1833.94,-476.76 1619.96,-440.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1620.71,-438.15 1612.88,-439.5 1619.84,-443.33 1620.71,-438.15"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2293.24,-562.8 2293.24,-585.6 2479.79,-585.6 2479.79,-562.8 2293.24,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2296.24" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- integrationhub&#45;&gt;iam -->
<g id="edge8" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1290.3,-368.45C1067.61,-308.01 665.58,-198.9 437.69,-137.05"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="438.49,-134.55 430.56,-135.11 437.11,-139.61 438.49,-134.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="894.46,-240 894.46,-262.8 921.45,-262.8 921.45,-240 894.46,-240"/>
<text xml:space="preserve" text-anchor="start" x="897.46" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge9" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1301.15,-322.87C1229.41,-280.01 1143.36,-228.6 1070.53,-185.1"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1072.1,-182.97 1064.31,-181.38 1069.41,-187.48 1072.1,-182.97"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1197.62,-240 1197.62,-262.8 1224.61,-262.8 1224.61,-240 1197.62,-240"/>
<text xml:space="preserve" text-anchor="start" x="1200.62" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge10" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1420.36,-322.87C1406.56,-281.49 1390.1,-232.15 1375.92,-189.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1378.47,-188.99 1373.61,-182.7 1373.49,-190.65 1378.47,-188.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1399.73,-240 1399.73,-262.8 1426.72,-262.8 1426.72,-240 1399.73,-240"/>
<text xml:space="preserve" text-anchor="start" x="1402.73" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge11" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1539.56,-322.87C1582.01,-280.71 1632.79,-230.27 1676.14,-187.22"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1677.96,-189.11 1681.43,-181.96 1674.26,-185.39 1677.96,-189.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1621.2,-240 1621.2,-262.8 1648.2,-262.8 1648.2,-240 1621.2,-240"/>
<text xml:space="preserve" text-anchor="start" x="1624.2" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge12" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1609.71,-343.77C1734.27,-290.7 1906.86,-217.17 2033.79,-163.1"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2034.58,-165.61 2040.45,-160.26 2032.52,-160.78 2034.58,-165.61"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1849.1,-240 1849.1,-262.8 1945.36,-262.8 1945.36,-240 1849.1,-240"/>
<text xml:space="preserve" text-anchor="start" x="1852.1" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- admin&#45;&gt;integrationhub -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M749.74,-652.26C811.85,-621.96 884.19,-588.74 951.67,-562.8 1059.03,-521.53 1182.93,-484.44 1280.33,-457.59"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1280.82,-460.18 1287.35,-455.66 1279.43,-455.11 1280.82,-460.18"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="951.67,-562.8 951.67,-585.6 1195.02,-585.6 1195.02,-562.8 951.67,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="954.67" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;integrationhub -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1139.23,-645.67C1196.32,-603.07 1264.74,-552.03 1322.83,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1324.09,-511.03 1328.53,-504.44 1320.95,-506.82 1324.09,-511.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1247.91,-562.8 1247.91,-585.6 1390.84,-585.6 1390.84,-562.8 1247.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1250.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;01, UC&#45;02, UC&#45;03</text>
</g>
<!-- operator&#45;&gt;integrationhub -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1450.02,-645.67C1450.02,-604.47 1450.02,-555.36 1450.02,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1452.65,-513.16 1450.02,-505.66 1447.4,-513.16 1452.65,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1450.02,-562.8 1450.02,-585.6 1592.94,-585.6 1592.94,-562.8 1450.02,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1453.02" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;04, UC&#45;06, UC&#45;08</text>
</g>
<!-- auditor&#45;&gt;integrationhub -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1760.81,-645.67C1703.72,-603.07 1635.3,-552.03 1577.21,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1579.09,-506.82 1571.51,-504.44 1575.95,-511.03 1579.09,-506.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1677.91,-562.8 1677.91,-585.6 1772.6,-585.6 1772.6,-562.8 1677.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1680.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;06, UC&#45;07</text>
</g>
<!-- scheduleractor&#45;&gt;integrationhub -->
<g id="edge6" class="edge">
<title>scheduleractor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2150.1,-667.42C2131.58,-659.93 2112.92,-652.52 2095.02,-645.6 1934.76,-583.67 1750.1,-517.86 1619.54,-472.25"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1620.64,-469.86 1612.7,-469.86 1618.91,-474.81 1620.64,-469.86"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1918.83,-562.8 1918.83,-585.6 1965.28,-585.6 1965.28,-562.8 1918.83,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1921.83" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;05</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge7" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M174.92,-645.79C194.96,-526.38 230.48,-314.73 251.37,-190.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="253.94,-190.75 252.6,-182.92 248.77,-189.88 253.94,-190.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="228.27,-401.4 228.27,-424.2 274.72,-424.2 274.72,-401.4 228.27,-401.4"/>
<text xml:space="preserve" text-anchor="start" x="231.27" y="-408.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
</g>
</g>
</svg>
`;case"containers":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3360pt" height="1518pt"
 viewBox="0.00 0.00 3360.00 1518.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1503.05)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1395.04,-1488 1075,-1488 1075,-1308 1395.04,-1308 1395.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="1148.85" y="-1392" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- adminconsole -->
<g id="node2" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2255.04,-1165.2 1935,-1165.2 1935,-985.2 2255.04,-985.2 2255.04,-1165.2"/>
<text xml:space="preserve" text-anchor="start" x="2027.21" y="-1069.2" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- admin -->
<g id="node3" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1825.04,-1488 1505,-1488 1505,-1308 1825.04,-1308 1825.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="1527.17" y="-1392" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node4" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2255.04,-1488 1935,-1488 1935,-1308 2255.04,-1308 2255.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="2016.64" y="-1392" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node5" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2685.04,-1488 2365,-1488 2365,-1308 2685.04,-1308 2685.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="2485.56" y="-1392" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node6" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3115.04,-1488 2795,-1488 2795,-1308 3115.04,-1308 3115.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="2923.34" y="-1392" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- quarkusapp -->
<g id="node7" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2255.04,-842.4 1935,-842.4 1935,-662.4 2255.04,-662.4 2255.04,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="2005.53" y="-746.4" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- iam -->
<g id="node8" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="3330.04,-502.8 3010,-502.8 3010,-322.8 3330.04,-322.8 3330.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="3129.44" y="-406.8" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node9" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="105.55" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- filesystem -->
<g id="node10" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="750.04,-502.8 430,-502.8 430,-322.8 750.04,-322.8 750.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="537.79" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node11" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1180.04,-502.8 860,-502.8 860,-322.8 1180.04,-322.8 1180.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1001.13" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node12" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1610.04,-502.8 1290,-502.8 1290,-322.8 1610.04,-322.8 1610.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1424.46" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node13" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2040.04,-502.8 1720,-502.8 1720,-322.8 2040.04,-322.8 2040.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1818.89" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- externalapi -->
<g id="node14" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-502.8 2150,-502.8 2150,-322.8 2470.04,-322.8 2470.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2247.77" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- otel -->
<g id="node15" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2900.04,-502.8 2580,-502.8 2580,-322.8 2900.04,-322.8 2900.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2628.87" y="-406.8" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node16" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2900.04,-180 2580,-180 2580,0 2900.04,0 2900.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2709.44" y="-84" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1394.74,-1311.81C1453.98,-1282.12 1522.35,-1250.06 1586.47,-1225.2 1697.09,-1182.31 1825.31,-1144.83 1925.32,-1118.18"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1925.72,-1120.79 1932.29,-1116.33 1924.37,-1115.72 1925.72,-1120.79"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1586.47,-1225.2 1586.47,-1248 1773.02,-1248 1773.02,-1225.2 1586.47,-1225.2"/>
<text xml:space="preserve" text-anchor="start" x="1589.47" y="-1232.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge6" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2095.02,-985.27C2095.02,-944.07 2095.02,-894.96 2095.02,-852.57"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2097.65,-852.76 2095.02,-845.26 2092.4,-852.76 2097.65,-852.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2095.02,-902.4 2095.02,-925.2 2244.99,-925.2 2244.99,-902.4 2095.02,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="2098.02" y="-909.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge7" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2254.69,-994.03C2426.7,-905.46 2706.22,-755.07 2933.02,-602.4 2975.07,-574.1 3019.05,-540.37 3057.55,-509.31"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3059.16,-511.39 3063.33,-504.63 3055.85,-507.31 3059.16,-511.39"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2835.84,-741 2835.84,-763.8 2964.79,-763.8 2964.79,-741 2835.84,-741"/>
<text xml:space="preserve" text-anchor="start" x="2838.84" y="-748.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1737.65,-1308.19C1763.39,-1279.74 1793.7,-1249.38 1824.67,-1225.2 1855.82,-1200.88 1891.46,-1178.2 1926.42,-1158.24"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1927.42,-1160.7 1932.66,-1154.72 1924.84,-1156.13 1927.42,-1160.7"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1824.67,-1225.2 1824.67,-1248 2068.02,-1248 2068.02,-1225.2 1824.67,-1225.2"/>
<text xml:space="preserve" text-anchor="start" x="1827.67" y="-1232.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;adminconsole -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2095.02,-1308.07C2095.02,-1266.87 2095.02,-1217.76 2095.02,-1175.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2097.65,-1175.56 2095.02,-1168.06 2092.4,-1175.56 2097.65,-1175.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2095.02,-1225.2 2095.02,-1248 2237.94,-1248 2237.94,-1225.2 2095.02,-1225.2"/>
<text xml:space="preserve" text-anchor="start" x="2098.02" y="-1232.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;01, UC&#45;02, UC&#45;03</text>
</g>
<!-- operator&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2405.81,-1308.07C2348.72,-1265.47 2280.3,-1214.43 2222.21,-1171.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2224.09,-1169.22 2216.51,-1166.84 2220.95,-1173.43 2224.09,-1169.22"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2322.91,-1225.2 2322.91,-1248 2465.84,-1248 2465.84,-1225.2 2322.91,-1225.2"/>
<text xml:space="preserve" text-anchor="start" x="2325.91" y="-1232.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;04, UC&#45;06, UC&#45;08</text>
</g>
<!-- auditor&#45;&gt;adminconsole -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2795.1,-1329.82C2776.58,-1322.33 2757.92,-1314.92 2740.02,-1308 2579.76,-1246.07 2395.1,-1180.26 2264.54,-1134.65"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2265.64,-1132.26 2257.7,-1132.26 2263.91,-1137.21 2265.64,-1132.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2563.83,-1225.2 2563.83,-1248 2658.52,-1248 2658.52,-1225.2 2563.83,-1225.2"/>
<text xml:space="preserve" text-anchor="start" x="2566.83" y="-1232.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;06, UC&#45;07</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge8" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2254.8,-710.91C2428.74,-665.51 2714.28,-587.13 2955.02,-502.8 2969.94,-497.57 2985.32,-491.87 3000.67,-485.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3001.36,-488.49 3007.4,-483.33 2999.46,-483.6 3001.36,-488.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2768.84,-571.2 2768.84,-594 2906.36,-594 2906.36,-571.2 2768.84,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="2771.84" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge9" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.08,-739.87C1686.77,-720.49 1194.14,-676.09 781.34,-602.4 598.3,-569.72 551.72,-560.66 375.02,-502.8 360.08,-497.91 344.71,-492.44 329.39,-486.7"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.63,-484.36 322.69,-484.16 328.77,-489.27 330.63,-484.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="781.34,-562.8 781.34,-602.4 1020.02,-602.4 1020.02,-562.8 781.34,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="784.34" y="-586.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="784.34" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;filesystem -->
<g id="edge10" class="edge">
<title>quarkusapp&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.04,-732.44C1688.36,-700.58 1202.08,-627.25 805.02,-502.8 790.1,-498.12 774.77,-492.82 759.5,-487.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="760.79,-484.88 752.84,-484.72 758.95,-489.8 760.79,-484.88"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1153.13,-571.2 1153.13,-594 1285.98,-594 1285.98,-571.2 1153.13,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1156.13" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- quarkusapp&#45;&gt;ftp -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.24,-710.91C1761.3,-665.51 1475.76,-587.13 1235.02,-502.8 1220.1,-497.57 1204.72,-491.87 1189.37,-485.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1190.58,-483.6 1182.64,-483.33 1188.68,-488.49 1190.58,-483.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1539.58,-571.2 1539.58,-594 1661.52,-594 1661.52,-571.2 1539.58,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1542.58" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;sftp -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.17,-667.73C1839.02,-617.41 1716.76,-553.41 1619.02,-502.26"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1620.48,-500.06 1612.62,-498.91 1618.05,-504.71 1620.48,-500.06"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1791.86,-571.2 1791.86,-594 1913.8,-594 1913.8,-571.2 1791.86,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1794.86" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;restsource -->
<g id="edge13" class="edge">
<title>quarkusapp&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2038.53,-662.7C2008.96,-616.26 1972.68,-559.29 1942.29,-511.58"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1944.56,-510.26 1938.32,-505.34 1940.13,-513.08 1944.56,-510.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1993.97,-571.2 1993.97,-594 2163.39,-594 2163.39,-571.2 1993.97,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1996.97" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge14" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2151.55,-662.77C2164.21,-642.91 2177.58,-621.94 2190.02,-602.4 2208.9,-572.76 2229.44,-540.48 2248.1,-511.15"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2250.13,-512.85 2251.95,-505.11 2245.7,-510.03 2250.13,-512.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2213,-571.2 2213,-594 2366.09,-594 2366.09,-571.2 2213,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="2216" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge15" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2254.83,-672.76C2299.69,-650.33 2348.4,-625.67 2393.02,-602.4 2451.45,-571.93 2514.91,-537.75 2571.4,-506.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2572.42,-509.38 2577.74,-503.49 2569.9,-504.78 2572.42,-509.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2459.86,-571.2 2459.86,-594 2556.13,-594 2556.13,-571.2 2459.86,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="2462.86" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge16" class="edge">
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
<svg width="1730pt" height="1235pt"
 viewBox="0.00 0.00 1730.00 1235.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1220.05)">
<g id="clust1" class="cluster">
<title>cluster_adminconsole</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="8,-593 8,-1197 1268,-1197 1268,-593 8,-593"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-1184.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">ADMIN CONSOLE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_quarkusapp</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="432,-261 432,-542.2 1692,-542.2 1692,-261 432,-261"/>
<text xml:space="preserve" text-anchor="start" x="440" y="-529.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">QUARKUS NATIVE APP</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="798.02,-813 477.98,-813 477.98,-633 798.02,-633 798.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="559.08" y="-717" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Designer</text>
</g>
<!-- operationsconsole -->
<g id="node4" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1228.02,-813 907.98,-813 907.98,-633 1228.02,-633 1228.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="979.62" y="-717" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- adminapi -->
<g id="node5" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="792.02,-481 471.98,-481 471.98,-301 792.02,-301 792.02,-481"/>
<text xml:space="preserve" text-anchor="start" x="584.76" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- executionapi -->
<g id="node6" class="node">
<title>executionapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1222.02,-481 901.98,-481 901.98,-301 1222.02,-301 1222.02,-481"/>
<text xml:space="preserve" text-anchor="start" x="999.19" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Execution API</text>
</g>
<!-- queryapi -->
<g id="node7" class="node">
<title>queryapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1652.02,-481 1331.98,-481 1331.98,-301 1652.02,-301 1652.02,-481"/>
<text xml:space="preserve" text-anchor="start" x="1445.87" y="-385" font-family="Arial" font-size="20.00" fill="#eff6ff">Query API</text>
</g>
<!-- user -->
<g id="node8" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1658.02,-1135.8 1337.98,-1135.8 1337.98,-955.8 1658.02,-955.8 1658.02,-1135.8"/>
<text xml:space="preserve" text-anchor="start" x="1411.83" y="-1039.8" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node9" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1658.02,-813 1337.98,-813 1337.98,-633 1658.02,-633 1658.02,-813"/>
<text xml:space="preserve" text-anchor="start" x="1360.15" y="-717" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- iam -->
<g id="node10" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="1652.02,-180 1331.98,-180 1331.98,0 1652.02,0 1652.02,-180"/>
<text xml:space="preserve" text-anchor="start" x="1451.42" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- reactapp&#45;&gt;oidcclient -->
<g id="edge2" class="edge">
<title>reactapp&#45;&gt;oidcclient</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M518.79,-955.87C461.7,-913.27 393.28,-862.23 335.19,-818.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="337.07,-817.02 329.49,-814.64 333.93,-821.23 337.07,-817.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="435.89,-873 435.89,-895.8 542.29,-895.8 542.29,-873 435.89,-873"/>
<text xml:space="preserve" text-anchor="start" x="438.89" y="-880.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Gestiona sesion</text>
</g>
<!-- reactapp&#45;&gt;processdesigner -->
<g id="edge3" class="edge">
<title>reactapp&#45;&gt;processdesigner</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M638,-955.87C638,-914.67 638,-865.56 638,-823.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="640.63,-823.36 638,-815.86 635.38,-823.36 640.63,-823.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="638,-873 638,-895.8 735.06,-895.8 735.06,-873 638,-873"/>
<text xml:space="preserve" text-anchor="start" x="641" y="-880.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Edita pipelines</text>
</g>
<!-- reactapp&#45;&gt;operationsconsole -->
<g id="edge4" class="edge">
<title>reactapp&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M757.21,-955.87C814.3,-913.27 882.72,-862.23 940.81,-818.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="942.07,-821.23 946.51,-814.64 938.93,-817.02 942.07,-821.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="865.89,-873 865.89,-895.8 1004.98,-895.8 1004.98,-873 865.89,-873"/>
<text xml:space="preserve" text-anchor="start" x="868.89" y="-880.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta ejecuciones</text>
</g>
<!-- oidcclient&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>oidcclient&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M191.05,-633.4C176.74,-529.24 171.76,-358.27 268.26,-261 341.34,-187.32 1003.25,-127.89 1321.98,-103.27"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1321.94,-105.9 1329.22,-102.71 1321.54,-100.67 1321.94,-105.9"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="268.26,-379.6 268.26,-402.4 405,-402.4 405,-379.6 268.26,-379.6"/>
<text xml:space="preserve" text-anchor="start" x="271.26" y="-386.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Login y refresh token</text>
</g>
<!-- processdesigner&#45;&gt;adminapi -->
<g id="edge6" class="edge">
<title>processdesigner&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M636.38,-633.13C635.59,-589.3 634.62,-536.28 633.8,-491.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="636.43,-491.22 633.67,-483.77 631.18,-491.31 636.43,-491.22"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="635.18,-550.2 635.18,-573 836.49,-573 836.49,-550.2 635.18,-550.2"/>
<text xml:space="preserve" text-anchor="start" x="638.18" y="-557.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">CRUD de catalogos y procesos</text>
</g>
<!-- operationsconsole&#45;&gt;executionapi -->
<g id="edge7" class="edge">
<title>operationsconsole&#45;&gt;executionapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1066.38,-633.13C1065.59,-589.3 1064.62,-536.28 1063.8,-491.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1066.43,-491.22 1063.67,-483.77 1061.18,-491.31 1066.43,-491.22"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1065.18,-550.2 1065.18,-573 1178.57,-573 1178.57,-550.2 1065.18,-550.2"/>
<text xml:space="preserve" text-anchor="start" x="1068.18" y="-557.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta procesos</text>
</g>
<!-- operationsconsole&#45;&gt;queryapi -->
<g id="edge8" class="edge">
<title>operationsconsole&#45;&gt;queryapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1182.18,-633.13C1240.16,-588.01 1310.64,-533.15 1369.72,-487.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1371.29,-489.28 1375.59,-482.6 1368.06,-485.13 1371.29,-489.28"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1280,-550.2 1280,-573 1439.31,-573 1439.31,-550.2 1280,-550.2"/>
<text xml:space="preserve" text-anchor="start" x="1283" y="-557.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta jobs y auditoria</text>
</g>
<!-- queryapi&#45;&gt;iam -->
<g id="edge9" class="edge">
<title>queryapi&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1492,-261C1492,-237.31 1492,-212.93 1492,-190.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1494.63,-190.34 1492,-182.84 1489.38,-190.34 1494.63,-190.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1354.48,-220.25 1354.48,-243.05 1492,-243.05 1492,-220.25 1354.48,-220.25"/>
<text xml:space="preserve" text-anchor="start" x="1357.48" y="-227.45" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- user&#45;&gt;admin -->
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
<text xml:space="preserve" text-anchor="start" x="1166.19" y="-1289.8" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node4" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1394.02,-1028 1073.98,-1028 1073.98,-848 1394.02,-848 1394.02,-1028"/>
<text xml:space="preserve" text-anchor="start" x="1144.51" y="-932" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
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
<text xml:space="preserve" text-anchor="start" x="1542.66" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- adminconsole_1 -->
<g id="node7" class="node">
<title>adminconsole_1</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1300.5,-1550 980.46,-1550 980.46,-1370 1300.5,-1370 1300.5,-1550"/>
<text xml:space="preserve" text-anchor="start" x="1072.66" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node8" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1770.5,-1192.2 1450.46,-1192.2 1450.46,-1012.2 1770.5,-1012.2 1770.5,-1192.2"/>
<text xml:space="preserve" text-anchor="start" x="1520.99" y="-1096.2" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- quarkusapp_1 -->
<g id="node9" class="node">
<title>quarkusapp_1</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1300.5,-1192.2 980.46,-1192.2 980.46,-1012.2 1300.5,-1012.2 1300.5,-1192.2"/>
<text xml:space="preserve" text-anchor="start" x="1050.99" y="-1096.2" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
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
<svg width="2899pt" height="210pt"
 viewBox="0.00 0.00 2899.00 210.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
<!-- adminapi -->
<g id="node3" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1650.88,-180 1330.84,-180 1330.84,0 1650.88,0 1650.88,-180"/>
<text xml:space="preserve" text-anchor="start" x="1443.62" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- processcatalogservice -->
<g id="node4" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2237.32,-180 1917.28,-180 1917.28,0 2237.32,0 2237.32,-180"/>
<text xml:space="preserve" text-anchor="start" x="1973.36" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- db -->
<g id="node5" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2868.89,-180 2548.85,-180 2548.85,0 2868.89,0 2868.89,-180"/>
<text xml:space="preserve" text-anchor="start" x="2654.4" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
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
<!-- processdesigner&#45;&gt;adminapi -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1013.86,-90C1107.35,-90 1225.5,-90 1320.69,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1320.48,-92.63 1327.98,-90 1320.48,-87.38 1320.48,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1076.87,-93 1076.87,-125.8 1100.87,-125.8 1100.87,-93 1076.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1084.98" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1103.87,-93 1103.87,-125.8 1267.84,-125.8 1267.84,-93 1103.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1106.87" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra source definition</text>
</g>
<!-- adminapi&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>adminapi&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1650.79,-90C1730.21,-90 1826.34,-90 1907.12,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1906.87,-92.63 1914.37,-90 1906.87,-87.38 1906.87,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1713.88,-93 1713.88,-125.8 1737.88,-125.8 1737.88,-93 1713.88,-93"/>
<text xml:space="preserve" text-anchor="start" x="1721.99" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1740.88,-93 1740.88,-125.8 1854.28,-125.8 1854.28,-93 1740.88,-93"/>
<text xml:space="preserve" text-anchor="start" x="1743.88" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste catalogo</text>
</g>
<!-- processcatalogservice&#45;&gt;db -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2237.17,-90C2329.16,-90 2444.91,-90 2538.61,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2538.53,-92.63 2546.03,-90 2538.53,-87.38 2538.53,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2300.32,-93 2300.32,-125.8 2324.32,-125.8 2324.32,-93 2300.32,-93"/>
<text xml:space="preserve" text-anchor="start" x="2308.42" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2327.32,-93 2327.32,-125.8 2485.85,-125.8 2485.85,-93 2327.32,-93"/>
<text xml:space="preserve" text-anchor="start" x="2330.32" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda source definition</text>
</g>
</g>
</svg>
`;case"usecase_uc02_reader":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2825pt" height="210pt"
 viewBox="0.00 0.00 2825.00 210.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
<!-- adminapi -->
<g id="node3" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1578.5,-180 1258.46,-180 1258.46,0 1578.5,0 1578.5,-180"/>
<text xml:space="preserve" text-anchor="start" x="1371.24" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- processcatalogservice -->
<g id="node4" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2164.93,-180 1844.89,-180 1844.89,0 2164.93,0 2164.93,-180"/>
<text xml:space="preserve" text-anchor="start" x="1900.97" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- db -->
<g id="node5" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2794.96,-180 2474.92,-180 2474.92,0 2794.96,0 2794.96,-180"/>
<text xml:space="preserve" text-anchor="start" x="2580.46" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
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
<!-- processdesigner&#45;&gt;adminapi -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M942.64,-90C1035.81,-90 1153.53,-90 1248.45,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1248.21,-92.63 1255.71,-90 1248.21,-87.38 1248.21,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1006.04,-93 1006.04,-125.8 1030.04,-125.8 1030.04,-93 1006.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="1014.14" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1033.04,-93 1033.04,-125.8 1195.46,-125.8 1195.46,-93 1033.04,-93"/>
<text xml:space="preserve" text-anchor="start" x="1036.04" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra reader definition</text>
</g>
<!-- adminapi&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>adminapi&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1578.4,-90C1657.82,-90 1753.95,-90 1834.74,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1834.49,-92.63 1841.99,-90 1834.49,-87.38 1834.49,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1641.5,-93 1641.5,-125.8 1665.5,-125.8 1665.5,-93 1641.5,-93"/>
<text xml:space="preserve" text-anchor="start" x="1649.6" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1668.5,-93 1668.5,-125.8 1781.89,-125.8 1781.89,-93 1668.5,-93"/>
<text xml:space="preserve" text-anchor="start" x="1671.5" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste catalogo</text>
</g>
<!-- processcatalogservice&#45;&gt;db -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2164.79,-90C2256.39,-90 2371.49,-90 2464.77,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2464.64,-92.63 2472.14,-90 2464.64,-87.38 2464.64,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2227.93,-93 2227.93,-125.8 2251.93,-125.8 2251.93,-93 2227.93,-93"/>
<text xml:space="preserve" text-anchor="start" x="2236.04" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2254.93,-93 2254.93,-125.8 2411.92,-125.8 2411.92,-93 2254.93,-93"/>
<text xml:space="preserve" text-anchor="start" x="2257.93" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda reader definition</text>
</g>
</g>
</svg>
`;case"usecase_uc03_process":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2954pt" height="210pt"
 viewBox="0.00 0.00 2954.00 210.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
<!-- adminapi -->
<g id="node3" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1622.87,-180 1302.83,-180 1302.83,0 1622.87,0 1622.87,-180"/>
<text xml:space="preserve" text-anchor="start" x="1415.61" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- processcatalogservice -->
<g id="node4" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2245.09,-180 1925.05,-180 1925.05,0 2245.09,0 2245.09,-180"/>
<text xml:space="preserve" text-anchor="start" x="1981.13" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- db -->
<g id="node5" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2924.12,-180 2604.08,-180 2604.08,0 2924.12,0 2924.12,-180"/>
<text xml:space="preserve" text-anchor="start" x="2709.63" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
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
<!-- processdesigner&#45;&gt;adminapi -->
<g id="edge2" class="edge">
<title>processdesigner&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M984.27,-90C1078.16,-90 1196.97,-90 1292.6,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1292.43,-92.63 1299.93,-90 1292.43,-87.38 1292.43,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1047.29,-93 1047.29,-125.8 1071.29,-125.8 1071.29,-93 1047.29,-93"/>
<text xml:space="preserve" text-anchor="start" x="1055.4" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1074.29,-93 1074.29,-125.8 1239.83,-125.8 1239.83,-93 1074.29,-93"/>
<text xml:space="preserve" text-anchor="start" x="1077.29" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda process definition</text>
</g>
<!-- adminapi&#45;&gt;processcatalogservice -->
<g id="edge3" class="edge">
<title>adminapi&#45;&gt;processcatalogservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1622.77,-90C1712.19,-90 1823.82,-90 1914.86,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1914.77,-92.63 1922.27,-90 1914.77,-87.38 1914.77,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1685.87,-93 1685.87,-125.8 1709.87,-125.8 1709.87,-93 1685.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1693.98" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1712.87,-93 1712.87,-125.8 1862.05,-125.8 1862.05,-93 1712.87,-93"/>
<text xml:space="preserve" text-anchor="start" x="1715.87" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida y registra tareas</text>
</g>
<!-- processcatalogservice&#45;&gt;db -->
<g id="edge4" class="edge">
<title>processcatalogservice&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2244.8,-90C2349.68,-90 2487,-90 2593.94,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2593.66,-92.63 2601.16,-90 2593.66,-87.38 2593.66,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2308.09,-93 2308.09,-132.6 2332.09,-132.6 2332.09,-93 2308.09,-93"/>
<text xml:space="preserve" text-anchor="start" x="2316.2" y="-109.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2335.09,-93 2335.09,-132.6 2541.08,-132.6 2541.08,-93 2335.09,-93"/>
<text xml:space="preserve" text-anchor="start" x="2338.09" y="-117" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda process definition y task</text>
<text xml:space="preserve" text-anchor="start" x="2406.56" y="-100.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">definitions</text>
</g>
</g>
</svg>
`;case"usecase_uc04_manual_execution":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3387pt" height="1370pt"
 viewBox="0.00 0.00 3387.00 1370.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1355.05)">
<!-- operator -->
<g id="node1" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-760 0,-760 0,-580 320.04,-580 320.04,-760"/>
<text xml:space="preserve" text-anchor="start" x="120.56" y="-664" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- operationsconsole -->
<g id="node2" class="node">
<title>operationsconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="961.73,-760 641.69,-760 641.69,-580 961.73,-580 961.73,-760"/>
<text xml:space="preserve" text-anchor="start" x="713.32" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">Operations Console</text>
</g>
<!-- executionapi -->
<g id="node3" class="node">
<title>executionapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1548.94,-760 1228.9,-760 1228.9,-580 1548.94,-580 1548.94,-760"/>
<text xml:space="preserve" text-anchor="start" x="1326.11" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">Execution API</text>
</g>
<!-- processengine -->
<g id="node4" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2123.7,-760 1803.66,-760 1803.66,-580 2123.7,-580 2123.7,-760"/>
<text xml:space="preserve" text-anchor="start" x="1893.64" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- sourceregistry -->
<g id="node5" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2721.03,-1340 2400.99,-1340 2400.99,-1160 2721.03,-1160 2721.03,-1340"/>
<text xml:space="preserve" text-anchor="start" x="2449.86" y="-1244" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node6" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2721.03,-1050 2400.99,-1050 2400.99,-870 2721.03,-870 2721.03,-1050"/>
<text xml:space="preserve" text-anchor="start" x="2448.75" y="-954" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node7" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2721.03,-760 2400.99,-760 2400.99,-580 2721.03,-580 2721.03,-760"/>
<text xml:space="preserve" text-anchor="start" x="2465.99" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- restcalltaskprovider -->
<g id="node8" class="node">
<title>restcalltaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2721.03,-470 2400.99,-470 2400.99,-290 2721.03,-290 2721.03,-470"/>
<text xml:space="preserve" text-anchor="start" x="2464.32" y="-374" font-family="Arial" font-size="20.00" fill="#eff6ff">RestCallTaskProvider</text>
</g>
<!-- auditservice -->
<g id="node9" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2721.03,-180 2400.99,-180 2400.99,0 2721.03,0 2721.03,-180"/>
<text xml:space="preserve" text-anchor="start" x="2502.1" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- db -->
<g id="node10" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3356.51,-760 3036.47,-760 3036.47,-580 3356.51,-580 3356.51,-760"/>
<text xml:space="preserve" text-anchor="start" x="3142.02" y="-664" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node11" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3356.51,-470 3036.47,-470 3036.47,-290 3356.51,-290 3356.51,-470"/>
<text xml:space="preserve" text-anchor="start" x="3134.24" y="-374" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- operator&#45;&gt;operationsconsole -->
<g id="edge1" class="edge">
<title>operator&#45;&gt;operationsconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.97,-670C414.66,-670 534.81,-670 631.3,-670"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="631.22,-672.63 638.72,-670 631.22,-667.38 631.22,-672.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-673 383.04,-705.8 407.04,-705.8 407.04,-673 383.04,-673"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-686.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-673 410.04,-705.8 578.69,-705.8 578.69,-673 410.04,-673"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-685.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Selecciona proceso activo</text>
</g>
<!-- operationsconsole&#45;&gt;executionapi -->
<g id="edge2" class="edge">
<title>operationsconsole&#45;&gt;executionapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M961.46,-670C1041.15,-670 1137.72,-670 1218.8,-670"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1218.59,-672.63 1226.09,-670 1218.59,-667.38 1218.59,-672.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1024.73,-673 1024.73,-705.8 1048.73,-705.8 1048.73,-673 1024.73,-673"/>
<text xml:space="preserve" text-anchor="start" x="1032.83" y="-686.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1051.73,-673 1051.73,-705.8 1165.9,-705.8 1165.9,-673 1051.73,-673"/>
<text xml:space="preserve" text-anchor="start" x="1054.73" y="-685.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Solicita ejecucion</text>
</g>
<!-- executionapi&#45;&gt;processengine -->
<g id="edge3" class="edge">
<title>executionapi&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1548.71,-670C1624.91,-670 1716.26,-670 1793.74,-670"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1793.56,-672.63 1801.06,-670 1793.56,-667.38 1793.56,-672.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1611.94,-673 1611.94,-705.8 1635.94,-705.8 1635.94,-673 1611.94,-673"/>
<text xml:space="preserve" text-anchor="start" x="1620.05" y="-686.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1638.94,-673 1638.94,-705.8 1740.66,-705.8 1740.66,-673 1638.94,-673"/>
<text xml:space="preserve" text-anchor="start" x="1641.94" y="-685.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Inicia ejecucion</text>
</g>
<!-- processengine&#45;&gt;sourceregistry -->
<g id="edge4" class="edge">
<title>processengine&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2040.64,-759.82C2081.74,-807.17 2134.13,-865.53 2183.7,-915 2267.95,-999.08 2368.96,-1088.42 2445.11,-1153.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2443.16,-1155.47 2450.56,-1158.35 2446.57,-1151.48 2443.16,-1155.47"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2195.26,-1060.11 2195.26,-1092.91 2219.26,-1092.91 2219.26,-1060.11 2195.26,-1060.11"/>
<text xml:space="preserve" text-anchor="start" x="2203.37" y="-1073.31" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2222.26,-1060.11 2222.26,-1092.91 2329.44,-1092.91 2329.44,-1060.11 2222.26,-1060.11"/>
<text xml:space="preserve" text-anchor="start" x="2225.26" y="-1072.31" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve fuente</text>
</g>
<!-- processengine&#45;&gt;readerregistry -->
<g id="edge5" class="edge">
<title>processengine&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2123.44,-747.33C2206.27,-787.68 2307.61,-837.05 2391.79,-878.05"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2390.57,-880.38 2398.46,-881.3 2392.87,-875.66 2390.57,-880.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2201.87,-852.5 2201.87,-885.3 2225.87,-885.3 2225.87,-852.5 2201.87,-852.5"/>
<text xml:space="preserve" text-anchor="start" x="2209.97" y="-865.7" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2228.87,-852.5 2228.87,-885.3 2322.83,-885.3 2322.83,-852.5 2228.87,-852.5"/>
<text xml:space="preserve" text-anchor="start" x="2231.87" y="-864.7" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee contenido</text>
</g>
<!-- processengine&#45;&gt;dbwritetaskprovider -->
<g id="edge6" class="edge">
<title>processengine&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2123.44,-670C2205.94,-670 2306.79,-670 2390.77,-670"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2390.66,-672.63 2398.16,-670 2390.66,-667.38 2390.66,-672.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2191.78,-673 2191.78,-705.8 2215.78,-705.8 2215.78,-673 2191.78,-673"/>
<text xml:space="preserve" text-anchor="start" x="2199.88" y="-686.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2218.78,-673 2218.78,-705.8 2332.92,-705.8 2332.92,-673 2218.78,-673"/>
<text xml:space="preserve" text-anchor="start" x="2221.78" y="-685.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste registros</text>
</g>
<!-- processengine&#45;&gt;restcalltaskprovider -->
<g id="edge8" class="edge">
<title>processengine&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2123.44,-592.67C2206.27,-552.32 2307.61,-502.95 2391.79,-461.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2392.87,-464.34 2398.46,-458.7 2390.57,-459.62 2392.87,-464.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2186.7,-562.5 2186.7,-595.3 2210.7,-595.3 2210.7,-562.5 2186.7,-562.5"/>
<text xml:space="preserve" text-anchor="start" x="2194.81" y="-575.7" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">8</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2213.7,-562.5 2213.7,-595.3 2337.99,-595.3 2337.99,-562.5 2213.7,-562.5"/>
<text xml:space="preserve" text-anchor="start" x="2216.7" y="-574.7" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca API externa</text>
</g>
<!-- processengine&#45;&gt;auditservice -->
<g id="edge10" class="edge">
<title>processengine&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2040.32,-580.12C2081.45,-532.55 2133.95,-473.87 2183.7,-424.2 2267.7,-340.34 2368.5,-251.39 2444.63,-186.35"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2446.08,-188.56 2450.08,-181.7 2442.67,-184.57 2446.08,-188.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2189.53,-427.2 2189.53,-460 2221.11,-460 2221.11,-427.2 2189.53,-427.2"/>
<text xml:space="preserve" text-anchor="start" x="2197.53" y="-440.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">10</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2224.11,-427.2 2224.11,-460 2335.16,-460 2335.16,-427.2 2224.11,-427.2"/>
<text xml:space="preserve" text-anchor="start" x="2227.11" y="-439.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- dbwritetaskprovider&#45;&gt;db -->
<g id="edge7" class="edge">
<title>dbwritetaskprovider&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2720.64,-670C2813.81,-670 2931.54,-670 3026.46,-670"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3026.22,-672.63 3033.72,-670 3026.22,-667.38 3026.22,-672.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2784.03,-673 2784.03,-705.8 2808.03,-705.8 2808.03,-673 2784.03,-673"/>
<text xml:space="preserve" text-anchor="start" x="2792.14" y="-686.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">7</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2811.03,-673 2811.03,-705.8 2973.47,-705.8 2973.47,-673 2811.03,-673"/>
<text xml:space="preserve" text-anchor="start" x="2814.03" y="-685.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Guarda staging o destino</text>
</g>
<!-- restcalltaskprovider&#45;&gt;externalapi -->
<g id="edge9" class="edge">
<title>restcalltaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2720.64,-380C2813.81,-380 2931.54,-380 3026.46,-380"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3026.22,-382.63 3033.72,-380 3026.22,-377.38 3026.22,-382.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2818.28,-383 2818.28,-415.8 2842.28,-415.8 2842.28,-383 2818.28,-383"/>
<text xml:space="preserve" text-anchor="start" x="2826.38" y="-396.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">9</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2845.28,-383 2845.28,-415.8 2939.23,-415.8 2939.23,-383 2845.28,-383"/>
<text xml:space="preserve" text-anchor="start" x="2848.28" y="-395.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Envia payload</text>
</g>
</g>
</svg>
`;case"usecase_uc05_scheduled_execution":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3352pt" height="1370pt"
 viewBox="0.00 0.00 3352.00 1370.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1355.05)">
<!-- scheduleractor -->
<g id="node1" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-760 0,-760 0,-580 320.04,-580 320.04,-760"/>
<text xml:space="preserve" text-anchor="start" x="114.99" y="-664" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- scheduler -->
<g id="node2" class="node">
<title>scheduler</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="980.4,-760 660.36,-760 660.36,-580 980.4,-580 980.4,-760"/>
<text xml:space="preserve" text-anchor="start" x="775.35" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">Scheduler</text>
</g>
<!-- processengine -->
<g id="node3" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1560.63,-760 1240.59,-760 1240.59,-580 1560.63,-580 1560.63,-760"/>
<text xml:space="preserve" text-anchor="start" x="1330.57" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- sourceregistry -->
<g id="node4" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2144.72,-1340 1824.68,-1340 1824.68,-1160 2144.72,-1160 2144.72,-1340"/>
<text xml:space="preserve" text-anchor="start" x="1873.55" y="-1244" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node5" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2144.72,-1050 1824.68,-1050 1824.68,-870 2144.72,-870 2144.72,-1050"/>
<text xml:space="preserve" text-anchor="start" x="1872.44" y="-954" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- taskregistry -->
<g id="node6" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2144.72,-760 1824.68,-760 1824.68,-580 2144.72,-580 2144.72,-760"/>
<text xml:space="preserve" text-anchor="start" x="1883.57" y="-664" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- auditservice -->
<g id="node7" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2144.72,-470 1824.68,-470 1824.68,-290 2144.72,-290 2144.72,-470"/>
<text xml:space="preserve" text-anchor="start" x="1925.79" y="-374" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- telemetry -->
<g id="node8" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2144.72,-180 1824.68,-180 1824.68,0 2144.72,0 2144.72,-180"/>
<text xml:space="preserve" text-anchor="start" x="1844.08" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Instrumentation</text>
</g>
<!-- otel -->
<g id="node9" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2714.03,-180 2393.99,-180 2393.99,0 2714.03,0 2714.03,-180"/>
<text xml:space="preserve" text-anchor="start" x="2442.85" y="-84" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node10" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="3322.24,-180 3002.2,-180 3002.2,0 3322.24,0 3322.24,-180"/>
<text xml:space="preserve" text-anchor="start" x="3131.65" y="-84" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- scheduleractor&#45;&gt;scheduler -->
<g id="edge1" class="edge">
<title>scheduleractor&#45;&gt;scheduler</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.97,-670C419.76,-670 548.34,-670 650.05,-670"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="649.9,-672.63 657.4,-670 649.9,-667.38 649.9,-672.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="383.04,-673 383.04,-705.8 407.04,-705.8 407.04,-673 383.04,-673"/>
<text xml:space="preserve" text-anchor="start" x="391.15" y="-686.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">1</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="410.04,-673 410.04,-705.8 597.36,-705.8 597.36,-673 410.04,-673"/>
<text xml:space="preserve" text-anchor="start" x="413.04" y="-685.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Detecta proceso programado</text>
</g>
<!-- scheduler&#45;&gt;processengine -->
<g id="edge2" class="edge">
<title>scheduler&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M980.15,-670C1057.9,-670 1151.56,-670 1230.63,-670"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1230.17,-672.63 1237.67,-670 1230.17,-667.38 1230.17,-672.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1043.4,-673 1043.4,-705.8 1067.4,-705.8 1067.4,-673 1043.4,-673"/>
<text xml:space="preserve" text-anchor="start" x="1051.51" y="-686.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">2</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1070.4,-673 1070.4,-705.8 1177.59,-705.8 1177.59,-673 1070.4,-673"/>
<text xml:space="preserve" text-anchor="start" x="1073.4" y="-685.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lanza ejecucion</text>
</g>
<!-- processengine&#45;&gt;sourceregistry -->
<g id="edge3" class="edge">
<title>processengine&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1478.52,-759.95C1519.67,-807.08 1571.81,-865.18 1620.63,-915 1707.36,-1003.51 1733.55,-1021.03 1824.68,-1105 1841.63,-1120.62 1859.65,-1137.13 1877.23,-1153.19"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1875.19,-1154.89 1882.5,-1158.01 1878.73,-1151.01 1875.19,-1154.89"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1625.57,-1053.56 1625.57,-1086.36 1649.57,-1086.36 1649.57,-1053.56 1625.57,-1053.56"/>
<text xml:space="preserve" text-anchor="start" x="1633.67" y="-1066.76" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">3</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1652.57,-1053.56 1652.57,-1086.36 1759.75,-1086.36 1759.75,-1053.56 1652.57,-1053.56"/>
<text xml:space="preserve" text-anchor="start" x="1655.57" y="-1065.76" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve fuente</text>
</g>
<!-- processengine&#45;&gt;readerregistry -->
<g id="edge4" class="edge">
<title>processengine&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1560.28,-749.05C1639.46,-788.5 1735.24,-836.21 1815.66,-876.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1814.29,-878.53 1822.18,-879.53 1816.64,-873.83 1814.29,-878.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1632.17,-852.5 1632.17,-885.3 1656.17,-885.3 1656.17,-852.5 1632.17,-852.5"/>
<text xml:space="preserve" text-anchor="start" x="1640.28" y="-865.7" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">4</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1659.17,-852.5 1659.17,-885.3 1753.14,-885.3 1753.14,-852.5 1659.17,-852.5"/>
<text xml:space="preserve" text-anchor="start" x="1662.17" y="-864.7" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee contenido</text>
</g>
<!-- processengine&#45;&gt;taskregistry -->
<g id="edge5" class="edge">
<title>processengine&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1560.28,-670C1639.14,-670 1734.46,-670 1814.68,-670"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1814.36,-672.63 1821.86,-670 1814.36,-667.38 1814.36,-672.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1631.41,-673 1631.41,-705.8 1655.41,-705.8 1655.41,-673 1631.41,-673"/>
<text xml:space="preserve" text-anchor="start" x="1639.52" y="-686.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1658.41,-673 1658.41,-705.8 1753.9,-705.8 1753.9,-673 1658.41,-673"/>
<text xml:space="preserve" text-anchor="start" x="1661.41" y="-685.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta tareas</text>
</g>
<!-- processengine&#45;&gt;auditservice -->
<g id="edge6" class="edge">
<title>processengine&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1560.28,-590.95C1639.46,-551.5 1735.24,-503.79 1815.66,-463.72"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1816.64,-466.17 1822.18,-460.47 1814.29,-461.47 1816.64,-466.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1623.63,-562.5 1623.63,-595.3 1647.63,-595.3 1647.63,-562.5 1623.63,-562.5"/>
<text xml:space="preserve" text-anchor="start" x="1631.74" y="-575.7" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">6</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1650.63,-562.5 1650.63,-595.3 1761.68,-595.3 1761.68,-562.5 1650.63,-562.5"/>
<text xml:space="preserve" text-anchor="start" x="1653.63" y="-574.7" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- processengine&#45;&gt;telemetry -->
<g id="edge7" class="edge">
<title>processengine&#45;&gt;telemetry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1477.93,-580.26C1519.14,-532.87 1571.51,-474.3 1620.63,-424.2 1707.21,-335.89 1733.64,-318.71 1824.68,-235 1841.65,-219.4 1859.67,-202.9 1877.26,-186.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1878.76,-189.02 1882.53,-182.02 1875.22,-185.14 1878.76,-189.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1637.64,-427.2 1637.64,-460 1661.64,-460 1661.64,-427.2 1637.64,-427.2"/>
<text xml:space="preserve" text-anchor="start" x="1645.75" y="-440.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">7</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1664.64,-427.2 1664.64,-460 1747.67,-460 1747.67,-427.2 1664.64,-427.2"/>
<text xml:space="preserve" text-anchor="start" x="1667.64" y="-439.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Emite spans</text>
</g>
<!-- telemetry&#45;&gt;otel -->
<g id="edge8" class="edge">
<title>telemetry&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2144.48,-90C2219.14,-90 2308.23,-90 2384.12,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2383.74,-92.63 2391.24,-90 2383.74,-87.38 2383.74,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2207.72,-93 2207.72,-125.8 2231.72,-125.8 2231.72,-93 2207.72,-93"/>
<text xml:space="preserve" text-anchor="start" x="2215.83" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">8</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2234.72,-93 2234.72,-125.8 2330.99,-125.8 2330.99,-93 2234.72,-93"/>
<text xml:space="preserve" text-anchor="start" x="2237.72" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge9" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2713.89,-90C2799.34,-90 2904.74,-90 2991.77,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2991.76,-92.63 2999.26,-90 2991.76,-87.38 2991.76,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2777.03,-93 2777.03,-125.8 2801.03,-125.8 2801.03,-93 2777.03,-93"/>
<text xml:space="preserve" text-anchor="start" x="2785.13" y="-106.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">9</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2804.03,-93 2804.03,-125.8 2939.2,-125.8 2939.2,-93 2804.03,-93"/>
<text xml:space="preserve" text-anchor="start" x="2807.03" y="-105.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica visualizacion</text>
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
<!-- adminapi -->
<g id="node4" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2234.16,-265 1914.12,-265 1914.12,-85 2234.16,-85 2234.16,-265"/>
<text xml:space="preserve" text-anchor="start" x="2026.9" y="-169" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
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
<!-- iam&#45;&gt;adminapi -->
<g id="edge5" class="edge">
<title>iam&#45;&gt;adminapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M971.79,-101.31C1218.5,-117.82 1673.84,-148.28 1914.49,-164.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="972.33,-98.72 964.67,-100.84 971.98,-103.96 972.33,-98.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1370.04,-146.71 1370.04,-179.51 1394.04,-179.51 1394.04,-146.71 1370.04,-146.71"/>
<text xml:space="preserve" text-anchor="start" x="1378.14" y="-159.91" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">5</text>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1397.04,-146.71 1397.04,-179.51 1532.22,-179.51 1532.22,-146.71 1397.04,-146.71"/>
<text xml:space="preserve" text-anchor="start" x="1400.04" y="-158.91" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida tokens y roles</text>
</g>
<!-- oidcclient&#45;&gt;adminapi -->
<g id="edge4" class="edge">
<title>oidcclient&#45;&gt;adminapi</title>
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
