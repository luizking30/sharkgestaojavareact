package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuperAdminUsuarioEcossistemaDTO {
    private Long id;
    private String nome;
    private String username;
    private String cpf;
    private String whatsapp;
    private String email;
    private String role;
    private boolean aprovado;
    @JsonProperty("isRoot")
    private boolean root;
    private long diasNaPlataforma;
    private Integer diasPlanoEmpresa;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }
    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isAprovado() { return aprovado; }
    public void setAprovado(boolean aprovado) { this.aprovado = aprovado; }
    public boolean isRoot() { return root; }
    public void setRoot(boolean root) { this.root = root; }
    public long getDiasNaPlataforma() { return diasNaPlataforma; }
    public void setDiasNaPlataforma(long diasNaPlataforma) { this.diasNaPlataforma = diasNaPlataforma; }
    public Integer getDiasPlanoEmpresa() { return diasPlanoEmpresa; }
    public void setDiasPlanoEmpresa(Integer diasPlanoEmpresa) { this.diasPlanoEmpresa = diasPlanoEmpresa; }
}
