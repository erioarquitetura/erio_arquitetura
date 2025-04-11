import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Search, 
  PlusCircle,
  FileUp,
  Pencil,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NotaFiscalRecebidasFormModal } from '@/components/notas-fiscais-recebidas/NotaFiscalRecebidasFormModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Interface para notas fiscais recebidas
interface ProdutoNF {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  ncm: string;
  cfop: string;
}

interface NotaFiscalRecebida {
  id: string;
  numero_nota: string;
  data_emissao: string;
  cnpj_emitente: string;
  nome_emitente: string;
  valor_total: string | number;
  produtos: ProdutoNF[];
  data_lancamento: string;
  observacoes?: string;
  xml_base64?: string;
}

export default function NotasFiscaisRecebidasPage() {
  const [notas, setNotas] = useState<NotaFiscalRecebida[]>([]);
  const [notasFiltradas, setNotasFiltradas] = useState<NotaFiscalRecebida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscalRecebida | null>(null);
  const [notaParaExcluir, setNotaParaExcluir] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Carregar notas fiscais recebidas
  useEffect(() => {
    carregarNotasFiscais();
  }, []);
  
  // Filtrar notas
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setNotasFiltradas(notas);
      return;
    }
    
    const termLower = searchTerm.toLowerCase().trim();
    const filtered = notas.filter(nota => 
      nota.numero_nota.toLowerCase().includes(termLower) ||
      nota.nome_emitente.toLowerCase().includes(termLower) ||
      nota.cnpj_emitente.includes(termLower)
    );
    
    setNotasFiltradas(filtered);
  }, [searchTerm, notas]);
  
  // Carregar notas fiscais do Supabase
  const carregarNotasFiscais = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notas_fiscais_recebidas' as any)
        .select('*')
        .order('data_emissao', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setNotas(data as unknown as NotaFiscalRecebida[] || []);
      setNotasFiltradas(data as unknown as NotaFiscalRecebida[] || []);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais recebidas:', error);
      toast.error('Não foi possível carregar as notas fiscais recebidas.');
      
      // Dados de exemplo para desenvolvimento
      const dadosExemplo = [
        {
          id: '1',
          numero_nota: 'NF-001',
          data_emissao: '2023-05-10',
          cnpj_emitente: '12.345.678/0001-90',
          nome_emitente: 'Fornecedor ABC LTDA',
          valor_total: 1500.00,
          produtos: [],
          data_lancamento: '2023-05-12'
        },
        {
          id: '2',
          numero_nota: 'NF-002',
          data_emissao: '2023-05-15',
          cnpj_emitente: '98.765.432/0001-10',
          nome_emitente: 'Distribuidora XYZ S.A.',
          valor_total: 2800.50,
          produtos: [],
          data_lancamento: '2023-05-16'
        }
      ];
      
      setNotas(dadosExemplo);
      setNotasFiltradas(dadosExemplo);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funções auxiliares
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  const formatarCNPJ = (cnpj: string) => {
    // Remove caracteres não numéricos
    const cnpjNumerico = cnpj.replace(/\D/g, '');
    if (cnpjNumerico.length !== 14) return cnpj;
    
    return cnpjNumerico.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };
  
  // Calcular totais
  const calcularTotal = () => {
    return notas.reduce((acc, nota) => {
      // Garantir que o valor seja tratado como número
      let valor = 0;
      
      if (typeof nota.valor_total === 'string') {
        valor = parseFloat(nota.valor_total.replace(/,/g, '.'));
      } else if (typeof nota.valor_total === 'number') {
        valor = nota.valor_total;
      }
      
      return acc + valor;
    }, 0);
  };
  
  // Função para converter valor_total para número
  const converterParaNumero = (valor: string | number): number => {
    if (typeof valor === 'string') {
      return parseFloat(valor.replace(/,/g, '.')) || 0;
    }
    return valor || 0;
  };
  
  // Funções de ação
  const handleViewNota = (nota: NotaFiscalRecebida) => {
    setNotaSelecionada(nota);
    setIsFormModalOpen(true);
  };
  
  const handleEditNota = (nota: NotaFiscalRecebida, e: React.MouseEvent) => {
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
      const { error } = await supabase
        .from('notas_fiscais_recebidas' as any)
        .delete()
        .eq('id', notaParaExcluir);
        
      if (error) {
        throw error;
      }
      
      toast.success('Nota fiscal excluída com sucesso');
      setNotas(notas.filter(nota => nota.id !== notaParaExcluir));
      setNotasFiltradas(notasFiltradas.filter(nota => nota.id !== notaParaExcluir));
    } catch (error) {
      console.error('Erro ao excluir nota fiscal:', error);
      toast.error('Falha ao excluir nota fiscal');
    } finally {
      setIsDeleteDialogOpen(false);
      setNotaParaExcluir(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Gerencie as notas fiscais recebidas de fornecedores
        </p>
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
              <p className="text-sm font-medium text-gray-500">Impostos</p>
              <h3 className="text-2xl font-bold text-gray-800">-</h3>
            </div>
          </div>
        </Card>
      </div>

      <Separator />

      {/* Tabela de notas fiscais */}
      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Data de Emissão</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data Lançamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-erio-500"></div>
                    <span className="ml-2">Carregando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : notasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  Nenhuma nota fiscal encontrada.
                </TableCell>
              </TableRow>
            ) : (
              notasFiltradas.map((nota) => (
                <TableRow 
                  key={nota.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => handleViewNota(nota)}
                >
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-erio-500" />
                    {nota.numero_nota}
                  </TableCell>
                  <TableCell>{nota.nome_emitente}</TableCell>
                  <TableCell>{formatarCNPJ(nota.cnpj_emitente)}</TableCell>
                  <TableCell>{format(new Date(nota.data_emissao), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatarValor(converterParaNumero(nota.valor_total))}
                  </TableCell>
                  <TableCell>
                    {nota.data_lancamento ? format(new Date(nota.data_lancamento), 'dd/MM/yyyy') : '-'}
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

      {/* Modal para criar/editar nota fiscal */}
      <NotaFiscalRecebidasFormModal
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