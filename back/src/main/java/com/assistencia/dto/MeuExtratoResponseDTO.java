package com.assistencia.dto;

import java.util.List;

public class MeuExtratoResponseDTO {
    private UsuarioResponseDTO usuario;
    private List<VendaExtratoDTO> vendas;
    private List<OrdemServicoResponseDTO> servicos;
    private List<PagamentoExtratoDTO> pagamentos;

    public UsuarioResponseDTO getUsuario() { return usuario; }
    public void setUsuario(UsuarioResponseDTO usuario) { this.usuario = usuario; }
    public List<VendaExtratoDTO> getVendas() { return vendas; }
    public void setVendas(List<VendaExtratoDTO> vendas) { this.vendas = vendas; }
    public List<OrdemServicoResponseDTO> getServicos() { return servicos; }
    public void setServicos(List<OrdemServicoResponseDTO> servicos) { this.servicos = servicos; }
    public List<PagamentoExtratoDTO> getPagamentos() { return pagamentos; }
    public void setPagamentos(List<PagamentoExtratoDTO> pagamentos) { this.pagamentos = pagamentos; }
}
