package com.assistencia.controller;

import com.assistencia.model.Usuario;
import com.assistencia.repository.UsuarioRepository;
import com.assistencia.util.SecurityUtils;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.common.IdentificationRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.exceptions.MPApiException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController // MUDOU: Agora é uma API
@RequestMapping("/api/pagamento") // MUDOU: Padronizado
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class DiasPagoController {

    @Autowired
    private SecurityUtils securityUtils;

    @Value("${mercado_pago_sample_access_token}")
    private String mpAccessToken;

    /**
     * Retorna os dados da empresa e dias restantes para o React exibir na tela de recarga.
     */
    @GetMapping("/status")
    public ResponseEntity<?> consultarStatus() {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        return ResponseEntity.ok(Map.of(
                "empresa", logado.getEmpresa().getNome(),
                "diasRestantes", logado.getEmpresa().getDiasRestantes(),
                "email", logado.getEmail()
        ));
    }

    @PostMapping("/gerar-pix")
    public ResponseEntity<?> processarPagamentoPix(@RequestParam("quantidadeDias") int quantidadeDias) {

        try {
            if (quantidadeDias <= 0) {
                return ResponseEntity.badRequest().body("Quantidade de dias inválida.");
            }

            Usuario usuario = securityUtils.getUsuarioLogado();
            if (usuario == null || usuario.getEmpresa() == null) {
                return ResponseEntity.status(401).body("Usuário não identificado.");
            }

            // Configura Mercado Pago
            MercadoPagoConfig.setAccessToken(mpAccessToken.trim());

            String email = usuario.getEmail();
            String cpfLimpado = limparCpf(usuario.getCpf());

            if (email == null || cpfLimpado == null || cpfLimpado.length() != 11) {
                return ResponseEntity.badRequest().body("Dados cadastrais incompletos (CPF ou E-mail).");
            }

            // R$ 2,00 por dia
            BigDecimal valorTotal = BigDecimal.valueOf(quantidadeDias).multiply(new BigDecimal("2.00"));

            PaymentClient client = new PaymentClient();

            PaymentPayerRequest payer = PaymentPayerRequest.builder()
                    .email(email)
                    .firstName(usuario.getNome())
                    .identification(IdentificationRequest.builder()
                            .type("CPF")
                            .number(cpfLimpado)
                            .build())
                    .build();

            PaymentCreateRequest paymentRequest = PaymentCreateRequest.builder()
                    .transactionAmount(valorTotal)
                    .description("Recarga Shark: " + quantidadeDias + " dias")
                    .paymentMethodId("pix")
                    // Identificador para o seu Webhook liberar a empresa certa
                    .externalReference(usuario.getEmpresa().getId() + ":" + quantidadeDias)
                    .payer(payer)
                    .build();

            Payment payment = client.create(paymentRequest);

            // Retorna o JSON para o React montar o QR Code
            return ResponseEntity.ok(Map.of(
                    "copiaECola", payment.getPointOfInteraction().getTransactionData().getQrCode(),
                    "qrCodeBase64", payment.getPointOfInteraction().getTransactionData().getQrCodeBase64(),
                    "valor", valorTotal,
                    "dias", quantidadeDias
            ));

        } catch (MPApiException e) {
            return ResponseEntity.badRequest().body("Erro no Mercado Pago: " + e.getApiResponse().getContent());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    private String limparCpf(String cpf) {
        if (cpf == null) return null;
        return cpf.replaceAll("[^0-9]", "");
    }
}