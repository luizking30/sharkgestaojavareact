import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// IMPORTAÇÃO DO REACT QUERY
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Importação da Base
import Login from './Login';
import Layout from './Layout';
import MovimentacaoDia from './MovimentacaoDia';

// Importação de todos os módulos convertidos
import Clientes from './Clientes';
import Estoque from './Estoque';
import OrdensServico from './OrdensServico';
import Vendas from './Vendas';
import Contas from './Contas';
import Relatorios from './Relatorios';
import RelatorioMensal from './RelatorioMensal';
import MeuPainel from './MeuPainel';
import AdminEmpresa from './AdminEmpresa';
import Pagamento from './Pagamento';
import PagamentoPix from './PagamentoPix';
import NovaSenha from './NovaSenha';

// Importação dos registros
import RegistroEmpresa from './RegistroEmpresa';
import RegistroFuncionario from './RegistroFuncionario';

// 🚀 NOVO MÓDULO: ADM GERAL (SaaS Owner)
import SuperAdmin from './SuperAdmin';

// 1. CRIAR O CLIENTE FORA DO COMPONENTE
const queryClient = new QueryClient();

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
        <Router>
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
        </Router>
      </QueryClientProvider>
  );
}

export default App;