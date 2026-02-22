import { cn } from '../../lib/utils';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  iconColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  className,
  iconColor = 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  subtitle,
  trend,
}: StatsCardProps) {
  return (
    <div className={cn('card p-6 transition-all hover:shadow-md dark:hover:shadow-none', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold">{value}</h3>
          
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-500">{subtitle}</p>
          )}
          
          {trend && (
            <div className="mt-2 flex items-center text-sm">
              {trend.direction === 'up' && (
                <span className="text-green-600 dark:text-green-400">
                  ↑ {trend.value}%
                </span>
              )}
              {trend.direction === 'down' && (
                <span className="text-red-600 dark:text-red-400">
                  ↓ {trend.value}%
                </span>
              )}
              {trend.direction === 'neutral' && (
                <span className="text-gray-500 dark:text-gray-400">
                  → {trend.value}%
                </span>
              )}
              <span className="ml-1 text-gray-500 dark:text-gray-400">progress</span>
            </div>
          )}
        </div>
        
        <div className={cn('rounded-full p-3', iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}