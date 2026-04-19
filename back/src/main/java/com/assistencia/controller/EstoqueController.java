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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
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

        Long empresaId = logado.getEmpresa().getId();
        String t = termo != null ? termo.trim() : "";
        if (!t.isEmpty() && t.matches("\\d{3,20}")) {
            Optional<Produto> porCodigo = repo.findByCodigoBarrasAndEmpresaId(t, empresaId);
            if (porCodigo.isPresent()) {
                return ResponseEntity.ok(List.of(ProdutoMapper.toResponse(porCodigo.get())));
            }
        }

        List<Produto> sugestoes = repo.findByNomeContainingIgnoreCaseAndEmpresaId(t, empresaId);
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

    @PostMapping(value = "/upload-imagem", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImagem(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) {
            return ResponseEntity.status(401).build();
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Arquivo vazio.");
        }
        String ct = file.getContentType();
        String ext = extensaoImagem(ct);
        if (ext == null) {
            return ResponseEntity.badRequest().body("Envie uma imagem (JPEG, PNG, WebP ou GIF).");
        }

        long empresaId = logado.getEmpresa().getId();
        String nome = UUID.randomUUID() + ext;
        try {
            Path dir = Paths.get("uploads", "produtos", String.valueOf(empresaId)).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path dest = dir.resolve(nome);
            file.transferTo(dest.toFile());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Falha ao salvar imagem.");
        }

        String path = "/uploads/produtos/" + empresaId + "/" + nome;
        String url = publicBaseUrl(request) + path;
        Map<String, String> body = new HashMap<>();
        body.put("url", url);
        return ResponseEntity.ok(body);
    }

    /** Origem pública (respeita proxy quando configurado). */
    private static String publicBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        StringBuilder sb = new StringBuilder();
        sb.append(scheme).append("://").append(host);
        if (("http".equals(scheme) && port != 80) || ("https".equals(scheme) && port != 443)) {
            sb.append(':').append(port);
        }
        return sb.toString();
    }

    private static String extensaoImagem(String contentType) {
        if (contentType == null) {
            return null;
        }
        String c = contentType.toLowerCase().split(";")[0].trim();
        return switch (c) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> null;
        };
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
