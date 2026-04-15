package com.integrationhub.platform.service;

import com.integrationhub.platform.api.SystemThemeSettingRequest;
import com.integrationhub.platform.api.SystemThemeSettingView;
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

    public SystemThemeSettingService(SystemThemeSettingRepository systemThemeSettingRepository) {
        this.systemThemeSettingRepository = systemThemeSettingRepository;
    }

    @Transactional
    public SystemThemeSettingView get() {
        return toView(getOrCreate());
    }

    @Transactional
    public SystemThemeSettingView update(SystemThemeSettingRequest request) {
        var setting = getOrCreate();
        setting.scheme = normalize(request.scheme(), DEFAULT_SCHEME);
        setting.preset = normalize(request.preset(), DEFAULT_PRESET);
        setting.density = normalize(request.density(), DEFAULT_DENSITY);
        setting.locale = normalize(request.locale(), DEFAULT_LOCALE);
        setting.sidebarMode = normalize(request.sidebarMode(), DEFAULT_SIDEBAR_MODE);
        setting.primaryColor = normalize(request.primary(), DEFAULT_PRIMARY);
        setting.errorColor = normalize(request.error(), DEFAULT_ERROR);
        setting.neutralColor = normalize(request.neutral(), DEFAULT_NEUTRAL);
        return toView(setting);
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

    private SystemThemeSettingView toView(SystemThemeSetting setting) {
        return new SystemThemeSettingView(
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

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
