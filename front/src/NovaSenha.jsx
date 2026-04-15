import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from './api';

const NovaSenha = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Estados do formulário
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    // O token vem da URL (ex: /nova-senha?token=123...)
    const token = searchParams.get('token');

    const handleReset = async (e) => {
        e.preventDefault();
        
        // Validação de segurança
        if (password !== confirmPassword) {
            setError(true);
            return;
        }

        setError(false);
        setLoading(true);

        try {
            await api.post('/api/auth/atualizar-senha', {
                token: token,
                password: password
            });

            alert("Senha atualizada com sucesso! Faça login agora.");
            navigate('/'); // Volta para a tela de login
        } catch (err) {
            console.error("Erro ao resetar senha:", err);
            alert("Erro: O link pode ter expirado ou o token é inválido.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center text-white mt-5">
                <h3>Link Inválido</h3>
                <p>O token de recuperação não foi encontrado.</p>
                <button className="btn btn-info" onClick={() => navigate('/')}>Voltar ao Login</button>
            </div>
        );
    }

    return (
        <div className="animate__animated animate__fadeIn">
            <style>
                {`
                :root { 
                    --shark-blue: #0047ab; 
                    --shark-light-blue: #00d4ff; 
                    --shark-black: #020617; 
                    --shark-white: #f8fafc; 
                    --shark-red: #ff4d4d; 
                    --shark-yellow: #ffcc00; 
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
                    text-align: center; 
                    margin: 0 auto;
                }
                .brand-logo-reset { width: 220px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.6)); }
                .form-floating > .form-control { background-color: rgba(2, 6, 23, 0.8) !important; border: 1px solid #1e293b !important; color: white !important; border-radius: 12px; }
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
                .btn-reset-shark:hover { background: var(--shark-white); color: var(--shark-blue); transform: translateY(-3px); }
                .btn-reset-shark:disabled { opacity: 0.6; cursor: not-allowed; }
                .alert-error-reset { color: var(--shark-red); font-size: 0.85rem; margin-top: -10px; margin-bottom: 15px; }
                `}
            </style>

            <div className="login-card-reset">
                <div className="text-center">
                    <img src="/images/logo.png" alt="Shark Eletrônicos" className="brand-logo-reset" />
                    <h5 style={{ color: 'var(--shark-yellow)', fontWeight: 800, marginBottom: '10px' }}>DEFINIR NOVA SENHA</h5>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }} className="mb-4">Crie uma senha forte para sua segurança.</p>
                </div>

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
                        />
                        <label htmlFor="passInput"><i className="bi bi-shield-lock me-2"></i>Nova Senha</label>
                    </div>

                    <div className="form-floating mb-3">
                        <input 
                            type="password" 
                            className="form-control" 
                            id="confirmPassInput" 
                            placeholder="Confirmar Senha" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required 
                        />
                        <label htmlFor="confirmPassInput"><i className="bi bi-check2-circle me-2"></i>Confirmar Senha</label>
                    </div>

                    {error && (
                        <div className="alert-error-reset">
                            <i className="bi bi-exclamation-triangle-fill me-1"></i> As senhas não coincidem!
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn-reset-shark" 
                        disabled={loading}
                    >
                        {loading ? 'ATUALIZANDO...' : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NovaSenha;