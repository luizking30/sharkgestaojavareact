package com.assistencia.controller;

import com.assistencia.model.Produto;
import com.assistencia.model.Usuario;
import com.assistencia.repository.ProdutoRepository;
import com.assistencia.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/estoque")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class EstoqueController {

    private final ProdutoRepository repo;
    private final SecurityUtils securityUtils;

    @Autowired
    public EstoqueController(ProdutoRepository repo, SecurityUtils securityUtils) {
        this.repo = repo;
        this.securityUtils = securityUtils;
    }

    // 1. Listar (Retorna JSON filtrado por Empresa)
    @GetMapping
    public ResponseEntity<List<Produto>> listar() {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        List<Produto> produtos = repo.findByEmpresaId(logado.getEmpresa().getId());
        return ResponseEntity.ok(produtos);
    }

    // 2. Buscar por ID
    @GetMapping("/buscar/{id}")
    public ResponseEntity<Produto> buscarPorId(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        return repo.findById(id)
                .filter(p -> p.getEmpresa().getId().equals(logado.getEmpresa().getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Buscar por Código de Barras (Usado no PDV e Estoque)
    @GetMapping("/buscar-por-codigo")
    public ResponseEntity<Produto> buscarPorCodigo(@RequestParam String codigo) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        return repo.findByCodigoBarrasAndEmpresaId(codigo, logado.getEmpresa().getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Sugestões para Autocomplete (Resolve o erro 404 nas Vendas)
    @GetMapping("/sugestoes")
    public ResponseEntity<List<Produto>> buscarSugestoes(@RequestParam String termo) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        List<Produto> sugestoes = repo.findByNomeContainingIgnoreCaseAndEmpresaId(termo, logado.getEmpresa().getId());
        return ResponseEntity.ok(sugestoes);
    }

    // 5. Salvar ou Atualizar
    @PostMapping("/salvar")
    public ResponseEntity<?> salvar(@RequestBody Produto produto) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            if (logado == null) return ResponseEntity.status(401).body("Sessão expirada");

            // 🔐 ISOLAMENTO SAAS: Garante o vínculo com a empresa correta
            produto.setEmpresa(logado.getEmpresa());

            // Validação de duplicidade no código de barras dentro da mesma empresa
            if (produto.getCodigoBarras() != null && !produto.getCodigoBarras().isEmpty()) {
                Optional<Produto> existenteCod = repo.findByCodigoBarrasAndEmpresaId(produto.getCodigoBarras(), logado.getEmpresa().getId());
                if (existenteCod.isPresent()) {
                    if (produto.getId() == null || !existenteCod.get().getId().equals(produto.getId())) {
                        return ResponseEntity.badRequest().body("Código de barras já cadastrado nesta loja.");
                    }
                }
            }

            Produto salvo = repo.save(produto);
            return ResponseEntity.ok(salvo);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }

    // 6. Deletar (Padrão Rest)
    @DeleteMapping("/deletar/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        return repo.findById(id)
                .filter(p -> p.getEmpresa().getId().equals(logado.getEmpresa().getId()))
                .map(p -> {
                    repo.delete(p);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.status(403).build());
    }
}