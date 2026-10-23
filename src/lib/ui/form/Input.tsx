import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
  /**
   * Visual theme. "light" is the default (white background, gray border).
   * "dark" pairs the input with dark surfaces (e.g. auth dark-split variant).
   */
  theme?: 'light' | 'dark';
}

const sizeClasses = {
  sm: 'py-1.5 text-sm',
  md: 'py-2.5 text-sm',
  lg: 'py-3 text-base',
};

const lightTheme = {
  base: 'bg-white text-gray-900 placeholder:text-gray-400',
  border: 'border-gray-300',
  borderError: 'border-red-400',
  focus: 'focus:border-blue-500 focus:ring-blue-100',
  focusError: 'focus:border-red-500 focus:ring-red-200',
  addon: 'text-gray-400',
  disabled: 'bg-gray-100 text-gray-400',
};

const darkTheme = {
  base: 'bg-white/5 text-gray-100 placeholder:text-gray-500',
  border: 'border-white/10',
  borderError: 'border-red-500/60',
  focus: 'focus:border-cyan-500/60 focus:ring-cyan-500/20 focus:bg-white/[0.07]',
  focusError: 'focus:border-red-500 focus:ring-red-500/20',
  addon: 'text-gray-500',
  disabled: 'bg-white/[0.02] text-gray-500',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftAddon, rightAddon, inputSize = 'md', theme = 'light', className = '', ...props }, ref) => {
    const t = theme === 'dark' ? darkTheme : lightTheme;
    return (
      <div className="relative flex items-center">
        {leftAddon && (
          <div className={`absolute left-3 flex items-center pointer-events-none ${t.addon}`}>
            {leftAddon}
          </div>
        )}
        <input
          ref={ref}
          className={[
            'w-full border rounded-md transition-colors duration-150',
            'focus:outline-none focus:ring-2',
            sizeClasses[inputSize],
            leftAddon ? 'pl-10' : 'pl-3',
            rightAddon ? 'pr-10' : 'pr-3',
            t.base,
            error ? t.borderError : t.border,
            error ? t.focusError : t.focus,
            props.disabled ? `${t.disabled} cursor-not-allowed opacity-70` : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {rightAddon && (
          <div className={`absolute right-3 flex items-center ${t.addon}`}>
            {rightAddon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
