package com.assistencia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GraficoNomeValorDTO {
    private String name;
    private double valor;

    public GraficoNomeValorDTO() {}

    public GraficoNomeValorDTO(String name, double valor) {
        this.name = name;
        this.valor = valor;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getValor() { return valor; }
    public void setValor(double valor) { this.valor = valor; }
}
