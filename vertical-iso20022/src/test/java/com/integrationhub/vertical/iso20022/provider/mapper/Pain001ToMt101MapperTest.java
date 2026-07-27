package com.integrationhub.vertical.iso20022.provider.mapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * @covers spec 008-mensajeria-pagos RF-008 (inbound pain.001)
 */
class Pain001ToMt101MapperTest {

    private Pain001ToMt101Mapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new Pain001ToMt101Mapper();
    }

    @Test
    void mapsHeaderPaymentInfoAndSingleTransaction() {
        var shape = shape(
                "PROC-42",
                pmtInf("PROC-42", "TRF", "2026-06-09", "ACME SAC", "001-10200200", "BCPLPEPLXXX",
                        List.of(tx("TX-1", "100.50", "PEN", "DEBT", "BCPLPEPL", "JUAN PEREZ", "0072-987654321", "SUELDO MAYO")))
        );

        var message = mapper.map(shape);

        assertNotNull(message);
        assertEquals("PAIN001_XML", message.format());
        assertEquals("PROC-42", message.sequenceA().sendersReference());
        assertEquals(LocalDate.of(2026, 6, 9), message.sequenceA().requestedExecutionDate());

        var debtor = message.sequenceA().orderingCustomer();
        assertNotNull(debtor);
        assertEquals("H", debtor.option());
        assertEquals("001-10200200", debtor.account());
        assertEquals(List.of("ACME SAC"), debtor.nameAndAddress());

        var servicing = message.sequenceA().accountServicingInstitution();
        assertNotNull(servicing);
        assertEquals("BCPLPEPLXXX", servicing.bic());

        assertEquals(1, message.transactions().size());
        var tx = message.transactions().get(0);
        assertEquals(1, tx.sequenceNumber());
        assertEquals("TX-1", tx.transactionReference());
        assertEquals("PEN", tx.amount().currency());
        assertEquals(new BigDecimal("100.50"), tx.amount().value());
        assertEquals("OUR", tx.detailsOfCharges(), "DEBT → OUR");
        assertEquals("BCPLPEPL", tx.accountWithInstitution().bic());
        assertEquals(List.of("JUAN PEREZ"), tx.beneficiary().nameAndAddress());
        assertEquals("0072-987654321", tx.beneficiary().account());
        assertEquals("SUELDO MAYO", tx.remittanceInformation());
    }

    @Test
    void translatesAllChargeBearerCodesInversely() {
        assertEquals("OUR", mapChargeBearer("DEBT"));
        assertEquals("BEN", mapChargeBearer("CRED"));
        assertEquals("SHA", mapChargeBearer("SHAR"));
        assertEquals("SHA", mapChargeBearer("SLEV"), "SLEV colapsa a SHA (fallback simetrico al outbound)");
        assertEquals("SHA", mapChargeBearer("INVALID"));
    }

    @Test
    void preservesNullChargeBearerWhenAbsent() {
        var shape = shape("M",
                pmtInf("M", "TRF", null, null, null, null,
                        List.of(tx("T", "1.00", "PEN", null, null, null, null, null))));
        var tx = mapper.map(shape).transactions().get(0);
        assertNull(tx.detailsOfCharges(), "ChrgBr ausente → null (downstream decide default)");
    }

    @Test
    void aggregatesControlTotalsByCurrency() {
        var shape = shape("M",
                pmtInf("M", "TRF", null, null, null, null, List.of(
                        tx("T1", "10.00", "PEN", "DEBT", null, null, null, null),
                        tx("T2", "20.00", "PEN", "DEBT", null, null, null, null),
                        tx("T3", "5.00", "USD", "SHAR", null, null, null, null)
                )));
        var totals = mapper.map(shape).controlTotals();
        assertEquals(3, totals.transactionCount());
        assertEquals(new BigDecimal("30.00"), totals.totalsByCurrency().get("PEN"));
        assertEquals(new BigDecimal("5.00"), totals.totalsByCurrency().get("USD"));
    }

    @Test
    void numbersTransactionsSequentiallyStartingAtOne() {
        var shape = shape("M",
                pmtInf("M", "TRF", null, null, null, null, List.of(
                        tx("A", "1.00", "PEN", null, null, null, null, null),
                        tx("B", "2.00", "PEN", null, null, null, null, null),
                        tx("C", "3.00", "PEN", null, null, null, null, null)
                )));
        var txs = mapper.map(shape).transactions();
        assertEquals(1, txs.get(0).sequenceNumber());
        assertEquals(2, txs.get(1).sequenceNumber());
        assertEquals(3, txs.get(2).sequenceNumber());
    }

    @Test
    void usesPaymentInfoIdWhenMessageIdMissing() {
        var shape = new LinkedHashMap<String, Object>();
        shape.put("paymentInformation",
                pmtInf("FALLBACK-ID", "TRF", null, null, null, null,
                        List.of(tx("T", "1.00", "PEN", null, null, null, null, null))));
        assertEquals("FALLBACK-ID", mapper.map(shape).sequenceA().sendersReference());
    }

    @Test
    void rejectsNullShape() {
        assertThrows(IllegalArgumentException.class, () -> mapper.map(null));
    }

    @Test
    void rejectsMissingPaymentInformation() {
        var shape = new LinkedHashMap<String, Object>();
        shape.put("messageId", "M");
        assertThrows(IllegalArgumentException.class, () -> mapper.map(shape));
    }

    @Test
    void rejectsInvalidAmountFormat() {
        var shape = shape("M",
                pmtInf("M", "TRF", null, null, null, null,
                        List.of(tx("T", "not-a-number", "PEN", null, null, null, null, null))));
        assertThrows(IllegalArgumentException.class, () -> mapper.map(shape));
    }

    @Test
    void rejectsInvalidDateFormat() {
        var shape = shape("M",
                pmtInf("M", "TRF", "09/06/2026", null, null, null,
                        List.of(tx("T", "1.00", "PEN", null, null, null, null, null))));
        assertThrows(IllegalArgumentException.class, () -> mapper.map(shape));
    }

    // --- helpers ---

    private String mapChargeBearer(String chrgBr) {
        var shape = shape("M",
                pmtInf("M", "TRF", null, null, null, null,
                        List.of(tx("T", "1.00", "PEN", chrgBr, null, null, null, null))));
        return mapper.map(shape).transactions().get(0).detailsOfCharges();
    }

    private Map<String, Object> shape(String messageId, Map<String, Object> paymentInformation) {
        var map = new LinkedHashMap<String, Object>();
        map.put("messageId", messageId);
        map.put("paymentInformation", paymentInformation);
        return map;
    }

    private Map<String, Object> pmtInf(String pmtInfId,
                                       String paymentMethod,
                                       String requestedExecutionDate,
                                       String debtorName,
                                       String debtorAccount,
                                       String debtorAgentBic,
                                       List<Map<String, Object>> transactions) {
        var map = new LinkedHashMap<String, Object>();
        if (pmtInfId != null) map.put("paymentInfoId", pmtInfId);
        if (paymentMethod != null) map.put("paymentMethod", paymentMethod);
        if (requestedExecutionDate != null) map.put("requestedExecutionDate", requestedExecutionDate);
        if (debtorName != null) map.put("debtorName", debtorName);
        if (debtorAccount != null) map.put("debtorAccount", debtorAccount);
        if (debtorAgentBic != null) map.put("debtorAgentBic", debtorAgentBic);
        map.put("transactions", transactions);
        return map;
    }

    private Map<String, Object> tx(String endToEndId, String amount, String currency,
                                   String chargeBearer, String creditorAgentBic,
                                   String creditorName, String creditorAccount,
                                   String remittanceInformation) {
        var map = new LinkedHashMap<String, Object>();
        if (endToEndId != null) map.put("endToEndId", endToEndId);
        if (amount != null) map.put("amount", amount);
        if (currency != null) map.put("currency", currency);
        if (chargeBearer != null) map.put("chargeBearer", chargeBearer);
        if (creditorAgentBic != null) map.put("creditorAgentBic", creditorAgentBic);
        if (creditorName != null) map.put("creditorName", creditorName);
        if (creditorAccount != null) map.put("creditorAccount", creditorAccount);
        if (remittanceInformation != null) map.put("remittanceInformation", remittanceInformation);
        return map;
    }
}
