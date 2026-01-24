// src/core/patch.js
// Patch NÃO-DESTRUTIVO para evitar travamentos (principalmente no botão "Avançar Mês").
//
// Problema corrigido: alguns saves/versões antigas não traziam campos críticos
// (ex.: state.coalizao). O sim.js usa state.coalizao.forca em vários pontos.
// Quando o campo vinha undefined, o clique em "Avançar Mês" gerava exceção e o
// jogo aparentava não avançar.

(function () {
  const g = window;
  g.SIM_POL = g.SIM_POL || {};
  const SP = g.SIM_POL;

  function clamp(n, a, b){
    n = Number(n);
    if (!Number.isFinite(n)) n = a;
    return Math.max(a, Math.min(b, n));
  }

  function num(v, d=0){
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }

  function normalizeState(input){
    const s = (input && typeof input === "object") ? input : {};

    // ----- tempo -----
    s.ano = Number.isFinite(s.ano) ? s.ano : 2025;
    // versões antigas: mesIndex (0..11)
    if (Number.isFinite(s.mesIndex) && !Number.isFinite(s.mes)){
      s.mes = clamp(s.mesIndex + 1, 1, 12);
    }
    s.mes = Number.isFinite(s.mes) ? clamp(s.mes, 1, 12) : 1;
    s.turno = Number.isFinite(s.turno) ? s.turno : 1;

    // ----- carreira / status raiz -----
    s.cargoId = (typeof s.cargoId === "string" && s.cargoId) ? s.cargoId : (s.personagem && s.personagem.cargoId) || "vereador";
    s.recursos = Number.isFinite(s.recursos) ? s.recursos : 200;
    s.popularidade = Number.isFinite(s.popularidade) ? s.popularidade : 50;
    s.governabilidade = Number.isFinite(s.governabilidade) ? s.governabilidade : 50;
    s.reputacao_no_plenario = Number.isFinite(s.reputacao_no_plenario) ? s.reputacao_no_plenario : 50;
    s.mandatoMesesRestantes = Number.isFinite(s.mandatoMesesRestantes) ? s.mandatoMesesRestantes : 48;

    // ----- coalizão (CRÍTICO) -----
    if (!s.coalizao || typeof s.coalizao !== "object"){
      s.coalizao = { forca: clamp(s.governabilidade, 0, 100), aliancas: [] };
    }
    if (!Number.isFinite(s.coalizao.forca)) s.coalizao.forca = clamp(s.governabilidade, 0, 100);
    if (!Array.isArray(s.coalizao.aliancas)) s.coalizao.aliancas = [];

    // ----- personagem -----
    if (!s.personagem || typeof s.personagem !== "object") s.personagem = {};
    if (typeof s.personagem.nome !== "string" || !s.personagem.nome.trim()) s.personagem.nome = "Novo Político";
    // compat: algumas versões usam partidoId; outras partido
    if (typeof s.personagem.partidoId !== "string" || !s.personagem.partidoId){
      s.personagem.partidoId = (typeof s.personagem.partido === "string" && s.personagem.partido) ? s.personagem.partido : "centro";
    }
    s.personagem.ideologia = num(s.personagem.ideologia, 0);
    if (!s.personagem.tracos || typeof s.personagem.tracos !== "object"){
      s.personagem.tracos = { honestidade:50, carisma:50, competencia:50 };
    }

    // ----- opinião por grupos -----
    if (!s.opiniao || typeof s.opiniao !== "object") s.opiniao = {};
    const opinKeys = ["geral","pobres","classe_media","ricos","empresarios","servidores","religiosos","progressistas","conservadores"];
    for (const k of opinKeys){
      if (!Number.isFinite(s.opiniao[k])) s.opiniao[k] = 50;
      s.opiniao[k] = clamp(s.opiniao[k], 0, 100);
    }

    // ----- integridade / mídia -----
    if (!s.integridade || typeof s.integridade !== "object"){
      s.integridade = { nivel:50, risco:20, sobInvestigacao:false, nivelInvestigacao:0, ultimoCaso:null };
    }
    s.integridade.nivel = clamp(s.integridade.nivel, 0, 100);
    s.integridade.risco = clamp(s.integridade.risco, 0, 100);
    s.integridade.sobInvestigacao = !!s.integridade.sobInvestigacao;
    s.integridade.nivelInvestigacao = clamp(s.integridade.nivelInvestigacao, 0, 100);

    if (!s.midia || typeof s.midia !== "object") s.midia = { manchetes: [], limite: 10 };
    if (!Array.isArray(s.midia.manchetes)) s.midia.manchetes = [];
    if (!Number.isFinite(s.midia.limite)) s.midia.limite = 10;

    // ----- coleções -----
    if (!Array.isArray(s.logs)) s.logs = [];
    if (!Array.isArray(s.diario)) s.diario = [];
    if (!Array.isArray(s.leisPendentes)) s.leisPendentes = [];
    if (!Array.isArray(s.leisParaSancao)) s.leisParaSancao = [];

    return s;
  }

  // Expor para depuração
  SP._normalizeState = normalizeState;

  // ===== Patch: SAVE =====
  if (SP.save && typeof SP.save === "object"){
    if (typeof SP.save.load === "function" && !SP.save._loadPatched){
      const origLoad = SP.save.load.bind(SP.save);
      SP.save.load = function(...args){
        const st = origLoad(...args);
        return normalizeState(st);
      };
      SP.save._loadPatched = true;
    }

    if (typeof SP.save.getDefaultState === "function" && !SP.save._defaultPatched){
      const origDef = SP.save.getDefaultState.bind(SP.save);
      SP.save.getDefaultState = function(...args){
        const st = origDef(...args);
        return normalizeState(st);
      };
      SP.save._defaultPatched = true;
    }
  }

  // ===== Patch: SIM (nextTurn) =====
  function patchSimFunction(name){
    if (!SP.sim || typeof SP.sim !== "object") return;
    const fn = SP.sim[name];
    if (typeof fn !== "function" || fn._patchedByStateFix) return;

    const wrapped = function(...args){
      try {
        if (args && args.length > 0) args[0] = normalizeState(args[0]);
        const out = fn.apply(this, args);
        return normalizeState(out || args[0]);
      } catch (e){
        try { console.error(`[SIM_POL PATCH] erro em ${name}:`, e); } catch {}
        // nunca retorna null pra não quebrar UI
        return normalizeState(args && args[0]);
      }
    };

    wrapped._patchedByStateFix = true;
    SP.sim[name] = wrapped;
  }

  patchSimFunction("nextTurn");
})();
