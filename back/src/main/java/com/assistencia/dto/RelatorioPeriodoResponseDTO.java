package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Formato plano consumido por {@code Relatorios.jsx} (cards + tabela de vendas).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RelatorioPeriodoResponseDTO {
    private LocalDate periodoInicio;
    private LocalDate periodoFim;

    private double totalVendasBruto;
    private double custoEstoqueVendido;
    private double lucroVendas;

    private double totalServicosBruto;
    private double custoPecasOS;
    private double lucroServicos;

    private double totalDespesas;
    private double lucroOperacional;
    private double lucroLiquidoFinal;

    /** Alias usado pelo React: {@code dados.lucroTotalFinal || dados.lucroTotalPeriodo} */
    private double lucroTotalFinal;
    private double lucroTotalPeriodo;

    private List<VendaRelatorioLinhaDTO> vendas = new ArrayList<>();
    private List<GraficoNomeValorDTO> dadosGrafico = new ArrayList<>();

    public LocalDate getPeriodoInicio() { return periodoInicio; }
    public void setPeriodoInicio(LocalDate periodoInicio) { this.periodoInicio = periodoInicio; }
    public LocalDate getPeriodoFim() { return periodoFim; }
    public void setPeriodoFim(LocalDate periodoFim) { this.periodoFim = periodoFim; }
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
    public double getLucroOperacional() { return lucroOperacional; }
    public void setLucroOperacional(double lucroOperacional) { this.lucroOperacional = lucroOperacional; }
    public double getLucroLiquidoFinal() { return lucroLiquidoFinal; }
    public void setLucroLiquidoFinal(double lucroLiquidoFinal) { this.lucroLiquidoFinal = lucroLiquidoFinal; }
    public double getLucroTotalFinal() { return lucroTotalFinal; }
    public void setLucroTotalFinal(double lucroTotalFinal) { this.lucroTotalFinal = lucroTotalFinal; }
    public double getLucroTotalPeriodo() { return lucroTotalPeriodo; }
    public void setLucroTotalPeriodo(double lucroTotalPeriodo) { this.lucroTotalPeriodo = lucroTotalPeriodo; }
    public List<VendaRelatorioLinhaDTO> getVendas() { return vendas; }
    public void setVendas(List<VendaRelatorioLinhaDTO> vendas) { this.vendas = vendas; }
    public List<GraficoNomeValorDTO> getDadosGrafico() { return dadosGrafico; }
    public void setDadosGrafico(List<GraficoNomeValorDTO> dadosGrafico) { this.dadosGrafico = dadosGrafico; }
}
