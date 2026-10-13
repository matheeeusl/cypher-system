import { Alert } from './Alert'
import { AuthCard } from './AuthCard'
import { Button } from './Button'
import { SocialButton } from './SocialButton'
import { Tabs } from './Tabs'
import { TextField } from './TextField'

export type AuthMode = 'login' | 'signup' | 'reset'
export type AuthStatus = 'default' | 'error' | 'submitting' | 'success'

export interface AuthFormLabels {
  eyebrow: string
  tabs: Record<AuthMode, string>
  titles: Record<AuthMode, string>
  submit: Record<AuthMode, string>
  submitting: string
  continueWithGoogle: string
  or: string
  name: string
  namePlaceholder: string
  email: string
  emailPlaceholder: string
  password: string
  errors: Record<AuthMode, string>
  successTitle: string
  successBody: string
  verifyTitle: string
  verifyBody: string
  noAccount: string
  signUp: string
  forgotPassword: string
  haveAccount: string
  logIn: string
  rememberedIt: string
  backToLogIn: string
}

interface AuthFormProps {
  mode: AuthMode
  status?: AuthStatus
  /** Overrides the default per-mode error text (e.g. a social sign-in failure). */
  errorMessage?: string | undefined
  labels: AuthFormLabels
  onModeChange: (mode: AuthMode) => void
  onSubmit?: (data: { name: string; email: string; password: string }) => void
  /** When provided, a "Continue with Google" button is shown (not in reset mode). */
  onGoogleSignIn?: () => void
}

function fieldValue(fd: FormData, name: string): string {
  const value = fd.get(name)
  return typeof value === 'string' ? value : ''
}

function TextLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-accent hover:text-warning cursor-pointer transition-colors"
    >
      {children}
    </button>
  )
}

export function AuthForm({
  mode,
  status = 'default',
  errorMessage,
  labels,
  onModeChange,
  onSubmit,
  onGoogleSignIn,
}: AuthFormProps) {
  const isSubmitting = status === 'submitting'
  const showError = status === 'error'
  const showSuccess = status === 'success' && mode !== 'login'
  const tabItems = (['login', 'signup', 'reset'] as const).map((m) => ({
    value: m,
    label: labels.tabs[m],
  }))

  return (
    <div className="mx-auto w-full max-w-105">
      <div className="mb-6">
        <Tabs items={tabItems} value={mode} onChange={(v) => onModeChange(v as AuthMode)} />
      </div>

      <AuthCard eyebrow={labels.eyebrow} title={labels.titles[mode]}>
        {showSuccess ? (
          <Alert
            variant="success"
            title={mode === 'signup' ? labels.verifyTitle : labels.successTitle}
          >
            {mode === 'signup' ? labels.verifyBody : labels.successBody}
          </Alert>
        ) : (
          <>
            {onGoogleSignIn && mode !== 'reset' && (
              <div className="mb-5">
                <SocialButton
                  provider="google"
                  label={labels.continueWithGoogle}
                  onClick={onGoogleSignIn}
                  disabled={isSubmitting}
                />
                <div className="mt-5 flex items-center gap-3">
                  <span className="bg-border h-px flex-1" />
                  <span className="text-text-muted font-mono text-[11px] uppercase">
                    {labels.or}
                  </span>
                  <span className="bg-border h-px flex-1" />
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                onSubmit?.({
                  name: fieldValue(fd, 'name'),
                  email: fieldValue(fd, 'email'),
                  password: fieldValue(fd, 'password'),
                })
              }}
            >
              {showError && (
                <div className="mb-4">
                  <Alert variant="error">{errorMessage ?? labels.errors[mode]}</Alert>
                </div>
              )}

              <div className="mb-5 flex flex-col gap-3.5">
                {mode === 'signup' && (
                  <TextField
                    label={labels.name}
                    name="name"
                    placeholder={labels.namePlaceholder}
                    autoComplete="name"
                    disabled={isSubmitting}
                  />
                )}
                <TextField
                  label={labels.email}
                  name="email"
                  type="email"
                  placeholder={labels.emailPlaceholder}
                  autoComplete="email"
                  invalid={showError}
                  disabled={isSubmitting}
                />
                {mode !== 'reset' && (
                  <TextField
                    label={labels.password}
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    invalid={showError}
                    disabled={isSubmitting}
                  />
                )}
              </div>

              <div className="mb-4">
                <Button
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  label={isSubmitting ? labels.submitting : labels.submit[mode]}
                />
              </div>

              <div className="text-text-muted text-center text-xs">
                {mode === 'login' && (
                  <span>
                    {labels.noAccount}{' '}
                    <TextLink onClick={() => onModeChange('signup')}>{labels.signUp}</TextLink> ·{' '}
                    <TextLink onClick={() => onModeChange('reset')}>
                      {labels.forgotPassword}
                    </TextLink>
                  </span>
                )}
                {mode === 'signup' && (
                  <span>
                    {labels.haveAccount}{' '}
                    <TextLink onClick={() => onModeChange('login')}>{labels.logIn}</TextLink>
                  </span>
                )}
                {mode === 'reset' && (
                  <span>
                    {labels.rememberedIt}{' '}
                    <TextLink onClick={() => onModeChange('login')}>{labels.backToLogIn}</TextLink>
                  </span>
                )}
              </div>
            </form>
          </>
        )}
      </AuthCard>
    </div>
  )
}
