package com.integrationhub.platform.api.response.system;

public record SystemThemeSettingResponse(
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
