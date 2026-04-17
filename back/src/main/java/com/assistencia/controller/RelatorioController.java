package com.assistencia.controller;

import com.assistencia.model.*;
import com.assistencia.repository.ClienteRepository;
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
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/relatorios")
@PreAuthorize("hasRole('ADMIN')")
public class RelatorioController {

    @Autowired private VendaRepository vendaRepository;
    @Autowired private OrdemServicoRepository osRepository;
    @Autowired private ContaRepository contaRepository;
    @Autowired private SecurityUtils securityUtils;

    @GetMapping("/financeiro-detalhado")
    public ResponseEntity<?> gerarRelatorioCompleto(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) String mesFiltro) {

        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        Empresa empresa = logado.getEmpresa();
        Long empresaId = empresa.getId();

        // 🚀 TRAVA SHARK: Se os dias de acesso acabaram, bloqueia o relatório
        if (empresa.getDiasRestantes() <= 0) {
            return ResponseEntity.status(402).body("Assinatura expirada. Renove via PIX para acessar os relatórios.");
        }

        // 1. LÓGICA DE FILTRO DE DATA
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

        LocalDateTime dataInicial = inicio.atStartOfDay();
        LocalDateTime dataFinal = fim.atTime(LocalTime.MAX);

        // 2. BUSCA NO BANCO COM ISOLAMENTO
        List<Venda> vendas = vendaRepository.findByEmpresaIdAndDataHoraBetween(empresaId, dataInicial, dataFinal);
        List<OrdemServico> servicos = osRepository.findByEmpresaIdAndStatusAndDataEntregaBetween(empresaId, "Entregue", dataInicial, dataFinal);
        List<Conta> contasPagas = contaRepository.findByEmpresaIdAndDataVencimentoBetween(empresaId, inicio, fim)
                .stream().filter(Conta::isPaga).collect(Collectors.toList());

        // 3. CÁLCULOS COM TRATAMENTO DE NULL (Evita que o lucro venha errado)
        double totalVendasBruto = vendas.stream().mapToDouble(v -> Optional.ofNullable(v.getValorTotal()).orElse(0.0)).sum();
        double custoEstoqueVendido = vendas.stream().mapToDouble(v -> Optional.ofNullable(v.getCustoTotalEstoque()).orElse(0.0)).sum();
        double lucroVendas = totalVendasBruto - custoEstoqueVendido;

        double totalServicosBruto = servicos.stream().mapToDouble(s -> Optional.ofNullable(s.getValorTotal()).orElse(0.0)).sum();
        double custoPecasOS = servicos.stream().mapToDouble(s -> Optional.ofNullable(s.getCustoPeca()).orElse(0.0)).sum();
        double lucroServicos = totalServicosBruto - custoPecasOS;

        double totalDespesas = contasPagas.stream().mapToDouble(c -> Optional.ofNullable(c.getValor()).orElse(0.0)).sum();

        double lucroOperacional = lucroVendas + lucroServicos;
        double lucroLiquidoFinal = lucroOperacional - totalDespesas;

        // 4. RESPOSTA JSON ESTRUTURADA
        Map<String, Object> response = new LinkedHashMap<>(); // Linked mantém a ordem das chaves
        response.put("periodo", Map.of("inicio", inicio, "fim", fim));

        response.put("vendas", Map.of(
                "totalBruto", totalVendasBruto,
                "custoEstoque", custoEstoqueVendido,
                "lucro", lucroVendas,
                "quantidade", vendas.size()
        ));

        response.put("servicos", Map.of(
                "totalBruto", totalServicosBruto,
                "custoPecas", custoPecasOS,
                "lucro", lucroServicos,
                "quantidade", servicos.size()
        ));

        response.put("financeiro", Map.of(
                "totalDespesas", totalDespesas,
                "lucroOperacional", lucroOperacional,
                "lucroLiquidoFinal", lucroLiquidoFinal
        ));

        // Para gráficos no React
        response.put("dadosGrafico", List.of(
                Map.of("name", "Produtos", "valor", lucroVendas),
                Map.of("name", "Serviços", "valor", lucroServicos),
                Map.of("name", "Despesas", "valor", totalDespesas)
        ));

        return ResponseEntity.ok(response);
    }
}