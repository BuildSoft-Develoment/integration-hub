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
    quarkusapp -> iam [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Valida access tokens</FONT></TD></TR></TABLE>>,
        likec4_id="2rsnuj",
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
    db [height=2.5,
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
    iam [height=2.5,
        label=<<FONT POINT-SIZE="20">Keycloak</FONT>>,
        likec4_id=iam,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
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
    ftp -> sftp [style=invis];
    restsource [height=2.5,
        label=<<FONT POINT-SIZE="20">REST Source</FONT>>,
        likec4_id="fileSources.restSource",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    otel [height=2.5,
        label=<<FONT POINT-SIZE="20">OpenTelemetry Collector</FONT>>,
        likec4_id="observability.otel",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    restsource -> otel [style=invis];
}
`;case"deployment":return`digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=deployment,
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
    db [height=2.5,
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
<!-- iam -->
<g id="node5" class="node">
<title>iam</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="750.04,-180 430,-180 430,0 750.04,0 750.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="549.44" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1180.04,-180 860,-180 860,0 1180.04,0 1180.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="965.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node7" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1610.04,-180 1290,-180 1290,0 1610.04,0 1610.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1372.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node8" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2040.04,-180 1720,-180 1720,0 2040.04,0 2040.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1813.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
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
<!-- integrationhub&#45;&gt;iam -->
<g id="edge4" class="edge">
<title>integrationhub&#45;&gt;iam</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M900.81,-322.87C843.72,-280.27 775.3,-229.23 717.21,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="719.09,-184.02 711.51,-181.64 715.95,-188.23 719.09,-184.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="817.91,-240 817.91,-262.8 844.91,-262.8 844.91,-240 817.91,-240"/>
<text xml:space="preserve" text-anchor="start" x="820.91" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;db -->
<g id="edge5" class="edge">
<title>integrationhub&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1020.02,-322.87C1020.02,-281.67 1020.02,-232.56 1020.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1022.65,-190.36 1020.02,-182.86 1017.4,-190.36 1022.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1020.02,-240 1020.02,-262.8 1047.01,-262.8 1047.01,-240 1020.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="1023.02" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;filesources -->
<g id="edge6" class="edge">
<title>integrationhub&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1139.23,-322.87C1196.32,-280.27 1264.74,-229.23 1322.83,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1324.09,-188.23 1328.53,-181.64 1320.95,-184.02 1324.09,-188.23"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1247.91,-240 1247.91,-262.8 1274.91,-262.8 1274.91,-240 1247.91,-240"/>
<text xml:space="preserve" text-anchor="start" x="1250.91" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- integrationhub&#45;&gt;observability -->
<g id="edge7" class="edge">
<title>integrationhub&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1179.84,-356.74C1310.84,-311.03 1500.75,-243.48 1665.02,-180 1679.84,-174.27 1695.19,-168.2 1710.54,-162.03"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1711.32,-164.55 1717.29,-159.31 1709.35,-159.68 1711.32,-164.55"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1488.83,-240 1488.83,-262.8 1585.09,-262.8 1585.09,-240 1488.83,-240"/>
<text xml:space="preserve" text-anchor="start" x="1491.83" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
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
<!-- db -->
<g id="node7" class="node">
<title>db</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1255.04,-180 935,-180 935,0 1255.04,0 1255.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1040.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
</g>
<!-- filesources -->
<g id="node8" class="node">
<title>filesources</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1685.04,-180 1365,-180 1365,0 1685.04,0 1685.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1447.75" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Fuentes externas</text>
</g>
<!-- observability -->
<g id="node9" class="node">
<title>observability</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2115.04,-180 1795,-180 1795,0 2115.04,0 2115.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1888.32" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">Observabilidad</text>
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
<g id="edge6" class="edge">
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
<!-- quarkusapp&#45;&gt;db -->
<g id="edge7" class="edge">
<title>quarkusapp&#45;&gt;db</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M991.8,-339.9C1010.94,-293.75 1034.39,-237.2 1054.1,-189.67"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1056.51,-190.72 1056.96,-182.78 1051.66,-188.71 1056.51,-190.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1029.22,-240 1029.22,-279.6 1267.9,-279.6 1267.9,-240 1029.22,-240"/>
<text xml:space="preserve" text-anchor="start" x="1032.22" y="-264" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persiste configuracion, jobs, auditoria</text>
<text xml:space="preserve" text-anchor="start" x="1032.22" y="-247.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">y staging</text>
</g>
<!-- quarkusapp&#45;&gt;filesources -->
<g id="edge8" class="edge">
<title>quarkusapp&#45;&gt;filesources</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1114.83,-369.19C1173.3,-344.74 1238.84,-314.04 1295.02,-279.6 1338.59,-252.89 1382.84,-218.65 1420.74,-186.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1422.4,-188.72 1426.42,-181.87 1419,-184.72 1422.4,-188.72"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1348.97,-248.4 1348.97,-271.2 1375.96,-271.2 1375.96,-248.4 1348.97,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="1351.97" y="-256.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- quarkusapp&#45;&gt;observability -->
<g id="edge9" class="edge">
<title>quarkusapp&#45;&gt;observability</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1114.99,-382.33C1274.58,-335.14 1526.13,-257.97 1740.02,-180 1754.87,-174.59 1770.21,-168.75 1785.53,-162.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1786.23,-165.29 1792.25,-160.09 1784.31,-160.4 1786.23,-165.29"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1548.03,-248.4 1548.03,-271.2 1644.29,-271.2 1644.29,-248.4 1548.03,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="1551.03" y="-255.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Exporta trazas</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2183.04,-180 1863,-180 1863,0 2183.04,0 2183.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1968.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2956.04,-1471.2 2636,-1471.2 2636,-1291.2 2956.04,-1291.2 2956.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="2755.44" y="-1375.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Keycloak</text>
</g>
<!-- filesystem -->
<g id="node17" class="node">
<title>filesystem</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2956.04,-1148.4 2636,-1148.4 2636,-968.4 2956.04,-968.4 2956.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="2743.79" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">File System</text>
</g>
<!-- ftp -->
<g id="node18" class="node">
<title>ftp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2956.04,-825.6 2636,-825.6 2636,-645.6 2956.04,-645.6 2956.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="2777.13" y="-729.6" font-family="Arial" font-size="20.00" fill="#eff6ff">FTP</text>
</g>
<!-- sftp -->
<g id="node19" class="node">
<title>sftp</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2956.04,-502.8 2636,-502.8 2636,-322.8 2956.04,-322.8 2956.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2770.46" y="-406.8" font-family="Arial" font-size="20.00" fill="#eff6ff">SFTP</text>
</g>
<!-- restsource -->
<g id="node20" class="node">
<title>restsource</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3386.04,-1471.2 3066,-1471.2 3066,-1291.2 3386.04,-1291.2 3386.04,-1471.2"/>
<text xml:space="preserve" text-anchor="start" x="3164.89" y="-1375.2" font-family="Arial" font-size="20.00" fill="#eff6ff">REST Source</text>
</g>
<!-- otel -->
<g id="node21" class="node">
<title>otel</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3386.04,-1148.4 3066,-1148.4 3066,-968.4 3386.04,-968.4 3386.04,-1148.4"/>
<text xml:space="preserve" text-anchor="start" x="3114.87" y="-1052.4" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Collector</text>
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
`;case"deployment":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3016.04,-180 2696,-180 2696,0 3016.04,0 3016.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="2801.55" y="-84" font-family="Arial" font-size="20.00" fill="#eff6ff">PostgreSQL</text>
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
`;default:throw new Error("Unknown viewId: "+e)}}export{t as dotSource,n as svgSource};
