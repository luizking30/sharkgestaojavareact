import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';

const PagamentoPix = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Estados para controlar a interface
    const [pago, setPago] = useState(false);
    const [contador, setContador] = useState(3);
    const [copiado, setCopiado] = useState(false);

    // Dados que vêm da navegação (enviados pela página anterior)
    const { qrCodeBase64, copiaECola, diasAntesDaCompra } = location.state || {};

    // 1. Efeito para checar o status do pagamento no banco a cada 5 segundos
    useEffect(() => {
        if (!pago && diasAntesDaCompra !== undefined) {
            const checarStatus = setInterval(async () => {
                try {
                    const res = await api.get(`/api/pagamentos/assinatura/status-check?diasAnteriores=${diasAntesDaCompra}`);
                    if (res.data === true) {
                        setPago(true);
                        clearInterval(checarStatus);
                    }
                } catch (err) {
                    console.error("Erro ao checar status do Pix", err);
                }
            }, 5000);

            return () => clearInterval(checarStatus);
        }
    }, [pago, diasAntesDaCompra]);

    // 2. Efeito para o redirecionamento após aprovação
    useEffect(() => {
        if (pago) {
            const timer = setInterval(() => {
                setContador((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/dashboard');
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [pago, navigate]);

    const handleCopyPix = () => {
        navigator.clipboard.writeText(copiaECola);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    // Proteção caso a página seja acessada sem dados de pagamento
    if (!copiaECola) {
        return (
            <div className="text-center mt-5">
                <h3 className="text-white">Nenhum pagamento pendente encontrado.</h3>
                <button className="btn btn-info mt-3" onClick={() => navigate('/dashboard')}>Voltar</button>
            </div>
        );
    }

    return (
        <div className="row justify-content-center animate__animated animate__fadeIn">
            <style>
                {`
                .pix-input {
                    background: #000 !important;
                    color: #0dcaf0 !important;
                    border: 1px solid #334155 !important;
                    font-family: 'JetBrains Mono', monospace;
                }
                .qr-bg {
                    background: white;
                    padding: 15px;
                    display: inline-block;
                    border-radius: 15px;
                    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
                }
                `}
            </style>

            <div className="col-md-6">
                <div className="card bg-dark border-primary shadow-lg" style={{ borderRadius: '20px' }}>
                    <div className="card-body p-5 text-center">

                        {!pago ? (
                            <div id="area-pagamento">
                                <h2 className="fw-bold text-white mb-4">
                                    <i className="bi bi-qr-code me-2"></i>PAGAMENTO VIA PIX
                                </h2>
                                <p className="text-white-50">Escaneie o código abaixo com o aplicativo do seu banco:</p>

                                {qrCodeBase64 && (
                                    <div className="qr-bg mb-4">
                                        <img 
                                            src={`data:image/png;base64,${qrCodeBase64}`} 
                                            alt="QR Code Pix" 
                                            style={{ width: '250px' }} 
                                        />
                                    </div>
                                )}

                                <div className="mb-4 text-start">
                                    <label className="form-label text-white-50 small">Código Copia e Cola:</label>
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="form-control pix-input small" 
                                            value={copiaECola} 
                                            readOnly 
                                        />
                                        <button 
                                            className={`btn ${copiado ? 'btn-success' : 'btn-outline-info'}`} 
                                            onClick={handleCopyPix}
                                        >
                                            <i className={`bi ${copiado ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                        </button>
                                    </div>
                                    {copiado && <small className="text-success mt-1 d-block">Código copiado!</small>}
                                </div>

                                <div className="alert alert-info border-0 bg-opacity-10 text-info small animate__animated animate__pulse animate__infinite">
                                    <i className="bi bi-hourglass-split me-2"></i>
                                    Aguardando confirmação do banco...
                                </div>
                            </div>
                        ) : (
                            <div id="area-sucesso" className="animate__animated animate__zoomIn">
                                <div className="mb-4">
                                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
                                </div>
                                <h2 className="fw-bold text-white mb-3">PAGAMENTO APROVADO!</h2>
                                <p className="text-white-50 mb-4">
                                    Sua recarga foi processada com sucesso. O sistema já foi liberado.
                                </p>
                                <div className="alert alert-success bg-opacity-10 text-success border-success">
                                    Redirecionando para o Dashboard em <strong>{contador}</strong> segundos...
                                </div>
                            </div>
                        )}

                        <button 
                            className="btn btn-outline-light w-100 mt-3" 
                            onClick={() => navigate('/dashboard')}
                        >
                            VOLTAR AO DASHBOARD
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PagamentoPix;