/* =====================================================================
 * specs/_shared/nav-items.js  (v12.85)  — classic script, window.SPDD_NAV_ITEMS
 *
 * MANIFIESTO UNICO de navegacion del portafolio (modo portfolio-spa).
 * Es la unica fuente de la lista de features que pinta el sidebar compartido
 * (_shared/nav.js). Editar/actualizar aqui = se actualizan TODOS los sidebars.
 *
 * `scaffold:prototype --mode portfolio-spa` agrega aqui automaticamente cada
 * feature nueva (si no existe ya). Tambien puedes editarlo a mano: orden, label,
 * icono.
 *
 * Formato de cada item:
 *   slug   (obligatorio) "<NNN-slug de specs/>" — debe existir specs/<slug>/prototype-html5/.
 *   label  (obligatorio) "Texto del menu".
 *   icon   (opcional)    emoji.
 *   roles  (opcional)    ["admin", ...] — guard por rol: el item solo se muestra al
 *                        rol activo (AppState.session.role()). Sin rol/demo: visible.
 *   badge  (opcional)    numero|string estatico, o { state: "clave" } para leer un
 *                        contador compartido de AppState (cross-spec).
 *
 * COHERENCIA (check:prototype-spa-coherence): cada slug aqui debe tener prototipo
 * y cada prototipo SPA debe estar aqui (si no, queda inalcanzable / link roto).
 * ===================================================================== */
window.SPDD_NAV_ITEMS = [
  // { slug: "001-mi-feature", label: "Mi feature", icon: "🏠", roles: ["admin"], badge: { state: "pendientes" } },
];
