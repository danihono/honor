/* ============================================================
   HONOR — cinematic case carousel
   3 categories · cover-flow 3D · tabs · dots · parallax tilt
   ============================================================ */
(function(){
  "use strict";
  const stage = document.getElementById("csStage");
  if(!stage) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* category glyph icons (large ghost art per kind) */
  const GLYPH = {
    lp:  '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3"><rect x="14" y="20" width="92" height="80" rx="8"/><path d="M14 40h92"/><rect x="26" y="54" width="40" height="8" rx="4" fill="currentColor" stroke="none"/><rect x="26" y="70" width="62" height="6" rx="3" fill="currentColor" stroke="none"/><rect x="26" y="82" width="48" height="6" rx="3" fill="currentColor" stroke="none"/></svg>',
    sis: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3"><rect x="14" y="18" width="92" height="84" rx="8"/><path d="M14 44h92"/><rect x="26" y="58" width="30" height="32" rx="5"/><path d="M66 60h28M66 72h28M66 84h18"/></svg>',
    ia:  '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3"><circle cx="60" cy="60" r="44"/><path d="M48 44v32l28-16z" fill="currentColor" stroke="none"/></svg>'
  };

  const DATA = {
    lp: [
      { t:"Follow Advisor",                  d:"Landing page institucional para consultoria em Qualidade, Supply-Chain e Projetos.", m:"+32%", ml:"conversão média", img:"assets/case-follow-advisor.png" },
      { t:"Level Jiu-Jitsu",                  d:"Landing page imersiva para academia de Jiu-Jitsu: Jiu-Jitsu para a Vida.", m:"+120k", ml:"visitantes gerados", img:"assets/case-level.png" },
      { t:"Travessia · FollowLabs",           d:"Landing page premium para plataforma de governança, compliance e qualidade.", m:"+45", ml:"projetos entregues", img:"assets/case-travessia.png" }
    ],
    sis: [
      { t:"Hono AI · CRM Finance", d:"Dashboard financeiro executivo: KPIs do ciclo, fluxo de caixa e saúde do negócio em tempo real.", m:"+50%", ml:"produtividade", img:"assets/app-crm.png" },
      { t:"Bolão · App de palpites", d:"Ranking ao vivo, rodadas e pontuação automática para competições entre participantes.", m:"+28%", ml:"engajamento", img:"assets/app-bolao.png" },
      { t:"Level · App do aluno",    d:"Área do aluno para acompanhar treinos, conquistas e a jornada no tatame.", m:"+19%", ml:"retenção", img:"assets/app-level.png" }
    ],
    ia: [
      { t:"Vídeos com IA",                d:"Conteúdos visuais criados para atrair atenção e fortalecer a marca.", m:"+19%", ml:"engajamento" },
      { t:"Criativos para redes sociais", d:"Imagens, vídeos e campanhas com estética premium e alta retenção.", m:"+80", ml:"peças produzidas" },
      { t:"Conteúdo estratégico",         d:"Ideias transformadas em campanhas visuais com personalidade e impacto.", m:"+3x", ml:"alcance" }
    ]
  };

  let cat = "lp";
  let active = 0;
  let cards = [];
  const dotsWrap = document.getElementById("csDots");

  function build(){
    stage.innerHTML = "";
    const list = DATA[cat];
    cards = list.map((c, i)=>{
      const el = document.createElement("article");
      el.className = "cs-card";
      el.innerHTML =
        '<div class="cs-media" data-kind="'+cat+'">' +
          (c.img ? '<img class="cs-shot" src="'+c.img+'" alt="'+c.t+'" loading="lazy">' : '') +
          '<span class="bar"><i></i><i></i><i></i></span>' +
          (c.img ? '' : '<span class="cs-glyph">'+GLYPH[cat]+'</span>') +
          '<span class="cs-scan"></span>' +
          '<span class="cs-chip"><b>'+c.m+'</b><i>'+c.ml+'</i></span>' +
        '</div>' +
        '<div class="cs-body">' +
          '<h3>'+c.t+'</h3>' +
          '<p>'+c.d+'</p>' +
          '<a class="cs-link" href="#contato">Ver case <span class="ar">→</span></a>' +
        '</div>' +
        '<span class="veil"></span>';
      el.addEventListener("click", ()=>{
        const rel = ((i - active) % list.length + list.length) % list.length;
        if(rel === 0) return;                 // center card → let link/click pass
        go(rel === list.length - 1 ? -1 : 1);
      });
      stage.appendChild(el);
      return el;
    });
    buildDots();
    layout();
  }

  function buildDots(){
    dotsWrap.innerHTML = "";
    DATA[cat].forEach((_, i)=>{
      const d = document.createElement("button");
      d.className = "cs-dot" + (i===active ? " is-active" : "");
      d.setAttribute("aria-label", "Ir para case "+(i+1));
      d.addEventListener("click", ()=>{ active = i; layout(); });
      dotsWrap.appendChild(d);
    });
  }

  function layout(){
    const n = cards.length;
    cards.forEach((el, i)=>{
      let rel = ((i - active) % n + n) % n;   // 0,1,2
      let pos = rel;
      if(pos > n/2) pos -= n;                  // wrap: 2 -> -1
      el.dataset.pos = pos;
      el.classList.toggle("is-center", pos === 0);
      const x   = pos * 60;                    // % of own width via translateX
      el.style.setProperty("--x",   x + "%");
      el.style.setProperty("--rot", (pos * -19) + "deg");
      el.style.setProperty("--sc",  pos === 0 ? 1 : 0.8);
      el.style.setProperty("--op",  pos === 0 ? 1 : (Math.abs(pos) === 1 ? 0.5 : 0));
      el.style.setProperty("--z",   pos === 0 ? 5 : 2 - Math.abs(pos));
    });
    [...dotsWrap.children].forEach((d, i)=> d.classList.toggle("is-active", i===active));
  }

  function go(dir){
    const n = cards.length;
    active = (active + dir % n + n) % n;
    layout();
  }

  /* tabs */
  document.querySelectorAll(".cs-tab").forEach(tab=>{
    tab.addEventListener("click", ()=>{
      if(tab.dataset.cat === cat) return;
      document.querySelectorAll(".cs-tab").forEach(t=>{
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      cat = tab.dataset.cat;
      active = 0;
      stage.style.opacity = "0";
      setTimeout(()=>{ build(); stage.style.opacity = "1"; }, 220);
    });
  });
  stage.style.transition = "opacity .35s " + "cubic-bezier(.22,1,.36,1)";

  /* prev / next */
  document.querySelectorAll(".cs-nav").forEach(btn=>{
    btn.addEventListener("click", ()=> go(parseInt(btn.dataset.dir,10)));
  });

  /* keyboard when section focused/hovered */
  const section = document.getElementById("resultados");
  let hot = false;
  section.addEventListener("mouseenter", ()=> hot = true);
  section.addEventListener("mouseleave", ()=> hot = false);
  window.addEventListener("keydown", e=>{
    if(!hot) return;
    if(e.key === "ArrowLeft")  go(-1);
    if(e.key === "ArrowRight") go(1);
  });

  /* parallax tilt on the whole stage (subtle, rAF-throttled for fluidity) */
  if(!reduce){
    const wrap = document.querySelector(".cases-stage-wrap");
    let tx = 0, ty = 0, tRaf = null;
    function applyTilt(){ tRaf = null; stage.style.transform = "rotateY("+tx.toFixed(2)+"deg) rotateX("+ty.toFixed(2)+"deg)"; }
    wrap.addEventListener("mousemove", e=>{
      const r = wrap.getBoundingClientRect();
      tx = ((e.clientX - r.left)/r.width - 0.5) * 6;
      ty = ((e.clientY - r.top)/r.height - 0.5) * -5;
      if(!tRaf) tRaf = requestAnimationFrame(applyTilt);
    });
    wrap.addEventListener("mouseleave", ()=>{ tx = 0; ty = 0; if(!tRaf) tRaf = requestAnimationFrame(applyTilt); });
    stage.style.transition = "opacity .35s var(--ease), transform .2s var(--ease)";
  } else {
    stage.style.transition = "opacity .35s var(--ease)";
  }

  build();

  /* ---------- slow drifting particle field (background) ---------- */
  const cv = document.querySelector(".cases-particles");
  if(cv && !reduce){
    const ctx = cv.getContext("2d");
    let w, h, dpr, parts = [], raf = null;
    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w*dpr; cv.height = h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function seed(){
      const n = Math.round(Math.min(64, (w*h)/24000));
      parts = Array.from({length:n}, ()=>({
        x: Math.random()*w, y: Math.random()*h,
        r: Math.random()*1.8 + 0.5,
        vx: (Math.random()-0.5)*0.12, vy: -(Math.random()*0.18 + 0.04),
        a: Math.random()*0.5 + 0.18, hue: 16 + Math.random()*26
      }));
    }
    function frame(){
      ctx.clearRect(0,0,w,h);
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowBlur = 6;
      for(const p of parts){
        p.x += p.vx; p.y += p.vy;
        if(p.y < -8){ p.y = h+8; p.x = Math.random()*w; }
        if(p.x < -8) p.x = w+8; if(p.x > w+8) p.x = -8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = "hsla("+p.hue+",100%,58%,"+p.a+")";
        ctx.shadowColor = "hsla("+p.hue+",100%,52%,"+p.a+")";
        ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    }
    function start(){ if(!raf){ resize(); seed(); frame(); } }
    function stop(){ if(raf){ cancelAnimationFrame(raf); raf = null; ctx.clearRect(0,0,w,h); } }
    window.addEventListener("resize", ()=>{ if(raf){ resize(); seed(); } });
    if("IntersectionObserver" in window){
      new IntersectionObserver(es=> es.forEach(e=> e.isIntersecting ? start() : stop()), {threshold:0.05})
        .observe(cv);
    } else start();
  }
})();
