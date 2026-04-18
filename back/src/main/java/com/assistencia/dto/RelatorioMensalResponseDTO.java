package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Payload de {@code RelatorioMensal.jsx} (fechamento por mês).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RelatorioMensalResponseDTO {
    private String mesReferencia;
    private double totalVendasBruto;
    private double custoEstoqueVendido;
    private double lucroVendas;
    private double totalServicosBruto;
    private double custoPecasOS;
    private double lucroServicos;
    private double totalDespesas;
    /** Lucro operacional após despesas (mesmo valor que {@link RelatorioPeriodoResponseDTO#getLucroLiquidoFinal()}). */
    private double lucroFinalPosContas;

    public String getMesReferencia() { return mesReferencia; }
    public void setMesReferencia(String mesReferencia) { this.mesReferencia = mesReferencia; }
    public double getTotalVendasBruto() { return totalVendasBruto; }
    public void setTotalVendasBruto(double totalVendasBruto) { this.totalVendasBruto = totalVendasBruto; }
    public double getCustoEstoqueVendido() { return custoEstoqueVendido; }
    public void setCustoEstoqueVendido(double custoEstoqueVendido) { this.custoEstoqueVendido = custoEstoqueVendido; }
    public double getLucroVendas() { return lucroVendas; }
    public void setLucroVendas(double lucroVendas) { this.lucroVendas = lucroVendas; }
    public double getTotalServicosBruto() { return totalServicosBruto; }
    public void setTotalServicosBruto(double totalServicosBruto) { this.totalServicosBruto = totalServicosBruto; }
    public double getCustoPecasOS() { return custoPecasOS; }
    public void setCustoPecasOS(double custoPecasOS) { this.custoPecasOS = custoPecasOS; }
    public double getLucroServicos() { return lucroServicos; }
    public void setLucroServicos(double lucroServicos) { this.lucroServicos = lucroServicos; }
    public double getTotalDespesas() { return totalDespesas; }
    public void setTotalDespesas(double totalDespesas) { this.totalDespesas = totalDespesas; }
    public double getLucroFinalPosContas() { return lucroFinalPosContas; }
    public void setLucroFinalPosContas(double lucroFinalPosContas) { this.lucroFinalPosContas = lucroFinalPosContas; }
}
