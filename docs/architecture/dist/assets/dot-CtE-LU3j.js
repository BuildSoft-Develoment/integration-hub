function t(e){switch(e){case"index":return`digraph {
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
    user [height=2.5,
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
    admin [height=2.5,
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
    iam [height=2.5,
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
        adminconsole [height=2.5,
            label=<<FONT POINT-SIZE="20">Admin Console</FONT>>,
            likec4_id="integrationHub.adminConsole",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        quarkusapp [height=2.5,
            label=<<FONT POINT-SIZE="20">Quarkus Native App</FONT>>,
            likec4_id="integrationHub.quarkusApp",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    user [height=2.5,
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
    admin [height=2.5,
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
        weight=2];
    iam [height=2.5,
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
    quarkusapp -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>,
        likec4_id="2rsnuj",
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
    db [height=2.5,
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
    user [height=2.5,
        label=<<FONT POINT-SIZE="20">Usuario de negocio</FONT>>,
        likec4_id=user,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    adminconsole [height=2.5,
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
    admin [height=2.5,
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
    quarkusapp [height=2.5,
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
    iam [height=2.5,
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
    db [height=2.5,
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
    filesystem [height=2.5,
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
    ftp [height=2.5,
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
    sftp [height=2.5,
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
    restsource [height=2.5,
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
    otel [height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>,
        likec4_id="observability.otel",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    quarkusapp -> otel [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Exporta trazas</FONT></TD></TR></TABLE>>,
        likec4_id=ri53sv,
        style=dashed];
    jaeger [height=2.5,
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
        style=dashed];
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
        style=dashed];
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
    iam [height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    scheduler -> iam [style=invis];
    processexecutionservice [height=2.5,
        label=<<FONT POINT-SIZE="20">ProcessExecutionService</FONT>>,
        likec4_id="integrationHub.quarkusApp.processExecutionService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    dbwritetaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">DbWriteTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.dbWriteTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> dbwritetaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta DB_WRITE</FONT></TD></TR></TABLE>>,
        likec4_id="1jbyyih",
        style=dashed,
        weight=3];
    restcalltaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">RestCallTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.restCallTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> restcalltaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta REST_CALL</FONT></TD></TR></TABLE>>,
        likec4_id="1ty7jww",
        style=dashed,
        weight=3];
    notificationtaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">NotificationTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.notificationTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> notificationtaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta NOTIFICATION</FONT></TD></TR></TABLE>>,
        likec4_id="1un846n",
        style=dashed,
        weight=3];
    taskproviderregistrycode [height=2.5,
        label=<<FONT POINT-SIZE="20">TaskProviderRegistry</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskProviderRegistryCode",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> taskproviderregistrycode [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve TaskProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1yohk6y",
        minlen=1,
        style=dashed];
    sourceproviderregistrycode [height=2.5,
        label=<<FONT POINT-SIZE="20">SourceProviderRegistry</FONT>>,
        likec4_id="integrationHub.quarkusApp.sourceProviderRegistryCode",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> sourceproviderregistrycode [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve SourceProvider</FONT></TD></TR></TABLE>>,
        likec4_id=jw2kmi,
        minlen=1,
        style=dashed];
    readerproviderregistrycode [height=2.5,
        label=<<FONT POINT-SIZE="20">ReaderProviderRegistry</FONT>>,
        likec4_id="integrationHub.quarkusApp.readerProviderRegistryCode",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> readerproviderregistrycode [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve ReaderProvider</FONT></TD></TR></TABLE>>,
        likec4_id="25xbf6",
        minlen=1,
        style=dashed];
    jsonconfigurationmapper [height=2.5,
        label=<<FONT POINT-SIZE="20">JsonConfigurationMapper</FONT>>,
        likec4_id="integrationHub.quarkusApp.jsonConfigurationMapper",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> jsonconfigurationmapper [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee configuracion JSON</FONT></TD></TR></TABLE>>,
        likec4_id=vi3xst,
        minlen=1,
        style=dashed];
    processcatalogservice [height=2.5,
        label=<<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>,
        likec4_id="integrationHub.quarkusApp.processCatalogService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    db [height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processcatalogservice -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste definiciones y tasks</FONT></TD></TR></TABLE>>,
        likec4_id=m788wj,
        minlen=1,
        style=dashed];
    sourceregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Source Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.sourceRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> sourceregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve fuente</FONT></TD></TR></TABLE>>,
        likec4_id="14xch3",
        style=dashed];
    readerregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Reader Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.readerRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> readerregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve reader</FONT></TD></TR></TABLE>>,
        likec4_id="11hsean",
        style=dashed];
    taskregistry [height=2.5,
        label=<<FONT POINT-SIZE="20">Task Provider Registry</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskRegistry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> taskregistry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve tarea</FONT></TD></TR></TABLE>>,
        likec4_id=jjpw1j,
        style=dashed];
    processengine -> auditservice [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Registra eventos</FONT></TD></TR></TABLE>>,
        likec4_id=s1rji7,
        style=dashed];
    telemetry [height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry instrumentation</FONT>>,
        likec4_id="integrationHub.quarkusApp.telemetry",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processengine -> telemetry [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Crea spans</FONT></TD></TR></TABLE>>,
        likec4_id=bq8fnk,
        minlen=1,
        style=dashed];
    dbwritetaskprovider -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert/update/upsert</FONT></TD></TR></TABLE>>,
        likec4_id=v96a3l,
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    restcalltaskprovider -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Envio de payloads</FONT></TD></TR></TABLE>>,
        likec4_id=evnu6j,
        style=dashed];
    notificationtaskprovider -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Webhook/email/log</FONT></TD></TR></TABLE>>,
        likec4_id=d2c4dw,
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
    taskproviders [height=2.5,
        label=<<FONT POINT-SIZE="20">Task Providers</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskProviders",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    taskregistry -> taskproviders [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Usa implementations</FONT></TD></TR></TABLE>>,
        likec4_id="1p5uurx",
        minlen=1,
        style=dashed];
    filesystem [height=2.5,
        label=<<FONT POINT-SIZE="20">File System</FONT>>,
        likec4_id="fileSources.filesystem",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    iam -> filesystem [style=invis];
    ftp [height=2.5,
        label=<<FONT POINT-SIZE="20">FTP</FONT>>,
        likec4_id="fileSources.ftp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    filesystem -> ftp [style=invis];
    sftp [height=2.5,
        label=<<FONT POINT-SIZE="20">SFTP</FONT>>,
        likec4_id="fileSources.sftp",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    restsource [height=2.5,
        label=<<FONT POINT-SIZE="20">REST Source</FONT>>,
        likec4_id="fileSources.restSource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sftp -> restsource [style=invis];
    otel [height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>,
        likec4_id="observability.otel",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    restsource -> otel [style=invis];
}
`;case"code":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=code,
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
        likec4_id="integrationHub.quarkusApp.processExecutionService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    dbwritetaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">DbWriteTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.dbWriteTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> dbwritetaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta DB_WRITE</FONT></TD></TR></TABLE>>,
        likec4_id="1jbyyih",
        style=dashed,
        weight=3];
    restcalltaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">RestCallTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.restCallTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> restcalltaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta REST_CALL</FONT></TD></TR></TABLE>>,
        likec4_id="1ty7jww",
        style=dashed,
        weight=3];
    notificationtaskprovider [height=2.5,
        label=<<FONT POINT-SIZE="20">NotificationTaskProvider</FONT>>,
        likec4_id="integrationHub.quarkusApp.notificationTaskProvider",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> notificationtaskprovider [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Ejecuta NOTIFICATION</FONT></TD></TR></TABLE>>,
        likec4_id="1un846n",
        style=dashed,
        weight=3];
    taskproviderregistrycode [height=2.5,
        label=<<FONT POINT-SIZE="20">TaskProviderRegistry</FONT>>,
        likec4_id="integrationHub.quarkusApp.taskProviderRegistryCode",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> taskproviderregistrycode [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve TaskProvider</FONT></TD></TR></TABLE>>,
        likec4_id="1yohk6y",
        minlen=1,
        style=dashed];
    sourceproviderregistrycode [height=2.5,
        label=<<FONT POINT-SIZE="20">SourceProviderRegistry</FONT>>,
        likec4_id="integrationHub.quarkusApp.sourceProviderRegistryCode",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> sourceproviderregistrycode [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve SourceProvider</FONT></TD></TR></TABLE>>,
        likec4_id=jw2kmi,
        minlen=1,
        style=dashed];
    readerproviderregistrycode [height=2.5,
        label=<<FONT POINT-SIZE="20">ReaderProviderRegistry</FONT>>,
        likec4_id="integrationHub.quarkusApp.readerProviderRegistryCode",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> readerproviderregistrycode [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resuelve ReaderProvider</FONT></TD></TR></TABLE>>,
        likec4_id="25xbf6",
        minlen=1,
        style=dashed];
    jsonconfigurationmapper [height=2.5,
        label=<<FONT POINT-SIZE="20">JsonConfigurationMapper</FONT>>,
        likec4_id="integrationHub.quarkusApp.jsonConfigurationMapper",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processexecutionservice -> jsonconfigurationmapper [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Lee configuracion JSON</FONT></TD></TR></TABLE>>,
        likec4_id=vi3xst,
        minlen=1,
        style=dashed];
    processcatalogservice [height=2.5,
        label=<<FONT POINT-SIZE="20">ProcessCatalogService</FONT>>,
        likec4_id="integrationHub.quarkusApp.processCatalogService",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    db [height=2.5,
        label=<<FONT POINT-SIZE="20">PostgreSQL</FONT>>,
        likec4_id=db,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    processcatalogservice -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persiste definiciones y tasks</FONT></TD></TR></TABLE>>,
        likec4_id=m788wj,
        minlen=1,
        style=dashed];
    dbwritetaskprovider -> db [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Batch insert/update/upsert</FONT></TD></TR></TABLE>>,
        likec4_id=v96a3l,
        style=dashed];
    externalapi [height=2.5,
        label=<<FONT POINT-SIZE="20">APIs externas</FONT>>,
        likec4_id=externalApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    restcalltaskprovider -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Envio de payloads</FONT></TD></TR></TABLE>>,
        likec4_id=evnu6j,
        style=dashed];
    notificationtaskprovider -> externalapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Webhook/email/log</FONT></TD></TR></TABLE>>,
        likec4_id=d2c4dw,
        style=dashed];
}
`;default:throw new Error("Unknown viewId: "+e)}}function n(e){switch(e){case"index":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2070pt" height="856pt"
 viewBox="0.00 0.00 2070.00 856.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 840.65)">
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="965.04,-825.6 645,-825.6 645,-645.6 965.04,-645.6 965.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="718.85" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Usuario de negocio</text>
</g>
<!-- integrationhub -->
<g id="node2" class="node">
<title>integrationhub</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-502.8 860,-502.8 860,-322.8 1180.04,-322.8 1180.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="911.63" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Integration Hub Platform</text>
</g>
<!-- admin -->
<g id="node3" class="node">
<title>admin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1395.04,-825.6 1075,-825.6 1075,-645.6 1395.04,-645.6 1395.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1097.17" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Administrador de integraciones</text>
</g>
<!-- externalapi -->
<g id="node4" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="97.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- filesources -->
<g id="node5" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-180 430,-180 430,0 750.04,0 750.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="512.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- iam -->
<g id="node6" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-180 860,-180 860,0 1180.04,0 1180.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="979.44" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- observability -->
<g id="node7" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-180 1290,-180 1290,0 1610.04,0 1610.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1383.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- db -->
<g id="node8" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-180 1720,-180 1720,0 2040.04,0 2040.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1825.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- user&#45;&gt;integrationhub -->
<g id="edge1" class="edge">
<title>user&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M858.2,-645.95C874.84,-618.98 893.55,-589.44 911.47,-562.8 922.91,-545.8 935.41,-527.98 947.74,-510.82"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="949.74,-512.53 952,-504.91 945.48,-509.46 949.74,-512.53"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="911.47,-562.8 911.47,-585.6 1098.02,-585.6 1098.02,-562.8 911.47,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="914.47" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- integrationhub&#45;&gt;externalapi -->
<g id="edge3" class="edge">
<title>integrationhub&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M860.2,-356.74C729.2,-311.03 539.29,-243.48 375.02,-180 360.2,-174.27 344.85,-168.2 329.5,-162.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.69,-159.68 322.75,-159.31 328.72,-164.55 330.69,-159.68"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="586.81,-240 586.81,-262.8 613.8,-262.8 613.8,-240 586.81,-240"/>
<text xml:space="preserve" text-anchor="start" x="589.81" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge4" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M900.81,-322.87C843.72,-280.27 775.3,-229.23 717.21,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="719.09,-184.02 711.51,-181.64 715.95,-188.23 719.09,-184.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="817.91,-240 817.91,-262.8 844.91,-262.8 844.91,-240 817.91,-240"/>
<text xml:space="preserve" text-anchor="start" x="820.91" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;iam -->
<g id="edge5" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1020.02,-322.87C1020.02,-281.67 1020.02,-232.56 1020.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1022.65,-190.36 1020.02,-182.86 1017.4,-190.36 1022.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1020.02,-240 1020.02,-262.8 1047.01,-262.8 1047.01,-240 1020.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="1023.02" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge6" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1139.23,-322.87C1196.32,-280.27 1264.74,-229.23 1322.83,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1324.09,-188.23 1328.53,-181.64 1320.95,-184.02 1324.09,-188.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1247.91,-240 1247.91,-262.8 1344.17,-262.8 1344.17,-240 1247.91,-240"/>
<text xml:space="preserve" text-anchor="start" x="1250.91" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge7" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1179.84,-356.74C1310.84,-311.03 1500.75,-243.48 1665.02,-180 1679.84,-174.27 1695.19,-168.2 1710.54,-162.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1711.32,-164.55 1717.29,-159.31 1709.35,-159.68 1711.32,-164.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1488.83,-240 1488.83,-262.8 1515.82,-262.8 1515.82,-240 1488.83,-240"/>
<text xml:space="preserve" text-anchor="start" x="1491.83" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- admin&#45;&gt;integrationhub -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;integrationhub</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1176.31,-645.76C1158.6,-619.06 1139.06,-589.7 1121.02,-562.8 1109.8,-546.07 1097.83,-528.32 1086.19,-511.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1088.59,-509.98 1082.21,-505.24 1084.24,-512.92 1088.59,-509.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1133.46,-562.8 1133.46,-585.6 1376.81,-585.6 1376.81,-562.8 1133.46,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1136.46" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
</g>
</g>
</svg>
`;case"context":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2145pt" height="882pt"
 viewBox="0.00 0.00 2145.00 882.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 866.65)">
<g id="clust1" class="cluster">
<title>cluster_integrationhub</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="175.02,-299.6 175.02,-580.8 1155.02,-580.8 1155.02,-299.6 175.02,-299.6"/>
<text xml:space="preserve" text-anchor="start" x="183.02" y="-567.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">INTEGRATION HUB PLATFORM</text>
</g>
<!-- adminconsole -->
<g id="node1" class="node">
<title>adminconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="535.04,-519.6 215,-519.6 215,-339.6 535.04,-339.6 535.04,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="307.21" y="-423.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1115.04,-519.6 795,-519.6 795,-339.6 1115.04,-339.6 1115.04,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="865.53" y="-423.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Quarkus Native App</text>
</g>
<!-- user -->
<g id="node3" class="node">
<title>user</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-851.6 0,-851.6 0,-671.6 320.04,-671.6 320.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="73.85" y="-755.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-851.6 430,-851.6 430,-671.6 750.04,-671.6 750.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="452.17" y="-755.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Administrador de integraciones</text>
</g>
<!-- iam -->
<g id="node5" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="395.04,-180 75,-180 75,0 395.04,0 395.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="194.44" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- externalapi -->
<g id="node6" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="825.04,-180 505,-180 505,0 825.04,0 825.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="602.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- filesources -->
<g id="node7" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1255.04,-180 935,-180 935,0 1255.04,0 1255.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1017.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node8" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1685.04,-180 1365,-180 1365,0 1685.04,0 1685.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1458.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
</g>
<!-- db -->
<g id="node9" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2115.04,-180 1795,-180 1795,0 2115.04,0 2115.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1900.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- adminconsole&#45;&gt;quarkusapp -->
<g id="edge3" class="edge">
<title>adminconsole&#45;&gt;quarkusapp</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M534.66,-429.6C612.4,-429.6 705.93,-429.6 785,-429.6"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="784.54,-432.23 792.04,-429.6 784.54,-426.98 784.54,-432.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="590.03,-432.6 590.03,-455.4 740.01,-455.4 740.01,-432.6 590.03,-432.6"/>
<text xml:space="preserve" text-anchor="start" x="593.03" y="-439.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs protegidas</text>
</g>
<!-- adminconsole&#45;&gt;iam -->
<g id="edge4" class="edge">
<title>adminconsole&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M254.16,-339.81C237.47,-321.86 222.75,-301.64 213.08,-279.6 200.88,-251.8 200.3,-219.6 204.55,-189.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="207.08,-190.55 205.69,-182.72 201.9,-189.71 207.08,-190.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="213.08,-248.4 213.08,-271.2 342.02,-271.2 342.02,-248.4 213.08,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="216.08" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Autenticacion OIDC</text>
</g>
<!-- quarkusapp&#45;&gt;iam -->
<g id="edge7" class="edge">
<title>quarkusapp&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M795,-353.81C744.31,-330.09 688.05,-303.76 636.5,-279.6 560.11,-243.79 475.56,-204.08 403.84,-170.38"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="405.35,-168.19 397.45,-167.37 403.12,-172.94 405.35,-168.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="636.5,-248.4 636.5,-271.2 774.02,-271.2 774.02,-248.4 636.5,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="639.5" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Valida access tokens</text>
</g>
<!-- quarkusapp&#45;&gt;externalapi -->
<g id="edge5" class="edge">
<title>quarkusapp&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M878.83,-339.9C838.69,-293.17 789.39,-235.78 748.25,-187.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="750.31,-186.26 743.43,-182.28 746.33,-189.68 750.31,-186.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="818.72,-248.4 818.72,-271.2 971.81,-271.2 971.81,-248.4 818.72,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="821.72" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Invoca APIs de negocio</text>
</g>
<!-- quarkusapp&#45;&gt;filesources -->
<g id="edge6" class="edge">
<title>quarkusapp&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M991.8,-339.9C1010.94,-293.75 1034.39,-237.2 1054.1,-189.67"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1056.51,-190.72 1056.96,-182.78 1051.66,-188.71 1056.51,-190.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1029.22,-248.4 1029.22,-271.2 1056.21,-271.2 1056.21,-248.4 1029.22,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="1032.22" y="-256.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;observability -->
<g id="edge8" class="edge">
<title>quarkusapp&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1105.15,-339.68C1185.51,-292.09 1284.46,-233.48 1366.11,-185.12"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1367.24,-187.5 1372.36,-181.42 1364.57,-182.98 1367.24,-187.5"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1257.11,-248.4 1257.11,-271.2 1353.37,-271.2 1353.37,-248.4 1257.11,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="1260.11" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
</g>
<!-- quarkusapp&#45;&gt;db -->
<g id="edge9" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1114.99,-382.33C1274.58,-335.14 1526.13,-257.97 1740.02,-180 1754.87,-174.59 1770.21,-168.75 1785.53,-162.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1786.23,-165.29 1792.25,-160.09 1784.31,-160.4 1786.23,-165.29"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1548.03,-240 1548.03,-279.6 1786.71,-279.6 1786.71,-240 1548.03,-240"/>
<text xml:space="preserve" text-anchor="start" x="1551.03" y="-264" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="1551.03" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- user&#45;&gt;adminconsole -->
<g id="edge1" class="edge">
<title>user&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M213.94,-671.82C230.53,-644.98 249.02,-615.54 266.47,-588.8 279.45,-568.91 293.62,-547.82 307.31,-527.75"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="309.37,-529.39 311.44,-521.71 305.04,-526.42 309.37,-529.39"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="266.47,-588.8 266.47,-611.6 453.02,-611.6 453.02,-588.8 266.47,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="269.47" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta estado y resultados</text>
</g>
<!-- admin&#45;&gt;adminconsole -->
<g id="edge2" class="edge">
<title>admin&#45;&gt;adminconsole</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M532.12,-671.73C503.2,-627.34 468.15,-573.54 438.5,-528.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="440.78,-526.73 434.49,-521.88 436.38,-529.59 440.78,-526.73"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="488.97,-588.8 488.97,-611.6 732.32,-611.6 732.32,-588.8 488.97,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="491.97" y="-596" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura fuentes, readers y procesos</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-1488 1720,-1488 1720,-1308 2040.04,-1308 2040.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="1793.85" y="-1392" font-family="Arial" font-size="20.00" fill="#eff6ff">Usuario de negocio</text>
</g>
<!-- adminconsole -->
<g id="node2" class="node">
<title>adminconsole</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2255.04,-1165.2 1935,-1165.2 1935,-985.2 2255.04,-985.2 2255.04,-1165.2"/>
<text xml:space="preserve" text-anchor="start" x="2027.21" y="-1069.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin Console</text>
</g>
<!-- admin -->
<g id="node3" class="node">
<title>admin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-1488 2150,-1488 2150,-1308 2470.04,-1308 2470.04,-1488"/>
<text xml:space="preserve" text-anchor="start" x="2172.17" y="-1392" font-family="Arial" font-size="20.00" fill="#eff6ff">Administrador de integraciones</text>
</g>
<!-- quarkusapp -->
<g id="node4" class="node">
<title>quarkusapp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2255.04,-842.4 1935,-842.4 1935,-662.4 2255.04,-662.4 2255.04,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="2005.53" y="-746.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Quarkus Native App</text>
</g>
<!-- iam -->
<g id="node5" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3330.04,-502.8 3010,-502.8 3010,-322.8 3330.04,-322.8 3330.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="3129.44" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="105.55" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesystem -->
<g id="node7" class="node">
<title>filesystem</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-502.8 430,-502.8 430,-322.8 750.04,-322.8 750.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="537.79" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">File System</text>
</g>
<!-- ftp -->
<g id="node8" class="node">
<title>ftp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-502.8 860,-502.8 860,-322.8 1180.04,-322.8 1180.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1001.13" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">FTP</text>
</g>
<!-- sftp -->
<g id="node9" class="node">
<title>sftp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-502.8 1290,-502.8 1290,-322.8 1610.04,-322.8 1610.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1424.46" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">SFTP</text>
</g>
<!-- restsource -->
<g id="node10" class="node">
<title>restsource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-502.8 1720,-502.8 1720,-322.8 2040.04,-322.8 2040.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1818.89" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">REST Source</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2900.04,-502.8 2580,-502.8 2580,-322.8 2900.04,-322.8 2900.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2628.87" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Collector</text>
</g>
<!-- jaeger -->
<g id="node13" class="node">
<title>jaeger</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2900.04,-180 2580,-180 2580,0 2900.04,0 2900.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2709.44" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Jaeger</text>
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
<svg width="6342pt" height="1178pt"
 viewBox="0.00 0.00 6342.00 1178.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1163.45)">
<!-- adminapi -->
<g id="node1" class="node">
<title>adminapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="965.04,-1148.4 645,-1148.4 645,-968.4 965.04,-968.4 965.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="757.78" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Admin API</text>
</g>
<!-- processengine -->
<g id="node2" class="node">
<title>processengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-825.6 860,-825.6 860,-645.6 1180.04,-645.6 1180.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="949.98" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Process Engine</text>
</g>
<!-- executionapi -->
<g id="node3" class="node">
<title>executionapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1395.04,-1148.4 1075,-1148.4 1075,-968.4 1395.04,-968.4 1395.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1172.21" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Execution API</text>
</g>
<!-- queryapi -->
<g id="node4" class="node">
<title>queryapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-1148.4 1720,-1148.4 1720,-968.4 2040.04,-968.4 2040.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="1833.89" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Query API</text>
</g>
<!-- auditservice -->
<g id="node5" class="node">
<title>auditservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-502.8 1720,-502.8 1720,-322.8 2040.04,-322.8 2040.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1821.1" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Audit Service</text>
</g>
<!-- scheduler -->
<g id="node6" class="node">
<title>scheduler</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-1148.4 2150,-1148.4 2150,-968.4 2470.04,-968.4 2470.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="2264.99" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Scheduler</text>
</g>
<!-- iam -->
<g id="node7" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-825.6 2150,-825.6 2150,-645.6 2470.04,-645.6 2470.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2269.44" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- processexecutionservice -->
<g id="node8" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3760.04,-1148.4 3440,-1148.4 3440,-968.4 3760.04,-968.4 3760.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="3486.64" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node9" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="5480.04,-825.6 5160,-825.6 5160,-645.6 5480.04,-645.6 5480.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="5225" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- restcalltaskprovider -->
<g id="node10" class="node">
<title>restcalltaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2900.04,-825.6 2580,-825.6 2580,-645.6 2900.04,-645.6 2900.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2643.33" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">RestCallTaskProvider</text>
</g>
<!-- notificationtaskprovider -->
<g id="node11" class="node">
<title>notificationtaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3330.04,-825.6 3010,-825.6 3010,-645.6 3330.04,-645.6 3330.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3061.65" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">NotificationTaskProvider</text>
</g>
<!-- taskproviderregistrycode -->
<g id="node12" class="node">
<title>taskproviderregistrycode</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3760.04,-825.6 3440,-825.6 3440,-645.6 3760.04,-645.6 3760.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3504.44" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">TaskProviderRegistry</text>
</g>
<!-- sourceproviderregistrycode -->
<g id="node13" class="node">
<title>sourceproviderregistrycode</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4190.04,-825.6 3870,-825.6 3870,-645.6 4190.04,-645.6 4190.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="3924.42" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceProviderRegistry</text>
</g>
<!-- readerproviderregistrycode -->
<g id="node14" class="node">
<title>readerproviderregistrycode</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="4620.04,-825.6 4300,-825.6 4300,-645.6 4620.04,-645.6 4620.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="4353.31" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderProviderRegistry</text>
</g>
<!-- jsonconfigurationmapper -->
<g id="node15" class="node">
<title>jsonconfigurationmapper</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="5050.04,-825.6 4730,-825.6 4730,-645.6 5050.04,-645.6 5050.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="4775.51" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">JsonConfigurationMapper</text>
</g>
<!-- processcatalogservice -->
<g id="node16" class="node">
<title>processcatalogservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="5860.04,-1148.4 5540,-1148.4 5540,-968.4 5860.04,-968.4 5860.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="5596.08" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessCatalogService</text>
</g>
<!-- db -->
<g id="node17" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="5707.04,-502.8 5387,-502.8 5387,-322.8 5707.04,-322.8 5707.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="5492.55" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- sourceregistry -->
<g id="node18" class="node">
<title>sourceregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="48.87" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Provider Registry</text>
</g>
<!-- readerregistry -->
<g id="node19" class="node">
<title>readerregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-502.8 430,-502.8 430,-322.8 750.04,-322.8 750.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="477.75" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Provider Registry</text>
</g>
<!-- taskregistry -->
<g id="node20" class="node">
<title>taskregistry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-502.8 860,-502.8 860,-322.8 1180.04,-322.8 1180.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="918.88" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Provider Registry</text>
</g>
<!-- telemetry -->
<g id="node21" class="node">
<title>telemetry</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-502.8 1290,-502.8 1290,-322.8 1610.04,-322.8 1610.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1309.96" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry instrumentation</text>
</g>
<!-- externalapi -->
<g id="node22" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3091.04,-502.8 2771,-502.8 2771,-322.8 3091.04,-322.8 3091.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2868.77" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- sourceproviders -->
<g id="node23" class="node">
<title>sourceproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="83.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Source Providers</text>
</g>
<!-- readerproviders -->
<g id="node24" class="node">
<title>readerproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-180 430,-180 430,0 750.04,0 750.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="512.21" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Reader Providers</text>
</g>
<!-- taskproviders -->
<g id="node25" class="node">
<title>taskproviders</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-180 860,-180 860,0 1180.04,0 1180.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="953.34" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Task Providers</text>
</g>
<!-- filesystem -->
<g id="node26" class="node">
<title>filesystem</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-502.8 2150,-502.8 2150,-322.8 2470.04,-322.8 2470.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2257.79" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">File System</text>
</g>
<!-- ftp -->
<g id="node27" class="node">
<title>ftp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-180 2150,-180 2150,0 2470.04,0 2470.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2291.13" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">FTP</text>
</g>
<!-- sftp -->
<g id="node28" class="node">
<title>sftp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="6312.04,-1148.4 5992,-1148.4 5992,-968.4 6312.04,-968.4 6312.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="6126.46" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">SFTP</text>
</g>
<!-- restsource -->
<g id="node29" class="node">
<title>restsource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="6312.04,-825.6 5992,-825.6 5992,-645.6 6312.04,-645.6 6312.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="6090.89" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">REST Source</text>
</g>
<!-- otel -->
<g id="node30" class="node">
<title>otel</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="6312.04,-502.8 5992,-502.8 5992,-322.8 6312.04,-322.8 6312.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="6040.87" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Collector</text>
</g>
<!-- adminapi&#45;&gt;processengine -->
<g id="edge1" class="edge">
<title>adminapi&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M864.62,-968.47C892.59,-926.74 925.98,-876.91 954.64,-834.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="956.81,-835.64 958.8,-827.94 952.45,-832.71 956.81,-835.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="918.97,-885.6 918.97,-908.4 1063.5,-908.4 1063.5,-885.6 918.97,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="921.97" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Configura definiciones</text>
</g>
<!-- processengine&#45;&gt;auditservice -->
<g id="edge16" class="edge">
<title>processengine&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1179.84,-679.54C1310.84,-633.83 1500.75,-566.28 1665.02,-502.8 1679.84,-497.07 1695.19,-491 1710.54,-484.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1711.32,-487.35 1717.29,-482.11 1709.35,-482.48 1711.32,-487.35"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1488.83,-562.8 1488.83,-585.6 1599.88,-585.6 1599.88,-562.8 1488.83,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1491.83" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Registra eventos</text>
</g>
<!-- processengine&#45;&gt;sourceregistry -->
<g id="edge13" class="edge">
<title>processengine&#45;&gt;sourceregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M860.2,-679.54C729.2,-633.83 539.29,-566.28 375.02,-502.8 360.2,-497.07 344.85,-491 329.5,-484.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.69,-482.48 322.75,-482.11 328.72,-487.35 330.69,-482.48"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="586.81,-562.8 586.81,-585.6 693.99,-585.6 693.99,-562.8 586.81,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="589.81" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve fuente</text>
</g>
<!-- processengine&#45;&gt;readerregistry -->
<g id="edge14" class="edge">
<title>processengine&#45;&gt;readerregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M900.81,-645.67C843.72,-603.07 775.3,-552.03 717.21,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="719.09,-506.82 711.51,-504.44 715.95,-511.03 719.09,-506.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="817.91,-562.8 817.91,-585.6 926.64,-585.6 926.64,-562.8 817.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="820.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve reader</text>
</g>
<!-- processengine&#45;&gt;taskregistry -->
<g id="edge15" class="edge">
<title>processengine&#45;&gt;taskregistry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1020.02,-645.67C1020.02,-604.47 1020.02,-555.36 1020.02,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1022.65,-513.16 1020.02,-505.66 1017.4,-513.16 1022.65,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1020.02,-562.8 1020.02,-585.6 1120.19,-585.6 1120.19,-562.8 1020.02,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1023.02" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve tarea</text>
</g>
<!-- processengine&#45;&gt;telemetry -->
<g id="edge17" class="edge">
<title>processengine&#45;&gt;telemetry</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1139.23,-645.67C1196.32,-603.07 1264.74,-552.03 1322.83,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1324.09,-511.03 1328.53,-504.44 1320.95,-506.82 1324.09,-511.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1247.91,-562.8 1247.91,-585.6 1325.51,-585.6 1325.51,-562.8 1247.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1250.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Crea spans</text>
</g>
<!-- executionapi&#45;&gt;processengine -->
<g id="edge2" class="edge">
<title>executionapi&#45;&gt;processengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1175.42,-968.47C1147.45,-926.74 1114.06,-876.91 1085.4,-834.16"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1087.59,-832.71 1081.24,-827.94 1083.23,-835.64 1087.59,-832.71"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1133.97,-885.6 1133.97,-908.4 1250.48,-908.4 1250.48,-885.6 1133.97,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="1136.97" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Inicia ejecuciones</text>
</g>
<!-- queryapi&#45;&gt;auditservice -->
<g id="edge3" class="edge">
<title>queryapi&#45;&gt;auditservice</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1880.02,-968.59C1880.02,-849.18 1880.02,-637.53 1880.02,-513.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1882.65,-513.26 1880.02,-505.76 1877.4,-513.26 1882.65,-513.26"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1880.02,-724.2 1880.02,-747 1994.2,-747 1994.2,-724.2 1880.02,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="1883.02" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Consulta eventos</text>
</g>
<!-- scheduler&#45;&gt;iam -->
<!-- iam&#45;&gt;filesystem -->
<!-- processexecutionservice&#45;&gt;dbwritetaskprovider -->
<g id="edge5" class="edge">
<title>processexecutionservice&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3760.02,-1046.4C4038.21,-1024.29 4627.03,-964.17 5105.02,-825.6 5120.04,-821.25 5135.44,-816.17 5150.75,-810.7"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5151.27,-813.3 5157.42,-808.27 5149.48,-808.37 5151.27,-813.3"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4863.99,-885.6 4863.99,-908.4 4992.92,-908.4 4992.92,-885.6 4863.99,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="4866.99" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta DB_WRITE</text>
</g>
<!-- processexecutionservice&#45;&gt;restcalltaskprovider -->
<g id="edge6" class="edge">
<title>processexecutionservice&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3440.2,-1002.34C3309.2,-956.63 3119.29,-889.08 2955.02,-825.6 2940.2,-819.87 2924.85,-813.8 2909.5,-807.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2910.69,-805.28 2902.75,-804.91 2908.72,-810.15 2910.69,-805.28"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3166.81,-885.6 3166.81,-908.4 3303.54,-908.4 3303.54,-885.6 3166.81,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="3169.81" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta REST_CALL</text>
</g>
<!-- processexecutionservice&#45;&gt;notificationtaskprovider -->
<g id="edge7" class="edge">
<title>processexecutionservice&#45;&gt;notificationtaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3480.81,-968.47C3423.72,-925.87 3355.3,-874.83 3297.21,-831.49"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3299.09,-829.62 3291.51,-827.24 3295.95,-833.83 3299.09,-829.62"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3397.91,-885.6 3397.91,-908.4 3553.27,-908.4 3553.27,-885.6 3397.91,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="3400.91" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta NOTIFICATION</text>
</g>
<!-- processexecutionservice&#45;&gt;taskproviderregistrycode -->
<g id="edge8" class="edge">
<title>processexecutionservice&#45;&gt;taskproviderregistrycode</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3600.02,-968.47C3600.02,-927.27 3600.02,-878.16 3600.02,-835.77"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3602.65,-835.96 3600.02,-828.46 3597.4,-835.96 3602.65,-835.96"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3600.02,-885.6 3600.02,-908.4 3750.74,-908.4 3750.74,-885.6 3600.02,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="3603.02" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve TaskProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;sourceproviderregistrycode -->
<g id="edge9" class="edge">
<title>processexecutionservice&#45;&gt;sourceproviderregistrycode</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3719.23,-968.47C3776.32,-925.87 3844.74,-874.83 3902.83,-831.49"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3904.09,-833.83 3908.53,-827.24 3900.95,-829.62 3904.09,-833.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3827.91,-885.6 3827.91,-908.4 3992.66,-908.4 3992.66,-885.6 3827.91,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="3830.91" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve SourceProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;readerproviderregistrycode -->
<g id="edge10" class="edge">
<title>processexecutionservice&#45;&gt;readerproviderregistrycode</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3759.97,-1002.67C3891.05,-957.16 4080.99,-889.7 4245.02,-825.6 4259.82,-819.82 4275.15,-813.71 4290.49,-807.51"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4291.27,-810.03 4297.24,-804.78 4289.3,-805.16 4291.27,-810.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4086.83,-885.6 4086.83,-908.4 4253.13,-908.4 4253.13,-885.6 4086.83,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="4089.83" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve ReaderProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;jsonconfigurationmapper -->
<g id="edge11" class="edge">
<title>processexecutionservice&#45;&gt;jsonconfigurationmapper</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3759.9,-1032.2C3971.94,-996.69 4356.53,-924.97 4675.02,-825.6 4689.95,-820.94 4705.28,-815.66 4720.55,-810.04"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="4721.1,-812.64 4727.21,-807.56 4719.27,-807.72 4721.1,-812.64"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="4443.24,-885.6 4443.24,-908.4 4600.99,-908.4 4600.99,-885.6 4443.24,-885.6"/>
<text xml:space="preserve" text-anchor="start" x="4446.24" y="-892.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee configuracion JSON</text>
</g>
<!-- dbwritetaskprovider&#45;&gt;db -->
<g id="edge18" class="edge">
<title>dbwritetaskprovider&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M5382.95,-645.67C5412.53,-603.86 5447.88,-553.91 5478.18,-511.09"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5480.23,-512.74 5482.42,-505.1 5475.94,-509.71 5480.23,-512.74"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="5440.33,-562.8 5440.33,-585.6 5609.76,-585.6 5609.76,-562.8 5440.33,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="5443.33" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert/update/upsert</text>
</g>
<!-- restcalltaskprovider&#45;&gt;externalapi -->
<g id="edge19" class="edge">
<title>restcalltaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2774.08,-646.02C2785.9,-618.64 2800.11,-588.84 2815.61,-562.8 2825.96,-545.4 2838.05,-527.71 2850.43,-510.88"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2852.35,-512.71 2854.72,-505.12 2848.14,-509.57 2852.35,-512.71"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2815.61,-562.8 2815.61,-585.6 2936.02,-585.6 2936.02,-562.8 2815.61,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2818.61" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Envio de payloads</text>
</g>
<!-- notificationtaskprovider&#45;&gt;externalapi -->
<g id="edge20" class="edge">
<title>notificationtaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3103.76,-645.67C3072.55,-603.77 3035.25,-553.7 3003.3,-510.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3005.59,-509.5 2999.01,-505.06 3001.38,-512.64 3005.59,-509.5"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3057.69,-562.8 3057.69,-585.6 3182.75,-585.6 3182.75,-562.8 3057.69,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="3060.69" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Webhook/email/log</text>
</g>
<!-- processcatalogservice&#45;&gt;db -->
<g id="edge12" class="edge">
<title>processcatalogservice&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M5699.69,-968.67C5696.84,-867.7 5684.48,-699.12 5637.02,-562.8 5631.03,-545.58 5622.86,-528.2 5613.87,-511.7"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="5616.23,-510.54 5610.28,-505.27 5611.65,-513.1 5616.23,-510.54"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="5689.94,-724.2 5689.94,-747 5871.79,-747 5871.79,-724.2 5689.94,-724.2"/>
<text xml:space="preserve" text-anchor="start" x="5692.94" y="-731.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones y tasks</text>
</g>
<!-- sourceregistry&#45;&gt;sourceproviders -->
<g id="edge21" class="edge">
<title>sourceregistry&#45;&gt;sourceproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M160.02,-322.87C160.02,-281.67 160.02,-232.56 160.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="162.65,-190.36 160.02,-182.86 157.4,-190.36 162.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="160.02,-240 160.02,-262.8 296.74,-262.8 296.74,-240 160.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="163.02" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- readerregistry&#45;&gt;readerproviders -->
<g id="edge22" class="edge">
<title>readerregistry&#45;&gt;readerproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M590.02,-322.87C590.02,-281.67 590.02,-232.56 590.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="592.65,-190.36 590.02,-182.86 587.4,-190.36 592.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="590.02,-240 590.02,-262.8 726.74,-262.8 726.74,-240 590.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="593.02" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- taskregistry&#45;&gt;taskproviders -->
<g id="edge23" class="edge">
<title>taskregistry&#45;&gt;taskproviders</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1020.02,-322.87C1020.02,-281.67 1020.02,-232.56 1020.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1022.65,-190.36 1020.02,-182.86 1017.4,-190.36 1022.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1020.02,-240 1020.02,-262.8 1156.74,-262.8 1156.74,-240 1020.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="1023.02" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Usa implementations</text>
</g>
<!-- filesystem&#45;&gt;ftp -->
<!-- sftp&#45;&gt;restsource -->
<!-- restsource&#45;&gt;otel -->
</g>
</svg>
`;case"code":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 14.1.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3322pt" height="856pt"
 viewBox="0.00 0.00 3322.00 856.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 840.65)">
<!-- processexecutionservice -->
<g id="node1" class="node">
<title>processexecutionservice</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-825.6 860,-825.6 860,-645.6 1180.04,-645.6 1180.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="906.64" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">ProcessExecutionService</text>
</g>
<!-- dbwritetaskprovider -->
<g id="node2" class="node">
<title>dbwritetaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2900.04,-502.8 2580,-502.8 2580,-322.8 2900.04,-322.8 2900.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2645" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">DbWriteTaskProvider</text>
</g>
<!-- restcalltaskprovider -->
<g id="node3" class="node">
<title>restcalltaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="63.33" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">RestCallTaskProvider</text>
</g>
<!-- notificationtaskprovider -->
<g id="node4" class="node">
<title>notificationtaskprovider</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-502.8 430,-502.8 430,-322.8 750.04,-322.8 750.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="481.65" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">NotificationTaskProvider</text>
</g>
<!-- taskproviderregistrycode -->
<g id="node5" class="node">
<title>taskproviderregistrycode</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-502.8 860,-502.8 860,-322.8 1180.04,-322.8 1180.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="924.44" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">TaskProviderRegistry</text>
</g>
<!-- sourceproviderregistrycode -->
<g id="node6" class="node">
<title>sourceproviderregistrycode</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-502.8 1290,-502.8 1290,-322.8 1610.04,-322.8 1610.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1344.42" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">SourceProviderRegistry</text>
</g>
<!-- readerproviderregistrycode -->
<g id="node7" class="node">
<title>readerproviderregistrycode</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-502.8 1720,-502.8 1720,-322.8 2040.04,-322.8 2040.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1773.31" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">ReaderProviderRegistry</text>
</g>
<!-- jsonconfigurationmapper -->
<g id="node8" class="node">
<title>jsonconfigurationmapper</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2470.04,-502.8 2150,-502.8 2150,-322.8 2470.04,-322.8 2470.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2195.51" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">JsonConfigurationMapper</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3127.04,-180 2807,-180 2807,0 3127.04,0 3127.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2912.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- externalapi -->
<g id="node11" class="node">
<title>externalapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="536.04,-180 216,-180 216,0 536.04,0 536.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="313.77" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">APIs externas</text>
</g>
<!-- processexecutionservice&#45;&gt;dbwritetaskprovider -->
<g id="edge1" class="edge">
<title>processexecutionservice&#45;&gt;dbwritetaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1180.02,-723.6C1458.21,-701.49 2047.03,-641.37 2525.02,-502.8 2540.04,-498.45 2555.44,-493.37 2570.75,-487.9"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2571.27,-490.5 2577.42,-485.47 2569.48,-485.57 2571.27,-490.5"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2283.99,-562.8 2283.99,-585.6 2412.92,-585.6 2412.92,-562.8 2283.99,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2286.99" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta DB_WRITE</text>
</g>
<!-- processexecutionservice&#45;&gt;restcalltaskprovider -->
<g id="edge2" class="edge">
<title>processexecutionservice&#45;&gt;restcalltaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M860.2,-679.54C729.2,-633.83 539.29,-566.28 375.02,-502.8 360.2,-497.07 344.85,-491 329.5,-484.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="330.69,-482.48 322.75,-482.11 328.72,-487.35 330.69,-482.48"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="586.81,-562.8 586.81,-585.6 723.54,-585.6 723.54,-562.8 586.81,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="589.81" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta REST_CALL</text>
</g>
<!-- processexecutionservice&#45;&gt;notificationtaskprovider -->
<g id="edge3" class="edge">
<title>processexecutionservice&#45;&gt;notificationtaskprovider</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M900.81,-645.67C843.72,-603.07 775.3,-552.03 717.21,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="719.09,-506.82 711.51,-504.44 715.95,-511.03 719.09,-506.82"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="817.91,-562.8 817.91,-585.6 973.27,-585.6 973.27,-562.8 817.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="820.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Ejecuta NOTIFICATION</text>
</g>
<!-- processexecutionservice&#45;&gt;taskproviderregistrycode -->
<g id="edge4" class="edge">
<title>processexecutionservice&#45;&gt;taskproviderregistrycode</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1020.02,-645.67C1020.02,-604.47 1020.02,-555.36 1020.02,-512.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1022.65,-513.16 1020.02,-505.66 1017.4,-513.16 1022.65,-513.16"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1020.02,-562.8 1020.02,-585.6 1170.74,-585.6 1170.74,-562.8 1020.02,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1023.02" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve TaskProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;sourceproviderregistrycode -->
<g id="edge5" class="edge">
<title>processexecutionservice&#45;&gt;sourceproviderregistrycode</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1139.23,-645.67C1196.32,-603.07 1264.74,-552.03 1322.83,-508.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1324.09,-511.03 1328.53,-504.44 1320.95,-506.82 1324.09,-511.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1247.91,-562.8 1247.91,-585.6 1412.66,-585.6 1412.66,-562.8 1247.91,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1250.91" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve SourceProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;readerproviderregistrycode -->
<g id="edge6" class="edge">
<title>processexecutionservice&#45;&gt;readerproviderregistrycode</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1179.97,-679.87C1311.05,-634.36 1500.99,-566.9 1665.02,-502.8 1679.82,-497.02 1695.15,-490.91 1710.49,-484.71"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1711.27,-487.23 1717.24,-481.98 1709.3,-482.36 1711.27,-487.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1506.83,-562.8 1506.83,-585.6 1673.13,-585.6 1673.13,-562.8 1506.83,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1509.83" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resuelve ReaderProvider</text>
</g>
<!-- processexecutionservice&#45;&gt;jsonconfigurationmapper -->
<g id="edge7" class="edge">
<title>processexecutionservice&#45;&gt;jsonconfigurationmapper</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1179.9,-709.4C1391.94,-673.89 1776.53,-602.17 2095.02,-502.8 2109.95,-498.14 2125.28,-492.86 2140.55,-487.24"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2141.1,-489.84 2147.21,-484.76 2139.27,-484.92 2141.1,-489.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1863.24,-562.8 1863.24,-585.6 2020.99,-585.6 2020.99,-562.8 1863.24,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1866.24" y="-570" font-family="Arial" font-size="14.00" fill="#c9c9c9">Lee configuracion JSON</text>
</g>
<!-- dbwritetaskprovider&#45;&gt;db -->
<g id="edge9" class="edge">
<title>dbwritetaskprovider&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2802.95,-322.87C2832.53,-281.06 2867.88,-231.11 2898.18,-188.29"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2900.23,-189.94 2902.42,-182.3 2895.94,-186.91 2900.23,-189.94"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2860.33,-240 2860.33,-262.8 3029.76,-262.8 3029.76,-240 2860.33,-240"/>
<text xml:space="preserve" text-anchor="start" x="2863.33" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Batch insert/update/upsert</text>
</g>
<!-- restcalltaskprovider&#45;&gt;externalapi -->
<g id="edge10" class="edge">
<title>restcalltaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M219.9,-322.87C247.99,-281.14 281.54,-231.31 310.33,-188.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="312.51,-190.03 314.52,-182.34 308.15,-187.1 312.51,-190.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="274.5,-240 274.5,-262.8 394.91,-262.8 394.91,-240 274.5,-240"/>
<text xml:space="preserve" text-anchor="start" x="277.5" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Envio de payloads</text>
</g>
<!-- notificationtaskprovider&#45;&gt;externalapi -->
<g id="edge11" class="edge">
<title>notificationtaskprovider&#45;&gt;externalapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M530.69,-322.87C502.86,-281.14 469.62,-231.31 441.1,-188.56"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="443.3,-187.13 436.96,-182.35 438.93,-190.04 443.3,-187.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="489.44,-240 489.44,-262.8 614.5,-262.8 614.5,-240 489.44,-240"/>
<text xml:space="preserve" text-anchor="start" x="492.44" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Webhook/email/log</text>
</g>
<!-- processcatalogservice&#45;&gt;db -->
<g id="edge8" class="edge">
<title>processcatalogservice&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3119.69,-645.87C3116.84,-544.9 3104.48,-376.32 3057.02,-240 3051.03,-222.78 3042.86,-205.4 3033.87,-188.9"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="3036.23,-187.74 3030.28,-182.47 3031.65,-190.3 3036.23,-187.74"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3109.94,-401.4 3109.94,-424.2 3291.79,-424.2 3291.79,-401.4 3109.94,-401.4"/>
<text xml:space="preserve" text-anchor="start" x="3112.94" y="-408.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste definiciones y tasks</text>
</g>
</g>
</svg>
`;default:throw new Error("Unknown viewId: "+e)}}export{t as dotSource,n as svgSource};
