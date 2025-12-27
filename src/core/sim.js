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

  function isLegislador(cargoId){
    return cargoId === "vereador" || cargoId === "deputado_federal" || cargoId === "senador";
  }
  function isExecutivo(cargoId){
    return cargoId === "prefeito" || cargoId === "governador" || cargoId === "presidente";
  }

  function getCasaPorCargo(cargoId){
    if (cargoId === "vereador") return "camara_municipal";
    if (cargoId === "deputado_federal") return "camara_federal";
    if (cargoId === "senador") return "senado";
    return "executivo";
  }

  function getOpcoesCarreira(data, cargoId){
    const row = (data.carreira || []).find(r => r.de === cargoId);
    return row ? (row.para || []) : [];
  }

  // ========= OPINIÃO POR GRUPOS =========

  function ensureOpiniao(state){
    if (!state.opiniao) state.opiniao = {};
    const keys = ["geral","pobres","classe_media","ricos","empresarios","servidores","religiosos","progressistas","conservadores"];
    for (const k of keys){
      if (typeof state.opiniao[k] !== "number") state.opiniao[k] = 50;
    }
    state.popularidade = clamp(state.opiniao.geral, 0, 100);
  }

  function recomputarGeral(state){
    const o = state.opiniao;
    const geral =
      (o.pobres * 0.18) +
      (o.classe_media * 0.18) +
      (o.ricos * 0.10) +
      (o.empresarios * 0.12) +
      (o.servidores * 0.12) +
      (o.religiosos * 0.10) +
      (o.progressistas * 0.10) +
      (o.conservadores * 0.10);
    state.opiniao.geral = clamp(Math.round(geral), 0, 100);
    state.popularidade = state.opiniao.geral;
  }

  function aplicarImpactoGrupos(state, impactosGrupos){
    ensureOpiniao(state);
    if (!impactosGrupos || typeof impactosGrupos !== "object") return;

    for (const k of Object.keys(impactosGrupos)){
      if (typeof state.opiniao[k] !== "number") continue;
      state.opiniao[k] = clamp(state.opiniao[k] + Number(impactosGrupos[k] || 0), 0, 100);
    }
    recomputarGeral(state);
  }

  // ========= PERSONAGEM / PARTIDO =========

  function ensurePersonagem(state){
    if (!state.personagem) state.personagem = { nome:"Novo Político", partidoId:"centro", ideologia:0, tracos:{ honestidade:50, carisma:50, competencia:50 } };
    if (!state.personagem.tracos) state.personagem.tracos = { honestidade:50, carisma:50, competencia:50 };
  }

  function aplicarBonusPartido(state, data){
    ensurePersonagem(state);
    const partidos = data.partidos || [];
    const p = partidos.find(x => x.id === state.personagem.partidoId);
    if (!p) return;

    const b = p.bonus || {};

    if (typeof b.governabilidade === "number"){
      state.governabilidade = clamp(state.governabilidade + b.governabilidade, 0, 100);
      state.coalizao.forca = state.governabilidade;
    }
    if (typeof b.reputacao === "number"){
      state.reputacao_no_plenario = clamp(state.reputacao_no_plenario + b.reputacao, 0, 100);
    }
    if (b.opinioes){
      aplicarImpactoGrupos(state, b.opinioes);
    }
  }

  function definirPersonagem(state, data, payload){
    ensurePersonagem(state);

    const nome = String(payload?.nome || "").trim();
    if (nome.length >= 2) state.personagem.nome = nome.slice(0, 32);

    const partidoId = payload?.partidoId;
    if (typeof partidoId === "string") state.personagem.partidoId = partidoId;

    const ideologia = Number(payload?.ideologia ?? state.personagem.ideologia);
    state.personagem.ideologia = clamp(ideologia, -100, 100);

    const tr = payload?.tracos || {};
    state.personagem.tracos.honestidade = clamp(Number(tr.honestidade ?? state.personagem.tracos.honestidade), 0, 100);
    state.personagem.tracos.carisma = clamp(Number(tr.carisma ?? state.personagem.tracos.carisma), 0, 100);
    state.personagem.tracos.competencia = clamp(Number(tr.competencia ?? state.personagem.tracos.competencia), 0, 100);

    // Ajustes iniciais baseados em traços
    const bonusCarisma = Math.round((state.personagem.tracos.carisma - 50) * 0.06);
    const bonusHonest = Math.round((state.personagem.tracos.honestidade - 50) * 0.05);
    const bonusComp = Math.round((state.personagem.tracos.competencia - 50) * 0.05);

    aplicarImpactoGrupos(state, { classe_media: bonusCarisma, pobres: bonusHonest });
    state.reputacao_no_plenario = clamp(state.reputacao_no_plenario + bonusComp, 0, 100);

    // Bonus do partido
    aplicarBonusPartido(state, data);

    state.logs.push(mkLog(`Personagem criado: ${state.personagem.nome} (${state.personagem.partidoId}) Ideologia ${state.personagem.ideologia}.`));
    return state;
  }

  // ========= TUTORIAL =========

  function ensureTutorial(state){
    if (!state.tutorial) state.tutorial = { ativo:true, passo:0, concluido:false };
  }

  function tutorialText(state){
    ensureTutorial(state);
    if (!state.tutorial.ativo || state.tutorial.concluido) return null;

    const passo = state.tutorial.passo;

    const steps = [
      "1/5: Crie seu personagem (nome, partido e ideologia).",
      "2/5: Clique em 'Avançar Mês' para iniciar sua rotina política.",
      "3/5: No cargo legislativo, aprove um projeto de lei (Levar à votação).",
      "4/5: Faça 1 negociação de apoio (Negociar).",
      "5/5: Resolva 1 evento (escolha uma opção em Eventos)."
    ];

    return steps[passo] || null;
  }

  function avancarTutorialSe(state, cond){
    ensureTutorial(state);
    if (!state.tutorial.ativo || state.tutorial.concluido) return;

    if (cond){
      state.tutorial.passo += 1;
      if (state.tutorial.passo >= 5){
        state.tutorial.concluido = true;
        state.tutorial.ativo = false;
        state.logs.push(mkLog("Tutorial concluído."));
      } else {
        const msg = tutorialText(state);
        if (msg) state.logs.push(mkLog(`Tutorial: ${msg}`));
      }
    }
  }

  // ========= AÇÕES DO MÊS =========

  function ensureAcoesDoMes(state){
    if (!state.acoesDoMes) state.acoesDoMes = { limite:2, usadas:0 };
    if (typeof state.acoesDoMes.limite !== "number") state.acoesDoMes.limite = 2;
    if (typeof state.acoesDoMes.usadas !== "number") state.acoesDoMes.usadas = 0;
  }

  function resetAcoesDoMes(state){
    ensureAcoesDoMes(state);
    state.acoesDoMes.usadas = 0;
  }

  function aplicarAcaoDoMes(state, data, acaoId){
    if (state.emEleicao){
      state.logs.push(mkLog("Durante eleição, ações do mês ficam suspensas."));
      return state;
    }
    ensureAcoesDoMes(state);

    if (state.acoesDoMes.usadas >= state.acoesDoMes.limite){
      state.logs.push(mkLog("Limite de ações do mês atingido."));
      return state;
    }

    const acoes = data.acoes || [];
    const acao = acoes.find(a => a.id === acaoId);
    if (!acao){
      state.logs.push(mkLog("Ação não encontrada."));
      return state;
    }

    const custo = Number(acao.custo || 0);
    if (state.recursos < custo){
      state.logs.push(mkLog("Recursos insuficientes para essa ação."));
      return state;
    }

    state.recursos -= custo;
    state.acoesDoMes.usadas += 1;

    const imp = acao.impactos || {};

    if (typeof imp.recursos === "number") state.recursos += imp.recursos;
    if (typeof imp.popularidade === "number") aplicarImpactoGrupos(state, { geral: imp.popularidade });
    if (imp.opinioes) aplicarImpactoGrupos(state, imp.opinioes);

    if (typeof imp.governabilidade === "number"){
      state.governabilidade = clamp(state.governabilidade + imp.governabilidade, 0, 100);
      state.coalizao.forca = state.governabilidade;
    }
    if (typeof imp.reputacao === "number"){
      state.reputacao_no_plenario = clamp(state.reputacao_no_plenario + imp.reputacao, 0, 100);
    }

    state.logs.push(mkLog(`Ação do mês: ${acao.nome}. (${state.acoesDoMes.usadas}/${state.acoesDoMes.limite})`));
    return state;
  }

  // ========= ORÇAMENTO =========

  function somaDespesas(state){
    const cats = state.orcamento?.categorias || {};
    let total = 0;
    for (const k of Object.keys(cats)) total += Number(cats[k] || 0);
    return total;
  }

  function aplicarOrcamentoMensal(state){
    const receitaBase = Number(state.orcamento?.receitaMensal || 0);
    const ajusteReceita = Number(state.efeitosGabinete?.ajusteReceita || 0);
    const receita = receitaBase + ajusteReceita;

    const despesas = somaDespesas(state);
    const saldo = receita - despesas;

    state.recursos += saldo;

    if (saldo >= 0){
      aplicarImpactoGrupos(state, { classe_media: +1, empresarios: +1, pobres: +0 });
      state.logs.push(mkLog(`Orçamento: receita ${receita}, despesas ${despesas}, saldo +${saldo}.`));
    } else {
      aplicarImpactoGrupos(state, { pobres: -2, classe_media: -1, servidores: -1 });
      state.logs.push(mkLog(`Orçamento: receita ${receita}, despesas ${despesas}, déficit ${saldo}.`));
    }

    const popBonus = Number(state.efeitosGabinete?.ajustePopularidadeMensal || 0);
    if (popBonus !== 0){
      aplicarImpactoGrupos(state, { geral: popBonus });
      state.logs.push(mkLog(`Gabinete: efeito mensal de opinião ${popBonus > 0 ? "+" : ""}${popBonus}.`));
    }

    if (state.recursos < -2000) state.recursos = -2000;
  }

  function aplicarPerfilOrcamentario(state, data, perfilId){
    if (!isExecutivo(state.cargoId)){
      state.logs.push(mkLog("Ajuste de orçamento apenas no Executivo."));
      return state;
    }
    const perfis = data.orcamento?.perfis || [];
    const p = perfis.find(x => x.id === perfilId);
    if (!p){
      state.logs.push(mkLog("Perfil inválido."));
      return state;
    }

    const baseCats = data.orcamento?.categorias || [];
    const novo = {};
    for (const c of baseCats){
      const key = c.id;
      const sug = p.categorias?.[key];
      novo[key] = typeof sug === "number" ? sug : (typeof c.sugestaoPadrao === "number" ? c.sugestaoPadrao : 50);
    }

    state.orcamento.categorias = novo;
    state.logs.push(mkLog(`Orçamento ajustado para perfil: ${p.nome}.`));

    if (perfilId === "social") aplicarImpactoGrupos(state, { pobres:+2, servidores:+1, empresarios:-1 });
    if (perfilId === "seguranca") aplicarImpactoGrupos(state, { conservadores:+2, progressistas:-1, pobres:-1 });
    if (perfilId === "equilibrio") aplicarImpactoGrupos(state, { classe_media:+1 });

    return state;
  }

  // ========= GABINETE =========

  function recalcularEfeitosGabinete(state, data){
    const tecnicos = data.tecnicos || [];
    let ajusteReceita = 0;
    let ajustePopularidadeMensal = 0;

    const ids = Object.values(state.gabinete || {}).filter(Boolean);
    for (const id of ids){
      const t = tecnicos.find(x => x.id === id);
      if (!t) continue;
      ajusteReceita += Number(t.efeitos?.ajusteReceita || 0);
      ajustePopularidadeMensal += Number(t.efeitos?.ajustePopularidadeMensal || 0);
    }

    state.efeitosGabinete = { ajusteReceita, ajustePopularidadeMensal };
  }

  function nomearTecnico(state, data, slot, tecnicoId){
    if (!isExecutivo(state.cargoId)){
      state.logs.push(mkLog("Nomeações só no Executivo."));
      return state;
    }

    const slotsValidos = ["economia","saude","educacao","seguranca"];
    if (!slotsValidos.includes(slot)){
      state.logs.push(mkLog("Slot inválido."));
      return state;
    }

    const t = (data.tecnicos || []).find(x => x.id === tecnicoId);
    if (!t){
      state.logs.push(mkLog("Técnico não encontrado."));
      return state;
    }

    const custo = Number(t.custoNomeacao || 0);
    if (state.recursos < custo){
      state.logs.push(mkLog("Recursos insuficientes para nomear."));
      return state;
    }

    state.recursos -= custo;
    state.gabinete[slot] = tecnicoId;
    recalcularEfeitosGabinete(state, data);

    if (slot === "economia") aplicarImpactoGrupos(state, { empresarios:+1, classe_media:+1 });
    if (slot === "saude") aplicarImpactoGrupos(state, { pobres:+1, servidores:+1 });
    if (slot === "educacao") aplicarImpactoGrupos(state, { progressistas:+1, classe_media:+1 });
    if (slot === "seguranca") aplicarImpactoGrupos(state, { conservadores:+1 });

    state.logs.push(mkLog(`Nomeado(a) para ${slot.toUpperCase()}: ${t.nome}. (-R$ ${custo})`));
    return state;
  }

  // ========= POLÍTICAS =========

  function aplicarPolitica(state, data, politicaId){
    if (!isExecutivo(state.cargoId)){
      state.logs.push(mkLog("Políticas só no Executivo."));
      return state;
    }

    const p = (data.politicas || []).find(x => x.id === politicaId);
    if (!p){
      state.logs.push(mkLog("Política não encontrada."));
      return state;
    }

    const custo = Number(p.custo || 0);
    if (state.recursos < custo){
      state.logs.push(mkLog("Recursos insuficientes."));
      return state;
    }

    state.recursos -= custo;

    if (p.impactos?.popularidade) aplicarImpactoGrupos(state, { geral: Number(p.impactos.popularidade||0) });
    if (p.impactos?.grupos) aplicarImpactoGrupos(state, p.impactos.grupos);

    if (typeof p.impactos?.ajusteReceitaMensal === "number"){
      state.orcamento.receitaMensal += p.impactos.ajusteReceitaMensal;
    }
    if (typeof p.impactos?.ajusteGovernabilidade === "number"){
      state.governabilidade = clamp(state.governabilidade + p.impactos.ajusteGovernabilidade, 0, 100);
      state.coalizao.forca = state.governabilidade;
    }

    state.logs.push(mkLog(`Política implementada: ${p.nome}. (-R$ ${custo})`));
    return state;
  }

  // ========= LEGISLATIVO + TRAMITAÇÃO =========

  function getRegrasCasa(data, casaId){
    const casas = data.regras_legislativo?.casas || {};
    return casas[casaId] || null;
  }

  function getMembrosCasa(data, casaId){
    const all = data.npcs || [];
    return all.filter(n => n.casaId === casaId);
  }

  function calcularVotoNPC(npc, state, lei){
    ensurePersonagem(state);

    const leiIdeo = typeof lei.tendenciaIdeologica === "number" ? lei.tendenciaIdeologica : 0;
    const npcIdeo = typeof npc.ideologia === "number" ? npc.ideologia : 0;

    const proximidade = 100 - Math.min(100, Math.abs(npcIdeo - leiIdeo));
    const lealdade = typeof npc.lealdade === "number" ? npc.lealdade : 50;

    const reput = clamp(state.reputacao_no_plenario, 0, 100);
    const coalizao = clamp(state.coalizao?.forca ?? state.governabilidade, 0, 100);

    const carisma = clamp(state.personagem.tracos?.carisma ?? 50, 0, 100);
    const bonusCarisma = Math.round((carisma - 50) * 0.15);

    const random = Math.floor(Math.random()*21) - 10;

    const score =
      (proximidade * 0.38) +
      (lealdade * 0.14) +
      (coalizao * 0.23) +
      (reput * 0.15) +
      bonusCarisma +
      random;

    return score >= 55;
  }

  function aplicarImpactosLei(state, lei, aprovada){
    if (!aprovada) return;

    const imp = lei.impactos || {};
    if (imp.popularidade) aplicarImpactoGrupos(state, { geral: Number(imp.popularidade||0) });
    if (imp.recursos) state.recursos += Number(imp.recursos||0);
    if (imp.grupos) aplicarImpactoGrupos(state, imp.grupos);

    state.logs.push(mkLog(`Lei em vigor: ${lei.titulo}.`));
  }

  function votarNoPlenario(state, data, leiId){
    if (!isLegislador(state.cargoId)){
      state.logs.push(mkLog("Você não está em cargo legislativo."));
      return state;
    }
    if (state.emEleicao){
      state.logs.push(mkLog("Durante eleição, votações ficam suspensas."));
      return state;
    }

    const casaId = state.casaAtualId;
    const regras = getRegrasCasa(data, casaId);
    if (!regras){
      state.logs.push(mkLog("Regras da casa não encontradas."));
      return state;
    }

    const leiIdx = state.leisPendentes.findIndex(l => l.id === leiId);
    if (leiIdx < 0){
      state.logs.push(mkLog("Projeto não encontrado."));
      return state;
    }

    const lei = state.leisPendentes[leiIdx];
    const membros = getMembrosCasa(data, casaId);

    let votosSim = 1;
    let votosNao = 0;

    for (const npc of membros){
      const simVote = calcularVotoNPC(npc, state, lei);
      if (simVote) votosSim++;
      else votosNao++;
    }

    const total = votosSim + votosNao;
    const quorumMin = regras.quorumMin || Math.ceil(total * 0.5);
    const aprovado = votosSim >= quorumMin;

    state.logs.push(mkLog(`Votação (${regras.nome}): SIM=${votosSim} • NÃO=${votosNao} • Quórum=${quorumMin} • ${aprovado ? "APROVADO" : "REJEITADO"}`));

    if (aprovado){
      aplicarImpactosLei(state, lei, true);
      state.reputacao_no_plenario = clamp(state.reputacao_no_plenario + 2, 0, 100);
      state.governabilidade = clamp(state.governabilidade + 1, 0, 100);
      state.coalizao.forca = state.governabilidade;

      avancarTutorialSe(state, state.tutorial?.passo === 2);
    } else {
      state.reputacao_no_plenario = clamp(state.reputacao_no_plenario - 2, 0, 100);
      state.governabilidade = clamp(state.governabilidade - 1, 0, 100);
      state.coalizao.forca = state.governabilidade;
    }

    state.leisPendentes.splice(leiIdx, 1);
    return state;
  }

  function enviarLeiParaSancao(state, lei){
    state.leisParaSancao = state.leisParaSancao || [];
    state.leisParaSancao.push(lei);
  }

  function sancionarLei(state, data, leiId){
    if (!isExecutivo(state.cargoId)){
      state.logs.push(mkLog("Sanção/veto apenas no Executivo."));
      return state;
    }
    const idx = (state.leisParaSancao || []).findIndex(l => l.id === leiId);
    if (idx < 0){
      state.logs.push(mkLog("Lei não encontrada para sanção."));
      return state;
    }
    const lei = state.leisParaSancao[idx];
    state.leisParaSancao.splice(idx,1);

    aplicarImpactosLei(state, lei, true);
    state.logs.push(mkLog(`Você SANCIONOU: ${lei.titulo}.`));
    return state;
  }

  function vetarLei(state, data, leiId){
    if (!isExecutivo(state.cargoId)){
      state.logs.push(mkLog("Sanção/veto apenas no Executivo."));
      return state;
    }
    const idx = (state.leisParaSancao || []).findIndex(l => l.id === leiId);
    if (idx < 0){
      state.logs.push(mkLog("Lei não encontrada para veto."));
      return state;
    }
    const lei = state.leisParaSancao[idx];
    state.leisParaSancao.splice(idx,1);

    state.logs.push(mkLog(`Você VETOU: ${lei.titulo}. O Legislativo pode derrubar o veto.`));

    const forca = clamp(state.coalizao?.forca ?? state.governabilidade, 0, 100);
    const chanceDerrubar = clamp(70 - (forca * 0.6), 5, 80);
    const roll = Math.random()*100;

    if (roll < chanceDerrubar){
      state.logs.push(mkLog(`VETO DERRUBADO! (chance ${Math.round(chanceDerrubar)}%, rolou ${Math.round(roll)}).`));
      aplicarImpactosLei(state, lei, true);
      state.governabilidade = clamp(state.governabilidade - 2, 0, 100);
      state.coalizao.forca = state.governabilidade;
      aplicarImpactoGrupos(state, { servidores:+1, progressistas:+1, conservadores:-1 });
    } else {
      state.logs.push(mkLog(`Veto mantido. (chance ${Math.round(chanceDerrubar)}%, rolou ${Math.round(roll)}).`));
      state.governabilidade = clamp(state.governabilidade + 1, 0, 100);
      state.coalizao.forca = state.governabilidade;
      aplicarImpactoGrupos(state, { empresarios:+1, conservadores:+1, progressistas:-1 });
    }
    return state;
  }

  function rejeitarLei(state, leiId){
    const idx = state.leisPendentes.findIndex(l => l.id === leiId);
    if (idx < 0) return state;
    const lei = state.leisPendentes[idx];
    state.logs.push(mkLog(`Você arquivou: ${lei.titulo}.`));
    state.reputacao_no_plenario = clamp(state.reputacao_no_plenario - 1, 0, 100);
    state.leisPendentes.splice(idx,1);
    return state;
  }

  function negociarApoio(state, data, pacote){
    if (!isLegislador(state.cargoId)){
      state.logs.push(mkLog("Negociação só em cargos legislativos."));
      return state;
    }
    if (state.emEleicao){
      state.logs.push(mkLog("Durante eleições, negociações travadas."));
      return state;
    }

    const tabela = {
      pequeno: { custo: 80, gov: 4, rep: 1 },
      medio:   { custo: 180, gov: 9, rep: 2 },
      grande:  { custo: 320, gov: 16, rep: 3 }
    };
    const t = tabela[pacote];
    if (!t){
      state.logs.push(mkLog("Pacote inválido."));
      return state;
    }
    if (state.recursos < t.custo){
      state.logs.push(mkLog("Recursos insuficientes."));
      return state;
    }

    state.recursos -= t.custo;
    state.governabilidade = clamp(state.governabilidade + t.gov, 0, 100);
    state.coalizao.forca = state.governabilidade;
    state.reputacao_no_plenario = clamp(state.reputacao_no_plenario + t.rep, 0, 100);

    aplicarImpactoGrupos(state, { progressistas:-1, conservadores:-1, classe_media:-1 });

    state.logs.push(mkLog(`Negociou apoio (${pacote}). Governabilidade +${t.gov}, Reputação +${t.rep}.`));

    avancarTutorialSe(state, state.tutorial?.passo === 3);
    return state;
  }

  // ========= EVENTOS COM CADEIAS =========

  function resolveEvent(state, data, optionId){
    if (state.emEleicao){
      state.logs.push(mkLog("Durante eleição, eventos ficam suspensos."));
      return state;
    }
    const ev = state.eventoAtual;
    if (!ev) return state;

    const opt = (ev.opcoes || []).find(o => o.id === optionId);
    if (opt){
      const imp = opt.impactos || {};
      if (imp.recursos) state.recursos += Number(imp.recursos||0);
      if (imp.popularidade) aplicarImpactoGrupos(state, { geral: Number(imp.popularidade||0) });
      if (imp.grupos) aplicarImpactoGrupos(state, imp.grupos);
      if (imp.opinioes) aplicarImpactoGrupos(state, imp.opinioes);

      state.logs.push(mkLog(`Evento "${ev.nome}": escolheu "${opt.texto}".`));

      const nextId = opt.proximoEventoId || null;
      if (nextId){
        state.cadeiaEventos = ev.cadeiaId || state.cadeiaEventos || "cadeia";
        const nextEv = (data.eventos || []).find(e => e.id === nextId);
        if (nextEv){
          state.eventoAtual = nextEv;
          state.logs.push(mkLog(`Cadeia continua: ${nextEv.nome}`));
          return state;
        }
      }
    }

    state.eventoAtual = null;
    state.cadeiaEventos = null;

    avancarTutorialSe(state, state.tutorial?.passo === 4);
    return state;
  }

  // ========= ELEIÇÕES =========

  function startElection(state, data){
    state.emEleicao = true;
    state.eleicao = { etapa: "escolher_cargo", cargoAlvoId: null, boostCampanha: 0, custoCampanha: 0 };

    const cargoAtual = getCargo(data, state.cargoId);
    state.logs.push(mkLog(`Mandato encerrado como ${cargoAtual ? cargoAtual.nome : state.cargoId}.`));
    state.logs.push(mkLog("Eleições iniciadas! Escolha o cargo que deseja disputar."));
  }

  function escolherCargoParaDisputar(state, data, cargoAlvoId){
    if (!state.emEleicao || !state.eleicao) return state;

    const opcoes = getOpcoesCarreira(data, state.cargoId);
    if (!opcoes.includes(cargoAlvoId)){
      state.logs.push(mkLog("Cargo inválido para progressão."));
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

    ensurePersonagem(state);

    const tabela = {
      leve:  { custo: 100, boost: 5,  grupos: { classe_media:+1 } },
      media: { custo: 250, boost: 12, grupos: { classe_media:+2, pobres:+1 } },
      pesada:{ custo: 450, boost: 22, grupos: { pobres:+2, religiosos:+1 } }
    };

    const c = tabela[tipo];
    if (!c){
      state.logs.push(mkLog("Campanha inválida."));
      return state;
    }
    if (state.recursos < c.custo){
      state.logs.push(mkLog("Recursos insuficientes."));
      return state;
    }

    const carisma = clamp(state.personagem.tracos?.carisma ?? 50, 0, 100);
    const bonusCarisma = Math.round((carisma - 50) * 0.12);

    state.recursos -= c.custo;
    state.eleicao.boostCampanha = c.boost + bonusCarisma;
    state.eleicao.custoCampanha = c.custo;
    state.eleicao.etapa = "resultado";

    aplicarImpactoGrupos(state, c.grupos);

    state.logs.push(mkLog(`Campanha ${tipo.toUpperCase()} realizada. (-R$ ${c.custo})`));
    return state;
  }

  function resolverEleicao(state, data){
    if (!state.emEleicao || !state.eleicao) return state;
    if (state.eleicao.etapa !== "resultado") return state;

    ensureOpiniao(state);
    ensurePersonagem(state);

    const cargoAlvoId = state.eleicao.cargoAlvoId;
    if (!cargoAlvoId){
      state.logs.push(mkLog("Escolha um cargo antes do resultado."));
      return state;
    }

    const honest = clamp(state.personagem.tracos?.honestidade ?? 50, 0, 100);
    const bonusHonest = Math.round((honest - 50) * 0.10);

    const random = Math.floor(Math.random() * 21) - 10;
    const score = state.opiniao.geral + (state.eleicao.boostCampanha || 0) + bonusHonest + random;
    const venceu = score >= 55;

    if (venceu){
      state.cargoId = cargoAlvoId;
      state.mandatoMesesRestantes = 6;
      state.casaAtualId = getCasaPorCargo(state.cargoId);
      const cargo = getCargo(data, state.cargoId);
      state.logs.push(mkLog(`Vitória eleitoral! Score=${score}. Você agora é ${cargo ? cargo.nome : cargoAlvoId}.`));

      if (isExecutivo(state.cargoId)){
        state.coalizao.forca = clamp(state.governabilidade, 0, 100);
        state.logs.push(mkLog("Executivo: agora você precisa sancionar/vetar leis aprovadas pelo Legislativo."));
      }

      state.leisPendentes = pickRandom(data.leis, 3);
    } else {
      const atual = getCargo(data, state.cargoId);
      state.mandatoMesesRestantes = 6;
      state.logs.push(mkLog(`Derrota eleitoral. Score=${score}. Você permanece como ${atual ? atual.nome : state.cargoId}.`));
      state.leisPendentes = pickRandom(data.leis, 3);
    }

    state.emEleicao = false;
    state.eleicao = null;
    return state;
  }

  // ========= LOOP PRINCIPAL =========

  function maybeGerarLeiParaSancao(state, data){
    if (!isExecutivo(state.cargoId)) return;

    const forca = clamp(state.coalizao?.forca ?? state.governabilidade, 0, 100);
    const chance = clamp(35 + (forca * 0.25), 35, 60);
    if (Math.random()*100 < chance){
      const lei = pickOne(data.leis);
      if (lei){
        enviarLeiParaSancao(state, lei);
        state.logs.push(mkLog(`Lei aprovada no Legislativo e enviada para sanção: ${lei.titulo}.`));
      }
    }
  }

  function nextTurn(state, data){
    if (state.emEleicao){
      state.logs.push(mkLog("Período eleitoral ativo. Resolva a eleição para continuar."));
      return state;
    }

    ensureOpiniao(state);
    ensurePersonagem(state);
    ensureTutorial(state);
    ensureAcoesDoMes(state);

    // reset ações do mês
    resetAcoesDoMes(state);

    // avança tempo
    state.mes += 1;
    if (state.mes > 12){ state.mes = 1; state.ano += 1; }
    state.turno += 1;
    state.logs.push(mkLog(`Avançou para Ano ${state.ano} • Mês ${state.mes}.`));

    // tutorial passo 2/5
    avancarTutorialSe(state, state.tutorial?.passo === 1);

    state.casaAtualId = getCasaPorCargo(state.cargoId);

    state.mandatoMesesRestantes -= 1;
    if (state.mandatoMesesRestantes < 0) state.mandatoMesesRestantes = 0;

    if (isExecutivo(state.cargoId)){
      aplicarOrcamentoMensal(state);
      maybeGerarLeiParaSancao(state, data);

      if (!state.eventoAtual && Math.random() < 0.55){
        const ev = pickOne(data.eventos);
        if (ev){
          state.eventoAtual = ev;
          state.logs.push(mkLog(`Evento: ${ev.nome}`));
        }
      }
    } else {
      if (!state.eventoAtual && Math.random() < 0.35){
        const ev = pickOne(data.eventos);
        if (ev){
          state.eventoAtual = ev;
          state.logs.push(mkLog(`Evento: ${ev.nome}`));
        }
      }

      if (isLegislador(state.cargoId)){
        const drift = Math.floor(Math.random()*5) - 2;
        state.governabilidade = clamp(state.governabilidade + drift, 0, 100);
        state.coalizao.forca = state.governabilidade;
      }
    }

    if (state.mandatoMesesRestantes === 0){
      startElection(state, data);
      return state;
    }

    if (!Array.isArray(state.leisPendentes)) state.leisPendentes = [];
    if (state.leisPendentes.length === 0){
      state.leisPendentes = pickRandom(data.leis, 3);
      state.logs.push(mkLog("Novos projetos chegaram à pauta."));
    }

    return state;
  }

  function newGameFromData(data){
    const base = window.SIM_POL.save.getDefaultState();

    base.casaAtualId = getCasaPorCargo(base.cargoId);
    base.leisPendentes = pickRandom(data.leis, 3);

    base.logs.push(mkLog("Novo jogo iniciado."));
    base.logs.push(mkLog("Bloco F: personagem + partido + ideologia + tutorial + ações do mês."));
    ensureOpiniao(base);
    ensurePersonagem(base);
    ensureTutorial(base);
    ensureAcoesDoMes(base);

    // tutorial passo 1/5 aparece
    const msg = tutorialText(base);
    if (msg) base.logs.push(mkLog(`Tutorial: ${msg}`));

    return new State(base);
  }

  window.SIM_POL.sim = {
    newGameFromData,
    nextTurn,

    // personagem + tutorial + ações
    definirPersonagem,
    tutorialText,
    aplicarAcaoDoMes,

    // legislativo
    votarNoPlenario,
    rejeitarLei,
    negociarApoio,
    isLegislador,

    // executivo
    isExecutivo,
    aplicarPerfilOrcamentario,
    nomearTecnico,
    aplicarPolitica,
    sancionarLei,
    vetarLei,

    // eventos
    resolveEvent,

    // eleições
    escolherCargoParaDisputar,
    campanha,
    resolverEleicao,

    // helpers
    getCasaPorCargo
  };
})();