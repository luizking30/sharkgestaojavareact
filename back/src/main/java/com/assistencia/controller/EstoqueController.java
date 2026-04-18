package com.assistencia.controller;

import com.assistencia.dto.ProdutoRequestDTO;
import com.assistencia.dto.ProdutoResponseDTO;
import com.assistencia.dto.mapper.ProdutoMapper;
import com.assistencia.model.Produto;
import com.assistencia.model.Usuario;
import com.assistencia.repository.ProdutoRepository;
import com.assistencia.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private final ProdutoRepository repo;
    private final SecurityUtils securityUtils;

    @Autowired
    public EstoqueController(ProdutoRepository repo, SecurityUtils securityUtils) {
        this.repo = repo;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<Page<ProdutoResponseDTO>> listar(@PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        Page<Produto> page = repo.findByEmpresaId(logado.getEmpresa().getId(), pageable);
        return ResponseEntity.ok(page.map(ProdutoMapper::toResponse));
    }

    @GetMapping("/resumo-financeiro")
    public ResponseEntity<Map<String, Double>> resumoFinanceiro() {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        Object[] row = repo.somarInvestidoEFaturamento(logado.getEmpresa().getId());
        double investido = row != null && row[0] != null ? ((Number) row[0]).doubleValue() : 0.0;
        double faturamento = row != null && row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;

        Map<String, Double> m = new HashMap<>();
        m.put("investido", investido);
        m.put("faturamento", faturamento);
        m.put("lucro", faturamento - investido);
        return ResponseEntity.ok(m);
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<ProdutoResponseDTO> buscarPorId(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        return repo.findById(id)
                .filter(p -> p.getEmpresa().getId().equals(logado.getEmpresa().getId()))
                .map(ProdutoMapper::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar-por-codigo")
    public ResponseEntity<ProdutoResponseDTO> buscarPorCodigo(@RequestParam String codigo) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        return repo.findByCodigoBarrasAndEmpresaId(codigo, logado.getEmpresa().getId())
                .map(ProdutoMapper::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sugestoes")
    public ResponseEntity<List<ProdutoResponseDTO>> buscarSugestoes(@RequestParam String termo) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        List<Produto> sugestoes = repo.findByNomeContainingIgnoreCaseAndEmpresaId(termo, logado.getEmpresa().getId());
        return ResponseEntity.ok(sugestoes.stream().map(ProdutoMapper::toResponse).collect(Collectors.toList()));
    }

    @PostMapping("/salvar")
    public ResponseEntity<?> salvar(@RequestBody ProdutoRequestDTO dto) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            if (logado == null) return ResponseEntity.status(401).body("Sessão expirada");

            Long pid = ProdutoMapper.parseIdOrNull(dto.getId());
            Produto produto;
            if (pid != null) {
                produto = repo.findById(pid).orElse(null);
                if (produto == null || !produto.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                    return ResponseEntity.status(403).body("Produto inválido.");
                }
            } else {
                produto = new Produto();
            }

            ProdutoMapper.applyRequest(dto, produto);
            produto.setEmpresa(logado.getEmpresa());

            if (produto.getCodigoBarras() != null && !produto.getCodigoBarras().isEmpty()) {
                Optional<Produto> existenteCod = repo.findByCodigoBarrasAndEmpresaId(produto.getCodigoBarras(), logado.getEmpresa().getId());
                if (existenteCod.isPresent()) {
                    if (produto.getId() == null || !existenteCod.get().getId().equals(produto.getId())) {
                        return ResponseEntity.badRequest().body("Código de barras já cadastrado nesta loja.");
                    }
                }
            }

            Produto salvo = repo.save(produto);
            return ResponseEntity.ok(ProdutoMapper.toResponse(salvo));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }

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
