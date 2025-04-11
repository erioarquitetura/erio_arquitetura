import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransacaoFinanceira } from "@/types";
import { formatarMoeda, formatarData } from "@/lib/formatters";

export interface RecentTransactionsProps {
  transactions: TransacaoFinanceira[] | any[];
  isLoading?: boolean;
}

export const RecentTransactions = ({ transactions, isLoading = false }: RecentTransactionsProps) => {
  // Linhas de carregamento para o skeleton
  const skeletonRows = Array(5).fill(0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Estado de carregamento (skeleton)
                skeletonRows.map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Dados reais
                transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.descricao}
                  </TableCell>
                  <TableCell>{formatarData(transaction.data)}</TableCell>
                  <TableCell>{transaction.categoria}</TableCell>
                  <TableCell className={transaction.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.tipo === 'receita' ? '+' : '-'}
                    {formatarMoeda(transaction.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        transaction.status === 'pago'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : transaction.status === 'pendente'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }
                    >
                      {transaction.status === 'pago'
                        ? 'Pago'
                        : transaction.status === 'pendente'
                        ? 'Pendente'
                        : 'Cancelado'}
                    </Badge>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
