import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  isLoading?: boolean;
  trend?: number;
  trendText?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  isLoading = false,
  trend,
  trendText
}: StatCardProps) => {
  const isTrendPositive = trend && trend > 0;
  const isTrendNegative = trend && trend < 0;
  const trendColor = isTrendPositive 
    ? 'text-green-600' 
    : isTrendNegative 
      ? 'text-red-600' 
      : 'text-gray-600';
  
  const trendBgColor = isTrendPositive 
    ? 'bg-green-100' 
    : isTrendNegative 
      ? 'bg-red-100' 
      : 'bg-gray-100';

  // Animação do contador
  const variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const trendVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        delay: 0.3
      } 
    }
  };

  return (
    <motion.div
      whileHover={{ 
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        y: -5, 
        transition: { duration: 0.2 } 
      }}
      initial="hidden"
      animate="visible"
      variants={variants}
    >
      <Card className="h-full border-l-4 border-erio-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </CardTitle>
          <div className="bg-erio-100 p-2 rounded-full text-erio-700">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              {trend !== undefined && <Skeleton className="h-4 w-20" />}
            </div>
          ) : (
            <div className="space-y-1">
              <motion.h2 
                className="text-2xl font-bold text-gray-800 dark:text-gray-100"
                variants={variants}
              >
                {value}
              </motion.h2>
              
              {trend !== undefined && (
                <motion.div 
                  className="flex items-center gap-1"
                  variants={trendVariants}
                >
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${trendBgColor} ${trendColor}`}>
                    {isTrendPositive ? (
                      <ArrowUpIcon className="h-3 w-3" />
                    ) : isTrendNegative ? (
                      <ArrowDownIcon className="h-3 w-3" />
                    ) : null}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                  </div>
                  {trendText && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {trendText}
                    </span>
                  )}
                </motion.div>
              )}
            </div>
          )}
      </CardContent>
    </Card>
    </motion.div>
  );
};
