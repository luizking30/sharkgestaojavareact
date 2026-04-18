package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ItemVendaRelatorioDTO {
    private Integer quantidade;
    private ProdutoNomeDTO produto;

    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    public ProdutoNomeDTO getProduto() { return produto; }
    public void setProduto(ProdutoNomeDTO produto) { this.produto = produto; }
}
