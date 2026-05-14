## Objetivo

Permitir uso pleno do score e diagnóstico do OCTA mesmo sem conexão ativa com o HubSpot. Hoje a integração já é opcional do ponto de vista de dados (score/diagnóstico não dependem do HubSpot), mas a UI ainda exibe botões, links e mensagens de erro que assustam.

## Como detectar "offline"

Criar um hook `useHubSpotConnection()` em `src/lib/hubspot-connection.ts` que faz `select id from hubspot_connections limit 1` para o usuário logado e expõe `{ connected: boolean, loading: boolean }`. Cacheado por sessão (TanStack Query, `staleTime: 60s`).

## Mudanças por tela

**1. Esconder UI de HubSpot quando `connected === false`**

- `src/routes/digest.tsx`: já existe um caminho "Connect HubSpot" — manter, mas na navegação principal/sidebar marcar o item Digest como desabilitado com tooltip "Disponível ao conectar o HubSpot" (procurar onde Digest é renderizado no menu).
- `src/routes/partner.$partnerId.tsx`: ocultar o campo "HubSpot company ID (CRM)" no Edit partner quando offline (linha ~826). Assim o PDM não vê algo que não pode usar.
- `src/routes/settings.tsx`: manter o card HubSpot (é onde se conecta), mas o botão "Sync from HubSpot" só aparece se já houver conexão. Caso contrário, exibir somente "Connect HubSpot" + nota explicativa de que o resto da plataforma funciona normalmente sem ele.

**2. Silenciar erros**

- Em `src/lib/hubspot-client.ts`, criar um wrapper interno que detecta a string `"OAuth token expired"` / `"non-2xx"` / `"HUBSPOT_ACCESS_TOKEN"` e relança como `HubSpotOfflineError`.
- Nos pontos que invocam `syncHubSpot` / `synthesizeHubSpotDigest` / `writeHubSpotCompanyNote`, capturar `HubSpotOfflineError` e mostrar `toast.message` (neutro) em vez de `toast.error`, com texto: "Integração HubSpot pausada — reative em Settings quando o token estiver disponível."

**3. Banner global discreto**

- Adicionar `<HubSpotOfflineBanner />` em `src/routes/__root.tsx`, renderizado dentro do layout principal logado (não na landing/login).
- Quando `connected === false`, mostrar uma faixa fina no topo: "Modo offline do HubSpot ativo — score, diagnóstico e portfolio funcionam normalmente. [Conectar agora →]" com link para `/settings`.
- Persistir um "dismiss" por sessão em `sessionStorage` para não ficar invasivo.

## Arquivos a editar/criar

- criar `src/lib/hubspot-connection.ts` (hook + tipo de erro)
- criar `src/components/HubSpotOfflineBanner.tsx`
- editar `src/lib/hubspot-client.ts` (wrapper de erro)
- editar `src/routes/__root.tsx` (montar banner)
- editar `src/routes/settings.tsx` (esconder Sync quando desconectado)
- editar `src/routes/digest.tsx` (suprimir toast vermelho de offline)
- editar `src/routes/partner.$partnerId.tsx` (esconder campo HS quando offline)
- editar o componente de navegação onde Digest aparece (a investigar — provavelmente `src/routes/__root.tsx` ou um sidebar component) para desabilitar o link

## Fora do escopo

- Não mexer em score, diagnóstico, portfolio, leads, certificação — eles já são independentes do HubSpot.
- Não criar fila offline para sincronizar depois (sem demanda).
- Não tocar nas edge functions do HubSpot.

## Verificação

Após implementar: abrir `/dashboard`, `/partners`, `/partner/.../diagnostic` — nenhum deve mostrar erro vermelho de HubSpot. O banner deve aparecer no topo. `/digest` deve mostrar o card "Connect HubSpot" sem quebrar.
