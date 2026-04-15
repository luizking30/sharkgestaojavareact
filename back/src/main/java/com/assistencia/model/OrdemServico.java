package com.assistencia.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ordem_servico")
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String clienteNome;
    private String clienteCpf;
    private String clienteWhatsapp;
    private String produto;

    @Column(columnDefinition = "TEXT")
    private String defeito;

    @Column(length = 50)
    private String status;

    private LocalDateTime data;           // Data de Abertura
    private LocalDateTime dataAndamento;  // Data de Início do Serviço
    private LocalDateTime dataEntrega;    // Data de Finalização/Entrega

    private Double valorTotal = 0.0;
    private Double custoPeca = 0.0;

    // --- CONTROLE DE COMISSÃO ---
    private boolean pago = false;
    private Double comissaoTecnicoValor = 0.0; // VALOR FIXADO NO ATO DA ENTREGA

    // --- CAMPOS DE AUDITORIA (NOMES DOS FUNCIONÁRIOS) ---
    private String funcionarioAbertura;
    private String funcionarioAndamento;
    private String funcionarioEntrega;

    // Relacionamento com a classe Usuario (O técnico responsável)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tecnico_id")
    private Usuario tecnico;

    // --- RELACIONAMENTO SaaS (MULTITENANT) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    public OrdemServico() {
        this.data = LocalDateTime.now();
        if (this.status == null) {
            this.status = "Em análise";
        }
    }

    // --- GETTERS E SETTERS ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getClienteCpf() { return clienteCpf; }
    public void setClienteCpf(String clienteCpf) { this.clienteCpf = clienteCpf; }

    public String getClienteWhatsapp() { return clienteWhatsapp; }
    public void setClienteWhatsapp(String clienteWhatsapp) { this.clienteWhatsapp = clienteWhatsapp; }

    public String getProduto() { return produto; }
    public void setProduto(String produto) { this.produto = produto; }

    public String getDefeito() { return defeito; }
    public void setDefeito(String defeito) { this.defeito = defeito; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getData() { return data; }
    public void setData(LocalDateTime data) { this.data = data; }

    public LocalDateTime getDataAndamento() { return dataAndamento; }
    public void setDataAndamento(LocalDateTime dataAndamento) { this.dataAndamento = dataAndamento; }

    public LocalDateTime getDataEntrega() { return dataEntrega; }
    public void setDataEntrega(LocalDateTime dataEntrega) { this.dataEntrega = dataEntrega; }

    public Double getValorTotal() { return valorTotal; }
    public void setValorTotal(Double valorTotal) { this.valorTotal = valorTotal; }

    public Double getCustoPeca() { return custoPeca; }
    public void setCustoPeca(Double custoPeca) { this.custoPeca = custoPeca; }

    public Usuario getTecnico() { return tecnico; }
    public void setTecnico(Usuario tecnico) { this.tecnico = tecnico; }

    public boolean isPago() { return pago; }
    public void setPago(boolean pago) { this.pago = pago; }

    public Double getComissaoTecnicoValor() { return comissaoTecnicoValor; }
    public void setComissaoTecnicoValor(Double comissaoTecnicoValor) { this.comissaoTecnicoValor = comissaoTecnicoValor; }

    public String getFuncionarioAbertura() { return funcionarioAbertura; }
    public void setFuncionarioAbertura(String funcionarioAbertura) { this.funcionarioAbertura = funcionarioAbertura; }

    public String getFuncionarioAndamento() { return funcionarioAndamento; }
    public void setFuncionarioAndamento(String funcionarioAndamento) { this.funcionarioAndamento = funcionarioAndamento; }

    public String getFuncionarioEntrega() { return funcionarioEntrega; }
    public void setFuncionarioEntrega(String funcionarioEntrega) { this.funcionarioEntrega = funcionarioEntrega; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    // Métodos de compatibilidade (Aliasing)
    public Double getValor() { return valorTotal; }
    public void setValor(Double valor) { this.valorTotal = valor; }
}