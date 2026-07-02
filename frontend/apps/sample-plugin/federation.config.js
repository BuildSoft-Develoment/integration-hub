const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'sample-plugin',



  exposes: {
    './Widget': './apps/sample-plugin/src/app/widget.component.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    // Versioned, publishable UI kit package: an external author installs it and it is shared
    // as a host singleton (one instance + one set of design tokens across host and remotes),
    // instead of being bundled per-remote like an unversioned workspace lib.
    '@integration-hub/plugin-ui-kit': { singleton: true, strictVersion: false, requiredVersion: false },
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
