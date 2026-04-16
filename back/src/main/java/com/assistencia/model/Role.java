package com.assistencia.model;

public enum Role {
    ROLE_OWNER,       // Super usuário do SaaS (Você)
    ROLE_ADMIN,       // Dono da unidade (O criador da empresa)
    ROLE_FUNCIONARIO  // Colaborador padrão (Técnico/Vendedor)
}