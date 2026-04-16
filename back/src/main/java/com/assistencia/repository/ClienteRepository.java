package com.assistencia.repository;

import com.assistencia.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // --- SEGURANÇA SAAS: BUSCA TUDO DE UMA EMPRESA ---
    List<Cliente> findByEmpresaId(Long empresaId);

    Page<Cliente> findByEmpresaId(Long empresaId, Pageable pageable);

    @Query("SELECT c FROM Cliente c WHERE c.empresa.id = :empresaId "
            + "AND (:nome IS NULL OR :nome = '' OR LOWER(c.nome) LIKE LOWER(CONCAT('%', :nome, '%'))) "
            + "AND (:cpf IS NULL OR :cpf = '' OR c.cpf LIKE CONCAT('%', :cpf, '%')) "
            + "AND (:whatsapp IS NULL OR :whatsapp = '' OR c.whatsapp LIKE CONCAT('%', :whatsapp, '%'))")
    Page<Cliente> findByEmpresaIdFiltrado(
            @Param("empresaId") Long empresaId,
            @Param("nome") String nome,
            @Param("cpf") String cpf,
            @Param("whatsapp") String whatsapp,
            Pageable pageable);

    Optional<Cliente> findFirstByWhatsappAndEmpresaId(String whatsapp, Long empresaId);

    // --- VALIDAÇÕES E BUSCAS EXATAS ---

    // Busca CPF dentro da mesma empresa (evita erro se outra loja tiver o mesmo CPF)
    Optional<Cliente> findByCpfAndEmpresaId(String cpf, Long empresaId);

    // Mantido para compatibilidade, mas prefira o de cima
    Optional<Cliente> findByCpf(String cpf);

    // --- BUSCAS DINÂMICAS FILTRADAS POR EMPRESA (RESOLVE O ERRO E O VAZAMENTO) ---

    // Este é o método que o seu Controller pediu e causou o erro:
    List<Cliente> findByNomeContainingIgnoreCaseAndEmpresaId(String nome, Long empresaId);

    // Busca por parte do CPF dentro da empresa
    List<Cliente> findByCpfContainingAndEmpresaId(String cpf, Long empresaId);

    // Busca por parte do WhatsApp dentro da empresa
    List<Cliente> findByWhatsappContainingAndEmpresaId(String whatsapp, Long empresaId);

    // --- CONTADORES PARA O DASHBOARD ---

    // Conta clientes da empresa em um período específico
    long countByEmpresaIdAndDataCadastroBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);
}