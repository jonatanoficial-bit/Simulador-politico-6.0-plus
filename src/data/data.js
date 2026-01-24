/* src/data/data.js — ARQUIVO COMPLETO
   Base de dados do jogo (core).
   Sem este arquivo, o jogo NÃO inicia.
*/

(function(){
  window.SIM_POL = window.SIM_POL || {};

  window.SIM_POL.data = {
    // =========================
    // PARTIDOS
    // =========================
    partidos: [
      { id: "centro", nome: "Centro", ideologia: 0 },
      { id: "esquerda", nome: "Esquerda", ideologia: -60 },
      { id: "direita", nome: "Direita", ideologia: 60 }
    ],

    // =========================
    // CARGOS
    // =========================
    cargos: [
      { id: "vereador", nome: "Vereador", tipo: "legislativo", mandatoMeses: 48 },
      { id: "deputado", nome: "Deputado", tipo: "legislativo", mandatoMeses: 48 },
      { id: "senador", nome: "Senador", tipo: "legislativo", mandatoMeses: 96 },
      { id: "prefeito", nome: "Prefeito", tipo: "executivo", mandatoMeses: 48 },
      { id: "governador", nome: "Governador", tipo: "executivo", mandatoMeses: 48 },
      { id: "presidente", nome: "Presidente", tipo: "executivo", mandatoMeses: 48 }
    ],

    // =========================
    // PROGRESSÃO DE CARREIRA
    // =========================
    carreira: [
      { de: "vereador", para: ["deputado", "prefeito"] },
      { de: "deputado", para: ["senador", "governador"] },
      { de: "senador", para: ["governador", "presidente"] },
      { de: "prefeito", para: ["governador"] },
      { de: "governador", para: ["presidente"] }
    ],

    // =========================
    // REGRAS DO LEGISLATIVO + NPCs (mínimo para votação funcionar)
    // =========================
    // IMPORTANTE: o core do simulador espera data.regras_legislativo.casas
    // e uma lista de NPCs com "casaId" para calcular votos.
    // Sem isso, botões como "Levar à votação" e "Arquivar" parecem não fazer nada.
    regras_legislativo: {
      casas: {
        camara_municipal: { nome: "Câmara Municipal", quorumMin: 6 },
        camara_federal:   { nome: "Câmara Federal", quorumMin: 12 },
        senado:           { nome: "Senado", quorumMin: 10 }
      }
    },

    // NPCs simples (pode expandir depois). Cada NPC vota com base em ideologia,
    // lealdade, disciplina partidária e força da coalizão.
    npcs: [
      // Câmara Municipal (11)
      { id:"cm_01", nome:"Vereador A", casaId:"camara_municipal", partidoId:"centro",   ideologia:  5, lealdade:55 },
      { id:"cm_02", nome:"Vereador B", casaId:"camara_municipal", partidoId:"centro",   ideologia: -5, lealdade:50 },
      { id:"cm_03", nome:"Vereador C", casaId:"camara_municipal", partidoId:"direita",  ideologia: 60, lealdade:52 },
      { id:"cm_04", nome:"Vereador D", casaId:"camara_municipal", partidoId:"direita",  ideologia: 45, lealdade:48 },
      { id:"cm_05", nome:"Vereador E", casaId:"camara_municipal", partidoId:"esquerda", ideologia:-55, lealdade:50 },
      { id:"cm_06", nome:"Vereador F", casaId:"camara_municipal", partidoId:"esquerda", ideologia:-35, lealdade:46 },
      { id:"cm_07", nome:"Vereador G", casaId:"camara_municipal", partidoId:"centro",   ideologia: 10, lealdade:45 },
      { id:"cm_08", nome:"Vereador H", casaId:"camara_municipal", partidoId:"centro",   ideologia:  0, lealdade:40 },
      { id:"cm_09", nome:"Vereador I", casaId:"camara_municipal", partidoId:"direita",  ideologia: 70, lealdade:44 },
      { id:"cm_10", nome:"Vereador J", casaId:"camara_municipal", partidoId:"esquerda", ideologia:-70, lealdade:43 },
      { id:"cm_11", nome:"Vereador K", casaId:"camara_municipal", partidoId:"centro",   ideologia: 20, lealdade:42 },

      // Câmara Federal (15)
      { id:"cf_01", nome:"Deputado A", casaId:"camara_federal", partidoId:"centro",   ideologia:  0, lealdade:52 },
      { id:"cf_02", nome:"Deputado B", casaId:"camara_federal", partidoId:"centro",   ideologia: 10, lealdade:50 },
      { id:"cf_03", nome:"Deputado C", casaId:"camara_federal", partidoId:"direita",  ideologia: 55, lealdade:49 },
      { id:"cf_04", nome:"Deputado D", casaId:"camara_federal", partidoId:"direita",  ideologia: 65, lealdade:47 },
      { id:"cf_05", nome:"Deputado E", casaId:"camara_federal", partidoId:"esquerda", ideologia:-55, lealdade:48 },
      { id:"cf_06", nome:"Deputado F", casaId:"camara_federal", partidoId:"esquerda", ideologia:-65, lealdade:46 },
      { id:"cf_07", nome:"Deputado G", casaId:"camara_federal", partidoId:"centro",   ideologia:  5, lealdade:44 },
      { id:"cf_08", nome:"Deputado H", casaId:"camara_federal", partidoId:"centro",   ideologia: -5, lealdade:43 },
      { id:"cf_09", nome:"Deputado I", casaId:"camara_federal", partidoId:"direita",  ideologia: 40, lealdade:42 },
      { id:"cf_10", nome:"Deputado J", casaId:"camara_federal", partidoId:"direita",  ideologia: 75, lealdade:41 },
      { id:"cf_11", nome:"Deputado K", casaId:"camara_federal", partidoId:"esquerda", ideologia:-40, lealdade:40 },
      { id:"cf_12", nome:"Deputado L", casaId:"camara_federal", partidoId:"esquerda", ideologia:-75, lealdade:39 },
      { id:"cf_13", nome:"Deputado M", casaId:"camara_federal", partidoId:"centro",   ideologia: 15, lealdade:38 },
      { id:"cf_14", nome:"Deputado N", casaId:"camara_federal", partidoId:"centro",   ideologia:-15, lealdade:37 },
      { id:"cf_15", nome:"Deputado O", casaId:"camara_federal", partidoId:"centro",   ideologia: 25, lealdade:36 },

      // Senado (12)
      { id:"sn_01", nome:"Senador A", casaId:"senado", partidoId:"centro",   ideologia:  0, lealdade:54 },
      { id:"sn_02", nome:"Senador B", casaId:"senado", partidoId:"centro",   ideologia: 10, lealdade:52 },
      { id:"sn_03", nome:"Senador C", casaId:"senado", partidoId:"direita",  ideologia: 60, lealdade:50 },
      { id:"sn_04", nome:"Senador D", casaId:"senado", partidoId:"direita",  ideologia: 40, lealdade:48 },
      { id:"sn_05", nome:"Senador E", casaId:"senado", partidoId:"esquerda", ideologia:-55, lealdade:49 },
      { id:"sn_06", nome:"Senador F", casaId:"senado", partidoId:"esquerda", ideologia:-35, lealdade:47 },
      { id:"sn_07", nome:"Senador G", casaId:"senado", partidoId:"centro",   ideologia:  5, lealdade:46 },
      { id:"sn_08", nome:"Senador H", casaId:"senado", partidoId:"centro",   ideologia: -5, lealdade:44 },
      { id:"sn_09", nome:"Senador I", casaId:"senado", partidoId:"direita",  ideologia: 75, lealdade:42 },
      { id:"sn_10", nome:"Senador J", casaId:"senado", partidoId:"esquerda", ideologia:-70, lealdade:43 },
      { id:"sn_11", nome:"Senador K", casaId:"senado", partidoId:"centro",   ideologia: 20, lealdade:41 },
      { id:"sn_12", nome:"Senador L", casaId:"senado", partidoId:"centro",   ideologia:-20, lealdade:40 }
    ],

    // =========================
    // AÇÕES DO MÊS
    // =========================
    acoes: [
      {
        id: "visitar_bairro",
        nome: "Visitar bairros",
        custo: 20,
        impactos: {
          popularidade: +1,
          opinioes: { pobres:+1, classe_media:+1 }
        }
      },
      {
        id: "reuniao_partido",
        nome: "Reunião partidária",
        custo: 15,
        impactos: {
          governabilidade: +1,
          reputacao: +1
        }
      },
      {
        id: "articulacao_politica",
        nome: "Articulação política",
        custo: 40,
        impactos: {
          governabilidade: +3,
          risco: +2
        }
      }
    ],

    // =========================
    // LEIS (BASE)
    // =========================
    leis: [
      {
        id: "lei_transparencia",
        titulo: "Lei de Transparência",
        descricao: "Amplia a transparência dos gastos públicos.",
        impactos: {
          popularidade: +1,
          integridade: +2,
          risco: -1
        }
      },
      {
        id: "lei_infraestrutura",
        titulo: "Lei de Infraestrutura",
        descricao: "Investimentos em obras públicas.",
        impactos: {
          recursos: -50,
          popularidade: +2
        }
      }
    ],

    // =========================
    // EVENTOS ALEATÓRIOS
    // =========================
    eventos: [
      {
        id: "escandalo_midia",
        nome: "Escândalo na mídia",
        descricao: "A imprensa divulga uma denúncia envolvendo aliados.",
        opcoes: [
          {
            id: "negar",
            texto: "Negar as acusações",
            efeitos: { popularidade: -2, risco: +2 }
          },
          {
            id: "investigar",
            texto: "Abrir investigação",
            efeitos: { integridade: +2, popularidade: +1 }
          }
        ]
      }
    ],

    // =========================
    // ORÇAMENTO (EXECUTIVO)
    // =========================
    orcamento: {
      perfis: [
        { id: "social", nome: "Social" },
        { id: "austero", nome: "Austero" },
        { id: "desenvolvimentista", nome: "Desenvolvimentista" }
      ]
    },

    // =========================
    // POLÍTICAS PÚBLICAS
    // =========================
    politicas: [
      {
        id: "politica_saude",
        nome: "Programa de Saúde",
        descricao: "Amplia investimentos na saúde.",
        custo: 40,
        impactos: {
          popularidade: +2
        }
      }
    ],

    // =========================
    // TÉCNICOS / MINISTROS
    // =========================
    tecnicos: [
      {
        id: "tecnico_economia",
        nome: "Economista Técnico",
        custoNomeacao: 30,
        efeitosMensais: {
          recursos: +5
        }
      }
    ]
  };
})();