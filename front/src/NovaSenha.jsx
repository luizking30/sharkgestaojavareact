import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
            await axios.post('http://localhost:8080/api/auth/atualizar-senha', null, {
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
            <div className="d-flex align-items-center justify-content-center vh-100" style={{background: '#020617'}}>
                <div className="login-card-reset text-center">
                    <i className="bi bi-shield-slash-fill text-danger mb-3" style={{fontSize: '3rem'}}></i>
                    <h4 style={{fontWeight: 800, color: '#fff'}}>ACESSO NEGADO</h4>
                    <p style={{color: '#94a3b8'}}>O token de segurança não foi encontrado.</p>
                    <button className="btn-reset-shark mt-3" onClick={() => navigate('/')}>VOLTAR AO LOGIN</button>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex align-items-center justify-content-center vh-100" style={{background: '#020617', padding: '20px'}}>
            <style>
                {`
                :root { 
                    --shark-blue: #0047ab; 
                    --shark-light-blue: #00d4ff; 
                    --shark-black: #020617; 
                    --shark-white: #f8fafc; 
                    --shark-red: #ff4d4d; 
                    --shark-yellow: #ffcc00; 
                    --shark-green: #00ff88;
                }
                .login-card-reset { 
                    background: rgba(15, 23, 42, 0.85); 
                    backdrop-filter: blur(12px); 
                    padding: 40px; 
                    border-radius: 24px; 
                    color: var(--shark-white); 
                    width: 100%; 
                    max-width: 420px; 
                    box-shadow: 0 0 50px rgba(0, 212, 255, 0.2); 
                    border: 1px solid rgba(0, 212, 255, 0.3); 
                }
                .brand-logo-reset { width: 220px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.6)); }
                .form-floating > .form-control { background-color: rgba(2, 6, 23, 0.8) !important; border: 1px solid #1e293b !important; color: white !important; border-radius: 12px; height: 60px; }
                .form-floating > label { color: #94a3b8 !important; }
                
                .btn-reset-shark { 
                    width: 100%; 
                    padding: 14px; 
                    background: var(--shark-blue); 
                    border: 1px solid var(--shark-light-blue); 
                    color: white; 
                    font-weight: 800; 
                    border-radius: 12px; 
                    text-transform: uppercase; 
                    letter-spacing: 1.5px; 
                    transition: 0.3s; 
                }
                .btn-reset-shark:hover:not(:disabled) { background: var(--shark-white); color: var(--shark-blue); transform: translateY(-3px); }
                
                /* CARDS DE FEEDBACK INTERNOS */
                .feedback-card {
                    padding: 12px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    animation: fadeIn 0.4s ease-out;
                }
                .error-card { background: rgba(255, 77, 77, 0.1); border: 1px solid var(--shark-red); color: var(--shark-red); }
                .success-card { background: rgba(0, 255, 136, 0.1); border: 1px solid var(--shark-green); color: var(--shark-green); }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                `}
            </style>

            <div className="login-card-reset animate__animated animate__zoomIn">
                <div className="text-center">
                    <img src="/images/logo.png" alt="Shark Eletrônicos" className="brand-logo-reset" />
                    <h5 style={{ color: 'var(--shark-yellow)', fontWeight: 800, marginBottom: '10px' }}>NOVA SENHA</h5>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }} className="mb-4">Atualize seus dados de acesso.</p>
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