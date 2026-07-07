"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useListenTogetherStore } from "@/store/listenTogetherStore";
import { ListenTogetherModal } from "./ListenTogetherModal";

export function ListenTogetherButton() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const isActive = useListenTogetherStore((s) => s.isActive);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setModalOpen(true)}
        className={cn(
          "relative p-2 transition-colors hover:text-white",
          isActive ? "text-purple-400" : "text-white/30"
        )}
        title={t("listenTogether")}
      >
        <Radio className="h-4 w-4" />
        {isActive && (
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-purple-400 ring-2 ring-[#181818]" />
        )}
      </motion.button>

      <ListenTogetherModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
