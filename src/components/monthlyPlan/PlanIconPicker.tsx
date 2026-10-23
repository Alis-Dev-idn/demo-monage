import { IconPicker } from "@/components/categories/IconPicker";

interface PlanIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  maxHeightClass?: string;
}

/**
 * Thin alias di atas {@link IconPicker} — tetap diekspos sebagai komponen
 * sendiri supaya monthly plan boleh punya perilaku khusus nanti (mis. tab
 * default berbeda, atau sub-set icon yang lebih kontekstual).
 *
 * Saat ini delegate ke IconPicker default — sama library, sama UX.
 */
export function PlanIconPicker({
  value,
  onChange,
  maxHeightClass,
}: PlanIconPickerProps) {
  return (
    <IconPicker
      value={value}
      onChange={onChange}
      maxHeightClass={maxHeightClass}
    />
  );
}
