package com.integrationhub.platform.service.system;

import com.integrationhub.platform.api.mapper.system.SystemThemeSettingApiMapper;
import com.integrationhub.platform.api.request.system.SystemThemeSettingRequest;
import com.integrationhub.platform.entity.SystemThemeSetting;
import com.integrationhub.platform.repository.SystemThemeSettingRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// @covers RF-001, RF-002 (reingenieria: prueba que cubre el/los RF en produccion)
class SystemThemeSettingServiceTest {

    private final SystemThemeSettingApiMapper apiMapper = new SystemThemeSettingApiMapper();

    @Test
    void getCreatesDefaultSingletonWhenAbsent() {
        var repository = mock(SystemThemeSettingRepository.class);
        when(repository.findSingleton()).thenReturn(null);

        var service = new SystemThemeSettingService(repository, apiMapper);
        var response = service.get();

        assertEquals("light", response.scheme());
        assertEquals("horizon", response.preset());
        assertEquals("es", response.locale());
        verify(repository).persist(any(SystemThemeSetting.class));
    }

    @Test
    void getReturnsExistingSingleton() {
        var repository = mock(SystemThemeSettingRepository.class);
        var existing = new SystemThemeSetting();
        existing.id = 1L;
        existing.scheme = "dark";
        existing.preset = "horizon";
        existing.locale = "en";
        existing.primaryColor = "#111111";
        existing.errorColor = "#222222";
        existing.neutralColor = "#333333";
        when(repository.findSingleton()).thenReturn(existing);

        var response = new SystemThemeSettingService(repository, apiMapper).get();

        assertEquals("dark", response.scheme());
        assertEquals("en", response.locale());
        assertEquals("horizon", response.preset());
    }

    @Test
    void updateNormalizesBlankValuesToDefaults() {
        var repository = mock(SystemThemeSettingRepository.class);
        var existing = new SystemThemeSetting();
        existing.id = 1L;
        when(repository.findSingleton()).thenReturn(existing);

        var request = new SystemThemeSettingRequest(
                "dark", "  ", "en", "#AAA", null, "  ",
                "ACME Corp", "", null);
        var response = new SystemThemeSettingService(repository, apiMapper).update(request);

        // Valores provistos se respetan; blancos/nulos caen a default.
        assertEquals("dark", response.scheme());
        assertEquals("horizon", response.preset());      // "  " -> default
        assertEquals("en", response.locale());
        assertEquals("#AAA", response.primary());
        assertEquals("#E5484D", response.error());        // null -> default
        assertEquals("ACME Corp", response.brandName());  // marca provista
        assertEquals("IH", response.brandMark());         // "" -> default
        assertNull(response.logoDataUri());               // null -> sin logo
    }

    @Test
    void updateRejectsInvalidLogoDataUri() {
        var repository = mock(SystemThemeSettingRepository.class);
        var existing = new SystemThemeSetting();
        existing.id = 1L;
        when(repository.findSingleton()).thenReturn(existing);
        var request = new SystemThemeSettingRequest(
                "light", "horizon", "es", "#0F766E", "#E5484D", "#8B8D98",
                "ACME", "AC", "not-a-data-uri");
        var service = new SystemThemeSettingService(repository, apiMapper);
        assertThrows(IllegalArgumentException.class, () -> service.update(request));
    }
}
