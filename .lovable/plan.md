## Diagnóstico

O dropdown de PDM **existe** no código (`src/routes/partners.tsx` linhas 599-628) mas está condicionado a `portfolio.isLeadership === true`. Verifiquei o banco:

| Email | Role atual |
|---|---|
| victor.gutierrez@factorial.co | `pdm` |
| leon.ribeiro@factorial.co | `pdm` |
| jack.carey@factorial.co | `pdm` |

Você (Victor) está como `pdm`, então:
1. A UI esconde o toggle "My/All partners" e o dropdown de PDM.
2. A RLS de `partners` (`PDMs view own partners or leadership views all`) só te devolve os seus parceiros — então mesmo se a UI mostrasse o filtro, você não veria os parceiros do Leon nem do Jack.

Mesma coisa em `/qualification` (RLS de `partner_leads` é igual).

## Mudança

**Migration única**: promover seu usuário para `leadership` (mantendo o `pdm` também, já que você disse que é PDM e gestor).

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'leadership'::app_role
FROM auth.users
WHERE email = 'victor.gutierrez@factorial.co'
ON CONFLICT (user_id, role) DO NOTHING;
```

Depois disso, ao recarregar `/partners`:
- Toggle "My partners / All partners" aparece (default: **All**, conforme já implementado).
- Dropdown "PDM: All (N) / Leon / Jack / …" aparece quando há mais de um owner nos resultados.
- KPIs e roster passam a contar todos os parceiros visíveis.
- `/qualification` ganha o mesmo comportamento.

## Pergunta opcional

Quer que eu já promova **outros usuários** a `leadership` também? Por exemplo, algum diretor além de você. Se for só você por enquanto, sigo só com o seu.

## Arquivos tocados

- 1 migration nova em `supabase/migrations/` — apenas `INSERT` em `user_roles`.

Sem mudança de código React, sem nova RLS, sem mudança de schema.