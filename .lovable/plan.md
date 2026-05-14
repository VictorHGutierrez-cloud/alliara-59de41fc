## Problema

O `/digest` hoje exige conexão ativa com HubSpot + cache sincronizado. Como a Davyn (e os outros 30 partners da planilha) só existem no banco local — sem `hubspot_connections` e sem linhas em `hubspot_company_cache` / `hubspot_deal_cache` — a chamada cai no guard "Connect HubSpot in Settings" e o cliente traduz para "Integração HubSpot pausada".

A planilha já preencheu `partners.hubspot_company_id` (Partner ID), mas esse ID não existe no portal HubSpot conectado, então mesmo um sync não traria nada.

## Objetivo

Fazer o digest funcionar **com os dados que já temos no Lovable Cloud** (partners + metrics + stakeholders + notes + action_plans), tratando HubSpot como enriquecimento opcional.

## Plano

### 1. Backend: novo modo "local-first" no `hubspot-synthesize`

Arquivo: `supabase/functions/hubspot-synthesize/index.ts`

- Remover o early-return `"Connect HubSpot in Settings"`. Conexão HubSpot passa a ser **opcional**.
- Sempre carregar o `partnerRow` completo (campos: name, company, segment, tier, partner_type, status, notes, hubspot_company_id).
- Carregar dados auxiliares do banco local com o admin client:
  - `partner_metrics` (últimos 6 períodos)
  - `partner_stakeholders`
  - `action_plans` abertos
  - assessment mais recente (`assessments.scores`, `overall`)
- Se houver `hubspot_connections` + cache para esse `hubspot_company_id`, anexar `company` + `deals` ao snapshot (como já faz hoje).
- Remover o 400 "no cached data was found" — virou caminho normal: digest local sem CRM.
- Ajustar o `SYSTEM` prompt para deixar claro que a fonte pode ser **local Alliara data** (notes, metrics, stakeholders, action plans) e que `hs_citation` é opcional quando não houver dados HubSpot. Risk label continua o mesmo enum.
- Manter o salvamento em `hubspot_digest_snapshots` (campo `hs_company_id` fica nullable na prática — já é).

### 2. Frontend: parar de bloquear quando não há HubSpot

Arquivo: `src/routes/digest.tsx`

- Remover o card "Connect HubSpot" como bloqueio. Mostrar como **dica opcional** ("Conecte o HubSpot em Settings para enriquecer o digest com deals do CRM"), mas o seletor de partners e o botão "Generate digest" ficam disponíveis.
- Lista de partners: continuar filtrando por `owner_id = user.id` e ordenando por nome — não exigir mais `hubspot_company_id`.
- Texto do `<option>`: mostrar "HS · {id}" quando houver, ou "local data" quando não.
- Esconder o botão "Log to HubSpot as note" quando não houver conexão (em vez de erro depois).
- Tirar o toast "Set HubSpot company ID in Edit partner first" — não é mais obrigatório.

Arquivo: `src/lib/hubspot-client.ts`

- Sem mudança de assinatura. `hs_company_id` retornado pode ser `0` quando não houver, e o front trata.

### 3. Validação

1. Ir em `/digest`
2. Selecionar **Davyn** no dropdown (deve aparecer mesmo sem HubSpot conectado)
3. Clicar em **Generate digest** → deve retornar brief com base em `notes` + `partner_type` + `tier` + métricas/stakeholders se existirem
4. Botão "Log to HubSpot as note" some quando não há conexão
5. Repetir para outros partners da planilha (Pietro Russo's, Oriol Pesa's, Marvin Molijn's accounts já importados)

## Detalhes técnicos

- A função continua autenticada (precisa do Bearer do usuário) e respeita ownership via `partners.owner_id = user.id`.
- O `LOVABLE_API_KEY` (já configurado) faz a chamada do AI Gateway — sem custo extra de setup.
- Não mexe em schema, não mexe em RLS, não mexe na importação da planilha.
- O nome da função fica `hubspot-synthesize` por compatibilidade, mesmo que o conteúdo agora seja "partner-synthesize". Renomear seria churn desnecessário.

## Fora de escopo

- Não vou tentar buscar a Davyn no HubSpot real (o `hubspot_company_id` da planilha não existe lá).
- Não vou criar um endpoint novo — só estender o atual.
- Não toco no `/reports` nem no fluxo de import.
