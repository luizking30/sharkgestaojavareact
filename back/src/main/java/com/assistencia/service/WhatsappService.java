package com.assistencia.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsappService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappService.class);
    private final RestTemplate restTemplate = criarRestTemplateUtf8();

    @Value("${evolution.enabled:false}")
    private boolean enabled;

    @Value("${evolution.base-url:}")
    private String baseUrl;

    @Value("${evolution.instance:}")
    private String instance;

    @Value("${evolution.api-key:}")
    private String apiKey;

    /**
     * Quando {@code true}, a Evolution pede prévia de link (cartão com site). Em vários aparelhos,
     * mensagem curta só com URL ou preview que falha chega como balão vazio — o padrão é {@code false}.
     */
    @Value("${evolution.link-preview:false}")
    private boolean evolutionLinkPreview;

    /**
     * Se {@code true}, não remove o 9 após o DDD no celular BR (55 + DDD + 9 + 8 dígitos).
     * Use só se o destinatário continuar com balão vazio com o formato de 12 dígitos.
     */
    @Value("${evolution.brazil-mobile-keep-9:false}")
    private boolean brasilMobileManter9;

    @Value("${app.frontend.login-url:https://sharkgestao.com/login}")
    private String frontendLoginUrl;

    @Value("${app.frontend.base-url:https://sharkgestao.com}")
    private String frontendBaseUrl;

    public void enviarBoasVindasEmpresa(
            String whatsapp,
            Long idEmpresa,
            String nomeEmpresa,
            String cnpj,
            String whatsappEmpresa,
            String nomeProprietario,
            String login,
            String email,
            String whatsappProprietario,
            String cpf
    ) {
        String cnpjFmt = (cnpj == null || cnpj.isBlank()) ? "Nao informado" : cnpj;
        String wppEmpresaFmt = (whatsappEmpresa == null || whatsappEmpresa.isBlank()) ? "Nao informado" : whatsappEmpresa;
        String nomePropFmt = (nomeProprietario == null || nomeProprietario.isBlank()) ? "Nao informado" : nomeProprietario;
        String emailFmt = textoEmailParaWhatsApp(email);
        String wppPropFmt = (whatsappProprietario == null || whatsappProprietario.isBlank()) ? "Nao informado" : whatsappProprietario;
        String cpfFmt = (cpf == null || cpf.isBlank()) ? "Nao informado" : cpf;
        String idFmt = (idEmpresa == null) ? "Nao informado" : String.valueOf(idEmpresa);

        String msg = "*Bem-vindo ao sistema Shark Gestao Empresarial!*%n%n" +
                "*Acesse o sistema (link oficial):*%n" + frontendLoginUrl + "%n%n" +
                "*Dados da Empresa*%n" +
                "ID: *" + idFmt + "*%n" +
                "Nome: *" + nomeEmpresa + "*%n" +
                "CNPJ: *" + cnpjFmt + "*%n" +
                "WhatsApp: *" + wppEmpresaFmt + "*%n%n" +
                "*Dados do Proprietario*%n" +
                "Nome: *" + nomePropFmt + "*%n" +
                "Login: *" + login + "*%n" +
                "E-mail: " + emailFmt + "%n" +
                "WhatsApp: *" + wppPropFmt + "*%n" +
                "CPF: *" + cpfFmt + "*%n%n" +
                "Guarde suas credenciais em lugar seguro.%n" +
                "Voce recebeu *30 dias de acesso gratis*!%n" +
                "Caso esqueca sua senha, use *Esqueci minha senha* no menu de login.%n" +
                "Qualquer duvida, pode chamar neste numero mesmo!%n%n" +
                "Desejamos um excelente faturamento!";
        enviarMensagem(whatsapp, msg, evolutionLinkPreview);
    }

    /**
     * Funcionario recém-cadastrado: aguarda aprovacao do proprietario.
     */
    public void enviarBoasVindasFuncionario(
            String whatsapp,
            String nomeEmpresa,
            String login,
            String nome,
            String cpf,
            String email,
            String whatsappFuncionario
    ) {
        String nomeFmt = (nome == null || nome.isBlank()) ? "Nao informado" : nome;
        String cpfFmt = (cpf == null || cpf.isBlank()) ? "Nao informado" : cpf;
        String emailFmt = textoEmailParaWhatsApp(email);
        String wppFmt = (whatsappFuncionario == null || whatsappFuncionario.isBlank()) ? "Nao informado" : whatsappFuncionario;

        String msg = "*Boas-vindas ao Shark Gestao Empresarial!*%n%n" +
                "*Acesse o sistema (link oficial):*%n" + frontendLoginUrl + "%n%n" +
                "Voce se cadastrou como *funcionario* na empresa: *" + nomeEmpresa + "*%n%n" +
                "Agora o *proprietario* deve aprovar seu cadastro. Voce sera notificado quando isso for feito!%n%n" +
                "*Seus dados*%n" +
                "Login: *" + login + "*%n" +
                "Nome: *" + nomeFmt + "*%n" +
                "CPF: *" + cpfFmt + "*%n" +
                "E-mail: " + emailFmt + "%n" +
                "WhatsApp: *" + wppFmt + "*%n%n" +
                "*Avisos finais*%n" +
                "Guarde suas credenciais em lugar seguro.%n" +
                "Caso esqueca sua senha, use *Esqueci minha senha* no menu de login.%n" +
                "Bom faturamento!";
        enviarMensagem(whatsapp, msg, evolutionLinkPreview);
    }

    /**
     * Funcionario aprovado pelo proprietario.
     */
    public void enviarFuncionarioAprovado(
            String whatsapp,
            String nomeEmpresa,
            String nomeProprietarioAprovador,
            String login,
            String nome,
            String cpf,
            String email,
            String whatsappFuncionario
    ) {
        String nomeFmt = (nome == null || nome.isBlank()) ? "Nao informado" : nome;
        String cpfFmt = (cpf == null || cpf.isBlank()) ? "Nao informado" : cpf;
        String emailFmt = textoEmailParaWhatsApp(email);
        String wppFmt = (whatsappFuncionario == null || whatsappFuncionario.isBlank()) ? "Nao informado" : whatsappFuncionario;
        String propFmt = (nomeProprietarioAprovador == null || nomeProprietarioAprovador.isBlank()) ? "Nao informado" : nomeProprietarioAprovador;

        String msg = "*Boas-vindas ao Shark Gestao Empresarial!*%n%n" +
                "*Acesse o sistema (link oficial):*%n" + frontendLoginUrl + "%n%n" +
                "Voce foi *aceito* na empresa: *" + nomeEmpresa + "* pelo proprietario: *" + propFmt + "*%n%n" +
                "Voce ja pode usar todo o sistema livremente. Verifique em *Meu painel* as suas informacoes sobre vendas e comissoes.%n%n" +
                "*Seus dados*%n" +
                "Login: *" + login + "*%n" +
                "Nome: *" + nomeFmt + "*%n" +
                "CPF: *" + cpfFmt + "*%n" +
                "E-mail: " + emailFmt + "%n" +
                "WhatsApp: *" + wppFmt + "*%n%n" +
                "*Avisos finais*%n" +
                "Guarde suas credenciais em lugar seguro.%n" +
                "Caso esqueca sua senha, use *Esqueci minha senha* no menu de login.%n" +
                "Bom faturamento!";
        enviarMensagem(whatsapp, msg, evolutionLinkPreview);
    }

    public void enviarRecuperacaoSenha(String whatsapp, String token) {
        String base = frontendBaseUrl.replaceAll("/$", "");
        String link = base + "/resetar-senha?token=" + token;
        String msg = "Recuperacao de senha Shark Gestao.%n" +
                "Use este link (valido por 1 hora):%n" + link;
        enviarMensagem(whatsapp, msg, false);
    }

    public void enviarAtualizacaoOrdemServicoCliente(
            String whatsappCliente,
            Long ordemId,
            String status,
            LocalDateTime dataHoraStatus,
            String funcionarioNome
    ) {
        String funcionario = (funcionarioNome == null || funcionarioNome.isBlank()) ? "Nao informado" : funcionarioNome;
        String dataHora = (dataHoraStatus == null)
                ? "Nao informado"
                : dataHoraStatus.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        String msg = "Atualizacao da sua Ordem de Servico Shark Gestao.%n%n" +
                "OS: *#" + ordemId + "*%n" +
                "Status atual: *" + status + "*%n" +
                "Data/Hora: *" + dataHora + "*%n" +
                "Atualizado por: *" + funcionario + "*%n%n" +
                "Qualquer duvida, responda neste numero.";
        enviarMensagem(whatsappCliente, msg, false);
    }

    /** Envia texto com {@code linkPreview: false} (mais estável para o destinatário ver o conteúdo). */
    public void enviarMensagem(String whatsapp, String mensagem) {
        enviarMensagem(whatsapp, mensagem, false);
    }

    public void enviarMensagem(String whatsapp, String mensagem, boolean linkPreview) {
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
            // Evolution v2 espera JSON UTF-8; campo do texto deve ser exatamente "text" (nao message/body).
            headers.setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("apikey", apiKey);

            String texto = prepararTextoParaEnvioWhatsApp(mensagem.replace("%n", "\n"));
            if (texto.isBlank()) {
                log.warn("WhatsApp texto vazio apos preparacao; envio cancelado para {}", numero);
                return;
            }

            // Contrato sendText v2: number (muitos relatos de balao vazio sem @s.whatsapp.net), text, linkPreview.
            // Sem delay: o ramo "digitando" na Evolution/Baileys pode agravar corrida de sessao em algumas builds.
            Map<String, Object> body = new HashMap<>();
            body.put("number", numeroComSufixoWhatsappNet(numero));
            body.put("text", texto);
            body.put("linkPreview", linkPreview);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            log.info("WhatsApp enviado para {} via Evolution (status={}, chars={}, linkPreview={})", numero, response.getStatusCodeValue(), texto.length(), linkPreview);
        } catch (Exception e) {
            log.error("Falha ao enviar WhatsApp via Evolution para {}: {}", numero, e.getMessage());
        }
    }

    /**
     * Compara dois numeros de WhatsApp apos a mesma normalizacao usada no envio (DDI 55).
     */
    public boolean numerosWhatsAppIguais(String a, String b) {
        String na = normalizarNumero(a);
        String nb = normalizarNumero(b);
        if (na == null && nb == null) {
            return true;
        }
        if (na == null || nb == null) {
            return false;
        }
        return na.equals(nb);
    }

    /**
     * Evita que o WhatsApp interprete o e-mail como link (ex.: hot.com).
     * Separa @ e pontos do dominio com espacos — o usuario pode copiar e remover os espacos.
     */
    private static RestTemplate criarRestTemplateUtf8() {
        RestTemplate rt = new RestTemplate();
        for (var c : rt.getMessageConverters()) {
            if (c instanceof MappingJackson2HttpMessageConverter mj) {
                mj.setDefaultCharset(StandardCharsets.UTF_8);
            }
            if (c instanceof StringHttpMessageConverter sh) {
                sh.setDefaultCharset(StandardCharsets.UTF_8);
            }
        }
        return rt;
    }

    /**
     * Normaliza para NFC e remove apenas pictogramas emoji (U+1F300..U+1FAFF) e seletor de variacao U+FE0F.
     * Evita NFD+remocao de marcas diacriticas (prejudica acentuacao) e faixas Unicode amplas que nao sao emoji.
     * Mensagens genericas usam {@code linkPreview: false} na Evolution para evitar texto vazio no destinatario;
     * boas-vindas com link oficial podem ativar preview para exibir miniatura (depende de og:image no site).
     */
    private static String prepararTextoParaEnvioWhatsApp(String texto) {
        if (texto == null) {
            return "";
        }
        String s = Normalizer.normalize(texto, Normalizer.Form.NFC);
        s = s.replace("\uFE0F", "");
        return removerEmojisSuplementares(s);
    }

    private static boolean codePointEhEmojiSuplementar(int cp) {
        return cp >= 0x1F300 && cp <= 0x1FAFF;
    }

    private static String removerEmojisSuplementares(String s) {
        return s.codePoints()
                .filter(cp -> !codePointEhEmojiSuplementar(cp))
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }

    private String textoEmailParaWhatsApp(String email) {
        if (email == null || email.isBlank()) {
            return "Nao informado";
        }
        String t = email.trim();
        int at = t.indexOf('@');
        if (at <= 0 || at >= t.length() - 1) {
            return t;
        }
        String local = t.substring(0, at);
        String domain = t.substring(at + 1);
        String domainSpaced = domain.replace(".", " . ");
        return local + " @ " + domainSpaced;
    }

    private String normalizarNumero(String whatsapp) {
        if (whatsapp == null) return null;
        String numero = whatsapp.replaceAll("\\D", "");
        if (numero.length() < 10) return null;
        if (!numero.startsWith("55")) {
            numero = "55" + numero;
        }
        return numeroParaEnvioEvolutionBrasil(numero);
    }

    /**
     * Celular BR no formato novo (13 digitos: 55 + DDD + 9 + 8 digitos) costuma ser resolvido pelo WhatsApp
     * para um JID sem o 9 apos o DDD (12 digitos). Enviar no formato do JID evita balao vazio no destinatario
     * em varias versoes do cliente, enquanto a API ainda retorna 201.
     */
    private String numeroParaEnvioEvolutionBrasil(String numero) {
        if (brasilMobileManter9) {
            return numero;
        }
        if (numero != null && numero.matches("^55\\d{2}9\\d{8}$")) {
            return numero.substring(0, 4) + numero.substring(5);
        }
        return numero;
    }

    /** Evolution aceita so digitos; alguns casos de texto vazio no destinatario melhoram com JID explicito. */
    private static String numeroComSufixoWhatsappNet(String apenasDigitos) {
        if (apenasDigitos == null || apenasDigitos.isBlank()) {
            return apenasDigitos;
        }
        if (apenasDigitos.contains("@")) {
            return apenasDigitos;
        }
        return apenasDigitos + "@s.whatsapp.net";
    }
}

