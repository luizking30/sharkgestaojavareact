package com.assistencia.dto.mapper;

import com.assistencia.dto.ItemVendaResponseDTO;
import com.assistencia.dto.VendaResponseDTO;
import com.assistencia.model.ItemVenda;
import com.assistencia.model.Venda;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.stream.Collectors;

public final class VendaMapper {

    private VendaMapper() {}

    public static VendaResponseDTO toResponse(Venda v) {
        if (v == null) return null;
        VendaResponseDTO d = new VendaResponseDTO();
        d.setId(v.getId());
        d.setDataHora(v.getDataHora());
        d.setValorTotal(v.getValorTotal());
        d.setCustoTotalEstoque(v.getCustoTotalEstoque());
        d.setComissaoVendedorValor(v.getComissaoVendedorValor());
        d.setTaxaComissaoAplicada(v.getTaxaComissaoAplicada());
        d.setNomeVendedorNoAto(v.getNomeVendedorNoAto());
        d.setPago(v.isPago());
        d.setVendedor(UsuarioMapper.toTecnicoResumo(v.getVendedor()));
        if (v.getItens() != null) {
            d.setItens(v.getItens().stream().map(VendaMapper::itemToResponse).collect(Collectors.toList()));
        }
        return d;
    }

    private static ItemVendaResponseDTO itemToResponse(ItemVenda it) {
        ItemVendaResponseDTO d = new ItemVendaResponseDTO();
        d.setId(it.getId());
        d.setQuantidade(it.getQuantidade());
        d.setPrecoUnitario(it.getPrecoUnitario());
        d.setDesconto(it.getDesconto());
        d.setCustoUnitario(it.getCustoUnitario());
        d.setProduto(ProdutoMapper.toResponse(it.getProduto()));
        return d;
    }

    public static Page<VendaResponseDTO> toResponsePage(Page<Venda> page) {
        List<VendaResponseDTO> content = page.getContent().stream()
                .map(VendaMapper::toResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }

    public static List<VendaResponseDTO> toResponseList(List<Venda> list) {
        return list.stream().map(VendaMapper::toResponse).collect(Collectors.toList());
    }
}
