package com.integrationhub.platform.provider.task.dbwrite;

import com.integrationhub.platform.domain.ConnectionType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * ADR-022: forma de la sentencia de upsert por motor.
 *
 * <p>Estas pruebas fijan el texto SQL; que el motor lo acepte de verdad lo demuestran los
 * {@code DbWriteUpsertTaskProvider*CompatibilityTest}, que lo ejecutan contra el contenedor real. Un
 * SQL con la forma correcta puede seguir siendo rechazado por el motor, asi que esto es condicion
 * necesaria y no suficiente.
 */
class DbWriteUpsertDialectTest {

    private static final String TABLE = "integration_target";
    private static final List<String> COLUMNS = List.of("id", "name", "amount");
    private static final List<String> BOUND_VALUES = List.of("?", "?", "?");
    private static final List<String> KEYS = List.of("id");
    private static final List<String> UPDATES = List.of("name", "amount");

    @Test
    void postgreSqlUsesOnConflict() {
        assertEquals(
                "insert into integration_target (id, name, amount) values (?, ?, ?)"
                        + " on conflict (id) do update set name = excluded.name, amount = excluded.amount",
                new PostgreSqlDbWriteUpsertDialect()
                        .upsertStatement(TABLE, COLUMNS, BOUND_VALUES, KEYS, UPDATES));
    }

    @Test
    void mySqlUsesOnDuplicateKey() {
        assertEquals(
                "insert into integration_target (id, name, amount) values (?, ?, ?)"
                        + " on duplicate key update name = values(name), amount = values(amount)",
                new MySqlDbWriteUpsertDialect()
                        .upsertStatement(TABLE, COLUMNS, BOUND_VALUES, KEYS, UPDATES));
    }

    @Test
    void oracleUsesMergeOverDual() {
        assertEquals(
                "merge into integration_target tgt using (select ? id, ? name, ? amount from dual) src"
                        + " on (tgt.id = src.id)"
                        + " when matched then update set tgt.name = src.name, tgt.amount = src.amount"
                        + " when not matched then insert (id, name, amount) values (src.id, src.name, src.amount)",
                new OracleDbWriteUpsertDialect()
                        .upsertStatement(TABLE, COLUMNS, BOUND_VALUES, KEYS, UPDATES));
    }

    @Test
    void sqlServerUsesMergeWithoutFromAndEndsInSemicolon() {
        assertEquals(
                "merge into integration_target tgt using (select ? id, ? name, ? amount) src"
                        + " on (tgt.id = src.id)"
                        + " when matched then update set tgt.name = src.name, tgt.amount = src.amount"
                        + " when not matched then insert (id, name, amount) values (src.id, src.name, src.amount);",
                new SqlServerDbWriteUpsertDialect()
                        .upsertStatement(TABLE, COLUMNS, BOUND_VALUES, KEYS, UPDATES));
    }

    // --- "inserta si no existe, y si existe no toques nada" -------------------------------------

    @Test
    void withoutUpdatableColumnsPostgreSqlDoesNothing() {
        assertEquals(
                "insert into integration_target (id) values (?) on conflict (id) do nothing",
                new PostgreSqlDbWriteUpsertDialect()
                        .upsertStatement(TABLE, List.of("id"), List.of("?"), KEYS, List.of()));
    }

    @Test
    void withoutUpdatableColumnsMySqlAssignsTheKeyToItself() {
        // MySQL carece de `do nothing`: asignar la clave a si misma es el no-op equivalente.
        assertEquals(
                "insert into integration_target (id) values (?) on duplicate key update id = id",
                new MySqlDbWriteUpsertDialect()
                        .upsertStatement(TABLE, List.of("id"), List.of("?"), KEYS, List.of()));
    }

    @Test
    void withoutUpdatableColumnsMergeOmitsTheMatchedBranch() {
        assertEquals(
                "merge into integration_target tgt using (select ? id from dual) src on (tgt.id = src.id)"
                        + " when not matched then insert (id) values (src.id)",
                new OracleDbWriteUpsertDialect()
                        .upsertStatement(TABLE, List.of("id"), List.of("?"), KEYS, List.of()));
    }

    // --- columnas rellenadas con una funcion de base de datos -----------------------------------

    @Test
    void aDatabaseFunctionColumnIsInlinedInsteadOfBound() {
        // La expresion viaja tal cual: no consume parametro, y en los dialectos MERGE queda dentro
        // del `using`, de modo que la rama de insert la referencia por alias igual que al resto.
        assertEquals(
                "merge into integration_target tgt using (select ? id, current_timestamp updated_at from dual) src"
                        + " on (tgt.id = src.id)"
                        + " when matched then update set tgt.updated_at = src.updated_at"
                        + " when not matched then insert (id, updated_at) values (src.id, src.updated_at)",
                new OracleDbWriteUpsertDialect().upsertStatement(TABLE,
                        List.of("id", "updated_at"), List.of("?", "current_timestamp"),
                        KEYS, List.of("updated_at")));
    }

    @Test
    void keysAreCompositeWhenMoreThanOneIsDeclared() {
        assertEquals(
                "merge into integration_target tgt using (select ? id, ? tenant from dual) src"
                        + " on (tgt.id = src.id and tgt.tenant = src.tenant)"
                        + " when not matched then insert (id, tenant) values (src.id, src.tenant)",
                new OracleDbWriteUpsertDialect().upsertStatement(TABLE,
                        List.of("id", "tenant"), List.of("?", "?"),
                        List.of("id", "tenant"), List.of()));
    }

    @Test
    void everyDialectDeclaresItsOwnConnectionType() {
        assertEquals(ConnectionType.POSTGRESQL, new PostgreSqlDbWriteUpsertDialect().connectionType());
        assertEquals(ConnectionType.MYSQL, new MySqlDbWriteUpsertDialect().connectionType());
        assertEquals(ConnectionType.ORACLE, new OracleDbWriteUpsertDialect().connectionType());
        assertEquals(ConnectionType.SQLSERVER, new SqlServerDbWriteUpsertDialect().connectionType());
    }
}
