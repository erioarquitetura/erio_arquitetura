import { useState, useEffect } from 'react';
import { PlusCircle, Search, FileText, Pencil, Trash2, Eye, Calendar, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { PageLayout } from '@/components/layout/PageLayout';
import { toast } from 'sonner';
import { DespesaFormModal } from '@/components/despesas/DespesaFormModal';
import { DespesaPesquisaModal } from '@/components/despesas/DespesaPesquisaModal';
import { Despesa } from '@/types/despesa';
import { listarDespesas, excluirDespesa } from '@/services/despesaService';
import { formatarMoeda } from '@/lib/format';
import { format, isAfter, isBefore, isEqual, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExcluindoDialogOpen, setIsExcluindoDialogOpen] = useState(false);
  const [isPesquisaAvancadaOpen, setIsPesquisaAvancadaOpen] = useState(false);
  const [despesaAtual, setDespesaAtual] = useState<Despesa | null>(null);
  const [filtro, setFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [isPeriodoAberto, setIsPeriodoAberto] = useState(false);

  useEffect(() => {
    carregarDespesas();
  }, []);

  const carregarDespesas = async () => {
    setIsLoading(true);
    try {
      const data = await listarDespesas();
      setDespesas(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      toast.error('Falha ao carregar despesas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFormModal = (despesa?: Despesa) => {
    setDespesaAtual(despesa || null);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (despesa: Despesa) => {
    setDespesaAtual(despesa);
    setIsExcluindoDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!despesaAtual) return;
    
    try {
      await excluirDespesa(despesaAtual.id);
      toast.success('Despesa excluída com sucesso!');
      setIsExcluindoDialogOpen(false);
      carregarDespesas();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast.error('Falha ao excluir despesa');
    }
  };

  const limparFiltroData = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
    setIsPeriodoAberto(false);
  };

  const aplicarFiltroData = () => {
    setIsPeriodoAberto(false);
  };

  const estaDentroDoPeriodo = (data: string): boolean => {
    if (!dataInicio && !dataFim) return true;
    
    const dataLancamento = parseISO(data);
    
    if (dataInicio && dataFim) {
      return (
        (isAfter(dataLancamento, startOfDay(dataInicio)) || isEqual(dataLancamento, startOfDay(dataInicio))) &&
        (isBefore(dataLancamento, endOfDay(dataFim)) || isEqual(dataLancamento, endOfDay(dataFim)))
      );
    }
    
    if (dataInicio && !dataFim) {
      return isAfter(dataLancamento, startOfDay(dataInicio)) || isEqual(dataLancamento, startOfDay(dataInicio));
    }
    
    if (!dataInicio && dataFim) {
      return isBefore(dataLancamento, endOfDay(dataFim)) || isEqual(dataLancamento, endOfDay(dataFim));
    }
    
    return true;
  };

  const despesasFiltradas = despesas.filter(despesa => (
    (
      despesa.descricao.toLowerCase().includes(filtro.toLowerCase()) || 
      (despesa.banco?.nome && despesa.banco.nome.toLowerCase().includes(filtro.toLowerCase())) ||
      (despesa.categoria?.nome && despesa.categoria.nome.toLowerCase().includes(filtro.toLowerCase()))
    ) &&
    estaDentroDoPeriodo(despesa.data_lancamento)
  ));

  const totalDespesas = despesasFiltradas.reduce((total, despesa) => total + despesa.valor, 0);
  const totalPendente = despesasFiltradas
    .filter(despesa => despesa.status_pagamento === 'pendente')
    .reduce((total, despesa) => total + despesa.valor, 0);
  const totalPago = despesasFiltradas
    .filter(despesa => despesa.status_pagamento === 'pago')
    .reduce((total, despesa) => total + despesa.valor, 0);

  return (
    <PageLayout title="Despesas">
      <div className="container mx-auto py-6">
        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="bg-white hover:bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {formatarMoeda(totalDespesas)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white hover:bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {formatarMoeda(totalPago)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white hover:bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {formatarMoeda(totalPendente)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Despesas</CardTitle>
              <CardDescription>
                Gerencie todas as suas despesas
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenFormModal()} className="bg-erio-500 hover:bg-erio-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row mb-4 justify-between">
              <div className="w-full md:w-1/2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Filtrar despesas..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full pl-9"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 flex flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPesquisaAvancadaOpen(true)}
                  className="flex-none"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Pesquisa Avançada
                </Button>
                <Popover open={isPeriodoAberto} onOpenChange={setIsPeriodoAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left w-full",
                        (dataInicio || dataFim) && "text-erio-500 border-erio-500"
                      )}
                    >
                      <CalendarRange className="mr-2 h-4 w-4" />
                      {dataInicio && dataFim
                        ? `${format(dataInicio, "dd/MM/yyyy", { locale: ptBR })} - ${format(dataFim, "dd/MM/yyyy", { locale: ptBR })}`
                        : dataInicio
                        ? `A partir de ${format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}`
                        : dataFim
                        ? `Até ${format(dataFim, "dd/MM/yyyy", { locale: ptBR })}`
                        : "Filtrar por período"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="start">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Data Inicial</div>
                          {dataInicio && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => setDataInicio(undefined)}
                            >
                              Limpar
                            </Button>
                          )}
                        </div>
                        <CalendarComponent
                          mode="single"
                          selected={dataInicio}
                          onSelect={setDataInicio}
                          initialFocus
                          disabled={(date) => dataFim ? isAfter(date, dataFim) : false}
                          locale={ptBR}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Data Final</div>
                          {dataFim && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => setDataFim(undefined)}
                            >
                              Limpar
                            </Button>
                          )}
                        </div>
                        <CalendarComponent
                          mode="single"
                          selected={dataFim}
                          onSelect={setDataFim}
                          initialFocus
                          disabled={(date) => dataInicio ? isBefore(date, dataInicio) : false}
                          locale={ptBR}
                        />
                      </div>
                      <div className="col-span-2 flex justify-between mt-2">
                        <Button variant="outline" onClick={limparFiltroData}>
                          Limpar Filtros
                        </Button>
                        <Button onClick={aplicarFiltroData}>
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-erio-500"></div>
                <span className="ml-2">Carregando...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Nenhuma despesa encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      despesasFiltradas.map((despesa) => (
                        <TableRow key={despesa.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            {new Date(despesa.data_lancamento).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {despesa.banco?.nome || '-'}
                            <span className="text-xs text-gray-500 block">
                              {despesa.banco?.tipo_favorecido === 'cnpj' ? 'PJ' : 'PF'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {despesa.categoria?.nome || '-'}
                            <div className="flex gap-1 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${despesa.categoria?.despesa_fixa ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                {despesa.categoria?.despesa_fixa ? 'Fixa' : 'Variável'}
                              </span>
                              {despesa.categoria?.despesa_fiscal && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                  Fiscal
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {despesa.descricao}
                          </TableCell>
                          <TableCell className="font-medium text-red-500">
                            {formatarMoeda(despesa.valor)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              despesa.status_pagamento === 'pago' 
                                ? 'bg-green-100 text-green-700' 
                                : despesa.status_pagamento === 'pendente'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {despesa.status_pagamento === 'pago' 
                                ? 'Pago' 
                                : despesa.status_pagamento === 'pendente'
                                ? 'Pendente'
                                : 'Cancelado'
                              }
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFormModal(despesa);
                                }}
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteModal(despesa);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de pesquisa avançada */}
        <DespesaPesquisaModal
          isOpen={isPesquisaAvancadaOpen}
          onOpenChange={setIsPesquisaAvancadaOpen}
        />

        {/* Modal de criação/edição de despesa */}
        <DespesaFormModal 
          open={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          despesa={despesaAtual}
          onSuccess={carregarDespesas}
        />

        {/* Modal de confirmação de exclusão */}
        <Dialog open={isExcluindoDialogOpen} onOpenChange={setIsExcluindoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Despesa</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setIsExcluindoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
} 