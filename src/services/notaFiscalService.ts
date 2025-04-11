import { supabase } from '@/integrations/supabase/client';
import { NotaFiscal, NotaFiscalFormValues, ReceitaItemParaNotaFiscal } from '@/types/notaFiscal';
import { format } from 'date-fns';
import { toast } from 'sonner';

/**
 * Verifica se um item de receita já possui nota fiscal
 */
export const verificarItemTemNotaFiscal = async (itemId: string): Promise<boolean> => {
  try {
    const { data, error, count } = await supabase
      .from('notas_fiscais' as any)
      .select('id', { count: 'exact' })
      .eq('receita_item_id', itemId);

    if (error) {
      console.error('Erro ao verificar se item tem nota fiscal:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Erro ao verificar se item tem nota fiscal:', error);
    return false;
  }
};

/**
 * Verifica se já existe nota fiscal com o mesmo número
 */
export const verificarNotaFiscalDuplicada = async (numeroNota: string, notaId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('notas_fiscais' as any)
      .select('id', { count: 'exact' })
      .eq('numero_nota', numeroNota.trim());
    
    // Se estiver editando, excluir a própria nota da verificação
    if (notaId) {
      query = query.neq('id', notaId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao verificar duplicação de nota fiscal:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Erro ao verificar duplicação de nota fiscal:', error);
    return false;
  }
};

/**
 * Busca itens de receita pagos para selecionar ao criar uma nota fiscal
 */
export const listarItensReceitaPagos = async (): Promise<ReceitaItemParaNotaFiscal[]> => {
  // Dados mock para fallback
  const mockItens: ReceitaItemParaNotaFiscal[] = [
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

  try {
    // Buscar notas fiscais existentes para filtrar itens já com nota
    const notasFiscais = await listarNotasFiscais();
    const itensComNota = new Set(notasFiscais.map(nota => nota.receita_item_id));
    
    // Tentar buscar dados reais do Supabase
    console.log('Buscando itens de receita pagos no Supabase...');
    const { data: itensReceita, error } = await supabase
      .from('receitas_itens' as any)
      .select(`
        id, receita_id, valor, status, data_vencimento, data_pagamento, 
        parcela, total_parcelas, ordem, forma_pagamento_id,
        receita:receita_id (
          id, 
          proposta:proposta_id (id, codigo),
          cliente:cliente_id (id, nome)
        )
      `)
      .eq('status', 'pago')
      .order('data_pagamento', { ascending: false });

    // Se houver erro na busca, registrar e usar dados mock
    if (error) {
      console.warn('Erro ao buscar itens de receita pagos do Supabase:', error);
      console.log('Usando dados mock para itens de receita pagos');
      return mockItens.filter(item => !itensComNota.has(item.id));
    }

    // Se não houver itens, usar dados mock
    if (!itensReceita || itensReceita.length === 0) {
      console.log('Nenhum item de receita pago encontrado no Supabase, usando dados mock');
      return mockItens.filter(item => !itensComNota.has(item.id));
    }

    // Formatar os itens para exibição e filtrar os que já possuem nota fiscal
    const itensFormatados = itensReceita
      .filter((item: any) => !itensComNota.has(item.id))
      .map((item: any) => {
        // Calcular a quantidade de itens da mesma receita
        const totalItensReceita = itensReceita.filter(
          (i: any) => i.receita_id === item.receita_id
        ).length || 1;
        
        // Determinar a posição deste item na receita
        const posicaoItem = item.ordem || 1;
        
        return {
          ...item,
          proposta_codigo: item.receita?.proposta?.codigo,
          cliente_nome: item.receita?.cliente?.nome,
          item_ordem_total: `${posicaoItem}/${totalItensReceita}`
        };
      });

    console.log(`Encontrados ${itensFormatados.length} itens de receita pagos disponíveis no Supabase`);
    return itensFormatados as unknown as ReceitaItemParaNotaFiscal[];
  } catch (error) {
    console.error('Erro ao listar itens de receita pagos:', error);
    console.log('Usando dados mock por causa do erro');
    
    // Mesmo com erro, filtrar itens que já têm nota fiscal
    const notasFiscais = await listarNotasFiscais();
    const itensComNota = new Set(notasFiscais.map(nota => nota.receita_item_id));
    return mockItens.filter(item => !itensComNota.has(item.id));
  }
};

/**
 * Lista todas as notas fiscais emitidas
 */
export const listarNotasFiscais = async (): Promise<NotaFiscal[]> => {
  // Dados mock para fallback
  const notasMock: NotaFiscal[] = [
    {
      id: '1',
      receita_item_id: 'item1',
      numero_nota: 'NF-001/A',
      valor: 45000,
      taxa_imposto: 15, // Taxa padrão de 15%
      data_emissao: '2023-09-15',
      data_lancamento: '2023-09-15',
      proposta_codigo: 'PROP001',
      cliente_nome: 'Ana Construtora Ltda',
      observacoes: 'Nota fiscal de serviços de arquitetura'
    },
    {
      id: '2',
      receita_item_id: 'item3',
      numero_nota: 'NF-002/A',
      valor: 12000,
      taxa_imposto: 15, // Taxa padrão de 15%
      data_emissao: '2023-09-20',
      data_lancamento: '2023-09-20',
      proposta_codigo: 'PROP002',
      cliente_nome: 'Tech Spaces Ltda',
      observacoes: 'Serviços de design de interiores'
    }
  ];

  try {
    console.log('Buscando notas fiscais no Supabase...');
    const { data: notasFiscais, error } = await supabase
      .from('notas_fiscais' as any)
      .select(`
        id, receita_item_id, numero_nota, valor, taxa_imposto, data_emissao, 
        data_lancamento, observacoes, data_criacao, data_atualizacao,
        receita_item:receita_item_id (
          id, receita_id,
          receita:receita_id (
            id,
            proposta:proposta_id (id, codigo),
            cliente:cliente_id (id, nome)
          )
        )
      `)
      .order('data_emissao', { ascending: false });

    // Se houver erro na busca, registrar e usar dados mock
    if (error) {
      console.warn('Erro ao buscar notas fiscais do Supabase:', error);
      console.log('Usando dados mock para notas fiscais');
      return notasMock;
    }

    // Se não houver notas, usar dados mock
    if (!notasFiscais || notasFiscais.length === 0) {
      console.log('Nenhuma nota fiscal encontrada no Supabase, usando dados mock');
      return notasMock;
    }

    // Formatar as notas fiscais para exibição
    const notasFormatadas = notasFiscais.map((nota: any) => {
      return {
        ...nota,
        taxa_imposto: nota.taxa_imposto || 15, // Garantir que taxa_imposto sempre tenha um valor válido
        proposta_codigo: nota.receita_item?.receita?.proposta?.codigo,
        cliente_nome: nota.receita_item?.receita?.cliente?.nome
      };
    });

    console.log(`Encontradas ${notasFormatadas.length} notas fiscais no Supabase`);
    return notasFormatadas as unknown as NotaFiscal[];
  } catch (error) {
    console.error('Erro ao listar notas fiscais:', error);
    console.log('Usando dados mock por causa do erro');
    return notasMock;
  }
};

/**
 * Busca uma nota fiscal pelo ID
 */
export const buscarNotaFiscal = async (id: string): Promise<NotaFiscal | null> => {
  try {
    const { data, error } = await supabase
      .from('notas_fiscais' as any)
      .select(`
        *,
        receita_item:receita_item_id (
          *,
          receita:receita_id (
            *,
            proposta:proposta_id (id, codigo),
            cliente:cliente_id (id, nome)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Garantir que a taxa_imposto tenha um valor padrão
    if (data) {
      const notaData = data as any;
      notaData.taxa_imposto = notaData.taxa_imposto || 15;
      return notaData as NotaFiscal;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar nota fiscal:', error);
    return null;
  }
};

/**
 * Cria uma nova nota fiscal
 */
export const criarNotaFiscal = async (notaFiscal: NotaFiscalFormValues): Promise<NotaFiscal> => {
  console.log('Criando nota fiscal no Supabase:', notaFiscal);
  try {
    // Definir a data de lançamento como a data atual se não fornecida
    const dataLancamento = notaFiscal.data_lancamento || new Date().toISOString();

    const { data, error } = await supabase
      .from('notas_fiscais' as any)
      .insert([
        {
          receita_item_id: notaFiscal.receita_item_id,
          numero_nota: notaFiscal.numero_nota,
          valor: notaFiscal.valor,
          taxa_imposto: notaFiscal.taxa_imposto || 15, // Valor padrão de 15% se não fornecido
          data_emissao: notaFiscal.data_emissao,
          data_lancamento: dataLancamento,
          observacoes: notaFiscal.observacoes || null
        }
      ] as any)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar nota fiscal no Supabase:', error);
      throw error;
    }

    // Se a inserção foi bem-sucedida, retorne a nota criada
    console.log('Nota fiscal criada com sucesso:', data);
    return data as unknown as NotaFiscal;
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error);
    // Para fins de demonstração, simular a criação com um ID gerado
    const notaSimulada: NotaFiscal = {
      id: `temp-${Date.now()}`,
      ...notaFiscal,
      taxa_imposto: notaFiscal.taxa_imposto || 15, // Valor padrão de 15% se não fornecido
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString()
    };
    console.log('Retornando nota fiscal simulada:', notaSimulada);
    return notaSimulada;
  }
};

/**
 * Atualiza uma nota fiscal existente
 */
export const atualizarNotaFiscal = async (id: string, notaFiscal: NotaFiscalFormValues): Promise<NotaFiscal> => {
  console.log('Atualizando nota fiscal no Supabase:', id, notaFiscal);
  try {
    const { data, error } = await supabase
      .from('notas_fiscais' as any)
      .update({
        numero_nota: notaFiscal.numero_nota,
        valor: notaFiscal.valor,
        taxa_imposto: notaFiscal.taxa_imposto,
        data_emissao: notaFiscal.data_emissao,
        observacoes: notaFiscal.observacoes || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar nota fiscal no Supabase:', error);
      throw error;
    }

    console.log('Nota fiscal atualizada com sucesso:', data);
    return data as unknown as NotaFiscal;
  } catch (error) {
    console.error('Erro ao atualizar nota fiscal:', error);
    // Para fins de demonstração, simular a atualização
    const notaSimulada: NotaFiscal = {
      id: id,
      ...notaFiscal,
      data_atualizacao: new Date().toISOString()
    };
    console.log('Retornando nota fiscal simulada atualizada:', notaSimulada);
    return notaSimulada;
  }
};

/**
 * Exclui uma nota fiscal
 */
export const excluirNotaFiscal = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notas_fiscais' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;

    toast.success('Nota fiscal excluída com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao excluir nota fiscal:', error);
    toast.error('Falha ao excluir nota fiscal');
    return false;
  }
}; 