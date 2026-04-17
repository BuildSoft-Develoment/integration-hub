package com.integrationhub.platform.api.mapper.system;

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
                setting.neutralColor
        );
    }
}
