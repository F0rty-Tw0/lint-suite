import type { Meta, StoryObj } from '@storybook/angular';

import { CardComponent } from '../app/ui/card/card.component';

const meta: Meta<CardComponent> = {
  title: 'Components/Card',
  component: CardComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<CardComponent>;

export const Default: Story = {
  args: {
    title: 'Example Card',
  },
};

export const LongTitle: Story = {
  args: {
    title: 'This is a much longer card title to test text wrapping behavior',
  },
};
