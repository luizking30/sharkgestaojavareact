package com.assistencia.controller;

import com.assistencia.model.Conta;
import com.assistencia.model.Usuario;
import com.assistencia.repository.ContaRepository;
import com.assistencia.util.SecurityUtils;
import com.assistencia.service.ContaTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController // MUDOU: Agora é uma API
@RequestMapping("/api/contas") // MUDOU: Padronizado /api/
public class ContaController {

    @Autowired
    private ContaRepository contaRepository;

    @Autowired
    private SecurityUtils securityUtils; // Nossa chave mestra

    @Autowired
    private ContaTaskService contaTaskService;

    /**
     * Retorna os dados para os cards financeiros e a listagem mensal.
     */
    @GetMapping
    public ResponseEntity<?> listarContas() {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();
        Long empresaId = logado.getEmpresa().getId();

        // Processa recorrências antes de listar
        contaTaskService.processarContasRecorrentes();

        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate fimMes = hoje.with(TemporalAdjusters.lastDayOfMonth());

        // Busca todas da empresa
        List<Conta> todasAsContas = contaRepository.findByEmpresaIdOrderByDataVencimentoAsc(empresaId);

        // Filtro Mensal
        List<Conta> contasDoMes = todasAsContas.stream()
                .filter(c -> !c.getDataVencimento().isBefore(inicioMes) &&
                        !c.getDataVencimento().isAfter(fimMes))
                .collect(Collectors.toList());

        // Cálculos para o React exibir nos cards
        double totalContas = contasDoMes.stream().mapToDouble(Conta::getValor).sum();
        double totalPago = contasDoMes.stream().filter(Conta::isPaga).mapToDouble(Conta::getValor).sum();
        double totalVencido = contasDoMes.stream()
                .filter(c -> !c.isPaga() && c.getDataVencimento().isBefore(hoje))
                .mapToDouble(Conta::getValor).sum();

        Map<String, Object> response = new HashMap<>();
        response.put("contas", contasDoMes);
        response.put("resumo", Map.of(
                "totalMes", totalContas,
                "totalPago", totalPago,
                "totalPendente", totalContas - totalPago,
                "totalVencido", totalVencido
        ));
        response.put("historicoPagas", todasAsContas.stream().filter(Conta::isPaga).collect(Collectors.toList()));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/pagar/{id}")
    public ResponseEntity<?> marcarComoPago(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        return contaRepository.findById(id)
                .filter(c -> c.getEmpresa().getId().equals(logado.getEmpresa().getId()))
                .map(conta -> {
                    conta.setPaga(true);
                    conta.setUsuarioPagador(logado.getUsername());
                    conta.setDataPagamento(LocalDateTime.now());
                    contaRepository.save(conta);
                    return ResponseEntity.ok().body("Pagamento liquidado! 🦈");
                }).orElse(ResponseEntity.status(403).build());
    }

    @PostMapping("/salvar")
    public ResponseEntity<?> salvarConta(@RequestBody Map<String, Object> payload) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            if (logado == null) return ResponseEntity.status(401).build();

            Conta conta = new Conta();
            conta.setDescricao(payload.get("descricao").toString());
            conta.setValor(Double.parseDouble(payload.get("valor").toString()));
            conta.setRecorrente((Boolean) payload.get("recorrente"));

            int dia = Integer.parseInt(payload.get("diaVencimento").toString());
            LocalDate hoje = LocalDate.now();

            // Ajuste para não estourar dias do mês (ex: 31 de abril)
            int ultimoDiaDoMes = hoje.lengthOfMonth();
            int diaFinal = Math.min(dia, ultimoDiaDoMes);

            conta.setDataVencimento(hoje.withDayOfMonth(diaFinal));
            conta.setPaga(false);
            conta.setEmpresa(logado.getEmpresa()); // 🔐 DNA SaaS

            Conta salva = contaRepository.save(conta);
            return ResponseEntity.ok(salva);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao salvar conta: " + e.getMessage());
        }
    }

    @DeleteMapping("/deletar/{id}") // MUDOU: Verbo DELETE
    public ResponseEntity<?> deletarConta(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        return contaRepository.findById(id)
                .filter(c -> c.getEmpresa().getId().equals(logado.getEmpresa().getId()))
                .map(conta -> {
                    contaRepository.delete(conta);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.status(403).build());
    }
}