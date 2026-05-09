
## Objetivo

Oferecer dois caminhos de autenticação na Alliara:
1. **Login com Google (SSO)** — um clique, sem senha, e-mail já verificado pelo Google.
2. **E-mail + senha** — fluxo tradicional, com **verificação obrigatória de e-mail** antes do primeiro acesso e opção de **recuperação de senha**.

Tudo continua restrito ao domínio `@factorial.co` (regra já existente no banco via trigger `handle_new_user`).

---

## O que será entregue

### 1. Login com Google (Lovable Cloud Managed)
- Botão **"Continuar com Google"** nas telas `/login` e `/signup`.
- Usa o Google OAuth gerenciado pela Lovable Cloud (sem precisar de credenciais próprias).
- Restrição de domínio aplicada via parâmetro `hd: "factorial.co"` (Google só mostra contas @factorial.co) **+** a trigger do banco que já bloqueia outros domínios como segurança redundante.
- Após login, redireciona para `/partners`.

### 2. E-mail + senha com verificação
- Cadastro continua em `/signup`, mas agora o usuário **precisa clicar no link enviado por e-mail** antes de conseguir entrar (a configuração `auto_confirm_email` será desativada).
- Tela `/signup` já mostra o aviso "Cheque seu inbox" — vamos reforçar a mensagem.
- `/login` já detecta "email não confirmado" e oferece reenviar verificação — manter.

### 3. Recuperação de senha (novo)
- Nova tela `/forgot-password`: usuário digita o e-mail e recebe link de reset.
- Nova tela `/reset-password`: usuário define a nova senha (página pública, lê o token do hash da URL).
- Link "Esqueci minha senha" adicionado em `/login`.

### 4. Proteção contra senhas vazadas
- Habilitar **HIBP check** (have-i-been-pwned) — bloqueia senhas que aparecem em vazamentos conhecidos.

---

## Detalhes técnicos

**Configuração de auth (via tool):**
- `configure_social_auth` com `providers: ["google"]` (mantém email habilitado).
- `configure_auth` com `auto_confirm_email: false` e `password_hibp_enabled: true`.

**Código:**
- Atualizar `src/lib/auth.tsx` para expor `signInWithGoogle()` usando `lovable.auth.signInWithOAuth("google", { redirect_uri, extraParams: { hd: "factorial.co" } })`.
- Atualizar `src/routes/login.tsx` e `src/routes/signup.tsx` com botão Google + link "Esqueci senha".
- Criar `src/routes/forgot-password.tsx` e `src/routes/reset-password.tsx`.
- O integrador da Lovable cria automaticamente `src/integrations/lovable/` ao chamar `configure_social_auth` — não mexo nele.

**E-mails de verificação / reset:**
- Por padrão, a Lovable Cloud envia esses e-mails automaticamente com template padrão. Funciona out-of-the-box.
- Se quiser branding Alliara nos e-mails (logo, cores), posso configurar templates customizados depois — exige domínio de e-mail próprio configurado.

---

## Perguntas antes de começar

1. **Restrição @factorial.co no Google**: confirmo que o botão Google deve aceitar **somente** contas `@factorial.co`? (Se sim, uso `hd: "factorial.co"`. Se quiser permitir qualquer Google e validar depois, falo só com a trigger atual — mas a UX fica pior porque o usuário só descobre que foi bloqueado depois de logar.)
2. **E-mails de verificação com branding Alliara**: quer que eu já configure templates customizados (precisa de domínio de e-mail) ou começamos com o padrão da Lovable Cloud e mexemos no visual depois?
