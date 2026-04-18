import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Modal } from 'bootstrap';
import api from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeedback } from './context/FeedbackContext';
import { useNavigate } from 'react-router-dom';

/** Vite não expõe `window.bootstrap` pelo import do bundle; usar API ESM do pacote. */
const showBsModal = (el) => {
    if (!el) return;
    Modal.getOrCreateInstance(el).show();
};

const hideBsModal = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    Modal.getOrCreateInstance(el).hide();
};

const getApiErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (typeof data === 'object') {
        const values = Object.values(data).filter((v) => typeof v === 'string' && v.trim());
        if (values.length) return values.join(' | ');
    }
    return fallback;
};

const formatCnpj = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
    if (!digits) return '---';
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatWhatsapp = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (!digits) return '---';
    if (digits.length > 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length > 6) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length > 2) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    return digits;
};

const AdminEmpresa = ({ usuarioLogado }) => {
    const queryClient = useQueryClient();
    const { notify, confirmDialog } = useFeedback();
    const navigate = useNavigate();

    // --- ESTADOS COM TIPAGEM INICIAL CORRETA ---
    const [statusAssinatura, setStatusAssinatura] = useState({ qr_code: '', qr_code_base64: '', dias_anteriores: 0 });
    const [viewMP, setViewMP] = useState('selection');
    const [modalData, setModalData] = useState({
        id: 0,
        nome: '',
        role: '',
        roleOriginal: '',
        isRoot: false,
        comOs: 0,
        comVenda: 0,
        liqOs: 0,
        liqVenda: 0
    });
    const [nomeEmpresaInput, setNomeEmpresaInput] = useState('');
    const [cnpjInput, setCnpjInput] = useState('');
    const [whatsappEmpresaInput, setWhatsappEmpresaInput] = useState('');

    // --- 1. BUSCA DE DADOS (TIPAGEM SEGURA) ---
    const { data: adminData, isLoading } = useQuery({
        queryKey: ['admin-dados'],
        queryFn: async () => {
            const res = await api.get('/api/admin/funcionarios');
            return res.data;
        },
        placeholderData: { usuarios: [], pagamentos: [], empresa: {} }
    });

    // Resolvendo os "Unresolved variables" via useMemo
    const usuarios = useMemo(() => adminData?.usuarios || [], [adminData]);
    const pagamentos = useMemo(() => adminData?.pagamentos || [], [adminData]);
    const empresa = useMemo(() => adminData?.empresa || {}, [adminData]);

    useEffect(() => {
        setNomeEmpresaInput(empresa?.nome || '');
        setCnpjInput(empresa?.cnpj || '');
        setWhatsappEmpresaInput(empresa?.whatsapp || '');
    }, [empresa?.nome, empresa?.cnpj, empresa?.whatsapp]);

    // --- UTILITÁRIOS ---
    const forceCloseModals = useCallback(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(m => {
            m.classList.remove('show');
            (m).style.display = 'none';
        });
    }, []);

    const formatarMoeda = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const abrirModalComissao = (u) => {
        const liqOs = Number(u.totalComissaoOsAcumulada) || 0;
        const liqVenda = Number(u.saldoVendaCalculado) || 0;
        flushSync(() => {
            setModalData({
                id: Number(u.id),
                nome: u.nome || '',
                role: String(u.role || ''),
                roleOriginal: String(u.role || ''),
                isRoot: Boolean(u.isRoot),
                comOs: Number(u.comissaoOs) || 0,
                comVenda: Number(u.comissaoVenda) || 0,
                liqOs,
                liqVenda
            });
        });
        showBsModal(document.getElementById('modalComissao'));
    };

    const abrirModalRenovar = () => {
        flushSync(() => setViewMP('selection'));
        requestAnimationFrame(() => showBsModal(document.getElementById('modalRenovar')));
    };

    const abrirModalInfo = () => {
        requestAnimationFrame(() => showBsModal(document.getElementById('modalCnpj')));
    };

    const handleCnpjChange = (e) => {
        const raw = e.target.value.replace(/\D/g, '').substring(0, 14);
        let v = raw;
        if (raw.length > 2) v = raw.replace(/^(\d{2})(\d)/, '$1.$2');
        if (raw.length > 5) v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        if (raw.length > 8) v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        if (raw.length > 12) v = v.replace(/(\d{4})(\d)/, '$1-$2');
        setCnpjInput(v);
    };
    const handleEmpresaWhatsappChange = (e) => {
        const raw = e.target.value.replace(/\D/g, '').substring(0, 11);
        let v = raw;
        if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
        if (raw.length > 10) {
            v = `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7)}`;
        } else if (raw.length > 6) {
            v = `(${raw.substring(0, 2)}) ${raw.substring(2, 6)}-${raw.substring(6)}`;
        }
        setWhatsappEmpresaInput(v);
    };

    // --- 2. MUTAÇÕES (CORREÇÃO DE PROMISES E TYPES) ---
    const aprovarMutation = useMutation({
        mutationFn: (id) => api.post(`/api/admin/funcionarios/aprovar/${id}`),
        onSuccess: async () => {
            notify.success('Colaborador aprovado!', 'Sucesso');
            try {
                await queryClient.invalidateQueries({ queryKey: ['admin-dados'] });
            } catch {
                /* refetch opcional: o POST já concluiu; não esconder o toast de sucesso */
            }
        },
        onError: () => notify.error('Erro ao aprovar.', 'Erro')
    });

    const pagarMutation = useMutation({
        mutationFn: (payload) => api.post('/api/pagamentos/registrar', payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin-dados'] });
            notify.success('Pagamento registrado!', 'Sucesso');
        },
        onError: (err) => notify.error(getApiErrorMessage(err, 'Erro no pagamento.'), 'Erro')
    });

    const configMutation = useMutation({
        mutationFn: (data) => api.put(`/api/admin/funcionarios/configurar/${data.id}`, data.payload),
        onSuccess: async (_data, variables) => {
            const { id, payload } = variables;
            const novaRole = String(payload?.role ?? '').trim().toUpperCase();
            const roleLogadoNorm = String(usuarioLogado?.role || '').trim().toUpperCase();
            const logadoIsOwner = roleLogadoNorm.includes('OWNER');
            const alvoAntes = usuarios.find((u) => Number(u.id) === Number(id));
            const roleAnterior = String(alvoAntes?.role ?? '').toUpperCase();
            const eraAdminNaoRoot = roleAnterior.includes('ADMIN') && !alvoAntes?.isRoot;
            const foiRebaixadoOperacional =
                eraAdminNaoRoot &&
                novaRole &&
                (novaRole.includes('TECNICO') || novaRole.includes('VENDEDOR'));
            const selfId =
                usuarioLogado?.id != null
                    ? Number(usuarioLogado.id) === Number(id)
                    : usuarioLogado?.username &&
                      usuarios.some((u) => Number(u.id) === Number(id) && u.username === usuarioLogado.username);

            const perdeuAcessoPainelEmpresa =
                selfId &&
                novaRole &&
                (novaRole.includes('TECNICO') || novaRole.includes('VENDEDOR')) &&
                !logadoIsOwner;

            if (perdeuAcessoPainelEmpresa) {
                try {
                    const raw = localStorage.getItem('usuarioShark');
                    if (raw) {
                        const u = JSON.parse(raw);
                        u.role = payload.role;
                        localStorage.setItem('usuarioShark', JSON.stringify(u));
                    }
                } catch {
                    /* ignore */
                }
                queryClient.removeQueries({ queryKey: ['admin-dados'] });
                notify.success('Perfil atualizado. Redirecionando para o seu painel…', 'Sucesso');
                forceCloseModals();
                navigate('/meu-painel', { replace: true });
                return;
            }

            await queryClient.invalidateQueries({ queryKey: ['admin-dados'] });
            if (foiRebaixadoOperacional) {
                notify.warning('Administrador rebaixado para perfil operacional (técnico/vendedor).', 'Aviso');
            } else {
                notify.success('Configurações salvas!', 'Sucesso');
            }
            forceCloseModals();
        },
        onError: (err) => notify.error(getApiErrorMessage(err, 'Erro ao configurar.'), 'Erro')
    });

    const roleModal = String(modalData.role || '').toUpperCase();
    const perfilProtegido = roleModal.includes('OWNER') || ((roleModal.includes('ADMIN') || roleModal.includes('ROLE_ADMIN')) && modalData.isRoot);

    // --- 3. CÁLCULOS (ESTATÍSTICAS) ---
    const stats = useMemo(() => {
        const bruto = usuarios.reduce((acc, u) => acc + (Number(u.brutoVendaCalculado) || 0) + (Number(u.brutoOsCalculado) || 0), 0);
        const pendente = usuarios.reduce((acc, u) => acc + (Number(u.saldoVendaCalculado) || 0) + (Number(u.totalComissaoOsAcumulada) || 0), 0);
        return { bruto, pendente, total: usuarios.length };
    }, [usuarios]);

    // --- 4. RENOVAÇÃO / MERCADO PAGO ---
    const gerarPagamentoMP = async (dias) => {
        try {
            const res = await api.post(`/api/admin/empresa/gerar-renovacao?dias=${dias}`);
            setStatusAssinatura(res.data);
            setViewMP('qr');
            iniciarCheckPagamento(res.data.dias_anteriores || 0);
        } catch {
            notify.error('Erro ao gerar cobrança Mercado Pago.', 'Erro');
        }
    };

    const iniciarCheckPagamento = (diasAntigos) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/api/pagamentos/assinatura/status-check?diasAnteriores=${diasAntigos}`);
                if (res.data === true) {
                    clearInterval(interval);
                    notify.success('Assinatura atualizada! Recarregando…', 'Shark');
                    await queryClient.invalidateQueries({ queryKey: ['admin-dados'] });
                    forceCloseModals();
                    setViewMP('selection');
                }
            } catch (e) { console.error("Erro check pgto", e); }
        }, 5000);
    };

    return (
        <div className="mt-2 text-white pb-5">
            <div className="mb-4">
                <div>
                    <h2 className="fw-bold"><i className="bi bi-building text-info me-2"></i> Painel da empresa</h2>
                    <p className="text-white-50 small mb-0">Equipe, comissões, assinatura e dados da unidade.</p>
                </div>
            </div>
            {isLoading && (
                <div className="alert alert-info py-2 small">
                    <i className="bi bi-arrow-repeat me-2"></i>Sincronizando dados do painel...
                </div>
            )}

            <div className="card-ganhos-stats border-left-info p-4 mb-4" style={{ background: 'var(--shark-gradient-info)' }}>
                <div className="row align-items-center text-center text-md-start">
                    <div className="col-md-1 d-none d-md-block text-center"><i className="bi bi-building-fill-check text-info fs-1"></i></div>
                    <div className="col-md-3 border-end border-secondary border-opacity-25 ps-4">
                        <span className="label-mini text-info">Unidade</span>
                        <div className="fw-bold fs-5">{empresa?.nome || 'Shark'}</div>
                    </div>
                    <div className="col-md-2 border-end border-secondary border-opacity-25">
                        <span className="label-mini">CNPJ</span>
                        <div className="text-white-50 val-mono small">{formatCnpj(empresa?.cnpj)}</div>
                    </div>
                    <div className="col-md-2 border-end border-secondary border-opacity-25">
                        <span className="label-mini">WhatsApp</span>
                        {String(empresa?.whatsapp || '').replace(/\D/g, '').length >= 10 ? (
                            <a
                                href={`https://wa.me/55${String(empresa?.whatsapp || '').replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-info val-mono small text-decoration-none"
                            >
                                {formatWhatsapp(empresa?.whatsapp)}
                            </a>
                        ) : (
                            <div className="text-white-50 val-mono small">{formatWhatsapp(empresa?.whatsapp)}</div>
                        )}
                    </div>
                    <div className="col-md-2 border-end border-secondary border-opacity-25">
                        <span className="label-mini">Assinatura</span>
                        <div className="text-warning fw-bold val-mono" style={{fontSize: '0.7rem'}}>
                            {empresa?.diasRestantes || 0} DIAS RESTANTES
                        </div>
                    </div>
                    <div className="col-md-2 d-flex flex-column gap-2 ps-4">
                        <button type="button" className="btn btn-sm btn-warning fw-bold text-dark w-100" onClick={abrirModalRenovar}>RENOVAR AGORA</button>
                        <button type="button" className="btn btn-sm btn-outline-info fw-bold w-100" onClick={abrirModalInfo}>EDITAR INFORMAÇÕES</button>
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card-ganhos-stats border-left-info text-center">
                        <span className="label-mini">Faturamento Bruto</span>
                        <div className="val-mono fs-4">{formatarMoeda(stats.bruto)}</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-ganhos-stats border-left-success text-center">
                        <span className="label-mini">Comissões Pendentes</span>
                        <div className="val-mono fs-4 text-success">{formatarMoeda(stats.pendente)}</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-ganhos-stats border-left-warning text-center">
                        <span className="label-mini">Equipe Ativa</span>
                        <div className="val-mono fs-4">{stats.total}</div>
                    </div>
                </div>
            </div>

            <div className="shark-card border-left-info shadow-lg mb-5 overflow-hidden p-0">
                <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0 align-middle text-center">
                        <thead>
                        <tr>
                            <th className="ps-4 text-start py-3">Colaborador</th>
                            <th>Taxas</th>
                            <th>Bruto</th>
                            <th>Líquido</th>
                            <th style={{width: '280px'}}>Ação</th>
                            <th className="pe-4 text-end">Ajustes</th>
                        </tr>
                        </thead>
                        <tbody>
                        {usuarios.map(u => {
                            const liqOs = Number(u.totalComissaoOsAcumulada) || 0;
                            const liqVenda = Number(u.saldoVendaCalculado) || 0;
                            const brutoOs = Number(u.brutoOsCalculado) || 0;
                            const brutoVenda = Number(u.brutoVendaCalculado) || 0;
                            const saldoTotal = liqOs + liqVenda;

                            return (
                                <tr key={u.id}>
                                    <td className="ps-4 text-start">
                                        <div className="fw-bold text-white">{u.nome}</div>
                                        {u.isRoot && <span className="badge-proprietario ms-1">ROOT</span>}
                                        {!u.aprovado && <span className="badge bg-warning text-dark fw-bold ms-1" style={{fontSize: '0.6rem'}}>PENDENTE</span>}
                                    </td>
                                    <td className="small text-white-50">
                                        <div>Taxa OS: {Number(u.comissaoOs) || 0}%</div>
                                        <div>Taxa Vendas: {Number(u.comissaoVenda) || 0}%</div>
                                    </td>
                                    <td className="val-mono small text-white-50">
                                        <div>🛠️ {formatarMoeda(brutoOs)}</div>
                                        <div>🛒 {formatarMoeda(brutoVenda)}</div>
                                    </td>
                                    <td className="val-mono">
                                        <div className="text-success" style={{fontSize: '0.85rem'}}>🛠️ {formatarMoeda(liqOs)}</div>
                                        <div className="text-info" style={{fontSize: '0.85rem'}}>🛒 {formatarMoeda(liqVenda)}</div>
                                    </td>
                                    <td>
                                        {!u.aprovado ? (
                                            <button className="btn btn-sm btn-info fw-bold w-100" onClick={() => aprovarMutation.mutate(u.id)}>ACEITAR</button>
                                        ) : saldoTotal > 0.01 ? (
                                            <div className="d-flex flex-column gap-1">
                                                {liqVenda > 0.01 && <button className="btn btn-sm btn-info fw-bold py-1" onClick={() => pagarMutation.mutate({funcionarioId: u.id, valorPago: liqVenda, tipoComissao: 'VENDA'})}>VENDAS</button>}
                                                {liqOs > 0.01 && <button className="btn btn-sm btn-success fw-bold py-1" onClick={() => pagarMutation.mutate({funcionarioId: u.id, valorPago: liqOs, tipoComissao: 'OS'})}>SERVIÇOS</button>}
                                            </div>
                                        ) : <span className="text-success small fw-bold">ZERADO</span>}
                                    </td>
                                    <td className="pe-4 text-end">
                                        <div className="btn-group gap-1">
                                            <button type="button" className="btn btn-sm btn-outline-info" onClick={() => abrirModalComissao(u)}>
                                                <i className="bi bi-gear-fill"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" disabled={u.isRoot} onClick={async () => {
                                                const ok = await confirmDialog(`Deseja excluir ${u.nome}? Esta ação não pode ser desfeita.`, 'Excluir colaborador');
                                                if (!ok) return;
                                                try {
                                                    await api.delete(`/api/admin/funcionarios/${u.id}`);
                                                    await queryClient.invalidateQueries({ queryKey: ['admin-dados'] });
                                                    notify.success('Colaborador removido.', 'Sucesso');
                                                } catch {
                                                    notify.error('Não foi possível excluir.', 'Erro');
                                                }
                                            }}>
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

            {/* HISTÓRICO */}
            <div className="shark-card border-left-success p-0 mb-5" style={{background: 'rgba(0,0,0,0.2)'}}>
                <div className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold text-white mb-0 small text-uppercase">Movimentações Recentes</h5>
                </div>
                <div className="table-responsive">
                    <table className="table table-dark table-sm mb-0 align-middle text-center">
                        <thead className="text-muted">
                        <tr>
                            <th className="ps-4 text-start">DATA</th>
                            <th>RECEBEDOR</th>
                            <th>TIPO</th>
                            <th className="pe-4 text-end">VALOR</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pagamentos.slice(0, 10).map(p => (
                            <tr key={p.id}>
                                <td className="ps-4 text-white-50 val-mono small text-start">{new Date(p.dataHora).toLocaleString('pt-BR')}</td>
                                <td className="text-white">{p.funcionarioNome}</td>
                                <td><span className={`badge ${p.tipoComissao === 'VENDA' ? 'bg-info text-dark' : 'bg-success text-white'}`}>{p.tipoComissao}</span></td>
                                <td className="pe-4 text-end text-success fw-bold val-mono">{formatarMoeda(p.valorPago)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {createPortal(
                <>
                    {/* MODAL CONFIG TAXAS — em document.body evita conflito com backdrop-filter do main */}
                    <div className="modal fade" id="modalComissao" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content modal-shark-content p-4">
                                <div className="modal-header border-0 p-0 mb-3">
                                    <h5 className="text-white fw-bold">Configurar {modalData.nome}</h5>
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>
                                <div className="mb-3">
                                    <label className="label-mini mb-2">Perfil (role)</label>
                                    <select className="form-select" value={modalData.role} disabled={perfilProtegido} onChange={e => setModalData({...modalData, role: e.target.value})}>
                                        {(modalData.role || '').toUpperCase().includes('OWNER') && (
                                            <option value="ROLE_OWNER">Owner (ecossistema)</option>
                                        )}
                                        <option value="ROLE_VENDEDOR">Vendedor</option>
                                        <option value="ROLE_TECNICO">Técnico</option>
                                        <option value="ROLE_ADMIN">Administrador da unidade</option>
                                    </select>
                                    {perfilProtegido ? (
                                        <small className="text-warning d-block mt-2">Perfil protegido: cargo não pode ser alterado.</small>
                                    ) : null}
                                </div>
                                <div className="row g-2 mb-4">
                                    <div className="col-6">
                                        <label className="label-mini mb-2 text-info">Taxa OS (%)</label>
                                        <input type="number" className="form-control" value={modalData.comOs} onChange={e => setModalData({...modalData, comOs: Number(e.target.value)})} />
                                    </div>
                                    <div className="col-6">
                                        <label className="label-mini mb-2 text-info">Taxa Vendas (%)</label>
                                        <input type="number" className="form-control" value={modalData.comVenda} onChange={e => setModalData({...modalData, comVenda: Number(e.target.value)})} />
                                    </div>
                                </div>
                                <button type="button" className="btn btn-info fw-bold w-100 py-2 text-dark" onClick={() => {
                                    const mudouRole = String(modalData.role || '').trim().toUpperCase() !== String(modalData.roleOriginal || '').trim().toUpperCase();
                                    if (perfilProtegido && mudouRole) {
                                        notify.error('Perfil protegido não pode ter cargo alterado.', 'Bloqueado');
                                        return;
                                    }
                                    const payload = {
                                        comissaoOs: modalData.comOs,
                                        comissaoVenda: modalData.comVenda
                                    };
                                    if (!perfilProtegido) {
                                        payload.role = modalData.role;
                                    }
                                    configMutation.mutate({id: modalData.id, payload});
                                }}>SALVAR ALTERAÇÕES</button>
                            </div>
                        </div>
                    </div>

                    <div className="modal fade" id="modalRenovar" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content modal-shark-content p-4 text-center">
                                <div className="modal-header border-0 p-0 mb-3">
                                    <h5 className="text-white fw-bold">Renovação Shark PIX</h5>
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>
                                {viewMP === 'selection' ? (
                                    <div className="d-grid gap-2">
                                        <button type="button" className="btn btn-lg btn-primary fw-bold" onClick={() => gerarPagamentoMP(30)}>30 DIAS - R$ 60</button>
                                        <button type="button" className="btn btn-outline-info" onClick={() => gerarPagamentoMP(365)}>ANUAL (DESCONTO)</button>
                                    </div>
                                ) : (
                                    <>
                                        <img src={`data:image/jpeg;base64,${statusAssinatura.qr_code_base64}`} alt="QR" className="mb-3 bg-white p-2 rounded mx-auto d-block" style={{ width: '200px' }} />
                                        <div className="bg-black p-2 rounded small text-info val-mono mb-3" style={{wordBreak: 'break-all'}}>{statusAssinatura.qr_code}</div>
                                        <p className="small text-warning"><i className="bi bi-arrow-repeat spin me-2"></i>Aguardando PIX...</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal fade" id="modalCnpj" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content modal-shark-content p-4">
                                <div className="modal-header border-0 p-0 mb-3">
                                    <h5 className="text-white fw-bold">Editar informações da empresa</h5>
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>
                                <input type="text" className="form-control mb-3" value={nomeEmpresaInput} onChange={(e) => setNomeEmpresaInput(e.target.value)} placeholder="Nome da empresa" />
                                <input type="text" className="form-control mb-3 val-mono" value={cnpjInput} onChange={handleCnpjChange} placeholder="CNPJ (opcional)" />
                                <input type="text" className="form-control mb-3 val-mono" value={whatsappEmpresaInput} onChange={handleEmpresaWhatsappChange} placeholder="WhatsApp da empresa" />
                                <button type="button" className="btn btn-info fw-bold w-100" onClick={() => {
                                    if (!nomeEmpresaInput.trim()) {
                                        notify.error('Nome da empresa é obrigatório.', 'Empresa');
                                        return;
                                    }
                                    const cnpjDigits = String(cnpjInput || '').replace(/\D/g, '');
                                    const whatsappDigits = String(whatsappEmpresaInput || '').replace(/\D/g, '');
                                    if (cnpjDigits.length > 0 && cnpjDigits.length < 14) {
                                        notify.error('CNPJ incompleto. Informe os 14 dígitos.', 'Empresa');
                                        return;
                                    }
                                    if (whatsappDigits.length < 11) {
                                        notify.error('WhatsApp incompleto. Informe DDD + número (11 dígitos).', 'Empresa');
                                        return;
                                    }
                                    const payload = {
                                        nome: nomeEmpresaInput,
                                        cnpj: cnpjInput,
                                        whatsapp: whatsappEmpresaInput
                                    };
                                    api.post('/api/admin/empresa/atualizar-informacoes', payload)
                                        .then(async () => {
                                            await queryClient.invalidateQueries({queryKey:['admin-dados']});
                                            hideBsModal('modalCnpj');
                                            notify.success('Informações da empresa atualizadas.', 'Sucesso');
                                        })
                                        .catch(async (err) => {
                                            const msg = getApiErrorMessage(err, '');
                                            const rotaNovaIndisponivel =
                                                err?.response?.status === 404 ||
                                                (typeof msg === 'string' && msg.includes('No static resource api/admin/empresa/atualizar-informacoes'));
                                            if (rotaNovaIndisponivel) {
                                                try {
                                                    await api.post('/api/admin/empresa/atualizar-cnpj', { cnpj: payload.cnpj });
                                                    await queryClient.invalidateQueries({queryKey:['admin-dados']});
                                                    hideBsModal('modalCnpj');
                                                    notify.warning('Back antigo detectado: apenas CNPJ foi atualizado. Reinicie o backend para salvar nome e WhatsApp.', 'Empresa');
                                                    return;
                                                } catch (fallbackErr) {
                                                    notify.error(getApiErrorMessage(fallbackErr, 'Erro ao atualizar informações.'), 'Empresa');
                                                    return;
                                                }
                                            }
                                            notify.error(msg || 'Erro ao atualizar informações.', 'Empresa');
                                        });
                                }}>SALVAR</button>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default AdminEmpresa;