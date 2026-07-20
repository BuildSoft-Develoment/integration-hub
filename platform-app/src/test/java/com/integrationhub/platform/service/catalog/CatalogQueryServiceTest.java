package com.integrationhub.platform.service.catalog;

import com.integrationhub.platform.api.mapper.process.ProcessDefinitionApiMapper;
import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.entity.ProcessDefinition;
import com.integrationhub.platform.entity.ReaderDefinition;
import com.integrationhub.platform.entity.SourceDefinition;
import com.integrationhub.platform.repository.ConnectionDefinitionRepository;
import com.integrationhub.platform.repository.ProcessDefinitionRepository;
import com.integrationhub.platform.repository.ReaderDefinitionRepository;
import com.integrationhub.platform.repository.SourceDefinitionRepository;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// @covers RF-001 (reingenieria: prueba que cubre el/los RF en produccion)
class CatalogQueryServiceTest {

    private final SourceDefinitionRepository sourceRepository = mock(SourceDefinitionRepository.class);
    private final ReaderDefinitionRepository readerRepository = mock(ReaderDefinitionRepository.class);
    private final ConnectionDefinitionRepository connectionRepository = mock(ConnectionDefinitionRepository.class);
    private final ProcessDefinitionRepository processRepository = mock(ProcessDefinitionRepository.class);
    private final ProcessDefinitionApiMapper apiMapper = new ProcessDefinitionApiMapper();

    private final CatalogQueryService service = new CatalogQueryService(
            sourceRepository, readerRepository, connectionRepository, processRepository, apiMapper);

    @SuppressWarnings("unchecked")
    private <T> PanacheQuery<T> pagedQuery(long total, List<T> items) {
        var query = (PanacheQuery<T>) mock(PanacheQuery.class);
        when(query.count()).thenReturn(total);
        when(query.list()).thenReturn(items);
        return query;
    }

    @Test
    void listSourcesAppliesTypeStatusAndSearchFilters() {
        var s1 = new SourceDefinition();
        s1.id = 1L;
        var query1 = pagedQuery(1L, List.of(s1));
        when(sourceRepository.find(any(String.class), any(Map.class))).thenReturn(query1);

        var queryCaptor = ArgumentCaptor.forClass(String.class);
        var paramsCaptor = ArgumentCaptor.forClass(Map.class);

        var page = service.listSources("clientes", "FILESYSTEM", "ACTIVE", null, 0, 10);

        assertEquals(1L, page.total());
        assertEquals(1, page.items().size());
        verify(sourceRepository).find(queryCaptor.capture(), paramsCaptor.capture());

        var hql = queryCaptor.getValue();
        var params = paramsCaptor.getValue();
        assertTrue(hql.contains("e.sourceType = :sourceType"), hql);
        assertTrue(hql.contains("e.active = :active"), hql);
        assertTrue(hql.contains("order by e.name"), hql);
        assertEquals("FILESYSTEM", params.get("sourceType"));
        assertEquals(true, params.get("active"));
        assertEquals("%clientes%", params.get("queryText"));
    }

    @Test
    void listSourcesNumericSearchAddsIdClause() {
        var emptyQuery = pagedQuery(0L, List.<SourceDefinition>of());
        when(sourceRepository.find(any(String.class), any(Map.class))).thenReturn(emptyQuery);
        var queryCaptor = ArgumentCaptor.forClass(String.class);
        var paramsCaptor = ArgumentCaptor.forClass(Map.class);

        service.listSources("123", null, "ALL", null, 0, 10);

        verify(sourceRepository).find(queryCaptor.capture(), paramsCaptor.capture());
        assertTrue(queryCaptor.getValue().contains("e.id = :searchId"));
        assertEquals(123L, paramsCaptor.getValue().get("searchId"));
        // status ALL no añade filtro active
        assertTrue(!queryCaptor.getValue().contains("e.active = :active"));
    }

    @Test
    void listReadersNormalizesReaderTypeString() {
        var emptyQuery = pagedQuery(0L, List.<ReaderDefinition>of());
        when(readerRepository.find(any(String.class), any(Map.class))).thenReturn(emptyQuery);
        var paramsCaptor = ArgumentCaptor.forClass(Map.class);

        service.listReaders(null, "csv", "INACTIVE", 0, 10);

        verify(readerRepository).find(any(String.class), paramsCaptor.capture());
        assertEquals("CSV", paramsCaptor.getValue().get("readerType"));
        assertEquals(false, paramsCaptor.getValue().get("active"));
    }

    @Test
    void listConnectionsParsesConnectionTypeEnum() {
        var emptyQuery = pagedQuery(0L, List.<ConnectionDefinition>of());
        when(connectionRepository.find(any(String.class), any(Map.class))).thenReturn(emptyQuery);
        var paramsCaptor = ArgumentCaptor.forClass(Map.class);

        service.listConnections(null, "postgresql", null, 0, 10);

        verify(connectionRepository).find(any(String.class), paramsCaptor.capture());
        assertEquals(ConnectionType.POSTGRESQL, paramsCaptor.getValue().get("connectionType"));
    }

    @Test
    void listProcessesAppliesScheduledModeAndMapsResponse() {
        var definition = new ProcessDefinition();
        definition.id = 7L;
        definition.name = "carga";
        var query1 = pagedQuery(1L, List.of(definition));
        when(processRepository.find(any(String.class), any(Map.class))).thenReturn(query1);
        var queryCaptor = ArgumentCaptor.forClass(String.class);
        var paramsCaptor = ArgumentCaptor.forClass(Map.class);

        var page = service.listProcesses("carga", "SCHEDULED", "ACTIVE", 0, 10);

        assertEquals(1L, page.total());
        assertEquals("carga", page.items().get(0).name());
        verify(processRepository).find(queryCaptor.capture(), paramsCaptor.capture());
        assertTrue(queryCaptor.getValue().contains("e.scheduled = :scheduled"));
        assertEquals(true, paramsCaptor.getValue().get("scheduled"));
    }

    @Test
    void listSchedulesReusesProcessQueryAndMapsToSchedule() {
        var definition = new ProcessDefinition();
        definition.id = 8L;
        definition.name = "programado";
        definition.scheduled = true;
        definition.scheduleEvery = "30s";
        var query1 = pagedQuery(1L, List.of(definition));
        when(processRepository.find(any(String.class), any(Map.class))).thenReturn(query1);

        var page = service.listSchedules(null, "ALL", "ALL", 0, 10);

        assertEquals(1L, page.total());
        assertEquals("programado", page.items().get(0).name());
        assertEquals("30s", page.items().get(0).scheduleEvery());
    }
}
