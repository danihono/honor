/* ============================================================
   HONOR — marquee de trabalhos
   Duas fileiras de imagens que deslizam conforme o scroll:
   fileira 1 para a DIREITA, fileira 2 para a ESQUERDA.
   ============================================================ */
(function(){
  "use strict";
  const section = document.getElementById("resultados");
  const row1 = document.getElementById("wmRow1");
  const row2 = document.getElementById("wmRow2");
  if(!section || !row1 || !row2) return;

  /* 21 imagens: 11 na fileira de cima, 10 na de baixo.
     Troque os caminhos abaixo pelos prints reais dos projetos. */
  const ASSETS = [
    "assets/case-follow-advisor.png",
    "assets/case-level.png",
    "assets/case-travessia.png",
    "assets/app-crm.png",
    "assets/app-bolao.png",
    "assets/app-level.png"
  ];
  const IMAGES = Array.from({length:21}, (_, i)=> ASSETS[i % ASSETS.length]);

  /* cada fileira é triplicada para o loop parecer infinito */
  function fill(row, imgs){
    const frag = document.createDocumentFragment();
    for(let copy = 0; copy < 3; copy++){
      imgs.forEach(src=>{
        const tile = document.createElement("div");
        tile.className = "wm-tile";
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        tile.appendChild(img);
        frag.appendChild(tile);
      });
    }
    row.appendChild(frag);
  }
  fill(row1, IMAGES.slice(0, 11));
  fill(row2, IMAGES.slice(11));

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let raf = null;
  function update(){
    raf = null;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const offset = (window.scrollY - sectionTop + window.innerHeight) * 0.3;
    /* base de -33.333% centraliza a cópia do meio, para nunca aparecer borda vazia */
    row1.style.transform = "translate3d(calc(-33.333% + " + (offset - 200) + "px), 0, 0)";
    row2.style.transform = "translate3d(calc(-33.333% + " + (-(offset - 200)) + "px), 0, 0)";
  }
  function onScroll(){ if(!raf) raf = requestAnimationFrame(update); }

  if(reduce){
    row1.style.transform = "translate3d(-33.333%, 0, 0)";
    row2.style.transform = "translate3d(-33.333%, 0, 0)";
    return;
  }
  window.addEventListener("scroll", onScroll, { passive:true });
  window.addEventListener("resize", onScroll, { passive:true });
  update();
})();
