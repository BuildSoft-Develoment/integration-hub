package com.integrationhub.platform.api.request.system;

public record SystemThemeSettingRequest(
        String scheme,
        String preset,
        String locale,
        String primary,
        String error,
        String neutral,
        String brandName,
        String brandMark,
        String logoDataUri
) {
}
