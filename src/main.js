/**
 * Bootstrap do app:
 * - Carrega dados (JSON)
 * - Anexa UI e prepara botões
 * - Se houver save, o usuário pode carregar
 */
(function bootstrap(){
  window.SIM_POL = window.SIM_POL || {};
  window.SIM_POL.RUNTIME_VERSION = "1.0.0-parte1";

  function ready(fn){
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(async ()=>{
    // Garante dados carregados
    if (typeof window.SIM_POL.bootstrapData === "function"){
      await window.SIM_POL.bootstrapData();
    }

    // Conecta UI
    window.SIM_POL.ui.attach();

    console.debug("[SIM_POL] App pronto.");
  });
})();