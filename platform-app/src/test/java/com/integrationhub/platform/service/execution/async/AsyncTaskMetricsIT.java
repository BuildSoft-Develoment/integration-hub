package com.integrationhub.platform.service.execution.async;

import com.integrationhub.platform.integration.IntegrationTestProfile;
import com.integrationhub.platform.integration.PostgresTestResource;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * IT de las métricas async (ADR-015, grupo 3): tras poblar outbox/inbox y refrescar el snapshot, los
 * gauges Micrometer reflejan los conteos por estado.
 */
@QuarkusTest
@TestProfile(IntegrationTestProfile.class)
@QuarkusTestResource(PostgresTestResource.class)
class AsyncTaskMetricsIT {

    @Inject
    AsyncTaskMetrics metrics;

    @Inject
    MeterRegistry registry;

    @Inject
    DataSource dataSource;

    @BeforeEach
    void clean() throws Exception {
        exec("TRUNCATE TABLE task_inbox, task_dispatch_outbox RESTART IDENTITY");
    }

    @Test
    void refreshPublishesOutboxAndInboxGaugesByStatus() throws Exception {
        exec("insert into task_dispatch_outbox (idempotency_key, transport, envelope_json, status) values "
                + "('p1','KAFKA','{}','PENDING'),('p2','KAFKA','{}','PENDING'),('d1','KAFKA','{}','DEAD')");
        exec("insert into task_inbox (idempotency_key, status) values "
                + "('i1','PROCESSED'),('i2','PROCESSED'),('i3','PROCESSED'),(null,'POISON')");

        metrics.refresh();

        assertEquals(2.0, gauge("tasks_outbox_pending"));
        assertEquals(1.0, gauge("tasks_outbox_dead"));
        assertEquals(0.0, gauge("tasks_outbox_sent"));
        assertEquals(3.0, gauge("tasks_inbox_processed"));
        assertEquals(1.0, gauge("tasks_inbox_poison"));
        assertEquals(0.0, gauge("tasks_inbox_failed"));
    }

    private double gauge(String name) {
        return registry.get(name).gauge().value();
    }

    private void exec(String sql) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }
}
