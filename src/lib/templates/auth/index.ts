/**
 * Public surface for the auth template.
 *
 * Recommended usage:
 * ```ts
 * import { AuthTemplate } from "@dep/templates/auth";
 * <AuthTemplate variant="dark-split" mode="login" brand={...} onSubmit={...} />
 * ```
 *
 * Add a new visual variant by creating a Shell under `variants/` and
 * registering it inside `AuthTemplate.tsx` — no need to bump a version.
 */

export { AuthTemplate } from './AuthTemplate';
export type {
  AuthTemplateProps,
  AuthBrand,
  AuthVariant,
  AuthShellProps,
  AuthFormTheme,
  LoginModeProps,
  RegisterModeProps,
  ForgotModeProps,
  ResetModeProps,
  VerifyModeProps,
} from './types';

// Variants — exported so consumers can render a custom dispatcher if needed.
export { DarkSplitShell } from './variants/DarkSplitShell';
export { MinimalCardShell } from './variants/MinimalCardShell';

// Individual forms — exported so consumers can compose their own shell.
export { LoginForm } from './forms/LoginForm';
export { RegisterForm } from './forms/RegisterForm';
export { ForgotPasswordForm } from './forms/ForgotPasswordForm';
export { ResetPasswordForm } from './forms/ResetPasswordForm';
export { VerifyEmailView } from './forms/VerifyEmailView';

// Backward-compatibility aliases. `AuthTemplateV1` was the original name; it
// now resolves to the new variant-aware `AuthTemplate` with `dark-split`
// as the default variant. Existing call sites keep working.
export { AuthTemplate as AuthTemplateV1 } from './AuthTemplate';
export type { AuthTemplateProps as AuthTemplateV1Props } from './types';
