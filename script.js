const STORAGE_KEY = "simuladorPoliticoSave_v9_calendar_news";

// ===============================
// ESTADO
// ===============================
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

  // ETAPA 2
  activeProjects: [],     // [{ id, startedAt:{week,year}, totalWeeks, weeksLeft, stalledWeeks, status }]
  completedProjects: [],  // [id]

  // ETAPA 3
  news: [],               // [{ id, week, year, title, subtitle, tone, tags:[], impact:{...} }]
  unreadNews: 0,
  calendar: {
    electionCycleWeeks: 16, // a cada 16 semanas existe “janela eleitoral”
    nextElection: { week: 16, year: 2025 }, // recalculado no init
  },

  timeline: [],
};

const offices = [
  { id: "municipal", name: "Vereador", type: "legislative" },
  { id: "assembly", name: "Deputado Estadual", type: "legislative" },
  { id: "federal", name: "Deputado Federal", type: "legislative" },
  { id: "senate", name: "Senador", type: "legislative" },
  { id: "mayor", name: "Prefeito", type: "executive" },
  { id: "governor", name: "Governador", type: "executive" },
  { id: "president", name: "Presidente", type: "executive" },
];

const parties = [
  { id: "PRP", label: "PRP", name: "Partido Renovador Popular", className: "party-prp" },
  { id: "PSLB", label: "PSLB", name: "Partido Social Liberal do Brasil", className: "party-pslb" },
  { id: "PTM", label: "PTM", name: "Partido Trabalhista Moderno", className: "party-ptm" },
  { id: "PVG", label: "PVG", name: "Partido Verde Global", className: "party-pvg" },
  { id: "MDBR", label: "MDBR", name: "Movimento Democrático Brasileiro", className: "party-mdbr" },
];

const tones = [
  { id: "populista", label: "Populista", integrity: -6, media: -2, congress: +1, description: "Fala para as massas, promete muito." },
  { id: "progressista", label: "Progressista", integrity: +1, media: +1, congress: -1, description: "Defende pautas sociais e direitos." },
  { id: "conservador", label: "Conservador", integrity: +2, media: 0, congress: +2, description: "Foco em segurança e valores tradicionais." },
  { id: "tecnico", label: "Técnico", integrity: +5, media: +2, congress: 0, description: "Discurso baseado em dados e gestão." },
];

const themes = [
  { id: "economia", label: "Economia", econ: +6, services: -1, security: 0 },
  { id: "saude", label: "Saúde", econ: -1, services: +6, security: 0 },
  { id: "educacao", label: "Educação", econ: 0, services: +5, security: 0 },
  { id: "seguranca", label: "Segurança", econ: -1, services: -1, security: +7 },
  { id: "meio-ambiente", label: "Meio Ambiente", econ: -1, services: +1, security: 0 },
];

// ===============================
// CATÁLOGO DE PROJETOS (ETAPA 2)
// ===============================
const projectCatalog = [
  // EXECUTIVO
  {
    id: "pacto-seguranca",
    title: "Pacto pela Segurança",
    type: "executive",
    minOfficeIndex: 4,
    cost: 10,
    totalWeeks: 6,
    desc: "Integra forças e metas. Melhora indicadores, mas exige apoio político e orçamento.",
    req: { funds: 10, congress: 50, integrity: 40, scandalsMax: 65 },
    stallIf: { congressBelow: 45 },
    weekly: { security: +1.2, mediaTone: +0.2, funds: -0.6, groupDelta: { classeMedia: +0.4, religiosos: +0.2 } },
    complete: { security: +3, mediaTone: +2, congressSupport: +1, scandals: -2 },
  },
  {
    id: "mutirao-saude",
    title: "Mutirão de Saúde",
    type: "executive",
    minOfficeIndex: 4,
    cost: 12,
    totalWeeks: 8,
    desc: "Aumento de atendimento e redução de filas. Alto impacto em serviços e percepção pública.",
    req: { funds: 12, congress: 48, integrity: 45, scandalsMax: 60 },
    stallIf: { congressBelow: 44 },
    weekly: { services: +1.0, mediaTone: +0.2, funds: -0.7, groupDelta: { baixaRenda: +0.5, funcionalismo: +0.3, classeMedia: +0.2 } },
    complete: { services: +3, mediaTone: +2, scandals: -2 },
  },
  {
    id: "reforma-adm",
    title: "Reforma Administrativa",
    type: "executive",
    minOfficeIndex: 5,
    cost: 14,
    totalWeeks: 7,
    desc: "Corta desperdícios e reorganiza secretarias. Melhora caixa, mas gera atrito com funcionalismo.",
    req: { funds: 14, congress: 55, integrity: 45, scandalsMax: 65 },
    stallIf: { congressBelow: 50 },
    weekly: { funds: +0.9, economy: +0.4, services: -0.3, groupDelta: { empresariado: +0.3, funcionalismo: -0.6 } },
    complete: { funds: +6, economy: +2, congressSupport: -2, mediaTone: +1 },
  },
  {
    id: "pacote-anticorrupcao",
    title: "Pacote Anticorrupção",
    type: "executive",
    minOfficeIndex: 4,
    cost: 6,
    totalWeeks: 5,
    desc: "Aumenta compliance e controle interno. Reduz risco de escândalo, mas gera resistência interna.",
    req: { funds: 6, congress: 45, integrity: 55, scandalsMax: 80 },
    stallIf: { congressBelow: 40 },
    weekly: { scandals: -1.1, integrity: +0.3, mediaTone: +0.2, groupDelta: { classeMedia: +0.2, jovens: +0.2 } },
    complete: { scandals: -5, integrity: +3, congressSupport: -2, mediaTone: +2 },
  },
  {
    id: "plano-economia",
    title: "Plano de Estímulo Econômico",
    type: "executive",
    minOfficeIndex: 4,
    cost: 11,
    totalWeeks: 6,
    desc: "Incentivos e obras estratégicas. Pode acelerar economia, mas aumenta risco se houver desgaste político.",
    req: { funds: 11, congress: 52, integrity: 40, scandalsMax: 60 },
    stallIf: { congressBelow: 47 },
    weekly: { economy: +1.0, mediaTone: +0.1, funds: -0.9, groupDelta: { empresariado: +0.5, agro: +0.3, baixaRenda: +0.1 } },
    complete: { economy: +3, mediaTone: +1, congressSupport: +1, scandals: +1 },
  },

  // LEGISLATIVO
  {
    id: "frente-parlamentar",
    title: "Frente Parlamentar Estratégica",
    type: "legislative",
    minOfficeIndex: 0,
    cost: 5,
    totalWeeks: 6,
    desc: "Cria coalizão temática para ampliar influência e construir maioria em votações.",
    req: { funds: 5, congress: 40, integrity: 40, scandalsMax: 70 },
    stallIf: { congressBelow: 35 },
    weekly: { congressSupport: +1.0, mediaTone: +0.1, funds: -0.3 },
    complete: { congressSupport: +4, mediaTone: +1, integrity: +1 },
  },
  {
    id: "cpi-transparencia",
    title: "CPI de Transparência",
    type: "legislative",
    minOfficeIndex: 0,
    cost: 4,
    totalWeeks: 5,
    desc: "Investigação com grande visibilidade. Pode reduzir escândalos, mas provoca guerra política.",
    req: { funds: 4, congress: 45, integrity: 50, scandalsMax: 85 },
    stallIf: { congressBelow: 40 },
    weekly: { mediaTone: +0.4, integrity: +0.2, scandals: -0.5, congressSupport: -0.3 },
    complete: { scandals: -3, integrity: +2, mediaTone: +2, congressSupport: -1 },
  },
  {
    id: "relatoria-orcamento",
    title: "Relatoria do Orçamento",
    type: "legislative",
    minOfficeIndex: 1,
    cost: 6,
    totalWeeks: 6,
    desc: "Assume protagonismo no orçamento. Aumenta poder político, mas eleva risco se integridade for baixa.",
    req: { funds: 6, congress: 50, integrity: 45, scandalsMax: 70 },
    stallIf: { congressBelow: 45 },
    weekly: { congressSupport: +0.8, funds: +0.2, mediaTone: -0.1, scandals: +0.2 },
    complete: { congressSupport: +3, funds: +2, scandals: +1 },
  },
];

// ===============================
// ELEMENTOS (DOM)
// ===============================
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
const openAgendaBtn = document.getElementById("open-agenda-btn");

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
const hudProjectPill = document.getElementById("hud-project-pill");

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

// Agenda (ETAPA 2)
const agendaOverlay = document.getElementById("agenda-overlay");
const agendaActive = document.getElementById("agenda-active");
const agendaAvailable = document.getElementById("agenda-available");
const closeAgendaBtn = document.getElementById("close-agenda-btn");
const agendaRefreshBtn = document.getElementById("agenda-refresh-btn");
const agendaSubtitle = document.getElementById("agenda-subtitle");

// ===============================
// ETAPA 3: UI DINÂMICA (Calendário + Imprensa)
// (cria botões/overlays se não existirem no HTML)
// ===============================
let pressBtn = null;
let calendarBtn = null;
let pressOverlay = null;
let calendarOverlay = null;

function injectEtapa3UI() {
  // CSS mínimo AAA para overlays/ticker (sem mexer no seu style.css)
  const css = `
  .et3-fabbar{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
  .et3-btn{border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);color:#fff;padding:10px 12px;border-radius:12px;cursor:pointer;backdrop-filter: blur(6px);font-weight:700}
  .et3-btn:hover{transform: translateY(-1px)}
  .et3-badge{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 8px;border-radius:999px;margin-left:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);font-size:12px}
  .et3-badge.hot{background:rgba(255,80,80,.18);border-color:rgba(255,80,80,.35)}
  .et3-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:9999}
  .et3-panel{width:min(980px,92vw);height:min(78vh,720px);background:rgba(8,10,14,.92);border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 16px 80px rgba(0,0,0,.55);overflow:hidden;display:flex;flex-direction:column}
  .et3-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12)}
  .et3-head h3{margin:0;font-size:16px;letter-spacing:.4px}
  .et3-close{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:8px 10px;cursor:pointer}
  .et3-body{padding:12px 14px;overflow:auto;display:grid;grid-template-columns: 1.3fr .7fr;gap:12px}
  .et3-card{border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.04);padding:12px}
  .et3-card h4{margin:0 0 10px 0;font-size:14px}
  .et3-newsitem{padding:10px;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(0,0,0,.25);margin-bottom:10px}
  .et3-newsitem strong{display:block;font-size:13px;margin-bottom:4px}
  .et3-sub{opacity:.85;font-size:12px;line-height:1.35}
  .et3-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
  .et3-tag{font-size:11px;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);opacity:.9}
  .et3-tone.good{border-color:rgba(80,220,120,.28);background:rgba(80,220,120,.10)}
  .et3-tone.bad{border-color:rgba(255,80,80,.28);background:rgba(255,80,80,.10)}
  .et3-tone.neutral{border-color:rgba(255,220,120,.22);background:rgba(255,220,120,.08)}
  .et3-kpi{display:flex;flex-direction:column;gap:8px}
  .et3-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;opacity:.92}
  .et3-row span:last-child{font-weight:800}
  .et3-ticker{margin-top:10px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);font-size:12px;line-height:1.35}
  `;
  if (!document.getElementById("etapa3-style")) {
    const styleTag = document.createElement("style");
    styleTag.id = "etapa3-style";
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  // cria barra de botões no game
  if (!document.getElementById("et3-fabbar")) {
    const anchor = actionsDiv?.parentElement || gameScreen;
    const bar = document.createElement("div");
    bar.className = "et3-fabbar";
    bar.id = "et3-fabbar";

    calendarBtn = document.createElement("button");
    calendarBtn.className = "et3-btn";
    calendarBtn.id = "calendar-btn";
    calendarBtn.textContent = "Calendário";

    pressBtn = document.createElement("button");
    pressBtn.className = "et3-btn";
    pressBtn.id = "press-btn";
    pressBtn.innerHTML = `Imprensa <span id="press-badge" class="et3-badge">0</span>`;

    bar.appendChild(calendarBtn);
    bar.appendChild(pressBtn);

    if (anchor) anchor.appendChild(bar);
  } else {
    pressBtn = document.getElementById("press-btn");
    calendarBtn = document.getElementById("calendar-btn");
  }

  // overlay imprensa
  if (!document.getElementById("press-overlay")) {
    pressOverlay = document.createElement("div");
    pressOverlay.className = "et3-overlay";
    pressOverlay.id = "press-overlay";
    pressOverlay.style.display = "none";
    pressOverlay.innerHTML = `
      <div class="et3-panel">
        <div class="et3-head">
          <h3>Sala de Imprensa</h3>
          <button class="et3-close" id="press-close">Fechar</button>
        </div>
        <div class="et3-body">
          <div class="et3-card">
            <h4>Manchetes</h4>
            <div id="press-list"></div>
          </div>
          <div class="et3-card">
            <h4>Resumo de narrativa</h4>
            <div class="et3-kpi" id="press-summary"></div>
            <div class="et3-ticker" id="press-ticker">Sem manchetes recentes.</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(pressOverlay);
  } else {
    pressOverlay = document.getElementById("press-overlay");
  }

  // overlay calendário
  if (!document.getElementById("calendar-overlay")) {
    calendarOverlay = document.createElement("div");
    calendarOverlay.className = "et3-overlay";
    calendarOverlay.id = "calendar-overlay";
    calendarOverlay.style.display = "none";
    calendarOverlay.innerHTML = `
      <div class="et3-panel">
        <div class="et3-head">
          <h3>Calendário Político</h3>
          <button class="et3-close" id="calendar-close">Fechar</button>
        </div>
        <div class="et3-body">
          <div class="et3-card">
            <h4>Próximos marcos</h4>
            <div id="calendar-milestones"></div>
          </div>
          <div class="et3-card">
            <h4>Projetos e prazos</h4>
            <div id="calendar-projects"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(calendarOverlay);
  } else {
    calendarOverlay = document.getElementById("calendar-overlay");
  }

  // bind eventos
  if (pressBtn) pressBtn.addEventListener("click", () => openPress());
  if (calendarBtn) calendarBtn.addEventListener("click", () => openCalendar());

  const pressClose = document.getElementById("press-close");
  if (pressClose) pressClose.addEventListener("click", () => closePress());
  const calendarClose = document.getElementById("calendar-close");
  if (calendarClose) calendarClose.addEventListener("click", () => closeCalendar());

  if (pressOverlay) {
    pressOverlay.addEventListener("click", (e) => { if (e.target === pressOverlay) closePress(); });
  }
  if (calendarOverlay) {
    calendarOverlay.addEventListener("click", (e) => { if (e.target === calendarOverlay) closeCalendar(); });
  }
}

// ===============================
// UTIL
// ===============================
function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }
function rnd(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function formatTime() { return `Semana ${state.week}/${state.year}`; }
function currentOffice() { return offices[state.officeIndex]; }
function isProjectActive(id) { return state.activeProjects.some(p => p.id === id); }
function isProjectCompleted(id) { return state.completedProjects.includes(id); }
function getProjectDef(id) { return projectCatalog.find(p => p.id === id) || null; }
function uid() { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

function weeksToDate(from, to) {
  // retorna diferença aproximada em semanas no mesmo ano/ciclo, sem calendário real
  // (suficiente para “prazo narrativo”)
  const a = from.year * 52 + from.week;
  const b = to.year * 52 + to.week;
  return Math.max(0, b - a);
}

// ===============================
// TELAS
// ===============================
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ===============================
// SALVAR/CARREGAR
// ===============================
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
      activeProjects: Array.isArray(parsed.activeProjects) ? parsed.activeProjects : [],
      completedProjects: Array.isArray(parsed.completedProjects) ? parsed.completedProjects : [],
      news: Array.isArray(parsed.news) ? parsed.news : [],
      unreadNews: Number.isFinite(parsed.unreadNews) ? parsed.unreadNews : 0,
      calendar: { ...state.calendar, ...(parsed.calendar || {}) },
    };

    if (parsed.party?.id) {
      const p = parties.find((x) => x.id === parsed.party.id) || parsed.party;
      state.party = p;
    }

    // garante nextElection coerente
    recalcNextElectionIfNeeded();

    return state;
  } catch (e) {
    console.error("Erro ao carregar save:", e);
    return null;
  }
}

function clearSave() { localStorage.removeItem(STORAGE_KEY); }

function updateContinueVisibility() {
  const hasSave = !!localStorage.getItem(STORAGE_KEY);
  if (continueBtn) continueBtn.style.display = hasSave ? "inline-block" : "none";
}

// ===============================
// FEED
// ===============================
function addFeed(message) {
  const p = document.createElement("p");
  p.textContent = message;
  feedDiv.prepend(p);
}

// ===============================
// VISUAL: fundo por cargo
// ===============================
function syncOfficeVisual() {
  const office = currentOffice();
  gameScreen.className = `screen active ${office.id}`;
}

// ===============================
// POPULARIDADE
// ===============================
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

// ===============================
// HUD
// ===============================
function setMeter(fillEl, valEl, value, isDanger = false) {
  const v = clamp(value);
  fillEl.style.width = `${v}%`;
  valEl.textContent = `${Math.round(v)}%`;

  if (!isDanger) {
    if (v < 35) fillEl.style.background = "var(--danger)";
    else if (v < 60) fillEl.style.background = "var(--warning)";
    else fillEl.style.background = "var(--success)";
  }
}

function updatePressBadge() {
  const badge = document.getElementById("press-badge");
  if (!badge) return;
  badge.textContent = String(state.unreadNews || 0);
  badge.classList.toggle("hot", (state.unreadNews || 0) > 0);
}

function renderHUD() {
  setMeter(meter.congress, meter.congressVal, state.congressSupport);
  setMeter(meter.media, meter.mediaVal, state.mediaTone);
  setMeter(meter.economy, meter.economyVal, state.economy);
  setMeter(meter.security, meter.securityVal, state.security);
  setMeter(meter.services, meter.servicesVal, state.services);

  setMeter(meter.scandal, meter.scandalVal, state.scandals, true);
  meter.scandal.style.background = "var(--danger)";

  Object.keys(groupEls).forEach((k) => {
    const v = clamp(state.groups[k]);
    groupEls[k].val.textContent = `${Math.round(v)}`;
    groupEls[k].bar.style.width = `${v}%`;
    if (v < 35) groupEls[k].bar.style.background = "var(--danger)";
    else if (v < 60) groupEls[k].bar.style.background = "var(--warning)";
    else groupEls[k].bar.style.background = "var(--success)";
  });

  if (hudProjectPill) {
    const activeCount = state.activeProjects.length;
    hudProjectPill.textContent = `Projetos: ${activeCount}`;
  }

  // dicas rápidas + contagem até eleição (ETAPA 3)
  const tips = [];
  if (state.congressSupport < 45) tips.push("Congresso baixo: articule alianças.");
  if (state.mediaTone < 45) tips.push("Mídia hostil: transparência/competência.");
  if (state.scandals > 55) tips.push("Escândalo alto: risco de travar projetos.");
  if (state.economy < 45) tips.push("Economia fraca: estímulo pode ajudar.");
  const weeksLeftToElection = weeksToDate({ week: state.week, year: state.year }, state.calendar.nextElection);
  tips.push(`Próxima janela eleitoral em ~${weeksLeftToElection} semana(s).`);

  if (hudNote) hudNote.textContent = tips.join(" ");

  updatePressBadge();
}

function updateHeader() {
  recomputePopularity();
  syncOfficeVisual();
  renderHUD();

  const office = currentOffice();
  playerInfoText.textContent = `${state.name} — Partido ${state.party?.id ?? ""} • ${formatTime()}`;
  officeText.textContent = office.name;

  statPopularity.textContent = state.popularity;
  statFunds.textContent = state.funds;
  statIntegrity.textContent = state.integrity;
}

// ===============================
// MODAL genérico
// ===============================
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

// ===============================
// AGENDA (ETAPA 2)
// ===============================
function openAgenda() { renderAgenda(); agendaOverlay.classList.remove("hidden"); }
function closeAgenda() { agendaOverlay.classList.add("hidden"); }

function getAvailableProjectsForOffice() {
  const office = currentOffice();
  return projectCatalog.filter((p) => {
    if (p.type !== office.type) return false;
    if (state.officeIndex < (p.minOfficeIndex || 0)) return false;
    if (isProjectActive(p.id)) return false;
    if (isProjectCompleted(p.id)) return false;
    return true;
  });
}

function checkProjectReq(def) {
  const req = def.req || {};
  const misses = [];
  if (req.funds != null && state.funds < req.funds) misses.push(`Fundos ≥ ${req.funds}`);
  if (req.congress != null && state.congressSupport < req.congress) misses.push(`Congresso ≥ ${req.congress}%`);
  if (req.integrity != null && state.integrity < req.integrity) misses.push(`Integridade ≥ ${req.integrity}%`);
  if (req.scandalsMax != null && state.scandals > req.scandalsMax) misses.push(`Escândalo ≤ ${req.scandalsMax}%`);
  return { ok: misses.length === 0, misses };
}

function startProject(projectId) {
  const def = getProjectDef(projectId);
  if (!def) return;

  const office = currentOffice();
  if (def.type !== office.type) { addFeed("Este projeto não é compatível com seu cargo atual."); return; }

  const reqCheck = checkProjectReq(def);
  if (!reqCheck.ok) { addFeed(`Não foi possível iniciar "${def.title}". Faltando: ${reqCheck.misses.join(", ")}.`); return; }

  if (def.cost) state.funds = clamp(state.funds - def.cost);

  state.activeProjects.push({
    id: def.id,
    startedAt: { week: state.week, year: state.year },
    totalWeeks: def.totalWeeks,
    weeksLeft: def.totalWeeks,
    stalledWeeks: 0,
    status: "running",
  });

  addFeed(`Projeto iniciado: ${def.title} (duração: ${def.totalWeeks} semanas).`);

  // manchete de início
  pushNews(makeProjectNews(def, "start"));

  saveGame();
  updateHeader();
  renderAgenda();
}

function cancelProject(projectId) {
  const idx = state.activeProjects.findIndex(p => p.id === projectId);
  if (idx === -1) return;

  const def = getProjectDef(projectId);
  state.activeProjects.splice(idx, 1);

  state.mediaTone = clamp(state.mediaTone - 2);
  state.congressSupport = clamp(state.congressSupport - 2);
  state.integrity = clamp(state.integrity - 1);

  addFeed(`Você cancelou: ${def?.title ?? projectId}. Desgaste político.`);
  pushNews({
    id: uid(),
    week: state.week,
    year: state.year,
    title: `Governo recua e cancela "${def?.title ?? "projeto"}"`,
    subtitle: "Oposição fala em improviso; aliados pedem explicações.",
    tone: "bad",
    tags: ["governabilidade", "agenda"],
    impact: { mediaTone: -1, congressSupport: -1 },
  });

  saveGame();
  updateHeader();
  renderAgenda();
}

function computeProjectStall(def) {
  const stallIf = def.stallIf || {};
  if (stallIf.congressBelow != null && state.congressSupport < stallIf.congressBelow) return true;
  return false;
}

function applyProjectWeeklyEffects(def) {
  const w = def.weekly || {};
  state.funds = clamp(state.funds + (w.funds || 0));
  state.integrity = clamp(state.integrity + (w.integrity || 0));
  state.congressSupport = clamp(state.congressSupport + (w.congressSupport || 0));
  state.mediaTone = clamp(state.mediaTone + (w.mediaTone || 0));
  state.economy = clamp(state.economy + (w.economy || 0));
  state.security = clamp(state.security + (w.security || 0));
  state.services = clamp(state.services + (w.services || 0));
  state.scandals = clamp(state.scandals + (w.scandals || 0));

  if (w.groupDelta) {
    Object.keys(w.groupDelta).forEach((k) => {
      if (state.groups[k] == null) return;
      state.groups[k] = clamp(state.groups[k] + w.groupDelta[k]);
    });
  }
}

function applyProjectCompletion(def) {
  const c = def.complete || {};
  state.funds = clamp(state.funds + (c.funds || 0));
  state.integrity = clamp(state.integrity + (c.integrity || 0));
  state.congressSupport = clamp(state.congressSupport + (c.congressSupport || 0));
  state.mediaTone = clamp(state.mediaTone + (c.mediaTone || 0));
  state.economy = clamp(state.economy + (c.economy || 0));
  state.security = clamp(state.security + (c.security || 0));
  state.services = clamp(state.services + (c.services || 0));
  state.scandals = clamp(state.scandals + (c.scandals || 0));

  if (c.groupDelta) {
    Object.keys(c.groupDelta).forEach((k) => {
      if (state.groups[k] == null) return;
      state.groups[k] = clamp(state.groups[k] + c.groupDelta[k]);
    });
  }
}

function tickProjectsOneWeek() {
  if (!state.activeProjects.length) return;

  const completedNow = [];

  state.activeProjects.forEach((p) => {
    const def = getProjectDef(p.id);
    if (!def) return;

    const stalled = computeProjectStall(def);
    const wasStalled = p.status === "stalled";
    p.status = stalled ? "stalled" : "running";

    if (stalled) {
      p.stalledWeeks += 1;
      if (!wasStalled) pushNews(makeProjectNews(def, "stall"));
      return;
    }

    // destravou
    if (wasStalled && !stalled) pushNews(makeProjectNews(def, "resume"));

    applyProjectWeeklyEffects(def);
    p.weeksLeft = Math.max(0, p.weeksLeft - 1);

    if (p.weeksLeft <= 0) completedNow.push(p.id);
  });

  if (completedNow.length) {
    completedNow.forEach((id) => {
      const def = getProjectDef(id);
      if (def) {
        applyProjectCompletion(def);
        addFeed(`Projeto concluído: ${def.title}.`);
        pushNews(makeProjectNews(def, "complete"));
      }
      state.completedProjects.push(id);
    });

    state.activeProjects = state.activeProjects.filter(p => !completedNow.includes(p.id));
  }
}

function renderAgenda() {
  if (!agendaActive || !agendaAvailable) return;

  const office = currentOffice();
  const typeLabel = office.type === "executive" ? "Executivo" : "Legislativo";
  if (agendaSubtitle) {
    agendaSubtitle.textContent = `Você está no ${typeLabel}. Projetos ativos aplicam efeitos semanais; se travarem, param de avançar.`;
  }

  agendaActive.innerHTML = "";
  if (!state.activeProjects.length) {
    const empty = document.createElement("div");
    empty.className = "project-card";
    empty.innerHTML = `<div class="project-title">Nenhum projeto ativo</div><div class="project-desc">Inicie um projeto em “Disponíveis”.</div>`;
    agendaActive.appendChild(empty);
  } else {
    state.activeProjects.forEach((p) => {
      const def = getProjectDef(p.id);
      if (!def) return;

      const done = def.totalWeeks - p.weeksLeft;
      const pct = def.totalWeeks > 0 ? Math.round((done / def.totalWeeks) * 100) : 0;
      const stalled = p.status === "stalled";

      const card = document.createElement("div");
      card.className = "project-card";

      const statusPillClass = stalled ? "bad" : (pct >= 70 ? "ok" : "warn");
      const statusText = stalled ? `TRAVADO` : `EM ANDAMENTO`;

      card.innerHTML = `
        <div class="project-top">
          <div>
            <div class="project-title">${def.title}</div>
            <div class="project-meta">
              <span class="pill ${statusPillClass}">${statusText}</span>
              <span class="pill">Semanas: ${p.weeksLeft}/${def.totalWeeks}</span>
              <span class="pill">Travado: ${p.stalledWeeks}</span>
            </div>
          </div>
        </div>
        <div class="project-desc">${def.desc}</div>

        <div class="progress-wrap">
          <div class="progress"><div class="${stalled ? "stalled" : ""}" style="width:${pct}%"></div></div>
          <div class="pill">${pct}%</div>
        </div>

        <div class="project-actions">
          <button class="btn small ghost" data-cancel="${def.id}">Cancelar</button>
        </div>
      `;

      card.querySelector(`[data-cancel="${def.id}"]`).addEventListener("click", () => {
        openModal(
          "Cancelar projeto",
          `Cancelar "${def.title}"? Isso gera desgaste (mídia e congresso).`,
          [
            { label: "Cancelar", type: "secondary", onClick: () => cancelProject(def.id) },
            { label: "Voltar", type: "primary" },
          ]
        );
      });

      agendaActive.appendChild(card);
    });
  }

  agendaAvailable.innerHTML = "";
  const available = getAvailableProjectsForOffice();

  if (!available.length) {
    const empty = document.createElement("div");
    empty.className = "project-card";
    empty.innerHTML = `<div class="project-title">Nenhum projeto disponível</div><div class="project-desc">Suba de cargo ou conclua projetos atuais para liberar novos.</div>`;
    agendaAvailable.appendChild(empty);
  } else {
    available.forEach((def) => {
      const reqCheck = checkProjectReq(def);
      const reqHtml = [
        def.req?.funds != null ? { label: `Fundos ≥ ${def.req.funds}`, ok: state.funds >= def.req.funds } : null,
        def.req?.congress != null ? { label: `Congresso ≥ ${def.req.congress}%`, ok: state.congressSupport >= def.req.congress } : null,
        def.req?.integrity != null ? { label: `Integridade ≥ ${def.req.integrity}%`, ok: state.integrity >= def.req.integrity } : null,
        def.req?.scandalsMax != null ? { label: `Escândalo ≤ ${def.req.scandalsMax}%`, ok: state.scandals <= def.req.scandalsMax } : null,
      ].filter(Boolean).map(r => `<span class="req ${r.ok ? "" : "miss"}">${r.label}</span>`).join("");

      const card = document.createElement("div");
      card.className = "project-card";

      const canStart = reqCheck.ok;
      const startLabel = canStart ? "Iniciar" : "Bloqueado";

      card.innerHTML = `
        <div class="project-top">
          <div>
            <div class="project-title">${def.title}</div>
            <div class="project-meta">
              <span class="pill">${def.type === "executive" ? "Executivo" : "Legislativo"}</span>
              <span class="pill">Custo: ${def.cost}</span>
              <span class="pill">Duração: ${def.totalWeeks} sem.</span>
            </div>
          </div>
        </div>

        <div class="project-desc">${def.desc}</div>

        <div class="req-grid">${reqHtml || `<span class="req">Sem requisitos</span>`}</div>

        <div class="project-actions">
          <button class="btn small ${canStart ? "primary" : "ghost"}" data-start="${def.id}" ${canStart ? "" : "disabled"}>${startLabel}</button>
        </div>
      `;

      card.querySelector(`[data-start="${def.id}"]`).addEventListener("click", () => startProject(def.id));
      agendaAvailable.appendChild(card);
    });
  }

  if (hudProjectPill) hudProjectPill.textContent = `Projetos: ${state.activeProjects.length}`;
}

// ===============================
// ETAPA 3: CALENDÁRIO
// ===============================
function recalcNextElectionIfNeeded() {
  // define um “ciclo eleitoral” fixo para narrativa e progressão
  const cycle = state.calendar?.electionCycleWeeks || 16;
  const nowIndex = state.year * 52 + state.week;
  let nextIndex = state.calendar?.nextElection
    ? (state.calendar.nextElection.year * 52 + state.calendar.nextElection.week)
    : (state.year * 52 + cycle);

  if (nextIndex <= nowIndex) {
    // pula para frente até ficar no futuro
    const diff = nowIndex - nextIndex;
    const steps = Math.floor(diff / cycle) + 1;
    nextIndex += steps * cycle;
  }

  state.calendar.nextElection = { year: Math.floor(nextIndex / 52), week: nextIndex % 52 };
  if (state.calendar.nextElection.week === 0) state.calendar.nextElection.week = 52;
}

function openCalendar() {
  renderCalendar();
  calendarOverlay.style.display = "flex";
}
function closeCalendar() { calendarOverlay.style.display = "none"; }

function renderCalendar() {
  recalcNextElectionIfNeeded();

  const milestones = document.getElementById("calendar-milestones");
  const projectsEl = document.getElementById("calendar-projects");
  if (!milestones || !projectsEl) return;

  const weeksLeft = weeksToDate({ week: state.week, year: state.year }, state.calendar.nextElection);

  milestones.innerHTML = `
    <div class="et3-newsitem">
      <strong>Agora</strong>
      <div class="et3-sub">${formatTime()} • Cargo: ${currentOffice().name}</div>
      <div class="et3-meta">
        <span class="et3-tag">Popularidade: ${Math.round(state.popularity)}%</span>
        <span class="et3-tag">Escândalo: ${Math.round(state.scandals)}%</span>
      </div>
    </div>

    <div class="et3-newsitem">
      <strong>Próxima janela eleitoral</strong>
      <div class="et3-sub">Semana ${state.calendar.nextElection.week}/${state.calendar.nextElection.year} (faltam ~${weeksLeft} semana(s))</div>
      <div class="et3-meta">
        <span class="et3-tag">Ciclo: ${state.calendar.electionCycleWeeks} semanas</span>
        <span class="et3-tag">Sugestão: prepare campanha</span>
      </div>
    </div>
  `;

  // Projetos/prazos
  if (!state.activeProjects.length) {
    projectsEl.innerHTML = `
      <div class="et3-newsitem">
        <strong>Sem projetos ativos</strong>
        <div class="et3-sub">Use a Agenda para iniciar projetos que geram manchetes e impacto semanal.</div>
      </div>
    `;
  } else {
    projectsEl.innerHTML = state.activeProjects.map(p => {
      const def = getProjectDef(p.id);
      const stalled = p.status === "stalled";
      return `
        <div class="et3-newsitem">
          <strong>${def?.title || p.id}</strong>
          <div class="et3-sub">${stalled ? "TRAVADO (sem avanço)" : "Em andamento"} • faltam ${p.weeksLeft} semana(s)</div>
          <div class="et3-meta">
            <span class="et3-tag">Iniciado: ${p.startedAt.week}/${p.startedAt.year}</span>
            <span class="et3-tag">${stalled ? "Precisa destravar Congresso" : "Aplicando efeitos semanais"}</span>
          </div>
        </div>
      `;
    }).join("");
  }
}

// ===============================
// ETAPA 3: NOTÍCIAS / SALA DE IMPRENSA
// ===============================
function pushNews(item) {
  if (!item) return;

  // aplica impacto de manchete (leve, para dar “realismo”)
  if (item.impact) {
    const i = item.impact;
    if (i.mediaTone) state.mediaTone = clamp(state.mediaTone + i.mediaTone);
    if (i.congressSupport) state.congressSupport = clamp(state.congressSupport + i.congressSupport);
    if (i.integrity) state.integrity = clamp(state.integrity + i.integrity);
    if (i.scandals) state.scandals = clamp(state.scandals + i.scandals);
    if (i.economy) state.economy = clamp(state.economy + i.economy);
    if (i.security) state.security = clamp(state.security + i.security);
    if (i.services) state.services = clamp(state.services + i.services);
    if (i.funds) state.funds = clamp(state.funds + i.funds);
  }

  state.news.unshift(item);
  state.unreadNews = clamp((state.unreadNews || 0) + 1, 0, 999);
  saveGame();
  updateHeader();
}

function makeProjectNews(def, phase) {
  const base = {
    id: uid(),
    week: state.week,
    year: state.year,
    tags: ["governo", "agenda"],
    impact: {},
  };

  if (phase === "start") {
    return {
      ...base,
      title: `Governo anuncia "${def.title}"`,
      subtitle: "Expectativa cresce; oposição analisa custos e viabilidade.",
      tone: "neutral",
      tags: [...base.tags, def.type === "executive" ? "gestão" : "congresso"],
      impact: { mediaTone: +0.5 },
    };
  }
  if (phase === "stall") {
    return {
      ...base,
      title: `"${def.title}" trava por falta de articulação`,
      subtitle: "Bastidores indicam resistência e cobrança por liderança política.",
      tone: "bad",
      tags: [...base.tags, "governabilidade"],
      impact: { mediaTone: -0.8, congressSupport: -0.6 },
    };
  }
  if (phase === "resume") {
    return {
      ...base,
      title: `Governo destrava "${def.title}" e retoma execução`,
      subtitle: "Aliança pontual recompõe maioria e reduz incerteza.",
      tone: "good",
      tags: [...base.tags, "articulação"],
      impact: { mediaTone: +0.6, congressSupport: +0.6 },
    };
  }
  // complete
  return {
    ...base,
    title: `Resultados: "${def.title}" é concluído`,
    subtitle: "Avaliação pública mede impacto; aliados celebram, críticos reagem.",
    tone: "good",
    tags: [...base.tags, "resultado"],
    impact: { mediaTone: +0.8 },
  };
}

function buildWeeklyHeadlines() {
  // Gera 1 a 3 manchetes por semana, baseado no estado.
  const n = (Math.random() < 0.35) ? 1 : (Math.random() < 0.75 ? 2 : 3);

  const candidates = [];

  // Economia
  if (state.economy >= 62) {
    candidates.push({
      tone: "good",
      title: "Indicadores econômicos surpreendem e mercado reage",
      subtitle: "Especialistas revisam expectativas e governistas capitalizam narrativa.",
      tags: ["economia", "mercado"],
      impact: { mediaTone: +0.6, congressSupport: +0.4 },
    });
  } else if (state.economy <= 40) {
    candidates.push({
      tone: "bad",
      title: "Pressão econômica aumenta e oposição cobra medidas",
      subtitle: "Governo enfrenta ruído e vê base hesitar em votações-chave.",
      tags: ["economia", "crise"],
      impact: { mediaTone: -0.8, congressSupport: -0.6 },
    });
  } else {
    candidates.push({
      tone: "neutral",
      title: "Economia segue estável; expectativa se volta à pauta política",
      subtitle: "Analistas veem pouco espaço para erro na comunicação do governo.",
      tags: ["economia"],
      impact: { mediaTone: +0.1 },
    });
  }

  // Segurança
  if (state.security >= 65) {
    candidates.push({
      tone: "good",
      title: "Queda em indicadores de violência vira vitrine do governo",
      subtitle: "Aliados defendem ampliação do modelo; críticos pedem transparência.",
      tags: ["segurança", "gestão"],
      impact: { mediaTone: +0.5 },
    });
  } else if (state.security <= 40) {
    candidates.push({
      tone: "bad",
      title: "Crise de segurança domina debate e derruba confiança",
      subtitle: "Governo é pressionado por respostas rápidas e coordenadas.",
      tags: ["segurança", "crise"],
      impact: { mediaTone: -0.9, congressSupport: -0.4 },
    });
  }

  // Serviços
  if (state.services >= 65) {
    candidates.push({
      tone: "good",
      title: "Serviços públicos melhoram e ampliam capital político",
      subtitle: "Efeito aparece em regiões-chave e reduz ruído social.",
      tags: ["serviços", "saúde/educação"],
      impact: { mediaTone: +0.4 },
    });
  } else if (state.services <= 40) {
    candidates.push({
      tone: "bad",
      title: "Filas e desgaste em serviços aumentam pressão nas redes",
      subtitle: "Base popular oscila e governo tenta conter repercussão.",
      tags: ["serviços", "pressão social"],
      impact: { mediaTone: -0.7 },
    });
  }

  // Escândalos (sempre com peso narrativo)
  if (state.scandals >= 60) {
    candidates.push({
      tone: "bad",
      title: "Nova denúncia amplia crise e eleva risco institucional",
      subtitle: "Planalto/gestão reage; aliados cobram mudança de rota.",
      tags: ["escândalo", "investigação"],
      impact: { mediaTone: -1.2, congressSupport: -0.8, integrity: -0.4 },
    });
  } else if (state.scandals <= 18 && state.integrity >= 55) {
    candidates.push({
      tone: "good",
      title: "Ambiente político esfria e governo ganha fôlego",
      subtitle: "Transparência e organização reduzem risco de crise.",
      tags: ["governança", "integridade"],
      impact: { mediaTone: +0.5, congressSupport: +0.3 },
    });
  }

  // Mídia
  if (state.mediaTone <= 35) {
    candidates.push({
      tone: "bad",
      title: "Mídia endurece cobertura e pauta vira negativa",
      subtitle: "Equipe de comunicação tenta reagir com dados e agenda propositiva.",
      tags: ["mídia", "comunicação"],
      impact: { popularity: 0, mediaTone: -0.2 },
    });
  } else if (state.mediaTone >= 70) {
    candidates.push({
      tone: "good",
      title: "Cobertura melhora e governo emplaca narrativa da semana",
      subtitle: "Aliados usam manchetes como ativo para coalizão.",
      tags: ["mídia", "narrativa"],
      impact: { congressSupport: +0.4 },
    });
  }

  // remove duplicação e sorteia
  const picked = [];
  for (let i = 0; i < n; i++) {
    const pool = candidates.filter(x => !picked.includes(x));
    if (!pool.length) break;
    picked.push(pick(pool));
  }

  picked.forEach(h => {
    pushNews({
      id: uid(),
      week: state.week,
      year: state.year,
      title: h.title,
      subtitle: h.subtitle,
      tone: h.tone,
      tags: h.tags || [],
      impact: h.impact || {},
    });
  });
}

function openPress() {
  renderPress();
  pressOverlay.style.display = "flex";
  // ao abrir, marca como lidas
  state.unreadNews = 0;
  saveGame();
  updatePressBadge();
}

function closePress() { pressOverlay.style.display = "none"; }

function renderPress() {
  const list = document.getElementById("press-list");
  const summary = document.getElementById("press-summary");
  const ticker = document.getElementById("press-ticker");
  if (!list || !summary || !ticker) return;

  const items = state.news.slice(0, 18);
  if (!items.length) {
    list.innerHTML = `
      <div class="et3-newsitem">
        <strong>Sem manchetes</strong>
        <div class="et3-sub">Avance semanas ou execute projetos para gerar notícia.</div>
      </div>
    `;
    ticker.textContent = "Sem manchetes recentes.";
  } else {
    list.innerHTML = items.map(n => {
      const toneClass = n.tone === "good" ? "good" : (n.tone === "bad" ? "bad" : "neutral");
      const tags = (n.tags || []).slice(0, 6).map(t => `<span class="et3-tag et3-tone ${toneClass}">${t}</span>`).join("");
      return `
        <div class="et3-newsitem">
          <strong>${n.title}</strong>
          <div class="et3-sub">${n.subtitle}</div>
          <div class="et3-sub" style="margin-top:6px;opacity:.75">Semana ${n.week}/${n.year}</div>
          <div class="et3-meta">${tags}</div>
        </div>
      `;
    }).join("");

    const top = items[0];
    ticker.textContent = `${top.title} — ${top.subtitle}`;
  }

  // resumo: “narrativa”
  const last10 = state.news.slice(0, 10);
  const good = last10.filter(x => x.tone === "good").length;
  const bad = last10.filter(x => x.tone === "bad").length;
  const neutral = last10.filter(x => x.tone === "neutral").length;

  summary.innerHTML = `
    <div class="et3-row"><span>Últimas 10 semanas</span><span>${good} boa(s) • ${neutral} neutra(s) • ${bad} ruim(ns)</span></div>
    <div class="et3-row"><span>Tom da mídia (agora)</span><span>${Math.round(state.mediaTone)}%</span></div>
    <div class="et3-row"><span>Apoio no Congresso</span><span>${Math.round(state.congressSupport)}%</span></div>
    <div class="et3-row"><span>Economia</span><span>${Math.round(state.economy)}%</span></div>
    <div class="et3-row"><span>Serviços</span><span>${Math.round(state.services)}%</span></div>
    <div class="et3-row"><span>Segurança</span><span>${Math.round(state.security)}%</span></div>
    <div class="et3-row"><span>Escândalo</span><span>${Math.round(state.scandals)}%</span></div>
  `;
}

// ===============================
// TEMPO/EVENTOS
// ===============================
function advanceTime(weeks = 1) {
  for (let i = 0; i < weeks; i++) {
    // tempo
    state.week += 1;
    if (state.week > 52) { state.week = 1; state.year += 1; }

    // macro drift
    state.economy = clamp(state.economy + rnd(-1.5, 1.2));
    state.security = clamp(state.security + rnd(-1.2, 1.0));
    state.services = clamp(state.services + rnd(-1.0, 1.2));

    // mídia ajusta
    const mediaPull = (50 - state.mediaTone) * 0.06;
    state.mediaTone = clamp(state.mediaTone + mediaPull - state.scandals * 0.01 + (state.integrity - 50) * 0.01);

    // escândalo tende a subir se integridade baixa
    state.scandals = clamp(state.scandals + (50 - state.integrity) * 0.03 + rnd(-0.8, 1.2));

    // ETAPA 2: tick projetos
    tickProjectsOneWeek();

    // eventos aleatórios
    if (Math.random() < 0.22) triggerRandomEvent();

    // ETAPA 3: manchetes semanais (sempre)
    buildWeeklyHeadlines();

    // calendário
    recalcNextElectionIfNeeded();
  }

  updateHeader();
  saveGame();

  if (agendaOverlay && !agendaOverlay.classList.contains("hidden")) renderAgenda();
  if (pressOverlay && pressOverlay.style.display === "flex") renderPress();
  if (calendarOverlay && calendarOverlay.style.display === "flex") renderCalendar();
}

function triggerRandomEvent() {
  const office = currentOffice();
  const isExec = office.type === "executive";

  const events = [
    {
      apply: () => {
        state.mediaTone = clamp(state.mediaTone - rnd(3, 9));
        state.integrity = clamp(state.integrity - rnd(1, 4));
        state.scandals = clamp(state.scandals + rnd(2, 6));
        addFeed("URGENTE: reportagem pressiona o governo. Sua imagem sofre.");
        pushNews({
          id: uid(), week: state.week, year: state.year,
          title: "Reportagem pressiona governo e expõe fragilidades",
          subtitle: "Equipe promete respostas; oposição promete reação institucional.",
          tone: "bad",
          tags: ["mídia", "crise"],
          impact: { mediaTone: -0.6, scandals: +0.6 }
        });
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

// ===============================
// AÇÕES (aplicação de deltas)
// ===============================
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

// ===============================
// AÇÕES por cargo
// ===============================
function getActionsForOffice(office) {
  const common = [
    { id: "discurso", label: "Discurso", handler: actionSpeech },
    { id: "campanha", label: "Campanha", handler: openCampaignModal },
    { id: "articular", label: "Articular apoio", handler: actionNegotiateSupport },
    { id: "passar-semana", label: "Passar semana", handler: () => advanceTime(1) },
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
  const office = currentOffice();
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

// ===============================
// AÇÕES (conteúdo)
// ===============================
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
      { label: "Sim", type: "primary", onClick: () => applyWorldDelta({ ...chosen.yes, logText: `Você votou SIM: ${chosen.title}.`, advanceWeeks: 1 }) },
      { label: "Não", type: "secondary", onClick: () => applyWorldDelta({ ...chosen.no, logText: `Você votou NÃO: ${chosen.title}.`, advanceWeeks: 1 }) },
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

  if (state.funds < chosen.cost) { addFeed("Sem fundos suficientes para articular novo projeto."); return; }

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
          pushNews({
            id: uid(), week: state.week, year: state.year,
            title: `Parlamentar apresenta "${chosen.name}" e pauta ganha tração`,
            subtitle: "Especialistas avaliam impacto; oposição aponta pontos frágeis.",
            tone: "neutral",
            tags: ["congresso", "projeto"],
            impact: { mediaTone: +0.3 }
          });
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
            logText: "Você sancionou. Governabilidade subiu, críticas éticas apareceram.",
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
            logText: "Você vetou. Integridade subiu, mas o Congresso reagiu.",
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
            logText: "Você atacou a mídia. Base endureceu, mas o desgaste aumentou.",
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
            logText: "Você ampliou programas sociais. Base popular subiu, custo fiscal aumentou.",
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
            logText: "Mutirão de saúde lançado. Melhorou atendimento e percepção.",
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
            logText: "Plano de segurança lançado. Sensação de ordem aumentou, críticas pontuais surgiram.",
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
            logText: "Discurso motivador. Boa repercussão.",
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
            logText: "Discurso técnico. Percepção de competência aumentou.",
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
            logText: "Discurso polarizador. Base mobilizou, rejeição cresceu.",
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
            logText: "Apoio subiu com pouco desgaste.",
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
            logText: "Apoio subiu, mas o risco de escândalo disparou.",
            advanceWeeks: 1,
          }),
      },
    ]
  );
}

// ===============================
// CAMPANHA
// ===============================
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
  if (!selectedToneId || !selectedThemeId) { alert("Selecione tom e tema."); return; }

  const tone = tones.find((t) => t.id === selectedToneId);
  const theme = themes.find((th) => th.id === selectedThemeId);

  const cost = 8;
  if (state.funds < cost) {
    addFeed("Sem fundos suficientes para campanha robusta.");
    closeCampaignModal();
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

  pushNews({
    id: uid(), week: state.week, year: state.year,
    title: `Campanha entra no ar com foco em ${theme.label}`,
    subtitle: `Tom ${tone.label} marca estratégia; adversários ajustam discurso.`,
    tone: "neutral",
    tags: ["campanha", "eleição"],
    impact: { mediaTone: +0.5 }
  });

  saveGame();
  closeCampaignModal();

  advanceTime(2);
  startElection();
});

cancelCampaignBtn.addEventListener("click", () => closeCampaignModal());

// ===============================
// ELEIÇÃO
// ===============================
function startElection() {
  showScreen("election");

  const office = currentOffice();
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

      pushNews({
        id: uid(), week: state.week, year: state.year,
        title: won ? "Vitória confirmada nas urnas" : "Derrota nas urnas e pressão por mudança",
        subtitle: won ? "Equipe comemora; oposição reorganiza estratégia." : "Aliados cobram reposicionamento; oposição cresce.",
        tone: won ? "good" : "bad",
        tags: ["eleição", "resultado"],
        impact: won ? { mediaTone: +0.6, congressSupport: +0.6 } : { mediaTone: -0.8, congressSupport: -0.6 }
      });

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
            logText: "A derrota abalou sua carreira. Reagrupe forças.",
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

    // troca de agenda ao subir
    state.activeProjects = [];

    // recalcula calendário (novo ciclo narrativo)
    recalcNextElectionIfNeeded();

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

// ===============================
// MANDATO
// ===============================
function beginMandate(newOffice = false) {
  showScreen("game");
  if (newOffice) feedDiv.innerHTML = "";
  updateHeader();
  renderActions();

  injectEtapa3UI();
  updatePressBadge();

  addFeed(newOffice ? `Novo mandato: ${currentOffice().name}.` : `Retomando mandato como ${currentOffice().name}.`);
  saveGame();
}

// ===============================
// PARTIDOS
// ===============================
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

// ===============================
// BOTÕES principais
// ===============================
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

    activeProjects: [],
    completedProjects: [],

    news: [],
    unreadNews: 0,
    calendar: {
      electionCycleWeeks: 16,
      nextElection: { week: 16, year: 2025 },
    },

    timeline: [],
  };

  clearSave();
  playerNameInput.value = "";
  renderParties();
  showScreen("selection");
  updateContinueVisibility();
});

continueBtn.addEventListener("click", () => {
  const loaded = loadGame();
  if (!loaded) { alert("Nenhum jogo salvo encontrado."); return; }
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

  state.activeProjects = [];
  state.completedProjects = [];

  state.news = [];
  state.unreadNews = 0;
  state.calendar = state.calendar || { electionCycleWeeks: 16, nextElection: { week: 16, year: 2025 } };
  recalcNextElectionIfNeeded();

  pushNews({
    id: uid(), week: state.week, year: state.year,
    title: "Novo nome entra no tabuleiro político",
    subtitle: `Bastidores observam ${state.name} e aguardam primeiro movimento.`,
    tone: "neutral",
    tags: ["início", "carreira"],
    impact: { mediaTone: +0.2 }
  });

  saveGame();
  beginMandate(true);
  updateContinueVisibility();
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
      activeProjects: [],
      completedProjects: [],
      news: [],
      unreadNews: 0,
      calendar: { electionCycleWeeks: 16, nextElection: { week: 16, year: 2025 } },
      timeline: [],
    };

    playerNameInput.value = "";
    renderParties();
    showScreen("start");
    updateContinueVisibility();
  }
});

// ===============================
// BOTÕES da Agenda
// ===============================
if (openAgendaBtn) openAgendaBtn.addEventListener("click", () => openAgenda());
if (closeAgendaBtn) closeAgendaBtn.addEventListener("click", () => closeAgenda());
if (agendaRefreshBtn) agendaRefreshBtn.addEventListener("click", () => renderAgenda());

if (agendaOverlay) {
  agendaOverlay.addEventListener("click", (e) => {
    if (e.target === agendaOverlay || e.target.classList.contains("overlay-backdrop")) closeAgenda();
  });
}

// ===============================
// INIT
// ===============================
function init() {
  renderParties();
  updateContinueVisibility();

  // se tiver save, recalcula calendário sem “abrir o jogo”
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const loaded = loadGame();
    if (loaded) {
      recalcNextElectionIfNeeded();
      saveGame();
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
