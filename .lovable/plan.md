
# Plano: filtro por PDM + limpeza do Intel

## Antes de tudo: respondendo às suas perguntas

### 1. "Filtrar por PDM (Nicholas, Conal, Leon)"

Achado importante: olhei o banco e **só existe 1 owner real em `partners` hoje** (df86a49b…, com 79 parceiros). "Nicholas Mahon" não é um PDM — é o **nome de um parceiro** na sua lista (a empresa parceira chama Nicholas Mahon). Então provavelmente você está vendo nomes de parceiros e confundindo com PDMs.

Mesmo assim, o filtro por PDM faz total sentido para quando vocês forem mais de um logado. O toggle hoje já é "Mine / All" (só aparece para leadership). Vou expandir:

- Para **leadership/admin**: novo dropdown "Owner" ao lado de Mine/All com a lista de PDMs que têm ≥1 parceiro (puxados de `profiles` JOIN `partners.owner_id`).
- Para **PDM normal**: o filtro fica oculto (só veem o que é deles, RLS já garante).
- Funciona junto com os filtros existentes (status, type, search, sort) e com bulk actions.

### 2. "Apagar runs do decoder"

Sim — em `/partner/$partnerId/intel`, a lista "Decoded Partner Signals" hoje só permite ler. Vou adicionar:
- Botão **Delete** em cada `RunCard` (visível só para owner, com `confirm()`).
- Botão **Clear all** no header da seção (também com confirmação).
- Hard delete via `supabase.from("partner_intel_runs").delete().eq("id", …)` — RLS já permite ao owner.

### 3. "Documents, Quick metrics, Quick context — está redundante?"

**Resposta honesta: não, não está redundante.** Os três são insumos *diferentes* para a mesma IA (`partner-intel` edge function que usa Gemini 2.5 Flash via Lovable AI). Cada um serve um tipo de input que humano normal usa de forma diferente:

| Card | O que entrega para a IA | Exemplo |
|---|---|---|
| **Documents** | Texto bruto extraído de arquivos (`extracted_text` enviado como excerpt). Hoje **só extrai .txt/.md/.csv/.json** automaticamente — PDFs/DOCX/XLSX sobem mas a IA não lê o conteúdo, só o nome+kind+descrição. | "FY26 Business Plan.pdf" → IA só vê metadata |
| **Quick metrics** | Números estruturados (revenue, deals open/won, trained people) num formato que a IA pode comparar trimestre a trimestre. | revenue=480000, deals_won=12 |
| **Quick context** | Texto livre rápido — coisas que você diria numa call ("perdeu 2 reps", "está explorando vertical X"). Não vira documento. | Frase solta da sua cabeça |

**Sim, há uma IA real:** confirmei em `supabase/functions/partner-intel/index.ts`. Ela recebe os 3 inputs, devolve `executive_summary`, `red_flags`, `signals_by_axis` (1 por eixo OCTA) e `suggested_actions` — tudo via tool-call estruturada do Gemini. Não é placebo.

**Mas tem um buraco real para corrigir:** PDFs/DOCX/PPTX são uploadados mas o conteúdo não chega na IA. Vou listar isso como melhoria opcional abaixo (você decide se entra agora ou depois).

---

## Mudanças propostas

### A. Filtro por PDM em `/partners` (leadership only)

`src/routes/partners.tsx`:
- Novo state `ownerFilter: string | "all"` (default `"all"` quando scope=all).
- Quando `portfolio.isLeadership === true` E `scopeFilter === "all"`, renderiza dropdown "Owner: [Todos / Nome1 / Nome2 / …]" entre os controles de scope e status.
- Lista de owners derivada de `portfolio.items`: `Map<owner_id, display_name>` — busco display_name num `useEffect` separado fazendo `supabase.from("profiles").select("id, display_name").in("id", ownerIds)` (uma vez quando portfolio carrega).
- Aplica filtro em `scoped`: `it.partner.owner_id === ownerFilter` (depois do scope, antes dos outros).
- Cache simples em ref para não refazer a query a cada render.

Sem mudança de schema. Sem RLS nova (leadership já vê tudo).

### B. Deletar Decoder Runs em `/partner/$partnerId/intel`

`src/routes/partner.$partnerId.intel.tsx`:
- Em `RunCard`: adicionar prop `onDelete: (id) => Promise<void>` e botão "Delete" no header (icon `Trash2`, vermelho discreto).
- No componente pai `PartnerIntel`: handler `deleteRun(id)` faz `supabase.from("partner_intel_runs").delete().eq("id", id)` + `refresh()` + toast.
- Botão "Clear all" no header da seção "Decoded Partner Signals" (só se runs.length > 0): deleta todos os runs daquele partner com `confirm()`.

### C. Renomear/clarificar os 3 cards do Intel (sem remover)

Para reduzir a sensação de redundância sem perder funcionalidade:
- "Documents" → mantém, mas adiciono hint mais claro: "Files you want the AI to read. Plain-text auto-extracts; PDF/DOCX uploaded but not yet parsed."
- "Quick metrics" → mantém. Hint: "Structured numbers the AI compares over time."
- "Quick context" → renomear para "**Notes for this decode**". Hint: "One-shot context the AI uses for the next decode only — not saved to the partner profile."

Isso deixa óbvio que são *insumos complementares*, não duplicados.

### D. (Opcional, não faço sem aprovar) Parsing real de PDF/DOCX

Hoje `extracted_text` só é preenchido para arquivos texto. Para PDFs/DOCX/PPTX, eu poderia:
- Adicionar uma server function `extractDocText` que roda no upload, usando `pdf-parse` (Worker-compat? duvidoso) **ou** mandar o arquivo direto para o Gemini multimodal (Gemini 2.5 Flash aceita PDF como input de imagem/doc) na hora do decode.

A opção limpa é a 2ª: na função `partner-intel`, quando o doc for PDF, baixar do storage e enviar como `inline_data` para o Gemini. **Aviso:** é trabalho a mais e custa mais tokens. Te pergunto na execução se quer ou não.

---

## Arquivos tocados

- `src/routes/partners.tsx` — owner filter dropdown + lógica
- `src/routes/partner.$partnerId.intel.tsx` — delete em RunCard, clear all, hints renomeados
- `src/components/PartnerFilterBar.tsx` — pode ganhar slot opcional para o owner filter (ou eu coloco inline no partners.tsx para ficar simples)

Sem migration. Sem mudança de RLS. Sem mudança no edge function (a menos que você aprove o item D).

---

## Pergunta no fim para você decidir antes de eu codar

Sobre o item D (parsing real de PDF/DOCX para a IA): **entra agora junto, ou deixa para uma próxima rodada?** É a única coisa que muda o escopo de forma significativa.
