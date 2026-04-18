package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuperAdminFinanceiroMesDTO {
    private Double totalRecebidoMes;
    private String mesReferencia;
    private List<SuperAdminPagamentoMpDTO> pagamentos = new ArrayList<>();

    public Double getTotalRecebidoMes() { return totalRecebidoMes; }
    public void setTotalRecebidoMes(Double totalRecebidoMes) { this.totalRecebidoMes = totalRecebidoMes; }
    public String getMesReferencia() { return mesReferencia; }
    public void setMesReferencia(String mesReferencia) { this.mesReferencia = mesReferencia; }
    public List<SuperAdminPagamentoMpDTO> getPagamentos() { return pagamentos; }
    public void setPagamentos(List<SuperAdminPagamentoMpDTO> pagamentos) { this.pagamentos = pagamentos; }
}
