/* =====================================================================
 * specs/_shared/ui.js  (v12.61)  — classic script, window.UI
 *
 * Primitivas de UI de BAJO NIVEL para prototipos HTML5 (portfolio-spa):
 * toasts, modal, formateadores, estados (skeleton/empty/error). Usa las
 * clases definidas en _shared/tokens.css (.u-toast, .u-modal, etc).
 *
 * IMPORTANTE (anti-trampa): esto NO es un renderer generico de dominio.
 * No define el layout, ni las vistas, ni los datos de ninguna feature.
 * Cada spec construye SU propia UI de dominio y usa estas primitivas
 * solo para feedback transversal. El validador check-prototype-visible-product
 * bloquea renderers genericos unicos (mini-app/app-renderer/ui-factory/
 * render-all/app-shell); este archivo se llama "ui.js" a proposito y solo
 * expone helpers.
 *
 * Compatible con file:// (sin import/export). Se carga con:
 *   <script src="../../_shared/ui.js"></script>
 * ===================================================================== */
(function (global) {
  "use strict";

  var doc = global.document;

  // ── Toast ───────────────────────────────────────────────────────────
  function toastHost() {
    var host = doc.querySelector(".u-toast-host");
    if (!host) {
      host = doc.createElement("div");
      host.className = "u-toast-host";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      doc.body.appendChild(host);
    }
    return host;
  }

  function toast(message, kind, ms) {
    var el = doc.createElement("div");
    el.className = "u-toast" + (kind ? " u-toast--" + kind : "");
    el.textContent = message;
    toastHost().appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity var(--dur) var(--ease)";
      el.style.opacity = "0";
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }, ms || 2600);
    return el;
  }

  // ── Modal ───────────────────────────────────────────────────────────
  function modal(opts) {
    opts = opts || {};
    var backdrop = doc.createElement("div");
    backdrop.className = "u-modal-backdrop";
    var box = doc.createElement("div");
    box.className = "u-modal";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    if (opts.title) {
      var h = doc.createElement("h3");
      h.textContent = opts.title;
      box.appendChild(h);
    }
    if (opts.html) box.insertAdjacentHTML("beforeend", opts.html);
    else if (opts.text) { var p = doc.createElement("p"); p.textContent = opts.text; box.appendChild(p); }
    backdrop.appendChild(box);

    function close() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      doc.removeEventListener("keydown", onKey);
      if (typeof opts.onClose === "function") opts.onClose();
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    backdrop.addEventListener("click", function (e) { if (e.target === backdrop) close(); });
    doc.addEventListener("keydown", onKey);
    doc.body.appendChild(backdrop);
    return { el: box, close: close };
  }

  // ── Estados transversales (devuelven HTML, NO layout de dominio) ─────
  function skeleton(rows) {
    var n = rows || 3;
    var out = "";
    for (var i = 0; i < n; i += 1) {
      out += '<div class="u-skeleton" style="height:18px;margin:8px 0;"></div>';
    }
    return out;
  }
  function empty(message) {
    return '<div class="u-empty"><strong>Sin resultados</strong><span>' + (message || "No hay datos para mostrar.") + "</span></div>";
  }
  function errorState(message, retryLabel) {
    return '<div class="u-error"><strong>Algo salio mal</strong><span>' +
      (message || "No se pudo cargar.") + "</span>" +
      (retryLabel ? '<button class="u-btn u-btn--primary" data-retry>' + retryLabel + "</button>" : "") +
      "</div>";
  }

  // ── Formateadores ───────────────────────────────────────────────────
  function currency(n, code) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: code || "USD" }).format(n); }
    catch (e) { return String(n); }
  }
  function number(n) {
    try { return new Intl.NumberFormat().format(n); } catch (e) { return String(n); }
  }
  function date(value) {
    try { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
    catch (e) { return String(value); }
  }
  function relativeDate(value) {
    var diff = (Date.now() - new Date(value).getTime()) / 1000;
    var units = [["año", 31536000], ["mes", 2592000], ["d", 86400], ["h", 3600], ["min", 60]];
    for (var i = 0; i < units.length; i += 1) {
      var v = Math.floor(diff / units[i][1]);
      if (v >= 1) return "hace " + v + " " + units[i][0];
    }
    return "ahora";
  }

  // ── Helper de DOM minimo (azucar, no framework) ─────────────────────
  function qs(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

  global.UI = {
    toast: toast,
    modal: modal,
    skeleton: skeleton,
    empty: empty,
    errorState: errorState,
    fmt: { currency: currency, number: number, date: date, relativeDate: relativeDate },
    qs: qs,
    qsa: qsa,
    on: on,
  };
})(typeof window !== "undefined" ? window : this);
