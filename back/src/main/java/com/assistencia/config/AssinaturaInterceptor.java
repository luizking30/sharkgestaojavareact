package com.assistencia.config;

import com.assistencia.model.Usuario;
import com.assistencia.repository.UsuarioRepository;
import com.assistencia.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AssinaturaInterceptor implements HandlerInterceptor {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        String uri = request.getRequestURI();

        // 1. Libera rotas críticas: Auth, Webhook do Mercado Pago e Erros
        if (uri.startsWith("/api/auth") ||
                uri.startsWith("/api/webhook") ||
                uri.startsWith("/api/pagamento") || // Rota para gerar o PIX deve estar aberta
                uri.startsWith("/api/admin/empresa/gerar-renovacao") || // Renovação no novo endpoint
                uri.startsWith("/api/pagamentos/assinatura/status-check") || // Polling de confirmação PIX
                uri.startsWith("/error")) {
            return true;
        }

        // 2. Recupera o usuário logado via SecurityContext
        Usuario usuario = securityUtils.getUsuarioLogado();

        if (usuario != null && usuario.getEmpresa() != null) {
            // 3. Verificação de Inadimplência
            if (usuario.getEmpresa().getDiasRestantes() <= 0) {
                // Em APIs, retornamos 402 em vez de redirecionar
                response.setStatus(402); // Payment Required
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"erro\": \"Assinatura expirada\", \"mensagem\": \"Renove seu acesso via PIX.\"}");
                return false;
            }
        }

        return true;
    }
}