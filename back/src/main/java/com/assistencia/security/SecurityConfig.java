package com.assistencia.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        // 🔓 PORTAS ABERTAS: Autenticação e Webhooks
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/webhook/**",
                                "/error/**",
                                "/favicon.ico"
                        ).permitAll()

                        // 👑 SUPER ADMIN (Fundador Shark): Acesso exclusivo ao ecossistema
                        .requestMatchers("/api/super-admin/**").hasRole("OWNER")

                        // 🔐 ADMIN (Dono de Loja): Gestão de funcionários e comissões
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "OWNER")
                        .requestMatchers("/api/pagamentos/comissoes/**").hasAnyRole("ADMIN", "OWNER")

                        .requestMatchers("/api/clientes/**").hasAnyRole("ADMIN", "OWNER", "TECNICO", "VENDEDOR")
                        .requestMatchers("/api/ordens/**").hasAnyRole("ADMIN", "OWNER", "TECNICO", "VENDEDOR")
                        .requestMatchers("/api/servicos/**").hasAnyRole("ADMIN", "OWNER", "TECNICO", "VENDEDOR")
                        .requestMatchers("/api/vendas/**").hasAnyRole("ADMIN", "OWNER", "TECNICO", "VENDEDOR")
                        .requestMatchers("/api/estoque/**").hasAnyRole("ADMIN", "OWNER")
                        .requestMatchers("/api/contas/**").hasAnyRole("ADMIN", "OWNER")
                        .requestMatchers("/api/relatorios/**").hasAnyRole("ADMIN", "OWNER")

                        // 🛡️ REGRAS GERAIS
                        .anyRequest().authenticated()
                )
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(form -> form.disable())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://127.0.0.1:5173",
                "http://192.168.*:5173",
                "http://10.*:5173",
                "http://172.16.*:5173",
                "http://172.17.*:5173",
                "http://172.18.*:5173",
                "http://172.19.*:5173",
                "http://172.2*:5173",
                "http://172.30.*:5173",
                "http://172.31.*:5173"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}