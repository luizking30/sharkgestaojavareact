package com.assistencia.dto.mapper;

import com.assistencia.dto.ClienteRequestDTO;
import com.assistencia.dto.ClienteResponseDTO;
import com.assistencia.model.Cliente;

public final class ClienteMapper {

    private ClienteMapper() {}

    public static ClienteResponseDTO toResponse(Cliente c) {
        if (c == null) return null;
        ClienteResponseDTO d = new ClienteResponseDTO();
        d.setId(c.getId());
        d.setNome(c.getNome());
        d.setCpf(c.getCpf());
        d.setWhatsapp(c.getWhatsapp());
        d.setDataCadastro(c.getDataCadastro());
        return d;
    }

    public static void applyRequest(ClienteRequestDTO dto, Cliente dest) {
        if (dto == null || dest == null) return;
        dest.setNome(dto.getNome());
        dest.setCpf(dto.getCpf());
        dest.setWhatsapp(dto.getWhatsapp());
    }

    public static Long parseIdOrNull(Object raw) {
        return ProdutoMapper.parseIdOrNull(raw);
    }
}
