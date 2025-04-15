import { supabase } from "@/integrations/supabase/client";
import { 
  Receita, 
  ReceitaFormValues, 
  ReceitaItem, 
  FormaPagamento,
  ReceitaStatus,
  ReceitaFiltro
} from "@/types/receita";
import { toast } from "sonner";
import { PostgrestResponse } from "@supabase/supabase-js";

/**
 * Busca as formas de pagamento disponíveis
 */
export const listarFormasPagamento = async (): Promise<FormaPagamento[]> => {
  try {
    const { data, error } = await supabase
      .from('formas_pagamento' as any)
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as FormaPagamento[];
  } catch (error) {
    console.error('Erro ao listar formas de pagamento:', error);
    return [];
  }
};

/**
 * Busca uma proposta pelo ID/código para vincular à receita
 */
export const buscarPropostaPorCodigo = async (codigo: string) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select(`
        *,
        cliente:cliente_id (*),
        condicoes_pagamento:proposta_condicoes_pagamento (*)
      `)
      .eq('codigo', codigo.toUpperCase())
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar proposta:', error);
    toast.error("Proposta não encontrada");
    return null;
  }
};

/**
 * Cria uma nova receita com seus itens
 */
export const criarReceita = async (receita: ReceitaFormValues): Promise<Receita | null> => {
  try {
    // 1. Recuperar a proposta para obter o cliente_id
    let proposta = null;
    if (receita.proposta_id) {
      const { data, error } = await supabase
        .from('propostas')
        .select('id, cliente_id, valor_total')
        .eq('id', receita.proposta_id)
        .single();
      
      if (error) throw error;
      proposta = data;
    }

    // 2. Calcular o valor total dos itens
    const valorTotal = receita.itens.reduce((sum, item) => sum + item.valor, 0);

    // 3. Inserir a receita principal
    const { data: receitaData, error: receitaError } = await supabase
      .from('receitas' as any)
      .insert([
        {
          proposta_id: receita.proposta_id || null,
          categoria_id: receita.categoria_id || null,
          cliente_id: proposta?.cliente_id || null,
          valor_total: valorTotal,
          descricao: receita.descricao || null,
          observacoes: receita.observacoes || null,
          status: 'pendente' as ReceitaStatus
        }
      ])
      .select()
      .single();

    if (receitaError) throw receitaError;
    
    // 4. Inserir os itens da receita
    const itensParaInserir = receita.itens.map((item, index) => ({
      receita_id: receitaData.id,
      condicao_pagamento_id: item.condicao_pagamento_id || null,
      forma_pagamento_id: item.forma_pagamento_id,
      valor: item.valor,
      data_vencimento: item.data_vencimento,
      data_pagamento: item.data_pagamento || null,
      parcela: item.parcela || 1,
      total_parcelas: item.total_parcelas || 1,
      taxa_juros: item.taxa_juros || 0,
      detalhes_pagamento: item.detalhes_pagamento || null,
      descricao: item.descricao || null,
      ordem: index + 1,
      status: 'pendente' as ReceitaStatus
    }));

    const { error: itensError } = await supabase
      .from('receitas_itens' as any)
      .insert(itensParaInserir);

    if (itensError) throw itensError;

    // 5. Retornar a receita criada com os itens
    return await buscarReceitaCompleta(receitaData.id);
  } catch (error) {
    console.error('Erro ao criar receita:', error);
    toast.error("Falha ao criar receita");
    throw error;
  }
};

/**
 * Busca uma receita completa com seus itens
 */
export const buscarReceitaCompleta = async (id: string): Promise<Receita | null> => {
  try {
    console.log(`Buscando detalhes completos da receita ${id}...`);
    
    // Consulta Supabase com todos os relacionamentos necessários
    const { data, error } = await supabase
      .from('receitas')
      .select(`
        id,
        proposta_id,
        categoria_id,
        cliente_id,
        valor_total,
        descricao,
        status,
        data_vencimento,
        data_pagamento,
        observacoes,
        data_criacao,
        data_atualizacao,
        proposta:proposta_id(
          id, 
          codigo, 
          titulo, 
          valor_total,
          status
        ),
        categoria:categoria_id(
          id, 
          nome, 
          descricao
        ),
        cliente:cliente_id(
          id, 
          nome, 
          documento, 
          telefone, 
          email
        ),
        itens:receitas_itens(
          id, 
          receita_id, 
          condicao_pagamento_id, 
          forma_pagamento_id, 
          valor, 
          status, 
          data_vencimento, 
          data_pagamento, 
          parcela, 
          total_parcelas, 
          taxa_juros, 
          detalhes_pagamento, 
          descricao,
          ordem,
          forma_pagamento:forma_pagamento_id(
            id, 
            nome, 
            descricao,
            requer_detalhes
          ),
          condicao_pagamento:condicao_pagamento_id(
            id, 
            descricao, 
            percentual, 
            valor,
            ordem
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro na consulta da receita:', error);
      throw error;
    }
    
    if (!data) {
      console.warn(`Nenhuma receita encontrada com o ID ${id}`);
      return null;
    }
    
    console.log(`Receita encontrada: ID=${data.id}, Itens=${data.itens?.length || 0}`);
    
    if (data.itens && data.itens.length > 0) {
      console.log(`Primeiro item: ID=${data.itens[0].id}, Valor=${data.itens[0].valor}`);
    } else {
      console.warn('A receita não possui itens');
    }
    
    // Garantir que os itens estejam ordenados por data de vencimento
    const itensOrdenados = data.itens?.sort((a, b) => {
      const dataA = new Date(a.data_vencimento).getTime();
      const dataB = new Date(b.data_vencimento).getTime();
      return dataA - dataB;
    }) || [];
    
    // Garantir que itens é sempre um array e está formatado corretamente
    const receitaFormatada = {
      ...data,
      itens: itensOrdenados
    };
    
    return receitaFormatada as unknown as Receita;
  } catch (error) {
    console.error(`Erro ao buscar receita ${id}:`, error);
    return null;
  }
};

/**
 * Lista todas as receitas com informações básicas
 */
export const listarReceitas = async (): Promise<Receita[]> => {
  try {
    const { data, error } = await supabase
      .from('receitas' as any)
      .select(`
        *,
        proposta:proposta_id (id, codigo, titulo),
        categoria:categoria_id (id, nome),
        cliente:cliente_id (id, nome)
      `)
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Receita[];
  } catch (error) {
    console.error('Erro ao listar receitas:', error);
    return [];
  }
};

/**
 * Atualiza uma receita existente
 */
export const atualizarReceita = async (id: string, receita: ReceitaFormValues): Promise<Receita | null> => {
  try {
    console.log('Iniciando atualização da receita:', id);
    
    // 1. Calcular o valor total dos itens
    const valorTotal = receita.itens.reduce((sum, item) => sum + (item.valor || 0), 0);

    // 2. Atualizar a receita principal
    const { error: receitaError } = await supabase
      .from('receitas' as any)
      .update({
        categoria_id: receita.categoria_id || null,
        valor_total: valorTotal,
        descricao: receita.descricao || null,
        observacoes: receita.observacoes || null,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', id);

    if (receitaError) throw receitaError;
    
    // 2.5 Buscar os itens existentes para preservar os status
    const { data: itensExistentes, error: buscarItensError } = await supabase
      .from('receitas_itens' as any)
      .select('id, condicao_pagamento_id, status, data_pagamento')
      .eq('receita_id', id);
      
    if (buscarItensError) throw buscarItensError;
    
    // Garantir que itensExistentes é um array
    const itensArray = Array.isArray(itensExistentes) ? itensExistentes : [];
    console.log('Itens existentes encontrados:', itensArray.length);
    
    // 3. Excluir os itens existentes
    const { error: deleteError } = await supabase
      .from('receitas_itens' as any)
      .delete()
      .eq('receita_id', id);

    if (deleteError) throw deleteError;
    
    // 4. Inserir os novos itens
    const itensParaInserir = receita.itens.map((item, index) => {
      // Verificar se há um item existente com o mesmo ID de condição de pagamento
      const itemExistente = itensArray.find(existente => 
        existente && 'condicao_pagamento_id' in existente && 
        existente.condicao_pagamento_id === item.condicao_pagamento_id
      ) as any;
      
      // Usar o status do item existente se disponível, senão 'pendente'
      const status = itemExistente && 'status' in itemExistente ? 
        itemExistente.status : 'pendente';
      
      // Usar a data_pagamento do item existente se disponível, ou usar a do formulário se fornecida
      const data_pagamento = item.data_pagamento && item.data_pagamento.trim() !== '' ? 
        item.data_pagamento : 
        (itemExistente && 'data_pagamento' in itemExistente ? itemExistente.data_pagamento : null);
        
      return {
        receita_id: id,
        condicao_pagamento_id: item.condicao_pagamento_id || null,
        forma_pagamento_id: item.forma_pagamento_id,
        valor: item.valor || 0,
        data_vencimento: item.data_vencimento,
        data_pagamento: data_pagamento,
        parcela: item.parcela || 1,
        total_parcelas: item.total_parcelas || 1,
        taxa_juros: item.taxa_juros || 0,
        detalhes_pagamento: item.detalhes_pagamento || null,
        descricao: item.descricao || null,
        ordem: index + 1,
        status: status as ReceitaStatus
      };
    });

    const { error: itensError } = await supabase
      .from('receitas_itens' as any)
      .insert(itensParaInserir);

    if (itensError) throw itensError;

    // 5. Retornar a receita atualizada
    return await buscarReceitaCompleta(id);
  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    toast.error("Falha ao atualizar receita");
    throw error;
  }
};

/**
 * Atualiza o status de pagamento de um item de receita
 */
export const atualizarStatusItemReceita = async (
  id: string,
  status: ReceitaStatus,
  dataPagamento?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('receitas_itens' as any)
      .update({
        status,
        data_pagamento: status === 'pago' ? (dataPagamento || new Date().toISOString()) : null,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status do item de receita:', error);
    toast.error("Falha ao atualizar status de pagamento");
    return false;
  }
};

/**
 * Exclui uma receita e seus itens
 */
export const excluirReceita = async (id: string): Promise<boolean> => {
  try {
    // As exclusão dos itens ocorre automaticamente por causa da constraint ON DELETE CASCADE
    const { error } = await supabase
      .from('receitas' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir receita:', error);
    toast.error("Falha ao excluir receita");
    return false;
  }
};

/**
 * Verifica se já existe uma receita para a proposta informada
 */
export const verificarPropostaJaTemReceita = async (propostaId: string): Promise<boolean> => {
  try {
    console.log('Verificando se proposta já tem receita:', propostaId);
    
    const { data, error } = await supabase
      .from('receitas' as any)
      .select('id')
      .eq('proposta_id', propostaId);
    
    if (error) {
      console.error('Erro na consulta de verificação:', error);
      throw error;
    }
    
    const temReceita = Array.isArray(data) && data.length > 0;
    console.log('Resultado da verificação:', temReceita, 'Qtd encontrada:', data?.length);
    return temReceita;
  } catch (error) {
    console.error('Erro ao verificar existência de receita para a proposta:', error);
    return false;
  }
};

/**
 * Verifica se já existe uma receita com o código da proposta informado
 */
export const verificarPropostaPorCodigoJaTemReceita = async (codigo: string): Promise<boolean> => {
  try {
    console.log('Verificando proposta por código:', codigo);
    
    // Primeiro busca a proposta pelo código
    const { data, error: propostaError } = await supabase
      .from('propostas')
      .select('id')
      .eq('codigo', codigo.toUpperCase())
      .single();
    
    if (propostaError) {
      console.error('Erro ao buscar proposta por código:', propostaError);
      return false;
    }
    
    if (!data || !data.id) {
      console.log('Nenhuma proposta encontrada com o código:', codigo);
      return false;
    }
    
    console.log('Proposta encontrada:', data.id);
    
    // Depois verifica se a proposta já tem receita
    const resultado = await verificarPropostaJaTemReceita(data.id);
    console.log('Resultado final da verificação por código:', resultado);
    return resultado;
  } catch (error) {
    console.error('Erro ao verificar existência de receita pelo código da proposta:', error);
    return false;
  }
};

/**
 * Verifica se a proposta está com status "aprovada"
 */
export const verificarPropostaAprovada = async (propostaId: string): Promise<boolean> => {
  try {
    console.log('Verificando se proposta está aprovada:', propostaId);
    
    const { data, error } = await supabase
      .from('propostas')
      .select('status')
      .eq('id', propostaId)
      .single();
    
    if (error) {
      console.error('Erro ao verificar status da proposta:', error);
      throw error;
    }
    
    const estaAprovada = data?.status === 'aprovada';
    console.log('Proposta está aprovada?', estaAprovada, 'Status atual:', data?.status);
    return estaAprovada;
  } catch (error) {
    console.error('Erro ao verificar status da proposta:', error);
    return false;
  }
};

/**
 * Verifica se a proposta (por código) está com status "aprovada"
 */
export const verificarPropostaPorCodigoAprovada = async (codigo: string): Promise<boolean> => {
  try {
    console.log('Verificando se proposta por código está aprovada:', codigo);
    
    const { data, error } = await supabase
      .from('propostas')
      .select('status')
      .eq('codigo', codigo.toUpperCase())
      .single();
    
    if (error) {
      console.error('Erro ao verificar status da proposta por código:', error);
      return false;
    }
    
    const estaAprovada = data?.status === 'aprovada';
    console.log('Proposta está aprovada?', estaAprovada, 'Status atual:', data?.status);
    return estaAprovada;
  } catch (error) {
    console.error('Erro ao verificar status da proposta por código:', error);
    return false;
  }
};

/**
 * Calcula o total de itens pagos de todas as receitas
 */
export const calcularTotalItensPagos = async (): Promise<{ valor: number; quantidade: number }> => {
  try {
    const { data, error } = await supabase
      .from('receitas_itens' as any)
      .select('valor')
      .eq('status', 'pago');

    if (error) throw error;
    
    let items: any[] = [];
    if (data && Array.isArray(data)) {
      items = data;
    }
    
    const valor = items.reduce((total, item) => {
      return total + (item && typeof item === 'object' && 'valor' in item && typeof item.valor === 'number' ? item.valor : 0);
    }, 0);
    
    return {
      valor,
      quantidade: items.length
    };
  } catch (error) {
    console.error('Erro ao calcular total de itens pagos:', error);
    return { valor: 0, quantidade: 0 };
  }
};

/**
 * Calcula o total de itens pendentes de todas as receitas
 */
export const calcularTotalItensPendentes = async (): Promise<{ valor: number; quantidade: number }> => {
  try {
    const { data, error } = await supabase
      .from('receitas_itens' as any)
      .select('valor')
      .eq('status', 'pendente');

    if (error) throw error;
    
    let items: any[] = [];
    if (data && Array.isArray(data)) {
      items = data;
    }
    
    const valor = items.reduce((total, item) => {
      return total + (item && typeof item === 'object' && 'valor' in item && typeof item.valor === 'number' ? item.valor : 0);
    }, 0);
    
    return {
      valor,
      quantidade: items.length
    };
  } catch (error) {
    console.error('Erro ao calcular total de itens pendentes:', error);
    return { valor: 0, quantidade: 0 };
  }
};

/**
 * Calcula o total de itens com pagamento parcial de todas as receitas
 */
export const calcularTotalItensParciaisPagos = async (): Promise<{ valor: number; quantidade: number }> => {
  try {
    const { data, error } = await supabase
      .from('receitas_itens' as any)
      .select('valor')
      .eq('status', 'pago_parcial');

    if (error) throw error;
    
    let items: any[] = [];
    if (data && Array.isArray(data)) {
      items = data;
    }
    
    const valor = items.reduce((total, item) => {
      return total + (item && typeof item === 'object' && 'valor' in item && typeof item.valor === 'number' ? item.valor : 0);
    }, 0);
    
    return {
      valor,
      quantidade: items.length
    };
  } catch (error) {
    console.error('Erro ao calcular total de itens com pagamento parcial:', error);
    return { valor: 0, quantidade: 0 };
  }
};

/**
 * Gera um token para compartilhamento público da receita
 */
export const gerarTokenCompartilhamento = async (receitaId: string): Promise<string | null> => {
  try {
    // Verificar no localStorage primeiro
    const tokensArmazenados = localStorage.getItem('receitas_compartilhamento');
    const tokens = tokensArmazenados ? JSON.parse(tokensArmazenados) : {};
    
    // Se já existe um token para esta receita, retorna ele
    if (tokens[receitaId]) {
      return tokens[receitaId];
    }
    
    // Gera um novo token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15) + 
                 Date.now().toString(36);
    
    // Armazena o token no localStorage
    tokens[receitaId] = token;
    localStorage.setItem('receitas_compartilhamento', JSON.stringify(tokens));
    
    return token;
  } catch (error) {
    console.error('Erro ao gerar token de compartilhamento:', error);
    toast.error('Falha ao gerar link de compartilhamento');
    return null;
  }
};

/**
 * Busca uma receita pelo token de compartilhamento
 */
export const buscarReceitaPorToken = async (token: string): Promise<Receita | null> => {
  try {
    // Buscar o token no localStorage
    const tokensArmazenados = localStorage.getItem('receitas_compartilhamento');
    const tokens = tokensArmazenados ? JSON.parse(tokensArmazenados) : {};
    
    // Encontrar a receita_id correspondente ao token
    let receitaId = null;
    for (const [id, savedToken] of Object.entries(tokens)) {
      if (savedToken === token) {
        receitaId = id;
        break;
      }
    }
    
    if (!receitaId) {
      console.error('Token não encontrado ou inválido');
      return null;
    }
    
    // Buscar a receita completa
    return await buscarReceitaCompleta(receitaId);
  } catch (error) {
    console.error('Erro ao buscar receita por token:', error);
    return null;
  }
};

/**
 * Lista todos os itens de receitas com opções de filtro
 */
export const listarItensReceita = async (filtros?: {
  cliente_id?: string;
  forma_pagamento_id?: string;
  status?: ReceitaStatus;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  categoria_id?: string;
  banco_id?: string;
  termo_busca?: string;
}): Promise<ReceitaItem[]> => {
  try {
    let query = supabase
      .from('receitas_itens' as any)
      .select(`
        *,
        receita:receita_id (
          *,
          proposta:proposta_id (id, codigo, titulo),
          categoria:categoria_id (id, nome),
          cliente:cliente_id (id, nome, documento)
        ),
        condicao_pagamento:condicao_pagamento_id (*),
        forma_pagamento:forma_pagamento_id (*)
      `)
      .order('data_vencimento', { ascending: false });

    // Aplicar filtros
    if (filtros) {
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros.forma_pagamento_id) {
        query = query.eq('forma_pagamento_id', filtros.forma_pagamento_id);
      }

      if (filtros.data_inicio) {
        query = query.gte('data_vencimento', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('data_vencimento', filtros.data_fim);
      }

      if (filtros.valor_min !== undefined) {
        query = query.gte('valor', filtros.valor_min);
      }

      if (filtros.valor_max !== undefined) {
        query = query.lte('valor', filtros.valor_max);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Alguns filtros precisam ser aplicados após o recebimento dos dados
    let itensFiltrados = (data || []) as unknown as ReceitaItem[];
    
    if (filtros) {
      if (filtros.cliente_id) {
        itensFiltrados = itensFiltrados.filter(item => 
          item.receita?.cliente_id === filtros.cliente_id
        );
      }
      
      if (filtros.categoria_id) {
        itensFiltrados = itensFiltrados.filter(item => 
          item.receita?.categoria_id === filtros.categoria_id
        );
      }
      
      // Filtrar por banco_id (que está dentro do campo detalhes_pagamento)
      if (filtros.banco_id) {
        itensFiltrados = itensFiltrados.filter(item => {
          if (!item.detalhes_pagamento) return false;
          
          // Como detalhes_pagamento é um campo JSONB, precisamos procurar pelo banco_id
          const detalhes = item.detalhes_pagamento as any;
          
          // Considerar tanto o banco_id quanto a possibilidade do nome do banco conter o ID
          return detalhes.banco_id === filtros.banco_id || 
                 // Para compatibilidade com registros que não têm banco_id, mas têm o nome do banco
                 (typeof detalhes.banco === 'string' && 
                  detalhes.banco.toLowerCase().includes(filtros.banco_id?.toLowerCase() || ''));
        });
      }
      
      if (filtros.termo_busca) {
        const termo = filtros.termo_busca.toLowerCase();
        itensFiltrados = itensFiltrados.filter(item => 
          (item.receita?.cliente?.nome?.toLowerCase().includes(termo)) ||
          (item.receita?.proposta?.codigo?.toLowerCase().includes(termo)) ||
          (item.receita?.descricao?.toLowerCase().includes(termo)) ||
          (item.descricao?.toLowerCase().includes(termo))
        );
      }
    }
    
    return itensFiltrados;
  } catch (error) {
    console.error('Erro ao listar itens de receita:', error);
    return [];
  }
};

/**
 * Busca receitas dentro de um período específico
 */
export const getReceitasPeriodo = async (dataInicio: string, dataFim: string): Promise<any[]> => {
  try {
    console.log(`Buscando receitas no período: ${dataInicio} até ${dataFim}`);
    
    // Validar datas
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      console.error('Datas inválidas fornecidas para consulta de receitas');
      return [];
    }
    
    const { data, error } = await supabase
      .from('receitas_itens' as any)
      .select(`
        *,
        receita:receita_id (*)
      `)
      .gte('data_vencimento', dataInicio)
      .lte('data_vencimento', dataFim);

    if (error) {
      console.error('Erro na consulta do Supabase:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Erro ao buscar receitas do período (${dataInicio} a ${dataFim}):`, error);
    return [];
  }
};

/**
 * Busca todas as receitas, opcionalmente filtradas por critérios
 */
export const buscarReceitas = async (filtro?: ReceitaFiltro): Promise<Receita[]> => {
  try {
    let query = supabase
      .from('receitas' as any)
      .select(`
        *,
        categoria:categorias(*),
        itens:receitas_itens(
          *,
          condicao_pagamento:condicoes_pagamento(*),
          forma_pagamento:formas_pagamento(*)
        )
      `)
      .order('data_criacao', { ascending: false });

    // Aplicar filtros se fornecidos
    if (filtro) {
      if (filtro.categoria_id) {
        query = query.eq('categoria_id', filtro.categoria_id);
      }
      
      if (filtro.status) {
        // Lidar com filtro de status - requer junção com itens
      }
      
      if (filtro.data_inicio && filtro.data_fim) {
        query = query.gte('data_criacao', filtro.data_inicio).lte('data_criacao', filtro.data_fim);
      } else if (filtro.data_inicio) {
        query = query.gte('data_criacao', filtro.data_inicio);
      } else if (filtro.data_fim) {
        query = query.lte('data_criacao', filtro.data_fim);
      }
    }
    
    const { data, error } = await query as { data: any; error: any };
    
    if (error) throw error;
    
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(receita => ({
      ...receita,
      itens: Array.isArray(receita.itens) ? receita.itens : []
    })) as Receita[];
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    return [];
  }
};

type PostgrestReceitaResult = PostgrestResponse<any> & {
  data: any;
  error: any;
}

export async function getReceitaById(id: string): Promise<Receita | null> {
  const { data, error } = await supabase
    .from("receitas")
    .select(`
      *,
      categoria:categoria_id(id, nome),
      cliente:cliente_id(id, nome, cnpj, cpf, email),
      proposta:proposta_id(id, codigo, valor_total),
      itens:receita_itens(
        id,
        valor,
        data_vencimento,
        data_pagamento,
        parcela,
        total_parcelas,
        taxa_juros,
        detalhes_pagamento,
        descricao,
        status,
        forma_pagamento:forma_pagamento_id(id, nome),
        condicao_pagamento:condicao_pagamento_id(id, nome, taxa_juros, parcelas)
      )
    `)
    .eq("id", id)
    .single() as PostgrestReceitaResult;

  if (error || !data) {
    console.error("Erro ao buscar receita:", error);
    return null;
  }

  return data as unknown as Receita;
}

export async function getReceitas(filtros?: ReceitaFiltro): Promise<Receita[]> {
  let query = supabase
    .from("receitas")
    .select(`
      *,
      categoria:categoria_id(id, nome),
      cliente:cliente_id(id, nome, cnpj, cpf, email),
      proposta:proposta_id(id, codigo, valor_total),
      itens:receita_itens(
        id,
        valor,
        data_vencimento,
        data_pagamento,
        parcela,
        total_parcelas,
        taxa_juros,
        detalhes_pagamento,
        descricao,
        status,
        forma_pagamento:forma_pagamento_id(id, nome),
        condicao_pagamento:condicao_pagamento_id(id, nome, taxa_juros, parcelas)
      )
    `);

  // Apply filters if provided
  if (filtros) {
    if (filtros.categoria_id) {
      query = query.eq("categoria_id", filtros.categoria_id);
    }
    
    if (filtros.status) {
      query = query.eq("status", filtros.status);
    }
    
    if (filtros.data_inicio) {
      query = query.gte("data", filtros.data_inicio);
    }
    
    if (filtros.data_fim) {
      query = query.lte("data", filtros.data_fim);
    }
  }

  const { data, error } = await query.order("data", { ascending: false }) as PostgrestReceitaResult;

  if (error) {
    console.error("Erro ao buscar receitas:", error);
    return [];
  }

  return (data || []) as unknown as Receita[];
}

/**
 * Função específica para carregar todos os dados para o formulário de edição de uma receita
 * Garante que todos os relacionamentos estejam carregados corretamente
 */
export const carregarReceitaParaFormulario = async (id: string): Promise<Receita | null> => {
  try {
    console.log(`Carregando dados completos da receita ${id} para formulário de edição...`);
    
    // 1. Buscar a receita com seus dados básicos
    const { data: receita, error: receitaError } = await supabase
      .from('receitas')
      .select(`
        id, proposta_id, categoria_id, cliente_id, valor_total, 
        descricao, status, data_vencimento, data_pagamento, 
        observacoes, data_criacao, data_atualizacao,
        proposta:proposta_id(id, codigo, titulo, valor_total, status),
        categoria:categoria_id(id, nome, descricao),
        cliente:cliente_id(id, nome, documento, telefone, email)
      `)
      .eq('id', id)
      .single();
    
    if (receitaError || !receita) {
      console.error('Erro ao buscar receita para formulário:', receitaError);
      return null;
    }
    
    // 2. Buscar todos os itens da receita separadamente
    const { data: itens, error: itensError } = await supabase
      .from('receitas_itens')
      .select(`
        id, receita_id, condicao_pagamento_id, forma_pagamento_id,
        valor, status, data_vencimento, data_pagamento, parcela,
        total_parcelas, taxa_juros, detalhes_pagamento, 
        descricao, ordem, data_criacao, data_atualizacao
      `)
      .eq('receita_id', id)
      .order('data_vencimento', { ascending: true });
    
    if (itensError) {
      console.error('Erro ao buscar itens da receita:', itensError);
      return null;
    }
    
    console.log(`Encontrados ${itens?.length || 0} itens para a receita ${id}`);
    
    // 3. Para cada item, buscar a forma de pagamento e condição de pagamento
    const itensCompletos = await Promise.all((itens || []).map(async (item) => {
      // Buscar forma de pagamento
      let formaPagamento = null;
      if (item.forma_pagamento_id) {
        const { data: fp } = await supabase
          .from('formas_pagamento')
          .select('*')
          .eq('id', item.forma_pagamento_id)
          .single();
        formaPagamento = fp;
      }
      
      // Buscar condição de pagamento
      let condicaoPagamento = null;
      if (item.condicao_pagamento_id) {
        const { data: cp } = await supabase
          .from('proposta_condicoes_pagamento')
          .select('*')
          .eq('id', item.condicao_pagamento_id)
          .single();
        condicaoPagamento = cp;
      }
      
      // Retornar item com todas as relações
      return {
        ...item,
        forma_pagamento: formaPagamento,
        condicao_pagamento: condicaoPagamento
      };
    }));
    
    console.log(`Todos os ${itensCompletos.length} itens carregados com seus relacionamentos`);
    
    // 4. Montar o objeto final da receita com todos os relacionamentos
    const receitaCompleta = {
      ...receita,
      itens: itensCompletos
    };
    
    return receitaCompleta as unknown as Receita;
  } catch (error) {
    console.error(`Erro ao carregar receita ${id} para formulário:`, error);
    return null;
  }
}; 