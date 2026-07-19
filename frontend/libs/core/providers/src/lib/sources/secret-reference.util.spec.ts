import { describe, expect, it } from 'vitest';
import { isPlaintextSecret, isSecretReference, plaintextCredentialKeys } from './secret-reference.util';

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
  });
});
