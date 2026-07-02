import type { Meta, StoryObj } from '@storybook/angular';

import { EmptyStateComponent } from './empty-state.component';

const meta: Meta<EmptyStateComponent> = {
  title: 'UI kit/Empty state',
  component: EmptyStateComponent,
  tags: ['autodocs'],
  args: {
    icon: 'folder',
    message: 'No hay elementos todavía.',
  },
};
export default meta;

type Story = StoryObj<EmptyStateComponent>;

export const Default: Story = {};

export const WithCta: Story = {
  args: {
    icon: 'plus',
    message: 'Aún no has creado ninguna conexión.',
    ctaLabel: 'Crear conexión',
  },
};

export const NoIcon: Story = {
  args: { icon: null, message: 'Sin resultados para el filtro actual.' },
};
