import {
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { MillerColumnsResizeHandleProps } from "../types";

import { useMillerColumnsContext } from "./useMillerColumnsContext";
import { useMillerColumnsColumnContext } from "./useMillerColumnsColumnContext";

type DragState = { startX: number; startWidth: number };

export function useMillerColumnsResizeHandle({
  onPointerDown,
  onKeyDown,
  minWidth = 0,
  maxWidth = Number.POSITIVE_INFINITY,
  step = 10,
  ...rest
}: MillerColumnsResizeHandleProps) {
  const { columnWidths, setColumnWidth, dir } = useMillerColumnsContext();
  const { depth } = useMillerColumnsColumnContext();

  const handleRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  // The column's rendered width before anything resizes it. Tracked so
  // `aria-valuenow` is truthful from the first render — a splitter whose
  // value only appears after the first drag announces nothing until then.
  const [measured, setMeasured] = useState(0);

  const clamp = (width: number) =>
    Math.min(maxWidth, Math.max(minWidth, width));

  // The resized width wins; otherwise the column is still sized by CSS.
  const width = columnWidths.get(depth) ?? measured;

  useLayoutEffect(() => {
    const column = handleRef.current?.closest<HTMLElement>(
      "[data-miller-columns-column]",
    );
    /* c8 ignore next 3 -- the handle only renders inside a Column, which
       context already enforces, so the ancestor is always present. */
    if (!column) {
      return;
    }
    const measure = () => setMeasured(column.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    return () => observer.disconnect();
  }, []);

  // A drag is tracked on `window`, not the handle, so the pointer can
  // travel anywhere once it is down; the listeners live only for the
  // lifetime of the drag.
  useEffect(() => {
    if (!drag) {
      return;
    }

    const activeDrag = drag;

    function handleMove(event: globalThis.PointerEvent) {
      const next = activeDrag.startWidth + event.clientX - activeDrag.startX;
      setColumnWidth(depth, Math.min(maxWidth, Math.max(minWidth, next)));
    }

    function endDrag() {
      setDrag(null);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [drag, depth, setColumnWidth, minWidth, maxWidth]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    onPointerDown?.(event);
    // The handle only renders inside a Column (enforced by context), so
    // its column ancestor is always present in the DOM. Once a column
    // has been resized its width is known; before that, measure it.
    const column = event.currentTarget.closest<HTMLElement>(
      "[data-miller-columns-column]",
    )!;
    const startWidth =
      columnWidths.get(depth) ?? column.getBoundingClientRect().width;
    setDrag({ startX: event.clientX, startWidth });
  }

  // The column extends towards the inline-end edge, which is leftwards
  // under rtl — so the key that widens it mirrors with the direction.
  const growKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const shrinkKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);

    const next = (() => {
      switch (event.key) {
        case growKey:
          return width + step;
        case shrinkKey:
          return width - step;
        case "Home":
          return minWidth;
        case "End":
          return maxWidth;
        default:
          return null;
      }
    })();

    if (next === null || !Number.isFinite(next)) {
      return;
    }

    event.preventDefault();
    setColumnWidth(depth, clamp(next));
  }

  return {
    handleProps: {
      ref: handleRef,
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      tabIndex: 0,
      "aria-valuenow": Math.round(width),
      "aria-valuemin": minWidth,
      ...(Number.isFinite(maxWidth) ? { "aria-valuemax": maxWidth } : {}),
      "data-miller-columns-resize-handle": "",
      ...(drag ? { "data-dragging": "" } : {}),
      onPointerDown: handlePointerDown,
      onKeyDown: handleKeyDown,
      ...rest,
    },
  };
}
