import { useState } from 'react';
import { 
  BellIcon, 
  SearchIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificacaoBadge } from '@/components/NotificacaoBadge';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  pageTitle: string;
}

export const Header = ({ pageTitle }: HeaderProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { usuario, logout } = useAuth();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Aplicar o tema ao documento
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Obter as iniciais do nome do usuário
  const getIniciais = () => {
    if (!usuario) return 'U';
    
    const nomes = usuario.nome_completo.split(' ');
    if (nomes.length > 1) {
      return `${nomes[0][0]}${nomes[nomes.length - 1][0]}`.toUpperCase();
    }
    return nomes[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 sticky top-0 z-10">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden mr-2">
            <MenuIcon className="h-5 w-5" />
          </Button>
          <h1 className="font-heading font-medium text-xl text-gray-800 dark:text-gray-100">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative hidden md:block">
            <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="pl-9 pr-4 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-erio-500"
            />
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <SunIcon className="h-5 w-5" />
            )}
          </Button>

          <NotificacaoBadge />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center ml-2 cursor-pointer">
                <Avatar className="h-8 w-8 bg-erio-200 text-erio-700">
                  <AvatarFallback>{getIniciais()}</AvatarFallback>
                </Avatar>
                <div className="ml-2 text-sm font-medium hidden md:flex flex-col">
                  <span className="text-gray-800 dark:text-gray-200">{usuario?.nome_completo}</span>
                  <span className="text-xs text-gray-500">{usuario?.tipo_usuario}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled className="font-medium">
                {usuario?.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
