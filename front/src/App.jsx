import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// IMPORTAÇÃO DO REACT QUERY
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedbackProvider } from './context/FeedbackContext';

// Shell e login ficam no bundle inicial (entrada rápida)
import Login from './Login';
import Layout from './Layout';

const MovimentacaoDia = lazy(() => import('./MovimentacaoDia'));
const Clientes = lazy(() => import('./Clientes'));
const Estoque = lazy(() => import('./Estoque'));
const OrdensServico = lazy(() => import('./OrdensServico'));
const Vendas = lazy(() => import('./Vendas'));
const Contas = lazy(() => import('./Contas'));
const Relatorios = lazy(() => import('./Relatorios'));
const RelatorioMensal = lazy(() => import('./RelatorioMensal'));
const MeuPainel = lazy(() => import('./MeuPainel'));
const AdminEmpresa = lazy(() => import('./AdminEmpresa'));
const Pagamento = lazy(() => import('./Pagamento'));
const PagamentoPix = lazy(() => import('./PagamentoPix'));
const NovaSenha = lazy(() => import('./NovaSenha'));
const RegistroEmpresa = lazy(() => import('./RegistroEmpresa'));
const RegistroFuncionario = lazy(() => import('./RegistroFuncionario'));
const SuperAdmin = lazy(() => import('./SuperAdmin'));

function RouteFallback() {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center text-info">
        <div className="spinner-border mb-2" role="status" aria-hidden="true" />
        <p className="small mb-0">Carregando módulo…</p>
      </div>
    </div>
  );
}

// 1. CRIAR O CLIENTE FORA DO COMPONENTE
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
  /**
   * ESTADO DE AUTENTICAÇÃO
   */
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const salvo = localStorage.getItem('usuarioShark');
      if (salvo && salvo !== "undefined" && salvo !== "null") {
        return JSON.parse(salvo);
      }
    } catch (e) {
      console.error("Erro no LocalStorage", e);
    }
    return null;
  });

  /**
   * MONITORAMENTO DE LOGIN
   */
  useEffect(() => {
    const checkAuth = () => {
      const salvo = localStorage.getItem('usuarioShark');
      setUsuarioLogado(salvo ? JSON.parse(salvo) : null);
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  /**
   * HELPER DE ROTA PROTEGIDA
   */
  const PrivateRoute = ({ children }) => {
    return usuarioLogado ? (
        <Layout usuarioLogado={usuarioLogado}>{children}</Layout>
    ) : (
        <Navigate to="/" replace />
    );
  };

  return (
      // 2. ENVOLVER COM O PROVIDER
      <QueryClientProvider client={queryClient}>
        <FeedbackProvider>
        <Router>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* ROTAS PÚBLICAS */}
            <Route
                path="/"
                element={!usuarioLogado ? <Login /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="/resetar-senha" element={<NovaSenha />} />
            <Route path="/registro-empresa" element={<RegistroEmpresa />} />
            <Route path="/registro-funcionario" element={<RegistroFuncionario />} />

            {/* ROTAS PROTEGIDAS PELO LAYOUT SHARK */}
            <Route path="/dashboard" element={<PrivateRoute><MovimentacaoDia /></PrivateRoute>} />
            <Route path="/clientes" element={<PrivateRoute><Clientes usuarioLogado={usuarioLogado} /></PrivateRoute>} />
            <Route path="/estoque" element={<PrivateRoute><Estoque usuarioLogado={usuarioLogado} /></PrivateRoute>} />
            <Route path="/servicos" element={<PrivateRoute><OrdensServico usuarioLogado={usuarioLogado} /></PrivateRoute>} />
            <Route path="/vendas" element={<PrivateRoute><Vendas usuarioLogado={usuarioLogado} /></PrivateRoute>} />
            <Route path="/contas" element={<PrivateRoute><Contas usuarioLogado={usuarioLogado} /></PrivateRoute>} />
            <Route path="/relatorios" element={<PrivateRoute><Relatorios usuarioLogado={usuarioLogado} /></PrivateRoute>} />
            <Route path="/relatorios/mensal" element={<PrivateRoute><RelatorioMensal /></PrivateRoute>} />
            <Route path="/meu-painel" element={<PrivateRoute><MeuPainel usuarioLogado={usuarioLogado} /></PrivateRoute>} />
            <Route path="/ganhos" element={<Navigate to="/meu-painel" replace />} />

            {/* 🛡️ ROTA ADM DA EMPRESA (Donos de Loja) */}
            <Route path="/admin/empresa" element={
              usuarioLogado?.role === 'ROLE_ADMIN' || usuarioLogado?.role === 'ROLE_OWNER' ? (
                  <PrivateRoute><AdminEmpresa usuarioLogado={usuarioLogado} /></PrivateRoute>
              ) : (
                  <Navigate to="/dashboard" replace />
              )
            } />

            {/* 👑 ROTA ADM GERAL (Apenas para você, Luiz - SaaS Owner) */}
            <Route path="/super-admin" element={
              usuarioLogado?.role === 'ROLE_OWNER' ? (
                  <PrivateRoute><SuperAdmin /></PrivateRoute>
              ) : (
                  <Navigate to="/dashboard" replace />
              )
            } />

            {/* ROTAS DE PAGAMENTO */}
            <Route path="/pagamento" element={<PrivateRoute><Pagamento /></PrivateRoute>} />
            <Route path="/pagamento-pix" element={<PrivateRoute><PagamentoPix /></PrivateRoute>} />

            {/* ROTA "CORINGA" */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Router>
        </FeedbackProvider>
      </QueryClientProvider>
  );
}

export default App;