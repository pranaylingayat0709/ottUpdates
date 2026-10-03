"use client";
import { motion } from "framer-motion";
import { Clapperboard } from "lucide-react";

// A signature loading mark — the same clapperboard glyph as the header
// logo, gently pulsing/rotating — used in place of a plain skeleton block
// wherever a loading state should feel branded rather than generic.
export function BrandedLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30"
        animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Clapperboard className="h-6 w-6 text-white" />
      </motion.div>
    </div>
  );
}
