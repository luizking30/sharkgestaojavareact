package com.assistencia.repository;

import com.assistencia.model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    /**
     * ✅ SOLUÇÃO DO ERRO: Busca empresas onde o campo 'ativo' é true.
     * O Spring Data JPA gera o SQL automaticamente: SELECT * FROM empresas WHERE ativo = true
     */
    List<Empresa> findByAtivoTrue();

    /**
     * Busca uma empresa pelo CNPJ.
     * Útil para evitar cadastros duplicados na Shark Eletrônicos.
     */
    Optional<Empresa> findByCnpj(String cnpj);

    /**
     * Busca empresas que estão com o acesso ATIVO (dias_restantes > 0).
     */
    List<Empresa> findByDiasRestantesGreaterThan(Integer dias);

    /**
     * ⚠️ ALERTA DE VENCIMENTO:
     * Busca empresas que possuem entre 1 e 5 dias de acesso restantes.
     */
    List<Empresa> findByDiasRestantesBetween(Integer min, Integer max);

    /**
     * Busca empresas pelo nome (Busca parcial/Like).
     */
    List<Empresa> findByNomeContainingIgnoreCase(String nome);

    /**
     * 🔍 CONSULTA LEVE DE SALDO:
     * Retorna apenas o número de dias restantes de uma empresa específica.
     */
    @Query("SELECT e.diasRestantes FROM Empresa e WHERE e.id = :id")
    Integer findDiasRestantesById(@Param("id") Long id);

    /**
     * 🚀 VERIFICAÇÃO DE STATUS (Utilizado pelo seu novo Controller):
     * Retorna true se a empresa tiver mais dias do que o valor passado.
     */
    @Query("SELECT CASE WHEN e.diasRestantes > :diasAnteriores THEN true ELSE false END " +
            "FROM Empresa e WHERE e.id = :id")
    boolean existsByDiasRestantesAumentou(@Param("id") Long id, @Param("diasAnteriores") Integer diasAnteriores);

    /**
     * Lista todas as empresas ordenadas pelas que possuem menos dias de acesso.
     */
    List<Empresa> findAllByOrderByDiasRestantesAsc();
}