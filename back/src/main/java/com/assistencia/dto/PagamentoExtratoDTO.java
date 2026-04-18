package com.assistencia.dto;

import java.time.LocalDateTime;

public class PagamentoExtratoDTO {
    private Long id;
    private Long funcionarioId;
    private String nomeFuncionario;
    private Double valorPago;
    private LocalDateTime dataHora;
    private String responsavelPagamento;
    private String tipoComissao;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFuncionarioId() { return funcionarioId; }
    public void setFuncionarioId(Long funcionarioId) { this.funcionarioId = funcionarioId; }
    public String getNomeFuncionario() { return nomeFuncionario; }
    public void setNomeFuncionario(String nomeFuncionario) { this.nomeFuncionario = nomeFuncionario; }
    public Double getValorPago() { return valorPago; }
    public void setValorPago(Double valorPago) { this.valorPago = valorPago; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public String getResponsavelPagamento() { return responsavelPagamento; }
    public void setResponsavelPagamento(String responsavelPagamento) { this.responsavelPagamento = responsavelPagamento; }
    public String getTipoComissao() { return tipoComissao; }
    public void setTipoComissao(String tipoComissao) { this.tipoComissao = tipoComissao; }
}
