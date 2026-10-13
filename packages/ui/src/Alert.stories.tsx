import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  component: Alert,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Alert>

export const Error: Story = {
  args: { variant: 'error', children: 'Incorrect email or password. Please try again.' },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Check your email',
    children: 'We sent a password reset link to the address you provided.',
  },
}
