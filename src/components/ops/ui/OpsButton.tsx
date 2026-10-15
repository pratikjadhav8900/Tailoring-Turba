import React from "react";
import { Loader2 } from "lucide-react";

interface OpsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "circle";
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
    "inline-flex items-center justify-center font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none font-sans";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5 rounded-full",
    md: "px-5 py-2.5 text-xs gap-2 rounded-full",
    lg: "px-6 py-3 text-sm gap-2.5 rounded-full",
  }[size];

  const variantStyles = {
    primary:
      "bg-[#00A86B] hover:bg-[#00925d] text-white shadow-md shadow-[#00A86B]/20 active:scale-98",
    secondary:
      "bg-[#F4F6F9] hover:bg-[#E5E8ED] text-[#111827] border border-[#ECEEF2]",
    danger:
      "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm",
    ghost:
      "bg-transparent hover:bg-[#F4F6F9] text-[#6B7280] hover:text-[#111827]",
    outline:
      "bg-white hover:bg-[#F9FAFB] text-[#111827] border border-[#ECEEF2] shadow-xs",
    circle:
      "w-9 h-9 p-0 rounded-full bg-[#F4F6F9] hover:bg-[#E5E8ED] text-[#4B5563] hover:text-[#111827]",
  }[variant];

  return (
    <button
      className={`${baseStyles} ${variant === "circle" ? variantStyles : `${sizeStyles} ${variantStyles}`} ${className}`}
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
