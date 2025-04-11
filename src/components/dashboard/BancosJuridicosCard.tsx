import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign } from 'lucide-react';

interface BancosJuridicosCardProps {
  title?: string;
  subtitle?: string;
}

// Interface para os itens retornados pelo Supabase
interface ReceitaItem {
  id: string;
  valor: number;
  status: string;
  detalhes_pagamento?: Record<string, any> | string | null;
}

export const BancosJuridicosCard = ({ 
  title = "Itens de Receita (CNPJ - Bancos Jurídicos)",
  subtitle = "Total de itens com bancos jurídicos"
}: BancosJuridicosCardProps) => {
  const [loading, setLoading] = useState(true);
  const [totalValor, setTotalValor] = useState(0);

  useEffect(() => {
    fetchBancosJuridicosTotal();
  }, []);

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

  const fetchBancosJuridicosTotal = async () => {
    setLoading(true);
    
    try {
      console.log("Iniciando busca de itens de receita com bancos jurídicos");
      
      // Banco jurídico específico - Cora SCFI
      const BANCO_JURIDICO_ID = '6a147eb7-3c69-4203-9ef1-adb4258d4451';
      
      // Buscar todos os itens de receita com status 'pago'
      const { data, error } = await supabase
        .from('receitas_itens')
        .select('id, valor, status, detalhes_pagamento')
        .eq('status', 'pago');

      if (error) {
        console.error('Erro ao buscar itens de receita:', error);
        setLoading(false);
        return;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('Nenhum item de receita encontrado');
        setTotalValor(0);
        setLoading(false);
        return;
      }

      console.log(`Itens de receita encontrados: ${data.length}`);
      
      // Converter para o tipo ReceitaItem para facilitar manipulação
      const itens = data as unknown as ReceitaItem[];
      
      // Filtrar itens com banco Cora nos detalhes de pagamento
      let valorTotal = 0;
      let contadorItensEncontrados = 0;
      
      itens.forEach(item => {
        try {
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
          
          const temBancoJuridico = 
            detalhes?.banco_id === BANCO_JURIDICO_ID || 
            detalhes?.cartao?.banco_id === BANCO_JURIDICO_ID ||
            detalhes?.boleto?.banco_id === BANCO_JURIDICO_ID ||
            detalhes?.pix?.banco_id === BANCO_JURIDICO_ID ||
            verificarBancoJuridicoRecursivo(detalhes, BANCO_JURIDICO_ID);
            
          if (temBancoJuridico) {
            valorTotal += Number(item.valor);
            contadorItensEncontrados++;
            console.log(`Item ${item.id} com banco jurídico: R$ ${item.valor}`);
          }
        } catch (error) {
          console.error(`Erro ao processar item ${item.id}:`, error);
        }
      });
      
      console.log(`Itens encontrados com banco jurídico: ${contadorItensEncontrados}`);
      console.log(`Valor total calculado: R$ ${valorTotal.toFixed(2)}`);
      
      setTotalValor(valorTotal);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setLoading(false);
    }
  };

  // Formatar valor para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gray-600" />
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-10 animate-pulse bg-gray-200 rounded"></div>
        ) : (
          <div className="text-3xl font-bold text-emerald-600">
            {formatCurrency(totalValor)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 