package com.assistencia.dto.mapper;

import com.assistencia.dto.OrdemServicoResponseDTO;
import com.assistencia.model.OrdemServico;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.stream.Collectors;

public final class OrdemServicoMapper {

    private OrdemServicoMapper() {}

    public static OrdemServicoResponseDTO toResponse(OrdemServico os) {
        if (os == null) return null;
        OrdemServicoResponseDTO d = new OrdemServicoResponseDTO();
        d.setId(os.getId());
        d.setClienteNome(os.getClienteNome());
        d.setClienteCpf(os.getClienteCpf());
        d.setClienteWhatsapp(os.getClienteWhatsapp());
        d.setProduto(os.getProduto());
        d.setDefeito(os.getDefeito());
        d.setStatus(os.getStatus());
        d.setData(os.getData());
        d.setDataAndamento(os.getDataAndamento());
        d.setDataPronto(os.getDataPronto());
        d.setDataEntrega(os.getDataEntrega());
        Double vt = os.getValorTotal();
        d.setValorTotal(vt);
        d.setValor(vt);
        d.setCustoPeca(os.getCustoPeca());
        d.setPago(os.isPago());
        d.setComissaoTecnicoValor(os.getComissaoTecnicoValor());
        d.setFuncionarioAbertura(os.getFuncionarioAbertura());
        d.setFuncionarioAndamento(os.getFuncionarioAndamento());
        d.setFuncionarioPronto(os.getFuncionarioPronto());
        d.setFuncionarioEntrega(os.getFuncionarioEntrega());
        d.setTecnico(UsuarioMapper.toTecnicoResumo(os.getTecnico()));
        return d;
    }

    public static Page<OrdemServicoResponseDTO> toResponsePage(Page<OrdemServico> page) {
        List<OrdemServicoResponseDTO> content = page.getContent().stream()
                .map(OrdemServicoMapper::toResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }

    public static List<OrdemServicoResponseDTO> toResponseList(List<OrdemServico> list) {
        return list.stream().map(OrdemServicoMapper::toResponse).collect(Collectors.toList());
    }
}
