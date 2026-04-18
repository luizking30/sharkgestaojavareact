package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuperAdminEmpresaEcossistemaDTO {
    private Long id;
    private String nome;
    private String cnpj;
    private String whatsapp;
    private String whatsappExibicao;
    private boolean ativo;
    private Integer diasRestantes;
    private long diasDesdeCadastroEmpresa;
    private String dataCadastroEmpresa;
    private List<String> proprietarios = new ArrayList<>();
    private int totalFuncionarios;
    private List<SuperAdminUsuarioEcossistemaDTO> usuarios = new ArrayList<>();
    private List<String> listaEquipe = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
    public String getWhatsappExibicao() { return whatsappExibicao; }
    public void setWhatsappExibicao(String whatsappExibicao) { this.whatsappExibicao = whatsappExibicao; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public Integer getDiasRestantes() { return diasRestantes; }
    public void setDiasRestantes(Integer diasRestantes) { this.diasRestantes = diasRestantes; }
    public long getDiasDesdeCadastroEmpresa() { return diasDesdeCadastroEmpresa; }
    public void setDiasDesdeCadastroEmpresa(long diasDesdeCadastroEmpresa) { this.diasDesdeCadastroEmpresa = diasDesdeCadastroEmpresa; }
    public String getDataCadastroEmpresa() { return dataCadastroEmpresa; }
    public void setDataCadastroEmpresa(String dataCadastroEmpresa) { this.dataCadastroEmpresa = dataCadastroEmpresa; }
    public List<String> getProprietarios() { return proprietarios; }
    public void setProprietarios(List<String> proprietarios) { this.proprietarios = proprietarios; }
    public int getTotalFuncionarios() { return totalFuncionarios; }
    public void setTotalFuncionarios(int totalFuncionarios) { this.totalFuncionarios = totalFuncionarios; }
    public List<SuperAdminUsuarioEcossistemaDTO> getUsuarios() { return usuarios; }
    public void setUsuarios(List<SuperAdminUsuarioEcossistemaDTO> usuarios) { this.usuarios = usuarios; }
    public List<String> getListaEquipe() { return listaEquipe; }
    public void setListaEquipe(List<String> listaEquipe) { this.listaEquipe = listaEquipe; }
}
