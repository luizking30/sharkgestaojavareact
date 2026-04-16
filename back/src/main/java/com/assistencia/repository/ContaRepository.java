package com.assistencia.repository;

import com.assistencia.model.Conta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContaRepository extends JpaRepository<Conta, Long> {

    // 1. 🔐 SEGURANÇA SaaS: Lista todas as contas de uma loja específica
    List<Conta> findByEmpresaIdOrderByDataVencimentoAsc(Long empresaId);

    // 2. Busca específica para o Mês Atual por Empresa (Usado nos Cards do React)
    List<Conta> findByEmpresaIdAndDataVencimentoBetween(Long empresaId, LocalDate inicio, LocalDate fim);

    // 3. Busca apenas o que já foi PAGO por Empresa (Histórico)
    List<Conta> findByEmpresaIdAndPagaTrueOrderByDataVencimentoDesc(Long empresaId);

    // --- 💰 QUERIES DE SOMA SaaS (Filtradas por Empresa) ---

    @Query("SELECT COALESCE(SUM(c.valor), 0.0) FROM Conta c WHERE c.empresa.id = :empresaId AND c.paga = true")
    Double somarTotalPagoPorEmpresa(@Param("empresaId") Long empresaId);

    @Query("SELECT COALESCE(SUM(c.valor), 0.0) FROM Conta c " +
            "WHERE c.empresa.id = :empresaId AND c.paga = false " +
            "AND c.dataVencimento BETWEEN :inicio AND :fim")
    Double somarPendenteDoMesPorEmpresa(@Param("empresaId") Long empresaId,
                                        @Param("inicio") LocalDate inicio,
                                        @Param("fim") LocalDate fim);

    @Query("SELECT COALESCE(SUM(c.valor), 0.0) FROM Conta c " +
            "WHERE c.empresa.id = :empresaId AND c.paga = false " +
            "AND c.dataVencimento < :hoje")
    Double somarTotalVencidoPorEmpresa(@Param("empresaId") Long empresaId,
                                       @Param("hoje") LocalDate hoje);

    // --- MÉTODOS DE COMPATIBILIDADE ---
    // Dica: Tente evitar usar este método em produção para não misturar dados de empresas diferentes
    List<Conta> findAllByOrderByDataVencimentoAsc();

    List<Conta> findByRecorrenteIsTrueAndDataVencimentoBetween(LocalDate inicio, LocalDate fim);

    boolean existsByEmpresaIdAndDescricaoIgnoreCaseAndDataVencimentoBetween(
            Long empresaId, String descricao, LocalDate inicio, LocalDate fim);
}