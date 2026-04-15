package com.assistencia.controller;

import com.assistencia.model.*;
import com.assistencia.repository.*;
import com.assistencia.util.SecurityUtils;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.common.IdentificationRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.resources.payment.Payment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminController {

    private final ClienteRepository clienteRepo;
    private final OrdemServicoRepository ordemRepo;
    private final VendaRepository vendaRepo;
    private final UsuarioRepository usuarioRepo;
    private final PagamentoComissaoRepository pagamentoRepo;
    private final EmpresaRepository empresaRepo;

    @Autowired
    private SecurityUtils securityUtils;

    @Value("${mercado_pago_sample_access_token}")
    private String mpAccessToken;

    public AdminController(ClienteRepository clienteRepo, OrdemServicoRepository ordemRepo,
                           VendaRepository vendaRepo, UsuarioRepository usuarioRepo,
                           PagamentoComissaoRepository pagamentoRepo, EmpresaRepository empresaRepo) {
        this.clienteRepo = clienteRepo;
        this.ordemRepo = ordemRepo;
        this.vendaRepo = vendaRepo;
        this.usuarioRepo = usuarioRepo;
        this.pagamentoRepo = pagamentoRepo;
        this.empresaRepo = empresaRepo;
    }

    @GetMapping("/funcionarios")
    public ResponseEntity<?> listarEquipe() {
        Usuario adminLogado = securityUtils.getUsuarioLogado();
        if (adminLogado == null) return ResponseEntity.status(401).build();

        Long empresaId = adminLogado.getEmpresa().getId();

        List<Usuario> usuarios = usuarioRepo.findByEmpresaId(empresaId);
        List<OrdemServico> todasOrdens = ordemRepo.findByEmpresaIdOrderByIdDesc(empresaId);
        List<Venda> todasVendas = vendaRepo.findByEmpresaIdOrderByDataHoraDesc(empresaId);
        List<PagamentoComissao> todosPagamentos = pagamentoRepo.findByEmpresaIdOrderByDataHoraDesc(empresaId);

        for (Usuario u : usuarios) {
            calcularComissoes(u, todasOrdens, todasVendas, todosPagamentos);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("usuarios", usuarios);
        response.put("pagamentos", todosPagamentos);
        response.put("empresa", adminLogado.getEmpresa());

        return ResponseEntity.ok(response);
    }

    // 🦈 SHARK DELETE: Novo método para excluir funcionário (Resolve erro 404)
    @DeleteMapping("/funcionarios/{id}")
    public ResponseEntity<?> excluirFuncionario(@PathVariable Long id) {
        Usuario admin = securityUtils.getUsuarioLogado();
        if (admin == null) return ResponseEntity.status(403).build();

        return usuarioRepo.findById(id).map(u -> {
            // Verifica se o funcionário pertence à mesma empresa
            if (!u.getEmpresa().getId().equals(admin.getEmpresa().getId())) {
                return ResponseEntity.status(403).body("Acesso negado.");
            }

            // Impede excluir o proprietário
            if ("PROPRIETARIO".equalsIgnoreCase(u.getTipoFuncionario())) {
                return ResponseEntity.badRequest().body("Não é possível excluir o proprietário da unidade.");
            }

            try {
                usuarioRepo.delete(u);
                return ResponseEntity.ok().build();
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Erro ao excluir: O colaborador possui registros vinculados.");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/empresa/atualizar-cnpj")
    public ResponseEntity<?> atualizarCnpj(@RequestBody Map<String, String> payload) {
        Usuario admin = securityUtils.getUsuarioLogado();
        if (admin == null) return ResponseEntity.status(403).build();

        String cnpj = payload.get("cnpj");
        if (cnpj == null || cnpj.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("CNPJ é obrigatório.");
        }

        Empresa empresa = admin.getEmpresa();
        empresa.setCnpj(cnpj.replaceAll("\\D", ""));
        empresaRepo.save(empresa);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/empresa/gerar-renovacao")
    public ResponseEntity<?> gerarPixRenovacao(@RequestParam("dias") int dias) {
        try {
            Usuario admin = securityUtils.getUsuarioLogado();
            if (admin == null) return ResponseEntity.status(403).build();

            MercadoPagoConfig.setAccessToken(mpAccessToken.trim());
            PaymentClient client = new PaymentClient();

            BigDecimal valorTotal = BigDecimal.valueOf(dias).multiply(new BigDecimal("2.00"));

            PaymentCreateRequest paymentRequest = PaymentCreateRequest.builder()
                    .transactionAmount(valorTotal)
                    .description("Renovação Shark: " + dias + " dias")
                    .paymentMethodId("pix")
                    .externalReference(admin.getEmpresa().getId() + ":" + dias)
                    .payer(PaymentPayerRequest.builder()
                            .email(admin.getEmail())
                            .firstName(admin.getNome())
                            .identification(IdentificationRequest.builder()
                                    .type("CPF")
                                    .number(admin.getCpf() != null ? admin.getCpf().replaceAll("\\D", "") : "00000000000")
                                    .build())
                            .build())
                    .build();

            Payment payment = client.create(paymentRequest);

            return ResponseEntity.ok(Map.of(
                    "qr_code", payment.getPointOfInteraction().getTransactionData().getQrCode(),
                    "qr_code_base64", payment.getPointOfInteraction().getTransactionData().getQrCodeBase64()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao gerar Pix: " + e.getMessage());
        }
    }

    @PutMapping("/funcionarios/configurar/{id}")
    public ResponseEntity<?> configurarFuncionario(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Usuario admin = securityUtils.getUsuarioLogado();
        if (admin == null) return ResponseEntity.status(401).build();

        return usuarioRepo.findById(id).map(u -> {
            if (u.getEmpresa().getId().equals(admin.getEmpresa().getId())) {
                try {
                    if (payload.get("tipoFuncionario") != null) {
                        u.setTipoFuncionario(payload.get("tipoFuncionario").toString());
                    }

                    if (payload.get("comissaoOs") != null) {
                        u.setComissaoOs(Double.parseDouble(payload.get("comissaoOs").toString()));
                    }

                    if (payload.get("comissaoVenda") != null) {
                        u.setComissaoVenda(Double.parseDouble(payload.get("comissaoVenda").toString()));
                    }

                    usuarioRepo.save(u);
                    return ResponseEntity.ok().build();
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body("Erro ao processar valores: " + e.getMessage());
                }
            }
            return ResponseEntity.status(403).build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/funcionarios/aprovar/{id}")
    public ResponseEntity<?> aprovarFuncionario(@PathVariable Long id) {
        Usuario admin = securityUtils.getUsuarioLogado();
        return usuarioRepo.findById(id).map(u -> {
            if (u.getEmpresa().getId().equals(admin.getEmpresa().getId())) {
                u.setAprovado(true);
                usuarioRepo.save(u);
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.status(403).build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private void calcularComissoes(Usuario u, List<OrdemServico> todasOrdens, List<Venda> todasVendas, List<PagamentoComissao> todosPagamentos) {
        final Long idU = u.getId();
        final String nomeU = (u.getNome() != null) ? u.getNome().trim() : "";

        LocalDateTime corteOs = todosPagamentos.stream()
                .filter(p -> Objects.equals(p.getFuncionarioId(), idU) && "OS".equals(p.getTipoComissao()))
                .map(PagamentoComissao::getDataHora).max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.of(2000, 1, 1, 0, 0));

        LocalDateTime corteVenda = todosPagamentos.stream()
                .filter(p -> Objects.equals(p.getFuncionarioId(), idU) && "VENDA".equals(p.getTipoComissao()))
                .map(PagamentoComissao::getDataHora).max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.of(2000, 1, 1, 0, 0));

        List<Venda> vendasPendentes = todasVendas.stream()
                .filter(v -> v.getVendedor() != null && Objects.equals(v.getVendedor().getId(), idU))
                .filter(v -> v.getDataHora().isAfter(corteVenda)).toList();

        BigDecimal comissaoVenda = vendasPendentes.stream()
                .map(v -> BigDecimal.valueOf(v.getComissaoVendedorValor() != null ? v.getComissaoVendedorValor() : 0.0))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<OrdemServico> ordensPendentes = todasOrdens.stream()
                .filter(os -> {
                    boolean entregue = "Entregue".equalsIgnoreCase(os.getStatus());
                    String tecnico = (os.getFuncionarioAndamento() != null) ? os.getFuncionarioAndamento().trim() : "";
                    return entregue && tecnico.equalsIgnoreCase(nomeU);
                })
                .filter(os -> os.getDataEntrega() != null && os.getDataEntrega().isAfter(corteOs)).toList();

        BigDecimal comissaoOs = ordensPendentes.stream()
                .map(os -> BigDecimal.valueOf(os.getComissaoTecnicoValor() != null ? os.getComissaoTecnicoValor() : 0.0))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        u.setTotalComissaoOsAcumulada(comissaoOs.doubleValue());
        u.setSaldoVendaCalculado(comissaoVenda.doubleValue());
    }
}