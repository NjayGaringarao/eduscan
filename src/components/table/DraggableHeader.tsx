"use client";

import { useSortable } from "@dnd-kit/sortable";
import { Header, flexRender } from "@tanstack/react-table";
import clsx from "clsx";
import { CSS } from "@dnd-kit/utilities";
import { Move } from "lucide-react";
import { cn } from "@/utils/style";

/**
 * Standardized style constants — tweak these to change visual style globally
 */
const HEADER_TH = cn(
  "bg-textBody border",
  "text-center align-middle font-semibold text-sm uppercase tracking-wide text-background ",
  "p-3 sticky top-0 z-10 relative"
);
const HEADER_CONTENT =
  "flex items-center justify-center cursor-pointer select-none gap-2";
const DRAG_HANDLE =
  "absolute left-2 top-1 cursor-grab rounded-sm p-1 opacity-0 group-hover:opacity-100";
const RESIZE_HANDLE_BASE =
  "absolute top-0 right-0 h-full w-2 cursor-col-resize select-none touch-none transition-opacity opacity-0 group-hover:opacity-100";

const ICON_SIZE = "w-4 h-4";

const DraggableHeader = <T,>({ header }: { header: Header<T, unknown> }) => {
  const { setNodeRef, transform, transition, attributes, listeners } =
    useSortable({ id: header.column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: header.getSize(),
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      {...attributes}
      // group for hover behaviors on child elements
      className={clsx(HEADER_TH, "group")}
      role="columnheader"
      tabIndex={0}
    >
      {/* header content (sorting toggle) */}
      <div
        onClick={header.column.getToggleSortingHandler()}
        className={HEADER_CONTENT}
        aria-pressed={header.column.getIsSorted() ? true : false}
      >
        <span className="truncate max-w-[12rem]">
          {flexRender(header.column.columnDef.header, header.getContext())}
        </span>

        {header.column.getCanSort() && (
          <span className="text-uGrayLight text-xs">
            {{
              asc: "↑",
              desc: "↓",
            }[header.column.getIsSorted() as string] ?? "⇅"}
          </span>
        )}
      </div>

      {/* Drag handle: small, visually subtle until hover */}
      <div
        {...listeners}
        className={DRAG_HANDLE}
        title="Drag to reorder"
        aria-hidden
      >
        <Move className={clsx("text-background", ICON_SIZE)} />
      </div>

      {/* Resize handle */}
      {header.column.getCanResize() && (
        <div
          className={clsx(
            RESIZE_HANDLE_BASE,
            header.column.getIsResizing() ? "bg-background " : "bg-secondary/50"
          )}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          role="separator"
          aria-orientation="vertical"
        />
      )}
    </th>
  );
};

export default DraggableHeader;
