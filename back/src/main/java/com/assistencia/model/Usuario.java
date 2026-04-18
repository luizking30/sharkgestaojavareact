package com.assistencia.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Informação obrigatória")
    private String nome;

    @NotBlank(message = "Informação obrigatória")
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank(message = "Informação obrigatória")
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Informação obrigatória")
    @Email(message = "E-mail inválido")
    @Column(nullable = false)
    private String email;

    @NotBlank(message = "Informação obrigatória")
    @Column(length = 20, unique = true)
    private String whatsapp;

    @NotBlank(message = "Informação obrigatória")
    @Column(length = 14)
    private String cpf;

    private String role;

    @Column(nullable = false)
    private boolean aprovado = false;

    // 🛡️ TRAVA SHARK: Define se o usuário é o administrador raiz (imune a exclusão)
    @Column(name = "is_root", nullable = false)
    private boolean isRoot = false;

    @Column(nullable = false)
    private Double comissaoOs = 0.0;

    @Column(nullable = false)
    private Double comissaoVenda = 0.0;

    /** Data de cadastro do usuário (para “dias na plataforma” no painel OWNER). */
    @Column(name = "data_cadastro")
    private LocalDateTime dataCadastro = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    // --- CAMPOS PARA RECUPERAÇÃO DE SENHA ---
    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "token_expiration")
    private LocalDateTime tokenExpiration;

    // Campos @Transient: Existem apenas na memória do Java para cálculos
    @Transient
    private Double totalComissaoOsAcumulada = 0.0;

    @Transient
    private Double saldoVendaCalculado = 0.0;

    @Transient
    private Double brutoVendaCalculado = 0.0;

    @Transient
    private Double brutoOsCalculado = 0.0;

    @Transient
    private Double totalPagoOs = 0.0;

    @Transient
    private Double totalPagoVenda = 0.0;

    @Transient
    private LocalDateTime dataUltimoPagamento;

    @Transient
    private Long diasSemPagamento;

    /**
     * Lógica de Negócio: Soma o saldo de OS e Vendas para exibir o total a receber.
     */
    public Double getSaldoTotalReceber() {
        double os = (totalComissaoOsAcumulada != null) ? totalComissaoOsAcumulada : 0.0;
        double vendas = (saldoVendaCalculado != null) ? saldoVendaCalculado : 0.0;
        return os + vendas;
    }

    public Usuario() {}

    @PrePersist
    public void prePersistDataCadastro() {
        if (dataCadastro == null) {
            dataCadastro = LocalDateTime.now();
        }
    }

    public Usuario(String nome, String username, String email, String whatsapp, String cpf, String password, String role, boolean aprovado, Empresa empresa) {
        this.nome = nome;
        this.username = username;
        this.email = email;
        this.whatsapp = whatsapp;
        this.cpf = cpf;
        this.password = password;
        this.role = role;
        this.aprovado = aprovado;
        this.empresa = empresa;
        this.isRoot = false; // Por padrão, construtor comum cria usuários não-root
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    @JsonIgnore
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) {
        String roleAtualNorm = normalizeRole(this.role);
        String novaRoleNorm = normalizeRole(role);
        // Blindagem global: OWNER não pode ser rebaixado por nenhum fluxo.
        if (isOwnerRole(roleAtualNorm) && !isOwnerRole(novaRoleNorm)) {
            return;
        }
        this.role = role;
    }

    public boolean isAprovado() { return aprovado; }
    public void setAprovado(boolean aprovado) { this.aprovado = aprovado; }

    public boolean isRoot() { return isRoot; }
    public void setRoot(boolean root) { isRoot = root; }

    public Double getComissaoOs() { return comissaoOs; }
    public void setComissaoOs(Double comissaoOs) { this.comissaoOs = comissaoOs; }

    public Double getComissaoVenda() { return comissaoVenda; }
    public void setComissaoVenda(Double comissaoVenda) { this.comissaoVenda = comissaoVenda; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public LocalDateTime getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(LocalDateTime dataCadastro) { this.dataCadastro = dataCadastro; }

    public String getResetPasswordToken() { return resetPasswordToken; }
    public void setResetPasswordToken(String resetPasswordToken) { this.resetPasswordToken = resetPasswordToken; }

    public LocalDateTime getTokenExpiration() { return tokenExpiration; }
    public void setTokenExpiration(LocalDateTime tokenExpiration) { this.tokenExpiration = tokenExpiration; }

    private String normalizeRole(String value) {
        if (value == null) return "";
        String v = value.trim().toUpperCase();
        return v.startsWith("ROLE_") ? v : "ROLE_" + v;
    }

    private boolean isOwnerRole(String normalizedRole) {
        // Aceita variações legadas (OWNER, ROLE_OWNER, RULE_OWNER, etc.)
        return normalizedRole != null && normalizedRole.contains("OWNER");
    }

    public Double getTotalComissaoOsAcumulada() { return totalComissaoOsAcumulada; }
    public void setTotalComissaoOsAcumulada(Double totalComissaoOsAcumulada) { this.totalComissaoOsAcumulada = totalComissaoOsAcumulada; }

    public Double getSaldoVendaCalculado() { return saldoVendaCalculado; }
    public void setSaldoVendaCalculado(Double saldoVendaCalculado) { this.saldoVendaCalculado = saldoVendaCalculado; }

    public Double getBrutoVendaCalculado() { return brutoVendaCalculado; }
    public void setBrutoVendaCalculado(Double brutoVendaCalculado) { this.brutoVendaCalculado = brutoVendaCalculado; }

    public Double getBrutoOsCalculado() { return brutoOsCalculado; }
    public void setBrutoOsCalculado(Double brutoOsCalculado) { this.brutoOsCalculado = brutoOsCalculado; }

    public Double getTotalPagoOs() { return totalPagoOs; }
    public void setTotalPagoOs(Double totalPagoOs) { this.totalPagoOs = totalPagoOs; }

    public Double getTotalPagoVenda() { return totalPagoVenda; }
    public void setTotalPagoVenda(Double totalPagoVenda) { this.totalPagoVenda = totalPagoVenda; }

    public LocalDateTime getDataUltimoPagamento() { return dataUltimoPagamento; }
    public void setDataUltimoPagamento(LocalDateTime dataUltimoPagamento) { this.dataUltimoPagamento = dataUltimoPagamento; }

    public Long getDiasSemPagamento() { return diasSemPagamento; }
    public void setDiasSemPagamento(Long diasSemPagamento) { this.diasSemPagamento = diasSemPagamento; }

    public Double getValor() { return totalComissaoOsAcumulada; }
}