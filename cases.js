/* ============================================================
   HONOR — cases em coverflow 3D
   Três modos, escolhidos no boot e revistos no resize:
     · "cf"   — desktop: a seção prende no topo e o scroll gira o arco 3D
     · "snap" — mobile: fileira horizontal com scroll-snap
     · "grid" — reduced-motion / timeline congelada: grade estática
   No modo "cf" o scrollY é a ÚNICA fonte de verdade: arrastar, setas e
   dots não movem os cards, eles traduzem o índice desejado em um scrollY
   e rolam a janela até lá. Assim nada dessincroniza.
   ============================================================ */
(function(){
  "use strict";

  const section = document.getElementById("resultados");
  const stage   = document.getElementById("cfStage");
  const track   = document.getElementById("cfTrack");
  const meta    = document.getElementById("cfMeta");
  const dotsBox = document.getElementById("cfDots");
  if(!section || !stage || !track || !meta || !dotsBox) return;

  const cards = [...track.querySelectorAll(".cf-card")];
  const n = cards.length;
  if(n < 2) return;

  const reduce  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mqWide  = window.matchMedia("(min-width: 861px)");
  const clamp   = (v,a,b)=> v < a ? a : (v > b ? b : v);
  const pad2    = i => String(i + 1).padStart(2, "0");

  section.style.setProperty("--cf-n", n);

  /* ---------- painel de legenda ---------- */
  const txt     = meta.querySelector(".cf-meta-text");
  const elT     = meta.querySelector(".cf-t");
  const elD     = meta.querySelector(".cf-d");
  const elMb    = meta.querySelector(".cf-chip b");
  const elMi    = meta.querySelector(".cf-chip i");
  const elCount = meta.querySelector(".cf-count b");
  meta.querySelector(".cf-total").textContent = " / " + pad2(n - 1);

  const dots = cards.map((_, i)=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cf-dot";
    b.setAttribute("aria-label", "Ir para o case " + (i + 1));
    b.addEventListener("click", ()=> goTo(i, true));
    dotsBox.appendChild(b);
    return b;
  });

  /* ---------- estado ---------- */
  let mode = null, active = -1, raf = null, swapT = null, dragEnd = 0, drag = null;
  const geo = { top:0, range:1, gapX:340 };

  function measure(){
    geo.top   = section.getBoundingClientRect().top + window.scrollY;
    geo.range = Math.max(1, section.offsetHeight - window.innerHeight);
    geo.gapX  = Math.max(170, cards[0].offsetWidth * 0.46);
  }

  const posNow = ()=> clamp((window.scrollY - geo.top) / geo.range, 0, 1) * (n - 1);
  const yFor   = i => geo.top + (i / (n - 1)) * geo.range;

  /* ---------- desenho ---------- */
  function layout(){
    raf = null;
    const pos = posNow();
    for(let i = 0; i < n; i++){
      const el = cards[i];
      const d  = i - pos, a = Math.abs(d), ad = Math.min(a, 3);
      const x  = d * geo.gapX;
      const ry = -clamp(d, -3, 3) * 34;
      el.style.transform = "translate3d(calc(-50% + " + x.toFixed(1) + "px), -50%, " +
                           (-ad * 190).toFixed(1) + "px) rotateY(" + ry.toFixed(2) +
                           "deg) scale(" + (1 - ad * 0.075).toFixed(3) + ")";
      el.style.opacity       = a > 3.4 ? "0" : (1 - ad * 0.2).toFixed(3);
      el.style.zIndex        = String(200 - Math.round(a * 10));
      el.style.filter        = "brightness(" + (1 - ad * 0.24).toFixed(3) +
                               ") saturate(" + (1 - ad * 0.25).toFixed(3) + ")";
      el.style.pointerEvents = a > 3.4 ? "none" : "auto";
    }
    setActive(Math.round(pos));
  }

  function setActive(i){
    i = clamp(i, 0, n - 1);
    if(i === active) return;
    active = i;

    cards.forEach((c, k)=> c.classList.toggle("is-active", k === i));
    dots.forEach((b, k)=>{
      b.classList.toggle("is-on", k === i);
      b.setAttribute("aria-current", k === i ? "true" : "false");
    });
    elCount.textContent = pad2(i);

    /* crossfade: some, troca o texto, volta */
    const c = cards[i];
    txt.classList.add("swap");
    clearTimeout(swapT);
    swapT = setTimeout(()=>{
      elT.textContent  = c.querySelector("h3").textContent;
      elD.textContent  = c.querySelector("p").textContent;
      elMb.textContent = c.querySelector(".cf-chip b").textContent;
      elMi.textContent = c.querySelector(".cf-chip i").textContent;
      txt.classList.remove("swap");
    }, 170);
  }

  /* ---------- navegação: sempre via scroll da janela ---------- */
  function goTo(i, smooth){
    i = clamp(i, 0, n - 1);
    if(mode === "snap"){
      cards[i].scrollIntoView({ behavior: smooth ? "smooth" : "auto", block:"nearest", inline:"center" });
      return;
    }
    if(mode !== "cf") return;
    window.scrollTo({ top: yFor(i), behavior: smooth ? "smooth" : "auto" });
  }

  /* arrastar — html{scroll-behavior:smooth} tornaria o arrasto elástico,
     então ele é desligado enquanto o ponteiro está pressionado */
  stage.addEventListener("pointerdown", e=>{
    if(mode !== "cf") return;
    if(e.pointerType === "mouse" && e.button !== 0) return;
    drag = { x:e.clientX, y0:window.scrollY, moved:false };
    try{ stage.setPointerCapture(e.pointerId); }catch(_){}
    stage.classList.add("is-dragging");
    document.documentElement.style.scrollBehavior = "auto";
  });

  stage.addEventListener("pointermove", e=>{
    if(!drag) return;
    const dx = e.clientX - drag.x;
    if(Math.abs(dx) > 3) drag.moved = true;
    const di = -dx / geo.gapX;                       /* deslocamento em índices */
    window.scrollTo(0, drag.y0 + (di / (n - 1)) * geo.range);
  });

  function endDrag(){
    if(!drag) return;
    const moved = drag.moved;
    drag = null;
    stage.classList.remove("is-dragging");
    document.documentElement.style.scrollBehavior = "";
    if(moved){ dragEnd = Date.now(); goTo(Math.round(posNow()), true); }
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  /* clicar num card lateral centraliza ele (ignorado logo após arrastar) */
  cards.forEach((c, i)=>{
    c.addEventListener("click", ()=>{
      if(mode !== "cf" || Date.now() - dragEnd < 300) return;
      if(i !== active) goTo(i, true);
    });
  });

  stage.addEventListener("keydown", e=>{
    if(mode === "grid") return;
    let t = null;
    if(e.key === "ArrowRight")     t = active + 1;
    else if(e.key === "ArrowLeft") t = active - 1;
    else if(e.key === "Home")      t = 0;
    else if(e.key === "End")       t = n - 1;
    if(t === null) return;
    e.preventDefault();
    goTo(t, true);
  });

  meta.querySelectorAll(".cf-arrow").forEach(b=>{
    b.addEventListener("click", ()=> goTo(active + Number(b.dataset.dir), true));
  });

  /* ---------- modos ---------- */
  function pickMode(){
    if(reduce || document.documentElement.classList.contains("no-anim")) return "grid";
    return mqWide.matches ? "cf" : "snap";
  }

  function applyMode(){
    const m = pickMode();
    if(m === mode){ if(m === "cf"){ measure(); layout(); } return; }
    mode = m;

    section.classList.toggle("cf--on",   m === "cf");
    section.classList.toggle("cf--snap", m === "snap");
    meta.hidden = m !== "cf";

    if(m === "cf"){
      stage.setAttribute("tabindex", "0");
      stage.setAttribute("role", "group");
      stage.setAttribute("aria-roledescription", "carrossel");
      stage.setAttribute("aria-label", "Cases da HONOR");
      active = -1;
      measure();
      layout();
    }else{
      stage.removeAttribute("tabindex");
      stage.removeAttribute("role");
      stage.removeAttribute("aria-roledescription");
      stage.removeAttribute("aria-label");
      cards.forEach(c=>{ c.removeAttribute("style"); c.classList.remove("is-active"); });
      active = -1;
    }
  }

  window.addEventListener("scroll", ()=>{
    if(mode === "cf" && !raf) raf = requestAnimationFrame(layout);
  }, { passive:true });

  let rzT = null;
  window.addEventListener("resize", ()=>{
    clearTimeout(rzT);
    rzT = setTimeout(applyMode, 150);
  }, { passive:true });

  window.addEventListener("load", ()=>{ if(mode === "cf"){ measure(); layout(); } });

  applyMode();
  /* app.js só decide sobre a timeline congelada alguns frames depois */
  setTimeout(applyMode, 2600);
})();
