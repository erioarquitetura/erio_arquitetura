import { useState, useEffect, useRef } from 'react';
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
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { GridBackground } from '@/components/ui/grid-background';

// Componentes animados para a visualização da proposta
const TituloAnimado = ({ children, className = "" }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden border-2 border-white/30 rounded-md mb-2 ${className}`}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-[#1E40AF] to-[#538aa6] opacity-80 -z-10"
        initial={{ x: "-100%" }}
        animate={inView ? { x: 0 } : { x: "-100%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <h3 className="text-lg font-semibold py-2 px-4 text-white">
        {children}
      </h3>
    </div>
  );
};

const SecaoAnimada = ({ children, delay = 0 }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-sm mb-8 border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
};

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4 relative">
        <GridBackground />
        <motion.div 
          className="text-center bg-white/0 backdrop-blur-sm p-8 rounded-lg shadow-lg border-2 border-white/30 z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="w-56 h-56 mx-auto mb-6"
            animate={{ 
              y: [0, -10, 0],
              boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 15px 25px rgba(0,0,0,0.1)", "0px 0px 0px rgba(0,0,0,0)"]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <img 
              src="/images/logos/logo-horizontal-cor-institucional.png"
              alt="Logo ERIO Arquitetura"
              className="w-full h-auto object-contain mix-blend-screen"
            />
          </motion.div>
          <motion.h1 
            className="text-4xl font-bold mb-3 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Parabéns, sua proposta chegou!
          </motion.h1>
          <motion.p 
            className="text-xl opacity-90 text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Estamos carregando os detalhes para você...
          </motion.p>
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-white" />
          </motion.div>
        </motion.div>
      </div>
    );
  }
  
  // Renderização de estados de erro e carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <GridBackground />
        <Loader2 className="w-12 h-12 animate-spin text-white z-10" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4 relative">
        <GridBackground />
        <div className="text-center max-w-md bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-lg z-10 border border-white/30">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">Oops, ocorreu um problema</h1>
          <p className="text-white/90 mb-8">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!proposta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4 relative">
        <GridBackground />
        <div className="text-center max-w-md bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-lg z-10 border border-white/30">
          <AlertCircle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">Proposta não encontrada</h1>
          <p className="text-white/90 mb-8">Não conseguimos encontrar a proposta solicitada.</p>
        </div>
      </div>
    );
  }
  
  // Status da proposta já definido
  if (proposta.status === 'aprovada') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4 relative">
        <GridBackground />
        <div className="text-center max-w-md bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-lg z-10 border border-white/30">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">Proposta Aprovada</h1>
          <p className="text-white/90 mb-8">
            Você já aprovou esta proposta. Nossa equipe entrará em contato em breve para os próximos passos.
          </p>
        </div>
      </div>
    );
  }

  if (proposta.status === 'rejeitada') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4 relative">
        <GridBackground />
        <div className="text-center max-w-md bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-lg z-10 border border-white/30">
          <MessageCircle className="w-20 h-20 text-blue-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">Solicitação de Negociação Enviada</h1>
          <p className="text-white/90 mb-8">
            Recebemos sua solicitação para negociar esta proposta. Nossa equipe entrará em contato em breve.
          </p>
        </div>
      </div>
    );
  }
  
  // Renderização da proposta
  return (
    <div className="min-h-screen bg-transparent relative">
      <GridBackground />
      {/* Cabeçalho */}
      <header className="relative bg-white/20 backdrop-blur-sm text-[#2a4e61] py-6 border-b-2 border-white/30 shadow-sm z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <img 
              src="/images/logos/logo-horizontal-cor-institucional.png"
              alt="Logo ERIO Arquitetura"
              className="h-20 w-auto object-contain mix-blend-screen"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Proposta {proposta.codigo}
          </h1>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="container mx-auto py-8 px-4 relative z-10">
        {/* Introdução */}
        <SecaoAnimada>
          <CardHeader className="border-b p-4 rounded-t-lg">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <CardTitle className="text-2xl text-white">{proposta.titulo}</CardTitle>
                <CardDescription className="text-white/80">Cliente: {proposta.cliente?.nome}</CardDescription>
              </div>
              <div className="text-right mt-4 md:mt-0">
                <p className="text-sm text-white/80">Data de criação</p>
                <p className="font-medium text-white">
                  {proposta.data_criacao && format(new Date(proposta.data_criacao), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-sm text-white/80 mt-2">Validade: 15 dias</p>
                <p className="font-medium text-white">
                  {proposta.data_validade && format(new Date(proposta.data_validade), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardHeader>
        </SecaoAnimada>
          
        {/* Endereço de interesse */}
        <SecaoAnimada delay={0.2}>
          <TituloAnimado>Endereço de Interesse</TituloAnimado>
          <div className="mt-4 px-4">
            <p className="text-white/90">
              {proposta.endereco_interesse_logradouro}, {proposta.endereco_interesse_numero}
              {proposta.endereco_interesse_complemento && `, ${proposta.endereco_interesse_complemento}`}
              <br />
              {proposta.endereco_interesse_bairro}, {proposta.endereco_interesse_cidade} - {proposta.endereco_interesse_estado}
              <br />
              CEP: {proposta.endereco_interesse_cep}
            </p>
          </div>
        </SecaoAnimada>

        {/* Resumo executivo */}
        {proposta.resumo_executivo && proposta.resumo_executivo.length > 0 && (
          <SecaoAnimada delay={0.3}>
            <TituloAnimado>Resumo Executivo</TituloAnimado>
            <ul className="space-y-2 pl-6 list-disc mt-4 px-4">
              {proposta.resumo_executivo.map((item) => (
                <li key={item.id} className="text-white/90">
                  {item.topico}
                </li>
              ))}
            </ul>
          </SecaoAnimada>
        )}

        {/* Descrição do projeto */}
        {proposta.descricao_projeto && proposta.descricao_projeto.length > 0 && (
          <SecaoAnimada delay={0.4}>
            <TituloAnimado>Descrição do Projeto</TituloAnimado>
            <div className="space-y-6 mt-4 px-4">
              {proposta.descricao_projeto.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium text-white">{item.area}</h4>
                    <span className="font-medium text-white">{item.metragem}m²</span>
                  </div>
                  <p className="text-white/90">{item.descricao}</p>
                  <Separator className="mt-4 bg-white/20" />
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <h4 className="font-semibold text-white">Área Total</h4>
                <span className="font-semibold text-white">
                  {proposta.descricao_projeto.reduce((total, item) => total + item.metragem, 0)}m²
                </span>
              </div>
            </div>
          </SecaoAnimada>
        )}

        {/* Etapas do projeto */}
        {proposta.etapas_projeto && proposta.etapas_projeto.length > 0 && (
          <SecaoAnimada delay={0.5}>
            <TituloAnimado>Etapas do Projeto</TituloAnimado>
            <div className="space-y-4 mt-4 px-4">
              {proposta.etapas_projeto.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-white/80 mr-3"></div>
                    <span className="text-white/90">{item.nome}</span>
                  </div>
                  {item.valor > 0 && (
                    <span className="font-medium text-white">{formatarMoeda(item.valor)}</span>
                  )}
                </div>
              ))}
            </div>
          </SecaoAnimada>
        )}

        {/* Condições de pagamento */}
        {proposta.condicoes_pagamento && proposta.condicoes_pagamento.length > 0 && (
          <SecaoAnimada delay={0.6}>
            <TituloAnimado>Condições de Pagamento</TituloAnimado>
            <div className="space-y-4 mt-4 px-4">
              {proposta.condicoes_pagamento.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="text-white/100">
                    <span className="font-medium text-white">{item.percentual}%</span> - {item.descricao}
                  </div>
                  <span className="font-medium text-white">{formatarMoeda(item.valor)}</span>
                </div>
              ))}
              <Separator className="my-2 bg-white/20" />
              <div className="flex justify-between items-center pt-2">
                <h4 className="font-semibold text-white">Valor Total</h4>
                <span className="font-semibold text-lg text-white">{formatarMoeda(proposta.valor_total)}</span>
              </div>
            </div>
          </SecaoAnimada>
        )}
      
        {/* Botões de ação */}
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-sm mt-8 border border-white/20">
          <h3 className="text-xl font-semibold mb-4 text-center text-white">O que deseja fazer com esta proposta?</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="bg-[#1E40AF]/80 hover:bg-[#1E40AF] min-w-[200px] backdrop-blur-sm"
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
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="border-white text-black hover:bg-black/10 min-w-[200px] backdrop-blur-sm"
                size="lg"
                onClick={() => setDialogNegociacao(true)}
                disabled={enviando}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Negociar proposta
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
      
      {/* Rodapé */}
      <footer className="relative bg-white/10 backdrop-blur-sm text-white py-8 mt-12 border-t-2 border-white/30 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <img 
                src="/images/logos/logo-horizontal-cor-institucional.png"
                alt="Logo ERIO Arquitetura"
                className="h-20 w-auto object-contain mix-blend-screen"
              />
            </div>
            <div className="text-center md:text-right">
              <h3 className="text-xl font-semibold mb-2">Dúvidas?</h3>
              <p className="text-white/80">Entre em contato:</p>
              <p className="text-white/80">(71) 9 9644-4123</p>
              <p className="text-white/80">contato@erioarquitetura.com.br</p>
            </div>
          </div>
          <div className="text-center text-white/60 text-sm mt-8">
            &copy; {new Date().getFullYear()} ERIO Arquitetura. Todos os direitos reservados.
          </div>
        </div>
      </footer>
      
      {/* Dialog de negociação */}
      <Dialog open={dialogNegociacao} onOpenChange={setDialogNegociacao}>
        <DialogContent className="bg-white/50 backdrop-blur-md border border-white/30">
          <DialogHeader>
            <DialogTitle className="text-white">Negociar Proposta</DialogTitle>
            <DialogDescription className="text-white/80">
              Descreva o que gostaria de negociar na proposta. Nossa equipe entrará em contato em breve.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Descreva aqui o que você gostaria de negociar..."
            className="min-h-[120px] bg-white/30 border-white/30 text-white placeholder:text-white/50"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogNegociacao(false)}
              disabled={enviando}
              className="border-white text-black hover:bg-black/10"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviarNegociacao}
              disabled={!comentario.trim() || enviando}
              className="bg-[#1E40AF]/80 hover:bg-[#1E40AF]"
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