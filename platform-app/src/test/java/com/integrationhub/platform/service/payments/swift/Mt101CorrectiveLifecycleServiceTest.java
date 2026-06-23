package com.integrationhub.platform.service.payments.swift;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ArchiveTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101PayTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ReconcileTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101RepairTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101RouteTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101StatusTaskProvider;
import com.integrationhub.platform.provider.task.payments.swift.Mt101ValidateTaskProvider;
import com.integrationhub.platform.repository.payments.swift.Mt101FailedRecordRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101FragmentRepository;
import com.integrationhub.platform.repository.payments.swift.Mt101RebuildRepository;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import com.integrationhub.platform.spi.task.payments.Mt101Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * B2': orquestacion del ciclo bancario del set correctivo. VALIDATE/ARCHIVE automaticos;
 * PAY con maker-checker propio (el aprobador del envio != el solicitante).
 */
@Testcontainers
class Mt101CorrectiveLifecycleServiceTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mt101_corrective")
            .withUsername("postgres")
            .withPassword("postgres");

    private static final String SET = "SET";
    private static final String FIX = "SET-FIX-1";

    private DataSource dataSource;
    private Mt101CorrectiveLifecycleService service;
    private Mt101RebuildService rebuildService;
    private AtomicInteger payInvocations;
    private AtomicInteger routeInvocations;
    private AtomicInteger statusInvocations;
    private AtomicInteger reconcileInvocations;
    private boolean rejectSecondPayFragment;
    private boolean payUncertain;
    private boolean statusSyncFails;
    private boolean payThrowsAfterDispatch;
    private boolean payConfigChangedAfterRequest;
    private boolean routePayConfig;
    // P0.1 v23: simula que la config de MT101_PAY "deriva" DESPUES del hash de aprobacion (lecturas >= 3
    // devuelven otra plantilla). Con el snapshot congelado el dispatch usa la config aprobada, no la derivada.
    private boolean payConfigDriftsAfterApprovalHash;
    private final AtomicInteger payConfigReadCount = new AtomicInteger();
    private volatile String dispatchedIdempotencyTemplate;
    // P0/P1 v23-v24: PAY correctivo con sftp.remoteDuplicatePolicy OVERWRITE/RENAME_WITH_SUFFIX debe rechazarse.
    private String paySftpPolicy;
    // Hardening v23: el perfil de MT101_STATUS cambia DESPUES del PAY; la resolucion debe usar el congelado.
    private boolean statusConfigChangedAfterPay;
    private volatile String dispatchedStatusQueryUrl;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @BeforeEach
    void setUp() throws Exception {
        dataSource = dataSource();
        prepareSchema();
        payInvocations = new AtomicInteger();
        routeInvocations = new AtomicInteger();
        statusInvocations = new AtomicInteger();
        reconcileInvocations = new AtomicInteger();
        rejectSecondPayFragment = false;
        payUncertain = false;
        statusSyncFails = false;
        payThrowsAfterDispatch = false;
        payConfigChangedAfterRequest = false;
        routePayConfig = false;
        payConfigDriftsAfterApprovalHash = false;
        payConfigReadCount.set(0);
        dispatchedIdempotencyTemplate = null;
        paySftpPolicy = null;
        statusConfigChangedAfterPay = false;
        dispatchedStatusQueryUrl = null;

        rebuildService = new Mt101RebuildService(dataSource, null, null, null,
                new Mt101FailedRecordRepository(), new Mt101FragmentRepository(), new Mt101RebuildRepository());

        // Fakes de providers: marcan los fragmentos del correctivo al estado de cada etapa.
        var validate = new Mt101ValidateTaskProvider(null, null, null, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                markCorrective("VALIDATED");
                return TaskResult.success("fake validate");
            }
        };
        var archive = new Mt101ArchiveTaskProvider(null, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                markCorrective("ARCHIVED");
                upsertArchive("ARCHIVED");
                return TaskResult.success("fake archive");
            }
        };
        var repair = new Mt101RepairTaskProvider() {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                return TaskResult.success("fake repair");
            }
        };
        var route = new Mt101RouteTaskProvider(null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                routeInvocations.incrementAndGet();
                if (routePayConfig) {
                    markRoute("RTEST1", "REST_MAIN", null);
                    markRoute("RTEST2", "SFTP_SECONDARY", null);
                }
                return TaskResult.success("fake route");
            }
        };
        var pay = new Mt101PayTaskProvider(null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                payInvocations.incrementAndGet();
                // P0.1 v23: registra la config con la que REALMENTE se despacha (debe ser la aprobada).
                dispatchedIdempotencyTemplate = String.valueOf(configuration.get("idempotencyKeyTemplate"));
                if (payThrowsAfterDispatch) {
                    // Simula: se despacho al menos un fragmento (DISPATCHING durable) y LUEGO algo
                    // falla (BD/auditoria) lanzando excepcion. No debe quedar FAILED (reusable).
                    try (Connection connection = dataSource.getConnection();
                         var statement = connection.createStatement()) {
                        statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'DISPATCHING' "
                                + "where rebuild_run_id = '" + FIX + "' and corrective_senders_reference = 'RTEST1'");
                    } catch (SQLException error) {
                        throw new IllegalStateException(error);
                    }
                    throw new IllegalStateException("local persistence failed after gateway accepted");
                }
                if (payUncertain) {
                    // Timeout/conexion tras enviar: el provider clasifica UNCERTAIN (no marca
                    // SENT/REJECTED) y lo reporta en uncertainCount. No toca los fragmentos.
                    return TaskResult.failure("fake uncertain pay", Map.of(
                            "uncertainCount", 1,
                            "uncertain", java.util.List.of(Map.of(
                                    "sendersReference", "RTEST1",
                                    "status", "UNCERTAIN",
                                    "attempts", 1,
                                    "lastError", "timeout: read timed out")),
                            "records", java.util.List.of(),
                            "errors", java.util.List.of(),
                            "dispatchCount", 1,
                            "sentCount", 0,
                            "rejectedCount", 0));
                }
                if (rejectSecondPayFragment) {
                    markReference("RTEST1", "SENT", null);
                    markReference("RTEST2", "REJECTED", "gateway rejected");
                    return TaskResult.failure("fake partial pay", Map.of(
                            "records", java.util.List.of(Map.of(
                                    "sendersReference", "RTEST1",
                                    "status", "ACCEPTED",
                                    "gatewayReference", "GW-1",
                                    "attempts", 1)),
                            "errors", java.util.List.of(Map.of(
                                    "sendersReference", "RTEST2",
                                    "status", "REJECTED",
                                    "lastError", "gateway rejected",
                                    "attempts", 1)),
                            "dispatchCount", 2,
                            "sentCount", 1,
                            "rejectedCount", 1));
                }
                markCorrective("SENT");
                return TaskResult.success("fake pay", Map.of(
                        "records", java.util.List.of(
                                Map.of("sendersReference", "RTEST1", "status", "ACCEPTED", "gatewayReference", "GW-1", "attempts", 1),
                                Map.of("sendersReference", "RTEST2", "status", "ACCEPTED", "gatewayReference", "GW-2", "attempts", 1))));
            }
        };
        var status = new Mt101StatusTaskProvider(null, dataSource, null, null, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                statusInvocations.incrementAndGet();
                // Hardening v23: registra el perfil de STATUS con el que REALMENTE se consulta.
                if (configuration.get("query") instanceof Map<?, ?> query) {
                    dispatchedStatusQueryUrl = String.valueOf(query.get("url"));
                }
                if (statusSyncFails) {
                    throw new IllegalStateException("gateway STATUS query unavailable");
                }
                if (Boolean.TRUE.equals(configuration.get("resolveCorrectivePay"))) {
                    try {
                        var repository = new Mt101RebuildRepository();
                        repository.resolvePayFragmentResults(dataSource, FIX, List.of(
                                new Mt101RebuildRepository.PayFragmentResult("RTEST1", "SENT", "GW-1", 0, null),
                                new Mt101RebuildRepository.PayFragmentResult("RTEST2", "SENT", "GW-2", 0, null)
                        ), "STATUS_API");
                        repository.syncCorrectiveBuildFragmentsFromPay(dataSource, FIX);
                    } catch (SQLException error) {
                        throw new IllegalStateException(error);
                    }
                }
                return TaskResult.success("fake status");
            }
        };
        var reconcile = new Mt101ReconcileTaskProvider(dataSource, null) {
            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                reconcileInvocations.incrementAndGet();
                return TaskResult.success("fake reconcile");
            }
        };
        Mt101CorrectiveTaskConfigSource configSource = (buildTaskDefinitionId, taskType) -> {
            var config = new java.util.LinkedHashMap<String, Object>();
            config.put("input", Map.of("sourceTaskRef", "build-mt101", "sourceOutput", "fragments"));
            if ("MT101_PAY".equals(taskType)) {
                config.put("transport", "REST");
                // Las 2 primeras lecturas (hash de solicitud + hash de aprobacion) devuelven "approved-";
                // a partir de la 3a, si el drift esta activo, devuelven "drift-". El snapshot congelado
                // (P0.1) hace que el dispatch NO llegue a una 3a lectura: usa la config aprobada.
                var read = payConfigReadCount.incrementAndGet();
                var template = payConfigDriftsAfterApprovalHash && read >= 3 ? "drift-" : "approved-";
                config.put("idempotencyKeyTemplate",
                        (payConfigChangedAfterRequest ? "changed-" : template) + "${sendersReference}");
                if (paySftpPolicy != null) {
                    config.put("transport", "SFTP");
                    config.put("sftp", Map.of(
                            "dropPathTemplate", "/bank/${sendersReference}.fin",
                            "remoteDuplicatePolicy", paySftpPolicy));
                }
                if (routePayConfig) {
                    config.put("routeTransports", Map.of(
                            "REST_MAIN", Map.of(
                                    "transport", "REST",
                                    "idempotencyKeyTemplate", "rest-${sendersReference}"),
                            "SFTP_SECONDARY", Map.of(
                                    "transport", "SFTP",
                                    "sftp", Map.of("dropPathTemplate", "/bank/${sendersReference}.fin"))));
                }
            }
            if ("MT101_STATUS".equals(taskType)) {
                // El perfil de STATUS "deriva" si cambia despues del PAY; el snapshot congelado lo evita.
                config.put("query", Map.of("url",
                        (statusConfigChangedAfterPay ? "drift-status/" : "frozen-status/") + "${idempotencyKey}"));
            }
            return config;
        };

        service = new Mt101CorrectiveLifecycleService(dataSource, null,
                new Mt101RebuildRepository(), new Mt101FragmentRepository(), rebuildService,
                configSource, validate, repair, route, archive, pay, status, reconcile);
    }

    @Test
    void advancesCorrectiveThroughValidateAndArchive() throws Exception {
        var result = service.advanceCorrective(null, FIX, "executor");

        assertEquals("ARCHIVED", result.status(), "el correctivo llega a ARCHIVED sin enviar");
        assertEquals("ARCHIVED", runStatus(FIX));
        assertEquals("REBUILD_ARCHIVED", quarantineStatus());
        assertEquals(1, routeInvocations.get(), "ROUTE se ejecuta antes de ARCHIVE");
    }

    @Test
    void correctivePayRequiresSegregationOfDuties() throws Exception {
        service.advanceCorrective(null, FIX, "executor");

        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");
        // El mismo que solicita no puede aprobar el envio.
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.approveAndPayCorrective(null, FIX, "ana"));
        assertTrue(error.getMessage().contains("segregation of duties"));

        // Un aprobador distinto si: se envia y el lifecycle pasa a SENT.
        var paid = service.approveAndPayCorrective(null, FIX, "luis");
        assertEquals("SENT", paid.status());
        assertEquals("SENT", runStatus(FIX));
        assertEquals("REBUILD_SENT", quarantineStatus());
        assertEquals("SENT", payStatus(FIX));
        assertEquals(1, statusInvocations.get(), "STATUS se invoca despues de PAY");
        assertEquals(1, reconcileInvocations.get(), "RECONCILE se invoca despues de PAY");
    }

    @Test
    void payRequiresArchivedAndPriorRequest() throws Exception {
        // No se puede pagar un correctivo que aun no esta ARCHIVED.
        var notArchived = assertThrows(IllegalArgumentException.class,
                () -> service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1"));
        assertTrue(notArchived.getMessage().contains("must be ARCHIVED"));

        service.advanceCorrective(null, FIX, "executor");
        // Aprobar sin solicitud previa falla.
        var noRequest = assertThrows(IllegalArgumentException.class,
                () -> service.approveAndPayCorrective(null, FIX, "luis"));
        assertTrue(noRequest.getMessage().contains("must be requested"));
    }

    @Test
    void payRequestPersistsBusinessReasonAndTicketAsDurableEvidence() throws Exception {
        // v22: la SOLICITUD de PAY (paso del maker) deja motivo/ticket de negocio como evidencia
        // durable, simetrica a la auditoria de resolucion. Sin fallback: queda registrado.
        service.advanceCorrective(null, FIX, "executor");
        var requested = service.requestCorrectivePay(null, FIX, "ana",
                "reproceso aprobado por tesoreria", "JIRA-PAY-4321");

        assertEquals("reproceso aprobado por tesoreria",
                queryString("select pay_request_reason from mt101_rebuild_run where rebuild_run_id = '" + FIX + "'"),
                "se registra el motivo de la solicitud de PAY");
        assertEquals("JIRA-PAY-4321",
                queryString("select pay_request_ticket from mt101_rebuild_run where rebuild_run_id = '" + FIX + "'"),
                "se registra el ticket de la solicitud de PAY");

        // P2/P1-API v23: la RESPUESTA refleja el pay_status recien aplicado (no el snapshot previo)
        // y expone la evidencia de gobierno para que el operador la vea por API, no solo en BD.
        assertEquals("REQUESTED", requested.payStatus(),
                "la respuesta debe reflejar PAY_REQUESTED, no el ARCHIVED previo");
        assertEquals("reproceso aprobado por tesoreria", requested.payRequestReason());
        assertEquals("JIRA-PAY-4321", requested.payRequestTicket());

        // El motivo/ticket no rompe la segregacion de funciones: otro checker aprueba y se envia.
        var paid = service.approveAndPayCorrective(null, FIX, "luis");
        assertEquals("SENT", paid.status());
        assertEquals("SENT", paid.payStatus(), "la respuesta de aprobacion refleja PAY=SENT");
    }

    @Test
    void payActionsAreRecordedAppendOnlyAcrossRequestClaimUncertainAndResolution() throws Exception {
        // P1 v23: historial INMUTABLE de acciones PAY. La fila de mt101_rebuild_run se sobrescribe,
        // pero mt101_corrective_pay_action conserva TODAS las transiciones, en orden, con su actor.
        payUncertain = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "INC-1");
        service.approveAndPayCorrective(null, FIX, "luis"); // -> UNCERTAIN
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'UNCERTAIN' "
                    + "where rebuild_run_id = '" + FIX + "'");
        }
        service.resolveUncertainPay(null, FIX, "operador", "INC-1 revisado vs extracto");

        var actions = queryStrings("select action_type from mt101_corrective_pay_action "
                + "where rebuild_run_id = '" + FIX + "' order by id");
        assertEquals(List.of("PAY_REQUESTED", "PAY_CLAIMED", "PAY_DISPATCHING", "PAY_UNCERTAIN", "PAY_RESOLVED"),
                actions, "el historial conserva todas las acciones en orden, no solo la ultima");
        // El actor queda por accion: maker en REQUESTED, checker en CLAIMED, operador en RESOLVED.
        assertEquals("ana", queryString("select actor from mt101_corrective_pay_action "
                + "where rebuild_run_id = '" + FIX + "' and action_type = 'PAY_REQUESTED'"));
        assertEquals("luis", queryString("select actor from mt101_corrective_pay_action "
                + "where rebuild_run_id = '" + FIX + "' and action_type = 'PAY_CLAIMED'"));
        assertEquals("operador", queryString("select actor from mt101_corrective_pay_action "
                + "where rebuild_run_id = '" + FIX + "' and action_type = 'PAY_RESOLVED'"));
        // El motivo/ticket del maker queda en la accion de solicitud (evidencia durable independiente).
        assertEquals("reproceso aprobado", queryString("select reason from mt101_corrective_pay_action "
                + "where rebuild_run_id = '" + FIX + "' and action_type = 'PAY_REQUESTED'"));
        assertEquals("INC-1", queryString("select ticket from mt101_corrective_pay_action "
                + "where rebuild_run_id = '" + FIX + "' and action_type = 'PAY_REQUESTED'"));
    }

    @Test
    void resolveUncertainPayUsesTheStatusProfileFrozenAtPayNotTheCurrentConfig() throws Exception {
        // Hardening v23: la resolucion de un PAY_UNCERTAIN consulta el perfil de MT101_STATUS CONGELADO
        // en el momento del PAY, no la config vigente (que pudo cambiar entre el envio y la resolucion).
        payUncertain = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");
        service.approveAndPayCorrective(null, FIX, "luis"); // congela el perfil STATUS = "frozen-status/"
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'UNCERTAIN' "
                    + "where rebuild_run_id = '" + FIX + "'");
        }
        // El perfil de STATUS cambia DESPUES del PAY.
        statusConfigChangedAfterPay = true;

        service.resolveUncertainPay(null, FIX, "operador", "INC-9 revisado");

        assertNotNull(dispatchedStatusQueryUrl, "la resolucion debe consultar STATUS");
        assertTrue(dispatchedStatusQueryUrl.startsWith("frozen-status/"),
                () -> "la resolucion debe usar el perfil de STATUS congelado en el PAY, no el vigente: "
                        + dispatchedStatusQueryUrl);
    }

    @Test
    void correctivePayRejectsSftpOverwritePolicy() throws Exception {
        // P0/P1 v23: OVERWRITE puede re-entregar una instruccion de pago; se rechaza en la solicitud
        // (sin fallback), antes de cualquier hash/claim/envio.
        paySftpPolicy = "OVERWRITE";
        service.advanceCorrective(null, FIX, "executor");

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1"));
        assertTrue(error.getMessage().contains("OVERWRITE"),
                () -> "mensaje inesperado: " + error.getMessage());
        // No quedo solicitud de PAY.
        assertEquals("NOT_REQUESTED", payStatus(FIX));
    }

    @Test
    void correctivePayRejectsSftpRenameWithSuffixPolicy() throws Exception {
        // P0.4 v24: RENAME_WITH_SUFFIX crea un archivo nuevo que el banco puede tratar como otra
        // instruccion de pago; para PAY correctivo solo SKIP_IF_SAME_HASH y FAIL son seguras.
        paySftpPolicy = "RENAME_WITH_SUFFIX";
        service.advanceCorrective(null, FIX, "executor");

        var error = assertThrows(IllegalArgumentException.class,
                () -> service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1"));
        assertTrue(error.getMessage().contains("RENAME_WITH_SUFFIX"),
                () -> "mensaje inesperado: " + error.getMessage());
        assertEquals("NOT_REQUESTED", payStatus(FIX));
    }

    @Test
    void requestAndResolveRequireBusinessReasonInBackendNotOnlyUi() throws Exception {
        // P0.3 v24: motivo/ticket obligatorios en el BACKEND. Un cliente directo del API (sin pasar por
        // la UI) no puede solicitar PAY sin justificacion ni resolver un incierto sin motivo.
        service.advanceCorrective(null, FIX, "executor");

        assertThrows(IllegalArgumentException.class,
                () -> service.requestCorrectivePay(null, FIX, "ana", null, "TCK-1"), "sin motivo debe fallar");
        assertThrows(IllegalArgumentException.class,
                () -> service.requestCorrectivePay(null, FIX, "ana", "motivo", "   "), "sin ticket debe fallar");
        assertEquals("NOT_REQUESTED", payStatus(FIX), "ninguna solicitud invalida queda persistida");

        // Con motivo+ticket si: y resolver un incierto exige motivo.
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");
        payUncertain = true; // no se usa aqui, pero deja claro el contexto
        assertThrows(IllegalArgumentException.class,
                () -> service.resolveUncertainPay(null, FIX, "operador", null),
                "resolver un incierto sin motivo debe fallar");
    }

    @Test
    void payActionAuditTableIsAppendOnlyAtDatabaseLevel() throws Exception {
        // P0.1 v24: la BD rechaza UPDATE/DELETE sobre el historial de acciones (trigger V53).
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");
        assertTrue(queryLong("select count(*) from mt101_corrective_pay_action where rebuild_run_id = '"
                + FIX + "'") > 0, "debe existir al menos PAY_REQUESTED");

        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            assertThrows(SQLException.class,
                    () -> statement.executeUpdate("update mt101_corrective_pay_action set actor = 'tampered' "
                            + "where rebuild_run_id = '" + FIX + "'"),
                    "UPDATE sobre el historial debe ser rechazado por la BD");
        }
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            assertThrows(SQLException.class,
                    () -> statement.executeUpdate("delete from mt101_corrective_pay_action "
                            + "where rebuild_run_id = '" + FIX + "'"),
                    "DELETE sobre el historial debe ser rechazado por la BD");
        }
    }

    @Test
    void requestPayStateAndActionAreAtomicRollingBackOnAuditFailure() throws Exception {
        // P0.1 v24: el cambio de pay_status y su accion auditada son atomicos. Si el insert de auditoria
        // falla, el cambio de estado se revierte (no queda PAY_REQUESTED sin evidencia append-only).
        service.advanceCorrective(null, FIX, "executor");
        // Forzamos el fallo del insert de auditoria eliminando la tabla del historial.
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            statement.executeUpdate("drop table mt101_corrective_pay_action");
        }

        assertThrows(Exception.class,
                () -> service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1"));
        // El pay_status NO cambio: la transaccion completa se revirtio.
        assertEquals("NOT_REQUESTED", payStatus(FIX),
                "si falla la auditoria, el cambio de estado debe revertirse (atomico)");
    }

    @Test
    void payDispatchesTheFrozenApprovedConfigNotAConfigReReadAtDispatch() throws Exception {
        // P0.1 v23: "configuracion aprobada = configuracion usada para enviar". Aunque la config de
        // MT101_PAY "derive" entre el hash de aprobacion y el despacho, el envio usa el snapshot
        // congelado (una sola lectura), no la config vigente. Sin esto el banco podria recibir una
        // ruta/endpoint/idempotency distinta a la aprobada por el checker.
        payConfigDriftsAfterApprovalHash = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");
        var paid = service.approveAndPayCorrective(null, FIX, "luis");

        assertEquals("SENT", paid.payStatus());
        // El dispatch uso la plantilla APROBADA, no la derivada (drift-).
        assertEquals("approved-${sendersReference}", dispatchedIdempotencyTemplate,
                "el despacho debe usar la config congelada aprobada, no una re-leida con drift");
        // Los intents persistidos en el ledger tambien usan la config congelada.
        assertEquals(0L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and idempotency_key like 'drift-%'"),
                "ningun intent del ledger usa la config derivada");
        assertEquals(2L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and idempotency_key like 'approved-%'"));
    }

    @Test
    void payClaimPreventsDoubleSendWhenAnotherCheckerWonTheClaim() throws Exception {
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");

        var repository = new Mt101RebuildRepository();
        var payloadHash = repository.archivedCorrectivePayloadHash(dataSource, FIX);
        var configHash = repository.payRequestedConfigHash(dataSource, FIX);
        assertTrue(repository.claimPayForExecution(dataSource, FIX, "luis",
                        payloadHash, configHash, java.time.LocalDateTime.now().plusMinutes(15)),
                "simula que otro checker ya reclamo PAY");

        var error = assertThrows(IllegalStateException.class,
                () -> service.approveAndPayCorrective(null, FIX, "maria"));

        assertTrue(error.getMessage().contains("could not be claimed"));
        assertEquals(0, payInvocations.get(), "no se invoca MT101_PAY si el claim atomico no gana");
    }

    @Test
    void invalidatesPayRequestWhenArchivedPayloadHashChanges() throws Exception {
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");

        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_build_fragment set payload_hash = repeat('9', 64) "
                    + "where fragment_set_id = '" + FIX + "' and senders_reference = 'RTEST2'");
        }

        var error = assertThrows(IllegalStateException.class,
                () -> service.approveAndPayCorrective(null, FIX, "luis"));

        assertTrue(error.getMessage().contains("invalidated"));
        assertEquals("INVALIDATED", payStatus(FIX));
        assertEquals(0, payInvocations.get(), "no se invoca MT101_PAY si cambio el hash aprobado");
    }

    @Test
    void invalidatesPayRequestWhenPayConfigurationChanges() throws Exception {
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");

        payConfigChangedAfterRequest = true;

        var error = assertThrows(IllegalStateException.class,
                () -> service.approveAndPayCorrective(null, FIX, "luis"));

        assertTrue(error.getMessage().contains("configuration changed"));
        assertEquals("INVALIDATED", payStatus(FIX));
        assertEquals(0, payInvocations.get(), "no se invoca MT101_PAY si cambio la configuracion aprobada");
    }

    @Test
    void correctivePayPreparesIntentsFromPersistedRoutes() throws Exception {
        routePayConfig = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");

        var result = service.approveAndPayCorrective(null, FIX, "luis");

        assertEquals("SENT", result.status());
        assertEquals("REST",
                queryString("select transport from mt101_corrective_pay_fragment "
                        + "where rebuild_run_id = '" + FIX + "' and corrective_senders_reference = 'RTEST1'"));
        assertEquals("rest-RTEST1",
                queryString("select endpoint_ref from mt101_corrective_pay_fragment "
                        + "where rebuild_run_id = '" + FIX + "' and corrective_senders_reference = 'RTEST1'"));
        assertEquals("SFTP",
                queryString("select transport from mt101_corrective_pay_fragment "
                        + "where rebuild_run_id = '" + FIX + "' and corrective_senders_reference = 'RTEST2'"));
        assertEquals("/bank/RTEST2.fin",
                queryString("select endpoint_ref from mt101_corrective_pay_fragment "
                        + "where rebuild_run_id = '" + FIX + "' and corrective_senders_reference = 'RTEST2'"));
    }

    @Test
    void partialPayPersistsFragmentDetailAndKeepsGranularQuarantine() throws Exception {
        rejectSecondPayFragment = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");

        var result = service.approveAndPayCorrective(null, FIX, "luis");

        assertEquals("PARTIALLY_SENT", result.status());
        assertEquals("PARTIALLY_SENT", runStatus(FIX));
        assertEquals("PARTIALLY_SENT", payStatus(FIX));
        assertEquals(1L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'SENT'"));
        assertEquals(1L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'REJECTED'"));
        assertEquals("REBUILD_SENT", quarantineStatus(25));
        assertEquals("REBUILD_REJECTED", quarantineStatus(75));
    }

    @Test
    void expiredExecutingPayBecomesUncertainWithoutRetry() throws Exception {
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");
        var repository = new Mt101RebuildRepository();
        var payloadHash = repository.archivedCorrectivePayloadHash(dataSource, FIX);
        var configHash = repository.payRequestedConfigHash(dataSource, FIX);
        assertTrue(repository.claimPayForExecution(dataSource, FIX, "luis",
                payloadHash, configHash, java.time.LocalDateTime.now().minusMinutes(1)));

        var marked = repository.markExpiredPayExecutionsUncertain(dataSource, java.time.LocalDateTime.now());

        assertEquals(1, marked);
        assertEquals("UNCERTAIN", payStatus(FIX));
        assertEquals(0, payInvocations.get(), "el vencimiento de lease no reintenta PAY");
    }

    @Test
    void uncertainPayMarksRunUncertainWithoutSendingOrReconciling() throws Exception {
        payUncertain = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");

        service.approveAndPayCorrective(null, FIX, "luis");

        // Clasificacion TIPADA (TransportResult.uncertain): no se asume enviado.
        assertEquals("UNCERTAIN", payStatus(FIX));
        assertEquals(1, payInvocations.get());
        assertEquals(0, statusInvocations.get(), "no se corre STATUS con PAY incierto");
        assertEquals(0, reconcileInvocations.get(), "no se corre RECONCILE con PAY incierto");
        assertEquals(1L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'UNCERTAIN'"));
        assertEquals(0L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'SENT'"));
    }

    @Test
    void resolveUncertainPayRunsStatusWithoutSecondPayInvocation() throws Exception {
        payUncertain = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");
        service.approveAndPayCorrective(null, FIX, "luis");
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement()) {
            statement.executeUpdate("update mt101_corrective_pay_fragment set pay_status = 'UNCERTAIN' "
                    + "where rebuild_run_id = '" + FIX + "'");
        }

        var result = service.resolveUncertainPay(null, FIX, "operador",
                "incidente INC-77 revisado contra extracto bancario");

        assertEquals("SENT", result.status());
        assertEquals("SENT", runStatus(FIX));
        assertEquals("SENT", payStatus(FIX));
        assertEquals(1, payInvocations.get(), "resolver incertidumbre no reenvia MT101_PAY");
        assertEquals(1, statusInvocations.get(), "resolver incertidumbre consulta MT101_STATUS");
        assertEquals(1, reconcileInvocations.get(), "con pagos resueltos como enviados se ejecuta RECONCILE");
        assertEquals(2L, queryLong("select count(*) from mt101_corrective_pay_fragment "
                + "where rebuild_run_id = '" + FIX + "' and pay_status = 'SENT'"));
        // v22: la resolucion de PAY incierto deja evidencia durable del actor/motivo.
        assertEquals("operador",
                queryString("select pay_resolved_by from mt101_rebuild_run where rebuild_run_id = '" + FIX + "'"),
                "se registra quien resolvio el PAY incierto");
        assertEquals(1L, queryLong("select count(*) from mt101_rebuild_run where rebuild_run_id = '" + FIX
                + "' and pay_resolved_at is not null and pay_resolution_reason is not null"),
                "se registra cuando y por que se resolvio");
        // P1 v23: el motivo de negocio del operador queda JUNTO al detalle tecnico del sistema.
        var resolutionReason = queryString(
                "select pay_resolution_reason from mt101_rebuild_run where rebuild_run_id = '" + FIX + "'");
        assertTrue(resolutionReason.contains("incidente INC-77 revisado contra extracto bancario"),
                () -> "falta el motivo de negocio del operador: " + resolutionReason);
        assertTrue(resolutionReason.contains("MT101_STATUS"),
                () -> "falta la evidencia tecnica del sistema: " + resolutionReason);
        // P1-API v23: la respuesta expone la evidencia de resolucion al operador.
        assertEquals("operador", result.payResolvedBy());
        assertTrue(result.payResolutionReason().contains("INC-77"));
    }

    @Test
    void childCorrectiveFromPartialPaySelectsOnlyRejectedCorrectiveFragment() throws Exception {
        rejectSecondPayFragment = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");
        service.approveAndPayCorrective(null, FIX, "luis");

        var child = rebuildService.requestRebuildFromRejectedCorrective(null, FIX, "sofia", "retry rejected");

        assertEquals(FIX, child.originalFragmentSetId());
        assertEquals(1L, child.selectedRows());
        assertEquals(1, child.affectedFragments());
        assertEquals(1L, queryLong("select count(*) from mt101_rebuild_selection "
                + "where rebuild_run_id = '" + child.rebuildRunId() + "' and original_senders_reference = 'RTEST2'"));
        assertEquals(0L, queryLong("select count(*) from mt101_rebuild_selection "
                + "where rebuild_run_id = '" + child.rebuildRunId() + "' and original_senders_reference = 'RTEST1'"));
        assertEquals(FIX, queryString("select parent_rebuild_run_id from mt101_rebuild_run "
                + "where rebuild_run_id = '" + child.rebuildRunId() + "'"));
        assertEquals(FIX, queryString("select parent_corrective_set_id from mt101_rebuild_run "
                + "where rebuild_run_id = '" + child.rebuildRunId() + "'"));
    }

    @Test
    void payFailureAfterDispatchBecomesUncertainNotReusableFailed() throws Exception {
        // P0.2 v21: si ya se despacho algun fragmento y LUEGO falla, NO debe quedar FAILED
        // (reusable -> doble pago): debe quedar UNCERTAIN para conciliacion.
        payThrowsAfterDispatch = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");

        assertThrows(RuntimeException.class, () -> service.approveAndPayCorrective(null, FIX, "luis"));

        assertEquals("UNCERTAIN", payStatus(FIX), "un fallo tras dispatch es UNCERTAIN, nunca FAILED reusable");
        assertEquals("UNCERTAIN",
                queryString("select pay_status from mt101_corrective_pay_fragment where rebuild_run_id = '"
                        + FIX + "' and corrective_senders_reference = 'RTEST1'"),
                "el fragmento despachado queda UNCERTAIN para conciliar (no reenvio ciego)");
    }

    @Test
    void postPayStatusFailureDoesNotRevertSentAndIsVisibleSeparately() throws Exception {
        // P2 v20: el PAY sale; MT101_STATUS falla DESPUES. No debe lanzar ni revertir el pago.
        statusSyncFails = true;
        service.advanceCorrective(null, FIX, "executor");
        service.requestCorrectivePay(null, FIX, "ana", "reproceso aprobado", "TCK-1");

        service.approveAndPayCorrective(null, FIX, "luis");

        assertEquals("SENT", payStatus(FIX), "el pago salio; un fallo de STATUS no lo revierte");
        assertEquals("FAILED",
                queryString("select status_sync_status from mt101_rebuild_run where rebuild_run_id = '" + FIX + "'"),
                "el fallo de la consulta posterior se ve aparte, no como 'PAY fallo'");
        assertEquals("OK",
                queryString("select reconciliation_status from mt101_rebuild_run where rebuild_run_id = '" + FIX + "'"),
                "RECONCILE corre igual: un fallo de STATUS no lo aborta");
        assertEquals(1, reconcileInvocations.get(), "RECONCILE no se omite por el fallo de STATUS");
    }

    private void markCorrective(String status) {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "update mt101_build_fragment set status = ? where fragment_set_id = '" + FIX + "'")) {
            statement.setString(1, status);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException(error);
        }
    }

    private void markReference(String reference, String status, String errorMessage) {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "update mt101_build_fragment set status = ?, error_message = ? "
                             + "where fragment_set_id = '" + FIX + "' and senders_reference = ?")) {
            statement.setString(1, status);
            statement.setString(2, errorMessage);
            statement.setString(3, reference);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException(error);
        }
    }

    private void markRoute(String reference, String routedAs, String routeError) {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "update mt101_build_fragment set routed_as = ?, route_error = ?, routed_at = current_timestamp "
                             + "where fragment_set_id = '" + FIX + "' and senders_reference = ?")) {
            statement.setString(1, routedAs);
            statement.setString(2, routeError);
            statement.setString(3, reference);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException(error);
        }
    }

    private void upsertArchive(String status) {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "insert into mt101_archive (senders_reference, process_execution_id, status) values ('RTEST1', 100, ?), ('RTEST2', 100, ?) "
                             + "on conflict (senders_reference, process_execution_id) do update set status = excluded.status")) {
            statement.setString(1, status);
            statement.setString(2, status);
            statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException(error);
        }
    }

    private String runStatus(String runId) throws SQLException {
        return queryString("select status from mt101_rebuild_run where rebuild_run_id = '" + runId + "'");
    }

    private String quarantineStatus() throws SQLException {
        return queryString("select status from mt101_failed_record where fragment_set_id = '" + SET + "'");
    }

    private String quarantineStatus(long recordNumber) throws SQLException {
        return queryString("select status from mt101_failed_record where fragment_set_id = '" + SET
                + "' and source_record_number = " + recordNumber);
    }

    private String payStatus(String runId) throws SQLException {
        return queryString("select pay_status from mt101_rebuild_run where rebuild_run_id = '" + runId + "'");
    }

    private long queryLong(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            return rs.next() ? rs.getLong(1) : 0L;
        }
    }

    private String queryString(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            return rs.next() ? rs.getString(1) : null;
        }
    }

    private List<String> queryStrings(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             var statement = connection.createStatement();
             var rs = statement.executeQuery(sql)) {
            var result = new java.util.ArrayList<String>();
            while (rs.next()) {
                result.add(rs.getString(1));
            }
            return result;
        }
    }

    private void prepareSchema() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement s = connection.createStatement()) {
            s.executeUpdate("drop table if exists mt101_corrective_pay_fragment");
            s.executeUpdate("drop table if exists mt101_rebuild_selection");
            s.executeUpdate("drop table if exists mt101_rebuild_run");
            s.executeUpdate("drop table if exists staging_record");
            s.executeUpdate("drop table if exists mt101_failed_record");
            s.executeUpdate("drop table if exists mt101_archive");
            s.executeUpdate("drop table if exists mt101_fragment_record");
            s.executeUpdate("drop table if exists mt101_build_fragment");
            s.executeUpdate("drop sequence if exists mt101_rebuild_reference_seq");
            s.executeUpdate("create sequence mt101_rebuild_reference_seq start with 2");
            s.executeUpdate("create table mt101_build_fragment ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null,"
                    + "process_execution_id bigint, task_definition_id bigint, source_table varchar(255),"
                    + "staging_id_from bigint, staging_id_to bigint,"
                    + "source_record_from bigint, source_record_to bigint, source_file_hash varchar(64),"
                    + "source_records_json text,"
                    + "fragment_index integer not null, fragment_total integer not null,"
                    + "senders_reference varchar(16) not null, superseded_by varchar(80),"
                    + "payload_hash varchar(64) not null default repeat('0', 64),"
                    + "raw_payload text not null, message_json text not null,"
                    + "status varchar(20) not null default 'BUILT',"
                    + "error_message text,"
                    + "routed_as varchar(80), routed_at timestamp, route_error text,"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            // Fragmento del set original (para findSetMetadata) y del correctivo (BUILT).
            insertBuildFragment(connection, SET, "P1", "SUPERSEDED", 1, 1, 1);
            insertBuildFragment(connection, FIX, "RTEST1", "BUILT", 1, 2, 25);
            insertBuildFragment(connection, FIX, "RTEST2", "BUILT", 2, 2, 75);
            s.executeUpdate("create table mt101_fragment_record ("
                    + "id bigserial primary key, fragment_id bigint references mt101_build_fragment(id),"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, staging_id bigint,"
                    + "source_task_definition_id bigint, source_name varchar(255),"
                    + "current_senders_reference varchar(16), current_transaction_reference varchar(35),"
                    + "rebuild_run_id varchar(80))");
            s.executeUpdate("insert into mt101_fragment_record "
                    + "(fragment_id, fragment_set_id, source_file_hash, source_record_number, staging_id, current_senders_reference, current_transaction_reference, rebuild_run_id) "
                    + "select id, '" + FIX + "', 'hashA', 25, 10025, 'RTEST1', 'C25', '" + FIX + "' "
                    + "from mt101_build_fragment where fragment_set_id = '" + FIX + "' and senders_reference = 'RTEST1'");
            s.executeUpdate("insert into mt101_fragment_record "
                    + "(fragment_id, fragment_set_id, source_file_hash, source_record_number, staging_id, current_senders_reference, current_transaction_reference, rebuild_run_id) "
                    + "select id, '" + FIX + "', 'hashA', 75, 10075, 'RTEST2', 'C75', '" + FIX + "' "
                    + "from mt101_build_fragment where fragment_set_id = '" + FIX + "' and senders_reference = 'RTEST2'");
            s.executeUpdate("create table mt101_rebuild_run ("
                    + "rebuild_run_id varchar(80) primary key, original_fragment_set_id varchar(80) not null,"
                    + "corrective_set_id varchar(80) not null, status varchar(30) not null default 'BUILT',"
                    + "requested_by varchar(120), approved_by varchar(120), executed_by varchar(120),"
                    + "request_reason text, approval_reason text, selected_rows bigint not null default 1,"
                    + "affected_fragments integer not null default 1, error_message text, reference_code varchar(12),"
                    + "connection_ref varchar(120), pay_requested_by varchar(120), pay_requested_at timestamp,"
                    + "pay_status varchar(30) not null default 'NOT_REQUESTED',"
                    + "pay_approved_by varchar(120), pay_approved_at timestamp,"
                    + "pay_claimed_by varchar(120), pay_claimed_at timestamp,"
                    + "pay_requested_payload_hash varchar(64), pay_claimed_payload_hash varchar(64),"
                    + "pay_requested_config_hash varchar(64), pay_claimed_config_hash varchar(64),"
                    + "pay_lease_until timestamp, pay_uncertain_reason text,"
                    + "pay_completed_at timestamp, pay_error_message text,"
                    + "pay_resolved_by varchar(120), pay_resolved_at timestamp, pay_resolution_reason text,"
                    + "pay_request_reason text, pay_request_ticket varchar(120),"
                    + "pay_status_config_snapshot text,"
                    + "status_sync_status varchar(20) not null default 'PENDING', status_sync_error text,"
                    + "reconciliation_status varchar(20) not null default 'PENDING', reconciliation_error text,"
                    + "parent_rebuild_run_id varchar(80), parent_corrective_set_id varchar(80),"
                    + "corrective_generation integer not null default 1,"
                    + "created_at timestamp not null default current_timestamp, approved_at timestamp, executed_at timestamp,"
                    + "built_at timestamp, completed_at timestamp, last_lifecycle_sync_at timestamp,"
                    + "updated_at timestamp not null default current_timestamp)");
            s.executeUpdate("insert into mt101_rebuild_run (rebuild_run_id, original_fragment_set_id, corrective_set_id, status, reference_code) "
                    + "values ('" + FIX + "', '" + SET + "', '" + FIX + "', 'BUILT', '1')");
            s.executeUpdate("create table staging_record ("
                    + "id bigint primary key, process_execution_id bigint, task_definition_id bigint,"
                    + "record_index bigint, payload_json text not null, version bigint not null default 1)");
            s.executeUpdate("insert into staging_record (id, process_execution_id, task_definition_id, record_index, payload_json, version) "
                    + "values (10025, 100, 20, 24, '{\"row\":25}', 1),"
                    + "(10075, 100, 20, 74, '{\"row\":75}', 1)");
            s.executeUpdate("create table mt101_rebuild_selection ("
                    + "id bigserial primary key, rebuild_run_id varchar(80) not null,"
                    + "fragment_set_id varchar(80) not null, source_file_hash varchar(64),"
                    + "source_record_number bigint not null, record_index bigint, staging_id bigint,"
                    + "source_task_definition_id bigint, source_name varchar(255),"
                    + "original_senders_reference varchar(16), original_transaction_reference varchar(35),"
                    + "corrective_senders_reference varchar(16), corrective_transaction_reference varchar(35),"
                    + "selected_payload_hash varchar(64), selected_staging_version bigint,"
                    + "status varchar(30) not null default 'SELECTED',"
                    + "created_at timestamp not null default current_timestamp,"
                    + "lifecycle_updated_at timestamp)");
            s.executeUpdate("insert into mt101_rebuild_selection (rebuild_run_id, fragment_set_id, source_file_hash, source_record_number, staging_id, original_senders_reference, corrective_senders_reference) "
                    + "values ('" + FIX + "', '" + SET + "', 'hashA', 25, 10025, 'P1', 'RTEST1'),"
                    + "('" + FIX + "', '" + SET + "', 'hashA', 75, 10075, 'P2', 'RTEST2')");
            s.executeUpdate("create table mt101_failed_record ("
                    + "id bigserial primary key, fragment_set_id varchar(80) not null, senders_reference varchar(16),"
                    + "source_file_hash varchar(64), source_record_number bigint, staging_id bigint,"
                    + "status varchar(40) not null default 'QUARANTINED',"
                    + "resolved_at timestamp)");
            s.executeUpdate("insert into mt101_failed_record (fragment_set_id, senders_reference, source_file_hash, source_record_number, staging_id, status) "
                    + "values ('" + SET + "', 'P1', 'hashA', 25, 10025, 'REBUILD_PENDING_VALIDATION'),"
                    + "('" + SET + "', 'P2', 'hashA', 75, 10075, 'REBUILD_PENDING_VALIDATION')");
            s.executeUpdate("create table mt101_archive ("
                    + "id bigserial primary key, senders_reference varchar(16) not null, process_execution_id bigint,"
                    + "status varchar(20) not null default 'ARCHIVED')");
            s.executeUpdate("create unique index ux_archive_ref_exec_corr on mt101_archive (senders_reference, process_execution_id)");
            s.executeUpdate("create table mt101_corrective_pay_fragment ("
                    + "id bigserial primary key, rebuild_run_id varchar(80) not null references mt101_rebuild_run(rebuild_run_id) on delete cascade,"
                    + "corrective_set_id varchar(80) not null, corrective_senders_reference varchar(16) not null,"
                    + "source_file_hash varchar(64), source_record_number bigint, staging_id bigint,"
                    + "payload_hash varchar(64) not null, idempotency_key varchar(180) not null,"
                    + "transport varchar(20), endpoint_ref varchar(512), approved_routed_as varchar(80),"
                    + "gateway_reference varchar(120), pay_status varchar(30) not null default 'REQUESTED',"
                    + "attempts integer not null default 0, error_message text,"
                    + "prepared_at timestamp, dispatched_at timestamp,"
                    + "resolved_at timestamp, resolution_source varchar(40),"
                    + "created_at timestamp not null default current_timestamp,"
                    + "updated_at timestamp not null default current_timestamp,"
                    + "unique (rebuild_run_id, corrective_senders_reference))");
            s.executeUpdate("drop table if exists mt101_corrective_pay_action");
            s.executeUpdate("create table mt101_corrective_pay_action ("
                    + "id bigserial primary key, rebuild_run_id varchar(80) not null,"
                    + "action_type varchar(30) not null, previous_status varchar(30), new_status varchar(30),"
                    + "actor varchar(120), reason text, ticket varchar(120),"
                    + "payload_hash varchar(64), config_hash varchar(64),"
                    + "created_at timestamp not null default current_timestamp)");
            // V53: refuerzo append-only (mismo trigger que produccion) para evidenciarlo en test.
            s.executeUpdate("create or replace function mt101_pay_action_block_mutation() returns trigger as $$ "
                    + "begin raise exception 'mt101_corrective_pay_action is append-only: % is not allowed', tg_op; "
                    + "end; $$ language plpgsql");
            s.executeUpdate("drop trigger if exists trg_mt101_pay_action_no_row_mutation on mt101_corrective_pay_action");
            s.executeUpdate("create trigger trg_mt101_pay_action_no_row_mutation "
                    + "before update or delete on mt101_corrective_pay_action "
                    + "for each row execute function mt101_pay_action_block_mutation()");
        }
    }

    private void insertBuildFragment(Connection connection,
                                     String fragmentSetId,
                                     String reference,
                                     String status,
                                     int index,
                                     int total,
                                     long recordNumber) throws Exception {
        var message = sampleMessage(reference, index, total);
        var rawPayload = message.rawPayload();
        try (var statement = connection.prepareStatement("""
                insert into mt101_build_fragment
                    (fragment_set_id, process_execution_id, task_definition_id, source_table,
                     staging_id_from, staging_id_to, source_record_from, source_record_to,
                     source_file_hash, fragment_index, fragment_total, senders_reference,
                     payload_hash, raw_payload, message_json, status)
                values (?, 100, 20, 'staging_record',
                        ?, ?, ?, ?, 'hashA', ?, ?, ?,
                        ?, ?, ?, ?)
                """)) {
            statement.setString(1, fragmentSetId);
            statement.setLong(2, recordNumber);
            statement.setLong(3, recordNumber);
            statement.setLong(4, recordNumber);
            statement.setLong(5, recordNumber);
            statement.setInt(6, index);
            statement.setInt(7, total);
            statement.setString(8, reference);
            statement.setString(9, sha256(rawPayload));
            statement.setString(10, rawPayload);
            statement.setString(11, objectMapper.writeValueAsString(message));
            statement.setString(12, status);
            statement.executeUpdate();
        }
    }

    private Mt101Message sampleMessage(String reference, int index, int total) {
        var rawPayload = "{1:F01SGOBFRPPAXXX0000000000}{2:I101BCPLPEPLXXXXN}{4:\n"
                + ":20:" + reference + "\n"
                + ":28D:" + index + "/" + total + "\n"
                + ":50H:/001\nACME\n"
                + ":30:260612\n"
                + ":21:TX-" + reference + "\n"
                + ":32B:PEN100,00\n"
                + ":59:/ACC-" + reference + "\nBENE\n"
                + "-}";
        return new Mt101Message(
                new Mt101Message.Envelope("SGOBFRPPAXXX", "BCPLPEPLXXXX", "uetr-" + reference, "N"),
                new Mt101Message.SequenceA(reference, null, index, total, LocalDate.of(2026, 6, 12),
                        null, new Mt101Message.Party("H", "001", null, List.of("ACME")), null, null),
                List.of(new Mt101Message.Transaction(
                        1, "TX-" + reference, null, null,
                        new Mt101Message.Amount("PEN", new BigDecimal("100.00")),
                        null, null, null, null,
                        new Mt101Message.Party("", "ACC-" + reference, null, List.of("BENE")),
                        null, null, null, "SHA", null, null)),
                new Mt101Message.ControlTotals(1, Map.of("PEN", new BigDecimal("100.00"))),
                rawPayload,
                "FIN");
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    private DataSource dataSource() {
        var ds = new PGSimpleDataSource();
        ds.setURL(POSTGRES.getJdbcUrl());
        ds.setUser(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());
        return ds;
    }
}
