import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { Button } from '@dep/ui/button';
import { FormField } from '@dep/ui/form/FormField';
import { Input } from '@dep/ui/form/Input';
import { AuthFormBanner } from '../components/AuthFormBanner';
import { AuthFormFooter, AuthLink } from '../components/AuthFormFooter';
import { AuthFormHeader } from '../components/AuthFormHeader';
import { AuthStatusView } from '../components/AuthStatusView';
import { forgotSchema, type ForgotFormData } from '../schemas';
import type { AuthFormTheme, ForgotModeProps } from '../types';

interface ForgotPasswordFormComponentProps extends ForgotModeProps {
  theme: AuthFormTheme;
}

export const ForgotPasswordForm = (p: ForgotPasswordFormComponentProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotFormData>({ resolver: zodResolver(forgotSchema) });

  if (p.isSuccess) {
    return (
      <AuthStatusView
        theme={p.theme}
        iconVariant="success"
        icon={<CheckCircle size={32} />}
        title="Email sent"
        description="We sent a reset link to:"
        email={getValues('email')}
      >
        <Button variant="outline" fullWidth onClick={p.onBackToLogin}>
          Back to sign in
        </Button>
      </AuthStatusView>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AuthFormHeader
        theme={p.theme}
        title={p.title ?? 'Forgot password'}
        subtitle={p.subtitle ?? 'Enter your email and we will send you a reset link.'}
      />

      {p.errorMessage && (
        <AuthFormBanner variant="error" theme={p.theme}>
          {p.errorMessage}
        </AuthFormBanner>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit((d) => p.onSubmit(d))}>
        <FormField label="Email" htmlFor="forgot-email" errorMessage={errors.email?.message}>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            theme={p.theme}
            error={!!errors.email}
            leftAddon={<Mail size={16} />}
            {...register('email')}
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={p.isLoading}
          loadingText="Sending..."
        >
          {p.submitLabel ?? 'Send reset link'}
        </Button>
      </form>

      <AuthFormFooter theme={p.theme}>
        <AuthLink theme={p.theme} onClick={p.onBackToLogin}>
          <ArrowLeft size={14} className="inline-block align-middle mr-1" />
          Back to sign in
        </AuthLink>
      </AuthFormFooter>
    </div>
  );
};
