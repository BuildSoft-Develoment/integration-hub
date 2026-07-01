package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.UiPluginCatalogEntry;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class UiPluginCatalogEntryRepository implements PanacheRepositoryBase<UiPluginCatalogEntry, String> {

    public List<UiPluginCatalogEntry> listOrdered() {
        return list("order by pluginId");
    }
}
