package com.integrationhub.platform.provider.task.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.provider.task.payments.spi.PaymentMessageFormatter;
import com.integrationhub.platform.provider.task.payments.swift.format.JsonMt101Formatter;
import com.integrationhub.platform.provider.task.payments.swift.model.Mt101Message;
import com.integrationhub.platform.spi.reader.ReadRecord;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.inject.Instance;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos RF-001
 * @covers ADR-009
 */
class Mt101BuildTaskProviderTest {

    private Mt101BuildTaskProvider provider;
    private JsonMt101Formatter jsonFormatter;

    @BeforeEach
    void setUp() {
        jsonFormatter = new JsonMt101Formatter(new ObjectMapper());
        var formatterInstance = new SingleFormatterInstance(jsonFormatter);
        provider = new Mt101BuildTaskProvider(formatterInstance);
    }

    @Test
    void buildsMt101FromConfiguredHeaderAndRecords() {
        var context = new TaskContext(42L, 7L);
        var readResult = new ReadResult(List.of(
                new ReadRecord(Map.of(
                        "dni", "12345678",
                        "nombre", "Juan Perez",
                        "cuenta_beneficiario", "0072-987654321",
                        "bic_beneficiario", "BCPLPEPL",
                        "moneda", "PEN",
                        "monto", "20000.00",
                        "concepto", "Sueldo mayo",
                        "cargos", "OUR"
                )),
                new ReadRecord(Map.of(
                        "dni", "87654321",
                        "nombre", "Maria Garcia",
                        "cuenta_beneficiario", "0011-123456789",
                        "bic_beneficiario", "BBVAPEPLXXX",
                        "moneda", "PEN",
                        "monto", "15500.50",
                        "concepto", "Proveedor",
                        "cargos", "SHA"
                ))
        ), 2);
        context.attributes().put("readResult", readResult);

        var configuration = Map.<String, Object>of(
                "format", "JSON",
                "envelope", Map.of(
                        "senderLt", "SGOBFRPPAXXX",
                        "receiverLt", "BCPLPEPLXXXX",
                        "uetrStrategy", "perMessage",
                        "priority", "N"
                ),
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "requestedExecutionDate", "2026-06-09",
                        "orderingCustomer", Map.of(
                                "option", "H",
                                "account", "001-10200200",
                                "nameAndAddress", List.of("EMPRESA INTEGRADORA SAC", "LIMA PE")
                        ),
                        "accountServicingInstitution", Map.of("option", "A", "bic", "BCPLPEPLXXX")
                ),
                "transactionMappings", Map.of(
                        "transactionReferenceTemplate", "TX-${recordNumber}-${dni}",
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of(
                                "option", "",
                                "accountField", "cuenta_beneficiario",
                                "nameAndAddressFields", List.of("nombre", "dni")
                        ),
                        "accountWithInstitution", Map.of("option", "A", "bicField", "bic_beneficiario"),
                        "remittanceInformationField", "concepto",
                        "detailsOfChargesField", "cargos"
                )
        );

        TaskResult result = provider.execute(context, configuration);

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        assertEquals(1, result.outputs().get("messageCount"));
        assertEquals(2, result.outputs().get("transactionCount"));
        assertEquals("JSON", result.outputs().get("format"));

        @SuppressWarnings("unchecked")
        var records = (List<Mt101Message>) result.outputs().get("records");
        assertNotNull(records);
        assertEquals(1, records.size());

        var message = records.get(0);
        assertNotNull(message.envelope());
        assertEquals("SGOBFRPPAXXX", message.envelope().senderLt());
        assertNotNull(message.envelope().uetr());

        assertNotNull(message.sequenceA());
        assertEquals("PROC-42", message.sequenceA().sendersReference());
        assertEquals(1, message.sequenceA().messageIndex());
        assertEquals(1, message.sequenceA().messageTotal());
        assertNotNull(message.sequenceA().orderingCustomer());
        assertEquals("H", message.sequenceA().orderingCustomer().option());
        assertEquals("001-10200200", message.sequenceA().orderingCustomer().account());

        assertEquals(2, message.transactions().size());
        var tx1 = message.transactions().get(0);
        assertEquals("TX-1-12345678", tx1.transactionReference());
        assertEquals("PEN", tx1.amount().currency());
        assertEquals(new BigDecimal("20000.00"), tx1.amount().value());
        assertEquals("OUR", tx1.detailsOfCharges());
        assertEquals("Sueldo mayo", tx1.remittanceInformation());
        assertNotNull(tx1.beneficiary());
        assertEquals("0072-987654321", tx1.beneficiary().account());
        assertEquals(List.of("Juan Perez", "12345678"), tx1.beneficiary().nameAndAddress());
        assertNotNull(tx1.accountWithInstitution());
        assertEquals("BCPLPEPL", tx1.accountWithInstitution().bic());

        assertNotNull(message.controlTotals());
        assertEquals(2, message.controlTotals().transactionCount());
        assertEquals(new BigDecimal("35500.50"), message.controlTotals().totalsByCurrency().get("PEN"));

        assertNotNull(message.rawPayload());
        assertTrue(message.rawPayload().contains("\"sendersReference\" : \"PROC-42\""));
        assertTrue(message.rawPayload().contains("\"PEN\""));
        assertEquals("JSON", message.format());
    }

    @Test
    void resolvesMappingsFromRuntimeMetadataVariablesAndTaskOutputs() {
        var context = new TaskContext(42L, 7L);
        context.attributes().put("executionVariables", Map.of(
                "currency", "PEN",
                "charges", "SHA"
        ));
        context.attributes().put("metadata", Map.of("tenantCode", "ACME"));
        context.attributes().put("taskOutputs", Map.of("source.summary.batchName", "payroll-june"));
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of(
                        "monto", "10.00",
                        "cuenta_beneficiario", "001-10200200"
                ))
        ), 1));

        var result = provider.execute(context, Map.<String, Object>of(
                "format", "JSON",
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "requestedExecutionDate", "2026-06-09",
                        "orderingCustomer", Map.of("option", "H", "account", "001")
                ),
                "transactionMappings", Map.of(
                        "transactionReferenceTemplate", "TX-${tenantCode}-${recordNumber}",
                        "amount", Map.of("currencyField", "currency", "valueField", "monto"),
                        "beneficiary", Map.of(
                                "option", "",
                                "accountField", "cuenta_beneficiario",
                                "nameAndAddressFields", List.of("source.summary.batchName")
                        ),
                        "remittanceInformationField", "_processExecutionId",
                        "detailsOfChargesField", "charges"
                )
        ));

        @SuppressWarnings("unchecked")
        var records = (List<Mt101Message>) result.outputs().get("records");
        var transaction = records.get(0).transactions().get(0);
        assertEquals("TX-ACME-1", transaction.transactionReference());
        assertEquals("PEN", transaction.amount().currency());
        assertEquals(new BigDecimal("10.00"), transaction.amount().value());
        assertEquals(List.of("payroll-june"), transaction.beneficiary().nameAndAddress());
        assertEquals("42", transaction.remittanceInformation());
        assertEquals("SHA", transaction.detailsOfCharges());
    }

    @Test
    void skipsBuildWhenNoRecords() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("readResult", new ReadResult(List.of(), 0));
        var result = provider.execute(context, Map.of(
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "orderingCustomer", Map.of("option", "H", "account", "001")
                ),
                "transactionMappings", Map.of(
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario")
                )
        ));

        assertTrue(result.success());
        assertTrue(result.details().toLowerCase().contains("skipped"));
        assertTrue(result.outputs().isEmpty());
    }

    @Test
    void rejectsWhenSequenceAMissing() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("readResult", new ReadResult(
                List.of(new ReadRecord(Map.of("dni", "1", "moneda", "PEN", "monto", "10"))), 1));

        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "transactionMappings", Map.of(
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto")
                )
        )));
        assertTrue(error.getMessage().contains("sequenceA"));
    }

    @Test
    void rejectsUnknownFormat() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("readResult", new ReadResult(
                List.of(new ReadRecord(Map.of("dni", "1", "moneda", "PEN", "monto", "10"))), 1));

        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "format", "PDF",
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "orderingCustomer", Map.of("option", "H", "account", "001")
                ),
                "transactionMappings", Map.of(
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario")
                )
        )));
        assertTrue(error.getMessage().contains("Unsupported MT101 format"));
        assertTrue(error.getMessage().contains("PDF"));
    }

    @Test
    void rejectsSendersReferenceLongerThanSixteenChars() {
        var context = new TaskContext(99999999L, 1L);
        context.attributes().put("readResult", new ReadResult(
                List.of(new ReadRecord(Map.of("dni", "1", "moneda", "PEN", "monto", "1"))), 1));

        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROCESS-${_processExecutionId}-${messageIndex}-EXTRA",
                        "orderingCustomer", Map.of("option", "H", "account", "001")
                ),
                "transactionMappings", Map.of(
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario")
                )
        )));

        assertTrue(error.getMessage().contains("sendersReference exceeds 16"));
    }

    @Test
    void buildsMultipleDebitModeWithOrderingCustomerPerTransaction() {
        var context = new TaskContext(42L, 1L);
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of(
                        "cuenta_ordenante", "001-AAA",
                        "nombre_ordenante", "SUB UNO",
                        "moneda", "PEN",
                        "monto", "1,25",
                        "cuenta_beneficiario", "B1",
                        "cargos", "OUR"
                ))
        ), 1));

        var result = provider.execute(context, Map.of(
                "debitAccountMode", "multipleDebit",
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "requestedExecutionDate", "2026-06-09"
                ),
                "transactionMappings", Map.of(
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "orderingCustomer", Map.of(
                                "option", "H",
                                "accountField", "cuenta_ordenante",
                                "nameAndAddressFields", List.of("nombre_ordenante")
                        ),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario"),
                        "detailsOfChargesField", "cargos"
                )
        ));

        assertTrue(result.success(), () -> "expected success, got: " + result.details());
        @SuppressWarnings("unchecked")
        var records = (List<Mt101Message>) result.outputs().get("records");
        var message = records.get(0);
        assertNull(message.sequenceA().orderingCustomer());
        assertEquals("001-AAA", message.transactions().get(0).orderingCustomer().account());
        assertEquals(new BigDecimal("1.25"), message.transactions().get(0).amount().value());
    }

    @Test
    void usesFragmentRuntimeIndexesAndMapsTransactionServicingInstitution() {
        var context = new TaskContext(42L, 1L);
        context.attributes().put("mt101MessageIndex", 3);
        context.attributes().put("mt101MessageTotal", 10);
        context.attributes().put("mt101RecordOffset", 200);
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of(
                        "moneda", "PEN",
                        "monto", "1.00",
                        "cuenta_beneficiario", "B1",
                        "bic_servicing", "BCPLPEPLXXX",
                        "cargos", "OUR"
                ))
        ), 1));

        var result = provider.execute(context, Map.of(
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "P${messageIndex}",
                        "requestedExecutionDate", "2026-06-09",
                        "orderingCustomer", Map.of("option", "H", "account", "001")
                ),
                "transactionMappings", Map.of(
                        "transactionReferenceTemplate", "TX-${recordNumber}",
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario"),
                        "accountServicingInstitution", Map.of("option", "A", "bicField", "bic_servicing"),
                        "detailsOfChargesField", "cargos"
                )
        ));

        @SuppressWarnings("unchecked")
        var records = (List<Mt101Message>) result.outputs().get("records");
        var message = records.get(0);
        assertEquals("P3", message.sequenceA().sendersReference());
        assertEquals(3, message.sequenceA().messageIndex());
        assertEquals(10, message.sequenceA().messageTotal());
        assertEquals(201, message.transactions().get(0).sequenceNumber());
        assertEquals("TX-201", message.transactions().get(0).transactionReference());
        assertEquals("BCPLPEPLXXX", message.transactions().get(0).accountServicingInstitution().bic());
    }

    @Test
    void rejectsSingleDebitWhenOrderingCustomerHasOnlyOptionNoValue() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of(
                        "moneda", "PEN",
                        "monto", "1.00",
                        "cuenta_beneficiario", "B1",
                        "cargos", "OUR"
                ))
        ), 1));

        var error = assertThrows(IllegalArgumentException.class, () -> provider.execute(context, Map.of(
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "orderingCustomer", Map.of("option", "H")
                ),
                "transactionMappings", Map.of(
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario"),
                        "detailsOfChargesField", "cargos"
                )
        )));

        assertTrue(error.getMessage().contains("singleDebit requires sequenceA.orderingCustomer"));
    }

    @Test
    void leavesUetrNullForUnknownStrategy() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("readResult", new ReadResult(
                List.of(new ReadRecord(Map.of("dni", "1", "moneda", "PEN", "monto", "1"))), 1));

        var result = provider.execute(context, Map.of(
                "envelope", Map.of(
                        "senderLt", "AAA",
                        "uetrStrategy", "none"
                ),
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "orderingCustomer", Map.of("option", "H", "account", "001")
                ),
                "transactionMappings", Map.of(
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario")
                )
        ));

        @SuppressWarnings("unchecked")
        var records = (List<Mt101Message>) result.outputs().get("records");
        assertNull(records.get(0).envelope().uetr());
    }

    @Test
    void aggregatesControlTotalsByCurrency() {
        var context = new TaskContext(1L, 1L);
        context.attributes().put("readResult", new ReadResult(List.of(
                new ReadRecord(Map.of("dni", "1", "moneda", "PEN", "monto", "100.00", "cuenta_beneficiario", "A")),
                new ReadRecord(Map.of("dni", "2", "moneda", "PEN", "monto", "250.50", "cuenta_beneficiario", "B")),
                new ReadRecord(Map.of("dni", "3", "moneda", "USD", "monto", "75.25", "cuenta_beneficiario", "C"))
        ), 3));

        var result = provider.execute(context, Map.of(
                "sequenceA", Map.of(
                        "sendersReferenceTemplate", "PROC-${_processExecutionId}",
                        "orderingCustomer", Map.of("option", "H", "account", "001")
                ),
                "transactionMappings", Map.of(
                        "amount", Map.of("currencyField", "moneda", "valueField", "monto"),
                        "beneficiary", Map.of("option", "", "accountField", "cuenta_beneficiario")
                )
        ));

        @SuppressWarnings("unchecked")
        var totals = (Map<String, BigDecimal>) result.outputs().get("totalsByCurrency");
        assertEquals(new BigDecimal("350.50"), totals.get("PEN"));
        assertEquals(new BigDecimal("75.25"), totals.get("USD"));
        assertEquals(3, result.outputs().get("transactionCount"));
    }

    /**
     * Minimal {@link Instance} para inyectar un solo formateador en el test sin
     * arrancar el contenedor CDI.
     */
    private static final class SingleFormatterInstance implements Instance<PaymentMessageFormatter> {
        private final PaymentMessageFormatter formatter;

        SingleFormatterInstance(PaymentMessageFormatter formatter) {
            this.formatter = formatter;
        }

        @Override
        public Instance<PaymentMessageFormatter> select(java.lang.annotation.Annotation... qualifiers) {
            return this;
        }

        @Override
        public <U extends PaymentMessageFormatter> Instance<U> select(Class<U> subtype, java.lang.annotation.Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public <U extends PaymentMessageFormatter> Instance<U> select(jakarta.enterprise.util.TypeLiteral<U> subtype, java.lang.annotation.Annotation... qualifiers) {
            throw new UnsupportedOperationException();
        }

        @Override
        public boolean isUnsatisfied() {
            return false;
        }

        @Override
        public boolean isAmbiguous() {
            return false;
        }

        @Override
        public void destroy(PaymentMessageFormatter instance) {
            // no-op
        }

        @Override
        public jakarta.enterprise.inject.Instance.Handle<PaymentMessageFormatter> getHandle() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Iterable<? extends jakarta.enterprise.inject.Instance.Handle<PaymentMessageFormatter>> handles() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Iterator<PaymentMessageFormatter> iterator() {
            return List.of(formatter).iterator();
        }

        @Override
        public PaymentMessageFormatter get() {
            return formatter;
        }

        @Override
        public Stream<PaymentMessageFormatter> stream() {
            return StreamSupport.stream(spliterator(), false);
        }
    }
}
