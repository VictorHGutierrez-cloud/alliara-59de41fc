
# Reestruturar a landing como home institucional

A página inicial vira um site de verdade: o vídeo dinâmico fica só como pano de fundo do topo, o texto "We exist to…" passa para uma seção própria sobre fundo claro, e logo abaixo aparecem previews reais do que o usuário vê depois do sign in (Portfólio de Parceiros, os 8 Eixos OCTA, e o Joint Business Plan que já existe).

## Nova estrutura da home (`src/routes/index.tsx`)

```text
┌─────────────────────────────────────────┐
│ 1. HERO VIDEO (full-bleed, 100vh)       │
│    Vídeo + overlay escuro                │
│    Apenas CTA "Sign in" + "Create acc." │
│    (sem texto grande, sem typewriter)   │
├─────────────────────────────────────────┤
│ 2. MANIFESTO (fundo claro #F7F7F8)      │
│    "We exist                             │
│     to [partner / co-create / …]"       │
│    (typewriter em rosa #EC1E79)         │
├─────────────────────────────────────────┤
│ 3. PREVIEW — Portfolio                   │
│    "Every partner in one command center"│
│    Mockup de cards de parceiros          │
├─────────────────────────────────────────┤
│ 4. PREVIEW — 8 Eixos OCTA                │
│    "Diagnose maturity across 8 axes"    │
│    Grid 4×2 dos eixos (de AXES)          │
├─────────────────────────────────────────┤
│ 5. PREVIEW — Joint Business Plan         │
│    (o AgentPlan que já está lá)          │
├─────────────────────────────────────────┤
│ 6. CTA final + footer leve               │
└─────────────────────────────────────────┘
```

## Mudanças por seção

### 1. Hero (vídeo)
- Manter `PrismaHero` com `videoSrc`, mas remover `headlineNode` e `description`.
- Aumentar opacidade do overlay escuro (`overlayOpacity` ~0.45) para o vídeo respirar mais — não precisa mais "esconder" texto pesado.
- Manter os dois CTAs (Sign in / Create your account) centralizados ou no canto inferior esquerdo.

### 2. Manifesto (typewriter)
- Nova seção logo abaixo do hero, fundo `bg-[#F7F7F8]` (cinza/branco).
- Texto grande (`text-5xl sm:text-7xl`), preto:
  - Linha 1: `We exist`
  - Linha 2: `to <Typewriter rosa>` com a lista atual de palavras.
- Padding generoso (`py-32`), centralizado.

### 3. Preview — Portfolio de Parceiros
- Mock estático (sem chamar Supabase) com 3–4 cards de parceiros fake mostrando: nome, tipo (Reseller/ISV/SI), tier color, score OCTA, status.
- Reusar tokens visuais de `partners.tsx` (tier color, status label) mas com dados hardcoded — é uma vitrine, não a tela real.
- Título: "Every partner, in one command center."
- Subtítulo curto explicando o que é o portfólio.

### 4. Preview — 8 Eixos OCTA
- Importar `AXES` de `@/content/octa`.
- Grid 4×2 (responsive: 2×4 no mobile) com um card por eixo mostrando: letra grande (S/T/E/…), nome, tagline, ícone Lucide pelo nome em `axis.icon`, cor pelo token `octa-N`.
- Título: "Eight axes. One operating system."
- Subtítulo: explica que cada parceiro é avaliado em 8 dimensões de maturidade.

### 5. Preview — Joint Business Plan
- Manter o `DemoTasks` / `AgentPlan` já existente, com label de seção atualizado para "Every partner gets their own Joint Business Plan."

### 6. CTA final
- Faixa simples com fundo escuro, headline curto ("Ready to orchestrate your ecosystem?") e botão "Create your account" → `/signup`.

## Detalhes técnicos

- Arquivo principal a alterar: `src/routes/index.tsx`.
- Ajuste pequeno em `src/components/ui/prisma-hero.tsx`: permitir esconder completamente o bloco de texto quando `headlineNode` e `description` forem nulos (apenas CTAs ficam visíveis), e centralizar verticalmente CTAs no hero.
- Sem mudanças no header (`__root.tsx`) — já está com fundo branco e logo grande.
- Sem novas dependências, sem chamadas a Supabase nas previews (são mocks visuais).
- Usar `lucide-react` dinamicamente para o grid de eixos:
  ```ts
  import * as Icons from "lucide-react";
  const Icon = (Icons as any)[axis.icon] ?? Icons.Circle;
  ```
- Cores dos eixos: usar as CSS vars `--octa-1`…`--octa-8` que já existem no tema.
- Rosa do logo já está em uso (`#EC1E79`) — manter para o typewriter e como accent nas seções.

## O que NÃO muda
- Header, logo, autenticação, rotas internas (`/partners`, `/dashboard`, etc.).
- Componente `Typewriter` e `AgentPlan`.
- Nenhuma lógica de backend.
