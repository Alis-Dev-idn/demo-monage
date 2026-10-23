import { resolveIcon } from "@/constants/iconRegistry";
import { IconChip } from "@dep/ui/card";
import { TO_LIB_TONE } from "@/constants/tones";
import { DraggableGrid } from "./DraggableGrid";
import { CategoryAddButton } from "./CategoryTypeTabs";
import type { Category } from "@/types";

interface CategoryGridProps {
  categories: Category[];
  selectedId?: string | null;
  mode?: "select" | "manage";
  onSelect?: (category: Category) => void;
  onReorder?: (categories: Category[]) => void;
  onAdd?: () => void;
  className?: string;
}

export function CategoryGrid({
  categories,
  selectedId,
  mode = "select",
  onSelect,
  onReorder,
  onAdd,
  className = "",
}: CategoryGridProps) {
  const renderTile = (category: Category, dragging: boolean) => {
    const Icon = resolveIcon(category.icon, "Tag");
    const isSelected = selectedId === category._id;
    return (
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect?.(category)}
        disabled={dragging}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl border bg-white p-4 transition ${
          isSelected
            ? "border-emerald-500 ring-2 ring-emerald-100"
            : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
        }`}
      >
        <IconChip tone={TO_LIB_TONE[category.tone]} size="md">
          <Icon size={18} aria-hidden />
        </IconChip>
        <span className="line-clamp-2 text-center text-xs font-medium text-neutral-700">
          {category.name}
        </span>
      </button>
    );
  };

  return (
    <div className={`grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 ${className}`}>
      {mode === "manage" && onReorder ? (
        <DraggableGrid
          items={categories}
          onReorder={onReorder}
          renderItem={renderTile}
          className="contents"
        />
      ) : (
        categories.map((cat) => <div key={cat._id}>{renderTile(cat, false)}</div>)
      )}
      {mode === "manage" && onAdd && <CategoryAddButton onClick={onAdd} />}
    </div>
  );
}
