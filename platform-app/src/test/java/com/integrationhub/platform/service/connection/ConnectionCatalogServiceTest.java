package com.integrationhub.platform.service.connection;

import com.integrationhub.platform.domain.ConnectionType;
import com.integrationhub.platform.entity.ConnectionDefinition;
import com.integrationhub.platform.repository.ConnectionDefinitionRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ConnectionCatalogServiceTest {

    private final ConnectionDefinitionRepository repository = mock(ConnectionDefinitionRepository.class);
    private final ConnectionPoolManager poolManager = mock(ConnectionPoolManager.class);
    private final ConnectionCatalogService service = new ConnectionCatalogService(repository, poolManager);

    @Test
    void testRejectsNullType() {
        assertThrows(IllegalArgumentException.class, () -> service.test("c", null, "{}"));
    }

    @Test
    void testMongoDbIsNotImplemented() {
        var response = service.test("mongo", ConnectionType.MONGODB, "{}");
        assertFalse(response.success());
        assertTrue(response.message().toLowerCase().contains("mongo"));
    }

    @Test
    void testRelationalDelegatesToPoolAndSucceeds() {
        var response = service.test("pg", ConnectionType.POSTGRESQL, "{\"url\":\"x\"}");
        assertTrue(response.success());
        verify(poolManager).testJdbcConnection("pg", "{\"url\":\"x\"}");
    }

    @Test
    void createPersistsDefinitionWithFields() {
        var created = service.create("dwh", ConnectionType.ORACLE, true, "{\"url\":\"y\"}");
        assertEquals("dwh", created.name);
        assertEquals(ConnectionType.ORACLE, created.connectionType);
        assertTrue(created.active);
        verify(repository).persist(any(ConnectionDefinition.class));
    }

    @Test
    void setActiveUpdatesFlagAndEvictsPool() {
        var existing = new ConnectionDefinition();
        existing.id = 4L;
        existing.active = true;
        when(repository.findRequired(4L)).thenReturn(existing);

        var result = service.setActive(4L, false);

        assertFalse(result.active);
        verify(poolManager).evict(4L);
    }
}
