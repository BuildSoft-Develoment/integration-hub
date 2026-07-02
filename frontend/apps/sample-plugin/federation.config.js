const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'sample-plugin',



  exposes: {
    './Widget': './apps/sample-plugin/src/app/widget.component.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    // Platform UI kit. NOTE: in-workspace these are tsconfig-path libraries without a
    // published version, so Native Federation bundles them into this remote (they are NOT
    // deduplicated as host singletons). The rendered look is still native because the
    // design tokens are global CSS. To truly share the kit as a host singleton, publish it
    // as a versioned package (e.g. @integration-hub/plugin-ui-kit) and share by that name.
    '@integration-hub/shared/ui': { singleton: true, strictVersion: false, requiredVersion: false },
    '@integration-hub/core/services': { singleton: true, strictVersion: false, requiredVersion: false },
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // New feature for more performance and avoiding
    // issues with node libs. Comment this out to
    // get the traditional behavior:
    ignoreUnusedDeps: true
  }
});
