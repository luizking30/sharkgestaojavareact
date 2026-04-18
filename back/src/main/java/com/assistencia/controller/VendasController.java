package com.assistencia.controller;

import com.assistencia.model.*;
import com.assistencia.repository.ProdutoRepository;
import com.assistencia.repository.VendaRepository;
import com.assistencia.util.SecurityUtils;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.kernel.geom.PageSize;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/vendas")
public class VendasController {

    private final VendaRepository vendaRepo;
    private final ProdutoRepository produtoRepo;

    @Autowired
    private SecurityUtils securityUtils;

    public VendasController(VendaRepository vendaRepo, ProdutoRepository produtoRepo) {
        this.vendaRepo = vendaRepo;
        this.produtoRepo = produtoRepo;
    }

    // 1. Listar Vendas da Empresa (paginado; filtros opcionais: id, vendedor = trecho do nome, data = yyyy-MM-dd)
    @GetMapping
    public ResponseEntity<Page<Venda>> listarVendas(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String vendedor,
            @RequestParam(required = false) String data,
            @PageableDefault(size = 15, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();

        Long empresaId = logado.getEmpresa().getId();

        LocalDateTime d0 = null;
        LocalDateTime d1 = null;
        if (data != null && !data.isBlank()) {
            LocalDate dia = LocalDate.parse(data);
            d0 = dia.atStartOfDay();
            d1 = dia.plusDays(1).atStartOfDay();
        }

        Long idFiltro = id;
        String vendF = (vendedor != null && !vendedor.isBlank()) ? vendedor : null;

        boolean temFiltro = idFiltro != null || vendF != null || d0 != null;
        if (!temFiltro) {
            return ResponseEntity.ok(vendaRepo.findByEmpresaIdOrderByDataHoraDesc(empresaId, pageable));
        }

        return ResponseEntity.ok(vendaRepo.findByEmpresaFiltrado(empresaId, idFiltro, vendF, d0, d1, pageable));
    }

    // 2. Filtro dinâmico (Ajustado para o novo método do Repository)
    @GetMapping("/filtrar")
    public ResponseEntity<List<Venda>> filtrarVendas(
            @RequestParam(required = false) String vendedor,
            @RequestParam(required = false) String data,
            @RequestParam(required = false) Long id) {

        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) return ResponseEntity.status(401).build();
        Long empresaId = logado.getEmpresa().getId();

        if (id != null) {
            return ResponseEntity.ok(vendaRepo.findById(id)
                    .filter(v -> v.getEmpresa().getId().equals(empresaId))
                    .map(List::of).orElse(new ArrayList<>()));
        }

        LocalDateTime dataInicio = (data != null && !data.isEmpty())
                ? LocalDate.parse(data).atStartOfDay()
                : LocalDate.now().minusYears(2).atStartOfDay();

        LocalDateTime dataFim = (data != null && !data.isEmpty())
                ? LocalDate.parse(data).atTime(LocalTime.MAX)
                : LocalDateTime.now();

        List<Venda> resultados;
        if (vendedor != null && !vendedor.isEmpty()) {
            // 🎯 CHAMADA CORRIGIDA: Agora batendo com o nome definido no VendaRepository
            resultados = vendaRepo.filtrarVendasPorVendedor(empresaId, vendedor, dataInicio, dataFim);
        } else {
            resultados = vendaRepo.findByEmpresaIdAndDataHoraBetween(empresaId, dataInicio, dataFim);
        }

        return ResponseEntity.ok(resultados);
    }

    // 3. Salvar Venda (Com baixa no estoque e cálculo automático via PrePersist na Model)
    @Transactional
    @PostMapping("/salvar")
    public ResponseEntity<?> salvar(@RequestBody Venda venda) {
        try {
            Usuario vendedorObj = securityUtils.getUsuarioLogado();
            if (vendedorObj == null) return ResponseEntity.status(401).body("Sessão inválida!");

            if (venda.getItens() == null || venda.getItens().isEmpty()) {
                return ResponseEntity.badRequest().body("Carrinho vazio!");
            }

            venda.setEmpresa(vendedorObj.getEmpresa());
            venda.setVendedor(vendedorObj);
            venda.setDataHora(LocalDateTime.now());
            venda.setPago(true);

            for (ItemVenda item : venda.getItens()) {
                Produto prod = produtoRepo.findById(item.getProduto().getId())
                        .orElseThrow(() -> new RuntimeException("Produto não encontrado!"));

                if (prod.getQuantidade() < item.getQuantidade()) {
                    return ResponseEntity.badRequest().body("Estoque insuficiente: " + prod.getNome());
                }

                item.setProduto(prod);
                item.setCustoUnitario(prod.getPrecoCusto() != null ? prod.getPrecoCusto() : 0.0);
                item.setVenda(venda);
                item.setEmpresa(vendedorObj.getEmpresa());

                // Atualiza estoque
                prod.setQuantidade(prod.getQuantidade() - item.getQuantidade());
                produtoRepo.save(prod);
            }

            // O lucro e comissões são calculados automaticamente pela Model Venda antes do save
            return ResponseEntity.ok(vendaRepo.save(venda));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro: " + e.getMessage());
        }
    }

    // 4. PDF do Cupom (Tamanho para impressora térmica)
    @GetMapping("/pdf/{id}")
    public ResponseEntity<byte[]> gerarPdfVenda(@PathVariable Long id) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            Venda v = vendaRepo.findById(id).orElseThrow();

            if (!v.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return ResponseEntity.status(403).build();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, new PageSize(226, 842));
            doc.setMargins(10, 10, 10, 10);

            doc.add(new Paragraph(v.getEmpresa().getNome().toUpperCase()).setBold().setFontSize(10).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("CUPOM DE VENDA").setFontSize(7).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("--------------------------------------------------").setTextAlignment(TextAlignment.CENTER));

            for (ItemVenda item : v.getItens()) {
                doc.add(new Paragraph(item.getQuantidade() + "x " + item.getProduto().getNome() +
                        " - R$ " + String.format("%.2f", item.getPrecoUnitario())).setFontSize(8));
            }

            doc.add(new Paragraph("--------------------------------------------------").setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("TOTAL: R$ " + String.format("%.2f", v.getValorTotal())).setBold().setFontSize(11).setTextAlignment(TextAlignment.RIGHT));
            doc.add(new Paragraph("Vendedor: " + v.getNomeVendedorNoAto()).setFontSize(7));

            doc.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.inline().filename("Cupom_Shark_" + v.getId() + ".pdf").build());
            return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // 5. Deletar (Estorno de Estoque)
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @DeleteMapping("/deletar/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        Venda v = vendaRepo.findById(id).orElse(null);

        if (v != null && v.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
            for (ItemVenda i : v.getItens()) {
                Produto p = i.getProduto();
                if (p != null) {
                    p.setQuantidade(p.getQuantidade() + i.getQuantidade());
                    produtoRepo.save(p);
                }
            }
            vendaRepo.delete(v);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(403).build();
    }
}