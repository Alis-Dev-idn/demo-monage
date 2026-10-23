import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@dep/ui/button';
import { AuthFormBanner } from '../components/AuthFormBanner';
import { AuthFormHeader } from '../components/AuthFormHeader';
import { AuthStatusView } from '../components/AuthStatusView';
import { PasswordField } from '../components/PasswordField';
import { resetSchema, type ResetFormData } from '../schemas';
import type { AuthFormTheme, ResetModeProps } from '../types';

interface ResetPasswordFormComponentProps extends ResetModeProps {
  theme: AuthFormTheme;
}

export const ResetPasswordForm = (p: ResetPasswordFormComponentProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

  if (p.isTokenValid === false) {
    return (
      <AuthStatusView
        theme={p.theme}
        iconVariant="error"
        icon={<XCircle size={32} />}
        title="Invalid link"
        description="This reset link has expired or is no longer valid."
      >
        <Button variant="primary" fullWidth onClick={p.onBackToLogin}>
          Back to sign in
        </Button>
      </AuthStatusView>
    );
  }

  if (p.isSuccess) {
    return (
      <AuthStatusView
        theme={p.theme}
        iconVariant="success"
        icon={<CheckCircle size={32} />}
        title="Password updated"
        description="Sign in with your new password."
      >
        <Button variant="primary" fullWidth onClick={p.onBackToLogin}>
          Sign in now
        </Button>
      </AuthStatusView>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AuthFormHeader
        theme={p.theme}
        title={p.title ?? 'Set new password'}
        subtitle={p.subtitle ?? 'Password must be at least 8 characters.'}
      />

      {p.errorMessage && (
        <AuthFormBanner variant="error" theme={p.theme}>
          {p.errorMessage}
        </AuthFormBanner>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((d) => p.onSubmit({ password: d.password }))}
      >
        <PasswordField
          id="reset-password"
          label="New password"
          placeholder="At least 8 characters"
          theme={p.theme}
          errorMessage={errors.password?.message}
          register={register('password')}
        />

        <PasswordField
          id="reset-confirm"
          label="Confirm password"
          placeholder="Repeat new password"
          theme={p.theme}
          errorMessage={errors.confirmPassword?.message}
          register={register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={p.isLoading}
          loadingText="Saving..."
        >
          {p.submitLabel ?? 'Save new password'}
        </Button>
      </form>
    </div>
  );
};
