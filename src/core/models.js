/**
 * Modelos e helpers do simulador
 */

(function initModels(){
  window.SIM_POL = window.SIM_POL || {};

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  class State {
    constructor(initial){
      Object.assign(this, initial);
    }
  }

  function mkLog(msg){
    const ts = new Date().toLocaleString();
    return `[${ts}] ${msg}`;
  }

  window.SIM_POL.models = { State, clamp, mkLog };
})();