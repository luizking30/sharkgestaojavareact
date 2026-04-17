package com.assistencia.controller;

import com.assistencia.model.PagamentoComissao;
import com.assistencia.model.Usuario;
import com.assistencia.repository.PagamentoComissaoRepository;
import com.assistencia.repository.UsuarioRepository;
import com.assistencia.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController // MUDOU: Agora é uma API REST
@RequestMapping("/api/pagamentos") // MUDOU: Padronizado com /api/
public class PagamentoController {

    private final UsuarioRepository usuarioRepository;
    private final PagamentoComissaoRepository pagamentoComissaoRepository;

    @Autowired
    private SecurityUtils securityUtils; // Nossa "chave mestra" para isolamento SaaS

    public PagamentoController(UsuarioRepository usuarioRepository,
                               PagamentoComissaoRepository pagamentoComissaoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.pagamentoComissaoRepository = pagamentoComissaoRepository;
    }

    /**
     * Registra o pagamento e cria o marco zero para futuras comissões.
     */
    @PostMapping("/registrar")
    @Transactional
    public ResponseEntity<?> registrarPagamento(@RequestBody Map<String, Object> payload) {

        Usuario adminLogado = securityUtils.getUsuarioLogado();
        if (adminLogado == null) return ResponseEntity.status(401).build();

        try {
            Long funcionarioId = Long.parseLong(payload.get("funcionarioId").toString());
            Double valor = Double.parseDouble(payload.get("valorPago").toString());
            String tipoComissao = payload.get("tipoComissao").toString().toUpperCase();

            Usuario u = usuarioRepository.findById(funcionarioId).orElse(null);

            // 🔐 SEGURANÇA SaaS: Só permite pagar funcionários da MESMA empresa
            if (u != null && u.getEmpresa().getId().equals(adminLogado.getEmpresa().getId())) {

                if (valor <= 0.01) return ResponseEntity.badRequest().body("Valor insuficiente para registro.");

                // 1. Cria o registro de auditoria
                PagamentoComissao novoPagamento = new PagamentoComissao();
                novoPagamento.setFuncionarioId(u.getId());
                novoPagamento.setNomeFuncionario(u.getNome());
                novoPagamento.setValorPago(valor);
                novoPagamento.setTipoComissao(tipoComissao);
                novoPagamento.setDataHora(LocalDateTime.now());
                novoPagamento.setResponsavelPagamento(adminLogado.getNome());

                // 🔐 DNA SaaS: Vincula o pagamento à empresa para relatórios futuros
                novoPagamento.setEmpresa(adminLogado.getEmpresa());

                // 2. Salva o histórico (Isso atualiza o 'corte' na tela de Meus Ganhos)
                pagamentoComissaoRepository.save(novoPagamento);

                /* NOTA: Não zeramos u.setComissaoOs(0.0) aqui para não apagar
                   a configuração de porcentagem do funcionário.
                   O saldo 'zera' no front-end porque a data deste pagamento
                   passa a ser o novo filtro inicial de busca.
                */

                return ResponseEntity.ok(Map.of("mensagem", "Pagamento registrado com sucesso!"));
            }

            return ResponseEntity.status(403).body("Acesso negado ou funcionário não encontrado.");

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar pagamento: " + e.getMessage());
        }
    }
}