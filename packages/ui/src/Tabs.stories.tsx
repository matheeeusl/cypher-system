import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs } from './Tabs'

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  args: {
    items: [
      { value: 'login', label: 'Log In' },
      { value: 'signup', label: 'Sign Up' },
      { value: 'reset', label: 'Reset' },
    ],
    value: 'login',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return <Tabs {...args} value={value} onChange={setValue} />
  },
}

export const Pills: Story = {
  args: {
    variant: 'pills',
    items: [
      { value: 'status', label: 'Status' },
      { value: 'skills', label: 'Skills & Abilities' },
      { value: 'inventory', label: 'Inventory' },
      { value: 'log', label: 'Log & Notes' },
    ],
    value: 'status',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return <Tabs {...args} value={value} onChange={setValue} />
  },
}
