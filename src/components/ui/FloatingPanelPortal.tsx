"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  children: ReactNode;
  align?: "right" | "left";
  offsetY?: number;
  className?: string;
};

export function FloatingPanelPortal({
  anchorRef,
  open,
  children,
  align = "right",
  offsetY = 8,
  className = "",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + offsetY,
        ...(align === "right"
          ? { right: Math.max(8, window.innerWidth - rect.right) }
          : { left: Math.max(8, rect.left) }),
        zIndex: "var(--z-dropdown)",
        visibility: "visible",
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, align, offsetY]);

  if (!mounted || !open) return null;

  return createPortal(
    <div style={style} className={className}>
      {children}
    </div>,
    document.body
  );
}
