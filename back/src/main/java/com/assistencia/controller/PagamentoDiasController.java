package com.assistencia.controller;

import com.assistencia.model.Empresa;
import com.assistencia.model.Usuario;
import com.assistencia.repository.EmpresaRepository;
import com.assistencia.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController // MUDOU: Agora é uma API REST
@RequestMapping("/api/pagamentos/assinatura") // MUDOU: Padronizado com /api/
public class PagamentoDiasController {

    private final EmpresaRepository empresaRepository;

    @Autowired
    private SecurityUtils securityUtils; // Nossa chave mestra

    public PagamentoDiasController(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    /**
     * O React chama este método a cada 5 segundos enquanto o QR Code está na tela.
     * Quando o Webhook do Mercado Pago atualiza o banco, este método retorna 'true'.
     */
    @GetMapping("/status-check")
    public ResponseEntity<?> verificarStatus(@RequestParam("diasAnteriores") Integer diasAnteriores) {

        // 1. Recupera o usuário via SecurityUtils (SaaS Safe)
        Usuario u = securityUtils.getUsuarioLogado();
        if (u == null || u.getEmpresa() == null) {
            return ResponseEntity.status(401).body("Sessão inválida.");
        }

        // 2. Busca a empresa atualizada direto do banco para pegar o valor novo de dias
        return empresaRepository.findById(u.getEmpresa().getId())
                .map(empresa -> {
                    // Lógica: Se dias atuais > dias que tinha antes, o pagamento caiu!
                    boolean pago = empresa.getDiasRestantes() > diasAnteriores;

                    return ResponseEntity.ok(Map.of(
                            "pago", pago,
                            "diasAtuais", empresa.getDiasRestantes(),
                            "mensagem", pago ? "Pagamento aprovado! Sistema liberado. 🦈🚀" : "Aguardando compensação..."
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}