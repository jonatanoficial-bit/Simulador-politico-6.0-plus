/* src/core/save.js — ARQUIVO COMPLETO
   Persistência local (single player offline)
   - Salva em localStorage
   - Versão do save para compatibilidade futura
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

      // Migração simples por versão (futuro)
      const v = Number(parsed.__saveVersion || 0);
      let st = parsed.state;

      if (v === 1){
        // ok
      } else {
        // se vier versão desconhecida, tenta usar mesmo assim
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
    KEY,
    SAVE_VERSION
  };
})();