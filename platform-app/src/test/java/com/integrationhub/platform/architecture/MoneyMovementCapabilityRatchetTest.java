package com.integrationhub.platform.architecture;

import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskProvider;
import com.integrationhub.platform.spi.task.TaskResult;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-021: TRINQUETE de las capacidades del money-path.
 *
 * <p><b>El problema que resuelve.</b> {@link TaskProvider#movesMoney()} y
 * {@link TaskProvider#producesConsumableRecords()} son opt-in con default {@code false}. Eso es
 * correcto para no romper providers existentes, pero deja el <b>modo inseguro en silencio</b>: un
 * vertical nuevo que agregue {@code SBS_PAY} y olvide el {@code @Override} no produce error, ni
 * warning, ni test rojo. El unico sintoma seria un pago duplicado en produccion, porque la
 * recuperacion de ejecuciones huerfanas re-encolaria esa ejecucion a ciegas en vez de dejarla en
 * {@code NEEDS_RECONCILIATION}.</p>
 *
 * <p><b>Como lo evita.</b> Congela el mapa {@code tipo -> capacidades} de todos los providers CDI
 * locales. Un tipo nuevo no compila contra el mapa y el test falla pidiendo una decision explicita;
 * cambiar la capacidad de un tipo existente tambien falla. En ambos casos el arreglo es editar
 * {@link #CAPACIDADES_CONGELADAS}, de modo que la decision queda <b>visible en el diff</b> — el mismo
 * patron del freeze-store de {@link VerticalBoundaryArchTest}.</p>
 *
 * <p><b>Por que no basta con el nombre.</b> Una regla puramente lexica ({@code *_PAY}) no cubre a un
 * vertical que nombre su tarea {@code SBS_ENVIO}. Por eso la autoridad es el mapa congelado, que
 * atrapa <b>cualquier</b> tipo nuevo sin importar el idioma. La regla por nombre se conserva como
 * segundo filtro porque da un diagnostico especifico en el caso comun, en vez del generico "tipo
 * desconocido".</p>
 *
 * <p>No hay exclusiones ocultas: los providers de prueba ({@code TEST_*}) tambien estan en el mapa.
 * Filtrarlos por prefijo seria un agujero silencioso.</p>
 *
 * <p><b>LIMITE CONOCIDO — que este trinquete NO cubre.</b> La capacidad se declara por <i>tipo de
 * provider</i>, pero "¿esto mueve dinero?" es en realidad una propiedad de la <i>tarea configurada</i>.
 * {@code FILE_DELIVER} es generico y acepta cualquier {@code sinkRef} con {@code direction} de salida
 * —el mismo mecanismo con el que {@code MT101_PAY} deja el archivo en el banco—, asi que un operador
 * puede armar una entrega de pagos con el. Ese caso declara {@code movesMoney=false} con razon (el
 * tipo es generico) y aun asi mueve dinero, o sea que la recuperacion de huerfanas lo re-encolaria.
 *
 * <p>No es una regresion de ADR-021: con el literal {@code "MT101_PAY"} anterior ese hueco era
 * identico. Cerrarlo pide evaluar la capacidad sobre la tarea configurada (p.ej. marcar el sink como
 * critico de dinero y propagarlo), que es un cambio de diseño mas grande que este trinquete.</p>
 */
// @covers ADR-021
@QuarkusTest
class MoneyMovementCapabilityRatchetTest {

    /**
     * Fragmentos que, en el nombre de un tipo de tarea, denotan salida de dinero. Se comparan sobre
     * el tipo en mayusculas y separado por {@code _}. Incluye castellano a proposito: los verticales
     * de este proyecto se nombran en ambos idiomas.
     */
    private static final Set<String> PALABRAS_DE_PAGO =
            Set.of("PAY", "PAGO", "DISPATCH", "DESPACHO", "SEND", "ENVIO", "TRANSFER", "REMIT");

    /**
     * Tipos cuyo nombre suena a pago pero que NO mueven dinero (p.ej. un reporte de pagos). Vacio a
     * proposito: llenarlo tiene que ser una decision revisada, no un atajo para silenciar el test.
     */
    private static final Set<String> SUENAN_A_PAGO_PERO_NO_MUEVEN_DINERO = Set.of();

    /** Capacidades declaradas hoy por cada provider CDI local. Ver el javadoc de la clase. */
    private static final Map<String, Capacidades> CAPACIDADES_CONGELADAS = Map.ofEntries(
            // --- Motor ---
            Map.entry("DB_EXECUTE_FN", Capacidades.de(false, false)),
            Map.entry("DB_EXECUTE_SP", Capacidades.de(false, false)),
            Map.entry("DB_WRITE", Capacidades.de(false, false)),
            Map.entry("FILE_COMPRESS", Capacidades.de(false, false)),
            Map.entry("FILE_DELIVER", Capacidades.de(false, false)),
            Map.entry("FILE_WRITE", Capacidades.de(false, false)),
            Map.entry("NOTIFICATION", Capacidades.de(false, false)),
            Map.entry("REST_CALL", Capacidades.de(false, false)),
            // --- Vertical SWIFT MT101 ---
            // MT101_PAY es el UNICO que mueve dinero: es el que entrega la orden al banco.
            Map.entry("MT101_PAY", Capacidades.de(true, false)),
            // MT101_PARSE publica `records` que las tareas siguientes consumen, asi que el motor no
            // puede fusionarlo al fast path de lectura (ese camino solo materializa un summary).
            Map.entry("MT101_PARSE", Capacidades.de(false, true)),
            Map.entry("MT101_ARCHIVE", Capacidades.de(false, false)),
            Map.entry("MT101_BUILD_FROM_TABLE", Capacidades.de(false, false)),
            Map.entry("MT101_INBOUND_DELIVER", Capacidades.de(false, false)),
            Map.entry("MT101_PARSE_FROM_TABLE", Capacidades.de(false, false)),
            Map.entry("MT101_RECONCILE", Capacidades.de(false, false)),
            Map.entry("MT101_REPAIR", Capacidades.de(false, false)),
            Map.entry("MT101_ROUTE", Capacidades.de(false, false)),
            Map.entry("MT101_SPLIT", Capacidades.de(false, false)),
            // MT101_STATUS consulta al banco y concilia; no emite ninguna orden de pago.
            Map.entry("MT101_STATUS", Capacidades.de(false, false)),
            Map.entry("MT101_VALIDATE", Capacidades.de(false, false)),
            // --- Vertical ISO20022 ---
            Map.entry("PAIN001_PARSE", Capacidades.de(false, false)),
            // --- Dobles de prueba (solo existen bajo @QuarkusTest) ---
            Map.entry("TEST_BUSINESS_FAILURE", Capacidades.de(false, false)),
            Map.entry("TEST_FOLLOW_UP", Capacidades.de(false, false)),
            Map.entry("TEST_SCATTER_BATCH", Capacidades.de(false, false)),
            Map.entry("TEST_SUSPENDABLE", Capacidades.de(false, false)),
            Map.entry("TEST_SUSPEND_COMPLETE", Capacidades.de(false, false)),
            Map.entry("TEST_SUSPEND_TWICE", Capacidades.de(false, false)));

    @Inject
    Instance<TaskProvider> providers;

    @Test
    @DisplayName("cada provider declara sus capacidades tal como estan congeladas")
    void capacidadesCongeladas() {
        var declaradas = capacidadesDeclaradas();

        var nuevos = new ArrayList<String>();
        var cambiados = new ArrayList<String>();
        declaradas.forEach((tipo, actual) -> {
            var congelada = CAPACIDADES_CONGELADAS.get(tipo);
            if (congelada == null) {
                nuevos.add("  %s -> %s".formatted(tipo, actual));
            } else if (!congelada.equals(actual)) {
                cambiados.add("  %s: congelado %s, declarado %s".formatted(tipo, congelada, actual));
            }
        });
        var desaparecidos = new ArrayList<>(CAPACIDADES_CONGELADAS.keySet());
        desaparecidos.removeAll(declaradas.keySet());

        assertTrue(nuevos.isEmpty(), """
                Hay tipos de tarea que el trinquete no conoce. Agregalos a CAPACIDADES_CONGELADAS \
                declarando EXPLICITAMENTE si mueven dinero: si la tarea entrega una orden de pago a un \
                banco o gateway, tiene que sobrescribir movesMoney() a true, o la recuperacion de \
                ejecuciones huerfanas la re-encolara a ciegas tras una caida de nodo.
                Tipos nuevos:
                """ + String.join("\n", nuevos));

        assertTrue(cambiados.isEmpty(), """
                Cambio una capacidad ya congelada. Si el cambio es correcto, actualiza \
                CAPACIDADES_CONGELADAS en el mismo commit para que quede visible en el diff.
                Diferencias:
                """ + String.join("\n", cambiados));

        assertTrue(desaparecidos.isEmpty(), """
                Hay tipos congelados que ya no registra ningun provider. Si se eliminaron, quitalos de \
                CAPACIDADES_CONGELADAS; dejarlos oculta que el trinquete dejo de cubrirlos.
                Tipos ausentes: """ + desaparecidos);
    }

    @Test
    @DisplayName("todo tipo que suena a pago declara movesMoney()")
    void tiposDePagoDeclaranQueMuevenDinero() {
        var incumplen = capacidadesDeclaradas().entrySet().stream()
                .filter(entrada -> suenaAPago(entrada.getKey()))
                .filter(entrada -> !entrada.getValue().mueveDinero())
                .filter(entrada -> !SUENAN_A_PAGO_PERO_NO_MUEVEN_DINERO.contains(entrada.getKey()))
                .map(Map.Entry::getKey)
                .toList();

        assertTrue(incumplen.isEmpty(), """
                Estos tipos se llaman como una tarea de pago pero no declaran movesMoney(). Si de \
                verdad mueven dinero, sobrescribe la capacidad en su TaskProvider. Si NO lo hacen \
                (p.ej. un reporte), agregalos a SUENAN_A_PAGO_PERO_NO_MUEVEN_DINERO con el motivo.
                Tipos: """ + incumplen);
    }

    @Test
    @DisplayName("la regla por nombre muerde: un provider de pago sin la capacidad se detecta")
    void laReglaPorNombreMuerde() {
        // Prueba negativa: sin esto, un trinquete que nunca falla pasaria por bueno.
        var falsoProviderDePago = new TaskProvider() {
            @Override
            public String type() {
                return "SBS_ENVIO";
            }

            @Override
            public TaskResult execute(TaskContext context, Map<String, Object> configuration) {
                throw new UnsupportedOperationException("doble de prueba");
            }
            // NO sobrescribe movesMoney(): es exactamente el olvido que el trinquete debe atrapar.
        };

        assertTrue(suenaAPago(falsoProviderDePago.type()),
                "la regla debe reconocer 'SBS_ENVIO' como nombre de tarea de pago");
        assertFalse(falsoProviderDePago.movesMoney(),
                "el default del SPI es false: por eso el olvido es silencioso");
        assertTrue(suenaAPago(falsoProviderDePago.type()) && !falsoProviderDePago.movesMoney(),
                "este provider cumple la condicion de fallo, asi que la regla lo marcaria");

        // Y la contraparte: el provider real de pago SI la declara.
        assertTrue(capacidadesDeclaradas().get("MT101_PAY").mueveDinero(),
                "MT101_PAY entrega la orden al banco: tiene que declarar movesMoney()");
    }

    /** {@code tipo -> capacidades} de los providers CDI locales, ordenado para diagnosticos estables. */
    private Map<String, Capacidades> capacidadesDeclaradas() {
        var declaradas = new TreeMap<String, Capacidades>();
        providers.forEach(provider -> {
            var tipo = provider.type();
            if (tipo != null && !tipo.isBlank()) {
                declaradas.put(tipo, Capacidades.de(provider.movesMoney(), provider.producesConsumableRecords()));
            }
        });
        return declaradas;
    }

    private static boolean suenaAPago(String tipo) {
        var partes = tipo.toUpperCase(Locale.ROOT).split("_");
        return List.of(partes).stream().anyMatch(PALABRAS_DE_PAGO::contains);
    }

    /** Las dos capacidades opt-in del SPI, juntas para congelarlas como una sola decision. */
    private record Capacidades(boolean mueveDinero, boolean produceRecordsConsumibles) {

        static Capacidades de(boolean mueveDinero, boolean produceRecordsConsumibles) {
            return new Capacidades(mueveDinero, produceRecordsConsumibles);
        }

        @Override
        public String toString() {
            return "movesMoney=%s producesConsumableRecords=%s".formatted(mueveDinero, produceRecordsConsumibles);
        }
    }
}
