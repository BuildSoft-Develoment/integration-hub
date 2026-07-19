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
};

/**
 * Claves de credencial con texto plano en el config YA SERIALIZADO del source (lo que realmente se persiste).
 * Validar sobre el config serializado -no sobre el draft- evita falsos bloqueos cuando un modo no persiste el campo
 * (p.ej. REST bearer no serializa `password`, S3 con IAM role no serializa `secretAccessKey`).
 */
export function plaintextCredentialKeys(config: Record<string, unknown>, sourceType: string): string[] {
  const keys = SOURCE_CREDENTIAL_KEYS[String(sourceType ?? '').toUpperCase()] ?? [];
  return keys.filter((key) => isPlaintextSecret(config[key]));
}
