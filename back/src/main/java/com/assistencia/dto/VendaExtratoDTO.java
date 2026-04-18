package com.assistencia.dto;

import java.time.LocalDateTime;

/** Campos usados em {@code MeuPainel} para a tabela de vendas. */
public class VendaExtratoDTO {
    private Long id;
    private LocalDateTime dataHora;
    private Double valorTotal;
    private Double comissaoVendedorValor;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public Double getValorTotal() { return valorTotal; }
    public void setValorTotal(Double valorTotal) { this.valorTotal = valorTotal; }
    public Double getComissaoVendedorValor() { return comissaoVendedorValor; }
    public void setComissaoVendedorValor(Double comissaoVendedorValor) { this.comissaoVendedorValor = comissaoVendedorValor; }
}
