import { revisarTexto } from './nlpService';

async function testarNLP() {
  console.log('Iniciando teste do NLP...');
  
  const textoTeste = "este texto ta escrito de um jeito informal e com erros de portugues. a gente precisa ver se o nlp vai conseguir corrigir isso.";
  
  try {
    console.log('\nTexto original:');
    console.log(textoTeste);
    
    console.log('\nTestando modo ortografia:');
    const textoCorrigido = await revisarTexto(textoTeste, 'ortografia');
    console.log(textoCorrigido);
    
    console.log('\nTestando modo formal:');
    const textoFormal = await revisarTexto(textoTeste, 'formal');
    console.log(textoFormal);
    
    console.log('\nTestando modo informal:');
    const textoInformal = await revisarTexto(textoTeste, 'informal');
    console.log(textoInformal);
    
    console.log('\nTeste concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar o teste
testarNLP();

// Exportação para evitar erro de módulo
export {}; 