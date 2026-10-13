import type { AuthFormLabels, ResetPasswordLabels } from '@cypher/ui'

export const locales = ['en', 'pt-br'] as const
export type Locale = (typeof locales)[number]

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export const authLabels: Record<Locale, AuthFormLabels> = {
  en: {
    eyebrow: 'Cypher Account',
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
      reset: 'Could not send the reset link. Please try again.',
    },
    successTitle: 'Check your email',
    successBody:
      'We sent a password reset link to the address you provided. It may take a minute to arrive.',
    verifyTitle: 'Verify your email',
    verifyBody:
      'We sent a confirmation link to your email. Open it to activate your account, then log in.',
    noAccount: 'No account?',
    signUp: 'Sign up',
    forgotPassword: 'Forgot password?',
    haveAccount: 'Already have an account?',
    logIn: 'Log in',
    rememberedIt: 'Remembered it?',
    backToLogIn: 'Back to log in',
  },
  'pt-br': {
    eyebrow: 'Conta Cypher',
    tabs: { login: 'Entrar', signup: 'Cadastrar', reset: 'Redefinir' },
    titles: { login: 'Entrar', signup: 'Criar conta', reset: 'Redefinir senha' },
    submit: { login: 'Entrar', signup: 'Criar conta', reset: 'Enviar link de redefinição' },
    submitting: 'Aguarde…',
    continueWithGoogle: 'Continuar com o Google',
    or: 'ou',
    name: 'Nome',
    namePlaceholder: 'Seu nome',
    email: 'E-mail',
    emailPlaceholder: 'voce@exemplo.com',
    password: 'Senha',
    errors: {
      login: 'E-mail ou senha incorretos. Tente novamente.',
      signup: 'Não foi possível criar a conta. Tente novamente.',
      reset: 'Não foi possível enviar o link. Tente novamente.',
    },
    successTitle: 'Verifique seu e-mail',
    successBody:
      'Enviamos um link de redefinição de senha para o endereço informado. Pode levar um minuto para chegar.',
    verifyTitle: 'Confirme seu e-mail',
    verifyBody:
      'Enviamos um link de confirmação para o seu e-mail. Abra-o para ativar a conta e depois entre.',
    noAccount: 'Não tem uma conta?',
    signUp: 'Cadastre-se',
    forgotPassword: 'Esqueceu a senha?',
    haveAccount: 'Já tem uma conta?',
    logIn: 'Entrar',
    rememberedIt: 'Lembrou a senha?',
    backToLogIn: 'Voltar para entrar',
  },
}

export interface AuthMessages {
  google: string
  emailNotVerified: string
  passwordTooShort: string
  invalidToken: string
  passwordMismatch: string
  generic: string
}

export const authMessages: Record<Locale, AuthMessages> = {
  en: {
    google: 'Could not sign in with Google. Please try again.',
    emailNotVerified: 'Please verify your email first — we just sent you a new confirmation link.',
    passwordTooShort: 'Password must be at least 8 characters.',
    invalidToken: 'This reset link is invalid or has expired. Request a new one.',
    passwordMismatch: 'The passwords do not match.',
    generic: 'Something went wrong. Please try again.',
  },
  'pt-br': {
    google: 'Não foi possível entrar com o Google. Tente novamente.',
    emailNotVerified:
      'Confirme seu e-mail primeiro — acabamos de enviar um novo link de confirmação.',
    passwordTooShort: 'A senha deve ter pelo menos 8 caracteres.',
    invalidToken: 'Este link de redefinição é inválido ou expirou. Solicite um novo.',
    passwordMismatch: 'As senhas não coincidem.',
    generic: 'Algo deu errado. Tente novamente.',
  },
}

export const resetPasswordLabels: Record<Locale, ResetPasswordLabels> = {
  en: {
    eyebrow: 'Cypher Reference',
    title: 'Choose a New Password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    submit: 'Save Password',
    submitting: 'Please wait…',
    successTitle: 'Password updated',
    successBody: 'Your password was changed. You can now log in.',
    backToLogIn: 'Back to log in',
  },
  'pt-br': {
    eyebrow: 'Referência Cypher',
    title: 'Escolha uma nova senha',
    newPassword: 'Nova senha',
    confirmPassword: 'Confirmar senha',
    submit: 'Salvar senha',
    submitting: 'Aguarde…',
    successTitle: 'Senha atualizada',
    successBody: 'Sua senha foi alterada. Agora você já pode entrar.',
    backToLogIn: 'Voltar para entrar',
  },
}
