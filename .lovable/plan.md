
## Plano

### 1) Corrigir a exclusão do primeiro (e qualquer) guidance

Hoje o botão "Delete guidance" chama `deleteRecommendation` em `partners-store.ts`, que faz `DELETE` em `ai_recommendations` filtrando por `id` e usa `.select("id")` para detectar bloqueio de RLS. A política atual permite o dono do parceiro, leadership e admin. Mesmo assim o usuário não consegue excluir nenhum guidance. Vou tratar como bug de fluxo, não de UI.

Passos:
- **Adicionar diagnóstico no clique de Delete**: logar no console (`partner_id`, `rec.id`, `auth.uid()` retornado pelo Supabase) para confirmar se a request DELETE realmente sai e o que volta. Hoje só temos `console.error` em caso de exceção.
- **Tornar o filtro DELETE explícito também por `partner_id`** (`.delete().eq("id", recId).eq("partner_id", partnerId).select("id")`). Isso evita qualquer cache/edge case e deixa a intenção clara nas policies.
- **Verificar a policy aplicada** rodando uma checagem com `supabase--read_query` em `pg_policies` para `ai_recommendations` e confirmar que a versão nova ("Delete recommendations on accessible partners") está realmente ativa (a migration mais recente faz `DROP` + `CREATE`, mas vou validar).
- **Fallback robusto via Edge Function** caso o DELETE direto continue bloqueado: criar `supabase/functions/delete-guidance` (com `verify_jwt = true`) que, dado `recId`, valida que o `auth.uid()` é dono do parceiro associado e usa `SUPABASE_SERVICE_ROLE_KEY` para apagar. O cliente tenta o DELETE direto primeiro; se vier 0 linhas, chama a edge function. Isso garante que o usuário sempre consiga apagar guidances dos parceiros dele.
- **Toast com mensagem real**: hoje quando volta 0 linhas o toast diz "You don't have permission..." — vou trocar por mensagem mais clara e oferecer ação ("Tentar novamente").

### 2) Transformar o Kept em um agente autônomo (mini-chat flutuante)

Hoje o ícone do Kept abre um Popover com 2 links. A intenção é virar um "mini Gemini" do escopo do projeto, sempre acessível, que o usuário pode usar sem sair da tela em que está.

Decisão do usuário: **uma única conversa**, **histórico no navegador (localStorage)**.

Estrutura nova:
- **`KeptChatDock`** (novo componente em `src/components/kept/KeptChatDock.tsx`): janela flutuante ancorada no canto inferior direito (acima do botão atual do Kept). Estados: fechada (só o botão flutuante atual), aberta (painel ~380×560px com header, lista de mensagens, composer), e expandida (link "abrir em tela cheia" → `/kept/ask`).
- **Substituir o Popover atual** em `KeptAmbientPresence`: o ícone passa a abrir/fechar o `KeptChatDock`. Mantemos um menu "kebab" pequeno dentro do header do dock com as duas ações antigas ("Conheça o Kept" e "Abrir em tela cheia").
- **Persistência local**: chave `alliara-kept-chat-v1` no `localStorage` armazenando `{ messages: UIMessage[]-ish, updatedAt }`. Botão "Nova conversa" no header limpa o histórico (com confirmação rápida).
- **Backend reutilizado**: continuamos chamando `supabase.functions.invoke("kept-ask", ...)` que já recebe `history` e `context.partners`. O dock injeta o mesmo snapshot do portfólio que o `/kept/ask` injeta hoje (extrair o builder de contexto para `src/lib/kept-context.ts` e usar nas duas superfícies para evitar duplicação).
- **UX**:
  - Header: avatar/ilustração do Kept, título "Kept", subtítulo "Pergunte qualquer coisa", botões "Nova conversa", "Expandir" (→ `/kept/ask`), "Fechar".
  - Body: bolhas de mensagem (assistant sem fundo, user com `bg-primary/`primary-foreground), markdown leve, indicador "Kept está pensando…".
  - Composer: textarea + botão enviar; Enter envia, Shift+Enter quebra linha.
  - Sugestões iniciais (3 chips) só quando a conversa está vazia, iguais às do `/kept/ask`.
  - Se não-logado ou na rota `/intro`/`/kept/ask`, o dock não aparece (mesma regra do `KeptAmbientPresence`).
  - Auto-foco no textarea ao abrir.
- **Acessibilidade**: `role="dialog"`, `aria-label="Kept assistant"`, ESC fecha, botão de toggle com `aria-expanded`.
- **A página `/kept/ask` continua existindo** como "tela cheia"; passo a ler/escrever as mesmas mensagens do `localStorage` para que dock e tela cheia compartilhem a conversa.

### Arquivos afetados

- `src/lib/partners-store.ts` — DELETE mais explícito + log de diagnóstico.
- `src/routes/partner.$partnerId.coach.tsx` — log no `deleteGuidanceRun` + fallback via edge function.
- `supabase/functions/delete-guidance/index.ts` (novo) + entrada em `supabase/config.toml`.
- `src/lib/kept-context.ts` (novo) — extrai snapshot de portfólio.
- `src/components/kept/KeptChatDock.tsx` (novo).
- `src/components/brand/KeptAmbientPresence.tsx` — passa a montar o `KeptChatDock` em vez do Popover de 2 links.
- `src/routes/kept.ask.tsx` — usa `kept-context.ts` e o mesmo storage do dock.

### Não muda

- Estrutura de rotas, banco (exceto possivelmente uma policy se o diagnóstico mostrar problema), onboarding tab, certificação, plano, OCTA. Nada do conteúdo de guidance é alterado, só a exclusão e a UI do Kept.

### Validação

- Testar criar um guidance, clicar Delete, ver no console o log com `auth.uid()` e o resultado do DELETE; reload da página e confirmar que sumiu.
- Testar mini-chat: abrir, perguntar "Como está o parceiro X?", verificar que responde com base no portfólio; fechar e reabrir → histórico persiste; "Nova conversa" → limpa; expandir → mesma conversa em `/kept/ask`.
