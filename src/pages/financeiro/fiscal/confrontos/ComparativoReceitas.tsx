import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, ExternalLink, Search, DollarSign, FileText, Percent } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PesquisaItensReceitaModal } from '@/components/receitas/PesquisaItensReceitaModal';
import { BancosJuridicosCard } from '@/components/dashboard/BancosJuridicosCard';

interface ComparativoReceitasProps {
  dataInicio: string;
  dataFim: string;
}

interface ReceitaItemSupabase {
  id: string;
  valor: number;
  status: string;
  detalhes_pagamento?: string | Record<string, any>;
  receita_id: string;
  receita?: {
    cliente?: {
      documento?: string;
    };
  };
}

export default function ComparativoReceitas({ dataInicio, dataFim }: ComparativoReceitasProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [totalNotasEmitidas, setTotalNotasEmitidas] = useState(0);
  
  // Estado para o modal de pesquisa de itens de receita
  const [isPesquisaItensModalOpen, setIsPesquisaItensModalOpen] = useState(false);
  
  // Verifica se um objeto possui o banco jurídico em qualquer nível
  // Esta função busca recursivamente o ID do banco em qualquer posição da estrutura do objeto
  const verificarBancoJuridicoRecursivo = (
    obj: any, 
    bancoId: string, 
    depth = 0, 
    maxDepth = 3
  ): boolean => {
    // Limitar profundidade da recursão para evitar loops infinitos
    if (depth >= maxDepth || !obj || typeof obj !== 'object') return false;
    
    // Verificar se o valor do banco existe diretamente em três formatos comuns
    if (
      obj.banco_id === bancoId || 
      obj.bancoId === bancoId ||
      obj.id === bancoId
    ) return true;
    
    // Verificar em todas as chaves do objeto
    for (const key in obj) {
      // Verificar se a propriedade atual tem o ID do banco
      if (obj[key] === bancoId) return true;
      
      // Verificar recursivamente se é um objeto
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (verificarBancoJuridicoRecursivo(obj[key], bancoId, depth + 1, maxDepth)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Função para filtrar itens de receita por banco jurídico específico (Cora SCFI)
  // IMPORTANTE: Esta mesma lógica é usada no BancosJuridicosCard do Dashboard
  const filtrarItemsPorBancoJuridico = (items: ReceitaItemSupabase[]) => {
    // Banco jurídico específico - Cora SCFI - é um banco CNPJ
    const BANCO_JURIDICO_ID = '6a147eb7-3c69-4203-9ef1-adb4258d4451'; // ID do banco Cora SCFI
    
    console.log(`Filtrando itens por banco Cora SCFI: ${items.length} itens CNPJ para verificar`);
    
    // Exibir os primeiros itens para debug
    console.log("Amostra de dados recebidos:");
    items.slice(0, 3).forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        valor: item.valor,
        status: item.status,
        detalhes_pagamento_tipo: typeof item.detalhes_pagamento,
        detalhes_preview: JSON.stringify(item.detalhes_pagamento).substring(0, 100) + '...'
      });
    });
    
    let valorTotalReceitasBancosJuridicos = 0;
    const itensBancosJuridicos: ReceitaItemSupabase[] = [];
    
    items.forEach(item => {
      try {
        // Só considera itens pagos
        if (item.status !== 'pago') return;
        
        // Processa detalhes de pagamento
        let detalhes: any = null;
        
        if (!item.detalhes_pagamento) return;
        
        if (typeof item.detalhes_pagamento === 'string') {
          try {
            detalhes = JSON.parse(item.detalhes_pagamento);
          } catch (e) {
            console.error(`Erro ao parsear JSON dos detalhes de pagamento:`, e);
            return;
          }
        } else {
          detalhes = item.detalhes_pagamento;
        }
        
        // Verifica banco_id em todas as possíveis posições
        // Inclui método recursivo para encontrar em qualquer nível da estrutura
        const temBancoJuridico = 
          detalhes?.banco_id === BANCO_JURIDICO_ID || 
          detalhes?.cartao?.banco_id === BANCO_JURIDICO_ID ||
          detalhes?.boleto?.banco_id === BANCO_JURIDICO_ID ||
          detalhes?.pix?.banco_id === BANCO_JURIDICO_ID ||
          verificarBancoJuridicoRecursivo(detalhes, BANCO_JURIDICO_ID);
          
        if (temBancoJuridico) {
          valorTotalReceitasBancosJuridicos += Number(item.valor);
          itensBancosJuridicos.push(item);
          console.log(`Item ${item.id} com banco jurídico: R$ ${item.valor}`);
        }
      } catch (error) {
        console.error(`Erro ao processar item ${item.id}:`, error);
      }
    });
    
    console.log(`Itens encontrados com banco jurídico: ${itensBancosJuridicos.length}`);
    console.log(`Valor total calculado: R$ ${valorTotalReceitasBancosJuridicos.toFixed(2)}`);
    
    return {
      valorTotalReceitasBancosJuridicos,
      itensBancosJuridicos
    };
  };

  const fetchDataConfrontoFiscal = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verifica se as datas são válidas
      if (!dataInicio?.trim() || !dataFim?.trim()) {
        console.error('Datas inválidas. Abortando consulta.');
        setLoading(false);
        return;
      }
      
      console.log('Buscando dados para confronto fiscal...');

      // Buscar todos os itens de receita pagos no período
      const { data: receitasItens, error: receitasError } = await supabase
        .from('receitas_itens')
        .select(`
          id,
          valor,
          status,
          detalhes_pagamento,
          receita_id,
          receita:receita_id (
            cliente:cliente_id (
              documento
            )
          )
        `)
        .eq('status', 'pago');

      if (receitasError) {
        console.error('Erro ao buscar itens de receita:', receitasError);
        throw receitasError;
      }

      // Caso não tenha encontrado itens
      if (!receitasItens || !Array.isArray(receitasItens)) {
        console.log('Nenhum item de receita encontrado');
        setTotalReceitas(0);
        setTotalNotasEmitidas(0);
        setData([
          { name: 'Itens de Receita (CNPJ - Bancos Jurídicos)', value: 0 },
          { name: 'Notas Fiscais Emitidas', value: 0 }
        ]);
        setLoading(false);
        return;
      }

      console.log(`Total de itens de receita encontrados: ${receitasItens.length}`);

      // Filtrar apenas itens de clientes com CNPJ
      const receitasCnpj = (receitasItens as unknown as ReceitaItemSupabase[]).filter(item => {
        try {
          const documento = item?.receita?.cliente?.documento || '';
          // CNPJ tem 14 dígitos numéricos ou formato com pontos, traços e barra
          return documento.includes('/') || documento.replace(/\D/g, '').length === 14;
        } catch (e) {
          console.error('Erro ao processar documento do cliente:', e);
          return false;
        }
      });

      console.log(`Itens de clientes CNPJ: ${receitasCnpj.length}`);

      // Aplicar filtro para encontrar itens com bancos jurídicos
      // Esta função calcula o valor total correto
      const { valorTotalReceitasBancosJuridicos, itensBancosJuridicos } = filtrarItemsPorBancoJuridico(receitasCnpj);

      // Inicializar valor total de notas fiscais
      let valorTotalNotasFiscais = 0;
      
      try {
        // Buscar notas fiscais emitidas no período pela data de emissão - Sem filtro de data para evitar problemas
        const { data: notasFiscais, error: notasError } = await supabase
          .from('notas_fiscais')
          .select('*');

        if (notasError) {
          console.error('Erro ao buscar notas fiscais:', notasError);
          // Não lançar erro, continuar com valorTotalNotasFiscais = 0
        } else if (notasFiscais && Array.isArray(notasFiscais)) {
          // Calcular valor total das notas fiscais se encontrou dados
          valorTotalNotasFiscais = notasFiscais.reduce(
            (total, nota) => total + Number(nota.valor || 0), 0
          );
          
          console.log(`Notas fiscais encontradas: ${notasFiscais.length}`);
          console.log(`Valor total de notas fiscais: R$ ${valorTotalNotasFiscais.toFixed(2)}`);
        }
      } catch (notasError) {
        console.error('Erro ao processar notas fiscais:', notasError);
        // Continuar com valorTotalNotasFiscais = 0
      }

      // Atualizar estados
      setTotalReceitas(valorTotalReceitasBancosJuridicos);
      setTotalNotasEmitidas(valorTotalNotasFiscais);
      
      // Preparar dados para o gráfico
      const chartData = [
        { name: 'Itens de Receita (CNPJ - Bancos Jurídicos)', value: valorTotalReceitasBancosJuridicos },
        { name: 'Notas Fiscais Emitidas', value: valorTotalNotasFiscais }
      ];

      setData(chartData);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados para confronto fiscal:', error);
      setError('Ocorreu um erro ao carregar os dados de confronto fiscal.');
      setLoading(false);
    }
  };
  
  // Carregar dados quando o componente montar
  useEffect(() => {
      fetchDataConfrontoFiscal();
  }, [dataInicio, dataFim]);
  
  // Calcular diferença percentual entre receitas e notas fiscais
  const diferencaPercentual = totalReceitas === 0 
    ? 0 
    : ((totalNotasEmitidas - totalReceitas) / totalReceitas * 100).toFixed(1);
  
  // Definir status de conformidade
  const conformidadeStatus = 
    Math.abs(Number(diferencaPercentual)) < 5 ? 'ok' : 
    Math.abs(Number(diferencaPercentual)) < 15 ? 'alerta' : 'perigo';
  
  // Formatar valor para exibição
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  // Função para abrir o modal de pesquisa
  const abrirModalPesquisa = useCallback(() => {
    console.log('Abrindo modal de pesquisa');
    setIsPesquisaItensModalOpen(true);
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6">
        {/* Cards with values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Usando o componente BancosJuridicosCard do Dashboard */}
          <BancosJuridicosCard
            title="Itens de Receita (CNPJ - Bancos Jurídicos)"
            subtitle="Total de itens com bancos jurídicos"
          />
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Notas Fiscais Emitidas
              </CardTitle>
              <CardDescription>Total de notas fiscais emitidas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-10 animate-pulse bg-gray-200 rounded"></div>
              ) : (
                <div className="text-3xl font-bold text-blue-600">{formatarValor(totalNotasEmitidas)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-gray-600" />
                Diferença Percentual
              </CardTitle>
              <CardDescription>
                Diferença entre notas emitidas e receitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-10 animate-pulse bg-gray-200 rounded"></div>
              ) : (
                <div className={`text-3xl font-bold ${conformidadeStatus === 'ok' ? 'text-emerald-600' : conformidadeStatus === 'alerta' ? 'text-amber-600' : 'text-red-600'}`}>
                  {diferencaPercentual}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Comparativo Receitas x Notas Fiscais</CardTitle>
            <CardDescription>
              Comparação entre os itens de receita de clientes jurídicos (CNPJ) e notas fiscais emitidas.
            </CardDescription>
          </CardHeader>
          <CardContent>
              {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-b-2 border-erio-600 rounded-full animate-spin"></div>
                </div>
            ) : error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar dados</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            notation: 'compact',
                            maximumFractionDigits: 1
                          }).format(value)
                        }
                      />
                      <Tooltip 
                        formatter={(value) => 
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(Number(value))
                        }
                      />
                    <Legend />
                      <Bar dataKey="value" name="Valor" fill="#8884d8">
                      {data.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? '#f59e0b' : '#10b981'} 
                          />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
                
                <div className="mt-8 text-center">
                  <Button variant="outline" onClick={abrirModalPesquisa} className="bg-white hover:bg-gray-50">
                    <Search className="mr-2 h-4 w-4" />
                    Pesquisar itens de receita
                  </Button>
                </div>
                
                {conformidadeStatus !== 'ok' && (
                  <Alert
                    variant={conformidadeStatus === 'alerta' ? 'warning' : 'destructive'}
                    className="mt-6"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                      {conformidadeStatus === 'alerta'
                        ? 'Atenção: Inconsistências Fiscais Detectadas'
                        : 'Perigo: Graves Inconsistências Fiscais'}
                    </AlertTitle>
                    <div className="space-y-2">
                      <p>
                        {conformidadeStatus === 'alerta'
                          ? 'Existem itens de receita sem nota fiscal emitida. Regularize a situação para evitar problemas futuros.'
                          : 'Há uma diferença significativa entre receitas e notas fiscais emitidas. Regularize a situação fiscal urgentemente para evitar penalidades.'}
                      </p>
              </div>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Modal de pesquisa de itens de receita */}
        <PesquisaItensReceitaModal 
          isOpen={isPesquisaItensModalOpen} 
          onOpenChange={setIsPesquisaItensModalOpen} 
        />
      </div>
    </div>
  );
} 