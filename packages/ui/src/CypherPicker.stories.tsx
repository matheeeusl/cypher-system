import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CypherPicker } from './CypherPicker'

const labels = {
  hint: 'Browse the cypher catalog to add a real one to inventory.',
  browse: 'Browse Cyphers',
  search: 'Search cyphers…',
  shown: (n: number) => `${n} shown`,
  close: 'Close',
  all: 'All',
  noResults: 'No cyphers match your search.',
  level: (l: string) => `Level: ${l}`,
  add: '+ Add to Inventory',
  loading: 'Loading cyphers…',
  loadFailed: 'Couldn’t load the cypher catalog.',
}

const categories = [
  { id: 'MANIFEST', label: 'Manifest' },
  { id: 'FANTASTIC', label: 'Fantastic' },
  { id: 'SUBTLE', label: 'Subtle' },
]

const cyphers = [
  {
    id: 'adhesion',
    name: 'Adhesion',
    categoryId: 'MANIFEST',
    categoryLabel: 'Manifest',
    level: '1d6',
    effect: 'Allows for automatic climbing of any surface, even horizontal ones.',
  },
  {
    id: 'antivenom',
    name: 'Antivenom',
    categoryId: 'MANIFEST',
    categoryLabel: 'Manifest',
    level: '1d6 + 2',
    effect: 'Neutralizes poison in the body.',
  },
  {
    id: 'blinking',
    name: 'Blinking',
    categoryId: 'FANTASTIC',
    categoryLabel: 'Fantastic',
    level: '1d6',
    effect: 'Teleports you a short distance.',
  },
  {
    id: 'stim',
    name: 'Stim',
    categoryId: 'SUBTLE',
    categoryLabel: 'Subtle',
    level: '1d6',
    effect: 'Restores points to a Pool.',
  },
]

const meta: Meta<typeof CypherPicker> = {
  component: CypherPicker,
  tags: ['autodocs'],
  args: {
    labels,
    categories,
    cyphers,
    open: true,
    onOpen: () => {},
    onClose: () => {},
    onAdd: () => {},
  },
}

export default meta
type Story = StoryObj<typeof CypherPicker>

export const Closed: Story = { args: { open: false } }

export const Open: Story = {}

export const Loading: Story = { args: { cyphers: null } }

export const Failed: Story = { args: { cyphers: null, failed: true } }

export const Interactive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <CypherPicker
        {...args}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
      />
    )
  },
}
