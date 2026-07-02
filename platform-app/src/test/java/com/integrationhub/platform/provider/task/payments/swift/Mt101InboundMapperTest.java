package com.integrationhub.platform.provider.task.payments.swift;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Fija el mapeo raw->Mt101Message compartido por MT101_PARSE y MT101_PARSE_FROM_TABLE.
 * Incluye la regresion del beneficiario :59 (sin opcion = cuenta + nombre, sin BIC).
 */
class Mt101InboundMapperTest {

    @Test
    void mapsInboundRecordWithBeneficiary59NameNotBic() {
        var values = new LinkedHashMap<String, Object>();
        values.put("block1", "F01SGOBFRPPAXXX0000000000");
        values.put("block2", "I101BCPLPEPLXXXXN");
        values.put("block3", Map.of("121", "3a2d1c8e-2b6e-4a1b-9c2f-6d7e8f9a0b1c"));
        values.put("sequenceA", new LinkedHashMap<>(Map.of(
                "20", "INB1",
                "28D", "1/1",
                "30", "260609",
                "50H", "/001-10200200\nEMPRESA INBOUND SAC")));
        values.put("sequenceB", List.of(new LinkedHashMap<>(Map.of(
                "21", "TX1",
                "32B", "PEN20000,",
                "57A", "BCPLPEPL",
                "59", "/0072987654321\nJUAN PEREZ",
                "71A", "OUR"))));

        var message = Mt101InboundMapper.toMessage(values);

        assertEquals("SGOBFRPPAXXX", message.envelope().senderLt());
        assertEquals("INB1", message.sequenceA().sendersReference());
        assertEquals(1, message.transactions().size());

        var tx = message.transactions().get(0);
        assertEquals("TX1", tx.transactionReference());
        assertEquals("PEN", tx.amount().currency());
        assertEquals(new BigDecimal("20000"), tx.amount().value());
        assertEquals("OUR", tx.detailsOfCharges());

        // :59 sin opcion = cuenta + nombre; el BIC debe quedar nulo (regresion "ACD".contains("")).
        assertEquals("", tx.beneficiary().option());
        assertNull(tx.beneficiary().bic(), ":59 sin opcion no debe poblar bic");
        assertEquals("0072987654321", tx.beneficiary().account());
        assertEquals(List.of("JUAN PEREZ"), tx.beneficiary().nameAndAddress());

        // :57A = account-with-institution con BIC.
        assertEquals("BCPLPEPL", tx.accountWithInstitution().bic());

        assertEquals(new BigDecimal("20000"), message.controlTotals().totalsByCurrency().get("PEN"));
    }
}
