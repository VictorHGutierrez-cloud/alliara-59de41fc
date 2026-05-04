## Goal

Pegar os elementos mais bonitos do componente de referência (área empilhada com gradientes, gridlines suaves, lista de métricas com ícones + setinhas de tendência) e trazê-los para os Reports — mantendo o visual "candy" atual e **sem instalar `reaviz`** (é pesado, traz d3 inteiro e quebra em SSR). Vamos reproduzir tudo com `recharts` + SVG, que já usamos.

## O que vamos adicionar

### 1. Novo gráfico: `CandyStackedArea` em `src/components/ui/candy-charts.tsx`
Área empilhada estilo o componente de referência, com:
- gradientes verticais por série (rosa pastel → magenta → vinho, mas usando tokens `var(--primary)`, `var(--secondary)`, `var(--octa-4)` etc.)
- linhas de topo finas, gridlines tracejadas suaves (igual ao `CandyBarChart`)
- tooltip glassy candy (reaproveitando o estilo já existente)
- legenda compacta com bolinhas coloridas
- animação de entrada (`isAnimationActive`)
- empty-state coerente com os outros charts

API:
```ts
CandyStackedArea({
  data: { label: string; [seriesKey: string]: number | string }[],
  series: { key: string; label: string; color: string }[],
  height?: number,
  valueFormatter?: (n: number) => string,
})
```

### 2. Nova seção "Trend" no `OverviewReport`
Hoje o Overview tem KPIs + composição + barras "partners added". Vamos:
- **manter** os 3 KPIs e a composição
- **substituir** o bar chart "Partners added · last 6 months" por uma **área empilhada de 6 meses** mostrando: `Scaling`, `Developing`, `Churn Risk` (snapshot do status dos partners criados em cada mês).
- Nova função em `aggregations.ts`: `statusTrendByMonth(items, months)` que retorna `[{ label, active, nurturing, at_risk }]`.

Isso mostra crescimento **e** saúde ao longo do tempo — muito mais útil que só contagem.

### 3. KPI tiles no estilo "métricas detalhadas" do componente de referência
Criar um novo componente `KpiTile` (em `src/components/reports/KpiTile.tsx`) que substitui o `Kpi` inline atual:
- ícone colorido à esquerda (`lucide-react`: `TrendingUp`, `Users`, `Sparkles`, `DollarSign`)
- label + valor grande
- badge de tendência (▲ verde / ▼ vermelho) com delta vs período anterior
- hover sutil (scale + sombra rosada)
- animação de entrada com `framer-motion` (já está no projeto)

Aplicar nos Overview KPIs e reaproveitar onde fizer sentido (ex.: Pipeline e Revenue podem ganhar uma linha de KPIs no topo também).

### 4. Aplicar o novo chart em outro lugar útil
- **PipelineReport**: adicionar uma área empilhada "Leads por mês × status" acima do funil atual (usando `leadTrendByMonth` — nova função agregadora).

## Arquivos a editar/criar

**Editar:**
- `src/components/ui/candy-charts.tsx` — adicionar `CandyStackedArea`
- `src/lib/reports/aggregations.ts` — adicionar `statusTrendByMonth` e `leadTrendByMonth`
- `src/components/reports/OverviewReport.tsx` — usar `KpiTile` + trocar bar chart por área empilhada
- `src/components/reports/PipelineReport.tsx` — adicionar bloco de tendência

**Criar:**
- `src/components/reports/KpiTile.tsx` — tile reutilizável com ícone + delta + animação

## Decisões técnicas

- **Sem `reaviz`**: usamos `recharts` (`AreaChart`, `Area`, `defs`/`linearGradient`) que já está em uso. Mesma feel visual, zero peso extra.
- **`framer-motion`** já está instalado (foi adicionado no Dock). Sem novas deps.
- Cores continuam vindo dos tokens CSS (`var(--primary)`, `var(--success)`, `var(--warning)`, `var(--destructive)`) para manter consistência com o resto do app e respeitar a paleta candy.
- Tudo continua exportável via os botões CSV/PNG do `ReportCard` existente — sem mudar o framework de export.

## Fora de escopo (proposta para depois, se gostar)
- Trocar o donut por um "ring chart" com microanimações de pulse
- Adicionar sparklines mini dentro de cada `KpiTile`

Quer que eu execute esse plano?
