package com.integrationhub.platform.api;

public record SystemThemeSettingRequest(
        String scheme,
        String preset,
        String density,
        String locale,
        String sidebarMode,
        String primary,
        String error,
        String neutral
) {
}
