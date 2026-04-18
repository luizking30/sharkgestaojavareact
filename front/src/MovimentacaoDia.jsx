import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from './api';

/**
 * MovimentacaoDia - Componente de Dashboard Shark Eletrônicos
 * Corrigido para acessar o endpoint exato do Spring Boot.
 */
const MovimentacaoDia = () => {
    // 1. BUSCA DE DADOS VIA REACT QUERY (Ajustado para /api/dashboard)
    const { data: dashboardData, isLoading, isError } = useQuery({
        queryKey: ['dados-dashboard'],
        queryFn: async () => {
            // Removido o "/hoje" para casar com o seu @GetMapping no Java
            const res = await api.get('/api/dashboard');
            return res.data;
        },
        refetchOnWindowFocus: true,
        staleTime: 15_000,
        retry: 1
    });

    // 2. EXTRAÇÃO SEGURA (Lendo as chaves que você definiu no HashMap do Java)
    const clientesHoje = dashboardData?.clientesHoje || 0;
    const osCriadasHoje = dashboardData?.osCriadasHoje || 0;
    const vendasHoje = dashboardData?.vendasHoje || 0;
    const osEntreguesHoje = dashboardData?.osEntreguesHoje || 0;

    const totalVendasValorHoje = dashboardData?.totalVendasValorHoje || 0;
    const custoEstoqueHoje = dashboardData?.custoEstoqueHoje || 0;
    const vendaLiquidaHoje = dashboardData?.vendaLiquidaHoje || 0;

    const totalServicosHoje = dashboardData?.totalServicosHoje || 0;
    const totalGastoPecasHoje = dashboardData?.totalGastoPecasHoje || 0;
    const servicoLiquidoHoje = dashboardData?.servicoLiquidoHoje || 0;

    const lucroTotalHoje = dashboardData?.lucroTotalHoje || 0;

    // Função para formatar moeda brasileira
    const formatCurrency = (value) => {
        return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Cálculos de porcentagem
    const margemVendas = totalVendasValorHoje > 0 ? ((vendaLiquidaHoje / totalVendasValorHoje) * 100).toFixed(1) : '0';
    const markupVendas = custoEstoqueHoje > 0 ? ((vendaLiquidaHoje / custoEstoqueHoje) * 100).toFixed(1) : '0';

    const margemServicos = totalServicosHoje > 0 ? ((servicoLiquidoHoje / totalServicosHoje) * 100).toFixed(1) : '0';
    const markupServicos = totalGastoPecasHoje > 0 ? ((servicoLiquidoHoje / totalGastoPecasHoje) * 100).toFixed(1) : '0';

    // Caso de erro na API
    if (isError) {
        return (
            <div className="alert alert-danger mx-2">
                <i className="bi bi-exclamtion-triangle me-2"></i>
                Erro ao conectar com o servidor. Verifique se o Back-end está rodando.
            </div>
        );
    }

    return (
        <div className="mt-2 text-white">
            <div className="mb-4">
                <h2 className="shark-page-title mb-0 text-white fw-bold">
                    <i className="bi bi-speedometer2 text-white glow-success me-2"></i> MOVIMENTAÇÃO DO DIA
                </h2>
            </div>
            {isLoading && (
                <div className="alert alert-info py-2 small">
                    <i className="bi bi-arrow-repeat me-2"></i>Sincronizando Shark Eletrônicos...
                </div>
            )}

            <div className="row g-4 mb-4">
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card p-4 text-center h-100 shark-stat-card border-left-primary">
                        <div className="mb-2"><i className="bi bi-people-fill text-primary fs-1"></i></div>
                        <h6 className="text-white-50 small fw-bold text-uppercase">Clientes Novos</h6>
                        <h2 className="text-primary mb-0 fw-bold">{clientesHoje}</h2>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card p-4 text-center h-100 shark-stat-card border-left-info">
                        <div className="mb-2"><i className="bi bi-file-earmark-medical text-info fs-1"></i></div>
                        <h6 className="text-white-50 small fw-bold text-uppercase">OS Criadas</h6>
                        <h2 className="text-info mb-0 fw-bold">{osCriadasHoje}</h2>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card p-4 text-center h-100 shark-stat-card border-left-success">
                        <div className="mb-2"><i className="bi bi-cart-check-fill text-success fs-1"></i></div>
                        <h6 className="text-white-50 small fw-bold text-uppercase">Vendas Feitas</h6>
                        <h2 className="text-success mb-0 fw-bold">{vendasHoje}</h2>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card p-4 text-center h-100 shark-stat-card border-left-warning">
                        <div className="mb-2"><i className="bi bi-box-seam-fill text-warning fs-1"></i></div>
                        <h6 className="text-white-50 small fw-bold text-uppercase">OS Entregues</h6>
                        <h2 className="text-warning mb-0 fw-bold">{osEntreguesHoje}</h2>
                    </div>
                </div>
            </div>

            {/* SEÇÃO DE VENDAS */}
            <h5 className="text-white small fw-bold mb-3 text-uppercase"><i className="bi bi-bag-check me-2"></i>Vendas de hoje</h5>
            <div className="row g-4 mb-5">
                <div className="col-12 col-md-4">
                    <div className="card p-4 h-100 shark-stat-card border-left-success">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="text-success small fw-bold text-uppercase mb-2">Venda Bruta</h6>
                                <h3 className="text-success mb-0 fw-bold">R$ {formatCurrency(totalVendasValorHoje)}</h3>
                            </div>
                            <i className="bi bi-graph-up text-success icon-large-side glow-success"></i>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card p-4 h-100 shark-stat-card border-left-danger">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="text-danger small fw-bold text-uppercase mb-2">Custo Estoque</h6>
                                <h3 className="text-danger mb-0 fw-bold">R$ {formatCurrency(custoEstoqueHoje)}</h3>
                            </div>
                            <i className="bi bi-graph-down text-danger icon-large-side glow-danger"></i>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card p-4 h-100 shark-stat-card border-left-info shark-stat-card--gradient">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="text-info small fw-bold text-uppercase mb-2">Venda Líquida</h6>
                                <h3 className="text-info mb-0 fw-bold">R$ {formatCurrency(vendaLiquidaHoje)}</h3>
                                <div className="mt-2 text-white-50 small fw-bold">
                                    Margem: {margemVendas}% | Markup: {markupVendas}%
                                </div>
                            </div>
                            <i className="bi bi-gem text-info icon-large-side glow-info"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEÇÃO DE SERVIÇOS */}
            <h5 className="text-white small fw-bold mb-3 text-uppercase"><i className="bi bi-tools me-2"></i>Serviços entregues hoje</h5>
            <div className="row g-4 mb-5">
                <div className="col-12 col-md-4">
                    <div className="card p-4 h-100 shark-stat-card border-left-success">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="text-success small fw-bold text-uppercase mb-2">OS Bruto</h6>
                                <h3 className="text-success mb-0 fw-bold">R$ {formatCurrency(totalServicosHoje)}</h3>
                            </div>
                            <i className="bi bi-graph-up text-success icon-large-side glow-success"></i>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card p-4 h-100 shark-stat-card border-left-danger">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="text-danger small fw-bold text-uppercase mb-2">Gasto Peças</h6>
                                <h3 className="text-danger mb-0 fw-bold">R$ {formatCurrency(totalGastoPecasHoje)}</h3>
                            </div>
                            <i className="bi bi-wrench-adjustable text-danger icon-large-side glow-danger"></i>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card p-4 h-100 shark-stat-card border-left-info shark-stat-card--gradient">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="text-info small fw-bold text-uppercase mb-2">Serviço Líquido</h6>
                                <h3 className="text-info mb-0 fw-bold">R$ {formatCurrency(servicoLiquidoHoje)}</h3>
                                <div className="mt-2 text-white-50 small fw-bold">
                                    Margem: {margemServicos}% | Markup: {markupServicos}%
                                </div>
                            </div>
                            <i className="bi bi-lightning-charge-fill text-info icon-large-side glow-info"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOTAL FINAL */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="card p-4 shadow-lg shark-stat-card border-left-total shark-stat-card--gradient-row">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="text-success fw-bold text-uppercase mb-1">
                                    <span className="rocket-animate shark-rocket-emoji">🚀</span> Lucro Líquido Total
                                </h5>
                                <p className="text-white-50 small mb-0">(Vendas + Serviços)</p>
                            </div>
                            <div className="text-end">
                                <h1 className="text-white mb-0 fw-bold shark-dash-total-valor">
                                    R$ {formatCurrency(lucroTotalHoje)}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovimentacaoDia;