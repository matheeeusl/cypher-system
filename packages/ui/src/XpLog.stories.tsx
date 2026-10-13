import type { Meta, StoryObj } from '@storybook/react-vite'
import { XpLog } from './XpLog'

const labels = {
  title: 'XP Log · 4 XP',
  reasonPlaceholder: 'Description (e.g. GM intrusion, milestone)',
  gain: 'Gain',
  spend: 'Spend',
  add: 'Add',
  empty: 'No XP recorded yet this session.',
  remove: 'Remove entry',
  previous: '← Newer',
  next: 'Older →',
  page: (current: number, total: number) => `Page ${current} of ${total}`,
}

const meta: Meta<typeof XpLog> = {
  component: XpLog,
  tags: ['autodocs'],
  args: { labels, onAdd: () => {}, onRemove: () => {} },
}

export default meta
type Story = StoryObj<typeof XpLog>

export const Populated: Story = {
  args: {
    entries: [
      {
        id: 1,
        reason: 'GM intrusion accepted — jammed weapon',
        amountLabel: '+3 XP',
        tone: 'gain',
        removable: true,
      },
      {
        id: 2,
        reason: 'Session milestone — reached the Sunken Archive',
        amountLabel: '+2 XP',
        tone: 'gain',
        removable: true,
      },
      {
        id: 3,
        reason: 'Character Advancement — Extra Effort (+1 Effort)',
        amountLabel: '−4 XP',
        tone: 'spend',
        removable: false,
      },
    ],
  },
}

export const Empty: Story = { args: { entries: [] } }

export const WithError: Story = {
  args: { entries: [], errorMessage: 'Not enough XP to spend that much.' },
}

export const Paginated: Story = {
  args: {
    pageSize: 10,
    entries: Array.from({ length: 23 }, (_, i) => ({
      id: i + 1,
      reason: `Milestone ${23 - i}`,
      amountLabel: '+1 XP',
      tone: 'gain' as const,
      removable: true,
    })),
  },
}
