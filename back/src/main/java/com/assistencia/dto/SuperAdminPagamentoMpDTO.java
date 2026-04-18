package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuperAdminPagamentoMpDTO {
    private Long id;
    private Long mpPaymentId;
    private String dataHora;
    private Double valor;
    private String pagadorNome;
    private String pagadorEmail;
    private String empresaNome;
    private Long empresaId;
    private Integer diasCreditados;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMpPaymentId() { return mpPaymentId; }
    public void setMpPaymentId(Long mpPaymentId) { this.mpPaymentId = mpPaymentId; }
    public String getDataHora() { return dataHora; }
    public void setDataHora(String dataHora) { this.dataHora = dataHora; }
    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }
    public String getPagadorNome() { return pagadorNome; }
    public void setPagadorNome(String pagadorNome) { this.pagadorNome = pagadorNome; }
    public String getPagadorEmail() { return pagadorEmail; }
    public void setPagadorEmail(String pagadorEmail) { this.pagadorEmail = pagadorEmail; }
    public String getEmpresaNome() { return empresaNome; }
    public void setEmpresaNome(String empresaNome) { this.empresaNome = empresaNome; }
    public Long getEmpresaId() { return empresaId; }
    public void setEmpresaId(Long empresaId) { this.empresaId = empresaId; }
    public Integer getDiasCreditados() { return diasCreditados; }
    public void setDiasCreditados(Integer diasCreditados) { this.diasCreditados = diasCreditados; }
}
