package com.assistencia.controller;

import com.assistencia.model.Empresa;
import com.assistencia.model.PagamentoRecebidoSaas;
import com.assistencia.repository.EmpresaRepository;
import com.assistencia.repository.PagamentoRecebidoSaasRepository;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.payment.PaymentPayer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/webhook")
public class PagamentoWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(PagamentoWebhookController.class);

    @Autowired
    private EmpresaRepository empresaRepo;

    @Autowired
    private PagamentoRecebidoSaasRepository recebidoSaasRepo;

    @Value("${mercado_pago_sample_access_token}")
    private String mpAccessToken;

    @PostMapping("/pagamento")
    public ResponseEntity<Void> receberNotificacao(
            @RequestParam(value = "data.id", required = false) Long dataId,
            @RequestParam(value = "type", required = false) String type) {

        if ("payment".equals(type) && dataId != null) {

            MercadoPagoConfig.setAccessToken(mpAccessToken.trim());
            PaymentClient client = new PaymentClient();

            try {
                Payment payment = client.get(dataId);

                if ("approved".equals(payment.getStatus())) {

                    if (recebidoSaasRepo.findByMpPaymentId(dataId).isPresent()) {
                        logger.info("WEBHOOK: pagamento {} já registrado (idempotente).", dataId);
                        return ResponseEntity.ok().build();
                    }

                    double valor = 0.0;
                    if (payment.getTransactionAmount() != null) {
                        valor = payment.getTransactionAmount().doubleValue();
                    }

                    LocalDateTime dataHora = LocalDateTime.now(ZoneId.systemDefault());
                    if (payment.getDateCreated() != null) {
                        dataHora = payment.getDateCreated().toLocalDateTime();
                    }

                    String pagadorNome = "";
                    String pagadorEmail = "";
                    PaymentPayer payer = payment.getPayer();
                    if (payer != null) {
                        pagadorEmail = payer.getEmail() != null ? payer.getEmail() : "";
                        String fn = payer.getFirstName() != null ? payer.getFirstName() : "";
                        String ln = payer.getLastName() != null ? payer.getLastName() : "";
                        pagadorNome = (fn + " " + ln).trim();
                        if (pagadorNome.isEmpty()) {
                            pagadorNome = !pagadorEmail.isEmpty() ? pagadorEmail : "—";
                        }
                    } else {
                        pagadorNome = "—";
                    }

                    String reference = payment.getExternalReference();
                    Long empresaIdParsed = null;
                    Integer diasComprados = null;

                    if (reference != null && reference.contains(":")) {
                        try {
                            String[] partes = reference.split(":");
                            empresaIdParsed = Long.parseLong(partes[0].trim());
                            diasComprados = Integer.parseInt(partes[1].trim());
                        } catch (Exception ex) {
                            logger.warn("WEBHOOK: referência inválida: {}", reference);
                        }
                    }

                    String empresaNome = "—";
                    if (empresaIdParsed != null) {
                        empresaNome = empresaRepo.findById(empresaIdParsed)
                                .map(Empresa::getNome)
                                .orElse("Empresa #" + empresaIdParsed);
                    }

                    final Long eidCredito = empresaIdParsed;
                    final Integer diasCredito = diasComprados;
                    if (eidCredito != null && diasCredito != null && reference != null && reference.contains(":")) {
                        empresaRepo.findById(eidCredito).ifPresentOrElse(empresa -> {
                            int saldoAtual = (empresa.getDiasRestantes() != null) ? empresa.getDiasRestantes() : 0;
                            empresa.setDiasRestantes(saldoAtual + diasCredito);
                            if (!empresa.isAtivo()) {
                                empresa.setAtivo(true);
                            }
                            empresaRepo.save(empresa);
                            logger.info("✅ WEBHOOK SUCESSO: Empresa {} +{} dias. ID Pagamento: {}",
                                    empresa.getNome(), diasCredito, dataId);
                        }, () -> logger.warn("⚠️ WEBHOOK: Empresa ID {} não localizada.", eidCredito));
                    }

                    PagamentoRecebidoSaas row = new PagamentoRecebidoSaas();
                    row.setMpPaymentId(dataId);
                    row.setEmpresaId(empresaIdParsed);
                    row.setEmpresaNome(empresaNome);
                    row.setValor(valor);
                    row.setDataHora(dataHora);
                    row.setPagadorNome(pagadorNome);
                    row.setPagadorEmail(pagadorEmail);
                    row.setDiasCreditados(diasComprados);
                    row.setStatus("approved");
                    recebidoSaasRepo.save(row);
                } else {
                    logger.info("ℹ️ WEBHOOK: Pagamento {} com status: {}", dataId, payment.getStatus());
                }
            } catch (Exception e) {
                logger.error("❌ WEBHOOK ERRO CRÍTICO: Falha ao processar notificação {}", dataId, e);
                return ResponseEntity.internalServerError().build();
            }
        }

        return ResponseEntity.ok().build();
    }
}
