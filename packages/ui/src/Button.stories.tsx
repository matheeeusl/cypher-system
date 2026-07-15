import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { label: 'Roll for Initiative', variant: 'primary' },
}

export const Ghost: Story = {
  args: { label: 'Cancel', variant: 'ghost' },
}
