import type { Meta, StoryObj } from '@storybook/react-vite'
import { PoolSplitPicker } from './PoolSplitPicker'

const meta: Meta<typeof PoolSplitPicker> = {
  component: PoolSplitPicker,
  tags: ['autodocs'],
  args: {
    title: 'Split +4 points among your Pools:',
    total: 4,
    options: [
      { id: 'MIGHT', label: 'Might' },
      { id: 'SPEED', label: 'Speed' },
      { id: 'INTELLECT', label: 'Intellect' },
    ],
    remainingLabel: (n) => `${n} left`,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    addLabel: 'Add to',
    removeLabel: 'Remove from',
    onConfirm: () => {},
    onCancel: () => {},
  },
}

export default meta
type Story = StoryObj<typeof PoolSplitPicker>

export const Default: Story = {}

export const Portuguese: Story = {
  args: {
    title: 'Divida +4 pontos entre as Reservas:',
    options: [
      { id: 'MIGHT', label: 'Poder' },
      { id: 'SPEED', label: 'Velocidade' },
      { id: 'INTELLECT', label: 'Intelecto' },
    ],
    remainingLabel: (n) => `${n} restantes`,
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    addLabel: 'Adicionar a',
    removeLabel: 'Remover de',
  },
}
