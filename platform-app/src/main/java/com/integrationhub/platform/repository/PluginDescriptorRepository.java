package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.PluginDescriptor;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class PluginDescriptorRepository implements PanacheRepositoryBase<PluginDescriptor, String> {

    public List<PluginDescriptor> listActive() {
        return find("active = true order by id asc").list();
    }
}
