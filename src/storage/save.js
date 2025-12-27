/**
 * Save/Load versionado
 * - Salva no localStorage
 * - Mantém compatibilidade: se dados faltarem, preenche com defaults
 */
(function initSave(){
  window.SIM_POL = window.SIM_POL || {};
  const KEY = "SIM_POL_SAVE";
  const SAVE_VERSION = 3;

  function getDefaultState(){
    return {
      version: SAVE_VERSION,

      // Tempo
      ano: 1,
      mes: 1,
      turno: 1,

      // Carreira
      cargoId: "vereador",
      mandatoMesesRestantes: 6, // tutorial rápido na Parte 2 (depois você pode aumentar)
      emEleicao: false,
      eleicao: null, // { etapa, cargoAlvoId, boostCampanha, custoCampanha, resultado }

      // Indicadores
      popularidade: 50,
      recursos: 500,

      // Conteúdo de turno
      leisPendentes: [],
      eventoAtual: null,

      // Logs
      logs: []
    };
  }

  function migrate(old){
    const base = getDefaultState();
    if (!old || typeof old !== "object") return base;

    // Merge tolerante
    const merged = { ...base, ...old, version: SAVE_VERSION };

    // Garantias
    if (!Array.isArray(merged.leisPendentes)) merged.leisPendentes = [];
    if (!Array.isArray(merged.logs)) merged.logs = [];
    if (!("eventoAtual" in merged)) merged.eventoAtual = null;

    if (typeof merged.turno !== "number" || merged.turno < 1) merged.turno = 1;
    if (typeof merged.ano !== "number" || merged.ano < 1) merged.ano = 1;
    if (typeof merged.mes !== "number" || merged.mes < 1 || merged.mes > 12) merged.mes = 1;

    if (typeof merged.popularidade !== "number") merged.popularidade = 50;
    if (typeof merged.recursos !== "number") merged.recursos = 500;

    if (!merged.cargoId) merged.cargoId = "vereador";
    if (typeof merged.mandatoMesesRestantes !== "number") merged.mandatoMesesRestantes = 6;

    if (typeof merged.emEleicao !== "boolean") merged.emEleicao = false;
    if (!("eleicao" in merged)) merged.eleicao = null;

    return merged;
  }

  function save(state){
    try{
      const payload = JSON.stringify({ ...state, version: SAVE_VERSION });
      localStorage.setItem(KEY, payload);
      return true;
    }catch(e){
      console.warn("Falha ao salvar:", e);
      return false;
    }
  }

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      // Se versão diferente, migra
      if (parsed.version !== SAVE_VERSION) return migrate(parsed);
      return parsed;
    }catch(e){
      console.warn("Falha ao carregar:", e);
      return null;
    }
  }

  function clear(){ localStorage.removeItem(KEY); }

  window.SIM_POL.save = { save, load, clear, migrate, getDefaultState, SAVE_VERSION };
})();