package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.ReadBatchConsumer;
import com.integrationhub.platform.spi.ReadResult;
import com.integrationhub.platform.spi.ReaderProvider;
import com.integrationhub.platform.spi.SourcePayload;
import io.quarkus.arc.properties.UnlessBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;

@ApplicationScoped
@UnlessBuildProperty(name = "integrationhub.native.disable.xls", stringValue = "true")
public class XlsReaderProvider implements ReaderProvider {

    @Override
    public String type() {
        return "XLS";
    }

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        return XlsStreamingReaderSupport.readInBatches(payload, configuration, batchSize, consumer);
    }
}