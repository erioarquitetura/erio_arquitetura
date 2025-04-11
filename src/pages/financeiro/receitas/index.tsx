import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout } from '@/components/layout/PageLayout';
import { PlusCircle, Search, FileText, Pencil, Trash2, Eye, CalendarRange, CreditCard, Tag, User, Check, Clock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  listarReceitas, 
  excluirReceita, 
  calcularTotalItensPagos,
  calcularTotalItensPendentes,
  calcularTotalItensParciaisPagos
} from '@/services/receitaService';
import { Receita, ReceitaStatus } from '@/types/receita';
import { toast } from 'sonner';
import { ReceitaFormModal } from '@/components/receitas/ReceitaFormModal';
import { ReceitaViewerModal } from '@/components/receitas/ReceitaViewerModal';
import { PesquisaItensReceitaModal } from '@/components/receitas/PesquisaItensReceitaModal';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [receitaAtual, setReceitaAtual] = useState<Receita | null>(null);
  const [isPesquisaModalOpen, setIsPesquisaModalOpen] = useState(false);
  
  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    valorTotalReceitas: 0,
    quantidadeReceitas: 0,
    itensPagos: { valor: 0, quantidade: 0 },
    itensPendentes: { valor: 0, quantidade: 0 },
    itensParciaisPagos: { valor: 0, quantidade: 0 }
  });
  
  useEffect(() => {
    carregarReceitas();
    carregarEstatisticas();
  }, []);

  const carregarReceitas = async () => {
    setIsLoading(true);
    try {
      const data = await listarReceitas();
      setReceitas(data);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      toast.error('Falha ao carregar receitas');
    } finally {
      setIsLoading(false);
    }
  };
  
  const carregarEstatisticas = async () => {
    try {
      const [itensPagos, itensPendentes, itensParciaisPagos] = await Promise.all([
        calcularTotalItensPagos(),
        calcularTotalItensPendentes(),
        calcularTotalItensParciaisPagos()
      ]);
      
      const valorTotalReceitas = receitas.reduce((total, receita) => total + receita.valor_total, 0);
      
      setEstatisticas({
        valorTotalReceitas,
        quantidadeReceitas: receitas.length,
        itensPagos,
        itensPendentes,
        itensParciaisPagos
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleOpenFormModal = (receita?: Receita) => {
    setReceitaAtual(receita || null);
    setIsFormModalOpen(true);
  };

  const handleOpenViewerModal = (receita: Receita) => {
    console.log('Abrindo modal de visualização para receita:', receita);
    console.log('Receita tem itens?', receita.itens?.length);
    setReceitaAtual(receita);
    setIsViewerModalOpen(true);
  };

  const handleOpenDeleteDialog = (receita: Receita) => {
    setReceitaAtual(receita);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!receitaAtual) return;
    
    try {
      const sucesso = await excluirReceita(receitaAtual.id);
      if (sucesso) {
        toast.success('Receita excluída com sucesso');
        carregarReceitas();
        carregarEstatisticas();
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      toast.error('Falha ao excluir receita');
    }
  };

  const getStatusBadge = (status: ReceitaStatus) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">Pendente</Badge>;
      case 'pago_parcial':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">Pago Parcial</Badge>;
      case 'pago':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">Pago</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const receitasFiltradas = receitas.filter(receita => {
    // Filtro por texto
    const termoLower = filtro.toLowerCase();
    const matchesText = (
      (receita.proposta?.codigo?.toLowerCase().includes(termoLower) || false) ||
      (receita.cliente?.nome?.toLowerCase().includes(termoLower) || false) ||
      (receita.categoria?.nome?.toLowerCase().includes(termoLower) || false) ||
      (receita.descricao?.toLowerCase().includes(termoLower) || false)
    );
    
    // Filtro por período de data
    let matchesDate = true;
    
    if (dataInicio) {
      const dataInicioObj = parseISO(dataInicio);
      matchesDate = matchesDate && isAfter(new Date(receita.data_criacao || ''), dataInicioObj);
    }
    
    if (dataFim) {
      const dataFimObj = parseISO(dataFim);
      // Adicionar um dia ao dataFim para incluir receitas criadas no último dia do período
      dataFimObj.setDate(dataFimObj.getDate() + 1);
      matchesDate = matchesDate && isBefore(new Date(receita.data_criacao || ''), dataFimObj);
    }
    
    // Retorna true se ambos os filtros passarem
    return matchesText && matchesDate;
  });

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return '-';
    return format(new Date(dataIso), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Efeito para atualizar estatísticas quando as receitas mudarem
  useEffect(() => {
    carregarEstatisticas();
  }, [receitas]);

  // Efeito para limpar os filtros de data
  const limparFiltros = () => {
    setFiltro('');
    setDataInicio('');
    setDataFim('');
  };

  return (
    <PageLayout title="Receitas">
      <div className="container mx-auto py-6 px-4">
        {/* Cards com estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-sm border-erio-100">
            <CardContent className="p-4 flex items-center">
              <div className="bg-erio-50 p-3 rounded-full mr-4">
                <CreditCard className="h-6 w-6 text-erio-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Receitas</p>
                <p className="text-2xl font-bold text-gray-800">{formatarValor(estatisticas.valorTotalReceitas)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-green-100">
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-50 p-3 rounded-full mr-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Itens das Receitas Pagas</p>
                <p className="text-2xl font-bold text-gray-800">{formatarValor(estatisticas.itensPagos.valor)}</p>
                <p className="text-xs text-gray-500">{estatisticas.itensPagos.quantidade} itens</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-yellow-100">
            <CardContent className="p-4 flex items-center">
              <div className="bg-yellow-50 p-3 rounded-full mr-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Itens das Receitas Pendentes</p>
                <p className="text-2xl font-bold text-gray-800">{formatarValor(estatisticas.itensPendentes.valor)}</p>
                <p className="text-xs text-gray-500">
                  {estatisticas.itensPendentes.quantidade} pendentes, 
                  {estatisticas.itensParciaisPagos.quantidade} parciais
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-blue-100">
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-50 p-3 rounded-full mr-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-800">{estatisticas.quantidadeReceitas}</p>
                <p className="text-xs text-gray-500">receitas registradas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área de busca e filtragem */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar receitas..."
                className="pl-9"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Período</Label>
              <div className="flex flex-row items-center gap-3">
              <Input
                type="date"
                  placeholder="Data inicial"
                  className="w-36"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
                <span>até</span>
              <Input
                type="date"
                  placeholder="Data final"
                  className="w-36"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={limparFiltros} title="Limpar filtros">
                <X className="h-4 w-4" />
              </Button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setIsPesquisaModalOpen(true)}
            >
              <Search className="h-4 w-4" />
              Pesquisar Itens de Receita
            </Button>
            <Button onClick={() => handleOpenFormModal()} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Nova Receita
            </Button>
          </div>
        </div>

        <Card className="bg-white shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between bg-erio-50 border-b pb-4">
            <div>
              <CardTitle className="text-2xl font-bold text-erio-800">Receitas</CardTitle>
              <CardDescription className="text-erio-600">
                Gerencie as receitas do escritório
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-erio-600"></div>
                <span className="ml-3 text-lg text-gray-600">Carregando receitas...</span>
              </div>
            ) : (
              <div className="overflow-hidden rounded-b-md">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Código</TableHead>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Categoria</TableHead>
                      <TableHead className="font-semibold">Valor</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <FileText className="h-8 w-8 mb-2 text-gray-400" />
                            <p className="font-medium">Nenhuma receita encontrada</p>
                            <p className="text-sm">Tente ajustar o filtro ou crie uma nova receita</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      receitasFiltradas.map((receita) => (
                        <TableRow key={receita.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenViewerModal(receita)}>
                          <TableCell className="font-medium">
                            {receita.proposta?.codigo || '-'}
                          </TableCell>
                          <TableCell>{receita.cliente?.nome || '-'}</TableCell>
                          <TableCell>{receita.categoria?.nome || '-'}</TableCell>
                          <TableCell>{formatarValor(receita.valor_total)}</TableCell>
                          <TableCell>{getStatusBadge(receita.status)}</TableCell>
                          <TableCell>{formatarData(receita.data_criacao)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 border-gray-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenViewerModal(receita);
                                }}
                              >
                                <Eye className="h-4 w-4 text-gray-600" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 border-gray-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFormModal(receita);
                                }}
                              >
                                <Pencil className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 border-gray-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteDialog(receita);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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
      </div>

      {/* Modais */}
      <ReceitaFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        receita={receitaAtual}
        onReceitaSalva={carregarReceitas}
      />
      
      <ReceitaViewerModal
        isOpen={isViewerModalOpen}
        onOpenChange={setIsViewerModalOpen}
        receita={receitaAtual}
      />
      
      <PesquisaItensReceitaModal
        isOpen={isPesquisaModalOpen}
        onOpenChange={setIsPesquisaModalOpen}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Receita</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
} 