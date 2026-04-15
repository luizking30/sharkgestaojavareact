package com.assistencia.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidade que registra cada saída de dinheiro para pagamento de comissão.
 * Esses registros são usados para subtrair do saldo total produzido pelo funcionário.
 * Agora com suporte a distinção entre O.S. e Vendas.
 */
@Entity
@Table(name = "pagamento_comissao")
public class PagamentoComissao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- RELACIONAMENTO SaaS (MULTITENANT) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    // ID do funcionário para vincular o abatimento ao saldo dele
    private Long funcionarioId;

    private String nomeFuncionario;

    private Double valorPago;

    private LocalDateTime dataHora;

    // Nome do administrador que realizou o pagamento
    private String responsavelPagamento;

    /**
     * NOVO CAMPO: Identifica a origem do abatimento.
     * Valores esperados: "OS" ou "VENDA"
     */
    private String tipoComissao;

    // Construtor Padrão (Obrigatório pelo JPA)
    public PagamentoComissao() {}

    // Construtor Auxiliar para facilitar a criação (Atualizado com Empresa)
    public PagamentoComissao(Empresa empresa, Long funcionarioId, String nomeFuncionario, Double valorPago,
                             LocalDateTime dataHora, String responsavelPagamento, String tipoComissao) {
        this.empresa = empresa;
        this.funcionarioId = funcionarioId;
        this.nomeFuncionario = nomeFuncionario;
        this.valorPago = valorPago;
        this.dataHora = dataHora;
        this.responsavelPagamento = responsavelPagamento;
        this.tipoComissao = tipoComissao;
    }

    // --- Getters e Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public Long getFuncionarioId() {
        return funcionarioId;
    }

    public void setFuncionarioId(Long funcionarioId) {
        this.funcionarioId = funcionarioId;
    }

    public String getNomeFuncionario() {
        return nomeFuncionario;
    }

    public void setNomeFuncionario(String nomeFuncionario) {
        this.nomeFuncionario = nomeFuncionario;
    }

    public Double getValorPago() {
        return valorPago;
    }

    public void setValorPago(Double valorPago) {
        this.valorPago = valorPago;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public String getResponsavelPagamento() {
        return responsavelPagamento;
    }

    public void setResponsavelPagamento(String responsavelPagamento) {
        this.responsavelPagamento = responsavelPagamento;
    }

    public String getTipoComissao() {
        return tipoComissao;
    }

    public void setTipoComissao(String tipoComissao) {
        this.tipoComissao = tipoComissao;
    }
}