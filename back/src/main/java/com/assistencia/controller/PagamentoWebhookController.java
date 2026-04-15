package com.assistencia.controller;

import com.assistencia.model.Empresa;
import com.assistencia.repository.EmpresaRepository;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/webhook")
public class PagamentoWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(PagamentoWebhookController.class);

    @Autowired
    private EmpresaRepository empresaRepo;

    @Value("${mercado_pago_sample_access_token}")
    private String mpAccessToken;

    @PostMapping("/pagamento")
    public ResponseEntity<Void> receberNotificacao(
            @RequestParam(value = "data.id", required = false) Long dataId,
            @RequestParam(value = "type", required = false) String type) {

        // Filtramos apenas notificações de pagamentos
        if ("payment".equals(type) && dataId != null) {

            // Configuração do SDK com tratamento de espaço em branco
            MercadoPagoConfig.setAccessToken(mpAccessToken.trim());
            PaymentClient client = new PaymentClient();

            try {
                // 1. Consulta obrigatória à API do MP para validar o pagamento
                Payment payment = client.get(dataId);

                // 2. Verificamos se o pagamento foi aprovado
                if ("approved".equals(payment.getStatus())) {

                    String reference = payment.getExternalReference();

                    // Validação da referência Shark (ID:DIAS)
                    if (reference != null && reference.contains(":")) {
                        String[] partes = reference.split(":");
                        Long empresaId = Long.parseLong(partes[0]);
                        int diasComprados = Integer.parseInt(partes[1]);

                        // 3. Atualização no Banco de Dados
                        empresaRepo.findById(empresaId).ifPresentOrElse(empresa -> {
                            int saldoAtual = (empresa.getDiasRestantes() != null) ? empresa.getDiasRestantes() : 0;
                            empresa.setDiasRestantes(saldoAtual + diasComprados);

                            // Caso a empresa estivesse inativa por falta de pagamento, reativamos aqui
                            if (!empresa.isAtivo()) {
                                empresa.setAtivo(true);
                            }

                            empresaRepo.save(empresa);

                            logger.info("✅ WEBHOOK SUCESSO: Empresa {} reativada com +{} dias. ID Pagamento: {}",
                                    empresa.getNome(), diasComprados, dataId);
                        }, () -> {
                            logger.warn("⚠️ WEBHOOK ALERTA: Empresa ID {} não localizada no banco.", empresaId);
                        });
                    }
                } else {
                    logger.info("ℹ️ WEBHOOK: Pagamento {} com status: {}", dataId, payment.getStatus());
                }
            } catch (Exception e) {
                logger.error("❌ WEBHOOK ERRO CRÍTICO: Falha ao processar notificação {}", dataId, e);
                // Retornar erro faz o MP tentar novamente depois
                return ResponseEntity.internalServerError().build();
            }
        }

        // Retorno 200 sinaliza ao MP que a notificação foi processada
        return ResponseEntity.ok().build();
    }
}