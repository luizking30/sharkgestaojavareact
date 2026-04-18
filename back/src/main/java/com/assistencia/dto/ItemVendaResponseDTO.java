package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ItemVendaResponseDTO {
    private Long id;
    private Integer quantidade;
    private Double precoUnitario;
    private Double desconto;
    private Double custoUnitario;
    private ProdutoResponseDTO produto;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    public Double getPrecoUnitario() { return precoUnitario; }
    public void setPrecoUnitario(Double precoUnitario) { this.precoUnitario = precoUnitario; }
    public Double getDesconto() { return desconto; }
    public void setDesconto(Double desconto) { this.desconto = desconto; }
    public Double getCustoUnitario() { return custoUnitario; }
    public void setCustoUnitario(Double custoUnitario) { this.custoUnitario = custoUnitario; }
    public ProdutoResponseDTO getProduto() { return produto; }
    public void setProduto(ProdutoResponseDTO produto) { this.produto = produto; }
}
