import { LoginForm } from './forms/LoginForm';
import { RegisterForm } from './forms/RegisterForm';
import { ForgotPasswordForm } from './forms/ForgotPasswordForm';
import { ResetPasswordForm } from './forms/ResetPasswordForm';
import { VerifyEmailView } from './forms/VerifyEmailView';
import { DarkSplitShell } from './variants/DarkSplitShell';
import { MinimalCardShell } from './variants/MinimalCardShell';
import type {
  AuthFormTheme,
  AuthShellProps,
  AuthTemplateProps,
  AuthVariant,
} from './types';

/**
 * Mapping from variant name to (Shell component + theme used by form primitives).
 *
 * To add a new variant:
 *   1. Create `variants/<Name>Shell.tsx` matching `AuthShellProps`
 *   2. Register it here with the right form theme
 *   3. Add the key to `AuthVariant` in `./types.ts`
 *
 * The forms themselves stay variant-agnostic — they only switch input/banner
 * colors via the `theme` value carried here.
 */
const VARIANTS: Record<
  AuthVariant,
  { Shell: React.FC<AuthShellProps>; theme: AuthFormTheme }
> = {
  'dark-split': { Shell: DarkSplitShell, theme: 'dark' },
  'minimal-card': { Shell: MinimalCardShell, theme: 'light' },
};

/**
 * Single entry-point for all auth screens (login / register / forgot /
 * reset / verify). Pick the visual variant via the `variant` prop.
 *
 * @example
 * ```tsx
 * <AuthTemplate
 *   variant="dark-split"
 *   mode="login"
 *   brand={{ name: "Monage", headline: "Manage your money mindfully" }}
 *   onSubmit={handleLogin}
 *   onForgotPassword={() => nav("/forgot")}
 *   onRegister={() => nav("/register")}
 * />
 * ```
 */
export const AuthTemplate = (props: AuthTemplateProps) => {
  const variant: AuthVariant = props.variant ?? 'dark-split';
  const { Shell, theme } = VARIANTS[variant] ?? VARIANTS['dark-split'];

  return (
    <Shell
      brand={props.brand}
      onBackHome={props.onBackHome}
      backHomeLabel={props.backHomeLabel}
    >
      {props.mode === 'login' && <LoginForm {...props} theme={theme} />}
      {props.mode === 'register' && <RegisterForm {...props} theme={theme} />}
      {props.mode === 'forgot' && <ForgotPasswordForm {...props} theme={theme} />}
      {props.mode === 'reset' && <ResetPasswordForm {...props} theme={theme} />}
      {props.mode === 'verify' && <VerifyEmailView {...props} theme={theme} />}
    </Shell>
  );
};
