/* =====================================================================
 * specs/_shared/nav.js  (v12.85)  — classic script, window.SharedNav
 *
 * Sidebar / menu de navegacion COMPARTIDO para prototipos en modo
 * portfolio-spa. Centraliza el menu del producto (una sola fuente), hace el
 * cross-link entre los prototipos de cada feature y propaga CONTEXTO
 * (entidad seleccionada, rol, demo-mode) entre specs.
 *
 * Es un helper de NAVEGACION de bajo nivel (permitido por la regla anti-trampa:
 * tokens/toast/modal/mock-api/app-state/NAV). NO es un renderer generico de
 * dominio: solo pinta el chrome de navegacion (links + activo + volver), nunca
 * las tablas/forms/datos de la feature (eso vive en el index.html de cada feature).
 *
 * Fuente de los items (en orden de prioridad):
 *   1. opts.items  (array [{slug,label,icon,roles?,badge?}])
 *   2. window.SPDD_NAV_ITEMS  (definido en _shared/nav-items.js — manifiesto unico)
 *
 * Uso en el index.html de una feature (lo cablea scaffold:prototype --mode portfolio-spa):
 *   <link rel="stylesheet" href="../../_shared/tokens.css">
 *   <script src="../../_shared/app-state.js"></script>
 *   <script src="../../_shared/nav-items.js"></script>
 *   <script src="../../_shared/nav.js"></script>
 *   <div id="spdd-nav"></div>
 *   <script>SharedNav.mount('#spdd-nav', { active: '002-mi-feature', brand: 'MiApp' });</script>
 *
 * NAVEGACION CON CONTEXTO (cross-spec, v12.85):
 *   // En la feature origen, al hacer click en un registro:
 *   SharedNav.go('003-donaciones', { focus: miembro.id, entity: 'miembro', label: miembro.nombre });
 *   // En la feature destino, al cargar:
 *   var ctx = SharedNav.context();  // { focus, entity, label, from, fromLabel }
 *   if (ctx.focus) { ...filtra/abre el detalle de ctx.focus... }
 * El breadcrumb "← Volver a <feature origen>" se pinta solo a partir de ?from=.
 *
 * GUARDS POR ROL (v12.85): un item con `roles:['admin']` solo se muestra al rol
 * activo (AppState.session.role()). Sin sesion (demo) se muestran todos.
 * BADGES (v12.85): `badge: 3` (estatico) o `badge: { state:'clave' }` (lee AppState).
 * ===================================================================== */
(function (global) {
  "use strict";
  var doc = global.document;
  var CTX_KEY = "spa.nav.context"; // contexto cross-spec persistido en AppState

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function AS() { return global.AppState || null; }

  function items(opts) {
    if (opts && Array.isArray(opts.items)) return opts.items;
    if (Array.isArray(global.SPDD_NAV_ITEMS)) return global.SPDD_NAV_ITEMS;
    return [];
  }

  function urlParams() {
    return new URLSearchParams(global.location ? global.location.search : "");
  }

  // Rol activo: fuente unica = AppState; fallback = ?role= (primer salto cross-window).
  function activeRole() {
    var s = AS();
    if (s && s.session && s.session.role()) return s.session.role();
    return urlParams().get("role") || null;
  }

  // demo-mode: fuente unica = AppState; fallback = ?demo-mode= (primer salto).
  function isDemoMode() {
    var s = AS();
    if (s && s.session && typeof s.session.isDemoMode === "function" && s.session.isDemoMode()) return true;
    return urlParams().get("demo-mode") === "true";
  }

  // ¿el rol activo puede ver este item? Sin `roles` declarado -> visible siempre.
  // Sin rol activo (demo / sin sesion) -> visible (no escondemos en modo demo).
  function roleAllows(it) {
    if (!it || !Array.isArray(it.roles) || it.roles.length === 0) return true;
    var role = activeRole();
    if (!role) return true;
    return it.roles.indexOf(role) !== -1;
  }

  function badgeValue(it) {
    if (it == null || it.badge == null) return null;
    if (typeof it.badge === "number" || typeof it.badge === "string") return it.badge;
    if (typeof it.badge === "object" && it.badge.state) {
      var s = AS();
      return s ? s.get(it.badge.state, null) : null;
    }
    return null;
  }

  // Query de contexto que se propaga al navegar por el menu (rol/demo-mode + from).
  function contextQuery(active) {
    var q = new URLSearchParams();
    q.set("from", active || "nav");
    var role = activeRole();
    if (role) q.set("role", role);
    if (isDemoMode()) q.set("demo-mode", "true");
    return "?" + q.toString();
  }

  function hrefFor(slug, query) {
    return "../../" + slug + "/prototype-html5/index.html" + (query || "");
  }

  /**
   * Navega a otra feature propagando CONTEXTO de entidad (cross-spec, v12.85).
   * Persiste el contexto en AppState (sobrevive target=_blank) y lo refleja en
   * la URL para que la feature destino pueda leerlo con SharedNav.context().
   * @param {string} slug      feature destino (ej. '003-donaciones').
   * @param {object} [ctx]     { focus, entity, label, from, ...extra }.
   */
  function go(slug, ctx) {
    ctx = ctx || {};
    var from = ctx.from || currentSlug();
    var payload = { focus: ctx.focus != null ? ctx.focus : null, entity: ctx.entity || null, label: ctx.label || null, from: from, fromLabel: labelOf(from), ts: Date.now() };
    var s = AS();
    if (s) s.set(CTX_KEY, payload);
    var q = new URLSearchParams();
    q.set("from", from || "nav");
    if (payload.focus != null) q.set("focus", String(payload.focus));
    if (payload.entity) q.set("entity", payload.entity);
    var role = activeRole();
    if (role) q.set("role", role);
    if (isDemoMode()) q.set("demo-mode", "true");
    if (global.location) global.location.href = hrefFor(slug, "?" + q.toString());
  }

  /**
   * Lee el contexto cross-spec con el que se llego a esta feature (v12.85).
   * Combina la URL (?focus,?entity,?from) con el payload en AppState (mas rico).
   * @returns {{focus:*, entity:?string, label:?string, from:?string, fromLabel:?string}}
   */
  function context() {
    var p = urlParams();
    var urlCtx = { focus: p.get("focus"), entity: p.get("entity"), from: p.get("from"), label: null, fromLabel: null };
    var s = AS();
    var stored = s ? s.get(CTX_KEY, null) : null;
    // El payload de AppState manda si coincide el destino del salto (mismo focus).
    if (stored && (urlCtx.focus == null || String(stored.focus) === String(urlCtx.focus))) {
      return {
        focus: urlCtx.focus != null ? urlCtx.focus : stored.focus,
        entity: urlCtx.entity || stored.entity || null,
        label: stored.label || null,
        from: urlCtx.from || stored.from || null,
        fromLabel: stored.fromLabel || labelOf(urlCtx.from) || null,
      };
    }
    urlCtx.fromLabel = labelOf(urlCtx.from);
    return urlCtx;
  }

  function currentSlug() {
    if (!global.location) return null;
    var m = String(global.location.pathname || "").match(/specs\/([^/]+)\/prototype-html5/);
    return m ? m[1] : null;
  }

  function labelOf(slug) {
    if (!slug || slug === "nav" || slug === "hub") return null;
    var list = items({});
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].slug === slug) return list[i].label || slug;
    }
    return slug;
  }

  function ensureStyle() {
    if (!doc || doc.getElementById("snav-style")) return;
    var css = ""
      + ".snav{display:flex;flex-direction:column;gap:2px;padding:var(--sp-3,12px);background:var(--surface,#fff);border-right:1px solid var(--border,#e2e6ec);min-width:200px;max-width:240px;height:100%;box-sizing:border-box;font-family:var(--font-sans,system-ui,sans-serif)}"
      + ".snav-brand{font-weight:700;font-size:var(--fs-lg,1.1rem);color:var(--brand-strong,#2647a6);padding:var(--sp-2,8px) var(--sp-2,8px) var(--sp-4,16px);display:flex;align-items:center;justify-content:space-between;gap:8px}"
      + ".snav-back{display:inline-flex;align-items:center;gap:6px;margin:0 0 8px;padding:6px 10px;border-radius:var(--radius,10px);background:var(--surface-2,#f1f3f6);color:var(--text-muted,#5a6473);text-decoration:none;font-size:var(--fs-xs,.78rem);font-weight:600}"
      + ".snav-back:hover{color:var(--brand-strong,#2647a6)}"
      + ".snav-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}"
      + ".snav-item a{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:var(--radius,10px);color:var(--text,#1c2330);text-decoration:none;font-size:var(--fs-sm,.9rem);font-weight:550;transition:background .12s}"
      + ".snav-item a:hover{background:var(--surface-2,#f1f3f6)}"
      + ".snav-item.active a{background:var(--brand-soft,#eef2ff);color:var(--brand-strong,#2647a6)}"
      + ".snav-ico{width:18px;text-align:center}"
      + ".snav-label{flex:1}"
      + ".snav-badge{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--brand,#3b5bdb);color:#fff;font-size:.7rem;line-height:18px;text-align:center;font-weight:700}"
      + ".snav-hub{margin-top:auto;padding:8px 12px;color:var(--text-muted,#5a6473);text-decoration:none;font-size:var(--fs-xs,.75rem)}"
      + ".snav-hub:hover{color:var(--brand-strong,#2647a6)}"
      + ".snav-toggle{display:none;align-items:center;gap:8px;background:none;border:0;cursor:pointer;font-size:1.3rem;color:var(--brand-strong,#2647a6)}"
      + "@media (max-width:760px){.snav{min-width:0;max-width:none;width:100%;height:auto;border-right:0;border-bottom:1px solid var(--border,#e2e6ec)}.snav-toggle{display:inline-flex}.snav.snav--collapsed .snav-list,.snav.snav--collapsed .snav-back,.snav.snav--collapsed .snav-hub{display:none}}";
    var st = doc.createElement("style");
    st.id = "snav-style";
    st.textContent = css;
    doc.head.appendChild(st);
  }

  /**
   * Monta el sidebar compartido en `target` (selector o elemento).
   * opts: { active:'<slug>', brand:'...', items:[...], hub:true, back:true }
   */
  function mount(target, opts) {
    opts = opts || {};
    if (!doc) return;
    ensureStyle();
    var el = typeof target === "string" ? doc.querySelector(target) : target;
    if (!el) return;
    var list = items(opts).filter(roleAllows);
    var active = opts.active || "";
    var q = contextQuery(active);
    var ctx = context();
    var html = '<nav class="snav" aria-label="Navegacion del producto">';
    if (opts.brand) {
      html += '<div class="snav-brand"><span>' + esc(opts.brand) + "</span>"
        + '<button class="snav-toggle" type="button" aria-label="Menu" data-snav-toggle>☰</button></div>';
    }
    // Breadcrumb "volver" cross-spec: solo si llegamos desde otra feature conocida.
    if (opts.back !== false && ctx.from && ctx.from !== active && ctx.from !== "nav" && ctx.from !== "hub") {
      var backLabel = ctx.fromLabel || labelOf(ctx.from) || ctx.from;
      html += '<a class="snav-back" href="' + esc(hrefFor(ctx.from, q)) + '">← Volver a ' + esc(backLabel) + "</a>";
    }
    html += '<ul class="snav-list">';
    list.forEach(function (it) {
      var isActive = it.slug === active;
      var href = isActive ? "#" : hrefFor(it.slug, q);
      var badge = badgeValue(it);
      html += '<li class="snav-item' + (isActive ? " active" : "") + '">'
        + '<a href="' + esc(href) + '"' + (isActive ? ' aria-current="page"' : "") + ">"
        + (it.icon ? '<span class="snav-ico">' + esc(it.icon) + "</span>" : "")
        + '<span class="snav-label">' + esc(it.label || it.slug) + "</span>"
        + (badge != null && badge !== "" && badge !== 0 ? '<span class="snav-badge">' + esc(badge) + "</span>" : "")
        + "</a></li>";
    });
    html += "</ul>";
    if (opts.hub !== false) html += '<a class="snav-hub" data-hub-link href="../../../prototype/index.html' + q + '">← Hub</a>';
    html += "</nav>";
    el.innerHTML = html;
    // Toggle responsive (movil): colapsa/expande la lista.
    var toggle = el.querySelector("[data-snav-toggle]");
    var navEl = el.querySelector(".snav");
    if (toggle && navEl) {
      navEl.classList.add("snav--collapsed");
      toggle.addEventListener("click", function () { navEl.classList.toggle("snav--collapsed"); });
    }
    return el;
  }

  global.SharedNav = { mount: mount, items: items, go: go, context: context };
})(typeof window !== "undefined" ? window : this);
