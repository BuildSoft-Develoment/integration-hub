import type { StorybookConfig } from '@storybook/angular';

/**
 * Storybook para el UI kit compartido (`@integration-hub/shared/ui`). Escanea las stories
 * co-localizadas con los componentes. Los tokens `--ih-*` y el tema Material se cargan en
 * `preview.ts`. Addon `a11y` (axe) para auditar accesibilidad en cada story.
 */
const config: StorybookConfig = {
  stories: ['../libs/plugin-ui-kit/src/**/*.stories.@(ts|mdx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};

export default config;
