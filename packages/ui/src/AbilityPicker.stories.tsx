import type { Meta, StoryObj } from '@storybook/react-vite'
import { AbilityPicker } from './AbilityPicker'

const meta: Meta<typeof AbilityPicker> = {
  component: AbilityPicker,
  tags: ['autodocs'],
  args: {
    title: 'Tier 2 — choose your Type abilities',
    required: 2,
    hint: (selected, required) => `Choose ${required} — ${selected} selected`,
    confirmLabel: 'Confirm',
    onConfirm: () => {},
    options: [
      {
        id: 'bash',
        label: 'Bash',
        meta: 'Tier 1',
        description: 'You make a melee attack that also knocks the target back.',
      },
      { id: 'swipe', label: 'Swipe', meta: 'Tier 1', description: 'Attack several foes at once.' },
      { id: 'overwatch', label: 'Overwatch', meta: 'Tier 2' },
      { id: 'quick-throw', label: 'Quick Throw', meta: 'Tier 2' },
    ],
  },
}

export default meta
type Story = StoryObj<typeof AbilityPicker>

export const Default: Story = {}

export const FocusChoice: Story = {
  args: {
    title: 'Tier 3 — choose a Focus ability',
    required: 1,
    options: [
      {
        id: 'dual-medium-wield',
        label: 'Dual Medium Wield',
        description: 'Wield two medium weapons.',
      },
      { id: 'precise-cut,spin-attack', label: 'Precise Cut + Spin Attack', meta: 'Bundle' },
    ],
  },
}
