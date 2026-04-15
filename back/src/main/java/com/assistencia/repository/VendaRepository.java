package com.assistencia.repository;

import com.assistencia.model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VendaRepository extends JpaRepository<Venda, Long> {

    List<Venda> findByEmpresaIdOrderByDataHoraDesc(Long empresaId);

    // --- 🚀 DASHBOARD ---
    long countByEmpresaIdAndDataHoraBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);

    @Query("SELECT COALESCE(SUM(v.valorTotal), 0.0) FROM Venda v WHERE v.empresa.id = :empresaId AND v.dataHora BETWEEN :inicio AND :fim")
    Double somarVendasDoDia(@Param("empresaId") Long empresaId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT COALESCE(SUM(v.custoTotalEstoque), 0.0) FROM Venda v WHERE v.empresa.id = :empresaId AND v.dataHora BETWEEN :inicio AND :fim")
    Double somarCustoEstoqueDasVendasDoDia(@Param("empresaId") Long empresaId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    // --- 🛠️ FILTROS E BUSCAS ---

    // Busca básica por período
    List<Venda> findByEmpresaIdAndDataHoraBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);

    // 🎯 SOLUÇÃO DO SEU ERRO DE COMPILAÇÃO:
    // Este é o método que o GanhosController está tentando chamar.
    // O Spring Data JPA vai gerar a busca por ID automaticamente.
    List<Venda> findByEmpresaIdAndVendedorIdAndDataHoraBetween(Long empresaId, Long vendedorId, LocalDateTime inicio, LocalDateTime fim);

    // Sua query personalizada por nome (LOWERCASE)
    @Query("SELECT v FROM Venda v WHERE v.empresa.id = :empresaId " +
            "AND LOWER(v.vendedor.nome) LIKE LOWER(CONCAT('%', :vendedorNome, '%')) " +
            "AND v.dataHora BETWEEN :inicio AND :fim")
    List<Venda> filtrarVendasPorVendedor(
            @Param("empresaId") Long empresaId,
            @Param("vendedorNome") String vendedorNome,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    @Query("SELECT DISTINCT v FROM Venda v JOIN v.itens i WHERE v.empresa.id = :empresaId AND LOWER(i.produto.nome) LIKE LOWER(CONCAT('%', :nome, '%'))")
    List<Venda> findByNomeProduto(@Param("empresaId") Long empresaId, @Param("nome") String nome);

    @Query("SELECT COALESCE(SUM(v.valorTotal), 0.0) FROM Venda v WHERE v.empresa.id = :empresaId AND v.vendedor.id = :vendedorId AND v.pago = false")
    Double somarTotalVendasPendentesPorVendedor(@Param("empresaId") Long empresaId, @Param("vendedorId") Long vendedorId);
}