"use client";

import { motion, type Transition } from "framer-motion";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

const EASE: Transition["ease"] = [0.16, 1, 0.3, 1];

export default function FadeIn({
  children,
  className,
  delay = 0,
  y = 12,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
