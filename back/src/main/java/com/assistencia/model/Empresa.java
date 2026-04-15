package com.assistencia.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "empresas")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true)
    private String cnpj;

    private boolean ativo = true;

    // 🔥 NOVO CAMPO: Define quantos dias de uso a empresa ainda tem
    @Column(name = "dias_restantes")
    private Integer diasRestantes = 30; // Começa com 30 dias de brinde ao cadastrar

    private LocalDateTime dataCadastro = LocalDateTime.now();

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }

    // 🔥 NOVOS GETTERS E SETTERS PARA A TRAVA
    public Integer getDiasRestantes() {
        return diasRestantes != null ? diasRestantes : 0;
    }
    public void setDiasRestantes(Integer diasRestantes) {
        this.diasRestantes = diasRestantes;
    }

    public LocalDateTime getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(LocalDateTime dataCadastro) { this.dataCadastro = dataCadastro; }
}