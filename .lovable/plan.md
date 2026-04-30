## Visão geral

Dois temas, ambos focados no pipe de **Partner Acquisition** (`/qualification`):

1. **Auth restrita ao domínio `@factorial.co`** com verificação de email obrigatória.
2. **Mini-CRM de aquisição**: dar ao lead os campos básicos de CRM + uma lista de tarefas/atividades por lead, mantendo o pipe separado do pipe de parceiros já promovidos (`/partners`, que continua sendo o lugar do diagnóstico OCTA).

Não vou tocar em `/partners`, `/axes`, `/intel`, `/plan` nem no diagnóstico — esses continuam sendo o "pipe 2" (parceiros ativos).

---

## 1) Restrição de signup ao @factorial.co + verificação de email

### Frontend (`src/routes/signup.tsx` e `src/lib/auth.tsx`)
- Validar no `signup.tsx` antes de chamar `signUp()`: se o email não terminar em `@factorial.co` (case-insensitive), bloquear com toast "Only @factorial.co emails are allowed."
- Após `signUp` bem-sucedido, **não** redirecionar pra `/partners`. Mostrar tela "Check your email to verify your account" com botão para reenviar (`supabase.auth.resend`).
- No `login.tsx`, se o erro for `email_not_confirmed`, mostrar mensagem específica + botão "Resend verification email".
- Atualizar landing/copy: "Factorial PDM Command Center — sign in with your @factorial.co email."

### Backend (defesa em profundidade)
- Adicionar trigger no Postgres `auth.users` (BEFORE INSERT) que rejeita emails fora de `@factorial.co`. Isso impede contornar a validação client-side e cobre OAuth futuro.
- Manter verificação de email **ligada** (não auto-confirmar). Este já é o default do Supabase — apenas confirmamos que está assim e não mexemos no `configure_auth` para auto-confirm.

### Configuração de auth
- Verificar redirect URLs / Site URL para que o link de confirmação volte pro app (preview + published).

> Observação sobre emails de verificação: por padrão o Supabase já envia o email de confirmação com template padrão. Não vou scaffoldar templates customizados a menos que você peça — se quiser branding Factorial no email, me diga e eu faço num passo separado (precisa de domínio de email).

---

## 2) Mini-CRM de aquisição no `/qualification`

### Conceito (mantendo simples)
Dois pipes claros:
- **Pipe 1 — Acquisition (`/qualification`)**: prospecção/discovery. Aqui mora o CRM leve + tarefas + scorecard 5D. Quando promovido, vira parceiro.
- **Pipe 2 — Active Partners (`/partners`, `/partner/$id/...`)**: parceiros oficiais. Diagnóstico OCTA, axes, intel, plan. Já está pronto, não muda.

### Schema novo (uma única tabela)
`partner_lead_activities` — atividades/tarefas amarradas a um lead:

```
id            uuid pk
lead_id       uuid  → partner_leads(id) on delete cascade
owner_id      uuid  (auth.uid())
kind          enum('task','call','email','meeting','note')
title         text
description   text null
due_date      date null               -- só faz sentido pra task
done          boolean default false   -- só faz sentido pra task
done_at       timestamptz null
created_at    timestamptz default now()
updated_at    timestamptz default now()
```

RLS espelhando `partner_leads`: dono vê/edita as suas; leadership/admin lê tudo.

### Campos de CRM adicionados em `partner_leads`
Pra ser um CRM real sem inventar tabela nova, adicionar colunas em `partner_leads`:
- `contact_email` text
- `contact_phone` text
- `contact_role` text  (ex: "CEO", "Head of HR")
- `source` text  (ex: "Outbound", "Referral", "Event", "Inbound")
- `next_step_at` date  (próxima ação prevista — derivada da task aberta mais próxima, mas também editável manualmente)

Tudo opcional, sem quebrar dados existentes.

### UI no `/qualification`

**Lista (kanban atual)** — sem mexer no layout, só:
- Mostrar no `LeadCard` um badge pequeno com nº de tarefas abertas e indicador vermelho se houver task em atraso.
- Mostrar `next_step_at` quando existir.

**Side panel do lead (`LeadDetailPanel`)** — ganha duas abas no topo:

```
[ Scorecard ]  [ CRM & Activities ]
```

- **Scorecard**: tudo que já existe hoje (5D, verdict, promote/reject).
- **CRM & Activities** (novo):
  - Bloco "Contact": email, phone, role, source, next step (inline edit).
  - Bloco "Activities" (timeline reversa cronológica):
    - Form rápido no topo: tipo (task/call/email/meeting/note), título, due date (se task), descrição opcional → "Add".
    - Cada item: ícone por tipo, título, data, descrição. Para `task`: checkbox para marcar `done`; tasks atrasadas em vermelho. Botão excluir.
  - Resumo no header da aba: "3 open tasks · 1 overdue · last activity 2d ago".

### Store
Estender `src/lib/leads-store.ts` com:
- Novos campos no `createLead` / `updateLead` (contact_email, phone, role, source, next_step_at).
- Novo hook `useLeadActivities(leadId)` com `list / create / toggleDone / delete`.

---

## Detalhes técnicos

**Migrations (ordem):**
1. `alter table partner_leads add column contact_email text, contact_phone text, contact_role text, source text, next_step_at date;`
2. `create type lead_activity_kind as enum ('task','call','email','meeting','note');`
3. `create table partner_lead_activities (...)` com FK e índices em `(lead_id, created_at desc)` e `(lead_id, done, due_date)`.
4. RLS policies (select/insert/update/delete) baseadas em `owner_id = auth.uid()` + leadership/admin SELECT.
5. Trigger `set_updated_at` em `partner_lead_activities`.
6. Trigger em `auth.users` BEFORE INSERT que dispara `raise exception` se `lower(new.email) not like '%@factorial.co'`.

**Frontend:**
- `src/lib/leads-store.ts`: estender tipos + `useLeadActivities`.
- `src/routes/qualification.tsx`: tabs no side panel, contact block, activities timeline, badges no card.
- `src/routes/signup.tsx`: validação de domínio + tela "check your email".
- `src/routes/login.tsx`: tratamento de `email_not_confirmed` + resend.
- `src/lib/auth.tsx`: expor `resendVerification(email)`.

**Sem mudanças em:** `/partners`, `/partner/$partnerId/*`, `/dashboard`, `/diagnostic`, `/axis/$axisKey`, edge functions, storage buckets.

---

## Pontos de decisão (posso seguir com defaults)

- **Tipos de atividade**: `task | call | email | meeting | note`. Se quiser só `task + note`, eu corto.
- **Sources padrão**: vou colocar dropdown com `Outbound, Inbound, Referral, Event, Partner network, Other`. Texto livre como fallback.
- **Domínio único**: travado em `@factorial.co`. Se um dia precisar de subsidiárias (ex: `@factorialhr.com`), o trigger e a checagem client-side passam a aceitar uma lista — mas hoje fica só `@factorial.co`.

Posso seguir.