import type { Meta, StoryObj } from '@storybook/react-vite'
import { LinkButton } from './LinkButton'

const meta: Meta<typeof LinkButton> = {
  component: LinkButton,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof LinkButton>

export const Medium: Story = { args: { href: '#', label: '+ New Character' } }

export const Large: Story = { args: { href: '#', label: '+ New Character', size: 'lg' } }

export const Ghost: Story = { args: { href: '#', label: 'Edit', variant: 'ghost' } }
