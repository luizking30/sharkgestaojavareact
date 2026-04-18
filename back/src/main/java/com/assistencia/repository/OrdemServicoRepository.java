package com.assistencia.repository;

import com.assistencia.model.OrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    // 🔥 RESOLVE O ERRO: Adicionado IgnoreCase para bater com a chamada do GanhosController
    List<OrdemServico> findByEmpresaIdAndStatusAndFuncionarioProntoIgnoreCaseAndDataProntoAfter(
            Long empresaId,
            String status,
            String funcionarioPronto,
            LocalDateTime dataPronto
    );

    // --- 🔐 SEGURANÇA SAAS: LISTAGEM POR LOJA ---
    List<OrdemServico> findByEmpresaIdOrderByIdDesc(Long empresaId);

    @EntityGraph(attributePaths = {"tecnico"})
    Page<OrdemServico> findByEmpresaIdOrderByIdDesc(Long empresaId, Pageable pageable);

    @EntityGraph(attributePaths = {"tecnico"})
    @Query("SELECT os FROM OrdemServico os WHERE os.empresa.id = :eid "
            + "AND (:id IS NULL OR os.id = :id) "
            + "AND (:nome IS NULL OR :nome = '' OR LOWER(os.clienteNome) LIKE LOWER(CONCAT('%', :nome, '%'))) "
            + "AND (:status IS NULL OR :status = '' OR os.status = :status) "
            + "AND (:d0 IS NULL OR os.data >= :d0) "
            + "AND (:d1 IS NULL OR os.data < :d1)")
    Page<OrdemServico> findByEmpresaFiltrado(
            @Param("eid") Long empresaId,
            @Param("id") Long id,
            @Param("nome") String nome,
            @Param("status") String status,
            @Param("d0") LocalDateTime d0,
            @Param("d1") LocalDateTime d1,
            Pageable pageable);

    @Query("SELECT os FROM OrdemServico os WHERE os.empresa.id = :empresaId AND (" +
            "LOWER(CONCAT(os.id, '')) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(os.clienteNome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "os.clienteWhatsapp LIKE CONCAT('%', :termo, '%') OR " +
            "LOWER(os.produto) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(os.status) LIKE LOWER(CONCAT('%', :termo, '%'))) " +
            "ORDER BY os.id DESC")
    List<OrdemServico> buscarSugestoesSugestivas(@Param("termo") String termo, @Param("empresaId") Long empresaId);

    // --- 🚀 MÉTODOS PARA O DASHBOARD (CONTROLE DE FLUXO E MÉTRICAS) ---
    long countByEmpresaIdAndDataBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);

    long countByEmpresaIdAndStatusAndDataEntregaBetween(Long empresaId, String status, LocalDateTime inicio, LocalDateTime fim);

    @Query("SELECT COALESCE(SUM(os.valorTotal), 0.0) FROM OrdemServico os " +
            "WHERE os.empresa.id = :empresaId " +
            "AND LOWER(os.status) = LOWER(:status) " +
            "AND os.dataEntrega BETWEEN :inicio AND :fim")
    Double somarValorBrutoOsEntregues(@Param("empresaId") Long empresaId,
                                      @Param("status") String status,
                                      @Param("inicio") LocalDateTime inicio,
                                      @Param("fim") LocalDateTime fim);

    @Query("SELECT COALESCE(SUM(os.custoPeca), 0.0) FROM OrdemServico os " +
            "WHERE os.empresa.id = :empresaId " +
            "AND LOWER(os.status) = LOWER(:status) " +
            "AND os.dataEntrega BETWEEN :inicio AND :fim")
    Double somarCustoPecasOsEntregues(@Param("empresaId") Long empresaId,
                                      @Param("status") String status,
                                      @Param("inicio") LocalDateTime inicio,
                                      @Param("fim") LocalDateTime fim);

    // --- 🛠️ MÉTODOS PARA COMISSÃO E PAGAMENTO (ISOLAMENTO POR TÉCNICO E LOJA) ---
    List<OrdemServico> findByEmpresaIdAndTecnicoIdAndPagoFalse(Long empresaId, Long tecnicoId);

    @Query("SELECT COALESCE(SUM(os.valorTotal), 0.0) FROM OrdemServico os " +
            "WHERE os.empresa.id = :empresaId AND os.tecnico.id = :tecnicoId AND os.pago = false")
    Double somarTotalOsPendentesPorTecnico(@Param("empresaId") Long empresaId, @Param("tecnicoId") Long tecnicoId);

    // --- MÉTODOS DE BUSCA PARA LISTAGEM E RELATÓRIOS ---
    List<OrdemServico> findByEmpresaIdAndStatusAndDataEntregaBetween(Long empresaId, String status, LocalDateTime inicio, LocalDateTime fim);

    List<OrdemServico> findByEmpresaIdAndStatusOrderByIdDesc(Long empresaId, String status);

    List<OrdemServico> findByEmpresaIdAndClienteNomeContainingIgnoreCaseOrderByIdDesc(Long empresaId, String nome);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE OrdemServico os SET os.tecnico = null WHERE os.tecnico.id = :uid")
    void clearTecnicoByUsuarioId(@Param("uid") Long uid);
}