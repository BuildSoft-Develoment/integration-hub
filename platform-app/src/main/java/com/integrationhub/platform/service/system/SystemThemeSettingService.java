package com.integrationhub.platform.service.system;

// @trace spec 007-tema-del-sistema RF-001 (reingenieria: clase que implementa el/los RF en produccion)

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
    private static final String DEFAULT_LOCALE = "es";
    private static final String DEFAULT_PRIMARY = "#0F766E";
    private static final String DEFAULT_ERROR = "#E5484D";
    private static final String DEFAULT_NEUTRAL = "#8B8D98";
    private static final String DEFAULT_BRAND_NAME = "Integration Hub";
    private static final String DEFAULT_BRAND_MARK = "IH";
    /** Tope del logo embebido: 256 KB decodificados (evita inflar la fila y el payload del branding). */
    private static final int MAX_LOGO_BYTES = 256 * 1024;
    private static final java.util.regex.Pattern LOGO_DATA_URI = java.util.regex.Pattern.compile(
            "^data:image/(svg\\+xml|png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$");

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

    /** Branding publico (nombre/marca/logo/color) para pantallas pre-auth (login). */
    @Transactional
    public com.integrationhub.platform.api.response.branding.BrandingResponse branding() {
        var setting = getOrCreate();
        return new com.integrationhub.platform.api.response.branding.BrandingResponse(
                setting.brandName, setting.brandMark, setting.logoDataUri, setting.primaryColor);
    }

    @Transactional
    public SystemThemeSettingResponse update(SystemThemeSettingRequest request) {
        var setting = getOrCreate();
        setting.scheme = normalize(request.scheme(), DEFAULT_SCHEME);
        setting.preset = normalize(request.preset(), DEFAULT_PRESET);
        setting.locale = normalize(request.locale(), DEFAULT_LOCALE);
        setting.primaryColor = normalize(request.primary(), DEFAULT_PRIMARY);
        setting.errorColor = normalize(request.error(), DEFAULT_ERROR);
        setting.neutralColor = normalize(request.neutral(), DEFAULT_NEUTRAL);
        setting.brandName = normalize(request.brandName(), DEFAULT_BRAND_NAME);
        setting.brandMark = normalize(request.brandMark(), DEFAULT_BRAND_MARK);
        setting.logoDataUri = normalizeLogo(request.logoDataUri());
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
        setting.locale = DEFAULT_LOCALE;
        setting.primaryColor = DEFAULT_PRIMARY;
        setting.errorColor = DEFAULT_ERROR;
        setting.neutralColor = DEFAULT_NEUTRAL;
        setting.brandName = DEFAULT_BRAND_NAME;
        setting.brandMark = DEFAULT_BRAND_MARK;
        setting.logoDataUri = null;
        systemThemeSettingRepository.persist(setting);
        return setting;
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    /**
     * Valida y normaliza el logo embebido. Vacio/nulo → {@code null} (se usa el brandMark de texto).
     * Debe ser un data-URI base64 de imagen soportada y no superar {@link #MAX_LOGO_BYTES} decodificados.
     */
    private String normalizeLogo(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        var trimmed = value.trim();
        var matcher = LOGO_DATA_URI.matcher(trimmed);
        if (!matcher.matches()) {
            throw new IllegalArgumentException(
                    "logoDataUri debe ser un data-URI base64 de imagen (svg+xml, png, jpeg, webp o gif)");
        }
        var base64 = matcher.group(2);
        // Tamano decodificado aproximado a partir del largo del base64 (sin decodificar el payload completo).
        var approxBytes = (base64.length() / 4L) * 3L;
        if (approxBytes > MAX_LOGO_BYTES) {
            throw new IllegalArgumentException(
                    "El logo supera el maximo de " + (MAX_LOGO_BYTES / 1024) + " KB");
        }
        return trimmed;
    }
}

