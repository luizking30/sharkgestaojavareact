package com.assistencia.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Envia e-mail de recuperação com layout HTML profissional.
     */
    public void enviarEmailRecuperacao(String para, String token) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            // O link que o usuário clicará (ajuste o IP/Domínio quando subir para produção)
            String linkRecuperacao = "https://sharkgestao.com/resetar-senha?token=" + token;

            String conteudoHtml =
                    "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>" +
                            "  <div style='background-color: #0047ab; padding: 20px; text-align: center;'>" +
                            "    <h1 style='color: white; margin: 0;'>Shark Eletrônicos</h1>" +
                            "  </div>" +
                            "  <div style='padding: 30px; color: #333; line-height: 1.6;'>" +
                            "    <h2 style='color: #0047ab;'>Recuperação de Acesso</h2>" +
                            "    <p>Olá,</p>" +
                            "    <p>Recebemos uma solicitação para redefinir a senha da sua conta no sistema de gestão.</p>" +
                            "    <p>Clique no botão abaixo para escolher uma nova senha. Este link é válido por <strong>1 hora</strong>.</p>" +
                            "    <div style='text-align: center; margin: 40px 0;'>" +
                            "      <a href='" + linkRecuperacao + "' style='background-color: #00d4ff; color: #020617; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase;'>Redefinir Senha</a>" +
                            "    </div>" +
                            "    <p style='font-size: 0.9em; color: #666;'>Se você não solicitou essa alteração, ignore este e-mail por segurança.</p>" +
                            "  </div>" +
                            "  <div style='background-color: #f8fafc; padding: 15px; text-align: center; font-size: 0.8em; color: #94a3b8; border-top: 1px solid #ddd;'>" +
                            "    © 2026 Shark Eletrônicos - Taguatinga, DF" +
                            "  </div>" +
                            "</div>";

            helper.setFrom("seu-email@gmail.com"); // Deve ser o mesmo do application.properties
            helper.setTo(para);
            helper.setSubject("Recuperação de Senha | Shark Eletrônicos");
            helper.setText(conteudoHtml, true); // O 'true' indica que é HTML

            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            throw new RuntimeException("Erro ao disparar e-mail de recuperação: " + e.getMessage());
        }
    }
}