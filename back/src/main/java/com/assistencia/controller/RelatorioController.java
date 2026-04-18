package com.assistencia.controller;

import com.assistencia.dto.GraficoNomeValorDTO;
import com.assistencia.dto.RelatorioMensalResponseDTO;
import com.assistencia.dto.RelatorioPeriodoResponseDTO;
import com.assistencia.dto.mapper.RelatorioMapper;
import com.assistencia.model.*;
import com.assistencia.repository.OrdemServicoRepository;
import com.assistencia.repository.VendaRepository;
import com.assistencia.repository.ContaRepository;
import com.assistencia.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/relatorios")
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class RelatorioController {

    @Autowired private VendaRepository vendaRepository;
    @Autowired private OrdemServicoRepository osRepository;
    @Autowired private ContaRepository contaRepository;
    @Autowired private SecurityUtils securityUtils;

    /**
     * Fechamento mensal ({@code RelatorioMensal.jsx}): {@code mesReferencia=YYYY-MM}.
     */
    @GetMapping("/mensal")
    public ResponseEntity<?> relatorioMensal(@RequestParam String mesReferencia) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        Empresa empresa = logado.getEmpresa();
        Long empresaId = empresa.getId();

        if (empresa.getDiasRestantes() <= 0) {
            return ResponseEntity.status(402).body("Assinatura expirada. Renove via PIX para acessar os relatórios.");
        }

        if (mesReferencia == null || mesReferencia.isBlank()) {
            return ResponseEntity.badRequest().body("Informe mesReferencia no formato YYYY-MM.");
        }

        YearMonth ym;
        try {
            ym = YearMonth.parse(mesReferencia.trim());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Formato de mês inválido. Use YYYY-MM.");
        }

        LocalDate inicio = ym.atDay(1);
        LocalDate fim = ym.atEndOfMonth();

        RelatorioPeriodoResponseDTO base = montarRelatorioPeriodo(empresaId, inicio, fim);

        RelatorioMensalResponseDTO out = new RelatorioMensalResponseDTO();
        out.setMesReferencia(ym.toString());
        out.setTotalVendasBruto(base.getTotalVendasBruto());
        out.setCustoEstoqueVendido(base.getCustoEstoqueVendido());
        out.setLucroVendas(base.getLucroVendas());
        out.setTotalServicosBruto(base.getTotalServicosBruto());
        out.setCustoPecasOS(base.getCustoPecasOS());
        out.setLucroServicos(base.getLucroServicos());
        out.setTotalDespesas(base.getTotalDespesas());
        out.setLucroFinalPosContas(base.getLucroLiquidoFinal());

        return ResponseEntity.ok(out);
    }

    /**
     * Relatório financeiro (mesmo payload que {@link #financeiroDetalhado}).
     * Expõe {@code GET /api/relatorios} para o React ({@code Relatorios.jsx}).
     */
    @GetMapping({"", "/"})
    public ResponseEntity<?> relatorioRaiz(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) String mesFiltro) {
        return financeiroDetalhado(inicio, fim, mesFiltro);
    }

    @GetMapping("/financeiro-detalhado")
    public ResponseEntity<?> financeiroDetalhado(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) String mesFiltro) {

        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        Empresa empresa = logado.getEmpresa();
        Long empresaId = empresa.getId();

        if (empresa.getDiasRestantes() <= 0) {
            return ResponseEntity.status(402).body("Assinatura expirada. Renove via PIX para acessar os relatórios.");
        }

        if (mesFiltro != null && !mesFiltro.isEmpty()) {
            try {
                YearMonth ym = YearMonth.parse(mesFiltro);
                inicio = ym.atDay(1);
                fim = ym.atEndOfMonth();
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Formato de mês inválido. Use YYYY-MM.");
            }
        } else if (inicio == null || fim == null) {
            YearMonth atual = YearMonth.now();
            inicio = atual.atDay(1);
            fim = atual.atEndOfMonth();
        }

        RelatorioPeriodoResponseDTO dto = montarRelatorioPeriodo(empresaId, inicio, fim);
        return ResponseEntity.ok(dto);
    }

    private RelatorioPeriodoResponseDTO montarRelatorioPeriodo(Long empresaId, LocalDate inicio, LocalDate fim) {
        LocalDateTime dataInicial = inicio.atStartOfDay();
        LocalDateTime dataFinal = fim.atTime(LocalTime.MAX);

        List<Venda> vendas = vendaRepository.findByEmpresaIdAndDataHoraBetween(empresaId, dataInicial, dataFinal);
        List<OrdemServico> servicos = osRepository.findByEmpresaIdAndStatusAndDataEntregaBetween(empresaId, "Entregue", dataInicial, dataFinal);
        List<Conta> contasPagas = contaRepository.findByEmpresaIdAndDataVencimentoBetween(empresaId, inicio, fim)
                .stream().filter(Conta::isPaga).collect(Collectors.toList());

        double totalVendasBruto = vendas.stream().mapToDouble(v -> Optional.ofNullable(v.getValorTotal()).orElse(0.0)).sum();
        double custoEstoqueVendido = vendas.stream().mapToDouble(v -> Optional.ofNullable(v.getCustoTotalEstoque()).orElse(0.0)).sum();
        double lucroVendas = totalVendasBruto - custoEstoqueVendido;

        double totalServicosBruto = servicos.stream().mapToDouble(s -> Optional.ofNullable(s.getValorTotal()).orElse(0.0)).sum();
        double custoPecasOS = servicos.stream().mapToDouble(s -> Optional.ofNullable(s.getCustoPeca()).orElse(0.0)).sum();
        double lucroServicos = totalServicosBruto - custoPecasOS;

        double totalDespesas = contasPagas.stream().mapToDouble(c -> Optional.ofNullable(c.getValor()).orElse(0.0)).sum();

        double lucroOperacional = lucroVendas + lucroServicos;
        double lucroLiquidoFinal = lucroOperacional - totalDespesas;

        RelatorioPeriodoResponseDTO dto = new RelatorioPeriodoResponseDTO();
        dto.setPeriodoInicio(inicio);
        dto.setPeriodoFim(fim);
        dto.setTotalVendasBruto(totalVendasBruto);
        dto.setCustoEstoqueVendido(custoEstoqueVendido);
        dto.setLucroVendas(lucroVendas);
        dto.setTotalServicosBruto(totalServicosBruto);
        dto.setCustoPecasOS(custoPecasOS);
        dto.setLucroServicos(lucroServicos);
        dto.setTotalDespesas(totalDespesas);
        dto.setLucroOperacional(lucroOperacional);
        dto.setLucroLiquidoFinal(lucroLiquidoFinal);
        dto.setLucroTotalFinal(lucroLiquidoFinal);
        dto.setLucroTotalPeriodo(lucroLiquidoFinal);
        dto.setVendas(RelatorioMapper.vendasToLinhas(vendas));
        dto.setDadosGrafico(List.of(
                new GraficoNomeValorDTO("Produtos", lucroVendas),
                new GraficoNomeValorDTO("Serviços", lucroServicos),
                new GraficoNomeValorDTO("Despesas", totalDespesas)
        ));

        return dto;
    }
}
