"use client";

import { StevenActionMenu, type StevenActionItem } from "@/components/navigation/StevenActionMenu";

export type StevenMenuItem = StevenActionItem;

type StevenFullScreenMenuProps = {
  open: boolean;
  onClose: () => void;
  items: StevenMenuItem[];
  footer?: React.ReactNode;
  title?: string;
  subtitle?: string;
};

/** @deprecated use StevenActionMenu — kept for landing nav compatibility */
export function StevenFullScreenMenu({
  open,
  onClose,
  items,
  footer,
  title = "Menu",
  subtitle,
}: StevenFullScreenMenuProps) {
  return (
    <StevenActionMenu
      open={open}
      onClose={onClose}
      items={items}
      footer={footer}
      title={title}
      subtitle={subtitle}
    />
  );
}
