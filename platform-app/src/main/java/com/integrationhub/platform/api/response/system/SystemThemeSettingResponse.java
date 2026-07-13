package com.integrationhub.platform.api.response.system;

public record SystemThemeSettingResponse(
        String scheme,
        String preset,
        String density,
        String locale,
        String sidebarMode,
        String primary,
        String error,
        String neutral,
        String brandName,
        String brandMark,
        String logoDataUri
) {
}
