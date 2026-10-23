import { useState } from 'react';
import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { FormField } from '@dep/ui/form/FormField';
import { Input } from '@dep/ui/form/Input';
import type { AuthFormTheme } from '../types';

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  register?: UseFormRegisterReturn;
  theme?: AuthFormTheme;
  leftIcon?: ReactNode;
}

/**
 * Reusable password input with eye-toggle visibility.
 * Built on top of the shared UI `<Input>` / `<FormField>` so all auth forms
 * stay consistent with the rest of the app.
 */
export const PasswordField = ({
  id,
  label,
  placeholder,
  helperText,
  errorMessage,
  register,
  theme = 'light',
  leftIcon = <Lock size={16} />,
}: PasswordFieldProps) => {
  const [show, setShow] = useState(false);

  return (
    <FormField label={label} htmlFor={id} helperText={helperText} errorMessage={errorMessage}>
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        theme={theme}
        error={!!errorMessage}
        leftAddon={leftIcon}
        rightAddon={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className={
              theme === 'dark'
                ? 'pointer-events-auto text-gray-400 hover:text-gray-200 transition-colors'
                : 'pointer-events-auto text-gray-500 hover:text-gray-700 transition-colors'
            }
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        {...(register ?? {})}
      />
    </FormField>
  );
};
