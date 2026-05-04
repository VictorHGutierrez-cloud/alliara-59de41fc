Refatorar `src/routes/partners.tsx` para substituir o grid de `PartnerCard` pela `CandyDataTable`, conforme plano já detalhado em `.lovable/plan.md`.

## Mudanças em `src/routes/partners.tsx`

1. **Trocar o grid** `sm:grid-cols-2 lg:grid-cols-3` por `<CandyDataTable>` com colunas:
   - **Partner** — `CandyAvatar` + nome + company (`minmax(220px,2fr)`)
   - **Status** — `StatusPill` com tone mapeado:
     ```ts
     const STATUS_TONE = {
       active: "success", nurturing: "info",
       at_risk: "danger", paused: "muted", archived: "muted",
     } as const;
     ```
   - **Type** — reusa `PartnerTypeChip` (`130px`)
   - **Tier** — label colorido com `var(--{tierColor})` (`110px`)
   - **Owner** — só quando `portfolio.isLeadership` (`140px`)
   - **MRR** — `fmtMoney(...)` align right mono (`100px`)
   - **Maturity** — `latest.overall.toFixed(1)` + barrinha 32px (`100px`)
   - **Action** — `hoverCell` com botão **Open →** (`90px`)

2. **Remover código redundante:**
   - Checkbox "Select all visible" + clear button
   - `<BulkActionBar count=…>` inline (a CandyDataTable já tem bulk bar flutuante)
   - Componente `PartnerCard` (sem mais referências)
   - Estado `selectedIds` local migra pro estado interno da tabela

3. **Bulk actions:** Mark Active, Mark At Risk, Reassign…, Delete (variant danger) — chamando os handlers existentes (`bulkUpdate`, `setReassignOpen`, `bulkDelete`).

4. **Manter intacto:** header "Your partners" + botão `+ Add partner`, `PartnerFilterBar`, `EmptyState`, KPIs, Growth Initiatives, todos os dialogs (`NewPartnerDialog`, `ActionDetailSheet`, `BulkReassignDialog`).

## Fora de escopo

Sem mudanças em outras rotas, sem migrações de banco, sem alterar `CandyDataTable`.
