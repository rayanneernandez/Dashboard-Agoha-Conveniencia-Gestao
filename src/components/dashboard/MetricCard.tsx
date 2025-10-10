import React from "react";

interface MetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  variant?: "total" | "success" | "danger" | "warning" | "info" | "purple";
  className?: string;
  trend?: "up" | "down"; // NOVO
}

const variantGradients: Record<string, string> = {
  total: "bg-gradient-total",
  success: "bg-gradient-success",
  danger: "bg-gradient-danger",
  warning: "bg-gradient-warning",
  info: "bg-gradient-info",
  purple: "bg-gradient-projecao",
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  variant = "total",
  className = "",
  trend,
}) => {
  const gradientClass = variantGradients[variant] || variantGradients.total;

  return (
    <div className={`p-4 rounded-xl shadow-card card-hover text-white ${gradientClass} ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="h-6 w-6 flex items-center">{icon}</div>
      </div>
      <div className="mt-2 flex items-center">
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <span className={`ml-2 ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      {description && <p className="text-sm opacity-80 mt-1">{description}</p>}
    </div>
  );
};

export default MetricCard;
