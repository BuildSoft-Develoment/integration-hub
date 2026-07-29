package com.integrationhub.platform.repository;

import com.integrationhub.platform.domain.ConnectionType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-022: mapeo motor -> dialecto de paginacion. Antes se deducia leyendo
 * {@code getDatabaseProductName()} de la conexion viva; ahora sale del tipo declarado en la Conexion,
 * el mismo mecanismo que usan SP, FN y DB_WRITE.
 */
class TaskInputPaginationDialectTest {

    private final TaskInputRepository repository = new TaskInputRepository();

    @Test
    void everyEngineMapsToItsPaginationForm() {
        assertEquals(TaskInputRepository.PaginationDialect.OFFSET_FETCH,
                repository.paginationDialect(ConnectionType.SQLSERVER));
        assertEquals(TaskInputRepository.PaginationDialect.FETCH_FIRST,
                repository.paginationDialect(ConnectionType.ORACLE));
        assertEquals(TaskInputRepository.PaginationDialect.LIMIT,
                repository.paginationDialect(ConnectionType.POSTGRESQL));
        assertEquals(TaskInputRepository.PaginationDialect.LIMIT,
                repository.paginationDialect(ConnectionType.MYSQL));
    }

    @Test
    void anEngineWithoutPaginationFailsLoudInsteadOfGuessing() {
        // Antes, un motor no contemplado caia en el `return LIMIT` final y emitia `limit ?` en silencio.
        var error = assertThrows(IllegalStateException.class,
                () -> repository.paginationDialect(ConnectionType.MONGODB));

        assertTrue(error.getMessage().contains("MONGODB"),
                "el mensaje debe nombrar el motor: " + error.getMessage());
    }

    @Test
    void sqlServerNeedsOffsetBeforeFetchAndOracleDoesNot() {
        // SQL Server rechaza `fetch first` suelto; Oracle 12c+ lo admite. Es la unica diferencia real
        // entre ambos y la razon de que existan dos dialectos y no uno.
        assertEquals(" offset 0 rows fetch next ? rows only",
                repository.limitClause(TaskInputRepository.PaginationDialect.OFFSET_FETCH));
        assertEquals(" fetch first ? rows only",
                repository.limitClause(TaskInputRepository.PaginationDialect.FETCH_FIRST));
        assertEquals(" limit ?",
                repository.limitClause(TaskInputRepository.PaginationDialect.LIMIT));
    }
}
