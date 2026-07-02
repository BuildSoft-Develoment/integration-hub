import type { Preview } from '@storybook/angular';

// Los tokens globales (--ih-*) + tema Material se cargan vía el array `styles` del build
// target `ui-kit-storybook:build` en angular.json (Angular procesa el SCSS de forma nativa).

const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: 'todo' },
    backgrounds: { disable: true },
  },
};

export default preview;
