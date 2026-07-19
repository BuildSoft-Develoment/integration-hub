package com.integrationhub.platform.service.artifact;

import com.integrationhub.platform.provider.artifact.LocalTempArtifactStore;
import com.integrationhub.platform.spi.artifact.ArtifactStore;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

import java.util.stream.Stream;

/**
 * ADR-016: resuelve el {@link ArtifactStore} por tipo (CDI). En fase 1 solo existe {@code LOCAL_TEMP} (sync); en fase 2
 * se agrega {@code S3} para el async offload multi-nodo. Las tareas de salida piden el store por el modo de ejecucion
 * ({@link #forExecution(boolean)}).
 */
@ApplicationScoped
public class ArtifactStoreRegistry {

    private final Instance<ArtifactStore> stores;

    @Inject
    public ArtifactStoreRegistry(Instance<ArtifactStore> stores) {
        this.stores = stores;
    }

    public ArtifactStore resolve(String type) {
        return storeStream()
                .filter(store -> store.type().equalsIgnoreCase(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported artifact store: " + type));
    }

    /**
     * Store segun modo: sync -&gt; {@code LOCAL_TEMP}; async/multi-nodo -&gt; {@code S3} (fase 2). En fase 1, con async
     * aun sin cablear, cae a {@code LOCAL_TEMP} si {@code S3} no esta registrado.
     */
    public ArtifactStore forExecution(boolean async) {
        if (async) {
            var shared = storeStream().filter(store -> "S3".equalsIgnoreCase(store.type())).findFirst();
            if (shared.isPresent()) {
                return shared.get();
            }
        }
        return resolve(LocalTempArtifactStore.STORE_TYPE);
    }

    private Stream<ArtifactStore> storeStream() {
        return stores == null ? Stream.empty() : stores.stream();
    }
}
