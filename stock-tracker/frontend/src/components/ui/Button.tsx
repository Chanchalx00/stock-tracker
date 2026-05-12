import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white          border-transparent",
  secondary:
    "bg-gray-800   hover:bg-gray-700   active:bg-gray-600   text-gray-200         border-transparent",
  danger:
    "bg-red-500    hover:bg-red-600    active:bg-red-700    text-white            border-transparent",
  ghost:
    "bg-transparent hover:bg-gray-800  active:bg-gray-700   text-gray-400 hover:text-white border-transparent",
  outline:
    "bg-transparent hover:bg-gray-800  active:bg-gray-700   text-gray-300         border-gray-700 hover:border-gray-500",
};

const sizeClasses: Record<Size, string> = {
  xs: "text-xs   px-2.5  py-1    rounded-lg  gap-1",
  sm: "text-xs   px-3    py-1.5  rounded-lg  gap-1.5",
  md: "text-sm   px-4    py-2.5  rounded-xl  gap-2",
  lg: "text-base px-6    py-3    rounded-xl  gap-2.5",
};

const spinnerSizeMap: Record<Size, "xs" | "sm" | "sm" | "md"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold border transition-colors duration-150 select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
          "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={spinnerSizeMap[size]} aria-hidden label="" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span aria-hidden="true" className="shrink-0">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span aria-hidden="true" className="shrink-0">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
