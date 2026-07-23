package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.repository.payments.swift.InboundRoutedTransactionRepository;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;

/**
 * Aplana un {@link Mt101Message} ruteado a filas de {@code inbound_routed_transaction} (una fila por
 * transaccion de la secuencia B). SRP: aisla el mapeo del dominio SWIFT (que campos del mensaje van a que
 * columnas, incluida la null-safety de {@code sequenceA}/{@code envelope}/{@code beneficiary}/{@code amount})
 * del {@link DbInboundDeliveryTransport}, que solo se ocupa de paginar y persistir el lote.
 */
@ApplicationScoped
public class InboundRoutedTransactionMapper {

    /**
     * @param message            mensaje MT101 ruteado
     * @param inboundSetId       id del set inbound al que pertenece
     * @param processExecutionId ejecucion que lo entrega (lineage)
     * @param routedAs           destino de ruteo resuelto para el mensaje
     * @return una fila por cada transaccion del mensaje ({@code emptyList} si no tiene transacciones)
     */
    public List<InboundRoutedTransactionRepository.Row> toRows(Mt101Message message, String inboundSetId,
                                                               Long processExecutionId, String routedAs) {
        var sendersReference = message.sequenceA() == null ? null : message.sequenceA().sendersReference();
        var uetr = message.envelope() == null ? null : message.envelope().uetr();
        var rows = new ArrayList<InboundRoutedTransactionRepository.Row>(message.transactions().size());
        for (var tx : message.transactions()) {
            var beneficiary = tx.beneficiary();
            var beneficiaryName = beneficiary == null || beneficiary.nameAndAddress() == null
                    || beneficiary.nameAndAddress().isEmpty()
                    ? null : beneficiary.nameAndAddress().get(0);
            rows.add(new InboundRoutedTransactionRepository.Row(
                    inboundSetId,
                    processExecutionId,
                    sendersReference,
                    tx.transactionReference(),
                    beneficiary == null ? null : beneficiary.account(),
                    beneficiaryName,
                    tx.amount() == null ? null : tx.amount().currency(),
                    tx.amount() == null ? null : tx.amount().value(),
                    uetr,
                    routedAs));
        }
        return rows;
    }
}
