package com.assistencia.service;

import com.assistencia.model.Empresa;
import com.assistencia.model.Usuario;
import com.assistencia.model.Venda;
import com.assistencia.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SuperAdminService {

    private final EmpresaRepository empresaRepo;
    private final UsuarioRepository usuarioRepo;
    private final PagamentoComissaoRepository pagamentoRepo;
    private final VendaRepository vendaRepo;
    private final OrdemServicoRepository ordemRepo;
    private final ClienteRepository clienteRepo;
    private final ContaRepository contaRepo;
    private final ProdutoRepository produtoRepo;
    private final PagamentoRecebidoSaasRepository recebidoSaasRepo;

    public SuperAdminService(
            EmpresaRepository empresaRepo,
            UsuarioRepository usuarioRepo,
            PagamentoComissaoRepository pagamentoRepo,
            VendaRepository vendaRepo,
            OrdemServicoRepository ordemRepo,
            ClienteRepository clienteRepo,
            ContaRepository contaRepo,
            ProdutoRepository produtoRepo,
            PagamentoRecebidoSaasRepository recebidoSaasRepo) {
        this.empresaRepo = empresaRepo;
        this.usuarioRepo = usuarioRepo;
        this.pagamentoRepo = pagamentoRepo;
        this.vendaRepo = vendaRepo;
        this.ordemRepo = ordemRepo;
        this.clienteRepo = clienteRepo;
        this.contaRepo = contaRepo;
        this.produtoRepo = produtoRepo;
        this.recebidoSaasRepo = recebidoSaasRepo;
    }

    /**
     * Remove empresa e dados vinculados. Não permite excluir a empresa do usuário fundador (id 1).
     */
    @Transactional
    public void excluirEmpresa(Long empresaId) {
        Usuario fundador = usuarioRepo.findById(1L).orElse(null);
        if (fundador != null && fundador.getEmpresa() != null && fundador.getEmpresa().getId().equals(empresaId)) {
            throw new IllegalStateException("Não é possível excluir a empresa do fundador do sistema (usuário id 1).");
        }

        Empresa emp = empresaRepo.findById(empresaId)
                .orElseThrow(() -> new IllegalArgumentException("Empresa não encontrada."));

        Long eid = emp.getId();

        recebidoSaasRepo.deleteByEmpresaId(eid);
        pagamentoRepo.deleteAll(pagamentoRepo.findByEmpresaIdOrderByDataHoraDesc(eid));

        List<Venda> vendas = vendaRepo.findByEmpresaIdOrderByDataHoraDesc(eid);
        vendaRepo.deleteAll(vendas);

        ordemRepo.deleteAll(ordemRepo.findByEmpresaIdOrderByIdDesc(eid));

        clienteRepo.deleteAll(clienteRepo.findByEmpresaId(eid));

        contaRepo.deleteAll(contaRepo.findByEmpresaIdOrderByDataVencimentoAsc(eid));

        produtoRepo.deleteAll(produtoRepo.findByEmpresaId(eid));

        usuarioRepo.deleteAll(usuarioRepo.findByEmpresaId(eid));

        empresaRepo.delete(emp);
    }

    /**
     * Remove usuário do ecossistema. Não permite excluir o fundador (id 1).
     */
    @Transactional
    public void excluirUsuario(Long usuarioId, Long usuarioLogadoId) {
        if (usuarioId == 1L) {
            throw new IllegalStateException("O usuário fundador (id 1) não pode ser excluído.");
        }
        if (usuarioLogadoId != null && usuarioLogadoId.equals(usuarioId)) {
            throw new IllegalStateException("Você não pode excluir a própria conta por este painel.");
        }

        Usuario alvo = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        long totalNaEmpresa = usuarioRepo.findByEmpresaId(alvo.getEmpresa().getId()).size();
        if (totalNaEmpresa <= 1) {
            throw new IllegalStateException("É o único usuário desta empresa. Exclua a empresa inteira ou cadastre outro usuário antes.");
        }

        ordemRepo.clearTecnicoByUsuarioId(usuarioId);
        vendaRepo.clearVendedorByUsuarioId(usuarioId);

        usuarioRepo.delete(alvo);
    }
}
