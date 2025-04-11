import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { formatarMoeda } from "@/lib/formatters";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface CategoryDistributionProps {
  data: CategoryData[];
  title: string;
  isLoading?: boolean;
}

export const CategoryDistribution = ({ data, title, isLoading = false }: CategoryDistributionProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
          <p className="font-medium text-sm" style={{ color: payload[0].payload.color }}>
            {payload[0].name}
          </p>
          <p className="text-sm mt-1">
            {formatarMoeda(payload[0].value)} ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Calcular o valor total para obter as porcentagens
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  
  // Adicionar porcentagem aos dados
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: Math.round((item.value / total) * 100)
  }));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="h-64 animate-pulse flex items-center justify-center">
            <div className="space-y-4 w-full">
              <div className="flex justify-center">
                <div className="h-40 w-40 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="flex gap-2 justify-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry: any) => {
                  return (
                    <span style={{ color: entry.color, marginRight: 10 }}>
                      {value} ({entry.payload.percentage}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  );
};
