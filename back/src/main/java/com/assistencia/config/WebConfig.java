package com.assistencia.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private AssinaturaInterceptor assinaturaInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(assinaturaInterceptor)
                // 🔐 TRAVA GLOBAL: Aplica o interceptor em todas as rotas da API
                .addPathPatterns("/api/**")

                // 🔓 EXCEÇÕES: Rotas que precisam funcionar mesmo com a assinatura vencida
                .excludePathPatterns(
                        "/api/auth/**",      // Login e Registro
                        "/api/webhook/**",   // Mercado Pago (precisa receber o aviso de pagamento)
                        "/api/pagamento/**", // Geração do PIX para o cliente pagar
                        "/error"             // Evita loop infinito em caso de erro interno
                );
    }
}