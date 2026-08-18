// Politica de las PERSONAS que gestionan secretos, entrando por SSO con Keycloak.
//
// Es la contraria de policy-integration-hub.hcl: alli la APLICACION solo lee, porque consume
// credenciales y no las administra. Aqui el operador crea, corrige y borra, porque es quien las da
// de alta. Dos consumidores distintos, dos politicas distintas; ninguna es un superconjunto comoda
// de la otra.
//
// QUIEN LA RECIBE
// No se asigna a usuarios uno a uno. Se cuelga de un grupo externo de OpenBao cuyo alias es el ROL
// `platform-admin` del realm de Keycloak (ver setup-oidc.sh). Dar y quitar el permiso es dar y
// quitar el rol en Keycloak — un unico sitio, el mismo que ya gobierna el acceso a la aplicacion.
//
// Quien entre por SSO sin ese rol se queda con la politica `default`, que no alcanza ningun secreto.
// Fail-closed: el acceso se concede, no se retira.
//
// EL ALCANCE ES EL MISMO QUE EL DE LA APP, A PROPOSITO
// connections/* y tasks/* y nada mas. Un operador no necesita tocar la configuracion interna de
// OpenBao —sellar, crear politicas, montar motores—; eso sigue siendo del token raiz, que vive
// fuera de este circuito.

// ---- Los secretos ----
// Ojo con la ruta: en KV v2 los datos cuelgan de <mount>/data/<ruta>, no de <mount>/<ruta>.
path "secret/data/connections/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/data/tasks/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

// La metadata es lo que hace navegable el arbol en la interfaz, y donde vive el versionado.
// `delete` sobre metadata borra TODAS las versiones de un secreto; sobre data solo la ultima.
path "secret/metadata/connections/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/tasks/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

// Listar la raiz del motor: sin esto la interfaz muestra el motor vacio aunque haya secretos dentro.
path "secret/metadata" {
  capabilities = ["list"]
}

// Papelera de KV v2: recuperar un borrado y, cuando toca, destruirlo de verdad.
path "secret/undelete/*" {
  capabilities = ["update"]
}

path "secret/destroy/*" {
  capabilities = ["update"]
}

// ---- Lo minimo para que la INTERFAZ funcione ----
//
// La consola web hace un preflight contra sys/internal/ui/mounts antes de dejarte navegar. Sin
// permiso ahi, la sesion inicia pero la pantalla sale vacia o con un 403 que parece del secreto y
// es del listado de motores. Es la misma trampa que hace que `bao kv get` de 403 con un token que
// SI puede leer el secreto por la API: el preflight falla antes que la lectura real.
//
// Es solo lectura del CATALOGO de motores montados: que existen y de que tipo son. No da acceso a
// ningun dato de dentro.
path "sys/internal/ui/mounts" {
  capabilities = ["read"]
}

path "sys/internal/ui/mounts/*" {
  capabilities = ["read"]
}

path "sys/mounts" {
  capabilities = ["read"]
}
