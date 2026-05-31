/* =====================================================================
 * specs/_shared/app-state.js  (v12.61)  — classic script, window.AppState
 *
 * Estado compartido de BAJO NIVEL para prototipos HTML5 (portfolio-spa).
 * Respaldo en localStorage para que la sesion (rol, demo-mode, usuario)
 * SOBREVIVA la navegacion cross-spec con target=_blank entre prototipos
 * — sessionStorage NO se comparte entre pestañas/ventanas nuevas, por eso
 * usamos localStorage (tension D, v12.61).
 *
 * Compatible con file:// (sin import/export). Se carga con:
 *   <script src="../../_shared/app-state.js"></script>
 *
 * API:
 *   AppState.get(key, fallback)
 *   AppState.set(key, value)         -> persiste + notifica suscriptores
 *   AppState.patch(obj)              -> set por lote
 *   AppState.remove(key)
 *   AppState.subscribe(key, fn)      -> devuelve unsubscribe()
 *   AppState.session                 -> helpers de sesion (login/logout/role)
 *
 * REGLA anti-trampa: helper de bajo nivel permitido. NO renderiza UI.
 * ===================================================================== */
(function (global) {
  "use strict";

  var NS = "spdd-proto:"; // prefijo de claves en localStorage
  var listeners = {};     // key -> [fn]
  var memory = {};        // fallback si localStorage no esta disponible (file:// estricto)
  var hasLS = (function () {
    try {
      var k = NS + "__t";
      global.localStorage.setItem(k, "1");
      global.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  function readRaw(key) {
    if (hasLS) return global.localStorage.getItem(NS + key);
    return key in memory ? memory[key] : null;
  }
  function writeRaw(key, raw) {
    if (hasLS) { if (raw == null) global.localStorage.removeItem(NS + key); else global.localStorage.setItem(NS + key, raw); }
    else { if (raw == null) delete memory[key]; else memory[key] = raw; }
  }

  function get(key, fallback) {
    var raw = readRaw(key);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return raw; }
  }

  function notify(key, value) {
    (listeners[key] || []).forEach(function (fn) {
      try { fn(value, key); } catch (e) { /* aislar errores de suscriptores */ }
    });
  }

  function set(key, value) {
    writeRaw(key, JSON.stringify(value));
    notify(key, value);
    return value;
  }

  function patch(obj) {
    Object.keys(obj || {}).forEach(function (k) { set(k, obj[k]); });
    return obj;
  }

  function remove(key) {
    writeRaw(key, null);
    notify(key, undefined);
  }

  function subscribe(key, fn) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(fn);
    return function unsubscribe() {
      listeners[key] = (listeners[key] || []).filter(function (f) { return f !== fn; });
    };
  }

  // Propaga cambios entre pestañas/ventanas abiertas (cross-spec real).
  if (hasLS && global.addEventListener) {
    global.addEventListener("storage", function (ev) {
      if (!ev.key || ev.key.indexOf(NS) !== 0) return;
      var key = ev.key.slice(NS.length);
      var value;
      try { value = ev.newValue == null ? undefined : JSON.parse(ev.newValue); } catch (e) { value = ev.newValue; }
      notify(key, value);
    });
  }

  // Helpers de sesion (rol/usuario/demo-mode compartidos entre prototipos).
  var session = {
    login: function (user) { return set("session.user", user || { name: "Demo", role: "viewer" }); },
    logout: function () { remove("session.user"); },
    current: function () { return get("session.user", null); },
    isAuthenticated: function () { return get("session.user", null) != null; },
    role: function () { var u = get("session.user", null); return u ? u.role : null; },
    setDemoMode: function (on) { return set("session.demoMode", !!on); },
    isDemoMode: function () { return get("session.demoMode", false); },
  };

  global.AppState = {
    get: get,
    set: set,
    patch: patch,
    remove: remove,
    subscribe: subscribe,
    session: session,
    _backend: hasLS ? "localStorage" : "memory",
  };
})(typeof window !== "undefined" ? window : this);
