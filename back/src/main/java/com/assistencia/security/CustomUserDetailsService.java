package com.assistencia.security;

import com.assistencia.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority; // IMPORTANTE: Para converter a String
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import com.assistencia.model.Usuario;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UsuarioRepository repo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Busca no MySQL
        Usuario usuario = repo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));

        // 2. Trava de segurança para aprovação
        if (!usuario.isAprovado()) {
            throw new DisabledException("Usuário " + username + " ainda não foi aprovado pelo administrador.");
        }

        // 3. Tratamento da Role (Garante o prefixo ROLE_ e converte para Authority)
        String roleNoBanco = usuario.getRole();

        // Se no banco estiver apenas 'OWNER', o Spring exige 'ROLE_OWNER'
        if (roleNoBanco != null && !roleNoBanco.startsWith("ROLE_")) {
            roleNoBanco = "ROLE_" + roleNoBanco;
        }

        // 4. Retorno formatado usando SimpleGrantedAuthority
        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority(roleNoBanco)))
                .build();
    }
}