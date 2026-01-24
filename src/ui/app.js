/* src/ui/app.js — ARQUIVO COMPLETO (Bloco H + Bloco L)
   - UI completa do jogo
   - Aba Mídia + Integridade
   - PWA: registra Service Worker
   - Botão "Instalar App" quando disponível
*/

(function initApp(){
  window.SIM_POL = window.SIM_POL || {};
  const sim = window.SIM_POL.sim;
  const save = window.SIM_POL.save;
  const data = window.SIM_POL.data;

  // ---- Helpers DOM ----
  const $ = (sel, root=document) => root.querySelector(sel);
  const el = (tag, attrs={}, children=[]) => {
    const n = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs||{})){
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (v != null) n.setAttribute(k, v);
    }
    for (const c of (children||[])){
      if (c == null) continue;
      if (typeof c === "string") n.appendChild(document.createTextNode(c));
      else n.appendChild(c);
    }
    return n;
  };

  const fmt = {
    money(n){
      const v = Number(n||0);
      const sign = v < 0 ? "-" : "";
      const abs = Math.abs(v);
      return `${sign}R$ ${abs.toLocaleString("pt-BR")}`;
    },
    pct(n){
      const v = Math.round(Number(n||0));
      return `${v}%`;
    },
    monthName(m){
      const arr = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      return arr[(m-1+12)%12] || String(m);
    }
  };

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  // ---- PWA (Bloco L): Install prompt ----
  let deferredInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    // Evita o mini-infobar
    e.preventDefault();
    deferredInstallPrompt = e;
    // mostra botão quando renderizar
    render();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    renderToast("App instalado!");
    render();
  });

  async function handleInstall(){
    if (!deferredInstallPrompt){
      renderToast("Instalação não disponível agora.");
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    renderToast(outcome === "accepted" ? "Instalação iniciada." : "Instalação cancelada.");
    render();
  }

  // ---- Service Worker (Bloco L) ----
  async function registerSW(){
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      // Atualiza automaticamente quando houver versão nova
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    } catch (e) {
      // silencioso para não quebrar
    }
  }

  // ---- State ----
  let state = null;
  let activeTab = "painel";

  // ---- Persistência ----
  function loadOrNew(){
    try {
      const loaded = save.load();
      if (loaded) return loaded;
    } catch(e){}
    return sim.newGameFromData(data);
  }

  function commit(){
    save.save(state);
    render();
  }

  function setTab(tab){
    activeTab = tab;
    render();
  }

  // ---- UI pieces ----
  function badge(text){
    return el("span", { class: "badge" }, [text]);
  }

  function progressBar(label, val, hint){
    const v = clamp(Number(val||0), 0, 100);
    const barOuter = el("div", { class: "barOuter", title: hint || "" }, []);
    const barInner = el("div", { class: "barInner" }, []);
    barInner.style.width = `${v}%`;
    barOuter.appendChild(barInner);

    return el("div", { class:"barWrap" }, [
      el("div", { class:"barLabel" }, [
        el("div", { class:"barLabelL" }, [label]),
        el("div", { class:"barLabelR" }, [fmt.pct(v)])
      ]),
      barOuter
    ]);
  }

  function smallHint(t){
    return el("div", { class:"hint" }, [t]);
  }

  function card(title, bodyNodes){
    return el("div", { class:"card" }, [
      el("div", { class:"cardTitle" }, [title]),
      el("div", { class:"cardBody" }, bodyNodes)
    ]);
  }

  // ---- Top summary ----
  function topHeader(){
    const cargoObj = (data.cargos||[]).find(c => c.id === state.cargoId);
    const cargoNome = cargoObj ? cargoObj.nome : state.cargoId;

    const nome = state.personagem?.nome || "Novo Político";
    const partido = state.personagem?.partidoId || "centro";

    const pop = state.opiniao?.geral ?? state.popularidade ?? 50;
    const gov = state.governabilidade ?? 50;
    const rep = state.reputacao_no_plenario ?? 50;

    const integNivel = state.integridade?.nivel ?? 50;
    const integRisco = state.integridade?.risco ?? 20;

    const timeLine = `Ano ${state.ano} • ${fmt.monthName(state.mes)} • Turno ${state.turno}`;

    return el("div", { class:"topHeader" }, [
      el("div", { class:"topLeft" }, [
        el("div", { class:"gameTitle" }, ["Simulador Político"]),
        el("div", { class:"subTitle" }, [timeLine]),
        el("div", { class:"subTitle" }, [`${nome} — ${cargoNome} — Partido: ${partido}`])
      ]),
      el("div", { class:"topRight" }, [
        el("div", { class:"kpiRow" }, [
          el("div", { class:"kpi" }, [el("div",{class:"kpiLabel"},["Popularidade"]), el("div",{class:"kpiVal"},[fmt.pct(pop)])]),
          el("div", { class:"kpi" }, [el("div",{class:"kpiLabel"},["Governabilidade"]), el("div",{class:"kpiVal"},[fmt.pct(gov)])]),
          el("div", { class:"kpi" }, [el("div",{class:"kpiLabel"},["Reputação"]), el("div",{class:"kpiVal"},[fmt.pct(rep)])]),
          el("div", { class:"kpi" }, [el("div",{class:"kpiLabel"},["Recursos"]), el("div",{class:"kpiVal"},[fmt.money(state.recursos)])]),
        ]),
        el("div", { class:"kpiRow" }, [
          el("div", { class:"kpi small" }, [el("div",{class:"kpiLabel"},["Integridade"]), el("div",{class:"kpiVal"},[fmt.pct(integNivel)])]),
          el("div", { class:"kpi small" }, [el("div",{class:"kpiLabel"},["Risco"]), el("div",{class:"kpiVal"},[fmt.pct(integRisco)])]),
          el("div", { class:"kpi small" }, [el("div",{class:"kpiLabel"},["Mandato"]), el("div",{class:"kpiVal"},[`${state.mandatoMesesRestantes}m`])]),
          el("div", { class:"kpi small" }, [el("div",{class:"kpiLabel"},["Casa"]), el("div",{class:"kpiVal"},[state.casaAtualId || "-"])]),
        ])
      ])
    ]);
  }

  // ---- Tabs ----
  function tabBar(){
    const tabs = [
      { id:"painel", label:"Painel" },
      { id:"personagem", label:"Personagem" },
      { id:"acoes", label:"Ações do mês" },
      { id:"legislativo", label:"Legislativo" },
      { id:"executivo", label:"Executivo" },
      { id:"eventos", label:"Eventos" },
      { id:"eleicoes", label:"Eleições" },
      { id:"midia", label:"Mídia" },
      { id:"integridade", label:"Integridade" },
      { id:"logs", label:"Diário" }
    ];

    const filtered = tabs.filter(t => {
      if (t.id === "executivo" && !sim.isExecutivo(state.cargoId)) return false;
      if (t.id === "legislativo" && !sim.isLegislador(state.cargoId)) return false;
      return true;
    });

    return el("div", { class:"tabs" }, filtered.map(t =>
      el("button", {
        class: `tab ${activeTab===t.id ? "active" : ""}`,
        onclick: () => setTab(t.id)
      }, [t.label])
    ));
  }

  // ---- Global controls ----
  function globalControls(){
    const tut = sim.tutorialText(state);
    const tutNode = tut ? el("div", { class:"tutorial" }, [badge("Tutorial"), " ", tut]) : null;

    // Bloco L: botão instalar aparece quando o navegador permite
    const installBtn = deferredInstallPrompt
      ? el("button", { class:"btn primary", onclick: handleInstall }, ["Instalar App"])
      : null;

    return el("div", { class:"controls" }, [
      el("div", { class:"controlsLeft" }, [
        el("button", { class:"btn primary", onclick: () => { state = sim.nextTurn(state, data); commit(); } }, ["Avançar Mês"]),
        el("button", { class:"btn", onclick: () => { save.save(state); renderToast("Jogo salvo."); } }, ["Salvar"]),
        el("button", { class:"btn", onclick: () => { state = save.load() || state; renderToast("Carregado."); render(); } }, ["Carregar"]),
        el("button", { class:"btn danger", onclick: () => { state = sim.newGameFromData(data); commit(); renderToast("Novo jogo iniciado."); } }, ["Novo Jogo"]),
        installBtn
      ].filter(Boolean)),
      el("div", { class:"controlsRight" }, [
        tutNode ? tutNode : el("div", { class:"tutorial off" }, [""])
      ])
    ]);
  }

  // ---- Toast ----
  let toastTimer = null;
  function renderToast(text){
    const n = $("#toast");
    if (!n) return;
    n.textContent = text;
    n.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => n.classList.remove("show"), 1600);
  }

  // ---- Screens ----
  function screenPainel(){
    const cargoObj = (data.cargos||[]).find(c => c.id === state.cargoId);
    const cargoNome = cargoObj ? cargoObj.nome : state.cargoId;

    const cards = [];

    const o = state.opiniao || {};
    cards.push(card("Opinião por grupos", [
      progressBar("Geral", o.geral ?? 50),
      progressBar("Pobres", o.pobres ?? 50),
      progressBar("Classe média", o.classe_media ?? 50),
      progressBar("Ricos", o.ricos ?? 50),
      progressBar("Empresários", o.empresarios ?? 50),
      progressBar("Servidores", o.servidores ?? 50),
      progressBar("Religiosos", o.religiosos ?? 50),
      progressBar("Progressistas", o.progressistas ?? 50),
      progressBar("Conservadores", o.conservadores ?? 50),
    ]));

    cards.push(card("Integridade (resumo)", [
      progressBar("Integridade", state.integridade?.nivel ?? 50, "Quanto maior, melhor"),
      progressBar("Risco", state.integridade?.risco ?? 20, "Quanto maior, maior chance de investigação"),
      state.integridade?.sobInvestigacao
        ? el("div", { class:"warn" }, [`Sob investigação • Nível ${fmt.pct(state.integridade?.nivelInvestigacao ?? 0)}`])
        : el("div", { class:"ok" }, ["Sem investigação ativa"]),
      el("button", { class:"btn", onclick: () => setTab("integridade") }, ["Ver detalhes"])
    ]));

    const m = state.midia?.manchetes || [];
    const top = m.slice(0, 5);
    cards.push(card("Mídia (últimas manchetes)", [
      top.length ? el("ul", { class:"list" }, top.map(x =>
        el("li", {}, [`${fmt.monthName(x.mes)} ${x.ano}: ${x.t}`])
      )) : el("div", { class:"muted" }, ["Sem manchetes ainda."]),
      el("button", { class:"btn" , onclick: () => setTab("midia") }, ["Abrir Mídia"])
    ]));

    cards.push(card("Situação atual", [
      el("div", { class:"row" }, [
        badge("Cargo"),
        el("span", { class:"mono" }, [`${cargoNome}`]),
      ]),
      el("div", { class:"row" }, [
        badge("Mandato"),
        el("span", { class:"mono" }, [`${state.mandatoMesesRestantes} meses restantes`]),
      ]),
      state.emEleicao
        ? el("div", { class:"warn" }, ["Eleições em andamento — vá para a aba Eleições."])
        : el("div", { class:"ok" }, ["Sem eleição ativa."]),
      el("div", { class:"row" }, [
        el("button", { class:"btn primary", onclick: () => { state = sim.nextTurn(state, data); commit(); } }, ["Avançar Mês"]),
        el("button", { class:"btn", onclick: () => setTab("eleicoes") }, ["Eleições"])
      ])
    ]));

    return el("div", { class:"grid" }, cards);
  }

  function screenPersonagem(){
    const partidos = data.partidos || [];
    const p0 = state.personagem || { nome:"", partidoId:"centro", ideologia:0, tracos:{honestidade:50, carisma:50, competencia:50} };
    const tr = p0.tracos || {honestidade:50, carisma:50, competencia:50};

    const form = el("div", { class:"card" }, [
      el("div", { class:"cardTitle" }, ["Criar / Ajustar personagem"]),
      el("div", { class:"cardBody" }, [
        el("label", { class:"lbl" }, ["Nome"]),
        el("input", { id:"p_nome", class:"inp", value: p0.nome || "" }),

        el("label", { class:"lbl" }, ["Partido"]),
        el("select", { id:"p_partido", class:"inp" },
          partidos.map(p => el("option", {
            value: p.id,
            selected: p.id === p0.partidoId ? "selected" : null
          }, [`${p.nome || p.id}`]))
        ),

        el("label", { class:"lbl" }, ["Ideologia (-100 esquerda • +100 direita)"]),
        el("input", { id:"p_ideologia", class:"inp", type:"range", min:"-100", max:"100", value: String(p0.ideologia ?? 0) }),
        el("div", { class:"muted", id:"p_ideologia_label" }, [`Valor: ${p0.ideologia ?? 0}`]),

        el("div", { class:"split3" }, [
          el("div", {}, [
            el("label", { class:"lbl" }, ["Honestidade"]),
            el("input", { id:"p_honest", class:"inp", type:"range", min:"0", max:"100", value: String(tr.honestidade ?? 50) }),
            el("div", { class:"muted", id:"p_honest_label" }, [`${tr.honestidade ?? 50}`]),
          ]),
          el("div", {}, [
            el("label", { class:"lbl" }, ["Carisma"]),
            el("input", { id:"p_carisma", class:"inp", type:"range", min:"0", max:"100", value: String(tr.carisma ?? 50) }),
            el("div", { class:"muted", id:"p_carisma_label" }, [`${tr.carisma ?? 50}`]),
          ]),
          el("div", {}, [
            el("label", { class:"lbl" }, ["Competência"]),
            el("input", { id:"p_comp", class:"inp", type:"range", min:"0", max:"100", value: String(tr.competencia ?? 50) }),
            el("div", { class:"muted", id:"p_comp_label" }, [`${tr.competencia ?? 50}`]),
          ])
        ]),

        el("button", {
          class:"btn primary",
          onclick: () => {
            const payload = {
              nome: ($("#p_nome")?.value || "").trim(),
              partidoId: $("#p_partido")?.value || "centro",
              ideologia: Number($("#p_ideologia")?.value || 0),
              tracos: {
                honestidade: Number($("#p_honest")?.value || 50),
                carisma: Number($("#p_carisma")?.value || 50),
                competencia: Number($("#p_comp")?.value || 50),
              }
            };
            state = sim.definirPersonagem(state, data, payload);
            commit();
            renderToast("Personagem aplicado.");
          }
        }, ["Aplicar"]),
        smallHint("Dica: Honestidade alta reduz risco de investigação e melhora integridade. Carisma ajuda na articulação. Competência melhora reputação.")
      ])
    ]);

    setTimeout(() => {
      const ide = $("#p_ideologia");
      const ideLbl = $("#p_ideologia_label");
      if (ide && ideLbl) ide.addEventListener("input", () => ideLbl.textContent = `Valor: ${ide.value}`);

      const h = $("#p_honest"), hl = $("#p_honest_label");
      if (h && hl) h.addEventListener("input", () => hl.textContent = `${h.value}`);

      const c = $("#p_carisma"), cl = $("#p_carisma_label");
      if (c && cl) c.addEventListener("input", () => cl.textContent = `${c.value}`);

      const cp = $("#p_comp"), cpl = $("#p_comp_label");
      if (cp && cpl) cp.addEventListener("input", () => cpl.textContent = `${cp.value}`);
    }, 0);

    return el("div", { class:"grid" }, [form]);
  }

  function screenAcoes(){
    const acoes = (Array.isArray(data.acoes) && data.acoes.length) ? data.acoes : [
      { id:"agenda_bairros", nome:"Visitar bairros e ouvir demandas", custo:30, impactos:{ opinioes:{ pobres:+2, classe_media:+1 }, reputacao:+1 } },
      { id:"comunicacao", nome:"Comunicação e transparência", custo:20, impactos:{ popularidade:+1, opinioes:{ classe_media:+1, progressistas:+1, conservadores:+1 } } },
      { id:"articulacao", nome:"Articulação política", custo:50, impactos:{ governabilidade:+5, opinioes:{ classe_media:-1, progressistas:-1, conservadores:-1 } } },
    ];

    const usadas = state.acoesDoMes?.usadas ?? 0;
    const limite = state.acoesDoMes?.limite ?? 2;

    const list = el("div", { class:"card" }, [
      el("div", { class:"cardTitle" }, [`Ações do mês (${usadas}/${limite})`]),
      el("div", { class:"cardBody" }, [
        smallHint("Você tem um limite de ações por mês. Algumas ações podem aumentar risco/integridade."),
        el("div", { class:"grid2" }, acoes.map(a => {
          const impacts = a.impactos || {};
          const impTxt = [];
          if (typeof impacts.popularidade === "number") impTxt.push(`Popularidade ${impSign(impacts.popularidade)}`);
          if (typeof impacts.governabilidade === "number") impTxt.push(`Governabilidade ${impSign(impacts.governabilidade)}`);
          if (typeof impacts.reputacao === "number") impTxt.push(`Reputação ${impSign(impacts.reputacao)}`);
          if (impacts.opinioes) impTxt.push("Opiniões por grupos");

          return card(a.nome, [
            el("div", { class:"muted" }, [`Custo: ${fmt.money(a.custo || 0)}`]),
            el("div", { class:"muted" }, [impTxt.length ? `Impactos: ${impTxt.join(" • ")}` : "Impactos: variados"]),
            el("button", {
              class:"btn primary",
              onclick: () => { state = sim.aplicarAcaoDoMes(state, data, a.id); commit(); }
            }, ["Executar"])
          ]);
        }))
      ])
    ]);

    return el("div", { class:"grid" }, [list]);
  }

  function impSign(n){
    const v = Number(n||0);
    return `${v>=0?"+":""}${v}`;
  }

  function screenLegislativo(){
    if (!sim.isLegislador(state.cargoId)){
      return el("div", { class:"card" }, [
        el("div", { class:"cardTitle" }, ["Legislativo"]),
        el("div", { class:"cardBody" }, ["Você não está em um cargo legislativo agora."])
      ]);
    }

    const leis = state.leisPendentes || [];

    const btnNeg = el("div", { class:"card" }, [
      el("div", { class:"cardTitle" }, ["Articulação / Apoios"]),
      el("div", { class:"cardBody" }, [
        smallHint("Negociar aumenta governabilidade e reputação, mas pode elevar risco."),
        el("div", { class:"row" }, [
          el("button", { class:"btn", onclick: () => { state = sim.negociarApoio(state, data, "pequeno"); commit(); } }, ["Negociar (pequeno)"]),
          el("button", { class:"btn", onclick: () => { state = sim.negociarApoio(state, data, "medio"); commit(); } }, ["Negociar (médio)"]),
          el("button", { class:"btn", onclick: () => { state = sim.negociarApoio(state, data, "grande"); commit(); } }, ["Negociar (grande)"]),
        ])
      ])
    ]);

    const list = el("div", { class:"card" }, [
      el("div", { class:"cardTitle" }, ["Projetos na pauta"]),
      el("div", { class:"cardBody" }, [
        leis.length ? el("div", { class:"stack" }, leis.map(l => {
          const imp = l.impactos || {};
          const impTxt = [];
          if (imp.popularidade) impTxt.push(`Pop ${impSign(imp.popularidade)}`);
          if (imp.recursos) impTxt.push(`Recursos ${impSign(imp.recursos)}`);
          if (imp.grupos) impTxt.push("Grupos");

          return card(l.titulo || "Projeto", [
            el("div", { class:"muted" }, [l.descricao || "Sem descrição."]),
            el("div", { class:"muted" }, [impTxt.length ? `Impactos: ${impTxt.join(" • ")}` : "Impactos: variados"]),
            el("div", { class:"row" }, [
              el("button", { class:"btn primary", onclick: () => { state = sim.votarNoPlenario(state, data, l.id); commit(); } }, ["Levar à votação"]),
              el("button", { class:"btn danger", onclick: () => { state = sim.rejeitarLei(state, l.id); commit(); } }, ["Arquivar"]),
            ])
          ]);
        })) : el("div", { class:"muted" }, ["Sem projetos no momento. Avance o mês."])
      ])
    ]);

    return el("div", { class:"grid" }, [btnNeg, list]);
  }

  function screenExecutivo(){
    if (!sim.isExecutivo(state.cargoId)){
      return el("div", { class:"card" }, [
        el("div", { class:"cardTitle" }, ["Executivo"]),
        el("div", { class:"cardBody" }, ["Você não está em um cargo do Executivo agora."])
      ]);
    }

    const perfis = data.orcamento?.perfis || [];
    const politicas = data.politicas || [];
    const tecnicos = data.tecnicos || [];
    const leisParaSancao = state.leisParaSancao || [];

    const orc = state.orcamento || {};
    const cats = orc.categorias || {};

    const orcCard = card("Orçamento", [
      smallHint("No Executivo, o orçamento influencia recursos e opinião. Você pode aplicar um perfil."),
      el("div", { class:"row" }, perfis.map(p =>
        el("button", {
          class:"btn",
          onclick: () => { state = sim.aplicarPerfilOrcamentario(state, data, p.id); commit(); }
        }, [p.nome || p.id])
      )),
      el("div", { class:"muted" }, [`Receita mensal: ${fmt.money(orc.receitaMensal || 0)}`]),
      el("div", { class:"muted" }, ["Categorias (visual):"]),
      el("div", { class:"stack" }, Object.keys(cats).map(k =>
        el("div", { class:"row" }, [
          badge(k),
          el("span", { class:"mono" }, [String(cats[k])])
        ])
      ))
    ]);

    const gabCard = card("Gabinete", [
      smallHint("Nomeações custam recursos e podem gerar efeitos mensais. Também afetam risco/integridade."),
      el("div", { class:"grid2" }, ["economia","saude","educacao","seguranca"].map(slot => {
        const atualId = state.gabinete?.[slot] || "";
        const atualNome = (tecnicos.find(t=>t.id===atualId)?.nome) || "—";
        return card(slot.toUpperCase(), [
          el("div", { class:"muted" }, [`Atual: ${atualNome}`]),
          el("select", { class:"inp", id:`gab_${slot}` },
            [
              el("option", { value:"" }, ["Selecionar..."]),
              ...tecnicos.map(t => el("option", { value:t.id }, [`${t.nome} (custo ${fmt.money(t.custoNomeacao||0)})`]))
            ]
          ),
          el("button", {
            class:"btn primary",
            onclick: () => {
              const v = $(`#gab_${slot}`)?.value || "";
              if (!v) return renderToast("Selecione um técnico.");
              state = sim.nomearTecnico(state, data, slot, v);
              commit();
            }
          }, ["Nomear"])
        ]);
      }))
    ]);

    const polCard = card("Políticas", [
      smallHint("Implementar políticas custa recursos e pode alterar opinião/governabilidade (e risco)."),
      politicas.length ? el("div", { class:"stack" }, politicas.slice(0, 8).map(p => {
        const impacts = p.impactos || {};
        const txt = [];
        if (impacts.popularidade) txt.push(`Pop ${impSign(impacts.popularidade)}`);
        if (impacts.ajusteGovernabilidade) txt.push(`Gov ${impSign(impacts.ajusteGovernabilidade)}`);
        if (impacts.ajusteReceitaMensal) txt.push(`Receita ${impSign(impacts.ajusteReceitaMensal)}`);

        return card(p.nome || "Política", [
          el("div", { class:"muted" }, [p.descricao || ""]),
          el("div", { class:"muted" }, [`Custo: ${fmt.money(p.custo||0)}`]),
          el("div", { class:"muted" }, [txt.length ? `Impactos: ${txt.join(" • ")}` : "Impactos: variados"]),
          el("button", { class:"btn primary", onclick: () => { state = sim.aplicarPolitica(state, data, p.id); commit(); } }, ["Implementar"])
        ]);
      })) : el("div", { class:"muted" }, ["Sem políticas cadastradas em data."])
    ]);

    const sancCard = card("Sanção / Veto", [
      smallHint("Leis chegam para sanção/veto. Vetos podem ser derrubados; isso afeta governabilidade e opinião."),
      leisParaSancao.length ? el("div", { class:"stack" }, leisParaSancao.map(l => card(l.titulo || "Lei", [
        el("div", { class:"muted" }, [l.descricao || ""]),
        el("div", { class:"row" }, [
          el("button", { class:"btn primary", onclick: () => { state = sim.sancionarLei(state, data, l.id); commit(); } }, ["Sancionar"]),
          el("button", { class:"btn danger", onclick: () => { state = sim.vetarLei(state, data, l.id); commit(); } }, ["Vetar"])
        ])
      ]))) : el("div", { class:"muted" }, ["Nenhuma lei para sanção agora."])
    ]);

    return el("div", { class:"grid" }, [orcCard, gabCard, polCard, sancCard]);
  }

  function screenEventos(){
    const ev = state.eventoAtual;
    const precisaEventoTutorial = !!(state?.tutorial?.ativo && !state?.tutorial?.concluido && state?.tutorial?.passo === 4);
    const box = card("Eventos", [
      ev ? el("div", { class:"stack" }, [
        el("div", { class:"big" }, [ev.nome || "Evento"]),
        el("div", { class:"muted" }, [ev.descricao || ""]),
        el("div", { class:"stack" }, (ev.opcoes || []).map(o =>
          el("button", {
            class:"btn primary",
            onclick: () => { state = sim.resolveEvent(state, data, o.id); commit(); }
          }, [o.texto || o.id])
        ))
      ]) : el("div", { class:"stack" }, [
        el("div", { class:"muted" }, ["Nenhum evento agora."]),
        precisaEventoTutorial
          ? el("button", { class:"btn primary", onclick: () => { state = sim.ensureTutorialEvent(state, data); commit(); } }, ["Gerar evento do tutorial"])
          : el("div", { class:"muted" }, ["Avance o mês para tentar gerar um evento."])
      ])
    ]);

    return el("div", { class:"grid" }, [box]);
  }

  function screenEleicoes(){
    const box = card("Eleições", [
      state.emEleicao ? el("div", { class:"stack" }, [
        el("div", { class:"warn" }, ["Eleição ativa. Conclua as etapas abaixo."]),
        renderElectionFlow()
      ]) : el("div", { class:"ok" }, ["Sem eleição ativa. Quando o mandato terminar, as eleições iniciarão automaticamente."]),
      smallHint("Dica: risco alto reduz seu score eleitoral. Honestidade ajuda.")
    ]);
    return el("div", { class:"grid" }, [box]);
  }

  function renderElectionFlow(){
    const e = state.eleicao || { etapa:"escolher_cargo" };
    const etapa = e.etapa || "escolher_cargo";
    const opcoes = (data.carreira||[]).find(r => r.de === state.cargoId)?.para || [];

    if (etapa === "escolher_cargo"){
      const list = opcoes.length ? opcoes : [];
      return el("div", { class:"stack" }, [
        el("div", { class:"big" }, ["Escolha o cargo para disputar"]),
        list.length ? el("div", { class:"grid2" }, list.map(id => {
          const c = (data.cargos||[]).find(x => x.id === id);
          return el("button", {
            class:"btn primary",
            onclick: () => { state = sim.escolherCargoParaDisputar(state, data, id); commit(); }
          }, [c ? c.nome : id]);
        })) : el("div", { class:"muted" }, ["Sem progressões configuradas em data.carreira."])
      ]);
    }

    if (etapa === "campanha"){
      return el("div", { class:"stack" }, [
        el("div", { class:"big" }, ["Campanha"]),
        el("div", { class:"row" }, [
          el("button", { class:"btn", onclick: () => { state = sim.campanha(state, data, "leve"); commit(); } }, ["Leve"]),
          el("button", { class:"btn", onclick: () => { state = sim.campanha(state, data, "media"); commit(); } }, ["Média"]),
          el("button", { class:"btn", onclick: () => { state = sim.campanha(state, data, "pesada"); commit(); } }, ["Pesada"]),
        ]),
        smallHint("Campanha pesada dá mais boost, mas tende a elevar risco.")
      ]);
    }

    if (etapa === "resultado"){
      return el("div", { class:"stack" }, [
        el("div", { class:"big" }, ["Resultado"]),
        el("button", { class:"btn primary", onclick: () => { state = sim.resolverEleicao(state, data); commit(); } }, ["Apurar eleição"])
      ]);
    }

    return el("div", { class:"muted" }, ["Etapa desconhecida."]);
  }

  function screenMidia(){
    const m = state.midia?.manchetes || [];
    const box = card("Mídia — Manchetes", [
      smallHint("As manchetes reagem à sua popularidade e a investigações/escândalos."),
      m.length ? el("ul", { class:"list" }, m.map(x => {
        const when = `${fmt.monthName(x.mes)} ${x.ano}`;
        return el("li", {}, [`${when}: ${x.t}`]);
      })) : el("div", { class:"muted" }, ["Sem manchetes ainda. Avance meses para gerar notícias."]),
    ]);

    return el("div", { class:"grid" }, [box]);
  }

  function screenIntegridade(){
    const i = state.integridade || { nivel:50, risco:20, sobInvestigacao:false, nivelInvestigacao:0 };

    const box = card("Integridade & Investigação", [
      smallHint("Risco alto aumenta chance de investigação. Algumas ações/negociações elevam risco. Honestidade e transparência tendem a reduzir."),
      progressBar("Integridade", i.nivel, "Quanto maior, melhor"),
      progressBar("Risco", i.risco, "Quanto maior, maior chance de investigação"),
      i.sobInvestigacao
        ? el("div", { class:"warn" }, [`Sob investigação • Nível: ${fmt.pct(i.nivelInvestigacao)}`])
        : el("div", { class:"ok" }, ["Sem investigação ativa"]),
      el("div", { class:"row" }, [
        badge("Dica"),
        el("span", {}, ["Use ações de transparência, evite negociações excessivas e tome cuidado com campanhas pesadas."])
      ]),
      el("div", { class:"muted" }, ["Se um escândalo for confirmado, pode surgir um evento especial exigindo resposta."])
    ]);

    return el("div", { class:"grid" }, [box]);
  }

  function screenLogs(){
    const logs = (state.logs || []).slice().reverse();
    const box = card("Diário (últimos acontecimentos)", [
      logs.length ? el("ul", { class:"list" }, logs.slice(0, 80).map(l => el("li", {}, [String(l?.t || l)]))) : el("div", { class:"muted" }, ["Sem logs."]),
      el("button", { class:"btn", onclick: () => { state.logs = []; commit(); renderToast("Logs limpos."); } }, ["Limpar logs (opcional)"])
    ]);
    return el("div", { class:"grid" }, [box]);
  }

  // ---- Main render ----
  function renderMain(){
    switch(activeTab){
      case "painel": return screenPainel();
      case "personagem": return screenPersonagem();
      case "acoes": return screenAcoes();
      case "legislativo": return screenLegislativo();
      case "executivo": return screenExecutivo();
      case "eventos": return screenEventos();
      case "eleicoes": return screenEleicoes();
      case "midia": return screenMidia();
      case "integridade": return screenIntegridade();
      case "logs": return screenLogs();
      default: return screenPainel();
    }
  }

  function ensureBaseStyles(){
    if ($("#sim_pol_styles")) return;

    const css = `
      :root{ --card:rgba(255,255,255,.06); --stroke:rgba(255,255,255,.12); --txt:#e6eef8; --muted:rgba(255,255,255,.68); --ok:#7CFC98; --warn:#FFD36A; --bad:#FF6B6B; }
      body{ margin:0; font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial; color:var(--txt); background: transparent; }
      .wrap{ max-width:1100px; margin:0 auto; padding:14px; }
      .topHeader{ display:flex; gap:12px; align-items:flex-start; justify-content:space-between; padding:12px; border:1px solid var(--stroke); background:rgba(0,0,0,.35); border-radius:14px; }
      .gameTitle{ font-size:20px; font-weight:800; letter-spacing:.2px; }
      .subTitle{ color:var(--muted); font-size:13px; margin-top:2px; }
      .kpiRow{ display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; }
      .kpi{ border:1px solid var(--stroke); background:var(--card); padding:8px 10px; border-radius:12px; min-width:120px; }
      .kpi.small{ min-width:100px; padding:7px 9px; }
      .kpiLabel{ color:var(--muted); font-size:12px; }
      .kpiVal{ font-weight:800; font-size:14px; margin-top:2px; }
      .controls{ display:flex; justify-content:space-between; gap:10px; margin:12px 0; flex-wrap:wrap; }
      .controlsLeft,.controlsRight{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .btn{ border:1px solid var(--stroke); background:rgba(255,255,255,.06); color:var(--txt); padding:9px 12px; border-radius:12px; font-weight:700; cursor:pointer; }
      .btn:hover{ background:rgba(255,255,255,.09); }
      .btn.primary{ background:rgba(90,169,255,.18); border-color:rgba(90,169,255,.35); }
      .btn.danger{ background:rgba(255,107,107,.14); border-color:rgba(255,107,107,.28); }
      .tabs{ display:flex; gap:8px; flex-wrap:wrap; margin:10px 0 12px; }
      .tab{ border:1px solid var(--stroke); background:rgba(255,255,255,.04); color:var(--txt); padding:8px 10px; border-radius:999px; cursor:pointer; font-weight:800; font-size:13px; }
      .tab.active{ background:rgba(255,255,255,.10); }
      .grid{ display:grid; grid-template-columns: 1fr; gap:12px; }
      .grid2{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
      @media (max-width: 820px){ .grid2{ grid-template-columns: 1fr; } .topHeader{ flex-direction:column; } }
      .card{ border:1px solid var(--stroke); background:rgba(0,0,0,.32); border-radius:14px; overflow:hidden; }
      .cardTitle{ padding:10px 12px; font-weight:900; border-bottom:1px solid var(--stroke); background:rgba(255,255,255,.05); }
      .cardBody{ padding:12px; }
      .muted{ color:var(--muted); font-size:13px; }
      .big{ font-size:16px; font-weight:900; }
      .row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
      .stack{ display:flex; flex-direction:column; gap:10px; }
      .badge{ display:inline-flex; align-items:center; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:900; border:1px solid var(--stroke); background:rgba(255,255,255,.06); }
      .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      .hint{ color:rgba(255,255,255,.75); font-size:13px; margin:6px 0 0; }
      .tutorial{ border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); padding:8px 10px; border-radius:12px; font-size:13px; }
      .tutorial.off{ border-color:transparent; background:transparent; }
      .barWrap{ margin:10px 0; }
      .barLabel{ display:flex; justify-content:space-between; color:var(--muted); font-size:12px; margin-bottom:6px; }
      .barOuter{ border:1px solid var(--stroke); border-radius:999px; height:10px; background:rgba(255,255,255,.06); overflow:hidden; }
      .barInner{ height:100%; background:rgba(90,169,255,.65); }
      .list{ margin:0; padding-left:18px; display:flex; flex-direction:column; gap:8px; }
      .ok{ color:var(--ok); font-weight:900; }
      .warn{ color:var(--warn); font-weight:900; }
      .inp{ width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--stroke); background:rgba(0,0,0,.35); color:var(--txt); box-sizing:border-box; }
      .lbl{ display:block; margin-top:10px; margin-bottom:6px; color:var(--muted); font-size:13px; font-weight:800; }
      .split3{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; margin-top:10px; }
      @media (max-width: 820px){ .split3{ grid-template-columns: 1fr; } }
      #toast{ position:fixed; left:50%; bottom:18px; transform:translateX(-50%); background:rgba(0,0,0,.72); border:1px solid rgba(255,255,255,.20); padding:10px 14px; border-radius:14px; opacity:0; pointer-events:none; transition:opacity .18s ease; }
      #toast.show{ opacity:1; }
    `;
    const st = el("style", { id:"sim_pol_styles", html: css });
    document.head.appendChild(st);
  }

  function render(){
    ensureBaseStyles();

    const root = $("#app");
    if (!root) return;

    root.innerHTML = "";
    const wrap = el("div", { class:"wrap" }, [
      topHeader(),
      globalControls(),
      tabBar(),
      renderMain(),
      el("div", { id:"toast" }, [""])
    ]);

    root.appendChild(wrap);
  }

  // ---- Boot ----
  state = loadOrNew();
  render();
  registerSW();

})();