import React, { useState, useEffect, useMemo } from 'react';
import api from './api';
import { unwrapPage } from './utils/pageResponse';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SharkPagination from './components/SharkPagination';
import { useFeedback } from './context/FeedbackContext';

const PAGE_SIZE = 15;

const Clientes = ({ usuarioLogado }) => {
    const queryClient = useQueryClient();
    const { notify, confirmDialog } = useFeedback();
    const [formData, setFormData] = useState({ id: '', nome: '', cpf: '', whatsapp: '' });
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [busca, setBusca] = useState({ nome: '', cpf: '', whatsapp: '' });
    const [buscaDebounced, setBuscaDebounced] = useState(busca);
    const [page, setPage] = useState(0);

    const isAdmin = usuarioLogado?.role === 'ROLE_ADMIN';

    useEffect(() => {
        const id = setTimeout(() => setBuscaDebounced(busca), 400);
        return () => clearTimeout(id);
    }, [busca]);

    useEffect(() => {
        setPage(0);
    }, [buscaDebounced.nome, buscaDebounced.cpf, buscaDebounced.whatsapp]);

    const { data: pageData, isLoading } = useQuery({
        queryKey: ['clientes', page, PAGE_SIZE, buscaDebounced],
        queryFn: async () => {
            const res = await api.get('/api/clientes', {
                params: {
                    page,
                    size: PAGE_SIZE,
                    sort: 'id,desc',
                    nome: buscaDebounced.nome || undefined,
                    cpf: buscaDebounced.cpf || undefined,
                    whatsapp: buscaDebounced.whatsapp || undefined,
                },
            });
            return unwrapPage(res.data);
        },
    });

    const clientes = pageData?.items ?? [];
    const totalElements = pageData?.totalElements ?? 0;
    const totalPages = pageData?.totalPages ?? 1;

    const cpfDigitosOk = formData.cpf?.replace(/\D/g, '').length === 11;
    const whatsDigitosOk = formData.whatsapp?.replace(/\D/g, '').length === 11;

    const { data: duplicado = false } = useQuery({
        queryKey: ['cliente-dup', formData.cpf, formData.whatsapp, formData.id],
        queryFn: async () => {
            const res = await api.get('/api/clientes/checar-duplicata', {
                params: {
                    cpf: cpfDigitosOk ? formData.cpf : undefined,
                    whatsapp: whatsDigitosOk ? formData.whatsapp : undefined,
                    excetoId: formData.id || undefined,
                },
            });
            return res.data.duplicado === true;
        },
        enabled: cpfDigitosOk || whatsDigitosOk,
    });

    const isDuplicado = duplicado;

    const aplicarMascaraCPF = (value) => {
        return value.replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .substring(0, 14);
    };

    const aplicarMascaraWhats = (value) => {
        let v = value.replace(/\D/g, '');
        if (v.length > 0) v = '(' + v;
        if (v.length > 3) v = v.substring(0, 3) + ') ' + v.substring(3);
        if (v.length > 9) v = v.substring(0, 10) + '-' + v.substring(10);
        return v.substring(0, 15);
    };

    const dadosIncompletos = useMemo(() => {
        const cpfDigitos = formData.cpf.replace(/\D/g, '').length;
        const whatsDigitos = formData.whatsapp.replace(/\D/g, '').length;
        return (formData.cpf.length > 0 && cpfDigitos !== 11) || (formData.whatsapp.length > 0 && whatsDigitos !== 11);
    }, [formData.cpf, formData.whatsapp]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'nome') finalValue = value.replace(/[0-9]/g, '');
        if (name === 'cpf') finalValue = aplicarMascaraCPF(value);
        if (name === 'whatsapp') finalValue = aplicarMascaraWhats(value);

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        setBusca(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isDuplicado || dadosIncompletos) return;

        try {
            await api.post('/api/clientes/salvar', formData);
            setMensagem({ texto: 'Cliente salvo com sucesso!', tipo: 'success' });
            limparForm();
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            queryClient.invalidateQueries({ queryKey: ['cliente-dup'] });
        } catch (error) {
            setMensagem({ texto: 'Erro ao salvar cliente. Verifique os dados.', tipo: 'danger' });
        }
    };

    const handleDeletar = async (id) => {
        if (!isAdmin) {
            notify.warning('Ação restrita a administradores.', 'Permissão');
            return;
        }
        const ok = await confirmDialog('Deseja realmente excluir este cliente?', 'Excluir cliente');
        if (!ok) return;
        try {
            await api.delete(`/api/clientes/deletar/${id}`);
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            notify.success('Cliente removido.', 'Sucesso');
        } catch (error) {
            notify.error('Erro ao deletar cliente.', 'Erro');
        }
    };

    const handleEditar = (cliente) => {
        if (!isAdmin) {
            notify.warning('Ação restrita a administradores.', 'Permissão');
            return;
        }
        setFormData(cliente);
        setBusca({ nome: cliente.nome, cpf: cliente.cpf, whatsapp: cliente.whatsapp });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const limparForm = () => {
        setFormData({ id: '', nome: '', cpf: '', whatsapp: '' });
        setBusca({ nome: '', cpf: '', whatsapp: '' });
    };

    return (
        <div className="mt-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0 text-white">
                        <i className="bi bi-people-fill glow-info" style={{ color: '#0dcaf0' }}></i> Gestão de Clientes
                    </h2>
                    <p className="text-white-50 small">Administração de cadastros da Shark Eletrônicos | Brasília-DF</p>
                </div>
            </div>

            {mensagem.texto && (
                <div className={`alert alert-${mensagem.tipo} bg-dark text-${mensagem.tipo} border-${mensagem.tipo} shadow-lg alert-dismissible fade show`}>
                    <i className="bi bi-exclamation-octagon-fill me-2"></i>
                    {mensagem.texto}
                    <button type="button" className="btn-close btn-close-white" onClick={() => setMensagem({ texto: '', tipo: '' })}></button>
                </div>
            )}

            <div className="card shark-page-card border-left-info shadow-lg mb-4">
                <div className="card-header border-0 bg-transparent pt-4 pb-0">
                    <h5 className="card-title mb-0 text-white">
                        <i className="bi bi-person-plus me-2" style={{ color: '#0dcaf0' }}></i>Dados do Cliente
                    </h5>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-md-5">
                            <label className="form-label text-info small fw-bold mb-1 text-uppercase">Nome Completo</label>
                            <input name="nome" value={formData.nome} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none p-2"
                                   placeholder="Digite para cadastrar ou filtrar a lista..." required minLength="5" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-info small fw-bold mb-1 text-uppercase">CPF</label>
                            <input name="cpf" value={formData.cpf} onChange={handleInputChange}
                                   className={`form-control bg-black text-white border-secondary shadow-none p-2 ${isDuplicado || (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) ? 'is-invalid-shark' : ''}`}
                                   placeholder="000.000.000-00" required />
                            {formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11 && (
                                <span className="warning-text"><i className="bi bi-info-circle"></i> Requer 11 números</span>
                            )}
                        </div>
                        <div className="col-md-4">
                            <label className="form-label text-info small fw-bold mb-1 text-uppercase">WhatsApp</label>
                            <div className="d-flex gap-2">
                                <div className="flex-grow-1">
                                    <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange}
                                           className={`form-control bg-black text-white border-secondary shadow-none p-2 ${isDuplicado || (formData.whatsapp && formData.whatsapp.replace(/\D/g, '').length !== 11) ? 'is-invalid-shark' : ''}`}
                                           placeholder="(61) 99999-9999" required />
                                    {formData.whatsapp && formData.whatsapp.replace(/\D/g, '').length !== 11 && (
                                        <span className="warning-text"><i className="bi bi-info-circle"></i> Requer 11 números</span>
                                    )}
                                </div>
                                <button type="submit" disabled={isDuplicado || dadosIncompletos} className="btn btn-shark-primary fw-bold px-3 align-self-start">SALVAR</button>
                            </div>
                        </div>

                        <div className="col-12 mt-3 d-flex justify-content-between align-items-center">
                            <button type="button" className="btn btn-sm btn-outline-secondary fw-bold" onClick={limparForm}>
                                <i className="bi bi-eraser me-2"></i> Limpar Campos
                            </button>
                            {isDuplicado && (
                                <span className="text-danger small fw-bold">
                                    <i className="bi bi-exclamation-triangle"></i> Cadastro já existente (CPF ou WhatsApp)!
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="card bg-dark border-0 shadow-sm overflow-hidden mb-2" style={{ borderRadius: '15px', borderLeft: '5px solid #0dcaf0' }}>
                <div className="table-responsive">
                    <table className="table table-hover table-dark mb-0">
                        <thead className="bg-black text-muted small text-uppercase">
                        <tr>
                            <th className="ps-4 py-3">ID</th>
                            <th>NOME</th>
                            <th>CPF</th>
                            <th>CONTATO</th>
                            <th className="text-center pe-4">AÇÕES</th>
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-4 text-info">Carregando…</td></tr>
                        ) : (
                            clientes.map(c => (
                                <tr key={c.id} className="align-middle">
                                    <td className="ps-4 fw-bold text-info">#{c.id}</td>
                                    <td className="fw-bold text-white">{c.nome}</td>
                                    <td>{c.cpf}</td>
                                    <td>
                                        <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
                                           target="_blank" rel="noreferrer" className="text-success text-decoration-none fw-bold btn-link-shark">
                                            <i className="bi bi-whatsapp"></i> {c.whatsapp}
                                        </a>
                                    </td>
                                    <td className="text-center pe-4">
                                        <div className="d-flex justify-content-center gap-2">
                                            <button type="button" onClick={() => handleEditar(c)}
                                                    className={`btn btn-sm btn-outline-info ${!isAdmin ? 'btn-readonly' : ''}`}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button type="button" onClick={() => handleDeletar(c.id)}
                                                    className={`btn btn-sm btn-outline-danger ${!isAdmin ? 'btn-readonly' : ''}`}>
                                                <i className="bi bi-trash3"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SharkPagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                disabled={isLoading}
            />
        </div>
    );
};

export default Clientes;
