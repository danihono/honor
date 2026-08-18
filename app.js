/* ============================================================
   HONOR — interactions
   partículas do hero · parallax · scroll-reveal · odômetro · nav
   ============================================================ */
(function(){
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- DETECT FROZEN CSS TIMELINE ----------
     Some embedded/preview environments never advance document.timeline,
     so CSS transitions/animations freeze at their start frame. In that
     case we drop all the hidden start-states so content is always shown. */
  (function detectTimeline(){
    let a;
    requestAnimationFrame(()=>{
      a = document.timeline.currentTime || 0;
      requestAnimationFrame(()=>{
        const b = document.timeline.currentTime || 0;
        if(!(b > a)) document.documentElement.classList.add("no-anim");
      });
    });
    // hard safety net: if anything goes wrong, reveal everything after 2.5s
    setTimeout(()=>{
      const stuck = document.querySelector(".reveal:not(.in)");
      if(stuck && getComputedStyle(stuck).opacity === "0" &&
         !document.documentElement.classList.contains("no-anim")){
        // verify it's actually stuck (in viewport but invisible)
        const r = stuck.getBoundingClientRect();
        if(r.top < innerHeight && r.bottom > 0) document.documentElement.classList.add("no-anim");
      }
    }, 2500);
  })();

  /* ---------- NAV scroll state ---------- */
  const nav = document.querySelector(".nav");
  const onScrollNav = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive:true });

  /* ---------- SCROLL REVEAL (position-based; works without IO) ---------- */
  const revealEls = [...document.querySelectorAll(".reveal, .wire, [data-odo]")];
  function checkReveal(){
    const vh = window.innerHeight;
    for(let i=revealEls.length-1; i>=0; i--){
      const el = revealEls[i];
      const r = el.getBoundingClientRect();
      if(r.top < vh*0.92 && r.bottom > 0){
        el.classList.add("in");
        if(el.dataset.odo) animateOdometer(el);
        revealEls.splice(i,1);
      }
    }
  }
  window.addEventListener("scroll", checkReveal, { passive:true });
  window.addEventListener("resize", checkReveal);
  requestAnimationFrame(()=>{ checkReveal(); requestAnimationFrame(checkReveal); });
  window.addEventListener("load", checkReveal);

  /* ---------- ODÔMETRO ----------
     Cada dígito é uma coluna com uma tira 0-9 que desliza até o valor final.
     Colunas mais à direita dão mais voltas, então os dígitos assentam em
     cascata da esquerda para a direita — o mesmo efeito dos "animated
     numbers" do skiper37/NumberFlow, aqui em CSS + JS puro. */
  function animateOdometer(el){
    if(el.dataset.odoDone) return;
    el.dataset.odoDone = "1";

    const text = (el.dataset.prefix || "") + el.dataset.odo + (el.dataset.suffix || "");
    const frozen = document.documentElement.classList.contains("no-anim");

    if(reduce || frozen){ el.textContent = text; return; }

    el.textContent = "";
    el.classList.add("odo");
    const strips = [];
    let col = 0;

    for(const ch of text){
      if(ch >= "0" && ch <= "9"){
        /* voltas extras crescem com a coluna, então os dígitos assentam em
           cascata da esquerda para a direita */
        const spins = 1 + col;
        const reps  = spins + 1;              /* 0-9 repetido o bastante p/ o destino caber */
        const total = reps * 10;

        const d = document.createElement("span");
        d.className = "odo-d";
        d.style.setProperty("--d", col);
        const strip = document.createElement("span");
        strip.className = "odo-strip";
        for(let r = 0; r < reps; r++){
          for(let n = 0; n <= 9; n++){
            const cell = document.createElement("span");
            cell.textContent = n;
            strip.appendChild(cell);
          }
        }
        d.appendChild(strip);
        el.appendChild(d);
        /* % é relativo à altura da própria tira, que varia com reps */
        strips.push({ strip, pct: -((+ch) + spins * 10) / total * 100 });
        col++;
      }else{
        const cell = document.createElement("span");
        cell.className = "odo-s";
        cell.textContent = ch;
        el.appendChild(cell);
      }
    }

    /* dois frames: garante que o estado inicial (translateY 0) foi pintado
       antes de a transição começar, senão o navegador funde os dois. */
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        strips.forEach(({strip, pct})=>{
          strip.style.transform = "translate3d(0," + pct + "%,0)";
        });
      });
    });
  }

  /* ---------- PARALLAX ---------- */
  const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
  let ticking = false;
  function applyParallax(){
    const vh = window.innerHeight;
    parallaxEls.forEach(el=>{
      const speed = parseFloat(el.dataset.parallax);
      const r = el.getBoundingClientRect();
      const center = r.top + r.height/2 - vh/2;
      el.style.setProperty("--py", (-center*speed).toFixed(1) + "px");
    });
    ticking = false;
  }
  if(!reduce && parallaxEls.length){
    window.addEventListener("scroll", ()=>{ if(!ticking){ requestAnimationFrame(applyParallax); ticking=true; } }, { passive:true });
    applyParallax();
  }

  /* ---------- HERO POINTER TILT ---------- */
  const tilt = document.querySelector("[data-tilt]");
  if(tilt && !reduce && window.matchMedia("(pointer:fine)").matches){
    const host = tilt.closest(".hero");
    host.addEventListener("mousemove", (ev)=>{
      const r = host.getBoundingClientRect();
      const dx = (ev.clientX - r.left)/r.width - .5;
      const dy = (ev.clientY - r.top)/r.height - .5;
      tilt.style.setProperty("--tx", (dx*16).toFixed(1)+"px");
      tilt.style.setProperty("--ty", (dy*16).toFixed(1)+"px");
    });
    host.addEventListener("mouseleave", ()=>{ tilt.style.setProperty("--tx","0px"); tilt.style.setProperty("--ty","0px"); });
  }

  /* ============================================================
     PARTICLE EMBERS  (canvas)
     ============================================================ */
  const canvas = document.getElementById("particles");
  if(canvas && !reduce){
    const ctx = canvas.getContext("2d");
    let w,h,dpr,parts=[],raf;
    let enabled = (window.__honorParticles !== false);

    function accent(){
      const c = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#F05A22";
      return c;
    }
    function hexToRgb(hex){
      hex = hex.replace("#","");
      if(hex.length===3) hex = hex.split("").map(x=>x+x).join("");
      const n = parseInt(hex,16);
      return [ (n>>16)&255, (n>>8)&255, n&255 ];
    }
    let rgb = hexToRgb(accent());

    function resize(){
      dpr = Math.min(window.devicePixelRatio||1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w*dpr; canvas.height = h*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function seed(){
      const count = Math.round(Math.min(110, (w*h)/12000));
      parts = Array.from({length:count}, ()=>spawn());
    }
    function spawn(){
      return {
        x: Math.random()*w,
        y: Math.random()*h,
        r: Math.random()*2.2 + .5,
        vx: (Math.random()-.5)*.18,
        vy: -(Math.random()*.45 + .12),
        a: Math.random()*.5 + .15,
        tw: Math.random()*Math.PI*2,
        tws: Math.random()*.03 + .008
      };
    }
    function frame(){
      ctx.clearRect(0,0,w,h);
      for(const p of parts){
        p.x += p.vx; p.y += p.vy; p.tw += p.tws;
        if(p.y < -10){ p.y = h+10; p.x = Math.random()*w; }
        if(p.x < -10) p.x = w+10; if(p.x > w+10) p.x = -10;
        const tw = (Math.sin(p.tw)*.4 + .6);
        const alpha = p.a * tw;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
        ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha*.8})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }
    function start(){ if(!raf){ resize(); seed(); frame(); } }
    function stop(){ cancelAnimationFrame(raf); raf=null; ctx&&ctx.clearRect(0,0,w,h); }

    window.addEventListener("resize", ()=>{ if(enabled){ resize(); seed(); } });
    // expose controls for Tweaks
    window.__honorSetParticles = (on)=>{ enabled=on; if(on) start(); else stop(); };
    window.__honorRefreshAccent = ()=>{ rgb = hexToRgb(accent()); };

    if(enabled) start();
  }

})();
