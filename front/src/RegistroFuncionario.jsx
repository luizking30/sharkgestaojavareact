import React, { useState, useEffect } from 'react';
import api from "./api";
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function RegistroFuncionario() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState('');
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(true);
  const [erroEmpresas, setErroEmpresas] = useState('');
  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false); // 🦈 Trava anti-flood
  const [formData, setFormData] = useState({
    nome: '', cpf: '', email: '', whatsapp: '', username: '', password: ''
  });

  useEffect(() => {
    setCarregandoEmpresas(true);
    setErroEmpresas('');
    api.get('/api/auth/empresas')
        .then(res => {
          const lista = Array.isArray(res.data) ? res.data : [];
          lista.sort((a, b) => Number(a.id) - Number(b.id));
          setEmpresas(lista);
        })
        .catch(err => {
          console.error("Erro ao carregar empresas do banco de dados", err);
          setEmpresas([]);
          setErroEmpresas('Não foi possível carregar as empresas. Atualize a página ou tente mais tarde.');
        })
        .finally(() => setCarregandoEmpresas(false));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'cpf') {
      val = val.replace(/\D/g, '');
      if (val.length <= 11) {
        val = val.replace(/(\d{3})(\d)/, '$1.$2');
        val = val.replace(/(\d{3})(\d)/, '$1.$2');
        val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
    }

    if (name === 'whatsapp') {
      val = val.replace(/\D/g, '');
      if (val.length > 2) val = "(" + val.substring(0, 2) + ") " + val.substring(2);
      if (val.length > 9) val = val.substring(0, 10) + "-" + val.substring(10);
      if (val.length > 15) val = val.substring(0, 15);
    }

    setFormData({ ...formData, [name]: val });
  };

  const validarAntesDeEnviar = () => {
    let errosTemp = {};
    if (!empresaId) errosTemp.empresa = 'Selecione uma empresa da lista!';
    if (!formData.nome || formData.nome.length < 3) errosTemp.nome = 'Nome muito curto';
    if (!formData.cpf || formData.cpf.length < 14) errosTemp.cpf = 'CPF incompleto';
    if (!formData.email || !formData.email.includes('@')) errosTemp.email = 'E-mail inválido';
    if (!formData.whatsapp || formData.whatsapp.length < 14) errosTemp.whatsapp = 'WhatsApp incompleto';
    if (!formData.username || formData.username.length < 3) errosTemp.username = 'Login muito curto';
    if (!formData.password || formData.password.length < 4) errosTemp.password = 'Senha mínima: 4 dígitos';

    setErros(errosTemp);
    return Object.keys(errosTemp).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validarAntesDeEnviar()) return;

    setLoading(true);

    try {
      await api.post(`/api/auth/registro-funcionario?empresaId=${empresaId}`, formData);

      try {
        localStorage.removeItem('usuarioShark');
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event('auth:logout'));

      // 🦈 SHARK UPDATE: Removido alert e enviando state para o card verde no Login
      navigate('/', {
        replace: true,
        state: {
          successMsg:
              'Solicitação enviada! Seu cadastro foi registrado e aguarda aprovação do administrador da empresa. Quando for aprovado, você poderá acessar com seu login e senha.'
        }
      });

    } catch (error) {
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.errors && Array.isArray(data.errors)) {
          const mapaErros = {};
          data.errors.forEach(err => { mapaErros[err.field] = err.defaultMessage; });
          setErros(mapaErros);
        } else if (typeof data === 'object') {
          setErros(data);
        }
      } else {
        // Erro geral sem alert
        setErros({ geral: "Erro ao conectar com o servidor da Shark." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-body">
        <div className="login-card">
          <div className="text-center mb-4">
            <img src="/images/logo.png" alt="Shark" style={{ width: '180px', filter: 'drop-shadow(0 0 5px rgba(0,212,255,0.4))' }} />
            <h5 className="shark-page-title mt-3" style={{ color: 'var(--shark-light-blue)', fontWeight: 800 }}>CADASTRO DE FUNCIONÁRIO</h5>
          </div>

          {/* 🦈 EXIBIÇÃO DE ERRO GERAL (Caso o servidor caia) */}
          {erros.geral && (
              <div style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid #ff4444',
                color: '#ff4444',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '0.75rem',
                fontWeight: '700',
                textAlign: 'center'
              }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {erros.geral}
              </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3 text-start empresa-search-container">
              <label htmlFor="empresaSelect" className="small text-info ms-2 mb-1 fw-bold">SELECIONE A EMPRESA *</label>
              <select
                  id="empresaSelect"
                  className={`form-select p-3 ${erros.empresa ? 'is-invalid-shark' : ''}`}
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  disabled={loading || carregandoEmpresas || !!erroEmpresas || empresas.length === 0}
              >
                <option value="">
                  {carregandoEmpresas ? 'Carregando empresas...' : empresas.length === 0 ? 'Nenhuma empresa cadastrada' : 'Escolha a empresa (ID e nome)'}
                </option>
                {empresas.map(emp => (
                    <option key={emp.id} value={String(emp.id)}>
                      #{emp.id} — {emp.nome || 'Sem nome'}
                    </option>
                ))}
              </select>
              {erroEmpresas && (
                  <div className="small text-warning mt-2 fw-bold">{erroEmpresas}</div>
              )}
              {erros.empresa && <span className="invalid-msg">{erros.empresa}</span>}
            </div>

            {/* Início dos campos do formulário */}
            <div className="form-floating mb-3">
              <input type="text" name="nome" className={`form-control ${erros.nome ? 'is-invalid-shark' : ''}`}
                     placeholder="Nome" onChange={handleInputChange} value={formData.nome} disabled={loading} />
              <label><i className="bi bi-person me-2"></i>Nome Completo *</label>
              {erros.nome && <span className="invalid-msg">{erros.nome}</span>}
            </div>

            <div className="form-floating mb-3">
              <input type="text" name="cpf" className={`form-control ${erros.cpf ? 'is-invalid-shark' : ''}`}
                     placeholder="CPF" maxLength="14" onChange={handleInputChange} value={formData.cpf} disabled={loading} />
              <label><i className="bi bi-fingerprint me-2"></i>CPF *</label>
              {erros.cpf && <span className="invalid-msg">{erros.cpf}</span>}
            </div>

            <div className="form-floating mb-3">
              <input type="email" name="email" className={`form-control ${erros.email ? 'is-invalid-shark' : ''}`}
                     placeholder="E-mail" onChange={handleInputChange} value={formData.email} disabled={loading} />
              <label><i className="bi bi-envelope-at me-2"></i>E-mail *</label>
              {erros.email && <span className="invalid-msg">{erros.email}</span>}
            </div>

            <div className="form-floating mb-3">
              <input type="text" name="whatsapp" className={`form-control ${erros.whatsapp ? 'is-invalid-shark' : ''}`}
                     placeholder="(00) 00000-0000" onChange={handleInputChange} value={formData.whatsapp} disabled={loading} />
              <label><i className="bi bi-whatsapp me-2"></i>WhatsApp *</label>
              {erros.whatsapp && <span className="invalid-msg">{erros.whatsapp}</span>}
            </div>

            <div className="form-floating mb-3">
              <input type="text" name="username" className={`form-control ${erros.username ? 'is-invalid-shark' : ''}`}
                     placeholder="Login" onChange={handleInputChange} value={formData.username} disabled={loading} />
              <label><i className="bi bi-person-lock me-2"></i>Login *</label>
              {erros.username && <span className="invalid-msg">{erros.username}</span>}
            </div>

            <div className="form-floating mb-4">
              <input type="password" name="password" className={`form-control ${erros.password ? 'is-invalid-shark' : ''}`}
                     placeholder="Senha" onChange={handleInputChange} value={formData.password} disabled={loading} />
              <label><i className="bi bi-key me-2"></i>Senha *</label>
              {erros.password && <span className="invalid-msg">{erros.password}</span>}
            </div>

            <button type="submit" className="btn-login mb-3" disabled={loading}>
              {loading ? 'PROCESSANDO...' : 'Enviar Solicitação'}
            </button>

            <div className="text-center">
              <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem' }}>
                <i className="bi bi-arrow-left me-1"></i>Voltar ao Login
              </Link>
            </div>
          </form>
        </div>
      </div>
  );
}

export default RegistroFuncionario;