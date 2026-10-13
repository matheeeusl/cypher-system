import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConditionBanner } from './ConditionBanner'

const meta: Meta<typeof ConditionBanner> = {
  component: ConditionBanner,
  tags: ['autodocs'],
  args: { chips: ['Tier 2', 'Effort 2'] },
}

export default meta
type Story = StoryObj<typeof ConditionBanner>

export const Hale: Story = { args: { label: 'Hale', note: 'Your normal, healthy state.' } }

export const Impaired: Story = {
  args: {
    tone: 'warning',
    label: 'Impaired',
    note: 'One stat Pool at 0. Each level of Effort costs 1 more.',
  },
}

export const Debilitated: Story = {
  args: {
    tone: 'warning',
    label: 'Debilitated',
    note: 'Two stat Pools at 0. You can only move an immediate distance.',
  },
}
