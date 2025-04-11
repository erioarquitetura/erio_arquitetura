import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  DollarSign,
  FileCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Database,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissoesUsuario } from '@/types/usuario';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  hasSubItems?: boolean;
  subItems?: { to: string; label: string }[];
}

const NavItem = ({ 
  to, 
  icon, 
  label, 
  isActive, 
  isCollapsed,
  hasSubItems = false,
  subItems = []
}: NavItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSubItems = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="w-full">
      <Link
        to={to}
        onClick={hasSubItems ? toggleSubItems : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors w-full",
          isActive && !hasSubItems
            ? "bg-erio-500 text-white shadow-sm"
            : "hover:bg-erio-50 hover:text-erio-600 dark:hover:bg-erio-900 dark:hover:text-erio-300"
        )}
      >
        <div className="flex h-5 w-5 items-center justify-center">
          {icon}
        </div>
        {!isCollapsed && (
          <span className="flex-1 truncate">{label}</span>
        )}
        {hasSubItems && !isCollapsed && (
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              isOpen && "rotate-90"
            )}
          />
        )}
      </Link>

      {hasSubItems && isOpen && !isCollapsed && (
        <div className="ml-6 mt-1 flex flex-col gap-1">
          {subItems.map((subItem) => (
            <Link
              key={subItem.to}
              to={subItem.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                location.pathname === subItem.to
                  ? "bg-erio-100 text-erio-600 font-medium"
                  : "hover:bg-erio-50 hover:text-erio-600"
              )}
            >
              <span className="flex-1 truncate">{subItem.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { usuario, logout } = useAuth();
  
  // Obter as permissões do usuário ou definir todas como false se não houver usuário
  const permissoes: PermissoesUsuario = usuario?.permissoes || {
    usuario_id: '',
    cadastros: false,
    financeiro: false,
    fiscal: false,
    propostas: false,
    relatorios: false,
    gerenciamento: false,
    teste_conexao: false
  };
  
  // Verificar se o usuário é administrador (tem acesso a tudo)
  const isAdmin = usuario?.tipo_usuario === 'administrador';

  // Definição de todos os itens de navegação
  const allNavItems = [
    {
      to: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      hasSubItems: false,
      permissao: true // Dashboard sempre disponível para usuários logados
    },
    {
      to: "/cadastros",
      icon: <Users className="h-5 w-5" />,
      label: "Cadastros",
      hasSubItems: true,
      permissao: permissoes.cadastros,
      subItems: [
        { to: "/cadastros/clientes", label: "Clientes" },
        { to: "/cadastros/fornecedores", label: "Fornecedores" },
        { to: "/cadastros/servicos", label: "Serviços" }
      ]
    },
    {
      to: "/financeiro",
      icon: <DollarSign className="h-5 w-5" />,
      label: "Financeiro",
      hasSubItems: true,
      permissao: permissoes.financeiro,
      subItems: [
        { to: "/financeiro/receitas", label: "Receitas" },
        { to: "/financeiro/despesas", label: "Despesas" },
        { to: "/financeiro/bancos", label: "Bancos" },
      ]
    },
    {
      to: "/fiscal",
      icon: <Receipt className="h-5 w-5" />,
      label: "Fiscal",
      hasSubItems: true,
      permissao: permissoes.fiscal,
      subItems: [
        { to: "/fiscal/notas-emitidas", label: "Notas Emitidas" },
        { to: "/fiscal/notas-recebidas", label: "Notas Recebidas" },
        { to: "/fiscal/confrontos", label: "Confrontos Fiscais" }
      ]
    },
    {
      to: "/propostas",
      icon: <FileText className="h-5 w-5" />,
      label: "Propostas",
      hasSubItems: false,
      permissao: permissoes.propostas
    },
    {
      to: "/relatorios",
      icon: <FileCheck className="h-5 w-5" />,
      label: "Relatórios",
      hasSubItems: false,
      permissao: permissoes.relatorios
    },
    {
      to: "/gerenciamento",
      icon: <Settings className="h-5 w-5" />,
      label: "Gerenciamento",
      hasSubItems: true,
      permissao: permissoes.gerenciamento,
      subItems: [
        { to: "/financeiro/bancos", label: "Bancos" },
        { to: "/gerenciamento/categorias", label: "Categorias de Receitas" },
        { to: "/gerenciamento/categorias-despesas", label: "Categorias de Despesas" },
        { to: "/gerenciamento/usuarios", label: "Usuários" }
      ]
    },
    {
      to: "/supabase-test",
      icon: <Database className="h-5 w-5" />,
      label: "Teste de Conexão",
      hasSubItems: false,
      permissao: permissoes.teste_conexao
    }
  ];

  // Filtrar os itens de navegação com base nas permissões do usuário
  const navItems = allNavItems.filter(item => isAdmin || item.permissao);

  return (
    <div
      className={cn(
        "flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen transition-all duration-300 sticky top-0 left-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center h-16 p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full">
            <h2 className="font-heading font-bold text-xl text-erio-700 whitespace-nowrap">
              ERIO STUDIO
            </h2>
            <button 
              onClick={() => setCollapsed(true)}
              className="text-gray-500 hover:text-erio-500 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setCollapsed(false)} 
            className="mx-auto text-gray-500 hover:text-erio-500 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={
              item.hasSubItems 
                ? item.subItems?.some(subItem => subItem.to === location.pathname)
                : location.pathname === item.to
            }
            isCollapsed={collapsed}
            hasSubItems={item.hasSubItems}
            subItems={item.subItems}
          />
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full p-2 rounded-md hover:bg-red-50 text-red-600",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
};
