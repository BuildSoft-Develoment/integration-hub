package com.integrationhub.platform.api;

public record SystemThemeSettingView(
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
