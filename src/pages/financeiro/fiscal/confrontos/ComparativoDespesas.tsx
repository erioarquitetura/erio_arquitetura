import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Sector 
} from 'recharts';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComparativoDespesasProps {
  dataInicio: string;
  dataFim: string;
}

interface Despesa {
  id: string;
  valor: number;
  data_lancamento: string;
  categoria: {
    id: string;
    nome: string;
    despesa_fiscal: boolean;
  } | null;
}

interface NotaFiscalRecebida {
  id: string;
  valor_total: string | number;
  data_emissao: string;
}

export default function ComparativoDespesas({ dataInicio, dataFim }: ComparativoDespesasProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compararDados, setCompararDados] = useState<any[]>([]);
  const [dadosDespesasFiscais, setDadosDespesasFiscais] = useState<any[]>([]);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [totalNotasRecebidas, setTotalNotasRecebidas] = useState(0);
  const [totalDespesasFiscais, setTotalDespesasFiscais] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tipoGrafico, setTipoGrafico] = useState('barra');
  
  // Cores para as categorias no gráfico de pizza
  const coresCategorias = [
    '#3b82f6', // Azul
    '#f59e0b', // Âmbar
    '#10b981', // Esmeralda
    '#6366f1', // Índigo
    '#ef4444', // Vermelho
    '#8b5cf6', // Violeta
    '#f97316', // Laranja
    '#14b8a6', // Teal
    '#ec4899', // Rosa
    '#d946ef', // Fúcsia
    '#22c55e', // Verde
    '#64748b', // Cinza Azulado
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!dataInicio || !dataFim) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // 0. Verificar schema da tabela categorias_despesas
        const { data: categoriaSchema, error: schemaError } = await supabase
          .from('categorias_despesas')
          .select('*')
          .limit(1);
          
        if (schemaError) {
          console.error('Erro ao verificar schema de categorias:', schemaError);
        } else {
          console.log('Schema de categoria:', categoriaSchema);
        }
        
        // Verificar todas as categorias de despesas
        const { data: todasCategorias, error: catError } = await supabase
          .from('categorias_despesas')
          .select('*');
          
        if (catError) {
          console.error('Erro ao buscar categorias:', catError);
        } else {
          console.log('Total de categorias encontradas:', todasCategorias?.length || 0);
          console.log('Categorias não fiscais:', todasCategorias?.filter(c => c.despesa_fiscal === false).length || 0);
          console.log('Categorias fiscais:', todasCategorias?.filter(c => c.despesa_fiscal === true).length || 0);
          console.log('Categorias com despesa_fiscal undefined:', todasCategorias?.filter(c => c.despesa_fiscal === undefined).length || 0);
          
          // Verificar os valores de todas as categorias
          todasCategorias?.forEach(cat => {
            console.log(`Categoria ${cat.nome}: despesa_fiscal=${cat.despesa_fiscal}`);
          });
        }
        
        // 1. Buscar todas as despesas no período
        const { data: despesas, error: errorDespesas } = await supabase
          .from('despesas')
          .select(`
            id,
            valor,
            data_lancamento,
            status_pagamento,
            categoria_id,
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
        
        console.log('Total de despesas encontradas:', despesas?.length || 0);
        console.log('Exemplo de despesa:', despesas?.[0]);
        
        // 2. Filtrar apenas despesas não fiscais (categoria.despesa_fiscal === false)
        const despesasNaoFiscais = (despesas || []).filter((item: Despesa) => {
          // Verificar se a categoria existe e se despesa_fiscal é false
          if (!item?.categoria) {
            console.log(`Despesa sem categoria: ${item.id}`);
            return false;
          }
          
          // Verificar se a propriedade despesa_fiscal existe e seu valor
          const despesaFiscal = item.categoria.despesa_fiscal;
          console.log(`Analisando despesa ${item.id}: categoria=${item.categoria.nome}, despesa_fiscal=${String(despesaFiscal)}, tipo=${typeof despesaFiscal}, valor=${item.valor}`);
          
          // Considerar explicitamente false como não fiscal
          // Os valores null, undefined, ou true indicam categoria fiscal
          const ehNaoFiscal = despesaFiscal === false;
          
          if (ehNaoFiscal) {
            console.log(`Despesa não fiscal encontrada: ${item.id}, categoria: ${item.categoria?.nome}, valor: ${item.valor}`);
          }
          return ehNaoFiscal;
        });
        
        // Filtrar despesas fiscais (categoria.despesa_fiscal === true ou não definido)
        const despesasFiscais = (despesas || []).filter((item: Despesa) => {
          // Verificar se a categoria existe
          if (!item?.categoria) {
            return false;
          }
          
          // Se a propriedade despesa_fiscal for explicitamente false, não é fiscal
          // Caso contrário (true, null, undefined) consideramos como fiscal por padrão
          const ehFiscal = item.categoria.despesa_fiscal !== false;
          
          if (ehFiscal) {
            console.log(`Despesa fiscal encontrada: ${item.id}, categoria: ${item.categoria?.nome}, valor: ${item.valor}`);
          }
          return ehFiscal;
        });
        
        console.log('Despesas não fiscais encontradas:', despesasNaoFiscais.length);
        console.log('Despesas fiscais encontradas:', despesasFiscais.length);
        
        // Calcular o valor total das despesas não fiscais
        const valorTotalNaoFiscais = despesasNaoFiscais.reduce((total, item) => {
          return total + (item.valor || 0);
        }, 0);
        setTotalDespesas(valorTotalNaoFiscais);
        
        // Calcular o valor total das despesas fiscais
        const valorTotalFiscais = despesasFiscais.reduce((total, item) => {
          return total + (item.valor || 0);
        }, 0);
        setTotalDespesasFiscais(valorTotalFiscais);
        
        // 3. Buscar notas fiscais recebidas no período
        const { data: notasFiscais, error: errorNotas } = await supabase
          .from('notas_fiscais_recebidas')
          .select('id, valor_total, data_emissao')
          .gte('data_emissao', dataInicio)
          .lte('data_emissao', dataFim);
          
        if (errorNotas) throw errorNotas;
        
        console.log('Notas fiscais recebidas encontradas:', notasFiscais?.length || 0);
        
        // Exibir os dados das notas para debug
        notasFiscais?.forEach((nota: NotaFiscalRecebida, index: number) => {
          console.log(`Nota ${index+1}: id=${nota.id}, valor_total=${nota.valor_total}, tipo=${typeof nota.valor_total}`);
        });
        
        // Corrigindo o cálculo do valor total das notas fiscais recebidas
        const valorTotalNotas = (notasFiscais || []).reduce((total, nota: NotaFiscalRecebida) => {
          // Converter valor_total para número, considerando que pode vir como string do Supabase
          let valorNota = 0;
          
          if (typeof nota.valor_total === 'string') {
            valorNota = parseFloat(nota.valor_total.replace(/,/g, '.'));
          } else if (typeof nota.valor_total === 'number') {
            valorNota = nota.valor_total;
          }
            
          console.log(`Processando nota fiscal: ${nota.id}, valor original=${nota.valor_total}, tipo=${typeof nota.valor_total}, valor convertido=${valorNota}`);
          return total + valorNota;
        }, 0);
        
        console.log('Valor total calculado das notas fiscais:', valorTotalNotas);
        setTotalNotasRecebidas(valorTotalNotas);
        
        // 4. Preparar dados para o gráfico de comparação
        const chartData = [
          { name: 'Despesas (Não Fiscais)', valor: valorTotalNaoFiscais },
          { name: 'Notas Fiscais Recebidas', valor: valorTotalNotas }
        ];
        setCompararDados(chartData);
        
        // 5. Preparar dados para o gráfico de despesas fiscais
        const agrupado = despesasFiscais.reduce((acc: Record<string, number>, item: Despesa) => {
          // Se a categoria não existir, considerar como "Sem categoria"
          const categoria = item.categoria?.nome || 'Sem categoria';
          if (!acc[categoria]) {
            acc[categoria] = 0;
          }
          acc[categoria] += Number(item.valor || 0);
          return acc;
        }, {});
        
        // Converter para o formato de dados do gráfico
        const dadosPieChart = Object.entries(agrupado).map(([name, valor]) => ({
          name,
          valor: Number(valor)
        }));
        
        console.log('Dados do gráfico de despesas fiscais:', dadosPieChart);
        setDadosDespesasFiscais(dadosPieChart);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Não foi possível carregar os dados de comparação');
        
        // Dados de exemplo para desenvolvimento - removidos para usar valores reais
        setCompararDados([
          { name: 'Despesas (Não Fiscais)', valor: 0 },
          { name: 'Notas Fiscais Recebidas', valor: 0 }
        ]);
        setTotalDespesas(0);
        setTotalNotasRecebidas(0);
        setDadosDespesasFiscais([]);
        setTotalDespesasFiscais(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dataInicio, dataFim]);
  
  // Calcular diferença percentual
  const diferencaPercentual = totalDespesas > 0
    ? ((totalNotasRecebidas - totalDespesas) / totalDespesas * 100).toFixed(2)
    : '0.00';
    
  // Verificar status de conformidade
  const conformidadeStatus = 
    totalNotasRecebidas >= totalDespesas ? 'ok' :
    totalNotasRecebidas >= totalDespesas * 0.9 ? 'alerta' : 'perigo';
    
  // Renderizador para o setor ativo no gráfico de pizza
  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, valor } = props;
    const sin = Math.sin(-midAngle * Math.PI / 180);
    const cos = Math.cos(-midAngle * Math.PI / 180);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{payload.name}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`${(percent * 100).toFixed(2)}%`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={36} textAnchor={textAnchor} fill="#333">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(valor)}
        </text>
      </g>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          Análise de Despesas
          {loading && <div className="w-4 h-4 rounded-full border-t-2 border-b-2 border-erio-600 animate-spin ml-2" />}
        </CardTitle>
        <CardDescription>
          Comparação entre despesas não fiscais e notas fiscais recebidas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Tabs defaultValue="comparativo" className="w-full mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="comparativo">Comparativo de Despesas</TabsTrigger>
                <TabsTrigger value="fiscal">Despesas Fiscais</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comparativo" className="space-y-4">
                {conformidadeStatus !== 'ok' && (
                  <Alert 
                    variant={conformidadeStatus === 'alerta' ? 'warning' : 'destructive'} 
                    className="mb-4"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Inconsistência fiscal detectada</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2">
                      <p>
                        {conformidadeStatus === 'alerta' 
                          ? 'Existem despesas sem nota fiscal recebida.'
                          : 'Atenção! Há uma diferença significativa entre despesas e notas recebidas.'}
                      </p>
                      <p>
                        Diferença: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(totalDespesas - totalNotasRecebidas)} ({diferencaPercentual}%)
                      </p>
                      <Button size="sm" variant="outline" className="w-fit mt-1">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Solicitar notas pendentes
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <div className="text-sm font-medium text-gray-500 mb-1">Despesas Não Fiscais</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalDespesas)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total de despesas em categorias não fiscais
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <div className="text-sm font-medium text-gray-500 mb-1">Notas Fiscais Recebidas</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalNotasRecebidas)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total de notas fiscais recebidas no período
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <div className="text-sm font-medium text-gray-500 mb-1">Conformidade</div>
                    <div className="text-2xl font-bold">
                      {totalDespesas === 0 ? (
                        <span className="text-gray-600">N/A</span>
                      ) : totalNotasRecebidas >= totalDespesas ? (
                        <span className="text-green-600">100%</span>
                      ) : (
                        <span className={totalNotasRecebidas >= totalDespesas * 0.9 ? "text-yellow-600" : "text-red-600"}>
                          {(totalNotasRecebidas / totalDespesas * 100).toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Relação entre notas fiscais e despesas
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mb-2">
                  <div className="flex border rounded-md overflow-hidden">
                    <button 
                      className={`px-3 py-1 text-sm ${tipoGrafico === 'barra' ? 'bg-erio-100 text-erio-700' : 'bg-white'}`}
                      onClick={() => setTipoGrafico('barra')}
                    >
                      Barras
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm ${tipoGrafico === 'pizza' ? 'bg-erio-100 text-erio-700' : 'bg-white'}`}
                      onClick={() => setTipoGrafico('pizza')}
                    >
                      Pizza
                    </button>
                  </div>
                </div>
                
                <div className="h-80">
                  {tipoGrafico === 'barra' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={compararDados}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
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
                        <Bar dataKey="valor" name="Valor">
                          {compararDados.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? '#f59e0b' : '#10b981'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          data={compararDados}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          fill="#8884d8"
                          dataKey="valor"
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                        >
                          {compararDados.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? '#f59e0b' : '#10b981'}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="fiscal">
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">Total de Despesas Fiscais</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalDespesasFiscais)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Soma de todas as despesas em categorias fiscais
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={dadosDespesasFiscais}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="valor"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                      >
                        {dadosDespesasFiscais.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={coresCategorias[index % coresCategorias.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => 
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(Number(value))
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
} 