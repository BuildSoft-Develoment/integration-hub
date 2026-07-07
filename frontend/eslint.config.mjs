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
          // Cada proyecto matchea EXACTAMENTE una regla por su `type:*` (los `scope:*` son inertes: no hay
          // sourceTag para ellos). Sin catch-all `*→*`: los proyectos sin type-tag (web-e2e, ui-kit-storybook)
          // quedan sin restricción a propósito (no son libs de dominio).
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
