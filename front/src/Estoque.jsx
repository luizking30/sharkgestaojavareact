import React, { useState, useMemo, useRef } from 'react';
import api from './api';
import { unwrapPage } from './utils/pageResponse';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import SharkPagination from './components/SharkPagination';
import { useFeedback } from './context/FeedbackContext';
import { podeGerirEstoque } from './auth/accessRules';

const PAGE_SIZE = 20;

const Estoque = ({ usuarioLogado }) => {
    const queryClient = useQueryClient();
    const { notify, confirmDialog } = useFeedback();
    const [page, setPage] = useState(0);

    // Estados do formulário
    const [formData, setFormData] = useState({
        id: '',
        codigoBarras: '',
        nome: '',
        precoCusto: '',
        precoVenda: '',
        quantidade: 1,
        imagemUrl: '',
    });
    const [editando, setEditando] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const fileInputRef = useRef(null);
    const podeGerir = podeGerirEstoque(usuarioLogado?.role);

    const { data: pageData, isLoading, isFetching } = useQuery({
        queryKey: ['estoque-produtos', page],
        queryFn: async () => {
            const response = await api.get('/api/estoque', {
                params: { page, size: PAGE_SIZE, sort: 'nome,asc' },
            });
            return unwrapPage(response.data);
        },
        placeholderData: keepPreviousData,
    });

    const produtos = pageData?.items ?? [];
    const totalElements = pageData?.totalElements ?? 0;
    const totalPages = pageData?.totalPages ?? 1;

    const { data: resumo } = useQuery({
        queryKey: ['estoque-resumo-financeiro'],
        queryFn: async () => {
            const res = await api.get('/api/estoque/resumo-financeiro');
            return res.data;
        },
        staleTime: 0,
    });

    // 2. MUTATION PARA SALVAR/ATUALIZAR
    const saveMutation = useMutation({
        mutationFn: (novoProduto) => api.post('/api/estoque/salvar', novoProduto),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({ queryKey: ['estoque-produtos'] });
            await queryClient.refetchQueries({ queryKey: ['estoque-resumo-financeiro'] });
            await queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });
            notify.success(variables?.id ? 'Produto atualizado!' : 'Produto salvo!', 'Estoque');
            limparFormulario();
        },
        onError: () => notify.error('Erro ao salvar no estoque.', 'Estoque')
    });

    // 3. MUTATION PARA DELETAR
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/estoque/deletar/${id}`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['estoque-produtos'] });
            await queryClient.refetchQueries({ queryKey: ['estoque-resumo-financeiro'] });
            await queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });
        },
        onError: () => notify.error('Erro ao excluir o produto.', 'Estoque')
    });

    // Cálculos Financeiros
    const financeiro = useMemo(() => {
        const investido = resumo?.investido ?? 0;
        const faturamento = resumo?.faturamento ?? 0;
        const lucro = resumo?.lucro ?? faturamento - investido;
        const margemGeral =
            faturamento > 0 ? ((lucro / faturamento) * 100).toFixed(1) : null;
        const markupGeral =
            investido > 0 ? ((lucro / investido) * 100).toFixed(1) : null;
        return { investido, faturamento, lucro, margemGeral, markupGeral };
    }, [resumo]);

    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const margemPct = (custo, venda) => {
        const c = Number(custo) || 0;
        const v = Number(venda) || 0;
        if (v <= 0) return '—';
        return `${(((v - c) / v) * 100).toFixed(1)}%`;
    };

    const markupPct = (custo, venda) => {
        const c = Number(custo) || 0;
        const v = Number(venda) || 0;
        if (c <= 0) return '—';
        return `${(((v - c) / c) * 100).toFixed(1)}%`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'codigoBarras') {
            setFormData((prev) => ({ ...prev, [name]: String(value).replace(/\D/g, '') }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const verificarDuplicidade = async (codigo) => {
        if (!codigo || editando) return;
        try {
            const response = await api.get(`/api/estoque/buscar-por-codigo?codigo=${codigo}`);
            if (response.data && response.data.id !== formData.id) {
                notify.info(`Já existe cadastro com este código: "${response.data.nome}". Abrindo edição.`, 'Produto encontrado');
                prepararEdicao(response.data);
            }
        } catch (error) { /* Segue como novo produto */ }
    };

    const prepararEdicao = (produto) => {
        if (!podeGerir) {
            notify.warning('Somente administradores podem editar o estoque.', 'Permissão');
            return;
        }
        setFormData({
            ...produto,
            imagemUrl: produto.imagemUrl ?? '',
        });
        setEditando(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const limparFormulario = () => {
        setFormData({ id: '', codigoBarras: '', nome: '', precoCusto: '', precoVenda: '', quantidade: 1, imagemUrl: '' });
        setEditando(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!podeGerir) {
            notify.warning('Somente administradores podem alterar o estoque.', 'Permissão');
            return;
        }
        saveMutation.mutate(formData);
    };

    const onEscolherArquivoImagem = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        if (!f.type.startsWith('image/')) {
            notify.warning('Selecione um arquivo de imagem (JPEG, PNG, WebP ou GIF).', 'Estoque');
            return;
        }
        if (!podeGerir) {
            notify.warning('Sem permissão para enviar imagem.', 'Estoque');
            return;
        }
        setUploadingImg(true);
        try {
            const fd = new FormData();
            fd.append('file', f);
            const res = await api.post('/api/estoque/upload-imagem', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = res.data?.url;
            if (url) {
                setFormData((prev) => ({ ...prev, imagemUrl: url }));
                notify.success('Imagem enviada. Salve o produto para manter.', 'Estoque');
            }
        } catch {
            notify.error('Não foi possível enviar a imagem.', 'Estoque');
        } finally {
            setUploadingImg(false);
        }
    };

    const handleDeletar = async (id) => {
        if (!podeGerir) {
            notify.warning('Somente administradores podem excluir itens.', 'Permissão');
            return;
        }
        const ok = await confirmDialog('Remover este item do estoque?', 'Excluir produto');
        if (!ok) return;
        deleteMutation.mutate(id);
    };

    return (
        <div className="mt-2">
            <div className="mb-4">
                <h2 className="shark-page-title fw-bold mb-0 text-white">
                    <i className="bi bi-box-seam glow-info" style={{ color: '#0dcaf0' }}></i> Controle de Estoque
                </h2>
                <p className="text-white-50 small">Gerencie entrada, saída e performance financeira do seu inventário</p>
            </div>

            <div className="card shark-page-card border-left-info shadow-lg mb-4">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit} className="row g-3 align-items-end">
                        <div className="col-12 col-md-2">
                            <label className="form-label text-info small fw-bold text-uppercase">Cód. Barras / SKU</label>
                            <input name="codigoBarras" value={formData.codigoBarras} onChange={handleInputChange}
                                   onBlur={(e) => verificarDuplicidade(e.target.value)}
                                   className="form-control bg-black text-white border-secondary shadow-none" placeholder="Ex: 789..." />
                        </div>
                        <div className="col-12 col-md-3">
                            <label className="form-label text-info small fw-bold text-uppercase">Nome do Produto</label>
                            <input name="nome" value={formData.nome} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none" placeholder="Ex: Teclado Mecânico" required />
                        </div>
                        <div className="col-12 col-md-3">
                            <label className="form-label text-info small fw-bold text-uppercase">Foto do produto</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="d-none"
                                onChange={onEscolherArquivoImagem}
                                disabled={!podeGerir || uploadingImg}
                            />
                            <div className="d-flex flex-wrap align-items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-info btn-sm"
                                    disabled={!podeGerir || uploadingImg}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploadingImg ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" />
                                            Enviando…
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-image me-1" />
                                            Escolher imagem
                                        </>
                                    )}
                                </button>
                                {formData.imagemUrl ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm text-white-50 p-0"
                                            onClick={() => setFormData((p) => ({ ...p, imagemUrl: '' }))}
                                        >
                                            Remover
                                        </button>
                                        <img
                                            src={formData.imagemUrl}
                                            alt=""
                                            className="rounded border border-secondary"
                                            style={{ width: 48, height: 48, objectFit: 'cover' }}
                                        />
                                    </>
                                ) : (
                                    <span className="text-white-50 small">Nenhuma</span>
                                )}
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-md-2">
                            <label className="form-label text-info small fw-bold text-uppercase">Custo (Und)</label>
                            <input name="precoCusto" type="number" step="0.01" value={formData.precoCusto} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none" placeholder="0.00" required />
                        </div>
                        <div className="col-12 col-sm-6 col-md-2">
                            <label className="form-label text-info small fw-bold text-uppercase">Venda (Und)</label>
                            <input name="precoVenda" type="number" step="0.01" value={formData.precoVenda} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none" placeholder="0.00" required />
                        </div>
                        <div className="col-12 col-sm-6 col-md-1">
                            <label className="form-label text-info small fw-bold text-uppercase">Qtd</label>
                            <input name="quantidade" type="number" value={formData.quantidade} onChange={handleInputChange}
                                   className="form-control bg-black text-white border-secondary shadow-none" required />
                        </div>
                        <div className="col-12 col-md-2">
                            <div className="d-flex flex-column flex-sm-row gap-2">
                                <button type="submit" disabled={saveMutation.isPending} className={`btn btn-shark-primary w-100 ${!podeGerir ? 'btn-readonly' : ''}`}>
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
                <div className="col-12 col-md-4">
                    <div className="card p-3 shark-page-card border-left-danger shadow-sm">
                        <p className="text-danger small fw-bold mb-1 text-uppercase">Total Investido</p>
                        <h3 className="fw-bold text-white mb-0">{formatarMoeda(financeiro.investido)}</h3>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card p-3 shark-page-card border-left-success shadow-sm">
                        <p className="text-success small fw-bold mb-1 text-uppercase">Faturamento Bruto</p>
                        <h3 className="fw-bold text-white mb-0">{formatarMoeda(financeiro.faturamento)}</h3>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card p-3 shark-page-card border-left-info shadow-sm">
                        <p className="text-info small fw-bold mb-1 text-uppercase">Lucro Líquido Previsto</p>
                        {(financeiro.margemGeral != null || financeiro.markupGeral != null) && (
                            <div className="text-white-50 mb-1" style={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                                {financeiro.margemGeral != null && <span>marg {financeiro.margemGeral}%</span>}
                                {financeiro.margemGeral != null && financeiro.markupGeral != null && ' · '}
                                {financeiro.markupGeral != null && <span>mk {financeiro.markupGeral}%</span>}
                            </div>
                        )}
                        <h3 className="fw-bold text-white mb-0">{formatarMoeda(financeiro.lucro)}</h3>
                    </div>
                </div>
            </div>

            <div className="card shadow-lg border-0 bg-dark text-white mb-5" style={{ borderRadius: '15px', overflow: 'hidden', borderLeft: '5px solid #333' }}>
                <div className="table-responsive shark-mobile-cards">
                    <table className="table table-hover table-dark mb-0 align-middle text-center small">
                        <thead className="bg-black text-muted text-uppercase">
                        <tr>
                            <th className="ps-2 text-start" rowSpan={2}>IMG</th>
                            <th className="text-start" rowSpan={2}>Cód / SKU</th>
                            <th className="text-start" rowSpan={2}>Produto</th>
                            <th rowSpan={2}>Qtd</th>
                            <th colSpan={2} className="text-danger border-bottom border-secondary">Custo</th>
                            <th colSpan={2} className="text-success border-bottom border-secondary">Venda</th>
                            <th colSpan={2} className="text-info border-bottom border-secondary">Lucro</th>
                            <th rowSpan={2}>Ações</th>
                        </tr>
                        <tr className="text-white-50" style={{ fontSize: '0.65rem' }}>
                            <th className="text-danger">(und)</th>
                            <th className="text-danger">(t.)</th>
                            <th className="text-success">(und)</th>
                            <th className="text-success">(t.)</th>
                            <th className="text-info">(und)</th>
                            <th className="text-info">(t.)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading && !pageData ? (
                            <tr><td colSpan={11} className="text-center py-4 text-info">Carregando…</td></tr>
                        ) : (
                        produtos.map(p => {
                            const q = p.quantidade ?? 0;
                            const cu = Number(p.precoCusto) || 0;
                            const vu = Number(p.precoVenda) || 0;
                            const lu = vu - cu;
                            const ct = cu * q;
                            const vt = vu * q;
                            const lt = lu * q;
                            return (
                            <tr key={p.id}>
                                <td className="ps-2 text-start" data-label="Imagem">
                                    {p.imagemUrl ? (
                                        <img src={p.imagemUrl} alt="" className="rounded" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                                    ) : (
                                        <span className="text-white-50">—</span>
                                    )}
                                </td>
                                <td className="text-start fw-bold text-info" data-label="Cód/SKU">{p.codigoBarras || 'S/C'}</td>
                                <td className="text-start fw-bold" data-label="Produto">{p.nome}</td>
                                <td className="fw-bold" data-label="Qtd">{q}</td>
                                <td className="text-danger" data-label="Custo und">{formatarMoeda(cu)}</td>
                                <td className="text-danger" data-label="Custo t.">{formatarMoeda(ct)}</td>
                                <td className="text-success" data-label="Venda und">{formatarMoeda(vu)}</td>
                                <td className="text-success" data-label="Venda t.">{formatarMoeda(vt)}</td>
                                <td className="text-info" data-label="Lucro und">
                                    <div className="d-flex flex-column align-items-center gap-0">
                                        <span className="text-white-50" style={{ fontSize: '0.58rem', lineHeight: 1.15 }}>
                                            marg {margemPct(cu, vu)} · mk {markupPct(cu, vu)}
                                        </span>
                                        <span className="fw-bold">{formatarMoeda(lu)}</span>
                                    </div>
                                </td>
                                <td className="text-info" data-label="Lucro t.">
                                    <div className="d-flex flex-column align-items-center gap-0">
                                        <span className="text-white-50" style={{ fontSize: '0.58rem', lineHeight: 1.15 }}>
                                            marg {margemPct(cu, vu)} · mk {markupPct(cu, vu)}
                                        </span>
                                        <span className="fw-bold">{formatarMoeda(lt)}</span>
                                    </div>
                                </td>
                                <td className="text-center" data-label="Ações">
                                    <div className="btn-group gap-1">
                                        <button onClick={() => prepararEdicao(p)}
                                                className={`btn btn-sm btn-outline-info ${!podeGerir ? 'btn-readonly' : ''}`}>
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        {podeGerir && (
                                            <button onClick={() => handleDeletar(p.id)} className="btn btn-sm btn-outline-danger" disabled={deleteMutation.isPending}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            );
                        })
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
                disabled={isFetching}
            />
        </div>
    );
};

export default Estoque;