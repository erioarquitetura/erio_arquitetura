import nlp from 'compromise';
import sentences from 'compromise-sentences';

// Registrando o plugin
nlp.extend(sentences);

type RevisaoTipo = 'ortografia' | 'formal' | 'informal';

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
  'a gente': 'nós',
  'joia': 'satisfatório',
  'entender': 'compreender',
  'bastante': 'substancialmente',
  'aqui': 'neste local',
  'lá': 'naquele local',
  'jeito': 'método',
  'junto': 'em conjunto',
  'olhar': 'observar',
  'ver': 'visualizar',
  'falar': 'comunicar',
  'dizer': 'expressar',
  'ter': 'possuir',
  'ideia': 'conceito',
  'usar': 'utilizar',
  'feito': 'elaborado',
  'acabar': 'finalizar',
  'pedir': 'solicitar',
  'dar': 'fornecer',
  'pensar': 'ponderar',
  'ficar': 'permanecer'
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
  'início': 'começo',
  'conclusão': 'fim',
  'auxiliar': 'ajudar',
  'demonstrar': 'mostrar',
  'elemento': 'coisa',
  'questão': 'problema',
  'apreciar': 'gostar',
  'no momento': 'agora',
  'considerar': 'achar',
  'célere': 'rápido',
  'econômico': 'barato',
  'dispendioso': 'caro',
  'acessível': 'fácil',
  'complexo': 'difícil',
  'nós': 'a gente',
  'satisfatório': 'joia',
  'compreender': 'entender',
  'substancialmente': 'bastante',
  'neste local': 'aqui',
  'naquele local': 'lá',
  'método': 'jeito',
  'em conjunto': 'junto',
  'observar': 'olhar',
  'visualizar': 'ver',
  'comunicar': 'falar',
  'expressar': 'dizer',
  'possuir': 'ter',
  'conceito': 'ideia',
  'utilizar': 'usar',
  'elaborado': 'feito',
  'finalizar': 'acabar',
  'solicitar': 'pedir',
  'fornecer': 'dar',
  'ponderar': 'pensar',
  'permanecer': 'ficar',
  'entretanto': 'mas',
  'porém': 'mas',
  'todavia': 'mas',
  'no entanto': 'mas',
  'portanto': 'então',
  'consequentemente': 'daí',
  'anteriormente': 'antes',
  'posteriormente': 'depois',
  'concluindo': 'pra finalizar',
  'obrigado': 'valeu'
};

/**
 * Corrige erros ortográficos comuns em português
 */
function corrigirOrtografia(texto: string): string {
  if (!texto) return texto;
  
  // Aplicar correções básicas de acentuação
  let palavras = texto.split(/\s+/);
  palavras = palavras.map(palavra => {
    // Remove pontuação para verificação
    const pontuacao = palavra.match(/[.,;:!?]$/);
    const palavraSemPontuacao = palavra.replace(/[.,;:!?]$/, '');
    
    // Verifica se a palavra está no dicionário de correções
    const correcao = correcoes[palavraSemPontuacao.toLowerCase()];
    
    if (correcao) {
      // Mantém a capitalização original
      let palavraCorrigida = palavraSemPontuacao.charAt(0).toUpperCase() === palavraSemPontuacao.charAt(0)
        ? correcao.charAt(0).toUpperCase() + correcao.slice(1)
        : correcao;
      
      // Adiciona a pontuação de volta
      return palavraCorrigida + (pontuacao ? pontuacao[0] : '');
    }
    
    return palavra;
  });
  
  let resultado = palavras.join(' ');
  
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
function converterParaFormal(texto: string): string {
  if (!texto) return texto;
  
  // Primeiro corrige a ortografia
  let resultado = corrigirOrtografia(texto);
  
  // Substitui palavras por equivalentes formais
  for (const [informal, formal] of Object.entries(palavrasFormais)) {
    // Usa regex para substituir apenas palavras completas, não partes de palavras
    const regex = new RegExp(`\\b${informal}\\b`, 'gi');
    resultado = resultado.replace(regex, formal);
  }
  
  // Remover gírias e expressões coloquiais
  resultado = resultado.replace(/\btipo\b/gi, '');
  resultado = resultado.replace(/\bne\b/gi, 'não é');
  resultado = resultado.replace(/\btá\b/gi, 'está');
  
  // Aplicar regras de formalidade
  resultado = resultado.replace(/\bpra\b/gi, 'para');
  resultado = resultado.replace(/\bvamo\b/gi, 'vamos');
  resultado = resultado.replace(/\ba gente\b/gi, 'nós');
  
  // Garantir pontuação adequada
  if (!/[.!?]$/.test(resultado)) {
    resultado += '.';
  }
  
  return resultado;
}

/**
 * Converte o texto para um estilo informal
 */
function converterParaInformal(texto: string): string {
  if (!texto) return texto;
  
  // Corrige erros graves de ortografia primeiro
  let resultado = corrigirOrtografia(texto);
  
  // Substitui palavras por equivalentes informais
  for (const [formal, informal] of Object.entries(palavrasInformais)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    resultado = resultado.replace(regex, informal);
  }
  
  // Simplificar estruturas de frases
  resultado = resultado.replace(/\bnão é verdade\b/gi, 'né');
  resultado = resultado.replace(/\bcomo consequência\b/gi, 'daí');
  resultado = resultado.replace(/\bpor exemplo\b/gi, 'tipo');
  
  return resultado;
}

/**
 * Revisa um texto de acordo com o tipo de revisão solicitado
 */
export async function revisarTexto(texto: string, tipo: RevisaoTipo): Promise<string> {
  // Simular um pequeno atraso para dar feedback ao usuário
  await new Promise(resolve => setTimeout(resolve, 800));
  
  try {
    console.log(`Revisando texto no modo: ${tipo}`);
    let resultado;
    
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
  } catch (error) {
    console.error('Erro ao processar texto com NLP:', error);
    throw error;
  }
} 