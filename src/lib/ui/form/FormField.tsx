import React from 'react';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  errorMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  helperText,
  errorMessage,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {children}

      {errorMessage && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          {errorMessage}
        </p>
      )}

      {helperText && !errorMessage && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
