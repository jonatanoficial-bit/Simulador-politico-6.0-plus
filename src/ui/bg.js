/* src/ui/bg.js — troca o fundo automaticamente conforme cargo/casa
   - Não mexe no core nem no app.js
   - Apenas observa o estado e altera CSS variável --bg-img no body
*/

(function(){
  function pickBg(state){
    const cargo = state?.cargoId || "";
    const casa = state?.casaId || state?.casaAtualId || "";

    // prioridade por cargo
    if (cargo === "presidente") return 'url("/assets/president.png")';
    if (cargo === "governador") return 'url("/assets/governor.png")';
    if (cargo === "prefeito") return 'url("/assets/mayor.png")';

    // legislativo por casa
    if (casa.includes("sen")) return 'url("/assets/senate.png")';
    if (casa.includes("federal")) return 'url("/assets/federal.png")';
    if (casa.includes("assembly") || casa.includes("assembleia")) return 'url("/assets/assembly.png")';

    // padrão municipal
    return 'url("assets/municipal.png")';
  }

  function apply(){
    try{
      const state = window.SIM_POL?.sim?.getState?.() || window.SIM_POL?.state || null;
      const bg = pickBg(state);
      document.body.style.setProperty("--bg-img", bg);
    }catch(e){}
  }

  // tenta várias vezes no início (porque app pode criar state depois)
  let tries = 0;
  const t = setInterval(() => {
    apply();
    tries++;
    if (tries >= 20) clearInterval(t);
  }, 250);

  // tenta aplicar em mudanças comuns
  window.addEventListener("focus", apply);
  window.addEventListener("visibilitychange", apply);

  // se o sim tiver event emitter ou hook, não assumimos: apenas re-aplica periodicamente
  setInterval(apply, 3000);
})();