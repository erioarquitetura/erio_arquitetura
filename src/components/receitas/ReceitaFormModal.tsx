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
  DialogFooter,
  DialogClose
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoaderCircle, PlusCircle, Trash2, CreditCard, Landmark, Wallet, Search } from 'lucide-react';
import { 
  buscarPropostaPorCodigo, 
  listarFormasPagamento, 
  criarReceita, 
  atualizarReceita,
  verificarPropostaPorCodigoJaTemReceita,
  verificarPropostaJaTemReceita,
  verificarPropostaPorCodigoAprovada,
  verificarPropostaAprovada,
  carregarReceitaParaFormulario
} from '@/services/receitaService';
import { listarCategoriasReceitas } from '@/services/categoriaReceitaService';
import { listarBancos } from '@/services/bancoService';
import { 
  Receita, 
  ReceitaFormValues, 
  FormaPagamento, 
  DetalhesPagamentoCartao, 
  DetalhesPagamentoPix 
} from '@/types/receita';
import { CategoriaReceita } from '@/types/categoriaReceita';
import { PropostaCompleta, PropostaCondicaoPagamento } from '@/types/proposal';
import { Banco } from '@/types/banco';
import { supabase } from '@/integrations/supabase/client';

interface ReceitaFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  receita?: Receita | null;
  onReceitaSalva: () => void;
}

const formSchema = z.object({
  proposta_id: z.string().optional(),
  categoria_id: z.string().optional(),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(
    z.object({
      condicao_pagamento_id: z.string().optional(),
      forma_pagamento_id: z.string(),
      valor: z.number().positive('Valor deve ser maior que zero'),
      data_vencimento: z.string(),
      data_pagamento: z.string().optional(),
      parcela: z.number().optional(),
      total_parcelas: z.number().optional(),
      taxa_juros: z.number().optional(),
      detalhes_pagamento: z.any().optional(),
      descricao: z.string().optional(),
    })
  ).min(1, 'Adicione pelo menos um item')
});

export function ReceitaFormModal({ isOpen, onOpenChange, receita, onReceitaSalva }: ReceitaFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingProposta, setIsSearchingProposta] = useState(false);
  const [propostaEncontrada, setPropostaEncontrada] = useState<any>(null);
  const [codigoProposta, setCodigoProposta] = useState('');
  const [categorias, setCategorias] = useState<CategoriaReceita[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [formaPagamentoAtual, setFormaPagamentoAtual] = useState<FormaPagamento | null>(null);
  const [mostrarDetalhesPix, setMostrarDetalhesPix] = useState(false);
  const [mostrarDetalhesCartao, setMostrarDetalhesCartao] = useState(false);
  const [mostrarDetalhesOutros, setMostrarDetalhesOutros] = useState(false);
  const [mostrarDetalhesBoleto, setMostrarDetalhesBoleto] = useState(false);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [bancoSelecionadoAtual, setBancoSelecionadoAtual] = useState<string | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [itensFiltrados, setItensFiltrados] = useState<any[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proposta_id: '',
      categoria_id: '',
      descricao: '',
      observacoes: '',
      itens: [{ 
        forma_pagamento_id: '', 
        valor: 0, 
        data_vencimento: format(new Date(), 'yyyy-MM-dd'),
        data_pagamento: ''
      }]
    }
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Carregando dados iniciais...');
        await carregarDados();
        console.log('Dados carregados com sucesso:', {
          categorias: categorias.length,
          formasPagamento: formasPagamento.length,
          bancos: bancos.length
        });
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        toast.error('Falha ao carregar dados necessários');
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    const carregarReceitaParaEdicao = async () => {
      if (receita && receita.id) {
        try {
          setIsLoading(true);
          console.log('Carregando receita completa para edição:', receita.id);
          
          // Usar a função especializada que carrega todos os relacionamentos
          const receitaCompleta = await carregarReceitaParaFormulario(receita.id);
          
          if (receitaCompleta) {
            console.log('Receita carregada com sucesso:', receitaCompleta);
            console.log('Total de itens carregados:', receitaCompleta.itens?.length);
            preencherFormularioComReceita(receitaCompleta);
          } else {
            console.error('Falha ao carregar receita completa');
            toast.error('Não foi possível carregar os dados da receita para edição');
          }
        } catch (error) {
          console.error('Erro ao carregar receita para edição:', error);
          toast.error('Falha ao carregar dados da receita');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (receita && receita.id) {
      carregarReceitaParaEdicao();
    }
  }, [receita?.id]);

  useEffect(() => {
    if (bancoSelecionadoAtual) {
      // Forçar a atualização do formulário quando o banco é alterado
      const timeoutId = setTimeout(() => {
        form.trigger();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [bancoSelecionadoAtual, form]);

  // Efeito para filtrar os itens com base na pesquisa
  useEffect(() => {
    const itens = form.getValues('itens') || [];
    
    if (!termoPesquisa.trim()) {
      setItensFiltrados(itens);
      return;
    }
    
    const termo = termoPesquisa.toLowerCase().trim();
    const filtrados = itens.filter((item, index) => {
      // Filtrar por descrição
      if (item.descricao && item.descricao.toLowerCase().includes(termo)) return true;
      
      // Filtrar por valor
      if (item.valor && item.valor.toString().includes(termo)) return true;
      
      // Filtrar por data de vencimento
      if (item.data_vencimento && item.data_vencimento.includes(termo)) return true;
      
      // Filtrar por índice do item
      if ((index + 1).toString().includes(termo)) return true;
      
      // Filtrar por forma de pagamento
      const formaPagamento = formasPagamento.find(f => f.id === item.forma_pagamento_id);
      if (formaPagamento && formaPagamento.nome.toLowerCase().includes(termo)) return true;
      
      return false;
    });
    
    setItensFiltrados(filtrados);
  }, [termoPesquisa, form, formasPagamento]);

  const carregarDados = async () => {
    try {
      console.log('Iniciando carregamento de dados...');
      
      // Usar Promise.allSettled para evitar que uma falha em uma requisição bloqueie as outras
      const results = await Promise.allSettled([
        listarCategoriasReceitas(),
        listarFormasPagamento(),
        listarBancos()
      ]);
      
      // Processar cada resultado individualmente
      if (results[0].status === 'fulfilled') {
        setCategorias(results[0].value || []);
        console.log('Categorias carregadas:', results[0].value?.length);
      } else {
        console.error('Erro ao carregar categorias:', results[0].reason);
        toast.error('Falha ao carregar categorias');
        setCategorias([]);
      }
      
      if (results[1].status === 'fulfilled') {
        setFormasPagamento(results[1].value || []);
        console.log('Formas de pagamento carregadas:', results[1].value?.length);
      } else {
        console.error('Erro ao carregar formas de pagamento:', results[1].reason);
        toast.error('Falha ao carregar formas de pagamento');
        setFormasPagamento([]);
      }
      
      if (results[2].status === 'fulfilled') {
        setBancos(results[2].value || []);
        console.log('Bancos carregados:', results[2].value?.length);
      } else {
        console.error('Erro ao carregar bancos:', results[2].reason);
        toast.error('Falha ao carregar bancos');
        setBancos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Falha ao carregar dados necessários');
      
      // Garantir que os estados não fiquem indefinidos
      setCategorias([]);
      setFormasPagamento([]);
      setBancos([]);
    }
  };

  const preencherFormularioComReceita = (receita: Receita) => {
    if (receita.proposta) {
      setPropostaEncontrada(receita.proposta);
      setCodigoProposta(receita.proposta.codigo || '');
    }

    form.reset({
      proposta_id: receita.proposta_id || undefined,
      categoria_id: receita.categoria_id || undefined,
      descricao: receita.descricao || '',
      observacoes: receita.observacoes || '',
      itens: receita.itens?.map(item => ({
        condicao_pagamento_id: item.condicao_pagamento_id,
        forma_pagamento_id: item.forma_pagamento_id,
        valor: item.valor,
        data_vencimento: item.data_vencimento ? format(new Date(item.data_vencimento), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        data_pagamento: item.data_pagamento ? format(new Date(item.data_pagamento), 'yyyy-MM-dd') : '',
        parcela: item.parcela,
        total_parcelas: item.total_parcelas,
        taxa_juros: item.taxa_juros,
        detalhes_pagamento: item.detalhes_pagamento,
        descricao: item.descricao || '',
      })) || []
    });
  };

  const buscarProposta = async () => {
    if (!codigoProposta.trim()) {
      toast.error('O código da Proposta tem que ser inserido');
      return;
    }

    setIsSearchingProposta(true);
    try {
      // Verificar se a proposta existe primeiro
      const { data: propostaExiste } = await supabase
        .from('propostas')
        .select('id')
        .eq('codigo', codigoProposta.toUpperCase())
        .single();
        
      if (!propostaExiste) {
        toast.error('Código inexistente ou não aprovado');
        setIsSearchingProposta(false);
        return;
      }
      
      // Verificar se a proposta está aprovada
      const propostaAprovada = await verificarPropostaPorCodigoAprovada(codigoProposta);
      if (!propostaAprovada) {
        toast.error('Código inexistente ou não aprovado');
        setIsSearchingProposta(false);
        return;
      }
      
      // Verificar se já existe uma receita com este código de proposta
      const propostaJaTemReceita = await verificarPropostaPorCodigoJaTemReceita(codigoProposta);
      if (propostaJaTemReceita) {
        toast.error('Esta proposta já está vinculada a uma receita existente');
        setIsSearchingProposta(false);
        return;
      }
      
      // Se a proposta está aprovada e ainda não tem receita, buscar a proposta
      const proposta = await buscarPropostaPorCodigo(codigoProposta);
      if (proposta) {
        setPropostaEncontrada(proposta);
        form.setValue('proposta_id', proposta.id);
        
        // Preencher itens com as condições de pagamento da proposta
        if (proposta.condicoes_pagamento && proposta.condicoes_pagamento.length > 0) {
          const itens = proposta.condicoes_pagamento.map((condicao: PropostaCondicaoPagamento) => ({
            condicao_pagamento_id: condicao.id,
            forma_pagamento_id: '',
            valor: condicao.valor,
            data_vencimento: format(new Date(), 'yyyy-MM-dd'),
            data_pagamento: format(new Date(), 'yyyy-MM-dd'),
            descricao: condicao.descricao,
          }));
          form.setValue('itens', itens);
        }

        toast.success('Proposta encontrada!');
      } else {
        toast.error('Proposta não encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar proposta:', error);
      toast.error('Código inexistente ou não aprovado');
    } finally {
      setIsSearchingProposta(false);
    }
  };

  const addItem = () => {
    const itens = form.getValues('itens') || [];
    form.setValue('itens', [
      ...itens,
      {
        forma_pagamento_id: '',
        valor: 0,
        data_vencimento: format(new Date(), 'yyyy-MM-dd'),
        data_pagamento: ''
      }
    ]);
  };

  const removeItem = (index: number) => {
    const itens = form.getValues('itens');
    form.setValue('itens', itens.filter((_, i) => i !== index));
  };

  const handleCategoriaChange = (categoriaId: string) => {
    const categoriaSelecionada = categorias.find(cat => cat.id === categoriaId);
    if (categoriaSelecionada && categoriaSelecionada.descricao) {
      form.setValue('descricao', categoriaSelecionada.descricao);
    }
  };

  const handleFormaPagamentoChange = (value: string, index: number) => {
    const forma = formasPagamento.find(f => f.id === value);
    setFormaPagamentoAtual(forma || null);
    
    if (forma) {
      const ehPix = forma.nome.toLowerCase().includes('pix');
      const ehCartao = forma.nome.toLowerCase().includes('cartão');
      const ehBoleto = forma.nome.toLowerCase().includes('boleto');
      
      setMostrarDetalhesPix(ehPix);
      setMostrarDetalhesCartao(ehCartao);
      setMostrarDetalhesBoleto(ehBoleto);
      setMostrarDetalhesOutros(!ehPix && !ehCartao && !ehBoleto);
      
      // Inicializar campos vazios com suporte para banco em todas as formas de pagamento
      const detalhesComuns = { 
        banco: '',
        banco_id: ''
      };
      
      if (ehCartao) {
        form.setValue(`itens.${index}.parcela`, 1);
        form.setValue(`itens.${index}.total_parcelas`, 1);
        form.setValue(`itens.${index}.taxa_juros`, 0);
        form.setValue(`itens.${index}.detalhes_pagamento`, { 
          ...detalhesComuns,
          parcelas: 1, 
          taxa_juros: 0 
        });
      } else if (ehPix) {
        // Inicializar campos do PIX vazios com dados comuns
        form.setValue(`itens.${index}.detalhes_pagamento`, { 
          ...detalhesComuns,
          tipo_chave: '',
          chave: ''
        });
        
        // Atualizar UI com força
        const itens = [...form.getValues('itens')];
        if (itens[index]) {
          itens[index] = {
            ...itens[index],
            detalhes_pagamento: { 
              ...detalhesComuns,
              tipo_chave: '', 
              chave: '' 
            }
          };
          form.setValue('itens', itens);
        }
      } else if (ehBoleto) {
        form.setValue(`itens.${index}.detalhes_pagamento`, {
          ...detalhesComuns,
          codigo_barras: '',
          linha_digitavel: ''
        });
      } else {
        // Para outras formas de pagamento (dinheiro, etc)
        form.setValue(`itens.${index}.detalhes_pagamento`, {
          ...detalhesComuns,
          observacoes: ''
        });
      }
    }
  };

  const handleParcelamentoChange = (parcelas: number, index: number) => {
    form.setValue(`itens.${index}.parcela`, 1);
    form.setValue(`itens.${index}.total_parcelas`, parcelas);
    
    const detalhes = form.getValues(`itens.${index}.detalhes_pagamento`) as DetalhesPagamentoCartao || {};
    form.setValue(`itens.${index}.detalhes_pagamento`, {
      ...detalhes,
      parcelas
    });
  };

  const handleTaxaJurosChange = (taxa: number, index: number) => {
    form.setValue(`itens.${index}.taxa_juros`, taxa);
    
    const detalhes = form.getValues(`itens.${index}.detalhes_pagamento`) as DetalhesPagamentoCartao || {};
    form.setValue(`itens.${index}.detalhes_pagamento`, {
      ...detalhes,
      taxa_juros: taxa
    });
  };

  const handlePixDetalhesChange = (campo: keyof DetalhesPagamentoPix, valor: string, index: number) => {
    const detalhes = form.getValues(`itens.${index}.detalhes_pagamento`) as DetalhesPagamentoPix || {};
    const novosDetalhes = {
      ...detalhes,
      [campo]: valor
    };
    
    form.setValue(`itens.${index}.detalhes_pagamento`, novosDetalhes);
    
    // Atualizar UI com força
    const itens = [...form.getValues('itens')];
    if (itens[index]) {
      itens[index] = {
        ...itens[index],
        detalhes_pagamento: novosDetalhes
      };
      form.setValue('itens', itens);
    }
  };

  const handleBancoChange = (bancoId: string, index: number) => {
    // Encontrar o banco selecionado no array de bancos
    const bancoSelecionado = bancos.find(b => b.id === bancoId);
    if (bancoSelecionado) {
      console.log('Banco selecionado:', bancoSelecionado);
      
      // Armazenar o banco selecionado para trigger do useEffect
      setBancoSelecionadoAtual(bancoId);
      
      // Obter os detalhes de pagamento atuais
      const detalhesAtuais = form.getValues(`itens.${index}.detalhes_pagamento`) || {};
      
      // Criar objeto com informações do banco
      const detalhesBanco = {
        banco: bancoSelecionado.nome || '',
        banco_id: bancoSelecionado.id
      };
      
      // Para o caso específico do PIX, adicionar os detalhes de chave PIX
      if (detalhesAtuais && 'tipo_chave' in detalhesAtuais) {
        // Garantir que o tipo de chave seja válido
        const tipoChave = bancoSelecionado.tipo_chave_pix as 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
        
        // Atualizar detalhes específicos do PIX
        const novoDetalhes = {
          ...detalhesAtuais,
          ...detalhesBanco,
          tipo_chave: tipoChave || 'cpf',
          chave: bancoSelecionado.chave_pix || '',
        };
        
        console.log('Novos detalhes PIX:', novoDetalhes);
        
        // Atualizar detalhes no formulário
        form.setValue(`itens.${index}.detalhes_pagamento`, novoDetalhes, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        });
      } else {
        // Para outros métodos de pagamento, apenas adicionar os dados do banco
        const novoDetalhes = {
          ...detalhesAtuais,
          ...detalhesBanco
        };
        
        console.log('Novos detalhes:', novoDetalhes);
        
        // Atualizar detalhes no formulário
        form.setValue(`itens.${index}.detalhes_pagamento`, novoDetalhes, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        });
      }
      
      // Forçar a atualização de cada campo individualmente
      setTimeout(() => {
        // Obter todos os itens atuais
        const itens = [...form.getValues('itens')];
        
        // Garantir que o item existe e atualizar seus detalhes de pagamento
        if (itens[index]) {
          // Preservar os detalhes específicos do método de pagamento
          const detalhesAtualizados = form.getValues(`itens.${index}.detalhes_pagamento`);
          itens[index].detalhes_pagamento = detalhesAtualizados;
          
          // Aplicar todo o array de itens atualizado
          form.setValue('itens', [...itens], {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true
          });
        }
        
        // Forçar re-renderização do formulário
        form.trigger(`itens.${index}.detalhes_pagamento`);
        
        // Incrementar contador para forçar rerender
        setUpdateCounter(prev => prev + 1);
      }, 50);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      // Verificar se o código da proposta foi preenchido (apenas para novas receitas)
      if (!receita?.id && !codigoProposta.trim()) {
        toast.error('O código da Proposta tem que ser inserido');
        setIsLoading(false);
        return;
      }

      // Verificar se encontrou uma proposta pelo código informado (apenas para novas receitas)
      if (!receita?.id && !propostaEncontrada) {
        toast.error('Código inexistente ou não aprovado');
        setIsLoading(false);
        return;
      }
      
      // Se tem proposta vinculada, verificar se está aprovada
      if (values.proposta_id && !receita?.id) {
        const propostaAprovada = await verificarPropostaAprovada(values.proposta_id);
        if (!propostaAprovada) {
          toast.error('Código inexistente ou não aprovado');
          setIsLoading(false);
          return;
        }
      }
      
      // Verificar se a proposta já possui uma receita vinculada (para evitar duplicação)
      if (values.proposta_id && !receita?.id) {
        const propostaJaTemReceita = await verificarPropostaJaTemReceita(values.proposta_id);
        if (propostaJaTemReceita) {
          toast.error('Esta proposta já está vinculada a uma receita existente');
          setIsLoading(false);
          return;
        }
      }
      
      // Certificar-se que todos os campos obrigatórios estão presentes
      const itensFormatados = values.itens.map(item => {
        // Garantir que forma_pagamento_id e data_vencimento estão preenchidos (obrigatórios)
        if (!item.forma_pagamento_id) {
          toast.error('Selecione a forma de pagamento para todos os itens');
          throw new Error('Forma de pagamento é obrigatória para todos os itens');
        }
        
        if (!item.data_vencimento) {
          toast.error('Data de vencimento é obrigatória para todos os itens');
          throw new Error('Data de vencimento é obrigatória para todos os itens');
        }
        
        return {
          condicao_pagamento_id: item.condicao_pagamento_id,
          forma_pagamento_id: item.forma_pagamento_id,
          valor: Number(item.valor),
          data_vencimento: item.data_vencimento,
          data_pagamento: item.data_pagamento,
          parcela: item.parcela,
          total_parcelas: item.total_parcelas,
          taxa_juros: item.taxa_juros,
          detalhes_pagamento: item.detalhes_pagamento,
          descricao: item.descricao
        };
      });

      const receitaData: ReceitaFormValues = {
        proposta_id: values.proposta_id,
        categoria_id: values.categoria_id,
        descricao: values.descricao,
        observacoes: values.observacoes,
        itens: itensFormatados
      };

      if (receita?.id) {
        await atualizarReceita(receita.id, receitaData);
        toast.success('Receita atualizada com sucesso!');
      } else {
        await criarReceita(receitaData);
        toast.success('Receita criada com sucesso!');
      }

      onReceitaSalva();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      toast.error('Falha ao salvar receita');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormaPagamentoIcon = (nome?: string) => {
    if (!nome) return null;
    const nomeLower = nome.toLowerCase();
    
    if (nomeLower.includes('pix')) {
      return <div className="bg-green-100 p-2 rounded-full"><CreditCard className="h-4 w-4 text-green-600" /></div>;
    } else if (nomeLower.includes('cartão')) {
      return <div className="bg-blue-100 p-2 rounded-full"><CreditCard className="h-4 w-4 text-blue-600" /></div>;
    } else if (nomeLower.includes('boleto')) {
      return <div className="bg-yellow-100 p-2 rounded-full"><Landmark className="h-4 w-4 text-yellow-600" /></div>;
    }
    
    return <div className="bg-gray-100 p-2 rounded-full"><Wallet className="h-4 w-4 text-gray-600" /></div>;
  };

  // Componente reutilizável para seleção de banco
  const BancoSelector = ({ index }: { index: number }) => {
    return (
      <div>
        <Label className="text-gray-700">Banco</Label>
        <Select 
          key={`banco-select-${index}-${updateCounter}`}
          onValueChange={(value) => handleBancoChange(value, index)}
          value={(form.getValues(`itens.${index}.detalhes_pagamento`) as any)?.banco_id || ""}
        >
          <SelectTrigger className="border-gray-300 focus:border-erio-500 focus:ring-erio-500">
            <SelectValue placeholder="Selecione um banco" />
          </SelectTrigger>
          <SelectContent>
            {bancos.filter(banco => banco && banco.id).map(banco => (
              <SelectItem key={banco.id} value={banco.id || "default_id"}>
                {banco.nome || "Sem nome"} - Ag. {banco.agencia || "N/A"} Conta {banco.conta || "N/A"}
              </SelectItem>
            ))}
            {bancos.length === 0 && (
              <SelectItem value="no_banks">Nenhum banco disponível</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const BancoDisplay = ({ index }: { index: number }) => {
    return (
      <div>
        <Label className="text-gray-700">Banco</Label>
        <Input 
          key={`banco-nome-${index}-${updateCounter}`}
          value={(() => {
            const detalhes = form.getValues(`itens.${index}.detalhes_pagamento`) as any;
            return detalhes?.banco || "";
          })()}
          readOnly
          className="bg-gray-50 border-gray-300 focus:border-erio-500 focus:ring-erio-500"
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto" 
        aria-describedby="receita-form-description"
      >
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-2xl font-bold text-erio-600">
            {receita ? 'Editar Receita' : 'Nova Receita'}
          </DialogTitle>
          <DialogDescription id="receita-form-description" className="text-gray-500">
            {receita 
              ? 'Atualize os detalhes da receita' 
              : 'Preencha os detalhes para criar uma nova receita'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {/* Busca de proposta */}
            {!receita && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-sm">
                <h3 className="text-md font-medium mb-3 text-gray-700">Vincular a uma proposta</h3>
                <div className="space-y-2">
                  <Label htmlFor="codigo-proposta" className="text-gray-700">Código da Proposta <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      id="codigo-proposta"
                      placeholder="Ex: PROP001"
                      value={codigoProposta}
                      onChange={(e) => setCodigoProposta(e.target.value)}
                      className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                      required
                    />
                    <Button 
                      type="button" 
                      onClick={buscarProposta} 
                      disabled={isSearchingProposta || !codigoProposta.trim()}
                      className="bg-erio-600 hover:bg-erio-700"
                    >
                      {isSearchingProposta ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Buscar
                    </Button>
                  </div>
                  {!codigoProposta.trim() && (
                    <p className="text-xs text-red-500 mt-1">O código da Proposta tem que ser inserido</p>
                  )}
                </div>
              </div>
            )}

            {/* Informações da proposta encontrada */}
            {propostaEncontrada && (
              <Card className="border border-erio-200 bg-erio-50 shadow-sm overflow-hidden">
                <div className="bg-erio-600 px-4 py-2">
                  <h3 className="text-white font-medium">Proposta Vinculada</h3>
                </div>
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cliente</p>
                    <p className="font-medium text-gray-800">{propostaEncontrada.cliente?.nome || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Proposta</p>
                    <p className="font-medium text-gray-800">{propostaEncontrada.codigo} - {propostaEncontrada.titulo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="font-medium text-gray-800 capitalize">{propostaEncontrada.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor Total</p>
                    <p className="font-medium text-gray-800">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(propostaEncontrada.valor_total)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campos da receita */}
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <h3 className="text-md font-medium mb-4 text-gray-700 border-b pb-2">Informações Gerais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Categoria</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleCategoriaChange(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-erio-500 focus:ring-erio-500">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.filter(categoria => categoria && categoria.id).map(categoria => (
                            <SelectItem key={categoria.id} value={categoria.id || "default_id"}>
                              {categoria.nome || "Sem nome"}
                            </SelectItem>
                          ))}
                          {categorias.length === 0 && (
                            <SelectItem value="no_categories">Nenhuma categoria disponível</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Descrição</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Descrição da receita" 
                          className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
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
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <h3 className="text-md font-medium text-gray-700">Itens da Receita</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addItem}
                  className="border-erio-500 text-erio-600 hover:bg-erio-50"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
              
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar Itens de Receita"
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    className="pl-8 border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                  />
                </div>
              </div>

              <div className="p-4 space-y-4">
                {(termoPesquisa.trim() ? itensFiltrados : form.getValues('itens'))?.map((item, index) => {
                  // Encontrar o índice real do item no array original de itens
                  const originalIndex = termoPesquisa.trim() 
                    ? form.getValues('itens').findIndex(i => i === item)
                    : index;
                  
                  if (originalIndex === -1) return null;
                  
                  return (
                  <div key={originalIndex} className="border rounded-md overflow-hidden">
                    <div className="flex justify-between items-center bg-gray-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-gray-700">Item {originalIndex + 1}</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeItem(originalIndex)}
                        disabled={form.getValues('itens').length <= 1}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name={`itens.${originalIndex}.forma_pagamento_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Forma de Pagamento</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleFormaPagamentoChange(value, originalIndex);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-gray-300 focus:border-erio-500 focus:ring-erio-500">
                                    <SelectValue placeholder="Selecione uma forma de pagamento" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {formasPagamento.filter(forma => forma && forma.id).map(forma => (
                                    <SelectItem key={forma.id} value={forma.id || "default_id"}>
                                      <div className="flex items-center">
                                        {renderFormaPagamentoIcon(forma.nome)}
                                        <span className="ml-2">{forma.nome || "Forma de pagamento"}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  {formasPagamento.length === 0 && (
                                    <SelectItem value="no_payment_methods">Nenhuma forma de pagamento disponível</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`itens.${originalIndex}.valor`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Valor</FormLabel>
                              <FormControl>
                                {item.condicao_pagamento_id ? (
                                  <div className="p-2 border rounded-md bg-gray-50">
                                    <p className="font-medium text-green-600">
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(field.value)}
                                    </p>
                                    <input 
                                      type="hidden"
                                      value={field.value}
                                    />
                                  </div>
                                ) : (
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    min="0"
                                    value={field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    placeholder="0,00"
                                    className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                                  />
                                )}
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`itens.${originalIndex}.data_vencimento`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Data de Vencimento</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`itens.${originalIndex}.data_pagamento`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 flex items-center">
                                Data de Pagamento
                                <span className="text-xs ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Opcional</span>
                                {field.value && 
                                  <span className="text-xs ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Preenchida</span>
                                }
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    // Informamos visualmente que a data foi preenchida
                                    if (e.target.value) {
                                      toast.info("A data de pagamento foi preenchida. O sistema irá considerar este item como pago ao salvar.");
                                    }
                                  }}
                                  className={`border-gray-300 focus:border-erio-500 focus:ring-erio-500 ${
                                    field.value ? 'bg-green-50 border-green-300' : ''
                                  }`}
                                />
                              </FormControl>
                              {field.value ? (
                                <p className="text-xs text-green-600 mt-1 flex items-center">
                                  <span className="mr-1">✓</span> 
                                  Este item será considerado PAGO
                                </p>
                              ) : (
                                <p className="text-xs text-gray-500 mt-1">
                                  Ao preencher a data de pagamento, este item será considerado como <span className="font-semibold text-green-600">PAGO</span>
                                </p>
                              )}
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <FormField
                          control={form.control}
                          name={`itens.${originalIndex}.descricao`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Descrição do Item</FormLabel>
                              <FormControl>
                                {item.condicao_pagamento_id ? (
                                  <div className="p-2 border rounded-md bg-gray-50">
                                    <p className="text-gray-700">{field.value}</p>
                                    <input 
                                      type="hidden"
                                      value={field.value}
                                    />
                                  </div>
                                ) : (
                                  <Input 
                                    {...field} 
                                    placeholder="Descrição" 
                                    className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                                  />
                                )}
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Renderização dos campos de forma de pagamento */}
                      {/* Campos específicos para Cartão de Crédito */}
                      {mostrarDetalhesCartao && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="font-medium mb-3 text-gray-700 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                            Detalhes do Cartão de Crédito
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2 border-l-2 border-blue-100">
                            <div>
                              <Label className="text-gray-700">Parcelamento</Label>
                              <Select 
                                value={form.getValues(`itens.${originalIndex}.total_parcelas`)?.toString() || "1"}
                                onValueChange={(value) => handleParcelamentoChange(parseInt(value), originalIndex)}
                              >
                                <SelectTrigger className="border-gray-300 focus:border-erio-500 focus:ring-erio-500">
                                  <SelectValue placeholder="Número de parcelas" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num}x {num === 1 ? '(à vista)' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-gray-700">Taxa de Juros (%)</Label>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                value={form.getValues(`itens.${originalIndex}.taxa_juros`) || 0}
                                onChange={(e) => handleTaxaJurosChange(parseFloat(e.target.value) || 0, originalIndex)}
                                placeholder="0,00"
                                className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                              />
                            </div>
                            
                            <BancoSelector index={originalIndex} />
                            <BancoDisplay index={originalIndex} />
                          </div>
                        </div>
                      )}

                      {/* Campos específicos para PIX */}
                      {mostrarDetalhesPix && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="font-medium mb-3 text-gray-700 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-green-500" />
                            Detalhes do PIX
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2 border-l-2 border-green-100">
                            <BancoSelector index={originalIndex} />

                            <div>
                              <Label className="text-gray-700">Tipo de Chave</Label>
                              <Input 
                                key={`tipo-chave-${originalIndex}-${updateCounter}`}
                                value={(() => {
                                  const detalhes = form.getValues(`itens.${originalIndex}.detalhes_pagamento`) as DetalhesPagamentoPix;
                                  return detalhes?.tipo_chave || "";
                                })()}
                                readOnly
                                className="bg-gray-50 border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                              />
                            </div>

                            <div>
                              <Label className="text-gray-700">Chave PIX</Label>
                              <Input 
                                key={`chave-${originalIndex}-${updateCounter}`}
                                value={(() => {
                                  const detalhes = form.getValues(`itens.${originalIndex}.detalhes_pagamento`) as DetalhesPagamentoPix;
                                  return detalhes?.chave || "";
                                })()}
                                readOnly
                                className="bg-gray-50 border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                              />
                            </div>

                            <BancoDisplay index={originalIndex} />
                          </div>
                        </div>
                      )}

                      {/* Campos específicos para Boleto */}
                      {mostrarDetalhesBoleto && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="font-medium mb-3 text-gray-700 flex items-center">
                            <Landmark className="h-4 w-4 mr-2 text-yellow-500" />
                            Detalhes do Boleto
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2 border-l-2 border-yellow-100">
                            <BancoSelector index={originalIndex} />
                            <BancoDisplay index={originalIndex} />
                          </div>
                        </div>
                      )}

                      {/* Campos para outras formas de pagamento */}
                      {mostrarDetalhesOutros && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="font-medium mb-3 text-gray-700 flex items-center">
                            <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                            Detalhes da Forma de Pagamento
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2 border-l-2 border-gray-100">
                            <BancoSelector index={originalIndex} />
                            <BancoDisplay index={originalIndex} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full bg-erio-600 hover:bg-erio-700 text-white"
                disabled={isLoading || (!receita?.id && !propostaEncontrada)}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : receita ? 'Atualizar Receita' : 'Criar Receita'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 