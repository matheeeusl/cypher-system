import type { Meta, StoryObj } from '@storybook/react-vite'
import { SocialButton } from './SocialButton'

const meta: Meta<typeof SocialButton> = {
  component: SocialButton,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SocialButton>

export const Google: Story = {
  args: { provider: 'google', label: 'Continue with Google' },
}

export const Disabled: Story = {
  args: { provider: 'google', label: 'Continue with Google', disabled: true },
}
