import type { Preview } from '@storybook/angular';

// Global design tokens (--ih-*) + Angular Material theme, so the kit renders natively.
import '../apps/web/src/styles.scss';

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
