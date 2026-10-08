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
    sm: "p-3",
    md: "p-4.5",
    lg: "p-6",
  }[padding];

  return (
    <div
      className={`bg-[#10121a] border border-[#1e2230] rounded-lg shadow-sm ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-4.5 py-3 border-b border-[#1e2230] flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={paddingClass}>{children}</div>
    </div>
  );
};
