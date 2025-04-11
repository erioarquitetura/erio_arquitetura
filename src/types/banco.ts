export type TipoChavePix = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria';
export type TipoFavorecido = 'cpf' | 'cnpj';

export interface Banco {
  id: string;
  nome: string;
  codigo: string;
  agencia: string;
  conta: string;
  tipo_chave_pix: TipoChavePix;
  chave_pix: string;
  nome_favorecido: string;
  tipo_favorecido: TipoFavorecido;
  data_criacao?: string;
  data_atualizacao?: string;
  ativo?: boolean;
}

export interface BancoFormValues {
  nome: string;
  codigo: string;
  agencia: string;
  conta: string;
  tipo_chave_pix: TipoChavePix;
  chave_pix: string;
  nome_favorecido: string;
  tipo_favorecido: TipoFavorecido;
} 