import { useState, useEffect } from 'react';
import { listarNotasFiscais, excluirNotaFiscal } from '@/services/notaFiscalService';
import { NotaFiscal } from '@/types/notaFiscal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Search, 
  PlusCircle,
  FileOutput,
  Pencil,
  AlertCircle,
  ArrowDownUp,
  LoaderCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { NotaFiscalFormModal } from '@/components/notas-fiscais/NotaFiscalFormModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from '@/components/ui/card';

export default function NotasFiscaisPage() {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [notasFiltradas, setNotasFiltradas] = useState<NotaFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notaParaExcluir, setNotaParaExcluir] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<'data_emissao' | 'valor'>('data_emissao');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

  // Carregar notas fiscais
  const carregarNotasFiscais = async () => {
    setIsLoading(true);
    try {
      const dados = await listarNotasFiscais();
      console.log('Notas fiscais carregadas do Supabase:', dados);
      setNotas(dados);
      setNotasFiltradas(dados);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
      toast.error('Falha ao carregar notas fiscais');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarNotasFiscais();
  }, []);

  // Filtrar notas fiscais
  useEffect(() => {
    if (!searchTerm.trim()) {
      setNotasFiltradas([...notas]);
      return;
    }

    const termLower = searchTerm.toLowerCase();
    const filtradas = notas.filter(
      (nota) =>
        nota.numero_nota?.toLowerCase().includes(termLower) ||
        nota.cliente_nome?.toLowerCase().includes(termLower) ||
        nota.proposta_codigo?.toLowerCase().includes(termLower)
    );
    setNotasFiltradas(filtradas);
  }, [searchTerm, notas]);

  // Ordenar notas fiscais
  useEffect(() => {
    const sortedNotas = [...notasFiltradas].sort((a, b) => {
      if (orderBy === 'data_emissao') {
        const dateA = new Date(a.data_emissao).getTime();
        const dateB = new Date(b.data_emissao).getTime();
        return orderDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return orderDirection === 'asc' ? a.valor - b.valor : b.valor - a.valor;
      }
    });
    setNotasFiltradas(sortedNotas);
  }, [orderBy, orderDirection, notas]);

  // Funções de ação
  const handleViewNota = (nota: NotaFiscal) => {
    setNotaSelecionada(nota);
    setIsFormModalOpen(true);
  };

  const handleEditNota = (nota: NotaFiscal, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotaSelecionada(nota);
    setIsFormModalOpen(true);
  };

  const handleCreateNota = () => {
    setNotaSelecionada(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteNota = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotaParaExcluir(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteNota = async () => {
    if (!notaParaExcluir) return;

    try {
      const success = await excluirNotaFiscal(notaParaExcluir);
      if (success) {
        toast.success('Nota fiscal excluída com sucesso');
        setNotas(notas.filter(nota => nota.id !== notaParaExcluir));
        setNotasFiltradas(notasFiltradas.filter(nota => nota.id !== notaParaExcluir));
      }
    } catch (error) {
      console.error('Erro ao excluir nota fiscal:', error);
      toast.error('Falha ao excluir nota fiscal');
    } finally {
      setIsDeleteDialogOpen(false);
      setNotaParaExcluir(null);
    }
  };

  // Alternar ordenação
  const toggleSort = (field: 'data_emissao' | 'valor') => {
    if (orderBy === field) {
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrderDirection('desc');
    }
  };

  // Formatar valor para exibição
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Calcular valor aproximado de impostos (exemplo: 15% do valor)
  const calcularImpostos = (valor: number, taxa: number) => {
    return valor * (taxa / 100);
  };

  // Calcular total das notas fiscais
  const calcularTotal = () => {
    return notas.reduce((acc, nota) => {
      const valor = typeof nota.valor === 'number' 
        ? nota.valor 
        : parseFloat(String(nota.valor)) || 0;
      return acc + valor;
    }, 0);
  };

  // Calcular total de impostos
  const calcularTotalImpostos = () => {
    return notas.reduce((acc, nota) => {
      const valor = typeof nota.valor === 'number' 
        ? nota.valor 
        : parseFloat(String(nota.valor)) || 0;
      const taxa = typeof nota.taxa_imposto === 'number' 
        ? nota.taxa_imposto 
        : parseFloat(String(nota.taxa_imposto)) || 0;
      return acc + calcularImpostos(valor, taxa);
    }, 0);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Notas Fiscais Emitidas
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie todas as notas fiscais emitidas para seus clientes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[300px] border-gray-300 focus:border-erio-500 focus:ring-erio-500"
              />
            </div>
            <Button 
              variant="default" 
              className="bg-erio-600 hover:bg-erio-700 text-white"
              onClick={handleCreateNota}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Nota
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Notas</p>
                <h3 className="text-2xl font-bold text-gray-800">{notas.length}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Total</p>
                <h3 className="text-2xl font-bold text-gray-800">{formatarValor(calcularTotal())}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Impostos Estimados</p>
                <h3 className="text-2xl font-bold text-gray-800">{formatarValor(calcularTotalImpostos())}</h3>
              </div>
            </div>
          </Card>
        </div>

        <Separator />

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Número</TableHead>
                <TableHead className="w-[250px]">Cliente</TableHead>
                <TableHead 
                  className="w-[150px] cursor-pointer"
                  onClick={() => toggleSort('data_emissao')}
                >
                  <div className="flex items-center">
                    Data de Emissão
                    {orderBy === 'data_emissao' && (
                      <ArrowDownUp className={`ml-1 h-4 w-4 ${orderDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[150px] cursor-pointer"
                  onClick={() => toggleSort('valor')}
                >
                  <div className="flex items-center">
                    Valor
                    {orderBy === 'valor' && (
                      <ArrowDownUp className={`ml-1 h-4 w-4 ${orderDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">Taxa de Imposto</TableHead>
                <TableHead className="w-[150px]">Impostos</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col justify-center items-center text-gray-500">
                      <LoaderCircle className="animate-spin h-8 w-8 text-erio-500 mb-2" />
                      <p>Carregando notas fiscais...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : notasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileOutput className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-lg font-medium">Nenhuma nota fiscal encontrada</p>
                      <p className="text-sm">
                        {searchTerm 
                          ? 'Tente ajustar sua pesquisa ou limpar o filtro' 
                          : 'Clique em "Nova Nota" para emitir uma nota fiscal'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                notasFiltradas.map((nota) => (
                  <TableRow key={nota.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                    <TableCell 
                      className="font-medium flex items-center gap-2"
                      onClick={() => handleViewNota(nota)}
                    >
                      <FileText className="h-4 w-4 text-erio-500" />
                      {nota.numero_nota}
                    </TableCell>
                    <TableCell onClick={() => handleViewNota(nota)}>
                      {nota.cliente_nome || '-'}
                    </TableCell>
                    <TableCell onClick={() => handleViewNota(nota)}>
                      {format(new Date(nota.data_emissao), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell onClick={() => handleViewNota(nota)} className="font-medium text-green-600">
                      {formatarValor(nota.valor)}
                    </TableCell>
                    <TableCell onClick={() => handleViewNota(nota)} className="text-gray-600">
                      {nota.taxa_imposto}%
                    </TableCell>
                    <TableCell onClick={() => handleViewNota(nota)} className="text-gray-500">
                      {formatarValor(calcularImpostos(nota.valor, nota.taxa_imposto))}
                    </TableCell>
                    <TableCell onClick={() => handleViewNota(nota)}>
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 border-green-200 text-green-700 font-medium"
                      >
                        Concluída
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewNota(nota)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-erio-500 hover:bg-erio-50 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Visualizar</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => handleEditNota(nota, e)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-600 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Baixar PDF</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => handleDeleteNota(nota.id, e)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
            <div>
              Mostrando {notasFiltradas.length} de {notas.length} registros
            </div>
            <div>
              Página 1 de 1
            </div>
          </div>
        </div>
      </div>

      {/* Modal de formulário para criar/editar nota fiscal */}
      <NotaFiscalFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        notaFiscalParaEditar={notaSelecionada}
        onNotaFiscalSalva={carregarNotasFiscais}
      />

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Nota Fiscal</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteNota}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 