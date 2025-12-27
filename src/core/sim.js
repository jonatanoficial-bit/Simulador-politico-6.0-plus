/**
 * Núcleo de simulação (Parte 2):
 * - Tempo: ano/mês
 * - Mandato: decrementa por mês
 * - Quando mandato acaba: entra em eleição
 * - Eleição: escolher cargo alvo + campanha + resultado
 * - Progressão: muda cargo ao vencer
 */

(function initSim(){
  window.SIM_POL = window.SIM_POL || {};
  const { State, clamp, mkLog } = window.SIM_POL.models;

  function pickRandom(items, n){
    if (!Array.isArray(items) || items.length === 0) return [];
    const pool = [...items];
    const out = [];
    for (let i=0; i<n && pool.length>0; i++){
      const idx = Math.floor(Math.random()*pool.length);
      out.push(pool.splice(idx,1)[0]);
    }
    return out;
  }

  function pickOne(items){
    if (!Array.isArray(items) || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  }

  function getCargo(data, cargoId){
    return (data.cargos || []).find(c => c.id === cargoId) || null;
  }

  function getOpcoesCarreira(data, cargoId){
    const row = (data.carreira || []).find(r => r.de === cargoId);
    return row ? (row.para || []) : [];
  }

  function newGameFromData(data){
    const base = window.SIM_POL.save.getDefaultState();

    const cargo = getCargo(data, base.cargoId);
    base.logs.push(mkLog("Novo jogo iniciado como Vereador."));
    if (cargo) base.logs.push(mkLog(`Cargo atual: ${cargo.nome}. Mandato tutorial: ${base.mandatoMesesRestantes} meses.`));

    // Inicia com algumas leis
    base.leisPendentes = pickRandom(data.leis, 3);

    return new State(base);
  }

  function advanceMonth(state){
    state.mes += 1;
    if (state.mes > 12){
      state.mes = 1;
      state.ano += 1;
    }
    state.turno += 1;
  }

  function nextTurn(state, data){
    // Se estiver em eleição, não avança mês até resolver
    if (state.emEleicao){
      state.logs.push(mkLog("Você está em período eleitoral. Resolva a eleição para continuar."));
      return state;
    }

    advanceMonth(state);
    state.logs.push(mkLog(`Avançou para Ano ${state.ano} • Mês ${state.mes}.`));

    // Mandato
    state.mandatoMesesRestantes -= 1;
    if (state.mandatoMesesRestantes < 0) state.mandatoMesesRestantes = 0;

    // Se acabou mandato → entrar em eleição
    if (state.mandatoMesesRestantes === 0){
      startElection(state, data);
      return state;
    }

    // Leis: se zerou, repõe
    if (state.leisPendentes.length === 0){
      state.leisPendentes = pickRandom(data.leis, 3);
      state.logs.push(mkLog("Novos projetos de lei chegaram à pauta."));
    }

    // Eventos: chance
    if (!state.eventoAtual && Math.random() < 0.40){
      const ev = pickOne(data.eventos);
      if (ev){
        state.eventoAtual = ev;
        state.logs.push(mkLog(`Evento: ${ev.nome}`));
      }
    }

    return state;
  }

  function voteLaw(state, lawId, approve){
    if (state.emEleicao){
      state.logs.push(mkLog("Durante a eleição, foque na campanha. Você pode votar depois."));
      return state;
    }

    const idx = state.leisPendentes.findIndex(l => l.id === lawId);
    if (idx < 0) return state;

    const lei = state.leisPendentes[idx];
    if (approve){
      const imp = lei.impactos || {};
      state.popularidade = clamp(state.popularidade + (imp.popularidade || 0), 0, 100);
      state.recursos += (imp.recursos || 0);
      state.logs.push(mkLog(`Votou SIM: ${lei.titulo}. Impactos aplicados.`));
    } else {
      state.logs.push(mkLog(`Votou NÃO: ${lei.titulo}.`));
    }
    state.leisPendentes.splice(idx, 1);
    return state;
  }

  function resolveEvent(state, optionId){
    if (state.emEleicao){
      state.logs.push(mkLog("Você está em eleição. Resolva a eleição para continuar eventos."));
      return state;
    }

    const ev = state.eventoAtual;
    if (!ev) return state;
    const opt = (ev.opcoes || []).find(o => o.id === optionId);
    if (opt){
      const imp = opt.impactos || {};
      state.popularidade = clamp(state.popularidade + (imp.popularidade || 0), 0, 100);
      state.recursos += (imp.recursos || 0);
      state.logs.push(mkLog(`Evento "${ev.nome}": escolheu "${opt.texto}".`));
    }
    state.eventoAtual = null;
    return state;
  }

  // =========================
  // ELEIÇÕES
  // =========================

  function startElection(state, data){
    state.emEleicao = true;
    state.eleicao = {
      etapa: "escolher_cargo",
      cargoAlvoId: null,
      boostCampanha: 0,
      custoCampanha: 0,
      resultado: null
    };

    const cargoAtual = getCargo(data, state.cargoId);
    state.logs.push(mkLog(`Mandato encerrado como ${cargoAtual ? cargoAtual.nome : state.cargoId}.`));
    state.logs.push(mkLog("Eleições iniciadas! Escolha o cargo que deseja disputar."));
  }

  function escolherCargoParaDisputar(state, data, cargoAlvoId){
    if (!state.emEleicao || !state.eleicao) return state;

    const opcoes = getOpcoesCarreira(data, state.cargoId);
    if (!opcoes.includes(cargoAlvoId)){
      state.logs.push(mkLog("Cargo inválido para progressão neste momento."));
      return state;
    }

    state.eleicao.cargoAlvoId = cargoAlvoId;
    state.eleicao.etapa = "campanha";
    const alvo = getCargo(data, cargoAlvoId);
    state.logs.push(mkLog(`Você decidiu disputar: ${alvo ? alvo.nome : cargoAlvoId}.`));
    state.logs.push(mkLog("Escolha a intensidade da campanha."));
    return state;
  }

  function campanha(state, data, tipo){
    if (!state.emEleicao || !state.eleicao) return state;
    if (state.eleicao.etapa !== "campanha") return state;

    // Tipos: leve / media / pesada
    const tabela = {
      leve:  { custo: 100, boost: 5,  pop: 1 },
      media: { custo: 250, boost: 12, pop: 2 },
      pesada:{ custo: 450, boost: 22, pop: 3 }
    };

    const c = tabela[tipo];
    if (!c){
      state.logs.push(mkLog("Campanha inválida."));
      return state;
    }
    if (state.recursos < c.custo){
      state.logs.push(mkLog("Recursos insuficientes para essa campanha."));
      return state;
    }

    state.recursos -= c.custo;
    state.popularidade = clamp(state.popularidade + c.pop, 0, 100);
    state.eleicao.boostCampanha = c.boost;
    state.eleicao.custoCampanha = c.custo;
    state.eleicao.etapa = "resultado";

    state.logs.push(mkLog(`Campanha ${tipo.toUpperCase()} realizada. (-R$ ${c.custo})`));
    return state;
  }

  function resolverEleicao(state, data){
    if (!state.emEleicao || !state.eleicao) return state;
    if (state.eleicao.etapa !== "resultado") return state;

    const cargoAlvoId = state.eleicao.cargoAlvoId;
    if (!cargoAlvoId){
      state.logs.push(mkLog("Você precisa escolher um cargo antes do resultado."));
      return state;
    }

    // Cálculo simples (funcional e evoluível):
    // score = popularidade + boostCampanha + random(-10..+10)
    const random = Math.floor(Math.random() * 21) - 10;
    const score = state.popularidade + (state.eleicao.boostCampanha || 0) + random;

    const venceu = score >= 55;

    if (venceu){
      // Promoção
      state.cargoId = cargoAlvoId;

      // Novo mandato: por enquanto, tutorial rápido de 6 meses também.
      // Depois você pode mudar isso para o mandato real do cargo.
      const cargo = getCargo(data, state.cargoId);
      state.mandatoMesesRestantes = 6;

      state.logs.push(mkLog(`Vitória eleitoral! Score=${score}. Você agora é ${cargo ? cargo.nome : cargoAlvoId}.`));
      state.logs.push(mkLog("Novo mandato iniciado (tutorial de 6 meses)."));

      // Recarrega leis para o novo ciclo
      state.leisPendentes = pickRandom(data.leis, 3);
    } else {
      // Derrota: continua no mesmo cargo e reinicia mandato curto
      const atual = getCargo(data, state.cargoId);
      state.mandatoMesesRestantes = 6;
      state.logs.push(mkLog(`Derrota eleitoral. Score=${score}. Você permanece como ${atual ? atual.nome : state.cargoId}.`));
      state.logs.push(mkLog("Novo ciclo iniciado (tutorial de 6 meses)."));
      state.leisPendentes = pickRandom(data.leis, 3);
    }

    state.emEleicao = false;
    state.eleicao.resultado = venceu ? "vitoria" : "derrota";
    state.eleicao.etapa = "finalizado";
    state.eleicao = null;

    return state;
  }

  window.SIM_POL.sim = {
    newGameFromData,
    nextTurn,
    voteLaw,
    resolveEvent,

    // eleições
    escolherCargoParaDisputar,
    campanha,
    resolverEleicao
  };
})();