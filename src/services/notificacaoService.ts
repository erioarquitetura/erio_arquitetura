import { Notificacao } from "@/types";

// Chave para armazenar notificações no localStorage
const STORAGE_KEY = 'erio_notificacoes';

/**
 * Busca todas as notificações do localStorage
 */
export const listarNotificacoes = (): Notificacao[] => {
  try {
    const notificacoesStr = localStorage.getItem(STORAGE_KEY);
    if (!notificacoesStr) return [];
    
    const notificacoes = JSON.parse(notificacoesStr) as Notificacao[];
    return notificacoes.sort((a, b) => 
      new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
    );
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return [];
  }
};

/**
 * Salva notificações no localStorage
 */
const salvarNotificacoes = (notificacoes: Notificacao[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notificacoes));
  } catch (error) {
    console.error('Erro ao salvar notificações:', error);
  }
};

/**
 * Busca o total de notificações não lidas
 */
export const contarNotificacoesNaoLidas = (): number => {
  try {
    const notificacoes = listarNotificacoes();
    return notificacoes.filter(n => !n.lida).length;
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    return 0;
  }
};

/**
 * Marca uma notificação como lida
 */
export const marcarNotificacaoComoLida = (notificacaoId: string): boolean => {
  try {
    const notificacoes = listarNotificacoes();
    const index = notificacoes.findIndex(n => n.id === notificacaoId);
    
    if (index === -1) return false;
    
    notificacoes[index].lida = true;
    salvarNotificacoes(notificacoes);
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return false;
  }
};

/**
 * Marca todas as notificações como lidas
 */
export const marcarTodasNotificacoesComoLidas = (): boolean => {
  try {
    const notificacoes = listarNotificacoes();
    
    const notificacoesAtualizadas = notificacoes.map(n => ({
      ...n,
      lida: true
    }));
    
    salvarNotificacoes(notificacoesAtualizadas);
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
    return false;
  }
};

/**
 * Cria uma notificação quando uma proposta é aprovada ou rejeitada
 */
export const criarNotificacaoPropostaInteracao = (
  propostaId: string,
  codigo: string,
  cliente: string,
  tipo: 'proposta_aprovada' | 'proposta_rejeitada',
  comentario?: string
): boolean => {
  try {
    const notificacoes = listarNotificacoes();
    
    const titulo = tipo === 'proposta_aprovada' 
      ? `Proposta Aprovada` 
      : `Solicitação de Negociação`;
      
    const mensagem = tipo === 'proposta_aprovada'
      ? `A proposta ${codigo} para ${cliente} foi aprovada!`
      : `O cliente ${cliente} solicitou negociar a proposta ${codigo}.`;
    
    const novaNotificacao: Notificacao = {
      id: crypto.randomUUID(),
      tipo,
      titulo,
      mensagem,
      proposta_id: propostaId,
      lida: false,
      comentario,
      data_criacao: new Date().toISOString()
    };
    
    notificacoes.push(novaNotificacao);
    salvarNotificacoes(notificacoes);
    
    return true;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return false;
  }
}; 