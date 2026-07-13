package com.integrationhub.platform.api.mapper.system;

// @trace RF-003 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.response.system.SystemThemeSettingResponse;
import com.integrationhub.platform.entity.SystemThemeSetting;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SystemThemeSettingApiMapper {

    public SystemThemeSettingResponse toResponse(SystemThemeSetting setting) {
        return new SystemThemeSettingResponse(
                setting.scheme,
                setting.preset,
                setting.density,
                setting.locale,
                setting.sidebarMode,
                setting.primaryColor,
                setting.errorColor,
                setting.neutralColor,
                setting.brandName,
                setting.brandMark,
                setting.logoDataUri
        );
    }
}
