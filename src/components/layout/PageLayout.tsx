
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const PageLayout = ({ children, title }: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header pageTitle={title} />
        
        <main className="flex-1 p-6">
          {children}
        </main>
        
        <footer className="py-4 px-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 text-center">
          &copy; {new Date().getFullYear()} ERIO STUDIO DE ARQUITETURA. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
};
