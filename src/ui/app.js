/**
 * Camada de UI:
 * - renderiza dashboard
 * - lista leis e eventos
 * - lida com botões (novo jogo, carregar, salvar, avançar, votar, decidir evento)
 */

(function initUI(){
  window.SIM_POL = window.SIM_POL || {};
  const { sim } = window.SIM_POL;
  const { save } = window.SIM_POL;
  const qs = (sel)=>document.querySelector(sel);

  let STATE = null;
  let DATA = null;

  function setState(s){ STATE = s; render(); }
  function getState(){ return STATE; }

  function attach(){
    const btnNew = qs("#btn-new");
    const btnLoad = qs("#btn-load");
    const btnSave = qs("#btn-save");
    const btnExit = qs("#btn-exit");
    const btnNext = qs("#btn-next");

    btnNew?.addEventListener("click", async ()=>{
      DATA = await ensureData();
      const st = sim.newGameFromData(DATA);
      setState(st);
      showGame();
    });

    btnLoad?.addEventListener("click", async ()=>{
      DATA = await ensureData();
      const loaded = save.load();
      if (loaded){
        setState(loaded);
        addLog("Save carregado com sucesso.");
        showGame();
      } else {
        alert("Nenhum save encontrado.");
      }
    });

    btnSave?.addEventListener("click", ()=>{
      if (!STATE){ alert("Nenhuma partida em andamento."); return; }
      const ok = save.save(STATE);
      if (ok) addLog("Progresso salvo.");
    });

    btnExit?.addEventListener("click", ()=>{
      location.reload();
    });

    btnNext?.addEventListener("click", ()=>{
      if (!STATE){ alert("Inicie um jogo."); return; }
      setState(sim.nextTurn(STATE, DATA));
    });

    // Delegação para ações de Leis
    qs("#ui-leis")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const action = el.dataset.action;
      const id = el.dataset.id;
      if (action==="approve"){
        setState(sim.voteLaw(STATE, id, true));
      } else if (action==="reject"){
        setState(sim.voteLaw(STATE, id, false));
      }
    });

    // Delegação para Eventos
    qs("#ui-evento")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-choice]");
      if (!el) return;
      const id = el.dataset.choice;
      setState(sim.resolveEvent(STATE, id));
    });
  }

  async function ensureData(){
    if (DATA) return DATA;
    if (typeof window.SIM_POL.bootstrapData === "function"){
      DATA = await window.SIM_POL.bootstrapData();
      return DATA;
    }
    return { cargos:[], leis:[], eventos:[] };
  }

  function showGame(){
    qs("#screen-menu")?.setAttribute("hidden","");
    qs("#screen-game")?.removeAttribute("hidden");
    render();
  }

  function addLog(msg){
    STATE.logs.push(`[${new Date().toLocaleString()}] ${msg}`);
    renderLogs();
  }

  function render(){
    if (!STATE) return;
    // Status
    qs("#ui-turno").textContent = String(STATE.turno);
    qs("#ui-popularidade").textContent = `${STATE.popularidade}%`;
    qs("#ui-recursos").textContent = formatRecursos(STATE.recursos);
    const cargo = (window.SIM_POL.data?.cargos||[]).find(c=>c.id===STATE.cargoId);
    qs("#ui-cargo").textContent = cargo ? cargo.nome : STATE.cargoId;

    // Leis
    const listLeis = qs("#ui-leis");
    listLeis.innerHTML = "";
    if (STATE.leisPendentes.length===0){
      listLeis.innerHTML = `<div class="item"><em>Sem projetos pendentes neste turno.</em></div>`;
    } else {
      for (const lei of STATE.leisPendentes){
        const imp = lei.impactos || {};
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `
          <div><strong>${lei.titulo}</strong></div>
          <div class="badge">Popularidade: ${signed(imp.popularidade||0)}</div>
          <div class="badge">Recursos: ${signed(imp.recursos||0)}</div>
          <div class="choice">
            <button class="btn primary" data-action="approve" data-id="${lei.id}">Votar SIM</button>
            <button class="btn" data-action="reject" data-id="${lei.id}">Votar NÃO</button>
          </div>`;
        listLeis.appendChild(el);
      }
    }

    // Evento
    const evc = qs("#ui-evento");
    evc.innerHTML = "";
    if (STATE.eventoAtual){
      const ev = STATE.eventoAtual;
      const box = document.createElement("div");
      box.className = "item";
      const opts = (ev.opcoes||[]).map(o => `
        <button class="btn" data-choice="${o.id}">
          ${o.texto}
          <span class="badge">Pop: ${signed(o.impactos?.popularidade||0)}</span>
          <span class="badge">Rec: ${signed(o.impactos?.recursos||0)}</span>
        </button>
      `).join("");
      box.innerHTML = `
        <div><strong>${ev.nome}</strong></div>
        <div>${ev.descricao||""}</div>
        <div class="choice">${opts}</div>
      `;
      evc.appendChild(box);
    } else {
      evc.innerHTML = `<div class="item"><em>Nenhum evento ativo.</em></div>`;
    }

    renderLogs();
  }

  function renderLogs(){
    const logs = qs("#ui-logs");
    if (!logs || !STATE) return;
    logs.innerHTML = STATE.logs.map(l=>`<div>${escapeHtml(l)}</div>`).join("");
    logs.scrollTop = logs.scrollHeight;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[m]));
  }

  function signed(n){
    if (n>0) return `+${n}`;
    return String(n);
  }

  function formatRecursos(n){
    const sign = n>=0 ? "" : "-";
    const v = Math.abs(n);
    return `${sign}R$ ${v.toLocaleString("pt-BR")}`;
  }

  window.SIM_POL.ui = { attach, setState, getState, render };
})();