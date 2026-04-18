-- Desenvolvimento: recria o banco do zero (mais simples que TRUNCATE em várias tabelas).
-- Uso: mysql -uroot -p < dev-drop-create-database.sql
-- Depois suba o back (Spring recria tabelas com spring.jpa.hibernate.ddl-auto=update).

DROP DATABASE IF EXISTS shark;
CREATE DATABASE shark CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
