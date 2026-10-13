import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextField } from './TextField'

const meta: Meta<typeof TextField> = {
  component: TextField,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TextField>

export const Default: Story = {
  args: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
}

export const Password: Story = {
  args: { label: 'Password', type: 'password', placeholder: '••••••••' },
}

export const Invalid: Story = {
  args: { label: 'Email', type: 'email', value: 'wrong@example.com', invalid: true },
}

export const Disabled: Story = {
  args: { label: 'Email', type: 'email', disabled: true },
}
