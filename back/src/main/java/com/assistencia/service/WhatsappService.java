package com.assistencia.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsappService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${evolution.enabled:false}")
    private boolean enabled;

    @Value("${evolution.base-url:}")
    private String baseUrl;

    @Value("${evolution.instance:}")
    private String instance;

    @Value("${evolution.api-key:}")
    private String apiKey;

    public void enviarBoasVindasEmpresa(String whatsapp, String nomeEmpresa, String login, String cpf) {
        String msg = "Bem-vindo ao Shark Gestao!%n" +
                "Empresa: " + nomeEmpresa + "%n" +
                "Login: " + login + "%n" +
                "CPF: " + cpf + "%n" +
                "Seu acesso inicial esta liberado.";
        enviarMensagem(whatsapp, msg);
    }

    public void enviarBoasVindasFuncionario(String whatsapp, String nomeEmpresa, String login, String cpf) {
        String msg = "Cadastro recebido no Shark Gestao!%n" +
                "Empresa: " + nomeEmpresa + "%n" +
                "Login: " + login + "%n" +
                "CPF: " + cpf + "%n" +
                "Aguarde a aprovacao do proprietario.";
        enviarMensagem(whatsapp, msg);
    }

    public void enviarRecuperacaoSenha(String whatsapp, String token) {
        String link = "http://localhost:5173/resetar-senha?token=" + token;
        String msg = "Recuperacao de senha Shark Gestao.%n" +
                "Use este link (valido por 1 hora):%n" + link;
        enviarMensagem(whatsapp, msg);
    }

    public void enviarMensagem(String whatsapp, String mensagem) {
        String numero = normalizarNumero(whatsapp);
        if (numero == null) {
            log.warn("WhatsApp invalido para envio: '{}'", whatsapp);
            return;
        }
        if (!enabled) {
            log.info("Evolution desabilitada. Mensagem nao enviada para {}", numero);
            return;
        }
        if (baseUrl.isBlank() || instance.isBlank() || apiKey.isBlank()) {
            log.warn("Evolution configuracao incompleta. Verifique base-url, instance e api-key.");
            return;
        }

        try {
            String url = baseUrl.replaceAll("/$", "") + "/message/sendText/" + instance;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("number", numero);
            body.put("text", mensagem.replace("%n", "\n"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            log.info("WhatsApp enviado para {} via Evolution (status={})", numero, response.getStatusCodeValue());
        } catch (Exception e) {
            log.error("Falha ao enviar WhatsApp via Evolution para {}: {}", numero, e.getMessage());
        }
    }

    private String normalizarNumero(String whatsapp) {
        if (whatsapp == null) return null;
        String numero = whatsapp.replaceAll("\\D", "");
        if (numero.length() < 10) return null;
        if (!numero.startsWith("55")) {
            numero = "55" + numero;
        }
        return numero;
    }
}

