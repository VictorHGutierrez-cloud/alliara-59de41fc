## Goals

1. **Edição em massa de PDMs com preview** — selecionar vários parceiros/leads e ver lado-a-lado quem está com quem antes de confirmar.
2. **Atribuir parceiro a qualquer pessoa** (não só ao usuário logado), com as regras de permissão certas para liderança.
3. **Workflow de promoção lead → parceiro** que funciona sempre, incluindo o caso atual em que o lead "ITGest" aponta para um partner deletado e o botão "Open partner" quebra.

---

## O que descobri

- O bulk "Assign to PDM" já existe em `src/routes/partners.tsx` mas atribui direto, sem preview.
- A liderança já consegue reassignar (RLS atualizado em migrations anteriores), mas só liderança. PDMs comuns ainda não conseguem co-trabalhar / passar parceiro adiante.
- O erro "ver parceiro dá erro" tem causa real no banco: o lead **ITGest** tem `promoted_partner_id = 1fdfab05…` mas esse partner **não existe mais** (foi deletado). O botão "Open partner →" leva pra `/partner/<id>` e cai em "Partner not found".
- Ao promover lead, o `promoteLead` cria o parceiro com `owner_id = userId` (quem clicou). Se a liderança promove um lead de outro PDM, o parceiro vai parar no portfólio do líder, não do PDM dono do lead. Isso explica o "não foi pro portfolio" da pessoa certa.

---

## Plano

### 1. Bulk reassign com preview (parceiros e leads)

- Criar componente compartilhado `BulkReassignDialog` (`src/components/BulkReassignDialog.tsx`):
  - Recebe a lista de itens selecionados (id, nome, owner atual) e o roster de PDMs.
  - Mostra uma tabela: **Item · PDM atual → Novo PDM**.
  - Permite escolher um PDM de destino único OU usar o modo "round-robin" (distribuir igualmente entre N PDMs escolhidos).
  - Botão "Confirm reassignment" só dispara o update depois do usuário ver o preview.
- Em `src/routes/partners.tsx`: trocar o `Assign to PDM` direto do `BulkActionBar` por abrir esse dialog.
- Em `src/routes/qualification.tsx`: adicionar checkboxes nos `LeadCard`s + barra de bulk equivalente (hoje não existe bulk em leads), reutilizando o `BulkReassignDialog`.

### 2. Atribuir parceiro a qualquer pessoa (não-leadership também)

- Manter regra atual: liderança/admin reassigna qualquer parceiro/lead.
- Adicionar caso novo: o **dono atual** pode "passar" seu parceiro/lead para outro PDM (handoff). Já permitido pelas RLS (owner pode update). Só precisamos expor o botão "Reassign…" no `OwnerChip` / `LeadOwnerChip` também quando `isOwner === true`, não só quando `isLeadership`.
- Validação visual: badge "Handed off by <nome>" no histórico (campo `notes` do parceiro), pra liderança auditar.

### 3. Workflow de promoção lead → parceiro robusto

Três correções:

**a) Auto-cura de referências quebradas**
- Em `useLeads.refresh`, depois de carregar leads aprovados, fazer um `select id from partners where id in (...)` com os `promoted_partner_id` não nulos. Se algum partner não existe mais, limpar o `promoted_partner_id` do lead (update) e voltar status pra `in_review`. Assim "ITGest" volta a ser promovível.
- Alternativa server-side: migration que faz `UPDATE partner_leads SET promoted_partner_id = NULL, status = 'in_review' WHERE promoted_partner_id NOT IN (SELECT id FROM partners)` uma única vez, e adicionar uma FK `ON DELETE SET NULL` em `partner_leads.promoted_partner_id` pra evitar recidiva. Vou aplicar as duas (limpeza + FK).

**b) `promoteLead` respeita o dono real do lead**
- Mudar `promoteLead(lead)` em `src/lib/leads-store.ts` pra usar `owner_id: lead.owner_id` (não `userId`). Assim, quando liderança promove um lead da Magdalena, o parceiro nasce no portfólio dela.
- Bloquear no client + checar via RLS: só o dono do lead OU liderança/admin pode promover. Mostrar mensagem clara se não pode.

**c) Botão "Promote to Partner" sempre visível e claro**
- No `LeadDetailPanel` e no `LeadCard`, mostrar o botão "Promote to Partner →" em qualquer status que não seja `rejected`, contanto que o scorecard esteja completo (today já acontece pra `approved`; estender pra `new` e `in_review`).
- Quando `promoted_partner_id` existir mas o partner não existe mais, mostrar botão "Re-promote" em vez de "Open partner".
- Substituir o `confirm()` nativo por um pequeno modal que pré-visualiza: nome do parceiro, dono que vai receber, tier inicial, tipo. Confirma → cria.

### 4. Pequenos ajustes de UX

- No `BulkActionBar` de partners, mostrar "Reassign…" (abre dialog) em vez de "Assign to PDM" (que sugeria override silencioso).
- Toast pós-bulk: "X partners reassigned · Y stayed unchanged" baseado em `count` de fato afetado.

---

## Arquivos que vou tocar

- **Criar**: `src/components/BulkReassignDialog.tsx`, `src/components/PromoteLeadDialog.tsx`, migration nova.
- **Editar**: `src/routes/partners.tsx`, `src/routes/qualification.tsx`, `src/lib/leads-store.ts`, `src/lib/use-pdm-roster.ts` (já usado).
- **SQL migration**:
  - Limpar `promoted_partner_id` órfãos.
  - Adicionar FK `partner_leads.promoted_partner_id → partners(id) ON DELETE SET NULL`.
  - (Opcional) policy de promoção se decidirmos restringir mais no servidor.

---

## Não vou mexer

- Schema do scorecard, tabela `partners` core, autenticação, branding Alliara (já feito).
- Não vou criar nova tabela "portfolio" — o portfólio **é** a tabela `partners`. A confusão era só o owner errado + partner deletado.
