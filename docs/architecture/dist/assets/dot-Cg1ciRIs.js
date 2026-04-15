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
    platformadmin [color="#7E451D",
        fillcolor="#A35829",
        fontcolor="#FFE0C2",
        height=2.5,
        label=<<FONT POINT-SIZE="20">Platform Admin</FONT>>,
        likec4_id=platformAdmin,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    onprem [height=2.5,
        label=<<FONT POINT-SIZE="20">On-Prem Data Center</FONT>>,
        likec4_id=onPrem,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    platformadmin -> onprem [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-10</FONT></TD></TR></TABLE>>,
        likec4_id="1ncffm9",
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
    infrateam -> onprem [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-10</FONT></TD></TR></TABLE>>,
        likec4_id="1b36lke",
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
    scheduleractor -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">UC-05</FONT></TD></TR></TABLE>>,
        likec4_id=cp53iv,
        minlen=1,
        style=dashed];
    onprem -> integrationhub [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=iqlrgg,
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
    onprem [height=2.5,
        label=<<FONT POINT-SIZE="20">On-Prem Data Center</FONT>>,
        likec4_id=onPrem,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    onprem -> adminconsole [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="19chhcm",
        style=dashed];
    onprem -> quarkusapp [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=mvf68l,
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
    likec4_level = 1;
    label = <<FONT POINT-SIZE="20">Load Balancer / Reverse Proxy</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "vault" [
    likec4_id = "prod.services.servicesNode.vault";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Secrets / Vault corporativo</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
  ];
  "sharedstorage" [
    likec4_id = "prod.services.servicesNode.sharedStorage";
    likec4_level = 2;
    label = <<FONT POINT-SIZE="20">Shared File Storage</FONT>>;
    margin = "0.223,0.223";
    width = 4.445;
    height = 2.5;
    fillcolor = "#428a4f";
    fontcolor = "#f8fafc";
    color = "#2d5d39";
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
    likec4_depth = 1;
    fillcolor = "#454545";
    color = "#313131";
    style = "filled";
    margin = 32;
    label = <<FONT POINT-SIZE="11" COLOR="#d4d4d4b3"><B>EDGE</B></FONT>>;
    "loadbalancer";
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
  "otel" -> "jaeger" [
    likec4_id = "1itrp1s";
    style = "dashed";
    weight = 6;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Entrega trazas</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "loadbalancer" -> "adminconsole" [
    likec4_id = "zjwxbv";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Publica UI on-prem</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "loadbalancer" -> "quarkusapp" [
    likec4_id = "avk83c";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Publica APIs on-prem</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "loadbalancer" -> "adminconsole_1" [
    likec4_id = "19jsvvc";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Publica UI on-prem</FONT></TD></TR></TABLE>>;
    arrowhead = "normal";
  ];
  "loadbalancer" -> "quarkusapp_1" [
    likec4_id = "4nfuor";
    style = "dashed";
    weight = 2;
    label = <<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Publica APIs on-prem</FONT></TD></TR></TABLE>>;
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
<svg width="3360pt" height="1178pt"
 viewBox="0.00 0.00 3360.00 1178.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1163.45)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="3330.04,-1148.4 3010,-1148.4 3010,-968.4 3330.04,-968.4 3330.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="3083.85" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- integrationhub -->
<g id="node2" class="node">
<title>integrationhub</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1841.04,-502.8 1521,-502.8 1521,-322.8 1841.04,-322.8 1841.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1572.63" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Platform</text>
</g>
<!-- admin -->
<g id="node3" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1180.04,-1148.4 860,-1148.4 860,-968.4 1180.04,-968.4 1180.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="882.17" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- platformadmin -->
<g id="node4" class="node">
<title>platformadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-1148.4 0,-1148.4 0,-968.4 320.04,-968.4 320.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="91.67" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Platform Admin</text>
</g>
<!-- onprem -->
<g id="node5" class="node">
<title>onprem</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-825.6 430,-825.6 430,-645.6 750.04,-645.6 750.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="492.76" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">On&#45;Prem Data Center</text>
</g>
<!-- iam -->
<g id="node6" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="659.04,-180 339,-180 339,0 659.04,0 659.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="458.44" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- integrationadmin -->
<g id="node7" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1610.04,-1148.4 1290,-1148.4 1290,-968.4 1610.04,-968.4 1610.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1371.64" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node8" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2040.04,-1148.4 1720,-1148.4 1720,-968.4 2040.04,-968.4 2040.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1840.56" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node9" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2470.04,-1148.4 2150,-1148.4 2150,-968.4 2470.04,-968.4 2470.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="2278.34" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- infrateam -->
<g id="node10" class="node">
<title>infrateam</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="750.04,-1148.4 430,-1148.4 430,-968.4 750.04,-968.4 750.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="478.29" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Equipo de infraestructura</text>
</g>
<!-- scheduleractor -->
<g id="node11" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2900.04,-1148.4 2580,-1148.4 2580,-968.4 2900.04,-968.4 2900.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="2694.99" y="-1052.4" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- externalapi -->
<g id="node12" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1296.04,-180 976,-180 976,0 1296.04,0 1296.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1073.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- db -->
<g id="node13" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1726.04,-180 1406,-180 1406,0 1726.04,0 1726.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1511.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node14" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2156.04,-180 1836,-180 1836,0 2156.04,0 2156.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1918.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node15" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2586.04,-180 2266,-180 2266,0 2586.04,0 2586.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2359.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- user&#45;&gt;integrationhub -->
<g id="edge1" class="edge">
<title>user&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3065.02,-968.58C2950.13,-875.61 2757.16,-731.44 2569.02,-645.6 2331.61,-537.28 2034.52,-472.69 1851.28,-440.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1851.83,-437.63 1843.99,-438.92 1850.92,-442.8 1851.83,-437.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2873.43,-724.2 2873.43,-747 3059.98,-747 3059.98,-724.2 2873.43,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="2876.43" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- integrationhub&#45;&gt;iam -->
<g id="edge12" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1521.3,-368.45C1298.61,-308.01 896.58,-198.9 668.69,-137.05"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="669.49,-134.55 661.56,-135.11 668.11,-139.61 669.49,-134.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1125.46,-240 1125.46,-262.8 1152.45,-262.8 1152.45,-240 1125.46,-240"/>
<text xml:space="preserve" text-anchor="start" x="1128.46" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge11" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1529.93,-322.87C1457.13,-280.01 1369.79,-228.6 1295.88,-185.1"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1297.33,-182.91 1289.54,-181.37 1294.67,-187.43 1297.33,-182.91"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1424.86,-240 1424.86,-262.8 1451.85,-262.8 1451.85,-240 1424.86,-240"/>
<text xml:space="preserve" text-anchor="start" x="1427.86" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge13" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1649.14,-322.87C1634.31,-281.49 1616.62,-232.15 1601.38,-189.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1603.89,-188.85 1598.89,-182.68 1598.94,-190.62 1603.89,-188.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1626.97,-240 1626.97,-262.8 1653.96,-262.8 1653.96,-240 1626.97,-240"/>
<text xml:space="preserve" text-anchor="start" x="1629.97" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge14" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1768.35,-322.87C1809.74,-280.71 1859.26,-230.27 1901.54,-187.22"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1903.29,-189.18 1906.68,-181.99 1899.55,-185.5 1903.29,-189.18"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1847.96,-240 1847.96,-262.8 1874.96,-262.8 1874.96,-240 1847.96,-240"/>
<text xml:space="preserve" text-anchor="start" x="1850.96" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge15" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1840.84,-342.98C1963.25,-290.27 2131.73,-217.72 2256.48,-164"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2257.51,-166.42 2263.36,-161.04 2255.44,-161.6 2257.51,-166.42"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2075.86,-240 2075.86,-262.8 2172.12,-262.8 2172.12,-240 2075.86,-240"/>
<text xml:space="preserve" text-anchor="start" x="2078.86" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- admin&#45;&gt;integrationhub -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1053.29,-968.49C1090.72,-878.13 1158.91,-738.57 1253.67,-645.6 1326.84,-573.81 1426.77,-517.97 1511.59,-479.1"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1512.57,-481.54 1518.31,-476.05 1510.4,-476.76 1512.57,-481.54"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1253.67,-724.2 1253.67,-747 1497.02,-747 1497.02,-724.2 1253.67,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="1256.67" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- platformadmin&#45;&gt;onprem -->
<g id="edge3" class="edge">
<title>platformadmin&#45;&gt;onprem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M279.23,-968.47C336.32,-925.87 404.74,-874.83 462.83,-831.49"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="464.09,-833.83 468.53,-827.24 460.95,-829.62 464.09,-833.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="387.91,-885.6 387.91,-908.4 434.37,-908.4 434.37,-885.6 387.91,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="390.91" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- platformadmin&#45;&gt;iam -->
<g id="edge4" class="edge">
<title>platformadmin&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M191.15,-968.65C254.55,-787.92 398.21,-378.38 464.42,-189.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="466.89,-190.52 466.9,-182.57 461.94,-188.78 466.89,-190.52"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="333.43,-562.8 333.43,-585.6 379.89,-585.6 379.89,-562.8 333.43,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="336.43" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;09</text>
</g>
<!-- onprem&#45;&gt;integrationhub -->
<g id="edge10" class="edge">
<title>onprem&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M733.51,-645.62C787.25,-615.55 849.88,-584.2 910.03,-562.8 1110.02,-491.65 1351.95,-451.93 1510.82,-431.73"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1511.05,-434.34 1518.16,-430.8 1510.39,-429.14 1511.05,-434.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="910.03,-562.8 910.03,-585.6 937.02,-585.6 937.02,-562.8 910.03,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="913.03" y="-571" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationadmin&#45;&gt;integrationhub -->
<g id="edge5" class="edge">
<title>integrationadmin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1476.61,-968.72C1502.29,-884.84 1543.22,-755.74 1584.1,-645.6 1600.54,-601.31 1620.42,-553 1637.88,-512"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1640.19,-513.27 1640.73,-505.35 1635.36,-511.21 1640.19,-513.27"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1584.1,-724.2 1584.1,-747 1727.02,-747 1727.02,-724.2 1584.1,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="1587.1" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;01, UC&#45;02, UC&#45;03</text>
</g>
<!-- operator&#45;&gt;integrationhub -->
<g id="edge6" class="edge">
<title>operator&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1852.56,-968.59C1815.6,-849.06 1750.07,-637.11 1711.58,-512.65"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1714.14,-512.02 1709.41,-505.63 1709.12,-513.57 1714.14,-512.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1806.77,-724.2 1806.77,-747 1949.7,-747 1949.7,-724.2 1806.77,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="1809.77" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;04, UC&#45;06, UC&#45;08</text>
</g>
<!-- auditor&#45;&gt;integrationhub -->
<g id="edge7" class="edge">
<title>auditor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2247.39,-968.6C2184.1,-881.76 2081.03,-748 1977.02,-645.6 1927.57,-596.92 1868.14,-548.69 1815.56,-508.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1817.17,-506.87 1809.59,-504.46 1814.01,-511.06 1817.17,-506.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2132.95,-724.2 2132.95,-747 2227.64,-747 2227.64,-724.2 2132.95,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="2135.95" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;06, UC&#45;07</text>
</g>
<!-- infrateam&#45;&gt;onprem -->
<g id="edge8" class="edge">
<title>infrateam&#45;&gt;onprem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M590.02,-968.47C590.02,-927.27 590.02,-878.16 590.02,-835.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="592.65,-835.96 590.02,-828.46 587.4,-835.96 592.65,-835.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="590.02,-885.6 590.02,-908.4 636.48,-908.4 636.48,-885.6 590.02,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="593.02" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;10</text>
</g>
<!-- scheduleractor&#45;&gt;integrationhub -->
<g id="edge9" class="edge">
<title>scheduleractor&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2653.38,-968.64C2561.21,-878.07 2407.91,-738.05 2255.02,-645.6 2127.11,-568.25 1968.75,-506.52 1850.78,-466.28"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1851.74,-463.83 1843.8,-463.91 1850.06,-468.8 1851.74,-463.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2495.46,-724.2 2495.46,-747 2541.91,-747 2541.91,-724.2 2495.46,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="2498.46" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;05</text>
</g>
</g>
</svg>
`;case"context":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3360pt" height="882pt"
 viewBox="0.00 0.00 3360.00 882.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 866.65)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="1390.02,-299.6 1390.02,-580.8 2370.02,-580.8 2370.02,-299.6 1390.02,-299.6"/>
<text xml:space="preserve" text-anchor="start" x="1398.02" y="-567.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<!-- adminconsole -->
<g id="node1" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1750.04,-519.6 1430,-519.6 1430,-339.6 1750.04,-339.6 1750.04,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="1522.21" y="-423.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2330.04,-519.6 2010,-519.6 2010,-339.6 2330.04,-339.6 2330.04,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="2080.53" y="-423.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- user -->
<g id="node3" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1610.04,-851.6 1290,-851.6 1290,-671.6 1610.04,-671.6 1610.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="1363.85" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2040.04,-851.6 1720,-851.6 1720,-671.6 2040.04,-671.6 2040.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="1742.17" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- integrationadmin -->
<g id="node5" class="node">
<title>integrationadmin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-851.6 0,-851.6 0,-671.6 320.04,-671.6 320.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="81.64" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Integration Admin</text>
</g>
<!-- operator -->
<g id="node6" class="node">
<title>operator</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="750.04,-851.6 430,-851.6 430,-671.6 750.04,-671.6 750.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="550.56" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Operator</text>
</g>
<!-- auditor -->
<g id="node7" class="node">
<title>auditor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1180.04,-851.6 860,-851.6 860,-671.6 1180.04,-671.6 1180.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="988.34" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Auditor</text>
</g>
<!-- scheduleractor -->
<g id="node8" class="node">
<title>scheduleractor</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2900.04,-851.6 2580,-851.6 2580,-671.6 2900.04,-671.6 2900.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="2694.99" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Scheduler</text>
</g>
<!-- onprem -->
<g id="node9" class="node">
<title>onprem</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-851.6 2150,-851.6 2150,-671.6 2470.04,-671.6 2470.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="2212.76" y="-755.6" font-family="Arial" font-size="20.00" fill="#eff6ff">On&#45;Prem Data Center</text>
</g>
<!-- iam -->
<g id="node10" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="1610.04,-180 1290,-180 1290,0 1610.04,0 1610.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1409.44" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- externalapi -->
<g id="node11" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-180 1720,-180 1720,0 2040.04,0 2040.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1817.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- db -->
<g id="node12" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2470.04,-180 2150,-180 2150,0 2470.04,0 2470.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2255.55" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node13" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2900.04,-180 2580,-180 2580,0 2900.04,0 2900.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2662.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node14" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3330.04,-180 3010,-180 3010,0 3330.04,0 3330.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="3103.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge9" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1749.66,-429.6C1827.4,-429.6 1920.93,-429.6 2000,-429.6"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1999.54,-432.23 2007.04,-429.6 1999.54,-426.98 1999.54,-432.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1805.03,-432.6 1805.03,-455.4 1955.01,-455.4 1955.01,-432.6 1805.03,-432.6"/>
<text xml:space="preserve" text-anchor="start" x="1808.03" y="-439.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge10" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1469.16,-339.81C1452.47,-321.86 1437.75,-301.64 1428.08,-279.6 1415.88,-251.8 1415.3,-219.6 1419.55,-189.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1422.08,-190.55 1420.69,-182.72 1416.9,-189.71 1422.08,-190.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1428.08,-248.4 1428.08,-271.2 1557.02,-271.2 1557.02,-248.4 1428.08,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="1431.08" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2010,-353.81C1959.31,-330.09 1903.05,-303.76 1851.5,-279.6 1775.11,-243.79 1690.56,-204.08 1618.84,-170.38"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1620.35,-168.19 1612.45,-167.37 1618.12,-172.94 1620.35,-168.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1851.5,-248.4 1851.5,-271.2 1989.02,-271.2 1989.02,-248.4 1851.5,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="1854.5" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2093.83,-339.9C2053.69,-293.17 2004.39,-235.78 1963.25,-187.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1965.31,-186.26 1958.43,-182.28 1961.33,-189.68 1965.31,-186.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2033.72,-248.4 2033.72,-271.2 2186.81,-271.2 2186.81,-248.4 2033.72,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="2036.72" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge13" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2206.8,-339.9C2225.94,-293.75 2249.39,-237.2 2269.1,-189.67"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2271.51,-190.72 2271.96,-182.78 2266.66,-188.71 2271.51,-190.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2244.22,-240 2244.22,-279.6 2482.9,-279.6 2482.9,-240 2244.22,-240"/>
<text xml:space="preserve" text-anchor="start" x="2247.22" y="-264" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="2247.22" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;filesources -->
<g id="edge14" class="edge">
<title>quarkusapp&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2329.83,-369.19C2388.3,-344.74 2453.84,-314.04 2510.02,-279.6 2553.59,-252.89 2597.84,-218.65 2635.74,-186.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2637.4,-188.72 2641.42,-181.87 2634,-184.72 2637.4,-188.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2563.97,-248.4 2563.97,-271.2 2590.96,-271.2 2590.96,-248.4 2563.97,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="2566.97" y="-256.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;observability -->
<g id="edge15" class="edge">
<title>quarkusapp&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2329.99,-382.33C2489.58,-335.14 2741.13,-257.97 2955.02,-180 2969.87,-174.59 2985.21,-168.75 3000.53,-162.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3001.23,-165.29 3007.25,-160.09 2999.31,-160.4 3001.23,-165.29"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2763.03,-248.4 2763.03,-271.2 2859.29,-271.2 2859.29,-248.4 2763.03,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="2766.03" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1462.37,-671.74C1467.87,-644.49 1475.63,-614.84 1486.47,-588.8 1495,-568.3 1506.25,-547.59 1518.19,-528.21"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1520.34,-529.72 1522.11,-521.97 1515.9,-526.93 1520.34,-529.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1486.47,-588.8 1486.47,-611.6 1673.02,-611.6 1673.02,-588.8 1486.47,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="1489.47" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1801.92,-671.73C1762.67,-627.07 1715.05,-572.87 1674.89,-527.18"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1676.92,-525.52 1670,-521.61 1672.98,-528.98 1676.92,-525.52"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1743.72,-588.8 1743.72,-611.6 1987.07,-611.6 1987.07,-588.8 1743.72,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="1746.72" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- integrationadmin&#45;&gt;adminconsole -->
<g id="edge3" class="edge">
<title>integrationadmin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M319.9,-690.39C338.3,-683.52 356.95,-677.08 375.02,-671.6 740.23,-560.96 1182.92,-487.91 1420.2,-453.5"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1420.26,-456.14 1427.3,-452.47 1419.51,-450.95 1420.26,-456.14"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="670.25,-588.8 670.25,-611.6 813.18,-611.6 813.18,-588.8 670.25,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="673.25" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;01, UC&#45;02, UC&#45;03</text>
</g>
<!-- operator&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>operator&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M749.92,-692.46C768.4,-685.17 787.06,-678.06 805.02,-671.6 1014.44,-596.3 1260.36,-523.22 1420.38,-477.65"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1420.91,-480.23 1427.41,-475.65 1419.48,-475.18 1420.91,-480.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1040.19,-588.8 1040.19,-611.6 1183.11,-611.6 1183.11,-588.8 1040.19,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="1043.19" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;04, UC&#45;06, UC&#45;08</text>
</g>
<!-- auditor&#45;&gt;adminconsole -->
<g id="edge5" class="edge">
<title>auditor&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1173.52,-671.73C1252.26,-626.15 1348.15,-570.63 1428.07,-524.36"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1428.95,-526.89 1434.12,-520.86 1426.32,-522.34 1428.95,-526.89"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1305.02,-588.8 1305.02,-611.6 1399.71,-611.6 1399.71,-588.8 1305.02,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="1308.02" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;06, UC&#45;07</text>
</g>
<!-- scheduleractor&#45;&gt;quarkusapp -->
<g id="edge6" class="edge">
<title>scheduleractor&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2586.52,-671.73C2507.78,-626.15 2411.89,-570.63 2331.97,-524.36"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2333.72,-522.34 2325.92,-520.86 2331.09,-526.89 2333.72,-522.34"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2472.11,-588.8 2472.11,-611.6 2518.57,-611.6 2518.57,-588.8 2472.11,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="2475.11" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">UC&#45;05</text>
</g>
<!-- onprem&#45;&gt;adminconsole -->
<g id="edge7" class="edge">
<title>onprem&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2182.34,-671.8C2132,-640.8 2072.33,-608.8 2014.02,-588.8 1988.99,-580.22 1980.58,-587.67 1955.02,-580.8 1889.54,-563.2 1820.14,-536.76 1759.64,-510.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1760.72,-508.56 1752.79,-508.01 1758.65,-513.38 1760.72,-508.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2065.9,-588.8 2065.9,-611.6 2092.89,-611.6 2092.89,-588.8 2065.9,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="2068.9" y="-597" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- onprem&#45;&gt;quarkusapp -->
<g id="edge8" class="edge">
<title>onprem&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2272.32,-671.73C2253.6,-627.62 2230.95,-574.21 2211.72,-528.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2214.2,-528.01 2208.85,-522.13 2209.36,-530.06 2214.2,-528.01"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2244.22,-588.8 2244.22,-611.6 2271.21,-611.6 2271.21,-588.8 2244.22,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="2247.22" y="-597" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
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
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2040.04,-1488 1720,-1488 1720,-1308 2040.04,-1308 2040.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="1793.85" y="-1392" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
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
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="2470.04,-1488 2150,-1488 2150,-1308 2470.04,-1308 2470.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="2172.17" y="-1392" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- quarkusapp -->
<g id="node4" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2255.04,-842.4 1935,-842.4 1935,-662.4 2255.04,-662.4 2255.04,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="2005.53" y="-746.4" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- iam -->
<g id="node5" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="3330.04,-502.8 3010,-502.8 3010,-322.8 3330.04,-322.8 3330.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="3129.44" y="-406.8" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="105.55" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
</g>
<!-- filesystem -->
<g id="node7" class="node">
<title>filesystem</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="750.04,-502.8 430,-502.8 430,-322.8 750.04,-322.8 750.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="537.79" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">File System</text>
</g>
<!-- ftp -->
<g id="node8" class="node">
<title>ftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1180.04,-502.8 860,-502.8 860,-322.8 1180.04,-322.8 1180.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1001.13" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">FTP</text>
</g>
<!-- sftp -->
<g id="node9" class="node">
<title>sftp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1610.04,-502.8 1290,-502.8 1290,-322.8 1610.04,-322.8 1610.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1424.46" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">SFTP</text>
</g>
<!-- restsource -->
<g id="node10" class="node">
<title>restsource</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2040.04,-502.8 1720,-502.8 1720,-322.8 2040.04,-322.8 2040.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1818.89" y="-406.8" font-family="Arial" font-size="20.00" fill="#f8fafc">REST Source</text>
</g>
<!-- externalapi -->
<g id="node11" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-502.8 2150,-502.8 2150,-322.8 2470.04,-322.8 2470.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2247.77" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- otel -->
<g id="node12" class="node">
<title>otel</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2900.04,-502.8 2580,-502.8 2580,-322.8 2900.04,-322.8 2900.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2628.87" y="-406.8" font-family="Arial" font-size="20.00" fill="#fafafa">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node13" class="node">
<title>jaeger</title>
<polygon fill="#737373" stroke="#525252" stroke-width="0" points="2900.04,-180 2580,-180 2580,0 2900.04,0 2900.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2709.44" y="-84" font-family="Arial" font-size="20.00" fill="#fafafa">Jaeger</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1933.2,-1308.35C1949.84,-1281.38 1968.55,-1251.84 1986.47,-1225.2 1997.91,-1208.2 2010.41,-1190.38 2022.74,-1173.22"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2024.74,-1174.93 2027,-1167.31 2020.48,-1171.86 2024.74,-1174.93"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1986.47,-1225.2 1986.47,-1248 2173.02,-1248 2173.02,-1225.2 1986.47,-1225.2"/>
<text xml:space="preserve" text-anchor="start" x="1989.47" y="-1232.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge3" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2095.02,-985.27C2095.02,-944.07 2095.02,-894.96 2095.02,-852.57"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2097.65,-852.76 2095.02,-845.26 2092.4,-852.76 2097.65,-852.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2095.02,-902.4 2095.02,-925.2 2244.99,-925.2 2244.99,-902.4 2095.02,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="2098.02" y="-909.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge4" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2254.69,-994.03C2426.7,-905.46 2706.22,-755.07 2933.02,-602.4 2975.07,-574.1 3019.05,-540.37 3057.55,-509.31"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3059.16,-511.39 3063.33,-504.63 3055.85,-507.31 3059.16,-511.39"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2835.84,-741 2835.84,-763.8 2964.79,-763.8 2964.79,-741 2835.84,-741"/>
<text xml:space="preserve" text-anchor="start" x="2838.84" y="-748.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2251.31,-1308.16C2233.6,-1281.46 2214.06,-1252.1 2196.02,-1225.2 2184.8,-1208.47 2172.83,-1190.72 2161.19,-1173.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2163.59,-1172.38 2157.21,-1167.64 2159.24,-1175.32 2163.59,-1172.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2208.46,-1225.2 2208.46,-1248 2451.81,-1248 2451.81,-1225.2 2208.46,-1225.2"/>
<text xml:space="preserve" text-anchor="start" x="2211.46" y="-1232.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2254.8,-710.91C2428.74,-665.51 2714.28,-587.13 2955.02,-502.8 2969.94,-497.57 2985.32,-491.87 3000.67,-485.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3001.36,-488.49 3007.4,-483.33 2999.46,-483.6 3001.36,-488.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2768.84,-571.2 2768.84,-594 2906.36,-594 2906.36,-571.2 2768.84,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="2771.84" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge6" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.08,-739.87C1686.77,-720.49 1194.14,-676.09 781.34,-602.4 598.3,-569.72 551.72,-560.66 375.02,-502.8 360.08,-497.91 344.71,-492.44 329.39,-486.7"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.63,-484.36 322.69,-484.16 328.77,-489.27 330.63,-484.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="781.34,-562.8 781.34,-602.4 1020.02,-602.4 1020.02,-562.8 781.34,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="784.34" y="-586.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="784.34" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;filesystem -->
<g id="edge7" class="edge">
<title>quarkusapp&#45;&gt;filesystem</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.04,-732.44C1688.36,-700.58 1202.08,-627.25 805.02,-502.8 790.1,-498.12 774.77,-492.82 759.5,-487.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="760.79,-484.88 752.84,-484.72 758.95,-489.8 760.79,-484.88"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1153.13,-571.2 1153.13,-594 1285.98,-594 1285.98,-571.2 1153.13,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1156.13" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee archivos locales</text>
</g>
<!-- quarkusapp&#45;&gt;ftp -->
<g id="edge8" class="edge">
<title>quarkusapp&#45;&gt;ftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.24,-710.91C1761.3,-665.51 1475.76,-587.13 1235.02,-502.8 1220.1,-497.57 1204.72,-491.87 1189.37,-485.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1190.58,-483.6 1182.64,-483.33 1188.68,-488.49 1190.58,-483.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1539.58,-571.2 1539.58,-594 1661.52,-594 1661.52,-571.2 1539.58,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1542.58" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;sftp -->
<g id="edge9" class="edge">
<title>quarkusapp&#45;&gt;sftp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1935.17,-667.73C1839.02,-617.41 1716.76,-553.41 1619.02,-502.26"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1620.48,-500.06 1612.62,-498.91 1618.05,-504.71 1620.48,-500.06"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1791.86,-571.2 1791.86,-594 1913.8,-594 1913.8,-571.2 1791.86,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1794.86" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Descarga archivos</text>
</g>
<!-- quarkusapp&#45;&gt;restsource -->
<g id="edge10" class="edge">
<title>quarkusapp&#45;&gt;restsource</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2038.53,-662.7C2008.96,-616.26 1972.68,-559.29 1942.29,-511.58"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1944.56,-510.26 1938.32,-505.34 1940.13,-513.08 1944.56,-510.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1993.97,-571.2 1993.97,-594 2163.39,-594 2163.39,-571.2 1993.97,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1996.97" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Obtiene payloads remotos</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2151.55,-662.77C2164.21,-642.91 2177.58,-621.94 2190.02,-602.4 2208.9,-572.76 2229.44,-540.48 2248.1,-511.15"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2250.13,-512.85 2251.95,-505.11 2245.7,-510.03 2250.13,-512.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2213,-571.2 2213,-594 2366.09,-594 2366.09,-571.2 2213,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="2216" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2254.83,-672.76C2299.69,-650.33 2348.4,-625.67 2393.02,-602.4 2451.45,-571.93 2514.91,-537.75 2571.4,-506.95"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2572.42,-509.38 2577.74,-503.49 2569.9,-504.78 2572.42,-509.38"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2459.86,-571.2 2459.86,-594 2556.13,-594 2556.13,-571.2 2459.86,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="2462.86" y="-578.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge13" class="edge">
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
<svg width="4061pt" height="2113pt"
 viewBox="0.00 0.00 4061.00 2113.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 2097.65)">
<g id="clust1" class="cluster">
<title>cluster_edge</title>
<polygon fill="#454545" stroke="#313131" points="2143.72,-1809.4 2143.72,-2074.6 2527.72,-2074.6 2527.72,-1809.4 2143.72,-1809.4"/>
<text xml:space="preserve" text-anchor="start" x="2151.72" y="-2061.7" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">EDGE</text>
</g>
<g id="clust2" class="cluster">
<title>cluster_services</title>
<polygon fill="#3f3f3f" stroke="#2d2d2d" points="3088.72,-1288 3088.72,-1674.4 4022.72,-1674.4 4022.72,-1288 3088.72,-1288"/>
<text xml:space="preserve" text-anchor="start" x="3096.72" y="-1661.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">SERVICES</text>
</g>
<g id="clust3" class="cluster">
<title>cluster_servicesnode</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="3120.72,-1320 3120.72,-1621.2 3990.72,-1621.2 3990.72,-1320 3120.72,-1320"/>
<text xml:space="preserve" text-anchor="start" x="3128.72" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">SERVICESNODE</text>
</g>
<g id="clust4" class="cluster">
<title>cluster_app</title>
<polygon fill="#393939" stroke="#292929" points="1258.72,-880.2 1258.72,-1745.6 2312.72,-1745.6 2312.72,-880.2 1258.72,-880.2"/>
<text xml:space="preserve" text-anchor="start" x="1266.72" y="-1732.7" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">APP</text>
</g>
<g id="clust5" class="cluster">
<title>cluster_appcluster</title>
<polygon fill="#1a468d" stroke="#1c3979" points="1290.72,-912.2 1290.72,-1692.4 2280.72,-1692.4 2280.72,-912.2 1290.72,-912.2"/>
<text xml:space="preserve" text-anchor="start" x="1298.72" y="-1679.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">APPCLUSTER</text>
</g>
<g id="clust6" class="cluster">
<title>cluster_prodnode1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1810.72,-962.2 1810.72,-1621.2 2230.72,-1621.2 2230.72,-962.2 1810.72,-962.2"/>
<text xml:space="preserve" text-anchor="start" x="1818.72" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">PRODNODE1</text>
</g>
<g id="clust7" class="cluster">
<title>cluster_prodnode2</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1340.72,-962.2 1340.72,-1621.2 1760.72,-1621.2 1760.72,-962.2 1340.72,-962.2"/>
<text xml:space="preserve" text-anchor="start" x="1348.72" y="-1608.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">PRODNODE2</text>
</g>
<g id="clust8" class="cluster">
<title>cluster_data</title>
<polygon fill="#393939" stroke="#292929" points="519.72,-8 519.72,-841.4 3007.72,-841.4 3007.72,-8 519.72,-8"/>
<text xml:space="preserve" text-anchor="start" x="527.72" y="-828.5" font-family="Arial" font-weight="bold" font-size="11.00" fill="#d4d4d4" fill-opacity="0.701961">DATA</text>
</g>
<g id="clust9" class="cluster">
<title>cluster_postgresha</title>
<polygon fill="#1a468d" stroke="#1c3979" points="2023.72,-383.8 2023.72,-770.2 2957.72,-770.2 2957.72,-383.8 2023.72,-383.8"/>
<text xml:space="preserve" text-anchor="start" x="2031.72" y="-757.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">POSTGRESHA</text>
</g>
<g id="clust10" class="cluster">
<title>cluster_postgresprimary</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="2073.72,-433.8 2073.72,-699 2457.72,-699 2457.72,-433.8 2073.72,-433.8"/>
<text xml:space="preserve" text-anchor="start" x="2081.72" y="-686.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">POSTGRESPRIMARY</text>
</g>
<g id="clust11" class="cluster">
<title>cluster_postgresreplica</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="2523.72,-433.8 2523.72,-699 2907.72,-699 2907.72,-433.8 2523.72,-433.8"/>
<text xml:space="preserve" text-anchor="start" x="2531.72" y="-686.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">POSTGRESREPLICA</text>
</g>
<g id="clust12" class="cluster">
<title>cluster_keycloakha</title>
<polygon fill="#1a468d" stroke="#1c3979" points="569.72,-383.8 569.72,-770.2 1503.72,-770.2 1503.72,-383.8 569.72,-383.8"/>
<text xml:space="preserve" text-anchor="start" x="577.72" y="-757.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">KEYCLOAKHA</text>
</g>
<g id="clust13" class="cluster">
<title>cluster_keycloaknode1</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="619.72,-433.8 619.72,-699 1003.72,-699 1003.72,-433.8 619.72,-433.8"/>
<text xml:space="preserve" text-anchor="start" x="627.72" y="-686.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">KEYCLOAKNODE1</text>
</g>
<g id="clust14" class="cluster">
<title>cluster_keycloaknode2</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1069.72,-433.8 1069.72,-699 1453.72,-699 1453.72,-433.8 1069.72,-433.8"/>
<text xml:space="preserve" text-anchor="start" x="1077.72" y="-686.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">KEYCLOAKNODE2</text>
</g>
<g id="clust15" class="cluster">
<title>cluster_observabilitynode</title>
<polygon fill="#2c4e32" stroke="#1e3524" points="1553.72,-58 1553.72,-717 1973.72,-717 1973.72,-58 1553.72,-58"/>
<text xml:space="preserve" text-anchor="start" x="1561.72" y="-704.1" font-family="Arial" font-weight="bold" font-size="11.00" fill="#c2f0c2" fill-opacity="0.701961">OBSERVABILITYNODE</text>
</g>
<!-- loadbalancer -->
<g id="node1" class="node">
<title>loadbalancer</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2495.74,-2021.4 2175.7,-2021.4 2175.7,-1841.4 2495.74,-1841.4 2495.74,-2021.4"/>
<text xml:space="preserve" text-anchor="start" x="2197.32" y="-1925.4" font-family="Arial" font-size="20.00" fill="#f8fafc">Load Balancer / Reverse Proxy</text>
</g>
<!-- vault -->
<g id="node2" class="node">
<title>vault</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3490.74,-1550 3170.7,-1550 3170.7,-1370 3490.74,-1370 3490.74,-1550"/>
<text xml:space="preserve" text-anchor="start" x="3213.45" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Secrets / Vault corporativo</text>
</g>
<!-- sharedstorage -->
<g id="node3" class="node">
<title>sharedstorage</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="3940.74,-1550 3620.7,-1550 3620.7,-1370 3940.74,-1370 3940.74,-1550"/>
<text xml:space="preserve" text-anchor="start" x="3691.78" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Shared File Storage</text>
</g>
<!-- adminconsole -->
<g id="node4" class="node">
<title>adminconsole</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2180.74,-1550 1860.7,-1550 1860.7,-1370 2180.74,-1370 2180.74,-1550"/>
<text xml:space="preserve" text-anchor="start" x="1952.91" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- adminconsole_1 -->
<g id="node5" class="node">
<title>adminconsole_1</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1710.74,-1550 1390.7,-1550 1390.7,-1370 1710.74,-1370 1710.74,-1550"/>
<text xml:space="preserve" text-anchor="start" x="1482.91" y="-1454" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node6" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="2180.74,-1192.2 1860.7,-1192.2 1860.7,-1012.2 2180.74,-1012.2 2180.74,-1192.2"/>
<text xml:space="preserve" text-anchor="start" x="1931.23" y="-1096.2" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- quarkusapp_1 -->
<g id="node7" class="node">
<title>quarkusapp_1</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1710.74,-1192.2 1390.7,-1192.2 1390.7,-1012.2 1710.74,-1012.2 1710.74,-1192.2"/>
<text xml:space="preserve" text-anchor="start" x="1461.23" y="-1096.2" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- db -->
<g id="node8" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2425.74,-645.8 2105.7,-645.8 2105.7,-465.8 2425.74,-465.8 2425.74,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="2211.25" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- db_1 -->
<g id="node9" class="node">
<title>db_1</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2875.74,-645.8 2555.7,-645.8 2555.7,-465.8 2875.74,-465.8 2875.74,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="2661.25" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- iam -->
<g id="node10" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="971.74,-645.8 651.7,-645.8 651.7,-465.8 971.74,-465.8 971.74,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="771.14" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- iam_1 -->
<g id="node11" class="node">
<title>iam_1</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1421.74,-645.8 1101.7,-645.8 1101.7,-465.8 1421.74,-465.8 1421.74,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="1221.14" y="-549.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- otel -->
<g id="node12" class="node">
<title>otel</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1923.74,-645.8 1603.7,-645.8 1603.7,-465.8 1923.74,-465.8 1923.74,-645.8"/>
<text xml:space="preserve" text-anchor="start" x="1652.57" y="-549.8" font-family="Arial" font-size="20.00" fill="#f8fafc">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node13" class="node">
<title>jaeger</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1923.74,-288 1603.7,-288 1603.7,-108 1923.74,-108 1923.74,-288"/>
<text xml:space="preserve" text-anchor="start" x="1733.14" y="-192" font-family="Arial" font-size="20.00" fill="#f8fafc">Jaeger</text>
</g>
<!-- loadbalancer&#45;&gt;adminconsole -->
<g id="edge4" class="edge">
<title>loadbalancer&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2264.74,-1841.55C2248.6,-1820.5 2231.82,-1797.9 2216.89,-1776.4 2167.46,-1705.19 2115.85,-1621.8 2077.98,-1558.65"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2080.39,-1557.57 2074.29,-1552.48 2075.88,-1560.26 2080.39,-1557.57"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2216.89,-1753.6 2216.89,-1776.4 2342.72,-1776.4 2342.72,-1753.6 2216.89,-1753.6"/>
<text xml:space="preserve" text-anchor="start" x="2219.89" y="-1760.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica UI on&#45;prem</text>
</g>
<!-- loadbalancer&#45;&gt;adminconsole_1 -->
<g id="edge6" class="edge">
<title>loadbalancer&#45;&gt;adminconsole_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2175.86,-1902.8C2058.1,-1876.72 1898.32,-1828.81 1778.72,-1745.6 1708.36,-1696.65 1648.66,-1619.88 1608.01,-1558.4"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1610.37,-1557.21 1604.06,-1552.37 1605.97,-1560.08 1610.37,-1557.21"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1818.55,-1753.6 1818.55,-1776.4 1944.38,-1776.4 1944.38,-1753.6 1818.55,-1753.6"/>
<text xml:space="preserve" text-anchor="start" x="1821.55" y="-1760.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica UI on&#45;prem</text>
</g>
<!-- loadbalancer&#45;&gt;quarkusapp -->
<g id="edge5" class="edge">
<title>loadbalancer&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2490.53,-1841.43C2532.78,-1813.55 2576.99,-1780.77 2613.72,-1745.6 2795.5,-1571.52 2727.17,-1409.98 2947.33,-1288 2969.23,-1275.86 3042.66,-1298.32 3059.72,-1280 3066.63,-1272.58 3066.34,-1264.87 3059.72,-1257.2 2949.6,-1129.55 2456.51,-1105.96 2191.13,-1102.7"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2191.18,-1100.07 2183.65,-1102.61 2191.12,-1105.32 2191.18,-1100.07"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2947.33,-1448.6 2947.33,-1471.4 3088.72,-1471.4 3088.72,-1448.6 2947.33,-1448.6"/>
<text xml:space="preserve" text-anchor="start" x="2950.33" y="-1455.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica APIs on&#45;prem</text>
</g>
<!-- loadbalancer&#45;&gt;quarkusapp_1 -->
<g id="edge7" class="edge">
<title>loadbalancer&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2364,-1841.84C2370.06,-1813.78 2373.83,-1782.53 2370.72,-1753.6 2346.58,-1529.11 2428.69,-1410.28 2262.72,-1257.2 2182.95,-1183.62 1883.79,-1219.35 1778.72,-1192.2 1759.54,-1187.24 1739.78,-1181.14 1720.3,-1174.47"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1721.25,-1172.03 1713.3,-1172.04 1719.53,-1176.99 1721.25,-1172.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2370.39,-1448.6 2370.39,-1471.4 2511.78,-1471.4 2511.78,-1448.6 2370.39,-1448.6"/>
<text xml:space="preserve" text-anchor="start" x="2373.39" y="-1455.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Publica APIs on&#45;prem</text>
</g>
<!-- vault&#45;&gt;quarkusapp -->
<g id="edge15" class="edge">
<title>vault&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3293.15,-1370.22C3271.13,-1329.14 3239.19,-1283.67 3196.72,-1257.2 3032.53,-1154.85 2475.66,-1119.78 2191.12,-1108.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2191.32,-1105.75 2183.73,-1108.07 2191.12,-1110.99 2191.32,-1105.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3222.67,-1257.2 3222.67,-1280 3427.89,-1280 3427.89,-1257.2 3222.67,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="3225.67" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- vault&#45;&gt;quarkusapp_1 -->
<g id="edge24" class="edge">
<title>vault&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3226.4,-1370.14C3181.99,-1337.8 3127.78,-1305.03 3072.72,-1288 3043.41,-1278.94 2551,-1283.44 2520.51,-1280 2472.28,-1274.56 2461.66,-1264.75 2413.72,-1257.2 2133.48,-1213.07 2054.48,-1258.83 1778.72,-1192.2 1759.55,-1187.57 1739.84,-1181.69 1720.41,-1175.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1721.4,-1172.74 1713.46,-1172.79 1719.71,-1177.7 1721.4,-1172.74"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2520.51,-1257.2 2520.51,-1280 2725.72,-1280 2725.72,-1257.2 2520.51,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2523.51" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega secretos y credenciales</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp -->
<g id="edge16" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3678.97,-1370.04C3641.99,-1340.94 3598.69,-1310.38 3555.72,-1288 3515.98,-1267.3 3503.56,-1266.48 3459.72,-1257.2 3007.41,-1161.49 2461.87,-1123.8 2190.8,-1110.18"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2191.13,-1107.57 2183.51,-1109.82 2190.87,-1112.81 2191.13,-1107.57"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3538.5,-1257.2 3538.5,-1280 3709.46,-1280 3709.46,-1257.2 3538.5,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="3541.5" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- sharedstorage&#45;&gt;quarkusapp_1 -->
<g id="edge25" class="edge">
<title>sharedstorage&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3691.22,-1370.04C3652.8,-1337.79 3605.35,-1305.11 3555.72,-1288 3526.2,-1277.82 3024.94,-1281.7 2993.76,-1280 2886.76,-1274.17 2860.54,-1265.83 2753.72,-1257.2 2320.84,-1222.22 2202.61,-1286.71 1778.72,-1192.2 1759.56,-1187.93 1739.89,-1182.3 1720.52,-1175.94"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1721.55,-1173.52 1713.6,-1173.63 1719.88,-1178.5 1721.55,-1173.52"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2993.76,-1257.2 2993.76,-1280 3164.72,-1280 3164.72,-1257.2 2993.76,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2996.76" y="-1264.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Comparte archivos locales</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge1" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2020.72,-1370.13C2020.72,-1319.19 2020.72,-1255.12 2020.72,-1202.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2023.35,-1202.69 2020.72,-1195.19 2018.1,-1202.69 2023.35,-1202.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2020.72,-1257.2 2020.72,-1280 2047.71,-1280 2047.71,-1257.2 2020.72,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="2023.72" y="-1265.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge8" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1929.83,-1370.04C1890.87,-1337.79 1842.82,-1305.11 1792.72,-1288 1764.28,-1278.28 1281.55,-1283.71 1251.72,-1280 1083.57,-1259.11 1037.17,-1257.27 880.73,-1192.2 631.91,-1088.71 496.66,-1107.73 365.72,-872.2 291.58,-738.85 486.77,-648.54 642.05,-599.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="642.47,-602.46 648.86,-597.73 640.92,-597.44 642.47,-602.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="880.73,-1090.8 880.73,-1113.6 907.72,-1113.6 907.72,-1090.8 880.73,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="883.73" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole&#45;&gt;iam_1 -->
<g id="edge9" class="edge">
<title>adminconsole&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1929.82,-1370.08C1890.85,-1337.84 1842.81,-1305.16 1792.72,-1288 1767.28,-1279.29 1330.22,-1296.16 1308.72,-1280 1149.81,-1160.56 1163.16,-1046.67 1187.72,-849.4 1195.89,-783.79 1213.98,-711.78 1230.23,-655.61"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1232.7,-656.51 1232.29,-648.58 1227.66,-655.04 1232.7,-656.51"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1220.71,-1090.8 1220.71,-1113.6 1247.71,-1113.6 1247.71,-1090.8 1220.71,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="1223.71" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole_1&#45;&gt;quarkusapp_1 -->
<g id="edge2" class="edge">
<title>adminconsole_1&#45;&gt;quarkusapp_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1550.72,-1370.13C1550.72,-1319.19 1550.72,-1255.12 1550.72,-1202.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1553.35,-1202.69 1550.72,-1195.19 1548.1,-1202.69 1553.35,-1202.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1550.72,-1257.2 1550.72,-1280 1577.71,-1280 1577.71,-1257.2 1550.72,-1257.2"/>
<text xml:space="preserve" text-anchor="start" x="1553.72" y="-1265.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole_1&#45;&gt;iam -->
<g id="edge17" class="edge">
<title>adminconsole_1&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1390.91,-1451.35C1069.91,-1433.95 358.86,-1384.54 140.72,-1280 90.04,-1255.71 71.7,-1243.93 49.73,-1192.2 -4.48,-1064.57 -26.81,-995.83 49.73,-880.2 180.81,-682.17 460.17,-605.04 641.76,-575.25"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="641.98,-577.87 648.97,-574.09 641.14,-572.69 641.98,-577.87"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="49.73,-1090.8 49.73,-1113.6 76.72,-1113.6 76.72,-1090.8 49.73,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="52.73" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- adminconsole_1&#45;&gt;iam_1 -->
<g id="edge18" class="edge">
<title>adminconsole_1&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1390.85,-1432.36C1260.37,-1400.69 1086.99,-1333.14 1019.73,-1192.2 953.89,-1054.24 893.77,-966.76 991.72,-849.4 1004.46,-834.14 1018.67,-851.61 1035.72,-841.4 1110.16,-796.8 1169.84,-717.98 1209.14,-654.58"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1211.29,-656.1 1212.97,-648.33 1206.82,-653.35 1211.29,-656.1"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1019.73,-1090.8 1019.73,-1113.6 1046.72,-1113.6 1046.72,-1090.8 1019.73,-1090.8"/>
<text xml:space="preserve" text-anchor="start" x="1022.73" y="-1099" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge10" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2173.25,-1012.4C2221.63,-975.71 2269.36,-928.46 2295.72,-872.2 2327.41,-804.57 2317.04,-719.96 2300.32,-655.4"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2302.96,-655.11 2298.48,-648.54 2297.89,-656.47 2302.96,-655.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2302.19,-849.4 2302.19,-872.2 2329.18,-872.2 2329.18,-849.4 2302.19,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2305.19" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;db_1 -->
<g id="edge11" class="edge">
<title>quarkusapp&#45;&gt;db_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2180.49,-1079.67C2315.39,-1053.3 2504.49,-995.75 2619.72,-872.2 2674.49,-813.47 2698.06,-724.39 2708.18,-655.85"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2710.77,-656.26 2709.21,-648.47 2705.57,-655.53 2710.77,-656.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2636.61,-849.4 2636.61,-872.2 2663.6,-872.2 2663.6,-849.4 2636.61,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2639.61" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge12" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1956.85,-1012.25C1916.09,-963.38 1858.61,-907.31 1792.72,-880.2 1754.57,-864.5 1087.04,-890.78 1050.2,-872.2 959.94,-826.68 894.61,-729.16 855.39,-654.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="857.91,-653.69 852.13,-648.24 853.25,-656.1 857.91,-653.69"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1050.2,-849.4 1050.2,-872.2 1187.72,-872.2 1187.72,-849.4 1050.2,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1053.2" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;iam_1 -->
<g id="edge13" class="edge">
<title>quarkusapp&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1956.44,-1012.38C1915.64,-963.71 1858.26,-907.81 1792.72,-880.2 1762.96,-867.66 1530.94,-886.92 1502.2,-872.2 1412.1,-826.04 1346.17,-728.87 1306.37,-654.51"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1308.88,-653.64 1303.06,-648.23 1304.24,-656.09 1308.88,-653.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1502.2,-849.4 1502.2,-872.2 1639.72,-872.2 1639.72,-849.4 1502.2,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1505.2" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;otel -->
<g id="edge14" class="edge">
<title>quarkusapp&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1978.71,-1012.22C1932.41,-914.14 1858.14,-756.82 1810.15,-655.14"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1812.6,-654.19 1807.02,-648.53 1807.85,-656.43 1812.6,-654.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1907.61,-849.4 1907.61,-872.2 2003.87,-872.2 2003.87,-849.4 1907.61,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1910.61" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- quarkusapp_1&#45;&gt;db -->
<g id="edge19" class="edge">
<title>quarkusapp_1&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1615.03,-1012.46C1655.85,-963.82 1713.23,-907.92 1778.72,-880.2 1805.03,-869.06 2010.46,-885.54 2035.72,-872.2 2123.5,-825.84 2186.13,-729.26 2223.65,-655.12"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2225.98,-656.33 2226.98,-648.45 2221.28,-653.99 2225.98,-656.33"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2071.06,-849.4 2071.06,-872.2 2098.06,-872.2 2098.06,-849.4 2071.06,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2074.06" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp_1&#45;&gt;db_1 -->
<g id="edge20" class="edge">
<title>quarkusapp_1&#45;&gt;db_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1614.62,-1012.33C1655.39,-963.47 1712.87,-907.41 1778.72,-880.2 1808.61,-867.85 2328.63,-876.2 2360.72,-872.2 2419.21,-864.91 2440,-873.06 2489.72,-841.4 2562.53,-795.04 2622.07,-716.94 2661.72,-654.27"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2663.83,-655.86 2665.58,-648.11 2659.38,-653.07 2663.83,-655.86"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2475.61,-849.4 2475.61,-872.2 2502.6,-872.2 2502.6,-849.4 2475.61,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="2478.61" y="-857.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp_1&#45;&gt;iam -->
<g id="edge21" class="edge">
<title>quarkusapp_1&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1467.83,-1012.43C1415.73,-963.29 1344.08,-906.88 1267.72,-880.2 1245.31,-872.37 429.91,-889.06 413.2,-872.2 314.24,-772.3 492.95,-674.54 641.96,-614.98"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="642.91,-617.43 648.92,-612.23 640.98,-612.55 642.91,-617.43"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="413.2,-849.4 413.2,-872.2 550.72,-872.2 550.72,-849.4 413.2,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="416.2" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp_1&#45;&gt;iam_1 -->
<g id="edge22" class="edge">
<title>quarkusapp_1&#45;&gt;iam_1</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1458.55,-1012.36C1406.33,-966.61 1337.62,-913.57 1267.72,-880.2 1253.51,-873.42 1243,-884.53 1233.2,-872.2 1185.36,-812 1198.31,-723.43 1219.9,-655.46"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1222.35,-656.41 1222.2,-648.46 1217.37,-654.77 1222.35,-656.41"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1233.2,-849.4 1233.2,-872.2 1370.72,-872.2 1370.72,-849.4 1233.2,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1236.2" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp_1&#45;&gt;otel -->
<g id="edge23" class="edge">
<title>quarkusapp_1&#45;&gt;otel</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1603.04,-1012.39C1626.14,-970.76 1652.39,-919.92 1671.72,-872.2 1700.34,-801.57 1724.14,-718.76 1740.36,-655.72"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1742.84,-656.62 1742.15,-648.71 1737.75,-655.32 1742.84,-656.62"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1678.21,-849.4 1678.21,-872.2 1774.48,-872.2 1774.48,-849.4 1678.21,-849.4"/>
<text xml:space="preserve" text-anchor="start" x="1681.21" y="-856.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- otel&#45;&gt;jaeger -->
<g id="edge3" class="edge">
<title>otel&#45;&gt;jaeger</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1763.72,-465.93C1763.72,-414.99 1763.72,-350.92 1763.72,-298.33"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1766.35,-298.49 1763.72,-290.99 1761.1,-298.49 1766.35,-298.49"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1763.72,-353 1763.72,-375.8 1860.77,-375.8 1860.77,-353 1763.72,-353"/>
<text xml:space="preserve" text-anchor="start" x="1766.72" y="-360.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Entrega trazas</text>
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
