import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { Usuario, UsuarioComPermissoes, UsuarioLogado } from '@/types/usuario';
import { loginUsuario, getUsuarioLogado, logoutUsuario } from '@/services/usuarioService';

interface AuthContextType {
  usuario: UsuarioLogado | null;
  carregando: boolean;
  erro: string | null;
  login: (identifier: string, senha: string) => Promise<boolean>;
  logout: () => void;
  verificarAutenticacao: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  carregando: true,
  erro: null,
  login: async () => false,
  logout: () => {},
  verificarAutenticacao: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Função para verificar se o usuário está autenticado
  const verificarAutenticacao = async (): Promise<boolean> => {
    try {
      // Verificar no session storage primeiro (mais rápido)
      const usuarioArmazenado = getUsuarioLogado();
      if (usuarioArmazenado) {
        setUsuario(usuarioArmazenado);
        return true;
      }
      
      // Se não tiver no session storage, verificar na sessão do Supabase
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      // Se não tiver sessão ativa, não está autenticado
      if (!data.session) return false;
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    } finally {
      setCarregando(false);
    }
  };

  // Efeito para verificar autenticação ao iniciar
  useEffect(() => {
    const inicializar = async () => {
      setCarregando(true);
      try {
        // Verificar autenticação inicial
        const autenticado = await verificarAutenticacao();
        
        // Redirecionar se necessário
        const paginaAtual = location.pathname;
        
        if (!autenticado && paginaAtual !== '/login' && 
            !paginaAtual.startsWith('/proposta-publica/') && 
            !paginaAtual.startsWith('/pagamento/')) {
          navigate('/login');
        } else if (autenticado && paginaAtual === '/login') {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error);
      } finally {
        setCarregando(false);
      }
    };

    inicializar();

    // Configurar listener de alterações na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          setUsuario(null);
          navigate('/login');
        }
      }
    );

    // Limpar subscription ao desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  // Função de login (usando o serviço existente)
  const login = async (identifier: string, senha: string): Promise<boolean> => {
    setCarregando(true);
    setErro(null);
    
    try {
      console.log("Tentando login para:", identifier);
      const usuarioLogado = await loginUsuario({
        identifier,
        senha
      });
      
      if (usuarioLogado) {
        console.log("Login bem-sucedido:", usuarioLogado);
        setUsuario(usuarioLogado);
        // Forçar o redirecionamento para o dashboard
        navigate('/dashboard');
        return true;
      }
      
      console.log("Login falhou: credenciais inválidas");
      setErro('Credenciais inválidas');
      return false;
    } catch (error: any) {
      console.error("Erro durante o login:", error);
      setErro(error.message || 'Erro desconhecido no login');
      toast.error('Ocorreu um erro durante o login');
      return false;
    } finally {
      setCarregando(false);
    }
  };

  // Função de logout (usando o serviço existente)
  const logout = (): void => {
    logoutUsuario();
    setUsuario(null);
  };

  const value = {
    usuario,
    carregando,
    erro,
    login,
    logout,
    verificarAutenticacao,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 