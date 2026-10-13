'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { ResetPasswordForm, type ResetPasswordStatus } from '@cypher/ui'

import { authClient } from '@/lib/auth-client'
import { authMessages, resetPasswordLabels, type Locale } from '@/lib/i18n/auth'

interface ResetPasswordScreenProps {
  locale: Locale
  /** From the emailed link (?token=…). Missing/invalid means the link is bad. */
  token: string | undefined
}

export function ResetPasswordScreen({ locale, token }: ResetPasswordScreenProps) {
  const router = useRouter()
  const messages = authMessages[locale]
  const [status, setStatus] = useState<ResetPasswordStatus>(token ? 'default' : 'error')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    token ? undefined : messages.invalidToken,
  )

  async function handleSubmit({
    password,
    confirmPassword,
  }: {
    password: string
    confirmPassword: string
  }) {
    if (!token) return
    if (password !== confirmPassword) {
      setErrorMessage(messages.passwordMismatch)
      return setStatus('error')
    }

    setStatus('submitting')
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    if (!error) return setStatus('success')

    setErrorMessage(
      error.code === 'INVALID_TOKEN'
        ? messages.invalidToken
        : error.code === 'PASSWORD_TOO_SHORT'
          ? messages.passwordTooShort
          : messages.generic,
    )
    setStatus('error')
  }

  return (
    <ResetPasswordForm
      status={status}
      errorMessage={errorMessage}
      labels={resetPasswordLabels[locale]}
      onSubmit={(data) => void handleSubmit(data)}
      onBackToLogin={() => router.push(`/${locale}/auth`)}
    />
  )
}
