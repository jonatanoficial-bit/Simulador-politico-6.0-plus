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
  function num(v, d=0){
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }

  function getCargo(data, cargoId){
    return (data.cargos || []).find(c => c.id === cargoId) || null;
  }

  // Compat: alguns builds antigos usam "deputado" em vez de "deputado_federal"
  function isLegislador(cargoId){
    return cargoId === "vereador" || cargoId === "deputado" || cargoId === "deputado_federal" || cargoId === "senador";
  }
  function isExecutivo(cargoId){
    return cargoId === "prefeito" || cargoId === "governador" || cargoId === "presidente";
  }

  function getCasaPorCargo(cargoId){
    if (cargoId === "vereador") return "camara_municipal";
    if (cargoId === "deputado") return "camara_federal";
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
      state.opiniao[k] = clamp(state.opiniao[k] + num(impactosGrupos[k], 0), 0, 100);
    }
    recomputarGeral(state);
  }

  // ========= PERSONAGEM / PARTIDO =========

  function ensureCoalizao(state){
    if (!state.coalizao || typeof state.coalizao !== "object") state.coalizao = {};
    if (typeof state.coalizao.forca !== "number"){
      const base = (typeof state.governabilidade === "number") ? state.governabilidade : 50;
      state.coalizao.forca = clamp(base, 0, 100);
    }
  }

  function ensurePersonagem(state){
    if (!state.personagem) state.personagem = { nome:"Novo Político", partidoId:"centro", ideologia:0, tracos:{ honestidade:50, carisma:50, competencia:50 } };
    if (!state.personagem.tracos) state.personagem.tracos = { honestidade:50, carisma:50, competencia:50 };
    if (typeof state.personagem.ideologia !== "number") state.personagem.ideologia = 0;
    if (typeof state.personagem.partidoId !== "string") state.personagem.partidoId = "centro";
    if (typeof state.personagem.nome !== "string") state.personagem.nome = "Novo Político";
    ensureCoalizao(state);
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

    const ideologia = num(payload?.ideologia, state.personagem.ideologia);
    state.personagem.ideologia = clamp(ideologia, -100, 100);

    const tr = payload?.tracos || {};
    state.personagem.tracos.honestidade = clamp(num(tr.honestidade, state.personagem.tracos.honestidade), 0, 100);
    state.personagem.tracos.carisma = clamp(num(tr.carisma, state.personagem.tracos.carisma), 0, 100);
    state.personagem.tracos.competencia = clamp(num(tr.competencia, state.personagem.tracos.competencia), 0, 100);

    // Ajustes iniciais baseados em traços
    const bonusCarisma = Math.round((state.personagem.tracos.carisma - 50) * 0.06);
    const bonusHonest = Math.round((state.personagem.tracos.honestidade - 50) * 0.05);
    const bonusComp = Math.round((state.personagem.tracos.competencia - 50) * 0.05);

    aplicarImpactoGrupos(state, { classe_media: bonusCarisma, pobres: bonusHonest });
    state.reputacao_no_plenario = clamp(state.reputacao_no_plenario + bonusComp, 0, 100);

    // Bonus do partido
    aplicarBonusPartido(state, data);

    state.logs.push(mkLog(`Personagem criado: ${state.personagem.nome} (${state.personagem.partidoId}) Ideologia ${state.personagem.ideologia}.`));

    // Bloco G: integridade inicial
    ensureIntegridade(state);
    // honestidade alta melhora integridade base
    const h = clamp(state.personagem.tracos.honestidade, 0, 100);
    state.integridade.nivel = clamp(Math.round(50 + (h - 50) * 0.7), 0, 100);

    // Tutorial passo 1/5 (se estiver ativo)
    avancarTutorialSe(state, state.tutorial?.passo === 0);

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

  // Bloco G: se não existir data.acoes, cria fallback mínimo (pra não quebrar)
  function getAcoesFallback(){
    return [
      {
        id: "agenda_bairros",
        nome: "Visitar bairros e ouvir demandas",
        custo: 30,
        impactos: { opinioes: { pobres:+2, classe_media:+1 }, reputacao:+1 }
      },
      {
        id: "comunicacao",
        nome: "Comunicação e transparência",
        custo: 20,
        impactos: { popularidade:+1, opinioes: { classe_media:+1, progressistas:+1, conservadores:+1 } }
      },
      {
        id: "articulacao",
        nome: "Articulação política",
        custo: 50,
        impactos: { governabilidade:+5, opinioes: { classe_media:-1, progressistas:-1, conservadores:-1 } }
      }
    ];
  }

  function aplicarAcaoDoMes(state, data, acaoId){
    if (state.emEleicao){
      state.logs.push(mkLog("Durante eleição, ações do mês ficam suspensas."));
      return state;
    }
    ensureAcoesDoMes(state);
    ensurePersonagem(state);
    ensureIntegridade(state);

    if (state.acoesDoMes.usadas >= state.acoesDoMes.limite){
      state.logs.push(mkLog("Limite de ações do mês atingido."));
      return state;
    }

    const acoes = Array.isArray(data.acoes) && data.acoes.length ? data.acoes : getAcoesFallback();
    const acao = acoes.find(a => a.id === acaoId);
    if (!acao){
      state.logs.push(mkLog("Ação não encontrada."));
      return state;
    }

    const custo = num(acao.custo, 0);
    if (state.recursos < custo){
      state.logs.push(mkLog("Recursos insuficientes para essa ação."));
      return state;
    }

    state.recursos -= custo;
    state.acoesDoMes.usadas += 1;

    const imp = acao.impactos || {};

    if (typeof imp.recursos === "number") state.recursos += imp.recursos;
    if (typeof imp.popularidade === "number") aplicarImpactoGrupos(state, { geral: num(imp.popularidade, 0) });
    if (imp.opinioes) aplicarImpactoGrupos(state, imp.opinioes);

    if (typeof imp.governabilidade === "number"){
      state.governabilidade = clamp(state.governabilidade + num(imp.governabilidade, 0), 0, 100);
      state.coalizao.forca = state.governabilidade;
    }
    if (typeof imp.reputacao === "number"){
      state.reputacao_no_plenario = clamp(state.reputacao_no_plenario + num(imp.reputacao, 0), 0, 100);
    }

    // Bloco G: ações podem afetar integridade (ex: articulação pesada pode reduzir)
    if (acaoId === "articulacao"){
      state.integridade.risco = clamp(state.integridade.risco + 2, 0, 100);
      state.integridade.nivel = clamp(state.integridade.nivel - 1, 0, 100);
    }
    if (acaoId === "comunicacao"){
      state.integridade.risco = clamp(state.integridade.risco - 2, 0, 100);
      state.integridade.nivel = clamp(state.integridade.nivel + 1, 0, 100);
    }

    state.logs.push(mkLog(`Ação do mês: ${acao.nome}. (${state.acoesDoMes.usadas}/${state.acoesDoMes.limite})`));

    // Tutorial: ação do mês não é um passo do tutorial atual, mas pode ser usado depois
    return state;
  }

  // ========= ORÇAMENTO =========

  function somaDespesas(state){
    const cats = state.orcamento?.categorias || {};
    let total = 0;
    for (const k of Object.keys(cats)) total += num(cats[k], 0);
    return total;
  }

  function aplicarOrcamentoMensal(state){
    const receitaBase = num(state.orcamento?.receitaMensal, 0);
    const ajusteReceita = num(state.efeitosGabinete?.ajusteReceita, 0);
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

    const popBonus = num(state.efeitosGabinete?.ajustePopularidadeMensal, 0);
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
      ajusteReceita += num(t.efeitos?.ajusteReceita, 0);
      ajustePopularidadeMensal += num(t.efeitos?.ajustePopularidadeMensal, 0);
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

    const custo = num(t.custoNomeacao, 0);
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

    // Bloco G: técnico pode reduzir risco se for competente (usando custo como "sinal")
    ensureIntegridade(state);
    state.integridade.risco = clamp(state.integridade.risco - 1, 0, 100);

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

    const custo = num(p.custo, 0);
    if (state.recursos < custo){
      state.logs.push(mkLog("Recursos insuficientes."));
      return state;
    }

    state.recursos -= custo;

    if (p.impactos?.popularidade) aplicarImpactoGrupos(state, { geral: num(p.impactos.popularidade, 0) });
    if (p.impactos?.grupos) aplicarImpactoGrupos(state, p.impactos.grupos);

    if (typeof p.impactos?.ajusteReceitaMensal === "number"){
      state.orcamento.receitaMensal += p.impactos.ajusteReceitaMensal;
    }
    if (typeof p.impactos?.ajusteGovernabilidade === "number"){
      state.governabilidade = clamp(state.governabilidade + p.impactos.ajusteGovernabilidade, 0, 100);
      state.coalizao.forca = state.governabilidade;
    }

    // Bloco G: algumas políticas aumentam risco (compras/obras)
    ensureIntegridade(state);
    const nome = String(p.nome || "").toLowerCase();
    if (nome.includes("obra") || nome.includes("contrato") || nome.includes("licita")){
      state.integridade.risco = clamp(state.integridade.risco + 3, 0, 100);
    } else {
      state.integridade.risco = clamp(state.integridade.risco + 1, 0, 100);
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

  // Bloco G: influência de partido/bancada
  function calcDisciplinaPartidaria(data, npc){
    const partidos = data.partidos || [];
    const p = partidos.find(x => x.id === npc.partidoId);
    // disciplina 0..100
    return clamp(num(p?.disciplina, 55), 0, 100);
  }

  function calcAfinidadePartidoJogador(state, npc){
    ensurePersonagem(state);
    if (!npc || typeof npc !== "object") return 0;
    if (!npc.partidoId) return 0;
    if (npc.partidoId === state.personagem.partidoId) return 12; // mesma bancada ajuda bastante
    return 0;
  }

  function calcularVotoNPC(npc, state, data, lei){
    ensurePersonagem(state);

    const leiIdeo = typeof lei.tendenciaIdeologica === "number" ? lei.tendenciaIdeologica : 0;
    const npcIdeo = typeof npc.ideologia === "number" ? npc.ideologia : 0;

    const proximidade = 100 - Math.min(100, Math.abs(npcIdeo - leiIdeo));
    const lealdade = typeof npc.lealdade === "number" ? npc.lealdade : 50;

    const reput = clamp(state.reputacao_no_plenario, 0, 100);
    const coalizao = clamp(state.coalizao?.forca ?? state.governabilidade, 0, 100);

    const carisma = clamp(state.personagem.tracos?.carisma ?? 50, 0, 100);
    const bonusCarisma = Math.round((carisma - 50) * 0.15);

    const disciplina = calcDisciplinaPartidaria(data, npc);
    const bonusBancada = calcAfinidadePartidoJogador(state, npc);

    // se a coalizão for fraca, disciplina pesa mais
    const disciplinaPeso = coalizao < 45 ? 0.12 : 0.06;
    const bonusDisciplina = Math.round((disciplina - 50) * disciplinaPeso);

    const random = Math.floor(Math.random()*21) - 10;

    const score =
      (proximidade * 0.36) +
      (lealdade * 0.14) +
      (coalizao * 0.22) +
      (reput * 0.14) +
      bonusCarisma +
      bonusDisciplina +
      bonusBancada +
      random;

    return score >= 55;
  }

  function aplicarImpactosLei(state, lei, aprovada){
    if (!aprovada) return;

    const imp = lei.impactos || {};
    if (imp.popularidade) aplicarImpactoGrupos(state, { geral: num(imp.popularidade, 0) });
    if (imp.recursos) state.recursos += num(imp.recursos, 0);
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
    let regras = getRegrasCasa(data, casaId);
    if (!regras){
      // Fallback: evita travar UI/tutoriais se data.js estiver incompleto
      state.logs.push(mkLog("Regras da casa não encontradas (fallback)."));
      regras = { quorum: 0.5, maioria: "simples" };
    }

    const leiIdx = state.leisPendentes.findIndex(l => l.id === leiId);
    if (leiIdx < 0){
      state.logs.push(mkLog("Projeto não encontrado."));
      return state;
    }

    const lei = state.leisPendentes[leiIdx];
    let membros = getMembrosCasa(data, casaId);

    if (!Array.isArray(membros) || membros.length === 0){
      // Fallback: casa sem NPCs — cria uma bancada genérica
      membros = Array.from({length: 20}).map((_,i)=>({ id: `${casaId}_m${i+1}`, casaId, lealdade: 50 }));
    }

    let votosSim = 1;
    let votosNao = 0;

    for (const npc of membros){
      const simVote = calcularVotoNPC(npc, state, data, lei);
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

      // Bloco G: boa votação melhora integridade um pouco
      ensureIntegridade(state);
      state.integridade.nivel = clamp(state.integridade.nivel + 1, 0, 100);
      state.integridade.risco = clamp(state.integridade.risco - 1, 0, 100);

      avancarTutorialSe(state, state.tutorial?.passo === 2);
    } else {
      state.reputacao_no_plenario = clamp(state.reputacao_no_plenario - 2, 0, 100);
      state.governabilidade = clamp(state.governabilidade - 1, 0, 100);
      state.coalizao.forca = state.governabilidade;

      // Bloco G: derrota pode aumentar pressão e risco
      ensureIntegridade(state);
      state.integridade.risco = clamp(state.integridade.risco + 1, 0, 100);
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

    // Bloco G: sanção pode aumentar risco (pressão por contratos)
    ensureIntegridade(state);
    state.integridade.risco = clamp(state.integridade.risco + 1, 0, 100);

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

      ensureIntegridade(state);
      state.integridade.risco = clamp(state.integridade.risco + 2, 0, 100);
    } else {
      state.logs.push(mkLog(`Veto mantido. (chance ${Math.round(chanceDerrubar)}%, rolou ${Math.round(roll)}).`));
      state.governabilidade = clamp(state.governabilidade + 1, 0, 100);
      state.coalizao.forca = state.governabilidade;
      aplicarImpactoGrupos(state, { empresarios:+1, conservadores:+1, progressistas:-1 });

      ensureIntegridade(state);
      state.integridade.nivel = clamp(state.integridade.nivel + 1, 0, 100);
      state.integridade.risco = clamp(state.integridade.risco - 1, 0, 100);
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

    // Bloco G: arquivar sem debate pode irritar e aumentar risco de pressão
    ensureIntegridade(state);
    state.integridade.risco = clamp(state.integridade.risco + 1, 0, 100);

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
      pequeno: { custo: 80, gov: 4, rep: 1, risco: 1 },
      medio:   { custo: 180, gov: 9, rep: 2, risco: 2 },
      grande:  { custo: 320, gov: 16, rep: 3, risco: 3 }
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

    // Bloco G: negociação aumenta risco (trocas políticas)
    ensureIntegridade(state);
    const honest = clamp(state.personagem?.tracos?.honestidade ?? 50, 0, 100);
    const ajusteHonest = honest >= 70 ? -1 : 0; // honesto reduz risco um pouco
    state.integridade.risco = clamp(state.integridade.risco + t.risco + ajusteHonest, 0, 100);

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
      if (imp.recursos) state.recursos += num(imp.recursos, 0);
      if (imp.popularidade) aplicarImpactoGrupos(state, { geral: num(imp.popularidade, 0) });
      if (imp.grupos) aplicarImpactoGrupos(state, imp.grupos);
      if (imp.opinioes) aplicarImpactoGrupos(state, imp.opinioes);

      // Bloco G: eventos podem afetar integridade
      ensureIntegridade(state);
      if (typeof imp.integridadeNivel === "number") state.integridade.nivel = clamp(state.integridade.nivel + imp.integridadeNivel, 0, 100);
      if (typeof imp.integridadeRisco === "number") state.integridade.risco = clamp(state.integridade.risco + imp.integridadeRisco, 0, 100);

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
    ensureIntegridade(state);

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

    // Bloco G: campanha pesada aumenta risco (financiadores / pressão)
    const riscoCampanha = (tipo === "pesada") ? 3 : (tipo === "media" ? 2 : 1);
    const honest = clamp(state.personagem.tracos?.honestidade ?? 50, 0, 100);
    const ajusteHonest = honest >= 70 ? -1 : 0;
    state.integridade.risco = clamp(state.integridade.risco + riscoCampanha + ajusteHonest, 0, 100);

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
    ensureIntegridade(state);

    const cargoAlvoId = state.eleicao.cargoAlvoId;
    if (!cargoAlvoId){
      state.logs.push(mkLog("Escolha um cargo antes do resultado."));
      return state;
    }

    const honest = clamp(state.personagem.tracos?.honestidade ?? 50, 0, 100);
    const bonusHonest = Math.round((honest - 50) * 0.10);

    // Bloco G: risco alto reduz score eleitoral (escândalos/rumores)
    const penalRisco = Math.round(clamp((state.integridade.risco - 40) * 0.15, 0, 12));

    const random = Math.floor(Math.random() * 21) - 10;
    const score = state.opiniao.geral + (state.eleicao.boostCampanha || 0) + bonusHonest - penalRisco + random;
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

      state.leisPendentes = pickRandom(data.leis || [], 3);
    } else {
      const atual = getCargo(data, state.cargoId);
      state.mandatoMesesRestantes = 6;
      state.logs.push(mkLog(`Derrota eleitoral. Score=${score}. Você permanece como ${atual ? atual.nome : state.cargoId}.`));
      state.leisPendentes = pickRandom(data.leis || [], 3);
    }

    state.emEleicao = false;
    state.eleicao = null;
    return state;
  }

  // ========= BLOCO G: MÍDIA + INTEGRIDADE + INVESTIGAÇÃO =========

  function ensureMidia(state){
    if (!state.midia) state.midia = { manchetes: [], limite: 10 };
    if (!Array.isArray(state.midia.manchetes)) state.midia.manchetes = [];
    if (typeof state.midia.limite !== "number") state.midia.limite = 10;
  }

  function pushManchete(state, texto){
    ensureMidia(state);
    const t = String(texto || "").trim();
    if (!t) return;
    state.midia.manchetes.unshift({ t, ano: state.ano, mes: state.mes, turno: state.turno });
    while (state.midia.manchetes.length > state.midia.limite){
      state.midia.manchetes.pop();
    }
  }

  function ensureIntegridade(state){
    if (!state.integridade){
      state.integridade = {
        nivel: 50,   // 0..100 (quanto maior, mais íntegro)
        risco: 20,   // 0..100 (quanto maior, mais chance de investigação/escândalo)
        sobInvestigacao: false,
        nivelInvestigacao: 0, // 0..100
        ultimoCaso: null
      };
    }
    state.integridade.nivel = clamp(num(state.integridade.nivel, 50), 0, 100);
    state.integridade.risco = clamp(num(state.integridade.risco, 20), 0, 100);
    state.integridade.sobInvestigacao = !!state.integridade.sobInvestigacao;
    state.integridade.nivelInvestigacao = clamp(num(state.integridade.nivelInvestigacao, 0), 0, 100);
    if (state.integridade.ultimoCaso == null) state.integridade.ultimoCaso = null;
  }

  function gerarManchetesMensais(state, data, prevPop){
    ensureMidia(state);
    ensurePersonagem(state);
    ensureIntegridade(state);

    const cargo = getCargo(data, state.cargoId);
    const cargoNome = cargo ? cargo.nome : state.cargoId;
    const nome = state.personagem?.nome || "Político";

    const pop = clamp(state.opiniao?.geral ?? state.popularidade ?? 50, 0, 100);
    const delta = pop - prevPop;

    // Manchetes baseadas em variações
    if (delta >= 4){
      pushManchete(state, `Aprovação de ${nome} sobe (${pop}%). Bastidores destacam articulação no cargo de ${cargoNome}.`);
    } else if (delta <= -4){
      pushManchete(state, `Aprovação de ${nome} cai (${pop}%). Oposição critica decisões recentes no cargo de ${cargoNome}.`);
    } else {
      // manchete neutra às vezes
      if (Math.random() < 0.35){
        pushManchete(state, `${cargoNome}: mês de agenda intensa. ${nome} busca apoio e enfrenta pressões políticas.`);
      }
    }

    // Manchetes de integridade
    if (state.integridade.sobInvestigacao){
      pushManchete(state, `Investigação avança: denúncias atingem gabinete de ${nome}. (Nível ${state.integridade.nivelInvestigacao}%)`);
    } else {
      if (state.integridade.risco >= 70 && Math.random() < 0.45){
        pushManchete(state, `Rumores de irregularidades cercam ${nome}. Fontes falam em possível apuração.`);
      }
    }
  }

  function rolarInvestigacaoECoisasRuins(state, data){
    ensureIntegridade(state);
    ensurePersonagem(state);

    // Ajustes naturais por honestidade
    const honest = clamp(state.personagem.tracos?.honestidade ?? 50, 0, 100);
    const driftRisco = honest >= 70 ? -1 : (honest <= 35 ? +1 : 0);
    state.integridade.risco = clamp(state.integridade.risco + driftRisco, 0, 100);

    // Se já está sob investigação, ela avança
    if (state.integridade.sobInvestigacao){
      const avancar = Math.round(6 + Math.random()*8); // 6..14
      state.integridade.nivelInvestigacao = clamp(state.integridade.nivelInvestigacao + avancar, 0, 100);

      // efeitos mensais da investigação
      aplicarImpactoGrupos(state, { geral: -1 });
      state.governabilidade = clamp(state.governabilidade - 1, 0, 100);
      state.coalizao.forca = state.governabilidade;

      state.logs.push(mkLog(`Investigação em andamento (+${avancar}%). Pressão política aumenta.`));

      // desfecho quando chega a 100
      if (state.integridade.nivelInvestigacao >= 100){
        // sorte + honestidade define resultado
        const roll = Math.random()*100;
        const bonusHonest = Math.round((honest - 50) * 0.35); // -17..+17
        const score = roll + bonusHonest;

        if (score >= 60){
          // Arquivada
          state.integridade.sobInvestigacao = false;
          state.integridade.nivelInvestigacao = 0;
          state.integridade.risco = clamp(state.integridade.risco - 15, 0, 100);
          state.integridade.nivel = clamp(state.integridade.nivel + 3, 0, 100);
          state.logs.push(mkLog("Investigação arquivada por falta de provas. Você ganha fôlego político."));
          aplicarImpactoGrupos(state, { geral: +2, classe_media:+1 });
        } else {
          // Escândalo confirmado
          state.integridade.sobInvestigacao = false;
          state.integridade.nivelInvestigacao = 0;
          state.integridade.risco = clamp(state.integridade.risco + 10, 0, 100);
          state.integridade.nivel = clamp(state.integridade.nivel - 8, 0, 100);

          state.logs.push(mkLog("Escândalo confirmado! Crise de imagem e pressão por renúncia."));
          aplicarImpactoGrupos(state, { geral: -6, classe_media:-4, pobres:-2 });
          state.governabilidade = clamp(state.governabilidade - 6, 0, 100);
          state.coalizao.forca = state.governabilidade;

          // adiciona evento imediato se não houver outro
          if (!state.eventoAtual){
            state.eventoAtual = criarEventoEscandalo();
            state.logs.push(mkLog(`Evento: ${state.eventoAtual.nome}`));
          }
        }
      }
      return;
    }

    // Se não está sob investigação, pode iniciar baseado em risco
    const risco = clamp(state.integridade.risco, 0, 100);
    // chance cresce muito após 60
    const chance = clamp((risco - 40) * 0.55, 0, 35); // até ~35%
    const roll = Math.random()*100;

    if (roll < chance){
      state.integridade.sobInvestigacao = true;
      state.integridade.nivelInvestigacao = clamp(10 + Math.floor(Math.random()*15), 0, 100);
      state.integridade.ultimoCaso = `inquerito_${Date.now()}`;

      state.logs.push(mkLog("Uma investigação foi aberta contra você (inquérito/MP/TC)."));
      aplicarImpactoGrupos(state, { geral: -2, classe_media:-1 });
      state.governabilidade = clamp(state.governabilidade - 2, 0, 100);
      state.coalizao.forca = state.governabilidade;
    }
  }

  function criarEventoEscandalo(){
    return {
      id: "escandalo_publico",
      nome: "Escândalo Público",
      descricao: "Denúncias ganharam força. Você precisa decidir como reagir.",
      cadeiaId: "escandalo",
      opcoes: [
        {
          id: "nega_total",
          texto: "Negar tudo e atacar os acusadores",
          impactos: {
            popularidade: -2,
            opinioes: { conservadores:+1, progressistas:-2, classe_media:-2 },
            integridadeRisco: +2
          }
        },
        {
          id: "transparencia",
          texto: "Abrir dados e cooperar com as investigações",
          impactos: {
            popularidade: +1,
            opinioes: { classe_media:+2, progressistas:+1, conservadores:-1 },
            integridadeNivel: +3,
            integridadeRisco: -4
          }
        },
        {
          id: "bode_expiatorio",
          texto: "Demitir assessor e dizer que não sabia",
          impactos: {
            popularidade: 0,
            opinioes: { classe_media:+1, pobres:0, empresarios:+1 },
            integridadeRisco: +1
          }
        }
      ]
    };
  }

  // ========= ELEIÇÕES / EXECUTIVO AUX =========

  function maybeGerarLeiParaSancao(state, data){
    if (!isExecutivo(state.cargoId)) return;

    const forca = clamp(state.coalizao?.forca ?? state.governabilidade, 0, 100);
    const chance = clamp(35 + (forca * 0.25), 35, 60);
    if (Math.random()*100 < chance){
      const lei = pickOne(data.leis || []);
      if (lei){
        enviarLeiParaSancao(state, lei);
        state.logs.push(mkLog(`Lei aprovada no Legislativo e enviada para sanção: ${lei.titulo}.`));
      }
    }
  }

  // ========= LOOP PRINCIPAL =========

  function nextTurn(state, data){
    if (state.emEleicao){
      state.logs.push(mkLog("Período eleitoral ativo. Resolva a eleição para continuar."));
      return state;
    }

    ensureOpiniao(state);
    ensurePersonagem(state);
    ensureTutorial(state);
    ensureAcoesDoMes(state);
    ensureMidia(state);
    ensureIntegridade(state);

    const prevPop = clamp(state.opiniao?.geral ?? state.popularidade ?? 50, 0, 100);

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

    // Bloco G: rolar risco/investigação todo mês (antes dos eventos)
    rolarInvestigacaoECoisasRuins(state, data);

    if (isExecutivo(state.cargoId)){
      aplicarOrcamentoMensal(state);
      maybeGerarLeiParaSancao(state, data);

      if (!state.eventoAtual && Math.random() < 0.55){
        const ev = pickOne(data.eventos || []);
        if (ev){
          state.eventoAtual = ev;
          state.logs.push(mkLog(`Evento: ${ev.nome}`));
        }
      }
    } else {
      if (!state.eventoAtual && Math.random() < 0.35){
        const ev = pickOne(data.eventos || []);
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

    // Bloco G: gerar manchetes do mês
    gerarManchetesMensais(state, data, prevPop);

    if (state.mandatoMesesRestantes === 0){
      startElection(state, data);
      return state;
    }

    if (!Array.isArray(state.leisPendentes)) state.leisPendentes = [];
    if (state.leisPendentes.length === 0){
      state.leisPendentes = pickRandom(data.leis || [], 3);
      state.logs.push(mkLog("Novos projetos chegaram à pauta."));
    }

    return state;
  }

  // ========= NEW GAME =========

  function newGameFromData(data){
    const base = window.SIM_POL.save.getDefaultState();

    base.casaAtualId = getCasaPorCargo(base.cargoId);
    base.leisPendentes = pickRandom(data.leis || [], 3);

    base.logs.push(mkLog("Novo jogo iniciado."));
    base.logs.push(mkLog("Bloco F: personagem + partido + ideologia + tutorial + ações do mês."));
    base.logs.push(mkLog("Bloco G: mídia/manchetes + integridade + risco de investigação + bancadas."));

    ensureOpiniao(base);
    ensurePersonagem(base);
    ensureTutorial(base);
    ensureAcoesDoMes(base);
    ensureMidia(base);
    ensureIntegridade(base);

    // tutorial passo 1/5 aparece
    const msg = tutorialText(base);
    if (msg) base.logs.push(mkLog(`Tutorial: ${msg}`));

    // manchete inicial
    pushManchete(base, "Começa uma nova carreira política: bastidores observam sua atuação.");

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