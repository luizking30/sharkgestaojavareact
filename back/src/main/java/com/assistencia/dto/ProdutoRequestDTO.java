package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Entrada de salvar/atualizar produto (sem empresa; o backend define o tenant).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProdutoRequestDTO {
    /** Aceita número JSON, string numérica ou string vazia (formulário React). */
    private Object id;
    private String codigoBarras;
    private String nome;
    private Double precoCusto;
    private Double precoVenda;
    private Integer quantidade;

    public Object getId() { return id; }
    public void setId(Object id) { this.id = id; }
    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String codigoBarras) { this.codigoBarras = codigoBarras; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public Double getPrecoCusto() { return precoCusto; }
    public void setPrecoCusto(Double precoCusto) { this.precoCusto = precoCusto; }
    public Double getPrecoVenda() { return precoVenda; }
    public void setPrecoVenda(Double precoVenda) { this.precoVenda = precoVenda; }
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
}
