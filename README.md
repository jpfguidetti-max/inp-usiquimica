# INP — Sistema de Introdução de Novo Produto (Usiquimica)

Este documento foi escrito para uma pessoa **não desenvolvedora**. Ele explica, passo a passo,
o que é este sistema e como colocá-lo no ar.

## O que é este sistema

Este é um sistema web interno para automatizar o processo de **Introdução de Novo Produto (INP)**
da Usiquimica: o fluxo de aprovação com 19 etapas (Fase 1 — Business Case, Fase 2 — Preparação
comercial, Fase 3 — Cadastro), passando por Comercial, Qualidade, Fábrica, Marketing, Laboratório,
Especialista de Produto, Controladoria e Diretoria Comercial, incluindo o Gate 1 (aprovação da
Diretoria) e o fluxo opcional de Solicitação de Cadastro de Amostras (F.CT-0002).

O sistema:
- guarda cada "INP" aberto (uma "Iniciativa"), com todos os formulários e anexos;
- avança automaticamente para a próxima etapa quando a etapa atual é concluída;
- avisa por email quem é o novo responsável a cada mudança de etapa;
- alerta quando uma etapa está parada há muitos dias ou vencida;
- mostra um dashboard gerencial com indicadores e gráficos;
- mantém um histórico/auditoria completo de cada iniciativa.

Ele foi construído para ser hospedado em **Vercel** (o site), **Neon** (o banco de dados
Postgres) e usar **Resend** (envio de emails) e **Vercel Blob** (armazenamento de anexos).
Nenhum desses serviços foi conectado ainda — este repositório é só o código. Os passos abaixo
mostram como colocar tudo no ar.

**Importante:** o sistema funciona perfeitamente mesmo sem o Resend configurado — ele só vai
*registrar* as tentativas de email (em vez de enviar) até você configurar a chave do Resend.
Você pode colocar o sistema no ar primeiro e configurar o email depois, sem pressa.

---

## Passo 1 — Colocar o código no GitHub

1. Crie uma conta em [github.com](https://github.com) (se ainda não tiver).
2. Crie um repositório novo, vazio (sem README, sem .gitignore — este projeto já tem os seus).
3. Neste projeto, rode no terminal (dentro da pasta do projeto):
   ```
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```
   (O repositório já foi inicializado com `git init` e um primeiro commit — você só precisa
   apontar para o seu GitHub e enviar.)

## Passo 2 — Criar o banco de dados (Neon)

1. Crie uma conta em [neon.tech](https://neon.tech).
2. Crie um novo projeto (ex.: "inp-usiquimica"). A região mais próxima do Brasil é recomendada.
3. No painel do Neon, copie a **Connection string** (algo como
   `postgresql://usuario:senha@ep-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require`).
   Guarde essa string — ela é o valor de `DATABASE_URL`.

## Passo 3 — Rodar as migrações e o "seed" (carga inicial de usuários e etapas)

Isso pode ser feito do seu computador (com Node.js instalado) ou depois, via Vercel (Passo 5
explica a opção automática pelo build). Para rodar do seu computador:

1. Baixe o repositório (`git clone ...`) e instale as dependências: `npm install`.
2. Crie um arquivo `.env` na raiz do projeto (copie `.env.example`) e preencha pelo menos
   `DATABASE_URL` com a connection string do Neon.
3. Rode:
   ```
   npx prisma migrate deploy
   npx prisma db seed
   ```
   Isso cria todas as tabelas e carrega:
   - as 8 áreas e as ~20 etapas do fluxo de INP (com seus prazos padrão);
   - os 11 usuários iniciais (João, Veronica, Vanessa, Talita, Camila, Antonio, Amanda, Evelyn,
     Edivaldo, Everton e Osvane), todos com a senha temporária **`UBL2026!`**.

   O admin pode cadastrar mais pessoas depois, pela tela **Administração > Usuários** —
   isso aqui é só a carga inicial.

## Passo 4 — Criar a conta no Resend (opcional, mas recomendado)

1. Crie uma conta em [resend.com](https://resend.com).
2. Verifique um subdomínio de envio (ex.: `mail.usiquimica.com.br`) seguindo as instruções do
   próprio Resend (adicionar registros DNS). Isso garante que os emails não caiam em spam.
3. Crie uma **API Key** em Resend e guarde-a — esse é o valor de `RESEND_API_KEY`.
4. Defina também o remetente, por exemplo `EMAIL_FROM="INP Usiquimica <inp@mail.usiquimica.com.br>"`.

Se você preferir, pode pular este passo por enquanto: o sistema funciona normalmente, só não
manda emails até você preencher isso na Vercel (Passo 5) e reimplantar.

## Passo 5 — Publicar na Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) (pode entrar com o GitHub).
2. Clique em "Add New… > Project" e importe o repositório do GitHub que você criou no Passo 1.
3. Em "Environment Variables", adicione (uma por linha, nome e valor):
   - `DATABASE_URL` — connection string do Neon (Passo 2). Dica: use a variante com
     `-pooler` no host, que o Neon oferece, para melhor desempenho em ambiente serverless.
   - `NEXTAUTH_SECRET` e `AUTH_SECRET` — gere um valor aleatório (pode usar
     https://generate-secret.vercel.app/32 ou `openssl rand -base64 32`); use o mesmo valor
     nas duas variáveis.
   - `NEXTAUTH_URL` — a URL do seu site depois de publicado, ex.:
     `https://inp-usiquimica.vercel.app` (dá para editar depois de publicar e reimplantar).
   - `RESEND_API_KEY` e `EMAIL_FROM` — do Passo 4 (pode deixar em branco por enquanto).
   - `CRON_SECRET` — outro valor aleatório qualquer (ex. gerado do mesmo jeito acima).
   - `BLOB_READ_WRITE_TOKEN` — veja abaixo como conseguir.
4. Para os anexos de arquivo funcionarem, adicione o **Vercel Blob**: no seu projeto na Vercel,
   vá em "Storage > Create Database > Blob" e crie um armazenamento. A Vercel gera e conecta
   automaticamente a variável `BLOB_READ_WRITE_TOKEN` ao projeto.
5. Clique em "Deploy". A Vercel vai instalar as dependências e rodar `next build`
   automaticamente (o comando `postinstall` já roda `prisma generate` sozinho).
6. **Se você não rodou o Passo 3 do seu computador**, rode-o agora apontando para a mesma
   `DATABASE_URL` que você colocou na Vercel — pode ser do seu computador mesmo, usando o
   `.env` local com essa connection string, rodando `npx prisma migrate deploy` e
   `npx prisma db seed` uma única vez.

## Passo 6 — Confirmar o Cron (avisos automáticos diários)

O arquivo `vercel.json` já configura um Cron Job diário, de segunda a sexta, às 08:00
(horário de Brasília) — ele verifica etapas paradas ou vencidas e dispara os emails de alerta.

Para confirmar que está ativo: no painel da Vercel, vá em "Settings > Cron Jobs" do seu projeto
e veja se aparece a rota `/api/cron/notifications` agendada. Isso é criado automaticamente a
partir do `vercel.json` quando você publica — não precisa configurar nada manualmente.

## Primeiro acesso

1. Acesse a URL do site publicado.
2. Entre com o seu email (ex.: `joao.guidetti@usiquimica.com.br`) e a senha temporária
   **`UBL2026!`**.
3. Você será obrigado a trocar a senha antes de acessar o restante do sistema.
4. Pronto — a partir daí, use normalmente. Administradores (João e Veronica, inicialmente) têm
   acesso ao menu "Administração" para cadastrar mais pessoas, feriados e ajustar prazos (SLA)
   de cada etapa.

---

## Sobre os formulários (Fase 1 / Fase 2 / Cadastro / Amostras)

Os campos de cada formulário (Business Case, Fase 2, Solicitação de Cadastro F.CT-0001 e
Amostras F.CT-0002) estão definidos de forma centralizada em `src/lib/formFields.ts`, cobrindo
os campos mais importantes das planilhas originais. Um desenvolvedor pode adicionar ou remover
campos editando essa lista — não é necessário mexer nas telas.

## Estrutura técnica (para o time de TI/desenvolvimento)

- Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- Banco de dados: Postgres via Prisma ORM (`prisma/schema.prisma`).
- Autenticação: NextAuth.js v5 (Credentials + bcrypt), sessão JWT.
- Emails: Resend, com templates HTML simples em `src/lib/email/templates.ts`.
- Anexos: Vercel Blob (`@vercel/blob`).
- O motor do fluxo (regra de negócio de avanço de etapas, gate, paralelismo) está em
  `src/lib/workflow.ts`.
- O cálculo de dias úteis (SLA, feriados) está em `src/lib/businessDays.ts`.
- A rotina diária de notificações está em `src/app/api/cron/notifications/route.ts`.

### Rodando localmente

```
npm install
cp .env.example .env   # preencha DATABASE_URL com um Postgres real (Neon ou local)
npx prisma migrate deploy
npx prisma db seed
npm run dev
```
