interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          checked ? "bg-emerald-500" : "bg-neutral-300"
        }`}
      >
        <span
          aria-hidden
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {(label || description) && (
        <span className="flex min-w-0 flex-col">
          {label && <span className="text-sm font-medium text-neutral-800">{label}</span>}
          {description && (
            <span className="text-xs text-neutral-500">{description}</span>
          )}
        </span>
      )}
    </label>
  );
}
