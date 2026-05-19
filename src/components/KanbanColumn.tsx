"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import type { EnumValue, Task } from "@/data/types";

interface KanbanColumnProps {
  option: EnumValue;
  items: Task[];
  children: ReactNode;
}

export default function KanbanColumn({ option, items, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: option.id });

  return (
    <section
      ref={setNodeRef}
      style={{
        borderRadius: 14,
        background: isOver
          ? "color-mix(in oklab, #181820 86%, #0A84FF 14%)"
          : "#181820",
        border: isOver
          ? "0.5px solid rgba(10,132,255,0.4)"
          : "0.5px solid rgba(255,255,255,0.07)",
        boxShadow: isOver
          ? "0 0 0 1px rgba(10,132,255,0.12)"
          : "none",
        display: "flex",
        flexDirection: "column",
        minHeight: 300,
        transition: "background 0.14s, border-color 0.14s, box-shadow 0.14s",
      }}
    >
      {/* Column header */}
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 14px 12px",
          borderBottom: "0.5px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              flexShrink: 0,
              background: option.color ?? "#52525b",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(235,235,238,0.7)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {option.label}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(235,235,238,0.3)",
            background: "rgba(255,255,255,0.05)",
            padding: "1px 7px",
            borderRadius: 999,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {items.length}
        </span>
      </header>

      {/* Card list */}
      <div
        style={{
          flex: "1 1 auto",
          overflowY: "auto",
          padding: "10px 10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent",
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              padding: "24px 8px",
              textAlign: "center",
              fontSize: 12,
              color: isOver ? "rgba(10,132,255,0.8)" : "rgba(255,255,255,0.18)",
              transition: "color 0.14s",
            }}
          >
            {isOver ? "Drop here" : "—"}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

