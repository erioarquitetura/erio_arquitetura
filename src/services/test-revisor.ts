import { revisarTexto, corrigirOrtografia, converterParaFormal, converterParaInformal } from './revisorService';

async function testarRevisor() {
  console.log('Iniciando teste do Revisor...');
  
  const textoTeste = "este texto ta escrito de um jeito informal e com erros de portugues. a gente precisa ver se o revisor vai conseguir corrigir isso.";
  
  console.log('\nTexto original:');
  console.log(textoTeste);
  
  console.log('\nTestando função direta de ortografia:');
  console.log(corrigirOrtografia(textoTeste));
  
  console.log('\nTestando função direta de formalização:');
  console.log(converterParaFormal(textoTeste));
  
  console.log('\nTestando função direta de informalização:');
  console.log(converterParaInformal(textoTeste));
  
  try {
    console.log('\nTestando função assíncrona: modo ortografia');
    const textoCorrigido = await revisarTexto(textoTeste, 'ortografia');
    console.log(textoCorrigido);
    
    console.log('\nTestando função assíncrona: modo formal');
    const textoFormal = await revisarTexto(textoTeste, 'formal');
    console.log(textoFormal);
    
    console.log('\nTestando função assíncrona: modo informal');
    const textoInformal = await revisarTexto(textoTeste, 'informal');
    console.log(textoInformal);
    
    console.log('\nTeste concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar o teste
testarRevisor();

// Exportação para evitar erro de módulo
export {}; 