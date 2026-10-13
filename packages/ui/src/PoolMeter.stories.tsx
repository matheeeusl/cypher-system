import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PoolMeter } from './PoolMeter'

const meta: Meta<typeof PoolMeter> = {
  component: PoolMeter,
  tags: ['autodocs'],
  args: {
    name: 'Might',
    edgeLabel: 'Edge',
    edge: 1,
    max: 17,
    current: 14,
    spendLabel: 'Spend',
    recoverLabel: 'Recover',
    amountLabel: 'Amount',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    recoverFullLabel: 'Full recovery',
    onSpend: () => {},
    onRecover: () => {},
  },
}

export default meta
type Story = StoryObj<typeof PoolMeter>

export const Healthy: Story = {}

export const Empty: Story = { args: { current: 0 } }

export const Interactive: Story = {
  render: (args) => {
    const [current, setCurrent] = useState(args.current)
    return (
      <PoolMeter
        {...args}
        current={current}
        onSpend={(n) => setCurrent((c) => Math.max(0, c - n))}
        onRecover={(n) => setCurrent((c) => (n === 'all' ? args.max : Math.min(args.max, c + n)))}
      />
    )
  },
}
