## Diagnóstico

**1. Davyn duplicada com `hs_company_id=4567` (fake)**

Existem duas linhas em `partners`:

| id | owner | hubspot_company_id | origem |
|----|-------|---------------------|--------|
| `f860fe4a…` | `df86a49b…` (outro PDM) | **4567** (fake, não existe no HubSpot) | seed antigo |
| `76d676c1…` | `2dadd873…` (você, da planilha) | **20590565132** (real) | import da planilha |

Quando você seleciona "Davyn" no `/digest`, o dropdown está caindo na linha antiga `4567`. O `hubspot-synthesize` busca em `hubspot_company_cache` / `hubspot_deal_cache` por `hs_object_id=4567`, não encontra nada, e a IA gera o texto "no deals or company data".

**2. Aba "Reports" sumiu**

A rota `/reports` continua existindo e funcional (`src/routes/reports.tsx`). O que sumiu é o link no dock de navegação (`src/routes/__root.tsx`, `workspaceItems`) — hoje só lista Digest, Portfolio, Settings (e Approvals para admin). Preciso re-adicionar a entrada "Reports".

---

## Plano

### Passo 1 — Limpar a Davyn duplicada (data fix, não migration)

Via tool `supabase--insert` (DELETE):

```sql
-- Apaga a linha antiga com hs_company_id fake (4567) e owner diferente
DELETE FROM public.partners
WHERE id = 'f860fe4a-4073-4574-b34e-b5659b7be0cf'
  AND hubspot_company_id = 4567;
```

Resultado: sobra só a Davyn real (`20590565132`, sua), e o dropdown do `/digest` aponta para a linha certa.

**Risco:** se houver `assessments`, `partner_metrics`, `action_plans` etc. ligados a esse `partner_id`, eles caem por cascade/RLS órfã. Antes de rodar o DELETE, faço um `read_query` para checar dependências e te confirmo no chat. Se houver dados que importam, faço um UPDATE para mover `partner_id` para a linha boa em vez de deletar.

### Passo 2 — Re-adicionar "Reports" no dock

Em `src/routes/__root.tsx`, dentro de `workspaceItems`, inserir entre Portfolio e Settings:

```tsx
{
  key: "reports",
  icon: BarChart3, // já disponível em lucide-react
  label: COPY.appShell.dockReports ?? "Reports",
  active: path.startsWith("/reports"),
  onClick: () => navigate({ to: "/reports" }),
},
```

Adicionar `dockReports: "Reports"` em `src/lib/copy.ts` (`appShell`) e o import do ícone `BarChart3`.

### Passo 3 — Hardening do `/digest` (evitar repetir o problema)

Quando o partner selecionado tem `hubspot_company_id` mas **zero linhas** em `hubspot_company_cache` para essa connection, em vez de chamar a IA e produzir o texto enganoso "no deals or company data", o endpoint `hubspot-synthesize` deve retornar um erro claro tipo:

> "Partner vinculado ao HubSpot company `<id>`, mas o cache local está vazio. Rode **Sync** em Settings antes de gerar o digest."

Edição em `supabase/functions/hubspot-synthesize/index.ts`: depois de buscar `companyRow` e `dealRows`, se `companyRow == null && dealRows.length === 0`, retornar `400` com essa mensagem em vez de seguir pra IA.

Isso protege contra: (a) IDs fake como `4567`, (b) IDs reais que ainda não foram syncados.

---

## Como você valida depois

1. Em `/digest`, abrir o dropdown — só uma "Davyn" deve aparecer, e deve ser a sua (owner = você).
2. Gerar digest da Davyn → deve trazer dados reais do HubSpot company `20590565132` (ou o erro claro do Passo 3 pedindo Sync, se a sync ainda não rodou).
3. No dock lateral esquerdo, clicar em "Reports" → carrega a `/reports` normalmente com Overview/Revenue/Health/etc.

Posso seguir?