package com.integrationhub.platform.spi.staging;

/**
 * ADR-021 (decision 3): que corregir. Todo lo que el motor necesita saber de una correccion.
 *
 * <p>No lleva actor, motivo ni ticket: eso es evidencia que archiva el vertical en su journal, con
 * las politicas de su estandar sobre que campos son obligatorios. El motor no los usa para decidir
 * nada, y pedirlos aca daria la falsa impresion de que si.
 *
 * @param stagingId       identidad de la fila en {@code staging_record}.
 * @param patchJson       merge-patch a aplicar sobre el payload actual.
 * @param expectedVersion version que el operador leyo (If-Match). {@code null} = sin If-Match; el
 *                        UPDATE sigue condicionado a la version recien leida, asi que una carrera
 *                        entre el select y el update tampoco pasa desapercibida.
 */
public record StagingCorrectionCommand(long stagingId, String patchJson, Long expectedVersion) {

    public StagingCorrectionCommand {
        if (stagingId < 1) {
            throw new IllegalArgumentException("stagingId must be positive");
        }
        if (patchJson == null || patchJson.isBlank()) {
            throw new IllegalArgumentException("payload patch is required");
        }
    }
}
