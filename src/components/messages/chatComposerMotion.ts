import type { Transition } from "framer-motion";

export const CHAT_COMPOSER_SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 26,
};

export function chatComposerMotionProps(
  disabled: boolean,
  variant: "ghost" | "primary"
): {
  whileHover: { scale: number; boxShadow: string } | undefined;
  whileTap: { scale: number } | undefined;
  transition: Transition;
} {
  if (disabled) {
    return { whileHover: undefined, whileTap: undefined, transition: CHAT_COMPOSER_SPRING };
  }
  if (variant === "ghost") {
    return {
      whileHover: { scale: 1.07, boxShadow: "0 0 20px rgba(34, 197, 94, 0.18)" },
      whileTap: { scale: 0.92 },
      transition: CHAT_COMPOSER_SPRING,
    };
  }
  return {
    whileHover: { scale: 1.06, boxShadow: "0 0 24px rgba(34, 197, 94, 0.38)" },
    whileTap: { scale: 0.92 },
    transition: CHAT_COMPOSER_SPRING,
  };
}
