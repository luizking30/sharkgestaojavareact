package com.assistencia.repository;

import com.assistencia.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    // 1. Busca todos os produtos de uma empresa específica (SaaS)
    List<Produto> findByEmpresaId(Long empresaId);

    // 2. 🔥 RESOLVE O ERRO: Busca por código de barras dentro da loja
    Optional<Produto> findByCodigoBarrasAndEmpresaId(String codigoBarras, Long empresaId);

    // 3. Busca para o Autocomplete (Filtrado por empresa)
    List<Produto> findByNomeContainingIgnoreCaseAndEmpresaId(String nome, Long empresaId);

    // 4. Busca os 10 primeiros (Caso queira usar no PDV da Shark)
    List<Produto> findTop10ByNomeContainingIgnoreCaseAndEmpresaId(String nome, Long empresaId);

    // --- MÉTODOS DE COMPATIBILIDADE (Opcional: migrar para os de cima depois) ---
    List<Produto> findTop10ByNomeContainingIgnoreCase(String nome);
}