-- Fundador SaaS: garantir ROLE_OWNER no usuário id 1 (ajuste o id se necessário).
-- Execute no MySQL do ambiente (shark / compose).

UPDATE usuarios SET role = 'ROLE_OWNER' WHERE id = 1;
