package com.assistencia.dto.mapper;

import com.assistencia.dto.AuthSessionResponseDTO;
import com.assistencia.dto.TecnicoResumoDTO;
import com.assistencia.dto.UsuarioRequestDTO;
import com.assistencia.dto.UsuarioResponseDTO;
import com.assistencia.model.Usuario;

public final class UsuarioMapper {

    private UsuarioMapper() {}

    public static TecnicoResumoDTO toTecnicoResumo(Usuario u) {
        if (u == null) return null;
        TecnicoResumoDTO d = new TecnicoResumoDTO();
        d.setId(u.getId());
        d.setNome(u.getNome());
        d.setUsername(u.getUsername());
        return d;
    }

    public static UsuarioResponseDTO toResponse(Usuario u) {
        if (u == null) return null;
        UsuarioResponseDTO d = new UsuarioResponseDTO();
        d.setId(u.getId());
        d.setNome(u.getNome());
        d.setUsername(u.getUsername());
        d.setEmail(u.getEmail());
        d.setWhatsapp(u.getWhatsapp());
        d.setCpf(u.getCpf());
        d.setRole(u.getRole());
        d.setAprovado(u.isAprovado());
        d.setRoot(u.isRoot());
        d.setComissaoOs(u.getComissaoOs());
        d.setComissaoVenda(u.getComissaoVenda());
        d.setDataCadastro(u.getDataCadastro());
        d.setTotalComissaoOsAcumulada(u.getTotalComissaoOsAcumulada());
        d.setSaldoVendaCalculado(u.getSaldoVendaCalculado());
        d.setBrutoVendaCalculado(u.getBrutoVendaCalculado());
        d.setBrutoOsCalculado(u.getBrutoOsCalculado());
        d.setTotalPagoOs(u.getTotalPagoOs());
        d.setTotalPagoVenda(u.getTotalPagoVenda());
        d.setDataUltimoPagamento(u.getDataUltimoPagamento());
        d.setDiasSemPagamento(u.getDiasSemPagamento());
        return d;
    }

    public static AuthSessionResponseDTO toAuthSession(Usuario u, String token) {
        if (u == null) return null;
        AuthSessionResponseDTO d = new AuthSessionResponseDTO();
        d.setToken(token);
        d.setId(u.getId());
        d.setUsername(u.getUsername());
        d.setRole(u.getRole());
        d.setNome(u.getNome());
        d.setEmpresa(EmpresaMapper.toResponse(u.getEmpresa()));
        return d;
    }

    public static Usuario fromRequest(UsuarioRequestDTO req) {
        Usuario u = new Usuario();
        u.setNome(req.getNome());
        u.setCpf(req.getCpf());
        u.setEmail(req.getEmail());
        u.setWhatsapp(req.getWhatsapp());
        u.setUsername(req.getUsername());
        u.setPassword(req.getPassword());
        return u;
    }
}
