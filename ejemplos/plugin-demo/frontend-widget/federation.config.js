const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

// Plugin remoto INDEPENDIENTE: el path de `exposes` es relativo a la raiz de ESTE
// proyecto (no del monorepo). El UI kit se consume como paquete versionado instalado
// desde un TARBALL LOCAL (vendor/*.tgz), sin publicar a un registry publico, y se comparte
// como singleton del host (una sola instancia + los mismos design tokens en host y remoto).
module.exports = withNativeFederation({
  name: 'demo-transform-widget',

  exposes: {
    './Widget': './src/app/widget.component.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    '@integration-hub/plugin-ui-kit': { singleton: true, strictVersion: false, requiredVersion: false },
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],

  features: {
    ignoreUnusedDeps: true,
  },
});
