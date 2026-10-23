import type { ReactNode } from 'react';

/**
 * Visual variant the AuthTemplate is rendered with. Add new variants by:
 *   1. Creating a `<NewShell>` component under `variants/`
 *   2. Adding its key here
 *   3. Mapping it inside `AuthTemplate.tsx`
 */
export type AuthVariant = 'dark-split' | 'minimal-card';

export interface AuthBrand {
  /** Application / product name (e.g., "Monage") */
  name: string;
  /** Optional logo element rendered in the brand spot */
  logo?: ReactNode;
  /** Main marketing headline shown on the branding side */
  headline: ReactNode;
  /** Optional sub-description below the headline */
  description?: string;
  /** Bullet list of features (rendered on branding panel) */
  features?: string[];
}

export interface BaseAuthProps {
  brand: AuthBrand;
  /** Visual variant. Defaults to "dark-split". */
  variant?: AuthVariant;
  onBackHome?: () => void;
  backHomeLabel?: string;
  isLoading?: boolean;
  errorMessage?: string;
  /**
   * Konten sosial-login opsional (mis. tombol "Lanjut dengan Google"). Saat
   * diisi, login/register form menampilkannya di bawah form dengan pemisah
   * "atau". Hanya dipakai oleh mode `login` & `register`.
   */
  socialSlot?: ReactNode;
}

export interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  agree: boolean;
}

export interface ForgotFormData {
  email: string;
}

export interface ResetFormData {
  password: string;
}

export interface BaseAuthLabelProps {
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

/* ── Mode-specific prop shapes ─────────────────────────── */

export interface LoginModeProps extends BaseAuthProps, BaseAuthLabelProps {
  mode: 'login';
  onSubmit: (data: LoginFormData) => Promise<void> | void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export interface RegisterModeProps extends BaseAuthProps, BaseAuthLabelProps {
  mode: 'register';
  onSubmit: (data: RegisterFormData) => Promise<void> | void;
  onLogin: () => void;
}

export interface ForgotModeProps extends BaseAuthProps, BaseAuthLabelProps {
  mode: 'forgot';
  onSubmit: (data: ForgotFormData) => Promise<void> | void;
  onBackToLogin: () => void;
  isSuccess?: boolean;
}

export interface ResetModeProps extends BaseAuthProps, BaseAuthLabelProps {
  mode: 'reset';
  onSubmit: (data: ResetFormData) => Promise<void> | void;
  onBackToLogin: () => void;
  isSuccess?: boolean;
  isTokenValid?: boolean;
}

export interface VerifyModeProps extends BaseAuthProps {
  mode: 'verify';
  onResend: () => Promise<void> | void;
  onBackToLogin: () => void;
  email?: string;
  isResending?: boolean;
  resendSuccess?: boolean;
  isVerifying?: boolean;
  isVerified?: boolean;
  isTokenInvalid?: boolean;
}

export type AuthTemplateProps =
  | LoginModeProps
  | RegisterModeProps
  | ForgotModeProps
  | ResetModeProps
  | VerifyModeProps;

/* ── Shell contract ────────────────────────────────────── */

/** Visual variants implement this contract so the dispatcher stays trivial. */
export interface AuthShellProps {
  brand: AuthBrand;
  onBackHome?: () => void;
  backHomeLabel?: string;
  children: ReactNode;
}

/** Theme tag passed down to forms so primitives can switch styles. */
export type AuthFormTheme = 'light' | 'dark';
