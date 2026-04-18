package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Usuário sem credenciais — extrato, painel empresa e demais respostas.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UsuarioResponseDTO {
    private Long id;
    private String nome;
    private String username;
    private String email;
    private String whatsapp;
    private String cpf;
    private String role;
    private Boolean aprovado;
    private Boolean root;
    private Double comissaoOs;
    private Double comissaoVenda;
    private LocalDateTime dataCadastro;
    private Double totalComissaoOsAcumulada;
    private Double saldoVendaCalculado;
    private Double brutoVendaCalculado;
    private Double brutoOsCalculado;
    private Double totalPagoOs;
    private Double totalPagoVenda;
    private LocalDateTime dataUltimoPagamento;
    private Long diasSemPagamento;

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
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Boolean getAprovado() { return aprovado; }
    public void setAprovado(Boolean aprovado) { this.aprovado = aprovado; }
    public Boolean getRoot() { return root; }
    public void setRoot(Boolean root) { this.root = root; }
    public Double getComissaoOs() { return comissaoOs; }
    public void setComissaoOs(Double comissaoOs) { this.comissaoOs = comissaoOs; }
    public Double getComissaoVenda() { return comissaoVenda; }
    public void setComissaoVenda(Double comissaoVenda) { this.comissaoVenda = comissaoVenda; }
    public LocalDateTime getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(LocalDateTime dataCadastro) { this.dataCadastro = dataCadastro; }
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
}
