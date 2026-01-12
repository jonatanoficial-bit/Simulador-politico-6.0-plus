// src/core/patch.js
// Patch NÃO-DESTRUTIVO para evitar travar no "Avançar Mês" quando o state vem incompleto.
// Objetivo: normalizar o estado e impedir erros tipo:
// - Cannot set properties of undefined (setting 'forca')
// - Cannot read properties of null (reading 'cargoId')

(function () {
  const g = window;
  g.SIM_POL = g.SIM_POL || {};
  const SP = g.SIM_POL;

  function clamp(n, a, b) {
    n = Number.isFinite(n) ? n : a;
    return Math.max(a, Math.min(b, n));
  }

  function nowISO() {
    try { return new Date().toISOString(); } catch { return "" + Date.now(); }
  }

  const GROUPS = [
    "Geral",
    "Pobres",
    "Classe média",
    "Ricos",
    "Empresários",
    "Servidores",
    "Religiosos",
    "Progressistas",
    "Conservadores",
  ];

  function normalizeState(state) {
    const s = state && typeof state === "object" ? state : {};

    // ===== Identidade / tempo =====
    s.ano = Number.isFinite(s.ano) ? s.ano : 2025;
    s.mesIndex = Number.isFinite(s.mesIndex) ? s.mesIndex : 0;
    s.turno = Number.isFinite(s.turno) ? s.turno : 1;

    // ===== Personagem =====
    s.personagem = s.personagem && typeof s.personagem === "object" ? s.personagem : {};
    s.personagem.nome = (s.personagem.nome || "Novo Político") + "";
    s.personagem.partido = (s.personagem.partido || "centro") + "";
    s.personagem.ideologia = (s.personagem.ideologia || "centro") + "";
    s.personagem.cargoId = (s.personagem.cargoId || s.cargoId || "vereador") + "";

    // Atributos principais (para não dar undefined em UI/sim)
    s.personagem.popularidade = clamp(s.personagem.popularidade ?? s.popularidade ?? 50, 0, 100);
    s.personagem.governabilidade = clamp(s.personagem.governabilidade ?? s.governabilidade ?? 50, 0, 100);
    s.personagem.reputacao = clamp(s.personagem.reputacao ?? s.reputacao ?? 50, 0, 100);
    s.personagem.integridade = clamp(s.personagem.integridade ?? s.integridade ?? 50, 0, 100);
    s.personagem.risco = clamp(s.personagem.risco ?? s.risco ?? 20, 0, 100);
    s.personagem.recursos = Number.isFinite(s.personagem.recursos ?? s.recursos) ? (s.personagem.recursos ?? s.recursos) : 200;

    // Mandato
    s.mandatoMesesRestantes = Number.isFinite(s.mandatoMesesRestantes) ? s.mandatoMesesRestantes : 48;

    // ===== Opinião por grupos =====
    // Alguns códigos antigos usam s.opinioes.grupos[grupo].forca
    s.opinioes = s.opinioes && typeof s.opinioes === "object" ? s.opinioes : {};
    s.opinioes.grupos = s.opinioes.grupos && typeof s.opinioes.grupos === "object" ? s.opinioes.grupos : {};

    for (const nome of GROUPS) {
      const k = nome;
      const obj = s.opinioes.grupos[k] && typeof s.opinioes.grupos[k] === "object" ? s.opinioes.grupos[k] : {};
      // Campos comuns encontrados em versões diferentes
      obj.valor = clamp(obj.valor ?? obj.apoio ?? 50, 0, 100);
      obj.forca = clamp(obj.forca ?? obj.peso ?? 50, 0, 100);
      s.opinioes.grupos[k] = obj;
    }

    // ===== Coleções =====
    s.diario = Array.isArray(s.diario) ? s.diario : [];
    s.midia = Array.isArray(s.midia) ? s.midia : [];
    s.eventos = Array.isArray(s.eventos) ? s.eventos : [];
    s.legislativo = s.legislativo && typeof s.legislativo === "object" ? s.legislativo : {};
    s.legislativo.projetos = Array.isArray(s.legislativo.projetos) ? s.legislativo.projetos : [];

    // ===== Flags =====
    s._normalizedAt = nowISO();
    return s;
  }

  // Expor normalizador para depuração futura (não mostra nada na tela)
  SP._normalizeState = normalizeState;

  // ===== Patch: SAVE =====
  // Se seu save.js existir, envolvemos load para sempre normalizar.
  if (SP.save && typeof SP.save === "object") {
    // Garanta getDefaultState (algumas versões antigas não tinham)
    if (typeof SP.save.getDefaultState !== "function") {
      SP.save.getDefaultState = function () {
        return normalizeState({});
      };
    }

    // Wrap load
    if (typeof SP.save.load === "function" && !SP.save._loadPatched) {
      const originalLoad = SP.save.load.bind(SP.save);
      SP.save.load = function (...args) {
        const st = originalLoad(...args);
        return normalizeState(st);
      };
      SP.save._loadPatched = true;
    }

    // Wrap loadFromSlot (se existir)
    if (typeof SP.save.loadFromSlot === "function" && !SP.save._loadFromSlotPatched) {
      const originalLoadSlot = SP.save.loadFromSlot.bind(SP.save);
      SP.save.loadFromSlot = function (...args) {
        const st = originalLoadSlot(...args);
        return normalizeState(st);
      };
      SP.save._loadFromSlotPatched = true;
    }
  }

  // ===== Patch: SIM =====
  // Vamos envolver "avançar mês" com normalização antes/depois.
  // Tenta várias assinaturas (para compatibilidade com versões).
  function patchAdvance(fnName) {
    if (!SP.sim || typeof SP.sim !== "object") return false;
    const fn = SP.sim[fnName];
    if (typeof fn !== "function") return false;
    if (fn._patchedByAAA) return true;

    const wrapped = function (...args) {
      try {
        // Normaliza o state atual se existir getter conhecido
        if (typeof SP.sim.getState === "function") {
          const st = normalizeState(SP.sim.getState());
          if (typeof SP.sim.setState === "function") SP.sim.setState(st);
          else SP.sim.state = st;
        } else if (SP.sim.state) {
          SP.sim.state = normalizeState(SP.sim.state);
        }

        const out = fn.apply(this, args);

        // Normaliza novamente após executar (para garantir consistência)
        if (typeof SP.sim.getState === "function") {
          const st2 = normalizeState(SP.sim.getState());
          if (typeof SP.sim.setState === "function") SP.sim.setState(st2);
          else SP.sim.state = st2;
        } else if (SP.sim.state) {
          SP.sim.state = normalizeState(SP.sim.state);
        }

        return out;
      } catch (e) {
        // Em vez de travar, tenta recuperar
        try {
          if (SP.sim.state) SP.sim.state = normalizeState(SP.sim.state);
        } catch {}
        // Rejoga o erro no console apenas (não estraga UI)
        try { console.error("[SIM_POL PATCH] erro em", fnName, e); } catch {}
        return null;
      }
    };

    wrapped._patchedByAAA = true;
    SP.sim[fnName] = wrapped;
    return true;
  }

  // Tenta os nomes mais prováveis
  const candidates = ["advanceMonth", "avancarMes", "nextMonth", "passarMes"];
  for (const c of candidates) patchAdvance(c);

  // ===== Patch: criação de jogo =====
  // Normaliza também quando criar jogo, se existir
  if (SP.sim && typeof SP.sim.newGame === "function" && !SP.sim._newGamePatched) {
    const orig = SP.sim.newGame.bind(SP.sim);
    SP.sim.newGame = function (...args) {
      const res = orig(...args);
      try {
        if (SP.sim.state) SP.sim.state = normalizeState(SP.sim.state);
      } catch {}
      return res;
    };
    SP.sim._newGamePatched = true;
  }

})();