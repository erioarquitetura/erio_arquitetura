import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon, CreditCard, DollarSign, Tag, BuildingIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { Despesa, FormaSaida } from '@/types/despesa';
import { criarDespesa, atualizarDespesa, listarFormasSaida } from '@/services/despesaService';
import { listarBancos } from '@/services/bancoService';
import { listarCategoriasDespesas } from '@/services/categoriaDespesaService';
import { Banco } from '@/types/banco';
import { CategoriaDespesa } from '@/types/categoriaDespesa';
import { formatarMoeda, parseMoeda } from '@/lib/format';

const valorMinDespesa = 0.01;
const valorMaxDespesa = 9999999.99;

// Schema de validação do formulário
const formSchema = z.object({
  banco_id: z.string({
    required_error: 'Selecione o banco',
  }),
  categoria_id: z.string({
    required_error: 'Selecione a categoria',
  }),
  data_lancamento: z.date({
    required_error: 'Selecione a data de lançamento',
  }),
  valor: z.number({
    required_error: 'Informe o valor da despesa',
  })
    .min(valorMinDespesa, `Valor mínimo é ${formatarMoeda(valorMinDespesa)}`)
    .max(valorMaxDespesa, `Valor máximo é ${formatarMoeda(valorMaxDespesa)}`),
  forma_saida: z.custom<FormaSaida>((val) => 
    ['boleto', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'dinheiro', 'cheque'].includes(String(val)), {
    message: 'Selecione a forma de saída',
  }),
  descricao: z.string({
    required_error: 'Informe a descrição da despesa',
  }).min(3, 'Descrição deve ter no mínimo 3 caracteres').max(200, 'Descrição não pode ultrapassar 200 caracteres'),
  status_pagamento: z.enum(['pendente', 'pago', 'cancelado'], {
    required_error: 'Selecione o status do pagamento',
  }),
  data_pagamento: z.date().nullable().optional(),
  comprovante_url: z.string().optional(),
});

interface DespesaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  despesa: Despesa | null;
  onSuccess: () => void;
}

export function DespesaFormModal({ open, onOpenChange, despesa, onSuccess }: DespesaFormModalProps) {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [formasSaida, setFormasSaida] = useState<{ id: FormaSaida; nome: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [valorFormatado, setValorFormatado] = useState('R$ 0,00');
  const [bancoSelecionado, setBancoSelecionado] = useState<Banco | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaDespesa | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      banco_id: '',
      categoria_id: '',
      data_lancamento: new Date(),
      valor: 0,
      forma_saida: 'boleto' as FormaSaida,
      descricao: '',
      status_pagamento: 'pendente',
      data_pagamento: null,
      comprovante_url: '',
    },
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [bancosData, categoriasData, formasSaidaData] = await Promise.all([
          listarBancos(),
          listarCategoriasDespesas(),
          listarFormasSaida(),
        ]);
        setBancos(bancosData);
        setCategorias(categoriasData);
        setFormasSaida(formasSaidaData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        toast.error('Falha ao carregar dados necessários para o formulário');
      }
    };

    if (open) {
      carregarDados();
    }
  }, [open]);

  useEffect(() => {
    if (despesa) {
      // Encontrar o banco e categoria selecionados
      const banco = bancos.find(b => b.id === despesa.banco_id);
      const categoria = categorias.find(c => c.id === despesa.categoria_id);
      
      setBancoSelecionado(banco || null);
      setCategoriaSelecionada(categoria || null);
      
      // Formatar o valor para exibição
      setValorFormatado(formatarMoeda(despesa.valor));
      
      // Preencher o formulário com os dados da despesa
      form.reset({
        banco_id: despesa.banco_id,
        categoria_id: despesa.categoria_id,
        data_lancamento: new Date(despesa.data_lancamento),
        valor: despesa.valor,
        forma_saida: despesa.forma_saida,
        descricao: despesa.descricao,
        status_pagamento: despesa.status_pagamento,
        data_pagamento: despesa.data_pagamento ? new Date(despesa.data_pagamento) : null,
        comprovante_url: despesa.comprovante_url || '',
      });
    } else {
      // Resetar o formulário para valores padrão
      form.reset({
        banco_id: '',
        categoria_id: '',
        data_lancamento: new Date(),
        valor: 0,
        forma_saida: 'boleto' as FormaSaida,
        descricao: '',
        status_pagamento: 'pendente',
        data_pagamento: null,
        comprovante_url: '',
      });
      setValorFormatado('R$ 0,00');
      setBancoSelecionado(null);
      setCategoriaSelecionada(null);
    }
  }, [despesa, bancos, categorias, form]);

  const handleBancoChange = (bancoId: string) => {
    const banco = bancos.find(b => b.id === bancoId);
    setBancoSelecionado(banco || null);
    form.setValue('banco_id', bancoId);
  };

  const handleCategoriaChange = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    setCategoriaSelecionada(categoria || null);
    form.setValue('categoria_id', categoriaId);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    const valorNumerico = parseFloat(valor) / 100;
    
    form.setValue('valor', valorNumerico, { shouldValidate: true });
    setValorFormatado(formatarMoeda(valorNumerico));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (despesa) {
        // Atualizar despesa existente
        await atualizarDespesa(despesa.id, values);
        toast.success('Despesa atualizada com sucesso!');
      } else {
        // Criar nova despesa
        await criarDespesa(values);
        toast.success('Despesa criada com sucesso!');
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast.error('Falha ao salvar despesa');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {despesa ? 'Editar Despesa' : 'Nova Despesa'}
          </DialogTitle>
          <DialogDescription>
            {despesa
              ? 'Edite os detalhes da despesa'
              : 'Preencha as informações para criar uma nova despesa'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Banco */}
            <FormField
              control={form.control}
              name="banco_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <Select
                    onValueChange={handleBancoChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bancos.map((banco) => (
                        <SelectItem key={banco.id} value={banco.id}>
                          <div className="flex items-center">
                            <BuildingIcon className="h-4 w-4 mr-2" />
                            <span>{banco.nome}</span>
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100">
                              {banco.tipo_favorecido === 'cnpj' ? 'PJ' : 'PF'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bancoSelecionado && (
                    <FormDescription>
                      {bancoSelecionado.tipo_favorecido === 'cnpj' ? 'Pessoa Jurídica' : 'Pessoa Física'} - 
                      Ag: {bancoSelecionado.agencia} - Conta: {bancoSelecionado.conta}
                    </FormDescription>
                  )}
                  <FormMessage />
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
                    onValueChange={handleCategoriaChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-2" />
                            <span>{categoria.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoriaSelecionada && (
                    <FormDescription className="flex space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${categoriaSelecionada.despesa_fixa ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {categoriaSelecionada.despesa_fixa ? 'Fixa' : 'Variável'}
                      </span>
                      {categoriaSelecionada.despesa_fiscal && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                          Fiscal
                        </span>
                      )}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Lançamento */}
              <FormField
                control={form.control}
                name="data_lancamento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Lançamento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor */}
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="0,00"
                          className="pl-9"
                          value={valorFormatado}
                          onChange={handleValorChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Forma de Saída */}
              <FormField
                control={form.control}
                name="forma_saida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Saída</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de saída" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formasSaida.map((forma) => (
                          <SelectItem key={forma.id} value={forma.id}>
                            <div className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              <span>{forma.nome}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status do Pagamento */}
              <FormField
                control={form.control}
                name="status_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data de Pagamento (condicional) */}
            {form.watch('status_pagamento') === 'pago' && (
              <FormField
                control={form.control}
                name="data_pagamento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Pagamento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a despesa"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-white"></div>
                    Salvando...
                  </>
                ) : despesa ? 'Atualizar Despesa' : 'Criar Despesa'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 