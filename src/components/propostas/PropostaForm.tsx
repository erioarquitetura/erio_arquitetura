import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PropostaCompleta, PropostaResumoExecutivo, PropostaDescricaoProjeto, PropostaEtapaProjeto, PropostaCondicaoPagamento, ETAPAS_PROJETO_OPCOES } from "@/types/proposal";
import { Cliente } from "@/types";
import { formatarMoeda } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, FileText, Bold, Italic, Underline, List, Table, AlignLeft, AlignCenter, AlignRight, Sparkles, Check, Pencil, SpellCheck, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PropostaFormProps {
  onSave?: (proposta: PropostaCompleta) => void;
  onGenerateProposal?: (proposta: PropostaCompleta) => void;
  initialData?: PropostaCompleta;
  isEditing?: boolean;
  isSubmitting?: boolean;
}

export const PropostaForm = ({ onSave, onGenerateProposal, initialData, isEditing = false, isSubmitting = false }: PropostaFormProps) => {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [etapasDisponiveis, setEtapasDisponiveis] = useState<string[]>([...ETAPAS_PROJETO_OPCOES]);
  
  const [proposta, setProposta] = useState<PropostaCompleta>(
    initialData || {
      cliente_id: '',
      titulo: '',
      valor_total: 0,
      mesmo_endereco_cliente: false,
      resumo_executivo: [],
      descricao_projeto: [],
      etapas_projeto: [],
      condicoes_pagamento: []
    }
  );
  
  // Form fields for adding new items
  const [novoTopico, setNovoTopico] = useState('');
  const [novaArea, setNovaArea] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaMetragem, setNovaMetragem] = useState<number | ''>('');
  const [novaEtapa, setNovaEtapa] = useState<string | undefined>(undefined);
  const [novoValorEtapa, setNovoValorEtapa] = useState<number | ''>('');
  const [novaCondPagamentoDesc, setNovaCondPagamentoDesc] = useState('');
  const [novaCondPagamentoPct, setNovaCondPagamentoPct] = useState<number | ''>('');
  
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  
  // Estados para o modal de IA
  const [revisorIAAberto, setRevisorIAAberto] = useState(false);
  const [textoParaRevisar, setTextoParaRevisar] = useState('');
  const [tipoRevisao, setTipoRevisao] = useState<'ortografia' | 'formal' | 'informal' | null>(null);
  const [revisandoTexto, setRevisandoTexto] = useState(false);
  const [modoRevisao, setModoRevisao] = useState<'novo' | 'edicao'>('novo');
  const [indiceEmEdicao, setIndiceEmEdicao] = useState<number | null>(null);
  
  // Load clientes on component mount
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('ativo', true);
          
        if (error) {
          throw error;
        }
        
        // Transform Supabase data to match the Cliente type
        const clientesFormatados: Cliente[] = data.map(cliente => ({
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email || "",
          telefone: cliente.telefone || "",
          documento: cliente.documento || "",
          dataCriacao: cliente.data_criacao || "",
          dataAtualizacao: cliente.data_atualizacao || "",
          observacoes: cliente.observacoes,
          ativo: cliente.ativo,
          endereco: {
            logradouro: cliente.logradouro || "",
            numero: cliente.numero || "",
            complemento: cliente.complemento || "",
            bairro: cliente.bairro || "",
            cidade: cliente.cidade || "",
            estado: cliente.estado || "",
            cep: cliente.cep || ""
          }
        }));
        
        setClientes(clientesFormatados);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive"
        });
      }
    };
    
    fetchClientes();
  }, [toast]);
  
  // Update clienteSelecionado when cliente_id changes
  useEffect(() => {
    if (proposta.cliente_id) {
      const cliente = clientes.find(c => c.id === proposta.cliente_id);
      setClienteSelecionado(cliente || null);
      
      // If checked to use the same address, load it
      if (proposta.mesmo_endereco_cliente && cliente && cliente.endereco) {
        setProposta(prev => ({
          ...prev,
          endereco_interesse_cep: cliente.endereco.cep,
          endereco_interesse_logradouro: cliente.endereco.logradouro,
          endereco_interesse_numero: cliente.endereco.numero,
          endereco_interesse_complemento: cliente.endereco.complemento,
          endereco_interesse_bairro: cliente.endereco.bairro,
          endereco_interesse_cidade: cliente.endereco.cidade,
          endereco_interesse_estado: cliente.endereco.estado
        }));
      }
    }
  }, [proposta.cliente_id, proposta.mesmo_endereco_cliente, clientes]);
  
  // Calculate total value based on etapas_projeto
  useEffect(() => {
    const total = proposta.etapas_projeto.reduce((sum, etapa) => sum + etapa.valor, 0);
    setProposta(prev => ({ ...prev, valor_total: total }));
  }, [proposta.etapas_projeto]);
  
  // Handle endereco_interesse changes when mesmo_endereco_cliente is toggled
  const handleSameAddressToggle = (checked: boolean) => {
    setProposta(prev => ({
      ...prev,
      mesmo_endereco_cliente: checked,
      ...(checked && clienteSelecionado && clienteSelecionado.endereco ? {
        endereco_interesse_cep: clienteSelecionado.endereco.cep,
        endereco_interesse_logradouro: clienteSelecionado.endereco.logradouro,
        endereco_interesse_numero: clienteSelecionado.endereco.numero,
        endereco_interesse_complemento: clienteSelecionado.endereco.complemento,
        endereco_interesse_bairro: clienteSelecionado.endereco.bairro,
        endereco_interesse_cidade: clienteSelecionado.endereco.cidade,
        endereco_interesse_estado: clienteSelecionado.endereco.estado
      } : {
        endereco_interesse_cep: '',
        endereco_interesse_logradouro: '',
        endereco_interesse_numero: '',
        endereco_interesse_complemento: '',
        endereco_interesse_bairro: '',
        endereco_interesse_cidade: '',
        endereco_interesse_estado: ''
      })
    }));
  };
  
  // Handle adding a new resumo executivo topic
  const addResumoTopic = () => {
    if (!novoTopico.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O tópico não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }
    
    const newTopic: PropostaResumoExecutivo = {
      topico: novoTopico,
      ordem: proposta.resumo_executivo.length + 1
    };
    
    setProposta(prev => ({
      ...prev,
      resumo_executivo: [...prev.resumo_executivo, newTopic]
    }));
    
    setNovoTopico('');
  };
  
  // Funções para formatação de texto
  const aplicarFormatacao = (tipo: string) => {
    const textarea = document.getElementById('novo-topico') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoSelecionado = textarea.value.substring(start, end);
    let novoTexto = '';

    switch (tipo) {
      case 'negrito':
        novoTexto = `**${textoSelecionado}**`;
        break;
      case 'italico':
        novoTexto = `*${textoSelecionado}*`;
        break;
      case 'sublinhado':
        novoTexto = `_${textoSelecionado}_`;
        break;
      case 'lista':
        novoTexto = `\n- ${textoSelecionado}`;
        break;
      case 'tabela':
        novoTexto = `\n| Coluna 1 | Coluna 2 | Coluna 3 |\n| --- | --- | --- |\n| Item 1 | Item 2 | Item 3 |`;
        break;
      case 'alinhar-esquerda':
        novoTexto = `<div style="text-align: left">${textoSelecionado}</div>`;
        break;
      case 'alinhar-centro':
        novoTexto = `<div style="text-align: center">${textoSelecionado}</div>`;
        break;
      case 'alinhar-direita':
        novoTexto = `<div style="text-align: right">${textoSelecionado}</div>`;
        break;
      default:
        novoTexto = textoSelecionado;
    }

    const valorAntes = textarea.value.substring(0, start);
    const valorDepois = textarea.value.substring(end);
    
    setNovoTopico(valorAntes + novoTexto + valorDepois);
    
    // Restaura o foco ao textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + novoTexto.length,
        start + novoTexto.length
      );
    }, 0);
  };
  
  // Função para melhorar o texto usando IA
  const melhorarTextoComIA = async (texto: string): Promise<string> => {
    if (!texto.trim()) {
      return texto;
    }
    
    try {
      // Simular uma chamada de API para um serviço de IA
      // Em produção, isso seria uma chamada real para um serviço como OpenAI ou similar
      
      // Simulação do processamento de IA
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Algumas melhorias básicas no texto (simulação)
      let textoMelhorado = texto;
      
      // Corrigir pontuação
      textoMelhorado = textoMelhorado.replace(/\s+([.,;:!?])/g, '$1');
      
      // Primeira letra maiúscula
      textoMelhorado = textoMelhorado.charAt(0).toUpperCase() + textoMelhorado.slice(1);
      
      // Adicionar ponto final se não houver
      if (!/[.!?]$/.test(textoMelhorado)) {
        textoMelhorado += '.';
      }
      
      // Melhorar algumas palavras comuns (demonstração)
      textoMelhorado = textoMelhorado
        .replace(/muito bom/gi, 'excelente')
        .replace(/bonito/gi, 'elegante')
        .replace(/legal/gi, 'notável')
        .replace(/fazer/gi, 'realizar')
        .replace(/grande/gi, 'amplo');
      
      return textoMelhorado;
    } catch (error) {
      console.error('Erro ao melhorar texto com IA:', error);
      return texto; // Em caso de erro, retorna o texto original
    }
  };
  
  // Handle adding a new descricao projeto area
  const addDescricaoArea = () => {
    if (!novaArea.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da área não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }
    
    if (!novaDescricao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição não pode estar vazia.",
        variant: "destructive"
      });
      return;
    }
    
    if (novaMetragem === '' || novaMetragem <= 0) {
      toast({
        title: "Campo obrigatório",
        description: "A metragem deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }
    
    const newArea: PropostaDescricaoProjeto = {
      area: novaArea,
      descricao: novaDescricao,
      metragem: Number(novaMetragem),
      ordem: proposta.descricao_projeto.length + 1
    };
    
    setProposta(prev => ({
      ...prev,
      descricao_projeto: [...prev.descricao_projeto, newArea]
    }));
    
    setNovaArea('');
    setNovaDescricao('');
    setNovaMetragem('');
  };
  
  // Handle adding a new etapa projeto
  const addEtapaProjeto = () => {
    if (!novaEtapa) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione uma etapa do projeto.",
        variant: "destructive"
      });
      return;
    }
    
    const valor = novoValorEtapa === '' ? 0 : Number(novoValorEtapa);
    
    const newEtapa: PropostaEtapaProjeto = {
      nome: novaEtapa,
      valor: valor,
      ordem: proposta.etapas_projeto.length + 1
    };
    
    setProposta(prev => ({
      ...prev,
      etapas_projeto: [...prev.etapas_projeto, newEtapa]
    }));
    
    // Remove etapa from available options
    setEtapasDisponiveis(prev => prev.filter(etapa => etapa !== novaEtapa));
    
    setNovaEtapa(undefined);
    setNovoValorEtapa('');
  };
  
  // Handle adding a new payment condition
  const addCondicaoPagamento = () => {
    if (!novaCondPagamentoDesc.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição da condição de pagamento não pode estar vazia.",
        variant: "destructive"
      });
      return;
    }
    
    if (novaCondPagamentoPct === '' || novaCondPagamentoPct <= 0 || novaCondPagamentoPct > 100) {
      toast({
        title: "Valor inválido",
        description: "O percentual deve estar entre 1 e 100.",
        variant: "destructive"
      });
      return;
    }
    
    const valor = (proposta.valor_total * Number(novaCondPagamentoPct)) / 100;
    
    const newCondicao: PropostaCondicaoPagamento = {
      descricao: novaCondPagamentoDesc,
      percentual: Number(novaCondPagamentoPct),
      valor: valor,
      ordem: proposta.condicoes_pagamento.length + 1
    };
    
    setProposta(prev => ({
      ...prev,
      condicoes_pagamento: [...prev.condicoes_pagamento, newCondicao]
    }));
    
    setNovaCondPagamentoDesc('');
    setNovaCondPagamentoPct('');
  };
  
  // Calculate total percentage of payment conditions
  const totalPercentual = proposta.condicoes_pagamento.reduce((sum, cond) => sum + cond.percentual, 0);
  
  // Calculate total square meters
  const totalMetragem = proposta.descricao_projeto.reduce((sum, area) => sum + area.metragem, 0);
  
  // Handle CEP validation and address lookup
  const handleCepBlur = async (cep: string) => {
    if (!cep || cep.length !== 8) return;
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setProposta(prev => ({
          ...prev,
          endereco_interesse_logradouro: data.logradouro,
          endereco_interesse_bairro: data.bairro,
          endereco_interesse_cidade: data.localidade,
          endereco_interesse_estado: data.uf
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };
  
  // Handle generate proposal button
  const handleGenerateProposal = () => {
    // Validations
    if (!proposta.cliente_id) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione um cliente.",
        variant: "destructive"
      });
      return;
    }
    
    if (!proposta.titulo) {
      toast({
        title: "Campo obrigatório",
        description: "Informe um título para a proposta.",
        variant: "destructive"
      });
      return;
    }
    
    if (!proposta.endereco_interesse_cep) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o CEP do endereço de interesse.",
        variant: "destructive"
      });
      return;
    }
    
    if (proposta.resumo_executivo.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Adicione pelo menos um tópico no resumo executivo.",
        variant: "destructive"
      });
      return;
    }
    
    if (proposta.descricao_projeto.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Adicione pelo menos uma área na descrição do projeto.",
        variant: "destructive"
      });
      return;
    }
    
    if (proposta.etapas_projeto.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Adicione pelo menos uma etapa do projeto.",
        variant: "destructive"
      });
      return;
    }
    
    if (proposta.condicoes_pagamento.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Adicione pelo menos uma condição de pagamento.",
        variant: "destructive"
      });
      return;
    }
    
    if (totalPercentual !== 100) {
      toast({
        title: "Erro nas condições de pagamento",
        description: "A soma dos percentuais deve ser exatamente 100%.",
        variant: "destructive"
      });
      return;
    }
    
    if (onGenerateProposal) {
      onGenerateProposal(proposta);
    } else {
      toast({
        title: "Proposta pronta",
        description: "Proposta pronta para ser gerada."
      });
    }
  };
  
  // Funções para remover itens
  const removerResumoTopic = (index: number) => {
    const novoResumo = [...proposta.resumo_executivo];
    novoResumo.splice(index, 1);
    
    // Reajustar as ordens
    const reordenado = novoResumo.map((item, idx) => ({
      ...item,
      ordem: idx + 1
    }));
    
    setProposta(prev => ({
      ...prev,
      resumo_executivo: reordenado
    }));
    
    toast({
      title: "Item removido",
      description: "Tópico removido com sucesso."
    });
  };
  
  const removerDescricaoArea = (index: number) => {
    const novaDescricao = [...proposta.descricao_projeto];
    novaDescricao.splice(index, 1);
    
    // Reajustar as ordens
    const reordenado = novaDescricao.map((item, idx) => ({
      ...item,
      ordem: idx + 1
    }));
    
    setProposta(prev => ({
      ...prev,
      descricao_projeto: reordenado
    }));
    
    toast({
      title: "Item removido",
      description: "Área removida com sucesso."
    });
  };
  
  const removerEtapaProjeto = (index: number) => {
    const removida = proposta.etapas_projeto[index];
    
    // Adicionar de volta à lista de etapas disponíveis
    if (!etapasDisponiveis.includes(removida.nome)) {
      setEtapasDisponiveis(prev => [...prev, removida.nome]);
    }
    
    const novasEtapas = [...proposta.etapas_projeto];
    novasEtapas.splice(index, 1);
    
    // Reajustar as ordens
    const reordenado = novasEtapas.map((item, idx) => ({
      ...item,
      ordem: idx + 1
    }));
    
    setProposta(prev => ({
      ...prev,
      etapas_projeto: reordenado
    }));
    
    toast({
      title: "Item removido",
      description: "Etapa removida com sucesso."
    });
  };
  
  const removerCondicaoPagamento = (index: number) => {
    const novasCondicoes = [...proposta.condicoes_pagamento];
    novasCondicoes.splice(index, 1);
    
    // Reajustar as ordens
    const reordenado = novasCondicoes.map((item, idx) => ({
      ...item,
      ordem: idx + 1
    }));
    
    setProposta(prev => ({
      ...prev,
      condicoes_pagamento: reordenado
    }));
    
    toast({
      title: "Item removido",
      description: "Condição de pagamento removida com sucesso."
    });
  };
  
  // Estados para edição
  const [editandoResumo, setEditandoResumo] = useState<number | null>(null);
  const [editandoDescricao, setEditandoDescricao] = useState<number | null>(null);
  const [editandoEtapa, setEditandoEtapa] = useState<number | null>(null);
  const [editandoCondicao, setEditandoCondicao] = useState<number | null>(null);
  
  // Campos temporários para edição
  const [tempTopico, setTempTopico] = useState('');
  const [tempArea, setTempArea] = useState('');
  const [tempDescricao, setTempDescricao] = useState('');
  const [tempMetragem, setTempMetragem] = useState<number | ''>(0);
  const [tempEtapaNome, setTempEtapaNome] = useState('');
  const [tempEtapaValor, setTempEtapaValor] = useState<number | ''>(0);
  const [tempCondicaoDesc, setTempCondicaoDesc] = useState('');
  const [tempCondicaoPct, setTempCondicaoPct] = useState<number | ''>(0);
  
  // Funções para iniciar edição
  const iniciarEditarResumo = (index: number) => {
    setTempTopico(proposta.resumo_executivo[index].topico);
    setEditandoResumo(index);
  };
  
  const iniciarEditarDescricao = (index: number) => {
    const item = proposta.descricao_projeto[index];
    setTempArea(item.area);
    setTempDescricao(item.descricao);
    setTempMetragem(item.metragem);
    setEditandoDescricao(index);
  };
  
  const iniciarEditarEtapa = (index: number) => {
    const item = proposta.etapas_projeto[index];
    setTempEtapaNome(item.nome);
    setTempEtapaValor(item.valor);
    setEditandoEtapa(index);
  };
  
  const iniciarEditarCondicao = (index: number) => {
    const item = proposta.condicoes_pagamento[index];
    setTempCondicaoDesc(item.descricao);
    setTempCondicaoPct(item.percentual);
    setEditandoCondicao(index);
  };
  
  // Funções para salvar edições
  const salvarEdicaoResumo = () => {
    if (!tempTopico.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O tópico não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }
    
    if (editandoResumo !== null) {
      const novosItens = [...proposta.resumo_executivo];
      novosItens[editandoResumo].topico = tempTopico;
      
      setProposta(prev => ({
        ...prev,
        resumo_executivo: novosItens
      }));
      
      setEditandoResumo(null);
      setTempTopico('');
      
      toast({
        title: "Item atualizado",
        description: "Tópico atualizado com sucesso."
      });
    }
  };
  
  const salvarEdicaoDescricao = () => {
    if (!tempArea.trim() || !tempDescricao.trim() || tempMetragem === '' || tempMetragem <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos devem ser preenchidos corretamente.",
        variant: "destructive"
      });
      return;
    }
    
    if (editandoDescricao !== null) {
      const novosItens = [...proposta.descricao_projeto];
      novosItens[editandoDescricao] = {
        ...novosItens[editandoDescricao],
        area: tempArea,
        descricao: tempDescricao,
        metragem: Number(tempMetragem)
      };
      
      setProposta(prev => ({
        ...prev,
        descricao_projeto: novosItens
      }));
      
      setEditandoDescricao(null);
      setTempArea('');
      setTempDescricao('');
      setTempMetragem(0);
      
      toast({
        title: "Item atualizado",
        description: "Área atualizada com sucesso."
      });
    }
  };
  
  const salvarEdicaoEtapa = () => {
    if (tempEtapaValor === '' || tempEtapaValor < 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior ou igual a zero.",
        variant: "destructive"
      });
      return;
    }
    
    if (editandoEtapa !== null) {
      const novosItens = [...proposta.etapas_projeto];
      novosItens[editandoEtapa] = {
        ...novosItens[editandoEtapa],
        valor: Number(tempEtapaValor)
      };
      
      setProposta(prev => ({
        ...prev,
        etapas_projeto: novosItens
      }));
      
      setEditandoEtapa(null);
      setTempEtapaNome('');
      setTempEtapaValor(0);
      
      toast({
        title: "Item atualizado",
        description: "Etapa atualizada com sucesso."
      });
    }
  };
  
  const salvarEdicaoCondicao = () => {
    if (!tempCondicaoDesc.trim() || tempCondicaoPct === '' || tempCondicaoPct <= 0 || tempCondicaoPct > 100) {
      toast({
        title: "Campos inválidos",
        description: "Verifique se todos os campos estão preenchidos corretamente.",
        variant: "destructive"
      });
      return;
    }
    
    if (editandoCondicao !== null) {
      const novosItens = [...proposta.condicoes_pagamento];
      const valorCalculado = (proposta.valor_total * Number(tempCondicaoPct)) / 100;
      
      novosItens[editandoCondicao] = {
        ...novosItens[editandoCondicao],
        descricao: tempCondicaoDesc,
        percentual: Number(tempCondicaoPct),
        valor: valorCalculado
      };
      
      setProposta(prev => ({
        ...prev,
        condicoes_pagamento: novosItens
      }));
      
      setEditandoCondicao(null);
      setTempCondicaoDesc('');
      setTempCondicaoPct(0);
      
      toast({
        title: "Item atualizado",
        description: "Condição de pagamento atualizada com sucesso."
      });
    }
  };
  
  const cancelarEdicao = () => {
    setEditandoResumo(null);
    setEditandoDescricao(null);
    setEditandoEtapa(null);
    setEditandoCondicao(null);
    setTempTopico('');
    setTempArea('');
    setTempDescricao('');
    setTempMetragem(0);
    setTempEtapaNome('');
    setTempEtapaValor(0);
    setTempCondicaoDesc('');
    setTempCondicaoPct(0);
  };
  
  // Adicionar useEffect para configurar as etapas disponíveis quando estiver em modo de edição
  useEffect(() => {
    if (isEditing && initialData && initialData.etapas_projeto) {
      // Remover etapas já utilizadas da lista de disponíveis
      const etapasUtilizadas = initialData.etapas_projeto.map(etapa => etapa.nome);
      setEtapasDisponiveis(prev => 
        prev.filter(etapa => !etapasUtilizadas.includes(etapa))
      );
    }
  }, [isEditing, initialData]);
  
  // Aplicar formatação ao tópico em edição
  const aplicarFormatacaoEdicao = (tipo: string) => {
    const textarea = document.getElementById('editar-topico') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoSelecionado = textarea.value.substring(start, end);
    let novoTexto = '';

    switch (tipo) {
      case 'negrito':
        novoTexto = `**${textoSelecionado}**`;
        break;
      case 'italico':
        novoTexto = `*${textoSelecionado}*`;
        break;
      case 'sublinhado':
        novoTexto = `_${textoSelecionado}_`;
        break;
      case 'lista':
        novoTexto = `\n- ${textoSelecionado}`;
        break;
      case 'tabela':
        novoTexto = `\n| Coluna 1 | Coluna 2 | Coluna 3 |\n| --- | --- | --- |\n| Item 1 | Item 2 | Item 3 |`;
        break;
      case 'alinhar-esquerda':
        novoTexto = `<div style="text-align: left">${textoSelecionado}</div>`;
        break;
      case 'alinhar-centro':
        novoTexto = `<div style="text-align: center">${textoSelecionado}</div>`;
        break;
      case 'alinhar-direita':
        novoTexto = `<div style="text-align: right">${textoSelecionado}</div>`;
        break;
      default:
        novoTexto = textoSelecionado;
    }

    const valorAntes = textarea.value.substring(0, start);
    const valorDepois = textarea.value.substring(end);
    
    setTempTopico(valorAntes + novoTexto + valorDepois);
    
    // Restaura o foco ao textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + novoTexto.length,
        start + novoTexto.length
      );
    }, 0);
  };
  
  // Função para processar o texto com formatação
  const processarTextoFormatado = (texto: string) => {
    if (!texto) return '';
    
    // Processar negrito: **texto** -> <strong>texto</strong>
    let processado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Processar itálico: *texto* -> <em>texto</em>
    processado = processado.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Processar sublinhado: _texto_ -> <u>texto</u>
    processado = processado.replace(/_(.*?)_/g, '<u>$1</u>');
    
    // Processar listas: - item -> • item (com estilo de lista)
    processado = processado.replace(/\n- (.*?)(?=\n|$)/g, '<div class="flex gap-1 ml-2"><span class="bullet">•</span><span>$1</span></div>');
    
    // Processar tabelas: manter como está, mas adicionar classe para estilização
    if (processado.includes('| --- |')) {
      processado = processado.replace(/(\n\|.*\|.*\|\n\|.*\|.*\|\n\|.*\|.*\|)/g, 
        '<div class="my-2 border rounded overflow-x-auto">$1</div>');
      processado = processado.replace(/\|/g, ' | ');
    }
    
    // Quebras de linha
    processado = processado.replace(/\n/g, '<br/>');
    
    return processado;
  };
  
  // Função para abrir o modal de IA com o texto atual
  const abrirRevisorIA = (texto: string, modo: 'novo' | 'edicao' = 'novo', indice: number | null = null) => {
    setTextoParaRevisar(texto);
    setRevisorIAAberto(true);
    setModoRevisao(modo);
    setIndiceEmEdicao(indice);
    setTipoRevisao(null);
  };
  
  // Função para aplicar a revisão de texto com IA
  const aplicarRevisaoTexto = async () => {
    if (!tipoRevisao) {
      toast({
        title: "Selecione um tipo de revisão",
        description: "Escolha um tipo de revisão para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Iniciando revisão de texto...");
    console.log("Texto a revisar:", textoParaRevisar);
    console.log("Tipo de revisão:", tipoRevisao);
    
    setRevisandoTexto(true);
    
    try {
      // Simular um pequeno atraso para dar feedback ao usuário
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Inicializar variável antes de usá-la nas expressões condicionais
      let textoRevisado = textoParaRevisar;
      
      // Processamento de texto simples baseado no tipo de revisão
      if (tipoRevisao === 'ortografia') {
        // Correções ortográficas básicas
        textoRevisado = textoRevisado
          .replace(/nao/g, 'não')
          .replace(/voce/g, 'você')
          .replace(/esta/g, 'está')
          .replace(/(\s)e(\s)/g, '$1é$2')
          .replace(/(\s)a(\s)/g, '$1à$2')
          .replace(/pra/g, 'para')
          .replace(/q /g, 'que ')
          .replace(/vc/g, 'você');
        
        // Primeira letra maiúscula
        textoRevisado = textoRevisado.charAt(0).toUpperCase() + textoRevisado.slice(1);
        
        // Adicionar ponto final se não houver
        if (!/[.!?]$/.test(textoRevisado)) {
          textoRevisado += '.';
        }
      } 
      else if (tipoRevisao === 'formal') {
        // Correções ortográficas + formalização
        textoRevisado = textoRevisado
          .replace(/nao/g, 'não')
          .replace(/voce/g, 'você')
          .replace(/esta/g, 'está')
          .replace(/(\s)e(\s)/g, '$1é$2')
          .replace(/(\s)a(\s)/g, '$1à$2')
          .replace(/muito bom/gi, 'excelente')
          .replace(/legal/gi, 'adequado')
          .replace(/fazer/gi, 'realizar')
          .replace(/grande/gi, 'amplo')
          .replace(/a gente/gi, 'nós')
          .replace(/pra/gi, 'para')
          .replace(/coisa/gi, 'item')
          .replace(/cara/gi, 'aspecto');
        
        // Primeira letra maiúscula
        textoRevisado = textoRevisado.charAt(0).toUpperCase() + textoRevisado.slice(1);
        
        // Adicionar ponto final se não houver
        if (!/[.!?]$/.test(textoRevisado)) {
          textoRevisado += '.';
        }
      }
      else if (tipoRevisao === 'informal') {
        // Informalização
        textoRevisado = textoRevisado
          .replace(/realizar/gi, 'fazer')
          .replace(/amplo/gi, 'grande')
          .replace(/excelente/gi, 'muito bom')
          .replace(/nós/gi, 'a gente')
          .replace(/para que/gi, 'pra que')
          .replace(/para/gi, 'pra')
          .replace(/adequado/gi, 'legal')
          .replace(/obrigado/gi, 'valeu');
      }
      
      console.log("Texto revisado:", textoRevisado);
      
      // Atualizando o texto com base no modo
      if (modoRevisao === 'novo') {
        console.log("Aplicando texto ao novo tópico");
        setNovoTopico(textoRevisado);
      } else if (modoRevisao === 'edicao' && indiceEmEdicao !== null) {
        console.log("Aplicando texto à edição de tópico:", indiceEmEdicao);
        setTempTopico(textoRevisado);
      }
      
      setRevisorIAAberto(false);
      setTipoRevisao(null);
      
      toast({
        title: "Texto revisado com sucesso",
        description: "O revisor inteligente melhorou o seu texto.",
      });
      
    } catch (error) {
      console.error('Erro ao revisar texto:', error);
      
      toast({
        title: "Erro ao revisar texto",
        description: "Não foi possível revisar o texto no momento. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      console.log("Finalizada tentativa de revisão de texto");
      setRevisandoTexto(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isEditing ? "Editar Proposta" : "Nova Proposta"}</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => onSave?.(proposta)} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Salvar Alterações" : "Salvar Rascunho"}
              </>
            )}
          </Button>
          {!isEditing && (
            <Button 
              onClick={handleGenerateProposal}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Proposta
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="cliente" className="w-full">
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="cliente">Dados do Cliente</TabsTrigger>
              <TabsTrigger value="resumo">Resumo Executivo</TabsTrigger>
              <TabsTrigger value="descricao">Descrição do Projeto</TabsTrigger>
              <TabsTrigger value="etapas">Etapas do Projeto</TabsTrigger>
              <TabsTrigger value="precificacao">Precificação</TabsTrigger>
            </TabsList>
            
            {/* Tab: Dados do Cliente */}
            <TabsContent value="cliente" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Select 
                    value={proposta.cliente_id || undefined} 
                    onValueChange={(value) => setProposta(prev => ({ ...prev, cliente_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="titulo">Título da Proposta</Label>
                  <Input 
                    id="titulo" 
                    value={proposta.titulo}
                    onChange={(e) => setProposta(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Projeto Residencial Família Silva"
                  />
                </div>
              
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Endereço de Interesse</h3>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox 
                      id="mesmo-endereco" 
                      checked={proposta.mesmo_endereco_cliente}
                      onCheckedChange={handleSameAddressToggle}
                    />
                    <Label htmlFor="mesmo-endereco">Mesmo endereço do cliente</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input 
                        id="cep" 
                        value={proposta.endereco_interesse_cep || ''}
                        onChange={(e) => setProposta(prev => ({ ...prev, endereco_interesse_cep: e.target.value }))}
                        onBlur={(e) => handleCepBlur(e.target.value.replace(/\D/g, ''))}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input 
                        id="logradouro" 
                        value={proposta.endereco_interesse_logradouro || ''}
                        onChange={(e) => setProposta(prev => ({ ...prev, endereco_interesse_logradouro: e.target.value }))}
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="numero">Número</Label>
                      <Input 
                        id="numero" 
                        value={proposta.endereco_interesse_numero || ''}
                        onChange={(e) => setProposta(prev => ({ ...prev, endereco_interesse_numero: e.target.value }))}
                        placeholder="123"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input 
                        id="complemento" 
                        value={proposta.endereco_interesse_complemento || ''}
                        onChange={(e) => setProposta(prev => ({ ...prev, endereco_interesse_complemento: e.target.value }))}
                        placeholder="Apto, Sala, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input 
                        id="bairro" 
                        value={proposta.endereco_interesse_bairro || ''}
                        onChange={(e) => setProposta(prev => ({ ...prev, endereco_interesse_bairro: e.target.value }))}
                        placeholder="Bairro"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input 
                        id="cidade" 
                        value={proposta.endereco_interesse_cidade || ''}
                        onChange={(e) => setProposta(prev => ({ ...prev, endereco_interesse_cidade: e.target.value }))}
                        placeholder="Cidade"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="estado">Estado</Label>
                      <Input 
                        id="estado" 
                        value={proposta.endereco_interesse_estado || ''}
                        onChange={(e) => setProposta(prev => ({ ...prev, endereco_interesse_estado: e.target.value }))}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Tab: Resumo Executivo */}
            <TabsContent value="resumo" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Resumo Executivo do Projeto</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione os tópicos que irão compor o resumo executivo do projeto.
                </p>
                
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="novo-topico">Novo Tópico</Label>
                    
                    {/* Barra de ferramentas de formatação */}
                    <div className="flex items-center gap-1 mb-2 p-1 border rounded-md bg-slate-50">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => aplicarFormatacao('negrito')}
                        title="Negrito"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => aplicarFormatacao('italico')}
                        title="Itálico"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => aplicarFormatacao('sublinhado')}
                        title="Sublinhado"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <div className="border-r h-6 mx-1" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => aplicarFormatacao('lista')}
                        title="Lista"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => aplicarFormatacao('tabela')}
                        title="Tabela"
                      >
                        <Table className="h-4 w-4" />
                      </Button>
                      <div className="border-r h-6 mx-1" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => aplicarFormatacao('alinhar-esquerda')}
                        title="Alinhar à esquerda"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => aplicarFormatacao('alinhar-centro')}
                        title="Alinhar ao centro"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => aplicarFormatacao('alinhar-direita')}
                        title="Alinhar à direita"
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                      <div className="border-r h-6 mx-1" />
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 px-2 ml-auto gap-1 bg-indigo-500 hover:bg-indigo-600" 
                        title="Melhorar o texto com o Revisor Inteligente"
                        onClick={() => abrirRevisorIA(novoTopico, 'novo')}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="text-xs">IA</span>
                      </Button>
                    </div>
                    
                    <Textarea 
                      id="novo-topico" 
                      value={novoTopico}
                      onChange={(e) => setNovoTopico(e.target.value)}
                      placeholder="Descreva um tópico do resumo executivo"
                      rows={3}
                    />
                  </div>
                  <Button onClick={addResumoTopic} className="mb-0.5">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
                
                {proposta.resumo_executivo.length > 0 && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h4 className="font-medium">Tópicos Adicionados:</h4>
                    <ul className="space-y-3">
                      {proposta.resumo_executivo.map((item, index) => (
                        <li key={index} className="border-b pb-2 last:border-0">
                          {editandoResumo === index ? (
                            <div className="space-y-2">
                              {/* Barra de ferramentas de formatação para edição */}
                              <div className="flex items-center gap-1 mb-2 p-1 border rounded-md bg-slate-50">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => aplicarFormatacaoEdicao('negrito')}
                                  title="Negrito"
                                >
                                  <Bold className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => aplicarFormatacaoEdicao('italico')}
                                  title="Itálico"
                                >
                                  <Italic className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => aplicarFormatacaoEdicao('sublinhado')}
                                  title="Sublinhado"
                                >
                                  <Underline className="h-4 w-4" />
                                </Button>
                                <div className="border-r h-6 mx-1" />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => aplicarFormatacaoEdicao('lista')}
                                  title="Lista"
                                >
                                  <List className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => aplicarFormatacaoEdicao('tabela')}
                                  title="Tabela"
                                >
                                  <Table className="h-4 w-4" />
                                </Button>
                                <div className="border-r h-6 mx-1" />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => aplicarFormatacaoEdicao('alinhar-esquerda')}
                                  title="Alinhar à esquerda"
                                >
                                  <AlignLeft className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => aplicarFormatacaoEdicao('alinhar-centro')}
                                  title="Alinhar ao centro"
                                >
                                  <AlignCenter className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8" 
                                  onClick={() => aplicarFormatacaoEdicao('alinhar-direita')}
                                  title="Alinhar à direita"
                                >
                                  <AlignRight className="h-4 w-4" />
                                </Button>
                                <div className="border-r h-6 mx-1" />
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="h-8 px-2 ml-auto gap-1 bg-indigo-500 hover:bg-indigo-600" 
                                  title="Melhorar o texto com o Revisor Inteligente"
                                  onClick={() => abrirRevisorIA(tempTopico, 'edicao', editandoResumo)}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span className="text-xs">IA</span>
                                </Button>
                              </div>
                              <Textarea 
                                id="editar-topico"
                                value={tempTopico}
                                onChange={(e) => setTempTopico(e.target.value)}
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={cancelarEdicao}>
                                  Cancelar
                                </Button>
                                <Button variant="default" size="sm" onClick={salvarEdicaoResumo}>
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <span className="font-medium min-w-6">{index + 1}.</span>
                                <p dangerouslySetInnerHTML={{ __html: processarTextoFormatado(item.topico) }}></p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => iniciarEditarResumo(index)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removerResumoTopic(index)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Tab: Descrição do Projeto */}
            <TabsContent value="descricao" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Descrição do Projeto</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione as áreas que compõem o projeto, com suas respectivas descrições e metragens.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor="nova-area">Nome da Área</Label>
                    <Input 
                      id="nova-area" 
                      value={novaArea}
                      onChange={(e) => setNovaArea(e.target.value)}
                      placeholder="Ex: Sala de Estar"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nova-metragem">Metragem (m²)</Label>
                    <Input 
                      id="nova-metragem" 
                      type="number"
                      value={novaMetragem}
                      onChange={(e) => setNovaMetragem(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 25.5"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={addDescricaoArea} className="mt-auto">
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  
                  <div className="col-span-3">
                    <Label htmlFor="nova-descricao">Descrição da Área</Label>
                    <Textarea 
                      id="nova-descricao" 
                      value={novaDescricao}
                      onChange={(e) => setNovaDescricao(e.target.value)}
                      placeholder="Descreva os detalhes e características desta área"
                      rows={3}
                    />
                  </div>
                </div>
                
                {proposta.descricao_projeto.length > 0 && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h4 className="font-medium">Áreas Adicionadas:</h4>
                    <ul className="space-y-4">
                      {proposta.descricao_projeto.map((item, index) => (
                        <li key={index} className="border-b pb-3 last:border-0">
                          {editandoDescricao === index ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label>Nome da Área</Label>
                                  <Input 
                                    value={tempArea}
                                    onChange={(e) => setTempArea(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Metragem (m²)</Label>
                                  <Input 
                                    type="number"
                                    value={tempMetragem}
                                    onChange={(e) => setTempMetragem(e.target.value === '' ? '' : Number(e.target.value))}
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <Label>Descrição</Label>
                                  <Textarea 
                                    value={tempDescricao}
                                    onChange={(e) => setTempDescricao(e.target.value)}
                                    rows={2}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={cancelarEdicao}>
                                  Cancelar
                                </Button>
                                <Button variant="default" size="sm" onClick={salvarEdicaoDescricao}>
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h5 className="font-medium">{item.area} <span className="text-sm font-normal text-muted-foreground">({item.metragem} m²)</span></h5>
                                <p className="text-sm whitespace-pre-wrap">{item.descricao}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => iniciarEditarDescricao(index)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removerDescricaoArea(index)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="border-t pt-3 flex justify-end">
                      <p className="font-medium">Total: <span>{totalMetragem.toFixed(2)} m²</span></p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Tab: Etapas do Projeto */}
            <TabsContent value="etapas" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Etapas do Projeto</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione as etapas que farão parte do projeto, com seus respectivos valores.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor="nova-etapa">Etapa</Label>
                    <Select 
                      value={novaEtapa} 
                      onValueChange={setNovaEtapa}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {etapasDisponiveis.map(etapa => (
                          <SelectItem key={etapa} value={etapa}>
                            {etapa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="novo-valor-etapa">Valor (R$)</Label>
                    <Input 
                      id="novo-valor-etapa" 
                      type="number"
                      value={novoValorEtapa}
                      onChange={(e) => setNovoValorEtapa(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 2500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={addEtapaProjeto} className="mt-auto">
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>
                
                {proposta.etapas_projeto.length > 0 && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h4 className="font-medium">Etapas Adicionadas:</h4>
                    <ul className="space-y-2">
                      {proposta.etapas_projeto.map((item, index) => (
                        <li key={index} className="border-b pb-2 last:border-0">
                          {editandoEtapa === index ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label>Etapa</Label>
                                  <Input 
                                    value={tempEtapaNome}
                                    disabled
                                  />
                                </div>
                                <div>
                                  <Label>Valor (R$)</Label>
                                  <Input 
                                    type="number"
                                    value={tempEtapaValor}
                                    onChange={(e) => setTempEtapaValor(e.target.value === '' ? '' : Number(e.target.value))}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={cancelarEdicao}>
                                  Cancelar
                                </Button>
                                <Button variant="default" size="sm" onClick={salvarEdicaoEtapa}>
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.nome}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {item.valor > 0 
                                    ? formatarMoeda(item.valor) 
                                    : "Sem custo adicional"}
                                </span>
                                <div className="flex gap-2 shrink-0">
                                  <Button variant="ghost" size="icon" onClick={() => iniciarEditarEtapa(index)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => removerEtapaProjeto(index)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="border-t pt-3 flex justify-end">
                      <p className="font-medium">Total: <span>{formatarMoeda(proposta.valor_total)}</span></p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Tab: Precificação */}
            <TabsContent value="precificacao" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Precificação</h3>
                
                <div className="bg-muted p-4 rounded-md flex flex-col items-center justify-center">
                  <p className="text-sm text-muted-foreground">Valor Total da Proposta</p>
                  <p className="text-3xl font-bold">{formatarMoeda(proposta.valor_total)}</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Condições de Pagamento</h4>
                  <p className="text-sm text-muted-foreground">
                    Adicione as condições de pagamento da proposta (a soma dos percentuais deve ser 100%).
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label htmlFor="nova-cond-desc">Descrição</Label>
                      <Input 
                        id="nova-cond-desc" 
                        value={novaCondPagamentoDesc}
                        onChange={(e) => setNovaCondPagamentoDesc(e.target.value)}
                        placeholder="Ex: Entrada na assinatura do contrato"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nova-cond-pct">Percentual (%)</Label>
                      <Input 
                        id="nova-cond-pct" 
                        type="number"
                        value={novaCondPagamentoPct}
                        onChange={(e) => setNovaCondPagamentoPct(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: 30"
                        max={100}
                        min={0}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button onClick={addCondicaoPagamento} className="mt-auto">
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>
                  
                  {proposta.condicoes_pagamento.length > 0 && (
                    <div className="border rounded-md p-4 space-y-4">
                      <h4 className="font-medium">Condições de Pagamento Adicionadas:</h4>
                      <ul className="space-y-2">
                        {proposta.condicoes_pagamento.map((item, index) => (
                          <li key={index} className="border-b pb-2 last:border-0">
                            {editandoCondicao === index ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label>Descrição</Label>
                                    <Input 
                                      value={tempCondicaoDesc}
                                      onChange={(e) => setTempCondicaoDesc(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label>Percentual (%)</Label>
                                    <Input 
                                      type="number"
                                      value={tempCondicaoPct}
                                      onChange={(e) => setTempCondicaoPct(e.target.value === '' ? '' : Number(e.target.value))}
                                      max={100}
                                      min={0}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={cancelarEdicao}>
                                    Cancelar
                                  </Button>
                                  <Button variant="default" size="sm" onClick={salvarEdicaoCondicao}>
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span>{item.descricao}</span>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <span className="font-medium mr-2">{formatarMoeda(item.valor)}</span>
                                    <span className="text-sm text-muted-foreground">({item.percentual}%)</span>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <Button variant="ghost" size="icon" onClick={() => iniciarEditarCondicao(index)}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                      </svg>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => removerCondicaoPagamento(index)}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      </svg>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="border-t pt-3 flex justify-between items-center">
                        <div className={`${totalPercentual === 100 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                          Total: {totalPercentual}%
                        </div>
                        <p className="font-medium">
                          {formatarMoeda(proposta.condicoes_pagamento.reduce((acc, item) => acc + item.valor, 0))}
                        </p>
                      </div>
                      
                      {totalPercentual !== 100 && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                          Atenção: A soma dos percentuais deve ser exatamente 100%. Atualmente está em {totalPercentual}%.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Modal do Revisor Inteligente */}
      <Dialog open={revisorIAAberto} onOpenChange={setRevisorIAAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-semibold text-lg">Melhorando sua mensagem</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 border-y border-gray-200">
            {textoParaRevisar ? (
              <p className="text-sm text-gray-700">{textoParaRevisar}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">Para realizar algum ajuste, é necessário redigir o texto na tela anterior</p>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button 
              variant={tipoRevisao === 'ortografia' ? 'default' : 'outline'} 
              size="sm"
              className="gap-1.5 h-9 px-4"
              onClick={() => {
                console.log("Botão Ortografia clicado");
                setTipoRevisao('ortografia');
              }}
              disabled={revisandoTexto || !textoParaRevisar.trim()}
            >
              <SpellCheck className="h-4 w-4" />
              <span>Ortografia e concordância</span>
            </Button>
            
            <Button 
              variant={tipoRevisao === 'formal' ? 'default' : 'outline'} 
              size="sm"
              className="gap-1.5 h-9 px-4"
              onClick={() => {
                console.log("Botão Formal clicado");
                setTipoRevisao('formal');
              }}
              disabled={revisandoTexto || !textoParaRevisar.trim()}
            >
              <Pencil className="h-4 w-4" />
              <span>Formal</span>
            </Button>
            
            <Button 
              variant={tipoRevisao === 'informal' ? 'default' : 'outline'} 
              size="sm"
              className="gap-1.5 h-9 px-4"
              onClick={() => {
                console.log("Botão Informal clicado");
                setTipoRevisao('informal');
              }}
              disabled={revisandoTexto || !textoParaRevisar.trim()}
            >
              <Wand2 className="h-4 w-4" />
              <span>Informal</span>
            </Button>
          </div>
          
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevisorIAAberto(false)}
              disabled={revisandoTexto}
              className="h-9"
            >
              Cancelar
            </Button>
            
            <Button
              type="button"
              variant="default"
              onClick={() => {
                console.log("Botão Usar clicado com tipo de revisão:", tipoRevisao);
                aplicarRevisaoTexto();
              }}
              disabled={revisandoTexto || !tipoRevisao || !textoParaRevisar.trim()}
              className="gap-1.5 h-9"
            >
              {revisandoTexto ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                  <span>Revisando...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Usar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
