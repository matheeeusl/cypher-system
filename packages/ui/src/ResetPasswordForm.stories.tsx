import type { Meta, StoryObj } from '@storybook/react-vite'
import { ResetPasswordForm, type ResetPasswordLabels } from './ResetPasswordForm'

const labels: ResetPasswordLabels = {
  eyebrow: 'Cypher Reference',
  title: 'Choose a New Password',
  newPassword: 'New password',
  confirmPassword: 'Confirm password',
  submit: 'Save Password',
  submitting: 'Please wait…',
  successTitle: 'Password updated',
  successBody: 'Your password was changed. You can now log in.',
  backToLogIn: 'Back to log in',
}

const meta: Meta<typeof ResetPasswordForm> = {
  component: ResetPasswordForm,
  tags: ['autodocs'],
  args: { labels, status: 'default', onBackToLogin: () => {} },
}

export default meta
type Story = StoryObj<typeof ResetPasswordForm>

export const Default: Story = {}

export const ValidationError: Story = {
  args: { status: 'error', errorMessage: 'The passwords do not match.' },
}

export const Submitting: Story = { args: { status: 'submitting' } }

export const Success: Story = { args: { status: 'success' } }
