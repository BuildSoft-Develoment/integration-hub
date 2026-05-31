/* =====================================================================
 * specs/_shared/seed.js  (v12.85)  — classic script, window.SharedSeed
 *
 * Catalogo OPCIONAL de datos COMUNES cross-spec para prototipos en modo
 * portfolio-spa. Resuelve la casuistica: varias features comparten la misma
 * entidad (ej. "miembro", "usuario", "sucursal") y deben verla CONSISTENTE,
 * no duplicada/contradictoria en cada mock por separado.
 *
 * Es un helper de DATOS de bajo nivel (permitido por la regla anti-trampa).
 * NO renderiza UI ni define layout de dominio. Cada feature sigue construyendo
 * su propia vista; aqui solo vive el dataset compartido.
 *
 * Compatible con file:// (sin import/export). Se carga ANTES de mock-api.js:
 *   <script src="../../_shared/seed.js"></script>
 *   <script src="../../_shared/mock-api.js"></script>
 *
 * API:
 *   SharedSeed.register(name, rows)   -> registra/define una entidad comun.
 *   SharedSeed.get(name)              -> copia de las filas (o [] si no existe).
 *   SharedSeed.has(name)              -> bool.
 *   SharedSeed.names()                -> lista de entidades registradas.
 *   SharedSeed.resource(name, opts)   -> MockApi.resource(get(name), opts) (atajo).
 *
 * Patron de uso (la feature SOLO consume; los datos comunes viven aqui):
 *   // En seed.js (este archivo), el agente define las entidades compartidas:
 *   SharedSeed.register("miembro", [{ id: 1, nombre: "Ana Perez", rol: "lider" }, ...]);
 *   // En la feature, en vez de redefinir miembros, los reusa:
 *   var miembros = SharedSeed.resource("miembro");      // CRUD sobre el dataset comun
 *   var donaciones = MockApi.resource(misDonacionesPropias); // datos propios de la feature
 *
 * Por defecto esta VACIO (el template no trae datos de dominio). El agente
 * registra aqui solo las entidades realmente compartidas entre 2+ features.
 * ===================================================================== */
(function (global) {
  "use strict";

  var store = {}; // name -> rows[]

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function register(name, rows) {
    if (!name) return [];
    store[name] = clone(Array.isArray(rows) ? rows : []);
    return clone(store[name]);
  }

  function get(name) {
    return store[name] ? clone(store[name]) : [];
  }

  function has(name) { return Object.prototype.hasOwnProperty.call(store, name); }

  function names() { return Object.keys(store); }

  // Atajo: expone el dataset comun como recurso CRUD de MockApi (si esta cargado).
  function resource(name, opts) {
    if (!global.MockApi || typeof global.MockApi.resource !== "function") {
      throw new Error("SharedSeed.resource requiere _shared/mock-api.js cargado antes.");
    }
    return global.MockApi.resource(get(name), opts);
  }

  // Permite sembrar entidades comunes declarativamente desde HTML:
  //   window.SPDD_SEED = { miembro: [...], sucursal: [...] };
  if (global.SPDD_SEED && typeof global.SPDD_SEED === "object") {
    Object.keys(global.SPDD_SEED).forEach(function (k) { register(k, global.SPDD_SEED[k]); });
  }

  global.SharedSeed = {
    register: register,
    get: get,
    has: has,
    names: names,
    resource: resource,
  };
})(typeof window !== "undefined" ? window : this);
