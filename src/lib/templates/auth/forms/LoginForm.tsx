import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@dep/ui/button';
import { Checkbox } from '@dep/ui/form/Checkbox';
import { FormField } from '@dep/ui/form/FormField';
import { Input } from '@dep/ui/form/Input';
import { AuthFormBanner } from '../components/AuthFormBanner';
import { AuthFormFooter, AuthLink } from '../components/AuthFormFooter';
import { AuthFormHeader } from '../components/AuthFormHeader';
import { PasswordField } from '../components/PasswordField';
import { loginSchema, type LoginFormData } from '../schemas';
import type { AuthFormTheme, LoginModeProps } from '../types';

interface LoginFormComponentProps extends LoginModeProps {
  theme: AuthFormTheme;
}

export const LoginForm = (p: LoginFormComponentProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  return (
    <div className="flex flex-col gap-5">
      <AuthFormHeader
        theme={p.theme}
        title={p.title ?? 'Welcome back'}
        subtitle={p.subtitle ?? `Sign in to your ${p.brand.name} account`}
      />

      {p.errorMessage && (
        <AuthFormBanner variant="error" theme={p.theme}>
          {p.errorMessage}
        </AuthFormBanner>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((d) =>
          p.onSubmit({ email: d.email, password: d.password, remember: !!d.remember })
        )}
      >
        <FormField
          label="Email"
          htmlFor="login-email"
          errorMessage={errors.email?.message}
        >
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            theme={p.theme}
            error={!!errors.email}
            leftAddon={<Mail size={16} />}
            {...register('email')}
          />
        </FormField>

        <PasswordField
          id="login-password"
          label="Password"
          placeholder="••••••••"
          theme={p.theme}
          errorMessage={errors.password?.message}
          register={register('password')}
        />

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register('remember')} />
          <AuthLink theme={p.theme} onClick={p.onForgotPassword}>
            Forgot password?
          </AuthLink>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={p.isLoading}
          loadingText="Signing in..."
          rightIcon={<ArrowRight size={16} />}
        >
          {p.submitLabel ?? 'Sign In'}
        </Button>
      </form>

      {p.socialSlot && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs uppercase tracking-wide text-neutral-400">atau</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
          {p.socialSlot}
        </div>
      )}

      <AuthFormFooter theme={p.theme}>
        Don&apos;t have an account?{' '}
        <AuthLink theme={p.theme} onClick={p.onRegister}>
          Create one
        </AuthLink>
      </AuthFormFooter>
    </div>
  );
};
