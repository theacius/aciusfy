import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
  ...props
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute select-none",
        className
      )}
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${mainCircleSize + numCircles * 110}px`,
        height: `${mainCircleSize + numCircles * 110}px`,
      }}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 110;
        const opacity = mainCircleOpacity - i * 0.025;

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                opacity: Math.max(opacity, 0.06),
                borderStyle: "solid",
                borderWidth: "1px",
                borderColor: `rgba(124, 58, 237, ${0.5 - i * 0.03})`,
                background: `radial-gradient(circle, rgba(124, 58, 237, ${0.08 - i * 0.004}) 0%, transparent 70%)`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1)",
                animation: `ripple 3s ease calc(${i} * 0.2s) infinite`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";
