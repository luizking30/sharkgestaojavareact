package com.assistencia.repository;

import com.assistencia.model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface VendaRepository extends JpaRepository<Venda, Long> {

    List<Venda> findByEmpresaIdOrderByDataHoraDesc(Long empresaId);

    @EntityGraph(attributePaths = {"vendedor", "itens", "itens.produto"})
    Page<Venda> findByEmpresaIdOrderByDataHoraDesc(Long empresaId, Pageable pageable);

    @EntityGraph(attributePaths = {"vendedor", "itens", "itens.produto"})
    @Query(value = "SELECT DISTINCT v FROM Venda v WHERE v.empresa.id = :empresaId "
            + "AND (:id IS NULL OR v.id = :id) "
            + "AND (:vend IS NULL OR :vend = '' OR LOWER(COALESCE(v.nomeVendedorNoAto, '')) LIKE LOWER(CONCAT('%', :vend, '%'))) "
            + "AND (:d0 IS NULL OR v.dataHora >= :d0) "
            + "AND (:d1 IS NULL OR v.dataHora < :d1)",
            countQuery = "SELECT COUNT(v) FROM Venda v WHERE v.empresa.id = :empresaId "
                    + "AND (:id IS NULL OR v.id = :id) "
                    + "AND (:vend IS NULL OR :vend = '' OR LOWER(COALESCE(v.nomeVendedorNoAto, '')) LIKE LOWER(CONCAT('%', :vend, '%'))) "
                    + "AND (:d0 IS NULL OR v.dataHora >= :d0) "
                    + "AND (:d1 IS NULL OR v.dataHora < :d1)")
    Page<Venda> findByEmpresaFiltrado(
            @Param("empresaId") Long empresaId,
            @Param("id") Long id,
            @Param("vend") String vendedorNome,
            @Param("d0") LocalDateTime d0,
            @Param("d1") LocalDateTime d1,
            Pageable pageable);

    // --- 🚀 DASHBOARD ---
    long countByEmpresaIdAndDataHoraBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);

    @Query("SELECT COALESCE(SUM(v.valorTotal), 0.0) FROM Venda v WHERE v.empresa.id = :empresaId AND v.dataHora BETWEEN :inicio AND :fim")
    Double somarVendasDoDia(@Param("empresaId") Long empresaId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT COALESCE(SUM(v.custoTotalEstoque), 0.0) FROM Venda v WHERE v.empresa.id = :empresaId AND v.dataHora BETWEEN :inicio AND :fim")
    Double somarCustoEstoqueDasVendasDoDia(@Param("empresaId") Long empresaId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    // --- 🛠️ FILTROS E BUSCAS ---

    // Busca básica por período
    List<Venda> findByEmpresaIdAndDataHoraBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);

    // Método solicitado pelo GanhosController para buscar vendas após o último pagamento
    List<Venda> findByEmpresaIdAndVendedorIdAndDataHoraAfter(Long empresaId, Long vendedorId, LocalDateTime dataHora);

    // Busca por intervalo específico entre duas datas
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