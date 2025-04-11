
import { Cliente } from '.';

export interface PropostaResumoExecutivo {
  id?: string;
  proposta_id?: string;
  topico: string;
  ordem: number;
}

export interface PropostaDescricaoProjeto {
  id?: string;
  proposta_id?: string;
  area: string;
  descricao: string;
  metragem: number;
  ordem: number;
}

export interface PropostaEtapaProjeto {
  id?: string;
  proposta_id?: string;
  nome: string;
  valor: number;
  ordem: number;
}

export interface PropostaCondicaoPagamento {
  id?: string;
  proposta_id?: string;
  percentual: number;
  descricao: string;
  valor: number;
  ordem: number;
}

export interface PropostaCompleta {
  id?: string;
  codigo?: string;
  cliente_id: string;
  titulo: string;
  data_criacao?: string;
  data_validade?: string;
  status?: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'vencida';
  valor_total: number;
  endereco_interesse_cep?: string;
  endereco_interesse_logradouro?: string;
  endereco_interesse_numero?: string;
  endereco_interesse_complemento?: string;
  endereco_interesse_bairro?: string;
  endereco_interesse_cidade?: string;
  endereco_interesse_estado?: string;
  mesmo_endereco_cliente: boolean;
  resumo_executivo: PropostaResumoExecutivo[];
  descricao_projeto: PropostaDescricaoProjeto[];
  etapas_projeto: PropostaEtapaProjeto[];
  condicoes_pagamento: PropostaCondicaoPagamento[];
  cliente?: Cliente;
}

export const ETAPAS_PROJETO_OPCOES = [
  "Levantamento de Dados",
  "Estudo Preliminar",
  "Anteprojeto",
  "Projeto Legal",
  "Projeto Básico",
  "Projeto Executivo",
  "Detalhamento e Especificações",
  "Orçamento e Planejamento",
  "Acompanhamento e Execução da Obra",
  "Habite-se",
  "Regularização",
  "Cadastro",
  "Entrega e Pós-Obra"
];
