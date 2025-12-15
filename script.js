const STORAGE_KEY = "simuladorPoliticoSave_v10_staff";

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
  activeProjects: [],
  completedProjects: [],

  // ETAPA 3
  news: [],
  unreadNews: 0,
  calendar: {
    electionCycleWeeks: 16,
    nextElection: { week: 16, year: 2025 },
  },

  // ETAPA 4 (STAFF)
  staff: {
    hired: {
      chief: null,   // { id, level, weeklyCost, effects, name }
      whip: null,
      press: null,
      econ: null,
      legal: null,
    },
    availablePoolSeed: 1, // muda para renovar pool
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
// ETAPA 4: CATÁLOGO DE ASSESSORES
// - effects.passive: deltas por semana
// - effects.crisis: bônus ao escolher ações de crise/press
// - effects.project: reduz chance/impacto de travamento
// ===============================
const staffRoles = [
  {
    roleId: "chief",
    title: "Chefe de Gabinete",
    desc: "Organiza a máquina, reduz travamentos e melhora execução.",
    minOfficeIndex: 0,
    pool: [
      { id: "chief_1", name: "Patrícia Duarte", level: 2, weeklyCost: 3, effects: { passive: { integrity: +0.2, services: +0.1 }, project: { stallBuffer: 2, stallChanceMult: 0.85 } } },
      { id: "chief_2", name: "Ricardo Menezes", level: 3, weeklyCost: 5, effects: { passive: { integrity: +0.3, mediaTone: +0.15 }, project: { stallBuffer: 3, stallChanceMult: 0.80 } } },
      { id: "chief_3", name: "Helena Siqueira", level: 4, weeklyCost: 7, effects: { passive: { integrity: +0.35, services: +0.2 }, project: { stallBuffer: 4, stallChanceMult: 0.72 } } },
      { id: "chief_4", name: "Marcos Vilar", level: 5, weeklyCost: 9, effects: { passive: { integrity: +0.45, mediaTone: +0.2, services: +0.2 }, project: { stallBuffer: 5, stallChanceMult: 0.65 } } },
    ],
  },
  {
    roleId: "whip",
    title: "Articulador Político",
    desc: "Constrói maioria, estabiliza o Congresso e destrava projetos.",
    minOfficeIndex: 0,
    pool: [
      { id: "whip_1", name: "Bruno Azevedo", level: 2, weeklyCost: 3, effects: { passive: { congressSupport: +0.45 }, project: { stallBuffer: 2, stallChanceMult: 0.88 } } },
      { id: "whip_2", name: "Carla Noronha", level: 3, weeklyCost: 5, effects: { passive: { congressSupport: +0.65, mediaTone: +0.05 }, project: { stallBuffer: 3, stallChanceMult: 0.82 } } },
      { id: "whip_3", name: "Eduardo Pires", level: 4, weeklyCost: 7, effects: { passive: { congressSupport: +0.85, mediaTone: +0.08 }, project: { stallBuffer: 4, stallChanceMult: 0.75 } } },
      { id: "whip_4", name: "Lívia Campos", level: 5, weeklyCost: 9, effects: { passive: { congressSupport: +1.05, mediaTone: +0.10 }, project: { stallBuffer: 5, stallChanceMult: 0.68 } } },
    ],
  },
  {
    roleId: "press",
    title: "Porta-voz",
    desc: "Controla narrativa, reduz dano de crise e melhora cobertura.",
    minOfficeIndex: 0,
    pool: [
      { id: "press_1", name: "Tainá Rocha", level: 2, weeklyCost: 3, effects: { passive: { mediaTone: +0.55 }, crisis: { mediaShield: 0.15 } } },
      { id: "press_2", name: "Guilherme Bastos", level: 3, weeklyCost: 5, effects: { passive: { mediaTone: +0.75, integrity: +0.05 }, crisis: { mediaShield: 0.22 } } },
      { id: "press_3", name: "Sofia Lacerda", level: 4, weeklyCost: 7, effects: { passive: { mediaTone: +0.95, integrity: +0.08 }, crisis: { mediaShield: 0.30 } } },
      { id: "press_4", name: "Renato Vidal", level: 5, weeklyCost: 9, effects: { passive: { mediaTone: +1.15, integrity: +0.10 }, crisis: { mediaShield: 0.38 } } },
    ],
  },
  {
    roleId: "econ",
    title: "Assessor Econômico",
    desc: "Reduz volatilidade e melhora performance macroeconômica.",
    minOfficeIndex: 0,
    pool: [
      { id: "econ_1", name: "Nádia Moreira", level: 2, weeklyCost: 3, effects: { passive: { economy: +0.55, funds: +0.10 }, macro: { econVolatilityMult: 0.92 } } },
      { id: "econ_2", name: "Fernando Leal", level: 3, weeklyCost: 5, effects: { passive: { economy: +0.75, funds: +0.15 }, macro: { econVolatilityMult: 0.88 } } },
      { id: "econ_3", name: "Paulo Arantes", level: 4, weeklyCost: 7, effects: { passive: { economy: +0.95, funds: +0.20 }, macro: { econVolatilityMult: 0.84 } } },
      { id: "econ_4", name: "Camila Rangel", level: 5, weeklyCost: 9, effects: { passive: { economy: +1.15, funds: +0.25 }, macro: { econVolatilityMult: 0.80 } } },
    ],
  },
  {
    roleId: "legal",
    title: "Jurídico/Compliance",
    desc: "Reduz escândalos, melhora integridade e risco institucional.",
    minOfficeIndex: 0,
    pool: [
      { id: "legal_1", name: "João Furtado", level: 2, weeklyCost: 3, effects: { passive: { scandals: -0.55, integrity: +0.20 }, risk: { scandalEventMult: 0.90 } } },
      { id: "legal_2", name: "Aline Barros", level: 3, weeklyCost: 5, effects: { passive: { scandals: -0.75, integrity: +0.25 }, risk: { scandalEventMult: 0.82 } } },
      { id: "legal_3", name: "Pedro Nogueira", level: 4, weeklyCost: 7, effects: { passive: { scandals: -0.95, integrity: +0.30 }, risk: { scandalEventMult: 0.75 } } },
      { id: "legal_4", name: "Larissa Teixeira", level: 5, weeklyCost: 9, effects: { passive: { scandals: -1.15, integrity: +0.35 }, risk: { scandalEventMult: 0.68 } } },
    ],
  },
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
// ETAPA 3+4: UI DINÂMICA (Calendário + Imprensa + Assessores)
// ===============================
let pressBtn = null;
let calendarBtn = null;
let staffBtn = null;
let pressOverlay = null;
let calendarOverlay = null;
let staffOverlay = null;

function injectEtapa34UI() {
  const css = `
  .et3-fabbar{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
  .et3-btn{border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);color:#fff;padding:10px 12px;border-radius:12px;cursor:pointer;backdrop-filter: blur(6px);font-weight:700}
  .et3-btn:hover{transform: translateY(-1px)}
  .et3-badge{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 8px;border-radius:999px;margin-left:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);font-size:12px}
  .et3-badge.hot{background:rgba(255,80,80,.18);border-color:rgba(255,80,80,.35)}
  .et3-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:9999}
  .et3-panel{width:min(1040px,94vw);height:min(80vh,760px);background:rgba(8,10,14,.92);border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 16px 80px rgba(0,0,0,.55);overflow:hidden;display:flex;flex-direction:column}
  .et3-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12)}
  .et3-head h3{margin:0;font-size:16px;letter-spacing:.4px}
  .et3-close{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:8px 10px;cursor:pointer}
  .et3-body{padding:12px 14px;overflow:auto;display:grid;grid-template-columns: 1.2fr .8fr;gap:12px}
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

  /* STAFF */
  .st-grid{display:grid;grid-template-columns:1fr;gap:10px}
  .st-role{padding:10px;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(0,0,0,.24)}
  .st-role-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
  .st-role-title{font-weight:900;font-size:13px}
  .st-role-sub{opacity:.78;font-size:12px;margin-top:4px;line-height:1.35}
  .st-pill{display:inline-flex;gap:6px;align-items:center;font-size:11px;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06)}
  .st-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .st-btn{border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);color:#fff;padding:8px 10px;border-radius:12px;cursor:pointer;font-weight:800;font-size:12px}
  .st-btn.primary{background:rgba(80,220,120,.12);border-color:rgba(80,220,120,.26)}
  .st-btn.danger{background:rgba(255,80,80,.12);border-color:rgba(255,80,80,.26)}
  .st-btn:disabled{opacity:.45;cursor:not-allowed}
  .st-small{font-size:11px;opacity:.8;margin-top:6px}
  `;
  if (!document.getElementById("etapa34-style")) {
    const styleTag = document.createElement("style");
    styleTag.id = "etapa34-style";
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  // barra de botões
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

    staffBtn = document.createElement("button");
    staffBtn.className = "et3-btn";
    staffBtn.id = "staff-btn";
    staffBtn.textContent = "Assessores";

    bar.appendChild(calendarBtn);
    bar.appendChild(pressBtn);
    bar.appendChild(staffBtn);

    if (anchor) anchor.appendChild(bar);
  } else {
    pressBtn = document.getElementById("press-btn");
    calendarBtn = document.getElementById("calendar-btn");
    staffBtn = document.getElementById("staff-btn");
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

  // overlay staff
  if (!document.getElementById("staff-overlay")) {
    staffOverlay = document.createElement("div");
    staffOverlay.className = "et3-overlay";
    staffOverlay.id = "staff-overlay";
    staffOverlay.style.display = "none";
    staffOverlay.innerHTML = `
      <div class="et3-panel">
        <div class="et3-head">
          <h3>Assessores e Bastidores</h3>
          <button class="et3-close" id="staff-close">Fechar</button>
        </div>
        <div class="et3-body">
          <div class="et3-card">
            <h4>Equipe atual</h4>
            <div id="staff-hired"></div>
          </div>
          <div class="et3-card">
            <h4>Banco de talentos</h4>
            <div id="staff-available"></div>
            <div style="margin-top:10px">
              <button class="st-btn" id="staff-refresh">Renovar banco</button>
              <div class="st-small">Renovar altera os nomes disponíveis (custo político leve na mídia).</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(staffOverlay);
  } else {
    staffOverlay = document.getElementById("staff-overlay");
  }

  // bind
  if (pressBtn) pressBtn.addEventListener("click", () => openPress());
  if (calendarBtn) calendarBtn.addEventListener("click", () => openCalendar());
  if (staffBtn) staffBtn.addEventListener("click", () => openStaff());

  const pressClose = document.getElementById("press-close");
  if (pressClose) pressClose.addEventListener("click", () => closePress());
  const calendarClose = document.getElementById("calendar-close");
  if (calendarClose) calendarClose.addEventListener("click", () => closeCalendar());
  const staffClose = document.getElementById("staff-close");
  if (staffClose) staffClose.addEventListener("click", () => closeStaff());

  const staffRefresh = document.getElementById("staff-refresh");
  if (staffRefresh) {
    staffRefresh.addEventListener("click", () => {
      state.staff.availablePoolSeed = (state.staff.availablePoolSeed || 1) + 1;
      state.mediaTone = clamp(state.mediaTone - 0.8);
      pushNews({
        id: uid(),
        week: state.week,
        year: state.year,
        title: "Movimentação nos bastidores: troca no radar de assessores",
        subtitle: "Imprensa nota mudanças na equipe e especula sobre estratégia.",
        tone: "neutral",
        tags: ["bastidores", "staff"],
        impact: { mediaTone: -0.2 }
      });
      saveGame();
      updateHeader();
      renderStaff();
    });
  }

  if (pressOverlay) pressOverlay.addEventListener("click", (e) => { if (e.target === pressOverlay) closePress(); });
  if (calendarOverlay) calendarOverlay.addEventListener("click", (e) => { if (e.target === calendarOverlay) closeCalendar(); });
  if (staffOverlay) staffOverlay.addEventListener("click", (e) => { if (e.target === staffOverlay) closeStaff(); });
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
  const a = from.year * 52 + from.week;
  const b = to.year * 52 + to.week;
  return Math.max(0, b - a);
}

function ensureStaffState() {
  if (!state.staff) state.staff = { hired: { chief: null, whip: null, press: null, econ: null, legal: null }, availablePoolSeed: 1 };
  if (!state.staff.hired) state.staff.hired = { chief: null, whip: null, press: null, econ: null, legal: null };
  if (!("availablePoolSeed" in state.staff)) state.staff.availablePoolSeed = 1;
}

function getHired(roleId) {
  ensureStaffState();
  return state.staff.hired[roleId] || null;
}

function setHired(roleId, staffObjOrNull) {
  ensureStaffState();
  state.staff.hired[roleId] = staffObjOrNull;
}

function getAllHired() {
  ensureStaffState();
  return Object.values(state.staff.hired).filter(Boolean);
}

function getStaffPassiveTotals() {
  const totals = {
    funds: 0, integrity: 0, congressSupport: 0, mediaTone: 0,
    economy: 0, security: 0, services: 0, scandals: 0,
    macro: { econVolatilityMult: 1 },
    risk: { scandalEventMult: 1 },
    crisis: { mediaShield: 0 },
    project: { stallBuffer: 0, stallChanceMult: 1 },
    weeklyCost: 0,
  };

  getAllHired().forEach(s => {
    totals.weeklyCost += (s.weeklyCost || 0);

    const eff = s.effects || {};
    if (eff.passive) {
      Object.keys(eff.passive).forEach(k => {
        if (k in totals) totals[k] += eff.passive[k];
      });
    }
    if (eff.macro?.econVolatilityMult != null) totals.macro.econVolatilityMult *= eff.macro.econVolatilityMult;
    if (eff.risk?.scandalEventMult != null) totals.risk.scandalEventMult *= eff.risk.scandalEventMult;
    if (eff.crisis?.mediaShield != null) totals.crisis.mediaShield += eff.crisis.mediaShield;

    if (eff.project) {
      if (eff.project.stallBuffer != null) totals.project.stallBuffer += eff.project.stallBuffer;
      if (eff.project.stallChanceMult != null) totals.project.stallChanceMult *= eff.project.stallChanceMult;
    }
  });

  totals.project.stallChanceMult = Math.max(0.50, Math.min(1.0, totals.project.stallChanceMult));
  totals.macro.econVolatilityMult = Math.max(0.65, Math.min(1.0, totals.macro.econVolatilityMult));
  totals.risk.scandalEventMult = Math.max(0.55, Math.min(1.0, totals.risk.scandalEventMult));
  totals.crisis.mediaShield = Math.max(0, Math.min(0.55, totals.crisis.mediaShield));

  return totals;
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
      staff: { ...state.staff, ...(parsed.staff || {}) },
    };

    if (parsed.party?.id) {
      const p = parties.find((x) => x.id === parsed.party.id) || parsed.party;
      state.party = p;
    }

    ensureStaffState();
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
    const staffCost = Math.round(getStaffPassiveTotals().weeklyCost);
    hudProjectPill.textContent = `Projetos: ${activeCount} • Staff: -${staffCost}/sem`;
  }

  const tips = [];
  if (state.congressSupport < 45) tips.push("Congresso baixo: articule alianças (Articulador ajuda).");
  if (state.mediaTone < 45) tips.push("Mídia hostil: fortaleça comunicação (Porta-voz ajuda).");
  if (state.scandals > 55) tips.push("Escândalo alto: risco institucional (Jurídico ajuda).");
  if (state.economy < 45) tips.push("Economia fraca: estabilize macro (Assessor econômico ajuda).");

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
  const staffTotals = getStaffPassiveTotals();

  // “buffer” de articulação: permite ficar um pouco abaixo sem travar
  const buffer = staffTotals.project.stallBuffer || 0;

  if (stallIf.congressBelow != null) {
    const threshold = stallIf.congressBelow - buffer;
    if (state.congressSupport < threshold) {
      // chance de travar mitigada pelo staff
      const baseChance = 0.78; // travar quando muito abaixo
      const mult = staffTotals.project.stallChanceMult || 1;
      const chance = Math.max(0.35, baseChance * mult);
      return Math.random() < chance;
    }
  }
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
    const st = getStaffPassiveTotals();
    agendaSubtitle.textContent = `Você está no ${typeLabel}. Projetos ativos aplicam efeitos semanais; se travarem, param de avançar. (Bônus staff: buffer ${st.project.stallBuffer} / chance x${st.project.stallChanceMult.toFixed(2)})`;
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

  if (hudProjectPill) {
    const staffCost = Math.round(getStaffPassiveTotals().weeklyCost);
    hudProjectPill.textContent = `Projetos: ${state.activeProjects.length} • Staff: -${staffCost}/sem`;
  }
}

// ===============================
// ETAPA 3: CALENDÁRIO
// ===============================
function recalcNextElectionIfNeeded() {
  const cycle = state.calendar?.electionCycleWeeks || 16;
  const nowIndex = state.year * 52 + state.week;
  let nextIndex = state.calendar?.nextElection
    ? (state.calendar.nextElection.year * 52 + state.calendar.nextElection.week)
    : (state.year * 52 + cycle);

  if (nextIndex <= nowIndex) {
    const diff = nowIndex - nextIndex;
    const steps = Math.floor(diff / cycle) + 1;
    nextIndex += steps * cycle;
  }

  state.calendar.nextElection = { year: Math.floor(nextIndex / 52), week: nextIndex % 52 };
  if (state.calendar.nextElection.week === 0) state.calendar.nextElection.week = 52;
}

function openCalendar() { renderCalendar(); calendarOverlay.style.display = "flex"; }
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
// ETAPA 3: NOTÍCIAS / IMPRENSA
// ===============================
function pushNews(item) {
  if (!item) return;

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
  const n = (Math.random() < 0.35) ? 1 : (Math.random() < 0.75 ? 2 : 3);
  const candidates = [];

  if (state.economy >= 62) {
    candidates.push({ tone: "good", title: "Indicadores econômicos surpreendem e mercado reage", subtitle: "Especialistas revisam expectativas e governistas capitalizam narrativa.", tags: ["economia", "mercado"], impact: { mediaTone: +0.6, congressSupport: +0.4 } });
  } else if (state.economy <= 40) {
    candidates.push({ tone: "bad", title: "Pressão econômica aumenta e oposição cobra medidas", subtitle: "Governo enfrenta ruído e vê base hesitar em votações-chave.", tags: ["economia", "crise"], impact: { mediaTone: -0.8, congressSupport: -0.6 } });
  } else {
    candidates.push({ tone: "neutral", title: "Economia segue estável; expectativa se volta à pauta política", subtitle: "Analistas veem pouco espaço para erro na comunicação do governo.", tags: ["economia"], impact: { mediaTone: +0.1 } });
  }

  if (state.security >= 65) {
    candidates.push({ tone: "good", title: "Queda em indicadores de violência vira vitrine do governo", subtitle: "Aliados defendem ampliação do modelo; críticos pedem transparência.", tags: ["segurança", "gestão"], impact: { mediaTone: +0.5 } });
  } else if (state.security <= 40) {
    candidates.push({ tone: "bad", title: "Crise de segurança domina debate e derruba confiança", subtitle: "Governo é pressionado por respostas rápidas e coordenadas.", tags: ["segurança", "crise"], impact: { mediaTone: -0.9, congressSupport: -0.4 } });
  }

  if (state.services >= 65) {
    candidates.push({ tone: "good", title: "Serviços públicos melhoram e ampliam capital político", subtitle: "Efeito aparece em regiões-chave e reduz ruído social.", tags: ["serviços", "saúde/educação"], impact: { mediaTone: +0.4 } });
  } else if (state.services <= 40) {
    candidates.push({ tone: "bad", title: "Filas e desgaste em serviços aumentam pressão nas redes", subtitle: "Base popular oscila e governo tenta conter repercussão.", tags: ["serviços", "pressão social"], impact: { mediaTone: -0.7 } });
  }

  if (state.scandals >= 60) {
    candidates.push({ tone: "bad", title: "Nova denúncia amplia crise e eleva risco institucional", subtitle: "Governo reage; aliados cobram mudança de rota.", tags: ["escândalo", "investigação"], impact: { mediaTone: -1.2, congressSupport: -0.8, integrity: -0.4 } });
  } else if (state.scandals <= 18 && state.integrity >= 55) {
    candidates.push({ tone: "good", title: "Ambiente político esfria e governo ganha fôlego", subtitle: "Transparência e organização reduzem risco de crise.", tags: ["governança", "integridade"], impact: { mediaTone: +0.5, congressSupport: +0.3 } });
  }

  if (state.mediaTone <= 35) {
    candidates.push({ tone: "bad", title: "Mídia endurece cobertura e pauta vira negativa", subtitle: "Equipe de comunicação tenta reagir com dados e agenda propositiva.", tags: ["mídia", "comunicação"], impact: { mediaTone: -0.2 } });
  } else if (state.mediaTone >= 70) {
    candidates.push({ tone: "good", title: "Cobertura melhora e governo emplaca narrativa da semana", subtitle: "Aliados usam manchetes como ativo para coalizão.", tags: ["mídia", "narrativa"], impact: { congressSupport: +0.4 } });
  }

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

  const last10 = state.news.slice(0, 10);
  const good = last10.filter(x => x.tone === "good").length;
  const bad = last10.filter(x => x.tone === "bad").length;
  const neutral = last10.filter(x => x.tone === "neutral").length;

  summary.innerHTML = `
    <div class="et3-row"><span>Últimas 10 semanas</span><span>${good} boa(s) • ${neutral} neutra(s) • ${bad} ruim(ns)</span></div>
    <div class="et3-row"><span>Tom da mídia</span><span>${Math.round(state.mediaTone)}%</span></div>
    <div class="et3-row"><span>Apoio no Congresso</span><span>${Math.round(state.congressSupport)}%</span></div>
    <div class="et3-row"><span>Economia</span><span>${Math.round(state.economy)}%</span></div>
    <div class="et3-row"><span>Serviços</span><span>${Math.round(state.services)}%</span></div>
    <div class="et3-row"><span>Segurança</span><span>${Math.round(state.security)}%</span></div>
    <div class="et3-row"><span>Escândalo</span><span>${Math.round(state.scandals)}%</span></div>
  `;
}

// ===============================
// ETAPA 4: STAFF (UI + LÓGICA)
// ===============================
function openStaff() {
  renderStaff();
  staffOverlay.style.display = "flex";
}
function closeStaff() { staffOverlay.style.display = "none"; }

function getRoleDef(roleId) {
  return staffRoles.find(r => r.roleId === roleId) || null;
}

function getAvailableStaffForRole(roleId) {
  const role = getRoleDef(roleId);
  if (!role) return [];

  // “pool” determinístico por seed: muda quando renovar
  const seed = state.staff?.availablePoolSeed || 1;
  const pool = role.pool.slice();

  // simples shuffle determinístico usando seed
  let x = (seed * 9301 + 49297) % 233280;
  function rand() { x = (x * 9301 + 49297) % 233280; return x / 233280; }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // retorna top 2-3 opções
  return pool.slice(0, 3);
}

function hireStaff(roleId, staffObj) {
  const role = getRoleDef(roleId);
  if (!role) return;

  // cargo mínimo (se quiser travar no futuro por cargo)
  if (state.officeIndex < (role.minOfficeIndex || 0)) {
    addFeed(`Você ainda não tem estrutura para contratar: ${role.title}.`);
    return;
  }

  const already = getHired(roleId);
  if (already) {
    openModal(
      "Substituir assessor",
      `Você já tem ${role.title} (${already.name}). Substituir por ${staffObj.name}? (gera ruído na mídia)`,
      [
        {
          label: "Substituir",
          type: "primary",
          onClick: () => {
            setHired(roleId, staffObj);
            state.mediaTone = clamp(state.mediaTone - 1.2);
            addFeed(`Você substituiu ${role.title}: agora é ${staffObj.name} (nível ${staffObj.level}).`);
            pushNews({
              id: uid(),
              week: state.week,
              year: state.year,
              title: `Mudança no ${role.title} chama atenção`,
              subtitle: "Imprensa avalia impacto e oposição lê sinal político.",
              tone: "neutral",
              tags: ["bastidores", "staff"],
              impact: { mediaTone: -0.2 }
            });
            saveGame();
            updateHeader();
            renderStaff();
          }
        },
        { label: "Cancelar", type: "secondary" }
      ]
    );
    return;
  }

  setHired(roleId, staffObj);
  state.mediaTone = clamp(state.mediaTone + 0.4);
  addFeed(`Contratado: ${role.title} — ${staffObj.name} (nível ${staffObj.level}).`);
  pushNews({
    id: uid(),
    week: state.week,
    year: state.year,
    title: `Bastidores: ${role.title} reforçado`,
    subtitle: `${staffObj.name} assume com promessa de profissionalizar a operação.`,
    tone: "good",
    tags: ["bastidores", "staff"],
    impact: { mediaTone: +0.2 }
  });

  saveGame();
  updateHeader();
  renderStaff();
}

function fireStaff(roleId) {
  const role = getRoleDef(roleId);
  const hired = getHired(roleId);
  if (!role || !hired) return;

  openModal(
    "Demitir assessor",
    `Demitir ${role.title} (${hired.name})? Isso gera desgaste e aumenta risco de instabilidade.`,
    [
      {
        label: "Demitir",
        type: "secondary",
        onClick: () => {
          setHired(roleId, null);
          state.mediaTone = clamp(state.mediaTone - 2.0);
          state.congressSupport = clamp(state.congressSupport - 0.8);
          addFeed(`Você demitiu ${role.title}: ${hired.name}.`);
          pushNews({
            id: uid(),
            week: state.week,
            year: state.year,
            title: `Crise interna: saída no ${role.title}`,
            subtitle: "Bastidores falam em tensão e recalibragem de rota.",
            tone: "bad",
            tags: ["bastidores", "staff"],
            impact: { mediaTone: -0.5, congressSupport: -0.2 }
          });
          saveGame();
          updateHeader();
          renderStaff();
        }
      },
      { label: "Cancelar", type: "primary" }
    ]
  );
}

function renderStaff() {
  const hiredEl = document.getElementById("staff-hired");
  const availEl = document.getElementById("staff-available");
  if (!hiredEl || !availEl) return;

  ensureStaffState();

  const totals = getStaffPassiveTotals();
  const cost = Math.round(totals.weeklyCost);

  const hiredCards = staffRoles.map(role => {
    const hired = getHired(role.roleId);
    if (!hired) {
      return `
        <div class="st-role">
          <div class="st-role-top">
            <div>
              <div class="st-role-title">${role.title} <span class="st-pill">VAGO</span></div>
              <div class="st-role-sub">${role.desc}</div>
            </div>
            <div class="st-pill">Custo: —</div>
          </div>
          <div class="st-small">Contrate alguém no Banco de Talentos.</div>
        </div>
      `;
    }

    const passive = hired.effects?.passive || {};
    const passiveTxt = Object.keys(passive).length
      ? Object.entries(passive).map(([k,v]) => `${k} ${v >= 0 ? "+" : ""}${Number(v).toFixed(2)}/sem`).join(" • ")
      : "Sem bônus passivo";

    return `
      <div class="st-role">
        <div class="st-role-top">
          <div>
            <div class="st-role-title">${role.title} <span class="st-pill">Nível ${hired.level}</span></div>
            <div class="st-role-sub"><strong>${hired.name}</strong> — ${role.desc}</div>
          </div>
          <div class="st-pill">-${hired.weeklyCost}/sem</div>
        </div>
        <div class="st-small">${passiveTxt}</div>
        <div class="st-actions">
          <button class="st-btn danger" data-fire="${role.roleId}">Demitir</button>
        </div>
      </div>
    `;
  }).join("");

  hiredEl.innerHTML = `
    <div class="et3-newsitem">
      <strong>Custo semanal total do staff</strong>
      <div class="et3-sub">Você paga automaticamente toda semana. Se faltar fundos, sua governabilidade sofre.</div>
      <div class="et3-meta">
        <span class="et3-tag">Custo: -${cost}/sem</span>
        <span class="et3-tag">Buffer projetos: ${totals.project.stallBuffer}</span>
        <span class="et3-tag">Chance travar x${totals.project.stallChanceMult.toFixed(2)}</span>
        <span class="et3-tag">Blindagem mídia: ${(totals.crisis.mediaShield*100).toFixed(0)}%</span>
        <span class="et3-tag">Risco escândalo x${totals.risk.scandalEventMult.toFixed(2)}</span>
      </div>
    </div>
    <div class="st-grid">${hiredCards}</div>
  `;

  hiredEl.querySelectorAll("[data-fire]").forEach(btn => {
    btn.addEventListener("click", () => fireStaff(btn.getAttribute("data-fire")));
  });

  // Banco de talentos
  const availCards = staffRoles.map(role => {
    const hired = getHired(role.roleId);
    const options = getAvailableStaffForRole(role.roleId);

    const optHtml = options.map(opt => {
      const passive = opt.effects?.passive || {};
      const passiveTxt = Object.keys(passive).length
        ? Object.entries(passive).map(([k,v]) => `${k} ${v >= 0 ? "+" : ""}${Number(v).toFixed(2)}/sem`).join(" • ")
        : "Sem bônus passivo";

      const isSame = hired && hired.id === opt.id;
      const canHire = !isSame;

      return `
        <div class="st-role" style="margin-bottom:10px">
          <div class="st-role-top">
            <div>
              <div class="st-role-title">${opt.name} <span class="st-pill">Nível ${opt.level}</span></div>
              <div class="st-role-sub">${passiveTxt}</div>
            </div>
            <div class="st-pill">-${opt.weeklyCost}/sem</div>
          </div>
          <div class="st-actions">
            <button class="st-btn primary" data-hire="${role.roleId}::${opt.id}" ${canHire ? "" : "disabled"}>${hired ? "Substituir" : "Contratar"}</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="et3-newsitem">
        <strong>${role.title}</strong>
        <div class="et3-sub">${role.desc}</div>
        ${optHtml}
      </div>
    `;
  }).join("");

  availEl.innerHTML = availCards;

  availEl.querySelectorAll("[data-hire]").forEach(btn => {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-hire");
      const [roleId, staffId] = raw.split("::");
      const role = getRoleDef(roleId);
      const opt = role?.pool?.find(x => x.id === staffId);
      if (!opt) return;
      hireStaff(roleId, opt);
    });
  });
}

// ===============================
// TEMPO/EVENTOS
// ===============================
function advanceTime(weeks = 1) {
  for (let i = 0; i < weeks; i++) {
    // tempo
    state.week += 1;
    if (state.week > 52) { state.week = 1; state.year += 1; }

    ensureStaffState();
    const staffTotals = getStaffPassiveTotals();

    // 1) folha de pagamento
    const payroll = staffTotals.weeklyCost || 0;
    if (payroll > 0) {
      state.funds = clamp(state.funds - payroll);
      if (state.funds <= 3) {
        // crise de caixa: instabilidade
        state.congressSupport = clamp(state.congressSupport - 1.5);
        state.mediaTone = clamp(state.mediaTone - 1.0);
        addFeed("Alerta: caixa apertado. Bastidores percebem fragilidade política.");
        pushNews({
          id: uid(),
          week: state.week,
          year: state.year,
          title: "Bastidores sentem fragilidade fiscal e cobram ajustes",
          subtitle: "Aliados hesitam; oposição pressiona por narrativa de incompetência.",
          tone: "bad",
          tags: ["fiscal", "bastidores"],
          impact: { mediaTone: -0.3, congressSupport: -0.4 }
        });
      }
    }

    // 2) bônus passivos do staff (por semana)
    state.funds = clamp(state.funds + staffTotals.funds);
    state.integrity = clamp(state.integrity + staffTotals.integrity);
    state.congressSupport = clamp(state.congressSupport + staffTotals.congressSupport);
    state.mediaTone = clamp(state.mediaTone + staffTotals.mediaTone);
    state.economy = clamp(state.economy + staffTotals.economy);
    state.security = clamp(state.security + staffTotals.security);
    state.services = clamp(state.services + staffTotals.services);
    state.scandals = clamp(state.scandals + staffTotals.scandals);

    // 3) macro drift (com volatilidade ajustada pelo assessor econômico)
    const vol = staffTotals.macro.econVolatilityMult || 1;
    state.economy = clamp(state.economy + rnd(-1.5 * vol, 1.2 * vol));
    state.security = clamp(state.security + rnd(-1.2, 1.0));
    state.services = clamp(state.services + rnd(-1.0, 1.2));

    // 4) mídia ajusta
    const mediaPull = (50 - state.mediaTone) * 0.06;
    state.mediaTone = clamp(state.mediaTone + mediaPull - state.scandals * 0.01 + (state.integrity - 50) * 0.01);

    // 5) escândalo tende a subir se integridade baixa (com mitigação do jurídico)
    state.scandals = clamp(state.scandals + (50 - state.integrity) * 0.03 + rnd(-0.8, 1.2));

    // ETAPA 2: tick projetos
    tickProjectsOneWeek();

    // eventos aleatórios (com mitigação do jurídico)
    const scandalMult = staffTotals.risk.scandalEventMult || 1;
    if (Math.random() < (0.22 * scandalMult)) triggerRandomEvent();

    // ETAPA 3: manchetes semanais
    buildWeeklyHeadlines();

    // calendário
    recalcNextElectionIfNeeded();
  }

  updateHeader();
  saveGame();

  if (agendaOverlay && !agendaOverlay.classList.contains("hidden")) renderAgenda();
  if (pressOverlay && pressOverlay.style.display === "flex") renderPress();
  if (calendarOverlay && calendarOverlay.style.display === "flex") renderCalendar();
  if (staffOverlay && staffOverlay.style.display === "flex") renderStaff();
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
  const staffTotals = getStaffPassiveTotals();
  const shield = staffTotals.crisis.mediaShield || 0; // 0..0.55
  const mediaBuff = Math.round(shield * 10) / 10; // exibição simples

  openModal(
    "Gerenciar crise",
    `Uma crise estourou. (Blindagem do Porta-voz: ~${Math.round(shield * 100)}%) Como você responde?`,
    [
      {
        label: "Coletiva + transparência",
        type: "primary",
        onClick: () =>
          applyWorldDelta({
            funds: -4,
            integrity: +3,
            mediaTone: +(3 + mediaBuff),
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
            mediaTone: -(6 - mediaBuff),
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

    // projetos resetam ao subir
    state.activeProjects = [];

    // staff permanece (AAA: equipe vira ativo estratégico), mas custa manter
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
  ensureStaffState();
  updateHeader();
  renderActions();

  injectEtapa34UI();
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

    staff: {
      hired: { chief: null, whip: null, press: null, econ: null, legal: null },
      availablePoolSeed: 1,
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

  state.staff = state.staff || { hired: { chief: null, whip: null, press: null, econ: null, legal: null }, availablePoolSeed: 1 };
  ensureStaffState();

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
      staff: { hired: { chief: null, whip: null, press: null, econ: null, legal: null }, availablePoolSeed: 1 },
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

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const loaded = loadGame();
    if (loaded) {
      ensureStaffState();
      recalcNextElectionIfNeeded();
      saveGame();
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
