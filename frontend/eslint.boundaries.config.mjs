// v60-fix — config de ESLint DEDICADA a las fronteras de módulo del frontend (responsabilidad única).
//
// Motivo: las libs de dominio (core/services, shared/ui, features/*) NO son proyectos Nx (no tienen project.json),
// así que `@nx/enforce-module-boundaries` no las gobierna y `npm run lint` (= `nx lint web`) ni siquiera las lintea.
// Esta config impone la DIRECCIÓN DE DEPENDENCIAS por path. Solo declara el PARSER de TypeScript y la regla de
// fronteras: NO hereda el ruleset recomendado de typescript-eslint (evita arrastrar el backlog de reglas nunca
// aplicadas sobre las libs). Se corre con `npm run lint:boundaries`.
//
// Reglas (arquitectura):
//   - Una FEATURE no importa otra FEATURE (bajo acoplamiento) → extraer lo compartido a core/* o shared/*.
//   - Las capas CORE/SHARED no dependen de FEATURES (la dirección va de features hacia abajo, no al revés).
//
// Extensible: añadir más grupos/paths para nuevas reglas de capa. Ver
// revisiones/2026-07-05-analisis-fronteras-nx-frontend.md.
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['libs/features/**/*.ts', 'libs/features/**/*.tsx'],
    languageOptions: { parser: tsParser },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@integration-hub/features/*'],
              message:
                'Una feature no debe importar otra feature (bajo acoplamiento). Extrae lo compartido a ' +
                '@integration-hub/core/* o @integration-hub/shared/*.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/core/**/*.ts', 'libs/core/**/*.tsx', 'libs/shared/**/*.ts', 'libs/shared/**/*.tsx'],
    languageOptions: { parser: tsParser },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@integration-hub/features/*'],
              message:
                'Las capas core/shared no deben depender de features (dirección de dependencias): las features ' +
                'dependen de core/shared, no al revés.',
            },
          ],
        },
      ],
    },
  },
];
