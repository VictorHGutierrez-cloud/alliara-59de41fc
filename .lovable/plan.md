## Problema

A tabela `public.partner_certification_sessions` não existe no banco de dados (erro PGRST205). O código já espera essa tabela (vide `src/lib/certification-eligibility.ts` e `src/routes/certification.tsx`), mas a migração nunca foi aplicada — só existe um script manual em `supabase/repair_partner_certification_sessions.sql`.

## Solução

Criar a tabela via migração oficial do Lovable Cloud (não precisa rodar SQL manualmente no painel — eu faço pela ferramenta de migração e você só aprova).

### O que a migração vai criar

- **Tabela `partner_certification_sessions`** com os campos: `partner_id`, `session_number` (1 a 5), `completed_at`, `completed_by`, `notes`, `created_at`, `updated_at`. Restrição de unicidade por (partner, número da sessão) para evitar duplicatas.
- **Regras de acesso (RLS)**:
  - Ver: dono do parceiro, leadership ou admin podem ver as sessões.
  - Criar/Editar/Apagar: apenas o dono do parceiro, leadership ou admin.
- **Trigger** para atualizar `updated_at` automaticamente.
- **Foreign keys**: `partner_id` → `partners` (cascade delete), `completed_by` → `profiles`.

### Depois da aprovação

Não preciso mudar código — o frontend já está pronto pra usar essa tabela. Assim que a migração rodar, salvar sessões de certificação vai funcionar imediatamente.

Posso prosseguir?