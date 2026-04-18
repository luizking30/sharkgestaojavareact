import React, { useState } from 'react';
import api from "./api";
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function RegistroEmpresa() {
    const navigate = useNavigate();
    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false); // 🦈 Estado para evitar flood
    const [formData, setFormData] = useState({
        nomeEmpresa: '',
        cnpj: '',
        whatsappEmpresa: '',
        nome: '',
        cpf: '',
        email: '',
        whatsapp: '',
        username: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let v = value;

        // Limpa o erro do campo quando o usuário volta a digitar
        if (erros[name]) {
            const novosErros = { ...erros };
            delete novosErros[name];
            setErros(novosErros);
        }

        // Máscara de CNPJ
        if (name === 'cnpj') {
            v = v.replace(/\D/g, '');
            if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '$1.$2');
            if (v.length > 5) v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            if (v.length > 8) v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
            if (v.length > 12) v = v.replace(/(\d{4})(\d)/, '$1-$2');
            if (v.length > 14) v = v.substring(0, 18);
        }

        // Máscara de CPF
        if (name === 'cpf') {
            v = v.replace(/\D/g, '');
            if (v.length <= 11) {
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
        }

        // Máscara de WhatsApp
        if (name === 'whatsapp' || name === 'whatsappEmpresa') {
            const raw = v.replace(/\D/g, '').substring(0, 11);
            if (raw.length > 10) {
                v = `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7)}`;
            } else if (raw.length > 6) {
                v = `(${raw.substring(0, 2)}) ${raw.substring(2, 6)}-${raw.substring(6)}`;
            } else if (raw.length > 2) {
                v = `(${raw.substring(0, 2)}) ${raw.substring(2)}`;
            } else {
                v = raw;
            }
        }

        setFormData({ ...formData, [name]: v });
    };

    // 🛡️ CHECAGEM ANTES DE MANDAR PRO BACK (EVITA FLOOD)
    const validarLocalmente = () => {
        let novosErros = {};
        if (formData.nomeEmpresa.trim().length < 3) novosErros.nomeEmpresa = "Nome da empresa obrigatório!";
        if (formData.cnpj.replace(/\D/g, '').length > 0 && formData.cnpj.replace(/\D/g, '').length < 14) novosErros.cnpj = "CNPJ incompleto!";
        if (formData.whatsappEmpresa.replace(/\D/g, '').length < 11) novosErros.whatsappEmpresa = "WhatsApp da empresa incompleto!";
        if (formData.nome.trim().length < 3) novosErros.nome = "Nome do proprietário obrigatório!";
        if (formData.cpf.replace(/\D/g, '').length < 11) novosErros.cpf = "CPF incompleto!";
        if (!formData.email.includes('@')) novosErros.email = "E-mail inválido!";
        if (formData.whatsapp.replace(/\D/g, '').length < 11) novosErros.whatsapp = "WhatsApp incompleto!";
        if (formData.username.trim().length < 3) novosErros.username = "Login muito curto!";
        if (formData.password.length < 4) novosErros.password = "A senha deve ter no mínimo 4 caracteres!";

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return; // Bloqueia clique duplo
        if (!validarLocalmente()) return; // Bloqueia se houver erro básico (campos vazios)

        setLoading(true);
        setErros({});

        const endpoint = `/api/auth/registro-empresa?nomeEmpresa=${encodeURIComponent(formData.nomeEmpresa)}&cnpj=${encodeURIComponent(formData.cnpj)}&whatsappEmpresa=${encodeURIComponent(formData.whatsappEmpresa)}`;

        try {
            await api.post(endpoint, {
                nome: formData.nome,
                cpf: formData.cpf,
                email: formData.email,
                whatsapp: formData.whatsapp,
                username: formData.username,
                password: formData.password
            });

            try {
                localStorage.removeItem('usuarioShark');
            } catch {
                /* ignore */
            }
            window.dispatchEvent(new Event('auth:logout'));

            navigate('/', {
                replace: true,
                state: {
                    successMsg:
                        'Cadastro concluído! Sua empresa e o acesso do proprietário foram criados. Faça login com o usuário e a senha informados.'
                }
            });

        } catch (error) {
            if (error.response && error.response.data) {
                const data = error.response.data;
                setErros(data);
            } else {
                setErros({ geral: "Erro ao conectar com o servidor da Shark." });
            }
        } finally {
            setLoading(false); // Libera o botão após a resposta
        }
    };

    const ErrorLabel = ({ msg }) => (
        <div style={{
            color: '#ff4444',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            marginTop: '4px',
            marginLeft: '5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center'
        }}>
            <i className="bi bi-exclamation-circle-fill me-1"></i> {msg}
        </div>
    );

    return (
        <div className="login-body">
            <div className="login-card" style={{ maxWidth: '500px' }}>
                <div className="text-center mb-4">
                    <img src="/images/logo.png" alt="Shark" style={{ width: '160px', filter: 'drop-shadow(0 0 5px rgba(0,212,255,0.3))' }} />
                    <h5 className="mt-3" style={{ color: 'var(--shark-light-blue)', fontWeight: 800 }}>CADASTRO DE EMPRESA</h5>
                </div>

                <form onSubmit={handleSubmit}>
                    {erros.geral && (
                        <div className="alert alert-danger py-2" role="alert">
                            {erros.geral}
                        </div>
                    )}

                    <div className="section-title">Dados da Loja</div>

                    <div className="mb-3">
                        <div className="form-floating">
                            <input type="text" name="nomeEmpresa" className={`form-control ${erros.nomeEmpresa ? 'is-invalid-shark' : ''}`}
                                   placeholder="Shark Eletrônicos" onChange={handleInputChange} value={formData.nomeEmpresa} required disabled={loading} />
                            <label><i className="bi bi-building me-2"></i>Nome da Empresa *</label>
                        </div>
                        {erros.nomeEmpresa && <ErrorLabel msg={erros.nomeEmpresa} />}
                    </div>

                    <div className="mb-3">
                        <div className="form-floating">
                            <input type="text" name="cnpj" className={`form-control ${erros.cnpj ? 'is-invalid-shark' : ''}`}
                                   placeholder="00.000.000/0000-00" onChange={handleInputChange} value={formData.cnpj} maxLength="18" disabled={loading} />
                            <label><i className="bi bi-card-checklist me-2"></i>CNPJ (Opcional)</label>
                        </div>
                        {erros.cnpj && <ErrorLabel msg={erros.cnpj} />}
                    </div>

                    <div className="mb-3">
                        <div className="form-floating">
                            <input type="text" name="whatsappEmpresa" className={`form-control ${erros.whatsappEmpresa ? 'is-invalid-shark' : ''}`}
                                   placeholder="(00) 00000-0000" onChange={handleInputChange} value={formData.whatsappEmpresa} required disabled={loading} />
                            <label><i className="bi bi-whatsapp me-2"></i>WhatsApp da Empresa *</label>
                        </div>
                        {erros.whatsappEmpresa && <ErrorLabel msg={erros.whatsappEmpresa} />}
                    </div>

                    <div className="section-title">Dados do Proprietário</div>

                    <div className="mb-3">
                        <div className="form-floating">
                            <input type="text" name="nome" className={`form-control ${erros.nome ? 'is-invalid-shark' : ''}`}
                                   placeholder="Seu Nome" onChange={handleInputChange} value={formData.nome} required disabled={loading} />
                            <label><i className="bi bi-person-badge me-2"></i>Nome Completo *</label>
                        </div>
                        {erros.nome && <ErrorLabel msg={erros.nome} />}
                    </div>

                    <div className="mb-3">
                        <div className="form-floating">
                            <input type="text" name="cpf" className={`form-control ${erros.cpf ? 'is-invalid-shark' : ''}`}
                                   placeholder="000.000.000-00" onChange={handleInputChange} value={formData.cpf} maxLength="14" required disabled={loading} />
                            <label><i className="bi bi-fingerprint me-2"></i>CPF *</label>
                        </div>
                        {erros.cpf && <ErrorLabel msg={erros.cpf} />}
                    </div>

                    <div className="mb-3">
                        <div className="form-floating">
                            <input type="email" name="email" className={`form-control ${erros.email ? 'is-invalid-shark' : ''}`}
                                   placeholder="email@shark.com" onChange={handleInputChange} value={formData.email} required disabled={loading} />
                            <label><i className="bi bi-envelope-at me-2"></i>E-mail *</label>
                        </div>
                        {erros.email && <ErrorLabel msg={erros.email} />}
                    </div>

                    <div className="mb-3">
                        <div className="form-floating">
                            <input type="text" name="whatsapp" className={`form-control ${erros.whatsapp ? 'is-invalid-shark' : ''}`}
                                   placeholder="(00) 00000-0000" onChange={handleInputChange} value={formData.whatsapp} required disabled={loading} />
                            <label><i className="bi bi-whatsapp me-2"></i>WhatsApp *</label>
                        </div>
                        {erros.whatsapp && <ErrorLabel msg={erros.whatsapp} />}
                    </div>

                    <div className="mb-3">
                        <div className="form-floating">
                            <input type="text" name="username" className={`form-control ${erros.username ? 'is-invalid-shark' : ''}`}
                                   placeholder="usuario" onChange={handleInputChange} value={formData.username} required disabled={loading} />
                            <label><i className="bi bi-person-lock me-2"></i>Login de Acesso *</label>
                        </div>
                        {erros.username && <ErrorLabel msg={erros.username} />}
                    </div>

                    <div className="mb-4">
                        <div className="form-floating">
                            <input type="password" name="password" className={`form-control ${erros.password ? 'is-invalid-shark' : ''}`}
                                   placeholder="Senha" onChange={handleInputChange} value={formData.password} required disabled={loading} />
                            <label><i className="bi bi-key me-2"></i>Senha *</label>
                        </div>
                        {erros.password && <ErrorLabel msg={erros.password} />}
                    </div>

                    <button type="submit" className="btn-login mb-3" disabled={loading}>
                        {loading ? "PROCESSANDO..." : "Finalizar Cadastro"}
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

export default RegistroEmpresa;