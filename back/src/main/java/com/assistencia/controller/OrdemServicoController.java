package com.assistencia.controller;

import com.assistencia.model.Cliente;
import com.assistencia.model.OrdemServico;
import com.assistencia.model.Usuario;
import com.assistencia.dto.OrdemServicoResponseDTO;
import com.assistencia.dto.mapper.OrdemServicoMapper;
import com.assistencia.repository.ClienteRepository;
import com.assistencia.repository.OrdemServicoRepository;
import com.assistencia.service.WhatsappService;
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
public class OrdemServicoController {

    private final OrdemServicoRepository ordemRepo;
    private final ClienteRepository clienteRepo;
    private final WhatsappService whatsappService;

    @Autowired
    private SecurityUtils securityUtils; // Injeção da nossa utilidade de segurança

    public OrdemServicoController(OrdemServicoRepository ordemRepo, ClienteRepository clienteRepo, WhatsappService whatsappService) {
        this.ordemRepo = ordemRepo;
        this.clienteRepo = clienteRepo;
        this.whatsappService = whatsappService;
    }

    private boolean isVendedor(Usuario u) {
        if (u == null || u.getRole() == null) return false;
        return u.getRole().toUpperCase().contains("VENDEDOR");
    }

    private LocalDateTime dataHoraPorStatus(OrdemServico os, String status) {
        if ("Em andamento".equalsIgnoreCase(status)) return os.getDataAndamento();
        if ("Pronto".equalsIgnoreCase(status)) return os.getDataPronto();
        if ("Entregue".equalsIgnoreCase(status)) return os.getDataEntrega();
        return os.getData();
    }

    private String funcionarioPorStatus(OrdemServico os, String status) {
        if ("Em andamento".equalsIgnoreCase(status)) return os.getFuncionarioAndamento();
        if ("Pronto".equalsIgnoreCase(status)) return os.getFuncionarioPronto();
        if ("Entregue".equalsIgnoreCase(status)) return os.getFuncionarioEntrega();
        return os.getFuncionarioAbertura();
    }

    private void notificarClienteStatus(OrdemServico os, String status) {
        if (os.getClienteWhatsapp() == null || os.getClienteWhatsapp().isBlank()) {
            return;
        }
        whatsappService.enviarAtualizacaoOrdemServicoCliente(
                os.getClienteWhatsapp(),
                os.getId(),
                status,
                dataHoraPorStatus(os, status),
                funcionarioPorStatus(os, status)
        );
    }

    private String tituloPdfPorStatus(String status) {
        if ("Em andamento".equalsIgnoreCase(status)) return "COMPROVANTE DE SERVICO EM ANDAMENTO";
        if ("Pronto".equalsIgnoreCase(status)) return "COMPROVANTE DE SERVICO PRONTO";
        if ("Entregue".equalsIgnoreCase(status)) return "COMPROVANTE DE SERVICO ENTREGUE";
        return "COMPROVANTE DE ABERTURA DE ORDEM";
    }

    private String observacaoPdfPorStatus(String status) {
        if ("Em andamento".equalsIgnoreCase(status)) return "Servico em execucao. Aguardando conclusao tecnica.";
        if ("Pronto".equalsIgnoreCase(status)) return "Servico concluido tecnicamente e aguardando retirada.";
        if ("Entregue".equalsIgnoreCase(status)) return "Servico finalizado e equipamento entregue ao cliente.";
        return "Ordem aberta e em analise inicial. Valor pode ser definido no inicio do atendimento.";
    }

    /** Rotulo grande na bobina (ASCII, sem acentos — impressao termica). */
    private String rotuloBannerPdfPorStatus(String status) {
        if ("Em andamento".equalsIgnoreCase(status)) return "EM EXECUCAO";
        if ("Pronto".equalsIgnoreCase(status)) return "PRONTO PARA RETIRADA";
        if ("Entregue".equalsIgnoreCase(status)) return "FINALIZADO";
        return "AGUARDANDO APROVACAO";
    }

    private void pdfLinhaIgual(Document document) {
        document.add(new Paragraph("========================================").setFontSize(7).setTextAlignment(TextAlignment.CENTER));
    }

    private void pdfSecaoTitulo(Document document, String titulo) {
        document.add(new Paragraph(">> " + titulo + " <<").setBold().setFontSize(8).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("----------------------------------------").setFontSize(7).setTextAlignment(TextAlignment.CENTER));
    }

    private void pdfBannerFase(Document document, String rotuloBanner, String tituloComprovante) {
        pdfLinhaIgual(document);
        document.add(new Paragraph(rotuloBanner).setBold().setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        pdfLinhaIgual(document);
        document.add(new Paragraph(tituloComprovante).setBold().setFontSize(9).setTextAlignment(TextAlignment.CENTER));
    }

    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TECNICO','VENDEDOR')")
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
            return ResponseEntity.ok(OrdemServicoMapper.toResponseList(ordens));
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

        Page<OrdemServico> page = ordemRepo.findByEmpresaFiltrado(empresaId, idFiltro, nomeF, statusF, d0, d1, pageable);
        return ResponseEntity.ok(OrdemServicoMapper.toResponsePage(page));
    }

    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TECNICO','VENDEDOR')")
    @PostMapping("/salvar")
    public ResponseEntity<?> salvar(@RequestBody Map<String, Object> payload) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            if (logado == null) return ResponseEntity.status(401).body("Sessão expirada");

            Long clienteId = Long.valueOf(payload.get("clienteId").toString());
            String produto = payload.get("produto").toString();
            String defeito = payload.get("defeito").toString();
            Object valorObj = payload.get("valor");
            Double valor = 0.0;
            if (valorObj != null && !String.valueOf(valorObj).isBlank()) {
                valor = Double.valueOf(valorObj.toString());
            }

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
            os.setValorTotal(valor);
            os.setData(LocalDateTime.now());
            os.setTecnico(logado);
            os.setFuncionarioAbertura(logado.getNome());
            os.setCustoPeca(0.0);
            os.setComissaoTecnicoValor(0.0);

            if (valor != null && valor > 0) {
                os.setStatus("Em andamento");
                os.setFuncionarioAndamento(logado.getNome());
                os.setDataAndamento(LocalDateTime.now());
            } else {
                os.setStatus("Em análise");
            }

            OrdemServico salva = ordemRepo.save(os);
            notificarClienteStatus(salva, salva.getStatus());
            return ResponseEntity.ok(OrdemServicoMapper.toResponse(salva));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao salvar: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TECNICO','VENDEDOR')")
    @PutMapping("/editar-status/{id}") // MUDOU: Usando PUT para atualização
    public ResponseEntity<?> editarStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Usuario logado = securityUtils.getUsuarioLogado();
            OrdemServico os = ordemRepo.findById(id).orElseThrow();

            String status = payload.get("status").toString();
            if (isVendedor(logado) && "Pronto".equalsIgnoreCase(status)) {
                return ResponseEntity.status(403).body("Vendedor não pode marcar O.S. como pronto.");
            }
            if (isVendedor(logado) && "Entregue".equalsIgnoreCase(status)) {
                return ResponseEntity.status(403).body("Vendedor não pode marcar O.S. como entregue.");
            }
            Double custoPeca = 0.0;
            if (payload.get("custoPeca") != null) {
                custoPeca = Double.valueOf(payload.get("custoPeca").toString());
            }
            Double valorInformado = null;
            if (payload.get("valor") != null && !payload.get("valor").toString().isBlank()) {
                valorInformado = Double.valueOf(payload.get("valor").toString());
            }

            if (!os.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return ResponseEntity.status(403).body("Acesso negado.");
            }

            if ("Entregue".equalsIgnoreCase(os.getStatus())) {
                return ResponseEntity.badRequest().body("O.S. já finalizada!");
            }

            os.setStatus(status);
            if ("Em andamento".equalsIgnoreCase(status)) {
                if ((os.getValorTotal() == null || os.getValorTotal() <= 0) && (valorInformado == null || valorInformado <= 0)) {
                    return ResponseEntity.badRequest().body("Informe o valor da O.S. para colocar em andamento.");
                }
                if (valorInformado != null && valorInformado > 0) {
                    os.setValorTotal(valorInformado);
                }
                os.setFuncionarioAndamento(logado.getNome());
                os.setDataAndamento(LocalDateTime.now());
            }

            if ("Pronto".equalsIgnoreCase(status)) {
                os.setDataPronto(LocalDateTime.now());
                os.setFuncionarioPronto(logado.getNome());
                os.setTecnico(logado);
                double total = os.getValorTotal() != null ? os.getValorTotal() : 0.0;
                double liquido = total - custoPeca;
                if (logado.getComissaoOs() != null) {
                    os.setComissaoTecnicoValor(liquido * (logado.getComissaoOs() / 100.0));
                }
            }
            if ("Entregue".equalsIgnoreCase(status)) {
                os.setDataEntrega(LocalDateTime.now());
                os.setCustoPeca(custoPeca);
                os.setFuncionarioEntrega(logado.getNome());
            }

            ordemRepo.save(os);
            notificarClienteStatus(os, status);
            return ResponseEntity.ok(Map.of("success", true, "novoStatus", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
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

    /**
     * Detalhe de uma O.S. (mesma empresa) — comprovante HTML no front.
     */
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TECNICO','VENDEDOR')")
    @GetMapping("/{id}")
    public ResponseEntity<OrdemServicoResponseDTO> obterPorId(@PathVariable Long id) {
        Usuario logado = securityUtils.getUsuarioLogado();
        if (logado == null) {
            return ResponseEntity.status(401).build();
        }
        Long empresaId = logado.getEmpresa().getId();
        return ordemRepo.findById(id)
                .filter(os -> os.getEmpresa().getId().equals(empresaId))
                .map(os -> ResponseEntity.ok(OrdemServicoMapper.toResponse(os)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TECNICO','VENDEDOR')")
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
            String cnpjEmpresa = (os.getEmpresa().getCnpj() == null || os.getEmpresa().getCnpj().isBlank()) ? "Nao informado" : os.getEmpresa().getCnpj();
            String whatsappEmpresa = (os.getEmpresa().getWhatsapp() == null || os.getEmpresa().getWhatsapp().isBlank()) ? "Nao informado" : os.getEmpresa().getWhatsapp();
            String valorTexto = (os.getValorTotal() != null && os.getValorTotal() > 0)
                    ? "R$ " + String.format("%.2f", os.getValorTotal())
                    : "Em analise";
            String dataStatus = dataHoraPorStatus(os, os.getStatus()) != null ? dataHoraPorStatus(os, os.getStatus()).format(fmt) : "--";
            String funcStatus = funcionarioPorStatus(os, os.getStatus()) != null ? funcionarioPorStatus(os, os.getStatus()) : "Nao informado";
            String tituloStatus = tituloPdfPorStatus(os.getStatus());
            String observacaoStatus = observacaoPdfPorStatus(os.getStatus());
            String rotuloBanner = rotuloBannerPdfPorStatus(os.getStatus());
            String aberturaPor = (os.getFuncionarioAbertura() == null || os.getFuncionarioAbertura().isBlank())
                    ? "Nao informado" : os.getFuncionarioAbertura();

            document.add(new Paragraph(nomeEmpresa).setBold().setFontSize(14).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Assistencia Tecnica").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("CNPJ: " + cnpjEmpresa).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("WhatsApp: " + whatsappEmpresa).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Endereco: Nao informado").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("----------------------------------------").setFontSize(8).setTextAlignment(TextAlignment.CENTER));

            pdfBannerFase(document, rotuloBanner, tituloStatus);

            pdfSecaoTitulo(document, "IDENTIFICACAO");
            document.add(new Paragraph("ORDEM DE SERVICO #" + os.getId()).setBold().setFontSize(11).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Aberto em: " + os.getData().format(fmt)).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Aberto por: " + aberturaPor).setFontSize(8).setTextAlignment(TextAlignment.CENTER));

            pdfSecaoTitulo(document, "CLIENTE");
            document.add(new Paragraph("Nome: " + os.getClienteNome()).setFontSize(9));
            document.add(new Paragraph("CPF: " + (os.getClienteCpf() == null ? "Nao informado" : os.getClienteCpf())).setFontSize(8));
            document.add(new Paragraph("WhatsApp: " + (os.getClienteWhatsapp() == null ? "Nao informado" : os.getClienteWhatsapp())).setFontSize(8));

            pdfSecaoTitulo(document, "EQUIPAMENTO E DEFEITO");
            document.add(new Paragraph("Produto: " + os.getProduto()).setFontSize(9));
            document.add(new Paragraph("Defeito: " + os.getDefeito()).setFontSize(8).setItalic());

            pdfSecaoTitulo(document, "LINHA DO TEMPO");
            document.add(new Paragraph("Abertura: " + os.getData().format(fmt) + " | " + aberturaPor).setFontSize(7));
            if (os.getDataAndamento() != null) {
                String fa = (os.getFuncionarioAndamento() == null || os.getFuncionarioAndamento().isBlank()) ? "-" : os.getFuncionarioAndamento();
                document.add(new Paragraph("Em andamento: " + os.getDataAndamento().format(fmt) + " | " + fa).setFontSize(7));
            }
            if (os.getDataPronto() != null) {
                String fp = (os.getFuncionarioPronto() == null || os.getFuncionarioPronto().isBlank()) ? "-" : os.getFuncionarioPronto();
                document.add(new Paragraph("Pronto: " + os.getDataPronto().format(fmt) + " | " + fp).setFontSize(7));
            }
            if (os.getDataEntrega() != null) {
                String fe = (os.getFuncionarioEntrega() == null || os.getFuncionarioEntrega().isBlank()) ? "-" : os.getFuncionarioEntrega();
                document.add(new Paragraph("Entregue: " + os.getDataEntrega().format(fmt) + " | " + fe).setFontSize(7));
            }

            pdfSecaoTitulo(document, "STATUS ATUAL (COMPROVANTE)");
            document.add(new Paragraph(os.getStatus().toUpperCase()).setBold().setFontSize(10).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Data/Hora: " + dataStatus).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Responsavel: " + funcStatus).setFontSize(8).setTextAlignment(TextAlignment.CENTER));

            pdfSecaoTitulo(document, "FINANCEIRO");
            document.add(new Paragraph("Valor O.S.: " + valorTexto).setBold().setFontSize(11).setTextAlignment(TextAlignment.CENTER));
            if ("Entregue".equalsIgnoreCase(os.getStatus()) && os.getCustoPeca() != null && os.getCustoPeca() > 0) {
                double total = os.getValorTotal() != null ? os.getValorTotal() : 0.0;
                double liq = total - os.getCustoPeca();
                document.add(new Paragraph("Pecas: - R$ " + String.format("%.2f", os.getCustoPeca())).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
                document.add(new Paragraph("Liquido: R$ " + String.format("%.2f", liq)).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            }

            pdfLinhaIgual(document);
            document.add(new Paragraph("Obs: " + observacaoStatus).setFontSize(7).setTextAlignment(TextAlignment.CENTER));
            pdfLinhaIgual(document);

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