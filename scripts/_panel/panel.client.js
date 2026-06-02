(function(){
  var MEM = window.__MEMORY__ || null;
  var MODE = window.__MEMORY_MODE__ || (MEM ? 'static' : 'live');
  var el = function(id){ return document.getElementById(id); };
  var esc = function(s){ s = (s==null?'':String(s)); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  // v12.32: helper compartido para serializar selectedOptions de un <select multiple> como CSV.
  function multiCsv(id){ var n=el(id); if(!n) return ''; if(n.multiple){ var arr=[]; for(var i=0;i<n.selectedOptions.length;i++) arr.push(n.selectedOptions[i].value); return arr.filter(Boolean).join(','); } return n.value||''; }
  function cell(v){ return '<td>' + esc(v||'-') + '</td>'; }
  function table(headers, rows, cols){
    if(!rows || !rows.length) return '<p class="empty">Sin registros.</p>';
    var h = '<table><thead><tr>'; for(var i=0;i<headers.length;i++) h += '<th>'+esc(headers[i])+'</th>'; h += '</tr></thead><tbody>';
    for(var r=0;r<rows.length;r++){ h += '<tr>'; for(var c=0;c<cols.length;c++) h += cell(rows[r][cols[c]]); h += '</tr>'; }
    return h + '</tbody></table>';
  }
  // v12.140: tabla con filtro local (P2). El filtrado vive en un listener delegado por data-table-filter.
  function filterTable(id, headers, rows, cols, ph){
    if(!rows || !rows.length) return '<p class="empty">Sin registros.</p>';
    var inp = '<input class="table-filter" type="text" data-table-filter="'+id+'" aria-label="Filtrar tabla" placeholder="'+esc(ph||('Filtrar '+rows.length+' filas…'))+'">';
    var tbl = table(headers, rows, cols).replace('<table>', '<table id="'+id+'">');
    return '<div class="table-filter-wrap">'+inp+'<span class="table-filter-count" id="'+id+'-count"></span></div>'+tbl;
  }
  // UX-4: estados reutilizables (loading skeleton + error con reintento + aviso de modo).
  function skeleton(widths){ var w = widths || ['40%','90%','70%','55%']; var h=''; for(var i=0;i<w.length;i++) h += '<div class="skeleton skeleton-row" style="width:'+w[i]+'"></div>'; return h; }
  function errorState(hostId, msg, retry){ var h = el(hostId); if(!h) return; h.innerHTML = '<div class="error-state">'+esc(msg)+'<br><button class="retry-btn" type="button">↻ Reintentar</button></div>'; var b = h.querySelector('.retry-btn'); if(b && retry) b.addEventListener('click', retry); }
  function modeNotice(what){ return '<p class="empty">'+esc(what)+' solo disponible en modo <strong>live</strong> (memory-serve). Arranca con <code>npm run memory:serve</code>.</p>'; }
  // UX-5: onboarding dismissible + barra de atajos (compartidos por la vista Inicio).
  function onboardHtml(){ var seen=false; try{ seen = localStorage.getItem('aif-onboard')==='1'; }catch(e){} if(seen) return ''; return '<div class="onboard-banner"><span>👋 <strong>Panel de memoria del agente.</strong> Esta es la vista <em>Inicio</em>: salud del proyecto, siguiente accion segura y accesos rapidos. Pulsa <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> para buscar e ir a cualquier seccion. <span class="mode-badge live">live</span> habilita acciones; <span class="mode-badge static">static</span> es solo lectura.</span><button class="onboard-x" type="button" aria-label="Cerrar">×</button></div>'; }
  function shortcutsHtml(){ return '<div class="shortcuts-bar"><span><kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> buscar / ir a</span><span><kbd>↑</kbd><kbd>↓</kbd> navegar secciones</span><span><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>H</kbd> historial · <kbd>T</kbd> stats · <kbd>D</kbd> tendencias</span><span><kbd>Esc</kbd> cancelar accion</span></div>'; }
  // UX-3: salto desde el command palette a una tabla con filtro aplicado.
  function gotoFilter(tableId, value){ setTimeout(function(){ var inp = document.querySelector('[data-table-filter="'+tableId+'"]'); if(inp){ inp.value = value; inp.dispatchEvent(new Event('input',{bubbles:true})); inp.scrollIntoView({behavior:'smooth',block:'center'}); } }, 60); }
  // v12.141: la barra de stats se movio a Inicio. statsGridHtml arma el grid reusable.
  function statsGridHtml(s){
    s = s || {};
    var items = [['Documentos',s.documents],['Chunks',s.chunks],['Trace links',s.traceLinks],['Gate runs',s.gateRuns],['Evidencia',s.evidence],['Decisiones',s.decisions],['Preguntas',s.openQuestions]];
    var h = ''; for(var i=0;i<items.length;i++){ h += '<div class="stat"><div class="stat-v">'+esc(items[i][1]==null?0:items[i][1])+'</div><div class="stat-l">'+esc(items[i][0])+'</div></div>'; }
    h += '<div class="stat"><div class="stat-v">'+(s.fts?'si':'no')+'</div><div class="stat-l">FTS5</div></div>';
    return h;
  }
  function renderStats(s){ var n = el('stats'); if(n) n.innerHTML = statsGridHtml(s); } // compat: solo si existe el contenedor global
  function renderAll(d){
    renderStats(d.stats);
    el('tab-trace').innerHTML = filterTable('tbl-trace', ['Origen','Ref','Relacion','Destino','Ref destino','Evidencia'], d.traceLinks, ['source_type','source_ref','relation','target_type','target_ref','evidence_ref'], 'Filtrar trace links (RF, archivo, relacion…)');
    // v12.139: tab Gates = resumen por gate (cantidades) + detalle por feature.
    var GR = d.gateRuns || [];
    var byGate = {};
    GR.forEach(function(x){ var g = byGate[x.gate] || (byGate[x.gate] = { gate:x.gate, approved:0, pending:0, na:0, otros:0, total:0 }); g.total++; var s=(x.status||'').toLowerCase(); if(s==='approved') g.approved++; else if(s==='pending') g.pending++; else if(/^n\/?a\b|no aplica/.test(s)) g.na++; else g.otros++; });
    var agg = Object.keys(byGate).sort().map(function(k){ var g = byGate[k]; return { gate:g.gate, aprobados:g.approved+' / '+g.total, pendientes:String(g.pending), na:String(g.na), otros:String(g.otros) }; });
    var gHtml = '<h4 style="margin:0 0 6px">Resumen por gate <span class="muted" style="font-weight:400">('+GR.length+' registros · '+agg.length+' gates)</span></h4>';
    gHtml += table(['Gate','Aprobados','Pendientes','N/A','Otros'], agg, ['gate','aprobados','pendientes','na','otros']);
    gHtml += '<h4 style="margin:14px 0 6px">Detalle por feature</h4>';
    gHtml += filterTable('tbl-gates', ['Gate','Scope','Estado','Evidencia'], GR, ['gate','phase_scope','status','summary'], 'Filtrar gates (gate, feature, estado…)');
    el('tab-gates').innerHTML = gHtml;
    // v12.141: estas 4 tablas pasan a filterTable -> ganan filtro local + orden por columna (table[id]).
    el('tab-decisions').innerHTML = filterTable('tbl-decisions', ['Ref','Titulo','Estado','ADR'], d.decisions, ['decision_ref','title','status','adr_path'], 'Filtrar decisiones (ref, titulo, estado…)');
    el('tab-evidence').innerHTML = filterTable('tbl-evidence', ['Tipo','Ruta','Descripcion','Estado'], d.evidence, ['evidence_type','path','description','status'], 'Filtrar evidencia (tipo, ruta, estado…)');
    el('tab-questions').innerHTML = filterTable('tbl-questions', ['Fase','Pregunta','Fuente','Estado'], d.openQuestions, ['phase','question','source_ref','status'], 'Filtrar preguntas (fase, texto, estado…)');
    el('tab-docs').innerHTML = filterTable('tbl-docs', ['Ruta','Tipo','Fase','Titulo'], d.documents, ['path','kind','phase','title'], 'Filtrar documentos (ruta, tipo, fase…)');
    // v12.141: rutas de archivo clicables (abren en pestaña Proyecto) en trace/evidencia/docs/decisiones.
    linkifyPaths('tbl-trace'); linkifyPaths('tbl-evidence'); linkifyPaths('tbl-docs'); linkifyPaths('tbl-decisions');
    // v12.141 (D): badges de color por estado en Gates(col2)/Preguntas(col3)/Decisiones(col2).
    badgeifyStatusCol('tbl-gates', 2); badgeifyStatusCol('tbl-questions', 3); badgeifyStatusCol('tbl-decisions', 2);
    el('meta').textContent = 'BD: ' + d.dbPath + '  |  modo: ' + d.mode + '  |  ' + d.generatedAt;
  }
  // Convierte celdas con aspecto de ruta de repo en enlaces que abren el archivo en Proyecto.
  var PATH_RE = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)+\.[A-Za-z0-9]+$/;
  function linkifyPaths(tableId){ if(MODE!=='live') return; var t = el(tableId); if(!t) return; var cells = t.querySelectorAll('tbody td'); for(var i=0;i<cells.length;i++){ var txt = cells[i].textContent.trim(); if(PATH_RE.test(txt)){ cells[i].innerHTML = '<a class="path-link" data-open-file="'+esc(txt)+'" title="Abrir en Proyecto">'+esc(txt)+'</a>'; } } }
  // Clase de badge segun el estado textual (approved/pending/open/resolved/...).
  function statusBadgeClass(v){ var s = String(v||'').toLowerCase(); if(/^(approved|validated|implemented|resolved|closed|done|pass|ok)/.test(s)) return 'st-ok'; if(/^(pending|open|in[_ -]?progress|partial|concerns|drift|planned)/.test(s)) return 'st-warn'; if(/^(n\/?a|no aplica|skipped|deferred)/.test(s)) return 'st-muted'; if(/^(blocked|failed|fail|error|rejected)/.test(s)) return 'st-err'; return 'st-info'; }
  function badgeifyStatusCol(tableId, colIndex){ var t = el(tableId); if(!t) return; var rows = t.querySelectorAll('tbody tr'); for(var i=0;i<rows.length;i++){ var c = rows[i].cells[colIndex]; if(!c) continue; var v = c.textContent.trim(); if(!v || v==='-') continue; c.innerHTML = '<span class="st-badge '+statusBadgeClass(v)+'">'+esc(v)+'</span>'; } }
  function matchesAll(haystack, terms){ var l=String(haystack||'').toLowerCase(); for(var i=0;i<terms.length;i++){ if(l.indexOf(terms[i])<0) return false; } return true; }
  function staticSearch(q){
    q = q.toLowerCase().trim(); if(!q) return [];
    var terms = q.split(/\s+/);
    var out = [];
    (MEM.documents||[]).forEach(function(x){ if(matchesAll(x.path+' '+(x.title||''), terms)) out.push({t:'doc', ref:x.path, path:x.path, excerpt:x.title||''}); });
    (MEM.traceLinks||[]).forEach(function(x){ var hay=x.source_ref+' '+x.relation+' '+x.target_ref+' '+(x.evidence_ref||''); if(matchesAll(hay, terms)) out.push({t:'trace', ref:x.source_ref+' -['+x.relation+']-> '+x.target_ref, path:x.evidence_ref||'', excerpt:(x.source_type||'')+' -> '+(x.target_type||'')}); });
    (MEM.decisions||[]).forEach(function(x){ if(matchesAll((x.decision_ref||'')+' '+(x.title||'')+' '+(x.status||''), terms)) out.push({t:'decision', ref:x.decision_ref||x.title, path:x.adr_path||'', excerpt:(x.title||'')+' ('+x.status+')'}); });
    (MEM.gateRuns||[]).forEach(function(x){ if(matchesAll(x.gate+' '+x.phase_scope+' '+x.status, terms)) out.push({t:'gate', ref:x.gate+' ('+x.phase_scope+')', path:x.summary||'', excerpt:x.status}); });
    (MEM.openQuestions||[]).forEach(function(x){ if(matchesAll(x.question, terms)) out.push({t:'pregunta', ref:x.source_ref||'', path:x.source_ref||'', excerpt:x.question}); });
    return out.slice(0,60);
  }
  function renderSearch(rows, label){
    var modeNote = MODE==='live' ? 'live (metadata + chunks)' : 'estatico (solo metadata; sin chunks)';
    var hdr = '<div class="count"><strong>'+(rows.length)+'</strong> resultado'+(rows.length===1?'':'s')+(label?' · '+esc(label):'')+' <span class="mode-note">[modo: '+esc(modeNote)+']</span></div>';
    if(!rows.length){ el('search-out').innerHTML = hdr + '<p class="empty">Sin resultados.</p>'; return; }
    var byType = {}; for(var k=0;k<rows.length;k++){ var tt=rows[k].t||rows[k].kind||'-'; byType[tt]=(byType[tt]||0)+1; }
    var typeOrder = ['chunk','doc','trace','decision','gate','pregunta','api','rf','prototipo'];
    var chips=''; for(var i0=0;i0<typeOrder.length;i0++){ var tt0=typeOrder[i0]; if(byType[tt0]) chips += '<span class="badge">'+esc(tt0)+': '+byType[tt0]+'</span> '; }
    for(var t in byType){ if(typeOrder.indexOf(t)<0) chips += '<span class="badge">'+esc(t)+': '+byType[t]+'</span> '; }
    var h = hdr + '<div class="chips">'+chips+'</div>' + '<table><thead><tr><th>Tipo</th><th>Resultado</th></tr></thead><tbody>';
    for(var i=0;i<rows.length;i++){ var r=rows[i]; h += '<tr><td><span class="badge">'+esc(r.t||r.kind||'')+'</span></td><td>'+esc(r.ref || (r.path+' :: '+(r.heading||'')))+(r.excerpt?'<div class="excerpt">'+esc(r.excerpt)+'</div>':'')+'</td></tr>'; }
    el('search-out').innerHTML = h + '</tbody></table>';
  }
  function doSearch(){
    var q = el('search-q').value;
    if(!q || !q.trim()){ el('search-out').innerHTML = '<p class="empty">Escribe una consulta y pulsa Buscar.</p>'; return; }
    if(MODE === 'live'){
      fetch('/api/search?q=' + encodeURIComponent(q)).then(function(r){return r.json();}).then(function(rows){renderSearch(rows, 'busqueda: '+q);}).catch(function(){ el('search-out').innerHTML='<p class="empty">Error de busqueda.</p>'; });
    } else {
      renderSearch(staticSearch(q), 'busqueda: '+q);
    }
  }
  // ---- Preset queries (Consultas rapidas) ------------------------------
  function runQueryClient(key, arg){
    arg = (arg||'').trim();
    var out=[]; var like = arg.toLowerCase();
    var T = MEM.traceLinks||[], D = MEM.decisions||[], G = MEM.gateRuns||[], C = MEM.documents||[], Q = MEM.openQuestions||[];
    function dec(s){ return String(s||'').toLowerCase(); }
    switch(key){
      case 'docs-for':
        if(!arg) return [];
        T.forEach(function(x){ if(x.source_ref===arg || (x.target_ref||'').indexOf(arg)>=0) out.push({t:'trace', ref:x.source_ref+' -['+x.relation+']-> '+x.target_ref, path:x.evidence_ref||'', excerpt:'tipo destino: '+x.target_type}); });
        C.forEach(function(x){ if((x.path||'').toLowerCase().indexOf(like)>=0 || (x.title||'').toLowerCase().indexOf(like)>=0) out.push({t:'doc', ref:x.path, path:x.path, excerpt:x.title||''}); });
        return out;
      case 'apis-for':
        if(!arg) return [];
        T.forEach(function(x){ if(x.source_ref===arg && x.target_type==='api') out.push({t:'api', ref:x.source_ref+' → '+x.target_ref, path:x.evidence_ref||'', excerpt:x.target_ref}); });
        return out;
      case 'features-pending-qa':
        G.forEach(function(x){ var s=dec(x.status); if((x.phase_scope||'').indexOf('specs/')===0 && s.indexOf('aprob')<0 && s.indexOf('cerrad')<0) out.push({t:'gate', ref:x.gate+' · '+x.phase_scope.replace(/^specs\//,''), path:x.phase_scope, excerpt:x.status}); });
        return out;
      case 'validated-prototypes':
        G.forEach(function(x){ var s=dec(x.status); if(x.gate==='gate-prototype-ready' && (s.indexOf('valid')>=0 || s.indexOf('listo')>=0 || s.indexOf('aprob')>=0)) out.push({t:'prototipo', ref:x.phase_scope.replace(/^specs\//,''), path:x.phase_scope, excerpt:x.status}); });
        return out;
      case 'decisions-pending':
        D.forEach(function(x){ var s=dec(x.status); if(s.indexOf('aprob')<0 && s.indexOf('aceptad')<0 && s.indexOf('cerrad')<0) out.push({t:'decision', ref:x.decision_ref||x.title, path:x.adr_path||'', excerpt:(x.title||'')+' · estado: '+x.status}); });
        return out;
      case 'failed-gates':
        G.forEach(function(x){ var s=dec(x.status); if(s.indexOf('bloque')>=0||s.indexOf('falla')>=0||s.indexOf('recha')>=0||s.indexOf('error')>=0) out.push({t:'gate', ref:x.gate+' · '+x.phase_scope, path:x.phase_scope, excerpt:x.status}); });
        return out;
      case 'rf-without-code': {
        var withCode = {}; T.forEach(function(x){ if(x.target_type==='codigo') withCode[x.source_ref]=true; });
        var rfs = {}; T.forEach(function(x){ if((x.source_type==='RF'||x.source_type==='requerimiento')) rfs[x.source_ref]=true; });
        for(var rf in rfs){ if(!withCode[rf]) out.push({t:'rf', ref:rf, path:'', excerpt:'sin trace_link de target_type=codigo'}); }
        out.sort(function(a,b){return a.ref<b.ref?-1:1;}); return out;
      }
      case 'rf-without-test': {
        var withTest = {}; T.forEach(function(x){ if(x.target_type==='test') withTest[x.source_ref]=true; });
        var rfs2 = {}; T.forEach(function(x){ if((x.source_type==='RF'||x.source_type==='requerimiento')) rfs2[x.source_ref]=true; });
        for(var rf2 in rfs2){ if(!withTest[rf2]) out.push({t:'rf', ref:rf2, path:'', excerpt:'sin trace_link de target_type=test'}); }
        out.sort(function(a,b){return a.ref<b.ref?-1:1;}); return out;
      }
      case 'rf-implemented': {
        var c={}, t2={}; T.forEach(function(x){ if(x.source_type==='RF'||x.source_type==='requerimiento'){ if(x.target_type==='codigo') c[x.source_ref]=true; if(x.target_type==='test') t2[x.source_ref]=true; }});
        for(var rf3 in c){ if(t2[rf3]) out.push({t:'rf', ref:rf3, path:'', excerpt:'tiene codigo y test'}); }
        out.sort(function(a,b){return a.ref<b.ref?-1:1;}); return out;
      }
      case 'decisions-about':
        if(!arg) return [];
        D.forEach(function(x){ var blob=(dec(x.title)+' '+dec(x.status)+' '+dec(x.tags||'')); if(blob.indexOf(like)>=0) out.push({t:'decision', ref:x.decision_ref||x.title, path:x.adr_path||'', excerpt:(x.title||'')+' · '+x.status+(x.tags?' · tags: '+x.tags:'')}); });
        return out;
      default: return [];
    }
  }
  function runPreset(key, label){
    var preset = (MEM.presets||[]).find(function(p){return p.key===key;}) || {key:key, requiresArg:false};
    var arg = '';
    if(preset.requiresArg){ arg = (el('preset-arg')||{}).value || ''; if(!arg.trim()){ el('search-out').innerHTML = '<p class="empty">Esta consulta requiere un argumento. Escribelo arriba y vuelve a pulsar.</p>'; return; } }
    var labelText = (label||preset.label||key) + (arg ? ' · arg: '+arg : '');
    if(MODE === 'live'){
      fetch('/api/query?preset='+encodeURIComponent(key)+(arg?'&arg='+encodeURIComponent(arg):'')).then(function(r){return r.json();}).then(function(rows){ if(rows && rows.error){ el('search-out').innerHTML='<p class="empty">'+esc(rows.error)+'</p>'; return; } renderSearch(rows||[], labelText); }).catch(function(){ el('search-out').innerHTML='<p class="empty">Error consultando preset.</p>'; });
    } else {
      renderSearch(runQueryClient(key, arg), labelText);
    }
  }
  function renderPresetButtons(){
    var presets = MEM.presets || [];
    if(!presets.length){ return; }
    var html = '<div class="presets"><div class="presets-title">Consultas rapidas</div>';
    html += '<input id="preset-arg" type="text" placeholder="Argumento (RF-02, Keycloak, reportes…) cuando aplique" />';
    html += '<div class="preset-grid">';
    for(var i=0;i<presets.length;i++){ var p=presets[i]; html += '<button class="preset-btn" data-key="'+esc(p.key)+'" title="'+esc(p.hint||'')+'">'+esc(p.label)+(p.requiresArg?' <span class="req">*</span>':'')+'</button>'; }
    html += '</div></div>';
    var host = el('presets-host'); if(host) host.innerHTML = html;
    var btns = document.querySelectorAll('.preset-btn'); for(var j=0;j<btns.length;j++){ btns[j].addEventListener('click', function(ev){ runPreset(ev.currentTarget.getAttribute('data-key')); }); }
  }
  // ---- Acciones (Validador / Sync / Reporte / Generador) --------------
  var ACTIONS_CACHE = null;
  // v12.27: si la linea matchea `[progress] X/Y label`, actualizamos una barra
  // de progreso en lugar de imprimir una linea nueva por tick.
  var __progressBar = null;
  function renderProgress(done, total, label){
    var c = el('console');
    if(!__progressBar){
      var wrap = document.createElement('div'); wrap.className = 'progress-line';
      wrap.innerHTML = '<div class="progress-text"></div><div class="progress-bar"><div class="progress-fill"></div></div>';
      c.appendChild(wrap);
      __progressBar = { wrap:wrap, text:wrap.querySelector('.progress-text'), fill:wrap.querySelector('.progress-fill') };
    }
    var pct = total > 0 ? Math.min(100, (done*100/total)) : 0;
    __progressBar.text.textContent = label+': '+done+'/'+total+' ('+pct.toFixed(0)+'%)';
    __progressBar.fill.style.width = pct.toFixed(1)+'%';
    if(done >= total) __progressBar = null; // proxima linea de progreso crea barra nueva
    c.scrollTop = c.scrollHeight;
  }
  var PROGRESS_RE = /^\[progress\]\s+(\d+)\/(\d+)\s+(.+)$/;
  function consoleLine(cls, text){
    var m = (cls === 'err') ? null : PROGRESS_RE.exec(text||'');
    if(m){ renderProgress(Number(m[1]), Number(m[2]), m[3]); return; }
    __progressBar = null; // cualquier otra linea cierra la barra activa
    var c=el('console'); var span=document.createElement('span'); if(cls) span.className=cls; span.textContent=text+'\n'; c.appendChild(span); c.scrollTop=c.scrollHeight;
  }
  function consoleClear(){ el('console').innerHTML = '<span class="muted">Consola limpia.</span>\n'; }
  function consoleCopy(){ var t=el('console').innerText||''; if(navigator.clipboard) navigator.clipboard.writeText(t); }
  var CATEGORY_LABEL = { universal:'Comandos universales · siempre disponibles', memoria:'Memoria · rebuild / update DB', validador:'Validadores · read-only, exit code', reporte:'Reportes · snapshots y packs', generador:'Generadores · ESCRIBEN archivos del repo' };
  function renderActions(actions){
    var byCat = { universal:[], memoria:[], validador:[], reporte:[], generador:[] };
    actions.forEach(function(a){ (byCat[a.category]=byCat[a.category]||[]).push(a); });
    var html='';
    ['universal','memoria','validador','reporte','generador'].forEach(function(cat){
      if(!byCat[cat] || !byCat[cat].length) return;
      html += '<details class="action-cat" open><summary>'+esc(CATEGORY_LABEL[cat]||cat)+' <span class="muted" style="font-weight:400;font-size:11px">('+byCat[cat].length+')</span></summary><div class="action-grid">';
      byCat[cat].forEach(function(a){
        var classes = 'action-btn' + (a.danger?' danger':'');
        var argBlock = '';
        if(a.arg){ argBlock = '<div class="action-arg">'+esc(a.arg.name)+(a.arg.required?' <span style="color:#B45309">*</span>':'')+': <input id="arg-'+esc(a.id)+'" placeholder="'+esc(a.arg.hint||'')+'" /></div>'; }
        html += '<button class="'+classes+'" data-action="'+esc(a.id)+'">'+esc(a.label)+'<span class="ah">'+esc(a.hint||'')+'</span></button>'+argBlock;
      });
      html += '</div></details>';
    });
    el('actions-host').innerHTML = html;
    var btns = el('actions-host').querySelectorAll('.action-btn');
    for(var i=0;i<btns.length;i++){ btns[i].addEventListener('click', function(ev){ onActionClick(ev.currentTarget.getAttribute('data-action')); }); }
  }
  function findAction(id){ if(!ACTIONS_CACHE) return null; for(var i=0;i<ACTIONS_CACHE.length;i++) if(ACTIONS_CACHE[i].id===id) return ACTIONS_CACHE[i]; return null; }
  function onActionClick(id){
    var a = findAction(id); if(!a) return;
    var arg = '';
    if(a.arg){ var input = el('arg-'+id); arg = input ? (input.value||'').trim() : ''; if(a.arg.required && !arg){ alert('Esta accion requiere '+a.arg.name); return; } }
    if(a.danger){
      el('modal-title').textContent = 'Confirmar: '+a.label;
      el('modal-msg').textContent = (a.hint||'')+'\n\nEsta accion modifica archivos del repo. ¿Continuar?';
      el('modal-bg').classList.add('show');
      el('modal-confirm').onclick = function(){ el('modal-bg').classList.remove('show'); execAction(id, arg); };
      el('modal-cancel').onclick = function(){ el('modal-bg').classList.remove('show'); };
    } else { execAction(id, arg); }
  }
  // v12.24: ejecucion via SSE — stdout/stderr aparecen linea por linea.
  // Soporta cancelacion: el cliente aborta la conexion fetch, el server
  // detecta req.close y envia SIGTERM al child.
  var __execController = null;
  function setRunning(running){
    var btns = el('actions-host').querySelectorAll('.action-btn');
    for(var i=0;i<btns.length;i++) btns[i].disabled = !!running;
    var stop = el('console-stop'); if(stop) stop.style.display = running ? 'inline-block' : 'none';
  }
  function execAction(id, arg){
    var a = findAction(id); if(!a) return;
    setRunning(true);
    // v12.139: trae la consola a la vista al elegir una accion (no obligar a hacer scroll).
    var __con = el('console'); if(__con && __con.scrollIntoView) __con.scrollIntoView({behavior:'smooth', block:'center'});
    consoleLine('cmd', '$ '+a.label+(arg?' --'+a.arg.name.replace(/^--/,'')+' '+arg:''));
    var t0 = Date.now();
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    __execController = ctrl;
    var buf = '';
    var pending = { stdout: '', stderr: '' };
    function flushPending(kind){ var s=pending[kind]; if(s){ consoleLine(kind==='stderr'?'err':'', s.replace(/\n$/,'')); pending[kind]=''; } }
    function handleEvent(type, dataStr){
      var data; try { data = JSON.parse(dataStr); } catch { return; }
      if(type==='meta'){ consoleLine('muted', 'pid '+data.pid+' · '+(data.argv||[]).join(' ')); return; }
      if(type==='stdout' || type==='stderr'){
        // Buffer por linea: emite cada vez que llega un \n para no romper el flow.
        pending[type] += data.chunk||'';
        var idx;
        while((idx = pending[type].indexOf('\n')) >= 0){
          var line = pending[type].slice(0, idx);
          pending[type] = pending[type].slice(idx+1);
          consoleLine(type==='stderr'?'err':'', line);
        }
        return;
      }
      if(type==='exit'){
        flushPending('stdout'); flushPending('stderr');
        var ms = data.durationMs || (Date.now()-t0);
        var s = (ms/1000).toFixed(1);
        if(data.exitCode === 0) consoleLine('ok', '─ exit 0 · '+s+'s ─');
        else consoleLine('err', '─ exit '+data.exitCode+(data.signal?' ('+data.signal+')':'')+(data.timedOut?' · TIMEOUT':'')+' · '+s+'s ─');
        return;
      }
      if(type==='error'){ flushPending('stdout'); flushPending('stderr'); consoleLine('err', '✗ '+(data.message||'error')); return; }
    }
    function parseSseBuffer(){
      // Eventos SSE separados por blank line; cada evento puede traer event:/data:.
      var idx;
      while((idx = buf.indexOf('\n\n')) >= 0){
        var raw = buf.slice(0, idx); buf = buf.slice(idx+2);
        var lines = raw.split('\n'); var ev='message', dat='';
        for(var li=0; li<lines.length; li++){
          var ln = lines[li]; if(!ln || ln.charAt(0)===':') continue;
          if(ln.indexOf('event:')===0) ev = ln.slice(6).trim();
          else if(ln.indexOf('data:')===0) dat += (dat?'\n':'') + ln.slice(5).trimStart();
        }
        if(dat) handleEvent(ev, dat);
      }
    }
    fetch('/api/exec', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Accept':'text/event-stream' },
      body: JSON.stringify({ id:id, arg:arg||undefined }),
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function(r){
      if(!r.ok || !r.body || (r.headers.get('content-type')||'').indexOf('text/event-stream')<0){
        return r.json().then(function(j){ consoleLine('err', '✗ '+(j && j.error ? j.error : ('HTTP '+r.status))); });
      }
      var reader = r.body.getReader(); var dec = new TextDecoder('utf-8');
      function pump(){
        return reader.read().then(function(step){
          if(step.done){ flushPending('stdout'); flushPending('stderr'); return; }
          buf += dec.decode(step.value, { stream:true });
          parseSseBuffer();
          return pump();
        });
      }
      return pump();
    }).catch(function(err){
      if(err && err.name==='AbortError'){ consoleLine('info', '… cancelado por el usuario'); }
      else consoleLine('err', '✗ Error de red: '+(err && err.message ? err.message : err));
    }).then(function(){
      __execController = null;
      setRunning(false);
      if(['sync-memory','index-docs','embed-docs','regenerate-context','harvest-trace'].indexOf(id)>=0){
        fetch('/api/snapshot').then(function(r){return r.json();}).then(function(d){ MEM=d; renderAll(d); consoleLine('info', '… snapshot recargado'); }).catch(function(){});
      }
      // Si el subpane Historial o Stats esta visible, refrescarlo silenciosamente.
      var hp = el('subpane-history'); if(hp && hp.classList.contains('active')) loadHistory();
      var sp = el('subpane-stats'); if(sp && sp.classList.contains('active')) loadStats();
    });
  }
  function stopAction(){
    if(!__execController){ return; }
    consoleLine('info', '… enviando cancelacion (SIGTERM)…');
    fetch('/api/exec', { method:'DELETE' }).catch(function(){});
    try { __execController.abort(); } catch {}
  }
  function loadActions(){
    if(MODE !== 'live'){ el('actions-host').innerHTML = '<p class="empty">Las acciones solo estan disponibles en modo live (memory-serve). Arranca el server con: <code>node scripts/ai-framework-agent.mjs memory-serve</code> o <code>npm run memory:serve</code>.</p>'; return; }
    fetch('/api/actions').then(function(r){return r.json();}).then(function(actions){ ACTIONS_CACHE = actions; renderActions(actions); loadAlerts(); }).catch(function(){ el('actions-host').innerHTML='<p class="empty">No se pudo cargar /api/actions.</p>'; });
  }
  // v12.28: alertas activas (acciones con >=3 fallos consecutivos al final).
  function loadAlerts(){
    if(MODE !== 'live') return;
    fetch('/api/action-runs/alerts').then(function(r){return r.json();}).then(renderAlerts).catch(function(){});
  }
  function renderAlerts(alerts){
    var bar = el('alerts-banner'); if(!bar) return;
    if(!alerts || !alerts.length){ bar.className = 'alerts-banner'; bar.innerHTML = ''; return; }
    // v12.32: dos tipos de alerta (failure-streak + duration-threshold).
    // v12.45: kind='combined' agrupa ambos del mismo action_id en una sola card.
    var nStreak = 0, nSlow = 0, nCombined = 0;
    alerts.forEach(function(a){
      var k = a.kind || 'failure-streak';
      if(k === 'combined'){ nCombined++; (a.kinds||[]).forEach(function(kk){ if(kk==='failure-streak') nStreak++; else if(kk==='duration-threshold') nSlow++; }); }
      else if(k === 'duration-threshold') nSlow++;
      else nStreak++;
    });
    var headBits = [];
    if(nStreak) headBits.push(nStreak+' con fallos consecutivos');
    if(nSlow) headBits.push(nSlow+' lentas (p95+%)');
    if(nCombined) headBits.push(nCombined+' combinadas');
    var html = '<h4>⚠ '+headBits.join(' · ')+'</h4>';
    for(var i=0;i<alerts.length;i++){
      var a = alerts[i];
      var kind = a.kind || 'failure-streak';
      var detail;
      if(kind === 'combined'){
        var bits = (a.parts||[]).map(function(p){
          if(p.kind==='duration-threshold') return '🐢 '+esc(p.detail||'');
          return p.consecutive_failures+' fallos · ultimo OK: '+esc(p.last_success?fmtAgo(p.last_success):'nunca');
        });
        detail = '<span title="agrupada">⚠+🐢</span> '+bits.join(' &nbsp; · &nbsp; ');
      } else if(kind === 'duration-threshold'){
        detail = '🐢 '+esc(a.detail||'');
      } else {
        detail = a.consecutive_failures+' fallos consecutivos · '+esc(a.last_success ? 'ultimo OK: '+fmtAgo(a.last_success) : 'nunca tuvo OK');
      }
      html += '<div class="alert-item"><strong>'+esc(a.action_id)+'</strong>: '+detail;
      html += ' <a data-replay="'+esc(a.action_id)+'">↻ re-ejecutar</a>';
      html += ' <a data-history-filter="'+esc(a.action_id)+'">ver historial</a>';
      // v12.45 (C2): snooze por kind especifico si la alerta no es 'combined'.
      var snoozeKind = (kind === 'combined') ? '' : kind;
      var kindAttr = snoozeKind ? ' data-snooze-kind="'+esc(snoozeKind)+'"' : '';
      var kindLabel = snoozeKind === 'duration-threshold' ? ' (solo slow)' : (snoozeKind === 'failure-streak' ? ' (solo fail)' : '');
      html += ' <a data-snooze="'+esc(a.action_id)+'" data-duration="24h"'+kindAttr+'>🔕 silenciar 24h'+kindLabel+'</a>';
      html += ' <a data-snooze="'+esc(a.action_id)+'" data-duration="7d"'+kindAttr+'>7d</a>';
      html += ' <a data-snooze="'+esc(a.action_id)+'" data-duration="forever"'+kindAttr+'>forever</a>';
      html += '</div>';
    }
    bar.innerHTML = html; bar.className = 'alerts-banner show';
    var rep = bar.querySelectorAll('[data-replay]');
    for(var j=0;j<rep.length;j++){ rep[j].addEventListener('click', function(ev){ var aid = ev.currentTarget.getAttribute('data-replay'); showSubtab('run'); execAction(aid, ''); }); }
    var hl = bar.querySelectorAll('[data-history-filter]');
    for(var m=0;m<hl.length;m++){ hl[m].addEventListener('click', function(ev){ var aid = ev.currentTarget.getAttribute('data-history-filter'); showSubtab('history'); var sel = el('filter-action'); if(sel){ sel.value = aid; sel.dispatchEvent(new Event('change')); } }); }
    var sn = bar.querySelectorAll('[data-snooze]');
    for(var k=0;k<sn.length;k++){ sn[k].addEventListener('click', function(ev){
      var aid = ev.currentTarget.getAttribute('data-snooze');
      var dur = ev.currentTarget.getAttribute('data-duration');
      var snKind = ev.currentTarget.getAttribute('data-snooze-kind') || null;
      var kindLabel = snKind ? ' (kind='+snKind+')' : '';
      var reason = (dur === 'forever') ? (prompt('Razon del snooze permanente para '+aid+kindLabel+' (ej. "es by-design"):', '') || 'sin razon') : '';
      var payload = { action_id: aid, duration: dur, reason: reason };
      if(snKind) payload.kind = snKind;
      fetch('/api/action-runs/snoozes', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
        .then(function(r){ return r.json(); })
        .then(function(j){ if(j.ok){ loadAlerts(); } else { alert('No se pudo silenciar: '+(j.error||'')); } });
    }); }
  }
  // v12.28: persistir filtros del Historial en URL para compartir / volver.
  function setMulti(id, csv){ var n=el(id); if(!n||!csv) return; var vals = csv.split(',').map(function(x){return x.trim();}); if(n.multiple){ for(var i=0;i<n.options.length;i++) n.options[i].selected = vals.indexOf(n.options[i].value)>=0; } else { n.value = csv; } }
  function readFiltersFromUrl(){
    var params = new URLSearchParams(window.location.search);
    if(params.get('act_action')) setMulti('filter-action', params.get('act_action'));
    if(params.get('act_status')) setMulti('filter-status', params.get('act_status'));
    if(el('filter-since') && params.get('act_since')) el('filter-since').value = params.get('act_since');
    if(params.get('act_mode')) setMulti('filter-mode', params.get('act_mode'));
    if(el('filter-slow') && params.get('act_slow')) el('filter-slow').value = params.get('act_slow');
    if(el('trend-action') && params.get('trend_action')) el('trend-action').value = params.get('trend_action');
    if(el('trend-days') && params.get('trend_days')) el('trend-days').value = params.get('trend_days');
  }
  function writeFiltersToUrl(){
    var params = new URLSearchParams(window.location.search);
    ['act_action','act_status','act_since','act_mode','act_slow'].forEach(function(p){ params.delete(p); });
    var fa = multiCsv('filter-action'); if(fa) params.set('act_action', fa);
    var fs = multiCsv('filter-status'); if(fs) params.set('act_status', fs);
    var fsi = (el('filter-since')||{}).value; if(fsi) params.set('act_since', fsi);
    var fm = multiCsv('filter-mode'); if(fm) params.set('act_mode', fm);
    var fsl = (el('filter-slow')||{}).value; if(fsl) params.set('act_slow', fsl);
    var qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?'+qs : '') + window.location.hash);
  }
  function writeTrendFiltersToUrl(){
    var params = new URLSearchParams(window.location.search);
    ['trend_action','trend_days'].forEach(function(p){ params.delete(p); });
    var ta = (el('trend-action')||{}).value; if(ta) params.set('trend_action', ta);
    var td = (el('trend-days')||{}).value; if(td && td !== '30') params.set('trend_days', td);
    var qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?'+qs : '') + window.location.hash);
  }
  // v12.25: Historial de acciones + re-ejecucion ----------------------
  function fmtAgo(iso){
    if(!iso) return '-';
    var t = Date.parse(iso); if(isNaN(t)) return iso;
    var s = Math.floor((Date.now()-t)/1000);
    if(s<60) return s+'s';
    if(s<3600) return Math.floor(s/60)+'min';
    if(s<86400) return Math.floor(s/3600)+'h';
    return Math.floor(s/86400)+'d';
  }
  function fmtDuration(ms){ if(ms==null) return '-'; if(ms<1000) return ms+'ms'; return (ms/1000).toFixed(1)+'s'; }
  function badgeForRun(r){
    if(r.cancelled) return '<span class="badge cancelled">cancelled</span>';
    if(r.exit_code === 0) return '<span class="badge ok">exit 0</span>';
    if(r.exit_code != null) return '<span class="badge fail">exit '+esc(r.exit_code)+'</span>';
    if(r.signal) return '<span class="badge fail">'+esc(r.signal)+'</span>';
    if(r.finished_at) return '<span class="badge fail">?</span>';
    return '<span class="badge">corriendo…</span>';
  }
  function renderHistory(rows){
    if(!rows.length){ el('history-host').innerHTML = '<p class="empty">Sin runs registrados todavia. Ejecuta una accion y vuelve.</p>'; return; }
    var html = '<div class="history-row" style="font-weight:700;color:var(--muted);font-size:11px;text-transform:uppercase;"><div>Cuando</div><div>Accion</div><div>Duracion</div><div>Modo</div><div>Estado</div><div></div></div>';
    for(var i=0;i<rows.length;i++){
      var r = rows[i];
      var argStr = r.arg ? ' <span class="arg">'+esc(r.arg)+'</span>' : '';
      html += '<div class="history-row" data-runid="'+esc(r.id)+'">';
      html += '<div class="when" title="'+esc(r.started_at)+'">'+esc(fmtAgo(r.started_at))+'</div>';
      html += '<div class="action">'+esc(r.action_id)+argStr+'</div>';
      html += '<div>'+esc(fmtDuration(r.duration_ms))+'</div>';
      html += '<div><span class="badge">'+esc(r.mode||'-')+'</span></div>';
      html += '<div>'+badgeForRun(r)+'</div>';
      html += '<div><button class="replay" data-action="'+esc(r.action_id)+'" data-arg="'+esc(r.arg||'')+'">↻ Re-ejecutar</button></div>';
      html += '</div>';
      var detail = '';
      if(r.stdout_tail) detail += r.stdout_tail;
      if(r.stderr_tail) detail += (detail?'\n':'') + '[stderr]\n' + r.stderr_tail;
      if(detail) html += '<details class="history-detail-wrap" style="margin-bottom:6px;"><summary style="cursor:pointer;font-size:11px;color:var(--muted);margin-left:80px;">ver tail de salida</summary><div class="history-detail">'+esc(detail)+'</div></details>';
    }
    el('history-host').innerHTML = html;
    var btns = el('history-host').querySelectorAll('.replay');
    for(var j=0;j<btns.length;j++){ btns[j].addEventListener('click', function(ev){ var b=ev.currentTarget; var aid=b.getAttribute('data-action'); var arg=b.getAttribute('data-arg'); showSubtab('run'); execAction(aid, arg); }); }
  }
  function loadHistory(){
    if(MODE !== 'live'){ el('history-host').innerHTML = '<p class="empty">El historial solo esta disponible en modo live.</p>'; return; }
    var fa = multiCsv('filter-action');
    var fs = multiCsv('filter-status');
    var fsi = (el('filter-since')||{}).value || '';
    var fm = multiCsv('filter-mode');
    var fsl = (el('filter-slow')||{}).value || '';
    var qs = [];
    if(fa) qs.push('action_id='+encodeURIComponent(fa));
    if(fs) qs.push('status='+encodeURIComponent(fs));
    if(fsi) qs.push('since='+encodeURIComponent(fsi));
    if(fm) qs.push('mode='+encodeURIComponent(fm));
    if(fsl) qs.push('slow='+encodeURIComponent(fsl));
    qs.push('limit=100');
    writeFiltersToUrl();
    fetch('/api/action-runs?'+qs.join('&')).then(function(r){return r.json();}).then(function(rows){ renderHistory(rows); populateActionFilter(rows); var fc=el('filter-count'); if(fc) fc.textContent = rows.length + (rows.length===100 ? '+ ' : ' ') + 'runs'; }).catch(function(){ el('history-host').innerHTML = '<p class="empty">No se pudo cargar /api/action-runs.</p>'; });
  }
  function populateActionFilter(rows){
    var sel = el('filter-action'); if(!sel) return;
    // v12.32: preservar valores seleccionados (multi-select) entre repobladas.
    var cur = [];
    if(sel.multiple){ for(var s=0;s<sel.selectedOptions.length;s++) cur.push(sel.selectedOptions[s].value); }
    else if(sel.value) cur.push(sel.value);
    var ids = {};
    (rows||[]).forEach(function(r){ ids[r.action_id] = true; });
    (ACTIONS_CACHE||[]).forEach(function(a){ ids[a.id] = true; });
    var keys = Object.keys(ids).sort();
    if(sel.options.length === keys.length) { /* re-marcar por si CSS o repintar */ }
    var html = '';
    if(!sel.multiple) html += '<option value="">— todas —</option>';
    for(var i=0;i<keys.length;i++){ var k=keys[i]; var sl = cur.indexOf(k)>=0 ? ' selected' : ''; html += '<option value="'+esc(k)+'"'+sl+'>'+esc(k)+'</option>'; }
    sel.innerHTML = html;
  }
  // v12.26: stats agregados por accion ----------------------------------
  function renderStatsAgg(rows, trendRows){
    if(!rows.length){ el('stats-host').innerHTML = '<p class="empty">Sin datos todavia. Ejecuta acciones y vuelve.</p>'; return; }
    var trendByAction = {};
    (trendRows||[]).forEach(function(t){ trendByAction[t.action_id] = t.series; });
    var totals = { runs:0, ok:0, fail:0, can:0 };
    for(var i=0;i<rows.length;i++){ totals.runs+=rows[i].total||0; totals.ok+=rows[i].ok||0; totals.fail+=rows[i].fail||0; totals.can+=rows[i].cancelled||0; }
    var overall = totals.runs > 0 ? (100 * totals.ok / totals.runs).toFixed(1)+'%' : '-';
    var html = '<div class="stats-summary">';
    html += '<div class="stat"><div class="stat-v">'+totals.runs+'</div><div class="stat-l">Total runs</div></div>';
    html += '<div class="stat"><div class="stat-v" style="color:var(--ok)">'+totals.ok+'</div><div class="stat-l">Exitos</div></div>';
    html += '<div class="stat"><div class="stat-v" style="color:#B91C1C">'+totals.fail+'</div><div class="stat-l">Fallos</div></div>';
    html += '<div class="stat"><div class="stat-v">'+overall+'</div><div class="stat-l">Success rate</div></div>';
    html += '</div>';
    html += '<table class="stats-table"><thead><tr>';
    html += '<th>Accion</th><th class="num">Total</th><th class="num">OK</th><th class="num">Fail</th><th class="num">Cancel</th><th class="num">Avg</th><th class="num">p50</th><th class="num">p95</th><th class="num">Min</th><th class="num">Max</th><th class="num">Success</th><th>Ultima</th><th class="sparkline-cell">14d</th>';
    html += '</tr></thead><tbody>';
    for(var k=0;k<rows.length;k++){
      var r = rows[k];
      var rateClass = (r.success_rate>=95)?'ok':((r.success_rate>=70)?'':'fail');
      var spark = sparklineSvg(trendByAction[r.action_id]);
      html += '<tr>';
      html += '<td class="action">'+esc(r.action_id)+'</td>';
      html += '<td class="num">'+esc(r.total)+'</td>';
      html += '<td class="num ok">'+esc(r.ok)+'</td>';
      html += '<td class="num fail">'+esc(r.fail)+'</td>';
      html += '<td class="num can">'+esc(r.cancelled)+'</td>';
      html += '<td class="num">'+esc(fmtDuration(r.avg_ms))+'</td>';
      html += '<td class="num">'+esc(fmtDuration(r.p50_ms))+'</td>';
      html += '<td class="num">'+esc(fmtDuration(r.p95_ms))+'</td>';
      html += '<td class="num">'+esc(fmtDuration(r.min_ms))+'</td>';
      html += '<td class="num">'+esc(fmtDuration(r.max_ms))+'</td>';
      html += '<td class="num '+rateClass+'">'+(r.success_rate==null?'-':esc(r.success_rate)+'%')+'</td>';
      html += '<td class="when" title="'+esc(r.last_run||'')+'">'+esc(fmtAgo(r.last_run))+'</td>';
      html += '<td class="sparkline-cell">'+spark+'</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    el('stats-host').innerHTML = html;
  }
  // v12.29: Dashboard de tendencias ---------------------------------
  function buildLineChart(series, opts){
    var W = opts.width || 720, H = opts.height || 200;
    var padL = 40, padR = 12, padT = 14, padB = 28;
    var iw = W - padL - padR, ih = H - padT - padB;
    var n = series.length;
    if(!n) return '<p class="empty">Sin datos en el periodo.</p>';
    var xs = function(i){ return padL + (n === 1 ? iw/2 : (i * iw / (n - 1))); };
    var ys = function(v){ return padT + ih - (v / 100) * ih; };
    // Eje Y: lineas en 0/25/50/75/100
    var grid = '';
    [0, 25, 50, 75, 100].forEach(function(v){
      var y = ys(v);
      grid += '<line class="grid-line" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+y+'" y2="'+y+'"/>';
      grid += '<text class="axis-label" x="'+(padL-6)+'" y="'+(y+3)+'" text-anchor="end">'+v+'%</text>';
    });
    // Path por puntos con success_rate != null. Los nulls rompen el path.
    var path = ''; var pts = '';
    var lastWasValid = false;
    for(var i=0;i<n;i++){
      var s = series[i];
      if(s.success_rate == null){ lastWasValid = false; continue; }
      var x = xs(i), y = ys(s.success_rate);
      path += (lastWasValid ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      pts += '<circle class="data-point" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.5"><title>'+esc(s.day)+': '+s.success_rate+'% ('+s.ok+'/'+s.total+')</title></circle>';
      lastWasValid = true;
    }
    // Eje X: etiquetas en ~6 ticks
    var step = Math.max(1, Math.floor(n / 6));
    var xlab = '';
    for(var k=0;k<n;k+=step){
      var lx = xs(k); var ld = series[k].day.slice(5); // MM-DD
      xlab += '<text class="axis-label" x="'+lx+'" y="'+(H-padB+14)+'" text-anchor="middle">'+esc(ld)+'</text>';
    }
    var axis = '<line class="axis-line" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+(padT+ih)+'" y2="'+(padT+ih)+'"/>';
    axis += '<line class="axis-line" x1="'+padL+'" x2="'+padL+'" y1="'+padT+'" y2="'+(padT+ih)+'"/>';
    var line = path ? '<path class="data-line" d="'+path.trim()+'"/>' : '';
    return '<svg class="chart-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+axis+line+pts+xlab+'</svg>';
  }
  function buildStackedBars(series, opts){
    var W = opts.width || 720, H = opts.height || 180;
    var padL = 40, padR = 12, padT = 14, padB = 28;
    var iw = W - padL - padR, ih = H - padT - padB;
    var n = series.length;
    if(!n) return '<p class="empty">Sin datos en el periodo.</p>';
    var maxTotal = Math.max.apply(null, series.map(function(s){ return s.total||0; })) || 1;
    var bw = Math.max(2, Math.floor(iw / n) - 1);
    var bars = '';
    for(var i=0;i<n;i++){
      var s = series[i];
      if(s.total === 0) continue;
      var x = padL + i * (iw / n);
      var hOk = s.ok > 0 ? (s.ok / maxTotal) * ih : 0;
      var hFail = s.fail > 0 ? (s.fail / maxTotal) * ih : 0;
      var hCancel = s.cancelled > 0 ? (s.cancelled / maxTotal) * ih : 0;
      var yBase = padT + ih;
      var tip = s.day+': '+s.total+' runs ('+s.ok+' ok / '+s.fail+' fail / '+s.cancelled+' cancel) · click para drill-down';
      // v12.30: wrap del grupo de barras en <g> con data-day para drill-down al click.
      bars += '<g class="bar-group" data-day="'+esc(s.day)+'" style="cursor:pointer"><title>'+esc(tip)+'</title>';
      if(hOk > 0){ yBase -= hOk; bars += '<rect class="bar-ok" x="'+x.toFixed(1)+'" y="'+yBase.toFixed(1)+'" width="'+bw+'" height="'+hOk.toFixed(1)+'"/>'; }
      if(hFail > 0){ yBase -= hFail; bars += '<rect class="bar-fail" x="'+x.toFixed(1)+'" y="'+yBase.toFixed(1)+'" width="'+bw+'" height="'+hFail.toFixed(1)+'"/>'; }
      if(hCancel > 0){ yBase -= hCancel; bars += '<rect class="bar-cancel" x="'+x.toFixed(1)+'" y="'+yBase.toFixed(1)+'" width="'+bw+'" height="'+hCancel.toFixed(1)+'"/>'; }
      bars += '</g>';
    }
    // Eje Y: 0 y max
    var ylab = '<text class="axis-label" x="'+(padL-6)+'" y="'+(padT+ih+3)+'" text-anchor="end">0</text>';
    ylab += '<text class="axis-label" x="'+(padL-6)+'" y="'+(padT+3)+'" text-anchor="end">'+maxTotal+'</text>';
    var step = Math.max(1, Math.floor(n / 6));
    var xlab = '';
    for(var k=0;k<n;k+=step){
      var lx = padL + k * (iw / n) + bw/2; var ld = series[k].day.slice(5);
      xlab += '<text class="axis-label" x="'+lx+'" y="'+(H-padB+14)+'" text-anchor="middle">'+esc(ld)+'</text>';
    }
    var axis = '<line class="axis-line" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+(padT+ih)+'" y2="'+(padT+ih)+'"/>';
    axis += '<line class="axis-line" x1="'+padL+'" x2="'+padL+'" y1="'+padT+'" y2="'+(padT+ih)+'"/>';
    return '<svg class="chart-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+axis+ylab+bars+xlab+'</svg>';
  }
  function renderCompareBanner(c){
    function deltaClass(v, inverse){
      if(v == null) return 'flat';
      if(Math.abs(v) < 0.1) return 'flat';
      return (v > 0) === !inverse ? 'up' : 'down';
    }
    function fmtDelta(v, suffix){ if(v == null) return '—'; var sign = v > 0 ? '+' : ''; return sign+v+(suffix||''); }
    var html = '<div class="compare-banner">';
    html += '<div class="compare-card"><h4>Success rate</h4>';
    html += '<div class="v">'+(c.current.success_rate==null?'—':c.current.success_rate+'%')+'</div>';
    html += '<div class="delta '+deltaClass(c.delta_success_pp, false)+'">'+fmtDelta(c.delta_success_pp,' pp')+' vs anterior</div>';
    html += '<div class="sub">prev: '+(c.previous.success_rate==null?'—':c.previous.success_rate+'%')+'</div></div>';
    html += '<div class="compare-card"><h4>Volumen</h4>';
    html += '<div class="v">'+c.current.total+' runs</div>';
    html += '<div class="delta '+deltaClass(c.delta_volume_pct, false)+'">'+fmtDelta(c.delta_volume_pct,'%')+' vs anterior</div>';
    html += '<div class="sub">prev: '+c.previous.total+' runs</div></div>';
    html += '<div class="compare-card"><h4>Fallos</h4>';
    html += '<div class="v" style="color:#B91C1C">'+c.current.fail+'</div>';
    var failDelta = c.previous.fail > 0 ? +(100 * (c.current.fail - c.previous.fail) / c.previous.fail).toFixed(1) : null;
    html += '<div class="delta '+deltaClass(failDelta, true)+'">'+fmtDelta(failDelta,'%')+' vs anterior</div>';
    html += '<div class="sub">prev: '+c.previous.fail+' fallos</div></div>';
    html += '</div>';
    return html;
  }
  function renderTrendsDashboard(d, hostId){
    hostId = hostId || 'trends-host';
    var suffix = (hostId === 'trends-host') ? '' : '-b';
    if(!d || !d.series || !d.series.length){ el(hostId).innerHTML = '<p class="empty">Sin datos en el periodo seleccionado.</p>'; return; }
    var html = '';
    // v12.30: cabecera explicita del scope del banner (todas vs accion individual)
    var scopeLabel = d.action_id ? ('comparando <strong>'+esc(d.action_id)+'</strong>') : '<strong>todas las acciones</strong> (agregado)';
    html += '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">'+scopeLabel+' · ventana actual: '+d.compare.current.window_days+'d · ventana previa: '+d.compare.previous.window_days+'d</div>';
    html += renderCompareBanner(d.compare);
    // v12.30: barra de export PNG (uno por chart).
    html += '<div class="chart-wrap"><div style="display:flex;justify-content:space-between;align-items:center;"><h4>Success rate diario ('+d.days_window+' dias)'+(d.action_id?' · '+esc(d.action_id):'')+'</h4><button class="export-png" data-target="chart-line'+suffix+'" style="padding:4px 10px;font-size:11px;background:var(--brand-light);color:var(--brand-dark);border:1px solid var(--line);border-radius:4px;cursor:pointer;">⬇ PNG</button></div>';
    html += '<div id="chart-line'+suffix+'">'+buildLineChart(d.series, { width: 720, height: 200 })+'</div>';
    html += '<div class="chart-legend"><span><span class="swatch" style="background:#06B6D4"></span>success_rate (%)</span><span class="sub">eje Y: 0-100% · eje X: dia</span></div>';
    html += '</div>';
    html += '<div class="chart-wrap"><div style="display:flex;justify-content:space-between;align-items:center;"><h4>Volumen diario (stacked: ok/fail/cancel) · click en barra = drill-down</h4><button class="export-png" data-target="chart-bars'+suffix+'" style="padding:4px 10px;font-size:11px;background:var(--brand-light);color:var(--brand-dark);border:1px solid var(--line);border-radius:4px;cursor:pointer;">⬇ PNG</button></div>';
    html += '<div id="chart-bars'+suffix+'">'+buildStackedBars(d.series, { width: 720, height: 180 })+'</div>';
    html += '<div class="chart-legend"><span><span class="swatch" style="background:#10B981"></span>ok</span><span><span class="swatch" style="background:#DC2626"></span>fail</span><span><span class="swatch" style="background:#F59E0B"></span>cancelled</span></div>';
    html += '</div>';
    if(d.top_actions && d.top_actions.length){
      html += '<div class="chart-wrap"><h4>Top '+d.top_actions.length+' acciones por volumen</h4>';
      html += '<table class="stats-table"><thead><tr><th>Accion</th><th class="num">Runs</th><th class="num">OK</th><th class="num">Fail</th><th class="num">Cancel</th><th class="num">Success</th></tr></thead><tbody>';
      d.top_actions.forEach(function(t){
        var rc = (t.success_rate>=95)?'ok':((t.success_rate>=70)?'':'fail');
        html += '<tr><td class="action"><a style="cursor:pointer;color:var(--brand);text-decoration:underline;" data-trend-action="'+esc(t.action_id)+'">'+esc(t.action_id)+'</a></td><td class="num">'+t.total+'</td><td class="num ok">'+t.ok+'</td><td class="num fail">'+t.fail+'</td><td class="num can">'+t.cancelled+'</td><td class="num '+rc+'">'+(t.success_rate==null?'—':t.success_rate+'%')+'</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    el(hostId).innerHTML = html;
    // v12.30: wire drill-down (click en barra del stacked) -> Historial filtrado por dia.
    var groups = el(hostId).querySelectorAll('.bar-group');
    for(var i=0;i<groups.length;i++){
      groups[i].addEventListener('click', function(ev){
        var day = ev.currentTarget.getAttribute('data-day');
        var aid = d.action_id || ((el('trend-action')||{}).value || '');
        // Setear filtros del Historial y abrirlo.
        if(el('filter-action')) el('filter-action').value = aid;
        if(el('filter-status')) el('filter-status').value = '';
        if(el('filter-since')) el('filter-since').value = day;
        showSubtab('history');
      });
    }
    // v12.30: click en accion del top -> setear filtro de Tendencias y re-cargar.
    var tops = el(hostId).querySelectorAll('[data-trend-action]');
    for(var j=0;j<tops.length;j++){
      tops[j].addEventListener('click', function(ev){ var aid = ev.currentTarget.getAttribute('data-trend-action'); var sel = el('trend-action'); if(sel){ sel.value = aid; sel.dispatchEvent(new Event('change')); } });
    }
    // v12.30: wire export PNG.
    var pngs = el(hostId).querySelectorAll('.export-png');
    for(var k=0;k<pngs.length;k++){
      pngs[k].addEventListener('click', function(ev){ exportChartAsPng(ev.currentTarget.getAttribute('data-target'), d); });
    }
  }
  // v12.30: convierte SVG a PNG via Canvas y dispara descarga.
  function exportChartAsPng(targetId, dashboardData){
    var container = el(targetId); if(!container) return;
    var svg = container.querySelector('svg'); if(!svg) return;
    // Serializar el SVG con declaracion XML.
    var serializer = new XMLSerializer();
    var svgStr = serializer.serializeToString(svg);
    if(!svgStr.match(/^<svg[^>]+xmlns/)) svgStr = svgStr.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    var URLctor = window.URL || window.webkitURL;
    var imgUrl = URLctor.createObjectURL(blob);
    var img = new Image();
    img.onload = function(){
      var vb = svg.getAttribute('viewBox');
      var W = vb ? Number(vb.split(/\s+/)[2]) : svg.width.baseVal.value;
      var H = vb ? Number(vb.split(/\s+/)[3]) : svg.height.baseVal.value;
      var scale = 2; // 2x para mejor calidad
      var canvas = document.createElement('canvas'); canvas.width = W*scale; canvas.height = H*scale;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URLctor.revokeObjectURL(imgUrl);
      canvas.toBlob(function(pngBlob){
        if(!pngBlob) return;
        var dlUrl = URLctor.createObjectURL(pngBlob);
        var a = document.createElement('a');
        var stamp = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
        var aid = (dashboardData && dashboardData.action_id) || 'all';
        a.href = dlUrl; a.download = 'dashboard-'+aid+'-'+targetId+'-'+stamp+'.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function(){ URLctor.revokeObjectURL(dlUrl); }, 1000);
      }, 'image/png');
    };
    img.onerror = function(){ alert('No se pudo exportar el SVG a PNG.'); URLctor.revokeObjectURL(imgUrl); };
    img.src = imgUrl;
  }
  function loadTrends(){
    if(MODE !== 'live'){ el('trends-host').innerHTML = '<p class="empty">Tendencias solo en modo live.</p>'; return; }
    var aid = (el('trend-action')||{}).value || '';
    var aidB = (el('trend-action-b')||{}).value || '';
    var days = (el('trend-days')||{}).value || '30';
    var qs = 'days='+encodeURIComponent(days) + (aid ? '&action_id='+encodeURIComponent(aid) : '');
    fetch('/api/action-runs/dashboard?'+qs).then(function(r){return r.json();}).then(function(d){ renderTrendsDashboard(d, 'trends-host'); }).catch(function(){ el('trends-host').innerHTML = '<p class="empty">No se pudo cargar /api/action-runs/dashboard.</p>'; });
    // v12.45 (C5): si hay una segunda accion seleccionada, fetch + render lado a lado.
    var hostB = el('trends-host-b');
    if(hostB){
      if(aidB && aidB !== aid){
        var qsB = 'days='+encodeURIComponent(days) + '&action_id='+encodeURIComponent(aidB);
        hostB.innerHTML = '<p class="empty">Cargando comparacion ('+esc(aidB)+')…</p>';
        fetch('/api/action-runs/dashboard?'+qsB).then(function(r){return r.json();}).then(function(d){ renderTrendsDashboard(d, 'trends-host-b'); }).catch(function(){ hostB.innerHTML = '<p class="empty">No se pudo cargar comparacion.</p>'; });
      } else { hostB.innerHTML = ''; }
    }
    // v12.45 (C4): actualizar link de export Markdown.
    var mdLink = el('trends-export-md'); if(mdLink){ mdLink.href = '/api/action-runs/dashboard?format=md&'+qs; }
    // Autopopular el selector de accion con los ids del catalogo + historial.
    var sel = el('trend-action'); var selB = el('trend-action-b');
    if(sel && sel.options.length <= 1){
      var ids = {}; (ACTIONS_CACHE||[]).forEach(function(a){ ids[a.id] = true; });
      var html = '<option value="">— todas (agregado) —</option>';
      Object.keys(ids).sort().forEach(function(k){ html += '<option value="'+esc(k)+'">'+esc(k)+'</option>'; });
      var cur = sel.value; sel.innerHTML = html; if(cur) sel.value = cur;
    }
    if(selB && selB.options.length <= 1){
      var ids2 = {}; (ACTIONS_CACHE||[]).forEach(function(a){ ids2[a.id] = true; });
      var html2 = '<option value="">— ninguna —</option>';
      Object.keys(ids2).sort().forEach(function(k){ html2 += '<option value="'+esc(k)+'">'+esc(k)+'</option>'; });
      var cur2 = selB.value; selB.innerHTML = html2; if(cur2) selB.value = cur2;
    }
  }
  function loadStats(){
    if(MODE !== 'live'){ el('stats-host').innerHTML = '<p class="empty">Stats solo en modo live.</p>'; return; }
    Promise.all([
      fetch('/api/action-runs/stats').then(function(r){return r.json();}),
      fetch('/api/action-runs/trend?days=14').then(function(r){return r.json();}).catch(function(){return [];}),
    ]).then(function(arr){ renderStatsAgg(arr[0], arr[1]); }).catch(function(){ el('stats-host').innerHTML = '<p class="empty">No se pudo cargar /api/action-runs/stats.</p>'; });
  }
  // v12.28: sparkline SVG inline. Cada barra es 1 dia; altura proporcional a total runs
  // y color por estado: verde si todos ok, rojo si hubo fail, amarillo si solo cancelled.
  function sparklineSvg(series){
    if(!series || !series.length) return '<span class="muted">-</span>';
    var w = 120, h = 22, bar = Math.max(2, Math.floor((w - series.length) / series.length));
    var maxTotal = Math.max.apply(null, series.map(function(s){ return s.total||0; }));
    if(maxTotal === 0) return '<span class="muted">sin runs</span>';
    var svg = '<svg class="sparkline" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">';
    for(var i=0;i<series.length;i++){
      var s = series[i];
      var total = s.total||0;
      var bh = total > 0 ? Math.max(2, Math.round((total / maxTotal) * (h - 2))) : 1;
      var x = i * (bar + 1);
      var y = h - bh;
      var color = '#E5E7EB';
      if(total > 0){
        if(s.fail > 0) color = '#DC2626';
        else if(s.cancelled > 0 && s.ok === 0) color = '#F59E0B';
        else color = '#10B981';
      }
      var title = s.day+': '+total+' runs ('+s.ok+' ok / '+s.fail+' fail / '+s.cancelled+' cancel)';
      svg += '<rect x="'+x+'" y="'+y+'" width="'+bar+'" height="'+bh+'" fill="'+color+'"><title>'+esc(title)+'</title></rect>';
    }
    return svg + '</svg>';
  }
  function showSubtab(name){
    var tabs = document.querySelectorAll('.subtab'); for(var i=0;i<tabs.length;i++) tabs[i].classList.toggle('active', tabs[i].dataset.subtab===name);
    var panes = document.querySelectorAll('.subpane'); for(var j=0;j<panes.length;j++) panes[j].classList.toggle('active', panes[j].id===('subpane-'+name));
    if(name==='history') loadHistory();
    if(name==='stats') loadStats();
    if(name==='trends') loadTrends();
    // v12.32: persistir sub-tab activo en URL. 'run' es el default, no se escribe.
    try {
      var p = new URLSearchParams(window.location.search);
      if(name && name !== 'run') p.set('act_subtab', name); else p.delete('act_subtab');
      var qs = p.toString();
      window.history.replaceState(null, '', window.location.pathname + (qs ? '?'+qs : '') + window.location.hash);
    } catch {}
  }
  // v12.25: atajos de teclado para las acciones mas usadas
  var SHORTCUTS = { 'KeyS':'sync-memory', 'KeyR':'memory-report', 'KeyE':'regenerate-context', 'KeyC':'check-trace-drift' };
  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Escape'){ if(__execController) stopAction(); return; }
    // v12.141: Alt+Shift+letra (Ctrl+Shift chocaba con atajos reservados del navegador:
    // reabrir pestana, recarga forzada, DevTools, incognito). No dispara dentro de inputs.
    if(!(ev.altKey && ev.shiftKey)) return;
    var _t = ev.target; if(_t && /^(INPUT|TEXTAREA|SELECT)$/.test(_t.tagName)) return;
    if(ev.code === 'KeyH'){ ev.preventDefault(); showTab('actions'); showSubtab('history'); return; }
    if(ev.code === 'KeyT'){ ev.preventDefault(); showTab('actions'); showSubtab('stats'); return; }
    if(ev.code === 'KeyD'){ ev.preventDefault(); showTab('actions'); showSubtab('trends'); return; }
    var aid = SHORTCUTS[ev.code]; if(!aid) return;
    ev.preventDefault();
    showTab('actions'); showSubtab('run');
    if(MODE === 'live'){ if(!ACTIONS_CACHE) loadActions(); execAction(aid, ''); }
  });
  // v12.43: coverage-by-feature view en sub-tab de Trazabilidad.
  // v12.45 (E3): cache local del payload + filtro display_status sin re-fetch.
  var COVERAGE_CACHE = null;
  function loadCoverageByFeature(){
    if(MODE !== 'live'){ el('tab-trace-by-feature').innerHTML = '<p class="empty">Solo disponible en modo live (memory-serve).</p>'; return; }
    fetch('/api/coverage-by-feature').then(function(r){return r.json();}).then(function(data){ COVERAGE_CACHE = data; renderCoverageByFeature(data); }).catch(function(){ el('tab-trace-by-feature').innerHTML = '<p class="empty">No se pudo cargar /api/coverage-by-feature.</p>'; });
  }
  function applyTraceDsFilter(){ if(COVERAGE_CACHE) renderCoverageByFeature(COVERAGE_CACHE); }
  function renderCoverageByFeature(features){
    var dsFilter = (el('trace-ds-filter')||{}).value || '';
    if(!features || !features.length){ el('tab-trace-by-feature').innerHTML = '<p class="empty">Sin trace links registrados.</p>'; return; }
    var html = '';
    for(var i=0;i<features.length;i++){
      var f = features[i];
      html += '<div class="feature-card">';
      html += '<h3>'+esc(f.feature)+'</h3>';
      html += '<div class="feature-meta">'+f.source_count+' RF/RNF · '+f.links+' trace links · sources: '+f.sources.map(esc).join(', ')+'</div>';
      // Status breakdown como pills.
      html += '<div>';
      for(var st in f.status_breakdown){
        var cls = (st && st !== '(null)') ? st : '';
        html += '<span class="status-pill '+esc(cls)+'">'+esc(st)+': '+f.status_breakdown[st]+'</span>';
      }
      html += '</div>';
      // Targets agrupados por tipo.
      var typeOrder = ['hu','spdd','prototipo','api','bd','codigo','test','estado'];
      var seenTypes = {};
      for(var ti=0; ti<typeOrder.length; ti++){
        var t = typeOrder[ti];
        if(!f.targets_by_type[t]) continue;
        seenTypes[t] = true;
        var visible = f.targets_by_type[t].filter(function(lk){ return !dsFilter || (lk.display_status||'') === dsFilter; });
        if(!visible.length) continue;
        html += '<div class="target-group"><div class="gtitle">'+esc(t)+' ('+visible.length+(dsFilter?' / '+f.targets_by_type[t].length:'')+')</div><ul>';
        for(var k=0; k<visible.length; k++){
          var lk = visible[k];
          html += '<li><strong>'+esc(lk.source_ref)+'</strong> → '+esc(lk.target_ref)+' <span class="status-pill '+esc(lk.display_status||'')+'">'+esc(lk.display_status||'-')+'</span>';
          if(lk.evidence_ref){ html += ' <span class="ev">'+esc(lk.evidence_ref)+'</span>'; html += ' <a href="#" class="ev-git" data-ev="'+esc(lk.evidence_ref)+'" title="Ver historial git del archivo">[git]</a>'; }
          html += '</li>';
        }
        html += '</ul></div>';
      }
      for(var ot in f.targets_by_type){
        if(seenTypes[ot]) continue;
        html += '<div class="target-group"><div class="gtitle">'+esc(ot)+' ('+f.targets_by_type[ot].length+')</div></div>';
      }
      html += '</div>';
    }
    el('tab-trace-by-feature').innerHTML = html;
    // v12.45 (F2): wire drill-down git history en links de evidencia.
    var gitLinks = el('tab-trace-by-feature').querySelectorAll('.ev-git');
    for(var gi=0; gi<gitLinks.length; gi++){
      gitLinks[gi].addEventListener('click', function(ev){
        ev.preventDefault();
        var path = ev.currentTarget.getAttribute('data-ev');
        if(!path) return;
        var cleanPath = path.split(/[\s:]/)[0];
        fetch('/api/file-git-history?path='+encodeURIComponent(cleanPath)+'&limit=10').then(function(r){return r.json();}).then(function(d){
          var lines = ['Historial git de '+cleanPath+':',''];
          if(d.error){ lines.push('Error: '+d.error); }
          else if(!d.commits || !d.commits.length){ lines.push('(sin commits)'); }
          else { d.commits.forEach(function(c){ lines.push(c.sha+'  '+c.date+'  '+(c.author||'?')+'  '+c.subject); }); }
          alert(lines.join('\n'));
        }).catch(function(err){ alert('No se pudo cargar el git history: '+err); });
      });
    }
  }
  function showTraceSub(name){
    var subs = document.querySelectorAll('[data-trace-sub]'); for(var i=0;i<subs.length;i++) subs[i].classList.toggle('active', subs[i].dataset.traceSub===name);
    var panes = document.querySelectorAll('#pane-trace .subpane'); for(var j=0;j<panes.length;j++) panes[j].classList.toggle('active', panes[j].id===('trace-sub-'+name));
    if(name==='by-feature') loadCoverageByFeature();
  }
  // v12.70: visor de proyecto (pestana Proyecto).
  var FILES_TREE = null;
  var CURRENT_FILE = null;
  // v12.74: resuelve un href relativo contra el directorio del archivo actual.
  function resolveRel(base, href){ href=(href||'').split('#')[0].split('?')[0]; if(!href) return null; var baseDir = base && base.indexOf('/')>=0 ? base.replace(/\/[^/]*$/,'') : ''; var parts = baseDir ? baseDir.split('/') : []; var hp = href.split('/'); for(var i=0;i<hp.length;i++){ var s=hp[i]; if(s===''||s==='.') continue; if(s==='..') parts.pop(); else parts.push(s); } return parts.join('/'); }
  function loadFilesTree(){
    if(MODE !== 'live'){ el('files-tree').innerHTML = '<p class="empty">El visor solo esta disponible en modo live (npm run memory:serve).</p>'; return; }
    el('files-tree').innerHTML = '<p class="empty">Cargando arbol…</p>';
    fetch('/api/files/tree').then(function(r){return r.json();}).then(function(t){ FILES_TREE = t; renderFilesTree(); }).catch(function(){ el('files-tree').innerHTML='<p class="empty">No se pudo cargar /api/files/tree.</p>'; });
  }
  function ficon(name){ var e=(name.split('.').pop()||'').toLowerCase(); if(e==='md')return '📄'; if(e==='js'||e==='mjs'||e==='ts')return '🟨'; if(e==='json')return '🔧'; if(e==='html')return '🌐'; if(e==='css')return '🎨'; if(['png','jpg','jpeg','gif','webp','svg','ico','bmp'].indexOf(e)>=0)return '🖼'; return '📃'; }
  function renderFilesTree(){
    if(!FILES_TREE){ return; }
    var filter = ((el('files-filter') && el('files-filter').value) || '').toLowerCase();
    function node(n){
      if(n.type==='dir'){
        var kids = (n.children||[]).map(node).filter(Boolean);
        if(filter && kids.length===0 && n.name.toLowerCase().indexOf(filter)<0) return '';
        var open = filter ? ' open' : '';
        return '<details class="ftree-dir"'+open+'><summary>📁 '+esc(n.name)+'</summary><div class="ftree-children">'+kids.join('')+'</div></details>';
      }
      if(filter && n.name.toLowerCase().indexOf(filter)<0) return '';
      return '<div class="ftree-file" data-fpath="'+esc(n.path)+'" title="'+esc(n.path)+'">'+ficon(n.name)+' '+esc(n.name)+'</div>';
    }
    var html = (FILES_TREE.children||[]).map(node).filter(Boolean).join('');
    if(FILES_TREE.truncated) html += '<p class="empty">(arbol truncado: demasiados archivos)</p>';
    el('files-tree').innerHTML = html || '<p class="empty">Sin coincidencias.</p>';
    var files = el('files-tree').querySelectorAll('[data-fpath]');
    for(var i=0;i<files.length;i++){ files[i].addEventListener('click', function(ev){ var p=ev.currentTarget.getAttribute('data-fpath'); var prev=el('files-tree').querySelector('.ftree-file.sel'); if(prev) prev.classList.remove('sel'); ev.currentTarget.classList.add('sel'); openFile(p); }); }
  }
  // v12.141 (D): breadcrumb segmentado de la ruta abierta; click en una carpeta filtra el arbol.
  function crumbsHtml(p){ var parts = String(p||'').split('/'); var acc = ''; var out = '<span class="fview-crumbs">'; for(var i=0;i<parts.length;i++){ var last = i===parts.length-1; acc += (i?'/':'') + parts[i]; if(last){ out += '<span class="crumb-file">'+esc(parts[i])+'</span>'; } else { out += '<a class="crumb" data-crumb="'+esc(acc)+'">'+esc(parts[i])+'</a><span class="crumb-sep">/</span>'; } } return out + '</span>'; }
  function openFile(p){
    el('files-viewer').innerHTML = '<p class="empty">Cargando '+esc(p)+'…</p>';
    fetch('/api/files/read?path='+encodeURIComponent(p)).then(function(r){return r.json();}).then(function(d){ renderFileContent(d); }).catch(function(){ el('files-viewer').innerHTML='<p class="empty">No se pudo leer el archivo.</p>'; });
  }
  function gutterHtml(lineHtmlArr){ var o=''; for(var i=0;i<lineHtmlArr.length;i++){ o+='<div class="fview-line"><span class="fview-ln">'+(i+1)+'</span><span class="fview-code">'+lineHtmlArr[i]+'</span></div>'; } return o; }
  function gutterRaw(text){ var ls=(text||'').split('\n'); var a=[]; for(var i=0;i<ls.length;i++) a.push(esc(ls[i])); return gutterHtml(a); }
  function renderFileContent(d){
    var v=el('files-viewer');
    if(d.path) CURRENT_FILE = d.path;
    if(d.error){ v.innerHTML = '<p class="empty">'+esc(d.error)+'</p>'; return; }
    var kb = (d.size/1024).toFixed(1);
    var head = '<div class="fview-head">'+crumbsHtml(d.path)+' <span class="muted">· '+kb+' KB · '+esc(d.ext||'')+'</span><span class="fview-tools"></span></div>';
    if(d.kind==='image'){ v.innerHTML = head + '<div class="fview-img"><img src="'+d.dataUrl+'" alt="'+esc(d.path)+'"/></div>'; return; }
    if(d.kind==='binary'){ v.innerHTML = head + '<p class="empty">Archivo binario — no se puede mostrar como texto.</p>'; return; }
    if(d.kind==='too-large'){ v.innerHTML = head + '<p class="empty">Archivo demasiado grande para previsualizar.</p>'; return; }
    if(d.kind==='markdown'){ v.innerHTML = head + '<div class="fview-body"><div class="md-body">'+d.html+'</div></div>'; addViewerTools(d); return; }
    v.innerHTML = head + '<div class="fview-body"><div class="fview-pre">'+gutterHtml(d.lines||[])+'</div></div>';
    addViewerTools(d);
  }
  function addViewerTools(d){
    var v=el('files-viewer'); var tools=v.querySelector('.fview-tools'); if(!tools) return;
    var body=v.querySelector('.fview-body'); var defaultHTML = body ? body.innerHTML : '';
    var btns='';
    if(d.kind==='markdown') btns+='<button data-valt>Fuente</button>';
    if(d.kind==='html') btns+='<button data-valt>Vista</button>';
    btns+='<button data-vcopy>Copiar</button>';
    tools.innerHTML=btns;
    var showingAlt=false; var alt=tools.querySelector('[data-valt]');
    if(alt) alt.addEventListener('click', function(){ showingAlt=!showingAlt; if(!showingAlt){ body.innerHTML=defaultHTML; alt.textContent=(d.kind==='html'?'Vista':'Fuente'); return; } if(d.kind==='html'){ alt.textContent='Fuente'; body.innerHTML=''; var f=document.createElement('iframe'); f.className='fview-frame'; f.setAttribute('sandbox','allow-scripts allow-same-origin'); body.appendChild(f); f.srcdoc=d.content; } else { alt.textContent='Vista'; body.innerHTML='<div class="fview-pre">'+gutterRaw(d.content)+'</div>'; } });
    var cp=tools.querySelector('[data-vcopy]'); if(cp) cp.addEventListener('click', function(){ if(navigator.clipboard){ navigator.clipboard.writeText(d.content||''); cp.textContent='Copiado'; setTimeout(function(){cp.textContent='Copiar';},1200); } });
  }
  // v12.80: panel multiagente (locks claim/release + tablero).
  function agentId(){ return (el('agent-id') && el('agent-id').value.trim()) || ''; }
  function loadAgents(){
    if(MODE !== 'live'){ el('agents-host').innerHTML = '<p class="empty">El multiagente solo esta disponible en modo live (npm run memory:serve).</p>'; return; }
    var saved = localStorage.getItem('spdd-agent-id'); if(saved && el('agent-id') && !el('agent-id').value) el('agent-id').value = saved;
    el('agents-host').innerHTML = '<p class="empty">Cargando tablero…</p>';
    // v12.128: tambien trae los runs SQLite (Capa 1) ademas de los locks de feature (legacy).
    Promise.all([
      fetch('/api/locks').then(function(r){return r.json();}).catch(function(){return {error:'locks no disponible',rows:[],locks:[]};}),
      fetch('/api/agent-runs?limit=20').then(function(r){return r.json();}).catch(function(){return null;})
    ]).then(function(arr){ renderAgents(arr[0], arr[1]); }).catch(function(){ el('agents-host').innerHTML='<p class="empty">No se pudo cargar /api/locks ni /api/agent-runs.</p>'; });
  }
  function renderAgents(d, ar){
    if(d.error){ el('agents-host').innerHTML = '<p class="empty">'+esc(d.error)+'</p>'; return; }
    var rows = d.rows||[];
    // v12.141 (D): resumen del tablero (features / bloqueadas / libres / expiradas).
    var nActive=0, nExpired=0; rows.forEach(function(f){ var lk=f.lock; if(lk && !lk.expired) nActive++; else if(lk && lk.expired) nExpired++; });
    var nFree = rows.length - nActive - nExpired;
    var html = '<div class="agent-summary">'
      + '<span class="agent-sum-item"><strong>'+rows.length+'</strong> features</span>'
      + '<span class="agent-sum-item"><span class="st-badge st-warn">'+nActive+'</span> bloqueadas</span>'
      + '<span class="agent-sum-item"><span class="st-badge st-muted">'+nFree+'</span> libres</span>'
      + (nExpired ? '<span class="agent-sum-item"><span class="st-badge st-err">'+nExpired+'</span> expiradas</span>' : '')
      + '</div>';
    html += '<table class="agent-board"><thead><tr><th>Feature</th><th>Prototipo</th><th>Lock</th><th>Expira</th><th>Accion</th></tr></thead><tbody>';
    rows.forEach(function(f){
      var lk = f.lock;
      var active = lk && !lk.expired;
      var lockTxt = active ? ('<span class="st-badge st-warn">🔒 '+esc(lk.agent)+'</span>') : (lk && lk.expired ? '<span class="st-badge st-err">⏰ expirado · '+esc(lk.agent)+'</span>' : '<span class="st-badge st-muted">libre</span>');
      var exp = active ? esc(String(lk.expires_at).slice(0,16).replace('T',' ')) : '—';
      var act = active ? ('<button data-release="'+esc(f.slug)+'">Liberar</button>') : ('<button data-claim="'+esc(f.slug)+'">Reclamar</button>');
      html += '<tr><td><code>'+esc(f.slug)+'</code></td><td>'+esc(f.prototype_state||'—')+'</td><td>'+lockTxt+'</td><td>'+exp+'</td><td>'+act+'</td></tr>';
    });
    html += '</tbody></table>';
    var expired = (d.locks||[]).filter(function(l){return l.expired;});
    if(expired.length) html += '<p class="agent-warn">⏰ '+expired.length+' lock(s) expirados — usa “Purgar expirados”.</p>';
    // v12.128: widget de active runs (Capa 1 — agent:start/finish + reviews).
    if(ar && !ar.schema_missing){
      var active = (ar.runs||[]).filter(function(r){ return r.status==='in_progress' || r.status==='implementer_done' || r.status==='spec_review_passed'; });
      html += '<div class="agent-active-runs"><h4>🛠️ Active runs (Capa 1) <span class="agent-active-count">'+active.length+'</span></h4>';
      if(active.length===0){
        html += '<p class="empty">Sin runs activos. Inicia un T-NNN con <code>npm run agent:start -- --feature &lt;slug&gt; --task &lt;T-NNN&gt; --agent &lt;tu-agente&gt;</code>.</p>';
      } else {
        html += '<table class="agent-board"><thead><tr><th>Feature</th><th>Task</th><th>Implementer</th><th>Status</th><th>Started</th></tr></thead><tbody>';
        active.forEach(function(r){
          var col = r.status==='in_progress'?'#3B82F6':(r.status==='implementer_done'?'#D97706':'#22D3EE');
          html += '<tr><td><code>'+esc(r.feature)+'</code></td><td><code>'+esc(r.task_id)+'</code></td><td>'+esc(r.agent)+'</td><td><span class="agent-run-status" style="background:'+col+';color:#fff">'+esc(r.status)+'</span></td><td class="muted">'+esc(String(r.started_at||'').slice(0,16))+'</td></tr>';
        });
        html += '</tbody></table>';
      }
      html += '<p class="muted" style="font-size:11px;margin-top:6px">Reviewer != implementer (Principio 1 anti-self-approval). Total runs en BD: '+(ar.total||0)+'.</p></div>';
    } else if (ar && ar.schema_missing){
      html += '<div class="agent-active-runs"><p class="empty">Las 3 tablas SQLite de Capa 1 (ai_task_runs / ai_task_reviews / ai_task_review_findings) aun no existen. Corre <code>npm run memory:bootstrap</code>.</p></div>';
    }
    el('agents-host').innerHTML = html;
    el('agents-host').querySelectorAll('[data-claim]').forEach(function(b){ b.addEventListener('click', function(e){ doClaim(e.currentTarget.getAttribute('data-claim')); }); });
    el('agents-host').querySelectorAll('[data-release]').forEach(function(b){ b.addEventListener('click', function(e){ doRelease(e.currentTarget.getAttribute('data-release')); }); });
  }
  function postLocks(path, payload){ return fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(function(r){return r.json().then(function(j){return {status:r.status, j:j};});}); }
  function doClaim(feature){
    var a = agentId(); if(!a){ alert('Escribe tu nombre de agente arriba (campo Agente).'); return; }
    localStorage.setItem('spdd-agent-id', a);
    postLocks('/api/locks/claim', { feature:feature, agent:a }).then(function(res){ if(!res.j.ok){ alert('No se pudo reclamar: '+(res.j.error||res.status)); } loadAgents(); });
  }
  function doRelease(feature){
    var a = agentId();
    postLocks('/api/locks/release', { feature:feature, agent:a||undefined }).then(function(res){ if(!res.j.ok){ if(confirm((res.j.error||'No se pudo liberar')+'\n\n¿Forzar liberacion?')){ postLocks('/api/locks/release',{feature:feature, force:true}).then(function(){ loadAgents(); }); return; } } loadAgents(); });
  }
  function showTab(name){
    var tabs = document.querySelectorAll('.tab'); for(var i=0;i<tabs.length;i++){ var on = tabs[i].dataset.tab===name; tabs[i].classList.toggle('active', on); tabs[i].setAttribute('aria-selected', on?'true':'false'); tabs[i].setAttribute('tabindex', on?'0':'-1'); }
    var panes = document.querySelectorAll('.pane'); for(var j=0;j<panes.length;j++) panes[j].classList.toggle('active', panes[j].id===('pane-'+name));
    if(name==='home') loadHome();
    if(name==='actions' && !ACTIONS_CACHE) loadActions();
    if(name==='roadmap') loadRoadmap();
    if(name==='files' && !FILES_TREE) loadFilesTree();
    if(name==='agents') loadAgents();
    try{ localStorage.setItem('aif-tab', name); }catch(e){}
  }
  // UX-1: vista Inicio / Resumen — entrada por defecto orientada a tarea ("donde estoy / que hago").
  function loadHome(){
    var host = el('home-host'); if(!host) return;
    if(MODE !== 'live'){ renderHomeStatic(); return; }
    host.innerHTML = skeleton(['35%','92%','70%','50%']);
    Promise.all([
      fetch('/api/roadmap/status').then(function(r){return r.json();}),
      fetch('/api/roadmap/next').then(function(r){return r.json();}).catch(function(){return null;}),
      fetch('/api/roadmap/pending').then(function(r){return r.json();}).catch(function(){return null;}),
      fetch('/api/action-runs?limit=5').then(function(r){return r.json();}).catch(function(){return null;})
    ]).then(function(arr){ renderHome(arr[0], arr[1], arr[2], arr[3]); })
    .catch(function(){ errorState('home-host', 'No se pudo cargar el resumen del proyecto (/api/roadmap/status).', loadHome); });
  }
  function homeKpi(cls, val, label, goto){ return '<button class="home-kpi '+cls+'" type="button" data-home-goto="'+goto+'"><div class="home-kpi-v">'+esc(val)+'</div><div class="home-kpi-l">'+esc(label)+'</div></button>'; }
  function renderHome(st, nx, pend, runs){
    var host = el('home-host'); if(!host) return;
    if(!st || st.error){ errorState('home-host', 'Error al leer el estado: '+((st&&st.error)||'sin datos'), loadHome); return; }
    var phs = st.phases || [];
    var wsum=0, denom=0, nC=0, nP=0, nNA=0;
    phs.forEach(function(p){ if(p.status==='n-a'){ nNA++; return; } denom++; if(p.status==='complete'){ wsum+=1; nC++; } else if(p.status==='partial'){ wsum+=0.5; nP++; } });
    var pct = denom>0 ? Math.round(wsum/denom*100) : 0;
    var pBlk=0, pGate=0; if(pend && pend.phases){ pend.phases.forEach(function(ph){ (ph.items||[]).forEach(function(it){ if(it.severity==='blocker')pBlk++; else if(it.severity==='gate')pGate++; }); }); }
    var s = (MEM && MEM.stats) || {};
    var h = onboardHtml();
    h += '<div class="home-hero"><div class="home-pct">'+pct+'%</div><div style="min-width:160px"><div style="font-weight:700;font-size:15px">'+esc(st.project||'Proyecto')+'</div><div class="home-meta">template '+esc(st.templateVersion||'-')+' · '+(st.features?st.features.length:0)+' features · '+nC+'/'+denom+' fases completas'+(nP?' · '+nP+' parciales':'')+(nNA?' · '+nNA+' N/A':'')+'</div></div><div style="flex:1;min-width:180px"><div class="proj-progress"><div class="proj-progress-fill" style="width:'+pct+'%"></div><span class="proj-progress-label">'+pct+'%</span></div></div></div>';
    h += '<div class="home-grid">';
    h += homeKpi(pBlk?'blocker':'ok', pBlk, 'Blockers', 'roadmap');
    h += homeKpi(pGate?'gate':'ok', pGate, 'Gates por firmar', 'gates');
    h += '</div>';
    // v12.141: la barra de stats global se movio aqui (Memoria del agente).
    h += '<div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin:2px 0 6px">Memoria del agente</div>';
    h += '<div class="stats">'+statsGridHtml(s)+'</div>';
    if(nx && !nx.error && nx.next_action){
      var rc = nx.agent_readiness==='ready_for_ai'?'#16A34A':(nx.agent_readiness==='needs_human'?'#D97706':'#DC2626');
      h += '<div class="home-next" style="border-left-color:'+rc+'"><h4>→ Siguiente accion segura <span class="mode-badge" style="background:'+rc+';color:#fff">'+esc(nx.agent_readiness||'')+'</span></h4>';
      h += '<div style="font-size:14px;font-weight:600;color:var(--accent)">'+esc(nx.next_action)+'</div>';
      if(nx.feature) h += '<div class="home-meta" style="margin-top:4px">Feature: <code>'+esc(nx.feature)+'</code> · Fase '+esc(nx.phase)+'</div>';
      h += '<div class="home-actions"><button class="home-btn" type="button" data-home-goto="roadmap">Ver roadmap completo</button><button class="home-btn" type="button" data-home-goto="actions">Ir a Acciones</button></div></div>';
    } else {
      h += '<div class="home-next"><h4>Accesos rapidos</h4><div class="home-actions"><button class="home-btn" type="button" data-home-goto="roadmap">Roadmap</button><button class="home-btn" type="button" data-home-goto="actions">Acciones</button><button class="home-btn" type="button" data-home-goto="trace">Trazabilidad</button></div></div>';
    }
    // Ultimas corridas (de /api/action-runs) — atajo al historial.
    var rrows = runs && runs.length ? runs : null;
    if(rrows){
      h += '<div class="home-next"><h4>Ultimas corridas <span class="muted" style="font-weight:400;font-size:11px">(de Acciones › Historial)</span></h4><div class="home-runs">';
      rrows.slice(0,5).forEach(function(r){ h += '<div class="home-run"><span class="home-run-st">'+badgeForRun(r)+'</span><code>'+esc(r.action_id)+(r.arg?' '+esc(r.arg):'')+'</code><span class="muted home-run-ago">'+esc(typeof fmtAgo==='function'?fmtAgo(r.started_at):r.started_at)+'</span></div>'; });
      h += '</div><div class="home-actions"><button class="home-btn" type="button" data-home-goto="actions">Ver historial completo</button></div></div>';
    }
    h += shortcutsHtml();
    host.innerHTML = h; wireHome(host);
  }
  function renderHomeStatic(){
    var host = el('home-host'); if(!host) return;
    var s = (MEM && MEM.stats) || {};
    var h = onboardHtml();
    h += '<div class="home-hero"><div style="min-width:200px"><div style="font-weight:700;font-size:15px">Reporte estatico de memoria</div><div class="home-meta">Snapshot de la BD del agente. El roadmap, los KPIs en vivo y las acciones requieren <code>npm run memory:serve</code>.</div></div></div>';
    h += '<div class="home-grid">';
    h += homeKpi('', s.traceLinks||0, 'Trace links', 'trace');
    h += homeKpi('', s.gateRuns||0, 'Gate runs', 'gates');
    h += homeKpi('', s.documents||0, 'Documentos', 'docs');
    h += homeKpi('', s.evidence||0, 'Evidencia', 'evidence');
    h += '</div>';
    h += shortcutsHtml();
    host.innerHTML = h; wireHome(host);
  }
  function wireHome(host){
    var btns = host.querySelectorAll('[data-home-goto]'); for(var i=0;i<btns.length;i++){ btns[i].addEventListener('click', function(ev){ showTab(ev.currentTarget.getAttribute('data-home-goto')); }); }
    var ox = host.querySelector('.onboard-x'); if(ox) ox.addEventListener('click', function(){ try{ localStorage.setItem('aif-onboard','1'); }catch(e){} var b = host.querySelector('.onboard-banner'); if(b && b.parentNode) b.parentNode.removeChild(b); });
  }
  // v12.54: Roadmap pane. Carga estado de las 9 fases + comandos recientes + sugeridos.
  var ROADMAP_STATE = null;
  function loadRoadmap(){
    if(MODE !== 'live'){ el('roadmap-host').innerHTML = modeNotice('El roadmap'); return; }
    el('roadmap-host').innerHTML = skeleton(['30%','85%','60%','70%','45%']);
    Promise.all([
      fetch('/api/roadmap/status').then(function(r){return r.json();}),
      fetch('/api/roadmap/next').then(function(r){return r.json();}).catch(function(){return null;}),
      fetch('/api/agent-runs?limit=10').then(function(r){return r.json();}).catch(function(){return null;}),
      fetch('/api/roadmap/pending').then(function(r){return r.json();}).catch(function(){return null;})
    ]).then(function(arr){ ROADMAP_STATE = { status: arr[0], next: arr[1], agentRuns: arr[2], pending: arr[3] }; renderRoadmap(); })
    .catch(function(){ errorState('roadmap-host', 'No se pudo cargar /api/roadmap/status. Verifica que scripts/roadmap-status.mjs existe (corre: npm run template:upgrade -- --apply).', loadRoadmap); });
  }
  function renderRoadmap(){
    var st = ROADMAP_STATE.status;
    if(st.error){ el('roadmap-host').innerHTML = '<p class="empty">Error: '+esc(st.error)+'</p>'; return; }
    var html = '';
    // Cabecera con proyecto + version + features.
    html += '<div class="roadmap-section"><h4>Proyecto · ' + esc(st.project||'-') + ' · template ' + esc(st.templateVersion||'-') + ' · ' + (st.features?st.features.length:0) + ' features</h4></div>';
    // v12.139: barra de progreso del proyecto por fases (ponderada: complete=1, partial=0.5; N/A excluida del calculo).
    var phs = st.phases || [];
    var wsum=0, denom=0, nC=0, nP=0, nS=0, nNA=0;
    phs.forEach(function(p){ if(p.status==='n-a'){ nNA++; return; } denom++; if(p.status==='complete'){ wsum+=1; nC++; } else if(p.status==='partial'){ wsum+=0.5; nP++; } else { nS++; } });
    var pct = denom>0 ? Math.round(wsum/denom*100) : 0;
    var pBlk=0, pGate=0; if(ROADMAP_STATE.pending && ROADMAP_STATE.pending.phases){ ROADMAP_STATE.pending.phases.forEach(function(ph){ (ph.items||[]).forEach(function(it){ if(it.severity==='blocker')pBlk++; else if(it.severity==='gate')pGate++; }); }); }
    html += '<div class="roadmap-section"><h4>Progreso del proyecto</h4>';
    html += '<div class="proj-progress"><div class="proj-progress-fill" style="width:'+pct+'%"></div><span class="proj-progress-label">'+pct+'%</span></div>';
    html += '<div class="muted" style="font-size:12px;margin:6px 0 8px">'+nC+'/'+denom+' fases completas · '+nP+' parciales'+(nS?' · '+nS+' sin empezar':'')+(nNA?' · '+nNA+' N/A':'')+' · '+pBlk+' blockers · '+pGate+' gates por firmar</div>';
    html += '<div class="phase-segs">';
    phs.forEach(function(p){ var cls = p.status==='complete'?'complete':(p.status==='partial'?'partial':(p.status==='n-a'?'na':'not-started')); var ic = p.status==='complete'?'✓':(p.status==='partial'?'◐':(p.status==='n-a'?'⊘':'·')); html += '<button class="phase-seg '+cls+'" data-goto-phase="'+p.id+'" title="Fase '+p.id+' · '+esc(p.name)+(p.detail?' — '+esc(p.detail):'')+'">'+p.id+' '+ic+'</button>'; });
    html += '</div>';
    html += '<p class="muted" style="font-size:11px;margin-top:4px">verde=completa · ámbar=parcial · gris=sin empezar · rayado=N/A. Click en una fase para ver sus pendientes.</p>';
    html += '</div>';
    // v12.139: Pendientes por fase (consume /api/roadmap/pending = roadmap-pending.mjs --json).
    var pend = ROADMAP_STATE.pending;
    if(pend && pend.phases){
      var pb=0,pg=0,pi=0; pend.phases.forEach(function(ph){ (ph.items||[]).forEach(function(it){ if(it.severity==='blocker')pb++; else if(it.severity==='gate')pg++; else pi++; }); });
      html += '<div class="roadmap-section"><h4>📋 Pendientes por fase <span class="muted" style="font-weight:400">('+pb+' blocker · '+pg+' gate · '+pi+' info)</span></h4>';
      pend.phases.forEach(function(ph){
        if(ph.na){ html += '<div id="pend-phase-'+ph.phase+'" style="margin:3px 0;color:var(--muted)">Fase '+ph.phase+' ('+esc(ph.name)+') — ⊘ N/A (reingenieria)</div>'; return; }
        if(!ph.items || !ph.items.length){ html += '<div id="pend-phase-'+ph.phase+'" style="margin:3px 0;color:#3a7">Fase '+ph.phase+' ('+esc(ph.name)+') — ✓ sin pendientes</div>'; return; }
        html += '<div id="pend-phase-'+ph.phase+'" style="margin:6px 0"><strong>Fase '+ph.phase+' ('+esc(ph.name)+')</strong><ul style="margin:2px 0 6px 0">';
        ph.items.forEach(function(it){ var ic = it.severity==='blocker'?'✗':(it.severity==='gate'?'🔒':'◦'); var col = it.severity==='blocker'?'#c33':(it.severity==='gate'?'#a60':'var(--muted)'); html += '<li style="color:'+col+'">'+ic+' <span class="muted">['+esc(it.kind)+']</span> <code>'+esc(it.item)+'</code> — '+esc(it.detail)+'</li>'; });
        html += '</ul></div>';
      });
      html += '<p class="muted" style="font-size:11px">✗ blocker (el agente puede resolver) · 🔒 gate (firma humana) · ◦ info (validacion sin corrida registrada). Fuente: <code>npm run roadmap:pending</code></p>';
      html += '</div>';
    }
    // v12.127: widget de las 3 capas del framework AI-first empresarial.
    // Hace VISIBLE en el panel la arquitectura ortogonal: governance (Capa 2) +
    // execution discipline (Capa 1) + lifecycle compat (Capa 3). Es referencia visual
    // permanente para que el agente sepa donde esta parado.
    // v12.141: colapsable (referencia permanente pero plegada por defecto -> menos scroll).
    html += '<details class="roadmap-section"><summary style="cursor:pointer;font-weight:600;font-size:14px">🧩 Capas del framework <span class="muted" style="font-weight:400;font-size:11px">(referencia)</span></summary>';
    html += '<div class="capa-stack" style="margin-top:10px">';
    html += '  <div class="capa capa-1"><span class="capa-tag">Capa 1</span><strong>Execution Discipline</strong><small>como ejecutar (protocolos + TDD + reviews + worktrees)</small><div class="capa-refs"><code>AGENT_RUNTIME.md</code> · <code>ai/protocols/</code> · <code>agent:protocol/start/review/finish</code></div></div>';
    html += '  <div class="capa capa-2"><span class="capa-tag">Capa 2</span><strong>Project Governance</strong><small>que es el proyecto (memoria + gates + trazabilidad + 9 fases)</small><div class="capa-refs"><code>CONSTITUTION.md</code> · <code>AGENTS.md</code> · <code>ROADMAP_STATE.json</code> · 47 validadores</div></div>';
    html += '  <div class="capa capa-3"><span class="capa-tag">Capa 3</span><strong>Lifecycle Compat</strong><small>interop spec-kit (opt-in)</small><div class="capa-refs"><code>specs/&lt;slug&gt;/.specify/</code> · <code>npm run specify:compat -- --all</code></div></div>';
    html += '</div></details>';
    // Grid de fases.
    html += '<div class="roadmap-grid">';
    (st.phases||[]).forEach(function(p){
      var icon = p.status==='complete'?'✓':(p.status==='partial'?'⚠':'⊘');
      var label = p.status==='complete'?'COMPLETA':(p.status==='partial'?'PARCIAL':'NO INICIADA');
      html += '<div class="phase-card '+esc(p.status)+'" data-phase="'+p.id+'">';
      html += '<div class="phase-num">Fase '+p.id+'</div>';
      html += '<div class="phase-name">'+esc(p.name)+'</div>';
      html += '<div class="phase-status '+esc(p.status)+'">'+icon+' '+label+'</div>';
      html += '<div class="phase-detail">'+esc(p.detail)+'</div>';
      html += '</div>';
    });
    html += '</div>';
    // v12.62: semaforo de estado visual de prototipos (5 peldaños).
    // v12.117: lee `phase2to3.project_ready` (granular). Antes leia phase2to3Ready (atajo legacy) que se interpretaba como 'todo el proyecto puede avanzar' cuando no era cierto si habia features sin prototipo.
    var ps = st.prototypeStates;
    if(ps && ps.withPrototype > 0){
      var pp = ps.phase2to3 || { project_ready: !!ps.phase2to3Ready, ready_features: [], blocked_features: [] };
      var advanceColor = pp.project_ready ? '#16A34A' : '#D97706';
      var advanceLabel = pp.project_ready ? 'proyecto avanza 2→3' : (pp.ready_features.length ? 'avance solo para '+pp.ready_features.length : '2→3 bloqueado');
      html += '<div class="roadmap-section" style="border-left:4px solid '+advanceColor+'">';
      html += '<h4>🚦 Estado visual de prototipos (fase 2) <span style="background:'+advanceColor+';color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">'+esc(advanceLabel)+'</span></h4>';
      var c = ps.counts || {};
      var ladder = [['exists','#DC2626'],['auto-quality','#DC2626'],['visible-product','#D97706'],['human-review-pending','#D97706'],['human-approved','#16A34A']];
      html += '<div class="proto-ladder">';
      ladder.forEach(function(rung){ var n=c[rung[0]]||0; html += '<div class="proto-rung" style="opacity:'+(n>0?1:0.4)+'"><span class="proto-rung-dot" style="background:'+rung[1]+'"></span><span class="proto-rung-label">'+rung[0]+'</span><span class="proto-rung-count">'+n+'</span></div>'; });
      html += '</div>';
      html += '<div class="proto-feature-list">';
      (ps.features||[]).forEach(function(f){
        if(f.state==='none') return;
        var dot = f.light==='green'?'🟢':(f.light==='amber'?'🟡':'🔴');
        html += '<div class="proto-feature-row"><span>'+dot+'</span><code>'+esc(f.slug)+'</code><span class="proto-feature-state">'+esc(f.state)+'</span><span class="proto-feature-note">'+esc(f.blockedBy||f.reviewer||'')+'</span></div>';
      });
      html += '</div>';
      if(!pp.project_ready){
        var msg = '';
        if(pp.ready_features && pp.ready_features.length){ msg += '✓ Avance 2→3 habilitado SOLO para '+pp.ready_features.length+' feature(s) con prototipo human-approved'; }
        if(pp.blocked_features && pp.blocked_features.length){ msg += (msg?' · ':'')+'⚠ '+pp.blocked_features.length+' feature(s) bloqueadas o sin prototipo: '+pp.blocked_features.map(esc).join(', '); }
        if(!msg){ msg = '⚠ Avance fase 2 → 3 BLOQUEADO'; }
        html += '<div class="proto-advance-warn">'+msg+'</div>';
      } else {
        html += '<div class="proto-advance-ok">✓ Todas las features estan human-approved. El proyecto entero puede avanzar a fase 3.</div>';
      }
      html += '</div>';
    }
    // v12.127: Agent Execution Ledger (Capa 1) — runs + reviews recientes desde SQLite.
    var ar = ROADMAP_STATE.agentRuns;
    if(ar && !ar.schema_missing){
      var statusColor = { in_progress:'#3B82F6', implementer_done:'#D97706', spec_review_passed:'#22D3EE', quality_review_passed:'#22D3EE', done_with_concerns:'#D97706', approved:'#16A34A', blocked:'#DC2626' };
      var ledgerColor = (ar.runs && ar.runs.length) ? '#1E40AF' : '#94A3B8';
      html += '<details class="roadmap-section" style="border-left:4px solid '+ledgerColor+'">';
      html += '<summary style="cursor:pointer;font-weight:600;font-size:14px">🛠️ Agent Execution Ledger (Capa 1) <span style="background:'+ledgerColor+';color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">'+(ar.runs.length||0)+' runs</span></summary>';
      if(!ar.runs || ar.runs.length===0){
        html += '<p class="empty">Sin runs de agent:* aun. Inicia un T-NNN con <code>npm run agent:start -- --feature &lt;slug&gt; --task &lt;T-NNN&gt; --agent &lt;yo&gt;</code>.</p>';
      } else {
        html += '<div class="agent-runs-list">';
        ar.runs.forEach(function(run){
          var col = statusColor[run.status] || '#6B7280';
          var reviews = (ar.reviewsByRun||{})[run.run_uuid] || [];
          html += '<div class="agent-run-row" style="border-left:3px solid '+col+'">';
          html += '<div class="agent-run-head"><code>'+esc(run.feature)+'</code> · <code>'+esc(run.task_id)+'</code> <span class="agent-run-status" style="background:'+col+';color:#fff">'+esc(run.status)+'</span></div>';
          html += '<div class="agent-run-meta">implementer: <code>'+esc(run.agent)+'</code> · started '+esc(run.started_at||'')+(run.finished_at?(' · finished '+esc(run.finished_at)):'')+'</div>';
          if(reviews.length){
            html += '<div class="agent-run-reviews">';
            reviews.forEach(function(rv){
              var rcol = rv.result==='pass'?'#16A34A':(rv.result==='concerns'?'#D97706':'#DC2626');
              var fc = rv.findings_count||{blocker:0,major:0,minor:0};
              html += '<span class="agent-review-chip" style="border-color:'+rcol+';color:'+rcol+'" title="reviewer: '+esc(rv.reviewer_agent)+'">'+esc(rv.stage)+': '+esc(rv.result)+(fc.blocker?(' ✗'+fc.blocker):'')+(fc.major?(' ⚠'+fc.major):'')+'</span>';
            });
            html += '</div>';
          }
          html += '</div>';
        });
        html += '</div>';
      }
      html += '<div class="agent-ledger-help">Flujo: <code>npm run agent:protocol</code> → <code>agent:start</code> → trabajo TDD → <code>agent:review --stage both --reviewer &lt;otro&gt;</code> → <code>agent:finish</code>. Reviewer ≠ implementer (Principio 1).</div>';
      html += '</details>';
    } else if (ar && ar.schema_missing){
      html += '<div class="roadmap-section"><h4>🛠️ Agent Execution Ledger</h4><p class="empty">Las 3 tablas SQLite (ai_task_runs / ai_task_reviews / ai_task_review_findings) aun no existen. Corre <code>npm run memory:bootstrap</code> tras actualizar a v12.122+.</p></div>';
    }
    // v12.56: tarjeta de Next Action (roadmap:next) prominente.
    var nx = ROADMAP_STATE.next;
    if(nx && !nx.error){
      var readinessColor = nx.agent_readiness === 'ready_for_ai' ? '#16A34A' : (nx.agent_readiness === 'needs_human' ? '#D97706' : '#DC2626');
      html += '<div class="roadmap-section" style="border-left:4px solid '+readinessColor+'">';
      html += '<h4>→ Siguiente accion segura para el agente <span style="background:'+readinessColor+';color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">'+esc(nx.agent_readiness)+'</span></h4>';
      html += '<div style="font-size:14px;font-weight:600;color:var(--accent);margin-bottom:6px">'+esc(nx.next_action)+'</div>';
      if(nx.feature) html += '<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Feature target: <code>'+esc(nx.feature)+'</code> · Fase '+nx.phase+'</div>';
      if(nx.allowed_actions && nx.allowed_actions.length){
        html += '<div style="margin-top:8px"><strong style="font-size:11px;color:#16A34A">✓ Puedes hacer:</strong><ul style="margin:4px 0 4px 20px;font-size:11.5px">';
        nx.allowed_actions.slice(0,5).forEach(function(a){ html += '<li>'+esc(a)+'</li>'; });
        html += '</ul></div>';
      }
      if(nx.forbidden_actions && nx.forbidden_actions.length){
        html += '<div style="margin-top:6px"><strong style="font-size:11px;color:#DC2626">✗ NO puedes hacer:</strong><ul style="margin:4px 0 4px 20px;font-size:11.5px;color:var(--muted)">';
        nx.forbidden_actions.slice(0,3).forEach(function(a){ html += '<li>'+esc(a)+'</li>'; });
        html += '</ul></div>';
      }
      if(nx.must_read && nx.must_read.length){
        html += '<div style="margin-top:6px"><strong style="font-size:11px">📖 Lee primero:</strong><ul style="margin:4px 0 4px 20px;font-size:11.5px;font-family:var(--mono)">';
        nx.must_read.slice(0,4).forEach(function(r){ html += '<li>'+esc(r)+'</li>'; });
        html += '</ul></div>';
      }
      if(nx.commands_to_run && nx.commands_to_run.length){
        html += '<div style="margin-top:6px"><strong style="font-size:11px">$ Comandos sugeridos (en orden):</strong><pre style="background:#0F172A;color:#E2E8F0;padding:8px 12px;border-radius:4px;font-size:11px;margin-top:4px;overflow-x:auto">';
        nx.commands_to_run.forEach(function(c){ html += esc(c)+'\n'; });
        html += '</pre></div>';
      }
      html += '</div>';
    }
    // Bloqueadores.
    if(st.blockers && st.blockers.length){
      html += '<div class="roadmap-section"><h4>⚠ Bloqueadores activos ('+st.blockers.length+')</h4>';
      st.blockers.forEach(function(b){ html += '<div class="blocker-item">'+esc(b)+'</div>'; });
      html += '</div>';
    }
    // Siguiente accion recomendada.
    if(st.nextAction && st.nextAction.length){
      html += '<div class="roadmap-section"><h4>→ Siguiente accion recomendada</h4>';
      st.nextAction.forEach(function(a){ html += '<div class="next-action">'+esc(a)+'</div>'; });
      html += '</div>';
    }
    // v12.70: los comandos universales + el historial de ejecuciones viven en la
    // pestana Acciones (Ejecutar / Historial). Aqui solo dejamos un acceso directo.
    html += '<div class="roadmap-section"><h4>🛠 Comandos y ejecucion</h4><p class="empty">Ejecuta cualquier comando del catalogo y revisa el historial de ejecuciones en la pestana <a data-goto-actions style="cursor:pointer;color:var(--accent);text-decoration:underline;font-weight:600">Acciones</a> (subpestanas Ejecutar e Historial).</p></div>';
    el('roadmap-host').innerHTML = html;
    // Click handlers.
    var ga = el('roadmap-host').querySelector('[data-goto-actions]'); if(ga) ga.addEventListener('click', function(){ showTab('actions'); showSubtab('run'); });
    // v12.139: click en un segmento de fase -> scroll a sus pendientes + highlight breve.
    var segs = el('roadmap-host').querySelectorAll('[data-goto-phase]');
    for(var si=0; si<segs.length; si++){ segs[si].addEventListener('click', function(ev){ var ph = ev.currentTarget.getAttribute('data-goto-phase'); var tgt = el('pend-phase-'+ph); if(tgt){ tgt.scrollIntoView({behavior:'smooth', block:'center'}); tgt.style.transition='background .3s'; var ob=tgt.style.background; tgt.style.background='var(--brand-light)'; setTimeout(function(){ tgt.style.background=ob; }, 1200); } }); }
    document.querySelectorAll('.phase-card').forEach(function(c){ c.addEventListener('click', function(){ document.querySelectorAll('.phase-card').forEach(function(x){x.classList.remove('selected')}); c.classList.add('selected'); var pid = c.getAttribute('data-phase'); if(pid !== null) loadPhaseContract(pid); }); });
  }
  // v12.58/v12.59: cargar contrato + status de ejecucion (cruce con BD ai_action_runs).
  function loadPhaseContract(phaseId){
    Promise.all([
      fetch('/api/roadmap/contract/' + phaseId).then(function(r){return r.json();}),
      fetch('/api/roadmap/contract-status/' + phaseId).then(function(r){return r.json();}).catch(function(){return null;})
    ]).then(function(arr){ renderPhaseContract(arr[0], arr[1]); }).catch(function(){ var pc=el('phase-contract-panel'); if(pc) pc.innerHTML='<p class="empty">No se pudo cargar el contrato.</p>'; });
  }
  function renderPhaseContract(c, statusData){
    var panel = el('phase-contract-panel');
    if(!panel) return;
    if(c.error){ panel.innerHTML = '<p class="empty">'+esc(c.error)+'</p>'; return; }
    // Mapa comando -> estado de ejecucion (passed/failed/never) desde la BD.
    var execMap = {};
    if(statusData && statusData.validations){ statusData.validations.forEach(function(v){ execMap[v.command] = v; }); }
    var html = '<div class="contract-card">';
    html += '<div class="contract-head"><strong>Contrato de ejecucion — Fase '+c.id+'</strong> <span class="contract-name">'+esc(c.name)+'</span></div>';
    html += '<div class="contract-objective">'+esc(c.objective)+'</div>';
    function sect(icon,title,items,cls){
      var h = '<div class="contract-section '+cls+'"><h5>'+icon+' '+title+'</h5><ul>';
      (items||[]).forEach(function(it){ h += '<li>'+esc(it)+'</li>'; });
      return h + '</ul></div>';
    }
    // v12.59: seccion 'Debe validar' con check de ejecucion desde la BD inteligente.
    function sectValidate(items){
      var legendTitle = 'El estado viene de la BD ai_action_runs: solo se registran corridas via el panel (Acciones), el agente, npm run validate o el git hook. Las corridas sueltas en terminal (npm run check:all) NO se registran.';
      var h = '<div class="contract-section validate"><h5>🔍 Debe validar <span class="exec-legend" title="'+esc(legendTitle)+'">(✓ registrado · ◦ sin registro · ⚠ fallo) ⓘ</span></h5><ul>';
      (items||[]).forEach(function(it){
        var v = execMap[it];
        var badge = '';
        if(v){
          if(v.status==='passed'){ badge = '<span class="exec-badge ok" title="ultima corrida registrada OK: '+esc(v.last_run||'')+'">✓ registrado</span>'; }
          else if(v.status==='failed'){ badge = '<span class="exec-badge fail" title="exit '+v.last_exit_code+' en la ultima corrida registrada">⚠ fallo (exit '+v.last_exit_code+')</span>'; }
          else { badge = '<span class="exec-badge never" title="sin corridas registradas (puede haberse ejecutado en terminal sin registrarse)">◦ sin registro</span>'; }
        } else { badge = '<span class="exec-badge never" title="sin corridas registradas (puede haberse ejecutado en terminal sin registrarse)">◦ sin registro</span>'; }
        h += '<li>'+esc(it)+' '+badge+'</li>';
      });
      return h + '</ul></div>';
    }
    html += '<div class="contract-grid">';
    html += sect('✓','Puede hacer', c.puede, 'allowed');
    html += sect('✗','NO puede hacer', c.noPuede, 'forbidden');
    html += sect('📖','Debe leer', c.debeLeer, 'read');
    html += sect('✏','Debe actualizar', c.debeActualizar, 'update');
    html += sectValidate(c.debeValidar);
    html += sect('📤','Debe entregar', c.debeEntregar, 'deliver');
    html += '</div>';
    if(statusData && statusData.summary){ html += '<div class="contract-exec-summary">Corridas registradas: <strong>'+statusData.summary.passed+'/'+statusData.summary.total+'</strong> OK · '+statusData.summary.never+' sin registro <span title="registro = panel/agente/npm run validate/git hook; las corridas en terminal no cuentan">ⓘ</span> (BD ai_action_runs)</div>'; }
    if(c.gates && c.gates.length){ html += '<div class="contract-gates"><strong>Gates de la fase:</strong> '+c.gates.map(function(g){return '<code>'+esc(g)+'</code>'}).join(', ')+'</div>'; }
    html += '</div>';
    panel.innerHTML = html;
    panel.scrollIntoView({behavior:'smooth', block:'nearest'});
  }
  // Refresh button del roadmap.
  setTimeout(function(){ var rr=el('roadmap-refresh'); if(rr) rr.addEventListener('click', loadRoadmap); }, 0);
  setTimeout(function(){ var fr=el('files-refresh'); if(fr) fr.addEventListener('click', function(){ FILES_TREE=null; loadFilesTree(); }); var ff=el('files-filter'); if(ff) ff.addEventListener('input', function(){ if(FILES_TREE) renderFilesTree(); }); var ffs=el('files-fullscreen'); if(ffs) ffs.addEventListener('click', toggleFilesFullscreen); var ftt=el('files-tree-toggle'); if(ftt) ftt.addEventListener('click', toggleFilesTree); var fv=el('files-viewer'); if(fv) fv.addEventListener('click', function(ev){ var a=ev.target.closest && ev.target.closest('.md-body a[href]'); if(!a) return; var href=a.getAttribute('href')||''; if(/^(https?:|mailto:|tel:)/i.test(href)) return; if(href.charAt(0)==='#') return; ev.preventDefault(); var rp=resolveRel(CURRENT_FILE, href); if(rp) openFile(rp); }); var ar=el('agents-refresh'); if(ar) ar.addEventListener('click', loadAgents); var ap=el('agents-prune'); if(ap) ap.addEventListener('click', function(){ postLocks('/api/locks/release',{prune:true}).then(function(){ loadAgents(); }); }); var aid=el('agent-id'); if(aid) aid.addEventListener('change', function(){ localStorage.setItem('spdd-agent-id', aid.value.trim()); }); }, 0);
  function toggleFilesFullscreen(){ var p=el('pane-files'); if(!p) return; var on=p.classList.toggle('fs-mode'); var b=el('files-fullscreen'); if(b) b.textContent = on ? '⛶ Salir de pantalla completa' : '⛶ Pantalla completa'; document.body.classList.toggle('fs-lock', on); }
  function toggleFilesTree(){ var lay=document.querySelector('#pane-files .files-layout'); if(!lay) return; var off=lay.classList.toggle('tree-collapsed'); var b=el('files-tree-toggle'); if(b) b.textContent = off ? '⮞ Mostrar arbol' : '⮜ Ocultar arbol'; }
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ var p=el('pane-files'); if(p && p.classList.contains('fs-mode')) toggleFilesFullscreen(); } });
  document.addEventListener('click', function(e){ var t = e.target.closest('.tab'); if(t) showTab(t.dataset.tab); var st = e.target.closest('.subtab[data-subtab]'); if(st) showSubtab(st.dataset.subtab); var ts = e.target.closest('[data-trace-sub]'); if(ts) showTraceSub(ts.dataset.traceSub); });
  // v12.140: command palette (Ctrl/Cmd-K) — navegacion rapida a pestanas y fases (P2).
  (function(){ var bg=el('cmdk-bg'), inp=el('cmdk-input'), list=el('cmdk-list'); if(!bg||!inp||!list) return; var items=[], filtered=[], sel=0;
    function build(){ items=[]; var tabs=document.querySelectorAll('.tab'); for(var i=0;i<tabs.length;i++){ (function(tb){ items.push({ label:'Ir a: '+tb.textContent.trim(), kind:'tab', run:function(){ showTab(tb.dataset.tab); } }); })(tabs[i]); } for(var p=0;p<=8;p++){ (function(ph){ items.push({ label:'Roadmap -> Fase '+ph, kind:'fase', run:function(){ showTab('roadmap'); setTimeout(function(){ var t=el('pend-phase-'+ph); if(t) t.scrollIntoView({behavior:'smooth',block:'center'}); }, 250); } }); })(p); }
      // UX-3: indexar contenido (RFs, gates, docs, decisiones) para "buscar cualquier cosa" desde Ctrl/K.
      var M = MEM || window.__MEMORY__; if(M){
        var seenRf={}; (M.traceLinks||[]).forEach(function(x){ var rf=x.source_ref; if(!rf||seenRf[rf])return; seenRf[rf]=1; items.push({ label:'RF: '+rf, kind:'trace', run:function(){ showTab('trace'); if(typeof showTraceSub==='function') showTraceSub('links'); gotoFilter('tbl-trace', rf); } }); });
        var seenG={}; (M.gateRuns||[]).forEach(function(x){ var g=x.gate; if(!g||seenG[g])return; seenG[g]=1; items.push({ label:'Gate: '+g, kind:'gate', run:function(){ showTab('gates'); gotoFilter('tbl-gates', g); } }); });
        (M.documents||[]).forEach(function(x){ (function(p){ if(!p)return; items.push({ label:'Doc: '+p, kind:'doc', run:function(){ showTab('docs'); } }); })(x.path); });
        (M.decisions||[]).forEach(function(x){ (function(d){ if(!d)return; items.push({ label:'Decision: '+d, kind:'decision', run:function(){ showTab('decisions'); } }); })(x.decision_ref||x.title); });
      }
    }
    function render(){ var q=inp.value.toLowerCase(); filtered = items.filter(function(it){ return it.label.toLowerCase().indexOf(q)>=0; }); if(sel>=filtered.length) sel=0; if(!filtered.length){ list.innerHTML='<li class="cmdk-empty">Sin coincidencias</li>'; return; } var h=''; filtered.forEach(function(it,i){ h+='<li role="option" data-i="'+i+'" class="'+(i===sel?'sel':'')+'">'+esc(it.label)+'<span class="cmdk-kind">'+esc(it.kind)+'</span></li>'; }); list.innerHTML=h; }
    function openP(){ build(); inp.value=''; sel=0; render(); bg.classList.add('show'); setTimeout(function(){ inp.focus(); }, 0); }
    function closeP(){ bg.classList.remove('show'); }
    function exec(){ var it=filtered[sel]; if(it){ closeP(); it.run(); } }
    document.addEventListener('keydown', function(e){ if((e.ctrlKey||e.metaKey) && (e.key==='k'||e.key==='K')){ e.preventDefault(); if(bg.classList.contains('show')) closeP(); else openP(); return; } if(!bg.classList.contains('show')) return; if(e.key==='Escape'){ closeP(); } else if(e.key==='ArrowDown'){ sel=Math.min(sel+1,filtered.length-1); render(); e.preventDefault(); } else if(e.key==='ArrowUp'){ sel=Math.max(sel-1,0); render(); e.preventDefault(); } else if(e.key==='Enter'){ exec(); e.preventDefault(); } });
    inp.addEventListener('input', render);
    list.addEventListener('click', function(e){ var li=e.target.closest('li[data-i]'); if(li){ sel=parseInt(li.getAttribute('data-i'),10); exec(); } });
    bg.addEventListener('click', function(e){ if(e.target===bg) closeP(); });
  })();
  // v12.140: filtro local de tablas grandes (P2) via listener delegado.
  document.addEventListener('input', function(e){ var inp = e.target && e.target.closest && e.target.closest('[data-table-filter]'); if(!inp) return; var t = el(inp.getAttribute('data-table-filter')); if(!t) return; var q = (inp.value||'').toLowerCase(); var rows = t.querySelectorAll('tbody tr'); var shown=0; for(var i=0;i<rows.length;i++){ var ok = rows[i].textContent.toLowerCase().indexOf(q)>=0; rows[i].style.display = ok?'':'none'; if(ok) shown++; } var cnt = el(inp.getAttribute('data-table-filter')+'-count'); if(cnt) cnt.textContent = shown+' / '+rows.length; });
  el('search-q').addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });
  el('search-btn').addEventListener('click', doSearch);
  if(el('console-clear')) el('console-clear').addEventListener('click', consoleClear);
  if(el('console-copy')) el('console-copy').addEventListener('click', consoleCopy);
  if(el('console-stop')) el('console-stop').addEventListener('click', stopAction);
  // v12.140: tema claro/oscuro persistido (localStorage) con fallback a prefers-color-scheme.
  (function(){ function applyTheme(t){ if(t==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme'); } var saved=null; try{ saved=localStorage.getItem('aif-theme'); }catch(e){} var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; applyTheme(saved || (sysDark?'dark':'light')); var tb=el('theme-toggle'); if(tb) tb.addEventListener('click', function(){ var dark = document.documentElement.getAttribute('data-theme')==='dark'; var next = dark?'light':'dark'; applyTheme(next); try{ localStorage.setItem('aif-theme', next); }catch(e){} }); })();
  // v12.140: badge de modo en el header (live = datos en vivo via memory-serve; static = reporte).
  (function(){ var mb=el('mode-badge'); if(mb){ var live = MODE==='live'; mb.textContent = live?'live':'static'; mb.className = 'mode-badge '+(live?'live':'static'); mb.title = live?'Datos en vivo (memory-serve): acciones y refresco disponibles':'Reporte estatico: solo metadata, sin acciones'; } })();
  // v12.140: accesibilidad de las pestanas (ARIA tablist/tab/tabpanel + roving tabindex + flechas).
  (function(){ var tl = document.querySelector('.nav'); if(tl){ tl.setAttribute('role','tablist'); tl.setAttribute('aria-orientation','vertical'); tl.setAttribute('aria-label','Secciones del panel'); } var tabs = document.querySelectorAll('.tab'); for(var i=0;i<tabs.length;i++){ var on = tabs[i].classList.contains('active'); tabs[i].setAttribute('role','tab'); tabs[i].setAttribute('aria-selected', on?'true':'false'); tabs[i].setAttribute('tabindex', on?'0':'-1'); } var panes = document.querySelectorAll('.pane'); for(var j=0;j<panes.length;j++){ panes[j].setAttribute('role','tabpanel'); panes[j].setAttribute('tabindex','0'); } if(tl) tl.addEventListener('keydown', function(e){ var fwd = (e.key==='ArrowDown'||e.key==='ArrowRight'), back = (e.key==='ArrowUp'||e.key==='ArrowLeft'); if(!fwd && !back) return; var arr=[].slice.call(document.querySelectorAll('.nav .tab')); var idx=arr.indexOf(document.activeElement); if(idx<0) return; var n = fwd ? (idx+1)%arr.length : (idx-1+arr.length)%arr.length; arr[n].focus(); showTab(arr[n].dataset.tab); e.preventDefault(); }); })();
  if(el('history-refresh')) el('history-refresh').addEventListener('click', loadHistory);
  if(el('stats-refresh')) el('stats-refresh').addEventListener('click', loadStats);
  if(el('trends-refresh')) el('trends-refresh').addEventListener('click', loadTrends);
  ['filter-action','filter-status','filter-since','filter-mode','filter-slow'].forEach(function(id){ var n=el(id); if(n) n.addEventListener('change', loadHistory); });
  ['trend-action','trend-action-b','trend-days'].forEach(function(id){ var n=el(id); if(n) n.addEventListener('change', function(){ writeTrendFiltersToUrl(); loadTrends(); }); });
  // v12.45 (E3): filtro display_status en Trazabilidad/Por feature.
  if(el('trace-ds-filter')) el('trace-ds-filter').addEventListener('change', applyTraceDsFilter);
  if(MODE === 'live'){
    fetch('/api/snapshot').then(function(r){return r.json();}).then(function(d){ MEM=d; renderAll(d); renderPresetButtons(); }).catch(function(){ el('meta').textContent='No se pudo cargar /api/snapshot'; });
  } else {
    renderAll(MEM); renderPresetButtons();
  }
  // v12.28/v12.30/v12.32: si la URL trae filtros, abrir el sub-tab apropiado.
  var __urlParams = new URLSearchParams(window.location.search);
  var __hasActFilters = ['act_action','act_status','act_since','act_mode','act_slow'].some(function(p){ return __urlParams.has(p); });
  var __hasTrendFilters = ['trend_action','trend_days'].some(function(p){ return __urlParams.has(p); });
  var __explicitSubtab = __urlParams.get('act_subtab');
  readFiltersFromUrl();
  if(__explicitSubtab && MODE === 'live'){ showTab('actions'); showSubtab(__explicitSubtab); }
  else if(__hasTrendFilters && MODE === 'live'){ showTab('actions'); showSubtab('trends'); }
  else if(__hasActFilters && MODE === 'live'){ showTab('actions'); showSubtab('history'); }
  else { var __last=null; try{ __last=localStorage.getItem('aif-tab'); }catch(e){} var __valid = __last && document.querySelector('.tab[data-tab="'+__last+'"]'); showTab(__valid ? __last : 'home'); }
  // UX-6: ordenar tablas grandes haciendo click en el encabezado (solo tablas con id, p.ej. trace/gates).
  document.addEventListener('click', function(e){ var th = e.target && e.target.closest && e.target.closest('table[id] thead th'); if(!th) return; var tbl = th.closest('table'); var tbody = tbl.tBodies[0]; if(!tbody) return; var idx = Array.prototype.indexOf.call(th.parentNode.children, th); var dir = th.getAttribute('data-sort')==='asc' ? 'desc' : 'asc'; var heads = th.parentNode.children; for(var i=0;i<heads.length;i++){ heads[i].removeAttribute('data-sort'); var oi=heads[i].querySelector('.sort-ind'); if(oi) oi.parentNode.removeChild(oi); } th.setAttribute('data-sort', dir); var rows = Array.prototype.slice.call(tbody.rows); rows.sort(function(a,b){ var x=(a.cells[idx]?a.cells[idx].textContent:'').trim(), y=(b.cells[idx]?b.cells[idx].textContent:'').trim(); var nx=parseFloat(x), ny=parseFloat(y); var cmp; if(!isNaN(nx)&&!isNaN(ny)&&x!==''&&y!=='') cmp=nx-ny; else cmp = x.toLowerCase()<y.toLowerCase()?-1:(x.toLowerCase()>y.toLowerCase()?1:0); return dir==='asc'?cmp:-cmp; }); rows.forEach(function(r){ tbody.appendChild(r); }); var ind=document.createElement('span'); ind.className='sort-ind'; ind.textContent = dir==='asc'?'▲':'▼'; th.appendChild(ind); });
  // v12.141: click en una ruta clicable -> abrir el archivo en la pestaña Proyecto.
  document.addEventListener('click', function(e){ var a = e.target && e.target.closest && e.target.closest('[data-open-file]'); if(!a) return; e.preventDefault(); var p = a.getAttribute('data-open-file'); showTab('files'); if(typeof openFile==='function') openFile(p); });
  // v12.141 (D): click en un segmento de carpeta del breadcrumb -> filtra el arbol del visor.
  document.addEventListener('click', function(e){ var cr = e.target && e.target.closest && e.target.closest('[data-crumb]'); if(!cr) return; e.preventDefault(); var ff = el('files-filter'); if(ff){ ff.value = cr.getAttribute('data-crumb'); ff.dispatchEvent(new Event('input',{bubbles:true})); ff.scrollIntoView({behavior:'smooth',block:'center'}); } });
})();
