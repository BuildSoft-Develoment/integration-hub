// @trace QA-006 (fuentes: credenciales como referencia vault ${secret:...}, nunca en texto plano)
//
// El backend (SecretResolver + FileVaultSecretValueProvider) resuelve ${<source>:<ref>} en runtime; el frontend
// debe persistir SOLO referencias, no el secreto en claro, para no dejar credenciales en el configuration_json.

/** Prefijos que el backend resuelve. Un valor con este patron es una REFERENCIA, no un secreto en claro. */
const SECRET_REFERENCE_PATTERN =
  /^\$\{(env|config|secret|vault|vaultkv|awssecret|gcpsecret|azuresecret):[^}]+\}$/;

/** True si el valor es una referencia de secreto (p.ej. `${secret:sftp/pass}`). Vacio no cuenta como referencia. */
export function isSecretReference(value: unknown): boolean {
  return typeof value === 'string' && SECRET_REFERENCE_PATTERN.test(value.trim());
}

/**
 * Descompone una referencia en su origen y su ruta: `${vaultkv:tasks/x/password}` -> `vaultkv` +
 * `tasks/x/password`. Devuelve `null` si el valor no es una referencia.
 *
 * Corta por el PRIMER `:` a proposito. El backend hace lo contrario con el ultimo `/` para separar la
 * ruta del nombre de campo, pero el origen es siempre el primer segmento y una ruta puede llevar `:`
 * dentro (una URL, por ejemplo). Cortar por el ultimo dejaria el origen a merced de la ruta.
 */
export function parseSecretReference(value: unknown): { source: string; path: string } | null {
  if (!isSecretReference(value)) {
    return null;
  }
  const interior = String(value).trim().slice(2, -1);
  const corte = interior.indexOf(':');
  return { source: interior.slice(0, corte), path: interior.slice(corte + 1) };
}

/**
 * Cambia el origen de un valor conservando lo que ya habia escrito.
 *
 * Si era una referencia se le cambia el prefijo y la ruta se respeta. Si era texto plano se envuelve
 * tal cual: es la forma natural de decir "esto que escribi es en realidad la ruta", y deja a la vista
 * lo que quedo para corregirlo. Si estaba vacio queda `${origen:}`, que TODAVIA no es una referencia
 * valida -le falta la ruta- y la interfaz lo dice en vez de tratarlo como un secreto en claro.
 */
export function withSecretSource(value: unknown, source: string): string {
  const actual = parseSecretReference(value);
  const ruta = actual ? actual.path : String(value ?? '').trim();
  return `\${${source}:${ruta}}`;
}

/** True si el valor es un secreto en CLARO: no vacio y no una referencia (lo que QA-006 prohibe persistir). */
export function isPlaintextSecret(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0 && !isSecretReference(value);
}

/** Campos de credencial por tipo de fuente que no deben persistirse en claro (QA-006). */
export const SOURCE_CREDENTIAL_KEYS: Readonly<Record<string, readonly string[]>> = {
  SFTP: ['password', 'passphrase'],
  FTP: ['password'],
  S3: ['secretAccessKey'],
  OCI_OBJECT_STORAGE: ['secretAccessKey'],
  REST: ['password', 'token'],
  // Estos dos FALTABAN, y son los que peor secreto guardan: `serviceAccountJson` es el JSON de la
  // service account de Google con la clave privada RSA dentro, y `connectionString`/`accountKey` dan
  // acceso total a la cuenta de Azure. Sin entrada en este mapa, `plaintextCredentialKeys` devolvia
  // [] y el guardado los dejaba pasar en claro a `source_definition.configuration_json`, mientras que
  // un password de SFTP si se bloqueaba. El control existia y miraba a otro lado.
  //
  // La sustitucion de ${secret:...} la hace `JsonConfigurationMapper.resolveValue`, que recorre TODO
  // el mapa de configuracion, no una lista de campos: estas claves admiten referencia igual que las
  // demas, asi que bloquearlas no deja al operador sin salida.
  GCS: ['serviceAccountJson'],
  AZURE_BLOB: ['connectionString', 'sasToken', 'accountKey'],
};

/**
 * Tipos de fuente que NO tienen ninguna credencial que proteger.
 *
 * Existe para que el mapa de arriba sea comprobable: sin esta lista, "el tipo no esta en el mapa" y
 * "el tipo no tiene credenciales" son indistinguibles, que es exactamente como GCS y AZURE_BLOB
 * pasaron desapercibidos. El test de este fichero exige que todo tipo registrado en el backend este
 * en uno de los dos sitios.
 */
export const SOURCE_TYPES_WITHOUT_CREDENTIALS: readonly string[] = ['FILESYSTEM'];

/**
 * Claves de credencial con texto plano en el config YA SERIALIZADO del source (lo que realmente se persiste).
 * Validar sobre el config serializado -no sobre el draft- evita falsos bloqueos cuando un modo no persiste el campo
 * (p.ej. REST bearer no serializa `password`, S3 con IAM role no serializa `secretAccessKey`).
 */
export function plaintextCredentialKeys(config: Record<string, unknown>, sourceType: string): string[] {
  const keys = SOURCE_CREDENTIAL_KEYS[String(sourceType ?? '').toUpperCase()] ?? [];
  return keys.filter((key) => isPlaintextSecret(config[key]));
}
