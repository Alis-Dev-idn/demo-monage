import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail, User } from 'lucide-react';
import { Button } from '@dep/ui/button';
import { Checkbox } from '@dep/ui/form/Checkbox';
import { FormField } from '@dep/ui/form/FormField';
import { Input } from '@dep/ui/form/Input';
import { AuthFormBanner } from '../components/AuthFormBanner';
import { AuthFormFooter, AuthLink } from '../components/AuthFormFooter';
import { AuthFormHeader } from '../components/AuthFormHeader';
import { PasswordField } from '../components/PasswordField';
import { registerSchema, type RegisterFormData } from '../schemas';
import type { AuthFormTheme, RegisterModeProps } from '../types';

interface RegisterFormComponentProps extends RegisterModeProps {
  theme: AuthFormTheme;
}

export const RegisterForm = (p: RegisterFormComponentProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  return (
    <div className="flex flex-col gap-5">
      <AuthFormHeader
        theme={p.theme}
        title={p.title ?? 'Create account'}
        subtitle={p.subtitle ?? `Join ${p.brand.name} and start in minutes`}
      />

      {p.errorMessage && (
        <AuthFormBanner variant="error" theme={p.theme}>
          {p.errorMessage}
        </AuthFormBanner>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((d) =>
          p.onSubmit({ fullName: d.fullName, email: d.email, password: d.password, agree: !!d.agree })
        )}
      >
        <FormField label="Full name" htmlFor="reg-name" errorMessage={errors.fullName?.message}>
          <Input
            id="reg-name"
            placeholder="Budi Santoso"
            theme={p.theme}
            error={!!errors.fullName}
            leftAddon={<User size={16} />}
            {...register('fullName')}
          />
        </FormField>

        <FormField label="Email" htmlFor="reg-email" errorMessage={errors.email?.message}>
          <Input
            id="reg-email"
            type="email"
            placeholder="you@example.com"
            theme={p.theme}
            error={!!errors.email}
            leftAddon={<Mail size={16} />}
            {...register('email')}
          />
        </FormField>

        <PasswordField
          id="reg-password"
          label="Password"
          placeholder="At least 8 characters"
          helperText="Minimum 8 characters"
          theme={p.theme}
          errorMessage={errors.password?.message}
          register={register('password')}
        />

        <PasswordField
          id="reg-confirm"
          label="Confirm password"
          placeholder="Repeat your password"
          theme={p.theme}
          errorMessage={errors.confirmPassword?.message}
          register={register('confirmPassword')}
        />

        <FormField errorMessage={errors.agree?.message}>
          <Checkbox label="I agree to the terms and conditions" {...register('agree')} />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={p.isLoading}
          loadingText="Creating account..."
          rightIcon={<ArrowRight size={16} />}
        >
          {p.submitLabel ?? 'Create account'}
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
        Already have an account?{' '}
        <AuthLink theme={p.theme} onClick={p.onLogin}>
          Sign in
        </AuthLink>
      </AuthFormFooter>
    </div>
  );
};
