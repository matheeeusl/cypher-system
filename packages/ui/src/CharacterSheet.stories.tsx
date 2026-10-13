import type { Meta, StoryObj } from '@storybook/react-vite'
import { CharacterSheet, type CharacterSheetLabels } from './CharacterSheet'
import { LinkButton } from './LinkButton'

const labels: CharacterSheetLabels = {
  pools: 'Stat Pools',
  edge: 'Edge',
  skills: 'Skills',
  abilities: 'Abilities',
  inventory: 'Inventory',
  background: 'Background',
  printFooter: 'Cypher System Character Sheet',
}

const meta: Meta<typeof CharacterSheet> = {
  component: CharacterSheet,
  tags: ['autodocs'],
  args: {
    labels,
    printDate: 'Printed 13/10/2026',
    actions: (
      <>
        <LinkButton href="#" label="Edit" variant="ghost" />
        <LinkButton href="#" label="Export as PDF" />
      </>
    ),
    sheet: {
      name: 'Kessa Verne',
      headline: 'Appealing Warrior · Bears a Halo of Fire · Tier 2',
      quickStats: [
        { label: 'Tier', value: '2' },
        { label: 'Effort', value: '2' },
        { label: 'XP', value: '3' },
      ],
      pools: [
        { name: 'Might', edge: 1, current: 17, max: 17 },
        { name: 'Speed', edge: 1, current: 13, max: 13 },
        { name: 'Intellect', edge: 0, current: 8, max: 8 },
      ],
      skills: [
        { name: 'Climbing', level: 'Trained' },
        { name: 'Intimidation', level: 'Trained' },
        { name: 'Perception', level: 'Practiced' },
      ],
      abilities: [
        {
          name: 'Shroud of Flame',
          meta: '1 Intellect point · Focus',
          description:
            'Your body becomes shrouded in flames for up to ten minutes, inflicting 2 damage on anyone who strikes you in melee.',
        },
        {
          name: 'Combat Prowess',
          meta: 'Warrior',
          description: 'You inflict 1 additional point of damage with a chosen weapon type.',
        },
      ],
      inventory: [
        { name: 'Steel Blade', meta: 'Weapon' },
        { name: 'Ordinary clothing', meta: 'Clothing' },
      ],
      background:
        'An ex-military drifter, fast and hard to put down, who picked up a habit of walking into fires other people started.',
    },
  },
}

export default meta
type Story = StoryObj<typeof CharacterSheet>

export const Default: Story = {}

export const NoActions: Story = { args: { actions: undefined } }
