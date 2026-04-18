-- Preenche data_cadastro dos usuários existentes com a data da empresa (uma vez, após deploy da coluna).
UPDATE usuarios u
INNER JOIN empresas e ON u.empresa_id = e.id
SET u.data_cadastro = COALESCE(u.data_cadastro, e.data_cadastro, NOW())
WHERE u.data_cadastro IS NULL;
