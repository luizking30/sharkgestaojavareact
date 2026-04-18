import React, { useMemo, useState } from 'react';
import api from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeedback } from './context/FeedbackContext';

const norm = (s) => String(s ?? '').toLowerCase().trim();
const soDigitos = (s) => String(s ?? '').replace(/\D/g, '');

function empresaOuUsuarioMatch(emp, qRaw) {
    const q = norm(qRaw);
    const qd = soDigitos(qRaw);
    if (!q && !qd) return true;

    if (norm(emp.nome).includes(q)) return true;
    if (soDigitos(emp.cnpj).includes(qd) && qd.length > 0) return true;
    if (soDigitos(emp.whatsapp).includes(qd) && qd.length > 0) return true;
    if (norm(emp.whatsappExibicao).includes(q)) return true;

    const usuarios = emp.usuarios || [];
    return usuarios.some((u) => {
        if (norm(u.nome).includes(q)) return true;
        if (norm(u.username).includes(q)) return true;
        if (norm(u.email).includes(q)) return true;
        if (soDigitos(u.cpf).includes(qd) && qd.length > 0) return true;
        if (soDigitos(u.whatsapp).includes(qd) && qd.length > 0) return true;
        if (norm(u.role).includes(q)) return true;
        return false;
    });
}

const SuperAdmin = () => {
    const queryClient = useQueryClient();
    const { notify, confirmDialog, promptDialog } = useFeedback();
    const [filtro, setFiltro] = useState('');

    const { data: empresas, isLoading: loadingEmp } = useQuery({
        queryKey: ['super-admin-empresas'],
        queryFn: async () => {
            const res = await api.get('/api/super-admin/empresas/detalhes');
            return res.data;
        },
    });

    const { data: financeiro, isLoading: loadingFin } = useQuery({
        queryKey: ['super-admin-financeiro-mes'],
        queryFn: async () => {
            const res = await api.get('/api/super-admin/financeiro/mes-atual');
            return res.data;
        },
    });

    const addDiasMutation = useMutation({
        mutationFn: ({ id, dias }) => api.post(`/api/super-admin/empresas/adicionar-dias/${id}?quantidade=${dias}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-empresas'] });
            notify.success('Dias adicionados com sucesso.', 'Super admin');
        },
    });

    const bloquearMutation = useMutation({
        mutationFn: (id) => api.post(`/api/super-admin/empresas/bloquear/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-empresas'] });
            notify.warning('Acesso da empresa suspenso.', 'Super admin');
        },
    });

    const deleteEmpresaMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/super-admin/empresas/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-empresas'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin-financeiro-mes'] });
            notify.success('Empresa e dados vinculados foram removidos.', 'Super admin');
        },
        onError: (err) => {
            const msg = err?.response?.data ?? err?.message ?? 'Falha ao excluir empresa.';
            notify.error(typeof msg === 'string' ? msg : 'Falha ao excluir empresa.', 'Erro');
        },
    });

    const deleteUsuarioMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/super-admin/usuarios/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-empresas'] });
            notify.success('Usuário removido.', 'Super admin');
        },
        onError: (err) => {
            const msg = err?.response?.data ?? err?.message ?? 'Falha ao excluir usuário.';
            notify.error(typeof msg === 'string' ? msg : 'Falha ao excluir usuário.', 'Erro');
        },
    });

    const empresasFiltradas = useMemo(() => {
        if (!empresas?.length) return [];
        return empresas.filter((e) => empresaOuUsuarioMatch(e, filtro));
    }, [empresas, filtro]);

    const totalMes = financeiro?.totalRecebidoMes ?? 0;
    const mesRef = financeiro?.mesReferencia ?? '';
    const pagamentosMes = financeiro?.pagamentos ?? [];

    const fmtMoney = (v) =>
        Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const isLoading = loadingEmp || loadingFin;

    if (isLoading) {
        return (
            <div className="p-5 text-center text-info">
                <div className="spinner-border mb-3"></div>
                <h5>Mapeando ecossistema Shark...</h5>
            </div>
        );
    }

    return (
        <div className="mt-2 text-white">
            <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
                <div>
                    <h2 className="shark-page-title fw-bold text-warning">
                        <i className="bi bi-crown-fill me-2"></i> Painel Global (Fundador)
                    </h2>
                    <p className="text-white-50 small mb-0">
                        Apenas ROLE_OWNER — Mercado Pago, empresas e colaboradores.
                    </p>
                </div>
                <div className="col-12 col-md-6 col-lg-5">
                    <label className="form-label small text-white-50 mb-1">Buscar empresa ou usuário</label>
                    <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="Nome da empresa, CNPJ, WhatsApp, nome de usuário, e-mail, CPF…"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
            </div>

            <div className="row g-3 mb-4 text-center">
                <div className="col-12 col-md-4">
                    <div className="card-super p-3">
                        <span className="text-muted small d-block">TOTAL EMPRESAS</span>
                        <span className="fs-3 fw-bold text-info">{empresas?.length}</span>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card-super p-3">
                        <span className="text-muted small d-block">FATURAMENTO SAAS (MP — mês {mesRef})</span>
                        <span className="fs-3 fw-bold text-success">{fmtMoney(totalMes)}</span>
                        <div className="small text-white-50 mt-1">Soma dos webhooks aprovados registrados no backend</div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card-super p-3">
                        <span className="text-muted small d-block">SITUAÇÃO GERAL</span>
                        <span className="fs-3 fw-bold text-warning">ESTÁVEL</span>
                    </div>
                </div>
            </div>

            <div className="card card-super shadow-lg mb-4 overflow-hidden">
                <div className="card-header bg-black border-secondary py-3">
                    <h6 className="mb-0 text-info">
                        <i className="bi bi-credit-card me-2"></i>
                        Pagamentos recebidos (Mercado Pago) — mês atual
                    </h6>
                </div>
                <div className="table-responsive shark-mobile-cards">
                    <table className="table table-dark table-hover mb-0 align-middle small">
                        <thead className="bg-black text-muted text-uppercase">
                            <tr>
                                <th className="ps-3">Data / hora</th>
                                <th>Valor</th>
                                <th>Quem pagou</th>
                                <th>E-mail</th>
                                <th>Empresa</th>
                                <th className="text-center">Dias creditados</th>
                                <th className="pe-3">ID MP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagamentosMes.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted py-4">
                                        Nenhum pagamento registrado neste mês. Os próximos webhooks aprovados aparecem aqui.
                                    </td>
                                </tr>
                            )}
                            {pagamentosMes.map((p) => (
                                <tr key={p.id}>
                                    <td className="ps-3 val-mono" data-label="Data / hora">{p.dataHora ?? '—'}</td>
                                    <td className="fw-semibold text-success" data-label="Valor">{fmtMoney(p.valor)}</td>
                                    <td data-label="Quem pagou">{p.pagadorNome ?? '—'}</td>
                                    <td className="val-mono" data-label="E-mail">{p.pagadorEmail ?? '—'}</td>
                                    <td data-label="Empresa">
                                        <span className="fw-semibold">{p.empresaNome ?? '—'}</span>
                                        {p.empresaId != null && (
                                            <span className="text-muted small d-block">ID #{p.empresaId}</span>
                                        )}
                                    </td>
                                    <td className="text-center" data-label="Dias creditados">{p.diasCreditados ?? '—'}</td>
                                    <td className="pe-3 val-mono" data-label="ID MP">{p.mpPaymentId ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="d-flex flex-column gap-4">
                {empresasFiltradas?.map((emp) => (
                    <div key={emp.id} className="card card-super shadow-lg overflow-hidden">
                        <div className="card-header bg-black border-secondary d-flex flex-wrap justify-content-between align-items-start gap-2 py-3">
                            <div>
                                <h5 className="mb-1 text-warning fw-bold">{emp.nome}</h5>
                                <div className="small text-white-50">
                                    <span className="val-mono">ID #{emp.id}</span>
                                    {' · '}
                                    <span className="val-mono">CNPJ {emp.cnpj}</span>
                                </div>
                                <div className="small mt-2">
                                    <span className="text-white-50">WhatsApp da empresa: </span>
                                    <span className="text-white fw-semibold">{emp.whatsappExibicao ?? emp.whatsapp ?? 'Não cadastrado'}</span>
                                </div>
                                <div className="small mt-1">
                                    Cadastro empresa:{' '}
                                    <span className="text-info">{emp.dataCadastroEmpresa ?? '—'}</span>
                                    {' · '}
                                    <span className="text-white-50">{emp.diasDesdeCadastroEmpresa ?? 0} dias desde cadastro</span>
                                    {' · '}
                                    <span className={`badge ${emp.ativo ? 'bg-success' : 'bg-secondary'}`}>
                                        {emp.ativo ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-end d-flex flex-column align-items-end gap-1">
                                <span className={`badge ${emp.diasRestantes > 3 ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                    Plano: {emp.diasRestantes} dias
                                </span>
                                <div className="btn-group btn-group-sm flex-wrap justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-success btn-super-action"
                                        onClick={async () => {
                                            const d = await promptDialog('Quantidade de dias de bônus.', 'Adicionar dias', '30');
                                            if (d != null && String(d).trim()) {
                                                addDiasMutation.mutate({ id: emp.id, dias: String(d).trim() });
                                            }
                                        }}
                                    >
                                        + DIAS
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-warning btn-super-action"
                                        onClick={async () => {
                                            const ok = await confirmDialog(`Bloquear acesso de ${emp.nome} (zerar dias)?`, 'Suspender');
                                            if (ok) bloquearMutation.mutate(emp.id);
                                        }}
                                    >
                                        BLOQUEAR
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-super-action"
                                        onClick={async () => {
                                            const ok = await confirmDialog(
                                                `EXCLUIR PERMANENTEMENTE a empresa "${emp.nome}" e todos os dados (vendas, OS, usuários)? Esta ação não tem volta.`,
                                                'Excluir empresa'
                                            );
                                            if (ok) deleteEmpresaMutation.mutate(emp.id);
                                        }}
                                    >
                                        EXCLUIR EMPRESA
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div className="px-3 py-2 bg-black bg-opacity-25 border-bottom border-secondary small text-white-50">
                                Colaboradores / usuários vinculados a esta empresa ({(emp.usuarios || []).length})
                            </div>
                            <div className="table-responsive shark-mobile-cards">
                                <table className="table table-dark table-hover mb-0 align-middle">
                                    <thead className="bg-black text-muted small text-uppercase">
                                        <tr>
                                            <th className="ps-4 py-2">Usuário</th>
                                            <th>CPF</th>
                                            <th>WhatsApp</th>
                                            <th>E-mail</th>
                                            <th className="text-center">Cargo</th>
                                            <th className="text-center">Dias na plataforma</th>
                                            <th className="text-center">Dias plano (empresa)</th>
                                            <th className="text-center">Status</th>
                                            <th className="pe-4 text-end">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(emp.usuarios || []).map((u) => (
                                            <tr key={u.id}>
                                                <td className="ps-4" data-label="Usuário">
                                                    <div className="fw-semibold">{u.nome}</div>
                                                    <span className="text-muted small val-mono">@{u.username}</span>
                                                    {u.isRoot && (
                                                        <span className="badge bg-warning text-dark ms-1 small">root</span>
                                                    )}
                                                </td>
                                                <td className="val-mono small" data-label="CPF">{u.cpf}</td>
                                                <td className="val-mono small" data-label="WhatsApp">{u.whatsapp}</td>
                                                <td className="small" data-label="E-mail">{u.email}</td>
                                                <td className="text-center small" data-label="Cargo">{u.role}</td>
                                                <td className="text-center" data-label="Dias na plataforma">{u.diasNaPlataforma ?? '—'}</td>
                                                <td className="text-center" data-label="Dias plano">{u.diasPlanoEmpresa ?? '—'}</td>
                                                <td className="text-center" data-label="Status">
                                                    <span className={`badge ${u.aprovado ? 'bg-success' : 'bg-secondary'}`}>
                                                        {u.aprovado ? 'Aprovado' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="pe-4 text-end" data-label="Ações">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger btn-super-action"
                                                        disabled={u.id === 1}
                                                        title={u.id === 1 ? 'Fundador (id 1) não pode ser excluído' : 'Excluir usuário'}
                                                        onClick={async () => {
                                                            const ok = await confirmDialog(
                                                                `Excluir o usuário "${u.nome}"?`,
                                                                'Excluir usuário'
                                                            );
                                                            if (ok) deleteUsuarioMutation.mutate(u.id);
                                                        }}
                                                    >
                                                        Excluir
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {(!emp.usuarios || emp.usuarios.length === 0) && (
                                <div className="p-4 text-muted text-center small">
                                    Nenhum usuário listado para esta empresa. Confirme se o backend está atualizado e se há registros em
                                    <code className="mx-1">usuarios</code> com este <code className="mx-1">empresa_id</code>.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuperAdmin;
