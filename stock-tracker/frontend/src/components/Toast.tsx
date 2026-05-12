"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { IconSuccess, IconError, IconInfo, IconClose } from "@/lib/icons";
import type { LucideIcon } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
}

const toastConfig: Record<
  ToastType,
  { classes: string; Icon: LucideIcon; iconClass: string }
> = {
  success: {
    classes: "border-emerald-500/30",
    Icon: IconSuccess,
    iconClass: "text-emerald-400",
  },
  error: {
    classes: "border-red-500/30",
    Icon: IconError,
    iconClass: "text-red-400",
  },
  info: {
    classes: "border-blue-500/30",
    Icon: IconInfo,
    iconClass: "text-blue-400",
  },
};

export default function Toast({
  message,
  type = "success",
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!!message);
  }, [message]);

  if (!message) return null;

  const { classes, Icon, iconClass } = toastConfig[type];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2.5",
        "px-4 py-2.5 rounded-full border shadow-2xl text-sm font-medium",
        "bg-gray-900 text-white",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        classes,
      )}
    >
      <Icon
        size={15}
        aria-hidden="true"
        className={cn("shrink-0", iconClass)}
      />
      <span>{message}</span>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className="ml-1 text-gray-500 hover:text-gray-300 transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500"
        >
          <IconClose size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
