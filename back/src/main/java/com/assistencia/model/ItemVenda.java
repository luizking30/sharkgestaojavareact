package com.assistencia.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "item_venda")
@Data
@NoArgsConstructor
public class ItemVenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venda_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Venda venda;

    @ManyToOne(fetch = FetchType.EAGER) // 👈 DICA: Mude para EAGER para o React receber os dados do produto (nome, etc)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    private Integer quantidade;

    private Double precoUnitario = 0.0;

    private Double desconto = 0.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(name = "custo_unitario")
    private Double custoUnitario = 0.0;

    public ItemVenda(Venda venda, Produto produto, Integer quantidade, Double precoUnitario, Double custoUnitario, Double desconto, Empresa empresa) {
        this.venda = venda;
        this.produto = produto;
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
        this.custoUnitario = custoUnitario;
        this.desconto = desconto;
        this.empresa = empresa;
    }
}