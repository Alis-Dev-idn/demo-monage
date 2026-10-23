import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className={`flex gap-3 ${className}`}>
        <div className="flex items-center h-5 mt-0.5">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={[
              'w-4 h-4 rounded border cursor-pointer transition-colors',
              'focus:ring-2 focus:ring-offset-1',
              error
                ? 'border-red-400 text-red-600 focus:ring-red-300'
                : 'border-gray-300 text-blue-600 focus:ring-blue-300',
              props.disabled ? 'cursor-not-allowed opacity-60' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor={inputId}
            className={`text-sm font-medium cursor-pointer select-none ${
              props.disabled ? 'opacity-60 cursor-not-allowed' : 'text-gray-700'
            }`}
          >
            {label}
          </label>
          {description && (
            <span className="text-xs text-gray-500 mt-0.5">{description}</span>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
