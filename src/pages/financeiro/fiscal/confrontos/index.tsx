import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarRange, ArrowDown, ArrowUp, AlertTriangle, CheckCircle, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ComparativoReceitas from './ComparativoReceitas';
import ComparativoDespesas from './ComparativoDespesas';
import { ListaDesejos } from '@/components/fiscal/ListaDesejos';

// Componente para filtro de período
const FiltroData = ({ periodo, setPeriodo, periodoCustom, setPeriodoCustom }) => {
  return (
    <div className="flex items-center gap-2">
      <Label className="whitespace-nowrap font-medium">Período:</Label>
      <Select value={periodo} onValueChange={setPeriodo}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="atual">Mês atual</SelectItem>
          <SelectItem value="anterior">Mês anterior</SelectItem>
          <SelectItem value="3meses">Últimos 3 meses</SelectItem>
          <SelectItem value="6meses">Últimos 6 meses</SelectItem>
          <SelectItem value="12meses">Últimos 12 meses</SelectItem>
          <SelectItem value="custom">Período personalizado</SelectItem>
        </SelectContent>
      </Select>
      
      {periodo === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={periodoCustom.inicio}
            onChange={(e) => setPeriodoCustom({...periodoCustom, inicio: e.target.value})}
            className="border rounded p-2 text-sm"
          />
          <span>até</span>
          <input
            type="date"
            value={periodoCustom.fim}
            onChange={(e) => setPeriodoCustom({...periodoCustom, fim: e.target.value})}
            className="border rounded p-2 text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default function ConfrontosFiscaisPage() {
  const [activeTab, setActiveTab] = useState('comparativos');
  const [periodo, setPeriodo] = useState('3meses');
  const [periodoCustom, setPeriodoCustom] = useState({
    inicio: format(startOfMonth(subMonths(new Date(), 3)), 'yyyy-MM-dd'),
    fim: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [carregando, setCarregando] = useState(true);
  
  // Resumo fiscal para o card de status
  const [resumoFiscal, setResumoFiscal] = useState({
    receitasComNota: {
      total: 0,
      percentual: 0,
      status: 'ok' // 'ok', 'alerta', 'perigo'
    },
    despesasComNota: {
      total: 0,
      percentual: 0,
      status: 'ok' // 'ok', 'alerta', 'perigo'
    },
    lucroPeriodo: 0
  });
  
  // Atualiza as datas do período selecionado
  useEffect(() => {
    const hoje = new Date();
    let inicio, fim;
    
    switch (periodo) {
      case 'atual':
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      case 'anterior':
        inicio = startOfMonth(subMonths(hoje, 1));
        fim = endOfMonth(subMonths(hoje, 1));
        break;
      case '3meses':
        inicio = startOfMonth(subMonths(hoje, 2));
        fim = endOfMonth(hoje);
        break;
      case '6meses':
        inicio = startOfMonth(subMonths(hoje, 5));
        fim = endOfMonth(hoje);
        break;
      case '12meses':
        inicio = startOfMonth(subMonths(hoje, 11));
        fim = endOfMonth(hoje);
        break;
      case 'custom':
        inicio = new Date(periodoCustom.inicio);
        fim = new Date(periodoCustom.fim);
        break;
      default:
        inicio = startOfMonth(subMonths(hoje, 2));
        fim = endOfMonth(hoje);
    }
    
    setDataInicio(format(inicio, 'yyyy-MM-dd'));
    setDataFim(format(fim, 'yyyy-MM-dd'));
    
  }, [periodo, periodoCustom]);
  
  // Carregar dados de resumo fiscal
  useEffect(() => {
    const carregarDadosFiscais = async () => {
      if (!dataInicio || !dataFim) return;
      
      setCarregando(true);
      
      try {
        // 1. Buscar itens de receita no período (apenas CNPJ)
        const { data: itensReceita, error: errorReceitas } = await supabase
          .from('receitas_itens')
          .select(`
            id,
            valor,
            data_vencimento,
            receita:receita_id (
              id,
              cliente:cliente_id (
                id,
                documento
              )
            )
          `)
          .gte('data_vencimento', dataInicio)
          .lte('data_vencimento', dataFim)
          .eq('status', 'pago');
          
        if (errorReceitas) throw errorReceitas;
        
        // 2. Filtrar apenas os itens de clientes com CNPJ (PJ)
        const itensCNPJ = (itensReceita || []).filter(item => {
          const documento = item?.receita?.cliente?.documento || '';
          // Verificar se o documento tem formato de CNPJ (14 dígitos ou formatado)
          return documento.replace(/\D/g, '').length === 14;
        });
        
        // 3. Buscar notas fiscais emitidas no período
        const { data: notasFiscais, error: errorNotas } = await supabase
          .from('notas_fiscais')
          .select('id, valor, data_emissao')
          .gte('data_emissao', dataInicio)
          .lte('data_emissao', dataFim);
          
        if (errorNotas) throw errorNotas;
        
        // 4. Calcular valor total das receitas de clientes PJ
        const valorTotalCNPJ = itensCNPJ.reduce((total, item) => {
          const valor = typeof item.valor === 'number' 
            ? item.valor 
            : parseFloat(String(item.valor)) || 0;
          return total + valor;
        }, 0);
        
        // 5. Calcular valor total das notas fiscais emitidas
        const valorTotalNotas = (notasFiscais || []).reduce((total, nota) => {
          // Garantir que o valor seja tratado como número
          const valorNota = typeof nota.valor === 'number' 
            ? nota.valor 
            : parseFloat(String(nota.valor)) || 0;
            
          return total + valorNota;
        }, 0);
        
        // 6. Calcular percentual de conformidade de receitas
        const percentualReceitas = valorTotalCNPJ > 0 
          ? Math.min(100, Math.round((valorTotalNotas / valorTotalCNPJ) * 100)) 
          : 0;
          
        // 7. Definir status de conformidade de receitas
        let statusReceitas = 'ok';
        if (percentualReceitas < 90) {
          statusReceitas = 'perigo';
        } else if (percentualReceitas < 100) {
          statusReceitas = 'alerta';
        }
        
        // 8. Buscar despesas não fiscais no período
        const { data: despesas, error: errorDespesas } = await supabase
          .from('despesas')
          .select(`
            id,
            valor,
            data_lancamento,
            categoria:categoria_id (
              id,
              nome,
              despesa_fiscal
            )
          `)
          .gte('data_lancamento', dataInicio)
          .lte('data_lancamento', dataFim)
          .eq('status_pagamento', 'pago');
          
        if (errorDespesas) throw errorDespesas;
        
        // 9. Filtrar apenas despesas não fiscais
        const despesasNaoFiscais = (despesas || []).filter(item => !item?.categoria?.despesa_fiscal);
        
        // 10. Buscar notas fiscais recebidas no período
        const { data: notasFiscaisRecebidas, error: errorNotasRecebidas } = await supabase
          .from('notas_fiscais_recebidas')
          .select('id, valor_total, data_emissao')
          .gte('data_emissao', dataInicio)
          .lte('data_emissao', dataFim);
          
        if (errorNotasRecebidas) throw errorNotasRecebidas;
        
        // 11. Calcular valor total das despesas não fiscais
        const valorTotalDespesasNF = despesasNaoFiscais.reduce((total, item) => total + (item.valor || 0), 0);
        
        // 12. Calcular valor total das notas fiscais recebidas
        const valorTotalNotasRecebidas = (notasFiscaisRecebidas || []).reduce((total, nota) => {
          // Garantir que o valor seja tratado como número
          const valorNota = typeof nota.valor_total === 'number' 
            ? nota.valor_total 
            : parseFloat(String(nota.valor_total)) || 0;
            
          return total + valorNota;
        }, 0);
        
        // 13. Calcular percentual de conformidade de despesas
        const percentualDespesas = valorTotalDespesasNF > 0 
          ? Math.min(100, Math.round((valorTotalNotasRecebidas / valorTotalDespesasNF) * 100)) 
          : 0;
          
        // 14. Definir status de conformidade de despesas
        let statusDespesas = 'ok';
        if (percentualDespesas < 90) {
          statusDespesas = 'perigo';
        } else if (percentualDespesas < 100) {
          statusDespesas = 'alerta';
        }
        
        // 15. Calcular lucro no período (total receitas - total despesas)
        const totalReceitas = itensReceita ? itensReceita.reduce((total, item) => {
          const valor = typeof item.valor === 'number' 
            ? item.valor 
            : parseFloat(String(item.valor)) || 0;
          return total + valor;
        }, 0) : 0;
        
        const totalDespesas = despesas ? despesas.reduce((total, item) => {
          const valor = typeof item.valor === 'number' 
            ? item.valor 
            : parseFloat(String(item.valor)) || 0;
          return total + valor;
        }, 0) : 0;
        
        const lucro = totalReceitas - totalDespesas;
        
        // 16. Atualizar o estado de resumo fiscal
        setResumoFiscal({
          receitasComNota: {
            total: itensCNPJ.length,
            percentual: percentualReceitas,
            status: statusReceitas
          },
          despesasComNota: {
            total: despesasNaoFiscais.length,
            percentual: percentualDespesas,
            status: statusDespesas
          },
          lucroPeriodo: lucro
        });
        
      } catch (error) {
        console.error('Erro ao carregar dados fiscais:', error);
        
        // Dados de exemplo para desenvolvimento
        setResumoFiscal({
          receitasComNota: {
            total: 0,
            percentual: 0,
            status: 'ok'
          },
          despesasComNota: {
            total: 0,
            percentual: 0,
            status: 'ok'
          },
          lucroPeriodo: 0
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDadosFiscais();
  }, [dataInicio, dataFim]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Acompanhe a conformidade fiscal entre receitas, despesas e notas fiscais
        </p>
        
        <FiltroData 
          periodo={periodo} 
          setPeriodo={setPeriodo} 
          periodoCustom={periodoCustom} 
          setPeriodoCustom={setPeriodoCustom} 
        />
      </div>
      
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              {resumoFiscal.receitasComNota.status === 'ok' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : resumoFiscal.receitasComNota.status === 'alerta' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              Conformidade de Receitas
            </CardTitle>
            <CardDescription>
              Receitas que possuem nota fiscal emitida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold">
                {resumoFiscal.receitasComNota.percentual}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {resumoFiscal.receitasComNota.total} registros verificados
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              {resumoFiscal.despesasComNota.status === 'ok' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : resumoFiscal.despesasComNota.status === 'alerta' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              Conformidade de Despesas
            </CardTitle>
            <CardDescription>
              Despesas não fiscais com nota fiscal recebida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold">
                {resumoFiscal.despesasComNota.percentual}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {resumoFiscal.despesasComNota.total} registros verificados
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-blue-500" />
              Lucro no Período
            </CardTitle>
            <CardDescription>
              Saldo das receitas no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(resumoFiscal.lucroPeriodo)}
              </div>
              <div className="flex items-center mt-1 text-sm">
                {resumoFiscal.lucroPeriodo >= 0 ? (
                  <>
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">Positivo</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500">Negativo</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Abas de conteúdo */}
      <Tabs defaultValue="comparativos" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="comparativos">Comparativos Fiscais</TabsTrigger>
          <TabsTrigger value="desejos">Lista de Desejos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparativos" className="space-y-4">
          <ComparativoReceitas dataInicio={dataInicio} dataFim={dataFim} />
          <ComparativoDespesas dataInicio={dataInicio} dataFim={dataFim} />
        </TabsContent>
        
        <TabsContent value="desejos">
          <ListaDesejos />
        </TabsContent>
      </Tabs>
    </div>
  );
} 