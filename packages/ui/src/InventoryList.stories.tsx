import type { Meta, StoryObj } from '@storybook/react-vite'
import { InventoryList } from './InventoryList'

const labels = {
  title: 'Carried Cyphers & Equipment',
  itemName: 'Item name',
  itemMeta: 'Detail (e.g. Weapon · 4 dmg)',
  add: 'Add',
  decrease: 'Decrease quantity',
  increase: 'Increase quantity',
  remove: 'Remove item',
}

const meta: Meta<typeof InventoryList> = {
  component: InventoryList,
  tags: ['autodocs'],
  args: { labels, onAdd: () => {}, onChangeQty: () => {}, onRemove: () => {} },
}

export default meta
type Story = StoryObj<typeof InventoryList>

export const Populated: Story = {
  args: {
    items: [
      { id: '1', name: 'Steel Blade', meta: 'Weapon · 4 dmg', qty: 1 },
      { id: '2', name: 'Fifty Feet of Rope', meta: 'Gear', qty: 2 },
      { id: '3', name: 'Adhesion', meta: 'Cypher · Manifest · Level 1d6', qty: 1 },
    ],
  },
}

export const Empty: Story = { args: { items: [] } }
