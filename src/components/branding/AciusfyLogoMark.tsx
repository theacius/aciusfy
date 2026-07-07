"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ACIUSFY_LOGO_PNG,
  ACIUSFY_LOGO_FALLBACK_PNG,
} from "@/lib/branding";

type Props = {
  className?: string;
  imgClassName?: string;
  alt?: string;
  priority?: boolean;
  objectFit?: "contain" | "cover";
  /** No card background — logo uses natural bounding box over transparent context */
  presentation?: "default" | "bare";
};

export function AciusfyLogoMark({
  className,
  imgClassName,
  alt = "Aciusfy",
  priority,
  objectFit = "contain",
  presentation = "default",
}: Props) {
  const [src, setSrc] = useState<string>(ACIUSFY_LOGO_PNG);
  const bare = presentation === "bare";
  const cover = !bare && objectFit === "cover";
  const onError = useCallback(() => {
    setSrc((current) => (current === ACIUSFY_LOGO_PNG ? ACIUSFY_LOGO_FALLBACK_PNG : current));
  }, []);

  return (
    <span
      className={cn(
        bare
          ? "relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-none bg-transparent"
          : "relative inline-block shrink-0 overflow-hidden rounded-xl",
        !bare && cover
          ? "bg-black"
          : !bare
            ? "bg-black"
            : "",
        className,
      )}
    >
      <img
        key={src}
        src={src}
        alt={alt}
        onError={onError}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={cn(
          bare
            ? "relative mx-auto block h-auto max-h-[min(28vmin,9.5rem)] w-auto max-w-[min(92vw,22rem)] object-contain p-0 select-none sm:max-h-[min(34vmin,11rem)]"
            : "absolute inset-0 h-full w-full",
          !bare &&
            (cover ? "object-cover object-center" : "object-contain"),
          imgClassName,
        )}
        draggable={false}
      />
    </span>
  );
}
