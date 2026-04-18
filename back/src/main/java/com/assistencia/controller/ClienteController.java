package com.assistencia.controller;

import com.assistencia.dto.ClienteRequestDTO;
import com.assistencia.dto.ClienteResponseDTO;
import com.assistencia.dto.mapper.ClienteMapper;
import com.assistencia.model.Cliente;
import com.assistencia.model.Usuario;
import com.assistencia.repository.ClienteRepository;
import com.assistencia.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteRepository repo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cpf,
            @RequestParam(required = false) String whatsapp,
            @PageableDefault(size = 15, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        Usuario logado = getUsuarioLogado();
        if (logado == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário não autenticado.");
        }

        Long empresaId = logado.getEmpresa().getId();
        String n = (nome != null && !nome.isBlank()) ? nome : null;
        String c = (cpf != null && !cpf.isBlank()) ? cpf : null;
        String w = (whatsapp != null && !whatsapp.isBlank()) ? whatsapp : null;

        Page<Cliente> page = repo.findByEmpresaIdFiltrado(empresaId, n, c, w, pageable);
        return ResponseEntity.ok(page.map(ClienteMapper::toResponse));
    }

    @GetMapping("/checar-duplicata")
    public ResponseEntity<Map<String, Boolean>> checarDuplicata(
            @RequestParam(required = false) String cpf,
            @RequestParam(required = false) String whatsapp,
            @RequestParam(required = false) Long excetoId) {
        Usuario logado = getUsuarioLogado();
        if (logado == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long empresaId = logado.getEmpresa().getId();

        if (cpf != null && !cpf.isBlank()) {
            Optional<Cliente> oc = repo.findByCpfAndEmpresaId(cpf.trim(), empresaId);
            if (oc.isPresent() && (excetoId == null || !oc.get().getId().equals(excetoId))) {
                return ResponseEntity.ok(Map.of("duplicado", true));
            }
        }
        if (whatsapp != null && !whatsapp.isBlank()) {
            Optional<Cliente> ow = repo.findFirstByWhatsappAndEmpresaId(whatsapp.trim(), empresaId);
            if (ow.isPresent() && (excetoId == null || !ow.get().getId().equals(excetoId))) {
                return ResponseEntity.ok(Map.of("duplicado", true));
            }
        }
        return ResponseEntity.ok(Map.of("duplicado", false));
    }

    @PostMapping("/salvar")
    public ResponseEntity<?> salvar(@RequestBody ClienteRequestDTO req) {
        try {
            Usuario logado = getUsuarioLogado();
            if (logado == null || logado.getEmpresa() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sessão expirada ou usuário inválido.");
            }

            Long pid = ClienteMapper.parseIdOrNull(req.getId());
            Cliente c;
            if (pid != null) {
                c = repo.findById(pid).orElse(null);
                if (c == null || !c.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cliente inválido.");
                }
            } else {
                c = new Cliente();
            }

            ClienteMapper.applyRequest(req, c);
            c.setEmpresa(logado.getEmpresa());

            Optional<Cliente> clienteExistente = repo.findByCpfAndEmpresaId(c.getCpf(), logado.getEmpresa().getId());

            if (clienteExistente.isPresent()) {
                Cliente existente = clienteExistente.get();
                if (c.getId() == null || !existente.getId().equals(c.getId())) {
                    return ResponseEntity.badRequest().body("Já existe um cliente com este CPF nesta unidade.");
                }
            }

            Cliente salvo = repo.save(c);
            return ResponseEntity.ok(ClienteMapper.toResponse(salvo));

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body("Erro de integridade: Verifique se os dados já existem.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro interno ao processar a solicitação.");
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TECNICO','VENDEDOR')")
    @DeleteMapping("/deletar/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        try {
            Usuario logado = getUsuarioLogado();
            Optional<Cliente> clienteOpt = repo.findById(id);

            if (clienteOpt.isPresent() && clienteOpt.get().getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                repo.deleteById(id);
                return ResponseEntity.ok().body("Cadastro removido com sucesso.");
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Você não tem permissão para remover este registro.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Este cliente possui históricos (O.S./Vendas) e não pode ser excluído.");
        }
    }

    @GetMapping("/sugestoes")
    public ResponseEntity<List<ClienteResponseDTO>> buscarSugestoes(@RequestParam String termo) {
        Usuario logado = getUsuarioLogado();
        if (logado == null) return ResponseEntity.ok(List.of());

        List<Cliente> clientes = repo.findByNomeContainingIgnoreCaseAndEmpresaId(termo, logado.getEmpresa().getId());

        List<ClienteResponseDTO> sugestoes = clientes.stream()
                .limit(8)
                .map(ClienteMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(sugestoes);
    }

    private Usuario getUsuarioLogado() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String login;
        if (principal instanceof UserDetails) {
            login = ((UserDetails) principal).getUsername();
        } else {
            login = principal.toString();
        }
        return usuarioRepo.findByUsername(login).orElse(null);
    }
}
