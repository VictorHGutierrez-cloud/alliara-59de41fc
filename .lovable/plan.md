## Status atual (verificado)

- **Typecheck**: limpo (`bunx tsc --noEmit` sem erros). Nenhum import pendente do `PartnerRosterTable` / `CandyDataTable`.
- **Bulk actions** em `/partners`: a `CandyDataTable` controla seleção internamente; os handlers `bulkUpdate(ids, …)` e `bulkDelete(ids)` recebem o array de IDs vindo da bulk bar flutuante. O dialog `BulkReassignDialog` agora usa o estado `selectedForReassign` (capturado no momento em que "Reassign…" é clicado) — a correlação está correta.
- **Páginas individuais por eixo**: já existem em `src/routes/axis.$axisKey.tsx`, com tabs **Overview** (mental model + objetivos + alavancas + métricas + erros comuns + exemplos), **Levels** (1→5) e **Lessons**. Conteúdo dos 8 eixos vem de `src/content/octa.ts` (já completo).

**O que está realmente faltando**: uma **porta de entrada navegável** para os 8 eixos. Hoje só dá pra chegar em `/axis/<key>` via dashboard ou diagnóstico — não existe um índice da metodologia.

## O que vou fazer

### 1. QA das bulk actions no preview (sem código)
Abrir `/partners` no browser tool, selecionar 2 linhas, conferir:
- bulk bar aparece com "2 selected"
- "Mark Active" → toast + linhas mudam de status sem reload
- "Mark At Risk" idem
- "Reassign…" abre o dialog com os parceiros corretos
- "Delete" mostra confirm e remove

Reportar resultado. Se algo estiver quebrado, corrijo.

### 2. Nova página `/methodology` — índice dos 8 eixos

Novo arquivo `src/routes/methodology.tsx` (`createFileRoute("/methodology")`) com:

```text
OCTA Methodology
────────────────
Operating model for Channel and Tech Orchestration

[ Mental model central — CENTRAL_MENTAL_MODEL em destaque ]

┌──────────────┬──────────────┬──────────────┬──────────────┐
│  S Strategy  │  T Trust     │  E Enablement│  M Marketing │  ← 8 cards (grid 2×4 desktop, 1 col mobile)
│  octa-1      │  octa-2      │  ...         │  ...         │
│  tagline…    │  tagline…    │              │              │
│  Your level: │  Your level: │              │              │
│  ███░░ 3/5   │  ░░░░░ —     │              │              │
│  Open →      │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Cada card:
- Letra grande no avatar colorido com `var(--{axis.color})`
- `axis.name` + `axis.tagline`
- Mini-preview: 3 primeiros `objectives` (bullets)
- Score atual do usuário (puxa de `useOctaData`) com mini-barra
- Link para `/axis/$axisKey`

Header da página:
- `Stat` block com média geral, eixos diagnosticados (X/8), lições completadas
- Bloco em destaque com `CENTRAL_MENTAL_MODEL` e `OCTA_FULL_NAME`

Empty state quando user ainda não fez diagnóstico: CTA "Run diagnostic →" para `/diagnostic`.

### 3. Adicionar ao Dock + breadcrumb nos eixos

- **`src/routes/__root.tsx`**: trocar o ícone "My Performance" por uma entrada **Methodology** (ícone `Compass`) que aponta para `/methodology`, ativa em `/methodology` ou `/axis/*`. **OU** (preferência) adicionar como item separado mantendo "My Performance". Vou preferir **adicionar separado** pra não perder atalho do dashboard pessoal — Dock vira: Portfolio · Qualification · Reports · Methodology · My Performance · Settings.
- **`src/routes/axis.$axisKey.tsx`**: trocar o link "← Dashboard" por "← Methodology" apontando pra `/methodology`.

## Fora de escopo

- Não vou refazer a página `/axis/$axisKey` — já cobre objetivos/alavancas/métricas/erros/exemplos com qualidade.
- Sem mudanças no schema, sem migrações.
- Sem mexer em `RevenueReport`/`qualification`.

## Ordem técnica

1. QA do `/partners` no browser → reportar.
2. Criar `src/routes/methodology.tsx`.
3. Atualizar Dock (`__root.tsx`) com ícone Compass + nova entrada.
4. Atualizar breadcrumb em `axis.$axisKey.tsx`.
5. Typecheck final.

Confirma?
