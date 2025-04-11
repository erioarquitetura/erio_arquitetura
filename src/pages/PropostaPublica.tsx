import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { validarTokenCompartilhamento, getPropostaCompleta, atualizarStatusProposta } from '@/services/propostaService';
import { PropostaCompleta } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatarMoeda } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Componente para página pública de proposta
export default function PropostaPublica() {
  const params = useParams<{ token: string }>();
  const [proposta, setProposta] = useState<PropostaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [dialogNegociacao, setDialogNegociacao] = useState(false);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  useEffect(() => {
    const carregarProposta = async () => {
      try {
        // Timer para exibição da animação de boas-vindas
        setTimeout(() => {
          setShowWelcome(false);
        }, 5000);
        
        if (!params.token) {
          setError('Token inválido');
          setLoading(false);
          return;
        }
        
        // Validar o token de acesso
        const { valido, propostaId } = await validarTokenCompartilhamento(params.token);
        
        if (!valido || !propostaId) {
          setError('Link inválido ou expirado');
          setLoading(false);
          return;
        }
        
        // Carregar a proposta completa
        const propostaData = await getPropostaCompleta(propostaId);
        if (!propostaData) {
          setError('Proposta não encontrada');
          setLoading(false);
          return;
        }
        
        setProposta(propostaData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar proposta:', err);
        setError('Ocorreu um erro ao carregar a proposta');
        setLoading(false);
      }
    };
    
    carregarProposta();
  }, [params.token]);
  
  // Função para aprovar proposta
  const handleAprovarProposta = async () => {
    if (!proposta?.id) return;
    
    setEnviando(true);
    try {
      const sucesso = await atualizarStatusProposta(proposta.id, 'aprovada');
      
      if (sucesso) {
        toast.success('Proposta aprovada com sucesso! Entraremos em contato em breve.');
        setProposta((prev) => prev ? { ...prev, status: 'aprovada' } : null);
      } else {
        toast.error('Erro ao aprovar proposta. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao aprovar proposta:', err);
      toast.error('Ocorreu um erro ao aprovar a proposta');
    } finally {
      setEnviando(false);
    }
  };
  
  // Função para enviar negociação
  const handleEnviarNegociacao = async () => {
    if (!proposta?.id || !comentario.trim()) return;
    
    setEnviando(true);
    try {
      const sucesso = await atualizarStatusProposta(proposta.id, 'rejeitada', comentario);
      
      if (sucesso) {
        toast.success('Solicitação de negociação enviada com sucesso! Entraremos em contato em breve.');
        setDialogNegociacao(false);
        setProposta((prev) => prev ? { ...prev, status: 'rejeitada' } : null);
      } else {
        toast.error('Erro ao enviar solicitação. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err);
      toast.error('Ocorreu um erro ao enviar a solicitação');
    } finally {
      setEnviando(false);
    }
  };
  
  // Renderização de tela de boas-vindas
  if (showWelcome) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4">
        <div 
          className="text-center animate-fade-in-up"
        >
          <div className="w-32 h-32 mx-auto mb-6">
            <img 
              src="/imagem/VERSÃO HORIZONTAL_COR INSTITUCIONAL.png"
              alt="Logo ERIO Arquitetura"
              className="w-full h-auto object-contain"
            />
          </div>
          <h1 
            className="text-4xl font-bold mb-3 animate-fade-in"
          >
            Parabéns, sua proposta chegou!
          </h1>
          <p 
            className="text-xl opacity-90 animate-fade-in"
          >
            Estamos carregando os detalhes para você...
          </p>
          <div 
            className="mt-8 animate-fade-in"
          >
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-300" />
          </div>
        </div>
      </div>
    );
  }
  
  // Renderização de estados de erro e carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-700" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops, ocorreu um problema</h1>
          <p className="text-gray-600 mb-8">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!proposta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposta não encontrada</h1>
          <p className="text-gray-600 mb-8">Não conseguimos encontrar a proposta solicitada.</p>
        </div>
      </div>
    );
  }
  
  // Status da proposta já definido
  if (proposta.status === 'aprovada') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposta Aprovada</h1>
          <p className="text-gray-600 mb-8">
            Você já aprovou esta proposta. Nossa equipe entrará em contato em breve para os próximos passos.
          </p>
        </div>
      </div>
    );
  }

  if (proposta.status === 'rejeitada') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <MessageCircle className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitação de Negociação Enviada</h1>
          <p className="text-gray-600 mb-8">
            Recebemos sua solicitação para negociar esta proposta. Nossa equipe entrará em contato em breve.
          </p>
        </div>
      </div>
    );
  }
  
  // Renderização da proposta
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-[#093247] text-white py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <img 
              src="/imagem/VERSÃO HORIZONTAL_COR INSTITUCIONAL.png"
              alt="Logo ERIO Arquitetura"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold">Proposta {proposta.codigo}</h1>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="container mx-auto py-8 px-4">
        <Card className="mb-8">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <CardTitle className="text-2xl">{proposta.titulo}</CardTitle>
                <CardDescription>Cliente: {proposta.cliente?.nome}</CardDescription>
              </div>
              <div className="text-right mt-4 md:mt-0">
                <p className="text-sm text-gray-500">Data de criação</p>
                <p className="font-medium">
                  {proposta.data_criacao && format(new Date(proposta.data_criacao), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-sm text-gray-500 mt-2">Validade</p>
                <p className="font-medium">
                  {proposta.data_validade && format(new Date(proposta.data_validade), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-6">
            {/* Endereço de interesse */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2 text-[#093247]">Endereço de Interesse</h3>
              <p className="text-gray-700">
                {proposta.endereco_interesse_logradouro}, {proposta.endereco_interesse_numero}
                {proposta.endereco_interesse_complemento && `, ${proposta.endereco_interesse_complemento}`}
                <br />
                {proposta.endereco_interesse_bairro}, {proposta.endereco_interesse_cidade} - {proposta.endereco_interesse_estado}
                <br />
                CEP: {proposta.endereco_interesse_cep}
              </p>
            </div>

            {/* Resumo executivo */}
            {proposta.resumo_executivo && proposta.resumo_executivo.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-[#093247]">Resumo Executivo</h3>
                <ul className="space-y-2 pl-6 list-disc">
                  {proposta.resumo_executivo.map((item) => (
                    <li key={item.id} className="text-gray-700">{item.topico}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Descrição do projeto */}
            {proposta.descricao_projeto && proposta.descricao_projeto.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-[#093247]">Descrição do Projeto</h3>
                <div className="space-y-6">
                  {proposta.descricao_projeto.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium">{item.area}</h4>
                        <span className="font-medium">{item.metragem}m²</span>
                      </div>
                      <p className="text-gray-700">{item.descricao}</p>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <h4 className="font-semibold">Área Total</h4>
                    <span className="font-semibold">
                      {proposta.descricao_projeto.reduce((total, item) => total + item.metragem, 0)}m²
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Etapas do projeto */}
            {proposta.etapas_projeto && proposta.etapas_projeto.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-[#093247]">Etapas do Projeto</h3>
                <div className="space-y-4">
                  {proposta.etapas_projeto.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-[#dcbda5] mr-3"></div>
                        <span className="text-gray-700">{item.nome}</span>
                      </div>
                      {item.valor > 0 && (
                        <span className="font-medium">{formatarMoeda(item.valor)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Condições de pagamento */}
            {proposta.condicoes_pagamento && proposta.condicoes_pagamento.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-[#093247]">Condições de Pagamento</h3>
                <div className="space-y-4">
                  {proposta.condicoes_pagamento.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="text-gray-700">
                        <span className="font-medium">{item.percentual}%</span> - {item.descricao}
                      </div>
                      <span className="font-medium">{formatarMoeda(item.valor)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center pt-2">
                    <h4 className="font-semibold">Valor Total</h4>
                    <span className="font-semibold text-lg">{formatarMoeda(proposta.valor_total)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Botões de ação */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-center text-[#093247]">O que deseja fazer com esta proposta?</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <Button
              className="bg-green-600 hover:bg-green-700 min-w-[200px]"
              size="lg"
              onClick={handleAprovarProposta}
              disabled={enviando}
            >
              {enviando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-5 w-5" />
              )}
              Proposta aprovada
            </Button>
            
            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 min-w-[200px]"
              size="lg"
              onClick={() => setDialogNegociacao(true)}
              disabled={enviando}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Negociar proposta
            </Button>
          </div>
        </div>
      </main>
      
      {/* Rodapé */}
      <footer className="bg-[#093247] text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <img 
                src="/imagem/VERSÃO HORIZONTAL_COR INSTITUCIONAL.png"
                alt="Logo ERIO Arquitetura"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="text-center md:text-right">
              <h3 className="text-xl font-semibold mb-2">Dúvidas?</h3>
              <p className="text-gray-300">Entre em contato:</p>
              <p className="text-gray-300">(71) 9 9644-4123</p>
              <p className="text-gray-300">contato@erio.com.br</p>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm mt-8">
            &copy; {new Date().getFullYear()} ERIO Arquitetura. Todos os direitos reservados.
          </div>
        </div>
      </footer>
      
      {/* Dialog de negociação */}
      <Dialog open={dialogNegociacao} onOpenChange={setDialogNegociacao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Negociar Proposta</DialogTitle>
            <DialogDescription>
              Descreva o que gostaria de negociar na proposta. Nossa equipe entrará em contato em breve.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Descreva aqui o que você gostaria de negociar..."
            className="min-h-[120px]"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogNegociacao(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviarNegociacao}
              disabled={!comentario.trim() || enviando}
            >
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : 'Enviar solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 