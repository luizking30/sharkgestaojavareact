package com.assistencia.controller;

import com.assistencia.model.Empresa;
import com.assistencia.model.Usuario;
import com.assistencia.repository.EmpresaRepository;
import com.assistencia.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/super-admin")
@PreAuthorize("hasRole('OWNER')") // Segurança máxima: apenas o dono do SaaS entra
public class SuperAdminController {

    private final EmpresaRepository empresaRepo;
    private final UsuarioRepository usuarioRepo;

    public SuperAdminController(EmpresaRepository empresaRepo, UsuarioRepository usuarioRepo) {
        this.empresaRepo = empresaRepo;
        this.usuarioRepo = usuarioRepo;
    }

    /**
     * Retorna a visão panorâmica de todas as empresas cadastradas no ecossistema Shark.
     */
    @GetMapping("/empresas/detalhes")
    public ResponseEntity<?> listarEcossistemaCompleto() {
        try {
            List<Empresa> empresas = empresaRepo.findAll();
            List<Map<String, Object>> relatorioGeral = new ArrayList<>();

            for (Empresa emp : empresas) {
                Map<String, Object> dadosEmpresa = new HashMap<>();

                // Busca todos os usuários vinculados a esta empresa específica
                List<Usuario> vinculos = usuarioRepo.findByEmpresaId(emp.getId());

                dadosEmpresa.put("id", emp.getId());
                dadosEmpresa.put("nome", emp.getNome());
                dadosEmpresa.put("cnpj", emp.getCnpj() != null ? emp.getCnpj() : "NÃO INFORMADO");
                dadosEmpresa.put("diasRestantes", emp.getDiasRestantes());

                // Filtra quem são os cabeças (donos) da unidade
                List<String> proprietarios = vinculos.stream()
                        .filter(u -> "PROPRIETARIO".equals(u.getTipoFuncionario()))
                        .map(Usuario::getNome)
                        .collect(Collectors.toList());

                // Lista de nomes de todos os funcionários (incluindo técnicos e vendedores)
                List<String> equipeCompleta = vinculos.stream()
                        .map(u -> u.getNome() + " (" + (u.getTipoFuncionario() != null ? u.getTipoFuncionario() : "COMUM") + ")")
                        .collect(Collectors.toList());

                dadosEmpresa.put("proprietarios", proprietarios);
                dadosEmpresa.put("totalFuncionarios", vinculos.size());
                dadosEmpresa.put("listaEquipe", equipeCompleta);

                // Informação de data de criação se houver no seu model (opcional)
                // dadosEmpresa.put("dataCadastro", emp.getCreatedAt());

                relatorioGeral.add(dadosEmpresa);
            }

            return ResponseEntity.ok(relatorioGeral);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao gerar mapa do ecossistema: " + e.getMessage());
        }
    }

    /**
     * Endpoint utilitário para você adicionar dias de bônus para uma empresa (Suporte/Promoção)
     */
    @PostMapping("/empresas/adicionar-dias/{id}")
    public ResponseEntity<?> adicionarDiasBonus(@PathVariable Long id, @RequestParam("quantidade") int quantidade) {
        return empresaRepo.findById(id).map(emp -> {
            int diasAtuais = emp.getDiasRestantes();
            emp.setDiasRestantes(diasAtuais + quantidade);
            empresaRepo.save(emp);
            return ResponseEntity.ok("Adicionado " + quantidade + " dias para a empresa " + emp.getNome());
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint para bloqueio imediato de uma empresa por má conduta ou fraude
     */
    @PostMapping("/empresas/bloquear/{id}")
    public ResponseEntity<?> bloquearEmpresa(@PathVariable Long id) {
        return empresaRepo.findById(id).map(emp -> {
            emp.setDiasRestantes(0);
            empresaRepo.save(emp);
            return ResponseEntity.ok("Empresa " + emp.getNome() + " foi bloqueada e o acesso expirado.");
        }).orElse(ResponseEntity.notFound().build());
    }
}