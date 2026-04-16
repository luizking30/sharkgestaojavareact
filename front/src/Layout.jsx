import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './shark-layout.css';

const Layout = ({ children, usuarioLogado }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('usuarioShark');
    navigate('/');
  };

  const diasRestantes = usuarioLogado?.empresa?.diasRestantes || 0;
  const isBloqueado = diasRestantes <= 0;
  const isPaginaPagamento = location.pathname.includes('/pagamento');

  return (
      <div className="layout-wrapper">
        {isBloqueado && !isPaginaPagamento && (
            <div className="lock-screen">
              <img src="/images/logo_layout.png" alt="Shark" style={{ width: '180px', marginBottom: '20px', filter: 'grayscale(1) opacity(0.5)' }} />
              <h2 className="text-danger fw-bold">CONTA SUSPENSA</h2>
              <p className="text-white-50 mb-4">O período de teste ou assinatura da unidade <b>{usuarioLogado?.empresa?.nome}</b> expirou.</p>
              <Link to="/pagamento" className="btn btn-warning btn-lg px-5 fw-bold text-dark shadow">
                <i className="bi bi-credit-card-2-front me-2"></i>REATIVAR AGORA
              </Link>
              <button onClick={handleLogout} className="btn btn-link text-muted mt-4 text-decoration-none">Sair da conta</button>
            </div>
        )}

        <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow-lg">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/dashboard">
              <img src="/images/logo_layout.png" alt="Shark" style={{ height: '100px' }} />
            </Link>

            <button className="navbar-toggler" type="button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
              <ul className="navbar-nav me-auto">
                {!isBloqueado && (
                    <>
                      <li className="nav-item"><Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard"><i className="bi bi-grid-1x2"></i> Dashboard</Link></li>
                      <li className="nav-item"><Link className={`nav-link ${location.pathname === '/clientes' ? 'active' : ''}`} to="/clientes"><i className="bi bi-people"></i> Clientes</Link></li>
                      <li className="nav-item"><Link className={`nav-link ${location.pathname === '/estoque' ? 'active' : ''}`} to="/estoque"><i className="bi bi-cpu"></i> Estoque</Link></li>
                      <li className="nav-item"><Link className={`nav-link ${location.pathname === '/servicos' ? 'active' : ''}`} to="/servicos"><i className="bi bi-tools"></i> O.S.</Link></li>
                      <li className="nav-item"><Link className={`nav-link ${location.pathname === '/vendas' ? 'active' : ''}`} to="/vendas"><i className="bi bi-cart-check"></i> Vendas</Link></li>
                      <li className="nav-item"><Link className={`nav-link ${location.pathname === '/contas' ? 'active' : ''}`} to="/contas"><i className="bi bi-cash-stack"></i> Contas</Link></li>
                      <li className="nav-item"><Link className={`nav-link ${location.pathname === '/meu-painel' ? 'active' : ''}`} to="/meu-painel"><i className="bi bi-person-badge"></i> Meu painel</Link></li>

                      {(usuarioLogado?.role === 'ROLE_ADMIN' || usuarioLogado?.role === 'ROLE_OWNER') && (
                          <li className="nav-item">
                            <Link className={`nav-link text-info ${location.pathname === '/admin/empresa' ? 'active' : ''}`} to="/admin/empresa">
                              <i className="bi bi-shield-lock-fill"></i> Painel empresa
                            </Link>
                          </li>
                      )}

                      {usuarioLogado?.role === 'ROLE_OWNER' && (
                          <li className="nav-item">
                            <Link className={`nav-link nav-link--accent-owner ${location.pathname === '/super-admin' ? 'active' : ''}`} to="/super-admin">
                              <i className="bi bi-crown-fill"></i> ADM GERAL
                            </Link>
                          </li>
                      )}
                    </>
                )}
              </ul>

              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center bg-black bg-opacity-50 border border-secondary rounded-3 px-3 py-1">
                  <div className="text-end me-3">
                    <small className="d-block text-muted fw-bold" style={{ fontSize: '0.5rem' }}>STATUS</small>
                    <span className={`fw-bold small ${diasRestantes > 5 ? 'text-success' : 'text-warning'}`}>
                    {diasRestantes} DIAS
                  </span>
                  </div>
                  <Link to="/pagamento" className="btn btn-sm btn-warning fw-bold py-0" style={{fontSize: '0.65rem'}}>RENOVAR</Link>
                </div>

                {/* PERFIL DETALHADO ALINHADO À ESQUERDA */}
                <div className="profile-info-container d-none d-lg-flex">
                  <div className="info-row">
                    <span className="info-label">Empresa:</span>
                    <span className="info-value value-empresa">{usuarioLogado?.empresa?.nome || 'Shark'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Cargo:</span>
                    <span className="info-value value-cargo">{usuarioLogado?.tipoFuncionario || 'Acesso'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Nome:</span>
                    <span className="info-value value-nome">{usuarioLogado?.nome || usuarioLogado?.username}</span>
                  </div>
                </div>

                <button onClick={handleLogout} className="btn-logout border-0 bg-transparent text-danger fs-4 transition-all">
                  <i className="bi bi-power"></i>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="container shadow-lg">
          {children}
        </main>

        <footer className="text-center py-4 text-white-50 small">
          &copy; 2026 Shark Eletrônicos - Gestão Inteligente
        </footer>
      </div>
  );
};

export default Layout;