import React, { useState } from 'react';
import api from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeedback } from './context/FeedbackContext';

const SuperAdmin = () => {
    const queryClient = useQueryClient();
    const { notify, confirmDialog, promptDialog } = useFeedback();
    const [filtro, setFiltro] = useState('');

    // 1. BUSCA DADOS DO ECOSSISTEMA
    const { data: empresas, isLoading } = useQuery({
        queryKey: ['super-admin-empresas'],
        queryFn: async () => {
            const res = await api.get('/api/super-admin/empresas/detalhes');
            return res.data;
        }
    });

    // 2. MUTAÇÃO PARA ADICIONAR DIAS
    const addDiasMutation = useMutation({
        mutationFn: ({ id, dias }) => api.post(`/api/super-admin/empresas/adicionar-dias/${id}?quantidade=${dias}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-empresas'] });
            notify.success('Dias adicionados com sucesso.', 'Super admin');
        }
    });

    // 3. MUTAÇÃO PARA BLOQUEAR EMPRESA
    const bloquearMutation = useMutation({
        mutationFn: (id) => api.post(`/api/super-admin/empresas/bloquear/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-empresas'] });
            notify.warning('Acesso da empresa suspenso.', 'Super admin');
        }
    });

    const empresasFiltradas = empresas?.filter(e =>
        e.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        e.cnpj.includes(filtro)
    );

    if (isLoading) return (
        <div className="p-5 text-center text-info">
            <div className="spinner-border mb-3"></div>
            <h5>Mapeando Ecossistema Shark...</h5>
        </div>
    );

    return (
        <div className="mt-2 text-white">
            <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <h2 className="fw-bold text-warning"><i className="bi bi-crown-fill me-2"></i> Painel Global (Fundador)</h2>
                    <p className="text-white-50 small mb-0">Gestão de Unidades e Controle de Licenciamento</p>
                </div>
                <div className="col-md-3">
                    <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="Buscar por Nome ou CNPJ..."
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
            </div>

            <div className="row g-3 mb-4 text-center">
                <div className="col-md-4">
                    <div className="card-super p-3">
                        <span className="text-muted small d-block">TOTAL EMPRESAS</span>
                        <span className="fs-3 fw-bold text-info">{empresas?.length}</span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-super p-3">
                        <span className="text-muted small d-block">FATURAMENTO SAAS (EST.)</span>
                        <span className="fs-3 fw-bold text-success">R$ {empresas?.length * 60},00/mês</span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-super p-3">
                        <span className="text-muted small d-block">SITUAÇÃO GERAL</span>
                        <span className="fs-3 fw-bold text-warning">ESTÁVEL</span>
                    </div>
                </div>
            </div>

            <div className="card card-super shadow-lg">
                <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0 align-middle">
                        <thead className="bg-black text-muted small text-uppercase">
                        <tr>
                            <th className="ps-4 py-3">ID / Empresa</th>
                            <th>CNPJ</th>
                            <th>Proprietários</th>
                            <th className="text-center">Equipe</th>
                            <th className="text-center">Plano</th>
                            <th className="pe-4 text-end">Ações de Fundador</th>
                        </tr>
                        </thead>
                        <tbody>
                        {empresasFiltradas?.map(emp => (
                            <tr key={emp.id}>
                                <td className="ps-4">
                                    <div className="fw-bold">{emp.nome}</div>
                                    <span className="text-muted small val-mono">ID: #{emp.id}</span>
                                </td>
                                <td className="val-mono small">{emp.cnpj}</td>
                                <td>
                                    {emp.proprietarios.map(p => (
                                        <div key={p} className="small"><i className="bi bi-person-fill text-warning me-1"></i>{p}</div>
                                    ))}
                                </td>
                                <td className="text-center">
                                    <button type="button" className="btn btn-sm btn-outline-info rounded-pill btn-super-action" onClick={() => notify.info(emp.listaEquipe?.length ? emp.listaEquipe.join(' · ') : 'Sem colaboradores listados.', `Equipe — ${emp.nome}`)}>
                                        {emp.totalFuncionarios} Colaboradores
                                    </button>
                                </td>
                                <td className="text-center">
                                        <span className={`badge ${emp.diasRestantes > 3 ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                                            {emp.diasRestantes} DIAS
                                        </span>
                                </td>
                                <td className="pe-4 text-end">
                                    <div className="btn-group gap-1">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-success btn-super-action"
                                            onClick={async () => {
                                                const d = await promptDialog('Informe a quantidade de dias de bônus.', 'Adicionar dias', '30');
                                                if (d != null && String(d).trim()) {
                                                    addDiasMutation.mutate({ id: emp.id, dias: String(d).trim() });
                                                }
                                            }}
                                        >
                                            + DIAS
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger btn-super-action"
                                            onClick={async () => {
                                                const ok = await confirmDialog(`Bloquear ${emp.nome} imediatamente?`, 'Suspender empresa');
                                                if (ok) bloquearMutation.mutate(emp.id);
                                            }}
                                        >
                                            BLOQUEAR
                                        </button>
                                    </div>
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

export default SuperAdmin;