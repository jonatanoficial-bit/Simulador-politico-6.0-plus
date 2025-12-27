/**
 * DataLoader — carrega conteúdo JSON em window.SIM_POL.data
 * Seguro: se falhar, usa defaults e não quebra o jogo.
 */
(function initDataLoader(){
  window.SIM_POL = window.SIM_POL || {};

  const DEFAULTS = {
    cargos: [],
    leis: [],
    eventos: [],
  };

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar ${path}: ${res.status}`);
    return res.json();
  }

  async function loadAllData() {
    const [cargos, leis, eventos] = await Promise.all([
      fetchJson("/data/cargos.json"),
      fetchJson("/data/leis.json"),
      fetchJson("/data/eventos.json"),
    ]);
    return { cargos, leis, eventos };
  }

  async function bootstrapData() {
    try {
      const data = await loadAllData();
      window.SIM_POL.data = data;
      window.SIM_POL.flags = window.SIM_POL.flags || {};
      window.SIM_POL.flags.dataDriven = true;
      console.debug("[SIM_POL] Data carregada:", data);
      return data;
    } catch (err) {
      window.SIM_POL.data = { ...DEFAULTS };
      console.debug("[SIM_POL] DataLoader falhou (ignorado).", err);
      return window.SIM_POL.data;
    }
  }

  window.SIM_POL.loadAllData = loadAllData;
  window.SIM_POL.bootstrapData = bootstrapData;
})();