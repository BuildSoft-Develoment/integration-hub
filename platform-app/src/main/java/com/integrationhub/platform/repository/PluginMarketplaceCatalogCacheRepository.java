package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.PluginMarketplaceCatalogCache;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PluginMarketplaceCatalogCacheRepository
        implements PanacheRepositoryBase<PluginMarketplaceCatalogCache, String> {
}
