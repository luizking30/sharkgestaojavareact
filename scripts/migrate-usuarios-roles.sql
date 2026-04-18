-- Migração: cargos antigos (FUNCIONARIO / tipos) → ROLE_VENDEDOR / ROLE_TECNICO / ROLE_ADMIN
-- Execute no MySQL após deploy do back (coluna tipo_funcionario pode ainda existir no BD).

UPDATE usuarios SET role = 'ROLE_VENDEDOR'
WHERE UPPER(COALESCE(role, '')) LIKE '%FUNCIONARIO%';

-- Se ainda existir coluna legada:
-- UPDATE usuarios SET role = 'ROLE_TECNICO' WHERE UPPER(COALESCE(tipo_funcionario, '')) = 'HIBRIDO';
-- UPDATE usuarios SET role = 'ROLE_ADMIN' WHERE UPPER(COALESCE(tipo_funcionario, '')) = 'PROPRIETARIO' AND role NOT LIKE '%OWNER%';
