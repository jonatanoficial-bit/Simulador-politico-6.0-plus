const STORAGE_KEY = "simuladorPoliticoSave_v7";

let state = {
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

  timeline: [],
};

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

// ===== ELEMENTOS =====
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

// HUD meters
const meter = {
  congress: document.getElementById("meter-congress"),
  media: document.getElementById("meter-media"),
  economy: document.getElementById("meter-economy"),
  security: document.getElementById("meter-security"),
  services: document.getElementById("meter-services"),
  scandal: document.getElementById("meter-scandal"),

  congressVal: document.getElementById("meter-congress-val"),
  mediaVal: document.getElementById("meter-media-val"),
  economyVal: document.getElementById("meter-economy-val"),
  securityVal: document.getElementById("meter-security-val"),
  servicesVal: document.getElementById("meter-services-val"),
  scandalVal: document.getElementById("meter-scandal-val"),
};

const groupEls = {
  baixaRenda: { val: document.getElementById("g-baixaRenda"), bar: document.getElementById("gbar-baixaRenda") },
  classeMedia: { val: document.getElementById("g-classeMedia"), bar: document.getElementById("gbar-classeMedia") },
  empresariado: { val: document.getElementById("g-empresariado"), bar: document.getElementById("gbar-empresariado") },
  funcionalismo: { val: document.getElementById("g-funcionalismo"), bar: document.getElementById("gbar-funcionalismo") },
  jovens: { val: document.getElementById("g-jovens"), bar: document.getElementById("gbar-jovens") },
  religiosos: { val: document.getElementById("g-religiosos"), bar: document.getElementById("gbar-religiosos") },
  agro: { val: document.getElementById("g-agro"), bar: document.getElementById("gbar-agro") },
};

const hudNote = document.getElementById("hud-note");

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

// ===== UTIL =====
function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }
function rnd(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function formatTime() { return `Semana ${state.week}/${state.year}`; }

// ===== TELAS =====
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ===== SALVAR/CARREGAR =====
function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.name || parsed.officeIndex == null) return null;

    state = {
      ...state,
      ...parsed,
      groups: { ...state.groups, ...(parsed.groups || {}) },
    };

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

function clearSave() { localStorage.removeItem(STORAGE_KEY); }

function updateContinueVisibility() {
  const hasSave = !!localStorage.getItem(STORAGE_KEY);
  continueBtn.style.display = hasSave ? "inline-block" : "none";
}

// ===== FEED =====
function addFeed(message) {
  const p = document.createElement("p");
  p.textContent = message;
  feedDiv.prepend(p);
}

// ===== VISUAL: fundo por cargo =====
function syncOfficeVisual() {
  const office = offices[state.officeIndex];
  gameScreen.className = `screen active ${office.id}`;
}

// ===== SIMULAÇÃO: recalcular popularidade =====
function recomputePopularity() {
  const g = state.groups;

  const groupsAvg =
    g.baixaRenda * 0.18 +
    g.classeMedia * 0.18 +
    g.empresariado * 0.14 +
    g.funcionalismo * 0.14 +
    g.jovens * 0.12 +
    g.religiosos * 0.12 +
    g.agro * 0.12;

  const macro =
    state.economy * 0.22 +
    state.services * 0.16 +
    state.security * 0.10 +
    state.mediaTone * 0.10 +
    state.congressSupport * 0.06;

  const scandalPenalty = (state.scandals * (110 - state.integrity)) / 220;
  const base = (groupsAvg * 0.58 + macro * 0.42) - scandalPenalty;

  state.popularity = clamp(Math.round(base), 0, 100);
}

// ===== HUD AAA =====
function setMeter(fillEl, valEl, value, isDanger = false) {
  const v = clamp(value);
  fillEl.style.width = `${v}%`;
  valEl.textContent = `${Math.round(v)}%`;

  // ajuste de cor “AAA” por nível (sem mudar CSS inteiro)
  if (!isDanger) {
    if (v < 35) fillEl.style.background = "var(--danger)";
    else if (v < 60) fillEl.style.background = "var(--warning)";
    else fillEl.style.background = "var(--success)";
  }
}

function renderHUD() {
  setMeter(meter.congress, meter.congressVal, state.congressSupport);
  setMeter(meter.media, meter.mediaVal, state.mediaTone);
  setMeter(meter.economy, meter.economyVal, state.economy);
  setMeter(meter.security, meter.securityVal, state.security);
  setMeter(meter.services, meter.servicesVal, state.services);
  setMeter(meter.scandal, meter.scandalVal, state.scandals, true);

  // escândalo: sempre vermelho, e “inverso mental” (alto = ruim)
  meter.scandal.style.background = "var(--danger)";

  Object.keys(groupEls).forEach((k) => {
    const v = clamp(state.groups[k]);
    groupEls[k].val.textContent = `${Math.round(v)}`;
    groupEls[k].bar.style.width = `${v}%`;

    // cor por nível
    if (v < 35) groupEls[k].bar.style.background = "var(--danger)";
    else if (v < 60) groupEls[k].bar.style.background = "var(--warning)";
    else groupEls[k].bar.style.background = "var(--success)";
  });

  // dicas rápidas (AAA = feedback)
  const tips = [];
  if (state.congressSupport < 45) tips.push("Apoio no Congresso baixo: articule alianças.");
  if (state.mediaTone < 45) tips.push("Mídia hostil: use transparência e discurso técnico.");
  if (state.scandals > 55) tips.push("Risco de escândalo alto: reduza acordos e aumente integridade.");
  if (state.economy < 45) tips.push("Economia fraca: decisões fiscais e confiança do mercado importam.");
  hudNote.textContent = tips.length ? tips.join(" ") : "Situação estável. Aproveite para avançar projetos com impacto.";
}

// ===== HEADER =====
function updateHeader() {
  recomputePopularity();
  syncOfficeVisual();
  renderHUD();

  const office = offices[state.officeIndex];
  playerInfoText.textContent = `${state.name} — Partido ${state.party?.id ?? ""} • ${formatTime()}`;
  officeText.textContent = office.name;

  statPopularity.textContent = state.popularity;
  statFunds.textContent = state.funds;
  statIntegrity.textContent = state.integrity;
}

// ===== TEMPO/EVENTOS =====
function advanceTime(weeks = 1) {
  for (let i = 0; i < weeks; i++) {
    state.week += 1;
    if (state.week > 52) { state.week = 1; state.year += 1; }

    state.economy = clamp(state.economy + rnd(-1.5, 1.2));
    state.security = clamp(state.security + rnd(-1.2, 1.0));
    state.services = clamp(state.services + rnd(-1.0, 1.2));

    const mediaPull = (50 - state.mediaTone) * 0.06;
    state.mediaTone = clamp(state.mediaTone + mediaPull - state.scandals * 0.01 + (state.integrity - 50) * 0.01);

    state.scandals = clamp(state.scandals + (50 - state.integrity) * 0.03 + rnd(-0.8, 1.2));

    if (Math.random() < 0.22) triggerRandomEvent();
  }

  updateHeader();
  saveGame();
}

function triggerRandomEvent() {
  const office = offices[state.officeIndex];
  const isExec = office.type === "executive";

  const events = [
    {
      apply: () => {
        state.mediaTone = clamp(state.mediaTone - rnd(3, 9));
        state.integrity = clamp(state.integrity - rnd(1, 4));
        state.scandals = clamp(state.scandals + rnd(2, 6));
        addFeed("URGENTE: reportagem pressiona o governo. Sua imagem sofre.");
      },
    },
    {
      apply: () => {
        state.economy = clamp(state.economy + rnd(4, 10));
        state.groups.empresariado = clamp(state.groups.empresariado + rnd(2, 6));
        state.groups.classeMedia = clamp(state.groups.classeMedia + rnd(1, 5));
        addFeed("Indicadores econômicos melhoram. Confiança sobe.");
      },
    },
    {
      apply: () => {
        state.security = clamp(state.security - rnd(5, 12));
        state.groups.classeMedia = clamp(state.groups.classeMedia - rnd(2, 6));
        state.mediaTone = clamp(state.mediaTone - rnd(2, 6));
        addFeed("ALERTA: crise de segurança domina o noticiário.");
      },
    },
    {
      apply: () => {
        state.groups.funcionalismo = clamp(state.groups.funcionalismo - rnd(6, 12));
        state.services = clamp(state.services - rnd(2, 6));
        if (isExec) state.congressSupport = clamp(state.congressSupport - rnd(1, 4));
        addFeed("Greve: serviços públicos sofrem e pressão aumenta.");
      },
    },
    {
      apply: () => {
        state.scandals = clamp(state.scandals + rnd(6, 14));
        state.mediaTone = clamp(state.mediaTone - rnd(3, 8));
        state.integrity = clamp(state.integrity - rnd(2, 6));
        addFeed("Oposição acusa: rumores de corrupção ganham força.");
      },
    },
    {
      apply: () => {
        state.congressSupport = clamp(state.congressSupport + rnd(4, 10));
        state.funds = clamp(state.funds - rnd(1, 4));
        addFeed("Bastidores: articulação melhora apoio no Congresso.");
      },
    },
  ];

  if (isExec) {
    events.push({
      apply: () => {
        state.funds = clamp(state.funds - rnd(6, 12));
        state.services = clamp(state.services - rnd(2, 6));
        if (Math.random() < 0.55) {
          state.groups.baixaRenda = clamp(state.groups.baixaRenda + rnd(2, 7));
          state.mediaTone = clamp(state.mediaTone + rnd(1, 5));
          addFeed("Resposta rápida a desastre: governo ganha pontos.");
        } else {
          state.groups.baixaRenda = clamp(state.groups.baixaRenda - rnd(4, 9));
          state.mediaTone = clamp(state.mediaTone - rnd(2, 6));
          addFeed("Críticas: resposta lenta a desastre gera desgaste.");
        }
      },
    });
  }

  pick(events).apply();
}

// ===== AÇÕES =====
function applyWorldDelta({
  funds = 0, integrity = 0, congressSupport = 0, mediaTone = 0,
  economy = 0, security = 0, services = 0, scandals = 0,
  groupDelta = {}, logText = "", advanceWeeks = 1,
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

  if (logText) addFeed(logText);

  advanceTime(Math.max(0, advanceWeeks));
  updateHeader();
  saveGame();
}

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

// ===== MODAL =====
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
function closeModal() { modalOverlay.classList.add("hidden"); }

// ===== AÇÕES (conteúdo) =====
function actionVoteProject() {
  const bills = [
    {
      title: "Reforma de segurança nas escolas",
      yes: { security: +4, mediaTone: +1, congressSupport: +2, integrity: +1, groupDelta: { classeMedia: +3, religiosos: +1 } },
      no:  { security: -2, mediaTone: -1, congressSupport: +1, integrity: +2, groupDelta: { jovens: +1, classeMedia: -2 } },
    },
    {
      title: "Ampliação de programas sociais",
      yes: { services: +5, economy: -1, mediaTone: +1, integrity: +1, groupDelta: { baixaRenda: +6, classeMedia: +1 } },
      no:  { services: -2, mediaTone: -1, integrity: +2, groupDelta: { baixaRenda: -4, empresariado: +1 } },
    },
    {
      title: "Incentivo fiscal para indústria",
      yes: { economy: +5, funds: -3, mediaTone: +1, integrity: -1, groupDelta: { empresariado: +6, classeMedia: +1 } },
      no:  { economy: -1, mediaTone: -1, integrity: +2, groupDelta: { empresariado: -4, baixaRenda: +1 } },
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
        onClick: () => applyWorldDelta({ ...chosen.yes, logText: `Você votou SIM: ${chosen.title}.`, advanceWeeks: 1 }),
      },
      {
        label: "Não",
        type: "secondary",
        onClick: () => applyWorldDelta({ ...chosen.no, logText: `Você votou NÃO: ${chosen.title}.`, advanceWeeks: 1 }),
      },
    ]
  );
}

function actionProposeLaw() {
  const topics = [
    { name: "Projeto de Saúde Básica", cost: 6, effects: { services: +6, mediaTone: +1, integrity: +1, groupDelta: { baixaRenda: +4, funcionalismo: +2 } } },
    { name: "Projeto de Mobilidade Urbana", cost: 5, effects: { economy: +2, services: +2, mediaTone: +1, integrity: +1, groupDelta: { classeMedia: +4, jovens: +2 } } },
    { name: "Projeto de Educação Integral", cost: 6, effects: { services: +5, mediaTone: +1, integrity: +2, groupDelta: { jovens: +5, classeMedia: +2 } } },
  ];
  const chosen = pick(topics);

  if (state.funds < chosen.cost) {
    addFeed("Você não tem fundos suficientes para articular um novo projeto.");
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
          state.funds = clamp(state.funds - chosen.cost);
          applyWorldDelta({ ...chosen.effects, logText: `Você apresentou: ${chosen.name}.`, advanceWeeks: 2 });
        },
      },
      { label: "Cancelar", type: "secondary" },
    ]
  );
}

function actionInspect() {
  openModal(
    "Fiscalização",
    "Você iniciou uma fiscalização. O que faz se encontrar irregularidades?",
    [
      {
        label: "Denunciar",
        type: "primary",
        onClick: () =>
          applyWorldDelta({
            integrity: +5,
            mediaTone: +2,
            scandals: -3,
            groupDelta: { baixaRenda: +2, classeMedia: +2 },
            logText: "Você denunciou irregularidades e ganhou crédito público.",
            advanceWeeks: 1,
          }),
      },
      {
        label: "Abafar",
        type: "secondary",
        onClick: () =>
          applyWorldDelta({
            integrity: -6,
            funds: +3,
            mediaTone: -3,
            scandals: +8,
            congressSupport: +2,
            groupDelta: { empresariado: +2, classeMedia: -2 },
            logText: "Você abafou o caso. Ganhou recursos, mas aumentou o risco de escândalo.",
            advanceWeeks: 1,
          }),
      },
    ]
  );
}

function actionSanction() {
  openModal(
    "Sancionar / Vetar",
    "Chegou um projeto polêmico para decisão. O que você faz?",
    [
      {
        label: "Sancionar",
        type: "primary",
        onClick: () =>
          applyWorldDelta({
            congressSupport: +3,
            mediaTone: +1,
            integrity: -2,
            groupDelta: { empresariado: +3, classeMedia: +1 },
            logText: "Você sancionou o projeto. Governabilidade subiu, mas sofreu críticas éticas.",
            advanceWeeks: 1,
          }),
      },
      {
        label: "Vetar",
        type: "secondary",
        onClick: () =>
          applyWorldDelta({
            congressSupport: -3,
            mediaTone: +1,
            integrity: +4,
            groupDelta: { religiosos: +2, jovens: +1 },
            logText: "Você vetou o projeto. Integridade subiu, mas o Congresso reagiu.",
            advanceWeeks: 1,
          }),
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
        onClick: () =>
          applyWorldDelta({
            funds: -4,
            integrity: +3,
            mediaTone: +3,
            scandals: -4,
            groupDelta: { classeMedia: +2, jovens: +1 },
            logText: "Você enfrentou a crise com transparência e reduziu danos.",
            advanceWeeks: 1,
          }),
      },
      {
        label: "Negar e atacar a mídia",
        type: "secondary",
        onClick: () =>
          applyWorldDelta({
            integrity: -6,
            mediaTone: -6,
            scandals: +4,
            congressSupport: +1,
            groupDelta: { religiosos: +1, classeMedia: -3, jovens: -2 },
            logText: "Você atacou a mídia. Base endureceu, mas aumentou desgaste geral.",
            advanceWeeks: 1,
          }),
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
        onClick: () =>
          applyWorldDelta({
            funds: +10,
            economy: +2,
            services: -3,
            integrity: +1,
            groupDelta: { empresariado: +4, baixaRenda: -3, funcionalismo: -2 },
            logText: "Você cortou gastos. Caixa melhorou, mas serviços e base popular sofreram.",
            advanceWeeks: 2,
          }),
      },
      {
        label: "Investir em programas sociais",
        type: "primary",
        onClick: () =>
          applyWorldDelta({
            funds: -9,
            services: +6,
            economy: -1,
            integrity: +1,
            groupDelta: { baixaRenda: +7, classeMedia: +2, empresariado: -2 },
            logText: "Você ampliou programas sociais. Popularidade entre vulneráveis subiu, custo fiscal aumentou.",
            advanceWeeks: 2,
          }),
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
        onClick: () =>
          applyWorldDelta({
            funds: -6,
            services: +8,
            mediaTone: +2,
            groupDelta: { baixaRenda: +4, funcionalismo: +2, classeMedia: +2 },
            logText: "Mutirão de saúde lançado. Melhorou atendimento e percepção de gestão.",
            advanceWeeks: 2,
          }),
      },
      {
        label: "Plano de segurança",
        type: "secondary",
        onClick: () =>
          applyWorldDelta({
            funds: -6,
            security: +9,
            mediaTone: +1,
            groupDelta: { classeMedia: +3, religiosos: +2, jovens: -1 },
            logText: "Plano de segurança lançado. Sensação de ordem aumentou, mas houve críticas pontuais.",
            advanceWeeks: 2,
          }),
      },
    ]
  );
}

function actionSpeech() {
  openModal(
    "Discurso",
    "Escolha o tom do discurso:",
    [
      {
        label: "Motivador",
        type: "primary",
        onClick: () =>
          applyWorldDelta({
            mediaTone: +2,
            integrity: +1,
            groupDelta: { baixaRenda: +2, religiosos: +1 },
            logText: "Você fez um discurso motivador e ganhou tração pública.",
            advanceWeeks: 1,
          }),
      },
      {
        label: "Técnico",
        type: "secondary",
        onClick: () =>
          applyWorldDelta({
            mediaTone: +2,
            integrity: +3,
            congressSupport: +1,
            groupDelta: { empresariado: +2, classeMedia: +2 },
            logText: "Discurso técnico aumentou a percepção de competência.",
            advanceWeeks: 1,
          }),
      },
      {
        label: "Polarizador",
        type: "secondary",
        onClick: () =>
          applyWorldDelta({
            mediaTone: -3,
            integrity: -4,
            congressSupport: +2,
            scandals: +2,
            groupDelta: { religiosos: +2, jovens: -3, classeMedia: -2 },
            logText: "Discurso polarizador mobilizou a base, mas aumentou rejeição e tensão.",
            advanceWeeks: 1,
          }),
      },
    ]
  );
}

function actionNegotiateSupport() {
  openModal(
    "Articular apoio",
    "Bastidores: como você busca governabilidade?",
    [
      {
        label: "Negociar com transparência",
        type: "primary",
        onClick: () =>
          applyWorldDelta({
            funds: -3,
            congressSupport: +6,
            integrity: +2,
            mediaTone: +1,
            scandals: -1,
            logText: "Você articulou apoio com transparência. Apoio subiu sem grande desgaste.",
            advanceWeeks: 1,
          }),
      },
      {
        label: "Toma-lá-dá-cá",
        type: "secondary",
        onClick: () =>
          applyWorldDelta({
            funds: -6,
            congressSupport: +10,
            integrity: -6,
            mediaTone: -2,
            scandals: +7,
            groupDelta: { empresariado: +2, classeMedia: -2 },
            logText: "Você garantiu apoio por acordos questionáveis. Apoio subiu, risco de escândalo disparou.",
            advanceWeeks: 1,
          }),
      },
    ]
  );
}

// ===== CAMPANHA =====
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
function closeCampaignModal() { campaignOverlay.classList.add("hidden"); }

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
    return;
  }

  state.funds = clamp(state.funds - cost);
  state.integrity = clamp(state.integrity + tone.integrity);
  state.mediaTone = clamp(state.mediaTone + tone.media);
  state.congressSupport = clamp(state.congressSupport + tone.congress);

  state.economy = clamp(state.economy + (theme.econ || 0) * 0.4);
  state.services = clamp(state.services + (theme.services || 0) * 0.5);
  state.security = clamp(state.security + (theme.security || 0) * 0.5);

  addFeed(`Campanha lançada: tom ${tone.label}, foco ${theme.label}.`);

  saveGame();
  closeCampaignModal();

  advanceTime(2);
  startElection();
});

cancelCampaignBtn.addEventListener("click", () => closeCampaignModal());

// ===== ELEIÇÃO =====
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

  recomputePopularity();

  const macroScore =
    state.economy * 0.22 +
    state.services * 0.18 +
    state.security * 0.12 +
    state.mediaTone * 0.12 +
    state.congressSupport * 0.10 +
    state.integrity * 0.16;

  const scandalPenalty = (state.scandals * (110 - state.integrity)) / 190;
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

      electionResultText.textContent = won
        ? `Você venceu com ${candidatePercent.toFixed(1)}% dos votos!`
        : `Você perdeu. Ficou com ${candidatePercent.toFixed(1)}% dos votos.`;

      electionContinueBtn.disabled = false;
      electionContinueBtn.onclick = () => {
        if (won) advanceOffice();
        else {
          applyWorldDelta({
            funds: -4,
            congressSupport: -2,
            mediaTone: -2,
            scandals: +2,
            groupDelta: { classeMedia: -2, jovens: -1 },
            logText: "A derrota abalou sua carreira. Você precisa reagrupar forças.",
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

    state.funds = clamp(40 + rnd(-5, 6));
    state.congressSupport = clamp(40 + rnd(-6, 10));
    state.mediaTone = clamp(50 + (state.integrity - 50) * 0.15 + rnd(-4, 4));
    state.scandals = clamp(state.scandals * 0.6);

    Object.keys(state.groups).forEach((k) => state.groups[k] = clamp(state.groups[k] + rnd(1, 3)));

    saveGame();
    beginMandate(true);
  } else {
    addFeed("Você alcançou a presidência e se manteve no poder. Fim de jogo (por enquanto).");
    saveGame();
    showScreen("game");
    updateHeader();
    renderActions();
  }
}

// ===== MANDATO =====
function beginMandate(newOffice = false) {
  showScreen("game");
  if (newOffice) feedDiv.innerHTML = "";
  updateHeader();
  renderActions();
  addFeed(newOffice ? `Novo mandato: ${offices[state.officeIndex].name}.` : `Retomando mandato como ${offices[state.officeIndex].name}.`);
  saveGame();
}

// ===== PARTIDOS =====
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

// ===== BOTÕES =====
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

backToStartBtn.addEventListener("click", () => showScreen("start"));

confirmSelectionBtn.addEventListener("click", () => {
  if (!state.party) { alert("Selecione um partido."); return; }
  const name = playerNameInput.value.trim();
  if (!name) { alert("Digite seu nome."); return; }

  state.name = name;
  state.officeIndex = 0;
  state.week = 1;
  state.year = 2025;

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
      timeline: [],
    };

    playerNameInput.value = "";
    renderParties();
    showScreen("start");
    updateContinueVisibility();
  }
});

// ===== INIT =====
function init() {
  renderParties();
  updateContinueVisibility();
}
document.addEventListener("DOMContentLoaded", init);
