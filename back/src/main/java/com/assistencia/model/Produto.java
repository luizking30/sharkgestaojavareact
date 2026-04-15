package com.assistencia.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "produto", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"codigo_barras", "empresa_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- RELACIONAMENTO SaaS (MULTITENANT) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(name = "codigo_barras", length = 50)
    private String codigoBarras;

    @Column(nullable = false)
    private String nome;

    private Double precoCusto;
    private Double precoVenda;
    private Integer quantidade;

    // Método auxiliar para facilitar a criação rápida se necessário
    public Produto(String nome, Double precoCusto, Double precoVenda, Integer quantidade, Empresa empresa) {
        this.nome = nome;
        this.precoCusto = precoCusto;
        this.precoVenda = precoVenda;
        this.quantidade = quantidade;
        this.empresa = empresa;
    }
}