/* src/core/save.js — ARQUIVO COMPLETO
   Persistência local (single player offline)
   - Salva em localStorage
   - Versão do save para compatibilidade futura
   - getDefaultState(data): requerido pelo sim.js
   - Estado padrão expandido: evita erros tipo "forca undefined"
*/

(function(){
  window.SIM_POL = window.SIM_POL || {};

  const KEY = "SIM_POL_SAVE_V1";
  const META_KEY = "SIM_POL_SAVE_META_V1";
  const SAVE_VERSION = 1;

  function safeJsonParse(str, fallback=null){
    try { return JSON.parse(str); } catch(e){ return fallback; }
  }

  function nowISO(){
    try { return new Date().toISOString(); } catch(e){ return String(Date.now()); }
  }

  // ✅ Gera um estado padrão robusto (compatível com sim.js e app.js)
  function getDefaultState(data){
    const d = data || (window.SIM_POL && window.SIM_POL.data) || {};

    const cargos = Array.isArray(d.cargos) ? d.cargos : [];
    const cargoInicial = cargos.find(c => c.id === "vereador") || cargos[0] || { id:"vereador", nome:"Vereador", tipo:"legislativo", mandatoMeses:48 };

    const partidos = Array.isArray(d.partidos) ? d.partidos : [];
    const partidoInicial = partidos.find(p => p.id === "centro") ? "centro" : (partidos[0]?.id || "centro");

    // Importante: alguns cores usam "casaId" ou "casaAtualId" como string específica.
    // Pelo seu print apareceu "camara_municipal" — então já setamos assim para evitar incompat.
    const casaInicial = "camara_municipal";

    return {
      // tempo
      turno: 1,
      ano: 2025,
      mes: 1,

      // carreira
      cargoId: cargoInicial.id,
      casaId: casaInicial,
      casaAtualId: casaInicial,
      mandatoMesesRestantes: Number(cargoInicial.mandatoMeses || 48),

      // recursos / status
      recursos: 200,
      popularidade: 50,
      governabilidade: 50,
      reputacao_no_plenario: 50,

      // opiniões por grupo
      opiniao: {
        geral: 50,
        pobres: 50,
        classe_media: 50,
        ricos: 50,
        empresarios: 50,
        servidores: 50,
        religiosos: 50,
        progressistas: 50,
        conservadores: 50
      },

      // integridade / risco
      integridade: {
        nivel: 50,
        risco: 20,
        sobInvestigacao: false,
        nivelInvestigacao: 0
      },

      // personagem
      personagem: {
        nome: "Novo Político",
        partidoId: partidoInicial,
        ideologia: 0,

        // ✅ Alguns sistemas usam "atributos" (força/carisma/inteligência etc.)
        // Criamos aqui para o sim.js não tentar setar "forca" em undefined.
        atributos: {
          forca: 50,
          carisma: 50,
          inteligencia: 50,
          oratoria: 50,
          estrategia: 50
        },

        // ✅ Outros sistemas usam "tracos"
        tracos: {
          honestidade: 50,
          carisma: 50,
          competencia: 50,
          disciplina: 50,
          ambicao: 50
        },

        // ✅ Compatibilidade extra caso o sim use "status"
        status: {
          energia: 100,
          estresse: 10
        }
      },

      // ações por mês
      acoesDoMes: {
        limite: 2,
        usadas: 0
      },

      // legislativo/executivo
      leisPendentes: [],
      leisParaSancao: [],
      projetosEmTramitacao: [],
      projetosAprovados: [],

      orcamento: {
        receitaMensal: 120,
        categorias: {
          saude: 25,
          educacao: 25,
          seguranca: 20,
          infraestrutura: 20,
          administracao: 10
        }
      },

      gabinete: {
        economia: "",
        saude: "",
        educacao: "",
        seguranca: ""
      },

      // eventos / eleições
      eventoAtual: null,
      emEleicao: false,
      eleicao: null,

      // mídia / logs
      midia: { manchetes: [] },
      diario: [],
      logs: []
    };
  }

  function save(state){
    try{
      const payload = {
        __saveVersion: SAVE_VERSION,
        savedAt: nowISO(),
        state
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
      localStorage.setItem(META_KEY, JSON.stringify({
        __saveVersion: SAVE_VERSION,
        savedAt: payload.savedAt
      }));
      return true;
    }catch(e){
      return false;
    }
  }

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = safeJsonParse(raw, null);
      if (!parsed || !parsed.state) return null;

      const v = Number(parsed.__saveVersion || 0);
      let st = parsed.state;

      if (v === 1) {
        // ok
      }

      return st;
    }catch(e){
      return null;
    }
  }

  function hasSave(){
    try { return !!localStorage.getItem(KEY); } catch(e){ return false; }
  }

  function clear(){
    try{
      localStorage.removeItem(KEY);
      localStorage.removeItem(META_KEY);
      return true;
    }catch(e){
      return false;
    }
  }

  function getMeta(){
    try{
      const raw = localStorage.getItem(META_KEY);
      return safeJsonParse(raw, null);
    }catch(e){
      return null;
    }
  }

  window.SIM_POL.save = {
    save,
    load,
    hasSave,
    clear,
    getMeta,
    getDefaultState,
    KEY,
    SAVE_VERSION
  };
})();