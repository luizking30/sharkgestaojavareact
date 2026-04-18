package com.assistencia.controller;

import java.util.*;
import java.time.LocalDateTime;
import com.assistencia.model.*;
import com.assistencia.dto.LoginDTO;
import com.assistencia.repository.UsuarioRepository;
import com.assistencia.repository.EmpresaRepository;
import com.assistencia.service.EmailService;
import com.assistencia.service.WhatsappService;
import com.assistencia.util.CpfValidator;
import com.assistencia.util.SecurityUtils;
import com.assistencia.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EmpresaRepository empresaRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;
    @Autowired private WhatsappService whatsappService;
    @Autowired private JwtService jwtService;
    @Autowired private UserDetailsService userDetailsService;
    @Autowired private SecurityUtils securityUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO dados) {
        // 1. 🦈 SHARK SECURITY: Busca o usuário antes de autenticar para checar aprovação
        Usuario user = usuarioRepository.findByUsername(dados.username())
                .orElse(null);

        // Retorno imediato para usuário inexistente: evita a lentidão da primeira tentativa inválida.
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Usuário não encontrado!");
        }

        // Se o usuário existir, verificamos se ele já foi aceito pelo dono da loja
        if (!user.isAprovado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("O proprietário da empresa ainda não aprovou sua conta.");
        }

        UserDetails principal = userDetailsService.loadUserByUsername(dados.username());
        if (dados.password() == null || !passwordEncoder.matches(dados.password(), principal.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Senha incorreta!");
        }

        // 3. Se chegou aqui, o usuário existe e a senha está correta
        String token = jwtService.generateToken(principal);

        return ResponseEntity.ok(montarPayloadSessao(user, token));
    }

    /**
     * Atualiza role/tipo/empresa a partir do banco (evita localStorage desatualizado no front).
     */
    @GetMapping("/me")
    public ResponseEntity<?> sessaoAtual() {
        Usuario user = securityUtils.getUsuarioLogado();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(montarPayloadSessao(user, null));
    }

    private Map<String, Object> montarPayloadSessao(Usuario user, String token) {
        Map<String, Object> response = new HashMap<>();
        if (token != null) {
            response.put("token", token);
        }
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("nome", user.getNome());

        Map<String, Object> empresaMap = new HashMap<>();
        empresaMap.put("id", user.getEmpresa().getId());
        empresaMap.put("nome", user.getEmpresa().getNome());
        empresaMap.put("cnpj", user.getEmpresa().getCnpj());
        empresaMap.put("whatsapp", user.getEmpresa().getWhatsapp());
        empresaMap.put("diasRestantes", user.getEmpresa().getDiasRestantes());
        empresaMap.put("ativo", user.getEmpresa().isAtivo());

        response.put("empresa", empresaMap);

        return response;
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
            usuario.setRole("ROLE_VENDEDOR");
            usuario.setAprovado(false);
            usuario.setEmpresa(emp);

            // 🛡️ Segurança: Funcionários novos nunca são root
            usuario.setRoot(false);

            Usuario salvo = usuarioRepository.save(usuario);

            // 📧 DISPARO DE BOAS-VINDAS PARA FUNCIONÁRIO (Layout Padronizado)
            emailService.enviarBoasVindasFuncionario(
                    salvo.getEmail(),
                    emp.getNome(),
                    salvo.getUsername(),
                    salvo.getCpf(),
                    salvo.getWhatsapp()
            );
            whatsappService.enviarBoasVindasFuncionario(
                    salvo.getWhatsapp(),
                    emp.getNome(),
                    salvo.getUsername(),
                    salvo.getNome(),
                    salvo.getCpf(),
                    salvo.getEmail(),
                    salvo.getWhatsapp()
            );

            return ResponseEntity.ok(salvo);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao registrar: " + e.getMessage());
        }
    }

    @PostMapping("/registro-empresa")
    public ResponseEntity<?> registrarEmpresa(@RequestBody @Valid Usuario usuario,
                                              @RequestParam String nomeEmpresa,
                                              @RequestParam(required = false) String cnpj,
                                              @RequestParam(required = false) String whatsappEmpresa) {
        log.info("Registro de empresa solicitado: nomeEmpresa='{}', email='{}'", nomeEmpresa, usuario.getEmail());

        Map<String, String> erros = validarDados(usuario);

        if (nomeEmpresa == null || nomeEmpresa.isBlank()) {
            erros.put("nomeEmpresa", "Nome da empresa é obrigatório");
        }

        String cnpjLimpo = (cnpj != null && !cnpj.isBlank()) ? cnpj.replaceAll("\\D", "") : null;
        if (cnpjLimpo != null && !cnpjLimpo.isEmpty()) {
            if (cnpjLimpo.length() != 14) {
                erros.put("cnpj", "CNPJ incompleto. Informe os 14 dígitos.");
            }
            if (empresaRepository.findByCnpj(cnpjLimpo).isPresent()) {
                erros.put("cnpj", "Este CNPJ já está cadastrado.");
            }
        }
        String whatsappEmpresaLimpo = (whatsappEmpresa != null && !whatsappEmpresa.isBlank()) ? whatsappEmpresa.replaceAll("\\D", "") : "";
        if (whatsappEmpresaLimpo.length() < 11) {
            erros.put("whatsappEmpresa", "WhatsApp da empresa incompleto. Informe 11 dígitos.");
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
            nova.setWhatsapp(whatsappEmpresaLimpo);
            nova.setAtivo(true);
            nova.setDiasRestantes(7);
            Empresa salva = empresaRepository.save(nova);

            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
            usuario.setRole("ROLE_ADMIN");
            usuario.setAprovado(true);
            usuario.setEmpresa(salva);

            // 🛡️ SHARK SECURITY: O criador da empresa é o Administrador Principal (Root)
            usuario.setRoot(true);

            usuarioRepository.save(usuario);

            try {
                String wppEmpresa = whatsappEmpresaLimpo;
                String wppDono = usuario.getWhatsapp();

                if (whatsappService.numerosWhatsAppIguais(wppEmpresa, wppDono)) {
                    String unico = (wppEmpresa != null && !wppEmpresa.isBlank()) ? wppEmpresa : wppDono;
                    log.info("WhatsApp boas-vindas empresa '{}': mesmo numero empresa/dono ({}), enviando uma vez", nomeEmpresa, unico);
                    whatsappService.enviarBoasVindasEmpresa(
                            unico,
                            salva.getId(),
                            nomeEmpresa,
                            cnpjLimpo,
                            whatsappEmpresaLimpo,
                            usuario.getNome(),
                            usuario.getUsername(),
                            usuario.getEmail(),
                            usuario.getWhatsapp(),
                            usuario.getCpf()
                    );
                } else {
                    if (wppEmpresa != null && !wppEmpresa.isBlank()) {
                        log.info("WhatsApp boas-vindas empresa '{}': enviando para WhatsApp da empresa {}", nomeEmpresa, wppEmpresa);
                        whatsappService.enviarBoasVindasEmpresa(
                                wppEmpresa,
                                salva.getId(),
                                nomeEmpresa,
                                cnpjLimpo,
                                whatsappEmpresaLimpo,
                                usuario.getNome(),
                                usuario.getUsername(),
                                usuario.getEmail(),
                                usuario.getWhatsapp(),
                                usuario.getCpf()
                        );
                    }
                    if (wppDono != null && !wppDono.isBlank()) {
                        log.info("WhatsApp boas-vindas empresa '{}': enviando para WhatsApp do proprietario {}", nomeEmpresa, wppDono);
                        whatsappService.enviarBoasVindasEmpresa(
                                wppDono,
                                salva.getId(),
                                nomeEmpresa,
                                cnpjLimpo,
                                whatsappEmpresaLimpo,
                                usuario.getNome(),
                                usuario.getUsername(),
                                usuario.getEmail(),
                                usuario.getWhatsapp(),
                                usuario.getCpf()
                        );
                    }
                }
                log.info("Disparo(s) de WhatsApp de boas-vindas concluido para empresa '{}'", nomeEmpresa);
            } catch (Exception ex) {
                log.error("Falha ao enviar WhatsApp de boas-vindas da empresa {}: {}", nomeEmpresa, ex.getMessage());
            }

            try {
                emailService.enviarBoasVindasEmpresa(
                        usuario.getEmail(),
                        nomeEmpresa,
                        cnpjLimpo,
                        usuario.getUsername(),
                        usuario.getCpf(),
                        usuario.getWhatsapp()
                );
                log.info("Disparo de e-mail de boas-vindas concluido para empresa '{}'", nomeEmpresa);
            } catch (Exception ex) {
                log.error("Falha ao enviar e-mail de boas-vindas da empresa {} para {}: {}", nomeEmpresa, usuario.getEmail(), ex.getMessage());
            }

            return ResponseEntity.ok(Map.of("status", "sucesso"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("geral", "Erro ao salvar no banco: " + e.getMessage()));
        }
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> esqueciSenha(@RequestParam String identificador) {
        String idLimpo = identificador.replaceAll("[.\\-/() ]", "");

        return usuarioRepository.findByIdentificadorRecuperacao(identificador)
                .or(() -> usuarioRepository.findByIdentificadorRecuperacao(idLimpo))
                .map(user -> {
                    String token = UUID.randomUUID().toString();
                    user.setResetPasswordToken(token);
                    user.setTokenExpiration(LocalDateTime.now().plusHours(1));
                    usuarioRepository.save(user);

                    emailService.enviarEmailRecuperacao(user.getEmail(), token);
                    whatsappService.enviarRecuperacaoSenha(user.getWhatsapp(), token);

                    return ResponseEntity.ok("Instruções de recuperação enviadas para o e-mail: " + user.getEmail());
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