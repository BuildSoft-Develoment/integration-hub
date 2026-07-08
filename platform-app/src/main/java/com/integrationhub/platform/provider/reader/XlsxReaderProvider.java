package com.integrationhub.platform.provider.reader;

// @trace RF-004 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SourcePayload;
import io.quarkus.arc.properties.UnlessBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;

@ApplicationScoped
@UnlessBuildProperty(name = "integrationhub.native.disable.xlsx", stringValue = "true", enableIfMissing = true)
public class XlsxReaderProvider implements ReaderProvider {

    @Override
    public String type() {
        return "XLSX";
    }

    @Override
    public boolean supportsStreamingPipeline() {
        return true;
    }

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        return XlsxStreamingReaderSupport.readInBatches(payload, configuration, batchSize, consumer);
    }
}
