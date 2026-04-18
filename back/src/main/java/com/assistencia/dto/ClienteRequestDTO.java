package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Cadastro/edição de cliente. {@code id} como string aceita "" do React.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClienteRequestDTO {
    private Object id;
    private String nome;
    private String cpf;
    private String whatsapp;

    public Object getId() { return id; }
    public void setId(Object id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }
    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
}
