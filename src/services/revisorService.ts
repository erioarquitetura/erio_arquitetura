// Tipos para o revisor de texto
export type RevisaoTipo = 'ortografia' | 'formal' | 'informal';

// Dicionário português - correções ortográficas comuns
const correcoes: Record<string, string> = {
  'nao': 'não',
  'voce': 'você',
  'esta': 'está',
  'entao': 'então',
  'sao': 'são',
  'tambem': 'também',
  'ja': 'já',
  'ate': 'até',
  'pra': 'para',
  'ta': 'está',
  'tá': 'está',
  'q': 'que',
  'eh': 'é',
  'vc': 'você',
  'tb': 'também',
  'to': 'estou',
  'tô': 'estou',
  'vcs': 'vocês',
  'mto': 'muito',
  'mt': 'muito',
  'td': 'tudo',
  'oq': 'o que',
  'dps': 'depois',
  'msm': 'mesmo',
  'cmg': 'comigo',
  'blz': 'beleza',
  'obg': 'obrigado',
  'flw': 'falou',
  'vlw': 'valeu'
};

// Palavras formais para substituição em estilo formal
const palavrasFormais: Record<string, string> = {
  'legal': 'adequado',
  'bom': 'excelente',
  'muito bom': 'excepcional',
  'ótimo': 'excepcional',
  'bonito': 'esteticamente agradável',
  'fazer': 'realizar',
  'grande': 'amplo',
  'pequeno': 'reduzido',
  'começo': 'início',
  'fim': 'conclusão',
  'ajudar': 'auxiliar',
  'mostrar': 'demonstrar',
  'coisa': 'elemento',
  'problema': 'questão',
  'gostar': 'apreciar',
  'agora': 'no momento',
  'achar': 'considerar',
  'rapido': 'célere',
  'rápido': 'célere',
  'barato': 'econômico',
  'caro': 'dispendioso',
  'fácil': 'acessível',
  'difícil': 'complexo',
  'a gente': 'nós'
};

// Palavras informais para substituição em estilo informal
const palavrasInformais: Record<string, string> = {
  'adequado': 'legal',
  'excelente': 'massa',
  'excepcional': 'muito bom',
  'esteticamente agradável': 'bonito',
  'realizar': 'fazer',
  'amplo': 'grande',
  'reduzido': 'pequeno',
  'nós': 'a gente',
  'início': 'começo',
  'conclusão': 'fim'
};

/**
 * Corrige erros ortográficos comuns em português
 */
export function corrigirOrtografia(texto: string): string {
  if (!texto) return texto;
  
  // Aplicar correções básicas de acentuação
  let resultado = texto;
  
  // Corrigir palavras comuns
  Object.entries(correcoes).forEach(([errado, correto]) => {
    const regex = new RegExp(`\\b${errado}\\b`, 'gi');
    resultado = resultado.replace(regex, correto);
  });
  
  // Adicionar letra maiúscula no início de frases
  resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
  
  // Corrigir espaçamento antes de pontuação
  resultado = resultado.replace(/\s+([.,;:!?])/g, '$1');
  
  // Corrigir espaçamento duplo
  resultado = resultado.replace(/\s{2,}/g, ' ');
  
  // Garantir que há um ponto final
  if (!/[.!?]$/.test(resultado)) {
    resultado += '.';
  }
  
  return resultado;
}

/**
 * Converte o texto para um estilo formal
 */
export function converterParaFormal(texto: string): string {
  if (!texto) return texto;
  
  // Primeiro corrige a ortografia
  let resultado = corrigirOrtografia(texto);
  
  // Substitui palavras por equivalentes formais
  Object.entries(palavrasFormais).forEach(([informal, formal]) => {
    const regex = new RegExp(`\\b${informal}\\b`, 'gi');
    resultado = resultado.replace(regex, formal);
  });
  
  // Aplicar regras de formalidade
  resultado = resultado.replace(/\bpra\b/gi, 'para');
  resultado = resultado.replace(/\bvamo\b/gi, 'vamos');
  resultado = resultado.replace(/\ba gente\b/gi, 'nós');
  
  return resultado;
}

/**
 * Converte o texto para um estilo informal
 */
export function converterParaInformal(texto: string): string {
  if (!texto) return texto;
  
  // Corrige erros graves de ortografia primeiro
  let resultado = corrigirOrtografia(texto);
  
  // Substitui palavras por equivalentes informais
  Object.entries(palavrasInformais).forEach(([formal, informal]) => {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    resultado = resultado.replace(regex, informal);
  });
  
  return resultado;
}

/**
 * Revisa um texto de acordo com o tipo de revisão solicitado
 */
export async function revisarTexto(texto: string, tipo: RevisaoTipo): Promise<string> {
  // Simular um pequeno atraso para dar feedback ao usuário
  await new Promise(resolve => setTimeout(resolve, 800));
  
  console.log(`Revisando texto no modo: ${tipo}`);
  
  let resultado: string;
  
  switch(tipo) {
    case 'ortografia':
      resultado = corrigirOrtografia(texto);
      break;
    case 'formal':
      resultado = converterParaFormal(texto);
      break;
    case 'informal':
      resultado = converterParaInformal(texto);
      break;
    default:
      resultado = texto;
  }
  
  console.log(`Texto revisado com sucesso no modo ${tipo}`);
  return resultado;
} 