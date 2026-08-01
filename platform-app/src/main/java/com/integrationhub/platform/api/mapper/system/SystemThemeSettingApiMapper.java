package com.integrationhub.platform.api.mapper.system;

// @trace spec 007-tema-del-sistema RF-003 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.response.system.SystemThemeSettingResponse;
import com.integrationhub.platform.entity.SystemThemeSetting;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SystemThemeSettingApiMapper {

    public SystemThemeSettingResponse toResponse(SystemThemeSetting setting) {
        return new SystemThemeSettingResponse(
                setting.scheme,
                setting.preset,
                setting.locale,
                setting.primaryColor,
                setting.errorColor,
                setting.neutralColor,
                setting.brandName,
                setting.brandMark,
                setting.logoDataUri
        );
    }
}
