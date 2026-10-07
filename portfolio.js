/* HONOR — vídeos da home e do portfólio: só tocam enquanto visíveis
   (vários vídeos decodificando juntos derrubam a página). */
(function(){
  "use strict";
  // pré-visualização: index.html?v=a (só portas) | ?v=b (só showreel)
  const pt = document.querySelector(".pt"), q = new URLSearchParams(location.search).get("v");
  if(pt && (q === "a" || q === "b" || q === "ab")) pt.dataset.variant = q;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce || !("IntersectionObserver" in window)) return;

  const play = v => { const p = v.play(); if(p && p.catch) p.catch(()=>{}); };

  // autoplay enquanto visível
  const auto = [...document.querySelectorAll("video[data-autoplay]")];
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{
      const v = e.target;
      if(e.isIntersecting){ if(v.preload === "none") v.preload = "auto"; play(v); }
      else v.pause();
    });
  }, { threshold:.25 });
  auto.forEach(v=> io.observe(v));

  // hover: toca ao passar o mouse no card
  document.querySelectorAll("video[data-hover]").forEach(v=>{
    const host = v.closest("a") || v.parentElement;
    host.addEventListener("mouseenter", ()=>{ if(v.preload === "none") v.preload = "auto"; play(v); });
    host.addEventListener("mouseleave", ()=>{ v.pause(); v.currentTime = 0; });
    host.addEventListener("focus", ()=> play(v));
    host.addEventListener("blur", ()=> v.pause());
  });
})();
