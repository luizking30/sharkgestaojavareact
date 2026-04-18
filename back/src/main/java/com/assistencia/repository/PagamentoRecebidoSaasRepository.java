package com.assistencia.repository;

import com.assistencia.model.PagamentoRecebidoSaas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PagamentoRecebidoSaasRepository extends JpaRepository<PagamentoRecebidoSaas, Long> {

    Optional<PagamentoRecebidoSaas> findByMpPaymentId(Long mpPaymentId);

    void deleteByEmpresaId(Long empresaId);

    List<PagamentoRecebidoSaas> findByDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraDesc(
            LocalDateTime inicio, LocalDateTime fim);

    @Query("SELECT COALESCE(SUM(p.valor), 0.0) FROM PagamentoRecebidoSaas p WHERE p.dataHora >= :i AND p.dataHora < :f")
    Double sumValorEntre(@Param("i") LocalDateTime i, @Param("f") LocalDateTime f);
}
