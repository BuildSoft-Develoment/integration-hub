package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.reader.ReadBatchConsumer;
import com.integrationhub.platform.spi.reader.ReadResult;
import com.integrationhub.platform.spi.reader.ReaderProvider;
import com.integrationhub.platform.spi.source.SourcePayload;
import io.quarkus.arc.properties.UnlessBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;

@ApplicationScoped
@UnlessBuildProperty(name = "integrationhub.native.disable.xls", stringValue = "true", enableIfMissing = true)
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
