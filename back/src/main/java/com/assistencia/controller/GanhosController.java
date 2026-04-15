package com.assistencia.controller;

import com.assistencia.model.*;
import com.assistencia.repository.OrdemServicoRepository;
import com.assistencia.repository.PagamentoComissaoRepository;
import com.assistencia.repository.VendaRepository;
import com.assistencia.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/ganhos")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class GanhosController {

    private final VendaRepository vendaRepo;
    private final OrdemServicoRepository ordemRepo;
    private final PagamentoComissaoRepository pagamentoRepo;

    @Autowired
    private SecurityUtils securityUtils;

    public GanhosController(VendaRepository vendaRepo, OrdemServicoRepository ordemRepo, PagamentoComissaoRepository pagamentoRepo) {
        this.vendaRepo = vendaRepo;
        this.ordemRepo = ordemRepo;
        this.pagamentoRepo = pagamentoRepo;
    }

    @GetMapping("/meus-ganhos")
    public ResponseEntity<?> meusGanhos() {
        Usuario usuarioLogado = securityUtils.getUsuarioLogado();
        if (usuarioLogado == null) return ResponseEntity.status(401).build();

        final Long idU = usuarioLogado.getId();
        final String nomeU = (usuarioLogado.getNome() != null) ? usuarioLogado.getNome().trim() : "";
        final Long empresaId = usuarioLogado.getEmpresa().getId();

        // 1. HISTÓRICO DE PAGAMENTOS (Filtrado por Funcionário)
        List<PagamentoComissao> historico = pagamentoRepo.findByFuncionarioIdOrderByDataHoraDesc(idU);

        // Define a data de corte baseada no último pagamento recebido
        LocalDateTime corteOs = historico.stream()
                .filter(p -> "OS".equals(p.getTipoComissao()))
                .map(PagamentoComissao::getDataHora).findFirst()
                .orElse(LocalDateTime.of(2000, 1, 1, 0, 0));

        LocalDateTime corteVenda = historico.stream()
                .filter(p -> "VENDA".equals(p.getTipoComissao()))
                .map(PagamentoComissao::getDataHora).findFirst()
                .orElse(LocalDateTime.of(2000, 1, 1, 0, 0));

        // 2. VENDAS (ISOLAMENTO SaaS: Busca por Empresa + Vendedor + Período)
        List<Venda> vendasNovas = vendaRepo.findByEmpresaIdAndVendedorIdAndDataHoraBetween(
                empresaId, idU, corteVenda, LocalDateTime.now());

        BigDecimal brutoVenda = vendasNovas.stream()
                .map(v -> BigDecimal.valueOf(v.getValorTotal() != null ? v.getValorTotal() : 0.0))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal comissaoVenda = vendasNovas.stream()
                .map(v -> BigDecimal.valueOf(v.getComissaoVendedorValor() != null ? v.getComissaoVendedorValor() : 0.0))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. ORDENS DE SERVIÇO (Filtrado por Técnico e Status 'Entregue')
        List<OrdemServico> servicosNovos = ordemRepo.findByEmpresaIdAndStatusAndFuncionarioAndamentoAndDataEntregaAfter(
                empresaId, "Entregue", nomeU, corteOs);

        BigDecimal brutoOs = servicosNovos.stream()
                .map(os -> BigDecimal.valueOf(os.getValorTotal() != null ? os.getValorTotal() : 0.0))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal comissaoOs = servicosNovos.stream()
                .map(os -> {
                    if (os.getComissaoTecnicoValor() != null && os.getComissaoTecnicoValor() > 0) {
                        return BigDecimal.valueOf(os.getComissaoTecnicoValor());
                    }
                    double valorBase = os.getValorTotal() != null ? os.getValorTotal() : 0.0;
                    double custoPecas = os.getCustoPeca() != null ? os.getCustoPeca() : 0.0;

                    BigDecimal liq = BigDecimal.valueOf(valorBase - custoPecas);
                    BigDecimal taxa = BigDecimal.valueOf(usuarioLogado.getComissaoOs() != null ? usuarioLogado.getComissaoOs() : 0.0);
                    return liq.multiply(taxa).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. MONTAR RESPOSTA PARA O REACT (Objeto HashMap plano)
        Map<String, Object> response = new HashMap<>();
        response.put("vendedor", usuarioLogado.getNome());
        response.put("brutoVendas", brutoVenda);
        response.put("comissaoVendas", comissaoVenda);
        response.put("brutoOs", brutoOs);
        response.put("comissaoOs", comissaoOs);
        response.put("totalAReceber", comissaoVenda.add(comissaoOs));
        response.put("vendasDetalhes", vendasNovas);
        response.put("osDetalhes", servicosNovos);
        response.put("historicoPagamentos", historico);

        return ResponseEntity.ok(response);
    }
}