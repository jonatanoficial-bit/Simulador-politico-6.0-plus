/**
 * Save/Load versionado
 * - Salva no localStorage
 * - Mantém compatibilidade: se dados faltarem, preenche com defaults
 */
(function initSave(){
  window.SIM_POL = window.SIM_POL || {};
  const KEY = "SIM_POL_SAVE";
  const SAVE_VERSION = 2;

  function getDefaultState(){
    return {
      version: SAVE_VERSION,
      turno: 1,
      cargoId: "vereador",
      popularidade: 50,
      recursos: 500,
      leisPendentes: [],
      eventoAtual: null,
      logs: []
    };
  }

  function migrate(old){
    if (!old || typeof old !== "object") return getDefaultState();
    const base = getDefaultState();
    const merged = {
      ...base,
      ...old,
      version: SAVE_VERSION
    };
    if (!Array.isArray(merged.leisPendentes)) merged.leisPendentes = [];
    if (!Array.isArray(merged.logs)) merged.logs = [];
    if (!("eventoAtual" in merged)) merged.eventoAtual = null;
    if (typeof merged.turno !== "number" || merged.turno < 1) merged.turno = 1;
    if (typeof merged.popularidade !== "number") merged.popularidade = 50;
    if (typeof merged.recursos !== "number") merged.recursos = 500;
    if (!merged.cargoId) merged.cargoId = "vereador";
    return merged;
  }

  function save(state){
    try{
      const payload = JSON.stringify({
        ...state,
        version: SAVE_VERSION
      });
      localStorage.setItem(KEY, payload);
      return true;
    }catch(e){ console.warn("Falha ao salvar:", e); return false; }
  }

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.version === SAVE_VERSION ? parsed : migrate(parsed);
    }catch(e){ console.warn("Falha ao carregar:", e); return null; }
  }

  function clear(){ localStorage.removeItem(KEY); }

  window.SIM_POL.save = { save, load, clear, migrate, getDefaultState, SAVE_VERSION };
})();