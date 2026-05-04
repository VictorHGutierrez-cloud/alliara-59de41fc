## Objetivo

A seção **Your partners** em `/partners` hoje usa um grid de cards (`sm:grid-cols-2 lg:grid-cols-3`) que fica visualmente pesado quando há muitos parceiros: muita repetição, scroll longo e difícil escanear. Vou trocar pela mesma `CandyDataTable` que já usamos em Qualification e no Top Partners do Revenue Report — densa, animada, com avatares, status pills, ação no hover e bulk action bar flutuante.

O resto da página (header, briefing, KPIs, Growth Initiatives) **fica igual**. A mudança é cirúrgica: só o roster.

## Como vai ficar

```text
Roster                                                    [+ Add partner]
[search]  [type ▼]  [sort ▼]
┌────────────────────────────────────────────────────────────────────┐
│ ☐ │ PARTNER          │ STATUS    │ TYPE       │ OWNER  │ MRR │ MAT│
├────────────────────────────────────────────────────────────────────┤
│ ☐ │ (A) Acme Corp    │ Scaling   │ Reseller   │ Victor │ $4k │ 3.8│
│ ☐ │ (B) Bright Co    │ Developing│ Referral   │ Maria  │ $1k │ 2.4│   ← hover: [Open →]
│ ☑ │ (C) Cobalt Ltd   │ Churn Risk│ Strategic  │ Victor │  —  │ 4.1│
└────────────────────────────────────────────────────────────────────┘
                  [ 2 selected · Status ▾ · Tier ▾ · Reassign · Delete · ✕ ]
                  (barra flutuante já existente, acima do Dock)
```

## Mudanças

### 1. `src/routes/partners.tsx` — substituir o grid de cards

Trocar o bloco `<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">…PartnerCard…</div>` (linhas ~721-745) por uma `CandyDataTable` com estas colunas:

| Coluna | Conteúdo | Width |
|---|---|---|
| Partner | `CandyAvatar` + nome (link para `/partner/$partnerId`) + company em segunda linha | `minmax(220px,2fr)` |
| Status | `StatusPill` com tone derivado (active=success, nurturing=info, at_risk=danger, paused=muted, archived=muted) | `140px` |
| Type | Chip pequeno reusando `PartnerTypeChip` | `130px` |
| Tier | label minúsculo colorido com `var(--{tierColor})` | `110px` |
| Owner | nome do PDM (só aparece em leadership view ou quando `ownerNames` disponível) | `140px` |
| MRR | `fmtMoney(revenueMap.get(id)?.mrr)` align right, mono | `100px` |
| Maturity | nível 1-5 + mini barra colorida (ou "—") align right | `100px` |
| Actions | hover-only: botão **Open →** que navega para o partner | `90px` |

Configuração:
- `selectable` ativo — substitui o checkbox "Select all visible" atual e a `BulkActionBar` inline.
- `bulkActions`: **Mark Active**, **Mark At Risk**, **Reassign…**, **Delete** (vermelho) — chamando os handlers `bulkUpdate` / `setReassignOpen(true)` / `bulkDelete` que já existem.
- `onRowClick`: navega para `/partner/$partnerId`.
- `empty`: mantém o `<EmptyState onAdd={…} />` atual quando `sorted` vier vazio.

### 2. Remover código que vira redundante

- O `<label>` "Select all visible" + `clearSelection` button (linhas 677-705) — a tabela já gerencia seleção.
- O `<BulkActionBar count=… />` inline (linhas 707-719) — substituído pela `bulkActions` flutuante da `CandyDataTable`. **Mantemos** a função `BulkActionBar` no arquivo caso outra view use, mas paramos de renderizar aqui (ou removemos se ninguém mais importa).
- O componente `PartnerCard` continua no arquivo mas deixa de ser referenciado. Vou removê-lo para enxugar.

### 3. Pequenos ajustes de UX

- Manter os filtros (`PartnerFilterBar`: search/type/sort) **acima** da tabela, idênticos.
- Manter o header da seção (`Your partners` + botão `+ Add partner`).
- Linha com `at_risk` recebe um leve tint vermelho via `className` extra na cell (passando uma `className` calculada por linha através de `cell` wrappers — não precisa estender a API da tabela).
- A bulk action bar da `CandyDataTable` já se posiciona acima do Dock (`bottom: calc(... + 116px)`), então não conflita.

## Detalhes técnicos

- `StatusPill` tone mapping:
  ```ts
  const STATUS_TONE = {
    active: "success", nurturing: "info",
    at_risk: "danger", paused: "muted", archived: "muted",
  } as const;
  ```
- A coluna **Maturity** mostra `it.latest ? Number(it.latest.overall).toFixed(1) : "—"` + uma barrinha de 32px com `width: (avg/5)*100%` colorida via `var(--primary)`.
- A coluna **Owner** só é incluída no array `columns` se `portfolio.isLeadership` (mesma regra que o card já usa).
- `rowKey: (it) => it.partner.id` — alinha com o estado de `selectedIds` que já temos (mas migra para o estado interno da tabela; os handlers passam a receber `selectedIds: string[]` da `bulkAction.onClick`).

## Fora de escopo

- Não mexo em Growth Initiatives, KPIs, header, dialogs (`NewPartnerDialog`, `ActionDetailSheet`, `BulkReassignDialog`).
- Não mudo a página `/qualification` nem `RevenueReport`.
- Sem migrações de banco.

Confirma que posso aplicar?