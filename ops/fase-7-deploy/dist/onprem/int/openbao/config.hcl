// OpenBao — configuracion de INTEGRACION.
//
// Diferencia esencial con el contenedor de desarrollo: aquel arranca en modo dev (desellado, en
// MEMORIA, token raiz fijo) y pierde todo al reiniciar. Aqui el almacenamiento es persistente y el
// arranque es SELLADO: tras cada reinicio hay que desellarlo a mano con las claves que genero
// `bao operator init`. Eso no es una molestia a evitar, es la propiedad que hace que un gestor de
// secretos sirva de algo.

ui = true   // Sin esto no hay interfaz web. El modo dev la activaba sola; con fichero, no.

// La ruta es /openbao/file porque es la que la IMAGEN ya crea con el dueno correcto (uid 100,
// openbao). Un volumen montado en cualquier otra ruta lo crea Docker como root, el proceso no puede
// escribir, y la inicializacion falla con "mkdir ...: permission denied" — que es un error de
// permisos disfrazado de fallo de OpenBao.
storage "file" {
  path = "/openbao/file"
}

listener "tcp" {
  address = "0.0.0.0:8200"

  // TLS lo termina nginx, que es quien tiene el certificado y da la cara a Internet. OpenBao no se
  // publica directamente: solo escucha en la red interna del compose.
  tls_disable = true

  // nginx llega por HTTP; sin esto OpenBao no se fia de las cabeceras X-Forwarded-* y compone mal
  // las URLs que devuelve.
  x_forwarded_for_authorized_addrs = "0.0.0.0/0"
}

// `api_addr` NO se fija aqui A PROPOSITO: llega por la variable de entorno BAO_API_ADDR, que el
// compose alimenta desde PUBLIC_BASE_URL —el mismo knob que ya usan Keycloak (KC_HOSTNAME) y la app
// (QUARKUS_OIDC_TOKEN_ISSUER)—.
//
// Cablear el dominio en este fichero romperia el acceso por IP local: al entrar por
// https://192.168.100.25:8443 las redirecciones apuntarian a app.buildsoft.com.pe, que desde esa red
// puede no resolver. El mismo problema que ya dio el issuer de Keycloak al cambiar de red.
//
// Comprobado ejecutando el binario con BAO_API_ADDR: el arranque imprime "Api Address:" con ese valor.
//
// Y OJO con lo que `api_addr` NO hace: no cambia la ruta bajo la que se sirven la UI ni la API. Esas
// son /ui/ y /v1/ FIJAS —van compiladas en el HTML de la interfaz—, y por eso nginx les reserva esos
// dos prefijos enteros en vez de montar OpenBao bajo /openbao/. Ver int/nginx/https.conf.
