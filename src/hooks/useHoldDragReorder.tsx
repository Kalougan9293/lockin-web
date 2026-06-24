"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

const HOLD_MS = 180;

export function reorderById<T>(
  items: T[],
  getId: (item: T) => string,
  fromId: string,
  toId: string,
): T[] {
  const fromIndex = items.findIndex((item) => getId(item) === fromId);
  const toIndex = items.findIndex((item) => getId(item) === toId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

type DragAxis = "x" | "y";

type DragPreviewState = {
  label: string;
  x: number;
  y: number;
  width?: number;
};

function findDropTarget(
  clientX: number,
  clientY: number,
  axis: DragAxis,
  excludeId: string,
) {
  const nodes = document.querySelectorAll<HTMLElement>("[data-drag-item-id]");
  let best: { id: string; distance: number } | null = null;

  for (const node of nodes) {
    const id = node.dataset.dragItemId;
    if (!id || id === excludeId) continue;

    const rect = node.getBoundingClientRect();
    const center =
      axis === "x" ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
    const pointer = axis === "x" ? clientX : clientY;
    const distance = Math.abs(pointer - center);

    if (!best || distance < best.distance) {
      best = { id, distance };
    }
  }

  return best?.id ?? null;
}

function DragPreviewPortal({ preview }: { preview: DragPreviewState }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full rounded-xl border border-violet-400/60 bg-brand-card/95 px-4 py-2.5 text-sm font-semibold text-violet-100 shadow-2xl shadow-violet-900/50 backdrop-blur-md"
      style={{
        left: preview.x,
        top: preview.y - 14,
        width: preview.width ? Math.min(preview.width, 220) : undefined,
        minWidth: "5rem",
      }}
    >
      <span className="block truncate text-center">{preview.label}</span>
    </div>,
    document.body,
  );
}

type UseHoldDragReorderOptions<T> = {
  items: T[];
  getId: (item: T) => string;
  getLabel?: (id: string) => string;
  onReorder: (items: T[]) => void;
  axis?: DragAxis;
};

export function useHoldDragReorder<T>({
  items,
  getId,
  getLabel,
  onReorder,
  axis = "y",
}: UseHoldDragReorderOptions<T>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DragPreviewState | null>(null);

  const itemsRef = useRef(items);
  const onReorderRef = useRef(onReorder);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  itemsRef.current = items;
  onReorderRef.current = onReorder;

  const bindItem = useCallback(
    (id: string) => {
      const isDragging = draggingId === id;
      const isOver = overId === id && draggingId !== null && draggingId !== id;

      return {
        "data-drag-item-id": id,
        className: [
          isDragging ? "z-10 opacity-35" : "",
          isOver ? "ring-2 ring-inset ring-violet-400/60" : "",
        ]
          .filter(Boolean)
          .join(" "),
      };
    },
    [draggingId, overId],
  );

  const bindHandle = useCallback(
    (id: string) => ({
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        if (event.button !== 0) return;

        event.preventDefault();

        let active = false;
        let holdTimer: number | null = null;

        lastPointerRef.current = { x: event.clientX, y: event.clientY };

        const source = event.currentTarget.closest<HTMLElement>(
          "[data-drag-item-id]",
        );
        const sourceRect = source?.getBoundingClientRect();
        const label = getLabel?.(id) ?? id;

        const activate = () => {
          active = true;
          setDraggingId(id);
          setOverId(id);
          setPreview({
            label,
            x: lastPointerRef.current.x,
            y: lastPointerRef.current.y,
            width: sourceRect?.width,
          });
          document.body.style.userSelect = "none";
          document.body.style.cursor = "grabbing";
        };

        const onMove = (moveEvent: PointerEvent) => {
          lastPointerRef.current = {
            x: moveEvent.clientX,
            y: moveEvent.clientY,
          };

          if (!active) return;

          setPreview({
            label,
            x: moveEvent.clientX,
            y: moveEvent.clientY,
            width: sourceRect?.width,
          });

          const targetId = findDropTarget(
            moveEvent.clientX,
            moveEvent.clientY,
            axis,
            id,
          );
          setOverId(targetId ?? id);
        };

        const onUp = (upEvent: PointerEvent) => {
          if (holdTimer !== null) {
            window.clearTimeout(holdTimer);
          }

          if (active) {
            const targetId = findDropTarget(
              upEvent.clientX,
              upEvent.clientY,
              axis,
              id,
            );

            if (targetId && targetId !== id) {
              onReorderRef.current(
                reorderById(itemsRef.current, getId, id, targetId),
              );
            }
          }

          active = false;
          setDraggingId(null);
          setOverId(null);
          setPreview(null);
          document.body.style.userSelect = "";
          document.body.style.cursor = "";

          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        };

        holdTimer = window.setTimeout(activate, HOLD_MS);

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      },
      className: "cursor-grab touch-none active:cursor-grabbing",
    }),
    [axis, getId, getLabel],
  );

  const DragPreview = preview ? <DragPreviewPortal preview={preview} /> : null;

  return { bindItem, bindHandle, draggingId, overId, DragPreview };
}
