/* ============================================================
   HONOR — orbes de vidro 3D (seção "A Honor em números")
   Um único canvas WebGL cobre a .orb-row. As esferas são posicionadas
   a partir do layout do DOM (getBoundingClientRect), então o grid
   responsivo do CSS continua mandando; o WebGL só desenha por cima.
   O número vive num plano DENTRO da esfera: o vidro (MeshPhysicalMaterial
   com transmission) refrata o número de verdade, como uma lente.
   Three.js é carregado só quando a seção se aproxima da tela.
   Sem WebGL / reduced-motion: fica o orbe CSS original (fallback).
   ============================================================ */
(async function(){
  "use strict";

  const section = document.querySelector(".numbers");
  const row     = section && section.querySelector(".orb-row");
  const items   = row ? [...row.querySelectorAll(".orb-item")] : [];
  if(!row || !items.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hasWebGL(){
    try{
      const c = document.createElement("canvas");
      return !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
    }catch(e){ return false; }
  }
  if(reduce || !hasWebGL()) return;

  // espera a seção chegar perto da tela antes de baixar ~200 KB de three.js
  await new Promise(res=>{
    if(!("IntersectionObserver" in window)) return res();
    const io = new IntersectionObserver(es=>{
      if(es.some(e=>e.isIntersecting)){ io.disconnect(); res(); }
    }, { rootMargin:"700px 0px" });
    io.observe(row);
  });

  let THREE, RoomEnvironment;
  try{
    THREE = await import("./assets/vendor/three.module.min.js");
    ({ RoomEnvironment } = await import("./assets/vendor/RoomEnvironment.js"));
  }catch(e){ return; }

  const targets = items.map(li=>{
    const n = li.querySelector(".orb-num");
    return { value:+n.dataset.odo, prefix:n.dataset.prefix || "", suffix:n.dataset.suffix || "" };
  });

  /* ---------- renderer ---------- */
  const canvas = document.createElement("canvas");
  canvas.className = "orb-gl";
  canvas.setAttribute("aria-hidden", "true");
  row.appendChild(canvas);

  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:"high-performance" });
  }catch(e){ canvas.remove(); return; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const BG = new THREE.Color(0x0c0a09);
  renderer.setClearColor(BG, 1);

  const scene = new THREE.Scene();
  scene.background = BG;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const cam = new THREE.OrthographicCamera(0, 1, 1, 0, -2000, 2000);
  cam.position.z = 600;

  /* luzes: faixa quente por baixo + catchlight frio no alto à esquerda */
  const warm = new THREE.DirectionalLight(0xff7a3c, 5); warm.position.set(260, -320, 300); scene.add(warm);
  const cool = new THREE.DirectionalLight(0xffffff, 2.2); cool.position.set(-300, 340, 400); scene.add(cool);
  const rim  = new THREE.PointLight(0xff5a1f, 5e5, 0, 2); rim.position.set(0, 0, -240); scene.add(rim);

  /* ---------- textura do número ---------- */
  const TEX = 512;
  function makeNumberTex(){
    const c = document.createElement("canvas"); c.width = c.height = TEX;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { c, ctx:c.getContext("2d"), tex, last:"" };
  }
  function drawNumber(n, text){
    if(n.last === text) return;
    n.last = text;
    const { ctx } = n;
    // fundo OPACO: o pass de transmissão do three só enxerga objetos opacos,
    // então o disco leva o brilho quente embutido e termina na cor da seção
    const bg = ctx.createRadialGradient(TEX/2, TEX/2, 0, TEX/2, TEX/2, TEX/2);
    bg.addColorStop(0, "#5a220c"); bg.addColorStop(.55, "#2a1007"); bg.addColorStop(1, "#0c0a09");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, TEX, TEX);
    ctx.font = '600 ' + (text.length > 3 ? 135 : 158) + 'px Newsreader, Georgia, serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const y = TEX * 0.53;
    ctx.shadowColor = "rgba(255,110,40,.95)"; ctx.shadowBlur = 46;
    ctx.fillStyle = "#ff6a2a"; ctx.fillText(text, TEX/2, y);
    ctx.shadowBlur = 16; ctx.fillText(text, TEX/2, y);
    ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(0, y - 120, 0, y + 120);
    g.addColorStop(0, "#fff1de"); g.addColorStop(.55, "#ffb27a"); g.addColorStop(1, "#ff7a3c");
    ctx.fillStyle = g; ctx.fillText(text, TEX/2, y);
    n.tex.needsUpdate = true;
  }
  try{ await document.fonts.load('600 200px Newsreader'); }catch(e){}

  /* ---------- esferas ---------- */
  const sphereGeo = new THREE.SphereGeometry(1, 96, 64);
  const planeGeo  = new THREE.CircleGeometry(1, 64);
  const glass = new THREE.MeshPhysicalMaterial({
    color:0xffffff, metalness:0, roughness:0.04,
    transmission:1, thickness:0.5, ior:1.38,   // thickness é multiplicado pela escala do mesh (raio)
    attenuationColor:new THREE.Color(0xff7a3c), attenuationDistance:260,
    clearcoat:1, clearcoatRoughness:0.02,
    specularIntensity:1, envMapIntensity:2.2,
  });

  const orbs = items.map((li, i)=>{
    const group = new THREE.Group();
    const sphere = new THREE.Mesh(sphereGeo, glass);
    const num = makeNumberTex();
    const plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map:num.tex, toneMapped:false }));
    group.add(plane, sphere);
    scene.add(group);
    return { group, sphere, plane, num, li, el:li.querySelector(".orb"), phase:i * 1.7, text:"" };
  });

  /* fio de luz atravessando os orbes (vira a trilha que o SVG fazia) */
  const wireMat  = new THREE.MeshBasicMaterial({ color:0xff7a3c, toneMapped:false });
  const wireGlow = new THREE.MeshBasicMaterial({ color:0xff5a1f, transparent:true, opacity:.22, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false });
  let wire = null, wireHalo = null;

  function buildWire(centers, r){
    [wire, wireHalo].forEach(m=>{ if(m){ scene.remove(m); m.geometry.dispose(); } });
    wire = wireHalo = null;
    if(centers.length < 2 || Math.abs(centers[0].y - centers[centers.length-1].y) > 4) return; // só em linha única
    const pts = [];
    centers.forEach((c, i)=>{
      pts.push(new THREE.Vector3(c.x, c.y, -r * 0.9));
      if(i < centers.length - 1){
        const n = centers[i+1], mx = (c.x + n.x) / 2, dir = i % 2 ? 1 : -1;
        pts.push(new THREE.Vector3(mx, c.y + dir * r * 0.55, -r * 0.9));
      }
    });
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    wire     = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 1.4, 6), wireMat);
    wireHalo = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 7, 6),   wireGlow);
    wire.renderOrder = wireHalo.renderOrder = -1;
    scene.add(wire, wireHalo);
  }

  /* ---------- layout a partir do DOM ---------- */
  let W = 0, H = 0, R = 90;
  function layout(){
    const rr = row.getBoundingClientRect();
    W = Math.max(1, Math.round(rr.width)); H = Math.max(1, Math.round(rr.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    cam.left = 0; cam.right = W; cam.top = H; cam.bottom = 0;   // y para cima, origem embaixo
    cam.updateProjectionMatrix();

    const centers = [];
    // offsetLeft/Top ignoram o transform do .reveal (rects mediriam o orbe no meio da animação)
    const offsetIn = el=>{ let x = 0, y = 0; for(let n = el; n && n !== row; n = n.offsetParent){ x += n.offsetLeft; y += n.offsetTop; } return { x, y }; };
    orbs.forEach(o=>{
      const r = o.el.offsetWidth / 2, pos = offsetIn(o.el);
      R = r;
      o.base = { x:pos.x + r, y:H - (pos.y + r), r };
      centers.push(o.base);
      o.sphere.scale.setScalar(r);
      o.plane.scale.set(r * 1.05, r * 1.05, 1);
    });
    glass.attenuationDistance = R * 2.8;
    rim.position.z = -R * 2.6;
    buildWire(centers, R);
  }

  /* ---------- animação ---------- */
  const mouse = { x:0, y:0, tx:0, ty:0 };
  window.addEventListener("pointermove", e=>{
    const rr = row.getBoundingClientRect();
    mouse.tx = ((e.clientX - rr.left) / rr.width - .5) * 2;
    mouse.ty = ((e.clientY - rr.top) / rr.height - .5) * -2;
  }, { passive:true });

  const ease = t => 1 - Math.pow(1 - t, 3);
  let countStart = null, visible = false, raf = 0;

  function frame(now){
    raf = visible ? requestAnimationFrame(frame) : 0;
    const t = now / 1000;
    mouse.x += (mouse.tx - mouse.x) * .06; mouse.y += (mouse.ty - mouse.y) * .06;

    if(countStart === null) countStart = now;
    const k = ease(Math.min(1, (now - countStart - 250) / 1700));

    orbs.forEach((o, i)=>{
      const b = o.base; if(!b) return;
      const tg = targets[i];
      const text = tg.prefix + Math.round(tg.value * Math.max(0, k)) + tg.suffix;
      drawNumber(o.num, text);
      const bob = Math.sin(t * .9 + o.phase) * b.r * .045;
      o.group.position.set(b.x, b.y + bob, 0);
      o.group.rotation.set(-mouse.y * .35, mouse.x * .35, 0);   // inclina: número e reflexos "andam" no vidro
      o.plane.position.z = -b.r * .05;
    });
    warm.position.x = 260 + mouse.x * 220; cool.position.x = -300 + mouse.x * 160; cool.position.y = 340 + mouse.y * 120;
    renderer.render(scene, cam);
  }

  layout();
  section.classList.add("numbers--3d");
  new ResizeObserver(layout).observe(row);
  document.fonts && document.fonts.ready.then(layout);

  new IntersectionObserver(es=>{
    visible = es[0].isIntersecting;
    if(visible){ if(!raf) raf = requestAnimationFrame(frame); }
  }, { threshold:0 }).observe(row);
})();
