import { motion } from "framer-motion";
import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

const KpiCard = ({ title, value, icon, trend, delay = 0 }: KpiCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="neu-card flex items-center gap-4 hover:scale-105 transition-transform duration-300"
    >
      <div className="text-3xl text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && (
          <div className={`text-xs font-medium ${trend.isPositive ? 'text-accent' : 'text-destructive'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KpiCard;