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
  User, 
  Check, 
  Clock, 
  FileText,
  X,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { 
  listarItensReceita, 
  listarFormasPagamento,
} from '@/services/receitaService';
import { listarCategoriasReceitas } from '@/services/categoriaReceitaService';
import { listarClientes } from '@/services/clienteService';
import { listarBancos } from '@/services/bancoService';
import { listarNotasFiscais, verificarItemTemNotaFiscal } from '@/services/notaFiscalService';
import { ReceitaItem, ReceitaStatus, FormaPagamento } from '@/types/receita';
import { NotaFiscal } from '@/types/notaFiscal';
import { CategoriaReceita } from '@/types/categoriaReceita';
import { Cliente } from '@/types';
import { Banco } from '@/types/banco';

// Definir esquema de validação para o formulário de pesquisa
const pesquisaSchema = z.object({
  cliente_id: z.string().optional(),
  categoria_id: z.string().optional(),
  forma_pagamento_id: z.string().optional(),
  banco_id: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'pago_parcial', 'todos']).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  valor_min: z.string().optional(),
  valor_max: z.string().optional(),
  termo_busca: z.string().optional(),
});

type PesquisaFormValues = z.infer<typeof pesquisaSchema>;

interface PesquisaItensReceitaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PesquisaItensReceitaModal({ isOpen, onOpenChange }: PesquisaItensReceitaModalProps) {
  const [itensReceita, setItensReceita] = useState<ReceitaItem[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [categorias, setCategorias] = useState<CategoriaReceita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState(false);

  // Configurar o formulário
  const form = useForm<PesquisaFormValues>({
    resolver: zodResolver(pesquisaSchema),
    defaultValues: {
      cliente_id: 'todos',
      categoria_id: 'todos',
      forma_pagamento_id: 'todos',
      banco_id: 'todos',
      status: 'todos',
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
        const [formas, categoriasList, clientesList, bancosList, notasList] = await Promise.all([
          listarFormasPagamento(),
          listarCategoriasReceitas(),
          listarClientes(),
          listarBancos(),
          listarNotasFiscais()
        ]);
        
        setFormasPagamento(formas);
        setCategorias(categoriasList);
        setClientes(clientesList);
        setBancos(bancosList);
        setNotasFiscais(notasList);
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
      // Converter valores de string para número quando necessário
      const filtros = {
        ...values,
        cliente_id: values.cliente_id === 'todos' ? undefined : values.cliente_id,
        categoria_id: values.categoria_id === 'todos' ? undefined : values.categoria_id,
        forma_pagamento_id: values.forma_pagamento_id === 'todos' ? undefined : values.forma_pagamento_id,
        banco_id: values.banco_id === 'todos' ? undefined : values.banco_id,
        valor_min: values.valor_min ? parseFloat(values.valor_min) : undefined,
        valor_max: values.valor_max ? parseFloat(values.valor_max) : undefined,
        status: values.status === 'todos' ? undefined : values.status as ReceitaStatus,
      };
      
      const itens = await listarItensReceita(filtros);
      setItensReceita(itens);
      setFiltrosAplicados(true);
      
      if (itens.length === 0) {
        toast.info('Nenhum item encontrado para os filtros informados');
      } else {
        toast.success(`${itens.length} itens encontrados`);
      }
    } catch (error) {
      console.error('Erro ao pesquisar itens:', error);
      toast.error('Falha ao pesquisar itens de receita');
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar filtros
  const limparFiltros = () => {
    form.reset();
    setItensReceita([]);
    setFiltrosAplicados(false);
  };

  // Formatar valores para exibição
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Formatar data para exibição
  const formatarData = (dataIso?: string) => {
    if (!dataIso) return '-';
    return format(parseISO(dataIso), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Obter o nome do banco pelo ID
  const getNomeBanco = (detalhes: any): string => {
    if (!detalhes || !detalhes.banco_id) return '-';
    
    const banco = bancos.find(b => b.id === detalhes.banco_id);
    if (banco) {
      return `${banco.nome} (${banco.codigo})`;
    }
    
    // Fallback para o campo 'banco' se existir
    return detalhes.banco || '-';
  };

  // Obter badge de status
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

  // Calcular o valor total dos itens encontrados
  const calcularTotal = () => {
    return itensReceita.reduce((total, item) => total + item.valor, 0);
  };

  // Obter número da nota fiscal associada ao item
  const getNumeroNotaFiscal = (itemId: string): string => {
    const notaFiscal = notasFiscais.find(nota => nota.receita_item_id === itemId);
    return notaFiscal ? notaFiscal.numero_nota : '-';
  };

  // Renderizar o número da nota fiscal com estilo
  const renderNumeroNotaFiscal = (itemId: string) => {
    const numeroNF = getNumeroNotaFiscal(itemId);
    
    if (numeroNF === '-') {
      return numeroNF;
    }
    
    return (
      <span className="text-green-600 font-medium">
        {numeroNF}
      </span>
    );
  };

  // Função para exportar os resultados para Excel
  const exportarParaExcel = () => {
    if (itensReceita.length === 0) return;
    
    // Preparar os dados para exportação
    const dadosExportacao = itensReceita.map(item => ({
      'Cliente': item.receita?.cliente?.nome || '-',
      'Proposta': item.receita?.proposta?.codigo || '-',
      'Categoria': item.receita?.categoria?.nome || '-',
      'Forma de Pagamento': item.forma_pagamento?.nome || '-',
      'Banco': getNomeBanco(item.detalhes_pagamento as any),
      'Nota Fiscal': getNumeroNotaFiscal(item.id),
      'Valor': formatarValor(item.valor).replace('R$', '').trim(),
      'Vencimento': formatarData(item.data_vencimento),
      'Status': item.status,
      'Descrição': item.descricao || item.receita?.descricao || '-'
    }));
    
    // Criar uma planilha
    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Itens de Receita");
    
    // Exportar o arquivo
    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `itens-receita-${dataAtual}.xlsx`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-erio-600 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pesquisar Itens de Receita
          </DialogTitle>
          <DialogDescription>
            Preencha os filtros desejados para buscar itens de receita específicos
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Filtros principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cliente */}
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todos os clientes</SelectItem>
                        {clientes.map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Categoria */}
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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

              {/* Forma de Pagamento */}
              <FormField
                control={form.control}
                name="forma_pagamento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma forma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todas as formas</SelectItem>
                        {formasPagamento.map(forma => (
                          <SelectItem key={forma.id} value={forma.id}>
                            {forma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* Segunda linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Banco */}
              <FormField
                control={form.control}
                name="banco_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                            {banco.nome} ({banco.codigo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago_parcial">Pago Parcial</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Período */}
              <div className="space-y-2">
                <Label>Período</Label>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="data_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="date" 
                            placeholder="Data inicial" 
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="date" 
                            placeholder="Data final" 
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Faixa de Valor */}
              <div className="space-y-2">
                <Label>Faixa de Valor</Label>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="valor_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            placeholder="Valor mínimo" 
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valor_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            placeholder="Valor máximo" 
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Linha para termo de busca */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="termo_busca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Busca por texto</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Digite para buscar por cliente, proposta, descrição..."
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={limparFiltros}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                <Search className="mr-2 h-4 w-4" />
                Pesquisar
              </Button>
            </div>
          </form>
        </Form>

        {/* Resultados da pesquisa */}
        {filtrosAplicados && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Resultados da Pesquisa</h3>
              
              {itensReceita.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportarParaExcel}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              )}
            </div>
            
            {itensReceita.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>Nenhum item de receita encontrado para os filtros informados.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Cliente</TableHead>
                      <TableHead>Proposta</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Forma Pgto.</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>NF</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensReceita.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.receita?.cliente?.nome || '-'}
                        </TableCell>
                        <TableCell>
                          {item.receita?.proposta?.codigo || '-'}
                        </TableCell>
                        <TableCell>
                          {item.receita?.categoria?.nome || '-'}
                        </TableCell>
                        <TableCell>
                          {item.forma_pagamento?.nome || '-'}
                        </TableCell>
                        <TableCell>
                          {getNomeBanco(item.detalhes_pagamento as any)}
                        </TableCell>
                        <TableCell>
                          {renderNumeroNotaFiscal(item.id)}
                        </TableCell>
                        <TableCell>
                          {formatarValor(item.valor)}
                        </TableCell>
                        <TableCell>
                          {formatarData(item.data_vencimento)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.descricao || item.receita?.descricao || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-gray-50 border-t-2 border-gray-200">
                      <TableCell colSpan={6} className="text-right font-bold text-gray-700">
                        Total ({itensReceita.length} {itensReceita.length === 1 ? 'item' : 'itens'}):
                      </TableCell>
                      <TableCell className="font-bold text-lg text-erio-600">
                        {formatarValor(calcularTotal())}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 