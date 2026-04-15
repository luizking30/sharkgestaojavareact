package com.assistencia.repository;

import com.assistencia.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * 🦈 BUSCA MULTI-IDENTIFICADOR SHARK:
     * Utilizada na recuperação de senha para localizar o usuário por
     * Login, CPF, E-mail ou WhatsApp com um único parâmetro.
     */
    @Query("SELECT u FROM Usuario u WHERE u.username = :id OR u.cpf = :id OR u.email = :id OR u.whatsapp = :id")
    Optional<Usuario> findByIdentificadorRecuperacao(@Param("id") String id);

    /**
     * 🔑 RECUPERAÇÃO DE SENHA:
     * Busca o usuário pelo token único gerado no e-mail.
     */
    Optional<Usuario> findByResetPasswordToken(String token);

    /**
     * 1. ESSENCIAL: Busca pelo nome de usuário (Usado pelo Spring Security).
     */
    Optional<Usuario> findByUsername(String username);

    /**
     * 📧 VALIDAÇÃO: Busca por e-mail para verificar duplicidade no cadastro.
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * 📱 VALIDAÇÃO WHATSAPP: Busca para verificar duplicidade de número.
     */
    Optional<Usuario> findByWhatsapp(String whatsapp);

    /**
     * 🔍 VALIDAÇÃO CPF: Busca para verificar duplicidade de CPF.
     */
    Optional<Usuario> findByCpf(String cpf);

    /**
     * ⚡ PERFORMANCE: Verifica se existe sem trazer o objeto inteiro do banco.
     */
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByWhatsapp(String whatsapp);
    boolean existsByCpf(String cpf);

    /**
     * 🔐 SEGURANÇA SaaS: Lista apenas os funcionários da loja logada.
     */
    List<Usuario> findByEmpresaId(Long empresaId);

    /**
     * 🔐 SEGURANÇA SaaS: Busca quem aguarda aprovação APENAS na sua empresa.
     */
    List<Usuario> findByEmpresaIdAndAprovadoFalse(Long empresaId);

    /**
     * 3. ÚTIL: Busca todos os aprovados de uma empresa específica.
     */
    List<Usuario> findByEmpresaIdAndAprovadoTrue(Long empresaId);

    /**
     * Busca global de usuários não aprovados.
     */
    List<Usuario> findByAprovadoFalse();
}