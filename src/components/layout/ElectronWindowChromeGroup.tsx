"use client";

import { cn } from "@/lib/utils";
import { useIsAciusfyDesktop } from "@/hooks/useIsAciusfyDesktop";
import { DesktopWindowControls } from "@/components/layout/DesktopWindowControls";

type Props = {
  className?: string;
  withLeftBorder?: boolean
};

export function ElectronWindowChromeGroup({ className, withLeftBorder = true }: Props) {
  const isDesktop = useIsAciusfyDesktop();
  if (!isDesktop) return null;
  return (
    <div
      className={cn(
        "aciusfy-electron-chrome flex shrink-0 items-stretch",
        withLeftBorder && "border-l border-white/10 pl-1.5 sm:pl-2",
        className,
      )}
    >
      <DesktopWindowControls className="ml-0" />
    </div>
  );
}
