import type { Meta, StoryObj } from '@storybook/react-vite'
import { CharacterList, type CharacterListLabels } from './CharacterList'

const labels: CharacterListLabels = {
  title: 'My Characters',
  subtitle: 'Saved Cypher System characters',
  newCharacter: 'New Character',
  tier: 'Tier',
  updateBadge: 'Rules Update',
  emptyTitle: 'No characters yet.',
  emptyBody: 'Build your first character to get started — it takes about ten minutes.',
}

const meta: Meta<typeof CharacterList> = {
  component: CharacterList,
  tags: ['autodocs'],
  args: { labels, newCharacterHref: '#', characters: [] },
}

export default meta
type Story = StoryObj<typeof CharacterList>

export const Empty: Story = {}

export const Populated: Story = {
  args: {
    characters: [
      {
        id: '1',
        name: 'Kessa Verne',
        tier: 2,
        descriptor: 'Appealing',
        type: 'Warrior',
        focus: 'Bears a Halo of Fire',
        updatedLabel: 'Updated 2 days ago',
        stale: true,
        href: '#',
      },
      {
        id: '2',
        name: 'Doran Ashe',
        tier: 1,
        descriptor: 'Clever',
        type: 'Adept',
        focus: 'Talks to Machines',
        updatedLabel: 'Updated 1 week ago',
        href: '#',
      },
      {
        id: '3',
        name: 'Vex Marlowe',
        tier: 3,
        descriptor: 'Stealthy',
        type: 'Explorer',
        focus: 'Knows the Way',
        updatedLabel: 'Updated 3 weeks ago',
        href: '#',
      },
    ],
  },
}
