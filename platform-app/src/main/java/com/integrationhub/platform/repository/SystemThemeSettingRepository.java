package com.integrationhub.platform.repository;

import com.integrationhub.platform.entity.SystemThemeSetting;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SystemThemeSettingRepository implements PanacheRepository<SystemThemeSetting> {

    public SystemThemeSetting findSingleton() {
        return findById(1L);
    }
}
