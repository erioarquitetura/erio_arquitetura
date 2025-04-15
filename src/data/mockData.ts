import { 
  Cliente, 
  Fornecedor, 
  Servico, 
  TransacaoFinanceira,
  NotaFiscal,
  ContaBancaria,
  Categoria,
  Proposta,
  EstatisticasFinanceiras,
  PerfilEmpresa
} from '../types';

// Perfil da Empresa
export const perfilEmpresa: PerfilEmpresa = {
  razaoSocial: "ERIO STUDIO DE ARQUITETURA LTDA",
  nomeFantasia: "ERIO STUDIO DE ARQUITETURA",
  cnpj: "12.345.678/0001-90",
  email: "contato@eriostudio.com.br",
  telefone: "(11) 9876-5432",
  endereco: {
    logradouro: "Avenida Paulista",
    numero: "1000",
    complemento: "Sala 1010",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01310-100"
  },
  logo: "/images/icons/placeholder.svg"
};

// Clientes
export const clientes: Cliente[] = [
  {
    id: "c1",
    nome: "Ana Construtora Ltda",
    email: "contato@anaconstrutora.com.br",
    telefone: "(11) 98765-4321",
    documento: "11.222.333/0001-44",
    endereco: {
      logradouro: "Rua dos Arquitetos",
      numero: "100",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01001-000"
    },
    dataCriacao: "2023-01-15T10:00:00Z",
    dataAtualizacao: "2023-08-20T14:30:00Z",
    observacoes: "Cliente desde 2023, foco em projetos residenciais de alto padrão",
    ativo: true
  },
  {
    id: "c2",
    nome: "Construtora Horizonte S.A.",
    email: "projetos@horizonteconstrutora.com.br",
    telefone: "(11) 91234-5678",
    documento: "22.333.444/0001-55",
    endereco: {
      logradouro: "Avenida Paulista",
      numero: "1500",
      complemento: "Andar 20",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310-200"
    },
    dataCriacao: "2023-02-10T09:15:00Z",
    dataAtualizacao: "2023-09-05T11:20:00Z",
    observacoes: "Cliente corporate, foco em projetos comerciais",
    ativo: true
  },
  {
    id: "c3",
    nome: "Incorporadora Nova Era",
    email: "contato@novaera.com.br",
    telefone: "(11) 97777-8888",
    documento: "33.444.555/0001-66",
    endereco: {
      logradouro: "Rua Augusta",
      numero: "2000",
      complemento: "Conj. 50",
      bairro: "Consolação",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01305-100"
    },
    dataCriacao: "2023-03-22T14:20:00Z",
    dataAtualizacao: "2023-07-18T16:45:00Z",
    ativo: true
  },
  {
    id: "c4",
    nome: "Maria Silva",
    email: "maria.silva@email.com",
    telefone: "(11) 99999-8888",
    documento: "123.456.789-10",
    endereco: {
      logradouro: "Rua das Flores",
      numero: "123",
      bairro: "Jardim Europa",
      cidade: "São Paulo",
      estado: "SP",
      cep: "04500-000"
    },
    dataCriacao: "2023-04-05T10:30:00Z",
    dataAtualizacao: "2023-04-05T10:30:00Z",
    observacoes: "Cliente pessoa física, projeto residencial",
    ativo: true
  },
  {
    id: "c5",
    nome: "Tech Spaces Ltda",
    email: "contato@techspaces.com.br",
    telefone: "(11) 92222-3333",
    documento: "44.555.666/0001-77",
    endereco: {
      logradouro: "Av. Engenheiro Luis Carlos Berrini",
      numero: "500",
      complemento: "Andar 15",
      bairro: "Itaim Bibi",
      cidade: "São Paulo",
      estado: "SP",
      cep: "04571-000"
    },
    dataCriacao: "2023-05-12T11:40:00Z",
    dataAtualizacao: "2023-10-01T09:15:00Z",
    ativo: true
  }
];

// Fornecedores
export const fornecedores: Fornecedor[] = [
  {
    id: "f1",
    nome: "Materiais Construção Expressa",
    email: "vendas@construcaoexpressa.com.br",
    telefone: "(11) 3333-4444",
    documento: "55.666.777/0001-88",
    categoria: "Materiais de Construção",
    endereco: {
      logradouro: "Av. Industrial",
      numero: "1500",
      bairro: "Santo André",
      cidade: "São Paulo",
      estado: "SP",
      cep: "09080-510"
    },
    dataCriacao: "2023-01-20T08:30:00Z",
    dataAtualizacao: "2023-08-15T14:20:00Z",
    observacoes: "Entrega rápida, bons preços em material básico",
    ativo: true
  },
  {
    id: "f2",
    nome: "Móveis Planejados Elegance",
    email: "comercial@moveiselegance.com.br",
    telefone: "(11) 4444-5555",
    documento: "66.777.888/0001-99",
    categoria: "Mobiliário",
    endereco: {
      logradouro: "Rua do Design",
      numero: "300",
      complemento: "Galpão 5",
      bairro: "Mooca",
      cidade: "São Paulo",
      estado: "SP",
      cep: "03103-000"
    },
    dataCriacao: "2023-02-18T10:15:00Z",
    dataAtualizacao: "2023-09-10T11:40:00Z",
    observacoes: "Especialistas em móveis sob medida para projetos de alto padrão",
    ativo: true
  },
  {
    id: "f3",
    nome: "Iluminação Moderna Ltda",
    email: "contato@iluminacaomoderna.com.br",
    telefone: "(11) 5555-6666",
    documento: "77.888.999/0001-00",
    categoria: "Iluminação",
    endereco: {
      logradouro: "Av. Luz Design",
      numero: "400",
      bairro: "Pinheiros",
      cidade: "São Paulo",
      estado: "SP",
      cep: "05422-030"
    },
    dataCriacao: "2023-03-10T14:50:00Z",
    dataAtualizacao: "2023-07-22T09:30:00Z",
    ativo: true
  },
  {
    id: "f4",
    nome: "Mármores & Granitos Premium",
    email: "vendas@marmorepremium.com.br",
    telefone: "(11) 6666-7777",
    documento: "88.999.000/0001-11",
    categoria: "Revestimentos",
    endereco: {
      logradouro: "Rodovia dos Bandeirantes",
      numero: "5000",
      complemento: "Km 65",
      bairro: "Zona Rural",
      cidade: "Jundiaí",
      estado: "SP",
      cep: "13210-000"
    },
    dataCriacao: "2023-04-15T16:20:00Z",
    dataAtualizacao: "2023-04-15T16:20:00Z",
    observacoes: "Fornecedor de pedras naturais importadas",
    ativo: true
  }
];

// Serviços
export const servicos: Servico[] = [
  {
    id: "s1",
    nome: "Projeto Arquitetônico Residencial",
    descricao: "Desenvolvimento completo de projeto arquitetônico para residências",
    valor: 150.0,
    categoria: "Projetos",
    unidade: "m²",
    dataCriacao: "2023-01-10T09:00:00Z",
    dataAtualizacao: "2023-08-05T11:30:00Z",
    ativo: true
  },
  {
    id: "s2",
    nome: "Projeto Arquitetônico Comercial",
    descricao: "Desenvolvimento completo de projeto arquitetônico para espaços comerciais",
    valor: 180.0,
    categoria: "Projetos",
    unidade: "m²",
    dataCriacao: "2023-01-15T10:20:00Z",
    dataAtualizacao: "2023-09-12T14:15:00Z",
    ativo: true
  },
  {
    id: "s3",
    nome: "Design de Interiores",
    descricao: "Projeto de interiores com especificação de materiais e mobiliário",
    valor: 200.0,
    categoria: "Design",
    unidade: "m²",
    dataCriacao: "2023-02-05T11:30:00Z",
    dataAtualizacao: "2023-07-18T15:45:00Z",
    ativo: true
  },
  {
    id: "s4",
    nome: "Acompanhamento de Obra",
    descricao: "Visitas técnicas para acompanhamento da execução do projeto",
    valor: 350.0,
    categoria: "Consultoria",
    unidade: "visita",
    dataCriacao: "2023-02-20T14:00:00Z",
    dataAtualizacao: "2023-09-01T10:10:00Z",
    ativo: true
  },
  {
    id: "s5",
    nome: "Projeto de Paisagismo",
    descricao: "Design e especificação completa para áreas externas e jardins",
    valor: 120.0,
    categoria: "Projetos",
    unidade: "m²",
    dataCriacao: "2023-03-15T09:45:00Z",
    dataAtualizacao: "2023-03-15T09:45:00Z",
    ativo: true
  },
  {
    id: "s6",
    nome: "Consultoria de Iluminação",
    descricao: "Projeto específico para iluminação de ambientes",
    valor: 90.0,
    categoria: "Consultoria",
    unidade: "m²",
    dataCriacao: "2023-04-10T16:30:00Z",
    dataAtualizacao: "2023-10-02T11:20:00Z",
    ativo: true
  }
];

// Categorias
export const categorias: Categoria[] = [
  {
    id: "cat1",
    nome: "Projetos",
    tipo: "receita",
    descricao: "Receitas provenientes de projetos arquitetônicos",
    cor: "#4CAF50",
    ativo: true
  },
  {
    id: "cat2",
    nome: "Consultorias",
    tipo: "receita",
    descricao: "Receitas de serviços de consultoria",
    cor: "#2196F3",
    ativo: true
  },
  {
    id: "cat3",
    nome: "Design",
    tipo: "receita",
    descricao: "Receitas de design de interiores e outros",
    cor: "#9C27B0",
    ativo: true
  },
  {
    id: "cat4",
    nome: "Pessoal",
    tipo: "despesa",
    descricao: "Despesas com salários e benefícios",
    cor: "#F44336",
    ativo: true
  },
  {
    id: "cat5",
    nome: "Escritório",
    tipo: "despesa",
    descricao: "Despesas operacionais do escritório",
    cor: "#FF9800",
    ativo: true
  },
  {
    id: "cat6",
    nome: "Software",
    tipo: "despesa",
    descricao: "Despesas com licenças de softwares",
    cor: "#607D8B",
    ativo: true
  },
  {
    id: "cat7",
    nome: "Marketing",
    tipo: "despesa",
    descricao: "Despesas com divulgação e marketing",
    cor: "#E91E63",
    ativo: true
  },
  {
    id: "cat8",
    nome: "Materiais de Construção",
    tipo: "fornecedor",
    descricao: "Fornecedores de materiais para construção",
    cor: "#795548",
    ativo: true
  },
  {
    id: "cat9",
    nome: "Mobiliário",
    tipo: "fornecedor",
    descricao: "Fornecedores de móveis e decoração",
    cor: "#009688",
    ativo: true
  },
  {
    id: "cat10",
    nome: "Iluminação",
    tipo: "fornecedor",
    descricao: "Fornecedores de produtos de iluminação",
    cor: "#FFEB3B",
    ativo: true
  },
  {
    id: "cat11",
    nome: "Revestimentos",
    tipo: "fornecedor",
    descricao: "Fornecedores de revestimentos diversos",
    cor: "#FF5722",
    ativo: true
  }
];

// Contas Bancárias
export const contasBancarias: ContaBancaria[] = [
  {
    id: "b1",
    nome: "Conta Principal",
    banco: "Itaú",
    agencia: "1234",
    conta: "56789-0",
    tipo: "corrente",
    saldoInicial: 50000.0,
    saldoAtual: 68452.75,
    ativo: true
  },
  {
    id: "b2",
    nome: "Conta Reserva",
    banco: "Bradesco",
    agencia: "5678",
    conta: "12345-6",
    tipo: "poupanca",
    saldoInicial: 25000.0,
    saldoAtual: 36890.45,
    ativo: true
  },
  {
    id: "b3",
    nome: "Investimentos",
    banco: "XP Investimentos",
    agencia: "0001",
    conta: "987654-3",
    tipo: "investimento",
    saldoInicial: 100000.0,
    saldoAtual: 115670.88,
    ativo: true
  }
];

// Transações Financeiras (Receitas e Despesas)
export const transacoesFinanceiras: TransacaoFinanceira[] = [
  {
    id: "t1",
    tipo: "receita",
    descricao: "Projeto Residencial Ana Construtora",
    valor: 45000.0,
    data: "2023-09-15T10:00:00Z",
    categoria: "Projetos",
    contaBancaria: "b1",
    documentoFiscal: "NF-001",
    formaPagamento: "transferência",
    status: "pago",
    dataVencimento: "2023-09-15T00:00:00Z",
    dataPagamento: "2023-09-15T00:00:00Z",
    clienteId: "c1",
    observacoes: "Primeira fase do projeto"
  },
  {
    id: "t2",
    tipo: "receita",
    descricao: "Consultoria Técnica Tech Spaces",
    valor: 12000.0,
    data: "2023-09-20T14:30:00Z",
    categoria: "Consultorias",
    contaBancaria: "b1",
    documentoFiscal: "NF-002",
    formaPagamento: "PIX",
    status: "pago",
    dataVencimento: "2023-09-20T00:00:00Z",
    dataPagamento: "2023-09-20T00:00:00Z",
    clienteId: "c5"
  },
  {
    id: "t3",
    tipo: "receita",
    descricao: "Design de Interiores Maria Silva",
    valor: 28500.0,
    data: "2023-09-25T11:15:00Z",
    categoria: "Design",
    contaBancaria: "b1",
    documentoFiscal: "NF-003",
    formaPagamento: "transferência",
    status: "pago",
    dataVencimento: "2023-09-25T00:00:00Z",
    dataPagamento: "2023-09-26T00:00:00Z",
    clienteId: "c4"
  },
  {
    id: "t4",
    tipo: "receita",
    descricao: "Projeto Comercial Construtora Horizonte",
    valor: 65000.0,
    data: "2023-10-05T09:45:00Z",
    categoria: "Projetos",
    contaBancaria: "b1",
    documentoFiscal: "NF-004",
    formaPagamento: "transferência",
    status: "pendente",
    dataVencimento: "2023-10-20T00:00:00Z",
    clienteId: "c2"
  },
  {
    id: "t5",
    tipo: "despesa",
    descricao: "Salários Equipe",
    valor: 32000.0,
    data: "2023-09-05T16:00:00Z",
    categoria: "Pessoal",
    contaBancaria: "b1",
    formaPagamento: "transferência",
    status: "pago",
    dataVencimento: "2023-09-05T00:00:00Z",
    dataPagamento: "2023-09-05T00:00:00Z"
  },
  {
    id: "t6",
    tipo: "despesa",
    descricao: "Aluguel Escritório",
    valor: 8500.0,
    data: "2023-09-10T09:30:00Z",
    categoria: "Escritório",
    contaBancaria: "b1",
    documentoFiscal: "Recibo-001",
    formaPagamento: "transferência",
    status: "pago",
    dataVencimento: "2023-09-10T00:00:00Z",
    dataPagamento: "2023-09-10T00:00:00Z"
  },
  {
    id: "t7",
    tipo: "despesa",
    descricao: "Licenças Software CAD",
    valor: 4800.0,
    data: "2023-09-12T11:20:00Z",
    categoria: "Software",
    contaBancaria: "b1",
    documentoFiscal: "NF-S-001",
    formaPagamento: "cartão de crédito",
    status: "pago",
    dataVencimento: "2023-09-12T00:00:00Z",
    dataPagamento: "2023-09-12T00:00:00Z",
    fornecedorId: "f3"
  },
  {
    id: "t8",
    tipo: "despesa",
    descricao: "Compra Materiais Escritório",
    valor: 1250.0,
    data: "2023-09-18T15:45:00Z",
    categoria: "Escritório",
    contaBancaria: "b1",
    documentoFiscal: "NF-C-002",
    formaPagamento: "cartão de débito",
    status: "pago",
    dataVencimento: "2023-09-18T00:00:00Z",
    dataPagamento: "2023-09-18T00:00:00Z",
    fornecedorId: "f1"
  },
  {
    id: "t9",
    tipo: "despesa",
    descricao: "Campanha Marketing Digital",
    valor: 3500.0,
    data: "2023-09-22T10:15:00Z",
    categoria: "Marketing",
    contaBancaria: "b1",
    documentoFiscal: "NF-S-002",
    formaPagamento: "transferência",
    status: "pendente",
    dataVencimento: "2023-10-05T00:00:00Z"
  },
  {
    id: "t10",
    tipo: "despesa",
    descricao: "Móveis para Escritório",
    valor: 12000.0,
    data: "2023-09-28T14:20:00Z",
    categoria: "Escritório",
    contaBancaria: "b1",
    documentoFiscal: "NF-C-003",
    formaPagamento: "PIX",
    status: "pendente",
    dataVencimento: "2023-10-10T00:00:00Z",
    fornecedorId: "f2"
  }
];

// Notas Fiscais
export const notasFiscais: NotaFiscal[] = [
  {
    id: "nf1",
    numero: "001",
    serie: "A",
    tipo: "emitida",
    data: "2023-09-15T10:00:00Z",
    valor: 45000.0,
    impostos: 6750.0,
    clienteId: "c1",
    itens: [
      {
        id: "nfi1",
        descricao: "Projeto Arquitetônico Residencial",
        quantidade: 300,
        valorUnitario: 150.0,
        valorTotal: 45000.0,
        servicoId: "s1"
      }
    ],
    status: "concluida",
    observacoes: "Nota fiscal referente à primeira fase do projeto"
  },
  {
    id: "nf2",
    numero: "002",
    serie: "A",
    tipo: "emitida",
    data: "2023-09-20T14:30:00Z",
    valor: 12000.0,
    impostos: 1800.0,
    clienteId: "c5",
    itens: [
      {
        id: "nfi2",
        descricao: "Consultoria Técnica",
        quantidade: 6,
        valorUnitario: 2000.0,
        valorTotal: 12000.0,
        servicoId: "s4"
      }
    ],
    status: "concluida"
  },
  {
    id: "nf3",
    numero: "003",
    serie: "A",
    tipo: "emitida",
    data: "2023-09-25T11:15:00Z",
    valor: 28500.0,
    impostos: 4275.0,
    clienteId: "c4",
    itens: [
      {
        id: "nfi3",
        descricao: "Design de Interiores",
        quantidade: 95,
        valorUnitario: 300.0,
        valorTotal: 28500.0,
        servicoId: "s3"
      }
    ],
    status: "concluida"
  },
  {
    id: "nf4",
    numero: "004",
    serie: "A",
    tipo: "emitida",
    data: "2023-10-05T09:45:00Z",
    valor: 65000.0,
    impostos: 9750.0,
    clienteId: "c2",
    itens: [
      {
        id: "nfi4",
        descricao: "Projeto Arquitetônico Comercial",
        quantidade: 360,
        valorUnitario: 180.0,
        valorTotal: 64800.0,
        servicoId: "s2"
      },
      {
        id: "nfi5",
        descricao: "Taxa de urgência",
        quantidade: 1,
        valorUnitario: 200.0,
        valorTotal: 200.0
      }
    ],
    status: "pendente",
    observacoes: "Aguardando pagamento para liberação"
  },
  {
    id: "nf5",
    numero: "1234",
    serie: "1",
    tipo: "recebida",
    data: "2023-09-12T11:20:00Z",
    valor: 4800.0,
    impostos: 624.0,
    fornecedorId: "f3",
    itens: [
      {
        id: "nfi6",
        descricao: "Licenças Software CAD - Pacote Anual",
        quantidade: 4,
        valorUnitario: 1200.0,
        valorTotal: 4800.0
      }
    ],
    status: "concluida"
  },
  {
    id: "nf6",
    numero: "5678",
    serie: "A",
    tipo: "recebida",
    data: "2023-09-18T15:45:00Z",
    valor: 1250.0,
    impostos: 162.5,
    fornecedorId: "f1",
    itens: [
      {
        id: "nfi7",
        descricao: "Materiais de Escritório Diversos",
        quantidade: 1,
        valorUnitario: 1250.0,
        valorTotal: 1250.0
      }
    ],
    status: "concluida"
  }
];

// Propostas
export const propostas: Proposta[] = [
  {
    id: "p1",
    titulo: "Projeto Residencial Alto Padrão",
    clienteId: "c1",
    data: "2023-08-25T09:30:00Z",
    dataValidade: "2023-09-25T00:00:00Z",
    status: "aprovada",
    valor: 85000.0,
    descricao: "Proposta para desenvolvimento completo de projeto arquitetônico residencial de alto padrão, incluindo projeto executivo e design de interiores.",
    itens: [
      {
        id: "pi1",
        descricao: "Projeto Arquitetônico Residencial",
        quantidade: 300,
        valorUnitario: 150.0,
        valorTotal: 45000.0,
        servicoId: "s1"
      },
      {
        id: "pi2",
        descricao: "Design de Interiores",
        quantidade: 200,
        valorUnitario: 200.0,
        valorTotal: 40000.0,
        servicoId: "s3"
      }
    ],
    observacoes: "Prazo de execução: 120 dias após aprovação da proposta."
  },
  {
    id: "p2",
    titulo: "Escritório Corporativo Tech Spaces",
    clienteId: "c5",
    data: "2023-09-10T14:00:00Z",
    dataValidade: "2023-10-10T00:00:00Z",
    status: "enviada",
    valor: 120000.0,
    descricao: "Proposta para projeto completo de escritório corporativo moderno, incluindo layout, projeto executivo, design de interiores e acompanhamento de obra.",
    itens: [
      {
        id: "pi3",
        descricao: "Projeto Arquitetônico Comercial",
        quantidade: 500,
        valorUnitario: 180.0,
        valorTotal: 90000.0,
        servicoId: "s2"
      },
      {
        id: "pi4",
        descricao: "Design de Interiores",
        quantidade: 500,
        valorUnitario: 200.0,
        valorTotal: 20000.0,
        servicoId: "s3"
      },
      {
        id: "pi5",
        descricao: "Acompanhamento de Obra",
        quantidade: 10,
        valorUnitario: 350.0,
        valorTotal: 3500.0,
        servicoId: "s4"
      },
      {
        id: "pi6",
        descricao: "Consultoria de Iluminação",
        quantidade: 500,
        valorUnitario: 90.0,
        valorTotal: 6500.0,
        servicoId: "s6"
      }
    ]
  },
  {
    id: "p3",
    titulo: "Reforma Residencial",
    clienteId: "c4",
    data: "2023-09-18T10:45:00Z",
    dataValidade: "2023-10-18T00:00:00Z",
    status: "rascunho",
    valor: 42500.0,
    descricao: "Proposta para projeto de reforma residencial completa, incluindo alteração de layout interno e atualização de acabamentos.",
    itens: [
      {
        id: "pi7",
        descricao: "Projeto Arquitetônico Residencial - Reforma",
        quantidade: 150,
        valorUnitario: 150.0,
        valorTotal: 22500.0,
        servicoId: "s1"
      },
      {
        id: "pi8",
        descricao: "Design de Interiores",
        quantidade: 100,
        valorUnitario: 200.0,
        valorTotal: 20000.0,
        servicoId: "s3"
      }
    ],
    observacoes: "Cliente solicitou atenção especial para cozinha e banheiros."
  }
];

// Estatísticas Financeiras
export const estatisticas: EstatisticasFinanceiras = {
  saldoAtual: 220893.12,
  receitasMes: 85500.0,
  despesasMes: 46550.0,
  lucroMes: 38950.0,
  receitasPendentes: 65000.0,
  despesasPendentes: 15500.0,
  receitasPorCategoria: {
    "Projetos": 110000.0,
    "Consultorias": 12000.0,
    "Design": 28500.0
  },
  despesasPorCategoria: {
    "Pessoal": 32000.0,
    "Escritório": 21750.0,
    "Software": 4800.0,
    "Marketing": 3500.0
  },
  fluxoMensal: [
    {
      mes: "Janeiro/2023",
      receitas: 62000.0,
      despesas: 42000.0,
      saldo: 20000.0
    },
    {
      mes: "Fevereiro/2023",
      receitas: 58000.0,
      despesas: 40500.0,
      saldo: 17500.0
    },
    {
      mes: "Março/2023",
      receitas: 72500.0,
      despesas: 45000.0,
      saldo: 27500.0
    },
    {
      mes: "Abril/2023",
      receitas: 65000.0,
      despesas: 43500.0,
      saldo: 21500.0
    },
    {
      mes: "Maio/2023",
      receitas: 79000.0,
      despesas: 47200.0,
      saldo: 31800.0
    },
    {
      mes: "Junho/2023",
      receitas: 83500.0,
      despesas: 46800.0,
      saldo: 36700.0
    },
    {
      mes: "Julho/2023",
      receitas: 77000.0,
      despesas: 45300.0,
      saldo: 31700.0
    },
    {
      mes: "Agosto/2023",
      receitas: 81200.0,
      despesas: 47500.0,
      saldo: 33700.0
    },
    {
      mes: "Setembro/2023",
      receitas: 85500.0,
      despesas: 46550.0,
      saldo: 38950.0
    }
  ]
};
