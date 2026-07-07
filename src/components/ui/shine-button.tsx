"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ShineButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  tone?: "default" | "blue"
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ShineButton({
  children,
  className,
  onClick,
  variant = "primary",
  tone = "default",
  size = "md",
  disabled = false,
  type = "button",
}: ShineButtonProps) {
  const isMobile = useIsMobile();
  const blue = tone === "blue";

  const sizeClasses = {
    sm: "px-5 py-2.5 text-sm gap-2",
    md: "px-7 py-3 text-base gap-2.5",
    lg: "px-9 py-4 text-lg gap-3",
  };

  const content = (
    <>
      {variant === "primary" && !isMobile && (
        <div className="absolute inset-0 z-0">
          <FloatingParticles
            particleCount={8}
            minSize={0.5}
            maxSize={1}
            speed={0.3}
            color="#ffffff"
            opacity={0.6}
          />
        </div>
      )}

      {variant === "primary" && !isMobile && (
        <motion.div
          className="absolute inset-0 z-[1] flex items-center justify-center overflow-hidden"
        >
          <motion.div
            className="absolute h-2 w-[calc(100%+2rem)]"
            style={{
              backgroundColor: "rgba(255,255,255,0.35)",
              filter: "blur(10px)",
              WebkitFilter: "blur(10px)",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
      )}

      {variant === "primary" && (
        <div
          className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={
            blue
              ? {
                  background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #93c5fd 100%)",
                  boxShadow: "0 0 35px rgba(37, 99, 235, 0.45), 0 0 50px rgba(255, 255, 255, 0.12)",
                }
              : {
                  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #10b981 100%)",
                  boxShadow: "0 0 35px rgba(168, 85, 247, 0.4), 0 0 60px rgba(16, 185, 129, 0.2)",
                }
          }
        />
      )}

      {variant === "secondary" && (
        <div
          className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={
            blue
              ? {
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(147, 197, 253, 0.45)",
                }
              : {
                  background: "rgba(168, 85, 247, 0.08)",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                }
          }
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </>
  );

  const commonProps = {
    onClick,
    disabled,
    className: cn(
      "group relative flex items-center justify-center overflow-hidden rounded-full font-semibold transition-all duration-300",
      sizeClasses[size],
      variant === "primary" && "text-white",
      variant === "secondary" && "text-white",
      disabled && "cursor-not-allowed opacity-50",
      className
    ),
    style: {
      background:
        variant === "primary"
          ? blue
            ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 42%, #3b82f6 100%)"
            : "linear-gradient(135deg, #6d28d9 0%, #a855f7 40%, #10b981 100%)"
          : "rgba(255, 255, 255, 0.04)",
      border:
        variant === "secondary"
          ? blue
            ? "1px solid rgba(96, 165, 250, 0.32)"
            : "1px solid rgba(168, 85, 247, 0.25)"
          : "none",
      boxShadow:
        variant === "primary"
          ? blue
            ? "0 0 22px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)"
            : "0 0 20px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
    },
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      {...commonProps}
    >
      {content}
    </motion.button>
  );
}
