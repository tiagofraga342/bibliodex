# Bibliodex - Frontend

Esta é a aplicação frontend para o sistema Bibliodex, desenvolvida com Next.js, React, TypeScript e Tailwind CSS.

## Funcionalidades Implementadas

*   **Autenticação:**
    *   Página de Login.
    *   Proteção de rotas baseada em papéis (usuário cliente, funcionário).
*   **Usuários Clientes:**
    *   Visualização de "Meus Empréstimos".
    *   Visualização e cancelamento de "Minhas Reservas".
    *   Visualização de catálogo de livros.
*   **Funcionários:**
    *   Gerenciamento completo de Livros (CRUD).
    *   Gerenciamento de Categorias e Autores (visualização básica, criação via gestão de livros).
    *   Gerenciamento de Exemplares (CRUD).
    *   Gerenciamento de Usuários (CRUD).
    *   Gerenciamento de Funcionários (CRUD).
    *   Gestão de Empréstimos (visualização, registro de devolução).
    *   Gestão de Reservas (visualização, criação, cancelamento).
    *   Registro de Devoluções.
    *   Página de Administração (placeholder).
    *   Página de Relatórios (placeholder).

## Variáveis de Ambiente

*   `NEXT_PUBLIC_API_BASE_URL`: URL base da API backend. No ambiente Docker Compose, esta variável é configurada no `Dockerfile` para `http://backend:8000`. Para desenvolvimento local fora do Docker, você pode criar um arquivo `.env.local` na raiz do frontend com:
    ```env
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
    ```

## Como Executar (via Docker Compose)

As instruções para executar o frontend como parte do sistema completo estão no [README principal do projeto](../README.md).

## Desenvolvimento Local (Fora do Docker)

1.  **Navegue até o diretório do frontend:**
    ```bash
    cd frontend
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```
3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env.local` na raiz da pasta `frontend/` e adicione:
    ```
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 
    ```
    (Ajuste a URL se o backend estiver rodando em uma porta diferente localmente).

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
    A aplicação estará disponível em `http://localhost:3000` (ou outra porta, se configurada).

## Scripts Disponíveis

*   `dev`: Inicia o servidor de desenvolvimento.
*   `build`: Compila a aplicação para produção.
*   `start`: Inicia um servidor de produção após o `build`.
*   `lint`: Executa o linter.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
