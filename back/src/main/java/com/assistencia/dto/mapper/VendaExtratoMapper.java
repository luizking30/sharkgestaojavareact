package com.assistencia.dto.mapper;

import com.assistencia.dto.VendaExtratoDTO;
import com.assistencia.model.Venda;

public final class VendaExtratoMapper {

    private VendaExtratoMapper() {}

    public static VendaExtratoDTO toExtrato(Venda v) {
        if (v == null) return null;
        VendaExtratoDTO d = new VendaExtratoDTO();
        d.setId(v.getId());
        d.setDataHora(v.getDataHora());
        d.setValorTotal(v.getValorTotal());
        d.setComissaoVendedorValor(v.getComissaoVendedorValor());
        return d;
    }
}
