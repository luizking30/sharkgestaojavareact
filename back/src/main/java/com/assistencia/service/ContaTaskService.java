package com.assistencia.service;

import com.assistencia.model.Conta;
import com.assistencia.repository.ContaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ContaTaskService {

    @Autowired
    private ContaRepository contaRepository;

    /**
     * Roda todo dia 1º de cada mês, à 00:01.
     * Clona contas recorrentes do mês passado para o mês atual (por empresa).
     */
    @Scheduled(cron = "0 1 0 1 * ?")
    public void processarContasRecorrentes() {
        LocalDate hoje = LocalDate.now();
        LocalDate mesPassado = hoje.minusMonths(1);
        LocalDate inicioMesPassado = mesPassado.withDayOfMonth(1);
        LocalDate fimMesPassado = mesPassado.withDayOfMonth(mesPassado.lengthOfMonth());

        LocalDate inicioMesAtual = hoje.withDayOfMonth(1);
        LocalDate fimMesAtual = hoje.withDayOfMonth(hoje.lengthOfMonth());

        List<Conta> candidatas = contaRepository.findByRecorrenteIsTrueAndDataVencimentoBetween(
                inicioMesPassado, fimMesPassado);

        for (Conta antiga : candidatas) {
            if (antiga.getEmpresa() == null) {
                continue;
            }
            Long empresaId = antiga.getEmpresa().getId();
            boolean jaExiste = contaRepository.existsByEmpresaIdAndDescricaoIgnoreCaseAndDataVencimentoBetween(
                    empresaId,
                    antiga.getDescricao(),
                    inicioMesAtual,
                    fimMesAtual
            );
            if (jaExiste) {
                continue;
            }

            Conta nova = new Conta();
            nova.setEmpresa(antiga.getEmpresa());
            nova.setDescricao(antiga.getDescricao());
            nova.setValor(antiga.getValor());
            nova.setRecorrente(true);
            nova.setPaga(false);

            int diaOriginal = antiga.getDataVencimento().getDayOfMonth();
            int ultimoDiaDesteMes = hoje.lengthOfMonth();
            nova.setDataVencimento(hoje.withDayOfMonth(Math.min(diaOriginal, ultimoDiaDesteMes)));

            contaRepository.save(nova);
        }
    }
}
