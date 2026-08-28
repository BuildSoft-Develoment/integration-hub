import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SOURCE_CREDENTIAL_KEYS,
  SOURCE_TYPES_WITHOUT_CREDENTIALS,
  isPlaintextSecret,
  isSecretReference,
  parseSecretReference,
  plaintextCredentialKeys,
  withSecretSource,
} from './secret-reference.util';

// process.cwd() es `frontend/` cuando corre el runner de Angular.
const REPO = join(process.cwd(), '..');

/**
 * Tipos de fuente que el backend registra, leidos del CATALOGO GENERADO.
 *
 * No se vuelve a parsear el Java: `ci/scripts/gen-catalogo-tipos.mjs` ya lo hace recorriendo los
 * siete modulos del reactor, y `gen:catalogo:check` falla si el catalogo se desactualiza. Un tercer
 * parser seria un tercer punto ciego.
 */
function tiposDeFuenteDelBackend(): string[] {
  const doc = readFileSync(join(REPO, 'docs/transversal/90.17-catalogo-de-tipos.md'), 'utf8');
  const desde = doc.indexOf('### Fuentes');
  const hasta = doc.indexOf('### ', desde + 1);
  const seccion = doc.slice(desde, hasta === -1 ? undefined : hasta);
  return [...seccion.matchAll(/^\|\s*`([A-Z0-9_]+)`\s*\|/gm)].map((m) => m[1]);
}

describe('secret-reference util (QA-006)', () => {
  describe('isSecretReference', () => {
    it('acepta referencias de los prefijos que el backend resuelve', () => {
      expect(isSecretReference('${secret:sftp/pass}')).toBe(true);
      expect(isSecretReference('${vault:kv/creds}')).toBe(true);
      expect(isSecretReference('${env:SFTP_PASS}')).toBe(true);
      expect(isSecretReference('  ${secret:x}  ')).toBe(true); // se trimea
    });

    it('rechaza texto plano, vacio y prefijos desconocidos', () => {
      expect(isSecretReference('hunter2')).toBe(false);
      expect(isSecretReference('')).toBe(false);
      expect(isSecretReference('${unknown:x}')).toBe(false);
      expect(isSecretReference('${secret:}')).toBe(false); // ref vacia
      expect(isSecretReference(123 as unknown)).toBe(false);
    });
  });

  describe('isPlaintextSecret', () => {
    it('true solo para valor no vacio que no es referencia', () => {
      expect(isPlaintextSecret('hunter2')).toBe(true);
      expect(isPlaintextSecret('${secret:x}')).toBe(false);
      expect(isPlaintextSecret('')).toBe(false);
      expect(isPlaintextSecret('   ')).toBe(false);
      expect(isPlaintextSecret(undefined)).toBe(false);
    });
  });

  describe('plaintextCredentialKeys', () => {
    it('detecta las credenciales en claro segun el tipo', () => {
      expect(plaintextCredentialKeys({ password: 'hunter2', passphrase: '' }, 'SFTP')).toEqual(['password']);
      expect(plaintextCredentialKeys({ secretAccessKey: 'AKIAplaintext' }, 'S3')).toEqual(['secretAccessKey']);
      expect(plaintextCredentialKeys({ password: 'x', token: 'y' }, 'REST')).toEqual(['password', 'token']);
    });

    it('no marca credenciales que son referencias vault', () => {
      expect(plaintextCredentialKeys({ password: '${secret:sftp/pass}' }, 'SFTP')).toEqual([]);
      expect(plaintextCredentialKeys({ password: '${vault:rest/basic}', token: '' }, 'REST')).toEqual([]);
    });

    it('ignora campos no-credencial y tipos desconocidos', () => {
      // el accessKeyId (id, no secreto) no esta en la lista de S3
      expect(plaintextCredentialKeys({ accessKeyId: 'AKIA...', secretAccessKey: '${secret:s3}' }, 'S3')).toEqual([]);
      expect(plaintextCredentialKeys({ password: 'x' }, 'FILESYSTEM')).toEqual([]);
      expect(plaintextCredentialKeys({ password: 'x' }, '')).toEqual([]);
    });

    it('es case-insensitive en el tipo de fuente', () => {
      expect(plaintextCredentialKeys({ password: 'x' }, 'sftp')).toEqual(['password']);
    });

    it('protege las credenciales de la nube que antes pasaban en claro', () => {
      // El JSON de service account de Google lleva la clave privada RSA dentro.
      expect(plaintextCredentialKeys({ serviceAccountJson: '{"private_key":"-----BEGIN' }, 'GCS'))
        .toEqual(['serviceAccountJson']);
      expect(plaintextCredentialKeys({ serviceAccountJson: '${secret:gcp/sa}' }, 'GCS')).toEqual([]);
      // Los tres modos de autenticacion de Azure llevan secreto.
      expect(plaintextCredentialKeys({ connectionString: 'AccountKey=abc' }, 'AZURE_BLOB'))
        .toEqual(['connectionString']);
      expect(plaintextCredentialKeys({ sasToken: 'sv=2024', accountKey: 'k' }, 'AZURE_BLOB'))
        .toEqual(['sasToken', 'accountKey']);
    });
  });

  /**
   * El hueco de GCS/AZURE_BLOB no fue un descuido puntual: fue que nada exigia que el mapa siguiera
   * al backend. Mientras "no esta en el mapa" signifique "no tiene credenciales", cada tipo de fuente
   * nuevo nace sin proteger y en silencio.
   */
  describe('cobertura frente a los tipos que el backend registra', () => {
    it('todo tipo de fuente esta en el mapa de credenciales o declarado sin credenciales', () => {
      const tipos = tiposDeFuenteDelBackend();
      expect(tipos.length, 'no se pudo leer el catalogo generado de tipos').toBeGreaterThan(0);

      const sinCubrir = tipos.filter(
        (t) => !(t in SOURCE_CREDENTIAL_KEYS) && !SOURCE_TYPES_WITHOUT_CREDENTIALS.includes(t),
      );
      expect(
        sinCubrir,
        `tipos de fuente que el guardado dejaria pasar en claro:\n  ${sinCubrir.join('\n  ')}\n` +
          'Anadelos a SOURCE_CREDENTIAL_KEYS con sus campos, o a SOURCE_TYPES_WITHOUT_CREDENTIALS si ' +
          'de verdad no tienen ninguna credencial.',
      ).toEqual([]);
    });

    it('no se declara nada que el backend ya no registre', () => {
      const tipos = new Set(tiposDeFuenteDelBackend());
      const sobran = [...Object.keys(SOURCE_CREDENTIAL_KEYS), ...SOURCE_TYPES_WITHOUT_CREDENTIALS]
        .filter((t) => !tipos.has(t));
      expect(sobran, `declarados aqui pero sin provider detras: ${sobran.join(', ')}`).toEqual([]);
    });
  });

  // @trace ADR-031 D6 (descomponer y recomponer la referencia para el campo compartido)
  describe('parseSecretReference', () => {
    it('separa origen y ruta', () => {
      expect(parseSecretReference('${vaultkv:tasks/zip/password}')).toEqual({
        source: 'vaultkv',
        path: 'tasks/zip/password',
      });
    });

    it('corta por el PRIMER dos-puntos: una ruta puede llevar mas', () => {
      // Cortar por el ultimo dejaria el origen a merced de la ruta (una URL, por ejemplo).
      expect(parseSecretReference('${config:http://host:8080/x}')).toEqual({
        source: 'config',
        path: 'http://host:8080/x',
      });
    });

    it('lo que no es una referencia devuelve null', () => {
      expect(parseSecretReference('hunter2')).toBeNull();
      expect(parseSecretReference('')).toBeNull();
      expect(parseSecretReference('${vaultkv:}')).toBeNull();
      expect(parseSecretReference(undefined)).toBeNull();
    });
  });

  describe('withSecretSource', () => {
    it('cambia el prefijo y respeta la ruta', () => {
      expect(withSecretSource('${secret:sources/sftp/password}', 'vaultkv')).toBe(
        '${vaultkv:sources/sftp/password}',
      );
    });

    it('envuelve el texto plano en vez de perderlo', () => {
      expect(withSecretSource('hunter2', 'vaultkv')).toBe('${vaultkv:hunter2}');
    });

    it('sobre vacio deja la referencia a medio escribir, no una valida', () => {
      // `${vaultkv:}` NO pasa `isSecretReference`: la interfaz pide la ruta en vez de dar por buena
      // una referencia que no resuelve nada.
      const aMedias = withSecretSource('', 'vaultkv');
      expect(aMedias).toBe('${vaultkv:}');
      expect(isSecretReference(aMedias)).toBe(false);
    });
  });
});
