import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  variant?: "total" | "success" | "danger" | "warning" | "info" | "purple";
  className?: string; // <--- Permite passar classes externas
}

const variantGradients: Record<string, string> = {
  total: "bg-gradient-total",
  success: "bg-gradient-success",
  danger: "bg-gradient-danger",
  warning: "bg-gradient-warning",
  info: "bg-gradient-info",
  purple: "bg-gradient-projecao", // adicionando seu roxo personalizado
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  variant = "total",
  className = "",
}) => {
  const gradientClass = variantGradients[variant] || variantGradients.total;

  return (
    <div
      className={`p-4 rounded-xl shadow-card card-hover text-white ${gradientClass} ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
        {description && <p className="text-sm opacity-80">{description}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
