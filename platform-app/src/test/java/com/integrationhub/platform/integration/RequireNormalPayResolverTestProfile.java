package com.integrationhub.platform.integration;

import java.util.HashMap;
import java.util.Map;

/**
 * #1: perfil de un ambiente que EXIGE reconciliación in-line del PAY normal
 * ({@code mt101.pay.require-normal-pay-resolver=true}), sobre el perfil de integración base.
 */
public class RequireNormalPayResolverTestProfile extends IntegrationTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        var overrides = new HashMap<>(super.getConfigOverrides());
        overrides.put("mt101.pay.require-normal-pay-resolver", "true");
        return overrides;
    }
}
