package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class VendaSalvarRequestDTO {
    /** Enviado pelo PDV; o total efetivo é recalculado em {@code Venda#validarDadosAntesDeSalvar}. */
    private Double valorTotal;
    private List<ItemSalvarDTO> itens;

    public Double getValorTotal() { return valorTotal; }
    public void setValorTotal(Double valorTotal) { this.valorTotal = valorTotal; }
    public List<ItemSalvarDTO> getItens() { return itens; }
    public void setItens(List<ItemSalvarDTO> itens) { this.itens = itens; }

    public static class ItemSalvarDTO {
        private ProdutoRefDTO produto;
        private Integer quantidade;
        private Double precoUnitario;
        private Double desconto;

        public ProdutoRefDTO getProduto() { return produto; }
        public void setProduto(ProdutoRefDTO produto) { this.produto = produto; }
        public Integer getQuantidade() { return quantidade; }
        public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
        public Double getPrecoUnitario() { return precoUnitario; }
        public void setPrecoUnitario(Double precoUnitario) { this.precoUnitario = precoUnitario; }
        public Double getDesconto() { return desconto; }
        public void setDesconto(Double desconto) { this.desconto = desconto; }
    }

    public static class ProdutoRefDTO {
        private Long id;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
    }
}
