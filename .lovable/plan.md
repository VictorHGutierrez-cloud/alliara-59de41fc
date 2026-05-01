# Bulk actions + KPIs reais

## Respostas rápidas

**De onde vinha o "$150k"?** Era um valor **chumbado no código** (`value="$150k"` em `src/routes/partners.tsx` linha 239) — não vinha do banco. Vou substituir por um cálculo real.

**O que era "EQL"?** "Ecosystem Qualified Lead" — um número estimado por uma heurística (1 lead/parceiro/mês, +2 se tier strategic). Não era dado real, era invenção. Vou remover.

---

## 1. KPIs corrigidos (topo de `/partners`)

Grid passa de 4 para 3 cards (mais largos e respiráveis):

| Card | Como calcula |
|---|---|
| **Partner-sourced pipeline** | Soma de `partner_metrics.deals_open_value + deals_won_value` (último registro por parceiro, escopo "mine"/"all"). Formato: €/k/M com `fmtMoney`. Hint: "X parceiros com métricas" |
| **Active partners** | Igual hoje (Scaling+Developing+Churn Risk) |
| **Avg maturity** | Igual hoje |

- Remover `estimateEqlsThisMonth()` e o card EQL
- Adicionar fetch agregado em `useLatestPartnerRevenue` (ou usar o map já carregado, que já traz `dealsOpenValue` — preciso adicionar esse campo)
- Se nenhum parceiro tem métrica → mostra "—" + hint "Add metrics on partner pages"

## 2. Bulk actions na lista de parceiros

### UX
- **Checkbox** no canto superior esquerdo de cada `PartnerCard` (aparece em hover ou sempre, modo discreto)
- Quando ≥1 selecionado → **barra de ação flutuante** sticky no topo do roster com:
  - "X selected" + botão "Clear"
  - Dropdown **Set status** → Scaling / Developing / Churn Risk / Paused / Archived
  - Dropdown **Set tier** → Strategic / Core / Emerging / Long tail
  - Dropdown **Set type** → Referral / Reseller / Expert
  - Botão **Delete** (vermelho, com `confirm()` listando os nomes)
- Checkbox "Select all visible" no header da seção Roster
- Toast de confirmação após cada operação ("3 partners moved to Scaling")

### Lógica
- Novo state `selectedIds: Set<string>` em `PartnersPage`
- Função `bulkUpdate(patch)` → `supabase.from("partners").update(patch).in("id", [...selectedIds])` + `portfolio.refresh()`
- Função `bulkDelete()` → `.delete().in("id", ...)` + refresh + limpa seleção
- RLS atual já permite (PDM só atualiza/deleta próprios — `auth.uid() = owner_id`); para leadership em escopo "all", o update simplesmente ignora os que não são dele (sem erro fatal — mostro toast com contagem real afetada)

### Componentes
- Modificar `PartnerCard` para aceitar `selected`, `onToggleSelect`, `selectionMode`
- Novo componente `BulkActionBar` inline em `partners.tsx` (sticky `top-0 z-20`, candy-themed)

---

## Arquivos tocados

- `src/routes/partners.tsx` — KPIs (remove EQL, novo pipeline calculado), state de seleção, BulkActionBar, integra checkbox no PartnerCard, handlers bulk
- `src/lib/partner-revenue.ts` — adicionar `dealsOpenValue` ao `PartnerRevenue` (já lemos `deals_open_value` mas não expomos)

Sem mudança de schema, sem migration.
