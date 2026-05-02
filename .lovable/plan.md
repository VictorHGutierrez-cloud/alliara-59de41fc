## Diagnóstico

Os 7 PDMs (Conall, Jack, Magdalena, Fredrick, Nicholas, Paolo, Leon) **já existem** em `auth.users`, com role `pdm` e `display_name` corretos no banco. O motivo pelo qual você só consegue assignar para si mesmo é **RLS**:

- `user_roles` SELECT: `auth.uid() = user_id OR has_role(admin)` — leadership não passa.
- `profiles` SELECT: `auth.uid() = id` — só o próprio perfil.

Resultado: `usePdmRoster` no cliente só retorna o Victor. Não é dado faltando — é visibilidade.

Também: a marca atual é "Conduit" em ~15 arquivos de rotas e no `__root.tsx`. Vamos trocar por "Alliara".

## Plano

### 1. Expor o roster de PDMs com segurança (sem afrouxar RLS)

Criar uma função SQL `SECURITY DEFINER` que retorna apenas `(id, display_name)` de todos os usuários com role `pdm`/`leadership`/`admin`. Restrita a quem é `pdm`, `leadership` ou `admin` (não vaza dados para qualquer usuário autenticado).

```sql
create or replace function public.list_pdm_roster()
returns table (id uuid, display_name text)
language sql stable security definer set search_path = public, private as $$
  select p.id, coalesce(p.display_name, '')
  from public.profiles p
  where exists (
    select 1 from public.user_roles ur
    where ur.user_id = p.id and ur.role in ('pdm','leadership','admin')
  )
    and (
      private.has_role(auth.uid(),'pdm')
      or private.has_role(auth.uid(),'leadership')
      or private.has_role(auth.uid(),'admin')
    );
$$;
grant execute on function public.list_pdm_roster() to authenticated;
```

Também adicionar política de SELECT em `profiles` para leadership/admin verem nomes (necessário no `useOwnerScope` que faz `from('profiles').in('id', ...)` para resolver nomes nos chips/filtros):

```sql
create policy "Leadership and admin view all profiles"
on public.profiles for select to authenticated
using (private.has_role(auth.uid(),'leadership') or private.has_role(auth.uid(),'admin'));
```

### 2. Atualizar `src/lib/use-pdm-roster.ts`

Trocar a query atual por `supabase.rpc('list_pdm_roster')`. Mantém a mesma assinatura `{ pdms, loading }`, então `partners.tsx` e `qualification.tsx` continuam funcionando — passam a listar todos os 8 PDMs (Conall, Fredrick, Jack, Leon, Magdalena, Nicholas, Paolo, Victor).

### 3. Rebrand para Alliara

- Copiar o logo enviado para `src/assets/alliara-logo.png`.
- Substituir todas as ocorrências de "Conduit" por "Alliara" nos 15 arquivos de rota (títulos, meta tags, navbar, headings, footer).
- Atualizar `__root.tsx`:
  - title/og:title/twitter:title → "Alliara — SaaS for Partners"
  - description/og:description: trocar "Conduit" por "Alliara" (manter menção à metodologia OCTA, que é separada da marca).
  - `og:image` apontando para o novo logo.
- Atualizar o componente da navbar (provavelmente em `__root.tsx` ou `partners.tsx`) para renderizar o logo Alliara em vez do texto/ícone atual.
- Atualizar `<title>` do `index.html` se houver, e o favicon (gerar a partir do logo ou apenas referenciar o PNG por enquanto).

### 4. Verificação

Após o deploy: abrir `/partners`, abrir o popover "Assign to PDM" e confirmar que aparecem os 8 nomes. Testar reassignar um partner para Jack e voltar.

## Arquivos afetados

- **Migração SQL nova**: função `list_pdm_roster` + política em `profiles`.
- **Modificados**: `src/lib/use-pdm-roster.ts`, `src/routes/__root.tsx`, e os ~15 arquivos com a string "Conduit".
- **Novo asset**: `src/assets/alliara-logo.png`.

## Perguntas

Nenhuma — sigo com o plano assim que você aprovar.
