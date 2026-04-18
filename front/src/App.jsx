import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { isRouteForbidden } from './auth/accessRules';
import api from './api';
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

/**
 * Rota raiz: após cadastro público o React Router envia `state.successMsg`.
 * Se o usuário já estiver logado, a "/" antiga redirecionava para o dashboard e a mensagem sumia.
 */
function RootRoute({ usuarioLogado, isLoggingOut }) {
  const location = useLocation();
  const temMsgPosCadastro = Boolean(location.state?.successMsg);
  if (!usuarioLogado || isLoggingOut || temMsgPosCadastro) {
    return <Login />;
  }
  return <Navigate to="/dashboard" replace />;
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60_000,
            gcTime: 15 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: false,
            retry: 1,
        },
        mutations: {
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * MONITORAMENTO DE LOGIN
   */
  useEffect(() => {
    const checkAuth = () => {
      const salvo = localStorage.getItem('usuarioShark');
      setUsuarioLogado(salvo ? JSON.parse(salvo) : null);
      setIsLoggingOut(false);
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    const handleAuthLogin = (event) => {
      if (event?.detail) {
        setUsuarioLogado(event.detail);
        setIsLoggingOut(false);
        return;
      }
      const salvo = localStorage.getItem('usuarioShark');
      setUsuarioLogado(salvo ? JSON.parse(salvo) : null);
      setIsLoggingOut(false);
    };

    const handleAuthLogout = () => {
      setIsLoggingOut(true);
      setUsuarioLogado(null);
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  /** Alinha role com o banco após mudanças no painel empresa. */
  useEffect(() => {
    const raw = localStorage.getItem('usuarioShark');
    if (!raw || raw === 'undefined' || raw === 'null') return undefined;
    let cancelled = false;
    api
      .get('/api/auth/me')
      .then((res) => {
        if (cancelled) return;
        try {
          const prev = JSON.parse(raw);
          const merged = { ...prev, ...res.data };
          localStorage.setItem('usuarioShark', JSON.stringify(merged));
          setUsuarioLogado(merged);
        } catch (e) {
          console.error('Sessão: merge inválido', e);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * HELPER DE ROTA PROTEGIDA
   */
  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('usuarioShark');
    queryClient.clear();
    setUsuarioLogado(null);
    window.dispatchEvent(new Event('auth:logout'));
  };

  const PrivateRoute = ({ children }) => {
    const location = useLocation();
    if (!usuarioLogado) {
      return <Navigate to="/" replace />;
    }
    if (isRouteForbidden(location.pathname, usuarioLogado)) {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <Layout usuarioLogado={usuarioLogado} onLogout={handleLogout}>
        {children}
      </Layout>
    );
  };

  return (
      <QueryClientProvider client={queryClient}>
        <FeedbackProvider>
        <Router>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* ROTAS PÚBLICAS */}
            <Route
                path="/"
                element={<RootRoute usuarioLogado={usuarioLogado} isLoggingOut={isLoggingOut} />}
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

            {/* 🛡️ ADM da empresa: bloqueado para funcionário via accessRules */}
            <Route path="/admin/empresa" element={<PrivateRoute><AdminEmpresa usuarioLogado={usuarioLogado} /></PrivateRoute>} />

            {/* 👑 PAINEL GERAL SaaS: apenas ROLE_OWNER (accessRules) */}
            <Route path="/super-admin" element={<PrivateRoute><SuperAdmin /></PrivateRoute>} />

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