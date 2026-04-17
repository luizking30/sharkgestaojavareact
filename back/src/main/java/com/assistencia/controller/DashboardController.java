package com.assistencia.controller;

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
import java.util.HashMap;
import java.util.Map;

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
    public ResponseEntity<?> carregarDashboard() {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();
        Long empresaId = logado.getEmpresa().getId();

        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioHoje = hoje.atStartOfDay();
        LocalDateTime fimHoje = hoje.atTime(LocalTime.MAX);

        // 1. Cálculos de Contagem
        long clientesHoje = clienteRepository.countByEmpresaIdAndDataCadastroBetween(empresaId, inicioHoje, fimHoje);
        long osCriadasHoje = ordemServicoRepository.countByEmpresaIdAndDataBetween(empresaId, inicioHoje, fimHoje);
        long vendasHoje = vendaRepository.countByEmpresaIdAndDataHoraBetween(empresaId, inicioHoje, fimHoje);
        long osEntreguesHoje = ordemServicoRepository.countByEmpresaIdAndStatusAndDataEntregaBetween(empresaId, "Entregue", inicioHoje, fimHoje);

        // 2. Financeiro: Vendas (Produtos)
        Double totalVendasBruto = coalesce(vendaRepository.somarVendasDoDia(empresaId, inicioHoje, fimHoje));
        Double custoEstoque = coalesce(vendaRepository.somarCustoEstoqueDasVendasDoDia(empresaId, inicioHoje, fimHoje));
        Double vendaLiquida = totalVendasBruto - custoEstoque;

        // 3. Financeiro: Serviços (Ordens de Serviço)
        Double totalOsBruto = coalesce(ordemServicoRepository.somarValorBrutoOsEntregues(empresaId, "Entregue", inicioHoje, fimHoje));
        Double totalGastoPecas = coalesce(ordemServicoRepository.somarCustoPecasOsEntregues(empresaId, "Entregue", inicioHoje, fimHoje));
        Double servicoLiquido = totalOsBruto - totalGastoPecas;

        // 4. Montagem da Resposta Plana para o React
        Map<String, Object> data = new HashMap<>();
        data.put("clientesHoje", clientesHoje);
        data.put("osCriadasHoje", osCriadasHoje);
        data.put("vendasHoje", vendasHoje);
        data.put("osEntreguesHoje", osEntreguesHoje);
        data.put("totalVendasValorHoje", totalVendasBruto);
        data.put("custoEstoqueHoje", custoEstoque);
        data.put("vendaLiquidaHoje", vendaLiquida);
        data.put("totalServicosHoje", totalOsBruto);
        data.put("totalGastoPecasHoje", totalGastoPecas);
        data.put("servicoLiquidoHoje", servicoLiquido);
        data.put("lucroTotalHoje", vendaLiquida + servicoLiquido);

        return ResponseEntity.ok(data);
    }

    private Double coalesce(Double valor) {
        return (valor != null) ? valor : 0.0;
    }
}