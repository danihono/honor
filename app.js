/* ============================================================
   HONOR — interactions
   particle embers · parallax · scroll-reveal · counters · nav
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
  const revealEls = [...document.querySelectorAll(".reveal, .wire, [data-count]")];
  function checkReveal(){
    const vh = window.innerHeight;
    for(let i=revealEls.length-1; i>=0; i--){
      const el = revealEls[i];
      const r = el.getBoundingClientRect();
      if(r.top < vh*0.92 && r.bottom > 0){
        el.classList.add("in");
        if(el.dataset.count) animateCount(el);
        revealEls.splice(i,1);
      }
    }
  }
  window.addEventListener("scroll", checkReveal, { passive:true });
  window.addEventListener("resize", checkReveal);
  requestAnimationFrame(()=>{ checkReveal(); requestAnimationFrame(checkReveal); });
  window.addEventListener("load", checkReveal);

  /* ---------- COUNTERS ---------- */
  function animateCount(el){
    if(reduce){ el.textContent = el.dataset.prefix||"" ; finalize(); return; }
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const dur = 1400; const t0 = performance.now();
    function tick(t){
      const p = Math.min(1,(t-t0)/dur);
      const e = 1-Math.pow(1-p,3);
      el.textContent = prefix + Math.round(target*e) + suffix;
      if(p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    function finalize(){ el.textContent = prefix+target+suffix; }
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

  /* ============================================================
     EMBER FIELD  — stats section (orange particles rising, dense at base)
     ============================================================ */
  const emberCv = document.querySelector(".ember-canvas");
  if(emberCv && !reduce){
    const ctx = emberCv.getContext("2d");
    let w,h,dpr,parts=[],raf=null;
    function resize(){
      dpr = Math.min(window.devicePixelRatio||1, 2);
      w = emberCv.clientWidth; h = emberCv.clientHeight;
      emberCv.width = w*dpr; emberCv.height = h*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function spawn(reset){
      const p = {
        x: Math.random()*w,
        y: h*(0.55 + Math.random()*0.6),
        r: Math.random()*2.8 + 0.6,
        vx: (Math.random()-0.5)*0.3,
        vy: -(Math.random()*0.8 + 0.2),
        max: 110 + Math.random()*150,
        a: Math.random()*0.6 + 0.3,
        hue: 16 + Math.random()*28
      };
      p.life = reset ? 0 : Math.random()*p.max;
      return p;
    }
    function seed(){
      const n = Math.round(Math.min(320, (w*h)/4200));
      parts = Array.from({length:n}, ()=>spawn(false));
    }
    function frame(){
      ctx.clearRect(0,0,w,h);
      const grad = ctx.createRadialGradient(w*0.5, h*1.02, 0, w*0.5, h*1.02, h*0.95);
      grad.addColorStop(0, "rgba(240,90,34,0.34)");
      grad.addColorStop(0.5, "rgba(200,65,15,0.14)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation = "lighter";
      for(const p of parts){
        p.x += p.vx; p.y += p.vy; p.life++;
        if(p.life >= p.max || p.y < -14){ Object.assign(p, spawn(true)); }
        const lr = p.life/p.max;
        const fade = Math.sin(Math.min(1,lr)*Math.PI) * p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `hsla(${p.hue},100%,60%,${fade})`;
        ctx.shadowBlur = 14; ctx.shadowColor = `hsla(${p.hue},100%,54%,${fade})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    }
    function start(){ if(!raf){ resize(); seed(); frame(); } }
    function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; ctx.clearRect(0,0,w,h); } }
    window.addEventListener("resize", ()=>{ if(raf){ resize(); seed(); } });

    if("IntersectionObserver" in window){
      const io = new IntersectionObserver((ents)=>{
        ents.forEach(e=> e.isIntersecting ? start() : stop());
      }, { threshold:0.08 });
      io.observe(emberCv);
    } else { start(); }
  }
})();
