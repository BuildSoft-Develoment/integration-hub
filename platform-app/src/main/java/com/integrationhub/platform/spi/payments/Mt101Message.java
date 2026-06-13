package com.integrationhub.platform.spi.payments;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Representacion canonica en memoria de un mensaje MT101.
 *
 * <p>El mensaje se descompone en {@link Envelope} (blocks 1/2/3/5 SWIFT) +
 * {@link SequenceA} (cabecera comun) + lista de {@link Transaction} (Sequence B
 * repetitiva). Es la salida de {@link com.integrationhub.platform.provider.task.payments.swift.Mt101BuildTaskProvider}
 * y la entrada de {@link com.integrationhub.platform.provider.task.payments.swift.format.JsonMt101Formatter},
 * de los validadores y del task de pago.</p>
 *
 * <p>El {@code rawPayload} se rellena solo despues de formatear (no antes); es
 * mutable porque vive fuera de la zona "build" del provider.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-001
 * @trace ADR-009
 */
public record Mt101Message(
        Envelope envelope,
        SequenceA sequenceA,
        List<Transaction> transactions,
        ControlTotals controlTotals,
        String rawPayload,
        String format
) {

    public Mt101Message {
        transactions = transactions == null ? List.of() : List.copyOf(transactions);
    }

    public Mt101Message withRawPayload(String newRawPayload, String newFormat) {
        return new Mt101Message(envelope, sequenceA, transactions, controlTotals, newRawPayload, newFormat);
    }

    /** Block 1+2+3+5 del envelope SWIFT. */
    public record Envelope(
            String senderLt,
            String receiverLt,
            String uetr,
            String priority
    ) {
    }

    /** Sequence A (cabecera, una sola por mensaje). */
    public record SequenceA(
            String sendersReference,
            String customerSpecifiedReference,
            int messageIndex,
            int messageTotal,
            LocalDate requestedExecutionDate,
            Party instructingParty,
            Party orderingCustomer,
            Party accountServicingInstitution,
            String authorisation
    ) {
    }

    /** Sequence B (una por transaccion). */
    public record Transaction(
            int sequenceNumber,
            String transactionReference,
            String fxDealReference,
            String instructionCode,
            Amount amount,
            Party orderingCustomer,
            Party accountServicingInstitution,
            Party intermediary,
            Party accountWithInstitution,
            Party beneficiary,
            String remittanceInformation,
            String regulatoryReporting,
            Amount originalAmount,
            String detailsOfCharges,
            String chargesAccount,
            BigDecimal exchangeRate
    ) {
    }

    /** Importe + moneda (campos :32B: y :33B:). */
    public record Amount(String currency, BigDecimal value) {
    }

    /**
     * Parte (Instructing Party, Ordering Customer, Beneficiary, Account With Institution,
     * etc.). El campo {@code option} indica la sub-opcion FIN (A/C/F/G/H/L o vacio).
     */
    public record Party(
            String option,
            String account,
            String bic,
            List<String> nameAndAddress
    ) {
        public Party {
            nameAndAddress = nameAndAddress == null ? List.of() : List.copyOf(nameAndAddress);
        }
    }

    /** Totales agregados para conciliacion. */
    public record ControlTotals(int transactionCount, java.util.Map<String, BigDecimal> totalsByCurrency) {
        public ControlTotals {
            totalsByCurrency = totalsByCurrency == null ? java.util.Map.of() : java.util.Map.copyOf(totalsByCurrency);
        }
    }
}
