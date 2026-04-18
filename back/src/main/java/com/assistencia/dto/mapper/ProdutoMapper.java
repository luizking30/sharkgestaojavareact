package com.assistencia.dto.mapper;

import com.assistencia.dto.ProdutoRequestDTO;
import com.assistencia.dto.ProdutoResponseDTO;
import com.assistencia.model.Produto;

public final class ProdutoMapper {

    private ProdutoMapper() {}

    public static ProdutoResponseDTO toResponse(Produto p) {
        if (p == null) return null;
        ProdutoResponseDTO d = new ProdutoResponseDTO();
        d.setId(p.getId());
        d.setCodigoBarras(p.getCodigoBarras());
        d.setNome(p.getNome());
        d.setPrecoCusto(p.getPrecoCusto());
        d.setPrecoVenda(p.getPrecoVenda());
        d.setQuantidade(p.getQuantidade());
        return d;
    }

    /** Preenche entidade a partir do request (id opcional para update). */
    public static void applyRequest(ProdutoRequestDTO dto, Produto dest) {
        if (dto == null || dest == null) return;
        dest.setCodigoBarras(dto.getCodigoBarras());
        dest.setNome(dto.getNome());
        dest.setPrecoCusto(dto.getPrecoCusto());
        dest.setPrecoVenda(dto.getPrecoVenda());
        dest.setQuantidade(dto.getQuantidade());
    }

    public static Long parseIdOrNull(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Number) return ((Number) raw).longValue();
        if (raw instanceof String s) {
            String t = s.trim();
            if (t.isEmpty()) return null;
            try {
                return Long.parseLong(t);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
