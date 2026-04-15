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
     * 🚀 TAREFA AUTOMÁTICA DA SHARK
     * Roda todo dia 1º de cada mês, à 00:01.
     * Objetivo: Clonar contas recorrentes do mês passado para o mês atual.
     */
    @Scheduled(cron = "0 1 0 1 * ?")
    public void processarContasRecorrentes() {
        LocalDate hoje = LocalDate.now();
        LocalDate mesPassado = hoje.minusMonths(1);

        // Busca todas as contas do banco
        List<Conta> todasContas = contaRepository.findAll();

        for (Conta antiga : todasContas) {
            // Filtra: Tem que ser recorrente e ter vencido no mês passado
            if (antiga.isRecorrente() && antiga.getDataVencimento().getMonth() == mesPassado.getMonth()) {

                // Evita duplicados: Verifica se já existe uma conta com mesma descrição neste mês/ano
                boolean jaExiste = todasContas.stream().anyMatch(c ->
                        c.getDescricao().equalsIgnoreCase(antiga.getDescricao()) &&
                                c.getDataVencimento().getMonth() == hoje.getMonth() &&
                                c.getDataVencimento().getYear() == hoje.getYear()
                );

                if (!jaExiste) {
                    Conta nova = new Conta();
                    nova.setDescricao(antiga.getDescricao());
                    nova.setValor(antiga.getValor());
                    nova.setRecorrente(true);
                    nova.setPaga(false); // Nasce como pendência no novo mês

                    // Mantém o dia do vencimento original (ex: dia 10)
                    int diaOriginal = antiga.getDataVencimento().getDayOfMonth();
                    int ultimoDiaDesteMes = hoje.lengthOfMonth();
                    nova.setDataVencimento(hoje.withDayOfMonth(Math.min(diaOriginal, ultimoDiaDesteMes)));

                    contaRepository.save(nova);
                }
            }
        }
    }
}