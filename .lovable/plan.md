## Diagnóstico

Investiguei 4 problemas conectados:

| # | Problema | Causa raiz |
|---|---|---|
| 1 | "Nome em código" no dropdown PDM | Seu profile (Victor) tem `display_name = NULL`. O fallback do hook é `id.slice(0,8)` → `df86a49b`. |
| 2 | 75 parceiros mostrando UUID como owner | Esses 75 são seus (`df86a49b...` = victor.gutierrez), criados antes dos outros PDMs existirem. |
| 3 | Card de parceiro não mostra o PDM responsável | UI só mostra tag genérica "leadership view" — sem nome. |
| 4 | Não dá pra reassignar parceiro (individual nem em massa) | UI não tem ação de "Assign owner". RLS de UPDATE em `partners` é `auth.uid() = owner_id`, então mesmo leadership não consegue reassignar via RLS. |

## Plano

### 1. Backfill: criar profile do Victor + reassignar parceiros órfãos

Migration única:

```sql
-- 1a. Criar profile faltante para Victor
INSERT INTO public.profiles (id, display_name)
SELECT id, 'Victor Gutierrez'
FROM auth.users
WHERE email = 'victor.gutierrez@factorial.co'
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;
```

Resultado imediato: o dropdown PDM passa a mostrar **"Victor Gutierrez"** em vez de `df86a49b`. Os 75 parceiros continuam seus, mas agora identificados pelo nome correto. Você usa a UI nova (passo 3) para distribuir entre Leon, Jack e os outros conforme quiser.

### 2. RLS: permitir leadership/admin reassignar qualquer parceiro

Migration que substitui a policy de UPDATE em `partners`:

```sql
DROP POLICY "PDMs update own partners" ON public.partners;

CREATE POLICY "PDMs update own or leadership updates all"
ON public.partners FOR UPDATE TO authenticated
USING (
  auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'leadership'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'leadership'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
);
```

Mesma policy para `partner_leads` (qualification page já tem reassign na lógica? Não — adicionar consistência):

```sql
DROP POLICY "Owners update own leads" ON public.partner_leads;
CREATE POLICY "Owners update own or leadership updates all"
ON public.partner_leads FOR UPDATE TO authenticated
USING ( ...mesmo padrão... ) WITH CHECK ( ...mesmo padrão... );
```

### 3. UI: mostrar PDM no card + reassignar (individual e em massa)

**a) Mostrar nome do PDM no card** (`src/routes/partners.tsx`, ~linha 977)

Substituir a tag "leadership view" por um chip com avatar+nome do owner, sempre visível para leadership (não só quando `owner_id !== user.id`):

```
[Status: Scaling]   [👤 Leon Ribeiro]
```

Reaproveita o `ownerNames` Map já fetched pelo `useOwnerScope` — basta exportá-lo do hook.

**b) Reassign individual: dropdown no card**

Clique no chip do PDM abre um pequeno popover com lista de PDMs (Leon, Jack, Victor, Conall, Magdalena, Fredrick, Nicholas, Paolo). Selecionar → `UPDATE partners SET owner_id=$new WHERE id=$id`. Toast "Reassigned to {Name}".

Só visível para leadership.

**c) Reassign em massa: nova ação na bulk bar**

A bulk bar atual (`bulkUpdate`) suporta status/tier/type. Adicionar **"Assign to PDM…"** com mesmo padrão — dropdown que dispara `bulkUpdate({ owner_id: pdmId }, displayName)`.

Fluxo típico:
1. Você marca os checkboxes dos seus 75 parceiros (ou filtra por algum critério).
2. Bulk bar aparece: "75 selected · Assign · Status · Tier · Delete"
3. Clica "Assign" → escolhe Leon → todos viram do Leon.

**d) Lista de PDMs disponíveis**

Buscar via `supabase.from("user_roles").select("user_id").eq("role", "pdm")` + join com `profiles`. Cachear em hook `usePdmRoster()` em `src/lib/use-pdm-roster.ts` — reaproveitável em `/partners` e `/qualification`.

### 4. (bônus) Garantir que profile sempre exista

Olhando o `handle_new_user` do schema, ele já cria profile no signup. Mas seu usuário Victor é antigo (pré-trigger ou trigger falhou). O backfill no passo 1 resolve. Não precisa mexer no trigger.

## Arquivos tocados

- **Migration nova** (1 arquivo): backfill profile + 2 policies de UPDATE.
- **`src/lib/use-owner-scope.ts`**: exportar `ownerNames` Map para uso no card.
- **`src/lib/use-pdm-roster.ts`** (novo): lista de PDMs com display_name para os dropdowns de assign.
- **`src/routes/partners.tsx`**:
  - Card: substituir "leadership view" por chip clicável com nome do PDM + popover de reassign.
  - Bulk bar: adicionar botão "Assign to PDM…".
- **`src/routes/qualification.tsx`**: mesmo padrão (chip + reassign individual; bulk reassign se já houver bulk bar lá — verifico ao implementar).

## Resultado final

- Dropdown PDM mostra nomes reais: Victor Gutierrez, Leon Ribeiro, Jack Carey, etc.
- Cada card mostra qual PDM é dono.
- Clica no chip → reassigna 1 parceiro em segundos.
- Marca vários + bulk "Assign to PDM" → distribui em massa (perfeito para limpar seus 75 órfãos).
- Funciona pra `/partners` e `/qualification`.

Posso seguir?