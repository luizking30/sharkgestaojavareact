import React, { useState, useEffect } from 'react';
import api from './api';
import { useFeedback } from './context/FeedbackContext';

const Relatorios = ({ usuarioLogado }) => {
    const { notify } = useFeedback();
    // Estados para Abas e Filtros
    const [abaAtiva, setAbaAtiva] = useState('periodo');
    const [filtros, setFiltros] = useState({ inicio: '', fim: '', mesFiltro: '' });
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(false);

    // Formatação de Moeda
    const fmt = (v) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleFiltrar = async (e, tipo) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const params = tipo === 'periodo' 
                ? { inicio: filtros.inicio, fim: filtros.fim }
                : { mesFiltro: filtros.mesFiltro };
            
            const res = await api.get('/api/relatorios', { params });
            setDados(res.data);
        } catch (err) {
            console.error("Erro ao gerar relatório", err);
            notify.error('Erro ao buscar dados do servidor.', 'Relatórios');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className="mt-2 text-white">
            {/* HEADER */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3 mb-4 d-print-none">
                <div className="w-100 w-md-auto">
                    <h2 className="shark-page-title fw-bold mb-0">
                        <i className="bi bi-graph-up-arrow text-success glow-success me-2"></i> Relatórios Shark
                    </h2>
                    <p className="text-white-50 small">Análise de performance e fechamento financeiro</p>
                </div>
                <button onClick={handlePrint} className="btn btn-outline-info fw-bold shadow-sm align-self-stretch align-self-md-center">
                    <i className="bi bi-printer me-2"></i>Imprimir Relatório
                </button>
            </div>

            {/* TABS FILTRO */}
            <ul className="nav nav-tabs mb-4 d-print-none">
                <li className="nav-item">
                    <button className={`nav-link shark-tab ${abaAtiva === 'periodo' ? 'active' : ''}`} onClick={() => setAbaAtiva('periodo')}>Por Período</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link shark-tab ${abaAtiva === 'mensal' ? 'active' : ''}`} onClick={() => setAbaAtiva('mensal')}>Por Mês</button>
                </li>
            </ul>

            <div className="d-print-none">
                {abaAtiva === 'periodo' ? (
                    <div className="card shark-stat-card border-left-info shadow-sm mb-4" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                        <div className="card-body">
                            <form onSubmit={(e) => handleFiltrar(e, 'periodo')} className="row g-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="text-info small fw-bold mb-1 text-uppercase">Início</label>
                                    <input type="date" className="form-control bg-black text-white border-secondary" 
                                           value={filtros.inicio} onChange={e => setFiltros({...filtros, inicio: e.target.value})} required/>
                                </div>
                                <div className="col-md-4">
                                    <label className="text-info small fw-bold mb-1 text-uppercase">Fim</label>
                                    <input type="date" className="form-control bg-black text-white border-secondary" 
                                           value={filtros.fim} onChange={e => setFiltros({...filtros, fim: e.target.value})} required/>
                                </div>
                                <div className="col-md-4 d-flex gap-2">
                                    <button type="submit" className="btn btn-info w-100 fw-bold">FILTRAR</button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => {setDados(null); setFiltros({inicio:'', fim:'', mesFiltro:''})}}><i className="bi bi-arrow-clockwise"></i></button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="card shark-stat-card border-left-success shadow-sm mb-4" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                        <div className="card-body">
                            <form onSubmit={(e) => handleFiltrar(e, 'mensal')} className="row g-3 align-items-end">
                                <div className="col-md-8">
                                    <label className="text-success small fw-bold mb-1 text-uppercase">Mês de Referência</label>
                                    <input type="month" className="form-control bg-black text-white border-secondary" 
                                           value={filtros.mesFiltro} onChange={e => setFiltros({...filtros, mesFiltro: e.target.value})} required/>
                                </div>
                                <div className="col-md-4">
                                    <button type="submit" className="btn btn-success w-100 fw-bold">GERAR MENSAL</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTEÚDO DO RELATÓRIO */}
            {dados ? (
                <div className="animate__animated animate__fadeIn">
                    <h5 className="text-success small fw-bold mb-3 text-uppercase"><i className="bi bi-bag-check me-2"></i>Movimento de Vendas</h5>
                    <div className="row g-4 mb-5">
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-success">
                                <h6 className="text-success small fw-bold text-uppercase">Venda Bruta</h6>
                                <h3 className="fw-bold">R$ {fmt(dados.totalVendasBruto)}</h3>
                                <i className="bi bi-graph-up text-success icon-large-side glow-success position-absolute end-0 bottom-0 p-3"></i>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-danger">
                                <h6 className="text-danger small fw-bold text-uppercase">Custo Estoque</h6>
                                <h3 className="text-danger fw-bold">R$ {fmt(dados.custoEstoqueVendido)}</h3>
                                <i className="bi bi-graph-down text-danger icon-large-side glow-danger position-absolute end-0 bottom-0 p-3"></i>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-info shark-stat-card--gradient">
                                <h6 className="text-info small fw-bold text-uppercase">Venda Líquida</h6>
                                <h3 className="fw-bold">R$ {fmt(dados.lucroVendas)}</h3>
                                <i className="bi bi-gem text-info icon-large-side glow-info position-absolute end-0 bottom-0 p-3"></i>
                            </div>
                        </div>
                    </div>

                    <h5 className="text-info small fw-bold mb-3 text-uppercase"><i className="bi bi-tools me-2"></i>Movimento de Serviços</h5>
                    <div className="row g-4 mb-5">
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-success">
                                <h6 className="text-success small fw-bold text-uppercase">O.S. Bruto</h6>
                                <h3 className="fw-bold">R$ {fmt(dados.totalServicosBruto)}</h3>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-danger">
                                <h6 className="text-danger small fw-bold text-uppercase">Gasto Peças</h6>
                                <h3 className="text-danger fw-bold">R$ {fmt(dados.custoPecasOS)}</h3>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-4 h-100 shark-stat-card border-left-info shark-stat-card--gradient">
                                <h6 className="text-info small fw-bold text-uppercase">Serviço Líquido</h6>
                                <h3 className="fw-bold">R$ {fmt(dados.lucroServicos)}</h3>
                            </div>
                        </div>
                    </div>

                    {dados.totalDespesas !== undefined && (
                        <div className="row g-4 mb-5">
                            <div className="col-12">
                                <div className="card p-4 shark-stat-card border-left-danger">
                                    <h6 className="text-danger small fw-bold text-uppercase">Total de Despesas (Contas Pagas)</h6>
                                    <h3 className="fw-bold">R$ {fmt(dados.totalDespesas)}</h3>
                                    <i className="bi bi-arrow-down-circle text-danger icon-large-side glow-danger position-absolute end-0 bottom-0 p-3"></i>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card p-4 mb-5 shark-stat-card border-left-total shark-stat-card--gradient-row">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="text-success fw-bold text-uppercase mb-1"><span className="rocket-animate">💰</span> Resultado Líquido Final</h5>
                                <p className="text-white-50 small mb-0">(Vendas + Serviços - Despesas Pagas)</p>
                            </div>
                            <h1 className="fw-bold text-glow shark-dash-total-valor">R$ {fmt(dados.lucroTotalFinal || dados.lucroTotalPeriodo)}</h1>
                        </div>
                    </div>

                    {/* TABELAS DE DETALHES */}
                    <h5 className="fw-bold mb-3 text-success">Histórico de Vendas</h5>
                    <div className="shark-table-card mb-5" style={{ borderLeftColor: '#198754' }}>
                        <div className="table-responsive shark-mobile-cards">
                            <table className="table table-dark table-hover mb-0">
                                <thead className="bg-black text-white-50 text-uppercase small">
                                    <tr>
                                        <th className="ps-3">ID Venda</th>
                                        <th>Data/Hora</th>
                                        <th>Vendedor</th>
                                        <th>Produtos</th>
                                        <th className="text-end pe-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dados.vendas?.map(v => (
                                        <tr key={v.id} className="align-middle">
                                            <td className="ps-3 fw-bold text-success" data-label="ID venda">#{v.id}</td>
                                            <td data-label="Data/hora">{new Date(v.dataHora).toLocaleString('pt-BR')}</td>
                                            <td data-label="Vendedor">{v.vendedor}</td>
                                            <td data-label="Produtos">
                                                {v.itens?.map((it, idx) => (
                                                    <span key={idx} className="badge bg-dark border border-secondary me-1">
                                                        {it.produto?.nome} (x{it.quantidade})
                                                    </span>
                                                ))}
                                            </td>
                                            <td className="text-end pe-3 text-success fw-bold" data-label="Total">R$ {fmt(v.valorTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-5 shark-table-card border-dashed" style={{ borderStyle: 'dashed', opacity: 0.6 }}>
                    <i className="bi bi-calendar2-range fs-1 mb-3 d-block text-success glow-success"></i>
                    <h5 className="text-white">Relatórios Financeiros Shark</h5>
                    <p className="text-white-50 small">Escolha uma das opções de filtro acima para carregar o balanço financeiro.</p>
                </div>
            )}
        </div>
    );
};

export default Relatorios;