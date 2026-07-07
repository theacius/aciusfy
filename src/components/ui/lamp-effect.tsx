"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LampEffectProps {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "blue";
}

export function LampEffect({ children, className, tone = "default" }: LampEffectProps) {
  const blue = tone === "blue";
  return (
    <div
      className={cn(
        "relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden bg-transparent",
        className
      )}
    >
      <div className="relative flex w-full flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0.3, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible"
          style={{
            backgroundImage: blue
              ? "conic-gradient(from 70deg at center top, #3b82f6, transparent 40%)"
              : "conic-gradient(from 70deg at center top, #a855f7, transparent 40%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          }}
        >
          <div
            className="absolute bottom-0 left-0 z-20 h-40 w-full"
            style={{
              background: "transparent",
              maskImage: "linear-gradient(to top, white, transparent)",
              WebkitMaskImage: "linear-gradient(to top, white, transparent)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 z-20 h-full w-40"
            style={{
              background: "transparent",
              maskImage: "linear-gradient(to right, white, transparent)",
              WebkitMaskImage: "linear-gradient(to right, white, transparent)",
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0.3, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto left-1/2 h-56 overflow-visible"
          style={{
            backgroundImage: blue
              ? "conic-gradient(from 290deg at center top, transparent 60%, #3b82f6)"
              : "conic-gradient(from 290deg at center top, transparent 60%, #a855f7)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          }}
        >
          <div
            className="absolute bottom-0 right-0 z-20 h-full w-40"
            style={{
              background: "transparent",
              maskImage: "linear-gradient(to left, white, transparent)",
              WebkitMaskImage: "linear-gradient(to left, white, transparent)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 z-20 h-40 w-full"
            style={{
              background: "transparent",
              maskImage: "linear-gradient(to top, white, transparent)",
              WebkitMaskImage: "linear-gradient(to top, white, transparent)",
            }}
          />
        </motion.div>

        <div className="absolute top-1/2 h-48 w-full translate-y-12 bg-transparent blur-2xl" />

        <motion.div
          initial={{ width: "10rem", opacity: 0.3 }}
          whileInView={{ width: "20rem", opacity: 0.6 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute z-30 -translate-y-[6rem] rounded-full"
          style={{
            height: "10rem",
            background: blue
              ? "radial-gradient(ellipse at center, rgba(59,130,246,0.32) 0%, rgba(191,219,254,0.12) 40%, transparent 70%)"
              : "radial-gradient(ellipse at center, rgba(168,85,247,0.35) 0%, rgba(16,185,129,0.15) 40%, transparent 70%)",
            filter: "blur(30px)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)",
          }}
        />

        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute z-50 -translate-y-[7rem]"
          style={{
            height: "2px",
            background: blue
              ? "linear-gradient(90deg, transparent 0%, #3b82f6 30%, #e0f2fe 70%, transparent 100%)"
              : "linear-gradient(90deg, transparent 0%, #a855f7 30%, #10b981 70%, transparent 100%)",
            boxShadow: blue
              ? "0 0 15px rgba(59,130,246,0.4), 0 0 30px rgba(191,219,254,0.2)"
              : "0 0 15px rgba(168,85,247,0.4), 0 0 30px rgba(16,185,129,0.2)",
          }}
        />
      </div>

      <div className="relative z-50 -mt-32 flex flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
}
