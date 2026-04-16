import React, { useState, useEffect } from 'react';
import api from './api';
import { useFeedback } from './context/FeedbackContext';

const RelatorioMensal = () => {
    const { notify } = useFeedback();
    const [mesReferencia, setMesReferencia] = useState('');
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(false);

    // Formatação de Moeda Brasileira
    const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleGerarRelatorio = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Chamada para o seu endpoint Java de fechamento mensal
            const res = await api.get(`/api/relatorios/mensal?mesReferencia=${mesReferencia}`);
            setDados(res.data);
        } catch (err) {
            console.error("Erro ao gerar fechamento mensal:", err);
            notify.error('Erro ao buscar dados do servidor.', 'Fechamento mensal');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className="mt-2 text-white">
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
                <div>
                    <h2 className="fw-bold mb-0">
                        <i className="bi bi-calendar-check text-success glow-success me-2"></i> Fechamento Mensal Shark
                    </h2>
                    <p className="text-white-50 small">Análise consolidada por mês de referência</p>
                </div>
                <button onClick={handlePrint} className="btn btn-outline-info fw-bold shadow-sm">
                    <i className="bi bi-printer me-2"></i>Imprimir Fechamento
                </button>
            </div>

            {/* FORMULÁRIO DE FILTRO */}
            <div className="card shark-stat-card border-left-info shadow-sm mb-4 d-print-none" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                <div className="card-body">
                    <form onSubmit={handleGerarRelatorio} className="row g-3 align-items-end">
                        <div className="col-md-8">
                            <label className="text-info small fw-bold mb-1 text-uppercase">Selecione o Mês</label>
                            <input type="month" className="form-control bg-black text-white border-secondary shadow-none" 
                                   value={mesReferencia} onChange={(e) => setMesReferencia(e.target.value)} required />
                        </div>
                        <div className="col-md-4 d-flex gap-2">
                            <button type="submit" className="btn btn-info w-100 fw-bold" disabled={loading}>
                                <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-search'}`}></i> {loading ? 'GERANDO...' : 'GERAR RELATÓRIO'}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => {setDados(null); setMesReferencia('')}}>
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* CONTEÚDO DO RELATÓRIO */}
            {dados ? (
                <div className="animate__animated animate__fadeIn">
                    <h5 className="text-success small fw-bold mb-3 text-uppercase"><i className="bi bi-bag-check me-2"></i>Movimento de Vendas</h5>
                    <div className="row g-4 mb-5">
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-success">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-success small fw-bold text-uppercase mb-2">Venda Bruta</h6>
                                        <h3 className="fw-bold">{fmt(dados.totalVendasBruto)}</h3>
                                    </div>
                                    <i className="bi bi-graph-up text-success icon-large-side glow-success"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-danger">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-danger small fw-bold text-uppercase mb-2">Custo Estoque</h6>
                                        <h3 className="text-danger fw-bold">{fmt(dados.custoEstoqueVendido)}</h3>
                                    </div>
                                    <i className="bi bi-graph-down text-danger icon-large-side glow-danger"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-info shark-stat-card--gradient">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-info small fw-bold text-uppercase mb-2">Lucro em Vendas</h6>
                                        <h3 className="fw-bold">{fmt(dados.lucroVendas)}</h3>
                                    </div>
                                    <i className="bi bi-gem text-info icon-large-side glow-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h5 className="text-info small fw-bold mb-3 text-uppercase"><i className="bi bi-tools me-2"></i>Movimento de Serviços</h5>
                    <div className="row g-4 mb-5">
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-success">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-success small fw-bold text-uppercase mb-2">O.S Bruto</h6>
                                        <h3 className="fw-bold">{fmt(dados.totalServicosBruto)}</h3>
                                    </div>
                                    <i className="bi bi-graph-up text-success icon-large-side glow-success"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-danger">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-danger small fw-bold text-uppercase mb-2">Gasto Peças</h6>
                                        <h3 className="text-danger fw-bold">{fmt(dados.custoPecasOS)}</h3>
                                    </div>
                                    <i className="bi bi-wrench-adjustable text-danger icon-large-side glow-danger"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-info shark-stat-card--gradient">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-info small fw-bold text-uppercase mb-2">Lucro em Serviços</h6>
                                        <h3 className="fw-bold">{fmt(dados.lucroServicos)}</h3>
                                    </div>
                                    <i className="bi bi-lightning-charge-fill text-info icon-large-side glow-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h5 className="text-danger small fw-bold mb-3 text-uppercase"><i className="bi bi-cash-stack me-2"></i>Despesas (Contas Pagas)</h5>
                    <div className="row g-4 mb-5">
                        <div className="col-md-6">
                            <div className="card p-4 h-100 shark-stat-card border-left-danger">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-danger small fw-bold text-uppercase mb-2">Total Despesas do Mês</h6>
                                        <h3 className="text-danger fw-bold">{fmt(dados.totalDespesas)}</h3>
                                    </div>
                                    <i className="bi bi-arrow-down-circle text-danger icon-large-side glow-danger"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card p-4 h-100 shark-stat-card border-left-success">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-success small fw-bold text-uppercase mb-2">Saldo Após Despesas</h6>
                                        <h3 className="text-success fw-bold">{fmt(dados.lucroFinalPosContas)}</h3>
                                    </div>
                                    <i className="bi bi-wallet2 text-success icon-large-side glow-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD FINAL LÍQUIDO */}
                    <div className="row g-4 mb-5">
                        <div className="col-12">
                            <div className="card p-4 shadow-lg shark-stat-card border-left-total shark-stat-card--gradient-row">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="text-success fw-bold text-uppercase mb-1">
                                            <span className="rocket-animate shark-rocket-emoji">💰</span> Resultado Líquido Final do Mês
                                        </h5>
                                        <p className="text-white-50 small mb-0">(Lucro Total - Despesas Pagas)</p>
                                    </div>
                                    <div className="text-end">
                                        <h1 className="text-white mb-0 fw-bold text-glow shark-relatorio-valor-hero">
                                            {fmt(dados.lucroFinalPosContas)}
                                        </h1>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-5 shark-table-card border-dashed" style={{ borderStyle: 'dashed', opacity: 0.6 }}>
                    <i className="bi bi-calendar-check fs-1 mb-3 d-block text-success glow-success"></i>
                    <h5 className="text-white">Fechamento Mensal Shark</h5>
                    <p className="text-white-50 small">Selecione o mês acima para consolidar o balanço financeiro.</p>
                </div>
            )}
        </div>
    );
};

export default RelatorioMensal;