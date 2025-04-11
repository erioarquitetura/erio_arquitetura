import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Usuario, 
  UsuarioFormValues, 
  PermissoesUsuario, 
  UsuarioComPermissoes,
  LoginCredentials,
  UsuarioLogado
} from '@/types/usuario';
import bcrypt from 'bcryptjs';

/**
 * Lista todos os usuários ativos com suas permissões
 */
export const listarUsuarios = async (): Promise<UsuarioComPermissoes[]> => {
  try {
    // Buscar usuários
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('ativo', true)
      .order('nome_completo');

    if (userError) throw userError;

    if (!usuarios || usuarios.length === 0) {
      return [];
    }

    // Buscar permissões para os usuários
    const { data: permissoes, error: permError } = await supabase
      .from('permissoes_usuario')
      .select('*')
      .in('usuario_id', usuarios.map(u => u.id));

    if (permError) throw permError;

    // Combinar usuários com suas permissões
    return usuarios.map(usuario => {
      const permissoesUsuario = permissoes?.find(p => p.usuario_id === usuario.id) || {
        usuario_id: usuario.id,
        cadastros: false,
        financeiro: false,
        fiscal: false,
        propostas: false,
        relatorios: false,
        gerenciamento: false,
        teste_conexao: false
      };

      return {
        ...usuario,
        permissoes: permissoesUsuario as PermissoesUsuario
      };
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    toast.error('Falha ao carregar usuários');
    return [];
  }
};

/**
 * Busca um usuário específico com suas permissões
 */
export const buscarUsuario = async (id: string): Promise<UsuarioComPermissoes | null> => {
  try {
    // Buscar usuário
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (userError) throw userError;
    if (!usuario) return null;

    // Buscar permissões
    const { data: permissoes, error: permError } = await supabase
      .from('permissoes_usuario')
      .select('*')
      .eq('usuario_id', id)
      .single();

    if (permError && permError.code !== 'PGRST116') throw permError; // Ignorar erro se não encontrar

    return {
      ...usuario,
      permissoes: permissoes || {
        usuario_id: id,
        cadastros: false,
        financeiro: false,
        fiscal: false,
        propostas: false,
        relatorios: false,
        gerenciamento: false,
        teste_conexao: false
      }
    } as UsuarioComPermissoes;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
};

/**
 * Cria um novo usuário com suas permissões
 */
export const criarUsuario = async (valores: UsuarioFormValues): Promise<Usuario | null> => {
  try {
    // Hash da senha
    const senhaHash = await bcrypt.hash(valores.senha, 10);

    // Criar usuário
    const { data: novoUsuario, error: userError } = await supabase.rpc('criar_usuario_com_permissoes', {
      p_nome_completo: valores.nome_completo,
      p_nome_usuario: valores.nome_usuario,
      p_email: valores.email,
      p_senha: senhaHash,
      p_tipo_usuario: valores.tipo_usuario,
      p_cadastros: valores.permissoes.cadastros,
      p_financeiro: valores.permissoes.financeiro,
      p_fiscal: valores.permissoes.fiscal,
      p_propostas: valores.permissoes.propostas,
      p_relatorios: valores.permissoes.relatorios,
      p_gerenciamento: valores.permissoes.gerenciamento,
      p_teste_conexao: valores.permissoes.teste_conexao
    });

    if (userError) throw userError;

    toast.success('Usuário criado com sucesso!');
    return await buscarUsuario(novoUsuario as string) as unknown as Usuario;
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    
    if (error.message.includes('violates unique constraint')) {
      if (error.message.includes('usuarios_email_key')) {
        toast.error('Este e-mail já está em uso.');
      } else if (error.message.includes('usuarios_nome_usuario_key')) {
        toast.error('Este nome de usuário já está em uso.');
      } else {
        toast.error('Falha ao criar usuário: erro de unicidade.');
      }
    } else {
      toast.error(`Falha ao criar usuário: ${error.message || error}`);
    }
    
    return null;
  }
};

/**
 * Atualiza um usuário existente e suas permissões
 */
export const atualizarUsuario = async (id: string, valores: Partial<UsuarioFormValues>): Promise<Usuario | null> => {
  try {
    const atualizacoes: any = {
      nome_completo: valores.nome_completo,
      nome_usuario: valores.nome_usuario,
      email: valores.email,
      tipo_usuario: valores.tipo_usuario
    };

    // Atualizar senha apenas se fornecida
    if (valores.senha && valores.senha.trim() !== '') {
      atualizacoes.senha = await bcrypt.hash(valores.senha, 10);
    }

    // Atualizar usuário
    const { error: userError } = await supabase
      .from('usuarios')
      .update(atualizacoes)
      .eq('id', id);

    if (userError) throw userError;

    // Atualizar permissões se fornecidas
    if (valores.permissoes) {
      const { error: permError } = await supabase
        .from('permissoes_usuario')
        .update({
          cadastros: valores.permissoes.cadastros,
          financeiro: valores.permissoes.financeiro,
          fiscal: valores.permissoes.fiscal,
          propostas: valores.permissoes.propostas,
          relatorios: valores.permissoes.relatorios,
          gerenciamento: valores.permissoes.gerenciamento,
          teste_conexao: valores.permissoes.teste_conexao
        })
        .eq('usuario_id', id);

      if (permError) throw permError;
    }

    toast.success('Usuário atualizado com sucesso!');
    return await buscarUsuario(id) as unknown as Usuario;
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error.message.includes('violates unique constraint')) {
      if (error.message.includes('usuarios_email_key')) {
        toast.error('Este e-mail já está em uso.');
      } else if (error.message.includes('usuarios_nome_usuario_key')) {
        toast.error('Este nome de usuário já está em uso.');
      } else {
        toast.error('Falha ao atualizar usuário: erro de unicidade.');
      }
    } else {
      toast.error(`Falha ao atualizar usuário: ${error.message || error}`);
    }
    
    return null;
  }
};

/**
 * Exclui (desativa) um usuário
 */
export const excluirUsuario = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;

    toast.success('Usuário excluído com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    toast.error('Falha ao excluir usuário');
    return false;
  }
};

/**
 * Autentica um usuário com email/nome de usuário e senha
 */
export const loginUsuario = async (credentials: LoginCredentials): Promise<UsuarioLogado | null> => {
  try {
    // Verificar se identifier é um email ou nome de usuário
    const isEmail = credentials.identifier.includes('@');
    
    console.log(`Buscando usuário por ${isEmail ? 'email' : 'nome de usuário'}: ${credentials.identifier}`);
    
    // Buscar usuário pelo email ou nome de usuário
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq(isEmail ? 'email' : 'nome_usuario', credentials.identifier)
      .eq('ativo', true)
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      toast.error('Usuário não encontrado ou inativo');
      return null;
    }

    if (!usuario) {
      console.log('Usuário não encontrado');
      toast.error('Usuário não encontrado ou inativo');
      return null;
    }

    console.log('Usuário encontrado, verificando senha');
    
    // Verificar senha
    const senhaCorreta = await bcrypt.compare(credentials.senha, usuario.senha);
    
    if (!senhaCorreta) {
      console.log('Senha incorreta');
      toast.error('Senha incorreta');
      return null;
    }

    console.log('Senha correta, buscando permissões');
    
    // Buscar permissões
    const { data: permissoes, error: permError } = await supabase
      .from('permissoes_usuario')
      .select('*')
      .eq('usuario_id', usuario.id)
      .single();

    if (permError) {
      console.error('Erro ao buscar permissões:', permError);
      toast.error('Erro ao buscar permissões do usuário');
      return null;
    }

    // Criar objeto de usuário logado (sem a senha)
    const usuarioLogado: UsuarioLogado = {
      id: usuario.id,
      nome_completo: usuario.nome_completo,
      nome_usuario: usuario.nome_usuario,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
      permissoes: permissoes
    };

    console.log('Login completo com sucesso');
    
    // Salvar usuário na sessão
    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    
    return usuarioLogado;
  } catch (error) {
    console.error('Erro no login:', error);
    toast.error('Falha ao realizar login');
    return null;
  }
};

/**
 * Recupera o usuário logado do sessionStorage
 */
export const getUsuarioLogado = (): UsuarioLogado | null => {
  const userData = sessionStorage.getItem('usuarioLogado');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData) as UsuarioLogado;
  } catch (error) {
    console.error('Erro ao recuperar usuário logado:', error);
    return null;
  }
};

/**
 * Realiza logout do usuário
 */
export const logoutUsuario = (): void => {
  sessionStorage.removeItem('usuarioLogado');
  window.location.href = '/login';
}; 