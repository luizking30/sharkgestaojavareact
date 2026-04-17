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

@RestController // MUDOU: Agora é uma API
@RequestMapping("/api/pagamentos/comissoes") // MUDOU: Padronizado
public class PagamentoComissaoController {

    private final UsuarioRepository usuarioRepository;
    private final PagamentoComissaoRepository pagamentoComissaoRepository;

    @Autowired
    private SecurityUtils securityUtils;

    public PagamentoComissaoController(UsuarioRepository usuarioRepository,
                                       PagamentoComissaoRepository pagamentoComissaoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.pagamentoComissaoRepository = pagamentoComissaoRepository;
    }

    @PostMapping("/registrar")
    @Transactional
    public ResponseEntity<?> registrarPagamento(@RequestBody Map<String, Object> payload) {

        Usuario adminLogado = securityUtils.getUsuarioLogado();
        if (adminLogado == null) return ResponseEntity.status(401).build();

        try {
            Long idFuncionario = Long.parseLong(payload.get("funcionarioId").toString());
            Double valor = Double.parseDouble(payload.get("valorPago").toString());
            String tipoComissao = payload.get("tipoComissao").toString().toUpperCase();

            Usuario funcionario = usuarioRepository.findById(idFuncionario).orElse(null);

            // 🔐 SEGURANÇA SaaS: Só permite pagar funcionários da MESMA empresa do admin
            if (funcionario != null && funcionario.getEmpresa().getId().equals(adminLogado.getEmpresa().getId())) {

                if (valor < 0.01) return ResponseEntity.badRequest().body("Valor inválido para pagamento.");

                PagamentoComissao novoPagamento = new PagamentoComissao();
                novoPagamento.setFuncionarioId(funcionario.getId());
                novoPagamento.setNomeFuncionario(funcionario.getNome());
                novoPagamento.setValorPago(valor);
                novoPagamento.setTipoComissao(tipoComissao);
                novoPagamento.setDataHora(LocalDateTime.now());
                novoPagamento.setResponsavelPagamento(adminLogado.getNome());

                // 🔐 DNA SaaS: Vincula o registro de pagamento à empresa
                novoPagamento.setEmpresa(adminLogado.getEmpresa());

                // 1. Salva o histórico (Isso cria o novo "Marco Zero" para o GanhosController)
                pagamentoComissaoRepository.save(novoPagamento);

                /* ⚠️ NOTA IMPORTANTE:
                   Não zeramos u.setComissaoOs(0.0) aqui, pois isso apagaria a
                   CONFIGURAÇÃO de quanto o funcionário ganha (ex: 10%).
                   O saldo zera automaticamente na tela de 'Meus Ganhos' porque
                   ela só soma o que foi feito DEPOIS da data deste pagamento.
                */

                return ResponseEntity.ok(Map.of("mensagem", "Pagamento de " + funcionario.getNome() + " registrado!"));
            }

            return ResponseEntity.status(403).body("Acesso negado ou funcionário não encontrado.");

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar: " + e.getMessage());
        }
    }
}