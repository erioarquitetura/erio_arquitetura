import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PropostaCompleta } from '@/types/proposal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

// Função para carregar imagens de forma relativa (simulada)
// Esta função desenha um retângulo cinza para simular uma imagem no PDF.
// Parâmetros: pdf (instância do jsPDF), caminho (caminho da imagem), x, y (coordenadas), largura, altura (dimensões do retângulo).
const carregarImagem = (pdf: jsPDF, caminho: string, x: number, y: number, largura: number, altura: number) => {
  try {
    // Em um ambiente real, aqui carregariamos a imagem do caminho
    // Como solução temporária, desenharemos retângulos para simular as imagens
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(x, y, largura, altura, 'F');
    
    // Adicionar texto indicativo
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Imagem: ${caminho}`, x + largura/2, y + altura/2, { align: 'center' });
    
    console.log(`Simulando carregamento de imagem: ${caminho}`);
  } catch (error) {
    console.error(`Erro ao carregar imagem ${caminho}:`, error);
  }
};

// Função para processar texto formatado para o PDF
const processarTextoFormatadoParaPDF = (texto: string): string => {
  if (!texto) return '';
  
  // Remover marcações de negrito, itálico e sublinhado, mantendo o texto
  let processado = texto.replace(/\*\*(.*?)\*\*/g, '$1');
  processado = processado.replace(/\*(.*?)\*/g, '$1');
  processado = processado.replace(/_(.*?)_/g, '$1');
  
  // Converter listas para formato simples
  processado = processado.replace(/\n- (.*?)(?=\n|$)/g, '\n• $1');
  
  // Remover tags HTML de alinhamento
  processado = processado.replace(/<div style="text-align: (.*?)">(.*?)<\/div>/g, '$2');
  
  // Simplificar tabelas (opcional, pois o PDF não renderiza tabelas facilmente)
  if (processado.includes('| --- |')) {
    processado = processado.replace(/\|/g, ' ');
    processado = processado.replace(/---/g, '');
  }
  
  return processado;
};

// Função principal para gerar o PDF da proposta
// Esta função cria um PDF com várias páginas, cada uma representando uma seção da proposta.
// Parâmetros: proposta (dados completos da proposta).
export const generatePropostaPDF = async (proposta: PropostaCompleta): Promise<void> => {
  // Criar uma nova instância do PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  // Cores conforme solicitação
  const primaryColor = '#093247'; // Azul escuro conforme solicitado
  const accentColor = '#dcbda5'; // Bege/dourado para elementos de destaque
  
  // Adicionar fonte Montserrat (tentativa - caso não funcione, manterá a padrão)
  try {
    // Aqui idealmente seria adicionada a fonte Montserrat
    // Como o jsPDF precisa da fonte carregada, vamos manter a helvetica como fallback
    console.log('Tentativa de usar Montserrat, fallback para helvetica');
  } catch (error) {
    console.log('Erro ao carregar fonte, usando padrão');
  }
  
  // Adicionar primeira página - Capa
  addCoverPage(pdf, proposta, primaryColor, accentColor, margin, contentWidth, pageWidth, pageHeight);
  
  // Adicionar página sobre o arquiteto
  pdf.addPage();
  addArquitetoPage(pdf, proposta, primaryColor, accentColor, margin, contentWidth, pageWidth, pageHeight);
  
  // Adicionar página de descrição do projeto
  pdf.addPage();
  addDescricaoProjetoPage(pdf, proposta, primaryColor, accentColor, margin, contentWidth, pageWidth, pageHeight);
  
  // Adicionar página de etapas do projeto
  pdf.addPage();
  addEtapasProjetoPage(pdf, proposta, primaryColor, accentColor, margin, contentWidth, pageWidth, pageHeight);
  
  // Adicionar página de investimento e forma de pagamento
  pdf.addPage();
  addInvestimentoPage(pdf, proposta, primaryColor, accentColor, margin, contentWidth, pageWidth, pageHeight);
  
  // Salvar o PDF
  pdf.save(`proposta_${proposta.codigo}.pdf`);
};

// Função para adicionar a página de capa
// Esta função adiciona a capa do PDF, incluindo título, informações do cliente e um espaço para o logo.
// Parâmetros: pdf (instância do jsPDF), proposta (dados da proposta), primaryColor, accentColor (cores), margin, contentWidth, pageWidth, pageHeight (dimensões e margens).
const addCoverPage = (
  pdf: jsPDF, 
  proposta: PropostaCompleta, 
  primaryColor: string, 
  accentColor: string,
  margin: number,
  contentWidth: number,
  pageWidth: number,
  pageHeight: number
) => {
  // Fundo branco
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Título PROPOSTA
  pdf.setFont('helvetica', 'bold'); // Substituir por Montserrat quando disponível
  pdf.setFontSize(36);
  pdf.setTextColor(primaryColor);
  pdf.text('PROPOSTA', pageWidth / 2, 23, { align: 'center' });
  
  // Primeira tarja da página
  pdf.setDrawColor(primaryColor);
  pdf.setFillColor(primaryColor);
  pdf.rect(0, 37, pageWidth, 6, 'F'); // 104px ~= 37mm, 17px ~= 6mm
  
  // Informações da proposta
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Proposta:', 4.5, 48); // 12px ~= 4.5mm, 135px ~= 48mm
  
  // Número da proposta
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${proposta.codigo || 'ES-000/2023'}`, 40, 48); // 113px ~= 40mm
  
  // Título do nome do cliente
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cliente:', 4.5, 59); // 167px ~= 59mm
  
  // Nome do cliente
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${proposta.cliente?.nome || 'Nome do cliente'}`, 33.5, 59); // 95px ~= 33.5mm
  
  // Título do Endereço de interesse
  pdf.setFont('helvetica', 'bold');
  pdf.text('Endereço de interesse:', 4.5, 69.5); // 197px ~= 69.5mm
  
  // Endereço
  const endereco = `${proposta.endereco_interesse_logradouro || ''} ${proposta.endereco_interesse_numero || ''}, ${proposta.endereco_interesse_bairro || ''}, ${proposta.endereco_interesse_cidade || ''} - ${proposta.endereco_interesse_estado || ''}`;
  pdf.setFont('helvetica', 'normal');
  pdf.text(endereco, 85.5, 69.5); // 242px ~= 85.5mm
  
  // Imagem principal (placeholder com retângulo cinza)
  pdf.setDrawColor(220, 220, 220);
  pdf.setFillColor(245, 245, 245);
  // Posicionar no lado direito e parte inferior da folha
  pdf.rect(pageWidth - 136.5, 0, 136.5, 306, 'F'); // 387px ~= 136.5mm, 868px ~= 306mm
  
  // Logo
  pdf.setDrawColor(primaryColor);
  pdf.setFillColor(255, 255, 255);
  // Simular logo com um retângulo de texto
  pdf.rect(8.8, 221, 126, 47.5, 'S'); // 25px ~= 8.8mm, 626px ~= 221mm, 357px ~= 126mm, 135px ~= 47.5mm
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LOGO ERIO', 71.5, 245, { align: 'center' }); // Centralizado na área da logo
  
  // Segunda tarja da página (no rodapé)
  pdf.setDrawColor(primaryColor);
  pdf.setFillColor(primaryColor);
  pdf.rect(0, pageHeight - 6, pageWidth, 6, 'F'); // 17px ~= 6mm
};

// Função para adicionar a página sobre o arquiteto
// Esta função adiciona uma página com informações sobre o arquiteto, incluindo nome e biografia.
// Parâmetros: pdf (instância do jsPDF), proposta (dados da proposta), primaryColor, accentColor (cores), margin, contentWidth, pageWidth, pageHeight (dimensões e margens).
const addArquitetoPage = (
  pdf: jsPDF,
  proposta: PropostaCompleta,
  primaryColor: string,
  accentColor: string,
  margin: number,
  contentWidth: number,
  pageWidth: number,
  pageHeight: number
) => {
  // Fundo branco
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Título da seção
  pdf.setFont('helvetica', 'bold'); // Substituir por Montserrat quando disponível
  pdf.setFontSize(21);
  pdf.setTextColor(primaryColor);
  pdf.text('Sobre o Arquiteto', 27.9, 40); // 79px ~= 27.9mm
  
  // Linha decorativa
  pdf.setDrawColor(accentColor);
  pdf.setFillColor(accentColor);
  pdf.rect(27.9, 43, 17.6, 2.8, 'F'); // 50px ~= 17.6mm, 8px ~= 2.8mm
  
  // Nome do arquiteto
  pdf.setFontSize(16);
  pdf.text('Eriosmar Santos', 27.9, 58); // 164px ~= 58mm
  
  // Biografia do arquiteto
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(13);
  pdf.setTextColor(primaryColor);
  
  const bioText = 
    'Atua há mais de 6 anos como Arquiteta e Urbanista com projetos comerciais e residenciais. ' +
    'Formada pela Faculdade UNIME - União Metropolitana de Educação e Cultura compõem ' +
    'um conjunto de IES privadas brasileiras, cuja marca é associada ao nome da entidade ' +
    'mantenedora e Especialista em BIM (Building Information Modeling) é uma tecnologia que ' +
    'permite criar modelos digitais de edifícios. Esses modelos 3D reúnem informações sobre as ' +
    'características físicas e funcionais de um edifício. O BIM é usado para gerenciar projetos de ' +
    'construção, desde o projeto até a demolição';
  
  const bioLines = pdf.splitTextToSize(bioText, 153); // 434px ~= 153mm
  pdf.text(bioLines, 4.5, 66); // 12px ~= 4.5mm
  
  // Imagem do arquiteto
  // Carregar a imagem real do arquiteto no PDF a partir da URL
  const imgArquiteto = new Image();
  imgArquiteto.crossOrigin = 'Anonymous'; // Permitir o carregamento de imagens de diferentes origens
  imgArquiteto.src = 'https://media-hosting.imagekit.io/ad64bbab5451419b/arquiteto.jpg?Expires=1838853837&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=HCG3wH5WTsppyBWfRVdBKpQBCWZIwhrFErI6MQazDeUYpCGbb5qbs~VMsqEgK7IqUqmq8paF06WKEjYzHSrBFGIHKqggh7-hmyLWN6IBLdCB58hY0fG-aKPnWo67ow3-1LToFuBKk51~Jfjvg4BkYtIy5kmis~SE7vynLcZJ9xBjl3MZ9z1E39JMG734X8qofD7UcgZOE0Y7LySsCq10A5OQaHdtLlL4p2nOkhJq5tJ~-M3FG7Y6iYypLi29wsB3gXvDQ8qhlhMfV7uuuV9GvqQW9l9qj2seIbE0qMzm7Lb65fGn6hO91lAunzbUbCYoV7-un6EOINKS18IJjjCGtg__';
  imgArquiteto.onload = () => {
    console.log('Imagem carregada com sucesso');
    const canvas = document.createElement('canvas');
    canvas.width = imgArquiteto.width;
    canvas.height = imgArquiteto.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(imgArquiteto, 0, 0);
      const imgData = canvas.toDataURL('image/jpeg');
      pdf.addImage(imgData, 'JPEG', pageWidth - 326, 0, 326, 464);
    }
  };
  imgArquiteto.onerror = () => {
    console.error('Erro ao carregar a imagem');
  };
  
  // Linha separadora horizontal
  pdf.setDrawColor(accentColor);
  pdf.setFillColor(accentColor);
  pdf.rect(0, 194, pageWidth, 2.8, 'F'); // 550px ~= 194mm, 8px ~= 2.8mm
  
  // Título do resumo executivo
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(21);
  pdf.setTextColor(primaryColor);
  pdf.text('Resumo executivo', 27.9, 245); // 694px ~= 245mm
  
  // Linha decorativa
  pdf.setDrawColor(accentColor);
  pdf.setFillColor(accentColor);
  pdf.rect(27.9, 248, 17.6, 2.8, 'F'); // 50px ~= 17.6mm, 8px ~= 2.8mm
  
  // Itens do resumo executivo
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(13);
  pdf.setTextColor(primaryColor);
  
  let yPos = 245; // Mesmo y do título
  
  if (proposta.resumo_executivo && proposta.resumo_executivo.length > 0) {
    proposta.resumo_executivo.forEach((item, index) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}-`, 67, yPos); // 189px ~= 67mm
      pdf.setFont('helvetica', 'normal');
      
      // Processar texto formatado antes de adicioná-lo ao PDF
      const textoProcessado = processarTextoFormatadoParaPDF(item.topico);
      const lines = pdf.splitTextToSize(textoProcessado, 141); // 400px ~= 141mm
      pdf.text(lines, 74, yPos); // 210px ~= 74mm
      yPos += 8.1; // 23px ~= 8.1mm (espaçamento entre tópicos)
    });
  } else {
    // Texto de exemplo caso não haja itens
    for (let i = 1; i <= 3; i++) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${i}-`, 67, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Aqui será exibido os tópicos de acordo com o que for adicionado na proposta.', 74, yPos);
      yPos += 8.1;
    }
  }
};

// Função para adicionar a página de descrição do projeto
// Esta função adiciona uma página com a descrição detalhada do projeto, incluindo áreas e suas descrições.
// Parâmetros: pdf (instância do jsPDF), proposta (dados da proposta), primaryColor, accentColor (cores), margin, contentWidth, pageWidth, pageHeight (dimensões e margens).
const addDescricaoProjetoPage = (
  pdf: jsPDF,
  proposta: PropostaCompleta,
  primaryColor: string,
  accentColor: string,
  margin: number,
  contentWidth: number,
  pageWidth: number,
  pageHeight: number
) => {
  // Fundo branco
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Título da seção
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(primaryColor);
  pdf.text('Descrição do projeto', margin, 40);
  
  // Linha decorativa
  pdf.setDrawColor(accentColor);
  pdf.setFillColor(accentColor);
  pdf.rect(margin, 45, 40, 3, 'F');
  
  // Linha horizontal divisória superior
  pdf.setDrawColor(primaryColor);
  pdf.setFillColor(primaryColor);
  pdf.rect(0, 10, pageWidth, 5, 'F');
  
  let yPos = 70;
  let totalArea = 0;
  
  if (proposta.descricao_projeto && proposta.descricao_projeto.length > 0) {
    proposta.descricao_projeto.forEach(item => {
      // Nome da área e metragem
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(primaryColor);
      pdf.text(item.area.toUpperCase(), margin, yPos);
      
      pdf.setTextColor(primaryColor);
      pdf.text(`${item.metragem}m²`, contentWidth + margin, yPos, { align: 'right' });
      
      // Descrição da área
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      
      const lines = pdf.splitTextToSize(item.descricao || 'Aqui será carregado os itens da descrição do projeto com todas as informações.', contentWidth);
      pdf.text(lines, margin, yPos + 10);
      
      totalArea += item.metragem;
      yPos += 20 + (lines.length * 5);
      
      // Linha separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, contentWidth + margin, yPos);
      yPos += 10;
    });
  } else {
    // Exemplos de áreas caso não haja descrição
    const exemplos = [
      { nome: 'SALA', metragem: 25.50, descricao: 'Aqui será carregado os itens da descrição do projeto com todas as informações.' },
      { nome: 'COZINHA', metragem: 16.00, descricao: 'Aqui será carregado os itens da descrição do projeto com todas as informações.' },
      { nome: 'LAVABO', metragem: 2.00, descricao: 'Aqui será carregado os itens da descrição do projeto com todas as informações.' }
    ];
    
    exemplos.forEach(item => {
      // Nome da área e metragem
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(primaryColor);
      pdf.text(item.nome, margin, yPos);
      
      pdf.setTextColor(primaryColor);
      pdf.text(`${item.metragem}m²`, contentWidth + margin, yPos, { align: 'right' });
      
      // Descrição da área
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      
      const lines = pdf.splitTextToSize(item.descricao, contentWidth);
      pdf.text(lines, margin, yPos + 10);
      
      totalArea += item.metragem;
      yPos += 20 + (lines.length * 5);
      
      // Linha separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, contentWidth + margin, yPos);
      yPos += 10;
    });
  }
  
  // Área total
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(primaryColor);
  pdf.text('Área total:', margin, yPos + 10);
  pdf.text(`${totalArea}m²`, contentWidth + margin, yPos + 10, { align: 'right' });
  
  // Imagem de fundo na parte inferior
  pdf.setDrawColor(220, 220, 220);
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(0, pageHeight - 90, pageWidth, 90, 0, 0, 'F');
};

// Função para adicionar a página de etapas do projeto
// Esta função adiciona uma página listando as etapas do projeto, com ícones de checkbox para cada etapa.
// Parâmetros: pdf (instância do jsPDF), proposta (dados da proposta), primaryColor, accentColor (cores), margin, contentWidth, pageWidth, pageHeight (dimensões e margens).
const addEtapasProjetoPage = (
  pdf: jsPDF,
  proposta: PropostaCompleta,
  primaryColor: string,
  accentColor: string,
  margin: number,
  contentWidth: number,
  pageWidth: number,
  pageHeight: number
) => {
  // Fundo branco
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Linha horizontal superior
  pdf.setDrawColor(primaryColor);
  pdf.setFillColor(primaryColor);
  pdf.rect(0, 10, pageWidth, 5, 'F');
  
  // Título da seção
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(primaryColor);
  pdf.text('Etapas de um Projeto', margin, 40);
  
  // Linha decorativa
  pdf.setDrawColor(accentColor);
  pdf.setFillColor(accentColor);
  pdf.rect(margin, 45, 40, 3, 'F');
  
  // Imagem lateral (mockup com retângulo cinza)
  pdf.setDrawColor(220, 220, 220);
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(pageWidth / 2 + 10, 70, pageWidth / 2 - 30, pageHeight - 140, 0, 0, 'F');
  
  let yPos = 70;
  
  if (proposta.etapas_projeto && proposta.etapas_projeto.length > 0) {
    proposta.etapas_projeto.forEach((etapa, index) => {
      // Ícone de checkbox
      pdf.setDrawColor(primaryColor);
      pdf.setFillColor(255, 255, 255);
      if (index === 0) {
        // Primeiro item marcado (como no exemplo)
        pdf.setFillColor(primaryColor);
        pdf.circle(margin + 3, yPos - 1, 3, 'F');
      } else {
        pdf.circle(margin + 3, yPos - 1, 3, 'S');
      }
      
      // Nome da etapa
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(50, 50, 50);
      pdf.text(etapa.nome, margin + 15, yPos);
      
      yPos += 25;
    });
  } else {
    // Etapas de exemplo caso não haja etapas na proposta
    const etapasExemplo = [
      'Levantamento de Dados',
      'Estudo Preliminar',
      'Anteprojeto',
      'Projeto Legal',
      'Projeto Executivo',
      'Detalhamento e Especificações',
      'Acompanhamento de Obra'
    ];
    
    etapasExemplo.forEach((etapa, index) => {
      // Ícone de checkbox
      pdf.setDrawColor(primaryColor);
      pdf.setFillColor(255, 255, 255);
      if (index === 0) {
        // Primeiro item marcado (como no exemplo)
        pdf.setFillColor(primaryColor);
        pdf.circle(margin + 3, yPos - 1, 3, 'F');
      } else {
        pdf.circle(margin + 3, yPos - 1, 3, 'S');
      }
      
      // Nome da etapa
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(50, 50, 50);
      pdf.text('Carregar as etapas adicionadas na proposta', margin + 15, yPos);
      
      yPos += 25;
    });
  }
};

// Função para adicionar a página de investimento e forma de pagamento
// Esta função adiciona uma página detalhando o investimento e as condições de pagamento, além de informações de contato.
// Parâmetros: pdf (instância do jsPDF), proposta (dados da proposta), primaryColor, accentColor (cores), margin, contentWidth, pageWidth, pageHeight (dimensões e margens).
const addInvestimentoPage = (
  pdf: jsPDF,
  proposta: PropostaCompleta,
  primaryColor: string,
  accentColor: string,
  margin: number,
  contentWidth: number,
  pageWidth: number,
  pageHeight: number
) => {
  // Fundo branco
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Imagem lateral (mockup com retângulo cinza)
  pdf.setDrawColor(220, 220, 220);
  pdf.setFillColor(245, 245, 245);
  pdf.rect(pageWidth / 2 + 10, 20, pageWidth / 2 - 30, pageHeight - 40, 'F');
  
  // Título da seção
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(primaryColor);
  pdf.text('O que você vai receber', margin, 40);
  
  // Linha decorativa
  pdf.setDrawColor(accentColor);
  pdf.setFillColor(accentColor);
  pdf.rect(margin, 45, 40, 3, 'F');
  
  // Itens inclusos
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 50);
  
  let yPos = 60;
  const itens = [
    'Imagens em 3D',
    'Projeto executivo',
    'Projeto de detalhamento',
    'Acompanhamento de obra'
  ];
  
  itens.forEach(item => {
    // Bullet points como círculos
    pdf.setDrawColor(accentColor);
    pdf.setFillColor(accentColor);
    pdf.circle(margin + 3, yPos - 1, 2, 'F');
    
    pdf.text(`${item}`, margin + 10, yPos);
    yPos += 10;
  });
  
  // Ambientes
  yPos += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('Ambientes', margin, yPos);
  
  // Retângulo para ambientes
  pdf.setDrawColor(primaryColor);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, yPos + 5, pageWidth / 2 - margin - 10, 40, 1, 1, 'S');
  
  // Descrição dos ambientes
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  
  let ambientes = 'Sala de estar, cozinha, suite principal, banheiro casal, lavado, varanda.';
  if (proposta.descricao_projeto && proposta.descricao_projeto.length > 0) {
    ambientes = proposta.descricao_projeto.map(item => item.area).join(', ');
  }
  
  // Calcular área total
  let areaTotal = 0;
  if (proposta.descricao_projeto && proposta.descricao_projeto.length > 0) {
    areaTotal = proposta.descricao_projeto.reduce((total, item) => total + item.metragem, 0);
  } else {
    areaTotal = 80; // Valor padrão
  }
  
  ambientes += ` Com área total: ${areaTotal}m²`;
  
  const ambientesLines = pdf.splitTextToSize(ambientes, pageWidth / 2 - margin - 20);
  pdf.text(ambientesLines, margin + 5, yPos + 20);
  
  // Investimento e forma de pagamento
  yPos += 70;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(primaryColor);
  pdf.text('Investimento e', margin, yPos);
  pdf.text('forma de pagamento', margin, yPos + 10);
  
  // Linha decorativa
  pdf.setDrawColor(accentColor);
  pdf.setFillColor(accentColor);
  pdf.rect(margin, yPos + 15, 40, 3, 'F');
  
  // Valor do investimento
  yPos += 35;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(50, 50, 50);
  pdf.text(`R$ ${formatCurrency(proposta.valor_total || 4200).replace('R$', '')}`, margin, yPos);
  
  // Condições de pagamento
  yPos += 15;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  
  if (proposta.condicoes_pagamento && proposta.condicoes_pagamento.length > 0) {
    proposta.condicoes_pagamento.forEach(condicao => {
      pdf.text(`${condicao.percentual}% ${condicao.descricao}`, margin, yPos);
      yPos += 10;
    });
  } else {
    pdf.text('50% na assinatura do contrato', margin, yPos);
    yPos += 10;
    pdf.text('50% na entrega do projeto executivo', margin, yPos);
  }
  
  // Bloco azul no rodapé
  pdf.setDrawColor(primaryColor);
  pdf.setFillColor(primaryColor);
  pdf.rect(0, pageHeight - 60, pageWidth / 2, 60, 'F');
  
  // Informações de contato
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Dúvidas?', margin, pageHeight - 35);
  
  // Linha decorativa
  pdf.setDrawColor(accentColor);
  pdf.setFillColor(accentColor);
  pdf.rect(margin, pageHeight - 30, 40, 2, 'F');
  
  // Contato
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Eriosmar', margin, pageHeight - 20);
  pdf.text('(71) 9 9644-4123', margin, pageHeight - 10);
  
  // Data atual
  pdf.setTextColor(50, 50, 50);
  pdf.text(format(new Date(), 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR }), contentWidth, pageHeight - 10, { align: 'center' });
}; 