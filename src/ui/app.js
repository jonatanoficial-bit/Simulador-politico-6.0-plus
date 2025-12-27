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
    DATA = { cargos:[], leis:[], eventos:[], carreira:[], partidos:[], npcs:[], regras_legislativo:{casas:{}}, orcamento:{}, politicas:[], tecnicos:[] };
    return DATA;
  }

  /* =========================
     FUNDO DINÂMICO (assets)
     ========================= */
  function setBackgroundForMenu(){
    // Urna no menu
    applyBgImage("/assets/urna_eletronica.jpg", 0.22);
  }

  function setBackgroundForGame(){
    if (!STATE){
      setBackgroundForMenu();
      return;
    }

    // prioridade: executivo por cargo
    const cargoId = STATE.cargoId;

    // mapeamento por cargo (executivo)
    const mapCargo = {
      prefeito: "/assets/mayor.png",
      governador: "/assets/governor.png",
      presidente: "/assets/president.png"
    };

    // mapeamento por casa (legislativo)
    const mapCasa = {
      camara_municipal: "/assets/municipal.png",
      assembleia_estadual: "/assets/assembly.png",
      camara_federal: "/assets/federal.png",
      senado: "/assets/senate.png"
    };

    let url = null;

    if (mapCargo[cargoId]) url = mapCargo[cargoId];
    else if (mapCasa[STATE.casaAtualId]) url = mapCasa[STATE.casaAtualId];
    else url = "/assets/municipal.png";

    // Ajuste de opacidade do fundo conforme tela:
    // - no jogo: um pouco mais visível
    applyBgImage(url, 0.28);
  }

  function applyBgImage(url, opacity){
    // CSS var para background
    document.body.style.setProperty("--bg-image", `url('${url}')`);
    // controla opacidade do pseudo-elemento do body
    // (feito via atributo no body para permitir ajustes futuros)
    document.body.setAttribute("data-bg-opacity", String(opacity || 0.26));

    // truque: ajusta a opacidade usando um style tag rápido
    // sem depender de build
    let st = document.getElementById("bg-opacity-style");
    if (!st){
      st = document.createElement("style");
      st.id = "bg-opacity-style";
      document.head.appendChild(st);
    }
    st.textContent = `
      body::after { opacity: ${opacity || 0.26} !important; }
    `;
  }

  function showGame(){
    qs("#screen-menu")?.setAttribute("hidden","");
    qs("#screen-game")?.removeAttribute("hidden");
    setBackgroundForGame();
    render();
  }

  function showMenu(){
    qs("#screen-game")?.setAttribute("hidden","");
    qs("#screen-menu")?.removeAttribute("hidden");
    setBackgroundForMenu();
  }

  function attach(){
    // fundo inicial no menu
    setBackgroundForMenu();

    qs("#btn-new")?.addEventListener("click", async ()=>{
      DATA = await ensureData();
      setState(sim.newGameFromData(DATA));
      showGame();
    });

    qs("#btn-load")?.addEventListener("click", async ()=>{
      DATA = await ensureData();
      const loaded = save.load();
      if (loaded){
        setState(loaded);
        showGame();
      } else alert("Nenhum save encontrado.");
    });

    qs("#btn-save")?.addEventListener("click", ()=>{
      if (!STATE){ alert("Nenhuma partida em andamento."); return; }
      const ok = save.save(STATE);
      if (ok) logLocal("Progresso salvo.");
    });

    qs("#btn-exit")?.addEventListener("click", ()=>{
      location.reload();
    });

    qs("#btn-next")?.addEventListener("click", ()=>{
      if (!STATE){ alert("Inicie um jogo."); return; }
      setState(sim.nextTurn(STATE, DATA));
      // ao avançar, pode mudar cargo/casa => atualiza fundo
      setBackgroundForGame();
    });

    // Leis (legislativo)
    qs("#ui-leis")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-action]");
      if (!el || !STATE) return;
      const action = el.dataset.action;
      const id = el.dataset.id;

      if (action === "approve"){
        if (sim.isLegislador(STATE.cargoId)) setState(sim.votarNoPlenario(STATE, DATA, id));
        else logLocal("No Executivo, leis entram pelo painel de sanção/veto.");
      }
      if (action === "reject"){
        setState(sim.rejeitarLei(STATE, id));
      }
      setBackgroundForGame();
    });

    // Eventos
    qs("#ui-evento")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-choice]");
      if (!el || !STATE) return;
      setState(sim.resolveEvent(STATE, DATA, el.dataset.choice));
      setBackgroundForGame();
    });

    // Eleições
    qs("#ui-eleicao")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-eleicao-action]");
      if (!el || !STATE) return;
      const action = el.dataset.eleicaoAction;
      const id = el.dataset.id;
      if (action === "chooseCargo") setState(sim.escolherCargoParaDisputar(STATE, DATA, id));
      if (action === "campanha") setState(sim.campanha(STATE, DATA, id));
      if (action === "resolver") setState(sim.resolverEleicao(STATE, DATA));
      setBackgroundForGame();
    });

    // Painel do cargo (legislativo / executivo)
    qs("#ui-painel-cargo")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-painel-action]");
      if (!el || !STATE) return;

      const action = el.dataset.painelAction;

      if (action === "negociar"){
        setState(sim.negociarApoio(STATE, DATA, el.dataset.id));
      }
      if (action === "orcamentoPerfil"){
        setState(sim.aplicarPerfilOrcamentario(STATE, DATA, el.dataset.id));
      }
      if (action === "nomear"){
        setState(sim.nomearTecnico(STATE, DATA, el.dataset.slot, el.dataset.id));
      }
      if (action === "sancionar"){
        setState(sim.sancionarLei(STATE, DATA, el.dataset.id));
      }
      if (action === "vetar"){
        setState(sim.vetarLei(STATE, DATA, el.dataset.id));
      }

      setBackgroundForGame();
    });

    // Políticas
    qs("#ui-politicas")?.addEventListener("click", (e)=>{
      const el = e.target.closest("[data-politica]");
      if (!el || !STATE) return;
      setState(sim.aplicarPolitica(STATE, DATA, el.dataset.politica));
      setBackgroundForGame();
    });
  }

  function logLocal(msg){
    if (!STATE) return;
    STATE.logs.push(`[${new Date().toLocaleString()}] ${msg}`);
    renderLogs();
  }

  function render(){
    if (!STATE){
      showMenu();
      return;
    }

    qs("#ui-data").textContent = `Ano ${STATE.ano} • Mês ${STATE.mes}`;
    qs("#ui-turno").textContent = String(STATE.turno);
    qs("#ui-mandato").textContent = `${STATE.mandatoMesesRestantes} mês(es)`;

    const pop = STATE.opiniao?.geral ?? STATE.popularidade ?? 50;
    qs("#ui-popularidade").textContent = `${pop}%`;

    qs("#ui-recursos").textContent = formatRecursos(STATE.recursos);

    const cargo = getCargo(STATE.cargoId);
    qs("#ui-cargo").textContent = cargo ? cargo.nome : STATE.cargoId;

    qs("#ui-casa").textContent = getCasaLabel(STATE.casaAtualId);

    qs("#ui-governab").textContent = sim.isLegislador(STATE.cargoId)
      ? `${STATE.governabilidade}%`
      : (sim.isExecutivo(STATE.cargoId) ? `${STATE.coalizao?.forca ?? STATE.governabilidade}%` : "—");

    renderEleicao();
    renderPainelCargo();
    renderLeis();
    renderPoliticas();
    renderEvento();
    renderLogs();

    // garante fundo correto
    setBackgroundForGame();
  }

  function renderEleicao(){
    const box = qs("#ui-eleicao");
    if (!box) return;
    box.innerHTML = "";

    if (!STATE.emEleicao){
      box.innerHTML = `<div class="item"><em>Sem eleições ativas.</em></div>`;
      return;
    }

    const ele = STATE.eleicao || { etapa: "escolher_cargo" };

    if (ele.etapa === "escolher_cargo"){
      const opcoes = getOpcoesCarreira(STATE.cargoId);
      box.innerHTML = `
        <div class="item">
          <div><strong>Período Eleitoral</strong></div>
          <div>Escolha o cargo:</div>
          <div class="choice">
            ${opcoes.map(cid=>{
              const c = getCargo(cid);
              return `<button class="btn primary" data-eleicao-action="chooseCargo" data-id="${cid}">Disputar: ${c ? c.nome : cid}</button>`;
            }).join("")}
          </div>
        </div>
      `;
      return;
    }

    if (ele.etapa === "campanha"){
      const alvo = getCargo(ele.cargoAlvoId);
      box.innerHTML = `
        <div class="item">
          <div><strong>Campanha</strong> <span class="badge">${alvo ? alvo.nome : ele.cargoAlvoId}</span></div>
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
      box.innerHTML = `
        <div class="item">
          <div><strong>Apuração</strong></div>
          <div class="choice">
            <button class="btn primary" data-eleicao-action="resolver" data-id="ok">Apurar Resultado</button>
          </div>
        </div>
      `;
      return;
    }

    box.innerHTML = `<div class="item"><em>Estado eleitoral desconhecido.</em></div>`;
  }

  function renderPainelCargo(){
    const box = qs("#ui-painel-cargo");
    if (!box) return;
    box.innerHTML = "";

    const o = STATE.opiniao || {};
    const opiniaoHtml = `
      <div class="item">
        <div><strong>Opinião por grupos</strong></div>
        <div class="badge">Pobres: ${o.pobres ?? 50}%</div>
        <div class="badge">Classe média: ${o.classe_media ?? 50}%</div>
        <div class="badge">Empresários: ${o.empresarios ?? 50}%</div>
        <div class="badge">Servidores: ${o.servidores ?? 50}%</div>
        <div class="badge">Progressistas: ${o.progressistas ?? 50}%</div>
        <div class="badge">Conservadores: ${o.conservadores ?? 50}%</div>
      </div>
    `;

    if (sim.isLegislador(STATE.cargoId)){
      const casa = DATA.regras_legislativo?.casas?.[STATE.casaAtualId];
      const nomeCasa = casa ? casa.nome : "Casa Legislativa";

      box.innerHTML = `
        ${opiniaoHtml}
        <div class="item">
          <div><strong>${nomeCasa}</strong></div>
          <div class="badge">Governabilidade: ${STATE.governabilidade}%</div>
          <div class="badge">Reputação: ${STATE.reputacao_no_plenario}%</div>
          <div class="choice">
            <button class="btn" data-painel-action="negociar" data-id="pequeno">Negociar (Pequeno) - R$ 80</button>
            <button class="btn" data-painel-action="negociar" data-id="medio">Negociar (Médio) - R$ 180</button>
            <button class="btn primary" data-painel-action="negociar" data-id="grande">Negociar (Grande) - R$ 320</button>
          </div>
        </div>
      `;
      return;
    }

    if (sim.isExecutivo(STATE.cargoId)){
      const receita = Number(STATE.orcamento?.receitaMensal || 0);
      const despesas = somaDespesasUI(STATE);
      const saldo = receita - despesas;

      const tecnicos = DATA.tecnicos || [];
      const gab = STATE.gabinete || {};
      const nomeado = (id)=> (tecnicos.find(t=>t.id===id)?.nome || "—");

      const candidatosPorSlot = {
        economia: tecnicos.filter(t=>t.area==="economia").slice(0, 2),
        saude: tecnicos.filter(t=>t.area==="saude").slice(0, 2),
        educacao: tecnicos.filter(t=>t.area==="educacao").slice(0, 2),
        seguranca: tecnicos.filter(t=>t.area==="seguranca").slice(0, 2)
      };

      const fila = (STATE.leisParaSancao || []);
      const filaHtml = fila.length ? fila.map(l=>`
        <div class="item">
          <div><strong>Para sanção:</strong> ${l.titulo}</div>
          <div class="choice">
            <button class="btn primary" data-painel-action="sancionar" data-id="${l.id}">Sancionar</button>
            <button class="btn" data-painel-action="vetar" data-id="${l.id}">Vetar</button>
          </div>
        </div>
      `).join("") : `<div class="item"><em>Nenhuma lei aguardando sanção.</em></div>`;

      box.innerHTML = `
        ${opiniaoHtml}

        <div class="item">
          <div><strong>Executivo</strong></div>
          <div class="badge">Coalizão: ${STATE.coalizao?.forca ?? STATE.governabilidade}%</div>
          <div class="badge">Receita: R$ ${receita}</div>
          <div class="badge">Despesas: R$ ${despesas}</div>
          <div class="badge">Saldo: ${saldo>=0?"+":""}R$ ${saldo}</div>

          <div style="margin-top:10px"><strong>Perfis de Orçamento</strong></div>
          <div class="choice">
            <button class="btn" data-painel-action="orcamentoPerfil" data-id="social">Social</button>
            <button class="btn" data-painel-action="orcamentoPerfil" data-id="seguranca">Segurança</button>
            <button class="btn primary" data-painel-action="orcamentoPerfil" data-id="equilibrio">Equilíbrio</button>
          </div>

          <div style="margin-top:10px"><strong>Gabinete</strong></div>
          <div class="badge">Economia: ${nomeado(gab.economia)}</div>
          <div class="badge">Saúde: ${nomeado(gab.saude)}</div>
          <div class="badge">Educação: ${nomeado(gab.educacao)}</div>
          <div class="badge">Segurança: ${nomeado(gab.seguranca)}</div>

          <div style="margin-top:10px"><strong>Nomeações (rápido)</strong></div>

          <div style="margin-top:6px"><strong>Economia</strong></div>
          <div class="choice">
            ${candidatosPorSlot.economia.map(t=>`
              <button class="btn" data-painel-action="nomear" data-slot="economia" data-id="${t.id}">
                ${t.nome} (R$ ${t.custoNomeacao})
              </button>
            `).join("")}
          </div>

          <div style="margin-top:6px"><strong>Saúde</strong></div>
          <div class="choice">
            ${candidatosPorSlot.saude.map(t=>`
              <button class="btn" data-painel-action="nomear" data-slot="saude" data-id="${t.id}">
                ${t.nome} (R$ ${t.custoNomeacao})
              </button>
            `).join("")}
          </div>

          <div style="margin-top:6px"><strong>Educação</strong></div>
          <div class="choice">
            ${candidatosPorSlot.educacao.map(t=>`
              <button class="btn" data-painel-action="nomear" data-slot="educacao" data-id="${t.id}">
                ${t.nome} (R$ ${t.custoNomeacao})
              </button>
            `).join("")}
          </div>

          <div style="margin-top:6px"><strong>Segurança</strong></div>
          <div class="choice">
            ${candidatosPorSlot.seguranca.map(t=>`
              <button class="btn" data-painel-action="nomear" data-slot="seguranca" data-id="${t.id}">
                ${t.nome} (R$ ${t.custoNomeacao})
              </button>
            `).join("")}
          </div>

          <div style="margin-top:10px"><strong>Sanção / Veto</strong></div>
          ${filaHtml}
        </div>
      `;
      return;
    }

    box.innerHTML = opiniaoHtml;
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
        <div class="badge">Pop: ${signed(imp.popularidade||0)}</div>
        <div class="badge">Rec: ${signed(imp.recursos||0)}</div>
        <div style="margin-top:6px">${lei.descricao || ""}</div>
        <div class="choice">
          <button class="btn primary" data-action="approve" data-id="${lei.id}">
            ${sim.isLegislador(STATE.cargoId) ? "Levar à votação" : "Ver (Executivo)"}
          </button>
          <button class="btn" data-action="reject" data-id="${lei.id}">Arquivar</button>
        </div>
      `;
      list.appendChild(el);
    }
  }

  function renderPoliticas(){
    const box = qs("#ui-politicas");
    if (!box) return;
    box.innerHTML = "";

    if (!sim.isExecutivo(STATE.cargoId)){
      box.innerHTML = `<div class="item"><em>Políticas apenas no Executivo.</em></div>`;
      return;
    }

    const politicas = DATA.politicas || [];
    box.innerHTML = politicas.map(p=>`
      <div class="item">
        <div><strong>${p.nome}</strong></div>
        <div class="badge">Custo: R$ ${p.custo}</div>
        <div style="margin-top:6px">${p.descricao || ""}</div>
        <div class="choice">
          <button class="btn primary" data-politica="${p.id}">Implementar</button>
        </div>
      </div>
    `).join("") || `<div class="item"><em>Nenhuma política cadastrada.</em></div>`;
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

  function getCasaLabel(casaId){
    const casa = DATA.regras_legislativo?.casas?.[casaId];
    return casa ? casa.nome : casaId;
  }

  function somaDespesasUI(state){
    const cats = state.orcamento?.categorias || {};
    let total = 0;
    for (const k of Object.keys(cats)) total += Number(cats[k] || 0);
    return total;
  }

  window.SIM_POL.ui = { attach, setState, getState, render };
})();