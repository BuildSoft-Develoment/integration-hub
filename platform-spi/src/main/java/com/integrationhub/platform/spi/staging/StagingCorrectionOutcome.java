package com.integrationhub.platform.spi.staging;

/**
 * ADR-021 (decision 3): resultado de una correccion ya commiteada.
 *
 * <p>Lleva la <b>misma</b> {@link StagingCorrectionEvidence} que se archivo en el journal, no una copia
 * recalculada: asi la traza que ve el operador y la evidencia durable no pueden divergir.
 *
 * <p>No devuelve el payload antes/despues. Se penso hacerlo —para que el llamante armara su auditoria
 * sin releer la fila— pero ningun consumidor los necesita: la traza se arma con hashes y campos
 * cambiados. Sostenerlos igual significaria retener dos mapas y dos strings por fila corregida, y la
 * correccion masiva de una planilla recorre decenas de miles.
 *
 * @param updated  filas afectadas por el UPDATE; siempre 1 (un 0 se convierte en conflicto).
 * @param evidence hashes, campos cambiados y versiones, tal cual se archivaron.
 */
public record StagingCorrectionOutcome(int updated, StagingCorrectionEvidence evidence) {
}
