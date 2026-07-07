"use client";

import { motion, AnimatePresence } from "framer-motion";

type StevenAutocompletePanelProps = {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  empty?: React.ReactNode;
  isEmpty?: boolean;
};

export function StevenAutocompletePanel({
  open,
  children,
  className = "",
  empty,
  isEmpty,
}: StevenAutocompletePanelProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`premium-dropdown-panel absolute top-full left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto p-1 ${className}`}
        >
          {isEmpty && empty ? empty : children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
