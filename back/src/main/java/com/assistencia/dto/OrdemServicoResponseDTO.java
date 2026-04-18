package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Campos expostos ao front (lista/detalhe O.S.) — sem {@code empresa} embutida.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrdemServicoResponseDTO {
    private Long id;
    private String clienteNome;
    private String clienteCpf;
    private String clienteWhatsapp;
    private String produto;
    private String defeito;
    private String status;
    private LocalDateTime data;
    private LocalDateTime dataAndamento;
    private LocalDateTime dataPronto;
    private LocalDateTime dataEntrega;
    private Double valorTotal;
    /** Alias compatível com {@code getValor()} da entidade legada. */
    private Double valor;
    private Double custoPeca;
    private Boolean pago;
    private Double comissaoTecnicoValor;
    private String funcionarioAbertura;
    private String funcionarioAndamento;
    private String funcionarioPronto;
    private String funcionarioEntrega;
    private TecnicoResumoDTO tecnico;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }
    public String getClienteCpf() { return clienteCpf; }
    public void setClienteCpf(String clienteCpf) { this.clienteCpf = clienteCpf; }
    public String getClienteWhatsapp() { return clienteWhatsapp; }
    public void setClienteWhatsapp(String clienteWhatsapp) { this.clienteWhatsapp = clienteWhatsapp; }
    public String getProduto() { return produto; }
    public void setProduto(String produto) { this.produto = produto; }
    public String getDefeito() { return defeito; }
    public void setDefeito(String defeito) { this.defeito = defeito; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getData() { return data; }
    public void setData(LocalDateTime data) { this.data = data; }
    public LocalDateTime getDataAndamento() { return dataAndamento; }
    public void setDataAndamento(LocalDateTime dataAndamento) { this.dataAndamento = dataAndamento; }
    public LocalDateTime getDataPronto() { return dataPronto; }
    public void setDataPronto(LocalDateTime dataPronto) { this.dataPronto = dataPronto; }
    public LocalDateTime getDataEntrega() { return dataEntrega; }
    public void setDataEntrega(LocalDateTime dataEntrega) { this.dataEntrega = dataEntrega; }
    public Double getValorTotal() { return valorTotal; }
    public void setValorTotal(Double valorTotal) { this.valorTotal = valorTotal; }
    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }
    public Double getCustoPeca() { return custoPeca; }
    public void setCustoPeca(Double custoPeca) { this.custoPeca = custoPeca; }
    public Boolean getPago() { return pago; }
    public void setPago(Boolean pago) { this.pago = pago; }
    public Double getComissaoTecnicoValor() { return comissaoTecnicoValor; }
    public void setComissaoTecnicoValor(Double comissaoTecnicoValor) { this.comissaoTecnicoValor = comissaoTecnicoValor; }
    public String getFuncionarioAbertura() { return funcionarioAbertura; }
    public void setFuncionarioAbertura(String funcionarioAbertura) { this.funcionarioAbertura = funcionarioAbertura; }
    public String getFuncionarioAndamento() { return funcionarioAndamento; }
    public void setFuncionarioAndamento(String funcionarioAndamento) { this.funcionarioAndamento = funcionarioAndamento; }
    public String getFuncionarioPronto() { return funcionarioPronto; }
    public void setFuncionarioPronto(String funcionarioPronto) { this.funcionarioPronto = funcionarioPronto; }
    public String getFuncionarioEntrega() { return funcionarioEntrega; }
    public void setFuncionarioEntrega(String funcionarioEntrega) { this.funcionarioEntrega = funcionarioEntrega; }
    public TecnicoResumoDTO getTecnico() { return tecnico; }
    public void setTecnico(TecnicoResumoDTO tecnico) { this.tecnico = tecnico; }
}
