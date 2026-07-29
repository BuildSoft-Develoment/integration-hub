package com.integrationhub.vertical.swift.mt101.service;

import com.integrationhub.platform.spi.process.ProcessDefinitionValidator;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

/**
 * #2 (extensión — cobertura semántica de conexión) — validación de definición del money-path MT101_PAY normal.
 *
 * <p><b>Regla:</b> si un {@code MT101_PAY} tiene, POSTERIOR y en el mismo proceso, un
 * {@code MT101_STATUS(resolveNormalPay=true)} (el auto-resolutor in-process del UNCERTAIN normal), entonces ese STATUS
 * <b>debe</b> usar el <b>mismo</b> {@code connectionRef} que el {@code MT101_PAY}. Si no, el resolutor lee el set de
 * fragmentos ({@code mt101_build_fragment}) desde un ledger/BD distinto al que el PAY escribió → encuentra 0 fragmentos
 * → reporta "todo resuelto" → el proceso cierra {@code COMPLETED} mientras el dinero sigue {@code UNCERTAIN} en la otra
 * conexión. Fail-loud (400 al publicar), sin fallback.</p>
 *
 * <p><b>Emparejamiento explícito (evita el falso positivo multi-banco):</b> con un único {@code MT101_PAY} en el
 * proceso, el STATUS resolutor se empareja con él sin ambigüedad. Con <b>varios</b> {@code MT101_PAY}, cada STATUS
 * resolutor <b>debe</b> declarar {@code resolvesPayTaskRef} = el {@code taskRef} del PAY que resuelve; si no lo
 * declara, es ambigüedad → 400 (no se adivina comparando contra todos los PAY, que rechazaría un grafo válido
 * PAY_A/STATUS_A + PAY_B/STATUS_B). El par comparado es exactamente (PAY nombrado, STATUS).</p>
 *
 * <p><b>Alcance (por qué es sano):</b> el {@code connectionRef} es config estática de ambos providers, enumerable en
 * definición. {@code null}/blank normaliza a "conexión por defecto" (ambos sin {@code connectionRef} = misma conexión).
 * NO valida {@code fragmentSetId} (derivado en runtime del output upstream): eso no es verificable en definición sin
 * falsos positivos.</p>
 *
 * <p><b>Segunda regla (ADR-017, 2026-07-29): la CONEXIÓN BANCARIA por ruta.</b> Este javadoc decía que el
 * transporte por ruta tampoco era verificable, y era cierto mientras la conexión se escribía INLINE en cada tarea:
 * compararla habría exigido cotejar host, puerto y credenciales, y cualquier diferencia cosmética habría rechazado
 * un grafo válido. Con {@code sinkRef} la conexión es una referencia numérica a una fuente {@code /sources}, así que
 * comparar dos rutas del mismo nombre es comparar dos números — sin falsos positivos. Ver {@code validateRouteSinks}.</p>
 *
 * <p><b>Alcance de esa segunda regla (corregido 2026-07-29).</b> La simetría de sinks NO depende de
 * {@code resolveNormalPay}: un {@code MT101_STATUS} que no concilia igual consulta al banco por ruta, así que
 * pagarle a uno y preguntarle a otro rompe lo mismo. Estaba detrás de ese flag, y como el formulario no lo expone
 * —sale ausente en todo proceso armado por la UI— la comprobación quedaba dormida justo en el camino que usa el
 * operador. Ahora se aplica a todo STATUS route-aware, el mismo criterio de disparo que ya usa
 * {@link Mt101StatusRouteCoverageValidator} para la cobertura de rutas. La regla del {@code connectionRef}, en
 * cambio, sí sigue atada al resolutor: solo el que concilia lee el set de fragmentos.</p>
 */
@ApplicationScoped
public class Mt101PayStatusConnectionCoverageValidator implements ProcessDefinitionValidator {

    private static final String MT101_STATUS = "MT101_STATUS";

    private final Mt101PayResolverPairing pairing;
    private final boolean strictRouteSinks;

    @Inject
    public Mt101PayStatusConnectionCoverageValidator(ObjectMapper objectMapper) {
        this(objectMapper, resolveStrictRouteSinks());
    }

    /** Para tests: fija la politica sin depender del contexto de configuracion. */
    Mt101PayStatusConnectionCoverageValidator(ObjectMapper objectMapper, boolean strictRouteSinks) {
        this.pairing = new Mt101PayResolverPairing(objectMapper);
        this.strictRouteSinks = strictRouteSinks;
    }

    /**
     * Politica ESTRICTA de conexion bancaria por ruta (C-2). Default {@code false} para no bloquear la
     * migracion; el template de produccion la pone en {@code true}, igual que
     * {@code maker-checker.enabled} y {@code direct-list.enabled}.
     *
     * <p>Con la politica activa, una ruta de pago tiene que declarar su banco por {@code sinkRef} y el
     * STATUS que la consulta tiene que declarar el MISMO. En modo permisivo solo se rechaza la
     * divergencia explicita —dos {@code sinkRef} distintos—, que es lo que ya hacia.</p>
     */
    private static boolean resolveStrictRouteSinks() {
        try {
            return org.eclipse.microprofile.config.ConfigProvider.getConfig()
                    .getOptionalValue("mt101.pay.route-sink.strict", Boolean.class).orElse(false);
        } catch (RuntimeException ignored) {
            // Sin contexto de config (tests planos): permisivo, para no cambiar el comportamiento por accidente.
            return false;
        }
    }

    /**
     * Valida el grafo. Lanza {@link IllegalArgumentException} (mapeada a 400 por el recurso) si un
     * {@code MT101_STATUS(resolveNormalPay=true)} resuelve un {@code MT101_PAY} con {@code connectionRef} distinto, o
     * si con varios PAY el STATUS no declara a cuál resuelve ({@code resolvesPayTaskRef}).
     */
    public void validate(List<ProcessTaskView> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        var pays = pairing.pays(tasks);
        if (pays.isEmpty()) {
            return;
        }
        // "toda ruta de pago nombra su banco" es una propiedad del PAY, no del par PAY-STATUS: se
        // comprueba una vez por pago y no depende de que exista un STATUS ni de que este concilie.
        // Colgarla del emparejamiento la habria dejado dormida justo donde no hay resolutor.
        pays.forEach(this::requireEveryPayRouteDeclaresItsBank);
        for (var status : tasks) {
            // Espejo de la regla del PAY, y por el mismo motivo: es propiedad del STATUS, asi que se
            // aplica concilie o no. Va antes del emparejamiento para no repetirla en los dos caminos.
            requireEveryStatusRouteNamesItsBank(status);
            if (!pairing.isNormalPayResolver(status)) {
                // Un STATUS que NO concilia el PAY normal igual consulta al banco por ruta, asi que su
                // simetria de sinks importa lo mismo. Antes todo este metodo estaba detras del
                // `resolveNormalPay`, de modo que la comprobacion quedaba dormida justo para los procesos
                // armados desde la UI —que no expone ese flag y lo deja ausente—.
                validateRouteSinksAgainstEveryPay(status, pays);
                continue;
            }
            var pay = pairing.payForResolver(status, pays);
            if (pay == null) {
                // No hay PAY anterior que emparejar: este validador solo cubre la cobertura de conexión PAY→STATUS.
                // "PAY sin resolutor" o "resolutor sin PAY" son responsabilidad de Mt101PayResolutionValidator.
                continue;
            }
            var payConnection = pairing.connectionOf(pay);
            var statusConnection = pairing.connectionOf(status);
            if (!java.util.Objects.equals(payConnection, statusConnection)) {
                throw new IllegalArgumentException(
                        "MT101_STATUS (task order " + status.taskOrder() + ") resolves the normal PAY "
                        + "(resolveNormalPay=true) but reads connection '"
                        + Mt101PayResolverPairing.describeConnection(statusConnection)
                        + "', which differs from the MT101_PAY (task order " + pay.taskOrder() + ") connection '"
                        + Mt101PayResolverPairing.describeConnection(payConnection) + "'. The resolver must use the "
                        + "same connectionRef as the MT101_PAY; otherwise it reads an empty fragment set from the "
                        + "wrong ledger and would falsely close the process while the money is still UNCERTAIN.");
            }
            validateRouteSinks(pay, status);
        }
    }

    /**
     * ADR-017: si PAY y STATUS declaran {@code sinkRef} para la MISMA ruta, tiene que ser la misma fuente.
     *
     * <p>Cuando difieren, el pago sale hacia un banco y su confirmacion se busca en otro: el ACK nunca
     * aparece, el fragmento se queda {@code UNCERTAIN} y el operador ve "el banco no respondio" sin nada
     * que lo distinga de un banco realmente caido.</p>
     *
     * <p><b>Por que ahora si se puede.</b> El javadoc de esta clase decia que el transporte por ruta "no es
     * verificable en definicion sin falsos positivos", y era cierto: la conexion se escribia INLINE en cada
     * tarea, asi que comparar habria exigido cotejar host, puerto y credenciales — con cualquier diferencia
     * cosmetica rechazando un grafo valido. Con {@code sinkRef} la conexion es una referencia numerica a una
     * fuente, y comparar dos numeros no tiene falsos positivos.</p>
     *
     * <p>Solo se comparan las rutas donde AMBOS declaran {@code sinkRef}. Una en modo inline, o presente en
     * uno solo, se omite: ahi no hay nada que cotejar y exigirlo rechazaria configuraciones legitimas —
     * incluida la mixta, con unas rutas migradas a fuente y otras todavia inline.</p>
     */
    /**
     * C-2, politica estricta: TODA ruta de pago declara su banco por {@code sinkRef}.
     *
     * <p>Una ruta con la conexion escrita inline mete host y credenciales del banco dentro de la
     * definicion del proceso —problema de higiene de secretos por si solo— y ademas deja la simetria
     * sin nada que comparar. En modo permisivo se acepta para migrar; en produccion no.</p>
     *
     * <p>Se mira {@code routeTransports}, no el transporte simple: un PAY sin rutas (un solo banco por
     * {@code sinkRef} o config inline global) no entra en esta regla, que es sobre el modelo por ruta.</p>
     */
    private void requireEveryPayRouteDeclaresItsBank(ProcessTaskView pay) {
        if (!strictRouteSinks) {
            return;
        }
        var declaredRoutes = pairing.routeNames(pay, "routeTransports");
        var withSink = pairing.routeSinkRefs(pay, "routeTransports").keySet();
        var inline = new java.util.LinkedHashSet<>(declaredRoutes);
        inline.removeAll(withSink);
        if (inline.isEmpty()) {
            return;
        }
        throw new IllegalArgumentException(
                "MT101_PAY (task order " + pay.taskOrder() + ") dispatches route(s) " + inline
                + " with an inline bank connection. With mt101.pay.route-sink.strict every payment route must "
                + "name its bank by sinkRef (an /sources OUTPUT/BOTH definition): inline puts host and "
                + "credentials inside the process definition and leaves nothing to compare against the "
                + "MT101_STATUS that reads the confirmation.");
    }

    /**
     * C-2, cara del STATUS: toda ruta que se consulta nombra su banco por {@code sinkRef}.
     *
     * <p>Espejo de {@link #requireEveryPayRouteDeclaresItsBank}. Sin esto la politica quedaba a medias:
     * el PAY estaba obligado a nombrar su banco pero el STATUS podia consultar la misma ruta contra un
     * host inline, que es exactamente el desvio que la politica existe para impedir.</p>
     */
    private void requireEveryStatusRouteNamesItsBank(ProcessTaskView status) {
        if (!strictRouteSinks || !MT101_STATUS.equalsIgnoreCase(status.taskType())) {
            return;
        }
        var inline = new java.util.LinkedHashSet<>(pairing.routeNames(status, "routeQuery"));
        inline.removeAll(pairing.routeSinkRefs(status, "routeQuery").keySet());
        if (inline.isEmpty()) {
            return;
        }
        throw new IllegalArgumentException(
                "MT101_STATUS (task order " + status.taskOrder() + ") queries route(s) " + inline
                + " with an inline bank connection. With mt101.pay.route-sink.strict every queried route must "
                + "name its bank by sinkRef (an /sources OUTPUT/BOTH definition), so it can be checked against "
                + "the sink the MT101_PAY dispatched that route to.");
    }

    /**
     * Simetria de sinks para un STATUS que NO concilia el PAY normal.
     *
     * <p>Sin par explicito no se puede senalar UN pay, asi que se compara contra la union de los sinks
     * que los PAY del grafo usan para esa misma ruta: si ninguno despacha esa ruta al sink que el STATUS
     * consulta, el pago y su confirmacion van a bancos distintos. Comparar contra la union —y no contra
     * cada PAY por separado— es lo que evita el falso positivo del grafo legitimo PAY_A/PAY_B, donde cada
     * uno atiende su propia ruta.</p>
     *
     * <p>Cuando el STATUS <b>si</b> declara a que PAY resuelve, se usa {@link #validateRouteSinks} contra
     * ese PAY, que es mas preciso: detecta el desvio aunque OTRO pay del grafo use ese sink.</p>
     */
    private void validateRouteSinksAgainstEveryPay(ProcessTaskView status, List<ProcessTaskView> pays) {
        var statusSinks = pairing.routeSinkRefs(status, "routeQuery");
        if (statusSinks.isEmpty()) {
            return;
        }
        for (var route : statusSinks.entrySet()) {
            var sinksDelPay = new java.util.LinkedHashSet<Long>();
            for (var pay : pays) {
                var sink = pairing.routeSinkRefs(pay, "routeTransports").get(route.getKey());
                if (sink != null) {
                    sinksDelPay.add(sink);
                }
            }
            if (sinksDelPay.isEmpty() || sinksDelPay.contains(route.getValue())) {
                continue;
            }
            throw new IllegalArgumentException(
                    "MT101_STATUS (task order " + status.taskOrder() + ") queries route '" + route.getKey()
                    + "' against sink " + route.getValue() + ", but no MT101_PAY in this process dispatches "
                    + "that route to it (they use " + sinksDelPay + "). Payment and confirmation would use "
                    + "different bank connections: the ACK/NACK would never be found, the fragment would stay "
                    + "UNCERTAIN and the operator could not tell it apart from a bank that is down. "
                    + "Point both at the same OUTPUT/BOTH source.");
        }
    }

    private void validateRouteSinks(ProcessTaskView pay, ProcessTaskView status) {
        var paySinks = pairing.routeSinkRefs(pay, "routeTransports");
        if (paySinks.isEmpty()) {
            return;
        }
        var statusSinks = pairing.routeSinkRefs(status, "routeQuery");
        for (var route : paySinks.entrySet()) {
            var statusSink = statusSinks.get(route.getKey());
            // Sin sink del lado del STATUS no hay dos numeros que comparar. En modo estricto ese caso ya
            // lo rechazo `requireEveryStatusRouteNamesItsBank` antes de llegar aca, asi que este `continue`
            // solo cubre la migracion.
            if (statusSink == null || statusSink.equals(route.getValue())) {
                continue;
            }
            throw new IllegalArgumentException(
                    "MT101_STATUS (task order " + status.taskOrder() + ") queries route '" + route.getKey()
                    + "' against sink " + statusSink + ", but the MT101_PAY (task order " + pay.taskOrder()
                    + ") dispatches that same route to sink " + route.getValue() + ". Payment and confirmation "
                    + "would use different bank connections: the ACK/NACK would never be found, the fragment "
                    + "would stay UNCERTAIN and the operator could not tell it apart from a bank that is down. "
                    + "Point both at the same OUTPUT/BOTH source.");
        }
    }
}
