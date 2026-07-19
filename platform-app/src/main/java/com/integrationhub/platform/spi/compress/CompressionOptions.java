package com.integrationhub.platform.spi.compress;

/**
 * ADR-016: opciones de compresion config-driven. {@code deflateLevel} 0 (STORE) .. 9 (BEST); {@code encrypt}=true con
 * {@code password} activa AES-256 (solo ZIP). El password llega ya resuelto desde una referencia vault ({@code ${secret:...}}).
 */
public record CompressionOptions(boolean encrypt, char[] password, int deflateLevel) {

    public static CompressionOptions plain(int deflateLevel) {
        return new CompressionOptions(false, null, deflateLevel);
    }

    public static CompressionOptions encrypted(char[] password, int deflateLevel) {
        return new CompressionOptions(true, password, deflateLevel);
    }
}
