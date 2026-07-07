"use client";

import type { ProfileTitlePublic } from "@/lib/profile-title-public";

type Props = {
  title: ProfileTitlePublic | null | undefined;
  className?: string;
};

export function ProfileTitleChip({ title, className = "" }: Props) {
  if (!title) return null;
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
      style={{
        color: title.textColor,
        backgroundColor: title.bgColor,
        borderColor: title.borderColor,
      }}
    >
      <span className="truncate">{title.name}</span>
    </span>
  );
}
