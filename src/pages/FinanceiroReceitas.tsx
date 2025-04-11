
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { formatarMoeda, formatarData } from '@/lib/formatters';
import { transacoesFinanceiras } from '@/data/mockData';
import { Plus, Eye, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FinanceiroReceitas = () => {
  // Filtrar apenas as receitas
  const receitas = transacoesFinanceiras.filter(
    transacao => transacao.tipo === 'receita'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'pendente':
        return 'Pendente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <PageLayout title="Receitas">
      <DataTable
        title="Gestão de Receitas"
        description="Controle e acompanhe todas as receitas do seu negócio"
        columns={[
          {
            key: "descricao",
            header: "Descrição",
            cell: (receita) => (
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                <span className="font-medium">{receita.descricao}</span>
              </div>
            ),
            width: "25%",
          },
          {
            key: "categoria",
            header: "Categoria",
            cell: (receita) => receita.categoria,
            width: "15%",
          },
          {
            key: "valor",
            header: "Valor",
            cell: (receita) => (
              <span className="font-medium text-green-600">{formatarMoeda(receita.valor)}</span>
            ),
            width: "15%",
          },
          {
            key: "data",
            header: "Data",
            cell: (receita) => formatarData(receita.data),
            width: "15%",
          },
          {
            key: "dataVencimento",
            header: "Vencimento",
            cell: (receita) => formatarData(receita.dataVencimento),
            width: "15%",
          },
          {
            key: "status",
            header: "Status",
            cell: (receita) => (
              <Badge
                variant="outline"
                className={getStatusColor(receita.status)}
              >
                {getStatusLabel(receita.status)}
              </Badge>
            ),
            width: "15%",
          },
          {
            key: "actions",
            header: "Ações",
            cell: (receita) => (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  title="Visualizar Receita"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Lógica para visualizar
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  title="Editar Receita"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Lógica para editar
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  title="Excluir Receita"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Lógica para excluir
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={receitas}
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Receita
          </Button>
        }
        onRowClick={(receita) => {
          // Lógica para visualizar detalhes da receita
        }}
      />
    </PageLayout>
  );
};

export default FinanceiroReceitas;
