import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AuthForm, type AuthFormLabels, type AuthMode } from './AuthForm'

const labels: AuthFormLabels = {
  eyebrow: 'Cypher Reference',
  tabs: { login: 'Log In', signup: 'Sign Up', reset: 'Reset' },
  titles: { login: 'Log In', signup: 'Create Account', reset: 'Reset Password' },
  submit: { login: 'Log In', signup: 'Create Account', reset: 'Send Reset Link' },
  submitting: 'Please wait…',
  continueWithGoogle: 'Continue with Google',
  or: 'or',
  name: 'Name',
  namePlaceholder: 'Your name',
  email: 'Email',
  emailPlaceholder: 'you@example.com',
  password: 'Password',
  errors: {
    login: 'Incorrect email or password. Please try again.',
    signup: 'Could not create the account. Please try again.',
    reset: "We couldn't find an account with that email.",
  },
  successTitle: 'Check your email',
  successBody:
    'We sent a password reset link to the address you provided. It may take a minute to arrive.',
  verifyTitle: 'Verify your email',
  verifyBody: 'We sent a confirmation link to your email. Open it to activate your account.',
  noAccount: 'No account?',
  signUp: 'Sign up',
  forgotPassword: 'Forgot password?',
  haveAccount: 'Already have an account?',
  logIn: 'Log in',
  rememberedIt: 'Remembered it?',
  backToLogIn: 'Back to log in',
}

const meta: Meta<typeof AuthForm> = {
  component: AuthForm,
  tags: ['autodocs'],
  args: { labels, mode: 'login', status: 'default', onGoogleSignIn: () => {} },
  render: (args) => {
    const [mode, setMode] = useState<AuthMode>(args.mode)
    return <AuthForm {...args} mode={mode} onModeChange={setMode} />
  },
}

export default meta
type Story = StoryObj<typeof AuthForm>

export const Login: Story = {}

export const Signup: Story = { args: { mode: 'signup' } }

export const Reset: Story = { args: { mode: 'reset' } }

export const ValidationError: Story = { args: { status: 'error' } }

export const Submitting: Story = { args: { status: 'submitting' } }

export const SignupVerify: Story = { args: { mode: 'signup', status: 'success' } }

export const ResetSuccess: Story = { args: { mode: 'reset', status: 'success' } }
