import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import javax.crypto.SecretKey;

/**
 * Verifica que un alias de un keystore PKCS12 (File Vault) guarde EXACTAMENTE el valor esperado.
 * Uso: java VerifyVaultSecret.java <keystore.p12> <storepass> <alias> <expectedValue>
 * Sale 0 si coincide; 1 si no. Existe porque set-task-secret.cmd corrompía el valor de forma silenciosa
 * y un secreto malo solo se manifestaba como "Auth fail" en el banco (indistinguible de credencial revocada).
 */
public class VerifyVaultSecret {
    public static void main(String[] args) throws Exception {
        if (args.length < 4) {
            System.err.println("Usage: java VerifyVaultSecret.java <keystore.p12> <storepass> <alias> <expectedValue>");
            System.exit(2);
        }
        var keystore = args[0];
        var storepass = args[1].toCharArray();
        var alias = args[2];
        var expected = args[3];
        var ks = KeyStore.getInstance("PKCS12");
        try (InputStream in = Files.newInputStream(Path.of(keystore))) {
            ks.load(in, storepass);
        }
        var entry = ks.getEntry(alias, new KeyStore.PasswordProtection(storepass));
        if (!(entry instanceof KeyStore.SecretKeyEntry ske)) {
            System.err.println("VERIFY FAIL: alias '" + alias + "' is not a stored password entry");
            System.exit(1);
        }
        SecretKey key = ((KeyStore.SecretKeyEntry) entry).getSecretKey();
        var actual = new String(key.getEncoded(), StandardCharsets.UTF_8);
        if (!expected.equals(actual)) {
            System.err.println("VERIFY FAIL: alias '" + alias + "' stored " + actual.length()
                    + " bytes, expected " + expected.length() + " (value does NOT round-trip)");
            System.exit(1);
        }
        System.out.println("VERIFY OK: alias '" + alias + "' round-trips (" + actual.length() + " bytes)");
    }
}
