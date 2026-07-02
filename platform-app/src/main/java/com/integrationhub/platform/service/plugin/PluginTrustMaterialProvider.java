package com.integrationhub.platform.service.plugin;

import java.util.Map;
import java.util.Set;

public interface PluginTrustMaterialProvider {

    Map<String, PluginTrustMaterial> trustedPublicKeys();

    Set<String> revokedKeyIds();
}
