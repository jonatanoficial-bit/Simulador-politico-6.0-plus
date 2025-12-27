(function initDataLoader(){
  window.SIM_POL = window.SIM_POL || {};

  async function fetchJson(path){
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar ${path}: ${res.status}`);
    return await res.json();
  }

  async function bootstrapData(){
    const [cargos, leis, eventos, carreira, regras, politicas, tecnicos, npcs, partidos, acoes] = await Promise.all([
      fetchJson("/data/cargos.json").catch(()=>[]),
      fetchJson("/data/leis.json").catch(()=>[]),
      fetchJson("/data/eventos.json").catch(()=>[]),
      fetchJson("/data/carreira.json").catch(()=>[]),
      fetchJson("/data/regras_legislativo.json").catch(()=>({ casas:{} })),
      fetchJson("/data/politicas.json").catch(()=>[]),
      fetchJson("/data/tecnicos.json").catch(()=>[]),
      fetchJson("/data/npcs.json").catch(()=>[]),
      fetchJson("/data/partidos.json").catch(()=>[]),
      fetchJson("/data/acoes.json").catch(()=>[])
    ]);

    const data = {
      cargos,
      leis,
      eventos,
      carreira,
      regras_legislativo: regras,
      politicas,
      tecnicos,
      npcs,
      partidos,
      acoes
    };

    window.SIM_POL.data = data;
    return data;
  }

  window.SIM_POL.bootstrapData = bootstrapData;
})();