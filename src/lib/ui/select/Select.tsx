import ReactSelect, { type StylesConfig } from 'react-select';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  isDisabled?: boolean;
}

interface SelectProps<T = string> {
  options: SelectOption<T>[];
  value?: SelectOption<T> | null;
  onChange?: (option: SelectOption<T> | null) => void;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  error?: boolean;
  menuPlacement?: 'auto' | 'top' | 'bottom';
  noOptionsMessage?: string;
  inputId?: string;
}

export function Select<T = string>({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  isLoading,
  isDisabled,
  isClearable = false,
  isSearchable = true,
  error,
  menuPlacement = 'auto',
  noOptionsMessage = 'Tidak ada pilihan',
  inputId,
}: SelectProps<T>) {
  const customStyles: StylesConfig<SelectOption<T>, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      fontSize: '14px',
      borderRadius: '6px',
      borderColor: error
        ? '#f87171'
        : state.isFocused
        ? '#3b82f6'
        : '#d1d5db',
      boxShadow: state.isFocused
        ? error
          ? '0 0 0 3px rgba(248,113,113,0.2)'
          : '0 0 0 3px rgba(59,130,246,0.15)'
        : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#3b82f6',
      },
      backgroundColor: isDisabled ? '#f3f4f6' : '#fff',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.7 : 1,
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '14px',
      backgroundColor: state.isSelected
        ? '#2563eb'
        : state.isFocused
        ? '#eff6ff'
        : '#fff',
      color: state.isSelected ? '#fff' : '#374151',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.5 : 1,
      '&:active': {
        backgroundColor: '#1d4ed8',
        color: '#fff',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '14px',
    }),
    singleValue: (base) => ({
      ...base,
      color: '#111827',
      fontSize: '14px',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 9999,
      overflow: 'hidden',
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? '#3b82f6' : '#9ca3af',
      transition: 'transform 0.2s, color 0.15s',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#9ca3af',
      '&:hover': { color: '#ef4444' },
    }),
  };

  return (
    <ReactSelect<SelectOption<T>, false>
      inputId={inputId}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isLoading={isLoading}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isSearchable={isSearchable}
      menuPlacement={menuPlacement}
      noOptionsMessage={() => noOptionsMessage}
      styles={customStyles}
      classNamePrefix="rs"
    />
  );
}
