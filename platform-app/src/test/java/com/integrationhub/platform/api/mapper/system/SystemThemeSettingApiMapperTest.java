package com.integrationhub.platform.api.mapper.system;

import com.integrationhub.platform.entity.SystemThemeSetting;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

// @covers RF-003 (reingenieria: prueba que cubre el/los RF en produccion)
class SystemThemeSettingApiMapperTest {

    private final SystemThemeSettingApiMapper mapper = new SystemThemeSettingApiMapper();

    @Test
    void toResponseMapsAllFields() {
        var setting = new SystemThemeSetting();
        setting.id = 1L;
        setting.scheme = "dark";
        setting.preset = "default";
        setting.density = "comfortable";
        setting.locale = "es";
        setting.sidebarMode = "expanded";
        setting.primaryColor = "#1565C0";
        setting.errorColor = "#C62828";
        setting.neutralColor = "#455A64";

        var response = mapper.toResponse(setting);

        assertEquals("dark", response.scheme());
        assertEquals("default", response.preset());
        assertEquals("comfortable", response.density());
        assertEquals("es", response.locale());
        assertEquals("expanded", response.sidebarMode());
        assertEquals("#1565C0", response.primary());
        assertEquals("#C62828", response.error());
        assertEquals("#455A64", response.neutral());
    }
}
