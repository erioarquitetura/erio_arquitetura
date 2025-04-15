import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  LoaderCircle, 
  Check, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Landmark, 
  Wallet, 
  Copy, 
  Mail, 
  Share2,
  Link 
} from 'lucide-react';
import { 
  buscarReceitaCompleta, 
  atualizarStatusItemReceita,
  gerarTokenCompartilhamento,
  carregarReceitaParaFormulario
} from '@/services/receitaService';
import { Receita, ReceitaItem, ReceitaStatus } from '@/types/receita';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReceitaViewerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  receita: Receita | null;
}

export function ReceitaViewerModal({ isOpen, onOpenChange, receita }: ReceitaViewerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [receitaDetalhada, setReceitaDetalhada] = useState<Receita | null>(null);
  const [itemAtualizando, setItemAtualizando] = useState<string | null>(null);
  const [isGerandoLink, setIsGerandoLink] = useState(false);
  const [linkParaCompartilhar, setLinkParaCompartilhar] = useState<string | null>(null);

  useEffect(() => {
    // Limpar o estado quando o modal é fechado
    if (!isOpen) {
      setReceitaDetalhada(null);
    }
    
    // Carregar os dados quando o modal é aberto e existe uma receita
    if (isOpen && receita) {
      console.log('Abrindo modal de visualização com receita ID:', receita.id);
      carregarReceita();
    }
  }, [isOpen, receita]);

  const carregarReceita = async () => {
    if (!receita?.id) return;
    
    setIsLoading(true);
    try {
      console.log('Carregando detalhes completos da receita ID:', receita.id);
      const data = await carregarReceitaParaFormulario(receita.id);
      console.log('Detalhes recebidos:', data);
      
      if (!data) {
        toast.error('Não foi possível carregar os detalhes da receita');
        return;
      }
      
      console.log('Itens da receita carregados:', data.itens?.length);
      setReceitaDetalhada(data);
    } catch (error) {
      console.error('Erro ao carregar receita:', error);
      toast.error('Falha ao carregar detalhes da receita');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarcarComoPago = async (item: ReceitaItem) => {
    setItemAtualizando(item.id);
    try {
      // Usar a data de pagamento do item se estiver definida ou a data atual
      const dataPagamento = item.data_pagamento || new Date().toISOString();
      
      const sucesso = await atualizarStatusItemReceita(
        item.id, 
        'pago', 
        dataPagamento
      );

      if (sucesso) {
        toast.success('Item marcado como pago');
        await carregarReceita();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Falha ao atualizar status do item');
    } finally {
      setItemAtualizando(null);
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

  const getStatusBadge = (status: ReceitaStatus) => {
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

  const getStatusIcon = (status: ReceitaStatus) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pago_parcial':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'pago':
        return <Check className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
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

  // Função para gerar link para compartilhamento
  const handleGerarLink = async () => {
    if (!receitaDetalhada) return;
    
    setIsGerandoLink(true);
    try {
      const token = await gerarTokenCompartilhamento(receitaDetalhada.id);
      if (token) {
        const linkCompleto = `${window.location.origin}/pagamento/${token}`;
        setLinkParaCompartilhar(linkCompleto);
        toast.success('Link gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast.error('Falha ao gerar link para compartilhamento');
    } finally {
      setIsGerandoLink(false);
    }
  };

  // Função para copiar o link para a área de transferência
  const handleCopiarLink = async () => {
    if (!linkParaCompartilhar) return;
    
    try {
      await navigator.clipboard.writeText(linkParaCompartilhar);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Não foi possível copiar o link');
    }
  };

  // Função para compartilhar via WhatsApp
  const compartilharWhatsApp = () => {
    if (!linkParaCompartilhar || !receitaDetalhada?.cliente?.telefone) return;
    
    const mensagem = encodeURIComponent(`Olá ${receitaDetalhada.cliente.nome}, segue o link para pagamento da receita referente a ${receitaDetalhada.descricao || 'serviços prestados'}: ${linkParaCompartilhar}`);
    const telefone = receitaDetalhada.cliente.telefone.replace(/\D/g, '');
    
    window.open(`https://wa.me/55${telefone}?text=${mensagem}`, '_blank');
  };

  // Função para compartilhar via Email
  const compartilharEmail = () => {
    if (!linkParaCompartilhar || !receitaDetalhada?.cliente?.email) return;
    
    const assunto = encodeURIComponent(`Pagamento da receita referente a ${receitaDetalhada.descricao || 'serviços prestados'}`);
    const corpo = encodeURIComponent(`Olá ${receitaDetalhada.cliente.nome},\n\nSegue o link para pagamento da receita referente a ${receitaDetalhada.descricao || 'serviços prestados'}:\n\n${linkParaCompartilhar}\n\nAtenciosamente,\n${window.location.host}`);
    
    window.open(`mailto:${receitaDetalhada.cliente.email}?subject=${assunto}&body=${corpo}`, '_blank');
  };

  // Adicionando a exibição do nome do cliente
  const clienteNome = receitaDetalhada?.cliente?.nome || 'Cliente não encontrado';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="receita-viewer-description">
        <DialogHeader className="pb-2 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-erio-600">
              Detalhes da Receita
            </DialogTitle>
            {receitaDetalhada && (
              <div className="flex items-center gap-2">
                {isGerandoLink ? (
                  <Button 
                    disabled
                    variant="outline" 
                    size="sm"
                    className="h-9 border-erio-200"
                  >
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </Button>
                ) : linkParaCompartilhar ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 border-erio-200 bg-erio-50 text-erio-700"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Opções de compartilhamento</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleCopiarLink}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar link
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={compartilharWhatsApp}
                        disabled={!receitaDetalhada?.cliente?.telefone}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2">
                          <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp {!receitaDetalhada?.cliente?.telefone && "(Sem telefone)"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={compartilharEmail}
                        disabled={!receitaDetalhada?.cliente?.email}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        E-mail {!receitaDetalhada?.cliente?.email && "(Sem e-mail)"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 border-erio-200 hover:bg-erio-50 hover:text-erio-700"
                    onClick={handleGerarLink}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Gerar Link Pagamento
                  </Button>
                )}
              </div>
            )}
          </div>
          <div id="receita-viewer-description" className="sr-only">Visualização dos detalhes da receita</div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <LoaderCircle className="h-12 w-12 animate-spin text-erio-500" />
            <span className="ml-3 text-lg text-gray-600">Carregando detalhes...</span>
          </div>
        ) : !receitaDetalhada ? (
          <div className="text-center py-12 px-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-800">Não foi possível carregar os detalhes da receita</p>
            <p className="text-gray-500 mt-2">Verifique se a receita existe ou tente novamente mais tarde.</p>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {/* Resumo da receita */}
            <div className="bg-erio-50 rounded-lg overflow-hidden border border-erio-200 shadow-sm">
              <div className="bg-erio-600 px-4 py-3">
                <h3 className="text-white font-medium">Resumo da Receita</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-3">
                    <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center">
                        <div className="bg-erio-100 rounded-full p-3 mr-3">
                          <Wallet className="h-6 w-6 text-erio-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valor Total</p>
                          <p className="text-2xl font-bold text-gray-800">{formatarValor(receitaDetalhada.valor_total)}</p>
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(receitaDetalhada.status)}
                      </div>
                    </div>
                  </div>
                
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cliente</p>
                    <p className="font-medium text-gray-800">{clienteNome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Proposta</p>
                    <p className="font-medium text-gray-800">
                      {receitaDetalhada.proposta?.codigo ? `${receitaDetalhada.proposta.codigo} - ${receitaDetalhada.proposta.titulo}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categoria</p>
                    <p className="font-medium text-gray-800">{receitaDetalhada.categoria?.nome || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Criação</p>
                    <p className="font-medium text-gray-800">{formatarData(receitaDetalhada.data_criacao)}</p>
                  </div>
                </div>

                {(receitaDetalhada.descricao || receitaDetalhada.observacoes) && (
                  <div className="mt-4 border-t pt-4">
                    {receitaDetalhada.descricao && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-500">Descrição</p>
                        <p className="mt-1 text-gray-700 bg-white p-2 rounded border">{receitaDetalhada.descricao}</p>
                      </div>
                    )}

                    {receitaDetalhada.observacoes && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Observações</p>
                        <p className="mt-1 text-gray-700 bg-white p-2 rounded border">{receitaDetalhada.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Itens da receita */}
            <div className="bg-white rounded-lg overflow-hidden border shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-700">Itens da Receita</h3>
                <div className="text-sm text-gray-500">
                  {receitaDetalhada?.itens?.length || 0} {receitaDetalhada?.itens?.length === 1 ? 'item' : 'itens'}
                </div>
              </div>
              
              <div className="p-4">
                {receitaDetalhada?.itens && receitaDetalhada.itens.length > 0 ? (
                  <div className="space-y-4">
                    {receitaDetalhada.itens.map((item, index) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className={`px-4 py-3 flex justify-between items-center ${
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
                        
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Descrição</p>
                              <p className="text-gray-700">
                                {item.descricao || (item.condicao_pagamento?.descricao) || `Item ${index + 1}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Vencimento</p>
                              <p className="text-gray-700">{formatarData(item.data_vencimento)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Data de Pagamento</p>
                              <p className="text-gray-700">{item.data_pagamento ? formatarData(item.data_pagamento) : '-'}</p>
                            </div>
                          </div>

                          {/* Detalhes específicos de PIX ou Cartão */}
                          {item.detalhes_pagamento && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium text-gray-500 mb-2">Detalhes do pagamento</p>
                              
                              {/* PIX */}
                              {(item.detalhes_pagamento as any).tipo_chave && (
                                <div className="bg-green-50 border border-green-100 rounded-md p-3">
                                  <div className="flex items-center mb-2">
                                    <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                                    <p className="font-medium text-green-700">Pagamento via PIX</p>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Tipo de Chave: </span>
                                      <span className="font-medium">{(item.detalhes_pagamento as any).tipo_chave?.toUpperCase()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Chave: </span>
                                      <span className="font-medium">{(item.detalhes_pagamento as any).chave}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Banco: </span>
                                      <span className="font-medium">{(item.detalhes_pagamento as any).banco}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Cartão */}
                              {(item.detalhes_pagamento as any).parcelas && (
                                <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                                  <div className="flex items-center mb-2">
                                    <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                                    <p className="font-medium text-blue-700">Pagamento com Cartão</p>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Parcelas: </span>
                                      <span className="font-medium">{(item.detalhes_pagamento as any).parcelas}x</span>
                                    </div>
                                    {(item.detalhes_pagamento as any).taxa_juros > 0 && (
                                      <div>
                                        <span className="text-gray-500">Taxa de Juros: </span>
                                        <span className="font-medium">{(item.detalhes_pagamento as any).taxa_juros}%</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Status de pagamento */}
                          <div className="mt-4 flex justify-between items-center pt-4 border-t">
                            <div>
                              {item.status === 'pago' ? (
                                <div className="flex items-center text-green-600">
                                  <Check className="h-5 w-5 mr-2" />
                                  <span className="font-medium">Pago em {formatarData(item.data_pagamento)}</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-yellow-600">
                                  <Clock className="h-5 w-5 mr-2" />
                                  <span className="font-medium">Aguardando pagamento</span>
                                </div>
                              )}
                            </div>
                            
                            {item.status !== 'pago' && (
                              <Button 
                                size="sm"
                                onClick={() => handleMarcarComoPago(item)}
                                disabled={!!itemAtualizando}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {itemAtualizando === item.id ? (
                                  <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-2" />
                                )}
                                Marcar como Pago
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-gray-50">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      Nenhum item encontrado para esta receita
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t mt-4">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-erio-600 hover:bg-erio-700"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 