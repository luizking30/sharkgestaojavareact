package com.assistencia.controller;

import com.assistencia.dto.SuperAdminEmpresaEcossistemaDTO;
import com.assistencia.dto.SuperAdminFinanceiroMesDTO;
import com.assistencia.dto.mapper.SuperAdminMapper;
import com.assistencia.model.Empresa;
import com.assistencia.model.PagamentoRecebidoSaas;
import com.assistencia.model.Usuario;
import com.assistencia.repository.EmpresaRepository;
import com.assistencia.repository.PagamentoRecebidoSaasRepository;
import com.assistencia.repository.UsuarioRepository;
import com.assistencia.service.SuperAdminService;
import com.assistencia.util.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/super-admin")
@PreAuthorize("hasRole('OWNER')")
public class SuperAdminController {

    private final EmpresaRepository empresaRepo;
    private final UsuarioRepository usuarioRepo;
    private final PagamentoRecebidoSaasRepository recebidoSaasRepo;
    private final SuperAdminService superAdminService;
    private final SecurityUtils securityUtils;

    public SuperAdminController(
            EmpresaRepository empresaRepo,
            UsuarioRepository usuarioRepo,
            PagamentoRecebidoSaasRepository recebidoSaasRepo,
            SuperAdminService superAdminService,
            SecurityUtils securityUtils) {
        this.empresaRepo = empresaRepo;
        this.usuarioRepo = usuarioRepo;
        this.recebidoSaasRepo = recebidoSaasRepo;
        this.superAdminService = superAdminService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/financeiro/mes-atual")
    public ResponseEntity<SuperAdminFinanceiroMesDTO> financeiroMesAtual() {
        ZoneId z = ZoneId.of("America/Sao_Paulo");
        LocalDate hoje = LocalDate.now(z);
        LocalDateTime inicio = hoje.withDayOfMonth(1).atStartOfDay();
        LocalDateTime fim = inicio.plusMonths(1);

        Double total = recebidoSaasRepo.sumValorEntre(inicio, fim);
        if (total == null) {
            total = 0.0;
        }

        List<PagamentoRecebidoSaas> lista =
                recebidoSaasRepo.findByDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraDesc(inicio, fim);

        String mesRef = hoje.getYear() + "-" + String.format("%02d", hoje.getMonthValue());
        return ResponseEntity.ok(SuperAdminMapper.toFinanceiroMes(total, mesRef, lista));
    }

    @GetMapping("/empresas/detalhes")
    public ResponseEntity<?> listarEcossistemaCompleto() {
        try {
            List<Empresa> empresas = empresaRepo.findAll();
            List<SuperAdminEmpresaEcossistemaDTO> relatorioGeral = new ArrayList<>();
            LocalDate hoje = LocalDate.now();

            for (Empresa emp : empresas) {
                List<Usuario> vinculos = usuarioRepo.findByEmpresaId(emp.getId());
                relatorioGeral.add(SuperAdminMapper.toEmpresaEcossistema(emp, vinculos, hoje));
            }

            return ResponseEntity.ok(relatorioGeral);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao gerar mapa do ecossistema: " + e.getMessage());
        }
    }

    @DeleteMapping("/empresas/{id}")
    public ResponseEntity<?> excluirEmpresa(@PathVariable Long id) {
        try {
            superAdminService.excluirEmpresa(id);
            return ResponseEntity.ok("Empresa e dados vinculados removidos.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao excluir empresa: " + e.getMessage());
        }
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<?> excluirUsuario(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        Long logadoId = logado != null ? logado.getId() : null;
        try {
            superAdminService.excluirUsuario(id, logadoId);
            return ResponseEntity.ok("Usuário removido.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao excluir usuário: " + e.getMessage());
        }
    }

    @PostMapping("/empresas/adicionar-dias/{id}")
    public ResponseEntity<?> adicionarDiasBonus(@PathVariable Long id, @RequestParam("quantidade") int quantidade) {
        return empresaRepo.findById(id).map(emp -> {
            int diasAtuais = emp.getDiasRestantes();
            emp.setDiasRestantes(diasAtuais + quantidade);
            empresaRepo.save(emp);
            return ResponseEntity.ok("Adicionado " + quantidade + " dias para a empresa " + emp.getNome());
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/empresas/bloquear/{id}")
    public ResponseEntity<?> bloquearEmpresa(@PathVariable Long id) {
        return empresaRepo.findById(id).map(emp -> {
            emp.setDiasRestantes(0);
            empresaRepo.save(emp);
            return ResponseEntity.ok("Empresa " + emp.getNome() + " foi bloqueada e o acesso expirado.");
        }).orElse(ResponseEntity.notFound().build());
    }
}
