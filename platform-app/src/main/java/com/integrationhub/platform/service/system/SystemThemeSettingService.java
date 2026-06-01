package com.integrationhub.platform.service.system;

// @trace RF-001 (reingenieria: clase que implementa el/los RF en produccion)

import com.integrationhub.platform.api.mapper.system.SystemThemeSettingApiMapper;
import com.integrationhub.platform.api.request.system.SystemThemeSettingRequest;
import com.integrationhub.platform.api.response.system.SystemThemeSettingResponse;
import com.integrationhub.platform.entity.SystemThemeSetting;
import com.integrationhub.platform.repository.SystemThemeSettingRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class SystemThemeSettingService {

    private static final long SINGLETON_ID = 1L;
    private static final String DEFAULT_SCHEME = "light";
    private static final String DEFAULT_PRESET = "horizon";
    private static final String DEFAULT_DENSITY = "comfortable";
    private static final String DEFAULT_LOCALE = "es";
    private static final String DEFAULT_SIDEBAR_MODE = "expanded";
    private static final String DEFAULT_PRIMARY = "#0F766E";
    private static final String DEFAULT_ERROR = "#E5484D";
    private static final String DEFAULT_NEUTRAL = "#8B8D98";

    private final SystemThemeSettingRepository systemThemeSettingRepository;
    private final SystemThemeSettingApiMapper systemThemeSettingApiMapper;

    public SystemThemeSettingService(SystemThemeSettingRepository systemThemeSettingRepository,
                                     SystemThemeSettingApiMapper systemThemeSettingApiMapper) {
        this.systemThemeSettingRepository = systemThemeSettingRepository;
        this.systemThemeSettingApiMapper = systemThemeSettingApiMapper;
    }

    @Transactional
    public SystemThemeSettingResponse get() {
        return systemThemeSettingApiMapper.toResponse(getOrCreate());
    }

    @Transactional
    public SystemThemeSettingResponse update(SystemThemeSettingRequest request) {
        var setting = getOrCreate();
        setting.scheme = normalize(request.scheme(), DEFAULT_SCHEME);
        setting.preset = normalize(request.preset(), DEFAULT_PRESET);
        setting.density = normalize(request.density(), DEFAULT_DENSITY);
        setting.locale = normalize(request.locale(), DEFAULT_LOCALE);
        setting.sidebarMode = normalize(request.sidebarMode(), DEFAULT_SIDEBAR_MODE);
        setting.primaryColor = normalize(request.primary(), DEFAULT_PRIMARY);
        setting.errorColor = normalize(request.error(), DEFAULT_ERROR);
        setting.neutralColor = normalize(request.neutral(), DEFAULT_NEUTRAL);
        return systemThemeSettingApiMapper.toResponse(setting);
    }

    private SystemThemeSetting getOrCreate() {
        var existing = systemThemeSettingRepository.findSingleton();
        if (existing != null) {
            return existing;
        }
        var setting = new SystemThemeSetting();
        setting.id = SINGLETON_ID;
        setting.scheme = DEFAULT_SCHEME;
        setting.preset = DEFAULT_PRESET;
        setting.density = DEFAULT_DENSITY;
        setting.locale = DEFAULT_LOCALE;
        setting.sidebarMode = DEFAULT_SIDEBAR_MODE;
        setting.primaryColor = DEFAULT_PRIMARY;
        setting.errorColor = DEFAULT_ERROR;
        setting.neutralColor = DEFAULT_NEUTRAL;
        systemThemeSettingRepository.persist(setting);
        return setting;
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
