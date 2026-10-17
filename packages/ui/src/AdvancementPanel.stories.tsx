import type { Meta, StoryObj } from '@storybook/react-vite'
import { AdvancementPanel } from './AdvancementPanel'
import { ChipPicker } from './ChipPicker'

const meta: Meta<typeof AdvancementPanel> = {
  component: AdvancementPanel,
  tags: ['autodocs'],
  args: {
    title: 'Character Advancement',
    summary: '1 / 4 steps · 8 XP available',
    description: 'Each step costs 4 XP. Purchase all 4, in any order, to advance to the next tier.',
    onBuy: () => {},
    steps: [
      {
        key: 'pools',
        label: 'Increasing Capabilities — +4 stat Pool points',
        status: 'purchased',
        statusLabel: 'Purchased',
      },
      {
        key: 'edge',
        label: 'Moving Toward Perfection — +1 Edge',
        status: 'available',
        statusLabel: '4 XP',
        actionLabel: 'Purchase',
      },
      {
        key: 'effort',
        label: 'Extra Effort — +1 Effort',
        status: 'available',
        statusLabel: '4 XP',
        actionLabel: 'Purchase',
      },
      {
        key: 'skills',
        label: 'Skills — train a skill',
        status: 'locked',
        statusLabel: 'Needs 4 XP',
      },
    ],
  },
}

export default meta
type Story = StoryObj<typeof AdvancementPanel>

export const Default: Story = {}

export const WithPicker: Story = {
  args: {
    picker: (
      <ChipPicker
        title="Add +1 Edge to:"
        options={[
          { id: 'MIGHT', label: 'Might (1 → 2)' },
          { id: 'SPEED', label: 'Speed (1 → 2)' },
          { id: 'INTELLECT', label: 'Intellect (0 → 1)' },
        ]}
        onPick={() => {}}
        onCancel={() => {}}
        cancelLabel="Cancel"
      />
    ),
  },
}

export const TierUp: Story = {
  args: {
    tierUpMessage: '✓ Advanced to Tier 2 — all four steps purchased.',
    dismissLabel: 'Dismiss',
    onDismissTierUp: () => {},
  },
}

export const BlockedNotice: Story = {
  args: {
    notice:
      'The last step of this tier would advance you to a tier that needs new ability choices, which aren’t supported yet.',
  },
}

export const WithError: Story = { args: { errorMessage: 'Not enough XP.' } }

/** The Other Options share a fifth row: one a tier, in place of a standard step. */
export const WithOtherOption: Story = {
  args: {
    steps: [
      ...(meta.args?.steps ?? []),
      {
        key: 'other',
        label: 'Other option — in place of one step, once per tier',
        status: 'available',
        statusLabel: '4 XP',
        actionLabel: 'Choose…',
      },
    ],
  },
}
