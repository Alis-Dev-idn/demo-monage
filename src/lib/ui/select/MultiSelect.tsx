import ReactSelect, { type StylesConfig, type MultiValue } from 'react-select';
import type { SelectOption } from './Select';

interface MultiSelectProps<T = string> {
  options: SelectOption<T>[];
  value?: SelectOption<T>[];
  onChange?: (options: SelectOption<T>[]) => void;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  error?: boolean;
  maxSelected?: number;
  menuPlacement?: 'auto' | 'top' | 'bottom';
  noOptionsMessage?: string;
  inputId?: string;
}

export function MultiSelect<T = string>({
  options,
  value = [],
  onChange,
  placeholder = 'Pilih beberapa...',
  isLoading,
  isDisabled,
  isClearable = true,
  isSearchable = true,
  error,
  maxSelected,
  menuPlacement = 'auto',
  noOptionsMessage = 'Tidak ada pilihan',
  inputId,
}: MultiSelectProps<T>) {
  const isMaxReached = maxSelected !== undefined && value.length >= maxSelected;

  const customStyles: StylesConfig<SelectOption<T>, true> = {
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
      backgroundColor: isDisabled ? '#f3f4f6' : '#fff',
      cursor: isDisabled ? 'not-allowed' : 'default',
      opacity: isDisabled ? 0.7 : 1,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#eff6ff',
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1d4ed8',
      fontSize: '13px',
      fontWeight: 500,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#60a5fa',
      '&:hover': {
        backgroundColor: '#bfdbfe',
        color: '#1d4ed8',
      },
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
      opacity: state.isDisabled ? 0.5 : 1,
    }),
    placeholder: (base) => ({ ...base, color: '#9ca3af', fontSize: '14px' }),
    menu: (base) => ({
      ...base,
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 9999,
    }),
    menuList: (base) => ({ ...base, padding: '4px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? '#3b82f6' : '#9ca3af',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0)',
      transition: 'transform 0.2s',
    }),
  };

  const handleChange = (selected: MultiValue<SelectOption<T>>) => {
    onChange?.([...selected] as SelectOption<T>[]);
  };

  return (
    <div>
      <ReactSelect<SelectOption<T>, true>
        inputId={inputId}
        isMulti
        options={isMaxReached
          ? options.map((o) => ({
              ...o,
              isDisabled: !value.some((v) => v.value === o.value),
            }))
          : options
        }
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        isLoading={isLoading}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        menuPlacement={menuPlacement}
        noOptionsMessage={() => noOptionsMessage}
        styles={customStyles}
        classNamePrefix="rs"
        closeMenuOnSelect={false}
      />
      {maxSelected && (
        <p className="text-xs text-gray-500 mt-1">
          {value.length}/{maxSelected} dipilih
        </p>
      )}
    </div>
  );
}
