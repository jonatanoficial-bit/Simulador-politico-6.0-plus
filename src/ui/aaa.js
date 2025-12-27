/* src/ui/aaa.js — Toque final AAA (sem mexer em app.js)
   - Adiciona classes de UI no DOM para o CSS estilizar melhor
   - Detecta botões principais e aplica estilos premium
   - Deixa abas (tabs) com aparência de HUD
*/

(function(){
  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function textOf(el){
    return (el?.textContent || "").trim().toLowerCase();
  }

  function markButtons(){
    const btns = $all("button");
    btns.forEach(b => {
      const t = textOf(b);

      // Botão primário do jogo (CTA)
      if (t.includes("avançar") || t.includes("avancar mês") || t.includes("avancar mes")) b.classList.add("btn-primary");
      if (t === "instalar app" || t.includes("instalar")) b.classList.add("btn-secondary");
      if (t.includes("novo jogo")) b.classList.add("btn-danger");
      if (t.includes("salvar")) b.classList.add("btn-ghost");
      if (t.includes("carregar")) b.classList.add("btn-ghost");

      // Botões do debug
      if (b.classList.contains("dbg-btn")) b.classList.add("btn-debug");
    });
  }

  function markTabs(){
    // O app atual usa botões como tabs (Painel/Personagem/Ações/etc.)
    // Agrupamos visualmente detectando a sequência de botões pequenos.
    const app = $("#app");
    if (!app) return;

    const btns = $all("#app button");
    // encontra sequência provável de tabs (muitos botões seguidos com nomes curtos)
    const tabLike = btns.filter(b => {
      const t = textOf(b);
      return ["painel","personagem","ações do mês","acoes do mes","legislativo","eventos","eleições","eleicoes","mídia","midia","integridade","diário","diario"].includes(t);
    });

    tabLike.forEach(b => b.classList.add("tab-btn"));
  }

  function markCards(){
    // Alguns cards não têm classe; tentamos melhorar com heurística
    const app = $("#app");
    if (!app) return;

    // Adiciona classe em containers grandes: procura elementos que tenham muitos botões e muitos textos
    const blocks = $all("#app > *");
    blocks.forEach(el => {
      // se tiver título "Simulador Político" dentro, é hero
      if ((el.textContent || "").includes("Simulador Político")) el.classList.add("hero-wrap");
    });

    // cartões pequenos de status: detecta elementos com % e R$
    const maybe = $all("#app div");
    maybe.forEach(el => {
      const tx = (el.textContent || "");
      if (tx.includes("%") && tx.length < 80) el.classList.add("stat-chip");
      if (tx.includes("R$") && tx.length < 80) el.classList.add("stat-chip");
    });
  }

  function apply(){
    try{
      document.documentElement.classList.add("aaa");
      markButtons();
      markTabs();
      markCards();
    }catch(e){}
  }

  // aplica algumas vezes para pegar DOM que renderiza depois
  let tries = 0;
  const t = setInterval(() => {
    apply();
    tries++;
    if (tries >= 12) clearInterval(t);
  }, 250);

  // reaplica após cliques (mudança de abas)
  document.addEventListener("click", () => setTimeout(apply, 80), true);
  window.addEventListener("focus", () => setTimeout(apply, 80));
})();