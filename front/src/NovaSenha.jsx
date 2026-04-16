import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from './api';

const NovaSenha = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Estados do formulário e mensagens
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msgSucesso, setMsgSucesso] = useState('');
    const [msgErro, setMsgErro] = useState('');
    const [loading, setLoading] = useState(false);

    // O token vem da URL
    const token = searchParams.get('token');

    const handleReset = async (e) => {
        e.preventDefault();
        setMsgErro('');
        setMsgSucesso('');

        // Validação de coincidência de senha
        if (password !== confirmPassword) {
            setMsgErro("AS SENHAS NÃO COINCIDEM!");
            return;
        }

        setLoading(true);

        try {
            // Enviando como RequestParam para o Java
            await api.post('/api/auth/atualizar-senha', null, {
                params: { token, password }
            });

            setMsgSucesso("SENHA ATUALIZADA COM SUCESSO!");

            // Redireciona após 3 segundos para o usuário ler a mensagem
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err) {
            console.error("Erro ao resetar senha:", err);
            const mensagemServidor = err.response?.data;
            setMsgErro(typeof mensagemServidor === 'string' ? mensagemServidor : "LINK EXPIRADO OU INVÁLIDO");
        } finally {
            setLoading(false);
        }
    };

    // Caso o token não esteja presente na URL
    if (!token) {
        return (
            <div className="nova-senha-screen d-flex align-items-center justify-content-center vh-100">
                <div className="login-card-reset text-center">
                    <i className="bi bi-shield-slash-fill text-danger mb-3 nova-senha-denied-icon"></i>
                    <h4 className="text-white fw-bold">ACESSO NEGADO</h4>
                    <p className="nova-senha-muted">O token de segurança não foi encontrado.</p>
                    <button className="btn-reset-shark mt-3" onClick={() => navigate('/')}>VOLTAR AO LOGIN</button>
                </div>
            </div>
        );
    }

    return (
        <div className="nova-senha-screen d-flex align-items-center justify-content-center vh-100 p-4">
            <div className="login-card-reset animate__animated animate__zoomIn">
                <div className="text-center">
                    <img src="/images/logo.png" alt="Shark Eletrônicos" className="brand-logo-reset" />
                    <h5 className="nova-senha-title-accent">NOVA SENHA</h5>
                    <p className="nova-senha-muted mb-4">Atualize seus dados de acesso.</p>
                </div>

                {/* EXIBIÇÃO DE MENSAGENS NO CARD */}
                {msgErro && (
                    <div className="feedback-card error-card">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i> {msgErro}
                    </div>
                )}

                {msgSucesso && (
                    <div className="feedback-card success-card">
                        <i className="bi bi-check-circle-fill me-2"></i> {msgSucesso}
                    </div>
                )}

                <form onSubmit={handleReset}>
                    <div className="form-floating mb-3">
                        <input
                            type="password"
                            className="form-control"
                            id="passInput"
                            placeholder="Nova Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading || msgSucesso}
                        />
                        <label htmlFor="passInput"><i className="bi bi-shield-lock me-2"></i>Nova Senha</label>
                    </div>

                    <div className="form-floating mb-4">
                        <input
                            type="password"
                            className="form-control"
                            id="confirmPassInput"
                            placeholder="Confirmar Senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading || msgSucesso}
                        />
                        <label htmlFor="confirmPassInput"><i className="bi bi-check2-circle me-2"></i>Confirmar Senha</label>
                    </div>

                    <button
                        type="submit"
                        className="btn-reset-shark"
                        disabled={loading || msgSucesso}
                    >
                        {loading ? 'PROCESSANDO...' : msgSucesso ? 'CONCLUÍDO' : 'ATUALIZAR SENHA'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NovaSenha;