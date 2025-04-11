/**
 * Formata um valor numérico como moeda brasileira (R$)
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Formata uma string de data ISO para o formato brasileiro dd/mm/yyyy
 * Se o parâmetro 'relativo' for true, usa formato relativo (Hoje, Ontem, etc.)
 */
export const formatarData = (data: string, relativo: boolean = false): string => {
  if (!data) return '-';
  
  try {
    const dataObj = new Date(data);
    
    if (relativo) {
      const agora = new Date();
      const diff = agora.getTime() - dataObj.getTime();
      
      // Se a data for de hoje, mostrar apenas o horário
      if (diff < 24 * 60 * 60 * 1000 && 
          dataObj.getDate() === agora.getDate() && 
          dataObj.getMonth() === agora.getMonth() && 
          dataObj.getFullYear() === agora.getFullYear()) {
        return `Hoje às ${dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Se a data for de ontem, mostrar "Ontem"
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      if (dataObj.getDate() === ontem.getDate() && 
          dataObj.getMonth() === ontem.getMonth() && 
          dataObj.getFullYear() === ontem.getFullYear()) {
        return `Ontem às ${dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Para datas mais antigas, incluir o horário
      return dataObj.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Formato padrão dd/mm/yyyy
    return new Intl.DateTimeFormat('pt-BR').format(dataObj);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '-';
  }
};

/**
 * Formata uma string de data ISO para o formato brasileiro dd/mm/yyyy hh:mm
 */
export const formatarDataHora = (data: string): string => {
  if (!data) return '-';
  
  try {
    const date = new Date(data);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return '-';
  }
};

/**
 * Formata um número de documento (CPF/CNPJ)
 */
export const formatarDocumento = (documento: string): string => {
  if (!documento) return '-';
  
  // Remove caracteres não numéricos
  const numeros = documento.replace(/\D/g, '');
  
  // Formata como CPF
  if (numeros.length === 11) {
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } 
  // Formata como CNPJ
  else if (numeros.length === 14) {
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  // Retorna sem formatação se não for CPF nem CNPJ
  return documento;
};

/**
 * Formata um número de telefone
 */
export const formatarTelefone = (telefone: string): string => {
  if (!telefone) return '-';
  
  // Remove caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');
  
  // Celular com DDD
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  // Telefone fixo com DDD
  else if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  // Retorna sem formatação para outros casos
  return telefone;
};

/**
 * Formata um CEP
 */
export const formatarCEP = (cep: string): string => {
  if (!cep) return '-';
  
  // Remove caracteres não numéricos
  const numeros = cep.replace(/\D/g, '');
  
  if (numeros.length === 8) {
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep;
};

/**
 * Formata um status para exibição
 */
export const formatarStatus = (
  status: string, 
  tipo: 'transacao' | 'notaFiscal' | 'proposta'
): string => {
  const statusMap: Record<string, Record<string, string>> = {
    transacao: {
      'pendente': 'Pendente',
      'pago': 'Pago',
      'cancelado': 'Cancelado'
    },
    notaFiscal: {
      'pendente': 'Pendente',
      'processando': 'Em Processamento',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    },
    proposta: {
      'rascunho': 'Rascunho',
      'enviada': 'Enviada',
      'aprovada': 'Aprovada',
      'rejeitada': 'Rejeitada',
      'vencida': 'Vencida'
    }
  };
  
  return statusMap[tipo]?.[status] || status;
};

