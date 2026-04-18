package com.assistencia.dto.mapper;

import com.assistencia.dto.SuperAdminEmpresaEcossistemaDTO;
import com.assistencia.dto.SuperAdminFinanceiroMesDTO;
import com.assistencia.dto.SuperAdminPagamentoMpDTO;
import com.assistencia.dto.SuperAdminUsuarioEcossistemaDTO;
import com.assistencia.model.Empresa;
import com.assistencia.model.PagamentoRecebidoSaas;
import com.assistencia.model.Usuario;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public final class SuperAdminMapper {

    private SuperAdminMapper() {}

    public static SuperAdminFinanceiroMesDTO toFinanceiroMes(Double total, String mesReferencia,
                                                             List<PagamentoRecebidoSaas> lista) {
        SuperAdminFinanceiroMesDTO out = new SuperAdminFinanceiroMesDTO();
        out.setTotalRecebidoMes(total != null ? total : 0.0);
        out.setMesReferencia(mesReferencia);
        List<SuperAdminPagamentoMpDTO> rows = new ArrayList<>();
        for (PagamentoRecebidoSaas p : lista) {
            SuperAdminPagamentoMpDTO m = new SuperAdminPagamentoMpDTO();
            m.setId(p.getId());
            m.setMpPaymentId(p.getMpPaymentId());
            m.setDataHora(p.getDataHora() != null ? p.getDataHora().toString() : null);
            m.setValor(p.getValor());
            m.setPagadorNome(p.getPagadorNome());
            m.setPagadorEmail(p.getPagadorEmail());
            m.setEmpresaNome(p.getEmpresaNome());
            m.setEmpresaId(p.getEmpresaId());
            m.setDiasCreditados(p.getDiasCreditados());
            rows.add(m);
        }
        out.setPagamentos(rows);
        return out;
    }

    public static SuperAdminEmpresaEcossistemaDTO toEmpresaEcossistema(Empresa emp, List<Usuario> vinculos, LocalDate hoje) {
        SuperAdminEmpresaEcossistemaDTO dados = new SuperAdminEmpresaEcossistemaDTO();
        dados.setId(emp.getId());
        dados.setNome(emp.getNome());
        dados.setCnpj(emp.getCnpj() != null ? emp.getCnpj() : "NÃO INFORMADO");
        String wppEmp = emp.getWhatsapp();
        dados.setWhatsapp((wppEmp != null && !wppEmp.isBlank()) ? wppEmp.trim() : null);
        dados.setWhatsappExibicao((wppEmp != null && !wppEmp.isBlank()) ? wppEmp.trim() : "Não cadastrado");
        dados.setAtivo(emp.isAtivo());
        dados.setDiasRestantes(emp.getDiasRestantes());

        long diasEmpresa = 0L;
        if (emp.getDataCadastro() != null) {
            diasEmpresa = ChronoUnit.DAYS.between(emp.getDataCadastro().toLocalDate(), hoje);
        }
        dados.setDiasDesdeCadastroEmpresa(diasEmpresa);
        dados.setDataCadastroEmpresa(emp.getDataCadastro() != null ? emp.getDataCadastro().toString() : null);

        List<String> proprietarios = vinculos.stream()
                .filter(Usuario::isRoot)
                .map(Usuario::getNome)
                .collect(Collectors.toList());
        dados.setProprietarios(proprietarios);
        dados.setTotalFuncionarios(vinculos.size());

        List<String> equipeCompleta = vinculos.stream()
                .map(u -> u.getNome() + " (" + (u.getRole() != null ? u.getRole().replace("ROLE_", "") : "—") + ")")
                .collect(Collectors.toList());
        dados.setListaEquipe(equipeCompleta);

        List<SuperAdminUsuarioEcossistemaDTO> usuariosPayload = new ArrayList<>();
        for (Usuario u : vinculos) {
            SuperAdminUsuarioEcossistemaDTO uDto = new SuperAdminUsuarioEcossistemaDTO();
            uDto.setId(u.getId());
            uDto.setNome(u.getNome());
            uDto.setUsername(u.getUsername());
            uDto.setCpf(u.getCpf() != null ? u.getCpf() : "—");
            uDto.setWhatsapp(u.getWhatsapp() != null ? u.getWhatsapp() : "—");
            uDto.setEmail(u.getEmail() != null ? u.getEmail() : "—");
            uDto.setRole(u.getRole() != null ? u.getRole().replace("ROLE_", "") : "—");
            uDto.setAprovado(u.isAprovado());
            uDto.setRoot(u.isRoot());

            LocalDate refUser = u.getDataCadastro() != null
                    ? u.getDataCadastro().toLocalDate()
                    : (emp.getDataCadastro() != null ? emp.getDataCadastro().toLocalDate() : hoje);
            long diasUser = ChronoUnit.DAYS.between(refUser, hoje);
            uDto.setDiasNaPlataforma(diasUser);
            uDto.setDiasPlanoEmpresa(emp.getDiasRestantes());
            usuariosPayload.add(uDto);
        }
        dados.setUsuarios(usuariosPayload);
        return dados;
    }
}
