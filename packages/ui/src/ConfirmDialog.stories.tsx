import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConfirmDialog } from './ConfirmDialog'

const meta: Meta<typeof ConfirmDialog> = {
  component: ConfirmDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    title: 'Delete "Kessa Verne"?',
    description: "This can't be undone.",
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    busyLabel: 'Deleting…',
    destructive: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
}

export default meta
type Story = StoryObj<typeof ConfirmDialog>

export const Destructive: Story = {}

export const Busy: Story = { args: { busy: true } }

export const WithError: Story = {
  args: { errorMessage: 'Could not delete the character. Please try again.' },
}

export const Neutral: Story = {
  args: { title: 'Discard changes?', confirmLabel: 'Discard', destructive: false },
}
