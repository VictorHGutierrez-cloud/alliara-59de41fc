import type { KeptIllustrationVariant } from "@/components/brand/KeptIllustration";

export interface OnboardingStep {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  variant: KeptIllustrationVariant;
  cta?: { label: string; to: string };
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    index: 1,
    eyebrow: "Bem-vindo",
    title: "Bem-vindo à Alliara",
    summary:
      "Alliara é o cockpit do Partner Development Manager. Aqui você organiza parceiros, qualifica leads, mede maturidade, planeja ações e acompanha resultados — com o Kept, seu copiloto, sempre por perto.",
    bullets: [
      "Pensado para PDMs que tocam um portfólio de parceiros.",
      "Cada tela existe pra te dar mais clareza ou tirar trabalho repetitivo.",
      "Você pode voltar neste tour quando quiser.",
    ],
    variant: "bringsCalm",
  },
  {
    id: "kept",
    index: 2,
    eyebrow: "Seu copiloto",
    title: "Conheça o Kept",
    summary:
      "Kept é o assistente que vive no canto da tela. Clique no ícone dele para abrir o tour de apresentação ou perguntar qualquer coisa — desde 'como está o parceiro X?' até estratégia de co-sell.",
    bullets: [
      "Ele conhece o seu portfólio: pode falar de parceiros pelo nome.",
      "Use para tirar dúvidas, pedir ideias, revisar uma decisão.",
      "Responde no seu idioma, sem jargão corporativo.",
    ],
    variant: "keepsContext",
    cta: { label: "Faça uma pergunta agora", to: "/kept/ask" },
  },
  {
    id: "portfolio",
    index: 3,
    eyebrow: "Portfolio",
    title: "Seu portfólio de parceiros",
    summary:
      "Em Partners você cadastra cada parceiro com tier, status, tipo e stakeholders (PAE e PMM). É a base de tudo: assessments, planos e reports olham pra cá.",
    bullets: [
      "Crie um parceiro com nome, empresa e tipo (referral, reseller, etc).",
      "Adicione PAE (Partner Account Executive) e PMM (Partner Marketing Manager).",
      "Você pode mandar email pros stakeholders direto da ficha.",
    ],
    variant: "remindsGently",
    cta: { label: "Abrir Portfolio", to: "/partners" },
  },
  {
    id: "qualification",
    index: 4,
    eyebrow: "Qualificação",
    title: "Qualificação de leads",
    summary:
      "Antes de virar parceiro, todo lead passa pela qualificação. Você pontua fit, expertise e capacidade de venda — e decide se promove para parceiro ativo.",
    bullets: [
      "Centralize quem está no funil de novos parceiros.",
      "Pontue de forma consistente, do mesmo jeito pra todo mundo.",
      "Promova para a ficha de parceiro com um clique.",
    ],
    variant: "keepsContext",
    cta: { label: "Abrir Qualificação", to: "/qualification" },
  },
  {
    id: "diagnostic",
    index: 5,
    eyebrow: "Diagnóstico",
    title: "Mapa de maturidade do parceiro",
    summary:
      "Para cada parceiro, você roda um diagnóstico em 8 eixos (relacionamento, enablement, marketing, vendas, operação, etc). O resultado mostra onde investir energia.",
    bullets: [
      "Pontue cada eixo de 1 a 5 com base em evidência, não em achismo.",
      "Você pode rodar o diagnóstico de novo no futuro pra medir evolução.",
      "Os resultados alimentam o Coach e os Reports.",
    ],
    variant: "noticesDrift",
  },
  {
    id: "plan",
    index: 6,
    eyebrow: "Plano de ação",
    title: "Tarefas e prioridades",
    summary:
      "Em Plan você cria tarefas para cada parceiro: o que fazer, prioridade, prazo. É a sua agenda de partner-success — e o que aparece no resumo de portfolio.",
    bullets: [
      "Edite qualquer tarefa quando o contexto muda.",
      "Use prioridade e prazo pra trazer foco na semana.",
      "Marque como concluída quando entregar.",
    ],
    variant: "jbpStanding",
  },
  {
    id: "coach",
    index: 7,
    eyebrow: "Coach (IA)",
    title: "Recomendações com IA",
    summary:
      "O Coach lê o diagnóstico do parceiro e gera recomendações específicas. Você revisa, salva o que faz sentido e descarta o resto — nada vira tarefa sem o seu OK.",
    bullets: [
      "Use depois de cada novo diagnóstico.",
      "Salve recomendações boas como histórico de guidance.",
      "Você manda na decisão final, sempre.",
    ],
    variant: "contextBeforeCall",
  },
  {
    id: "intel",
    index: 8,
    eyebrow: "Intel & Métricas",
    title: "Sinais e números do parceiro",
    summary:
      "Intel guarda snapshots e dados qualitativos. Métricas guarda os números (revenue, deals abertos, deals fechados, treinados). Juntos, dão o pulso real do parceiro.",
    bullets: [
      "Atualize métricas quando fechar um período.",
      "Use Intel pra registrar o que aprendeu na call.",
      "Esses dados aparecem nos Reports.",
    ],
    variant: "notifySomethingToCheck",
  },
  {
    id: "reports",
    index: 9,
    eyebrow: "Reports",
    title: "Visão de portfolio e liderança",
    summary:
      "Reports junta tudo num só lugar: maturidade média, mix de tier, pipeline, revenue, saúde por PDM. Útil pra você e essencial pra liderança.",
    bullets: [
      "Filtre por período, tier, status e tipo.",
      "Exporte quando precisar mandar pra alguém.",
      "Liderança vê o consolidado de todos os PDMs.",
    ],
    variant: "radarLooking",
    cta: { label: "Abrir Reports", to: "/reports" },
  },
  {
    id: "certification",
    index: 10,
    eyebrow: "Certificação",
    title: "Emitindo certificados",
    summary:
      "Quando o parceiro conclui a jornada, você gera um certificado oficial com logo da Factorial (e logo do parceiro, se quiser). Bonito, pronto pra entregar.",
    bullets: [
      "Logo da Factorial vem por padrão.",
      "Você pode adicionar o logo do parceiro ao lado.",
      "Cada certificado tem ID único.",
    ],
    variant: "bringsCalm",
  },
  {
    id: "ready",
    index: 11,
    eyebrow: "Pronto",
    title: "Você está pronto pra começar",
    summary:
      "Esse é o ciclo: cadastrar parceiro → diagnosticar → planejar → executar → medir → repetir. O Kept está aqui pra te ajudar em qualquer ponto.",
    bullets: [
      "Comece criando seu primeiro parceiro (ou abra um existente).",
      "Pergunte ao Kept sempre que travar.",
      "Volte neste tour quando quiser revisar algo.",
    ],
    variant: "everythingOnTrack",
    cta: { label: "Ir para Portfolio", to: "/partners" },
  },
];

export const ONBOARDING_PROGRESS_KEY = "alliara-onboarding-progress";