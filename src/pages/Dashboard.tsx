import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { CategoryDistribution } from '@/components/dashboard/CategoryDistribution';
import { BancosJuridicosCard } from '@/components/dashboard/BancosJuridicosCard';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  AlertCircle,
  Clock,
  CalendarIcon,
  RefreshCw,
  Receipt,
  CreditCard
} from 'lucide-react';
import { formatarMoeda } from '@/lib/formatters';
import { 
  obterEstatisticasDashboard,
  obterTransacoesRecentes,
  obterTransacoesPendentes
} from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EstatisticasFinanceiras } from '@/types';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import * as receitaService from '@/services/receitaService';
import * as despesaService from '@/services/despesaService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DashboardStats {
  receitaTotal: number;
  despesaTotal: number;
  saldoTotal: number;
  totalCartao: number;
  totalResgates: number;
  totalLiquido: number;
  receitaMesAnterior?: number;
  despesaMesAnterior?: number;
  saldoMesAnterior?: number;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState<EstatisticasFinanceiras | null>(null);
  const [transacoesRecentes, setTransacoesRecentes] = useState<any[]>([]);
  const [transacoesPendentes, setTransacoesPendentes] = useState<any[]>([]);
  const [mesAnoSelecionado, setMesAnoSelecionado] = useState<string | undefined>(undefined);
  const [isAtualizando, setIsAtualizando] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    receitaTotal: 0,
    despesaTotal: 0,
    saldoTotal: 0,
    totalCartao: 0,
    totalResgates: 0, 
    totalLiquido: 0,
    receitaMesAnterior: 0,
    despesaMesAnterior: 0,
    saldoMesAnterior: 0
  });

  // Carregar dados reais do banco
  useEffect(() => {
    carregarDados();
  }, [mesAnoSelecionado]);

  const carregarDados = async () => {
    setIsAtualizando(true);
    try {
      // Se mesAnoSelecionado não estiver definido, usar o mês atual
      if (!mesAnoSelecionado) {
        const dataAtual = new Date();
        const mesAtual = String(dataAtual.getMonth() + 1).padStart(2, '0');
        const anoAtual = dataAtual.getFullYear();
        setMesAnoSelecionado(`${mesAtual}/${anoAtual}`);
        return; // Retorna para evitar continuar com mesAnoSelecionado undefined
      }
      
      // Extrair mês e ano da string mesAnoSelecionado
      const [mes, ano] = mesAnoSelecionado.split('/');
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      
      // Calcular o mês anterior para comparação
      let mesAnterior = mesNum - 1;
      let anoAnterior = anoNum;
      
      if (mesAnterior < 1) {
        mesAnterior = 12;
        anoAnterior = anoNum - 1;
      }
      
      // Formatar para dois dígitos
      const mesAnteriorFormatado = mesAnterior.toString().padStart(2, '0');
      
      // Calcular último dia do mês atual e anterior
      const ultimoDiaMes = new Date(anoNum, mesNum, 0).getDate();
      const ultimoDiaMesAnterior = new Date(anoAnterior, mesAnterior, 0).getDate();
      
      // Buscar estatísticas do mês selecionado
      const receitasMes = await receitaService.getReceitasPeriodo(
        `${ano}-${mes}-01`, 
        `${ano}-${mes}-${ultimoDiaMes}`
      );
      const despesasMes = await despesaService.getDespesasPeriodo(
        `${ano}-${mes}-01`, 
        `${ano}-${mes}-${ultimoDiaMes}`
      );
      
      // Buscar estatísticas do mês anterior para comparação
      const receitasMesAnterior = await receitaService.getReceitasPeriodo(
        `${anoAnterior}-${mesAnteriorFormatado}-01`, 
        `${anoAnterior}-${mesAnteriorFormatado}-${ultimoDiaMesAnterior}`
      );
      const despesasMesAnterior = await despesaService.getDespesasPeriodo(
        `${anoAnterior}-${mesAnteriorFormatado}-01`, 
        `${anoAnterior}-${mesAnteriorFormatado}-${ultimoDiaMesAnterior}`
      );
      
      const receitaTotal = receitasMes.reduce((total, item) => total + (parseFloat(item.valor.toString()) || 0), 0);
      const despesaTotal = despesasMes.reduce((total, item) => total + (parseFloat(item.valor.toString()) || 0), 0);
      const saldoTotal = receitaTotal - despesaTotal;
      
      const receitaMesAnterior = receitasMesAnterior.reduce((total, item) => total + (parseFloat(item.valor.toString()) || 0), 0);
      const despesaMesAnterior = despesasMesAnterior.reduce((total, item) => total + (parseFloat(item.valor.toString()) || 0), 0);
      const saldoMesAnterior = receitaMesAnterior - despesaMesAnterior;
      
      // Calcular o total de despesas de cartão para o mês atual
      const despesasCartao = despesasMes.filter(d => 
        (d.detalhes_pagamento as any)?.forma_pagamento?.toLowerCase().includes('cartão')
      );
      const totalCartao = despesasCartao.reduce((total, item) => total + (parseFloat(item.valor.toString()) || 0), 0);
      
      // Calcular resgates (exemplo: despesas marcadas como resgates)
      const despesasResgates = despesasMes.filter(d => 
        (d.detalhes_pagamento as any)?.tipo_operacao === 'resgate'
      );
      const totalResgates = despesasResgates.reduce((total, item) => total + (parseFloat(item.valor.toString()) || 0), 0);
      
      // Saldo líquido (excluindo resgates)
      const totalLiquido = saldoTotal - totalResgates;
      
      // Calcular tendências de crescimento
      const receitaGrowth = receitaMesAnterior > 0 
        ? ((receitaTotal - receitaMesAnterior) / receitaMesAnterior) * 100
        : 0;
        
      const despesaGrowth = despesaMesAnterior > 0
        ? ((despesaTotal - despesaMesAnterior) / despesaMesAnterior) * 100
        : 0;
        
      const saldoGrowth = saldoMesAnterior > 0
        ? ((saldoTotal - saldoMesAnterior) / saldoMesAnterior) * 100
        : 0;
      
      setStats({
        receitaTotal,
        despesaTotal,
        saldoTotal,
        totalCartao,
        totalResgates,
        totalLiquido,
        receitaMesAnterior,
        despesaMesAnterior,
        saldoMesAnterior
      });
      
      // Obter estatísticas
      const estatisticasData = await obterEstatisticasDashboard(mesAnoSelecionado);
      setEstatisticas(estatisticasData);
      
      // Obter transações recentes
      const transacoesRecentesData = await obterTransacoesRecentes(5, mesAnoSelecionado);
      setTransacoesRecentes(transacoesRecentesData);
      
      // Obter transações pendentes
      const transacoesPendentesData = await obterTransacoesPendentes(3, mesAnoSelecionado);
      setTransacoesPendentes(transacoesPendentesData);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Não foi possível carregar os dados do dashboard');
    } finally {
      setIsLoading(false);
      setIsAtualizando(false);
    }
  };

  // Atualizar dados manualmente
  const atualizarDados = () => {
    setIsLoading(true);
    carregarDados();
  };

  // Dados padrão caso não tenha estatísticas
  const dadosPadrao: EstatisticasFinanceiras = {
    saldoAtual: 0,
    receitasMes: 0,
    despesasMes: 0,
    lucroMes: 0,
    receitasPendentes: 0,
    despesasPendentes: 0,
    receitasPorCategoria: {},
    despesasPorCategoria: {},
    fluxoMensal: []
  };

  // Usar estatísticas reais ou dados padrão
  const dados = estatisticas || dadosPadrao;

  // Formatação de dados para os gráficos de categoria
  const receitasPorCategoria = Object.entries(dados.receitasPorCategoria).map(
    ([name, value], index) => {
      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
      return {
        name,
        value,
        color: colors[index % colors.length],
      };
    }
  );

  const despesasPorCategoria = Object.entries(dados.despesasPorCategoria).map(
    ([name, value], index) => {
      const colors = ['#ef4444', '#f59e0b', '#6366f1', '#64748b'];
      return {
        name,
        value,
        color: colors[index % colors.length],
      };
    }
  );

  // Dentro do renderCurrency, caso exista
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Variantes de animação para componentes
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.1,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <PageLayout title="Dashboard">
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Cabeçalho com seletor de mês e botão de atualizar */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-erio-600">
              {dados.mesAtual ? `Dashboard: ${dados.mesAtual}` : 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-500">Visão geral das finanças</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select
              value={mesAnoSelecionado}
              onValueChange={setMesAnoSelecionado}
              disabled={isLoading || isAtualizando}
            >
              <SelectTrigger className="w-[230px]">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <SelectValue placeholder="Selecione um período" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Selecione um mês</SelectLabel>
                  {dados.mesesDisponiveis?.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor}>
                      {mes.texto}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button 
              size="icon" 
              variant="outline" 
              onClick={atualizarDados} 
              disabled={isLoading || isAtualizando}
              className={isAtualizando ? "animate-spin" : ""}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Cards de estatísticas */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6"
          variants={itemVariants}
        >
          <StatCard
            title="Receitas"
            value={formatCurrency(stats.receitaTotal)}
            icon={<DollarSign className="h-5 w-5" />}
            isLoading={isLoading}
            trend={stats.receitaMesAnterior && stats.receitaMesAnterior > 0
              ? ((stats.receitaTotal - stats.receitaMesAnterior) / stats.receitaMesAnterior) * 100
              : undefined}
            trendText="vs mês anterior"
          />
          <StatCard
            title="Despesas"
            value={formatCurrency(stats.despesaTotal)}
            icon={<Receipt className="h-5 w-5" />}
            isLoading={isLoading}
            trend={stats.despesaMesAnterior && stats.despesaMesAnterior > 0
              ? ((stats.despesaTotal - stats.despesaMesAnterior) / stats.despesaMesAnterior) * 100
              : undefined}
            trendText="vs mês anterior"
          />
          <StatCard
            title="Saldo Mensal"
            value={formatCurrency(stats.saldoTotal)}
            icon={<Wallet className="h-5 w-5" />}
            isLoading={isLoading}
            trend={stats.saldoMesAnterior && stats.saldoMesAnterior > 0
              ? ((stats.saldoTotal - stats.saldoMesAnterior) / stats.saldoMesAnterior) * 100
              : undefined}
            trendText="vs mês anterior"
          />
          <StatCard
            title="Despesas Cartão"
            value={formatCurrency(stats.totalCartao)}
            icon={<CreditCard className="h-5 w-5" />}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Card de bancos jurídicos */}
        <motion.div 
          className="mb-6"
          variants={itemVariants}
          whileHover={{ 
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            y: -5, 
            transition: { duration: 0.2 } 
          }}
        >
          <BancosJuridicosCard />
        </motion.div>

        {/* Gráfico de fluxo financeiro */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={itemVariants}
        >
          <motion.div 
            className="lg:col-span-2"
            whileHover={{ 
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              y: -5, 
              transition: { duration: 0.2 } 
            }}
          >
            <FinancialChart 
              data={dados.fluxoMensal} 
              isLoading={isLoading} 
            />
          </motion.div>
          
          <motion.div
            whileHover={{ 
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              y: -5, 
              transition: { duration: 0.2 } 
            }}
          >
            <Card className="h-full overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Pendências</CardTitle>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {transacoesPendentes.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 flex justify-center">
                    <div className="animate-pulse flex flex-col space-y-4 w-full">
                      <div className="h-12 bg-gray-200 rounded w-full"></div>
                      <div className="h-12 bg-gray-200 rounded w-full"></div>
                      <div className="h-12 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ) : transacoesPendentes.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transacoesPendentes.map((transacao, index) => (
                      <motion.div 
                        key={transacao.id} 
                        className="p-4 flex items-start gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`mt-0.5 rounded-full p-1.5 ${
                          transacao.tipo === 'receita' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transacao.tipo === 'receita' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {transacao.descricao}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Vence em: {new Date(transacao.dataVencimento).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          transacao.tipo === 'receita' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatarMoeda(transacao.valor)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma pendência encontrada.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Distribuição por categorias */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={itemVariants}
        >
          <motion.div
            whileHover={{ 
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              y: -5, 
              transition: { duration: 0.2 } 
            }}
          >
          <CategoryDistribution 
            data={receitasPorCategoria}
            title="Receitas por Categoria" 
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div
            whileHover={{ 
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              y: -5, 
              transition: { duration: 0.2 } 
            }}
          >
          <CategoryDistribution 
            data={despesasPorCategoria}
            title="Despesas por Categoria" 
              isLoading={isLoading}
          />
          </motion.div>
        </motion.div>

        {/* Transações recentes */}
        <motion.div
          variants={itemVariants}
          whileHover={{ 
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            y: -5, 
            transition: { duration: 0.2 } 
          }}
        >
        <RecentTransactions 
            transactions={transacoesRecentes}
            isLoading={isLoading}
        />
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default Dashboard;
