import React, { useState, useMemo, useEffect } from 'react';
import api from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AdminEmpresa = ({ usuarioLogado }) => {
    const queryClient = useQueryClient();

    // Estados locais para controle de UI e Modais
    const [statusAssinatura, setStatusAssinatura] = useState({ qr_code: '', qr_code_base64: '', dias_anteriores: 0 });
    const [viewMP, setViewMP] = useState('selection'); // 'selection' ou 'qr'
    const [modalData, setModalData] = useState({ id: '', nome: '', tipo: '', comOs: 0, comVenda: 0, liqOs: 0, liqVenda: 0 });
    const [cnpjInput, setCnpjInput] = useState('');

    // 1. BUSCA DE DADOS GERAIS (Sincronizado com AdminController.java)
    const { data: adminData, isLoading } = useQuery({
        queryKey: ['admin-dados'],
        queryFn: async () => {
            const res = await api.get('/api/admin/funcionarios');
            return res.data;
        }
    });

    const usuarios = adminData?.usuarios || [];
    const pagamentos = adminData?.pagamentos || [];
    const empresa = adminData?.empresa || {};

    // Sincroniza o input de CNPJ quando os dados da empresa chegam do banco
    useEffect(() => {
        if (empresa.cnpj) setCnpjInput(empresa.cnpj);
    }, [empresa.cnpj]);

    // --- FUNÇÃO PARA LIMPAR TRAVAMENTOS DE MODAL DO BOOTSTRAP ---
    const forceCloseModals = () => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    };

    // 2. MUTAÇÕES (Ações de formulário)
    const pagarMutation = useMutation({
        mutationFn: (payload) => api.post('/api/pagamentos/registrar', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-dados'] });
            alert("Pagamento registrado com sucesso!");
        }
    });

    const configMutation = useMutation({
        mutationFn: (data) => api.put(`/api/admin/funcionarios/configurar/${data.id}`, {
            tipoFuncionario: data.payload.tipoFuncionario,
            comissaoOs: parseFloat(data.payload.comissaoOs || 0),
            comissaoVenda: parseFloat(data.payload.comissaoVenda || 0)
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-dados'] });
            alert("Configurações atualizadas!");
            document.querySelector('#modalComissao [data-bs-dismiss="modal"]')?.click();
            forceCloseModals();
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.response?.data || "Erro interno no servidor";
            alert("Erro ao salvar: " + msg);
        }
    });

    // 3. CÁLCULOS GERAIS
    const stats = useMemo(() => {
        const bruto = usuarios.reduce((acc, u) => acc + (u.brutoVendaCalculado || 0) + (u.brutoOsCalculado || 0), 0);
        const pendente = usuarios.reduce((acc, u) => acc + (u.saldoVendaCalculado || 0) + (u.totalComissaoOsAcumulada || 0), 0);
        return { bruto, pendente, total: usuarios.length };
    }, [usuarios]);

    const handleCnpjChange = (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        if (v.length > 5) v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        if (v.length > 8) v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        if (v.length > 12) v = v.replace(/(\d{4})(\d)/, '$1-$2');
        setCnpjInput(v.substring(0, 18));
    };

    const formatarMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Lógica Mercado Pago
    const gerarPagamentoMP = async (dias) => {
        try {
            const res = await api.post(`/api/admin/empresa/gerar-renovacao?dias=${dias}`);
            setStatusAssinatura(res.data);
            setViewMP('qr');
            iniciarCheckPagamento(res.data.dias_anteriores || 0);
        } catch (err) { alert("Erro ao conectar com Mercado Pago."); }
    };

    const iniciarCheckPagamento = (diasAntigos) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/api/pagamentos/assinatura/status-check?diasAnteriores=${diasAntigos}`);
                if (res.data === true) {
                    clearInterval(interval);
                    alert("🦈 SHARK ATUALIZADA!");
                    queryClient.invalidateQueries({ queryKey: ['admin-dados'] });
                    forceCloseModals();
                    window.location.reload();
                }
            } catch (e) { console.error("Erro check pgto", e); }
        }, 5000);
    };

    if (isLoading) return <div className="p-5 text-center text-info"><div className="spinner-border mb-2"></div><p>Sincronizando Shark...</p></div>;

    return (
        <div className="mt-2 text-white">
            <style>
                {`
                .shark-card { background: #1a1a1a; border-radius: 15px; border-left: 5px solid #333; transition: 0.3s; }
                .card-ganhos-stats { background: rgba(30, 41, 59, 0.6); border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.05); padding: 1rem; border-left: 4px solid #333; }
                .badge-proprietario { background: linear-gradient(45deg, #0047ab, #00d4ff); color: white; font-size: 0.6rem; padding: 2px 8px; border-radius: 20px; font-weight: 800; }
                .valor-mono { font-family: 'JetBrains Mono', monospace; font-weight: 700; }
                .label-mini { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
                .aviso-trava { font-size: 0.65rem; color: #ffc107; background: rgba(255, 193, 7, 0.1); padding: 8px; border-radius: 8px; border: 1px solid rgba(255, 193, 7, 0.2); }
                .modal-shark-content { background: #111 !important; border: 1px solid #444 !important; color: white !important; border-radius: 15px; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .modal-backdrop { display: none !important; }
                .modal { background: rgba(0, 0, 0, 0.85); }
                `}
            </style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold"><i className="bi bi-people-fill text-info me-2"></i> Gestão de Equipe</h2>
                    <p className="text-white-50 small mb-0">Shark Eletrônicos | Terminal de Liquidação Geral</p>
                </div>
                <div className="badge bg-dark border border-secondary p-2 valor-mono">
                    <i className="bi bi-calendar3 me-2 text-info"></i>{new Date().toLocaleDateString('pt-BR')}
                </div>
            </div>

            <div className="card-ganhos-stats border-left-info p-4 mb-4" style={{ background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.9) 0%, rgba(2, 6, 23, 0.8) 100%)' }}>
                <div className="row align-items-center">
                    <div className="col-md-1 d-none d-md-block text-center">
                        <i className="bi bi-building-fill-check text-info fs-1"></i>
                    </div>
                    <div className="col-md-4 border-end border-secondary border-opacity-25 ps-4">
                        <span className="label-mini text-info">Unidade / Razão Social</span>
                        <div className="fw-bold fs-5">{empresa.nome || 'Carregando...'}</div>
                        <span className="badge bg-dark border border-info text-info mt-1" style={{fontSize: '0.6rem'}}>CONTA ATIVA</span>
                    </div>
                    <div className="col-md-2 border-end border-secondary border-opacity-25">
                        <span className="label-mini">Documento (CNPJ)</span>
                        <div className="text-white-50 valor-mono">{empresa.cnpj || '---'}</div>
                    </div>
                    <div className="col-md-2 border-end border-secondary border-opacity-25">
                        <span className="label-mini">Plano Shark</span>
                        <div className="text-white-50 small">Premium Corporate</div>
                        <div className={empresa.diasRestantes <= 3 ? 'text-danger fw-bold valor-mono' : 'text-warning fw-bold valor-mono'} style={{fontSize: '0.7rem'}}>
                            {empresa.diasRestantes || 0} DIAS RESTANTES
                        </div>
                    </div>
                    <div className="col-md-3 d-flex flex-column gap-2 ps-4">
                        <button className="btn btn-sm btn-warning fw-bold text-dark w-100" data-bs-toggle="modal" data-bs-target="#modalRenovar" onClick={() => setViewMP('selection')}>
                            <i className="bi bi-lightning-charge-fill me-1"></i> RENOVAR AGORA
                        </button>
                        <button className="btn btn-sm btn-outline-info fw-bold w-100" data-bs-toggle="modal" data-bs-target="#modalCnpj">
                            <i className="bi bi-pencil-square me-1"></i> EDITAR CNPJ
                        </button>
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-5">
                <div className="col-md-4">
                    <div className="card-ganhos-stats border-left-info">
                        <span className="label-mini text-info"><i className="bi bi-graph-up-arrow me-1"></i> Faturamento Bruto Loja</span>
                        <span className="valor-mono fs-4">{formatarMoeda(stats.bruto)}</span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-ganhos-stats border-left-success">
                        <span className="label-mini text-success"><i className="bi bi-cash-stack me-1"></i> Comissões Pendentes</span>
                        <span className="valor-mono fs-4 text-success">{formatarMoeda(stats.pendente)}</span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-ganhos-stats border-left-warning">
                        <span className="label-mini text-warning"><i className="bi bi-person-check me-1"></i> Colaboradores Ativos</span>
                        <span className="valor-mono fs-4">{stats.total}</span>
                    </div>
                </div>
            </div>

            <div className="card shark-card border-left-info shadow-lg mb-5 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0 align-middle text-center">
                        <thead className="bg-black small text-muted text-uppercase">
                        <tr>
                            <th className="ps-4 text-start py-3">Colaborador</th>
                            <th>Bruto Acumulado</th>
                            <th>Taxa (%)</th>
                            <th>Líquido (Pendente)</th>
                            <th style={{width: '280px'}}>Ação Direta</th>
                            <th className="pe-4 text-end">Ajustes</th>
                        </tr>
                        </thead>
                        <tbody>
                        {usuarios.map(u => {
                            const liqOs = u.totalComissaoOsAcumulada || 0;
                            const liqVenda = u.saldoVendaCalculado || 0;
                            const saldoTotal = liqOs + liqVenda;

                            return (
                                <tr key={u.id}>
                                    <td className="ps-4 text-start">
                                        <div className="fw-bold text-white fs-6">{u.nome}</div>
                                        {!u.aprovado ? (
                                            <span className="badge bg-warning text-dark fw-bold" style={{fontSize: '0.6rem'}}>AGUARDANDO APROVAÇÃO</span>
                                        ) : (
                                            u.tipoFuncionario === 'PROPRIETARIO' ?
                                                <span className="badge-proprietario"><i className="bi bi-star-fill me-1"></i>PROPRIETÁRIO</span> :
                                                <span className="text-info-50 valor-mono small" style={{fontSize: '0.65rem'}}>{u.tipoFuncionario}</span>
                                        )}
                                    </td>
                                    <td className="valor-mono small text-white-50">
                                        <div>🛠️ {formatarMoeda(u.brutoOsCalculado || 0)}</div>
                                        <div>🛒 {formatarMoeda(u.brutoVendaCalculado || 0)}</div>
                                    </td>
                                    <td className="small text-info fw-bold">
                                        <div>🛠️ {u.comissaoOs || 0}%</div>
                                        <div>🛒 {u.comissaoVenda || 0}%</div>
                                    </td>
                                    <td className="valor-mono">
                                        <div className={liqOs > 0.01 ? 'text-success' : 'text-white-50'} style={{fontSize: '0.85rem'}}>🛠️ {formatarMoeda(liqOs)}</div>
                                        <div className={liqVenda > 0.01 ? 'text-info' : 'text-white-50'} style={{fontSize: '0.85rem'}}>🛒 {formatarMoeda(liqVenda)}</div>
                                    </td>
                                    <td>
                                        {!u.aprovado ? (
                                            <button className="btn btn-sm btn-info fw-bold w-100 py-2" onClick={() => api.post(`/api/admin/funcionarios/aprovar/${u.id}`).then(() => queryClient.invalidateQueries(['admin-dados']))}>ACEITAR NOVO</button>
                                        ) : saldoTotal > 0.01 ? (
                                            <div className="d-flex flex-column gap-1">
                                                {liqVenda > 0.01 && <button className="btn btn-sm btn-info fw-bold py-1" onClick={() => pagarMutation.mutate({funcionarioId: u.id, valorPago: liqVenda, tipoComissao: 'VENDA'})}>PAGAR VENDAS</button>}
                                                {liqOs > 0.01 && <button className="btn btn-sm btn-success fw-bold py-1" onClick={() => pagarMutation.mutate({funcionarioId: u.id, valorPago: liqOs, tipoComissao: 'OS'})}>PAGAR SERVIÇOS</button>}
                                            </div>
                                        ) : (
                                            <div className="bg-black border border-success border-opacity-25 rounded p-1">
                                                <span className="text-success fw-bold" style={{fontSize: '0.65rem'}}><i className="bi bi-check-all me-1"></i>SALDO ZERADO</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="pe-4 text-end">
                                        <div className="btn-group gap-1">
                                            <button className="btn btn-sm btn-outline-info" data-bs-toggle="modal" data-bs-target="#modalComissao" onClick={() => setModalData({ id: u.id, nome: u.nome, tipo: u.tipoFuncionario, comOs: u.comissaoOs, comVenda: u.comissaoVenda, liqOs, liqVenda })}>
                                                <i className="bi bi-gear-fill"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => { if(confirm(`Excluir ${u.nome}?`)) api.delete(`/api/admin/funcionarios/${u.id}`).then(() => queryClient.invalidateQueries(['admin-dados'])) }}>
                                                <i className="bi bi-person-x-fill"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* HISTÓRICO DE MOVIMENTAÇÕES */}
            <div className="card shark-card border-left-success p-0 mb-5" style={{background: 'rgba(0,0,0,0.4)'}}>
                <div className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold text-white mb-0 small text-uppercase"><i className="bi bi-clock-history me-2 text-success"></i> Histórico de Movimentações Recentes</h5>
                </div>
                <div className="table-responsive">
                    <table className="table table-dark table-sm mb-0 align-middle text-center">
                        <thead className="bg-black text-muted">
                        <tr>
                            <th className="ps-4 py-2">DATA</th>
                            <th>PAGADOR</th>
                            <th>RECEBEDOR</th>
                            <th>TIPO</th>
                            <th className="pe-4 text-end">VALOR</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pagamentos.map(p => (
                            <tr key={p.id}>
                                <td className="ps-4 py-3 text-white-50 valor-mono small">{new Date(p.dataHora).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</td>
                                <td className="fw-bold text-info">SISTEMA SHARK</td>
                                <td className="text-white">{p.funcionarioNome}</td>
                                <td><span className={`badge ${p.tipoComissao === 'VENDA' ? 'bg-info text-dark' : 'bg-success text-white'} px-2`} style={{fontSize:'0.6rem'}}>{p.tipoComissao}</span></td>
                                <td className="pe-4 text-end text-success fw-bold valor-mono fs-6">{formatarMoeda(p.valorPago)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CONFIGURAÇÃO TAXAS */}
            <div className="modal fade" id="modalComissao" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content modal-shark-content p-4">
                        <div className="modal-header border-0 p-0 mb-3">
                            <h5 className="text-white fw-bold">Configurar {modalData.nome}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={forceCloseModals}></button>
                        </div>
                        {(modalData.liqOs > 0.01 || modalData.liqVenda > 0.01) && (
                            <div className="aviso-trava mb-3 text-center">
                                <i className="bi bi-lock-fill me-1"></i> Taxas bloqueadas. Liquide os saldos pendentes antes de alterar as porcentagens.
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="label-mini mb-2">Função do Colaborador</label>
                            <select className="form-select bg-black text-white border-secondary" value={modalData.tipo} onChange={e => setModalData({...modalData, tipo: e.target.value})}>
                                <option value="VENDEDOR">VENDEDOR</option>
                                <option value="TECNICO">TÉCNICO</option>
                                <option value="PROPRIETARIO">PROPRIETÁRIO</option>
                            </select>
                        </div>
                        <div className="row g-2 mb-4">
                            <div className="col-6">
                                <label className="label-mini mb-2 text-info">Taxa OS (%)</label>
                                <input type="number" className="form-control bg-black text-white border-secondary" disabled={modalData.liqOs > 0.01} value={modalData.comOs} onChange={e => setModalData({...modalData, comOs: e.target.value})} />
                            </div>
                            <div className="col-6">
                                <label className="label-mini mb-2 text-info">Taxa Vendas (%)</label>
                                <input type="number" className="form-control bg-black text-white border-secondary" disabled={modalData.liqVenda > 0.01} value={modalData.comVenda} onChange={e => setModalData({...modalData, comVenda: e.target.value})} />
                            </div>
                        </div>
                        <button className="btn btn-info fw-bold w-100 py-2 text-dark" disabled={modalData.liqOs > 0.01 || modalData.liqVenda > 0.01} onClick={() => configMutation.mutate({id: modalData.id, payload: {tipoFuncionario: modalData.tipo, comissaoOs: modalData.comOs, comVenda: modalData.comVenda}})}>SALVAR ALTERAÇÕES</button>
                    </div>
                </div>
            </div>

            {/* MODAL RENOVAÇÃO */}
            <div className="modal fade" id="modalRenovar" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content modal-shark-content p-4 text-center">
                        <div className="modal-header border-0 p-0 mb-3">
                            <h5 className="text-white fw-bold">Renovação Shark PIX</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={forceCloseModals}></button>
                        </div>
                        {viewMP === 'selection' ? (
                            <div className="d-grid gap-2">
                                <button className="btn btn-lg btn-primary fw-bold" onClick={() => gerarPagamentoMP(30)}>RENOVAR 30 DIAS - R$ 60,00</button>
                                <button className="btn btn-outline-info" onClick={() => gerarPagamentoMP(365)}>PLANO ANUAL (DESCONTO)</button>
                            </div>
                        ) : (
                            <>
                                <img src={`data:image/jpeg;base64,${statusAssinatura.qr_code_base64}`} alt="QR Code" className="mb-3 bg-white p-2 rounded" style={{ width: '200px' }} />
                                <div className="bg-black p-2 rounded small text-info valor-mono mb-3" style={{wordBreak: 'break-all'}}>{statusAssinatura.qr_code}</div>
                                <p className="small text-warning"><i className="bi bi-arrow-repeat spin me-2"></i>Aguardando confirmação...</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL CNPJ */}
            <div className="modal fade" id="modalCnpj" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content modal-shark-content p-4">
                        <div className="modal-header border-0 p-0 mb-3">
                            <h5 className="text-white fw-bold">Atualizar CNPJ</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={forceCloseModals}></button>
                        </div>
                        <input type="text" className="form-control bg-black text-white border-secondary mb-3 valor-mono" value={cnpjInput} onChange={handleCnpjChange} placeholder="00.000.000/0000-00" />
                        <button className="btn btn-info fw-bold w-100" onClick={() => {
                            if (!cnpjInput || cnpjInput.trim() === "") { alert("Informe o CNPJ"); return; }
                            api.post('/api/admin/empresa/atualizar-cnpj', { cnpj: cnpjInput })
                                .then(() => {
                                    queryClient.invalidateQueries(['admin-dados']);
                                    forceCloseModals();
                                    alert('🦈 Shark Atualizada: CNPJ salvo com sucesso!');
                                })
                                .catch(err => {
                                    console.error(err);
                                    const msg = err.response?.data?.message || err.response?.data || err.message;
                                    alert("Erro ao atualizar: " + msg);
                                });
                        }}>SALVAR DOCUMENTO</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEmpresa;