import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PermissionRouteProps {
  permissionKey: keyof typeof permissionTypes;
  children: ReactNode;
}

// Mapeamento das permissões com suas respectivas chaves no objeto de permissões do usuário
const permissionTypes = {
  all: 'all', // Permissão especial que permite acesso a qualquer rota (apenas verifica autenticação)
  cadastros: 'cadastros',
  financeiro: 'financeiro',
  fiscal: 'fiscal',
  propostas: 'propostas',
  relatorios: 'relatorios',
  gerenciamento: 'gerenciamento',
  teste_conexao: 'teste_conexao'
} as const;

export const PermissionRoute = ({ permissionKey, children }: PermissionRouteProps) => {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  // Aguarda o carregamento da autenticação
  if (carregando) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  // Verifica se o usuário está autenticado
  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Caso especial: permissionKey 'all' apenas requer autenticação, sem verificar permissões específicas
  if (permissionKey === 'all') {
    return <>{children}</>;
  }

  // Administradores têm acesso a todas as rotas
  if (usuario.tipo_usuario === 'administrador') {
    return <>{children}</>;
  }

  // Verifica se o usuário tem a permissão necessária
  const hasPermission = usuario.permissoes[permissionKey as Exclude<keyof typeof permissionTypes, 'all'>];

  if (!hasPermission) {
    // Notifica o usuário e redireciona para o dashboard
    toast.error('Você não tem permissão para acessar esta página');
    return <Navigate to="/dashboard" replace />;
  }

  // Se chegou até aqui, o usuário tem permissão
  return <>{children}</>;
}; 