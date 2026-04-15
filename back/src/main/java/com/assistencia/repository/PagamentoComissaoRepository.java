package com.assistencia.repository;

import com.assistencia.model.PagamentoComissao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PagamentoComissaoRepository extends JpaRepository<PagamentoComissao, Long> {

    /**
     * 🔐 SEGURANÇA SaaS: Busca pagamentos de uma empresa específica com ordenação.
     * Essencial para garantir que uma assistência não veja os pagamentos de outra.
     */
    List<PagamentoComissao> findByEmpresaIdOrderByDataHoraDesc(Long empresaId);

    /**
     * Busca todos os pagamentos de um funcionário ordenados pelo mais recente.
     */
    List<PagamentoComissao> findByFuncionarioIdOrderByDataHoraDesc(Long funcionarioId);

    /**
     * Busca o ÚLTIMO pagamento realizado para um funcionário (Geral).
     * Retorna Optional para evitar erros caso o funcionário nunca tenha sido pago.
     */
    Optional<PagamentoComissao> findTopByFuncionarioIdOrderByDataHoraDesc(Long funcionarioId);

    /**
     * 🚀 SOLUÇÃO SaaS: Busca os últimos 50 pagamentos APENAS da empresa logada.
     */
    List<PagamentoComissao> findTop50ByEmpresaIdOrderByDataHoraDesc(Long empresaId);

    /**
     * 🎯 ESSENCIAL PARA DATA DE CORTE:
     * Busca o último pagamento de um tipo específico (OS ou VENDA) para um funcionário.
     */
    Optional<PagamentoComissao> findTopByFuncionarioIdAndTipoComissaoOrderByDataHoraDesc(Long funcionarioId, String tipoComissao);

    /**
     * Busca a lista simples de pagamentos de um funcionário.
     */
    List<PagamentoComissao> findByFuncionarioId(Long funcionarioId);

    /**
     * Soma histórica de pagamentos para um funcionário (Total Geral).
     * O COALESCE garante que retorne 0.0 em vez de null se não houver registros.
     */
    @Query("SELECT COALESCE(SUM(p.valorPago), 0.0) FROM PagamentoComissao p WHERE p.funcionarioId = :id")
    Double somarTotalPagoAoFuncionario(@Param("id") Long id);

    /**
     * Soma pagamentos filtrando por tipo (OS, VENDA ou TOTAL).
     */
    @Query("SELECT COALESCE(SUM(p.valorPago), 0.0) FROM PagamentoComissao p " +
            "WHERE p.funcionarioId = :id AND p.tipoComissao = :tipo")
    Double somarPorFuncionarioETipo(@Param("id") Long id, @Param("tipo") String tipo);

    /**
     * Busca os últimos 10 pagamentos de uma empresa específica.
     */
    List<PagamentoComissao> findTop10ByEmpresaIdOrderByDataHoraDesc(Long empresaId);

    /**
     * MÉTODOS GLOBAIS: Use com cuidado (Geralmente para relatórios de SuperAdmin).
     */
    List<PagamentoComissao> findTop50ByOrderByDataHoraDesc();
}