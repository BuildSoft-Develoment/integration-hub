// report.client.js — cliente del REPORTE ESTATICO (memory-report.html).
// Autocontenido y de SOLO LECTURA: no hace fetch, no tiene pestañas ni acciones.
// Lee el snapshot embebido (window.__MEMORY__) + estado del roadmap embebido en
// generacion (window.__ROADMAP__ = roadmap-status --json, window.__PENDING__ =
// roadmap-pending --json). Si el roadmap no esta disponible, degrada a KPIs.
// Es deliberadamente INDEPENDIENTE de panel.client.js (el front del live), para
// que el live pueda evolucionar sin atar al reporte.
(function(){
  var MEM = window.__MEMORY__ || {};
  var RM = window.__ROADMAP__ || null;
  var PEND = window.__PENDING__ || null;
  var el = function(id){ return document.getElementById(id); };
  function esc(s){ s = (s==null?'':String(s)); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  // Tema claro/oscuro (misma clave que el live para consistencia).
  (function(){ function apply(t){ if(t==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme'); } var saved=null; try{ saved=localStorage.getItem('aif-theme'); }catch(e){} var sys = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; apply(saved||(sys?'dark':'light')); var tb=el('theme-toggle'); if(tb) tb.addEventListener('click', function(){ var d = document.documentElement.getAttribute('data-theme')==='dark'; var n = d?'light':'dark'; apply(n); try{ localStorage.setItem('aif-theme', n); }catch(e){} }); })();

  function render(){
    var host = el('report-host'); if(!host) return;
    var s = MEM.stats || {};
    var proj = (RM && RM.project) || MEM.project || '-';
    var tpl  = (RM && RM.templateVersion) || '-';
    var feats = (RM && RM.features) ? RM.features.length : (MEM.features ? MEM.features.length : 0);
    var metaEl = el('meta'); if(metaEl) metaEl.textContent = 'Reporte estatico · ' + (MEM.generatedAt || '') + (MEM.dbPath ? ' · BD: '+MEM.dbPath : '');

    var h = '';
    // Salud por fases (si el roadmap se pudo embeber en generacion).
    if(RM && RM.phases){
      var phs = RM.phases, wsum=0, denom=0, nC=0, nP=0, nNA=0;
      phs.forEach(function(p){ if(p.status==='n-a'){ nNA++; return; } denom++; if(p.status==='complete'){ wsum+=1; nC++; } else if(p.status==='partial'){ wsum+=0.5; nP++; } });
      var pct = denom>0 ? Math.round(wsum/denom*100) : 0;
      var pBlk=0, pGate=0; if(PEND && PEND.phases){ PEND.phases.forEach(function(ph){ (ph.items||[]).forEach(function(it){ if(it.severity==='blocker')pBlk++; else if(it.severity==='gate')pGate++; }); }); }
      h += '<div class="r-hero"><div class="r-pct">'+pct+'%</div><div style="min-width:160px"><div style="font-weight:700;font-size:15px">'+esc(proj)+'</div><div class="muted" style="font-size:12px">template '+esc(tpl)+' · '+feats+' features · '+nC+'/'+denom+' fases completas'+(nP?' · '+nP+' parciales':'')+(nNA?' · '+nNA+' N/A':'')+' · '+pBlk+' blockers · '+pGate+' gates por firmar</div></div><div style="flex:1;min-width:180px"><div class="proj-progress"><div class="proj-progress-fill" style="width:'+pct+'%"></div><span class="proj-progress-label">'+pct+'%</span></div></div></div>';
      h += '<div class="r-section"><h3>Salud por fases</h3><div class="phase-segs">';
      phs.forEach(function(p){ var cls = p.status==='complete'?'complete':(p.status==='partial'?'partial':(p.status==='n-a'?'na':'not-started')); var ic = p.status==='complete'?'✓':(p.status==='partial'?'◐':(p.status==='n-a'?'⊘':'·')); h += '<div class="phase-seg '+cls+'" title="Fase '+p.id+' · '+esc(p.name)+(p.detail?' — '+esc(p.detail):'')+'">'+p.id+' '+ic+'</div>'; });
      h += '</div><p class="muted" style="font-size:11px;margin-top:4px">verde=completa · ámbar=parcial · gris=sin empezar · rayado=N/A</p></div>';
    } else {
      h += '<div class="r-hero"><div style="min-width:200px"><div style="font-weight:700;font-size:15px">'+esc(proj)+'</div><div class="muted" style="font-size:12px">Snapshot de la BD del agente. El estado del roadmap no se pudo embeber; se muestran indicadores del snapshot.</div></div></div>';
    }

    // KPIs (siempre, del snapshot).
    h += '<div class="r-section"><h3>Indicadores</h3><div class="r-grid">';
    [['Trace links',s.traceLinks],['Gates',s.gateRuns],['Documentos',s.documents],['Evidencia',s.evidence],['Decisiones',s.decisions],['Preguntas',s.openQuestions]].forEach(function(k){ h += '<div class="r-kpi"><div class="r-kpi-v">'+esc(k[1]==null?0:k[1])+'</div><div class="r-kpi-l">'+esc(k[0])+'</div></div>'; });
    h += '</div></div>';

    // Pendientes por fase (si se embebio).
    if(PEND && PEND.phases){
      var pb=0,pg=0,pi=0; PEND.phases.forEach(function(ph){ (ph.items||[]).forEach(function(it){ if(it.severity==='blocker')pb++; else if(it.severity==='gate')pg++; else pi++; }); });
      h += '<div class="r-section"><h3>Pendientes por fase <span class="muted" style="font-weight:400;font-size:12px">('+pb+' blocker · '+pg+' gate · '+pi+' info)</span></h3>';
      PEND.phases.forEach(function(ph){
        if(ph.na){ h += '<div class="r-ph muted">Fase '+ph.phase+' ('+esc(ph.name)+') — ⊘ N/A (reingenieria)</div>'; return; }
        if(!ph.items || !ph.items.length){ h += '<div class="r-ph" style="color:var(--ok)">Fase '+ph.phase+' ('+esc(ph.name)+') — ✓ sin pendientes</div>'; return; }
        h += '<div class="r-ph"><strong>Fase '+ph.phase+' ('+esc(ph.name)+')</strong><ul>';
        ph.items.forEach(function(it){ var ic = it.severity==='blocker'?'✗':(it.severity==='gate'?'🔒':'◦'); var col = it.severity==='blocker'?'var(--danger)':(it.severity==='gate'?'var(--warn)':'var(--muted)'); h += '<li style="color:'+col+'">'+ic+' <span class="muted">['+esc(it.kind)+']</span> <code>'+esc(it.item)+'</code> — '+esc(it.detail)+'</li>'; });
        h += '</ul></div>';
      });
      h += '<p class="muted" style="font-size:11px">✗ blocker (el agente puede resolver) · 🔒 gate (firma humana) · ◦ info (sin corrida registrada). Fuente: <code>npm run roadmap:pending</code></p></div>';
    }

    h += '<p class="muted" style="font-size:11px;margin-top:18px">Reporte estatico autocontenido (no requiere servidor). Para acciones, ejecucion, trazabilidad detallada y exploracion interactiva, abre el panel en vivo: <code>npm run memory:serve</code>.</p>';
    host.innerHTML = h;
  }
  render();
})();
