import React, { useState, useEffect, useMemo } from 'react';
import api from './api';
import { useFeedback } from './context/FeedbackContext';

const Contas = ({ usuarioLogado }) => {
    const { notify, confirmDialog } = useFeedback();
    const [contas, setContas] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [resumo, setResumo] = useState({
        totalMes: 0,
        totalPago: 0,
        totalPendente: 0,
        totalVencido: 0
    });
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        descricao: '',
        diaVencimento: '',
        valor: '',
        recorrente: false
    });

    const hoje = new Date();
    const mesAtual = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            // 🔥 CORREÇÃO: Chamada única para o novo endpoint unificado
            const res = await api.get('/api/contas');

            // O Java agora retorna um Map com "contas", "resumo" e "historicoPagas"
            setContas(res.data.contas || []);
            setResumo(res.data.resumo || resumo);
            setHistorico(res.data.historicoPagas || []);

            setLoading(false);
        } catch (err) {
            console.error("Erro ao carregar contas", err);
            setLoading(false);
        }
    };

    // --- AÇÕES ---
    const handleSalvar = async (e) => {
        e.preventDefault();
        try {
            // Enviando o formData para /api/contas/salvar
            await api.post('/api/contas/salvar', formData);
            setFormData({ descricao: '', diaVencimento: '', valor: '', recorrente: false });
            carregarDados();
        } catch (err) {
            notify.error('Erro ao lançar conta.', 'Contas');
        }
    };

    const handlePagar = async (id) => {
        try {
            // Corrigido para bater no endpoint do novo Controller
            await api.post(`/api/contas/pagar/${id}`);
            carregarDados();
            notify.success('Pagamento registrado.', 'Contas');
        } catch (err) {
            notify.error('Erro ao processar pagamento.', 'Contas');
        }
    };

    const handleDeletar = async (id) => {
        const ok = await confirmDialog('Deseja apagar este lançamento?', 'Excluir');
        if (!ok) return;
        try {
            await api.delete(`/api/contas/deletar/${id}`);
            carregarDados();
            notify.success('Lançamento removido.', 'Contas');
        } catch (err) {
            notify.error('Erro ao excluir.', 'Contas');
        }
    };

    const formatarMoeda = (valor) => {
        return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatarData = (dataStr) => {
        if (!dataStr) return "---";
        return new Date(dataStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="mt-2 text-white">
            <div className="mb-4">
                <h2 className="fw-bold mb-0">
                    <i className="bi bi-calendar-check glow-info me-2" style={{ color: '#0dcaf0' }}></i> CONTAS DE {mesAtual.toUpperCase()}
                </h2>
                <p className="text-white-50 small">Gestão financeira da Shark Eletrônicos</p>
            </div>

            {/* CARDS FINANCEIROS - AGORA USANDO res.data.resumo vindo do Java */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card shark-stat-card border-left-info px-4 py-3" style={{ background: 'rgba(13, 202, 240, 0.05)' }}>
                        <span className="text-info small fw-bold text-uppercase">Total Contas</span>
                        <h3 className="fw-bold">{formatarMoeda(resumo.totalMes)}</h3>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shark-stat-card border-left-success px-4 py-3" style={{ background: 'rgba(25, 135, 84, 0.05)' }}>
                        <span className="text-success small fw-bold text-uppercase">Total Pago</span>
                        <h3 className="fw-bold">{formatarMoeda(resumo.totalPago)}</h3>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shark-stat-card border-left-info px-4 py-3" style={{ borderLeftColor: '#ffc107', background: 'rgba(255, 193, 7, 0.05)' }}>
                        <span className="small fw-bold text-uppercase" style={{ color: '#ffc107' }}>Total Pendente</span>
                        <h3 className="fw-bold">{formatarMoeda(resumo.totalPendente)}</h3>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shark-stat-card border-left-danger px-4 py-3" style={{ background: resumo.totalVencido > 0 ? 'rgba(220, 53, 69, 0.2)' : 'rgba(220, 53, 69, 0.05)' }}>
                        <span className="text-danger small fw-bold text-uppercase">Total Vencido</span>
                        <h3 className="fw-bold">{formatarMoeda(resumo.totalVencido)}</h3>
                    </div>
                </div>
            </div>

            {/* FORMULÁRIO DE LANÇAMENTO */}
            <div className="card shark-stat-card border-left-info shadow-lg mb-5" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                <div className="card-body p-4">
                    <p className="small text-info mb-3"><i className="bi bi-info-circle-fill me-1"></i> Lançamento rápido: Informe o dia, o sistema cuidará do mês e ano atuais.</p>
                    <form onSubmit={handleSalvar} className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <label className="text-info small fw-bold">DESCRIÇÃO</label>
                            <input className="form-control bg-black text-white border-secondary" placeholder="Ex: Aluguel"
                                   value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} required />
                        </div>
                        <div className="col-md-2">
                            <label className="text-info small fw-bold">DIA VENC.</label>
                            <input type="number" min="1" max="31" className="form-control bg-black text-white border-secondary" placeholder="01"
                                   value={formData.diaVencimento} onChange={e => setFormData({...formData, diaVencimento: e.target.value})} required />
                        </div>
                        <div className="col-md-2">
                            <label className="text-info small fw-bold">VALOR (R$)</label>
                            <input type="number" step="0.01" className="form-control bg-black text-white border-secondary" placeholder="0.00"
                                   value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} required />
                        </div>
                        <div className="col-md-2 text-center pb-2">
                            <div className="form-check form-switch d-inline-block">
                                <input className="form-check-input" type="checkbox" checked={formData.recorrente}
                                       onChange={e => setFormData({...formData, recorrente: e.target.checked})} />
                                <label className="form-check-label small fw-bold text-uppercase ms-2">Recorrente</label>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <button type="submit" className="btn btn-info w-100 fw-bold">LANÇAR</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* TABELA PENDÊNCIAS */}
            <h5 className="text-white small fw-bold mb-3 text-uppercase"><i className="bi bi-list-task me-2 text-info"></i> Pendências deste mês</h5>
            <div className="card bg-dark border-0 rounded-4 overflow-hidden mb-5" style={{ borderLeft: '5px solid #0dcaf0' }}>
                <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0 align-middle text-center">
                        <thead className="bg-black text-muted small text-uppercase">
                        <tr>
                            <th className="ps-4 text-start">DESCRIÇÃO</th>
                            <th>VENCIMENTO</th>
                            <th>VALOR</th>
                            <th>STATUS</th>
                            <th>TIPO</th>
                            <th>AÇÕES</th>
                        </tr>
                        </thead>
                        <tbody>
                        {contas.map(c => {
                            const venc = new Date(c.dataVencimento);
                            venc.setHours(23, 59, 59);
                            const isVencida = !c.paga && venc < hoje;
                            return (
                                <tr key={c.id}>
                                    <td className="ps-4 text-start fw-bold">{c.descricao}</td>
                                    <td>{formatarData(c.dataVencimento)}</td>
                                    <td className="text-danger fw-bold">{formatarMoeda(c.valor)}</td>
                                    <td>
                                        {c.paga ? <span className="status-pago">PAGO</span> :
                                            isVencida ? <span className="status-vencida">VENCIDA</span> :
                                                <span className="status-pendente">PENDENTE</span>}
                                    </td>
                                    <td>
                                            <span className={`badge border ${c.recorrente ? 'border-info text-info' : 'border-secondary text-secondary'}`}>
                                                {c.recorrente ? 'RECORRENTE' : 'ÚNICA'}
                                            </span>
                                    </td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-2">
                                            {!c.paga && (
                                                <button onClick={() => handlePagar(c.id)} className={`btn btn-sm fw-bold ${isVencida ? 'btn-danger' : 'btn-success'}`}>
                                                    PAGAR
                                                </button>
                                            )}
                                            <button onClick={() => handleDeletar(c.id)} className="btn-delete-ghost"><i className="bi bi-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* HISTÓRICO */}
            <h5 className="text-white-50 small fw-bold mb-3 text-uppercase"><i className="bi bi-clock-history me-2 text-success"></i> Histórico de Pagamentos</h5>
            <div className="card bg-dark border-0 rounded-4 overflow-hidden table-paga" style={{ borderLeft: '5px solid #198754', opacity: 0.8 }}>
                <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0 align-middle text-center">
                        <thead className="bg-black text-muted small">
                        <tr>
                            <th className="ps-4 text-start">DESCRIÇÃO</th>
                            <th>DATA PAGAMENTO</th>
                            <th>VALOR PAGO</th>
                            <th>OPERADOR</th>
                            <th>AÇÕES</th>
                        </tr>
                        </thead>
                        <tbody>
                        {historico.map(h => (
                            <tr key={h.id}>
                                <td className="ps-4 text-start text-white-50">{h.descricao}</td>
                                <td className="text-info fw-bold">{new Date(h.dataPagamento).toLocaleString('pt-BR')}</td>
                                <td className="text-white-50 fw-bold">{formatarMoeda(h.valor)}</td>
                                <td>{h.usuarioPagador || 'SISTEMA'}</td>
                                <td>
                                    <button onClick={() => handleDeletar(h.id)} className="btn-delete-ghost"><i className="bi bi-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Contas;