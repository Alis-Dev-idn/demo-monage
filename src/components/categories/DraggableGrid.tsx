import { useState, type ReactNode } from "react";

interface DraggableItem {
  _id: string;
}

interface DraggableGridProps<T extends DraggableItem> {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T, dragging: boolean) => ReactNode;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
}

export function DraggableGrid<T extends DraggableItem>({
  items,
  onReorder,
  renderItem,
  className = "",
  itemClassName = "",
  disabled,
}: DraggableGridProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = (id: string) => () => {
    if (disabled) return;
    setDragId(id);
  };

  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    if (disabled || !dragId) return;
    e.preventDefault();
    setOverId(id);
  };

  const handleDrop = (overTargetId: string) => (e: React.DragEvent) => {
    if (disabled || !dragId) return;
    e.preventDefault();
    const fromId = dragId;
    setDragId(null);
    setOverId(null);
    if (fromId === overTargetId) return;

    const fromIdx = items.findIndex((i) => i._id === fromId);
    const toIdx = items.findIndex((i) => i._id === overTargetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <div className={className}>
      {items.map((item) => {
        const isOver = overId === item._id;
        const isDragging = dragId === item._id;
        return (
          <div
            key={item._id}
            draggable={!disabled}
            onDragStart={handleDragStart(item._id)}
            onDragOver={handleDragOver(item._id)}
            onDrop={handleDrop(item._id)}
            onDragEnd={handleDragEnd}
            className={`${itemClassName} transition ${
              isOver ? "ring-2 ring-emerald-400 ring-offset-2" : ""
            } ${isDragging ? "opacity-50" : ""}`}
          >
            {renderItem(item, isDragging)}
          </div>
        );
      })}
    </div>
  );
}
