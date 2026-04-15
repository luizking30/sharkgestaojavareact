import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

const Pagamento = () => {
    const [dias, setDias] = useState(30);
    const [loading, setLoading] = useState(false);
    const precoDia = 2.00;

    const valorTotal = dias * precoDia;

    const handleGerarPix = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ajuste o endpoint conforme seu Controller Java
            const res = await api.post('/api/pagamento/gerar-pix', { quantidadeDias: dias });
            
            // Aqui você pode redirecionar para uma tela de QR Code ou 
            // abrir o link do Mercado Pago em uma nova aba
            if (res.data.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            }
        } catch (err) {
            console.error("Erro ao gerar pagamento:", err);
            alert("Erro ao conectar com o gateway de pagamento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row justify-content-center animate__animated animate__fadeIn">
            <style>
                {`
                .input-dias {
                    background: #000 !important;
                    color: #ffc107 !important;
                    border: 2px solid #334155 !important;
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-align: center;
                    border-radius: 15px;
                }
                .input-dias:focus {
                    border-color: #ffc107 !important;
                    box-shadow: 0 0 15px rgba(255, 193, 7, 0.3);
                }
                .card-pagamento {
                    border-radius: 20px;
                    border: 2px solid #ffc107 !important;
                    background-color: #1e293b !important;
                }
                `}
            </style>

            <div className="col-md-6">
                <div className="card card-pagamento shadow-lg">
                    <div className="card-body p-5 text-center">

                        <div className="mb-4">
                            <i className="bi bi-clock-history text-warning" style={{ fontSize: '4rem' }}></i>
                        </div>

                        <h2 className="fw-bold text-white mb-2">RECARGA DE ACESSO</h2>
                        <p className="text-white-50 mb-4">Escolha quantos dias deseja adicionar ao seu sistema.</p>

                        <form onSubmit={handleGerarPix}>

                            <div className="mb-4">
                                <label className="text-muted small fw-bold mb-2 d-block text-uppercase">
                                    Quantidade de Dias (R$ 2,00/dia)
                                </label>
                                <input 
                                    type="number" 
                                    className="form-control input-dias mx-auto"
                                    style={{ maxWidth: '150px' }}
                                    value={dias}
                                    min="5"
                                    step="1"
                                    onChange={(e) => setDias(parseInt(e.target.value) || 0)}
                                    required
                                />
                                <small className="text-info mt-2 d-block">* Mínimo de 5 dias para recarga.</small>
                            </div>

                            <hr className="border-secondary my-4" />

                            <div className="d-flex justify-content-between align-items-center mb-4 bg-black p-3 rounded-3 border border-secondary">
                                <div className="text-start">
                                    <span className="d-block text-muted small text-uppercase">Total a pagar:</span>
                                    <span className="fw-bold text-white">{dias} Dias de Acesso</span>
                                </div>
                                <div className="text-end">
                                    <span className="h3 fw-bold text-success">
                                        {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-warning btn-lg w-100 fw-bold py-3 mb-3"
                                disabled={loading || dias < 5}
                            >
                                <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-qr-code'} me-2`}></i>
                                {loading ? 'PROCESSANDO...' : 'GERAR PIX PARA PAGAR'}
                            </button>
                        </form>

                        <p className="small text-muted mb-0">
                            <i className="bi bi-shield-check text-success"></i> Liberação instantânea após o pagamento.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <Link to="/dashboard" className="text-white-50 text-decoration-none small">
                        <i className="bi bi-arrow-left me-1"></i> Voltar ao Painel Principal
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Pagamento;