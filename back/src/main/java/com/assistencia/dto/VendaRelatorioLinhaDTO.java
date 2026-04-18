package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class VendaRelatorioLinhaDTO {
    private Long id;
    private LocalDateTime dataHora;
    private String vendedor;
    private Double valorTotal;
    private List<ItemVendaRelatorioDTO> itens = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public String getVendedor() { return vendedor; }
    public void setVendedor(String vendedor) { this.vendedor = vendedor; }
    public Double getValorTotal() { return valorTotal; }
    public void setValorTotal(Double valorTotal) { this.valorTotal = valorTotal; }
    public List<ItemVendaRelatorioDTO> getItens() { return itens; }
    public void setItens(List<ItemVendaRelatorioDTO> itens) { this.itens = itens; }
}
