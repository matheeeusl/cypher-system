import type { Meta, StoryObj } from '@storybook/react-vite'
import { InventoryList, type InventoryLabels } from './InventoryList'

const labels: InventoryLabels = {
  title: 'Carried Cyphers & Equipment',
  itemName: 'Item name',
  itemMeta: 'Detail (e.g. Weapon · 4 dmg)',
  add: 'Add',
  decrease: 'Decrease quantity',
  increase: 'Increase quantity',
  remove: 'Remove item',
  previous: '← Previous',
  next: 'Next →',
  page: (current, total) => `Page ${current} of ${total}`,
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

export const Paginated: Story = {
  args: {
    pageSize: 5,
    items: Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      name: `Item ${i + 1}`,
      meta: 'Gear',
      qty: 1,
    })),
  },
}
