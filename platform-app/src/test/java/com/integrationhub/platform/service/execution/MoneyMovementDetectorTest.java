package com.integrationhub.platform.service.execution;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import com.integrationhub.platform.service.TaskProviderRegistry;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * ADR-021 (E): "mueve dinero" es propiedad de la TAREA CONFIGURADA, no solo de su tipo.
 *
 * <p>El caso que motiva el bloque: {@code FILE_DELIVER} es generico y declara {@code movesMoney=false}
 * con razon, pero apuntando al sink del banco entrega pagos. Sin esto, la recuperacion de huerfanas lo
 * re-encolaria a ciegas tras una caida de nodo.</p>
 */
class MoneyMovementDetectorTest {

    private final TaskProviderRegistry providers = mock(TaskProviderRegistry.class);
    private final SourceDefinitionRepository sources = mock(SourceDefinitionRepository.class);
    private final MoneyMovementDetector detector =
            new MoneyMovementDetector(providers, sources, new ObjectMapper());

    private static SourceDefinition source(boolean moneyCritical) {
        var source = new SourceDefinition();
        source.moneyCritical = moneyCritical;
        return source;
    }

    @Test
    void aTaskWhoseProviderDeclaresTheCapabilityMovesMoney() {
        when(providers.moneyMovementTaskTypes()).thenReturn(Set.of("MT101_PAY"));
        assertTrue(detector.movesMoney("MT101_PAY", "{}"));
    }

    @Test
    void aGenericDeliveryToABankSinkMovesMoney() {
        // EL caso del bloque. FILE_DELIVER no declara la capacidad —es generico— pero el sink 11 esta
        // marcado como banco, asi que esta tarea CONFIGURADA si mueve dinero.
        when(providers.moneyMovementTaskTypes()).thenReturn(Set.of("MT101_PAY"));
        when(sources.findById(11L)).thenReturn(source(true));
        assertTrue(detector.movesMoney("FILE_DELIVER", "{\"sinkRef\":11}"));
    }

    @Test
    void theSameDeliveryToAnOrdinarySinkDoesNot() {
        // La contraparte, y por que no alcanza con mirar el tipo: la MISMA tarea a otro destino no mueve
        // dinero. Marcar FILE_DELIVER entero seria mandar a NEEDS_RECONCILIATION cada entrega de archivos.
        when(providers.moneyMovementTaskTypes()).thenReturn(Set.of("MT101_PAY"));
        when(sources.findById(7L)).thenReturn(source(false));
        assertFalse(detector.movesMoney("FILE_DELIVER", "{\"sinkRef\":7}"));
    }

    @Test
    void aTaskWithoutASinkDoesNotMoveMoney() {
        when(providers.moneyMovementTaskTypes()).thenReturn(Set.of("MT101_PAY"));
        assertFalse(detector.movesMoney("DB_WRITE", "{\"targetTable\":\"staging_record\"}"));
    }

    @Test
    void anUnknownSinkDoesNotMoveMoney() {
        // Fuente borrada entre la definicion y la ejecucion: la tarea no va a poder entregar igual.
        when(providers.moneyMovementTaskTypes()).thenReturn(Set.of("MT101_PAY"));
        when(sources.findById(anyLong())).thenReturn(null);
        assertFalse(detector.movesMoney("FILE_DELIVER", "{\"sinkRef\":99}"));
    }

    @Test
    void malformedConfigurationDoesNotBreakTheTaskStart() {
        // Un JSON roto lo rechaza quien lo parsea de verdad. Reventar en el ARRANQUE por un error de
        // parseo aca ocultaria el error real detras de uno que no explica nada.
        when(providers.moneyMovementTaskTypes()).thenReturn(Set.of("MT101_PAY"));
        assertFalse(detector.movesMoney("FILE_DELIVER", "{roto"));
    }

    @Test
    void aSinkRefWrittenAsTextIsIgnored() {
        // Config a medio escribir desde la UI: sinkRef como cadena vacia. Se trata como "sin sink".
        when(providers.moneyMovementTaskTypes()).thenReturn(Set.of("MT101_PAY"));
        assertFalse(detector.movesMoney("FILE_DELIVER", "{\"sinkRef\":\"\"}"));
    }
}
