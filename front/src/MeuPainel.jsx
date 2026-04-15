import React, { useState, useEffect } from 'react';

const MeuPainel = ({ usuarioLogado, vendas = [], servicos = [], meusPagamentos = [] }) => {
    const [abaAtiva, setAbaAtiva] = useState('vendas');

    // Funções de formatação (Compatível com #numbers.formatCurrency)
    const formatarMoeda = (valor) => 
        (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatarData = (data) => 
        data ? new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';

    // Cálculo do Saldo Total (Vendas + O.S.)
    const totalGeral = (usuarioLogado?.saldoVendaCalculado || 0) + (usuarioLogado?.totalComissaoOsAcumulada || 0);

    return (
        <div className="mt-2 text-white">
            <style>
                {`
                .shark-card { background: #1a1a1a; border-radius: 15px; border: none; border-left: 5px solid #333; transition: 0.3s; }
                .card-ganhos-stats {
                    background: rgba(30, 41, 59, 0.6);
                    border-radius: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    height: 100%;
                    border-left: 4px solid #333;
                }
                .border-left-info { border-left: 5px solid #0dcaf0 !important; }
                .border-left-success { border-left: 5px solid #00c853 !important; }
                .label-stats { text-transform: uppercase; font-size: 0.6rem; letter-spacing: 1px; color: #94a3b8; font-weight: 700; margin-bottom: 2px; }
                .valor-bruto { font-family: 'JetBrains Mono', monospace; font-size: 1.2rem; color: #fff; font-weight: 700; }
                .valor-comissao { font-family: 'JetBrains Mono', monospace; font-size: 1.4rem; font-weight: 800; }
                .card-total-receber {
                    background: linear-gradient(135deg, #1e293b 0%, #020617 100%);
                    border-left: 6px solid #ffc107;
                    box-shadow: 0 0 20px rgba(255, 193, 7, 0.1);
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                }
                .nav-tabs-shark .nav-link { color: #94a3b8; border: none; font-weight: 600; padding: 12px 25px; background: transparent; }
                .nav-link.shark-tab.active { background: rgba(0, 212, 255, 0.1) !important; color: #0dcaf0 !important; border-bottom: 3px solid #0dcaf0 !important; }
                .val-mono { font-family: 'JetBrains Mono', monospace; }
                .info-aviso-card { font-size: 0.55rem; color: #ffc107; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
                `}
            </style>

            {/* HEADER */}
            <div className="row mb-4">
                <div className="col-12 d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="fw-bold text-white mb-1"><i className="bi bi-wallet2 me-2" style={{ color: '#0dcaf0' }}></i> Extrato de Comissões</h2>
                        <p className="text-white-50 small mb-0">Shark Eletrônicos | Terminal de Liquidação Individual</p>
                    </div>
                    <div className="text-end">
                        <span className="badge bg-dark border border-secondary p-2 val-mono">
                            <i className="bi bi-calendar3 me-2 text-info"></i>
                            {new Date().toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>
            </div>

            {/* INFO COLABORADOR */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card-ganhos-stats border-left-info" style={{ background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.9) 0%, rgba(2, 6, 23, 0.8) 100%)', padding: '1.5rem' }}>
                        <div className="row g-3 align-items-center">
                            <div className="col-md-3">
                                <span className="label-stats text-info">Colaborador</span>
                                <div className="text-white fw-bold">{usuarioLogado?.nome}</div>
                                <span className={`badge bg-dark border mt-1 ${usuarioLogado?.tipoFuncionario === 'PROPRIETARIO' ? 'border-warning text-warning' : 'border-info text-info'}`} style={{ fontSize: '0.6rem' }}>
                                    <i className={`bi ${usuarioLogado?.tipoFuncionario === 'PROPRIETARIO' ? 'bi-star-fill' : 'bi-tools'} me-1`}></i>
                                    {usuarioLogado?.tipoFuncionario === 'PROPRIETARIO' ? 'PROPRIETÁRIO' : 'VENDEDOR TÉCNICO'}
                                </span>
                            </div>
                            <div className="col-md-2">
                                <span className="label-stats">Login</span>
                                <div className="text-white-50 val-mono small">{usuarioLogado?.username}</div>
                            </div>
                            <div className="col-md-4">
                                <span className="label-stats">E-mail</span>
                                <div className="text-white-50 small">{usuarioLogado?.email}</div>
                            </div>
                            <div className="col-md-3">
                                <span className="label-stats">WhatsApp / CPF</span>
                                <div className="text-white-50 val-mono small">{usuarioLogado?.whatsapp} | {usuarioLogado?.cpf}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DASHBOARD DE VALORES */}
            <div className="row g-3 mb-5 d-flex align-items-stretch">
                <div className="col-lg-8">
                    <div className="row g-3 h-100">
                        <div className="col-md-6">
                            <div className="card-ganhos-stats border-left-info">
                                <span className="label-stats text-info">Saldo Comissão Vendas</span>
                                <span className="valor-comissao text-info">{formatarMoeda(usuarioLogado?.saldoVendaCalculado)}</span>
                                <div className="info-aviso-card">Taxa aplicada: {usuarioLogado?.comissaoVenda}%</div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card-ganhos-stats border-left-success">
                                <span className="label-stats text-success">Saldo Comissão Serviços</span>
                                <span className="valor-comissao text-success">{formatarMoeda(usuarioLogado?.totalComissaoOsAcumulada)}</span>
                                <div className="info-aviso-card">Taxa aplicada: {usuarioLogado?.comissaoOs}%</div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card-ganhos-stats">
                                <span className="label-stats">Bruto Vendas</span>
                                <span className="valor-bruto">{formatarMoeda(usuarioLogado?.brutoVendaCalculado)}</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card-ganhos-stats">
                                <span className="label-stats">Bruto O.S.</span>
                                <span className="valor-bruto">{formatarMoeda(usuarioLogado?.brutoOsCalculado)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4 d-flex">
                    <div className="card-total-receber py-4 w-100">
                        <i className="bi bi-cash-stack text-warning fs-1 mb-2"></i>
                        <span className="label-stats text-warning" style={{ fontSize: '0.8rem' }}>Saldo Total a Receber</span>
                        <span className="valor-comissao text-warning" style={{ fontSize: '2.8rem' }}>{formatarMoeda(totalGeral)}</span>
                        <div className="mt-3 mx-4 p-2 rounded bg-black border border-secondary text-center w-75">
                            <small className="text-white-50 small">Vendas + O.S. (Líquido)</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* ABAS DE DETALHES */}
            <ul className="nav nav-tabs nav-tabs-shark mb-4 border-0">
                <li className="nav-item">
                    <button className={`nav-link shark-tab ${abaAtiva === 'vendas' ? 'active' : ''}`} onClick={() => setAbaAtiva('vendas')}>Minhas Vendas</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link shark-tab ${abaAtiva === 'servicos' ? 'active' : ''}`} onClick={() => setAbaAtiva('servicos')}>Meus Serviços (O.S.)</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link shark-tab ${abaAtiva === 'pagamentos' ? 'active' : ''}`} onClick={() => setAbaAtiva('pagamentos')}>Pagamentos Recebidos</button>
                </li>
            </ul>

            <div className="tab-content pb-5">
                {abaAtiva === 'vendas' && (
                    <div className="table-responsive">
                        <table className="table table-dark table-hover align-middle mb-0">
                            <thead className="bg-black small text-muted">
                                <tr>
                                    <th className="ps-4">DATA</th>
                                    <th>CÓDIGO</th>
                                    <th>VALOR BRUTO</th>
                                    <th className="pe-4 text-end">SUA COMISSÃO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendas.map(v => (
                                    <tr key={v.id}>
                                        <td className="ps-4 text-white-50 val-mono">{formatarData(v.dataHora)}</td>
                                        <td className="text-info fw-bold">#V{v.id}</td>
                                        <td className="val-mono">{formatarMoeda(v.valorTotal)}</td>
                                        <td className="pe-4 text-end fw-bold text-info val-mono">{formatarMoeda(v.comissaoVendedorValor)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {abaAtiva === 'servicos' && (
                    <div className="table-responsive">
                        <table className="table table-dark table-hover align-middle mb-0">
                            <thead className="bg-black small text-muted">
                                <tr>
                                    <th className="ps-4">DATA</th>
                                    <th>O.S.</th>
                                    <th>PRODUTO/SERVIÇO</th>
                                    <th className="pe-4 text-end">SUA COMISSÃO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servicos.map(os => {
                                    const liq = (os.valorTotal || 0) - (os.custoPeca || 0);
                                    const comissao = liq * ((usuarioLogado?.comissaoOs || 0) / 100);
                                    return (
                                        <tr key={os.id}>
                                            <td className="ps-4 text-white-50 val-mono">{formatarData(os.data)}</td>
                                            <td className="text-success fw-bold">#{os.id}</td>
                                            <td>{os.produto}</td>
                                            <td className="pe-4 text-end fw-bold text-success val-mono">{formatarMoeda(comissao)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {abaAtiva === 'pagamentos' && (
                    <div className="table-responsive">
                        <table className="table table-dark table-hover align-middle mb-0">
                            <thead className="bg-black small text-muted">
                                <tr>
                                    <th className="ps-4">DATA</th>
                                    <th>VALOR PAGO</th>
                                    <th className="text-center">TIPO</th>
                                    <th className="pe-4 text-end">ADMIN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meusPagamentos.map(p => (
                                    <tr key={p.id}>
                                        <td className="ps-4 text-white-50 val-mono">{formatarData(p.dataHora)}</td>
                                        <td className="fw-bold text-success val-mono">{formatarMoeda(p.valorPago)}</td>
                                        <td className="text-center">
                                            <span className={`badge bg-dark border ${p.tipoComissao === 'VENDA' ? 'border-info text-info' : 'border-success text-success'}`}>
                                                {p.tipoComissao === 'VENDA' ? 'VENDAS' : 'ORDEM DE SERVIÇO'}
                                            </span>
                                        </td>
                                        <td className="pe-4 text-end text-white-50 small">{p.responsavelPagamento}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeuPainel;