/* ============================================================
   HONOR — liquid-gold nav: sliding ring + scroll-spy + hover
   ============================================================ */
(function(){
  "use strict";
  const linksWrap = document.getElementById("navLinks");
  if(!linksWrap) return;
  const ring  = linksWrap.querySelector(".nav-ring");
  const links = [...linksWrap.querySelectorAll("a")];
  let activeIndex = 0;
  let hovering = false;

  function place(el){
    if(!el){ ring.classList.remove("on"); return; }
    ring.classList.add("on");
    ring.style.width  = el.offsetWidth + "px";
    ring.style.height = el.offsetHeight + "px";
    ring.style.transform = "translate(" + el.offsetLeft + "px," + el.offsetTop + "px)";
  }

  function setActive(i){
    activeIndex = i;
    links.forEach((a, idx)=> a.classList.toggle("is-active", idx === i));
    if(!hovering) place(links[i]);
  }

  links.forEach(a=>{
    a.addEventListener("mouseenter", ()=>{ hovering = true; place(a); });
  });
  linksWrap.addEventListener("mouseleave", ()=>{ hovering = false; place(links[activeIndex]); });

  function spy(){
    hovering = false;
    let idx = 0;
    const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 6);
    if(atBottom){
      idx = links.length - 1;
    } else {
      const mid = window.scrollY + window.innerHeight * 0.32;
      links.forEach((a, i)=>{
        const sec = document.querySelector(a.getAttribute("href"));
        if(sec && sec.offsetTop <= mid) idx = i;
      });
    }
    if(idx !== activeIndex) setActive(idx);
    else place(links[activeIndex]);
  }

  window.addEventListener("scroll", spy, { passive:true });
  window.addEventListener("resize", ()=>{ if(!hovering) place(links[activeIndex]); });
  window.addEventListener("load", ()=> place(links[activeIndex]));

  requestAnimationFrame(()=>{ setActive(0); spy(); });
})();
