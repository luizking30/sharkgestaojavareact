import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Login.css';

function Login() {
  const [isRecovery, setIsRecovery] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [identificador, setIdentificador] = useState(''); // 🦈 Estado para busca multi-identificador
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [successMsg, setSuccessMsg] = useState(location.state?.successMsg || '');

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // --- LÓGICA DE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password
      });

      localStorage.setItem('usuarioShark', JSON.stringify(response.data));
      window.location.href = '/dashboard';

    } catch (error) {
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (error.response.status === 401 || error.response.status === 403) {
          setErrorMsg(typeof data === 'object' ? data.message : data);
        } else {
          setErrorMsg("USUÁRIO OU SENHA INVÁLIDOS");
        }
      } else {
        setErrorMsg("ERRO DE CONEXÃO COM O SERVIDOR");
      }
    }
  };

  // --- LÓGICA DE RECUPERAÇÃO (BUSCA FLEXÍVEL) ---
  const handleRecuperacao = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Envia o identificador (Login, CPF, Email ou Whats) para o endpoint de esqueci-senha
      const response = await axios.post(`http://localhost:8080/api/auth/esqueci-senha?identificador=${identificador}`);
      setSuccessMsg(response.data);
      setIsRecovery(false); // Volta para tela de login com msg de sucesso
      setIdentificador('');
    } catch (error) {
      const msg = error.response?.data;
      setErrorMsg(typeof msg === 'object' ? msg.message : msg || "ERRO AO LOCALIZAR CONTA");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-body">
        <div className="login-card">
          <div className="login-header text-center">
            <img src="/images/logo.png" alt="Shark Eletrônicos" className="brand-logo" />
            <p style={{ color: 'var(--shark-light-blue)', fontWeight: 700, marginBottom: '20px' }}>
              {isRecovery ? "RECUPERAÇÃO" : "GESTÃO EMPRESARIAL"}
            </p>
          </div>

          {/* 🟢 CARD VERDE: SUCESSO NO CADASTRO OU RECUPERAÇÃO */}
          {successMsg && (
              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid #00ff88',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'center',
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.1)',
                animation: 'fadeIn 0.5s ease-in-out'
              }}>
                <div style={{ color: '#00ff88', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {successMsg}
                </div>
              </div>
          )}

          {/* 🔴 CARD VERMELHO: ERRO */}
          {errorMsg && (
              <div style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid #ff4444',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'center',
                boxShadow: '0 0 15px rgba(255, 68, 68, 0.1)',
                animation: 'shake 0.3s ease-in-out'
              }}>
                <div style={{ color: '#ff4444', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>
                  <i className="bi bi-shield-lock-fill me-2"></i>
                  {errorMsg}
                </div>
                {!isRecovery && (
                    <div onClick={() => setIsRecovery(true)} style={{ color: '#fff', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline', opacity: 0.9, fontWeight: '500' }}>
                      Clique aqui para recuperar sua senha
                    </div>
                )}
              </div>
          )}

          {!isRecovery ? (
              <div id="loginSection">
                <form onSubmit={handleLogin}>
                  <div className="form-floating mb-3">
                    <input
                        type="text"
                        className="form-control"
                        id="userInput"
                        placeholder="Usuário"
                        required
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <label htmlFor="userInput"><i className="bi bi-person me-2"></i>Login</label>
                  </div>

                  <div className="form-floating mb-4">
                    <input
                        type="password"
                        className="form-control"
                        id="passInput"
                        placeholder="Senha"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <label htmlFor="passInput"><i className="bi bi-key me-2"></i>Senha</label>
                  </div>

                  <button type="submit" className="btn-login">Acessar Painel</button>

                  <div className="mt-3 text-center">
                    <span onClick={() => setIsRecovery(true)} className="forgot-link" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                      Esqueceu sua senha?
                    </span>
                  </div>
                </form>
              </div>
          ) : (
              <div id="recoverySection">
                <h6 style={{ color: 'var(--shark-yellow)', fontWeight: 800, marginBottom: '20px', fontSize: '0.8rem' }}>RECUPERAR ACESSO</h6>
                <form onSubmit={handleRecuperacao}>
                  <div className="form-floating mb-4">
                    <input
                        type="text"
                        className="form-control"
                        id="idenInput"
                        placeholder="Login, E-mail, CPF ou Whats"
                        required
                        value={identificador}
                        onChange={(e) => setIdentificador(e.target.value)}
                    />
                    <label htmlFor="idenInput"><i className="bi bi-search me-2"></i>Login, E-mail, CPF ou Whats</label>
                  </div>
                  <button type="submit" className="btn-login mb-3" disabled={loading}>
                    {loading ? "Processando..." : "Enviar Link"}
                  </button>
                </form>
                <div className="text-center">
                  <span onClick={() => { setIsRecovery(false); setErrorMsg(''); }} className="forgot-link" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
                    <i className="bi bi-arrow-left me-1"></i>Voltar ao Login
                  </span>
                </div>
              </div>
          )}

          {!isRecovery && (
              <div id="actionButtons" className="mt-4 d-flex flex-column gap-2">
                <Link to="/registro-funcionario" className="btn-toggle-reg text-decoration-none text-center" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-person-plus-fill me-2"></i>Novo Funcionário
                </Link>
                <Link to="/registro-empresa" className="btn-toggle-reg text-decoration-none text-center" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-building-add me-2"></i>Nova Empresa
                </Link>
              </div>
          )}
        </div>
      </div>
  );
}

export default Login;