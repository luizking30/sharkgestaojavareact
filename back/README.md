# 🛠️ Sistema de Gestão de Assistência Técnica & Vendas (Full-Stack)

[![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=spring-security&logoColor=white)](https://spring.io/projects/spring-security)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

## 📖 Sobre o Projeto
Este é um ecossistema completo para gestão empresarial, desenvolvido originalmente para a **Shark Eletrônicos**. O sistema resolve problemas reais de faturamento, controle de estoque e fluxo de ordens de serviço, unindo a robustez do ecossistema Java com uma interface responsiva.

## 🏗️ Arquitetura do Sistema (Backend)

O projeto segue os padrões da arquitetura **MVC** e **Clean Code**, organizado nos seguintes pacotes:

* **`model`**: Entidades JPA que representam o negócio (Clientes, Vendas, OS, Estoque).
* **`repository`**: Interfaces que utilizam **Spring Data JPA** para persistência e consultas ao MySQL.
* **`controller`**: Camada que gerencia as requisições HTTP e a lógica de navegação.
* **`service`**: Camada de regras de negócio, garantindo a separação de responsabilidades.
* **`security`**: Implementação de autenticação e autorização (Login/Logout), protegendo rotas administrativas.
* **`config`**: Configurações de ambiente, Beans e segurança da aplicação.
  
## 🔐 Segurança e Autenticação
O sistema conta com uma camada robusta de segurança utilizando Spring Security, focada em proteção de dados e controle de acesso:

Criptografia de Senhas: Utilização do algoritmo BCrypt com Salting aleatório. As senhas nunca são armazenadas em texto plano no MySQL, garantindo que, mesmo em caso de vazamento do banco, os dados permaneçam ilegíveis.

Controle de Acesso (RBAC): Diferenciação de permissões entre ADMIN (acesso total e gestão de funcionários) e FUNCIONARIO (operação do dia a dia).

Fila de Aprovação: Novos cadastros iniciam com o status aprovado = 0 (Falso). O acesso ao sistema só é liberado após a ativação manual, impedindo acessos não autorizados por usuários externos.
## 🖥️ Módulos da Interface (Frontend)

Desenvolvido com **Thymeleaf** e **Bootstrap**, o sistema conta com as seguintes telas:

* 📊 **Dashboard**: Visão geral de indicadores e métricas da loja.
* 👥 **Clientes**: Cadastro, edição e consulta de base de clientes.
* 🛠️ **Ordens de Serviço**: Fluxo completo de manutenção, do recebimento à entrega.
* 💰 **Vendas**: Módulo para venda direta de acessórios e produtos.
* 📦 **Estoque**: Gerenciamento de peças e produtos com baixa automatizada.
* 📈 **Relatórios**: Geração de dados para tomada de decisão financeira.
* 🔐 **Login/Layout**: Sistema de acesso restrito e estrutura visual padronizada.

## 🛠️ Tecnologias Utilizadas
* **Back-end:** Java 17, Spring Boot 3, Spring Security, Spring Data JPA.
* **Banco de Dados:** MySQL (Relacional).
* **Front-end:** HTML5, CSS3, JavaScript, Thymeleaf, Bootstrap 5.
* **Gerenciamento:** Maven, Git/GitHub.

## 💻 Como Rodar
1.  Configure o banco de dados no `application.properties`.
2.  Execute `mvn clean install`.
3.  Inicie com `mvn spring-boot:run`.
4.  Acesse `localhost:8080`.
5.  crie seu login.
6.  Ativação Manual: Como o sistema inicia com usuários bloqueados, acesse seu terminal MySQL ou Workbench e rode:
UPDATE usuarios SET aprovado = 1, role = 'ROLE_ADMIN' WHERE username = 'NomeDoUsuario';
7.  - Login: Agora você pode acessar o sistema com todas as funções liberadas.

---
## 👨‍💻 Luiz Eduardo Mendonça Amorim
**Estudante de Sistemas de Informação (4º Semestre)**
10 anos de experiência técnica em eletrônicos | Desenvolvedor Full-Stack em formação.

📱 (61) 9 8104-8509 | 📍 Taguatinga, DF
