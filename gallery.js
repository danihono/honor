/* ============================================================
   HONOR — galerias por solução
   Troca o print de capa por um vídeo em loop APENAS enquanto o card
   está visível. Isso não é refinamento: seis vídeos decodificando ao
   mesmo tempo derrubam a página do mesmo jeito que o canvas de brasas
   derrubava a faixa de números (60 fps -> 1,8). O vídeo só é criado
   quando entra na tela e é pausado quando sai.
   Sem data-video no frame, ou com reduced-motion, fica só o print.
   ============================================================ */
(function(){
  "use strict";

  const frames = [...document.querySelectorAll(".gx-frame[data-video]")];
  if(!frames.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce || !("IntersectionObserver" in window)) return;

  function ensureVideo(frame){
    let v = frame.querySelector("video");
    if(v) return v;

    const shot = frame.querySelector("img");
    v = document.createElement("video");
    v.className = "gx-vid";
    v.muted = true;               /* precisa vir antes do play p/ o autoplay valer */
    v.loop = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    if(shot) v.poster = shot.getAttribute("src");

    /* data-video vem SEM extensão. Servimos webm e mp4: o Safari só toca
       H.264, e há navegadores sem os codecs proprietários que só tocam VP9
       (o Chromium de teste desta máquina é um deles). O navegador escolhe
       a primeira fonte que sabe tocar. */
    const base = frame.dataset.video;
    [["webm","video/webm"], ["mp4","video/mp4"]].forEach(([ext, type])=>{
      const src = document.createElement("source");
      src.src  = base + "." + ext;
      src.type = type;
      v.appendChild(src);
    });

    /* nenhuma fonte tocou: o print continua embaixo e o card segue correto */
    v.addEventListener("error", ()=>{ v.remove(); frame.removeAttribute("data-video"); });
    frame.appendChild(v);
    return v;
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      const frame = e.target;
      if(e.isIntersecting){
        const v = ensureVideo(frame);
        const play = v.play();
        if(play && play.catch) play.catch(()=>{});   /* autoplay barrado: fica o poster */
        frame.classList.add("is-playing");
      }else{
        const v = frame.querySelector("video");
        if(v){ v.pause(); frame.classList.remove("is-playing"); }
      }
    });
  }, { threshold:0.35 });

  frames.forEach(f=> io.observe(f));
})();
