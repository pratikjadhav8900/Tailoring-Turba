import React from "react";
import { Loader2 } from "lucide-react";

interface OpsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const OpsButton: React.FC<OpsButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/50 shadow-sm",
    secondary:
      "bg-[#1c202d] hover:bg-[#252b3d] text-slate-200 border border-[#2a3044]",
    danger:
      "bg-red-600/90 hover:bg-red-600 text-white border border-red-500/50",
    ghost:
      "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white",
    outline:
      "bg-transparent hover:bg-white/5 text-slate-200 border border-slate-700",
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
