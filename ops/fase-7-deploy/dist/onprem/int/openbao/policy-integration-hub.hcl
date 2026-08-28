// Politica de la APLICACION en OpenBao. Lo que la app necesita, y nada mas.
//
// POR QUE NO EL TOKEN RAIZ
// El raiz puede leer, escribir y BORRAR cualquier ruta, y ademas administrar el propio OpenBao. Un
// token con ese poder viviendo en una variable de entorno de un contenedor de aplicacion convierte
// cualquier fuga de configuracion —un volcado de entorno, un log de arranque demasiado hablador— en
// el control total de la boveda. La app solo lee credenciales: eso es lo que se le concede.
//
// SOLO LECTURA, Y SOLO DONDE VIVE LO SUYO
// `read` sin `create`, `update` ni `delete`: la app consume secretos, no los gestiona. Quien los da
// de alta es una persona por la UI, o el script de seed.
//
// Ojo con la ruta: en KV v2 los datos cuelgan de <mount>/data/<ruta>, no de <mount>/<ruta>. Una
// politica escrita sobre "secret/connections/*" no concede NADA y el fallo se ve como un
// "Missing vaultkv value" indistinguible de un secreto inexistente.

path "secret/data/connections/*" {
  capabilities = ["read"]
}

path "secret/data/tasks/*" {
  capabilities = ["read"]
}

// Subkeys: los NOMBRES de campo de un secreto, con los valores a null (ADR-031 D4). Es lo que
// permite que la interfaz ofrezca "password" en un desplegable sin que el backend llegue a tener el
// password en memoria. Por "data" tambien saldrian los nombres, pero con los valores dentro, y la
// seguridad pasaria a depender de que nadie escriba un "return values" en un refactor futuro.
//
// Sin "list" en metadata (abajo) esto no sirve de nada: primero hay que saber que rutas existen.
path "secret/subkeys/connections/*" {
  capabilities = ["read"]
}

path "secret/subkeys/tasks/*" {
  capabilities = ["read"]
}

// Metadata: la necesita el cliente para resolver la version vigente de un secreto KV v2.
path "secret/metadata/connections/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/tasks/*" {
  capabilities = ["read", "list"]
}
