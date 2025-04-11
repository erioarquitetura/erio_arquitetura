import { supabase } from "@/integrations/supabase/client";
import { PropostaCompleta } from "@/types/proposal";
import { PropostaBasica } from "@/types/proposta";
import { Cliente } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { criarNotificacaoPropostaInteracao } from "./notificacaoService";

/**
 * Gera um código de proposta no formato "XX-NNN/AAAA" onde:
 * XX = Iniciais do cliente (ex: "Maria Santos" -> "MS")
 * NNN = Número sequencial com zeros à esquerda (001, 002, etc.)
 * AAAA = Ano atual
 */
export const gerarCodigoPropostaAutomatico = async (clienteId: string): Promise<string> => {
  try {
    // 1. Buscar o cliente para obter o nome
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('nome')
      .eq('id', clienteId)
      .single();
      
    if (clienteError) throw clienteError;
    if (!cliente) throw new Error('Cliente não encontrado');
    
    // 2. Extrair iniciais do nome do cliente (ex: "Maria Santos" -> "MS")
    const nomeCompleto = cliente.nome;
    let iniciais = "";
    
    // Dividir o nome em partes e pegar a primeira letra de cada parte
    const partes = nomeCompleto.split(' ').filter(p => p.length > 0);
    
    if (partes.length >= 2) {
      // Se tiver pelo menos nome e sobrenome, pega a primeira letra de cada
      iniciais = partes[0].charAt(0) + partes[partes.length - 1].charAt(0);
    } else if (partes.length === 1) {
      // Se for só um nome, pega as duas primeiras letras
      iniciais = partes[0].substring(0, 2);
    } else {
      iniciais = "XX"; // Fallback
    }
    
    iniciais = iniciais.toUpperCase();
    
    // 3. Obter o ano atual
    const anoAtual = new Date().getFullYear();
    
    // 4. Buscar o último número sequencial usado este ano
    const { data: ultimasPropostas, error: propostaError } = await supabase
      .from('propostas')
      .select('codigo')
      .ilike('codigo', `%/${anoAtual}`)
      .order('codigo', { ascending: false });
      
    if (propostaError) throw propostaError;
    
    // 5. Determinar o próximo número sequencial
    let sequencial = 1;
    
    if (ultimasPropostas && ultimasPropostas.length > 0) {
      // Percorrer as propostas buscando pelo padrão XX-NNN/AAAA
      for (const proposta of ultimasPropostas) {
        const match = proposta.codigo.match(/\-(\d+)\//);
        if (match && match[1]) {
          const num = parseInt(match[1]);
          if (num >= sequencial) {
            sequencial = num + 1;
          }
        }
      }
    }
    
    // 6. Formatar o código da proposta com zeros à esquerda (001, 002, etc.)
    const sequencialFormatado = String(sequencial).padStart(3, '0');
    
    // 7. Montar o código final
    const codigo = `${iniciais}-${sequencialFormatado}/${anoAtual}`;
    
    return codigo;
  } catch (error) {
    console.error('Erro ao gerar código da proposta:', error);
    throw error;
  }
};

export const createProposta = async (proposta: PropostaCompleta): Promise<string | null> => {
  try {
    // Gerar código de proposta automaticamente com base no cliente
    const codigo = await gerarCodigoPropostaAutomatico(proposta.cliente_id);
    
    // Insert the main proposal
    const { data: propostaData, error: propostaError } = await supabase
      .from('propostas')
      .insert({
        codigo,
        cliente_id: proposta.cliente_id,
        titulo: proposta.titulo,
        data_validade: proposta.data_validade,
        valor_total: proposta.valor_total,
        endereco_interesse_cep: proposta.endereco_interesse_cep,
        endereco_interesse_logradouro: proposta.endereco_interesse_logradouro,
        endereco_interesse_numero: proposta.endereco_interesse_numero,
        endereco_interesse_complemento: proposta.endereco_interesse_complemento,
        endereco_interesse_bairro: proposta.endereco_interesse_bairro,
        endereco_interesse_cidade: proposta.endereco_interesse_cidade,
        endereco_interesse_estado: proposta.endereco_interesse_estado,
        mesmo_endereco_cliente: proposta.mesmo_endereco_cliente,
        status: 'rascunho'
      })
      .select('id')
      .single();
    
    if (propostaError) throw propostaError;
    const propostaId = propostaData?.id;
    
    if (!propostaId) {
      throw new Error('Falha ao obter ID da proposta');
    }
    
    // Insert resumo executivo items
    if (proposta.resumo_executivo.length > 0) {
      const resumoItems = proposta.resumo_executivo.map(item => ({
        proposta_id: propostaId,
        topico: item.topico,
        ordem: item.ordem
      }));
      
      const { error: resumoError } = await supabase
        .from('proposta_resumo_executivo')
        .insert(resumoItems);
        
      if (resumoError) throw resumoError;
    }
    
    // Insert descrição projeto items
    if (proposta.descricao_projeto.length > 0) {
      const descricaoItems = proposta.descricao_projeto.map(item => ({
        proposta_id: propostaId,
        area: item.area,
        descricao: item.descricao,
        metragem: item.metragem,
        ordem: item.ordem
      }));
      
      const { error: descricaoError } = await supabase
        .from('proposta_descricao_projeto')
        .insert(descricaoItems);
        
      if (descricaoError) throw descricaoError;
    }
    
    // Insert etapas projeto items
    if (proposta.etapas_projeto.length > 0) {
      const etapasItems = proposta.etapas_projeto.map(item => ({
        proposta_id: propostaId,
        nome: item.nome,
        valor: item.valor,
        ordem: item.ordem
      }));
      
      const { error: etapasError } = await supabase
        .from('proposta_etapas_projeto')
        .insert(etapasItems);
        
      if (etapasError) throw etapasError;
    }
    
    // Insert condições pagamento items
    if (proposta.condicoes_pagamento.length > 0) {
      const condicoesItems = proposta.condicoes_pagamento.map(item => ({
        proposta_id: propostaId,
        percentual: item.percentual,
        descricao: item.descricao,
        valor: item.valor,
        ordem: item.ordem
      }));
      
      const { error: condicoesError } = await supabase
        .from('proposta_condicoes_pagamento')
        .insert(condicoesItems);
        
      if (condicoesError) throw condicoesError;
    }
    
    toast.success(`Proposta ${codigo} criada com sucesso!`);
    return propostaId;
  } catch (error) {
    console.error('Erro ao criar proposta:', error);
    toast.error('Erro ao criar proposta. Tente novamente.');
    return null;
  }
};

export const getPropostaCompleta = async (propostaId: string): Promise<PropostaCompleta | null> => {
  try {
    // Get the main proposal data
    const { data: propostaData, error: propostaError } = await supabase
      .from('propostas')
      .select(`
        *,
        cliente:cliente_id (*)
      `)
      .eq('id', propostaId)
      .single();
      
    if (propostaError) throw propostaError;
    
    // Get resumo executivo items
    const { data: resumoData, error: resumoError } = await supabase
      .from('proposta_resumo_executivo')
      .select('*')
      .eq('proposta_id', propostaId)
      .order('ordem', { ascending: true });
      
    if (resumoError) throw resumoError;
    
    // Get descrição projeto items
    const { data: descricaoData, error: descricaoError } = await supabase
      .from('proposta_descricao_projeto')
      .select('*')
      .eq('proposta_id', propostaId)
      .order('ordem', { ascending: true });
      
    if (descricaoError) throw descricaoError;
    
    // Get etapas projeto items
    const { data: etapasData, error: etapasError } = await supabase
      .from('proposta_etapas_projeto')
      .select('*')
      .eq('proposta_id', propostaId)
      .order('ordem', { ascending: true });
      
    if (etapasError) throw etapasError;
    
    // Get condições pagamento items
    const { data: condicoesData, error: condicoesError } = await supabase
      .from('proposta_condicoes_pagamento')
      .select('*')
      .eq('proposta_id', propostaId)
      .order('ordem', { ascending: true });
      
    if (condicoesError) throw condicoesError;
    
    // Transform the database status to the expected type
    let statusTyped: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'vencida' = 'rascunho';
    if (propostaData.status === 'enviada') statusTyped = 'enviada';
    else if (propostaData.status === 'aprovada') statusTyped = 'aprovada';
    else if (propostaData.status === 'rejeitada') statusTyped = 'rejeitada';
    else if (propostaData.status === 'vencida') statusTyped = 'vencida';
    
    // Transform cliente data to match Cliente type
    const clienteData = propostaData.cliente;
    const cliente: Cliente = {
      id: clienteData.id,
      nome: clienteData.nome,
      email: clienteData.email || "",
      telefone: clienteData.telefone || "",
      documento: clienteData.documento || "",
      dataCriacao: clienteData.data_criacao || "",
      dataAtualizacao: clienteData.data_atualizacao || "",
      observacoes: clienteData.observacoes,
      ativo: clienteData.ativo,
      endereco: {
        logradouro: clienteData.logradouro || "",
        numero: clienteData.numero || "",
        complemento: clienteData.complemento || "",
        bairro: clienteData.bairro || "",
        cidade: clienteData.cidade || "",
        estado: clienteData.estado || "",
        cep: clienteData.cep || ""
      }
    };
    
    const propostaCompleta: PropostaCompleta = {
      ...propostaData,
      status: statusTyped,
      cliente,
      resumo_executivo: resumoData || [],
      descricao_projeto: descricaoData || [],
      etapas_projeto: etapasData || [],
      condicoes_pagamento: condicoesData || []
    };
    
    return propostaCompleta;
  } catch (error) {
    console.error('Erro ao buscar proposta completa:', error);
    return null;
  }
};

export const listarPropostas = async () => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select(`
        *,
        cliente:cliente_id (nome)
      `)
      .order('data_criacao', { ascending: false });
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    return [];
  }
};

export const updateProposta = async (propostaId: string, proposta: PropostaCompleta): Promise<boolean> => {
  try {
    // Atualizar a proposta principal
    const { error: propostaError } = await supabase
      .from('propostas')
      .update({
        cliente_id: proposta.cliente_id,
        titulo: proposta.titulo,
        data_validade: proposta.data_validade,
        valor_total: proposta.valor_total,
        endereco_interesse_cep: proposta.endereco_interesse_cep,
        endereco_interesse_logradouro: proposta.endereco_interesse_logradouro,
        endereco_interesse_numero: proposta.endereco_interesse_numero,
        endereco_interesse_complemento: proposta.endereco_interesse_complemento,
        endereco_interesse_bairro: proposta.endereco_interesse_bairro,
        endereco_interesse_cidade: proposta.endereco_interesse_cidade,
        endereco_interesse_estado: proposta.endereco_interesse_estado,
        mesmo_endereco_cliente: proposta.mesmo_endereco_cliente,
        status: proposta.status
      })
      .eq('id', propostaId);
      
    if (propostaError) throw propostaError;
    
    // Remover itens relacionados e inserir novos
    // 1. Resumo Executivo
    const { error: deleteResumoError } = await supabase
      .from('proposta_resumo_executivo')
      .delete()
      .eq('proposta_id', propostaId);
      
    if (deleteResumoError) throw deleteResumoError;
    
    if (proposta.resumo_executivo.length > 0) {
      const resumoItems = proposta.resumo_executivo.map(item => ({
        proposta_id: propostaId,
        topico: item.topico,
        ordem: item.ordem
      }));
      
      const { error: insertResumoError } = await supabase
        .from('proposta_resumo_executivo')
        .insert(resumoItems);
        
      if (insertResumoError) throw insertResumoError;
    }
    
    // 2. Descrição Projeto
    const { error: deleteDescricaoError } = await supabase
      .from('proposta_descricao_projeto')
      .delete()
      .eq('proposta_id', propostaId);
      
    if (deleteDescricaoError) throw deleteDescricaoError;
    
    if (proposta.descricao_projeto.length > 0) {
      const descricaoItems = proposta.descricao_projeto.map(item => ({
        proposta_id: propostaId,
        area: item.area,
        descricao: item.descricao,
        metragem: item.metragem,
        ordem: item.ordem
      }));
      
      const { error: insertDescricaoError } = await supabase
        .from('proposta_descricao_projeto')
        .insert(descricaoItems);
        
      if (insertDescricaoError) throw insertDescricaoError;
    }
    
    // 3. Etapas Projeto
    const { error: deleteEtapasError } = await supabase
      .from('proposta_etapas_projeto')
      .delete()
      .eq('proposta_id', propostaId);
      
    if (deleteEtapasError) throw deleteEtapasError;
    
    if (proposta.etapas_projeto.length > 0) {
      const etapasItems = proposta.etapas_projeto.map(item => ({
        proposta_id: propostaId,
        nome: item.nome,
        valor: item.valor,
        ordem: item.ordem
      }));
      
      const { error: insertEtapasError } = await supabase
        .from('proposta_etapas_projeto')
        .insert(etapasItems);
        
      if (insertEtapasError) throw insertEtapasError;
    }
    
    // 4. Condições Pagamento
    const { error: deleteCondicoesError } = await supabase
      .from('proposta_condicoes_pagamento')
      .delete()
      .eq('proposta_id', propostaId);
      
    if (deleteCondicoesError) throw deleteCondicoesError;
    
    if (proposta.condicoes_pagamento.length > 0) {
      const condicoesItems = proposta.condicoes_pagamento.map(item => ({
        proposta_id: propostaId,
        percentual: item.percentual,
        descricao: item.descricao,
        valor: item.valor,
        ordem: item.ordem
      }));
      
      const { error: insertCondicoesError } = await supabase
        .from('proposta_condicoes_pagamento')
        .insert(condicoesItems);
        
      if (insertCondicoesError) throw insertCondicoesError;
    }
    
    toast.success("Proposta atualizada com sucesso!");
    return true;
  } catch (error) {
    console.error('Erro ao atualizar proposta:', error);
    toast.error("Erro ao atualizar proposta. Tente novamente.");
    return false;
  }
};

export const deleteProposta = async (propostaId: string): Promise<boolean> => {
  try {
    // Excluir itens relacionados primeiro (devido a restrições de chave estrangeira)
    // 1. Resumo Executivo
    const { error: deleteResumoError } = await supabase
      .from('proposta_resumo_executivo')
      .delete()
      .eq('proposta_id', propostaId);
      
    if (deleteResumoError) throw deleteResumoError;
    
    // 2. Descrição Projeto
    const { error: deleteDescricaoError } = await supabase
      .from('proposta_descricao_projeto')
      .delete()
      .eq('proposta_id', propostaId);
      
    if (deleteDescricaoError) throw deleteDescricaoError;
    
    // 3. Etapas Projeto
    const { error: deleteEtapasError } = await supabase
      .from('proposta_etapas_projeto')
      .delete()
      .eq('proposta_id', propostaId);
      
    if (deleteEtapasError) throw deleteEtapasError;
    
    // 4. Condições Pagamento
    const { error: deleteCondicoesError } = await supabase
      .from('proposta_condicoes_pagamento')
      .delete()
      .eq('proposta_id', propostaId);
      
    if (deleteCondicoesError) throw deleteCondicoesError;
    
    // 5. Finalmente, excluir a proposta
    const { error: deletePropostaError } = await supabase
      .from('propostas')
      .delete()
      .eq('id', propostaId);
      
    if (deletePropostaError) throw deletePropostaError;
    
    toast.success("Proposta excluída com sucesso!");
    return true;
  } catch (error) {
    console.error('Erro ao excluir proposta:', error);
    toast.error("Erro ao excluir proposta. Tente novamente.");
    return false;
  }
};

export const getPropostas = async (): Promise<PropostaBasica[]> => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select(`
        id, 
        codigo, 
        cliente_id, 
        clientes(nome), 
        titulo, 
        data_criacao, 
        data_validade, 
        valor_total, 
        status
      `)
      .order('data_criacao', { ascending: false });
      
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      codigo: item.codigo,
      cliente_id: item.cliente_id,
      cliente_nome: item.clientes?.nome || 'Cliente não encontrado',
      titulo: item.titulo,
      data_criacao: item.data_criacao,
      data_validade: item.data_validade,
      valor_total: item.valor_total,
      status: item.status
    }));
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    return [];
  }
};

/**
 * Gera um link de compartilhamento para a proposta
 * Usa um identificador simples baseado no ID da proposta
 */
export const gerarLinkCompartilhamento = async (propostaId: string): Promise<string | null> => {
  try {
    // Verificar se a proposta existe
    const { data: proposta, error: propostaError } = await supabase
      .from('propostas')
      .select('id, codigo, status')
      .eq('id', propostaId)
      .single();
    
    if (propostaError || !proposta) {
      console.error('Proposta não encontrada:', propostaError);
      return null;
    }
    
    // Se a proposta estiver em rascunho, atualizar status para 'enviada'
    if (proposta.status === 'rascunho') {
      const { error: statusError } = await supabase
        .from('propostas')
        .update({
          status: 'enviada',
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', propostaId);
      
      if (statusError) {
        console.error('Erro ao atualizar status da proposta:', statusError);
        // Continuar mesmo com o erro
      }
    }
    
    // Gerar token simples: codificar o ID da proposta em base64
    const token = btoa(`proposta-${propostaId}-${proposta.codigo}`);
    
    return token;
  } catch (error) {
    console.error('Erro ao gerar link de compartilhamento:', error);
    return null;
  }
};

/**
 * Valida um token de compartilhamento de proposta
 * Retorna o ID da proposta se o token for válido
 */
export const validarTokenCompartilhamento = async (token: string): Promise<{
  valido: boolean;
  propostaId?: string;
}> => {
  try {
    // Decodificar o token
    const decodedToken = atob(token);
    
    // Verificar formato: proposta-ID-CODIGO
    const matches = decodedToken.match(/^proposta-([a-f0-9-]+)-(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return { valido: false };
    }
    
    const propostaId = matches[1];
    const codigoProposta = matches[2];
    
    // Verificar se a proposta existe com esse ID e código
    const { data: proposta, error } = await supabase
      .from('propostas')
      .select('id, codigo')
      .eq('id', propostaId)
      .eq('codigo', codigoProposta)
      .single();
    
    if (error || !proposta) {
      console.error('Proposta não encontrada ou token inválido:', error);
      return { valido: false };
    }
    
    return {
      valido: true,
      propostaId
    };
  } catch (error) {
    console.error('Erro ao validar token de compartilhamento:', error);
    return { valido: false };
  }
};

/**
 * Atualiza o status da proposta para aprovada ou rejeitada
 */
export const atualizarStatusProposta = async (
  propostaId: string, 
  status: 'aprovada' | 'rejeitada', 
  comentario?: string
): Promise<boolean> => {
  try {
    // Buscar dados da proposta para a notificação
    const { data: proposta, error: getError } = await supabase
      .from('propostas')
      .select(`
        codigo,
        cliente:cliente_id (nome)
      `)
      .eq('id', propostaId)
      .single();
      
    if (getError || !proposta) {
      console.error('Erro ao buscar proposta:', getError);
    }
    
    // Atualizar apenas o status da proposta
    const { error: statusError } = await supabase
      .from('propostas')
      .update({ status })
      .eq('id', propostaId);
      
    if (statusError) {
      console.error('Erro ao atualizar status:', statusError);
      return false;
    }
    
    console.log(`Proposta ${propostaId} atualizada com sucesso para status: ${status}`);
    
    // Criar notificação se temos os dados da proposta
    if (proposta) {
      const clienteNome = proposta.cliente?.nome || 'Cliente';
      criarNotificacaoPropostaInteracao(
        propostaId,
        proposta.codigo,
        clienteNome,
        status === 'aprovada' ? 'proposta_aprovada' : 'proposta_rejeitada',
        comentario
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status da proposta:', error);
    return false;
  }
};
