import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PropostaCompleta } from "@/types/proposal";
import { formatarMoeda } from "@/lib/formatters";
import { getPropostaCompleta } from "@/services/propostaService";
import { generatePropostaPDF } from "@/services/pdfService";
import { Eye, FileText, X, Download, Share2 } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { gerarLinkCompartilhamento } from '@/services/propostaService';

interface PropostaViewerProps {
  propostaId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Função para processar o texto com formatação
const processarTextoFormatado = (texto: string) => {
  if (!texto) return '';
  
  // Processar negrito: **texto** -> <strong>texto</strong>
  let processado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Processar itálico: *texto* -> <em>texto</em>
  processado = processado.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Processar sublinhado: _texto_ -> <u>texto</u>
  processado = processado.replace(/_(.*?)_/g, '<u>$1</u>');
  
  // Processar listas: - item -> • item (com estilo de lista)
  processado = processado.replace(/\n- (.*?)(?=\n|$)/g, '<div class="flex gap-1 ml-2"><span class="bullet">•</span><span>$1</span></div>');
  
  // Processar tabelas: manter como está, mas adicionar classe para estilização
  if (processado.includes('| --- |')) {
    processado = processado.replace(/(\n\|.*\|.*\|\n\|.*\|.*\|\n\|.*\|.*\|)/g, 
      '<div class="my-2 border rounded overflow-x-auto">$1</div>');
    processado = processado.replace(/\|/g, ' | ');
  }
  
  // Processar divs de alinhamento
  processado = processado.replace(/<div style="text-align: (.*?)">(.*?)<\/div>/g, '<div style="text-align: $1">$2</div>');
  
  // Quebras de linha
  processado = processado.replace(/\n/g, '<br/>');
  
  return processado;
};

export const PropostaViewer = ({ propostaId, isOpen, onClose }: PropostaViewerProps) => {
  const [proposta, setProposta] = useState<PropostaCompleta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [compartilhando, setCompartilhando] = useState<boolean>(false);
  const [linkCompartilhamento, setLinkCompartilhamento] = useState<string | null>(null);

  useEffect(() => {
    const loadProposta = async () => {
      if (!isOpen || !propostaId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const propostaData = await getPropostaCompleta(propostaId);
        if (propostaData) {
          setProposta(propostaData);
        } else {
          setError("Não foi possível carregar os dados da proposta.");
        }
      } catch (err) {
        console.error("Erro ao carregar proposta:", err);
        setError("Ocorreu um erro ao carregar a proposta.");
      } finally {
        setLoading(false);
      }
    };
    
    loadProposta();
  }, [propostaId, isOpen]);

  const formatarData = (dataString?: string) => {
    if (!dataString) return "Data não disponível";
    try {
      const data = new Date(dataString);
      return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return "Formato de data inválido";
    }
  };

  const handleGeneratePDF = async () => {
    if (!proposta) return;
    
    try {
      setGeneratingPdf(true);
      await generatePropostaPDF(proposta);
      toast.success("PDF gerado com sucesso");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast.error("Erro ao gerar o PDF da proposta");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Função para gerar link de compartilhamento
  const handleCompartilhar = async () => {
    if (!proposta?.id) return;
    
    setCompartilhando(true);
    try {
      const token = await gerarLinkCompartilhamento(proposta.id);
      
      if (token) {
        // Criar URL completa para compartilhamento
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/proposta-publica/${token}`;
        
        // Copiar para a área de transferência
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
        
        // Salvar o link para envio por e-mail ou WhatsApp
        setLinkCompartilhamento(url);
      } else {
        toast.error('Erro ao gerar link de compartilhamento');
      }
    } catch (error) {
      console.error('Erro ao compartilhar proposta:', error);
      toast.error('Ocorreu um erro ao compartilhar a proposta');
    } finally {
      setCompartilhando(false);
    }
  };

  // Função para enviar link por e-mail
  const handleEnviarEmail = () => {
    if (!proposta?.cliente?.email || !linkCompartilhamento) {
      // Se o link ainda não foi gerado, gerar e depois enviar
      if (!linkCompartilhamento) {
        handleCompartilhar().then(() => {
          // Tentar novamente após gerar o link
          if (linkCompartilhamento && proposta?.cliente?.email) {
            handleEnviarEmail();
          }
        });
        return;
      }
      return;
    }
    
    const assunto = encodeURIComponent(`Proposta ${proposta.codigo} - ERIO Arquitetura`);
    const corpo = encodeURIComponent(
      `Olá ${proposta.cliente.nome},\n\n` +
      `Enviamos sua proposta de projeto. Acesse o link para visualizar todos os detalhes:\n\n` +
      `${linkCompartilhamento}\n\n` +
      `Atenciosamente,\n` +
      `Equipe ERIO Arquitetura`
    );
    
    // Abrir cliente de e-mail padrão
    window.open(`mailto:${proposta.cliente.email}?subject=${assunto}&body=${corpo}`);
    toast.success('E-mail preparado para envio!');
  };

  // Função para enviar link por WhatsApp
  const handleEnviarWhatsApp = () => {
    if (!proposta?.cliente?.telefone || !linkCompartilhamento) {
      // Se o link ainda não foi gerado, gerar e depois enviar
      if (!linkCompartilhamento) {
        handleCompartilhar().then(() => {
          // Tentar novamente após gerar o link
          if (linkCompartilhamento && proposta?.cliente?.telefone) {
            handleEnviarWhatsApp();
          }
        });
        return;
      }
      return;
    }
    
    // Limpar telefone, mantendo apenas números
    const telefone = proposta.cliente.telefone.replace(/\D/g, '');
    
    const mensagem = encodeURIComponent(
      `Olá ${proposta.cliente.nome}! Enviamos sua proposta de projeto. Acesse o link para visualizar todos os detalhes: ${linkCompartilhamento}`
    );
    
    // Abrir WhatsApp Web ou app
    window.open(`https://wa.me/55${telefone}?text=${mensagem}`);
    toast.success('WhatsApp preparado para envio!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {proposta ? `Proposta ${proposta.codigo} - ${proposta.titulo}` : 'Detalhes da Proposta'}
          </DialogTitle>
          <DialogDescription>
            {proposta && proposta.cliente && (
              <>Cliente: {proposta.cliente.nome}</>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        ) : proposta ? (
          <>
            <div className="space-y-6 py-4">
              {/* Cabeçalho com dados básicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Cliente</h4>
                  <p className="font-medium">{proposta.cliente?.nome}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Data de Criação</h4>
                  <p>{formatarData(proposta.data_criacao)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Valor Total</h4>
                  <p className="font-bold text-lg text-primary">{formatarMoeda(proposta.valor_total || 0)}</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Resumo Executivo */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Resumo Executivo</h3>
                {proposta.resumo_executivo && proposta.resumo_executivo.length > 0 ? (
                  <ul className="space-y-2 list-disc pl-5">
                    {proposta.resumo_executivo.map((item, index) => (
                      <li key={index} dangerouslySetInnerHTML={{ __html: processarTextoFormatado(item.topico) }}></li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Nenhum tópico disponível</p>
                )}
              </div>
              
              <Separator />
              
              {/* Descrição do Projeto */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Descrição do Projeto</h3>
                {proposta.descricao_projeto && proposta.descricao_projeto.length > 0 ? (
                  <div className="space-y-4">
                    {proposta.descricao_projeto.map((item, index) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{item.area}</h4>
                          <span className="text-sm bg-muted px-2 py-1 rounded-md">{item.metragem} m²</span>
                        </div>
                        <p className="text-sm mt-2">{item.descricao}</p>
                      </div>
                    ))}
                    <div className="text-right text-sm">
                      <span className="font-medium">Área Total: </span>
                      {proposta.descricao_projeto.reduce((sum, item) => sum + item.metragem, 0).toFixed(2)} m²
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma descrição disponível</p>
                )}
              </div>
              
              <Separator />
              
              {/* Etapas do Projeto */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Etapas do Projeto</h3>
                {proposta.etapas_projeto && proposta.etapas_projeto.length > 0 ? (
                  <div className="space-y-2">
                    {proposta.etapas_projeto.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b last:border-0">
                        <span>{item.nome}</span>
                        <span className="font-medium">{formatarMoeda(item.valor)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma etapa disponível</p>
                )}
              </div>
              
              <Separator />
              
              {/* Condições de Pagamento */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Condições de Pagamento</h3>
                {proposta.condicoes_pagamento && proposta.condicoes_pagamento.length > 0 ? (
                  <div className="space-y-2">
                    {proposta.condicoes_pagamento.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b last:border-0">
                        <span>{item.descricao}</span>
                        <div className="text-right">
                          <span className="font-medium block">{formatarMoeda(item.valor)}</span>
                          <span className="text-sm text-muted-foreground">{item.percentual}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma condição de pagamento disponível</p>
                )}
              </div>
              
              <Separator />
              
              {/* Endereço de Interesse */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Endereço de Interesse</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p>
                    {[
                      proposta.endereco_interesse_logradouro,
                      proposta.endereco_interesse_numero && `nº ${proposta.endereco_interesse_numero}`,
                      proposta.endereco_interesse_complemento
                    ].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    {[
                      proposta.endereco_interesse_bairro,
                      proposta.endereco_interesse_cidade,
                      proposta.endereco_interesse_estado
                    ].filter(Boolean).join(", ")}
                  </p>
                  {proposta.endereco_interesse_cep && <p>CEP: {proposta.endereco_interesse_cep}</p>}
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2 flex-wrap sm:justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleGeneratePDF}
                  disabled={!proposta || generatingPdf}
                >
                  {generatingPdf ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Gerar PDF
                    </>
                  )}
                </Button>
              </div>
              
              {proposta && (
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary"
                        disabled={compartilhando}
                      >
                        {compartilhando ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Share2 className="mr-2 h-4 w-4" />
                        )}
                        Compartilhar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleCompartilhar}>
                        Copiar link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {proposta.cliente?.email && (
                        <DropdownMenuItem onClick={handleEnviarEmail} disabled={!linkCompartilhamento}>
                          Enviar por e-mail
                        </DropdownMenuItem>
                      )}
                      {proposta.cliente?.telefone && (
                        <DropdownMenuItem onClick={handleEnviarWhatsApp} disabled={!linkCompartilhamento}>
                          Enviar por WhatsApp
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center">
            <p>Proposta não encontrada.</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 