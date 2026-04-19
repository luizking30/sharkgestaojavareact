import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useQueryClient, useQuery, keepPreviousData } from '@tanstack/react-query';
import { debounce } from './utils/debounce';
import { unwrapPage } from './utils/pageResponse';
import SharkPagination from './components/SharkPagination';
import { useFeedback } from './context/FeedbackContext';
import { podeEstornoVenda } from './auth/accessRules';

const HIST_PAGE_SIZE = 15;

const Vendas = ({ usuarioLogado }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { notify } = useFeedback();

    // --- 1. ESTADOS DO PDV ---
    const [itensCarrinho, setItensCarrinho] = useState([]);
    const [relogio, setRelogio] = useState('--:--:--');
    const [termoBusca, setTermoBusca] = useState('');
    const [sugestoes, setSugestoes] = useState([]);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [exibirSugestoes, setExibirSugestoes] = useState(false);
    const [precoUn, setPrecoUn] = useState('');
    const [desconto, setDesconto] = useState(0);
    const [quantidade, setQuantidade] = useState(1);
    const [filtros, setFiltros] = useState({ id: '', vendedor: '', data: '' });
    const [histPage, setHistPage] = useState(0);
    /** Cliente obrigatório quando houver desconto no carrinho ou ao incluir item com desconto. */
    const [clienteVenda, setClienteVenda] = useState(null);
    const [modalClienteAberto, setModalClienteAberto] = useState(false);
    const [termoCliente, setTermoCliente] = useState('');
    const [sugestoesCliente, setSugestoesCliente] = useState([]);

    const podeEstorno = podeEstornoVenda(usuarioLogado?.role);
    const inputBuscaRef = useRef(null);

    // --- 2. CÁLCULOS (MOVIDO PARA O TOPO PARA EVITAR ERRO DE INICIALIZAÇÃO) ---
    const totalGeral = useMemo(() => {
        return itensCarrinho.reduce((acc, it) => acc + it.subtotal, 0);
    }, [itensCarrinho]);

    useEffect(() => {
        setHistPage(0);
    }, [filtros.id, filtros.vendedor, filtros.data]);

    const { data: histPageData, isLoading: histLoading, isFetching: histFetching } = useQuery({
        queryKey: ['historico-vendas', histPage, filtros.id, filtros.vendedor, filtros.data],
        queryFn: async () => {
            const params = {
                page: histPage,
                size: HIST_PAGE_SIZE,
                sort: 'dataHora,desc',
            };
            if (filtros.id && /^\d+$/.test(filtros.id.trim())) {
                params.id = Number(filtros.id.trim());
            }
            if (filtros.vendedor?.trim()) {
                params.vendedor = filtros.vendedor.trim();
            }
            if (filtros.data) {
                params.data = filtros.data;
            }
            const res = await api.get('/api/vendas', { params });
            return unwrapPage(res.data);
        },
        placeholderData: keepPreviousData,
    });

    const vendasHistorico = histPageData?.items ?? [];
    const histTotalElements = histPageData?.totalElements ?? 0;
    const histTotalPages = histPageData?.totalPages ?? 1;

    const debouncedFetchProdutos = useMemo(
        () =>
            debounce(async (valor) => {
                if (valor.length < 1) {
                    setSugestoes([]);
                    return;
                }
                try {
                    const res = await api.get(`/api/estoque/sugestoes?termo=${encodeURIComponent(valor)}`);
                    setSugestoes(res.data);
                    setExibirSugestoes(true);
                } catch (err) {
                    console.error(err);
                }
            }, 280),
        []
    );

    useEffect(() => {
        const timer = setInterval(() => {
            setRelogio(new Date().toLocaleTimeString('pt-BR'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const finalizarVenda = useCallback(async () => {
        if (itensCarrinho.length === 0) {
            notify.warning('Adicione itens ao carrinho antes de finalizar.', 'Carrinho vazio');
            return;
        }

        const precisaCliente = itensCarrinho.some((it) => Number(it.desconto) > 0);
        if (precisaCliente && !clienteVenda?.id) {
            notify.warning(
                'Descontos só podem ser aplicados a clientes cadastrados. Selecione o cliente antes de finalizar.',
                'Cliente obrigatório'
            );
            setModalClienteAberto(true);
            return;
        }

        const vendaDTO = {
            valorTotal: totalGeral,
            ...(precisaCliente && clienteVenda?.id ? { clienteId: clienteVenda.id } : {}),
            itens: itensCarrinho.map(it => ({
                produto: { id: it.produtoId },
                quantidade: it.qtd,
                precoUnitario: it.precoFinal,
                desconto: it.desconto
            }))
        };

        try {
            await api.post('/api/vendas/salvar', vendaDTO);
            notify.success('Venda finalizada com sucesso.', 'PDV');

            queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['historico-vendas'] });

            setItensCarrinho([]);
            setClienteVenda(null);
        } catch (err) {
            const msg = err.response?.data;
            notify.error(typeof msg === 'string' ? msg : 'Não foi possível salvar a venda.', 'PDV');
        }
    }, [itensCarrinho, totalGeral, queryClient, notify, clienteVenda]);

    useEffect(() => {
        const handleF2 = (e) => {
            if (e.key === "F2") {
                e.preventDefault();
                finalizarVenda();
            }
        };
        window.addEventListener('keydown', handleF2);
        return () => window.removeEventListener('keydown', handleF2);
    }, [finalizarVenda]);

    // --- LOGICA DE BUSCA ---
    const buscarProdutos = (valor) => {
        setTermoBusca(valor);
        if (valor.length < 1) {
            setSugestoes([]);
            return;
        }
        debouncedFetchProdutos(valor);
    };

    const selecionarProduto = (p) => {
        setProdutoSelecionado(p);
        setTermoBusca(p.nome);
        setPrecoUn(p.precoVenda);
        setExibirSugestoes(false);
    };

    const buscarClienteSugestoes = async (t) => {
        const v = String(t || '').trim();
        if (v.length < 1) {
            setSugestoesCliente([]);
            return;
        }
        try {
            const res = await api.get(`/api/clientes/sugestoes?termo=${encodeURIComponent(v)}`);
            setSugestoesCliente(Array.isArray(res.data) ? res.data : []);
        } catch {
            setSugestoesCliente([]);
        }
    };

    const tentarBuscaPorCodigoBarras = async () => {
        const t = String(termoBusca || '').trim();
        if (!t || !/^\d{3,}$/.test(t)) return false;
        try {
            const res = await api.get(`/api/estoque/buscar-por-codigo?codigo=${encodeURIComponent(t)}`);
            if (res.data) {
                selecionarProduto(res.data);
                return true;
            }
        } catch {
            /* continua fluxo normal */
        }
        return false;
    };

    const onBuscaProdutoKeyDown = async (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const okCodigo = await tentarBuscaPorCodigoBarras();
        if (okCodigo) return;
        if (sugestoes.length > 0) {
            selecionarProduto(sugestoes[0]);
        }
    };

    // --- LOGICA DO CARRINHO ---
    const adicionarAoCarrinho = () => {
        if (!produtoSelecionado) {
            notify.warning('Selecione um produto na busca antes de incluir.', 'PDV');
            return;
        }
        if (quantidade > produtoSelecionado.quantidade) {
            notify.warning(`Estoque insuficiente. Disponível: ${produtoSelecionado.quantidade}.`, 'Estoque');
            return;
        }
        const descontoNum = Number(desconto) || 0;
        if (descontoNum > 10) {
            notify.warning('Desconto máximo permitido: 10%.', 'PDV');
            return;
        }
        if (descontoNum > 0 && !clienteVenda?.id) {
            notify.warning(
                'Descontos só podem ser aplicados a clientes cadastrados. Busque e selecione o cliente.',
                'PDV'
            );
            setModalClienteAberto(true);
            return;
        }

        const precoNum = Number(precoUn) || 0;
        const precoFinal = precoNum - (precoNum * (descontoNum / 100));

        const itemExistente = itensCarrinho.find(it => it.produtoId === produtoSelecionado.id);
        if (itemExistente) {
            if (itemExistente.qtd + quantidade > produtoSelecionado.quantidade) {
                notify.warning('A quantidade total no carrinho excede o estoque disponível.', 'Estoque');
                return;
            }
            setItensCarrinho(itensCarrinho.map(it =>
                it.produtoId === produtoSelecionado.id
                    ? { ...it, qtd: it.qtd + quantidade, subtotal: precoFinal * (it.qtd + quantidade) }
                    : it
            ));
        } else {
            setItensCarrinho([...itensCarrinho, {
                produtoId: produtoSelecionado.id,
                nome: produtoSelecionado.nome,
                precoOriginal: precoNum,
                precoFinal: precoFinal,
                desconto: descontoNum,
                qtd: quantidade,
                subtotal: precoFinal * quantidade
            }]);
        }

        setTermoBusca('');
        setProdutoSelecionado(null);
        setPrecoUn('');
        setDesconto(0);
        setQuantidade(1);
        inputBuscaRef.current.focus();
    };

    const removerItem = (index) => {
        setItensCarrinho(itensCarrinho.filter((_, i) => i !== index));
    };

    return (
        <div className="mt-2 text-white">

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3 mb-4">
                <div className="w-100 w-md-auto">
                    <h2 className="shark-page-title fw-bold mb-0">
                        <i className="bi bi-cart-plus glow-info" style={{ color: '#0dcaf0' }}></i> PDV Shark Eletrônicos
                    </h2>
                    <p className="text-white-50 small">Terminal de Venda Direta | <span className="text-info">Unidade Brasília</span></p>
                </div>
                <span className="badge bg-black border border-info text-info px-3 py-2 align-self-start align-self-md-center" style={{ fontSize: '1rem' }}>
                    <i className="bi bi-clock me-2"></i>{relogio}
                </span>
            </div>

            <div className="card shark-page-card border-left-info mb-5">
                <div className="card-body p-4">
                    <div className="row g-3 align-items-end mb-4 border-bottom border-secondary pb-4">
                        <div className="col-12 col-md-4 position-relative">
                            <label className="text-info small fw-bold text-uppercase">Localizar Produto</label>
                            <input
                                ref={inputBuscaRef}
                                type="text"
                                className="form-control bg-black text-white p-3"
                                value={termoBusca}
                                onChange={(e) => buscarProdutos(e.target.value)}
                                onKeyDown={onBuscaProdutoKeyDown}
                                placeholder="Nome, SKU ou código de barras (Enter)"
                                onBlur={() => setTimeout(() => setExibirSugestoes(false), 200)}
                                autoComplete="off"
                            />
                            {exibirSugestoes && sugestoes.length > 0 && (
                                <div className="shark-sugestoes-wrapper">
                                    {sugestoes.map(p => (
                                        <div key={p.id} className="shark-suggestion-item" onClick={() => selecionarProduto(p)}>
                                            <div className="fw-bold text-info">{p.nome}</div>
                                            <div className="d-flex justify-content-between small">
                                                <span>Estoque: {p.quantidade}</span>
                                                <span className="text-success">R$ {p.precoVenda.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="col-12 col-sm-6 col-md-2">
                            <label className="text-info small fw-bold">PREÇO UN.</label>
                            <input type="number" className="form-control bg-black text-white p-3" value={precoUn} onChange={e => setPrecoUn(e.target.value)} />
                        </div>
                        <div className="col-12 col-sm-6 col-md-2">
                            <label className="text-info small fw-bold">DESC. (%)</label>
                            <input
                                type="number"
                                className="form-control bg-black text-white p-3"
                                value={desconto}
                                onChange={(e) => setDesconto(e.target.value)}
                            />
                        </div>
                        <div className="col-12 col-sm-6 col-md-2">
                            <label className="text-info small fw-bold">QTD</label>
                            <input type="number" className="form-control bg-black text-white p-3" value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value) || 1)} />
                        </div>
                        <div className="col-12 col-md-2">
                            <button type="button" className="btn btn-shark-primary w-100 p-3" onClick={adicionarAoCarrinho}>INCLUIR</button>
                        </div>
                    </div>

                    {Number(desconto) > 0 && (
                        <div className="alert alert-warning py-2 small mb-3 border-0" style={{ background: 'rgba(255, 193, 7, 0.12)', color: '#ffc107' }}>
                            <i className="bi bi-info-circle me-2" />
                            Descontos só podem ser aplicados a <strong>clientes cadastrados</strong>. Selecione o cliente antes de incluir ou finalizar.
                        </div>
                    )}

                    <div className="row g-2 align-items-end mb-4">
                        <div className="col-12 col-md-6">
                            <label className="text-info small fw-bold text-uppercase">Cliente (obrigatório se houver desconto)</label>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <span className="text-white-50 small">
                                    {clienteVenda ? (
                                        <>
                                            <strong className="text-white">{clienteVenda.nome}</strong>
                                            <span className="text-muted ms-1">#{clienteVenda.id}</span>
                                        </>
                                    ) : (
                                        'Nenhum selecionado'
                                    )}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => {
                                        setModalClienteAberto(true);
                                        buscarClienteSugestoes(termoCliente);
                                    }}
                                >
                                    {clienteVenda ? 'Trocar cliente' : 'Buscar cliente'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive shark-mobile-cards" style={{ minHeight: '150px' }}>
                        <table className="table table-dark table-hover">
                            <thead className="bg-black text-white-50 small">
                            <tr>
                                <th className="ps-4">CÓDIGO</th>
                                <th>DESCRIÇÃO</th>
                                <th className="text-center">QTD</th>
                                <th>UNITÁRIO</th>
                                <th>DESC.</th>
                                <th>SUBTOTAL</th>
                                <th className="text-center">AÇÃO</th>
                            </tr>
                            </thead>
                            <tbody>
                            {itensCarrinho.map((it, idx) => (
                                <tr key={idx} className="align-middle">
                                    <td className="ps-4" data-label="Código">#{it.produtoId}</td>
                                    <td data-label="Descrição">{it.nome}</td>
                                    <td className="text-center" data-label="Qtd">{it.qtd}</td>
                                    <td data-label="Unitário">R$ {it.precoOriginal.toFixed(2)}</td>
                                    <td className="text-danger" data-label="Desc.">-{it.desconto}%</td>
                                    <td className="text-success fw-bold" data-label="Subtotal">R$ {it.subtotal.toFixed(2)}</td>
                                    <td className="text-center" data-label="Ação">
                                        <button className="btn btn-sm btn-outline-danger border-0" onClick={() => removerItem(idx)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-4 shark-pdv-footer">
                        <div>
                            <span className="text-white-50 small text-uppercase">Total da Venda</span>
                            <h1 className="pdv-total-display fw-bold shark-pdv-total">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h1>
                        </div>
                        <div className="d-flex gap-3 shark-pdv-actions">
                            <button
                                type="button"
                                className="btn btn-shark-secondary btn-lg px-4"
                                onClick={() => {
                                    setItensCarrinho([]);
                                    setClienteVenda(null);
                                }}
                            >
                                LIMPAR
                            </button>
                            <button type="button" className="btn btn-success btn-lg px-5 fw-bold" onClick={finalizarVenda}>FINALIZAR (F2)</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-2 align-items-end mb-3">
                <div className="col-12 col-md-3"><h4 className="shark-page-title fs-5 mb-0 text-white">Histórico de Vendas</h4></div>
                <div className="col-12 col-sm-6 col-md-2">
                    <input className="form-control input-busca-venda" placeholder="ID #" value={filtros.id} onChange={e => setFiltros({...filtros, id: e.target.value})} />
                </div>
                <div className="col-12 col-md-4">
                    <input className="form-control input-busca-venda" placeholder="Operador..." value={filtros.vendedor} onChange={e => setFiltros({...filtros, vendedor: e.target.value})} />
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <input type="date" className="form-control input-busca-venda" value={filtros.data} onChange={e => setFiltros({...filtros, data: e.target.value})} />
                </div>
            </div>

            <div className="card bg-dark border-0 rounded-4 overflow-hidden">
                <div className="table-responsive shark-mobile-cards">
                    <table className="table table-dark table-hover mb-0">
                        <thead className="bg-black text-white-50 small">
                        <tr>
                            <th className="ps-4">DATA / ID</th>
                            <th>OPERADOR</th>
                            <th>PRODUTOS</th>
                            <th>TOTAL</th>
                            <th className="text-center">AÇÕES</th>
                        </tr>
                        </thead>
                        <tbody>
                        {histLoading && !histPageData ? (
                            <tr><td colSpan={5} className="text-center py-4 text-info">Carregando…</td></tr>
                        ) : (
                        vendasHistorico.map(v => (
                            <tr key={v.id} className="align-middle">
                                <td className="ps-4" data-label="Data / ID">
                                    <div className="fw-bold">{new Date(v.dataHora).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</div>
                                    <div className="text-info small">#{v.id}</div>
                                </td>
                                <td data-label="Operador"><span className="badge bg-black border border-secondary">{v.vendedor?.nome || 'SISTEMA'}</span></td>
                                <td data-label="Produtos">
                                    {v.itens.map((item, idx) => (
                                        <div key={idx} className="historico-item-linha small">
                                            <span className="text-info fw-bold">#{item.produto.id}</span> {item.produto.nome} (x{item.quantidade})
                                        </div>
                                    ))}
                                </td>
                                <td className="text-success fw-bold" data-label="Total">R$ {v.valorTotal.toFixed(2)}</td>
                                <td className="text-center" data-label="Ações">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-info border-0"
                                        title="Cupom / imprimir"
                                        onClick={() => navigate(`/imprimir-venda/${v.id}`)}
                                    >
                                        <i className="bi bi-printer"></i>
                                    </button>
                                    {podeEstorno && <button className="btn btn-sm btn-outline-danger border-0"><i className="bi bi-arrow-counterclockwise"></i></button>}
                                </td>
                            </tr>
                        ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SharkPagination
                page={histPage}
                totalPages={histTotalPages}
                totalElements={histTotalElements}
                pageSize={HIST_PAGE_SIZE}
                onPageChange={setHistPage}
                disabled={histFetching}
            />

            {modalClienteAberto && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.65)' }} role="dialog">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Cliente para desconto</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setModalClienteAberto(false)}
                                    aria-label="Fechar"
                                />
                            </div>
                            <div className="modal-body">
                                <p className="small text-warning mb-2">
                                    Descontos só podem ser aplicados a clientes cadastrados na empresa.
                                </p>
                                <input
                                    type="text"
                                    className="form-control bg-black text-white mb-2"
                                    placeholder="Nome do cliente..."
                                    value={termoCliente}
                                    onChange={(e) => {
                                        setTermoCliente(e.target.value);
                                        buscarClienteSugestoes(e.target.value);
                                    }}
                                    autoFocus
                                />
                                <div className="list-group list-group-flush">
                                    {sugestoesCliente.map((c) => (
                                        <button
                                            type="button"
                                            key={c.id}
                                            className="list-group-item list-group-item-action bg-black text-white border-secondary text-start"
                                            onClick={() => {
                                                setClienteVenda({ id: c.id, nome: c.nome });
                                                setModalClienteAberto(false);
                                                setTermoCliente('');
                                                notify.success(`Cliente: ${c.nome}`, 'PDV');
                                            }}
                                        >
                                            <strong>{c.nome}</strong>
                                            <span className="text-muted small ms-2">{c.cpf || ''}</span>
                                        </button>
                                    ))}
                                    {termoCliente.trim().length > 0 && sugestoesCliente.length === 0 && (
                                        <div className="text-white-50 small py-2">Nenhum cliente encontrado.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendas;