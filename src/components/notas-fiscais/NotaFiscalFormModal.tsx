import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  listarItensReceitaPagos, 
  criarNotaFiscal, 
  atualizarNotaFiscal,
  verificarNotaFiscalDuplicada
} from '@/services/notaFiscalService';
import { LoaderCircle, Receipt, CalendarRange, AlertCircle } from 'lucide-react';
import { NotaFiscal, NotaFiscalFormValues, ReceitaItemParaNotaFiscal } from '@/types/notaFiscal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NotaFiscalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  notaFiscalParaEditar?: NotaFiscal | null;
  onNotaFiscalSalva?: (notaFiscal: NotaFiscal) => void;
}

const formSchema = z.object({
  receita_item_id: z.string({
    required_error: 'Selecione um item de receita',
  }),
  numero_nota: z.string().min(1, 'Informe o número da nota fiscal'),
  valor: z.number({
    required_error: 'Informe o valor da nota fiscal',
    invalid_type_error: 'O valor deve ser um número',
  }).positive('O valor deve ser maior que zero'),
  taxa_imposto: z.number({
    required_error: 'Informe a taxa de imposto',
    invalid_type_error: 'A taxa deve ser um número',
  }).min(0, 'A taxa não pode ser negativa').max(100, 'A taxa não pode ser maior que 100%'),
  data_emissao: z.string().min(1, 'Informe a data de emissão'),
  data_lancamento: z.string().min(1, 'Informe a data de lançamento'),
  observacoes: z.string().optional(),
});

// Dados mock para itens de receita pagos
const itensMock: ReceitaItemParaNotaFiscal[] = [
  {
    id: 'item1',
    receita_id: 'rec1',
    forma_pagamento_id: 'fp1',
    valor: 5000,
    status: 'pago',
    data_vencimento: '2023-09-10',
    data_pagamento: '2023-09-10',
    parcela: 1,
    total_parcelas: 2,
    ordem: 1,
    proposta_codigo: 'PROP001',
    cliente_nome: 'Ana Construtora Ltda',
    item_ordem_total: '1/2'
  },
  {
    id: 'item2',
    receita_id: 'rec1',
    forma_pagamento_id: 'fp1',
    valor: 5000,
    status: 'pago',
    data_vencimento: '2023-10-10',
    data_pagamento: '2023-10-08',
    parcela: 2,
    total_parcelas: 2,
    ordem: 2,
    proposta_codigo: 'PROP001',
    cliente_nome: 'Ana Construtora Ltda',
    item_ordem_total: '2/2'
  },
  {
    id: 'item3',
    receita_id: 'rec2',
    forma_pagamento_id: 'fp2',
    valor: 12000,
    status: 'pago',
    data_vencimento: '2023-09-15',
    data_pagamento: '2023-09-15',
    parcela: 1,
    total_parcelas: 1,
    ordem: 1,
    proposta_codigo: 'PROP002',
    cliente_nome: 'Tech Spaces Ltda',
    item_ordem_total: '1/1'
  }
];

export function NotaFiscalFormModal({
  isOpen,
  onClose,
  notaFiscalParaEditar,
  onNotaFiscalSalva
}: NotaFiscalFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [receitasItensPagos, setReceitasItensPagos] = useState<ReceitaItemParaNotaFiscal[]>([]);
  const [numeroNotaDuplicado, setNumeroNotaDuplicado] = useState(false);
  const [verificandoNumero, setVerificandoNumero] = useState(false);
  
  const form = useForm<NotaFiscalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_nota: '',
      receita_item_id: 'sem_selecao',
      data_emissao: new Date().toISOString().split('T')[0],
      data_lancamento: new Date().toISOString().split('T')[0],
      valor: 0,
      taxa_imposto: 15,
      observacoes: '',
    },
  });

  // Monitorar mudanças no número da nota fiscal para verificar duplicidade
  const numeroNota = form.watch('numero_nota');
  
  useEffect(() => {
    // Função para verificar se o número da nota fiscal já existe
    const verificarNumeroNota = async () => {
      if (!numeroNota || numeroNota.trim() === '') {
        setNumeroNotaDuplicado(false);
        return;
      }
      
      setVerificandoNumero(true);
      
      try {
        const duplicado = await verificarNotaFiscalDuplicada(
          numeroNota,
          notaFiscalParaEditar?.id
        );
        
        setNumeroNotaDuplicado(duplicado);
      } catch (error) {
        console.error('Erro ao verificar número da nota:', error);
      } finally {
        setVerificandoNumero(false);
      }
    };
    
    // Usar um timeout para evitar muitas requisições enquanto digita
    const timeoutId = setTimeout(verificarNumeroNota, 500);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [numeroNota, notaFiscalParaEditar?.id]);

  // Carregar itens de receita pagos ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      carregarReceitasItensPagos();
      
      // Se for edição, preencher o formulário com os dados da nota fiscal
      if (notaFiscalParaEditar) {
        console.log('Preenchendo formulário para edição', notaFiscalParaEditar);
        // Garantir que taxa_imposto seja um número válido
        const taxaImposto = notaFiscalParaEditar.taxa_imposto;
        const taxaFormatada = typeof taxaImposto === 'number' && !isNaN(taxaImposto) ? taxaImposto : 15;
        
        form.reset({
          numero_nota: notaFiscalParaEditar.numero_nota || '',
          receita_item_id: notaFiscalParaEditar.receita_item_id || 'sem_selecao',
          data_emissao: notaFiscalParaEditar.data_emissao || '',
          data_lancamento: notaFiscalParaEditar.data_lancamento || '',
          valor: notaFiscalParaEditar.valor || 0,
          taxa_imposto: taxaFormatada,
          observacoes: notaFiscalParaEditar.observacoes || '',
        });
      } else {
        // Reset para valores padrão se for uma nova nota fiscal
        form.reset({
          numero_nota: '',
          receita_item_id: 'sem_selecao',
          data_emissao: new Date().toISOString().split('T')[0],
          data_lancamento: new Date().toISOString().split('T')[0],
          valor: 0,
          taxa_imposto: 15,
          observacoes: '',
        });
      }
    }
  }, [isOpen, notaFiscalParaEditar, form]);

  // Função para carregar os itens de receita pagos
  const carregarReceitasItensPagos = async () => {
    setIsLoading(true);
    try {
      const itens = await listarItensReceitaPagos();
      console.log('Itens de receita pagos carregados:', itens);
      setReceitasItensPagos(itens);
    } catch (error) {
      console.error('Erro ao carregar itens de receita pagos:', error);
      toast.error('Não foi possível carregar os itens de receita pagos');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar valor ao selecionar um item de receita
  const handleItemReceitaChange = (itemId: string) => {
    console.log('Item de receita selecionado:', itemId);
    if (itemId && itemId !== 'sem_selecao') {
      const itemSelecionado = receitasItensPagos.find(item => item.id === itemId);
      console.log('Item encontrado:', itemSelecionado);
      if (itemSelecionado) {
        form.setValue('valor', itemSelecionado.valor);
      }
    } else {
      form.setValue('valor', 0);
    }
  };

  // Função para salvar a nota fiscal
  const onSubmit = async (values: NotaFiscalFormValues) => {
    console.log('Valores do formulário para submissão:', values);
    setIsLoading(true);

    try {
      // Verificar se já existe nota fiscal com o mesmo número
      const numeroNotaExistente = await verificarNotaFiscalDuplicada(
        values.numero_nota,
        notaFiscalParaEditar?.id
      );

      if (numeroNotaExistente) {
        toast.error(`Já existe uma nota fiscal com o número "${values.numero_nota}"`);
        setNumeroNotaDuplicado(true);
        setIsLoading(false);
        return;
      }

      // Preparar os dados para envio
      const formData: NotaFiscalFormValues = {
        ...values,
        // Garantir que todos os campos necessários estão presentes
        numero_nota: values.numero_nota,
        receita_item_id: values.receita_item_id,
        data_emissao: values.data_emissao,
        data_lancamento: values.data_lancamento,
        valor: Number(values.valor),
        taxa_imposto: Number(values.taxa_imposto),
        observacoes: values.observacoes || ''
      };

      // Buscar informações adicionais do item de receita
      if (values.receita_item_id !== 'sem_selecao') {
        const itemSelecionado = receitasItensPagos.find(
          item => item.id === values.receita_item_id
        );
        
        if (itemSelecionado) {
          console.log('Item selecionado para nota fiscal:', itemSelecionado);
        }
      }

      let notaFiscalSalva: NotaFiscal;

      if (notaFiscalParaEditar) {
        // Atualizar nota fiscal existente
        notaFiscalSalva = await atualizarNotaFiscal(
          notaFiscalParaEditar.id,
          formData
        );
        toast.success('Nota fiscal atualizada com sucesso!');
      } else {
        // Criar nova nota fiscal
        notaFiscalSalva = await criarNotaFiscal(formData);
        toast.success('Nota fiscal criada com sucesso!');
      }

      if (onNotaFiscalSalva) {
        onNotaFiscalSalva(notaFiscalSalva);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar nota fiscal:', error);
      toast.error(
        'Não foi possível salvar a nota fiscal. Por favor, tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="nota-fiscal-form-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-erio-600 flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {notaFiscalParaEditar ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
          </DialogTitle>
          <DialogDescription id="nota-fiscal-form-description">
            {notaFiscalParaEditar 
              ? 'Edite os dados da nota fiscal emitida.' 
              : 'Preencha os dados para registrar uma nova nota fiscal.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="space-y-4">
              {/* Item da Receita */}
              <FormField
                control={form.control}
                name="receita_item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Item da Receita <span className="text-red-500">*</span></FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleItemReceitaChange(value);
                      }}
                      value={field.value}
                      disabled={!!notaFiscalParaEditar || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="border-gray-300 focus:border-erio-500 focus:ring-erio-500">
                          <SelectValue placeholder="Selecione um item de receita pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {receitasItensPagos.length === 0 ? (
                          <SelectItem value="sem_itens" disabled>
                            Nenhum item de receita pago disponível
                          </SelectItem>
                        ) : (
                          receitasItensPagos.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.proposta_codigo ? `${item.proposta_codigo} - ` : ''}
                              {item.cliente_nome || 'Cliente não informado'} 
                              {item.item_ordem_total ? ` (${item.item_ordem_total})` : ''} - 
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(item.valor)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Número da Nota Fiscal */}
              <FormField
                control={form.control}
                name="numero_nota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Número da Nota Fiscal <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          placeholder="Ex: 00001" 
                          className={`border-gray-300 focus:border-erio-500 focus:ring-erio-500 ${numeroNotaDuplicado ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {verificandoNumero && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {numeroNotaDuplicado && (
                      <Alert variant="destructive" className="mt-2 py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-medium">Número já existe</AlertTitle>
                        <AlertDescription className="text-xs">
                          Este número de nota fiscal já está em uso.
                        </AlertDescription>
                      </Alert>
                    )}
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Valor e Data de Emissão */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Valor <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          step="0.01" 
                          placeholder="0,00" 
                          className="border-gray-300 focus:border-erio-500 focus:ring-erio-500 text-green-600 font-medium"
                          readOnly={!notaFiscalParaEditar}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_emissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Data de Emissão <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CalendarRange className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <Input 
                            {...field} 
                            type="date" 
                            className="border-gray-300 focus:border-erio-500 focus:ring-erio-500 pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Taxa de Imposto */}
              <FormField
                control={form.control}
                name="taxa_imposto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Taxa de Imposto (%) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          value={typeof field.value === 'number' ? field.value : 15}
                          type="number"
                          step="0.1" 
                          min="0"
                          max="100"
                          placeholder="15.0" 
                          className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                          onChange={(e) => {
                            const value = e.target.value === '' ? 15 : parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 15 : value);
                          }}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          %
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                    <p className="text-xs text-gray-500 mt-1">
                      Taxa utilizada para cálculo de impostos sobre o valor da nota fiscal.
                    </p>
                  </FormItem>
                )}
              />

              {/* Data de Lançamento (somente para exibição em caso de edição) */}
              {notaFiscalParaEditar && notaFiscalParaEditar.data_lancamento && (
                <div>
                  <Label className="text-gray-700">Data de Lançamento</Label>
                  <Input 
                    value={format(new Date(notaFiscalParaEditar.data_lancamento), 'dd/MM/yyyy')}
                    className="border-gray-300 bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Data em que a nota fiscal foi lançada no sistema.
                  </p>
                </div>
              )}

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Observações adicionais" 
                        className="min-h-[80px] border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full bg-erio-600 hover:bg-erio-700 text-white"
                disabled={isLoading || numeroNotaDuplicado}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : notaFiscalParaEditar ? 'Atualizar Nota Fiscal' : 'Criar Nota Fiscal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 