package com.assistencia.controller;

import com.assistencia.dto.DashboardResponseDTO;
import com.assistencia.model.Usuario;
import com.assistencia.repository.ClienteRepository;
import com.assistencia.repository.OrdemServicoRepository;
import com.assistencia.repository.VendaRepository;
import com.assistencia.util.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ClienteRepository clienteRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final VendaRepository vendaRepository;
    private final SecurityUtils securityUtils;

    public DashboardController(ClienteRepository clienteRepository,
                               OrdemServicoRepository ordemServicoRepository,
                               VendaRepository vendaRepository,
                               SecurityUtils securityUtils) {
        this.clienteRepository = clienteRepository;
        this.ordemServicoRepository = ordemServicoRepository;
        this.vendaRepository = vendaRepository;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<DashboardResponseDTO> carregarDashboard() {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();
        Long empresaId = logado.getEmpresa().getId();

        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioHoje = hoje.atStartOfDay();
        LocalDateTime fimHoje = hoje.atTime(LocalTime.MAX);

        long clientesHoje = clienteRepository.countByEmpresaIdAndDataCadastroBetween(empresaId, inicioHoje, fimHoje);
        long osCriadasHoje = ordemServicoRepository.countByEmpresaIdAndDataBetween(empresaId, inicioHoje, fimHoje);
        long vendasHoje = vendaRepository.countByEmpresaIdAndDataHoraBetween(empresaId, inicioHoje, fimHoje);
        long osEntreguesHoje = ordemServicoRepository.countByEmpresaIdAndStatusAndDataEntregaBetween(empresaId, "Entregue", inicioHoje, fimHoje);

        Double totalVendasBruto = coalesce(vendaRepository.somarVendasDoDia(empresaId, inicioHoje, fimHoje));
        Double custoEstoque = coalesce(vendaRepository.somarCustoEstoqueDasVendasDoDia(empresaId, inicioHoje, fimHoje));
        double vendaLiquida = totalVendasBruto - custoEstoque;

        Double totalOsBruto = coalesce(ordemServicoRepository.somarValorBrutoOsEntregues(empresaId, "Entregue", inicioHoje, fimHoje));
        Double totalGastoPecas = coalesce(ordemServicoRepository.somarCustoPecasOsEntregues(empresaId, "Entregue", inicioHoje, fimHoje));
        double servicoLiquido = totalOsBruto - totalGastoPecas;

        DashboardResponseDTO data = new DashboardResponseDTO();
        data.setClientesHoje(clientesHoje);
        data.setOsCriadasHoje(osCriadasHoje);
        data.setVendasHoje(vendasHoje);
        data.setOsEntreguesHoje(osEntreguesHoje);
        data.setTotalVendasValorHoje(totalVendasBruto);
        data.setCustoEstoqueHoje(custoEstoque);
        data.setVendaLiquidaHoje(vendaLiquida);
        data.setTotalServicosHoje(totalOsBruto);
        data.setTotalGastoPecasHoje(totalGastoPecas);
        data.setServicoLiquidoHoje(servicoLiquido);
        data.setLucroTotalHoje(vendaLiquida + servicoLiquido);

        return ResponseEntity.ok(data);
    }

    private Double coalesce(Double valor) {
        return (valor != null) ? valor : 0.0;
    }
}
