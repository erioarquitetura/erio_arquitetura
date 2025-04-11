import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CadastroClientes from "./pages/CadastroClientes";
import Propostas from "./pages/Propostas";
import FinanceiroReceitas from "./pages/FinanceiroReceitas";
import FiscalNotasEmitidas from "./pages/FiscalNotasEmitidas";
import FiscalNotasRecebidas from "./pages/FiscalNotasRecebidas";
import FiscalConfrontos from "./pages/FiscalConfrontos";
import SupabaseTest from "./pages/SupabaseTest";
import ReceitasPage from './pages/financeiro/receitas';
import BancosPage from './pages/financeiro/bancos';
import NotasFiscaisPage from './pages/financeiro/fiscal/notas-emitidas';
import NotasFiscaisRecebidasPage from './pages/financeiro/fiscal/notas-recebidas';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from './pages/login';
import { PermissionRoute } from './components/PermissionRoute';

const queryClient = new QueryClient();

// Lazy loading das páginas
const PropostaNova = React.lazy(() => import('./pages/PropostaNova'));
const PropostaPublica = React.lazy(() => import('./pages/PropostaPublica'));
const CategoriasReceitas = React.lazy(() => import('./pages/gerenciamento/categorias'));
const CategoriasDespesas = React.lazy(() => import('./pages/gerenciamento/categorias-despesas'));
const Receitas = React.lazy(() => import('./pages/financeiro/receitas'));
const PagamentoPublico = React.lazy(() => import('./pages/PagamentoPublico'));
const DespesasPage = lazy(() => import('./pages/financeiro/despesas'));
const UsuariosPage = lazy(() => import('./pages/gerenciamento/usuarios'));

// Componente para facilitar a criação de rotas com Suspense
const SuspenseRoute = ({ element, fallback = <div className="flex justify-center items-center h-screen">Carregando...</div> }) => (
  <Suspense fallback={fallback}>
    {element}
  </Suspense>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rota de Login - acessível sem autenticação */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rotas públicas para compartilhamento */}
      <Route 
        path="/proposta-publica/:token" 
        element={<SuspenseRoute element={<PropostaPublica />} />} 
      />
      <Route 
        path="/pagamento/:token" 
        element={<SuspenseRoute element={<PagamentoPublico />} />} 
      />
      
      {/* Redirecionar a raiz para o dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route 
        path="/dashboard" 
        element={
          <PermissionRoute permissionKey="all">
            <Dashboard />
          </PermissionRoute>
        }
      />
      
      {/* Cadastros */}
      <Route 
        path="/cadastros/clientes" 
        element={
          <PermissionRoute permissionKey="cadastros">
            <CadastroClientes />
          </PermissionRoute>
        } 
      />
      
      {/* Financeiro */}
      <Route 
        path="/financeiro/receitas" 
        element={
          <PermissionRoute permissionKey="financeiro">
            <SuspenseRoute element={<ReceitasPage />} />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/financeiro/despesas" 
        element={
          <PermissionRoute permissionKey="financeiro">
            <SuspenseRoute element={<DespesasPage />} />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/financeiro/bancos" 
        element={
          <PermissionRoute permissionKey="financeiro">
            <SuspenseRoute element={<BancosPage />} />
          </PermissionRoute>
        } 
      />
      
      {/* Fiscal */}
      <Route 
        path="/financeiro/fiscal/notas-emitidas" 
        element={
          <PermissionRoute permissionKey="fiscal">
            <NotasFiscaisPage />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/financeiro/fiscal/notas-recebidas" 
        element={
          <PermissionRoute permissionKey="fiscal">
            <FiscalNotasRecebidas />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/financeiro/fiscal/confrontos" 
        element={
          <PermissionRoute permissionKey="fiscal">
            <FiscalConfrontos />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/fiscal/notas-emitidas" 
        element={
          <PermissionRoute permissionKey="fiscal">
            <FiscalNotasEmitidas />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/fiscal/notas-recebidas" 
        element={
          <PermissionRoute permissionKey="fiscal">
            <FiscalNotasRecebidas />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/fiscal/confrontos" 
        element={
          <PermissionRoute permissionKey="fiscal">
            <FiscalConfrontos />
          </PermissionRoute>
        } 
      />
      
      {/* Propostas */}
      <Route 
        path="/propostas" 
        element={
          <PermissionRoute permissionKey="propostas">
            <Propostas />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/propostas/nova" 
        element={
          <PermissionRoute permissionKey="propostas">
            <SuspenseRoute element={<PropostaNova />} />
          </PermissionRoute>
        } 
      />
      
      {/* Gerenciamento */}
      <Route 
        path="/gerenciamento/categorias" 
        element={
          <PermissionRoute permissionKey="gerenciamento">
            <SuspenseRoute element={<CategoriasReceitas />} />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/gerenciamento/categorias-despesas" 
        element={
          <PermissionRoute permissionKey="gerenciamento">
            <SuspenseRoute element={<CategoriasDespesas />} />
          </PermissionRoute>
        } 
      />
      <Route 
        path="/gerenciamento/usuarios" 
        element={
          <PermissionRoute permissionKey="gerenciamento">
            <SuspenseRoute element={<UsuariosPage />} />
          </PermissionRoute>
        } 
      />
      
      {/* Ferramentas de diagnóstico */}
      <Route 
        path="/supabase-test" 
        element={
          <PermissionRoute permissionKey="teste_conexao">
            <SupabaseTest />
          </PermissionRoute>
        } 
      />
      
      {/* Rota de erro 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
