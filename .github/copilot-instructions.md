
Contexto do Projeto: Atue como um Desenvolvedor Fullstack Sênior e Especialista em UI/UX. Preciso criar uma aplicação web para um escritório de advocacia utilizando Nuxt 3 (Vue.js), Tailwind CSS e SQLite (via libsql) para o banco de dados.

Objetivo: Desenvolver um sistema de gestão de clientes e processos focado em clareza financeira e facilidade de uso.

Requisitos Funcionais (Back-end/Dados):

    Cadastro de Clientes: CRUD completo (Nome, CPF/CNPJ, Contato, Endereço).

    Gestão de Processos: Vincular múltiplos processos a um cliente. Campos: Número do Processo, Tribunal, Descrição e Status.

    Módulo Financeiro: > - Registro de "Valor Cobrado" por processo.

        Registro de "Valor Pago" (Entradas parciais ou totais).

        Histórico de pagamentos com datas e status.

        Métodos de pagamento: Crédito, Débito, PIX, Parcelado pelo Escritório, À Vista.

Diretrizes de UI/UX (Design):

    Estética: Profissional, sóbria e confiável. Use uma paleta de cores "Law & Corporate" (ex: Azul Marinho Profundo, Cinza Chumbo, Branco Gelo e acentos em Dourado ou Verde Esmeralda para sucessos financeiros).

    Dashboard: Uma visão inicial com métricas rápidas (Total a receber no mês, processos ativos, pagamentos pendentes).

    Usabilidade: Listas com filtros inteligentes, busca rápida por número de processo ou nome do cliente e modais intuitivos para novos lançamentos financeiros.

    Feedback: Estados de loading, toasts de confirmação e tratamento de erros claro.

    Responsividade: A interface deve ser acessível em dispositivos móveis e desktop.

    Nunca utilize funções como alert() ou prompt(), prefira toasts e modais.

    Sempre que possível, use componentes reutilizáveis.

    sempre me pergunte se deve utilizar um select ou criar um modal com opções de busca e paginação para selecionar um item.

Instruções Técnicas:

    Utilize Lucide-Vue-Next para ícones.

    Utilize Tailwind CSS para estilização.

    Estruture o SQLite de forma relacional: clientes 1 -> N processos 1 -> N pagamentos.

    Crie Server API Routes no Nuxt (diretório /server) para lidar com as operações de banco de dados.

    quando fizer alguma alteração no banco de dados, crie uma migration (arquivo .sql) para que eu possa aplicar as alterações no banco de dados em produção, além disso, sempre crie índices para as colunas a medida que forem criadas, se achar necessário.

    Testes:
    crie testes a medida que for adicionando funcionalidades, utilize o vitest para isso.
    execute os testes, (npm test) sempre que achar necessário.