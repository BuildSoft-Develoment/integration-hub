package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "system_theme_setting")
public class SystemThemeSetting {

    @Id
    public Long id;

    @Column(nullable = false, length = 20)
    public String scheme;

    @Column(nullable = false, length = 20)
    public String preset;

    @Column(nullable = false, length = 20)
    public String density;

    @Column(nullable = false, length = 10)
    public String locale;

    @Column(name = "sidebar_mode", nullable = false, length = 20)
    public String sidebarMode;

    @Column(name = "primary_color", nullable = false, length = 20)
    public String primaryColor;

    @Column(name = "error_color", nullable = false, length = 20)
    public String errorColor;

    @Column(name = "neutral_color", nullable = false, length = 20)
    public String neutralColor;

    @Column(name = "brand_name", nullable = false, length = 120)
    public String brandName;

    @Column(name = "brand_mark", nullable = false, length = 8)
    public String brandMark;

    /** Logo de la empresa embebido como data-URI base64 (opcional). {@code null} = usar brandMark de texto. */
    @Column(name = "logo_data_uri", columnDefinition = "text")
    public String logoDataUri;
}
