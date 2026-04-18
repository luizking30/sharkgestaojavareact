package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resposta de {@code /api/auth/login} e {@code /api/auth/me} — mesmas chaves que o React faz merge no localStorage.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthSessionResponseDTO {
    private String token;
    private Long id;
    private String username;
    private String role;
    private String nome;
    private EmpresaResponseDTO empresa;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public EmpresaResponseDTO getEmpresa() { return empresa; }
    public void setEmpresa(EmpresaResponseDTO empresa) { this.empresa = empresa; }
}
