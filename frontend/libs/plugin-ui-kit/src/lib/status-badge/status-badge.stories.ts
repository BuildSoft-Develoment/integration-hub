import type { Meta, StoryObj } from '@storybook/angular';

import { StatusBadgeComponent } from './status-badge.component';

const meta: Meta<StatusBadgeComponent> = {
  title: 'UI kit/Status badge',
  component: StatusBadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info', 'neutral'],
    },
  },
  render: (args) => ({
    props: args,
    template: `<ih-status-badge [status]="status">{{ status }}</ih-status-badge>`,
  }),
};
export default meta;

type Story = StoryObj<StatusBadgeComponent>;

export const Success: Story = { args: { status: 'success' } };
export const Error: Story = { args: { status: 'error' } };
export const Warning: Story = { args: { status: 'warning' } };
export const Info: Story = { args: { status: 'info' } };
export const Neutral: Story = { args: { status: 'neutral' } };

export const AllKinds: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:.5rem; flex-wrap:wrap; align-items:center">
        <ih-status-badge status="success">success</ih-status-badge>
        <ih-status-badge status="error">error</ih-status-badge>
        <ih-status-badge status="warning">warning</ih-status-badge>
        <ih-status-badge status="info">info</ih-status-badge>
        <ih-status-badge status="neutral">neutral</ih-status-badge>
      </div>
    `,
  }),
};
