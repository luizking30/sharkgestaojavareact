package com.assistencia.controller;

import com.assistencia.model.*;
import com.assistencia.repository.ClienteRepository;
import com.assistencia.repository.OrdemServicoRepository;
import com.assistencia.repository.ProdutoRepository;
import com.assistencia.repository.UsuarioRepository;
import com.assistencia.repository.ContaRepository;
import com.assistencia.util.SecurityUtils; // Recomendo usar aquela classe utilitária que sugeri
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController // MUDOU: Padrão API REST
@RequestMapping("/api/ordens") // MUDOU: Padronizado com /api/
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class OrdemServicoController {

    private final OrdemServicoRepository ordemRepo;
    private final ClienteRepository clienteRepo;
    private final UsuarioRepository usuarioRepo;

    @Autowired
    private SecurityUtils securityUtils; // Injeção da nossa utilidade de segurança

    public OrdemServicoController(OrdemServicoRepository ordemRepo, ClienteRepository clienteRepo, UsuarioRepository usuarioRepo) {
        this.ordemRepo = ordemRepo;
        this.clienteRepo = clienteRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO','OWNER')")
    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String data,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 15, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        Long empresaId = logado.getEmpresa().getId();

        if (busca != null && !busca.isEmpty()) {
            List<OrdemServico> ordens = ordemRepo.buscarSugestoesSugestivas(busca, empresaId);
            if (ordens.size() > 200) {
                ordens = ordens.subList(0, 200);
            }
            return ResponseEntity.ok(ordens);
        }

        LocalDateTime d0 = null;
        LocalDateTime d1 = null;
        if (data != null && !data.isBlank()) {
            LocalDate dia = LocalDate.parse(data);
            d0 = dia.atStartOfDay();
            d1 = dia.plusDays(1).atStartOfDay();
        }

        Long idFiltro = id;
        String nomeF = (nome != null && !nome.isBlank()) ? nome : null;
        String statusF = (status != null && !status.isBlank()) ? status : null;

        return ResponseEntity.ok(ordemRepo.findByEmpresaFiltrado(empresaId, idFiltro, nomeF, statusF, d0, d1, pageable));
    }

    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @PostMapping("/salvar")
    public ResponseEntity<?> salvar(@RequestBody Map<String, Object> payload) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            if (logado == null) return ResponseEntity.status(401).body("Sessão expirada");

            Long clienteId = Long.valueOf(payload.get("clienteId").toString());
            String produto = payload.get("produto").toString();
            String defeito = payload.get("defeito").toString();
            String status = payload.get("status").toString();
            Double valor = Double.valueOf(payload.get("valor").toString());

            Cliente c = clienteRepo.findById(clienteId)
                    .filter(cli -> cli.getEmpresa().getId().equals(logado.getEmpresa().getId()))
                    .orElseThrow(() -> new RuntimeException("Cliente não encontrado!"));

            OrdemServico os = new OrdemServico();
            os.setEmpresa(logado.getEmpresa());
            os.setClienteNome(c.getNome());
            os.setClienteCpf(c.getCpf());
            os.setClienteWhatsapp(c.getWhatsapp());
            os.setProduto(produto);
            os.setDefeito(defeito);
            os.setStatus(status);
            os.setValorTotal(valor);
            os.setData(LocalDateTime.now());
            os.setTecnico(logado);
            os.setFuncionarioAbertura(logado.getNome());
            os.setCustoPeca(0.0);

            if ("Entregue".equalsIgnoreCase(status)) {
                os.setDataEntrega(LocalDateTime.now());
                os.setFuncionarioEntrega(logado.getNome());
                if (logado.getComissaoOs() != null) {
                    os.setComissaoTecnicoValor(os.getValorTotal() * (logado.getComissaoOs() / 100.0));
                }
            }

            OrdemServico salva = ordemRepo.save(os);
            return ResponseEntity.ok(salva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao salvar: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @PutMapping("/editar-status/{id}") // MUDOU: Usando PUT para atualização
    public ResponseEntity<?> editarStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            OrdemServico os = ordemRepo.findById(id).orElseThrow();

            String status = payload.get("status").toString();
            Double custoPeca = Double.valueOf(payload.get("custoPeca").toString());

            if (!os.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return ResponseEntity.status(403).body("Acesso negado.");
            }

            if ("Entregue".equalsIgnoreCase(os.getStatus())) {
                return ResponseEntity.badRequest().body("O.S. já finalizada!");
            }

            os.setStatus(status);
            if ("Em andamento".equalsIgnoreCase(status)) {
                os.setFuncionarioAndamento(logado.getNome());
                os.setDataAndamento(LocalDateTime.now());
            }

            if ("Entregue".equalsIgnoreCase(status)) {
                os.setDataEntrega(LocalDateTime.now());
                os.setCustoPeca(custoPeca);
                os.setFuncionarioEntrega(logado.getNome());
                os.setTecnico(logado);

                double total = os.getValorTotal() != null ? os.getValorTotal() : 0.0;
                double liquido = total - custoPeca;
                if (logado.getComissaoOs() != null) {
                    os.setComissaoTecnicoValor(liquido * (logado.getComissaoOs() / 100.0));
                }
            }

            ordemRepo.save(os);
            return ResponseEntity.ok(Map.of("success", true, "novoStatus", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/deletar/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        return ordemRepo.findById(id)
                .filter(os -> os.getEmpresa().getId().equals(logado.getEmpresa().getId()))
                .map(os -> {
                    ordemRepo.delete(os);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.status(403).build());
    }

    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @GetMapping("/pdf/{id}")
    public ResponseEntity<byte[]> gerarPdf(@PathVariable Long id) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            OrdemServico os = ordemRepo.findById(id).orElseThrow();

            if (!os.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            // Tamanho Bobina Termica (80mm)
            Document document = new Document(pdf, new com.itextpdf.kernel.geom.PageSize(226, 842));
            document.setMargins(10, 10, 10, 10);

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yy HH:mm");
            String nomeEmpresa = os.getEmpresa().getNome().toUpperCase();

            document.add(new Paragraph(nomeEmpresa).setBold().setFontSize(14).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Assistência Técnica").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("----------------------------------------").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("ORDEM DE SERVIÇO #" + os.getId()).setBold().setFontSize(11).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Abertura: " + os.getData().format(fmt)).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("----------------------------------------").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("CLIENTE: " + os.getClienteNome()).setFontSize(9));
            document.add(new Paragraph("EQUIPAMENTO: " + os.getProduto()).setFontSize(9));
            document.add(new Paragraph("DEFEITO: " + os.getDefeito()).setFontSize(8).setItalic());
            document.add(new Paragraph("----------------------------------------").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("TOTAL: R$ " + String.format("%.2f", os.getValorTotal())).setBold().setFontSize(12).setTextAlignment(TextAlignment.CENTER));

            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            // "attachment" força o download no React
            headers.setContentDisposition(ContentDisposition.attachment().filename("OS_" + os.getId() + ".pdf").build());
            return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}