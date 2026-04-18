-- Tabela criada automaticamente pelo Hibernate (ddl-auto=update). Use só se precisar criar manualmente.

CREATE TABLE IF NOT EXISTS pagamento_recebido_saas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mp_payment_id BIGINT NOT NULL UNIQUE,
  empresa_id BIGINT NULL,
  empresa_nome VARCHAR(512) NULL,
  valor DOUBLE NOT NULL,
  data_hora DATETIME(6) NOT NULL,
  pagador_nome VARCHAR(512) NULL,
  pagador_email VARCHAR(255) NULL,
  dias_creditados INT NULL,
  status VARCHAR(64) NULL
);
