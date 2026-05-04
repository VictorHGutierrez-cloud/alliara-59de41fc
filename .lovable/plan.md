# Aba Reports — relatórios prontos com filtros e export

Cria `/reports` (link no header, ao lado de Portfolio / Qualification / My Performance), move toda a camada de visualização da home dos parceiros pra lá, e entrega 6 relatórios fiéis aos dados que já temos hoje. Tudo com filtros editáveis e export CSV + PNG. A arquitetura já fica pronta pra plugar o "builder configurável" no próximo prompt.

---

## 1. O que sai de `/partners`

Removo da página de parceiros:

- KPIs **Total Open MRR**, **Active partners**, **Avg maturity**
- Card **Top partners by Open MRR** (gráfico de barras)
- Card **Right now / Health Snapshot** (composição Scaling/Developing/Churn Risk)

`/partners` fica focado em **operação** (header, briefing, qualification queue, growth initiatives, roster + bulk actions). Os atalhos de filtro do briefing (`Review N Churn Risk`, `Qualify N leads`, `N overdue`) ficam lá — são ações, não análise.

Adiciono no header: aviso curto **"Métricas e relatórios mudaram para a aba Reports →"** que some depois do primeiro clique (localStorage).

---

## 2. Nova rota `/reports`

Arquivo: `src/routes/reports.tsx`. Layout:

```text
┌────────────────────────────────────────────────────────────┐
│ Reports                            [+ Custom report (soon)] │
│ Análise do seu portfólio. Filtre, edite, exporte.          │
├────────────────────────────────────────────────────────────┤
│ ▣ Filtros globais (aplicam a todos os relatórios)          │
│   View: My / All   PDM: ▾   Tipo: ▾   Status: ▾            │
│   Tier: ▾   Período (criação): ▾   [Reset]                 │
├────────────────────────────────────────────────────────────┤
│ Tabs:  Overview  ·  Revenue  ·  Health  ·  Maturity  ·     │
│        Pipeline  ·  Mix                                     │
└────────────────────────────────────────────────────────────┘
```

Filtros globais ficam num `useReducer` central (`useReportFilters`) e podem ser sobrescritos por relatório individual (cada card tem um botão "Customizar este" que abre um popover de filtros locais).

---

## 3. Os 6 relatórios prontos

Todos derivados de `partners` + `partner_metrics` + `assessments` + `partner_leads` (dados reais que já temos). Cada um em seu próprio componente em `src/components/reports/`.

### a. **Overview** (tab default)
Os 3 KPIs (Total Open MRR, Active partners, Avg maturity) + composição de status (a barra Candy) + sparkline "Partners criados nos últimos 6 meses" (count por mês de `partners.created_at`).

### b. **Revenue — Top partners by Open MRR**
O gráfico de barras Candy que já temos, agora com:
- Slider "Top N" (5 / 10 / 20 / Todos)
- Toggle de métrica: **MRR · Revenue total · Won deals value · Open deals value**
- Tabela embaixo com os mesmos dados (Partner · PDM · Tipo · MRR · Revenue · Maturity)

### c. **Health — Distribuição de status por PDM**
Barras horizontais empilhadas, **uma linha por PDM**, segmentos = Scaling / Developing / Churn Risk / Paused / Archived. Permite ver de relance "quem tem mais churn risk concentrado".

### d. **Maturity — Médias por dimensão**
Barras verticais com a média de cada eixo OCTA (8 barras) cruzando todos os parceiros filtrados. Toggle "Comparar com": nenhum / outro PDM / outro tier / período anterior. Mostra quais dimensões o portfólio inteiro está fraco — input pro Copilot.

### e. **Pipeline — Funil de qualificação de leads**
Funil horizontal com os stages: **New → In Review → Approved → Rejected**. Conta leads de `partner_leads` por status. Mostra também **conversion rate** (Approved / total) e **tempo médio em cada stage** (delta entre `created_at` e `updated_at` agrupado por status atual).

### f. **Mix — Composição do portfólio**
Dois gráficos lado a lado:
- **Por tipo** (Referral / Reseller / Expert) — donut Candy com %
- **Por tier** (Strategic / Core / Emerging / Long tail) — donut Candy com %

Cada slice clicável vira filtro global ("Mostre só Resellers Strategic").

---

## 4. Filtros editáveis (escopo desta entrega)

Globais, no topo de `/reports`:

| Filtro | Opções |
|---|---|
| View | My partners / All partners (só se leadership) |
| PDM | All / cada PDM do roster |
| Tipo | All / Referral / Reseller / Expert |
| Status | All / Scaling / Developing / Churn Risk / Paused / Archived |
| Tier | All / Strategic / Core / Emerging / Long tail |
| Período (created_at) | Last 30d / 90d / 6m / 12m / All time / Custom (date picker) |

Cada relatório individual ganha um ícone "⚙ Customize" que abre um popover com filtros específicos do relatório (ex: o Revenue ganha o seletor de métrica + Top N; o Maturity ganha o "comparar com").

---

## 5. Export CSV + PNG

Cada card de relatório tem botões `Export CSV` e `Export PNG` no canto superior direito.

- **CSV**: monto a partir do dataset filtrado em memória (não chamo SSR). Helper `downloadCsv(filename, rows)` em `src/lib/report-export.ts` — sem dependência nova.
- **PNG**: uso `html-to-image` (lib pequena, ~10kb gzip, sem dependências nativas, funciona em Worker SSR porque só roda no client). `downloadPng(nodeRef, filename)`.

Bun add: `html-to-image`.

---

## 6. Componentes reutilizáveis criados (preparam o builder)

Já estruturo de um jeito que o "builder configurável" do próximo prompt seja só plugar uma config:

- `src/lib/reports/use-report-filters.ts` — reducer + hook dos filtros globais.
- `src/lib/reports/aggregations.ts` — funções puras: `groupBy`, `sumBy`, `avgBy`, `byStatus`, `byPdm`, `byType`, `byTier`, `byMonth`, `axisAverages`. Cada uma recebe `scoped` + `revenueMap` e devolve dados prontos pra chart.
- `src/components/reports/ReportCard.tsx` — wrapper com título, descrição, botão Customize, Export CSV, Export PNG, e `forwardRef` pro export.
- `src/components/reports/ReportFiltersBar.tsx` — barra de filtros globais.
- `src/components/ui/candy-charts.tsx` (já existe) — adiciono `CandyDonut` e `CandyHorizontalBars` (mesma linguagem visual da `CandyBarChart`).

No próximo prompt, o builder vira um `<ReportCard>` que recebe `{ metric, dimension, chartType, filters }` e usa `aggregations.ts` pra montar tudo.

---

## 7. Header: link da nova aba

Em `src/routes/__root.tsx`, adiciono entre Qualification e My Performance:

```tsx
<Link to="/reports" className="..." activeProps={{ ... }}>Reports</Link>
```

---

## Arquivos tocados / criados

**Criados**
- `src/routes/reports.tsx`
- `src/components/reports/ReportCard.tsx`
- `src/components/reports/ReportFiltersBar.tsx`
- `src/components/reports/OverviewReport.tsx`
- `src/components/reports/RevenueReport.tsx`
- `src/components/reports/HealthByPdmReport.tsx`
- `src/components/reports/MaturityReport.tsx`
- `src/components/reports/PipelineReport.tsx`
- `src/components/reports/MixReport.tsx`
- `src/lib/reports/use-report-filters.ts`
- `src/lib/reports/aggregations.ts`
- `src/lib/report-export.ts`

**Editados**
- `src/routes/__root.tsx` — link "Reports" no header
- `src/routes/partners.tsx` — remove KPIs, Top MRR e Health Snapshot; adiciona aviso "Métricas mudaram para Reports"
- `src/components/ui/candy-charts.tsx` — adiciona `CandyDonut` e `CandyHorizontalBars`

**Dependência nova**
- `html-to-image` (export PNG)

Sem mudanças de DB. Quando você subir as planilhas no próximo passo, a gente apenas cria um `partners-import` server function que faz upsert em `partners` + `partner_metrics` — os relatórios pegam automaticamente porque já leem dessas tabelas.
