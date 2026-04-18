package com.assistencia.dto.mapper;

import com.assistencia.dto.PagamentoExtratoDTO;
import com.assistencia.model.PagamentoComissao;

public final class PagamentoExtratoMapper {

    private PagamentoExtratoMapper() {}

    public static PagamentoExtratoDTO toExtrato(PagamentoComissao p) {
        if (p == null) return null;
        PagamentoExtratoDTO d = new PagamentoExtratoDTO();
        d.setId(p.getId());
        d.setFuncionarioId(p.getFuncionarioId());
        d.setNomeFuncionario(p.getNomeFuncionario());
        d.setValorPago(p.getValorPago());
        d.setDataHora(p.getDataHora());
        d.setResponsavelPagamento(p.getResponsavelPagamento());
        d.setTipoComissao(p.getTipoComissao());
        return d;
    }
}
