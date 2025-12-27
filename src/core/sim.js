/**
 * Núcleo de simulação:
 * - montar estado inicial
 * - gerar leis pendentes por turno (data-driven)
 * - disparar eventos (data-driven)
 * - aplicar decisões que afetam popularidade/recursos
 */

(function initSim(){
  window.SIM_POL = window.SIM_POL || {};
  const { State, clamp, mkLog } = window.SIM_POL.models;

  function newGameFromData(data){
    const base = window.SIM_POL.save.getDefaultState();
    // Inicializa uma lista inicial de leis pendentes:
    base.leisPendentes = pickRandomLeis(data.leis, 3);
    base.logs.push(mkLog("Novo jogo iniciado como Vereador."));
    return new State(base);
  }

  function pickRandomLeis(leis, n){
    if (!Array.isArray(leis) || leis.length === 0) return [];
    const pool = [...leis];
    const out = [];
    for (let i=0; i<n && pool.length>0; i++){
      const idx = Math.floor(Math.random()*pool.length);
      out.push(pool.splice(idx,1)[0]);
    }
    return out;
  }

  function nextTurn(state, data){
    state.turno += 1;
    state.logs.push(mkLog(`Avançou para o turno ${state.turno}.`));

    // Após votar todas as leis do turno anterior, puxa novas:
    if (state.leisPendentes.length === 0){
      state.leisPendentes = pickRandomLeis(data.leis, 3);
      state.logs.push(mkLog(`Novos projetos de lei chegaram à pauta.`));
    }

    // Chance de evento aleatório:
    if (!state.eventoAtual && Math.random() < 0.45){
      const ev = pickRandomEvento(data.eventos);
      if (ev){
        state.eventoAtual = ev;
        state.logs.push(mkLog(`Evento: ${ev.nome}`));
      }
    }
    return state;
  }

  function pickRandomEvento(eventos){
    if (!Array.isArray(eventos) || eventos.length===0) return null;
    const idx = Math.floor(Math.random()*eventos.length);
    return eventos[idx];
  }

  function voteLaw(state, lawId, approve){
    const idx = state.leisPendentes.findIndex(l=>l.id===lawId);
    if (idx<0) return state;
    const lei = state.leisPendentes[idx];
    if (approve){
      const imp = lei.impactos || {};
      state.popularidade = clamp(state.popularidade + (imp.popularidade||0), 0, 100);
      state.recursos += (imp.recursos||0);
      state.logs.push(mkLog(`Votou SIM: ${lei.titulo}. Impactos aplicados.`));
    } else {
      state.logs.push(mkLog(`Votou NÃO: ${lei.titulo}.`));
    }
    state.leisPendentes.splice(idx,1);
    return state;
  }

  function resolveEvent(state, optionId){
    const ev = state.eventoAtual;
    if (!ev) return state;
    const opt = (ev.opcoes||[]).find(o=>o.id===optionId);
    if (opt){
      const imp = opt.impactos||{};
      state.popularidade = clamp(state.popularidade + (imp.popularidade||0), 0, 100);
      state.recursos += (imp.recursos||0);
      state.logs.push(mkLog(`Evento "${ev.nome}": escolheu "${opt.texto}".`));
    }
    state.eventoAtual = null;
    return state;
  }

  window.SIM_POL.sim = { newGameFromData, nextTurn, voteLaw, resolveEvent };
})();