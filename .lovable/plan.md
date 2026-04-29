
# Repensar o Assessment: do Ecossistema → para o Parceiro

Você está certíssimo. As perguntas atuais avaliam o **programa de canais** ("Você tem uma tese de ecossistema?", "Pipeline de recrutamento?", "IPP definido?"). Isso responde "quão maduro é o seu time de partnerships". Mas o que você precisa, dentro de cada workspace de parceiro, é responder:

> **"Em que estágio está esta parceria, e o que devo fazer a seguir com ela?"**

São perguntas totalmente diferentes — mesmas 8 dimensões OCTA, mas vistas pela lente de **um relacionamento individual**.

---

## Parte 1 — Reescrever o diagnóstico (8 eixos × 3 perguntas)

Mantenho os 8 eixos OCTA e a estrutura de 5 níveis, mas reescrevo as 24 perguntas com foco no **estado da parceria com este parceiro específico**. Cada pergunta vira "onde estamos com ESTE parceiro neste eixo".

Exemplos do novo formato (vs. atual):

| Eixo | Antes (ecossistema) | Depois (este parceiro) |
|---|---|---|
| Strategy | "Você tem uma tese de ecossistema escrita?" | "Quão claro está o papel estratégico deste parceiro no seu plano (reach, capacidade, vertical, produto)?" |
| Offer | "Pricing dos parceiros é tierizado?" | "Este parceiro consegue pitchar sua oferta sozinho em 60 segundos?" |
| Recruit | "Pipeline de recrutamento de parceiros" | "Como entrou esta parceria — inbound oportunista, indicação, ou prospecção estratégica?" |
| Enable | "Você tem trilha de certificação?" | "Quantas pessoas deste parceiro estão treinadas/certificadas hoje?" |
| Co-sell | "Cadência de co-sell com parceiros" | "Existe pipeline conjunto ativo e revisado regularmente com este parceiro?" |
| Delivery | "SLA de entrega via parceiros" | "Este parceiro consegue entregar/implementar sem o seu time?" |
| Govern | "Tier system & QBRs" | "Cadência de QBR e plano conjunto com este parceiro" |
| Measure | "Métricas de programa" | "Você consegue medir ARR sourced/influenced por este parceiro?" |

Os 5 níveis de cada pergunta passam a descrever **estágios da parceria** (de "ainda não existe" → "transacional" → "ativa" → "estratégica" → "co-criando produto/mercado"). Isso conversa naturalmente com o seu modelo de tier (emerging → core → strategic).

**Onde mexo:** `src/content/octa.ts` (substituir as 24 entradas em `diagnostic`). A lógica de cálculo, salvamento e exibição não muda — mesmo schema, mesmo número de perguntas, então o histórico anterior continua lendo sem quebrar.

## Parte 2 — Aba "Documentos & Dados" do parceiro com insights por IA

Nova aba no workspace do parceiro (`/partner/:id/intel`) onde o PDM sobe qualquer artefato relevante e a IA extrai insights.

**O que o usuário pode subir:**
- Arquivos: Business Plan (PDF/DOCX), apresentação do parceiro (PPTX), planilha de vendas (XLSX/CSV), contratos, atas de reunião
- Texto livre: notas de call, emails importantes, "vendeu R$ X nos últimos 6 meses em Y verticais"
- Números estruturados (campos rápidos): revenue YTD, # vendedores treinados, # deals em aberto, último QBR

**O que a IA gera (botão "Gerar insights"):**
1. **Resumo executivo** do material subido
2. **Sinais por eixo OCTA** — para cada um dos 8 eixos, evidências encontradas + sugestão de nível
3. **Red flags** detectadas (queda de vendas, churn de pessoas treinadas, falta de plano conjunto…)
4. **3–5 ações sugeridas** já no formato do action plan, com botão "Adicionar ao plano"
5. **Pré-preenchimento opcional do diagnóstico** — a IA propõe respostas para cada uma das 24 perguntas baseada nos documentos, e o PDM revisa/ajusta antes de salvar

Isso fecha o loop: documentos → insights → diagnóstico calibrado → plano de ação.

### Detalhes técnicos (Parte 2)

- **Backend (Lovable Cloud):**
  - Bucket de storage `partner-docs` (privado), RLS: só o owner do parceiro + leadership lê/escreve
  - Tabela `partner_documents` (id, partner_id, user_id, filename, storage_path, mime, size, kind, extracted_text, created_at) com RLS espelhando `partners`
  - Tabela `partner_metrics` (id, partner_id, period, revenue, deals_open, trained_people, notes, created_at) — campos numéricos rápidos
  - Tabela `partner_intel_runs` (id, partner_id, input_summary, output jsonb, model, created_at) — histórico de cada execução de insights
- **Edge function `partner-intel`:** recebe `partner_id`, busca docs+metrics+último assessment, chama Lovable AI (`google/gemini-2.5-pro` para PDFs com imagens; `google/gemini-2.5-flash` para texto puro), retorna JSON estruturado `{ summary, signals_by_axis, red_flags, suggested_actions[], suggested_scores }`
- **Extração de texto dos uploads:**
  - PDF/DOCX/XLSX: usar `unpdf` + `mammoth` + `xlsx` (todos puros JS, compatíveis com Worker) na própria edge function no momento do upload, gravando `extracted_text` na linha
  - PPTX: extrair texto dos slides via `pptx-parser` (puro JS)
  - Imagens dentro de PDFs: enviadas direto ao Gemini (multimodal)
- **UI nova:** `src/routes/partner.$partnerId.intel.tsx` com 3 seções — "Documentos" (lista + upload drag&drop), "Métricas rápidas" (form), "Insights gerados" (timeline das execuções, cada uma expandível, com botões "Adicionar ao plano" e "Pré-preencher diagnóstico")
- **Integração com diagnóstico:** o componente `partner.$partnerId.diagnostic.tsx` ganha um botão opcional "Carregar sugestões da IA" no topo, que pré-preenche `answers` a partir do último `partner_intel_run.output.suggested_scores`

---

## Ordem de execução

1. **Reescrita das 24 perguntas** em `src/content/octa.ts` (rápido, alto impacto, zero quebra)
2. **Schema + storage** para documentos, métricas e intel_runs
3. **Edge function `partner-intel`** com extração de texto e chamada Lovable AI
4. **Aba `/partner/:id/intel`** com upload, métricas e display de insights
5. **Integração no diagnóstico** (botão "carregar sugestões da IA") e no plano de ação (botão "adicionar ação sugerida")

Posso fazer tudo de uma vez, ou prefere que eu entregue só a Parte 1 primeiro (perguntas reescritas) pra você validar o tom antes de eu construir a Parte 2?
