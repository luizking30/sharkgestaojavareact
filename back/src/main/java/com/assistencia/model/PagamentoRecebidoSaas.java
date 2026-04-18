package com.assistencia.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Registro de cada pagamento aprovado no Mercado Pago (webhook), para faturamento real no painel OWNER.
 */
@Entity
@Table(name = "pagamento_recebido_saas")
public class PagamentoRecebidoSaas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mp_payment_id", unique = true, nullable = false)
    private Long mpPaymentId;

    @Column(name = "empresa_id")
    private Long empresaId;

    @Column(name = "empresa_nome", length = 512)
    private String empresaNome;

    @Column(nullable = false)
    private Double valor;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "pagador_nome", length = 512)
    private String pagadorNome;

    @Column(name = "pagador_email", length = 255)
    private String pagadorEmail;

    @Column(name = "dias_creditados")
    private Integer diasCreditados;

    @Column(length = 64)
    private String status;

    public PagamentoRecebidoSaas() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMpPaymentId() { return mpPaymentId; }
    public void setMpPaymentId(Long mpPaymentId) { this.mpPaymentId = mpPaymentId; }

    public Long getEmpresaId() { return empresaId; }
    public void setEmpresaId(Long empresaId) { this.empresaId = empresaId; }

    public String getEmpresaNome() { return empresaNome; }
    public void setEmpresaNome(String empresaNome) { this.empresaNome = empresaNome; }

    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }

    public String getPagadorNome() { return pagadorNome; }
    public void setPagadorNome(String pagadorNome) { this.pagadorNome = pagadorNome; }

    public String getPagadorEmail() { return pagadorEmail; }
    public void setPagadorEmail(String pagadorEmail) { this.pagadorEmail = pagadorEmail; }

    public Integer getDiasCreditados() { return diasCreditados; }
    public void setDiasCreditados(Integer diasCreditados) { this.diasCreditados = diasCreditados; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
