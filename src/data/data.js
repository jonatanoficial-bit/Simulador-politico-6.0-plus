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