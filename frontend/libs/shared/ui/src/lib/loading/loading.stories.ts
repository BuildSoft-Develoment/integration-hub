import type { Meta, StoryObj } from '@storybook/angular';

import { LoadingComponent } from './loading.component';

const meta: Meta<LoadingComponent> = {
  title: 'UI kit/Loading',
  component: LoadingComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['bar', 'skeleton'] },
  },
};
export default meta;

type Story = StoryObj<LoadingComponent>;

export const Bar: Story = { args: { variant: 'bar' } };

export const Skeleton: Story = { args: { variant: 'skeleton', rows: 4 } };
