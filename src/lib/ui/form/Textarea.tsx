import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const resizeClasses = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, resize = 'vertical', className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={[
          'w-full border rounded-md bg-white px-3 py-2.5 text-sm transition-colors duration-150',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2',
          resizeClasses[resize],
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100',
          props.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
