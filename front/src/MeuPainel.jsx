import React, { useState } from 'react';
import api from './api';
import { useQuery } from '@tanstack/react-query';
import { formatRoleLabel, normalizeRole } from './auth/accessRules';

const MeuPainel = ({ usuarioLogado }) => {
    const [abaAtiva, setAbaAtiva] = useState('vendas');

    // 🦈 SHARK SYNC: Busca dados em tempo real ignorando o cache antigo do localStorage
    const { data: extrato, isLoading } = useQuery({
        queryKey: ['meu-extrato'],
        queryFn: async () => {
            const res = await api.get('/api/usuarios/meu-extrato');
            return res.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const formatarMoeda = (valor) =>
        (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatarData = (data) =>
        data ? new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';

    const user = extrato?.usuario || usuarioLogado;
    const roleNorm = normalizeRole(user?.role);
    const badgeDestaque = roleNorm === 'ROLE_OWNER' || roleNorm === 'ROLE_ADMIN';
    const listaVendas = extrato?.vendas || [];
    const listaServicos = extrato?.servicos || [];
    const listaPagamentos = extrato?.pagamentos || [];

    const totalGeral = (user?.saldoVendaCalculado || 0) + (user?.totalComissaoOsAcumulada || 0);

    const imprimirOS = async (id) => {
        try {
            const response = await api.get(`/api/ordens/pdf/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `OS_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error('Erro ao gerar PDF da OS', e);
        }
    };

    return (
        <div className="mt-2 text-white">
            <div className="row mb-4">
                <div className="col-12">
                    <div>
                        <h2 className="shark-page-title fw-bold text-white mb-1"><i className="bi bi-person-badge me-2" style={{ color: '#0dcaf0' }}></i> Meu painel</h2>
                        <p className="text-white-50 small mb-0">Seus dados, comissões de vendas e O.S., pagamentos recebidos e histórico — tudo em um só lugar.</p>
                    </div>
                </div>
            </div>
            {isLoading && (
                <div className="alert alert-info py-2 small">
                    <i className="bi bi-arrow-repeat me-2"></i>Sincronizando Shark...
                </div>
            )}

            {/* INFO COLABORADOR SINCRONIZADA - WPP E CPF SEPARADOS */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card-ganhos-stats border-left-info" style={{ background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.9) 0%, rgba(2, 6, 23, 0.8) 100%)', padding: '1.5rem' }}>
                        <div className="row g-3 align-items-center">
                            <div className="col-md-3">
                                <span className="label-stats text-info">Colaborador</span>
                                <div className="text-white fw-bold">{user?.nome}</div>
                                <span className={`badge bg-dark border mt-1 ${badgeDestaque ? 'border-warning text-warning' : 'border-info text-info'}`} style={{ fontSize: '0.6rem' }}>
                                    <i className={`bi ${badgeDestaque ? 'bi-star-fill' : 'bi-tools'} me-1`}></i>
                                    {formatRoleLabel(user?.role)}
                                </span>
                            </div>
                            <div className="col-md-2">
                                <span className="label-stats">Login</span>
                                <div className="text-white-50 val-mono small">{user?.username}</div>
                            </div>
                            <div className="col-md-3">
                                <span className="label-stats">E-mail</span>
                                <div className="text-white-50 small">{user?.email || 'N/A'}</div>
                            </div>
                            <div className="col-md-2">
                                <span className="label-stats">WhatsApp</span>
                                <div className="text-white-50 val-mono small">{user?.whatsapp || '---'}</div>
                            </div>
                            <div className="col-md-2">
                                <span className="label-stats">CPF</span>
                                <div className="text-white-50 val-mono small">{user?.cpf || '---'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DASHBOARD COM TAXAS REAIS DO BANCO */}
            <div className="row g-3 mb-5 d-flex align-items-stretch">
                <div className="col-lg-8">
                    <div className="row g-3 h-100">
                        <div className="col-md-6">
                            <div className="card-ganhos-stats border-left-info">
                                <span className="label-stats text-info">Saldo Comissão Vendas</span>
                                <span className="valor-comissao text-info">{formatarMoeda(user?.saldoVendaCalculado)}</span>
                                <div className="info-aviso-card">Sua Taxa: {user?.comissaoVenda || 0}%</div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card-ganhos-stats border-left-success">
                                <span className="label-stats text-success">Saldo Comissão Serviços</span>
                                <span className="valor-comissao text-success">{formatarMoeda(user?.totalComissaoOsAcumulada)}</span>
                                <div className="info-aviso-card">Sua Taxa: {user?.comissaoOs || 0}%</div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card-ganhos-stats">
                                <span className="label-stats">Bruto Vendas</span>
                                <span className="valor-bruto">{formatarMoeda(user?.brutoVendaCalculado)}</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card-ganhos-stats">
                                <span className="label-stats">Bruto O.S.</span>
                                <span className="valor-bruto">{formatarMoeda(user?.brutoOsCalculado)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4 d-flex">
                    <div className="card-total-receber py-4 w-100">
                        <i className="bi bi-cash-stack text-warning fs-1 mb-2"></i>
                        <span className="label-stats text-warning" style={{ fontSize: '0.8rem' }}>Saldo Total a Receber</span>
                        <span className="valor-comissao text-warning" style={{ fontSize: '2.8rem' }}>{formatarMoeda(totalGeral)}</span>
                    </div>
                </div>
            </div>

            {/* TABELAS DE DETALHES */}
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
                    <div className="table-responsive shark-mobile-cards">
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
                            {listaVendas.map(v => (
                                <tr key={v.id}>
                                    <td className="ps-4 text-white-50 val-mono" data-label="Data">{formatarData(v.dataHora)}</td>
                                    <td className="text-info fw-bold" data-label="Código">#V{v.id}</td>
                                    <td className="val-mono" data-label="Valor bruto">{formatarMoeda(v.valorTotal)}</td>
                                    <td className="pe-4 text-end fw-bold text-info val-mono" data-label="Sua comissão">{formatarMoeda(v.comissaoVendedorValor)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {abaAtiva === 'servicos' && (
                    <div className="table-responsive shark-mobile-cards">
                        <table className="table table-dark table-hover align-middle mb-0">
                            <thead className="bg-black small text-muted">
                            <tr>
                                <th className="ps-4">DATA</th>
                                <th>O.S.</th>
                                <th>PRODUTO/SERVIÇO</th>
                                <th className="pe-4 text-end">SUA COMISSÃO</th>
                                <th className="pe-4 text-end">AÇÕES</th>
                            </tr>
                            </thead>
                            <tbody>
                            {listaServicos.map(os => {
                                const comissao = os.comissaoTecnicoValor ?? 0;
                                return (
                                    <tr key={os.id}>
                                        <td className="ps-4 text-white-50 val-mono" data-label="Data">{formatarData(os.dataPronto || os.data)}</td>
                                        <td className="text-success fw-bold" data-label="O.S.">#{os.id}</td>
                                        <td data-label="Produto / serviço">{os.produto}</td>
                                        <td className="pe-4 text-end fw-bold text-success val-mono" data-label="Sua comissão">{formatarMoeda(comissao)}</td>
                                        <td className="pe-4 text-end" data-label="Ações">
                                            <button className="btn btn-sm btn-outline-info" onClick={() => imprimirOS(os.id)}>
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}

                {abaAtiva === 'pagamentos' && (
                    <div className="table-responsive shark-mobile-cards">
                        <table className="table table-dark table-hover align-middle mb-0">
                            <thead className="bg-black small text-muted">
                            <tr>
                                <th className="ps-4">DATA</th>
                                <th>VALOR PAGO</th>
                                <th className="text-center">TIPO</th>
                                <th className="pe-4 text-end">RESPONSÁVEL</th>
                            </tr>
                            </thead>
                            <tbody>
                            {listaPagamentos.map(p => (
                                <tr key={p.id}>
                                    <td className="ps-4 text-white-50 val-mono" data-label="Data">{formatarData(p.dataHora)}</td>
                                    <td className="fw-bold text-success val-mono" data-label="Valor pago">{formatarMoeda(p.valorPago)}</td>
                                    <td className="text-center" data-label="Tipo">
                                            <span className={`badge bg-dark border ${p.tipoComissao === 'VENDA' ? 'border-info text-info' : 'border-success text-success'}`}>
                                                {p.tipoComissao}
                                            </span>
                                    </td>
                                    <td className="pe-4 text-end text-white-50 small" data-label="Responsável">{p.responsavelPagamento}</td>
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