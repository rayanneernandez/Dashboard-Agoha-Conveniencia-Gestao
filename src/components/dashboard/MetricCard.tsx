import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  variant: 'total' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
}

const MetricCard = ({ title, value, description, icon: Icon, variant, className = "" }: MetricCardProps) => {
  const getCardClasses = () => {
    const baseClasses = "relative overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer border-0";
    
    switch (variant) {
      case 'total':
        return `${baseClasses} bg-gradient-total shadow-card`;
      case 'success':
        return `${baseClasses} bg-gradient-success shadow-success`;
      case 'danger':
        return `${baseClasses} bg-gradient-danger shadow-danger`;
      case 'warning':
        return `${baseClasses} bg-gradient-warning shadow-warning`;
      case 'info':
        return `${baseClasses} bg-gradient-info shadow-info`;
      default:
        return `${baseClasses} bg-gradient-total shadow-card`;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'total':
        return 'text-primary-foreground';
      case 'success':
        return 'text-success-foreground';
      case 'danger':
        return 'text-danger-foreground';
      case 'warning':
        return 'text-warning-foreground';
      case 'info':
        return 'text-info-foreground';
      default:
        return 'text-primary-foreground';
    }
  };

  return (
    <Card className={`${getCardClasses()} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${getTextColor()} opacity-90`}>
              {title}
            </p>
            <p className={`text-3xl font-bold ${getTextColor()}`}>
              {value}
            </p>
            <p className={`text-xs ${getTextColor()} opacity-75`}>
              {description}
            </p>
          </div>
          <div className={`${getTextColor()} opacity-20`}>
            <Icon className="h-12 w-12" />
          </div>
        </div>
        
        {/* Decorative gradient overlay */}
        <div className="absolute -top-4 -right-4 w-24 h-24 opacity-10 rounded-full bg-white blur-xl"></div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;