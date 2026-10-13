import type { Meta, StoryObj } from '@storybook/react-vite'
import { NotesLog, type NotesLogLabels } from './NotesLog'

const labels: NotesLogLabels = {
  title: 'Notes',
  placeholder: 'A note: a clue, a name, a loose thread…',
  add: 'Add note',
  empty: 'No notes yet.',
  remove: 'Remove note',
  previous: '← Newer',
  next: 'Older →',
  page: (current, total) => `Page ${current} of ${total}`,
  count: (used, max) => `${used} / ${max}`,
}

const meta: Meta<typeof NotesLog> = {
  component: NotesLog,
  tags: ['autodocs'],
  args: { labels, maxLength: 500, onAdd: () => {}, onRemove: () => {} },
}

export default meta
type Story = StoryObj<typeof NotesLog>

export const Populated: Story = {
  args: {
    entries: [
      { id: 2, body: 'The archivist owes us a favor.', dateLabel: 'Oct 13, 2026, 7:42 PM' },
      { id: 1, body: 'Sunken Archive: entrance is under the old bell.', dateLabel: 'Oct 6, 2026' },
    ],
  },
}

export const Empty: Story = { args: { entries: [] } }
