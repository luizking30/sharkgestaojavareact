package com.assistencia.repository;

import com.assistencia.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // --- SEGURANÇA SAAS: BUSCA TUDO DE UMA EMPRESA ---
    List<Cliente> findByEmpresaId(Long empresaId);

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