package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class VendaResponseDTO {
    private Long id;
    private LocalDateTime dataHora;
    private Double valorTotal;
    private Double custoTotalEstoque;
    private Double comissaoVendedorValor;
    private Double taxaComissaoAplicada;
    private String nomeVendedorNoAto;
    /** Cliente vinculado quando houve desconto na venda. */
    private String clienteNome;
    private boolean pago;
    private TecnicoResumoDTO vendedor;
    private List<ItemVendaResponseDTO> itens = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public Double getValorTotal() { return valorTotal; }
    public void setValorTotal(Double valorTotal) { this.valorTotal = valorTotal; }
    public Double getCustoTotalEstoque() { return custoTotalEstoque; }
    public void setCustoTotalEstoque(Double custoTotalEstoque) { this.custoTotalEstoque = custoTotalEstoque; }
    public Double getComissaoVendedorValor() { return comissaoVendedorValor; }
    public void setComissaoVendedorValor(Double comissaoVendedorValor) { this.comissaoVendedorValor = comissaoVendedorValor; }
    public Double getTaxaComissaoAplicada() { return taxaComissaoAplicada; }
    public void setTaxaComissaoAplicada(Double taxaComissaoAplicada) { this.taxaComissaoAplicada = taxaComissaoAplicada; }
    public String getNomeVendedorNoAto() { return nomeVendedorNoAto; }
    public void setNomeVendedorNoAto(String nomeVendedorNoAto) { this.nomeVendedorNoAto = nomeVendedorNoAto; }
    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }
    public boolean isPago() { return pago; }
    public void setPago(boolean pago) { this.pago = pago; }
    public TecnicoResumoDTO getVendedor() { return vendedor; }
    public void setVendedor(TecnicoResumoDTO vendedor) { this.vendedor = vendedor; }
    public List<ItemVendaResponseDTO> getItens() { return itens; }
    public void setItens(List<ItemVendaResponseDTO> itens) { this.itens = itens; }
}
