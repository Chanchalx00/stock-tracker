import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;

  success?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      success,
      className,
      id: providedId,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const id = providedId ?? autoId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-gray-400">
            {label}
            {required && (
              <span aria-hidden="true" className="text-red-400 ml-0.5">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <span
            
              className="absolute left-3 text-gray-500 pointer-events-none"
            >
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-required={required}
            aria-disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
              undefined
            }
            className={cn(
              "w-full bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-600",
              "transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950",
              "disabled:opacity-40 disabled:cursor-not-allowed",

              leftAddon ? "pl-9" : "pl-3",
              rightAddon ? "pr-9" : "pr-3",
              "py-2.5",

              error
                ? "border-red-500/60   focus-visible:ring-red-500"
                : success
                  ? "border-emerald-500/60"
                  : "border-gray-700 hover:border-gray-600",
              className,
            )}
            {...props}
          />

          {rightAddon && (
            <span
              
              className="absolute right-3 text-gray-500 pointer-events-none"
            >
              {rightAddon}
            </span>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
