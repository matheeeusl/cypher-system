import { Alert } from './Alert'
import { AuthCard } from './AuthCard'
import { Button } from './Button'
import { TextField } from './TextField'

export type ResetPasswordStatus = 'default' | 'error' | 'submitting' | 'success'

export interface ResetPasswordLabels {
  eyebrow: string
  title: string
  newPassword: string
  confirmPassword: string
  submit: string
  submitting: string
  successTitle: string
  successBody: string
  backToLogIn: string
}

interface ResetPasswordFormProps {
  status?: ResetPasswordStatus
  errorMessage?: string | undefined
  labels: ResetPasswordLabels
  onSubmit?: (data: { password: string; confirmPassword: string }) => void
  onBackToLogin: () => void
}

function fieldValue(fd: FormData, name: string): string {
  const value = fd.get(name)
  return typeof value === 'string' ? value : ''
}

export function ResetPasswordForm({
  status = 'default',
  errorMessage,
  labels,
  onSubmit,
  onBackToLogin,
}: ResetPasswordFormProps) {
  const isSubmitting = status === 'submitting'
  const showError = status === 'error' && errorMessage

  return (
    <div className="mx-auto w-full max-w-105">
      <AuthCard eyebrow={labels.eyebrow} title={labels.title}>
        {status === 'success' ? (
          <div className="flex flex-col gap-4">
            <Alert variant="success" title={labels.successTitle}>
              {labels.successBody}
            </Alert>
            <Button type="button" fullWidth label={labels.backToLogIn} onClick={onBackToLogin} />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              onSubmit?.({
                password: fieldValue(fd, 'password'),
                confirmPassword: fieldValue(fd, 'confirmPassword'),
              })
            }}
          >
            {showError && (
              <div className="mb-4">
                <Alert variant="error">{errorMessage}</Alert>
              </div>
            )}
            <div className="mb-5 flex flex-col gap-3.5">
              <TextField
                label={labels.newPassword}
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                invalid={status === 'error'}
                disabled={isSubmitting}
              />
              <TextField
                label={labels.confirmPassword}
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                invalid={status === 'error'}
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
              label={isSubmitting ? labels.submitting : labels.submit}
            />
          </form>
        )}
      </AuthCard>
    </div>
  )
}
