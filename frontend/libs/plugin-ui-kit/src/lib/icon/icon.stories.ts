import type { Meta, StoryObj } from '@storybook/angular';

import { IconComponent } from './icon.component';

const meta: Meta<IconComponent> = {
  title: 'UI kit/Icon',
  component: IconComponent,
  tags: ['autodocs'],
  args: { name: 'shield', size: 24 },
};
export default meta;

type Story = StoryObj<IconComponent>;

export const Single: Story = {};

const ICONS = [
  'check', 'x', 'clock', 'database', 'server', 'folder', 'globe', 'play',
  'shield', 'git-branch', 'calendar', 'refresh', 'search', 'bell', 'lock', 'zap',
];

export const Gallery: Story = {
  render: () => ({
    props: { icons: ICONS },
    template: `
      <div style="display:flex; flex-wrap:wrap; gap:1rem">
        @for (name of icons; track name) {
          <span style="display:inline-flex; flex-direction:column; align-items:center; gap:.25rem; width:4rem; color:var(--ih-text-soft)">
            <ih-icon [name]="name" [size]="24" />
            <small style="font-size:.65rem">{{ name }}</small>
          </span>
        }
      </div>
    `,
  }),
};
