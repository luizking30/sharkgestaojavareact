import React, { useState, useEffect, useMemo } from 'react';
import api from './api';
import { useQueryClient, useQuery, keepPreviousData } from '@tanstack/react-query';
import { debounce } from './utils/debounce';
import { unwrapPage } from './utils/pageResponse';
import SharkPagination from './components/SharkPagination';
import { useFeedback } from './context/FeedbackContext';
import {
    forbidExcluirOrdemServico,
    forbidEntregarOs,
} from './auth/accessRules';

const OS_PAGE_SIZE = 15;

const OrdensServico = ({ usuarioLogado }) => {
    const queryClient = useQueryClient();
    const { notify, confirmDialog, promptDialog } = useFeedback();
    const [page, setPage] = useState(0);
    const [sugestoes, setSugestoes] = useState([]);
    const [exibirSugestoes, setExibirSugestoes] = useState(false);

    const [filtros, setFiltros] = useState({ id: '', nome: '', data: '', status: '' });

    useEffect(() => {
        setPage(0);
    }, [filtros.id, filtros.nome, filtros.data, filtros.status]);

    const { data: pageData, isLoading, isFetching } = useQuery({
        queryKey: ['ordens-servico', page, filtros.id, filtros.nome, filtros.data, filtros.status],
        queryFn: async () => {
            const params = {
                page,
                size: OS_PAGE_SIZE,
                sort: 'id,desc',
            };
            if (filtros.id && /^\d+$/.test(filtros.id.trim())) {
                params.id = Number(filtros.id.trim());
            }
            if (filtros.nome?.trim()) {
                params.nome = filtros.nome.trim();
            }
            if (filtros.data) {
                params.data = filtros.data;
            }
            if (filtros.status) {
                params.status = filtros.status;
            }
            const res = await api.get('/api/ordens', { params });
            return unwrapPage(res.data);
        },
        placeholderData: keepPreviousData,
    });

    const ordens = pageData?.items ?? [];
    const totalElements = pageData?.totalElements ?? 0;
    const totalPages = pageData?.totalPages ?? 1;

    // Formulário Nova O.S.
    const [formData, setFormData] = useState({
        clienteId: '',
        clienteNome: '',
        clienteCpf: '---',
        clienteWhatsapp: '---',
        produto: '',
        defeito: '',
        valor: ''
    });

    const naoPodeEntregar = forbidEntregarOs(usuarioLogado?.role);
    const podeExcluirOs = !forbidExcluirOrdemServico(usuarioLogado?.role);

    const debouncedBuscarClientes = useMemo(
        () =>
            debounce(async (termo) => {
                if (termo.length < 1) {
                    setSugestoes([]);
                    return;
                }
                try {
                    const res = await api.get(`/api/clientes/sugestoes?termo=${encodeURIComponent(termo)}`);
                    setSugestoes(res.data);
                    setExibirSugestoes(true);
                } catch (err) {
                    console.error(err);
                }
            }, 280),
        []
    );

    const buscarSugestoes = (termo) => {
        if (termo.length < 1) {
            setSugestoes([]);
            return;
        }
        debouncedBuscarClientes(termo);
    };

    const selecionarCliente = (c) => {
        setFormData({
            ...formData,
            clienteId: c.id,
            clienteNome: c.nome,
            clienteCpf: c.cpf || 'Não informado',
            clienteWhatsapp: c.whatsapp || 'Não informado'
        });
        setExibirSugestoes(false);
    };

    // --- LÓGICA DE STATUS ---
    const handleStatusChange = async (ordem, novoStatus) => {
        if (novoStatus === 'Entregue' && naoPodeEntregar) {
            notify.warning('Vendedor não pode entregar O.S. Conclua os passos até "Pronto" e um gestor ou técnico fará a entrega.', 'Permissão');
            return;
        }
        const hierarquia = ['Em análise', 'Em andamento', 'Pronto', 'Entregue'];
        const idxAtual = hierarquia.indexOf(ordem.status);
        const idxNovo = hierarquia.indexOf(novoStatus);

        if (idxNovo < idxAtual) {
            notify.warning('Não é permitido retroceder o status da O.S.', 'Status');
            return;
        }
        if (idxNovo > idxAtual + 1) {
            notify.warning(`A O.S. deve passar por "${hierarquia[idxAtual + 1]}" antes.`, 'Status');
            return;
        }

        let custoPeca = 0;
        if (novoStatus === 'Entregue') {
            const resposta = await promptDialog('Informe o gasto com peças (use ponto ou vírgula).', 'O.S. entregue', '0.00');
            if (resposta === null) return;
            custoPeca = parseFloat(String(resposta).replace(',', '.')) || 0;
        }

        try {
            await api.put(`/api/ordens/editar-status/${ordem.id}`, {
                status: novoStatus,
                custoPeca: custoPeca
            });

            // ATUALIZAÇÃO GLOBAL
            queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
            if (novoStatus === 'Entregue' || ordem.status === 'Entregue') {
                queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });
            }

        } catch (err) {
            notify.error(String(err.response?.data || 'Erro ao atualizar status.'), 'O.S.');
        }
    };

    // --- IMPRESSÃO DE PDF ---
    const imprimirPDF = async (id) => {
        try {
            const response = await api.get(`/api/ordens/pdf/${id}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `OS_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            notify.error('Erro ao gerar PDF.', 'O.S.');
        }
    };

    // --- DELETAR O.S. ---
    const handleDeletar = async (id) => {
        if (!podeExcluirOs) {
            notify.warning('Apenas gestores da unidade podem excluir O.S.', 'Permissão');
            return;
        }
        const ok = await confirmDialog('Deseja realmente excluir esta ordem de serviço?', 'Excluir O.S.');
        if (!ok) return;
        try {
            await api.delete(`/api/ordens/deletar/${id}`);
            queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
            queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });
            notify.success('O.S. excluída.', 'Sucesso');
        } catch (err) {
            notify.error('Erro ao excluir a O.S.', 'Erro');
        }
    };

    const handleSalvarOS = async (e) => {
        e.preventDefault();
        if (!formData.clienteId) {
            notify.warning('Selecione um cliente na lista de sugestões.', 'Cliente');
            return;
        }
        try {
            const valorNumerico = parseFloat(formData.valor) || 0;
            await api.post('/api/ordens/salvar', { ...formData, valor: valorNumerico, status: 'Em análise' });

            // ATUALIZAÇÃO GLOBAL
            queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
            queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });

            setFormData({ clienteId: '', clienteNome: '', clienteCpf: '---', clienteWhatsapp: '---', produto: '', defeito: '', valor: '' });
            notify.success('O.S. criada com sucesso.', 'Laboratório');
        } catch (err) {
            notify.error('Erro ao criar a O.S.', 'Erro');
        }
    };

    return (
        <div className="mt-2">
            <h2 className="fw-bold text-white mb-4"><i className="bi bi-tools glow-info" style={{ color: '#0dcaf0' }}></i> Ordens de Serviço</h2>

            <div className="card shark-page-card border-left-info mb-4">
                <div className="card-body p-4">
                    <form onSubmit={handleSalvarOS} className="row g-3">
                        <div className="col-md-3 position-relative">
                            <label className="text-info small fw-bold text-uppercase">Cliente</label>
                            <input type="text" className="form-control bg-black text-white border-secondary"
                                   value={formData.clienteNome}
                                   onChange={(e) => {
                                       setFormData({...formData, clienteNome: e.target.value, clienteId: ''});
                                       buscarSugestoes(e.target.value);
                                   }}
                                   placeholder="Nome do cliente..." required />
                            {exibirSugestoes && sugestoes.length > 0 && (
                                <div className="shark-sugestoes-wrapper">
                                    {sugestoes.map(s => (
                                        <div key={s.id} className="shark-suggestion-item" onClick={() => selecionarCliente(s)}>
                                            <div className="fw-bold text-info">{s.nome}</div>
                                            <small className="text-muted">{s.cpf} | {s.whatsapp}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="col-md-2">
                            <label className="text-info small fw-bold">CPF</label>
                            <div className="p-3 bg-dark border rounded text-info fw-bold">{formData.clienteCpf}</div>
                        </div>
                        <div className="col-md-2">
                            <label className="text-info small fw-bold">EQUIPAMENTO</label>
                            <input className="form-control bg-black text-white border-secondary"
                                   value={formData.produto} onChange={e => setFormData({...formData, produto: e.target.value})} required />
                        </div>
                        <div className="col-md-2">
                            <label className="text-info small fw-bold">DEFEITO</label>
                            <input className="form-control bg-black text-white border-secondary"
                                   value={formData.defeito} onChange={e => setFormData({...formData, defeito: e.target.value})} required />
                        </div>
                        <div className="col-md-1">
                            <label className="text-info small fw-bold">VALOR</label>
                            <input type="number" step="0.01" className="form-control bg-black text-white border-secondary"
                                   value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} required />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button type="submit" className="btn btn-shark-primary w-100 p-2">SALVAR O.S.</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card shark-page-card border-left-info mb-4">
                <div className="card-body row g-2">
                    <div className="col-md-1">
                        <input type="text" className="form-control bg-black text-white border-secondary" placeholder="ID #"
                               value={filtros.id} onChange={e => setFiltros({...filtros, id: e.target.value})} />
                    </div>
                    <div className="col-md-4">
                        <input type="text" className="form-control bg-black text-white border-secondary" placeholder="Filtrar Cliente..."
                               value={filtros.nome} onChange={e => setFiltros({...filtros, nome: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                        <input type="date" className="form-control bg-black text-white border-secondary"
                               value={filtros.data} onChange={e => setFiltros({...filtros, data: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                        <select className="form-select bg-black text-white border-secondary"
                                value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
                            <option value="">Todos Status</option>
                            <option value="Em análise">Em análise</option>
                            <option value="Em andamento">Em andamento</option>
                            <option value="Pronto">Pronto</option>
                            <option value="Entregue">Entregue</option>
                        </select>
                    </div>
                    <div className="col-md-1">
                        <button className="btn btn-outline-info w-100" onClick={() => setFiltros({id:'', nome:'', data:'', status:''})}>
                            <i className="bi bi-eraser"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="card bg-dark border-0 overflow-hidden" style={{ borderRadius: '15px' }}>
                <div className="table-responsive">
                    <table className="table table-hover table-dark align-middle">
                        <thead className="bg-black text-white-50 small">
                        <tr>
                            <th className="ps-4">ID / DATAS</th>
                            <th>CLIENTE</th>
                            <th>EQUIPAMENTO</th>
                            <th>FINANCEIRO</th>
                            <th>STATUS</th>
                            <th className="text-center">AÇÕES</th>
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading && !pageData ? (
                            <tr><td colSpan={6} className="text-center py-4 text-info">Carregando…</td></tr>
                        ) : (
                        ordens.map(o => (
                            <tr key={o.id}>
                                <td className="ps-4">
                                    <span className="fw-bold text-info">#{o.id}</span>
                                    <div className="small text-muted mt-1" style={{fontSize: '0.7rem'}}>
                                        Aberto por: {o.funcionarioAbertura} <br/>
                                        Em: {new Date(o.data).toLocaleString('pt-BR')}
                                    </div>
                                </td>
                                <td>
                                    <div className="fw-bold">{o.clienteNome}</div>
                                    <a href={`https://wa.me/55${o.clienteWhatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-success text-decoration-none small">
                                        <i className="bi bi-whatsapp me-1"></i>{o.clienteWhatsapp}
                                    </a>
                                </td>
                                <td>
                                    <span className="text-white">{o.produto}</span><br/>
                                    <small className="text-info">{o.defeito}</small>
                                </td>
                                <td>
                                    <div className="os-valor-bruto">R$ {o.valorTotal?.toFixed(2)}</div>
                                    {o.custoPeca > 0 && (
                                        <>
                                            <div className="os-gasto-pecas">- R$ {o.custoPeca.toFixed(2)} (Pecas)</div>
                                            <div className="os-lucro-liquido">= R$ {(o.valorTotal - o.custoPeca).toFixed(2)} (Lucro)</div>
                                        </>
                                    )}
                                </td>
                                <td>
                                        <span className={`badge mb-1 d-block ${o.status === 'Em análise' ? 'bg-warning text-dark' : o.status === 'Em andamento' ? 'bg-primary' : o.status === 'Pronto' ? 'bg-info text-dark' : 'bg-success'}`}>
                                            {o.status}
                                        </span>
                                    <select className="form-select form-select-sm os-status-select"
                                            value={o.status}
                                            onChange={(e) => handleStatusChange(o, e.target.value)}>
                                        <option value="Em análise">Em análise</option>
                                        <option value="Em andamento">Em andamento</option>
                                        <option value="Pronto">Pronto</option>
                                        <option value="Entregue" disabled={naoPodeEntregar && o.status !== 'Entregue'}>Entregue/Pago</option>
                                    </select>
                                </td>
                                <td className="text-center">
                                    <div className="btn-group">
                                        <button className="btn btn-sm btn-outline-info" onClick={() => imprimirPDF(o.id)}>
                                            <i className="bi bi-file-earmark-pdf"></i>
                                        </button>
                                        {podeExcluirOs && (
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletar(o.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
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
                pageSize={OS_PAGE_SIZE}
                onPageChange={setPage}
                disabled={isFetching}
            />
        </div>
    );
};

export default OrdensServico;