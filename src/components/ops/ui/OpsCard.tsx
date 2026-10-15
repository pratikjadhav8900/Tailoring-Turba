import React from "react";

interface OpsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export const OpsCard: React.FC<OpsCardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  padding = "md",
  className = "",
  ...props
}) => {
  const paddingClass = {
    none: "",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-7",
  }[padding];

  return (
    <div
      className={`bg-white border border-[#ECEEF2] rounded-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-sm sm:text-base font-bold text-[#111827] font-sans">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#9CA3AF] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={paddingClass}>{children}</div>
    </div>
  );
};
