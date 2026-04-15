function e(n){switch(n){case"index":return`digraph {
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
`;default:throw new Error("Unknown viewId: "+n)}}function t(n){switch(n){case"index":return`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="965.04,-825.6 645,-825.6 645,-645.6 965.04,-645.6 965.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="718.85" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
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
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="1395.04,-825.6 1075,-825.6 1075,-645.6 1395.04,-645.6 1395.04,-825.6"/>
<text xml:space="preserve" text-anchor="start" x="1097.17" y="-729.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
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
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="535.04,-519.6 215,-519.6 215,-339.6 535.04,-339.6 535.04,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="307.21" y="-423.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Admin Console</text>
</g>
<!-- quarkusapp -->
<g id="node2" class="node">
<title>quarkusapp</title>
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1115.04,-519.6 795,-519.6 795,-339.6 1115.04,-339.6 1115.04,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="865.53" y="-423.6" font-family="Arial" font-size="20.00" fill="#f8fafc">Quarkus Native App</text>
</g>
<!-- user -->
<g id="node3" class="node">
<title>user</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="320.04,-851.6 0,-851.6 0,-671.6 320.04,-671.6 320.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="73.85" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Usuario de negocio</text>
</g>
<!-- admin -->
<g id="node4" class="node">
<title>admin</title>
<polygon fill="#a35829" stroke="#7e451d" stroke-width="0" points="750.04,-851.6 430,-851.6 430,-671.6 750.04,-671.6 750.04,-851.6"/>
<text xml:space="preserve" text-anchor="start" x="452.17" y="-755.6" font-family="Arial" font-size="20.00" fill="#ffe0c2">Administrador de integraciones</text>
</g>
<!-- iam -->
<g id="node5" class="node">
<title>iam</title>
<polygon fill="#ac4d39" stroke="#853a2d" stroke-width="0" points="395.04,-180 75,-180 75,0 395.04,0 395.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="194.44" y="-84" font-family="Arial" font-size="20.00" fill="#fbd3cb">Keycloak</text>
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
<polygon fill="#428a4f" stroke="#2d5d39" stroke-width="0" points="1255.04,-180 935,-180 935,0 1255.04,0 1255.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="1040.55" y="-84" font-family="Arial" font-size="20.00" fill="#f8fafc">PostgreSQL</text>
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
`;default:throw new Error("Unknown viewId: "+n)}}export{e as dotSource,t as svgSource};
