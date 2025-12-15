// ===============================
// Simulador Político 6.x — script.js (COMPLETO)
// Correções:
// - Fundos por cargo usando IDs (municipal/assembly/...)
// - Classe do #game-screen atualizada conforme cargo (combina com seu CSS)
// - Base de simulação mais “real”: blocos do Congresso, grupos sociais, mídia e eventos
// - Salvamento compatível (mantém progresso e adiciona novos campos)
// ===============================

const STORAGE_KEY = "simuladorPoliticoSave_v7";

// -------------------------------
// ESTADO
// -------------------------------
let state = {
  // perfil
  name: "",
  party: null,

  // carreira
  officeIndex: 0,
  week: 1,
  year: 2025,

  // HUD (0–100)
  popularity: 50,
  funds: 50,
  integrity: 50,

  // camadas de simulação (0–100)
  congressSupport: 45, // apoio médio no legislativo (importa muito no executivo)
  mediaTone: 50,       // 0 muito hostil — 100 muito favorável
  economy: 50,         // sensação econômica (emprego, inflação, confiança)
  security: 50,        // sensação de segurança pública
  services: 50,        // saúde/educação/serviços
  scandals: 0,         // risco/pressão por escândalos (0–100)

  // grupos sociais (0–100) — afetam popularidade, mídia e eleição
  groups: {
    baixaRenda: 50,
    classeMedia: 50,
    empresariado: 50,
    funcionalismo: 50,
    jovens: 50,
    religiosos: 50,
    agro: 50,
  },

  // flags e histórico
  lastMajorDecision: "",
  timeline: [],
};

// -------------------------------
// CARGOS / FUNDOS (IDs para CSS)
// -------------------------------
const offices = [
  { id: "municipal", name: "Vereador", bg: "assets/municipal.png", type: "legislative" },
  { id: "assembly", name: "Deputado Estadual", bg: "assets/assembly.png", type: "legislative" },
  { id: "federal", name: "Deputado Federal", bg: "assets/federal.png", type: "legislative" },
  { id: "senate", name: "Senador", bg: "assets/senate.png", type: "legislative" },
  { id: "mayor", name: "Prefeito", bg: "assets/mayor.png", type: "executive" },
  { id: "governor", name: "Governador", bg: "assets/governor.png", type: "executive" },
  { id: "president", name: "Presidente", bg: "assets/president.png", type: "executive" },
];

const parties = [
  { id: "PRP", label: "PRP", name: "Partido Renovador Popular", className: "party-prp" },
  { id: "PSLB", label: "PSLB", name: "Partido Social Liberal do Brasil", className: "party-pslb" },
  { id: "PTM", label: "PTM", name: "Partido Trabalhista Moderno", className: "party-ptm" },
  { id: "PVG", label: "PVG", name: "Partido Verde Global", className: "party-pvg" },
  { id: "MDBR", label: "MDBR", name: "Movimento Democrático Brasileiro", className: "party-mdbr" },
];

// Tom e tema de campanha (mantém seu modal)
const tones = [
  { id: "populista", label: "Populista", popularity: +8, integrity: -6, media: -2, congress: +1, description: "Fala para as massas, promete muito." },
  { id: "progressista", label: "Progressista", popularity: +5, integrity: +1, media: +1, congress: -1, description: "Defende pautas sociais e direitos." },
  { id: "conservador", label: "Conservador", popularity: +3, integrity: +2, media: 0, congress: +2, description: "Foco em segurança e valores tradicionais." },
  { id: "tecnico", label: "Técnico", popularity: +2, integrity: +5, media: +2, congress: 0, description: "Discurso baseado em dados e gestão." },
];

const themes = [
  { id: "economia", label: "Economia", effect: +4, econ: +6, services: -1, security: 0 },
  { id: "saude", label: "Saúde", effect: +3, econ: -1, services: +6, security: 0 },
  { id: "educacao", label: "Educação", effect: +3, econ: 0, services: +5, security: 0 },
  { id: "seguranca", label: "Segurança", effect: +4, econ: -1, services: -1, security: +7 },
  { id: "meio-ambiente", label: "Meio Ambiente", effect: +2, econ: -1, services: +1, security: 0 },
];

// -------------------------------
// ELEMENTOS
// -------------------------------
const screens = {
  start: document.getElementById("start-screen"),
  selection: document.getElementById("selection-screen"),
  game: document.getElementById("game-screen"),
  election: document.getElementById("election-screen"),
};

const newGameBtn = document.getElementById("new-game-btn");
const continueBtn = document.getElementById("continue-btn");
const backToStartBtn = document.getElementById("back-to-start-btn");
const confirmSelectionBtn = document.getElementById("confirm-selection-btn");

const partyListDiv = document.getElementById("party-list");
const playerNameInput = document.getElementById("player-name");

const gameScreen = document.getElementById("game-screen");
const playerInfoText = document.getElementById("player-info-text");
const officeText = document.getElementById("office-text");
const statPopularity = document.getElementById("stat-popularity");
const statFunds = document.getElementById("stat-funds");
const statIntegrity = document.getElementById("stat-integrity");
const actionsDiv = document.getElementById("actions");
const feedDiv = document.getElementById("feed");
const resetBtn = document.getElementById("reset-btn");

// Modal genérico
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalOptionsDiv = document.getElementById("modal-options");

// Campanha
const campaignOverlay = document.getElementById("campaign-overlay");
const toneOptionsDiv = document.getElementById("tone-options");
const themeOptionsDiv = document.getElementById("theme-options");
const startCampaignBtn = document.getElementById("start-campaign-btn");
const cancelCampaignBtn = document.getElementById("cancel-campaign-btn");

// Eleição
const electionTitle = document.getElementById("election-title");
const electionSubtitle = document.getElementById("election-subtitle");
const candidateBar = document.getElementById("candidate-bar");
const opponentBar = document.getElementById("opponent-bar");
const candidatePercentSpan = document.getElementById("candidate-percent");
const opponentPercentSpan = document.getElementById("opponent-percent");
const electionResultText = document.getElementById("election-result-text");
const electionContinueBtn = document.getElementById("election-continue-btn");

// -------------------------------
// UTIL
// -------------------------------
function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}
function rnd(min, max) {
  return Math.random() * (max - min) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function formatTime() {
  return `Semana ${state.week}/${state.year}`;
}

// -------------------------------
// TELAS
// -------------------------------
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// -------------------------------
// SALVAMENTO
// -------------------------------
function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.name || parsed.officeIndex == null) return null;

    // merge compatível (para versões antigas)
    state = {
      ...state,
      ...parsed,
      groups: { ...state.groups, ...(parsed.groups || {}) },
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
    };

    // re-hidratar party pelo id (se vier só id)
    if (parsed.party?.id) {
      const p = parties.find((x) => x.id === parsed.party.id) || parsed.party;
      state.party = p;
    }

    return state;
  } catch (e) {
    console.error("Erro ao carregar save:", e);
    return null;
  }
}

function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
}

function updateContinueVisibility() {
  const hasSave = !!localStorage.getItem(STORAGE_KEY);
  continueBtn.style.display = hasSave ? "inline-block" : "none";
}

// -------------------------------
// FEED / TIMELINE
// -------------------------------
function addFeed(message) {
  const p = document.createElement("p");
  p.textContent = message;
  feedDiv.prepend(p);
}

function logTimeline(type, text) {
  state.timeline.unshift({ t: Date.now(), time: formatTime(), type, text });
  // manter tamanho saudável
  if (state.timeline.length > 200) state.timeline.length = 200;
}

// -------------------------------
// VISUAL: FUNDO POR CARGO (classe no #game-screen)
// -------------------------------
function syncOfficeVisual() {
  const office = offices[state.officeIndex];
  // IMPORTANTÍSSIMO: casa com o CSS que você colocou (ex: #game-screen.municipal { ... })
  gameScreen.className = `screen active ${office.id}`;
}

// -------------------------------
// SIMULAÇÃO: RECOMPUTAR POPULARIDADE (do mundo real para HUD)
// -------------------------------
function recomputePopularity() {
  const g = state.groups;

  // média ponderada simples (ajuste fino depois)
  const groupsAvg =
    g.baixaRenda * 0.18 +
    g.classeMedia * 0.18 +
    g.empresariado * 0.14 +
    g.funcionalismo * 0.14 +
    g.jovens * 0.12 +
    g.religiosos * 0.12 +
    g.agro * 0.12;

  // efeitos macro
  const macro =
    state.economy * 0.22 +
    state.services * 0.16 +
    state.security * 0.10 +
    state.mediaTone * 0.10 +
    state.congressSupport * 0.06;

  // escândalos penalizam mais quando integridade é baixa
  const scandalPenalty = (state.scandals * (110 - state.integrity)) / 220;

  const base = (groupsAvg * 0.58 + macro * 0.42) - scandalPenalty;

  state.popularity = clamp(Math.round(base), 0, 100);
}

// -------------------------------
// HUD
// -------------------------------
function updateHeader() {
  const office = offices[state.officeIndex];

  recomputePopularity();
  syncOfficeVisual();

  playerInfoText.textContent = `${state.name} — Partido ${state.party?.id ?? ""} • ${formatTime()}`;
  officeText.textContent = office.name;

  statPopularity.textContent = state.popularity;
  statFunds.textContent = state.funds;
  statIntegrity.textContent = state.integrity;
}

// -------------------------------
// TURNO / TEMPO + EVENTOS
// -------------------------------
function advanceTime(weeks = 1) {
  for (let i = 0; i < weeks; i++) {
    state.week += 1;
    if (state.week > 52) {
      state.week = 1;
      state.year += 1;
    }

    // drift natural (o mundo muda)
    state.economy = clamp(state.economy + rnd(-1.5, 1.2));
    state.security = clamp(state.security + rnd(-1.2, 1.0));
    state.services = clamp(state.services + rnd(-1.0, 1.2));

    // mídia tende ao centro, mas reage a integridade/escândalo
    const mediaPull = (50 - state.mediaTone) * 0.06;
    state.mediaTone = clamp(state.mediaTone + mediaPull - state.scandals * 0.01 + (state.integrity - 50) * 0.01);

    // escândalo: cresce se integridade baixa e muita grana usada
    state.scandals = clamp(state.scandals + (50 - state.integrity) * 0.03 + rnd(-0.8, 1.2));

    // evento aleatório com chance semanal
    const baseEventChance = 0.22; // 22% por semana (ajustável)
    if (Math.random() < baseEventChance) {
      triggerRandomEvent();
    }
  }

  updateHeader();
  saveGame();
}

function triggerRandomEvent() {
  const office = offices[state.officeIndex];
  const isExec = office.type === "executive";

  const events = [
    {
      id: "pressao_imprensa",
      title: "Imprensa pressiona",
      text: "Uma reportagem de grande alcance questiona decisões recentes.",
      apply: () => {
        state.mediaTone = clamp(state.mediaTone - rnd(3, 9));
        state.integrity = clamp(state.integrity - rnd(1, 4));
        state.scandals = clamp(state.scandals + rnd(2, 6));
        addFeed("URGENTE: Imprensa aumenta pressão. Sua imagem sofre.");
        logTimeline("evento", "Imprensa pressiona e eleva risco de escândalo.");
      },
    },
    {
      id: "boa_notícia_economia",
      title: "Alívio econômico",
      text: "Indicadores melhoram e aumentam a confiança no mercado.",
      apply: () => {
        state.economy = clamp(state.economy + rnd(4, 10));
        state.groups.empresariado = clamp(state.groups.empresariado + rnd(2, 6));
        state.groups.classeMedia = clamp(state.groups.classeMedia + rnd(1, 5));
        addFeed("Boas notícias: economia dá sinais de melhora.");
        logTimeline("evento", "Economia melhora e reforça confiança.");
      },
    },
    {
      id: "onda_criminalidade",
      title: "Crise de segurança",
      text: "Aumento de ocorrências e sensação de insegurança.",
      apply: () => {
        state.security = clamp(state.security - rnd(5, 12));
        state.groups.classeMedia = clamp(state.groups.classeMedia - rnd(2, 6));
        state.mediaTone = clamp(state.mediaTone - rnd(2, 6));
        addFeed("ALERTA: crise de segurança domina o noticiário.");
        logTimeline("evento", "Crise de segurança reduz confiança.");
      },
    },
    {
      id: "greve_funcionalismo",
      title: "Greve do funcionalismo",
      text: "Categoria pressiona por reajustes e melhores condições.",
      apply: () => {
        state.groups.funcionalismo = clamp(state.groups.funcionalismo - rnd(6, 12));
        state.services = clamp(state.services - rnd(2, 6));
        if (isExec) state.congressSupport = clamp(state.congressSupport - rnd(1, 4));
        addFeed("Greve: serviços públicos sofrem e pressão aumenta.");
        logTimeline("evento", "Greve reduz serviços e tensiona governo.");
      },
    },
    {
      id: "rumor_corrupcao",
      title: "Rumor de corrupção",
      text: "A oposição levanta suspeitas e pede apuração.",
      apply: () => {
        state.scandals = clamp(state.scandals + rnd(6, 14));
        state.mediaTone = clamp(state.mediaTone - rnd(3, 8));
        state.integrity = clamp(state.integrity - rnd(2, 6));
        addFeed("Oposição acusa: rumores de corrupção ganham força.");
        logTimeline("evento", "Rumor de corrupção eleva escândalos.");
      },
    },
    {
      id: "articulacao_congresso",
      title: "Articulação política",
      text: "Centrão sinaliza abertura para diálogo e apoio pontual.",
      apply: () => {
        state.congressSupport = clamp(state.congressSupport + rnd(4, 10));
        state.funds = clamp(state.funds - rnd(1, 4)); // custo de articulação
        addFeed("Bastidores: articulação melhora apoio no Congresso.");
        logTimeline("evento", "Articulação melhora apoio no Congresso.");
      },
    },
  ];

  // eventos executivos adicionais
  if (isExec) {
    events.push(
      {
        id: "chuvas_desastre",
        title: "Desastre natural",
        text: "Chuvas intensas exigem resposta rápida e recursos.",
        apply: () => {
          state.funds = clamp(state.funds - rnd(6, 12));
          state.services = clamp(state.services - rnd(2, 6));
          // boa resposta aumenta grupos populares
          if (Math.random() < 0.55) {
            state.groups.baixaRenda = clamp(state.groups.baixaRenda + rnd(2, 7));
            state.mediaTone = clamp(state.mediaTone + rnd(1, 5));
            addFeed("Resposta rápida: governo ganha pontos com a população afetada.");
            logTimeline("evento", "Desastre: resposta rápida melhora percepção.");
          } else {
            state.groups.baixaRenda = clamp(state.groups.baixaRenda - rnd(4, 9));
            state.mediaTone = clamp(state.mediaTone - rnd(2, 6));
            addFeed("Críticas: resposta lenta ao desastre gera desgaste.");
            logTimeline("evento", "Desastre: resposta lenta gera desgaste.");
          }
        },
      }
    );
  }

  const ev = pick(events);
  // aplicamos imediatamente, sem modal extra para manter UI simples
  ev.apply();
}

// -------------------------------
// AÇÕES (por cargo)
// -------------------------------
function getActionsForOffice(office) {
  const common = [
    { id: "discurso", label: "Discurso", handler: actionSpeech },
    { id: "campanha", label: "Campanha", handler: openCampaignModal },
    { id: "articular", label: "Articular apoio", handler: actionNegotiateSupport },
  ];

  if (office.type === "legislative") {
    return [
      { id: "votar-projeto", label: "Votar projeto", handler: actionVoteProject },
      { id: "propor-lei", label: "Propor lei", handler: actionProposeLaw },
      { id: "fiscalizar", label: "Fiscalizar", handler: actionInspect },
      ...common,
    ];
  }

  // executivo
  return [
    { id: "sancionar", label: "Sancionar / Vetar", handler: actionSanction },
    { id: "crise", label: "Gerenciar crise", handler: actionCrisis },
    { id: "orcamento", label: "Orçamento", handler: actionBudget },
    { id: "programa", label: "Programa público", handler: actionPublicProgram },
    ...common,
  ];
}

function renderActions() {
  const office = offices[state.officeIndex];
  const actions = getActionsForOffice(office);

  actionsDiv.innerHTML = "";
  actions.forEach((a) => {
    const btn = document.createElement("button");
    btn.className = "btn secondary";
    btn.textContent = a.label;
    btn.addEventListener("click", () => a.handler());
    actionsDiv.appendChild(btn);
  });
}

// -------------------------------
// MODAL GENÉRICO
// -------------------------------
function openModal(title, text, options = []) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  modalOptionsDiv.innerHTML = "";

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = `btn ${opt.type || "secondary"}`;
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      closeModal();
      opt.onClick && opt.onClick();
    });
    modalOptionsDiv.appendChild(btn);
  });

  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
}

// -------------------------------
// APLICAÇÃO DE EFEITOS (DELTA)
// -------------------------------
function applyWorldDelta({
  funds = 0,
  integrity = 0,
  congressSupport = 0,
  mediaTone = 0,
  economy = 0,
  security = 0,
  services = 0,
  scandals = 0,
  groupDelta = {},
  logText = "",
  major = "",
  advanceWeeks = 1,
}) {
  state.funds = clamp(state.funds + funds);
  state.integrity = clamp(state.integrity + integrity);
  state.congressSupport = clamp(state.congressSupport + congressSupport);
  state.mediaTone = clamp(state.mediaTone + mediaTone);
  state.economy = clamp(state.economy + economy);
  state.security = clamp(state.security + security);
  state.services = clamp(state.services + services);
  state.scandals = clamp(state.scandals + scandals);

  Object.keys(groupDelta).forEach((k) => {
    if (state.groups[k] == null) return;
    state.groups[k] = clamp(state.groups[k] + groupDelta[k]);
  });

  if (major) state.lastMajorDecision = major;

  if (logText) {
    addFeed(logText);
    logTimeline("acao", logText);
  }

  advanceTime(Math.max(0, advanceWeeks));
  updateHeader();
  saveGame();
}

// -------------------------------
// AÇÕES LEGISLATIVAS
// -------------------------------
function actionVoteProject() {
  const bills = [
    {
      title: "Reforma de segurança nas escolas",
      yes: {
        effects: { security: +4, mediaTone: +1, congressSupport: +2, groupDelta: { classeMedia: +3, religiosos: +1 } },
        integrity: +1,
      },
      no: {
        effects: { security: -2, mediaTone: -1, groupDelta: { classeMedia: -2, jovens: +1 } },
        integrity: +2,
      },
    },
    {
      title: "Ampliação de programas sociais",
      yes: {
        effects: { services: +5, economy: -1, groupDelta: { baixaRenda: +6, classeMedia: +1 }, mediaTone: +1 },
        integrity: +1,
      },
      no: {
        effects: { services: -2, groupDelta: { baixaRenda: -4, empresariado: +1 }, mediaTone: -1 },
        integrity: +2,
      },
    },
    {
      title: "Incentivo fiscal para indústria",
      yes: {
        effects: { economy: +5, funds: -3, groupDelta: { empresariado: +6, classeMedia: +1 }, mediaTone: +1 },
        integrity: -1,
      },
      no: {
        effects: { economy: -1, groupDelta: { empresariado: -4, baixaRenda: +1 }, mediaTone: -1 },
        integrity: +2,
      },
    },
  ];

  const chosen = pick(bills);

  openModal(
    "Votar projeto",
    `Projeto em pauta: ${chosen.title}. Qual é o seu voto?`,
    [
      {
        label: "Sim",
        type: "primary",
        onClick: () => {
          const passageChance = clamp(45 + state.congressSupport * 0.45 - state.scandals * 0.2, 10, 90) / 100;
          const passed = Math.random() < passageChance;

          if (passed) {
            applyWorldDelta({
              ...chosen.yes.effects,
              integrity: chosen.yes.integrity,
              logText: `Você votou SIM e o projeto passou. (${chosen.title})`,
              major: `Voto SIM: ${chosen.title}`,
              advanceWeeks: 1,
            });
          } else {
            applyWorldDelta({
              congressSupport: -2,
              mediaTone: -1,
              scandals: +1,
              logText: `Você votou SIM, mas o projeto travou no plenário. (${chosen.title})`,
              major: `Voto SIM travado: ${chosen.title}`,
              advanceWeeks: 1,
            });
          }
        },
      },
      {
        label: "Não",
        type: "secondary",
        onClick: () => {
          const passageChance = clamp(40 + state.congressSupport * 0.35, 10, 85) / 100;
          const passedAnyway = Math.random() < passageChance;

          if (passedAnyway) {
            applyWorldDelta({
              ...chosen.no.effects,
              integrity: chosen.no.integrity,
              logText: `Você votou NÃO, mas o projeto passou com outra base. (${chosen.title})`,
              major: `Voto NÃO (passou): ${chosen.title}`,
              advanceWeeks: 1,
            });
          } else {
            applyWorldDelta({
              ...chosen.no.effects,
              integrity: chosen.no.integrity,
              congressSupport: +1,
              logText: `Você votou NÃO e o projeto caiu. (${chosen.title})`,
              major: `Voto NÃO (caiu): ${chosen.title}`,
              advanceWeeks: 1,
            });
          }
        },
      },
    ]
  );
}

function actionProposeLaw() {
  const topics = [
    { name: "Projeto de Saúde Básica", cost: 6, effects: { services: +6, groupDelta: { baixaRenda: +4, funcionalismo: +2 }, mediaTone: +1 }, integrity: +1 },
    { name: "Projeto de Mobilidade Urbana", cost: 5, effects: { economy: +2, services: +2, groupDelta: { classeMedia: +4, jovens: +2 }, mediaTone: +1 }, integrity: +1 },
    { name: "Projeto de Educação Integral", cost: 6, effects: { services: +5, groupDelta: { jovens: +5, classeMedia: +2 }, mediaTone: +1 }, integrity: +2 },
    { name: "Projeto de Segurança Comunitária", cost: 5, effects: { security: +6, groupDelta: { religiosos: +2, classeMedia: +2 }, mediaTone: +1 }, integrity: +1 },
  ];

  const chosen = pick(topics);

  if (state.funds < chosen.cost) {
    addFeed("Você não tem fundos suficientes para articular um novo projeto.");
    logTimeline("sistema", "Tentativa de propor lei sem fundos.");
    return;
  }

  openModal(
    "Propor lei",
    `Apresentar "${chosen.name}"? (custará ${chosen.cost} fundos)`,
    [
      {
        label: "Apresentar",
        type: "primary",
        onClick: () => {
          // custo imediato
          state.funds = clamp(state.funds - chosen.cost);

          // chance depende de apoio + integridade - escândalos
          const chance = clamp(35 + state.congressSupport * 0.55 + state.integrity * 0.10 - state.scandals * 0.30, 10, 90) / 100;
          const approved = Math.random() < chance;

          if (approved) {
            applyWorldDelta({
              ...chosen.effects,
              integrity: chosen.integrity,
              congressSupport: +2,
              logText: `Lei aprovada: ${chosen.name}.`,
              major: `Lei aprovada: ${chosen.name}`,
              advanceWeeks: 2,
            });
          } else {
            applyWorldDelta({
              congressSupport: -3,
              mediaTone: -2,
              scandals: +1,
              logText: `Seu projeto foi rejeitado: ${chosen.name}.`,
              major: `Lei rejeitada: ${chosen.name}`,
              advanceWeeks: 2,
            });
          }
        },
      },
      { label: "Cancelar", type: "secondary" },
    ]
  );
}

function actionInspect() {
  openModal(
    "Fiscalização",
    "Você iniciou uma fiscalização. Encontrou irregularidades?",
    [
      {
        label: "Denunciar",
        type: "primary",
        onClick: () => {
          applyWorldDelta({
            integrity: +5,
            mediaTone: +2,
            congressSupport: -1, // gera atrito
            scandals: -3,        // reduz risco (imagem de rigor)
            groupDelta: { baixaRenda: +2, classeMedia: +2 },
            logText: "Você denunciou irregularidades e ganhou crédito público.",
            major: "Fiscalização com denúncia",
            advanceWeeks: 1,
          });
        },
      },
      {
        label: "Abafar",
        type: "secondary",
        onClick: () => {
          applyWorldDelta({
            integrity: -6,
            funds: +3,
            mediaTone: -3,
            scandals: +8,
            congressSupport: +2,
            groupDelta: { empresariado: +2, classeMedia: -2 },
            logText: "Você abafou o caso. Ganhou recursos, mas aumentou o risco de escândalo.",
            major: "Fiscalização abafada",
            advanceWeeks: 1,
          });
        },
      },
    ]
  );
}

// -------------------------------
// AÇÕES EXECUTIVAS
// -------------------------------
function actionSanction() {
  openModal(
    "Sancionar / Vetar",
    "Chegou um projeto polêmico para decisão. O que você faz?",
    [
      {
        label: "Sancionar",
        type: "primary",
        onClick: () => {
          applyWorldDelta({
            congressSupport: +3,
            mediaTone: +1,
            integrity: -2,
            groupDelta: { empresariado: +3, classeMedia: +1 },
            logText: "Você sancionou o projeto. Ganhou governabilidade, mas sofreu críticas éticas.",
            major: "Sancionou projeto polêmico",
            advanceWeeks: 1,
          });
        },
      },
      {
        label: "Vetar",
        type: "secondary",
        onClick: () => {
          applyWorldDelta({
            congressSupport: -3,
            mediaTone: +1,
            integrity: +4,
            groupDelta: { religiosos: +2, jovens: +1 },
            logText: "Você vetou o projeto. Integridade subiu, mas o Congresso reagiu.",
            major: "Vetou projeto polêmico",
            advanceWeeks: 1,
          });
        },
      },
    ]
  );
}

function actionCrisis() {
  openModal(
    "Gerenciar crise",
    "Uma crise estourou. Como você responde?",
    [
      {
        label: "Coletiva + transparência",
        type: "primary",
        onClick: () => {
          applyWorldDelta({
            funds: -4,
            integrity: +3,
            mediaTone: +3,
            scandals: -4,
            groupDelta: { classeMedia: +2, jovens: +1 },
            logText: "Você enfrentou a crise com transparência e reduziu danos.",
            major: "Crise com transparência",
            advanceWeeks: 1,
          });
        },
      },
      {
        label: "Negar e atacar a mídia",
        type: "secondary",
        onClick: () => {
          applyWorldDelta({
            integrity: -6,
            mediaTone: -6,
            scandals: +4,
            congressSupport: +1, // base aplaude
            groupDelta: { religiosos: +1, classeMedia: -3, jovens: -2 },
            logText: "Você atacou a mídia. Base endureceu, mas aumentou desgaste geral.",
            major: "Crise negada",
            advanceWeeks: 1,
          });
        },
      },
    ]
  );
}

function actionBudget() {
  openModal(
    "Orçamento",
    "Você precisa decidir a prioridade do orçamento.",
    [
      {
        label: "Cortar gastos",
        type: "secondary",
        onClick: () => {
          applyWorldDelta({
            funds: +10,
            economy: +2,
            services: -3,
            integrity: +1,
            groupDelta: { empresariado: +4, baixaRenda: -3, funcionalismo: -2 },
            logText: "Você cortou gastos. Caixa melhorou, mas serviços e base popular sofreram.",
            major: "Corte de gastos",
            advanceWeeks: 2,
          });
        },
      },
      {
        label: "Investir em programas sociais",
        type: "primary",
        onClick: () => {
          applyWorldDelta({
            funds: -9,
            services: +6,
            economy: -1,
            integrity: +1,
            groupDelta: { baixaRenda: +7, classeMedia: +2, empresariado: -2 },
            logText: "Você ampliou programas sociais. Popularidade entre vulneráveis subiu, custo fiscal aumentou.",
            major: "Ampliação de programas sociais",
            advanceWeeks: 2,
          });
        },
      },
    ]
  );
}

function actionPublicProgram() {
  openModal(
    "Programa público",
    "Escolha um foco para lançar um programa com forte impacto.",
    [
      {
        label: "Mutirão de saúde",
        type: "primary",
        onClick: () => {
          applyWorldDelta({
            funds: -6,
            services: +8,
            mediaTone: +2,
            groupDelta: { baixaRenda: +4, funcionalismo: +2, classeMedia: +2 },
            logText: "Mutirão de saúde lançado. Melhorou atendimento e percepção de gestão.",
            major: "Mutirão de saúde",
            advanceWeeks: 2,
          });
        },
      },
      {
        label: "Plano de segurança",
        type: "secondary",
        onClick: () => {
          applyWorldDelta({
            funds: -6,
            security: +9,
            mediaTone: +1,
            groupDelta: { classeMedia: +3, religiosos: +2, jovens: -1 },
            logText: "Plano de segurança lançado. Sensação de ordem aumentou, mas houve críticas pontuais.",
            major: "Plano de segurança",
            advanceWeeks: 2,
          });
        },
      },
    ]
  );
}

// -------------------------------
// DISCURSO / ARTICULAÇÃO
// -------------------------------
function actionSpeech() {
  openModal(
    "Discurso",
    "Escolha o tom do discurso:",
    [
      {
        label: "Motivador",
        type: "primary",
        onClick: () => {
          applyWorldDelta({
            mediaTone: +2,
            integrity: +1,
            groupDelta: { baixaRenda: +2, religiosos: +1 },
            logText: "Você fez um discurso motivador e ganhou tração pública.",
            major: "Discurso motivador",
            advanceWeeks: 1,
          });
        },
      },
      {
        label: "Técnico",
        type: "secondary",
        onClick: () => {
          applyWorldDelta({
            mediaTone: +2,
            integrity: +3,
            congressSupport: +1,
            groupDelta: { empresariado: +2, classeMedia: +2 },
            logText: "Discurso técnico aumentou a percepção de competência.",
            major: "Discurso técnico",
            advanceWeeks: 1,
          });
        },
      },
      {
        label: "Polarizador",
        type: "secondary",
        onClick: () => {
          applyWorldDelta({
            mediaTone: -3,
            integrity: -4,
            congressSupport: +2,
            scandals: +2,
            groupDelta: { religiosos: +2, jovens: -3, classeMedia: -2 },
            logText: "Discurso polarizador mobilizou a base, mas aumentou rejeição e tensão.",
            major: "Discurso polarizador",
            advanceWeeks: 1,
          });
        },
      },
    ]
  );
}

function actionNegotiateSupport() {
  const office = offices[state.officeIndex];

  openModal(
    "Articular apoio",
    "Bastidores: como você busca governabilidade?",
    [
      {
        label: "Negociar com transparência",
        type: "primary",
        onClick: () => {
          applyWorldDelta({
            funds: -3,
            congressSupport: +6,
            integrity: +2,
            mediaTone: +1,
            scandals: -1,
            logText: "Você articulou apoio com transparência. Apoio subiu sem grande desgaste.",
            major: "Articulação transparente",
            advanceWeeks: 1,
          });
        },
      },
      {
        label: "Toma-lá-dá-cá",
        type: "secondary",
        onClick: () => {
          const isExec = office.type === "executive";
          applyWorldDelta({
            funds: -6,
            congressSupport: +10,
            integrity: -6,
            mediaTone: -2,
            scandals: +7,
            groupDelta: { empresariado: +2, classeMedia: -2 },
            logText: "Você garantiu apoio via acordos questionáveis. Governabilidade subiu, risco de escândalo disparou.",
            major: isExec ? "Coalizão por concessões" : "Acordo político questionável",
            advanceWeeks: 1,
          });
        },
      },
    ]
  );
}

// -------------------------------
// CAMPANHA (mantém seu modal)
// -------------------------------
let selectedToneId = null;
let selectedThemeId = null;

function renderCampaignOptions() {
  toneOptionsDiv.innerHTML = "";
  tones.forEach((t) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = t.label;
    chip.title = t.description;

    chip.addEventListener("click", () => {
      selectedToneId = t.id;
      [...toneOptionsDiv.children].forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
    });

    toneOptionsDiv.appendChild(chip);
  });

  themeOptionsDiv.innerHTML = "";
  themes.forEach((th) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = th.label;

    chip.addEventListener("click", () => {
      selectedThemeId = th.id;
      [...themeOptionsDiv.children].forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
    });

    themeOptionsDiv.appendChild(chip);
  });

  selectedToneId = null;
  selectedThemeId = null;
}

function openCampaignModal() {
  renderCampaignOptions();
  campaignOverlay.classList.remove("hidden");
}

function closeCampaignModal() {
  campaignOverlay.classList.add("hidden");
}

startCampaignBtn.addEventListener("click", () => {
  if (!selectedToneId || !selectedThemeId) {
    alert("Selecione o tom do discurso e o tema principal.");
    return;
  }

  const tone = tones.find((t) => t.id === selectedToneId);
  const theme = themes.find((th) => th.id === selectedThemeId);

  const cost = 8;
  if (state.funds < cost) {
    addFeed("Você não possui fundos suficientes para uma campanha robusta.");
    logTimeline("sistema", "Campanha falhou por falta de fundos.");
    return;
  }

  // efeitos de campanha
  state.funds = clamp(state.funds - cost);
  state.integrity = clamp(state.integrity + tone.integrity);
  state.mediaTone = clamp(state.mediaTone + tone.media);
  state.congressSupport = clamp(state.congressSupport + tone.congress);

  state.economy = clamp(state.economy + (theme.econ || 0) * 0.4);
  state.services = clamp(state.services + (theme.services || 0) * 0.5);
  state.security = clamp(state.security + (theme.security || 0) * 0.5);

  // impacto social por tema
  const g = {};
  if (theme.id === "economia") g.empresariado = +4, g.classeMedia = +2;
  if (theme.id === "saude") g.baixaRenda = +3, g.funcionalismo = +2;
  if (theme.id === "educacao") g.jovens = +4, g.classeMedia = +2;
  if (theme.id === "seguranca") g.religiosos = +2, g.classeMedia = +2, g.jovens = -1;
  if (theme.id === "meio-ambiente") g.jovens = +2, g.empresariado = -1, g.agro = -2;

  Object.keys(g).forEach((k) => state.groups[k] = clamp(state.groups[k] + g[k]));

  addFeed(`Campanha lançada: tom ${tone.label}, foco ${theme.label}.`);
  logTimeline("campanha", `Campanha: ${tone.label} / ${theme.label}`);

  saveGame();
  closeCampaignModal();

  // avançar o tempo e ir para eleição
  advanceTime(2);
  startElection();
});

cancelCampaignBtn.addEventListener("click", () => closeCampaignModal());

// -------------------------------
// ELEIÇÃO (mais “real”: considera grupos, mídia, congresso, macro e escândalo)
// -------------------------------
function startElection() {
  showScreen("election");

  const office = offices[state.officeIndex];
  electionTitle.textContent = `Contagem de votos para ${office.name}`;
  electionSubtitle.textContent = "Apuração em andamento...";

  candidateBar.style.width = "0%";
  opponentBar.style.width = "0%";
  candidatePercentSpan.textContent = "0%";
  opponentPercentSpan.textContent = "0%";
  electionResultText.textContent = "";
  electionContinueBtn.disabled = true;

  // base: popularidade já é recomputada
  recomputePopularity();

  // desempenho macro e confiança institucional
  const macroScore =
    state.economy * 0.22 +
    state.services * 0.18 +
    state.security * 0.12 +
    state.mediaTone * 0.12 +
    state.congressSupport * 0.10 +
    state.integrity * 0.16;

  const scandalPenalty = (state.scandals * (110 - state.integrity)) / 190; // mais duro

  // ruído eleitoral (campanha, oponente, viradas)
  const noise = rnd(-9, 9);

  let candidatePercent = clamp(macroScore - scandalPenalty + noise, 8, 92);
  let opponentPercent = 100 - candidatePercent;

  setTimeout(() => {
    candidateBar.style.width = `${candidatePercent}%`;
    opponentBar.style.width = `${opponentPercent}%`;
    candidatePercentSpan.textContent = `${candidatePercent.toFixed(1)}%`;
    opponentPercentSpan.textContent = `${opponentPercent.toFixed(1)}%`;

    setTimeout(() => {
      const won = candidatePercent > opponentPercent;

      if (won) {
        electionResultText.textContent = `Você venceu com ${candidatePercent.toFixed(1)}% dos votos!`;
        logTimeline("eleicao", `Vitória eleitoral (${office.name}) com ${candidatePercent.toFixed(1)}%.`);
      } else {
        electionResultText.textContent = `Você perdeu. Ficou com ${candidatePercent.toFixed(1)}% dos votos.`;
        logTimeline("eleicao", `Derrota eleitoral (${office.name}) com ${candidatePercent.toFixed(1)}%.`);
      }

      electionContinueBtn.disabled = false;
      electionContinueBtn.onclick = () => {
        if (won) {
          advanceOffice();
        } else {
          // penalidade realista pós-derrota
          applyWorldDelta({
            funds: -4,
            congressSupport: -2,
            mediaTone: -2,
            scandals: +2,
            groupDelta: { classeMedia: -2, jovens: -1 },
            logText: "A derrota abalou sua carreira. Você precisa reagrupar forças.",
            major: "Derrota eleitoral",
            advanceWeeks: 1,
          });
          showScreen("game");
          updateHeader();
          renderActions();
        }
      };
    }, 1200);
  }, 400);
}

function advanceOffice() {
  if (state.officeIndex < offices.length - 1) {
    state.officeIndex += 1;

    // reset parcial por novo mandato
    state.funds = clamp(40 + rnd(-5, 6));
    state.congressSupport = clamp(40 + rnd(-6, 10));
    state.mediaTone = clamp(50 + (state.integrity - 50) * 0.15 + rnd(-4, 4));
    state.scandals = clamp(state.scandals * 0.6);

    // ajuste social: vitória dá “lua de mel” moderada
    Object.keys(state.groups).forEach((k) => {
      state.groups[k] = clamp(state.groups[k] + rnd(1, 3));
    });

    saveGame();
    beginMandate(true);
  } else {
    addFeed("Você alcançou a presidência e se manteve no poder. Fim de jogo (por enquanto).");
    logTimeline("final", "Chegou à presidência.");
    saveGame();
    showScreen("game");
    updateHeader();
    renderActions();
  }
}

// -------------------------------
// INÍCIO DE MANDATO
// -------------------------------
function beginMandate(newOffice = false) {
  showScreen("game");

  // manter feed como histórico de sessão (limpa só em mudança grande)
  if (newOffice) feedDiv.innerHTML = "";

  updateHeader();
  renderActions();

  const office = offices[state.officeIndex];
  if (newOffice) {
    addFeed(`Novo mandato: ${office.name}.`);
    logTimeline("mandato", `Assumiu como ${office.name}.`);
  } else {
    addFeed(`Retomando mandato como ${office.name}.`);
    logTimeline("mandato", `Retomou mandato como ${office.name}.`);
  }

  saveGame();
}

// -------------------------------
// SELEÇÃO DE PARTIDO
// -------------------------------
function renderParties() {
  partyListDiv.innerHTML = "";
  let selectedId = state.party?.id ?? null;

  parties.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = `party-btn ${p.className}`;
    btn.innerHTML = `<strong>${p.label}</strong><span>${p.name}</span>`;
    if (p.id === selectedId) btn.classList.add("selected");

    btn.addEventListener("click", () => {
      selectedId = p.id;
      state.party = p;
      [...partyListDiv.children].forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });

    partyListDiv.appendChild(btn);
  });
}

// -------------------------------
// BOTÕES PRINCIPAIS
// -------------------------------
newGameBtn.addEventListener("click", () => {
  state = {
    name: "",
    party: null,
    officeIndex: 0,
    week: 1,
    year: 2025,
    popularity: 50,
    funds: 50,
    integrity: 50,
    congressSupport: 45,
    mediaTone: 50,
    economy: 50,
    security: 50,
    services: 50,
    scandals: 0,
    groups: {
      baixaRenda: 50,
      classeMedia: 50,
      empresariado: 50,
      funcionalismo: 50,
      jovens: 50,
      religiosos: 50,
      agro: 50,
    },
    lastMajorDecision: "",
    timeline: [],
  };

  clearSave();
  playerNameInput.value = "";
  renderParties();
  showScreen("selection");
});

continueBtn.addEventListener("click", () => {
  const loaded = loadGame();
  if (!loaded) {
    alert("Nenhum jogo salvo encontrado.");
    return;
  }
  beginMandate(false);
});

backToStartBtn.addEventListener("click", () => {
  showScreen("start");
});

confirmSelectionBtn.addEventListener("click", () => {
  if (!state.party) {
    alert("Selecione um partido.");
    return;
  }
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Digite seu nome.");
    return;
  }

  state.name = name;
  state.officeIndex = 0;
  state.week = 1;
  state.year = 2025;

  // valores iniciais levemente variáveis (não fica “igual sempre”)
  state.funds = clamp(48 + rnd(-6, 6));
  state.integrity = clamp(52 + rnd(-6, 6));
  state.congressSupport = clamp(44 + rnd(-8, 10));
  state.mediaTone = clamp(50 + rnd(-6, 6));
  state.economy = clamp(50 + rnd(-6, 6));
  state.security = clamp(50 + rnd(-6, 6));
  state.services = clamp(50 + rnd(-6, 6));
  state.scandals = clamp(rnd(0, 6));

  saveGame();
  beginMandate(true);
});

resetBtn.addEventListener("click", () => {
  if (confirm("Deseja iniciar um novo jogo? O progresso salvo será apagado.")) {
    clearSave();

    state = {
      name: "",
      party: null,
      officeIndex: 0,
      week: 1,
      year: 2025,
      popularity: 50,
      funds: 50,
      integrity: 50,
      congressSupport: 45,
      mediaTone: 50,
      economy: 50,
      security: 50,
      services: 50,
      scandals: 0,
      groups: {
        baixaRenda: 50,
        classeMedia: 50,
        empresariado: 50,
        funcionalismo: 50,
        jovens: 50,
        religiosos: 50,
        agro: 50,
      },
      lastMajorDecision: "",
      timeline: [],
    };

    playerNameInput.value = "";
    renderParties();
    showScreen("start");
    updateContinueVisibility();
  }
});

// -------------------------------
// INIT
// -------------------------------
function init() {
  renderParties();
  updateContinueVisibility();
}

document.addEventListener("DOMContentLoaded", init);
