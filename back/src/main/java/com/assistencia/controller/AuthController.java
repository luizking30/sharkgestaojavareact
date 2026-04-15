package com.assistencia.controller;

import java.util.*;
import java.time.LocalDateTime;
import com.assistencia.model.*;
import com.assistencia.dto.LoginDTO;
import com.assistencia.repository.UsuarioRepository;
import com.assistencia.repository.EmpresaRepository;
import com.assistencia.service.EmailService;
import com.assistencia.util.CpfValidator;
import com.assistencia.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EmpresaRepository empresaRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;
    @Autowired private JwtService jwtService;
    @Autowired private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO dados) {
        // 1. 🦈 SHARK SECURITY: Busca o usuário antes de autenticar para checar aprovação
        Usuario user = usuarioRepository.findByUsername(dados.username())
                .orElse(null);

        // Se o usuário existir, verificamos se ele já foi aceito pelo dono da loja
        if (user != null && !user.isAprovado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("O proprietário da empresa ainda não aprovou sua conta.");
        }

        // 2. Autenticação Oficial via Spring Security (Valida Senha)
        // Se o usuário for null ou a senha estiver errada, o Spring lança BadCredentialsException
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dados.username(), dados.password())
        );

        // 3. Se chegou aqui, o usuário existe e a senha está correta
        String token = jwtService.generateToken((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());

        // 4. Resposta Definitiva
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("nome", user.getNome());
        response.put("tipoFuncionario", user.getTipoFuncionario());

        Map<String, Object> empresaMap = new HashMap<>();
        empresaMap.put("id", user.getEmpresa().getId());
        empresaMap.put("nome", user.getEmpresa().getNome());
        empresaMap.put("diasRestantes", user.getEmpresa().getDiasRestantes());
        empresaMap.put("ativo", user.getEmpresa().isAtivo());

        response.put("empresa", empresaMap);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/empresas")
    public ResponseEntity<List<Empresa>> listarEmpresasParaRegistro() {
        return ResponseEntity.ok(empresaRepository.findAll());
    }

    @PostMapping("/registro-funcionario")
    public ResponseEntity<?> registrarFuncionario(@RequestBody @Valid Usuario usuario, @RequestParam Long empresaId) {
        Map<String, String> erros = validarDados(usuario);
        if (empresaId == null) erros.put("empresa", "Informação obrigatória");

        if (usuarioRepository.findByUsername(usuario.getUsername()).isPresent()) {
            erros.put("username", "Este login já está sendo usado.");
        }
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            erros.put("email", "Este e-mail já está cadastrado.");
        }
        if (usuarioRepository.findByCpf(usuario.getCpf()).isPresent()) {
            erros.put("cpf", "Este CPF já está cadastrado.");
        }
        if (usuarioRepository.findByWhatsapp(usuario.getWhatsapp()).isPresent()) {
            erros.put("whatsapp", "Este WhatsApp já está cadastrado.");
        }

        if (!erros.isEmpty()) return ResponseEntity.badRequest().body(erros);

        try {
            Empresa emp = empresaRepository.findById(empresaId)
                    .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));

            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
            usuario.setRole("ROLE_FUNCIONARIO");
            usuario.setAprovado(false);
            usuario.setEmpresa(emp);

            return ResponseEntity.ok(usuarioRepository.save(usuario));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao registrar: " + e.getMessage());
        }
    }

    @PostMapping("/registro-empresa")
    public ResponseEntity<?> registrarEmpresa(@RequestBody @Valid Usuario usuario,
                                              @RequestParam String nomeEmpresa,
                                              @RequestParam(required = false) String cnpj) {

        Map<String, String> erros = validarDados(usuario);

        if (nomeEmpresa == null || nomeEmpresa.isBlank()) {
            erros.put("nomeEmpresa", "Nome da empresa é obrigatório");
        }

        String cnpjLimpo = (cnpj != null && !cnpj.isBlank()) ? cnpj.replaceAll("\\D", "") : null;
        if (cnpjLimpo != null && !cnpjLimpo.isEmpty()) {
            if (empresaRepository.findByCnpj(cnpjLimpo).isPresent()) {
                erros.put("cnpj", "Este CNPJ já está cadastrado.");
            }
        }

        if (usuarioRepository.findByUsername(usuario.getUsername()).isPresent()) {
            erros.put("username", "Este login já está sendo usado.");
        }

        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            erros.put("email", "Este e-mail já está cadastrado.");
        }

        if (usuarioRepository.findByWhatsapp(usuario.getWhatsapp()).isPresent()) {
            erros.put("whatsapp", "Este WhatsApp já está cadastrado.");
        }

        if (usuarioRepository.findByCpf(usuario.getCpf()).isPresent()) {
            erros.put("cpf", "Este CPF já está cadastrado.");
        }

        if (!erros.isEmpty()) {
            return ResponseEntity.badRequest().body(erros);
        }

        try {
            Empresa nova = new Empresa();
            nova.setNome(nomeEmpresa);
            nova.setCnpj(cnpjLimpo);
            nova.setAtivo(true);
            nova.setDiasRestantes(7);
            Empresa salva = empresaRepository.save(nova);

            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
            usuario.setRole("ROLE_ADMIN");
            usuario.setTipoFuncionario("PROPRIETARIO");
            usuario.setAprovado(true);
            usuario.setEmpresa(salva);

            usuarioRepository.save(usuario);
            return ResponseEntity.ok(Map.of("status", "sucesso"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("geral", "Erro ao salvar no banco: " + e.getMessage()));
        }
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> esqueciSenha(@RequestParam String identificador) {
        // 1. Limpa o identificador (remove pontos, traços e parênteses)
        // para buscar CPF ou WhatsApp puramente numéricos se necessário
        String idLimpo = identificador.replaceAll("[.\\-/() ]", "");

        // 2. Tenta buscar pelo valor original OU pelo valor limpo
        return usuarioRepository.findByIdentificadorRecuperacao(identificador)
                .or(() -> usuarioRepository.findByIdentificadorRecuperacao(idLimpo))
                .map(user -> {
                    // Gera token de 1 hora
                    String token = UUID.randomUUID().toString();
                    user.setResetPasswordToken(token);
                    user.setTokenExpiration(LocalDateTime.now().plusHours(1));
                    usuarioRepository.save(user);

                    // 📧 O e-mail é enviado para o endereço cadastrado no perfil do usuário
                    emailService.enviarEmailRecuperacao(user.getEmail(), token);

                    return ResponseEntity.ok("Instruções de recuperação enviadas para o e-mail cadastrado.");
                })
                .orElse(ResponseEntity.status(404).body("Nenhum usuário localizado com os dados informados."));
    }

    @PostMapping("/atualizar-senha")
    public ResponseEntity<?> atualizar(@RequestParam String token, @RequestParam String password) {
        return usuarioRepository.findByResetPasswordToken(token)
                .filter(u -> u.getTokenExpiration().isAfter(LocalDateTime.now()))
                .map(u -> {
                    u.setPassword(passwordEncoder.encode(password));
                    u.setResetPasswordToken(null);
                    u.setTokenExpiration(null);
                    usuarioRepository.save(u);
                    return ResponseEntity.ok("Senha atualizada com sucesso!");
                }).orElse(ResponseEntity.badRequest().body("Token inválido ou expirado."));
    }

    private Map<String, String> validarDados(Usuario u) {
        Map<String, String> erros = new HashMap<>();
        if (u.getWhatsapp() == null || u.getWhatsapp().replaceAll("\\D", "").length() < 10)
            erros.put("whatsapp", "WhatsApp inválido");
        if (u.getCpf() == null || !CpfValidator.isValid(u.getCpf()))
            erros.put("cpf", "CPF inválido");
        return erros;
    }
}