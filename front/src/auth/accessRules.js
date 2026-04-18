/**
 * Regras por NEGAÇÃO: o que cada perfil NÃO pode fazer.
 * Perfis: ROLE_OWNER, ROLE_ADMIN, ROLE_TECNICO, ROLE_VENDEDOR
 *
 * - OWNER: sem restrição
 * - ADMIN: tudo exceto painel geral SaaS (/super-admin)
 * - TECNICO: tudo exceto painel geral, painel empresa, relatórios, contas, estoque
 * - VENDEDOR: igual ao técnico + não pode entregar O.S. (status Entregue)
 */

export function normalizeRole(role) {
  const r = String(role || '').trim().toUpperCase();
  if (r.includes('OWNER')) return 'ROLE_OWNER';
  if (r.includes('ADMIN')) return 'ROLE_ADMIN';
  if (r.includes('TECNICO')) return 'ROLE_TECNICO';
  if (r.includes('VENDEDOR')) return 'ROLE_VENDEDOR';
  /* Legado antes da migração de cargos */
  if (r.includes('FUNCIONARIO')) return 'ROLE_VENDEDOR';
  if (!r) return '';
  return r.startsWith('ROLE_') ? r : `ROLE_${r}`;
}

export function forbidPainelGeral(role) {
  return normalizeRole(role) !== 'ROLE_OWNER';
}

/** Painel empresa: técnico e vendedor não acessam. */
export function forbidPainelEmpresa(role) {
  const r = normalizeRole(role);
  return r === 'ROLE_TECNICO' || r === 'ROLE_VENDEDOR';
}

/** Rotas bloqueadas na UI (negação). */
export function isRouteForbidden(pathname, usuario) {
  const role = normalizeRole(usuario?.role);
  const p = pathname.split('?')[0];

  if (p.startsWith('/super-admin')) {
    return role !== 'ROLE_OWNER';
  }

  if (role === 'ROLE_OWNER') return false;

  if (role === 'ROLE_ADMIN') return false;

  if (role === 'ROLE_TECNICO' || role === 'ROLE_VENDEDOR') {
    if (p.startsWith('/super-admin')) return true;
    if (p === '/admin/empresa' || p.startsWith('/admin/empresa/')) return true;
    if (p === '/relatorios' || p.startsWith('/relatorios')) return true;
    if (p === '/contas' || p.startsWith('/contas/')) return true;
    if (p === '/estoque' || p.startsWith('/estoque/')) return true;
    return false;
  }

  return false;
}

/** Editar/excluir cliente: permitido a todos os perfis operacionais (sem negação). */
export function forbidEdicaoExclusaoCliente(role) {
  void role;
  return false;
}

/** Estoque: técnico e vendedor não gerem. */
export function forbidGestaoEstoque(role) {
  const r = normalizeRole(role);
  return r === 'ROLE_TECNICO' || r === 'ROLE_VENDEDOR';
}

export function podeGerirEstoque(role) {
  return !forbidGestaoEstoque(role);
}

/** Estorno / ações administrativas em vendas */
export function podeEstornoVenda(role) {
  const r = normalizeRole(role);
  return r === 'ROLE_OWNER' || r === 'ROLE_ADMIN';
}

/** Excluir O.S. */
export function forbidExcluirOrdemServico(role) {
  const r = normalizeRole(role);
  return r !== 'ROLE_OWNER' && r !== 'ROLE_ADMIN';
}

/** Vendedor não pode marcar O.S. como Entregue. */
export function forbidEntregarOs(role) {
  return normalizeRole(role) === 'ROLE_VENDEDOR';
}

/** Rótulo curto para exibir no layout (sem ROLE_). */
export function formatRoleLabel(role) {
  const r = normalizeRole(role);
  const map = {
    ROLE_OWNER: 'OWNER',
    ROLE_ADMIN: 'ADMIN',
    ROLE_TECNICO: 'TÉCNICO',
    ROLE_VENDEDOR: 'VENDEDOR',
  };
  return map[r] || String(role || '').replace(/^ROLE_/i, '') || '—';
}
