import React, { useState, useMemo } from 'react';
import api from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Estoque = ({ usuarioLogado }) => {
    const queryClient = useQueryClient();

    // Estados do formulário
    const [formData, setFormData] = useState({
        id: '',
        codigoBarras: '',
        nome: '',
        precoCusto: '',
        precoVenda: '',
        quantidade: 1
    });
    const [editando, setEditando] = useState(false);
    const isAdmin = usuarioLogado?.role === 'ROLE_ADMIN';

    // 1. BUSCA DE PRODUTOS VIA REACT QUERY
    const { data: produtos = [], isLoading } = useQuery({
        queryKey: ['estoque-produtos'],
        queryFn: async () => {
            const response = await api.get('/api/estoque');
            return response.data;
        }
    });

    // 2. MUTATION PARA SALVAR/ATUALIZAR
    const saveMutation = useMutation({
        mutationFn: (novoProduto) => api.post('/api/estoque/salvar', novoProduto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estoque-produtos'] });
            queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] }); // Sincroniza Dashboard
            alert(editando ? "Produto atualizado!" : "Produto salvo!");
            limparFormulario();
        },
        onError: () => alert("Erro ao salvar no estoque.")
    });

    // 3. MUTATION PARA DELETAR
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/estoque/deletar/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estoque-produtos'] });
            queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] }); // Sincroniza Dashboard
        },
        onError: () => alert("Erro ao deletar.")
    });

    // Cálculos Financeiros
    const financeiro = useMemo(() => {
        const totalInvestido = produtos.reduce((acc, p) => acc + (p.precoCusto * p.quantidade), 0);
        const faturamentoBruto = produtos.reduce((acc, p) => acc + (p.precoVenda * p.quantidade), 0);
        return {
            investido: totalInvestido,
            faturamento: faturamentoBruto,
            lucro: faturamentoBruto - totalInvestido
        };
    }, [produtos]);

    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const verificarDuplicidade = async (codigo) => {
        if (!codigo || editando) return;
        try {
            const response = await api.get(`/api/estoque/buscar-por-codigo?codigo=${codigo}`);
            if (response.data && response.data.id !== formData.id) {
                alert(`Produto "${response.data.nome}" já cadastrado. Entrando em modo de EDIÇÃO.`);
                prepararEdicao(response.data);
            }
        } catch (error) { /* Segue como novo produto */ }
    };

    const prepararEdicao = (produto) => {
        if (!isAdmin) {
            alert("Acesso Negado: Somente administradores podem editar.");
            return;
        }
        setFormData(produto);
        setEditando(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const limparFormulario = () => {
        setFormData({ id: '', codigoBarras: '', nome: '', precoCusto: '', precoVenda: '', quantidade: 1 });
        setEditando(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        saveMutation.mutate(formData);
    };

    const handleDeletar = (id) => {
        if (!isAdmin) return;
        if (window.confirm('Remover este item da Shark?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) return <div className="p-5 text-center text-info">Carregando Inventário Shark...</div>;

    return (
        <div className="mt-2">
            <style>
                {`
                .shark-card { background: #1a1a1a; border-radius: 15px; border: none; border-left: 5px solid #333; transition: all 0.3s ease; }
                .shark-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.5); filter: brightness(1.2); }
                .border-left-danger { border-left-color: #dc3545 !important; }
                .border-left-info { border-left-color: #0dcaf0 !important; }
                .border-left-success { border-left-color: #198754 !important; }
                .glow-info { filter: drop-shadow(0 0 5px #0dcaf0); }
                .btn-readonly { opacity: 0.5; cursor: not-allowed !important; filter: grayscale(1); }
                `}
            </style>

            <div className="mb-4">
                <h2 className="fw-bold mb-0 text-white">
                    <i className="bi bi-box-seam glow-info" style={{ color: '#0dcaf0' }}></i> Controle de Estoque
                </h2>
                <p className="text-white-50 small">Gerencie entrada, saída e performance financeira do seu inventário</p>
            </div>

            <div className="card shark-card border-left-info shadow-lg mb-4" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit} className="row g-3 align-items-end">
                        <div className="col-md-2">
                            <label className="form-label text-info small fw-bold text-uppercase">Cód. Barras / SKU</label>
                            <input name="codigoBarras" value={formData.codigoBarras} onChange={handleInputChange}
                                   onBlur={(e) => verificarDuplicidade(e.target.value)}
                                   className="form-control bg-black text-white border-secondary shadow-none" placeholder="Ex: 789..." />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-info small fw-bold text-uppercase">Nome do Produto</label>
                            <input name="nome" value={formData.nome} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none" placeholder="Ex: Teclado Mecânico" required />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label text-info small fw-bold text-uppercase">Custo (Und)</label>
                            <input name="precoCusto" type="number" step="0.01" value={formData.precoCusto} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none" placeholder="0.00" required />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label text-info small fw-bold text-uppercase">Venda (Und)</label>
                            <input name="precoVenda" type="number" step="0.01" value={formData.precoVenda} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none" placeholder="0.00" required />
                        </div>
                        <div className="col-md-1">
                            <label className="form-label text-info small fw-bold text-uppercase">Qtd</label>
                            <input name="quantidade" type="number" value={formData.quantidade} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none" required />
                        </div>
                        <div className="col-md-2">
                            <div className="d-flex gap-2">
                                <button type="submit" disabled={saveMutation.isPending} className={`btn btn-info w-100 fw-bold ${!isAdmin ? 'btn-readonly' : ''}`}>
                                    <i className={editando ? "bi bi-check-lg" : "bi bi-plus-circle"}></i> {editando ? 'ATUALIZAR' : 'SALVAR'}
                                </button>
                                {editando && (
                                    <button type="button" className="btn btn-outline-secondary" onClick={limparFormulario}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card p-3 shark-card border-left-danger shadow-sm">
                        <p className="text-danger small fw-bold mb-1 text-uppercase">Total Investido</p>
                        <h3 className="fw-bold text-white mb-0">{formatarMoeda(financeiro.investido)}</h3>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card p-3 shark-card border-left-success shadow-sm">
                        <p className="text-success small fw-bold mb-1 text-uppercase">Faturamento Bruto</p>
                        <h3 className="fw-bold text-white mb-0">{formatarMoeda(financeiro.faturamento)}</h3>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card p-3 shark-card border-left-info shadow-sm">
                        <p className="text-info small fw-bold mb-1 text-uppercase">Lucro Líquido Previsto</p>
                        <h3 className="fw-bold text-white mb-0">{formatarMoeda(financeiro.lucro)}</h3>
                    </div>
                </div>
            </div>

            <div className="card shadow-lg border-0 bg-dark text-white mb-5" style={{ borderRadius: '15px', overflow: 'hidden', borderLeft: '5px solid #333' }}>
                <div className="table-responsive">
                    <table className="table table-hover table-dark mb-0 align-middle text-center">
                        <thead className="bg-black text-muted text-uppercase small">
                        <tr>
                            <th className="ps-4 text-start">CÓD/SKU</th>
                            <th className="text-start">PRODUTO</th>
                            <th>QTD</th>
                            <th>CUSTO (UND)</th>
                            <th>VENDA (UND)</th>
                            <th>LUCRO (UND)</th>
                            <th>AÇÕES</th>
                        </tr>
                        </thead>
                        <tbody>
                        {produtos.map(p => (
                            <tr key={p.id}>
                                <td className="ps-4 text-start fw-bold text-info">{p.codigoBarras || 'S/C'}</td>
                                <td className="text-start fw-bold">{p.nome}</td>
                                <td className="fw-bold">{p.quantidade}</td>
                                <td className="text-danger">{formatarMoeda(p.precoCusto)}</td>
                                <td className="text-success fw-bold">{formatarMoeda(p.precoVenda)}</td>
                                <td className="text-info fw-bold">{formatarMoeda(p.precoVenda - p.precoCusto)}</td>
                                <td className="text-center">
                                    <div className="btn-group gap-1">
                                        <button onClick={() => prepararEdicao(p)}
                                                className={`btn btn-sm btn-outline-info ${!isAdmin ? 'btn-readonly' : ''}`}>
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        {isAdmin && (
                                            <button onClick={() => handleDeletar(p.id)} className="btn btn-sm btn-outline-danger" disabled={deleteMutation.isPending}>
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

export default Estoque;