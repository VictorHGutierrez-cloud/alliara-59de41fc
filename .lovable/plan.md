## Contexto

Você é admin/leadership e quer ver de todo mundo por padrão, com filtro por PDM tanto em **/partners** quanto em **/qualification**.

O filtro por PDM já existe em /partners (dropdown "PDM: All / Leon / Jack / …") — mas ele só aparece quando você troca o toggle de "My partners" para "All partners". A view abre em "Mine" por padrão, então você não enxerga o filtro até clicar.

A página /qualification não tem nada disso ainda — ela mostra só os leads do usuário logado por padrão. RLS já permite leadership ver todos (`Owners view own leads or leadership views all`), então é só expor isso na UI.

## Mudanças

### 1. `/partners` — abrir em "All partners" para leadership

`src/routes/partners.tsx`:
- Mudar `useState<"mine" | "all">("mine")` → inicializar com `"all"` quando `portfolio.isLeadership === true`, `"mine"` caso contrário.
- Como `isLeadership` só fica disponível depois do fetch, usar um `useEffect` que seta o scope inicial uma vez quando `isLeadership` vira `true` e o usuário ainda não interagiu (flag `userTouchedScope`).
- Resultado: ao abrir /partners você já vê os 98 parceiros e o dropdown "PDM: All (8)" aparece imediatamente.

### 2. `/qualification` — adicionar scope toggle + filtro por PDM

`src/routes/qualification.tsx`:
- Detectar leadership: ler `user_roles` no mount (ou expor `isLeadership` via `useLeads` — vou colocar dentro do store para reaproveitar lógica do `usePortfolio`).
- Adicionar à filter bar (linha ~144), apenas para leadership:
  - Toggle "My leads / All leads" (default: "All" para leadership)
  - Dropdown "PDM: All / Leon / Jack / …" quando scope=All e houver >1 owner nos leads visíveis.
- Buscar `display_name` dos owners únicos via `profiles` (mesmo padrão do partners.tsx).
- Aplicar filtro em `visibleLeads`:
  - `scope==="mine"` → só `lead.owner_id === user.id`
  - `ownerFilter !== "all"` → só `lead.owner_id === ownerFilter`
- Os contadores de KPIs (`counts`) devem refletir o escopo ativo, não o total cru.

### 3. (pequeno) Extrair lógica comum

Para não duplicar, criar `src/lib/use-owner-scope.ts`:
- Hook `useOwnerScope({ items, getOwnerId, isLeadership })` que retorna `{ scope, setScope, ownerFilter, setOwnerFilter, ownersInScope, applyFilter }`.
- Usar nos dois routes.

Opcional — se você preferir simplicidade sobre DRY, eu inlino a lógica nos dois lugares (mais código duplicado, mas zero abstração nova). Me diga.

## Arquivos tocados

- `src/routes/partners.tsx` — default scope "all" para leadership
- `src/routes/qualification.tsx` — toggle + dropdown PDM + filtro
- `src/lib/leads-store.ts` — expor `isLeadership` no `useLeads` (uma query a mais em `user_roles`)
- (opcional) `src/lib/use-owner-scope.ts` — hook compartilhado

Sem migration. Sem RLS nova. Sem mudança de schema.

## Pergunta

**A) Hook compartilhado** (mais limpo, 1 arquivo novo) ou **B) inlinar nos 2 routes** (mais simples, mais repetição)? Default: **A**.
