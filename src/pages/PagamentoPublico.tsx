import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { buscarReceitaPorToken } from '@/services/receitaService';
import { Receita, ReceitaItem } from '@/types/receita';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, AlertCircle, CreditCard, Landmark, Wallet, QrCode } from 'lucide-react';
import * as QRCodeReact from 'qrcode.react';
import { toast } from 'sonner';

const QRCode = QRCodeReact.QRCodeSVG;

const PagamentoPublico = () => {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [mostrando, setMostrando] = useState(false);
  const [receita, setReceita] = useState<Receita | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Mostrar a animação por 4 segundos antes de carregar os dados
    const timerAnimacao = setTimeout(() => {
      setMostrando(true);
      carregarReceita();
    }, 4000);

    return () => clearTimeout(timerAnimacao);
  }, [token]);

  const carregarReceita = async () => {
    if (!token) {
      setErro('Link de pagamento inválido');
      setIsLoading(false);
      return;
    }

    try {
      const data = await buscarReceitaPorToken(token);
      
      if (!data) {
        setErro('Não foi possível encontrar as informações de pagamento');
      } else {
        setReceita(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de pagamento:', error);
      setErro('Ocorreu um erro ao carregar as informações de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return '-';
    return format(new Date(dataIso), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'pago_parcial':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pago Parcial</Badge>;
      case 'pago':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const copiarPix = (chavePix: string, itemId: string) => {
    navigator.clipboard.writeText(chavePix).then(
      () => {
        setCopiado(prev => ({ ...prev, [itemId]: true }));
        toast.success('Chave PIX copiada para a área de transferência!');
        
        // Resetar o estado após 3 segundos
        setTimeout(() => {
          setCopiado(prev => ({ ...prev, [itemId]: false }));
        }, 3000);
      },
      (err) => {
        console.error('Erro ao copiar chave PIX:', err);
        toast.error('Não foi possível copiar a chave PIX');
      }
    );
  };

  const getFormaPagamentoIcon = (nome?: string) => {
    if (!nome) return null;
    const nomeLower = nome.toLowerCase();
    
    if (nomeLower.includes('pix')) {
      return <div className="bg-green-100 p-2 rounded-full"><CreditCard className="h-4 w-4 text-green-600" /></div>;
    } else if (nomeLower.includes('cartão')) {
      return <div className="bg-blue-100 p-2 rounded-full"><CreditCard className="h-4 w-4 text-blue-600" /></div>;
    } else if (nomeLower.includes('boleto')) {
      return <div className="bg-yellow-100 p-2 rounded-full"><Landmark className="h-4 w-4 text-yellow-600" /></div>;
    }
    
    return <div className="bg-gray-100 p-2 rounded-full"><Wallet className="h-4 w-4 text-gray-600" /></div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!mostrando ? (
        <div className="flex flex-col justify-center items-center min-h-screen bg-erio-800">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-64 h-64 md:w-96 md:h-96 mb-6 relative flex items-center justify-center">
              <div className="w-full h-full rounded-full border-4 border-erio-400 opacity-30 absolute"></div>
              <div className="w-full h-full absolute top-0 left-0 rounded-full border-t-4 border-erio-100 animate-spin"></div>
              <img 
                src="/imagem/VERSÃO HORIZONTAL_COR INSTITUCIONAL.png" 
                alt="Logo Erio" 
                className="max-w-48 md:max-w-64 z-10"
              />
            </div>
            <p className="text-erio-100 text-lg md:text-xl mt-4">Carregando dados de pagamento...</p>
          </div>
        </div>
      ) : (
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <h1 className="text-2xl md:text-4xl font-bold text-erio-700 mb-2">Detalhes do Pagamento</h1>
              <p className="text-gray-500">Verifique os detalhes e realize o pagamento conforme instruções abaixo</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-12 h-12 border-4 border-t-erio-600 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-xl text-gray-600">Carregando...</span>
            </div>
          ) : erro ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Inválido ou Expirado</h2>
              <p className="text-gray-600 mb-6">{erro}</p>
              <p className="text-gray-500">
                Entre em contato com a empresa para obter um novo link de pagamento.
              </p>
            </div>
          ) : receita ? (
            <div className="space-y-6">
              {/* Cabeçalho com informações gerais */}
              <Card className="overflow-hidden">
                <div className="bg-erio-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Resumo da Cobrança</h2>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cliente</p>
                      <p className="text-lg font-semibold text-gray-800">{receita.cliente?.nome || 'Cliente não especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Vencimento</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {receita.itens && receita.itens.length > 0 ? 
                          formatarData(receita.itens[0].data_vencimento) : 
                          'Não especificado'}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Valor Total</p>
                      <p className="text-3xl font-bold text-erio-700">{formatarValor(receita.valor_total)}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <div className="mt-1">{getStatusBadge(receita.status)}</div>
                    </div>
                  </div>

                  {receita.descricao && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-1">Descrição</p>
                      <p className="text-gray-700">{receita.descricao}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lista de itens para pagamento */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 px-1">Itens para Pagamento</h3>
                
                {receita.itens && receita.itens.length > 0 ? (
                  receita.itens.map((item: ReceitaItem) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className={`px-6 py-3 flex justify-between items-center ${
                        item.status === 'pago' 
                          ? 'bg-green-50 border-b border-green-100' 
                          : 'bg-gray-50 border-b'
                      }`}>
                        <div className="flex items-center">
                          {getFormaPagamentoIcon(item.forma_pagamento?.nome)}
                          <h4 className="font-medium text-gray-700 ml-2">
                            {item.forma_pagamento?.nome || 'Forma de pagamento desconhecida'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                          <p className="font-bold text-gray-700">{formatarValor(item.valor)}</p>
                        </div>
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Descrição</p>
                            <p className="text-gray-700">
                              {item.descricao || (item.condicao_pagamento?.descricao) || 'Sem descrição'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Vencimento</p>
                            <p className="text-gray-700">{formatarData(item.data_vencimento)}</p>
                          </div>
                        </div>

                        {/* Mostrar detalhes específicos para cada forma de pagamento */}
                        {item.forma_pagamento?.nome?.toLowerCase().includes('pix') && 
                         item.detalhes_pagamento && 
                         (item.detalhes_pagamento as any).chave && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                                  <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                                  Pagamento via PIX
                                </p>
                                
                                <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
                                  <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-500">Tipo de Chave</p>
                                    <p className="font-semibold text-gray-800">
                                      {(item.detalhes_pagamento as any).tipo_chave?.toUpperCase() || '-'}
                                    </p>
                                  </div>
                                  
                                  <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-500">Chave PIX</p>
                                    <div className="flex items-center">
                                      <p className="font-semibold text-gray-800 flex-1 break-all pr-2">
                                        {(item.detalhes_pagamento as any).chave}
                                      </p>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="ml-2 h-8 border-green-200 hover:bg-green-50"
                                        onClick={() => copiarPix((item.detalhes_pagamento as any).chave, item.id)}
                                      >
                                        {copiado[item.id] ? (
                                          <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <Copy className="h-4 w-4 text-gray-500" />
                                        )}
                                        <span className="ml-2">{copiado[item.id] ? 'Copiado!' : 'Copiar'}</span>
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Banco</p>
                                    <p className="font-semibold text-gray-800">
                                      {(item.detalhes_pagamento as any).banco || '-'}
                                    </p>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-gray-500">
                                  Abra o aplicativo do seu banco, escolha a opção PIX, e use a chave acima ou escaneie o QR code ao lado.
                                </p>
                              </div>
                              
                              <div className="flex flex-col items-center justify-center">
                                <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
                                  <QRCode 
                                    value={(item.detalhes_pagamento as any).chave} 
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                  />
                                </div>
                                <p className="text-sm text-gray-500 text-center">
                                  Escaneie o QR code acima com o aplicativo do seu banco para realizar o pagamento via PIX.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Cartão */}
                        {item.forma_pagamento?.nome?.toLowerCase().includes('cartão') && 
                         item.detalhes_pagamento && 
                         (item.detalhes_pagamento as any).parcelas && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                              Pagamento com Cartão
                            </p>
                            
                            <div className="bg-white rounded-lg border border-blue-200 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Parcelas</p>
                                  <p className="font-semibold text-gray-800">
                                    {(item.detalhes_pagamento as any).parcelas}x
                                  </p>
                                </div>
                                
                                {(item.detalhes_pagamento as any).taxa_juros > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Taxa de Juros</p>
                                    <p className="font-semibold text-gray-800">
                                      {(item.detalhes_pagamento as any).taxa_juros}%
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-500 mt-4">
                              Entre em contato conosco para realizar o pagamento com cartão.
                            </p>
                          </div>
                        )}
                        
                        {/* Status */}
                        <div className="mt-6 pt-4 border-t">
                          {item.status === 'pago' ? (
                            <div className="flex items-center text-green-600">
                              <Check className="h-5 w-5 mr-2" />
                              <span className="font-medium">Pago em {formatarData(item.data_pagamento)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-yellow-600">
                              <AlertCircle className="h-5 w-5 mr-2" />
                              <span className="font-medium">Aguardando pagamento</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg border shadow-sm">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum item de pagamento encontrado</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Em caso de dúvidas, entre em contato pelo e-mail: <a href="mailto:contato@erio.com.br" className="text-erio-600 hover:underline">contato@erio.com.br</a>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PagamentoPublico; 