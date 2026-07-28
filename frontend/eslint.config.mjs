import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          // §Fase2: fronteras por TAG (reemplazan el boundaries manual). Reglas de capa:
          //  - una feature NO importa otra feature (bajo acoplamiento);
          //  - core/shared NO importan features (la dirección va de features hacia abajo);
          //  - nadie (salvo app) importa hacia arriba (app no está en los allowed de las libs).
          // Cada proyecto matchea EXACTAMENTE una regla por su `type:*`. Sin catch-all `*→*`: los
          // proyectos sin type-tag (web-e2e, ui-kit-storybook) quedan sin restricción a propósito
          // (no son libs de dominio).
          //
          // ADR-021: los `scope:*` YA NO son inertes. Las reglas de capa miran la dirección
          // (feature→core) pero son ciegas a la dimensión VERTICAL: hoy MT101 vive dentro de
          // `core-providers` y eso es perfectamente legal para ellas, porque es "core". La regla de
          // abajo cierra esa dimensión: al vertical solo lo alcanza el propio vertical y la app que
          // lo ensambla. Es la contraparte de las reglas ArchUnit del backend.
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:app', 'type:feature', 'type:core', 'type:shared'],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:core', 'type:shared'],
            },
            {
              sourceTag: 'type:core',
              onlyDependOnLibsWithTags: ['type:core', 'type:shared'],
            },
            {
              sourceTag: 'type:shared',
              onlyDependOnLibsWithTags: ['type:core', 'type:shared'],
            },
            // Nadie depende de un vertical salvo el propio vertical: ni el core, ni shared, ni otra
            // feature. Quien lo ensambla es la app (que ya puede por su regla `type:app`, y esta
            // regla no la alcanza porque su scope no es un vertical).
            {
              sourceTag: 'scope:core',
              notDependOnLibsWithTags: ['scope:swift-mt101'],
            },
            {
              sourceTag: 'scope:audit',
              notDependOnLibsWithTags: ['scope:swift-mt101'],
            },
            {
              sourceTag: 'scope:processes',
              notDependOnLibsWithTags: ['scope:swift-mt101'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
