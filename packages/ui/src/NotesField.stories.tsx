import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { NotesField } from './NotesField'

const meta: Meta<typeof NotesField> = {
  component: NotesField,
  tags: ['autodocs'],
  args: {
    label: 'Notes',
    placeholder: 'Session notes, reminders, loose threads…',
    value: '',
    onChange: () => {},
  },
}

export default meta
type Story = StoryObj<typeof NotesField>

export const Empty: Story = {}

export const Saving: Story = {
  args: { value: 'Ask the GM about the Sunken Archive.', status: 'Saving…' },
}

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState('')
    return <NotesField {...args} value={value} onChange={setValue} />
  },
}
