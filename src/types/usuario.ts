export type TipoUsuario = 'administrador' | 'gerente' | 'usuario';

export interface Usuario {
  id: string;
  nome_completo: string;
  nome_usuario: string;
  email: string;
  tipo_usuario: TipoUsuario;
  senha?: string; // Somente para formulários, não é armazenado no estado
  data_criacao?: string;
  data_atualizacao?: string;
  ativo: boolean;
}

export interface PermissoesUsuario {
  id?: string;
  usuario_id: string;
  cadastros: boolean;
  financeiro: boolean;
  fiscal: boolean;
  propostas: boolean;
  relatorios: boolean;
  gerenciamento: boolean;
  teste_conexao: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface UsuarioComPermissoes extends Usuario {
  permissoes: PermissoesUsuario;
}

export interface UsuarioFormValues {
  nome_completo: string;
  nome_usuario: string;
  email: string;
  senha: string;
  confirmar_senha: string;
  tipo_usuario: TipoUsuario;
  permissoes: {
    cadastros: boolean;
    financeiro: boolean;
    fiscal: boolean;
    propostas: boolean;
    relatorios: boolean;
    gerenciamento: boolean;
    teste_conexao: boolean;
  };
}

export interface LoginCredentials {
  identifier: string; // Email ou nome de usuário
  senha: string;
}

export interface UsuarioLogado {
  id: string;
  nome_completo: string;
  nome_usuario: string;
  email: string;
  tipo_usuario: TipoUsuario;
  permissoes: PermissoesUsuario;
} 