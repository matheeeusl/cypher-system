'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { AuthForm, type AuthMode, type AuthStatus } from '@cypher/ui'

import { authClient } from '@/lib/auth-client'
import { authLabels, authMessages, type Locale } from '@/lib/i18n/auth'

export function AuthScreen({ locale }: { locale: Locale }) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [status, setStatus] = useState<AuthStatus>('default')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const messages = authMessages[locale]

  function changeMode(next: AuthMode) {
    setMode(next)
    setStatus('default')
    setErrorMessage(undefined)
  }

  function fail(message?: string) {
    setErrorMessage(message)
    setStatus('error')
  }

  async function handleGoogleSignIn() {
    setStatus('submitting')
    setErrorMessage(undefined)
    // Redirects to Google on success, so only the failure path continues here.
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `/${locale}`,
    })
    if (error) fail(messages.google)
  }

  async function handleSubmit({
    name,
    email,
    password,
  }: {
    name: string
    email: string
    password: string
  }) {
    setStatus('submitting')
    setErrorMessage(undefined)

    if (mode === 'login') {
      const { error } = await authClient.signIn.email({ email, password })
      if (!error) return router.replace(`/${locale}`)
      fail(error.code === 'EMAIL_NOT_VERIFIED' ? messages.emailNotVerified : undefined)
      return
    }

    if (mode === 'signup') {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: `/${locale}/auth`,
      })
      if (!error) return setStatus('success')
      fail(error.code === 'PASSWORD_TOO_SHORT' ? messages.passwordTooShort : undefined)
      return
    }

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password`,
    })
    if (error) return fail()
    setStatus('success')
  }

  return (
    <AuthForm
      mode={mode}
      status={status}
      errorMessage={errorMessage}
      labels={authLabels[locale]}
      onModeChange={changeMode}
      onSubmit={(data) => void handleSubmit(data)}
      onGoogleSignIn={() => void handleGoogleSignIn()}
    />
  )
}
