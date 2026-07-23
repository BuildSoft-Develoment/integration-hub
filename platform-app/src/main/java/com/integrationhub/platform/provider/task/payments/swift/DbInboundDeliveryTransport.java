package com.integrationhub.platform.provider.task.payments.swift;

import com.integrationhub.platform.repository.payments.swift.InboundRoutedTransactionRepository;
import com.integrationhub.platform.service.connection.ConnectionPoolManager;
import com.integrationhub.platform.spi.task.TaskContext;
import com.integrationhub.platform.spi.task.TaskResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

import static com.integrationhub.platform.provider.task.payments.swift.InboundDeliverySupport.stringValue;

/**
 * Transporte DB de {@code MT101_INBOUND_DELIVER}: aplana cada transaccion de los mensajes ruteados a la tabla
 * de negocio fija {@code inbound_routed_transaction} (la conexion viene del inbound source). Escala a 1M por
 * insert batch por pagina.
 */
@ApplicationScoped
public class DbInboundDeliveryTransport implements InboundDeliveryTransport {

    private final SwiftInboundStore inboundStore;
    private final InboundRoutedTransactionRepository routedRepository;
    private final DataSource defaultDataSource;
    private final ConnectionPoolManager connectionPoolManager;
    private final InboundRoutedTransactionMapper rowMapper;

    @Inject
    public DbInboundDeliveryTransport(SwiftInboundStore inboundStore,
                                      InboundRoutedTransactionRepository routedRepository,
                                      DataSource defaultDataSource,
                                      ConnectionPoolManager connectionPoolManager,
                                      InboundRoutedTransactionMapper rowMapper) {
        this.inboundStore = inboundStore;
        this.routedRepository = routedRepository;
        this.defaultDataSource = defaultDataSource;
        this.connectionPoolManager = connectionPoolManager;
        this.rowMapper = rowMapper;
    }

    @Override
    public String transport() {
        return "DB";
    }

    @Override
    public TaskResult deliver(TaskContext context, Map<String, Object> configuration,
                              Map<String, Object> inboundSource, int pageSize) {
        var inboundSetId = stringValue(inboundSource.get("inboundSetId"), null);
        var connectionRef = stringValue(inboundSource.get("connectionRef"), null);
        var dataSource = resolveDataSource(connectionRef);
        var delivered = new long[]{0L, 0L}; // [0]=messages, [1]=rows

        inboundStore.forEachPage(inboundSource, SwiftInboundStore.READ_ROUTED, pageSize, page -> {
            var rows = new ArrayList<InboundRoutedTransactionRepository.Row>();
            var ids = new ArrayList<Long>(page.size());
            for (var item : page) {
                ids.add(item.id());
                rows.addAll(rowMapper.toRows(item.message(), inboundSetId, context.processExecutionId(),
                        item.routedAs()));
            }
            try {
                routedRepository.insertBatch(dataSource, rows);
            } catch (SQLException error) {
                throw new IllegalStateException("Cannot persist inbound routed transactions batch ("
                        + rows.size() + ")", error);
            }
            inboundStore.markStatusBatch(inboundSource, ids, "DELIVERED", null);
            delivered[0] += ids.size();
            delivered[1] += rows.size();
        });

        var outputs = new LinkedHashMap<String, Object>();
        outputs.put("transport", "DB");
        outputs.put("deliveredMessages", delivered[0]);
        outputs.put("rowsWritten", delivered[1]);
        return TaskResult.success("MT101_INBOUND_DELIVER via DB delivered=" + delivered[0]
                + " rows=" + delivered[1], outputs);
    }

    private DataSource resolveDataSource(String connectionRef) {
        if (connectionRef == null || connectionRef.isBlank() || connectionPoolManager == null) {
            return defaultDataSource;
        }
        return connectionPoolManager.resolveJdbcDataSource(connectionRef);
    }
}
