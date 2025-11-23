// --- Função de estado e inicialização ---
// Estado global do jogo
const state = {
  party: null,
  name: '',
  officeIndex: 0,
  popularity: 50,
  funds: 50,
  integrity: 50
};

// Definição dos cargos públicos com tipo e imagem de fundo
const offices = [
  { name: 'Vereador', type: 'legislative', bg: 'assets/municipal.png' },
  { name: 'Deputado Estadual', type: 'legislative', bg: 'assets/assembly.png' },
  { name: 'Deputado Federal', type: 'legislative', bg: 'assets/federal.png' },
  { name: 'Senador', type: 'legislative', bg: 'assets/senate.png' },
  { name: 'Prefeito', type: 'executive', bg: 'assets/mayor.png' },
  { name: 'Governador', type: 'executive', bg: 'assets/governor.png' },
  { name: 'Presidente', type: 'executive', bg: 'assets/president.png' }
];

// Partidos disponíveis com cores únicas para diferenciação
const parties = [
  { id: 'PRP', name: 'PRP', color: '#e63946' },
  { id: 'PSLB', name: 'PSLB', color: '#457b9d' },
  { id: 'PTM', name: 'PTM', color: '#2a9d8f' },
  { id: 'PVG', name: 'PVG', color: '#e9c46a', textColor: '#000' },
  { id: 'MDBR', name: 'MDBR', color: '#264653' }
];

// Discursos e temas para campanhas
const discourses = [
  { id: 'populista', label: 'Populista', popularity: 8, integrity: -5 },
  { id: 'progressista', label: 'Progressista', popularity: 5, integrity: 2 },
  { id: 'conservador', label: 'Conservador', popularity: 5, integrity: -1 },
  { id: 'tecnico', label: 'Técnico', popularity: 3, integrity: 3 }
];
const issues = [
  { id: 'economia', label: 'Economia', effect: 3 },
  { id: 'saude', label: 'Saúde', effect: 3 },
  { id: 'educacao', label: 'Educação', effect: 2 },
  { id: 'seguranca', label: 'Segurança', effect: 2 },
  { id: 'meioAmbiente', label: 'Meio Ambiente', effect: 2 }
];

// Seletores de elementos da interface
const startScreen = document.getElementById('start-screen');
const selectionScreen = document.getElementById('selection-screen');
const gameScreen = document.getElementById('game-screen');
const electionScreen = document.getElementById('election-screen');
const partyGrid = document.getElementById('party-grid');
const confirmBtn = document.getElementById('confirm-selection');
const startBtn = document.getElementById('start-btn');
const playerInfo = document.getElementById('player-info');
const officeInfo = document.getElementById('office-info');
const statsInfo = document.getElementById('stats-info');
const actionsDiv = document.getElementById('actions');
const feedDiv = document.getElementById('feed');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalButtons = document.getElementById('modal-buttons');
const campaignOverlay = document.getElementById('campaign-overlay');
const campaignOptionsDiv = document.getElementById('campaign-options');
const campaignStartBtn = document.getElementById('campaign-start');
const campaignCancelBtn = document.getElementById('campaign-cancel');
const electionTitle = document.getElementById('election-title');
const voteBars = document.getElementById('vote-bars');
const electionResult = document.getElementById('election-result');
const electionContinueBtn = document.getElementById('election-continue');

// Variáveis temporárias para campanha
let selectedDiscourse = null;
let selectedIssue = null;

// Prepara a lista de partidos na tela de seleção
function loadParties() {
  parties.forEach((p, idx) => {
    const item = document.createElement('div');
    item.classList.add('party-item');
    item.textContent = p.name;
    item.style.background = p.color;
    if (p.textColor) item.style.color = p.textColor;
    item.addEventListener('click', () => selectParty(idx));
    partyGrid.appendChild(item);
  });
}

function selectParty(index) {
  state.party = parties[index].id;
  // Highlight selection
  [...partyGrid.children].forEach((child, i) => {
    child.classList.toggle('selected', i === index);
  });
}

// Inicia a navegação para a seleção de partido
startBtn.addEventListener('click', () => {
  // Avança para a tela de seleção de partido
  startScreen.classList.remove('active');
  selectionScreen.classList.add('active');
});

// Confirma o partido e o nome
confirmBtn.addEventListener('click', () => {
  const nameInput = document.getElementById('candidate-name');
  const nm = nameInput.value.trim();
  if (!state.party) {
    alert('Selecione um partido.');
    return;
  }
  if (!nm) {
    alert('Digite seu nome.');
    return;
  }
  state.name = nm;
  selectionScreen.classList.remove('active');
  beginMandate();
});

// Reinicia as estatísticas para cada mandato
function resetStats() {
  state.popularity = 50;
  state.funds = 50;
  state.integrity = 50;
}

// Inicia o mandato do cargo atual
function beginMandate() {
  // Reseta estatísticas no início de cada mandato
  resetStats();
  const office = offices[state.officeIndex];
  // Ajusta imagem de fundo e visibilidade das telas
  gameScreen.style.backgroundImage = `url('${office.bg}')`;
  gameScreen.classList.add('active');
  electionScreen.classList.remove('active');
  updateHeader();
  updateActions();
  // Limpa feed e inicia com mensagem de boas-vindas
  feedDiv.innerHTML = '';
  addFeed(`Iniciando mandato como ${office.name}. Boa sorte!`);
}

// Atualiza cabeçalhos com informações do jogador e cargo
function updateHeader() {
  playerInfo.innerHTML = `<strong>${state.name}</strong> - Partido ${state.party}`;
  const office = offices[state.officeIndex];
  officeInfo.innerHTML = `<strong>${office.name}</strong>`;
  updateStats();
}

// Atualiza a exibição de estatísticas
function updateStats() {
  statsInfo.innerHTML = '';
  const span1 = document.createElement('span');
  span1.textContent = `Popularidade: ${Math.max(0, Math.min(100, Math.round(state.popularity)))}%`;
  const span2 = document.createElement('span');
  span2.textContent = `Fundos: ${Math.max(0, Math.round(state.funds))}`;
  const span3 = document.createElement('span');
  span3.textContent = `Integridade: ${Math.max(0, Math.min(100, Math.round(state.integrity)))}%`;
  statsInfo.appendChild(span1);
  statsInfo.appendChild(span2);
  statsInfo.appendChild(span3);
}

// Atualiza as ações disponíveis conforme o cargo
function updateActions() {
  actionsDiv.innerHTML = '';
  const office = offices[state.officeIndex];
  let acts = [];
  if (office.type === 'legislative') {
    acts = [
      { id: 'vote', label: 'Votar projeto', fn: actVote },
      { id: 'propose', label: 'Propor lei', fn: actPropose },
      { id: 'inspect', label: 'Fiscalizar', fn: actInspect },
      { id: 'speech', label: 'Discurso', fn: actSpeech },
      { id: 'campaign', label: 'Campanha', fn: actCampaign }
    ];
  } else {
    acts = [
      { id: 'sanction', label: 'Sancionar/vetar', fn: actSanction },
      { id: 'crisis', label: 'Gerenciar crise', fn: actCrisis },
      { id: 'budget', label: 'Orçamento', fn: actBudget },
      { id: 'speech', label: 'Discurso', fn: actSpeech },
      { id: 'campaign', label: 'Campanha', fn: actCampaign }
    ];
  }
  acts.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'button';
    btn.textContent = a.label;
    btn.addEventListener('click', a.fn);
    actionsDiv.appendChild(btn);
  });
}

// Adiciona mensagem ao feed
function addFeed(msg) {
  const p = document.createElement('p');
  p.textContent = msg;
  feedDiv.prepend(p);
}

/* === Funções de ações (legislativo) === */
function actVote() {
  const bill = randomBill();
  showModal('Votar projeto', `Projeto em pauta: ${bill}. Qual é o seu voto?`, [
    {
      label: 'Sim',
      action: () => {
        // Suporte simples: votar a favor sempre aumenta ou diminui dependendo do tema
        const change = Math.random() < 0.5 ? 2 : -1;
        state.popularity += change;
        state.integrity += change > 0 ? 1 : -1;
        addFeed(`Você votou SIM no projeto ${bill}. ${change > 0 ? 'Popularidade aumentou.' : 'Popularidade diminuiu.'}`);
        updateHeader();
        closeModal();
      }
    },
    {
      label: 'Não',
      action: () => {
        const change = Math.random() < 0.5 ? -2 : 1;
        state.popularity += change;
        state.integrity += change > 0 ? 1 : -1;
        addFeed(`Você votou NÃO no projeto ${bill}. ${change > 0 ? 'Popularidade aumentou.' : 'Popularidade diminuiu.'}`);
        updateHeader();
        closeModal();
      }
    }
  ]);
}

function actPropose() {
  const areas = ['Saúde','Educação','Segurança','Economia','Meio Ambiente'];
  const area = areas[Math.floor(Math.random() * areas.length)];
  const project = `Projeto de ${area}`;
  showModal('Propor lei', `Deseja apresentar o ${project}? (custará 3 fundos)`, [
    {
      label: 'Apresentar',
      action: () => {
        // Reduz fundos
        state.funds -= 3;
        // Probabilidade de aprovação
        const approved = Math.random() < 0.6;
        if (approved) {
          state.popularity += 5;
          state.integrity += 2;
          addFeed(`Seu projeto de ${area} foi aprovado. Popularidade aumentou.`);
        } else {
          state.popularity -= 3;
          state.integrity -= 2;
          addFeed(`Seu projeto de ${area} foi rejeitado. Popularidade diminuiu.`);
        }
        updateHeader();
        closeModal();
      }
    },
    { label: 'Cancelar', action: closeModal }
  ]);
}

function actInspect() {
  showModal('Fiscalização', 'Você iniciou uma fiscalização de obras públicas. Encontrou irregularidades?', [
    {
      label: 'Denunciar',
      action: () => {
        state.popularity += 4;
        state.integrity += 5;
        addFeed('Você denunciou irregularidades e ganhou crédito com a população.');
        updateHeader();
        closeModal();
      }
    },
    {
      label: 'Nada encontrado',
      action: () => {
        state.popularity -= 1;
        state.integrity -= 1;
        addFeed('A fiscalização não encontrou problemas, mas perdeu tempo precioso.');
        updateHeader();
        closeModal();
      }
    }
  ]);
}

function actSpeech() {
  // Permite escolher um tema para o discurso
  const buttons = issues.map(issue => {
    return {
      label: issue.label,
      action: () => {
        // Efeito moderado com pequena variação
        const base = issue.effect;
        const variation = Math.random() < 0.4 ? 1 : 0;
        state.popularity += base + variation;
        state.integrity += 1;
        addFeed(`Você fez um discurso sobre ${issue.label}. Popularidade aumentou.`);
        updateHeader();
        closeModal();
      }
    };
  });
  showModal('Discurso', 'Escolha o tema do seu discurso:', buttons);
}

/* === Funções de ações (executivo) === */
function actSanction() {
  showModal('Sancionar/vetar', 'Um projeto de lei aprovado pelo legislativo chegou para sua sanção. O que você faz?', [
    {
      label: 'Sancionar',
      action: () => {
        state.popularity += 3;
        state.integrity += 1;
        addFeed('Você sancionou a lei e agradou a maioria.');
        updateHeader();
        closeModal();
      }
    },
    {
      label: 'Vetá-lo',
      action: () => {
        state.popularity -= 3;
        state.integrity += 1;
        addFeed('Você vetou a lei. Parlamentares ficaram descontentes.');
        updateHeader();
        closeModal();
      }
    }
  ]);
}

function actCrisis() {
  const crises = ['enchente','epidemia','crise econômica','greve policial'];
  const crise = crises[Math.floor(Math.random() * crises.length)];
  showModal('Gerenciar crise', `Uma ${crise} ocorreu. Qual sua resposta?`, [
    {
      label: 'Investir recursos',
      action: () => {
        state.funds -= 10;
        state.popularity += 4;
        state.integrity += 2;
        addFeed(`Você investiu recursos para conter a ${crise}. Popularidade aumentou.`);
        updateHeader();
        closeModal();
      }
    },
    {
      label: 'Ignorar',
      action: () => {
        state.popularity -= 6;
        state.integrity -= 5;
        addFeed(`Você ignorou a ${crise}. A população está indignada.`);
        updateHeader();
        closeModal();
      }
    }
  ]);
}

function actBudget() {
  showModal('Orçamento', 'Distribua orçamento adicional (10) para qual área?', [
    {
      label: 'Saúde',
      action: () => {
        state.funds -= 10;
        state.popularity += 2;
        addFeed('Você destinou recursos extras para a saúde.');
        updateHeader();
        closeModal();
      }
    },
    {
      label: 'Educação',
      action: () => {
        state.funds -= 10;
        state.popularity += 2;
        addFeed('Você destinou recursos extras para educação.');
        updateHeader();
        closeModal();
      }
    },
    {
      label: 'Infraestrutura',
      action: () => {
        state.funds -= 10;
        state.popularity += 1;
        addFeed('Você investiu em infraestrutura.');
        updateHeader();
        closeModal();
      }
    }
  ]);
}

/* === Campanha === */
function actCampaign() {
  // Verifica se a situação do jogador permite campanha
  if (state.popularity < 40 || state.funds < 20 || state.integrity < 30) {
    addFeed('Sua base eleitoral está fraca. Melhore seus índices antes de lançar uma campanha.');
    state.popularity = Math.max(0, state.popularity - 5);
    updateHeader();
    return;
  }
  openCampaignOverlay();
}

function openCampaignOverlay() {
  campaignOptionsDiv.innerHTML = '';
  selectedDiscourse = null;
  selectedIssue = null;
  // Cria opções de discurso
  const discDiv = document.createElement('div');
  discDiv.style.marginBottom = '1rem';
  discDiv.innerHTML = '<strong>Tom do discurso:</strong>';
  discourses.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'button';
    btn.textContent = d.label;
    btn.addEventListener('click', () => {
      selectedDiscourse = d;
      // Visual feedback
      [...discDiv.querySelectorAll('button')].forEach(b => b.style.outline = 'none');
      btn.style.outline = `2px solid var(--accent)`;
    });
    discDiv.appendChild(btn);
  });
  campaignOptionsDiv.appendChild(discDiv);
  // Cria opções de temas
  const issueDiv = document.createElement('div');
  issueDiv.innerHTML = '<strong>Tema principal:</strong>';
  issues.forEach(i => {
    const btn = document.createElement('button');
    btn.className = 'button';
    btn.textContent = i.label;
    btn.addEventListener('click', () => {
      selectedIssue = i;
      [...issueDiv.querySelectorAll('button')].forEach(b => b.style.outline = 'none');
      btn.style.outline = `2px solid var(--accent)`;
    });
    issueDiv.appendChild(btn);
  });
  campaignOptionsDiv.appendChild(issueDiv);
  // Mostrar overlay
  campaignOverlay.style.display = 'flex';
}

campaignCancelBtn.addEventListener('click', () => {
  campaignOverlay.style.display = 'none';
});

campaignStartBtn.addEventListener('click', () => {
  if (!selectedDiscourse || !selectedIssue) {
    alert('Selecione o tom do discurso e o tema principal.');
    return;
  }
  // Deduz fundos da campanha
  state.funds -= 10;
  // Ajusta popularidade e integridade baseados na escolha
  state.popularity += selectedDiscourse.popularity + selectedIssue.effect;
  state.integrity += selectedDiscourse.integrity;
  addFeed(`Você lançou uma campanha com discurso ${selectedDiscourse.label} focado em ${selectedIssue.label}.`);
  updateHeader();
  campaignOverlay.style.display = 'none';
  // Inicia eleição
  startElection();
});

/* === Eleição === */
function startElection() {
  // Configura a tela de eleição
  gameScreen.classList.remove('active');
  const office = offices[state.officeIndex];
  electionScreen.style.backgroundImage = `url('assets/urna_eletronica.jpg')`;
  electionTitle.textContent = `Contagem de votos para ${office.name}`;
  voteBars.innerHTML = '';
  electionResult.textContent = '';
  electionScreen.classList.add('active');
  // Calcula votos
  const candidateVotes = calculateVotes();
  const opponentVotes = 100 - candidateVotes;
  // Cria barras de votação
  const candBar = document.createElement('div');
  candBar.className = 'vote-bar candidate';
  candBar.style.width = '0%';
  const oppBar = document.createElement('div');
  oppBar.className = 'vote-bar opponent';
  oppBar.style.width = '0%';
  voteBars.appendChild(candBar);
  voteBars.appendChild(oppBar);
  // Fornece atraso para animação
  setTimeout(() => {
    candBar.style.width = `${candidateVotes}%`;
    oppBar.style.width = `${opponentVotes}%`;
  }, 100);
  // Após animação mostra resultado
  setTimeout(() => {
    if (candidateVotes > opponentVotes) {
      electionResult.textContent = `Você venceu a eleição com ${candidateVotes.toFixed(1)}% dos votos!`;
    } else {
      electionResult.textContent = `Você perdeu a eleição, recebeu ${candidateVotes.toFixed(1)}% dos votos.`;
    }
  }, 2500);
  // Define comportamento do botão continuar
  electionContinueBtn.onclick = () => {
    electionScreen.classList.remove('active');
    gameScreen.classList.add('active');
    if (candidateVotes > opponentVotes) {
      // Avança para o próximo cargo
      addFeed('Sua campanha foi bem‑sucedida! Você foi eleito para o próximo cargo.');
      // Incrementa o índice do cargo, respeitando o limite
      state.officeIndex = Math.min(state.officeIndex + 1, offices.length - 1);
      beginMandate();
    } else {
      // Mantém no cargo atual com penalidades
      addFeed('Sua campanha falhou. A eleição não foi bem sucedida.');
      state.popularity = Math.max(0, state.popularity - 15);
      state.integrity = Math.max(0, state.integrity - 5);
      updateHeader();
      updateActions();
    }
  };
}

// Calcula porcentagem de votos do candidato com base nos atributos
function calculateVotes() {
  // Peso maior para popularidade e integridade, menor para fundos
  const base = state.popularity * 0.5 + state.integrity * 0.3 + state.funds * 0.2;
  const randomFactor = Math.random() * 20 - 10; // Variação entre -10 e +10
  let candidate = base + randomFactor;
  // Normaliza para 0–100
  if (candidate < 5) candidate = 5;
  if (candidate > 95) candidate = 95;
  return parseFloat(candidate.toFixed(1));
}

/* === Modal helpers === */
function showModal(title, text, buttons) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  modalButtons.innerHTML = '';
  buttons.forEach(btn => {
    const b = document.createElement('button');
    b.className = 'button';
    b.textContent = btn.label;
    b.addEventListener('click', btn.action);
    modalButtons.appendChild(b);
  });
  modalOverlay.style.display = 'flex';
}

function closeModal() {
  modalOverlay.style.display = 'none';
}

/* === Geração de nomes de projetos aleatórios === */
function randomBill() {
  const topics = ['transporte público','saneamento','cultura','tributos','energia limpa','segurança nas escolas'];
  const adjectives = ['Melhoria','Reforma','Programa','Ajuste','Incentivo'];
  const t = topics[Math.floor(Math.random() * topics.length)];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${a} de ${t}`;
}

// Carrega partidos ao iniciar o script
loadParties();

// Debug: show startBtn existence after load
//