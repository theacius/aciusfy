import { cn } from "@/lib/utils";

type LandingSectionProps = {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
};

export function LandingSection({
  id,
  eyebrow,
  title,
  description,
  align = "center",
  children,
  className,
  headerClassName,
}: LandingSectionProps) {
  const centered = align === "center";

  return (
    <section id={id} className={cn("landing-section", className)}>
      <div className="landing-section-inner">
        <header
          className={cn(
            centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left",
            "mb-14 sm:mb-16",
            headerClassName,
          )}
        >
          {eyebrow ? <p className="landing-eyebrow">{eyebrow}</p> : null}
          <h2 className="landing-headline">{title}</h2>
          {description ? (
            <p className={cn("landing-subhead", centered && "mx-auto")}>{description}</p>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}
