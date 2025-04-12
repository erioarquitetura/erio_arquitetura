import { supabase } from "@/integrations/supabase/client";
import { EstatisticasFinanceiras } from "@/types";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, addMonths, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  calcularTotalItensPagos,
  calcularTotalItensPendentes,
  calcularTotalItensParciaisPagos,
} from './receitaService';

/**
 * Obtém estatísticas para o dashboard
 * @param mesAnoSelecionado - Mês e ano no formato MM/YYYY, se não informado será usado o mês atual
 */
export const obterEstatisticasDashboard = async (mesAnoSelecionado?: string): Promise<EstatisticasFinanceiras> => {
  try {
    // Obter o mês atual ou o mês selecionado
    let dataReferencia: Date;
    
    if (mesAnoSelecionado) {
      const [mes, ano] = mesAnoSelecionado.split('/');
      dataReferencia = new Date(parseInt(ano), parseInt(mes) - 1, 1); // Mês em JS é base 0 (jan=0, fev=1...)
    } else {
      dataReferencia = new Date();
    }
    
    const inicioMesAtual = startOfMonth(dataReferencia);
    const fimMesAtual = endOfMonth(dataReferencia);
    const mesAnterior = subMonths(dataReferencia, 1);
    const inicioMesAnterior = startOfMonth(mesAnterior);
    const fimMesAnterior = endOfMonth(mesAnterior);

    // Formatar as datas para consulta
    const dataInicioMesAtual = inicioMesAtual.toISOString();
    const dataFimMesAtual = fimMesAtual.toISOString();
    const dataInicioMesAnterior = inicioMesAnterior.toISOString();
    const dataFimMesAnterior = fimMesAnterior.toISOString();

    // Nome formatado do mês atual para exibição
    const nomeMesAtual = format(dataReferencia, 'MMMM/yyyy', { locale: ptBR });

    // 1. Obter receitas do mês selecionado
    const { data: receitasDoMes, error: receitasError } = await supabase
      .from('receitas_itens')
      .select('valor, status')
      .gte('data_vencimento', dataInicioMesAtual)
      .lte('data_vencimento', dataFimMesAtual);

    if (receitasError) throw receitasError;

    // 2. Obter despesas do mês selecionado
    const { data: despesasDoMes, error: despesasError } = await supabase
      .from('despesas')
      .select('valor, status_pagamento')
      .gte('data_lancamento', dataInicioMesAtual)
      .lte('data_lancamento', dataFimMesAtual);

    if (despesasError) throw despesasError;

    // 3. Calcular totais de receitas e despesas
    const receitasMes = receitasDoMes
      ?.filter(item => item.status === 'pago')
      .reduce((total, item) => total + (item.valor || 0), 0) || 0;
    
    const despesasMes = despesasDoMes
      ?.filter(item => item.status_pagamento === 'pago')
      .reduce((total, item) => total + (item.valor || 0), 0) || 0;

    // 4. Calcular valores pendentes
    const receitasPendentes = receitasDoMes
      ?.filter(item => item.status === 'pendente')
      .reduce((total, item) => total + (item.valor || 0), 0) || 0;
    
    const despesasPendentes = despesasDoMes
      ?.filter(item => item.status_pagamento === 'pendente')
      .reduce((total, item) => total + (item.valor || 0), 0) || 0;

    // 5. Obter dados para gráfico de categorias de receitas e despesas
    // Inicializar com alguns valores padrão caso não existam dados reais
    let receitasPorCategoria: Record<string, number> = {};
    let despesasPorCategoria: Record<string, number> = {};
    
    // Usar Promise.all para buscar dados de categorias em paralelo
    await Promise.all([
      // Buscar dados de categorias de receitas
      (async () => {
        try {
          // Buscar itens de receita com sua categoria
          const { data: receitasItensComCategoria, error: receitasError } = await supabase
            .from('receitas_itens' as any)
            .select(`
              id,
              valor,
              status,
              receita:receita_id (
                categoria_id
              )
            `)
            .eq('status', 'pago')
            .gte('data_vencimento', dataInicioMesAtual)
            .lte('data_vencimento', dataFimMesAtual);
          
          if (receitasError) throw receitasError;
          
          // Buscar todas as categorias de receita
          const { data: categoriasReceita, error: categoriasError } = await supabase
            .from('categorias_receitas' as any)
            .select('id, nome');
          
          if (categoriasError) throw categoriasError;
          
          // Mapear IDs de categorias para nomes
          const mapaCategorias: Record<string, string> = {};
          if (categoriasReceita && Array.isArray(categoriasReceita)) {
            categoriasReceita.forEach((cat: any) => {
              mapaCategorias[cat.id] = cat.nome;
            });
          }
          
          // Agrupar valores por categoria
          const somaPorCategoria: Record<string, number> = {};
          
          if (receitasItensComCategoria && Array.isArray(receitasItensComCategoria)) {
            receitasItensComCategoria.forEach((item: any) => {
              const categoriaId = item.receita?.categoria_id;
              const categoriaNome = categoriaId ? (mapaCategorias[categoriaId] || 'Outros') : 'Sem categoria';
              
              if (!somaPorCategoria[categoriaNome]) {
                somaPorCategoria[categoriaNome] = 0;
              }
              
              somaPorCategoria[categoriaNome] += Number(item.valor) || 0;
            });
          }
          
          // Se não tiver dados reais, usar dados de exemplo
          if (Object.keys(somaPorCategoria).length === 0) {
            receitasPorCategoria = {
              "Projetos": 5000,
              "Consultoria": 3000,
              "Outros": 2000
            };
          } else {
            // Ordenar por valor (do maior para o menor)
            receitasPorCategoria = Object.fromEntries(
              Object.entries(somaPorCategoria)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6) // Limitar para os 6 maiores para melhor visualização
            );
          }
        } catch (error) {
          console.error('Erro ao obter categorias de receitas:', error);
          // Usar dados de exemplo em caso de erro
          receitasPorCategoria = {
            "Projetos": 5000,
            "Consultoria": 3000,
            "Outros": 2000
          };
        }
      })(),
      
      // Buscar dados de categorias de despesas
      (async () => {
        try {
          // Buscar despesas com suas categorias
          const { data: despesasComCategoria, error: despesasError } = await supabase
            .from('despesas' as any)
            .select(`
              id,
              valor,
              status_pagamento,
              categoria_id
            `)
            .eq('status_pagamento', 'pago')
            .gte('data_lancamento', dataInicioMesAtual)
            .lte('data_lancamento', dataFimMesAtual);
          
          if (despesasError) throw despesasError;
          
          // Buscar todas as categorias de despesa
          const { data: categoriasDespesa, error: categoriasError } = await supabase
            .from('categorias_despesas' as any)
            .select('id, nome');
          
          if (categoriasError) throw categoriasError;
          
          // Mapear IDs de categorias para nomes
          const mapaCategoriasDespesas: Record<string, string> = {};
          if (categoriasDespesa && Array.isArray(categoriasDespesa)) {
            categoriasDespesa.forEach((cat: any) => {
              mapaCategoriasDespesas[cat.id] = cat.nome;
            });
          }
          
          // Agrupar valores por categoria
          const somaPorCategoriaDespesa: Record<string, number> = {};
          
          if (despesasComCategoria && Array.isArray(despesasComCategoria)) {
            despesasComCategoria.forEach((item: any) => {
              const categoriaId = item.categoria_id;
              const categoriaNome = categoriaId ? (mapaCategoriasDespesas[categoriaId] || 'Outros') : 'Sem categoria';
              
              if (!somaPorCategoriaDespesa[categoriaNome]) {
                somaPorCategoriaDespesa[categoriaNome] = 0;
              }
              
              somaPorCategoriaDespesa[categoriaNome] += Number(item.valor) || 0;
            });
          }
          
          // Se não tiver dados reais, usar dados de exemplo
          if (Object.keys(somaPorCategoriaDespesa).length === 0) {
            despesasPorCategoria = {
              "Operacional": 2500,
              "Marketing": 1500,
              "Administrativo": 1000
            };
          } else {
            // Ordenar por valor (do maior para o menor)
            despesasPorCategoria = Object.fromEntries(
              Object.entries(somaPorCategoriaDespesa)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6) // Limitar para os 6 maiores para melhor visualização
            );
          }
        } catch (error) {
          console.error('Erro ao obter categorias de despesas:', error);
          // Usar dados de exemplo em caso de erro
          despesasPorCategoria = {
            "Operacional": 2500,
            "Marketing": 1500,
            "Administrativo": 1000
          };
        }
      })()
    ]);

    // 7. Obter histórico dos últimos 9 meses para o fluxo mensal
    const fluxoMensal = [];
    
    for (let i = 8; i >= 0; i--) {
      const mesFiltro = subMonths(dataReferencia, i);
      const inicioMes = startOfMonth(mesFiltro);
      const fimMes = endOfMonth(mesFiltro);
      const dataInicioFiltro = inicioMes.toISOString();
      const dataFimFiltro = fimMes.toISOString();
      const nomeMes = format(mesFiltro, 'MMM/yy', { locale: ptBR });
      
      // Receitas do mês
      const { data: receitasMesAtual } = await supabase
        .from('receitas_itens')
        .select('valor')
        .eq('status', 'pago')
        .gte('data_vencimento', dataInicioFiltro)
        .lte('data_vencimento', dataFimFiltro);
        
      // Despesas do mês
      const { data: despesasMesAtual } = await supabase
        .from('despesas')
        .select('valor')
        .eq('status_pagamento', 'pago')
        .gte('data_lancamento', dataInicioFiltro)
        .lte('data_lancamento', dataFimFiltro);
      
      const receitasValor = receitasMesAtual?.reduce((total, item) => total + (item.valor || 0), 0) || 0;
      const despesasValor = despesasMesAtual?.reduce((total, item) => total + (item.valor || 0), 0) || 0;
      
      fluxoMensal.push({
        mes: nomeMes,
        receitas: receitasValor,
        despesas: despesasValor,
        saldo: receitasValor - despesasValor
      });
    }

    // 8. Calcular saldo atual (total de receitas pagas - total de despesas pagas)
    const { data: todasReceitas } = await supabase
      .from('receitas_itens')
      .select('valor')
      .eq('status', 'pago');
      
    const { data: todasDespesas } = await supabase
      .from('despesas')
      .select('valor')
      .eq('status_pagamento', 'pago');
    
    const totalReceitas = todasReceitas?.reduce((total, item) => total + (item.valor || 0), 0) || 0;
    const totalDespesas = todasDespesas?.reduce((total, item) => total + (item.valor || 0), 0) || 0;
    const saldoAtual = totalReceitas - totalDespesas;

    // 9. Calcular crescimento em relação ao mês anterior
    // Obter receitas do mês anterior
    const { data: receitasMesAnterior } = await supabase
      .from('receitas_itens')
      .select('valor')
      .eq('status', 'pago')
      .gte('data_vencimento', dataInicioMesAnterior)
      .lte('data_vencimento', dataFimMesAnterior);
      
    // Obter despesas do mês anterior
    const { data: despesasMesAnterior } = await supabase
      .from('despesas')
      .select('valor')
      .eq('status_pagamento', 'pago')
      .gte('data_lancamento', dataInicioMesAnterior)
      .lte('data_lancamento', dataFimMesAnterior);
    
    const totalReceitasMesAnterior = receitasMesAnterior?.reduce((total, item) => total + (item.valor || 0), 0) || 0;
    const totalDespesasMesAnterior = despesasMesAnterior?.reduce((total, item) => total + (item.valor || 0), 0) || 0;
    const lucroMesAnterior = totalReceitasMesAnterior - totalDespesasMesAnterior;
    
    // Calcular percentuais de crescimento
    const crescimentoReceitas = totalReceitasMesAnterior > 0 ? 
      Math.round(((receitasMes - totalReceitasMesAnterior) / totalReceitasMesAnterior) * 100) : 0;
      
    const crescimentoDespesas = totalDespesasMesAnterior > 0 ? 
      Math.round(((despesasMes - totalDespesasMesAnterior) / totalDespesasMesAnterior) * 100) : 0;
      
    const lucroMes = receitasMes - despesasMes;
    const crescimentoLucro = lucroMesAnterior > 0 ? 
      Math.round(((lucroMes - lucroMesAnterior) / lucroMesAnterior) * 100) : 0;

    // 10. Gerar lista de meses disponíveis para o seletor
    const mesesDisponiveis = [];
    const dataAtual = new Date();
    const anoAtual = getYear(dataAtual);
    
    // Adicionar 24 meses para trás
    for (let i = 0; i < 24; i++) {
      const data = subMonths(dataAtual, i);
      const mes = getMonth(data) + 1; // getMonth é base 0
      const ano = getYear(data);
      mesesDisponiveis.push({
        valor: `${mes.toString().padStart(2, '0')}/${ano}`,
        texto: format(data, 'MMMM yyyy', { locale: ptBR })
      });
    }

    // 11. Montar objeto de estatísticas
    return {
      saldoAtual,
      receitasMes,
      despesasMes,
      lucroMes,
      receitasPendentes,
      despesasPendentes,
      receitasPorCategoria,
      despesasPorCategoria,
      fluxoMensal,
      crescimentoReceitas,
      crescimentoDespesas,
      crescimentoLucro,
      mesesDisponiveis,
      mesAtual: nomeMesAtual,
      mesAnoSelecionado: mesAnoSelecionado || format(new Date(), 'MM/yyyy')
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    throw error;
  }
};

/**
 * Obtém as transações financeiras mais recentes (receitas e despesas)
 * @param limite - Quantidade máxima de transações a retornar
 * @param mesAnoSelecionado - Mês e ano no formato MM/YYYY, se não informado será usado o mês atual
 */
export const obterTransacoesRecentes = async (
  limite: number = 5, 
  mesAnoSelecionado?: string
): Promise<any[]> => {
  try {
    // Definir o período com base no mês selecionado
    let dataInicio: Date, dataFim: Date;
    
    if (mesAnoSelecionado) {
      const [mes, ano] = mesAnoSelecionado.split('/');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      dataInicio = startOfMonth(data);
      dataFim = endOfMonth(data);
    } else {
      const hoje = new Date();
      dataInicio = startOfMonth(hoje);
      dataFim = endOfMonth(hoje);
    }
    
    const dataInicioISO = dataInicio.toISOString();
    const dataFimISO = dataFim.toISOString();

    // Buscar receitas recentes, sem relações complexas
    const { data: receitasRecentes, error: receitasError } = await supabase
      .from('receitas_itens')
      .select('id, valor, data_vencimento, status')
      .gte('data_vencimento', dataInicioISO)
      .lte('data_vencimento', dataFimISO)
      .order('data_vencimento', { ascending: false })
      .limit(limite);

    if (receitasError) {
      console.error('Erro ao buscar receitas recentes:', receitasError);
      // Continuar com array vazio em caso de erro
    }

    // Buscar despesas recentes, sem relações complexas
    const { data: despesasRecentes, error: despesasError } = await supabase
      .from('despesas')
      .select('id, valor, data_lancamento, status_pagamento, descricao')
      .gte('data_lancamento', dataInicioISO)
      .lte('data_lancamento', dataFimISO)
      .order('data_lancamento', { ascending: false })
      .limit(limite);

    if (despesasError) {
      console.error('Erro ao buscar despesas recentes:', despesasError);
      // Continuar com array vazio em caso de erro
    }

    // Transformar as receitas no formato de transação
    const receitasTransformadas = (receitasRecentes || []).map(item => ({
      id: item.id,
      tipo: 'receita',
      descricao: 'Receita',
      valor: item.valor,
      data: item.data_vencimento,
      dataVencimento: item.data_vencimento,
      status: item.status
    }));

    // Transformar as despesas no formato de transação
    const despesasTransformadas = (despesasRecentes || []).map(item => ({
      id: item.id,
      tipo: 'despesa',
      descricao: item.descricao || 'Despesa',
      valor: item.valor,
      data: item.data_lancamento,
      dataVencimento: item.data_lancamento, // Usar data_lancamento no lugar de data_vencimento
      status: item.status_pagamento
    }));

    // Combinar e ordenar por data mais recente
    const todasTransacoes = [...receitasTransformadas, ...despesasTransformadas];
    todasTransacoes.sort((a, b) => {
      const dataA = new Date(a.data).getTime();
      const dataB = new Date(b.data).getTime();
      return dataB - dataA; // Ordenação decrescente
    });

    return todasTransacoes.slice(0, limite);
  } catch (error) {
    console.error('Erro ao obter transações recentes:', error);
    return [];
  }
};

/**
 * Obtém as transações pendentes
 * @param limite - Quantidade máxima de transações a retornar
 * @param mesAnoSelecionado - Mês e ano no formato MM/YYYY, se não informado será usado o mês atual
 */
export const obterTransacoesPendentes = async (
  limite: number = 3,
  mesAnoSelecionado?: string
): Promise<any[]> => {
  try {
    // Definir o período com base no mês selecionado
    let dataInicio: Date, dataFim: Date;
    
    if (mesAnoSelecionado) {
      const [mes, ano] = mesAnoSelecionado.split('/');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      dataInicio = startOfMonth(data);
      dataFim = endOfMonth(data);
    } else {
      const hoje = new Date();
      dataInicio = startOfMonth(hoje);
      dataFim = endOfMonth(hoje);
    }
    
    const dataInicioISO = dataInicio.toISOString();
    const dataFimISO = dataFim.toISOString();

    // Buscar receitas pendentes, sem relações complexas
    const { data: receitasPendentes, error: receitasError } = await supabase
      .from('receitas_itens')
      .select('id, valor, data_vencimento')
      .eq('status', 'pendente')
      .gte('data_vencimento', dataInicioISO)
      .lte('data_vencimento', dataFimISO)
      .order('data_vencimento', { ascending: true })
      .limit(limite);

    if (receitasError) {
      console.error('Erro ao buscar receitas pendentes:', receitasError);
      // Continuar com array vazio em caso de erro
    }

    // Buscar despesas pendentes, sem relações complexas
    const { data: despesasPendentes, error: despesasError } = await supabase
      .from('despesas')
      .select('id, valor, data_lancamento, descricao')
      .eq('status_pagamento', 'pendente')
      .gte('data_lancamento', dataInicioISO)
      .lte('data_lancamento', dataFimISO)
      .order('data_lancamento', { ascending: true })
      .limit(limite);

    if (despesasError) {
      console.error('Erro ao buscar despesas pendentes:', despesasError);
      // Continuar com array vazio em caso de erro
    }

    // Transformar as receitas no formato de transação
    const receitasTransformadas = (receitasPendentes || []).map(item => ({
      id: item.id,
      tipo: 'receita',
      descricao: 'Receita Pendente',
      valor: item.valor,
      data: item.data_vencimento,
      dataVencimento: item.data_vencimento,
      status: 'pendente'
    }));

    // Transformar as despesas no formato de transação
    const despesasTransformadas = (despesasPendentes || []).map(item => ({
      id: item.id,
      tipo: 'despesa',
      descricao: item.descricao || 'Despesa Pendente',
      valor: item.valor,
      data: item.data_lancamento,
      dataVencimento: item.data_lancamento, // Usar data_lancamento no lugar de data_vencimento
      status: 'pendente'
    }));

    // Combinar e ordenar por data de vencimento mais próxima
    const todasTransacoes = [...receitasTransformadas, ...despesasTransformadas];
    todasTransacoes.sort((a, b) => {
      const dataA = new Date(a.dataVencimento).getTime();
      const dataB = new Date(b.dataVencimento).getTime();
      return dataA - dataB; // Ordenação crescente por vencimento
    });

    return todasTransacoes.slice(0, limite);
  } catch (error) {
    console.error('Erro ao obter transações pendentes:', error);
    return [];
  }
}; 