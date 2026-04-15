package com.assistencia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling; // 🚀 IMPORT NECESSÁRIO

@SpringBootApplication
@EnableScheduling // 🦈 ATIVA O AGENDAMENTO DE TAREFAS (RECORRÊNCIA)
public class AssistenciaApplication {

    public static void main(String[] args) {
        SpringApplication.run(AssistenciaApplication.class, args);
    }
}