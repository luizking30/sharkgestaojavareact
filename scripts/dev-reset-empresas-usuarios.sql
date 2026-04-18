-- Ambiente de desenvolvimento: remove todos os dados operacionais e cadastros.
-- Ordem: filhas → usuarios → empresas. Banco: shark (ajuste se necessário).

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE item_venda;
TRUNCATE TABLE venda;
TRUNCATE TABLE ordem_servico;
TRUNCATE TABLE pagamento_comissao;
TRUNCATE TABLE contas_apagar;
TRUNCATE TABLE produto;
TRUNCATE TABLE clientes;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE empresas;

SET FOREIGN_KEY_CHECKS = 1;
