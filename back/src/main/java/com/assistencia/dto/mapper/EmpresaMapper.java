package com.assistencia.dto.mapper;

import com.assistencia.dto.EmpresaResponseDTO;
import com.assistencia.model.Empresa;

public final class EmpresaMapper {

    private EmpresaMapper() {}

    public static EmpresaResponseDTO toResponse(Empresa e) {
        if (e == null) return null;
        EmpresaResponseDTO d = new EmpresaResponseDTO();
        d.setId(e.getId());
        d.setNome(e.getNome());
        d.setCnpj(e.getCnpj());
        d.setWhatsapp(e.getWhatsapp());
        d.setDiasRestantes(e.getDiasRestantes());
        d.setAtivo(e.isAtivo());
        return d;
    }
}
