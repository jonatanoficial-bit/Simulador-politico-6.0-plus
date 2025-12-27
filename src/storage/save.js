(function initSave(){
  window.SIM_POL = window.SIM_POL || {};
  const KEY = "SIM_POL_SAVE";
  const SAVE_VERSION = 7;

  function getDefaultState(){
    return {
      version: SAVE_VERSION,

      // Personagem (novo)
      personagem: {
        nome: "Novo Político",
        partidoId: "centro",
        ideologia: 0, // -100..+100
        tracos: { honestidade: 50, carisma: 50, competencia: 50 }
      },

      // Tutorial (novo)
      tutorial: {
        ativo: true,
        passo: 0,
        concluido: false
      },

      // Ações do mês (novo)
      acoesDoMes: {
        limite: 2,
        usadas: 0
      },

      // Tempo
      ano: 1,
      mes: 1,
      turno: 1,

      // Carreira
      cargoId: "vereador",
      mandatoMesesRestantes: 6,
      emEleicao: false,
      eleicao: null,

      // Opinião por grupos
      opiniao: {
        geral: 50,
        pobres: 50,
        classe_media: 50,
        ricos: 50,
        empresarios: 50,
        servidores: 50,
        religiosos: 50,
        progressistas: 50,
        conservadores: 50
      },

      popularidade: 50,
      recursos: 500,

      governabilidade: 45,
      reputacao_no_plenario: 40,
      casaAtualId: "camara_municipal",
      coalizao: { ativa: [], forca: 45 },

      orcamento: {
        receitaMensal: 400,
        categorias: {
          saude: 90,
          educacao: 90,
          seguranca: 70,
          infraestrutura: 80,
          assistencia: 70,
          administracao: 40
        }
      },

      gabinete: { economia: null, saude: null, educacao: null, seguranca: null },
      efeitosGabinete: { ajusteReceita: 0, ajustePopularidadeMensal: 0 },

      leisPendentes: [],
      leisParaSancao: [],
      eventoAtual: null,
      cadeiaEventos: null,

      logs: []
    };
  }

  function migrate(old){
    const base = getDefaultState();
    if (!old || typeof old !== "object") return base;

    const merged = { ...base, ...old, version: SAVE_VERSION };

    if (!merged.personagem || typeof merged.personagem !== "object") merged.personagem = base.personagem;
    if (!merged.personagem.nome) merged.personagem.nome = base.personagem.nome;
    if (!merged.personagem.partidoId) merged.personagem.partidoId = base.personagem.partidoId;
    if (typeof merged.personagem.ideologia !== "number") merged.personagem.ideologia = base.personagem.ideologia;
    if (!merged.personagem.tracos || typeof merged.personagem.tracos !== "object") merged.personagem.tracos = base.personagem.tracos;

    for (const k of Object.keys(base.personagem.tracos)){
      if (typeof merged.personagem.tracos[k] !== "number") merged.personagem.tracos[k] = base.personagem.tracos[k];
    }

    if (!merged.tutorial || typeof merged.tutorial !== "object") merged.tutorial = base.tutorial;
    if (typeof merged.tutorial.ativo !== "boolean") merged.tutorial.ativo = true;
    if (typeof merged.tutorial.passo !== "number") merged.tutorial.passo = 0;
    if (typeof merged.tutorial.concluido !== "boolean") merged.tutorial.concluido = false;

    if (!merged.acoesDoMes || typeof merged.acoesDoMes !== "object") merged.acoesDoMes = base.acoesDoMes;
    if (typeof merged.acoesDoMes.limite !== "number") merged.acoesDoMes.limite = base.acoesDoMes.limite;
    if (typeof merged.acoesDoMes.usadas !== "number") merged.acoesDoMes.usadas = 0;

    if (!Array.isArray(merged.leisPendentes)) merged.leisPendentes = [];
    if (!Array.isArray(merged.leisParaSancao)) merged.leisParaSancao = [];
    if (!Array.isArray(merged.logs)) merged.logs = [];
    if (!("eventoAtual" in merged)) merged.eventoAtual = null;
    if (!("cadeiaEventos" in merged)) merged.cadeiaEventos = null;

    if (typeof merged.turno !== "number" || merged.turno < 1) merged.turno = 1;
    if (typeof merged.ano !== "number" || merged.ano < 1) merged.ano = 1;
    if (typeof merged.mes !== "number" || merged.mes < 1 || merged.mes > 12) merged.mes = 1;

    if (typeof merged.recursos !== "number") merged.recursos = 500;

    if (!merged.cargoId) merged.cargoId = "vereador";
    if (typeof merged.mandatoMesesRestantes !== "number") merged.mandatoMesesRestantes = 6;

    if (typeof merged.emEleicao !== "boolean") merged.emEleicao = false;
    if (!("eleicao" in merged)) merged.eleicao = null;

    if (typeof merged.governabilidade !== "number") merged.governabilidade = 45;
    if (typeof merged.reputacao_no_plenario !== "number") merged.reputacao_no_plenario = 40;
    if (!merged.casaAtualId) merged.casaAtualId = "camara_municipal";

    if (!merged.coalizao || typeof merged.coalizao !== "object") merged.coalizao = base.coalizao;
    if (!Array.isArray(merged.coalizao.ativa)) merged.coalizao.ativa = [];
    if (typeof merged.coalizao.forca !== "number") merged.coalizao.forca = merged.governabilidade;

    if (!merged.orcamento || typeof merged.orcamento !== "object") merged.orcamento = base.orcamento;
    if (typeof merged.orcamento.receitaMensal !== "number") merged.orcamento.receitaMensal = base.orcamento.receitaMensal;
    if (!merged.orcamento.categorias || typeof merged.orcamento.categorias !== "object") merged.orcamento.categorias = base.orcamento.categorias;

    if (!merged.gabinete || typeof merged.gabinete !== "object") merged.gabinete = base.gabinete;
    if (!merged.efeitosGabinete || typeof merged.efeitosGabinete !== "object") merged.efeitosGabinete = base.efeitosGabinete;

    if (!merged.opiniao || typeof merged.opiniao !== "object") merged.opiniao = base.opiniao;
    for (const k of Object.keys(base.opiniao)){
      if (typeof merged.opiniao[k] !== "number") merged.opiniao[k] = base.opiniao[k];
    }
    if (typeof merged.popularidade === "number") merged.opiniao.geral = merged.popularidade;
    merged.popularidade = merged.opiniao.geral;

    return merged;
  }

  function save(state){
    try{
      const payload = JSON.stringify({ ...state, version: SAVE_VERSION });
      localStorage.setItem(KEY, payload);
      return true;
    }catch(e){
      console.warn("Falha ao salvar:", e);
      return false;
    }
  }

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (parsed.version !== SAVE_VERSION) return migrate(parsed);
      return parsed;
    }catch(e){
      console.warn("Falha ao carregar:", e);
      return null;
    }
  }

  function clear(){ localStorage.removeItem(KEY); }

  window.SIM_POL.save = { save, load, clear, migrate, getDefaultState, SAVE_VERSION };
})();