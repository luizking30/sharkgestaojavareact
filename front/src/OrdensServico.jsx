import React, { useState, useEffect, useMemo } from 'react';
import api from './api';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const OrdensServico = ({ usuarioLogado }) => {
    const queryClient = useQueryClient();

    // 1. CARREGAMENTO DAS ORDENS VIA REACT QUERY
    const { data: ordens = [], isLoading } = useQuery({
        queryKey: ['ordens-servico'],
        queryFn: async () => {
            const res = await api.get('/api/ordens');
            return res.data;
        }
    });

    const [sugestoes, setSugestoes] = useState([]);
    const [exibirSugestoes, setExibirSugestoes] = useState(false);

    // Filtros
    const [filtros, setFiltros] = useState({ id: '', nome: '', data: '', status: '' });

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

    const isAdmin = usuarioLogado?.role === 'ROLE_ADMIN';
    const podeOperarLaboratorio = isAdmin || usuarioLogado?.tipoFuncionario === 'TECNICO' || usuarioLogado?.tipoFuncionario === 'HIBRIDO';

    // --- AUTOCOMPLETE DE CLIENTES ---
    const buscarSugestoes = async (termo) => {
        if (termo.length < 1) {
            setSugestoes([]);
            return;
        }
        try {
            const res = await api.get(`/api/clientes/sugestoes?termo=${termo}`);
            setSugestoes(res.data);
            setExibirSugestoes(true);
        } catch (err) { console.error(err); }
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
        const hierarquia = ['Em análise', 'Em andamento', 'Pronto', 'Entregue'];
        const idxAtual = hierarquia.indexOf(ordem.status);
        const idxNovo = hierarquia.indexOf(novoStatus);

        if (idxNovo < idxAtual) return alert("Não é permitido retroceder o status.");
        if (idxNovo > idxAtual + 1) return alert(`A O.S. deve passar por "${hierarquia[idxAtual + 1]}" antes.`);

        if ((novoStatus === 'Em andamento' || novoStatus === 'Pronto') && !podeOperarLaboratorio) {
            return alert("Acesso negado: Somente técnicos podem operar o laboratório.");
        }

        let custoPeca = 0;
        if (novoStatus === 'Entregue') {
            const resposta = prompt("Informe o gasto com peças (R$):", "0.00");
            if (resposta === null) return;
            custoPeca = parseFloat(resposta.replace(',', '.')) || 0;
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
            alert("Erro ao atualizar status: " + (err.response?.data || "Erro desconhecido"));
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
        } catch (err) { alert("Erro ao gerar PDF."); }
    };

    // --- DELETAR O.S. ---
    const handleDeletar = async (id) => {
        if (!window.confirm("Deseja realmente excluir esta O.S.?")) return;
        try {
            await api.delete(`/api/ordens/deletar/${id}`);
            queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
            queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });
        } catch (err) { alert("Erro ao excluir OS."); }
    };

    // --- FILTRAGEM DINÂMICA ---
    const ordensFiltradas = useMemo(() => {
        return ordens.filter(o => {
            const matchId = filtros.id === '' || o.id.toString().includes(filtros.id.replace('#', ''));
            const matchNome = o.clienteNome.toLowerCase().includes(filtros.nome.toLowerCase());
            const matchStatus = filtros.status === '' || o.status === filtros.status;

            let matchData = true;
            if (filtros.data) {
                const dataOS = o.data.split('T')[0];
                matchData = dataOS === filtros.data;
            }
            return matchId && matchNome && matchStatus && matchData;
        });
    }, [ordens, filtros]);

    const handleSalvarOS = async (e) => {
        e.preventDefault();
        if (!formData.clienteId) return alert("Selecione um cliente da lista!");
        try {
            const valorNumerico = parseFloat(formData.valor) || 0;
            await api.post('/api/ordens/salvar', { ...formData, valor: valorNumerico, status: 'Em análise' });

            // ATUALIZAÇÃO GLOBAL
            queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
            queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });

            setFormData({ clienteId: '', clienteNome: '', clienteCpf: '---', clienteWhatsapp: '---', produto: '', defeito: '', valor: '' });
        } catch (err) { alert("Erro ao criar O.S."); }
    };

    if (isLoading) return <div className="text-center p-5 text-info">Carregando Laboratório Shark...</div>;

    return (
        <div className="mt-2">
            <style>
                {`
                .shark-card { background: #1a1a1a; border-radius: 15px; border-left: 5px solid #333; transition: 0.3s; }
                .glow-info { filter: drop-shadow(0 0 5px #0dcaf0); }
                input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
                .sugestoes-wrapper { background: #121212; border: 2px solid #0dcaf0; position: absolute; width: 100%; z-index: 2000; border-radius: 0 0 10px 10px; }
                .suggestion-item { padding: 12px; border-bottom: 1px solid #222; cursor: pointer; }
                .suggestion-item:hover { background: #1a1a1a; border-left: 3px solid #0dcaf0; }
                .status-select-ajax { background: #000; color: #fff; border-radius: 8px; }
                .valor-bruto-label { color: #28a745; font-weight: bold; }
                .gasto-pecas-label { color: #dc3545; font-size: 0.75rem; font-weight: bold; }
                .lucro-liquido-label { color: #0dcaf0; font-size: 0.75rem; font-weight: bold; }
                `}
            </style>

            <h2 className="fw-bold text-white mb-4"><i className="bi bi-tools glow-info" style={{ color: '#0dcaf0' }}></i> Ordens de Serviço</h2>

            <div className="card shark-card border-left-info mb-4" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
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
                                <div className="sugestoes-wrapper">
                                    {sugestoes.map(s => (
                                        <div key={s.id} className="suggestion-item" onClick={() => selecionarCliente(s)}>
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
                            <button type="submit" className="btn btn-info w-100 fw-bold p-2">SALVAR O.S.</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card shark-card border-left-info mb-4" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
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
                        {ordensFiltradas.map(o => (
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
                                    <div className="valor-bruto-label">R$ {o.valorTotal?.toFixed(2)}</div>
                                    {o.custoPeca > 0 && (
                                        <>
                                            <div className="gasto-pecas-label">- R$ {o.custoPeca.toFixed(2)} (Pecas)</div>
                                            <div className="lucro-liquido-label">= R$ {(o.valorTotal - o.custoPeca).toFixed(2)} (Lucro)</div>
                                        </>
                                    )}
                                </td>
                                <td>
                                        <span className={`badge mb-1 d-block ${o.status === 'Em análise' ? 'bg-warning text-dark' : o.status === 'Em andamento' ? 'bg-primary' : o.status === 'Pronto' ? 'bg-info text-dark' : 'bg-success'}`}>
                                            {o.status}
                                        </span>
                                    <select className="form-select form-select-sm status-select-ajax"
                                            value={o.status}
                                            onChange={(e) => handleStatusChange(o, e.target.value)}>
                                        <option value="Em análise">Em análise</option>
                                        <option value="Em andamento">Em andamento</option>
                                        <option value="Pronto">Pronto</option>
                                        <option value="Entregue">Entregue/Pago</option>
                                    </select>
                                </td>
                                <td className="text-center">
                                    <div className="btn-group">
                                        <button className="btn btn-sm btn-outline-info" onClick={() => imprimirPDF(o.id)}>
                                            <i className="bi bi-file-earmark-pdf"></i>
                                        </button>
                                        {isAdmin && (
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletar(o.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
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

export default OrdensServico;