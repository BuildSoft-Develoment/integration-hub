/* =====================================================================
 * specs/_shared/mock-api.js  (v12.61)  — classic script, window.MockApi
 *
 * Capa de API simulada de BAJO NIVEL para prototipos HTML5 (modo
 * portfolio-spa). NO contiene datos de dominio: cada spec define sus
 * propios registros y se los pasa a MockApi.resource(records).
 *
 * Compatible con file:// (sin import/export, sin fetch). Se carga con:
 *   <script src="../../_shared/mock-api.js"></script>
 *
 * Provee:
 *   MockApi.delay(ms)            -> Promise que resuelve tras una latencia.
 *   MockApi.maybeFail(rate)      -> Promise que rechaza con prob. rate (demo de error).
 *   MockApi.resource(records, o) -> CRUD en memoria con latencia simulada.
 *   MockApi.config               -> { latency:[min,max], failRate, seed }.
 *
 * REGLA anti-trampa: esto es un helper de bajo nivel (permitido). NO es
 * un renderer generico: no produce HTML ni define el layout del dominio.
 * ===================================================================== */
(function (global) {
  "use strict";

  var config = {
    latency: [180, 520], // rango de latencia simulada (ms)
    failRate: 0,         // 0..1 — probabilidad global de fallo (para demo de error)
    seed: 1,
  };

  // PRNG determinista (mulberry32) para latencias/fallos reproducibles.
  function rng() {
    var t = (config.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function randLatency() {
    var lo = config.latency[0];
    var hi = config.latency[1];
    return Math.round(lo + rng() * (hi - lo));
  }

  function delay(ms) {
    var d = typeof ms === "number" ? ms : randLatency();
    return new Promise(function (resolve) { setTimeout(resolve, d); });
  }

  function maybeFail(rate) {
    var r = typeof rate === "number" ? rate : config.failRate;
    return new Promise(function (resolve, reject) {
      if (r > 0 && rng() < r) {
        reject(new Error("MockApi: fallo simulado de red (demo de estado error)."));
      } else {
        resolve();
      }
    });
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  /**
   * Crea un recurso CRUD en memoria a partir de los registros del dominio.
   * @param {Array<object>} records  datos del dominio (definidos por el spec).
   * @param {object} [opts] { idKey:'id', latency:[min,max], failRate }
   */
  function resource(records, opts) {
    opts = opts || {};
    var idKey = opts.idKey || "id";
    var store = clone(Array.isArray(records) ? records : []);
    var localLatency = opts.latency || null;
    var localFail = typeof opts.failRate === "number" ? opts.failRate : null;

    function lat() { return localLatency ? Math.round(localLatency[0] + rng() * (localLatency[1] - localLatency[0])) : undefined; }
    function fail() { return maybeFail(localFail != null ? localFail : undefined); }

    return {
      list: function (filter) {
        return delay(lat()).then(fail).then(function () {
          var rows = clone(store);
          if (typeof filter === "function") rows = rows.filter(filter);
          return rows;
        });
      },
      get: function (id) {
        return delay(lat()).then(fail).then(function () {
          var found = store.filter(function (r) { return String(r[idKey]) === String(id); })[0];
          if (!found) throw new Error("MockApi: recurso " + id + " no encontrado.");
          return clone(found);
        });
      },
      create: function (data) {
        return delay(lat()).then(fail).then(function () {
          var row = clone(data || {});
          if (row[idKey] == null) row[idKey] = store.length + 1;
          store.push(row);
          return clone(row);
        });
      },
      update: function (id, patch) {
        return delay(lat()).then(fail).then(function () {
          var idx = store.findIndex(function (r) { return String(r[idKey]) === String(id); });
          if (idx === -1) throw new Error("MockApi: recurso " + id + " no encontrado.");
          store[idx] = Object.assign({}, store[idx], patch || {});
          return clone(store[idx]);
        });
      },
      remove: function (id) {
        return delay(lat()).then(fail).then(function () {
          var idx = store.findIndex(function (r) { return String(r[idKey]) === String(id); });
          if (idx === -1) throw new Error("MockApi: recurso " + id + " no encontrado.");
          var removed = store.splice(idx, 1)[0];
          return clone(removed);
        });
      },
      count: function () { return store.length; },
    };
  }

  global.MockApi = {
    config: config,
    delay: delay,
    maybeFail: maybeFail,
    resource: resource,
  };
})(typeof window !== "undefined" ? window : this);
