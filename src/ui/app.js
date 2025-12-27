(function initUI(){
  window.SIM_POL = window.SIM_POL || {};
  const { sim } = window.SIM_POL;
  const { save } = window.SIM_POL;

  const qs = (sel)=>document.querySelector(sel);

  let STATE = null;
  let DATA = null;

  function setState(s){ STATE = s; render(); }
  function getState(){ return STATE; }

  async function ensureData(){
    if (DATA) return DATA;
    if (typeof window.SIM_POL.bootstrapData === "function"){
      DATA = await window.SIM_POL.bootstrapData();
      return DATA;
    }
    DATA = { cargos:[], leis:[], eventos:[], carreira:[] };
    return DATA;
  }

  function showGame(){
    qs("#screen-menu")?.setAttribute("hidden","");
    qs("#screen-game")?.removeAttribute("hidden");
    render();
  }

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
        showGame();
      } else {
        alert("Nenhum save encontrado.");
      }
    });

    btnSave?.addEventListener("click", ()=>{
      if (!STATE){ alert("Nenhuma partida em andamento."); return; }
      const ok = save.save(STATE);
      if (ok) pushLog("Progresso salvo.");
    });

    btnExit?.addEventListener("click", ()=>{
      location.reload();
    });

    btnNext?.addEventListener("click", ()=>{
      if (!STATE){ alert("Inicie um jogo."); return; }
      setState(sim.nextTurn(STATE, DATA));
    });

    // Leis
    qs("#ui-leis")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-action]");
      if (!el || !STATE) return;
      const action = el.dataset.action;
      const id = el.dataset.id;
      if (action==="approve") setState(sim.voteLaw(STATE, id, true));
      if (action==="reject")  setState(sim.voteLaw(STATE, id, false));
    });

    // Eventos
    qs("#ui-evento")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-choice]");
      if (!el || !STATE) return;
      const id = el.dataset.choice;
      setState(sim.resolveEvent(STATE, id));
    });

    // Eleições
    qs("#ui-eleicao")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-eleicao-action]");
      if (!el || !STATE) return;

      const action = el.dataset.eleicaoAction;
      const id = el.dataset.id;

      if (action === "chooseCargo"){
        setState(sim.escolherCargoParaDisputar(STATE, DATA, id));
      }

      if (action === "campanha"){
        setState(sim.campanha(STATE, DATA, id));
      }

      if (action === "resolver"){
        setState(sim.resolverEleicao(STATE, DATA));
      }
    });
  }

  function pushLog(msg){
    if (!STATE) return;
    STATE.logs.push(`[${new Date().toLocaleString()}] ${msg}`);
    renderLogs();
  }

  function render(){
    if (!STATE) return;

    // Status
    qs("#ui-data").textContent = `Ano ${STATE.ano} • Mês ${STATE.mes}`;
    qs("#ui-turno").textContent = String(STATE.turno);
    qs("#ui-mandato").textContent = `${STATE.mandatoMesesRestantes} mês(es)`;
    qs("#ui-popularidade").textContent = `${STATE.popularidade}%`;
    qs("#ui-recursos").textContent = formatRecursos(STATE.recursos);

    const cargo = (window.SIM_POL.data?.cargos||[]).find(c=>c.id===STATE.cargoId);
    qs("#ui-cargo").textContent = cargo ? cargo.nome : STATE.cargoId;

    renderEleicao();
    renderLeis();
    renderEvento();
    renderLogs();
  }

  function renderEleicao(){
    const box = qs("#ui-eleicao");
    if (!box) return;
    box.innerHTML = "";

    if (!STATE.emEleicao){
      box.innerHTML = `<div class="item"><em>Sem eleições ativas. Mandato em andamento.</em></div>`;
      return;
    }

    const ele = STATE.eleicao || { etapa: "escolher_cargo" };

    if (ele.etapa === "escolher_cargo"){
      const opcoes = getOpcoesCarreira(STATE.cargoId);
      const htmlOpcoes = opcoes.map(cid=>{
        const c = getCargo(cid);
        return `
          <button class="btn primary" data-eleicao-action="chooseCargo" data-id="${cid}">
            Disputar: ${c ? c.nome : cid}
          </button>
        `;
      }).join("");

      box.innerHTML = `
        <div class="item">
          <div><strong>Período Eleitoral</strong></div>
          <div>Seu mandato terminou. Escolha o cargo para disputar:</div>
          <div class="choice">${htmlOpcoes || `<em>Nenhuma opção configurada.</em>`}</div>
        </div>
      `;
      return;
    }

    if (ele.etapa === "campanha"){
      const alvo = getCargo(ele.cargoAlvoId);
      box.innerHTML = `
        <div class="item">
          <div><strong>Campanha</strong> <span class="badge">${alvo ? alvo.nome : ele.cargoAlvoId}</span></div>
          <div>Escolha a intensidade da campanha (gasta recursos e aumenta chance):</div>
          <div class="choice">
            <button class="btn" data-eleicao-action="campanha" data-id="leve">Leve (R$ 100)</button>
            <button class="btn" data-eleicao-action="campanha" data-id="media">Média (R$ 250)</button>
            <button class="btn primary" data-eleicao-action="campanha" data-id="pesada">Pesada (R$ 450)</button>
          </div>
        </div>
      `;
      return;
    }

    if (ele.etapa === "resultado"){
      const alvo = getCargo(ele.cargoAlvoId);
      box.innerHTML = `
        <div class="item">
          <div><strong>Apuração</strong> <span class="badge">${alvo ? alvo.nome : ele.cargoAlvoId}</span></div>
          <div>Sua campanha foi realizada. Clique para apurar o resultado:</div>
          <div class="choice">
            <button class="btn primary" data-eleicao-action="resolver" data-id="ok">Apurar Resultado</button>
          </div>
        </div>
      `;
      return;
    }

    box.innerHTML = `<div class="item"><em>Estado eleitoral desconhecido.</em></div>`;
  }

  function renderLeis(){
    const list = qs("#ui-leis");
    if (!list) return;
    list.innerHTML = "";

    if (!STATE.leisPendentes || STATE.leisPendentes.length === 0){
      list.innerHTML = `<div class="item"><em>Sem projetos pendentes.</em></div>`;
      return;
    }

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
        </div>
      `;
      list.appendChild(el);
    }
  }

  function renderEvento(){
    const box = qs("#ui-evento");
    if (!box) return;
    box.innerHTML = "";

    if (STATE.eventoAtual){
      const ev = STATE.eventoAtual;
      const opts = (ev.opcoes||[]).map(o => `
        <button class="btn" data-choice="${o.id}">
          ${o.texto}
          <span class="badge">Pop: ${signed(o.impactos?.popularidade||0)}</span>
          <span class="badge">Rec: ${signed(o.impactos?.recursos||0)}</span>
        </button>
      `).join("");

      box.innerHTML = `
        <div class="item">
          <div><strong>${ev.nome}</strong></div>
          <div>${ev.descricao||""}</div>
          <div class="choice">${opts}</div>
        </div>
      `;
      return;
    }

    box.innerHTML = `<div class="item"><em>Nenhum evento ativo.</em></div>`;
  }

  function renderLogs(){
    const logs = qs("#ui-logs");
    if (!logs) return;
    logs.innerHTML = (STATE.logs || []).map(l=>`<div>${escapeHtml(l)}</div>`).join("");
    logs.scrollTop = logs.scrollHeight;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[m]));
  }

  function signed(n){ return n>0 ? `+${n}` : String(n); }

  function formatRecursos(n){
    const sign = n>=0 ? "" : "-";
    const v = Math.abs(n);
    return `${sign}R$ ${v.toLocaleString("pt-BR")}`;
  }

  function getCargo(id){
    return (window.SIM_POL.data?.cargos || []).find(c=>c.id===id) || null;
  }

  function getOpcoesCarreira(cargoId){
    const row = (window.SIM_POL.data?.carreira || []).find(r=>r.de===cargoId);
    return row ? (row.para || []) : [];
  }

  window.SIM_POL.ui = { attach, setState, getState, render };
})();