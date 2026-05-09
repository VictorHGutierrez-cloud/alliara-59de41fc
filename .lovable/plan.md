## Problema

Usuários que fazem signup (Google SSO ou email/senha) não aparecem em `/admin/approvals` porque a tabela `profiles` nunca recebe a linha correspondente. A função `handle_new_user()` existe, mas o **trigger** em `auth.users` que a dispara não foi criado. O mesmo vale para `assign_default_role()`.

Confirmado no banco:
- `auth.users` tem `victor.henrique.duarte@alumni.usp.br` (id `2e4b6eaf…`)
- `profiles` não tem nenhuma linha para esse id
- Schema dump: "There are no triggers in the database"

## Correção

### 1. Migration

Criar (ou recriar) os triggers em `auth.users`:

```sql
-- profile auto-criado no signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- role 'pdm' default
drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
  after insert on auth.users
  for each row execute function public.assign_default_role();
```

### 2. Backfill

Inserir profiles + roles que faltam para usuários `auth.users` órfãos (incluindo o Victor), com `access_status = 'pending'`:

```sql
insert into public.profiles (id, display_name, access_status)
select u.id,
       coalesce(u.raw_user_meta_data->>'display_name',
                u.raw_user_meta_data->>'full_name',
                u.raw_user_meta_data->>'name',
                split_part(u.email,'@',1)),
       'pending'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.user_roles (user_id, role)
select u.id, 'pdm'
from auth.users u
left join public.user_roles r on r.user_id = u.id
where r.user_id is null
on conflict do nothing;
```

### 3. Verificação

Após a migration:
- O Victor aparece em `/admin/approvals` como pending.
- Próximo signup (Google ou email) entra automaticamente em `profiles` como pending e em `user_roles` como `pdm`.

## Observação

Não é preciso mexer em código frontend — `auth.tsx`, `admin.approvals.tsx` e o guard em `__root.tsx` já estão corretos. O bug era 100% de banco (trigger ausente).
