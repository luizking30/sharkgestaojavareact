package com.assistencia.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend.login-url:https://sharkgestao.com/login}")
    private String frontendLoginUrl;

    @Value("${app.frontend.base-url:https://sharkgestao.com}")
    private String frontendBaseUrl;

    private final String EMAIL_SHARK = "gestaoempresarialshark@gmail.com";
    private final String COR_PRINCIPAL = "#0047ab"; // Azul Shark
    private final String COR_DESTAQUE = "#00d4ff"; // Azul Claro

    public void enviarEmailRecuperacao(String para, String token) {
        String base = frontendBaseUrl.replaceAll("/$", "");
        String linkRecuperacao = base + "/resetar-senha?token=" + token;

        String conteudoHtml = montarLayoutHtml(
                "Recuperação de Acesso",
                "<p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>" +
                        "<p>Clique no botão abaixo para escolher uma nova senha. Este link é válido por <strong>1 hora</strong>.</p>",
                linkRecuperacao,
                "Redefinir Senha",
                "<p style='font-size: 0.9em; color: #666;'>Se você não solicitou essa alteração, ignore este e-mail.</p>"
        );

        dispararEmailHtml(para, "Recuperação de Senha | Shark Gestão Empresarial", conteudoHtml);
    }

    public void enviarBoasVindasEmpresa(String para, String nomeEmpresa, String cnpj, String login, String cpf, String whatsapp) {
        String linkAcesso = frontendLoginUrl;

        String detalhesVindas =
                "<p>Bem-vindo ao <strong>Sistema de Gestão Empresarial Shark</strong>!</p>" +
                        "<p><strong>Faça login aqui:</strong> <a href='" + linkAcesso + "' style='color: " + COR_PRINCIPAL + "; font-weight: bold;'>" + linkAcesso + "</a></p>" +
                        "<p>Você acaba de ganhar <strong>7 dias de teste grátis</strong> para explorar todas as nossas ferramentas.</p>" +
                        "<div style='background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid " + COR_PRINCIPAL + ";'>" +
                        "  <h3 style='margin-top: 0; color: " + COR_PRINCIPAL + ";'>Suas Credenciais:</h3>" +
                        "  <p style='margin: 5px 0;'><strong>Empresa:</strong> " + nomeEmpresa + "</p>" +
                        "  <p style='margin: 5px 0;'><strong>CNPJ:</strong> " + (cnpj != null ? cnpj : "Não informado") + "</p>" +
                        "  <p style='margin: 5px 0;'><strong>Login:</strong> " + login + "</p>" +
                        "  <p style='margin: 5px 0;'><strong>CPF:</strong> " + cpf + "</p>" +
                        "  <p style='margin: 5px 0;'><strong>WhatsApp:</strong> " + whatsapp + "</p>" +
                        "</div>" +
                        "<p>Precisa de ajuda? Fale conosco pelo WhatsApp: <a href='https://wa.me/5561981048509' style='color: " + COR_PRINCIPAL + "; font-weight: bold;'>61 9 8104-8509</a>.</p>";

        String conteudoHtml = montarLayoutHtml(
                "Bem-vindo à Shark!",
                detalhesVindas,
                linkAcesso,
                "Fazer login",
                "<p style='font-size: 0.9em; color: #666;'>Guarde este e-mail para consultas futuras de suas credenciais.</p>"
        );

        dispararEmailHtml(para, "Bem-vindo ao Sistema Shark!", conteudoHtml);
    }
    public void enviarEmailAprovacaoFuncionario(String para, String nomeFuncionario, String nomeEmpresa) {
        String linkAcesso = frontendLoginUrl;

        String corpoTxt =
                "<p>Olá, <strong>" + nomeFuncionario + "</strong>!</p>" +
                        "<p>Ótimas notícias! Sua conta no <strong>Sistema de Gestão Empresarial Shark</strong> acaba de ser aprovada pelo proprietário da empresa <strong>" + nomeEmpresa + "</strong>.</p>" +
                        "<p>Agora você já pode acessar todas as ferramentas liberadas para o seu perfil e começar a registrar suas atividades.</p>";

        String conteudoHtml = montarLayoutHtml(
                "Acesso Liberado!",
                corpoTxt,
                linkAcesso,
                "Fazer login",
                "<p style='font-size: 0.9em; color: #666;'>Bom trabalho e boas vendas!</p>"
        );

        dispararEmailHtml(para, "Sua conta foi aprovada! | Shark Gestão", conteudoHtml);
    }
    public void enviarBoasVindasFuncionario(String para, String nomeEmpresa, String login, String cpf, String whatsapp) {
        String linkAcesso = frontendLoginUrl;

        String detalhesFuncionario =
                "<p>Bem-vindo ao <strong>Sistema de Gestão Empresarial Shark</strong>!</p>" +
                        "<p><strong>Faça login aqui:</strong> <a href='" + linkAcesso + "' style='color: " + COR_PRINCIPAL + "; font-weight: bold;'>" + linkAcesso + "</a></p>" +
                        "<p>Você se cadastrou como funcionário na empresa: <strong>" + nomeEmpresa + "</strong></p>" +
                        "<div style='background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid " + COR_PRINCIPAL + ";'>" +
                        "  <h3 style='margin-top: 0; color: " + COR_PRINCIPAL + ";'>Suas Credenciais:</h3>" +
                        "  <p style='margin: 5px 0;'><strong>Empresa:</strong> " + nomeEmpresa + "</p>" +
                        "  <p style='margin: 5px 0;'><strong>Login:</strong> " + login + "</p>" +
                        "  <p style='margin: 5px 0;'><strong>CPF:</strong> " + cpf + "</p>" +
                        "  <p style='margin: 5px 0;'><strong>WhatsApp:</strong> " + whatsapp + "</p>" +
                        "</div>" +
                        "<p>Precisa de ajuda? Fale conosco pelo WhatsApp: <a href='https://wa.me/5561981048509' style='color: " + COR_PRINCIPAL + "; font-weight: bold;'>61 9 8104-8509</a>.</p>";

        String conteudoHtml = montarLayoutHtml(
                "Bem-vindo à Equipe Shark!",
                detalhesFuncionario,
                linkAcesso,
                "Fazer login",
                "<p style='font-size: 0.9em; color: #666;'>Guarde este e-mail para consultas futuras de suas credenciais.</p>"
        );

        dispararEmailHtml(para, "Bem-vindo ao Sistema Shark!", conteudoHtml);
    }

    private String montarLayoutHtml(String tituloHeader, String corpoTxt, String linkBtn, String textoBtn, String rodapeTxt) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>" +
                "  <div style='background-color: " + COR_PRINCIPAL + "; padding: 25px; text-align: center;'>" +
                "    <h1 style='color: white; margin: 0;'>Shark Gestão Empresarial</h1>" +
                "  </div>" +
                "  <div style='padding: 30px; color: #333; line-height: 1.6;'>" +
                "    <h2 style='color: " + COR_PRINCIPAL + ";'>" + tituloHeader + "</h2>" +
                corpoTxt +
                "    <div style='text-align: center; margin: 35px 0;'>" +
                "      <a href='" + linkBtn + "' style='background-color: " + COR_DESTAQUE + "; color: #020617; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; display: inline-block;'> " + textoBtn + " </a>" +
                "    </div>" +
                rodapeTxt +
                "  </div>" +
                "  <div style='background-color: #f8fafc; padding: 15px; text-align: center; font-size: 0.8em; color: #94a3b8; border-top: 1px solid #ddd;'>" +
                "    © 2026 Shark Gestão Empresarial<br>gestaoempresarialshark@gmail.com" +
                "  </div>" +
                "</div>";
    }

    private void dispararEmailHtml(String para, String assunto, String conteudoHtml) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setFrom(EMAIL_SHARK);
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(conteudoHtml, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Erro ao disparar e-mail: " + e.getMessage());
        }
    }
}