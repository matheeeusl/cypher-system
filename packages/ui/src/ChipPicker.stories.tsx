import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChipPicker } from './ChipPicker'

const meta: Meta<typeof ChipPicker> = {
  component: ChipPicker,
  tags: ['autodocs'],
  args: { onPick: () => {} },
}

export default meta
type Story = StoryObj<typeof ChipPicker>

export const Simple: Story = {
  args: {
    title: 'Add +4 to:',
    options: [
      { id: 'MIGHT', label: 'Might' },
      { id: 'SPEED', label: 'Speed' },
      { id: 'INTELLECT', label: 'Intellect' },
    ],
    onCancel: () => {},
    cancelLabel: 'Cancel',
  },
}

export const Searchable: Story = {
  args: {
    searchPlaceholder: 'Search skills — any skill can be trained',
    options: [
      { id: 'climbing', label: 'Climbing (Trained → Specialized)', highlight: true },
      { id: 'balancing', label: 'Balancing (Practiced → Trained)' },
      { id: 'initiative', label: 'Initiative — Specialized (maxed)', disabled: true },
      { id: 'stealth', label: 'Stealth (Practiced → Trained)' },
    ],
  },
}
