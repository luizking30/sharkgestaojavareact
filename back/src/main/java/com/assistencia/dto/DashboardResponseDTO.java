package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardResponseDTO {
    private long clientesHoje;
    private long osCriadasHoje;
    private long vendasHoje;
    private long osEntreguesHoje;
    private double totalVendasValorHoje;
    private double custoEstoqueHoje;
    private double vendaLiquidaHoje;
    private double totalServicosHoje;
    private double totalGastoPecasHoje;
    private double servicoLiquidoHoje;
    private double lucroTotalHoje;

    public long getClientesHoje() { return clientesHoje; }
    public void setClientesHoje(long clientesHoje) { this.clientesHoje = clientesHoje; }
    public long getOsCriadasHoje() { return osCriadasHoje; }
    public void setOsCriadasHoje(long osCriadasHoje) { this.osCriadasHoje = osCriadasHoje; }
    public long getVendasHoje() { return vendasHoje; }
    public void setVendasHoje(long vendasHoje) { this.vendasHoje = vendasHoje; }
    public long getOsEntreguesHoje() { return osEntreguesHoje; }
    public void setOsEntreguesHoje(long osEntreguesHoje) { this.osEntreguesHoje = osEntreguesHoje; }
    public double getTotalVendasValorHoje() { return totalVendasValorHoje; }
    public void setTotalVendasValorHoje(double totalVendasValorHoje) { this.totalVendasValorHoje = totalVendasValorHoje; }
    public double getCustoEstoqueHoje() { return custoEstoqueHoje; }
    public void setCustoEstoqueHoje(double custoEstoqueHoje) { this.custoEstoqueHoje = custoEstoqueHoje; }
    public double getVendaLiquidaHoje() { return vendaLiquidaHoje; }
    public void setVendaLiquidaHoje(double vendaLiquidaHoje) { this.vendaLiquidaHoje = vendaLiquidaHoje; }
    public double getTotalServicosHoje() { return totalServicosHoje; }
    public void setTotalServicosHoje(double totalServicosHoje) { this.totalServicosHoje = totalServicosHoje; }
    public double getTotalGastoPecasHoje() { return totalGastoPecasHoje; }
    public void setTotalGastoPecasHoje(double totalGastoPecasHoje) { this.totalGastoPecasHoje = totalGastoPecasHoje; }
    public double getServicoLiquidoHoje() { return servicoLiquidoHoje; }
    public void setServicoLiquidoHoje(double servicoLiquidoHoje) { this.servicoLiquidoHoje = servicoLiquidoHoje; }
    public double getLucroTotalHoje() { return lucroTotalHoje; }
    public void setLucroTotalHoje(double lucroTotalHoje) { this.lucroTotalHoje = lucroTotalHoje; }
}
