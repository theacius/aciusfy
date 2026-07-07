import { cn } from "@/lib/utils";

type StevenSurfaceCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
};

/** Steven zinc surface for page cards (radio, rewards, podcasts, etc.) */
export function StevenSurfaceCard({ children, className, hover = true }: StevenSurfaceCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm",
        hover && "transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]",
        className,
      )}
    >
      {children}
    </div>
  );
}
