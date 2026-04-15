import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from './api';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const Vendas = ({ usuarioLogado }) => {
    const queryClient = useQueryClient();

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

    const isAdmin = usuarioLogado?.role === 'ROLE_ADMIN';
    const inputBuscaRef = useRef(null);

    // --- 2. CÁLCULOS (MOVIDO PARA O TOPO PARA EVITAR ERRO DE INICIALIZAÇÃO) ---
    const totalGeral = useMemo(() => {
        return itensCarrinho.reduce((acc, it) => acc + it.subtotal, 0);
    }, [itensCarrinho]);

    // --- 3. CARREGAMENTO DO HISTÓRICO VIA REACT QUERY ---
    const { data: vendasHistorico = [] } = useQuery({
        queryKey: ['historico-vendas'],
        queryFn: async () => {
            const res = await api.get('/api/vendas');
            return res.data;
        }
    });

    // --- 4. EFEITOS INICIAIS (RELÓGIO E ATALHOS) ---
    useEffect(() => {
        const timer = setInterval(() => {
            setRelogio(new Date().toLocaleTimeString('pt-BR'));
        }, 1000);

        const handleF2 = (e) => {
            if (e.key === "F2") {
                e.preventDefault();
                finalizarVenda();
            }
        };
        window.addEventListener('keydown', handleF2);

        return () => {
            clearInterval(timer);
            window.removeEventListener('keydown', handleF2);
        };
    }, [itensCarrinho, totalGeral]);

    // --- LOGICA DE BUSCA ---
    const buscarProdutos = async (valor) => {
        setTermoBusca(valor);
        if (valor.length < 1) {
            setSugestoes([]);
            return;
        }
        try {
            const res = await api.get(`/api/estoque/sugestoes?termo=${valor}`);
            setSugestoes(res.data);
            setExibirSugestoes(true);
        } catch (err) { console.error(err); }
    };

    const selecionarProduto = (p) => {
        setProdutoSelecionado(p);
        setTermoBusca(p.nome);
        setPrecoUn(p.precoVenda);
        setExibirSugestoes(false);
    };

    // --- LOGICA DO CARRINHO ---
    const adicionarAoCarrinho = () => {
        if (!produtoSelecionado) return alert("Selecione um produto!");
        if (quantidade > produtoSelecionado.quantidade) {
            alert(`Estoque insuficiente! Disponível: ${produtoSelecionado.quantidade}`);
            return;
        }
        if (desconto > 10) {
            alert("Desconto máximo permitido: 10%");
            return;
        }

        const precoFinal = precoUn - (precoUn * (desconto / 100));

        const itemExistente = itensCarrinho.find(it => it.produtoId === produtoSelecionado.id);
        if (itemExistente) {
            if (itemExistente.qtd + quantidade > produtoSelecionado.quantidade) {
                alert("Soma excede o estoque disponível!");
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
                precoOriginal: precoUn,
                precoFinal: precoFinal,
                desconto: desconto,
                qtd: quantity || quantidade,
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

    const finalizarVenda = async () => {
        if (itensCarrinho.length === 0) return alert("Carrinho vazio!");

        const vendaDTO = {
            valorTotal: totalGeral,
            itens: itensCarrinho.map(it => ({
                produto: { id: it.produtoId },
                quantidade: it.qtd,
                precoUnitario: it.precoFinal,
                desconto: it.desconto
            }))
        };

        try {
            await api.post('/api/vendas/salvar', vendaDTO);
            alert("Venda Finalizada com Sucesso!");

            queryClient.invalidateQueries({ queryKey: ['dados-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['historico-vendas'] });

            setItensCarrinho([]);
        } catch (err) { alert("Erro ao salvar venda."); }
    };

    // --- FILTRAGEM DO HISTORICO ---
    const historicoFiltrado = useMemo(() => {
        return vendasHistorico.filter(v => {
            const matchId = filtros.id === '' || v.id.toString().includes(filtros.id);
            const matchVend = v.vendedor?.nome.toLowerCase().includes(filtros.vendedor.toLowerCase());
            const matchData = filtros.data === '' || v.dataHora.startsWith(filtros.data);
            return matchId && matchVend && matchData;
        });
    }, [vendasHistorico, filtros]);

    return (
        <div className="mt-2 text-white">
            <style>
                {`
                .shark-card { background: #1a1a1a; border-radius: 15px; border-left: 5px solid #333; transition: 0.3s; }
                .border-left-info { border-left-color: #0dcaf0 !important; }
                .glow-info { filter: drop-shadow(0 0 5px #0dcaf0); }
                .sugestoes-wrapper { background: #121212; border: 2px solid #0dcaf0; position: absolute; width: 100%; z-index: 2000; border-radius: 0 0 10px 10px; max-height: 300px; overflow-y: auto; }
                .suggestion-item { padding: 12px; border-bottom: 1px solid #222; cursor: pointer; }
                .suggestion-item:hover { background: #1a1a1a; border-left: 3px solid #0dcaf0; }
                #totalVenda { text-shadow: 0 0 15px rgba(6, 249, 6, 0.6); font-family: 'Courier New', monospace; color: #06f906; font-size: 3.5rem; }
                .input-busca-venda { background: #000 !important; border: 1px solid #333 !important; color: #fff !important; }
                input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
                .historico-item-linha { border-bottom: 1px solid rgba(255,255,255,0.05); padding: 5px 0; }
                `}
            </style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0">
                        <i className="bi bi-cart-plus glow-info" style={{ color: '#0dcaf0' }}></i> PDV Shark Eletrônicos
                    </h2>
                    <p className="text-white-50 small">Terminal de Venda Direta | <span className="text-info">Unidade Brasília</span></p>
                </div>
                <span className="badge bg-black border border-info text-info px-3 py-2" style={{ fontSize: '1rem' }}>
                    <i className="bi bi-clock me-2"></i>{relogio}
                </span>
            </div>

            <div className="card shark-card border-left-info mb-5">
                <div className="card-body p-4">
                    <div className="row g-3 align-items-end mb-4 border-bottom border-secondary pb-4">
                        <div className="col-md-4 position-relative">
                            <label className="text-info small fw-bold text-uppercase">Localizar Produto</label>
                            <input ref={inputBuscaRef} type="text" className="form-control bg-black text-white p-3"
                                   value={termoBusca} onChange={(e) => buscarProdutos(e.target.value)}
                                   placeholder="Nome ou código..." onBlur={() => setTimeout(() => setExibirSugestoes(false), 200)} />
                            {exibirSugestoes && sugestoes.length > 0 && (
                                <div className="sugestoes-wrapper">
                                    {sugestoes.map(p => (
                                        <div key={p.id} className="suggestion-item" onClick={() => selecionarProduto(p)}>
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
                        <div className="col-md-2">
                            <label className="text-info small fw-bold">PREÇO UN.</label>
                            <input type="number" className="form-control bg-black text-white p-3" value={precoUn} onChange={e => setPrecoUn(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <label className="text-info small fw-bold">DESC. (%)</label>
                            <input type="number" className="form-control bg-black text-white p-3" value={desconto} onChange={e => setDesconto(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <label className="text-info small fw-bold">QTD</label>
                            <input type="number" className="form-control bg-black text-white p-3" value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value) || 1)} />
                        </div>
                        <div className="col-md-2">
                            <button className="btn btn-info w-100 p-3 fw-bold" onClick={adicionarAoCarrinho}>INCLUIR</button>
                        </div>
                    </div>

                    <div className="table-responsive" style={{ minHeight: '150px' }}>
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
                                    <td className="ps-4">#{it.produtoId}</td>
                                    <td>{it.nome}</td>
                                    <td className="text-center">{it.qtd}</td>
                                    <td>R$ {it.precoOriginal.toFixed(2)}</td>
                                    <td className="text-danger">-{it.desconto}%</td>
                                    <td className="text-success fw-bold">R$ {it.subtotal.toFixed(2)}</td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-outline-danger border-0" onClick={() => removerItem(idx)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <div>
                            <span className="text-white-50 small text-uppercase">Total da Venda</span>
                            <h1 id="totalVenda" className="fw-bold">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h1>
                        </div>
                        <div className="d-flex gap-3">
                            <button className="btn btn-outline-secondary btn-lg px-4" onClick={() => setItensCarrinho([])}>LIMPAR</button>
                            <button className="btn btn-success btn-lg px-5 fw-bold" onClick={finalizarVenda}>FINALIZAR (F2)</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-2 align-items-end mb-3">
                <div className="col-md-3"><h4>Histórico de Vendas</h4></div>
                <div className="col-md-2">
                    <input className="form-control input-busca-venda" placeholder="ID #" value={filtros.id} onChange={e => setFiltros({...filtros, id: e.target.value})} />
                </div>
                <div className="col-md-4">
                    <input className="form-control input-busca-venda" placeholder="Operador..." value={filtros.vendedor} onChange={e => setFiltros({...filtros, vendedor: e.target.value})} />
                </div>
                <div className="col-md-3">
                    <input type="date" className="form-control input-busca-venda" value={filtros.data} onChange={e => setFiltros({...filtros, data: e.target.value})} />
                </div>
            </div>

            <div className="card bg-dark border-0 rounded-4 overflow-hidden">
                <div className="table-responsive">
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
                        {historicoFiltrado.map(v => (
                            <tr key={v.id} className="align-middle">
                                <td className="ps-4">
                                    <div className="fw-bold">{new Date(v.dataHora).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</div>
                                    <div className="text-info small">#{v.id}</div>
                                </td>
                                <td><span className="badge bg-black border border-secondary">{v.vendedor?.nome || 'SISTEMA'}</span></td>
                                <td>
                                    {v.itens.map((item, idx) => (
                                        <div key={idx} className="historico-item-linha small">
                                            <span className="text-info fw-bold">#{item.produto.id}</span> {item.produto.nome} (x{item.quantidade})
                                        </div>
                                    ))}
                                </td>
                                <td className="text-success fw-bold">R$ {v.valorTotal.toFixed(2)}</td>
                                <td className="text-center">
                                    <button className="btn btn-sm btn-outline-info border-0"><i className="bi bi-printer"></i></button>
                                    {isAdmin && <button className="btn btn-sm btn-outline-danger border-0"><i className="bi bi-arrow-counterclockwise"></i></button>}
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

export default Vendas;