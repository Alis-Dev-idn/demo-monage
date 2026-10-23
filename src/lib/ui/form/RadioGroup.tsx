import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  direction?: 'vertical' | 'horizontal';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  error,
  direction = 'vertical',
}) => {
  return (
    <div
      className={`flex ${direction === 'horizontal' ? 'flex-row gap-6 flex-wrap' : 'flex-col gap-3'}`}
    >
      {options.map((option) => {
        const inputId = `${name}-${option.value}`;
        const isDisabled = option.disabled;

        return (
          <div key={option.value} className="flex gap-3">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="radio"
                id={inputId}
                name={name}
                value={option.value}
                checked={value === option.value}
                disabled={isDisabled}
                onChange={() => onChange?.(option.value)}
                className={[
                  'w-4 h-4 border cursor-pointer transition-colors',
                  'focus:ring-2 focus:ring-offset-1',
                  error
                    ? 'border-red-400 text-red-600 focus:ring-red-300'
                    : 'border-gray-300 text-blue-600 focus:ring-blue-300',
                  isDisabled ? 'cursor-not-allowed opacity-60' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor={inputId}
                className={`text-sm font-medium select-none ${
                  isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer text-gray-700'
                }`}
              >
                {option.label}
              </label>
              {option.description && (
                <span className="text-xs text-gray-500 mt-0.5">{option.description}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
