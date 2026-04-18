package com.assistencia.dto.mapper;

import com.assistencia.dto.ItemVendaRelatorioDTO;
import com.assistencia.dto.ProdutoNomeDTO;
import com.assistencia.dto.VendaRelatorioLinhaDTO;
import com.assistencia.model.ItemVenda;
import com.assistencia.model.Venda;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public final class RelatorioMapper {

    private RelatorioMapper() {}

    public static VendaRelatorioLinhaDTO vendaToLinha(Venda v) {
        if (v == null) return null;
        VendaRelatorioLinhaDTO d = new VendaRelatorioLinhaDTO();
        d.setId(v.getId());
        d.setDataHora(v.getDataHora());
        d.setValorTotal(v.getValorTotal());
        String nomeV = v.getNomeVendedorNoAto();
        if (nomeV == null || nomeV.isBlank()) {
            if (v.getVendedor() != null && v.getVendedor().getNome() != null) {
                nomeV = v.getVendedor().getNome();
            } else {
                nomeV = "—";
            }
        }
        d.setVendedor(nomeV);
        if (v.getItens() != null) {
            d.setItens(v.getItens().stream().map(RelatorioMapper::itemToLinha).collect(Collectors.toList()));
        } else {
            d.setItens(new ArrayList<>());
        }
        return d;
    }

    private static ItemVendaRelatorioDTO itemToLinha(ItemVenda it) {
        ItemVendaRelatorioDTO d = new ItemVendaRelatorioDTO();
        d.setQuantidade(it.getQuantidade());
        String nome = (it.getProduto() != null && it.getProduto().getNome() != null)
                ? it.getProduto().getNome()
                : "—";
        d.setProduto(new ProdutoNomeDTO(nome));
        return d;
    }

    public static List<VendaRelatorioLinhaDTO> vendasToLinhas(List<Venda> vendas) {
        return vendas.stream().map(RelatorioMapper::vendaToLinha).collect(Collectors.toList());
    }
}
