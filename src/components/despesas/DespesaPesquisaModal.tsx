import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  CalendarRange, 
  CreditCard, 
  Tag, 
  Building,
  Check, 
  Clock, 
  AlertTriangle,
  X,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { listarDespesas } from '@/services/despesaService';
import { listarCategoriasDespesas } from '@/services/categoriaDespesaService';
import { listarBancos } from '@/services/bancoService';
import { Despesa, FormaSaida } from '@/types/despesa';
import { CategoriaDespesa } from '@/types/categoriaDespesa';
import { Banco } from '@/types/banco';
import { formatarMoeda } from '@/lib/format';

// Definir esquema de validação para o formulário de pesquisa
const pesquisaSchema = z.object({
  categoria_id: z.string().optional(),
  banco_id: z.string().optional(),
  forma_saida: z.enum(['boleto', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'dinheiro', 'cheque', 'todos']).optional(),
  status_pagamento: z.enum(['pendente', 'pago', 'cancelado', 'todos']).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  valor_min: z.string().optional(),
  valor_max: z.string().optional(),
  termo_busca: z.string().optional(),
});

type PesquisaFormValues = z.infer<typeof pesquisaSchema>;

interface DespesaPesquisaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DespesaPesquisaModal({ isOpen, onOpenChange }: DespesaPesquisaModalProps) {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState(false);

  // Configurar o formulário
  const form = useForm<PesquisaFormValues>({
    resolver: zodResolver(pesquisaSchema),
    defaultValues: {
      categoria_id: 'todos',
      banco_id: 'todos',
      forma_saida: 'todos',
      status_pagamento: 'todos',
      data_inicio: '',
      data_fim: '',
      valor_min: '',
      valor_max: '',
      termo_busca: '',
    }
  });

  // Carregar dados para os selects
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [categoriasList, bancosList] = await Promise.all([
          listarCategoriasDespesas(),
          listarBancos()
        ]);
        
        setCategorias(categoriasList);
        setBancos(bancosList);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        toast.error('Falha ao carregar dados para o formulário');
      }
    };
    
    carregarDados();
  }, []);

  // Função para lidar com a pesquisa
  const onSubmit = async (values: PesquisaFormValues) => {
    setIsLoading(true);
    
    try {
      // Aqui você precisaria implementar a função de filtro de despesas com base nos critérios
      // Por enquanto, vamos apenas carregar todas as despesas e filtrar no front-end
      const todasDespesas = await listarDespesas();
      
      // Filtragem local (substitua por API quando disponível)
      const despesasFiltradas = todasDespesas.filter(despesa => {
        // Filtro por categoria
        if (values.categoria_id && values.categoria_id !== 'todos' && despesa.categoria_id !== values.categoria_id) {
          return false;
        }
        
        // Filtro por banco
        if (values.banco_id && values.banco_id !== 'todos' && despesa.banco_id !== values.banco_id) {
          return false;
        }
        
        // Filtro por forma de saída
        if (values.forma_saida && values.forma_saida !== 'todos' && despesa.forma_saida !== values.forma_saida) {
          return false;
        }
        
        // Filtro por status de pagamento
        if (values.status_pagamento && values.status_pagamento !== 'todos' && despesa.status_pagamento !== values.status_pagamento) {
          return false;
        }
        
        // Filtro por data
        if (values.data_inicio && new Date(despesa.data_lancamento) < new Date(values.data_inicio)) {
          return false;
        }
        if (values.data_fim && new Date(despesa.data_lancamento) > new Date(values.data_fim)) {
          return false;
        }
        
        // Filtro por valor
        if (values.valor_min && despesa.valor < parseFloat(values.valor_min)) {
          return false;
        }
        if (values.valor_max && despesa.valor > parseFloat(values.valor_max)) {
          return false;
        }
        
        // Filtro por termo de busca
        if (values.termo_busca) {
          const termo = values.termo_busca.toLowerCase();
          if (!despesa.descricao.toLowerCase().includes(termo) && 
              !despesa.banco?.nome.toLowerCase().includes(termo) && 
              !despesa.categoria?.nome.toLowerCase().includes(termo)) {
            return false;
          }
        }
        
        return true;
      });
      
      setDespesas(despesasFiltradas);
      setFiltrosAplicados(true);
      
      if (despesasFiltradas.length === 0) {
        toast.info('Nenhuma despesa encontrada para os filtros informados');
      } else {
        toast.success(`${despesasFiltradas.length} despesas encontradas`);
      }
    } catch (error) {
      console.error('Erro ao pesquisar despesas:', error);
      toast.error('Falha ao pesquisar despesas');
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar filtros
  const limparFiltros = () => {
    form.reset();
    setDespesas([]);
    setFiltrosAplicados(false);
  };

  // Formatar data para exibição
  const formatarData = (dataIso?: string) => {
    if (!dataIso) return '-';
    return format(parseISO(dataIso), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Obter o nome do banco pelo ID
  const getNomeBanco = (bancoId: string): string => {
    const banco = bancos.find(b => b.id === bancoId);
    return banco ? banco.nome : '-';
  };

  // Obter o nome da categoria pelo ID
  const getNomeCategoria = (categoriaId: string): string => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nome : '-';
  };

  // Formatar status de pagamento
  const formatarStatus = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Desconhecido</Badge>;
    }
  };

  // Formatar forma de saída
  const formatarFormaSaida = (forma: FormaSaida) => {
    const formatos: Record<FormaSaida, string> = {
      boleto: 'Boleto',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      pix: 'PIX',
      transferencia: 'Transferência',
      dinheiro: 'Dinheiro',
      cheque: 'Cheque'
    };
    
    return formatos[forma] || forma;
  };

  // Função para exportar dados para Excel
  const exportarParaExcel = () => {
    if (despesas.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }
    
    // Preparar dados para exportação
    const dadosExcel = despesas.map(despesa => ({
      'Data': formatarData(despesa.data_lancamento),
      'Banco': despesa.banco?.nome || '-',
      'Categoria': despesa.categoria?.nome || '-',
      'Descrição': despesa.descricao,
      'Valor': formatarMoeda(despesa.valor),
      'Forma de Pagamento': formatarFormaSaida(despesa.forma_saida),
      'Status': despesa.status_pagamento,
      'Data de Pagamento': formatarData(despesa.data_pagamento)
    }));
    
    // Criar workbook e adicionar worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    XLSX.utils.book_append_sheet(wb, ws, 'Despesas');
    
    // Gerar arquivo Excel e fazer download
    XLSX.writeFile(wb, `Despesas_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    toast.success('Relatório exportado com sucesso!');
  };

  // Calcular total das despesas
  const valorTotal = despesas.reduce((total, despesa) => total + despesa.valor, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-erio-600">
            Pesquisa Avançada de Despesas
          </DialogTitle>
          <DialogDescription>
            Utilize os filtros abaixo para encontrar despesas específicas
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por termo de busca */}
              <div className="col-span-1 md:col-span-3">
                <FormField
                  control={form.control}
                  name="termo_busca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termo de Busca</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por descrição, banco ou categoria..."
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Filtro por categoria */}
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todas as categorias</SelectItem>
                        {categorias.map(categoria => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Filtro por banco */}
              <FormField
                control={form.control}
                name="banco_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um banco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todos os bancos</SelectItem>
                        {bancos.map(banco => (
                          <SelectItem key={banco.id} value={banco.id}>
                            {banco.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Filtro por forma de saída */}
              <FormField
                control={form.control}
                name="forma_saida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todas as formas</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Filtro por status */}
              <FormField
                control={form.control}
                name="status_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Filtro por data de início */}
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inicial</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Filtro por data de fim */}
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Filtro por valor mínimo */}
              <FormField
                control={form.control}
                name="valor_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mínimo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0,00" 
                        step="0.01" 
                        min="0"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Filtro por valor máximo */}
              <FormField
                control={form.control}
                name="valor_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Máximo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0,00" 
                        step="0.01" 
                        min="0"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={limparFiltros}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    Pesquisando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Pesquisar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
        
        {filtrosAplicados && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Resultados da pesquisa</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={exportarParaExcel}
                  disabled={despesas.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
            
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma despesa encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    despesas.map((despesa) => (
                      <TableRow key={despesa.id}>
                        <TableCell>
                          {formatarData(despesa.data_lancamento)}
                        </TableCell>
                        <TableCell>
                          {despesa.banco?.nome || getNomeBanco(despesa.banco_id)}
                        </TableCell>
                        <TableCell>
                          {despesa.categoria?.nome || getNomeCategoria(despesa.categoria_id)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {despesa.descricao}
                        </TableCell>
                        <TableCell className="font-medium text-red-500">
                          {formatarMoeda(despesa.valor)}
                        </TableCell>
                        <TableCell>
                          {formatarStatus(despesa.status_pagamento)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {despesas.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-semibold">
                        Total
                      </TableCell>
                      <TableCell className="font-bold text-red-500">
                        {formatarMoeda(valorTotal)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </div>
        )}
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 