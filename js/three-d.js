/* =========================================================
   Mkurugenzi — 3D layer (add-on)
   Load after the page's own scripts. Touches nothing in the
   existing logic: it only reads the DOM and sets CSS variables
   or classes defined in css/three-d.css.

   1. Hero slideshow: pointer depth + scroll parallax
   2. Product cards / product photos: 3D tilt with glare
   3. November drop rail: coverflow as cards scroll past
   4. Sweatsuit picker: 3D flip on colourway change + scroll depth
   5. Footer: silk drape rendered with raw WebGL (no libraries)

   Every loop runs only while its element is on screen and the
   tab is visible. Nothing moves with "reduce motion" switched on.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (reduce.matches) { silk(true); return; } // still paint one static silk frame

  function onScreen(el, cb, margin) {
    var io = new IntersectionObserver(function (en) { cb(en[0].isIntersecting); }, { rootMargin: margin || "0px" });
    io.observe(el);
    return io;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- 1. Hero slideshow ---------- */
  (function hero() {
    var h = document.querySelector(".slideshow");
    if (!h) return;
    var visible = true, raf = 0, scrollT = 0;
    onScreen(h, function (v) { visible = v; });

    if (finePointer.matches) {
      h.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = h.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        h.style.setProperty("--mk3d-ry", (x * 4).toFixed(2) + "deg");
        h.style.setProperty("--mk3d-rx", (-y * 3).toFixed(2) + "deg");
        h.style.setProperty("--mk3d-cx", (x * -18).toFixed(1) + "px");
        h.style.setProperty("--mk3d-cy", (y * -12).toFixed(1) + "px");
      }, { passive: true });
      h.addEventListener("pointerleave", function () {
        ["--mk3d-ry", "--mk3d-rx", "--mk3d-cx", "--mk3d-cy"].forEach(function (k) { h.style.removeProperty(k); });
      });
    }
    function scroll() {
      raf = 0;
      var y = Math.max(0, window.scrollY);
      var hgt = h.offsetHeight || 1;
      if (y > hgt * 1.2) return;
      // background drifts slower than the page: reads as depth
      h.style.setProperty("--mk3d-sy", (y * 0.28).toFixed(1) + "px");
      h.classList.add("mk3d-scrolling");
      clearTimeout(scrollT);
      scrollT = setTimeout(function () { h.classList.remove("mk3d-scrolling"); }, 140);
    }
    window.addEventListener("scroll", function () { if (visible && !raf) raf = requestAnimationFrame(scroll); }, { passive: true });
    scroll();
  })();

  /* ---------- 2. Tilt (delegated, so cards rendered later work too) ---------- */
  (function tilt() {
    if (!finePointer.matches) return;
    var SEL = ".card__link, .pdp__gallery .media";
    var active = null, raf = 0, px = 0, py = 0;
    function apply() {
      raf = 0;
      if (!active || !active.isConnected) { active = null; return; }
      var r = active.getBoundingClientRect();
      var x = clamp((px - r.left) / r.width, 0, 1), y = clamp((py - r.top) / r.height, 0, 1);
      var big = r.width > 420; // large product photo tilts less
      active.style.setProperty("--mk3d-ty", ((x - 0.5) * (big ? 6 : 12)).toFixed(2) + "deg");
      active.style.setProperty("--mk3d-tx", ((0.5 - y) * (big ? 5 : 10)).toFixed(2) + "deg");
      active.style.setProperty("--mk3d-gx", (x * 100).toFixed(1) + "%");
      active.style.setProperty("--mk3d-gy", (y * 100).toFixed(1) + "%");
    }
    function release(el) {
      el.classList.remove("mk3d-tilting");
      el.style.removeProperty("--mk3d-tx");
      el.style.removeProperty("--mk3d-ty");
    }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var t = e.target.closest && e.target.closest(SEL);
      if (t !== active) {
        if (active) release(active);
        active = t;
        if (t) t.classList.add("mk3d-tilting");
      }
      px = e.clientX; py = e.clientY;
      if (active && !raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { if (active) release(active); active = null; });
    window.addEventListener("blur", function () { if (active) release(active); active = null; });
  })();

  /* ---------- 3. Rail coverflow ---------- */
  document.querySelectorAll(".rail").forEach(function (rail) {
    var raf = 0, visible = false;
    function update() {
      raf = 0;
      var r = rail.getBoundingClientRect();
      if (!r.width) return;
      var mid = r.left + r.width / 2, half = r.width / 2;
      var cards = rail.children;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i], cr = c.getBoundingClientRect();
        var d = (cr.left + cr.width / 2 - mid) / half;            // -1 … 1 across the rail
        var e = Math.sign(d) * Math.max(0, Math.abs(d) - 0.35) / 0.65; // flat in the middle
        e = clamp(e, -1.4, 1.4);
        c.style.setProperty("--mk3d-cf", (-e * 16).toFixed(2) + "deg");
        c.style.setProperty("--mk3d-cz", (-Math.abs(e) * 70).toFixed(1) + "px");
        c.style.setProperty("--mk3d-co", d < 0 ? "0%" : "100%"); // pivot on the outer edge so cards recede, never poke out
      }
    }
    function req() { if (visible && !raf) raf = requestAnimationFrame(update); }
    onScreen(rail, function (v) { visible = v; if (v) req(); }, "100px");
    rail.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req, { passive: true });
    new MutationObserver(req).observe(rail, { childList: true });
  });

  /* ---------- 4. Sweatsuit picker ---------- */
  (function picker() {
    var stage = document.getElementById("stage");
    if (!stage) return;
    var section = stage.closest(".picker") || stage;
    // flip whenever the page swaps in a new colourway
    new MutationObserver(function () {
      stage.classList.remove("mk3d-flip");
      void stage.offsetWidth; // restart the animation
      stage.classList.add("mk3d-flip");
    }).observe(stage, { childList: true });
    stage.addEventListener("animationend", function () { stage.classList.remove("mk3d-flip"); });

    var raf = 0, visible = false;
    function update() {
      raf = 0;
      var r = section.getBoundingClientRect();
      var p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1); // 0 entering → 1 leaving
      stage.style.setProperty("--mk3d-pr", ((p - 0.5) * -14).toFixed(2) + "deg");
    }
    onScreen(section, function (v) { visible = v; if (v && !raf) raf = requestAnimationFrame(update); });
    window.addEventListener("scroll", function () { if (visible && !raf) raf = requestAnimationFrame(update); }, { passive: true });
  })();

  /* ---------- 5. Footer silk ---------- */
  silk(false);

  function silk(still) {
    var footer = document.querySelector(".site-footer");
    if (!footer) {
      // footer is built by app.js; wait for it if this file loaded first
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { silk(still); });
      return;
    }
    var host = document.createElement("div");
    host.className = "mk3d-silk";
    host.setAttribute("aria-hidden", "true");
    var canvas = document.createElement("canvas");
    var small = window.matchMedia("(max-width: 760px)").matches;
    var gl = null;
    try { gl = canvas.getContext("webgl", { antialias: !small, alpha: true, premultipliedAlpha: true, depth: false, stencil: false }); } catch (e) {}
    if (!gl) return; // footer just stays its normal solid brown

    var VS = "attribute vec3 aP;attribute vec2 aU;uniform mat4 uM;uniform float uT;varying vec3 vN;varying vec2 vU;" +
      "float h(vec2 p){float t=uT;float z=sin(p.x*1.15+t*.55)*.34;z+=sin(p.y*1.7-t*.42+p.x*.6)*.22;z+=sin((p.x+p.y)*2.6+t*.9)*.07;z+=sin(p.x*4.1-t*1.1+sin(p.y*1.3))*.035;return z;}" +
      "void main(){vec3 p=aP;float z=h(p.xy);float e=.02;float zx=h(p.xy+vec2(e,0.))-z;float zy=h(p.xy+vec2(0.,e))-z;vN=normalize(vec3(-zx/e,-zy/e,1.));p.z+=z;vU=aU;gl_Position=uM*vec4(p,1.);}";
    var FS = "precision mediump float;uniform vec3 uD;uniform vec3 uMd;uniform vec3 uL;uniform vec3 uA;varying vec3 vN;varying vec2 vU;" +
      "void main(){vec3 n=normalize(vN);vec3 L=normalize(vec3(-.45,.6,.75));float df=clamp(dot(n,L),0.,1.);" +
      "float sp=pow(clamp(dot(n,normalize(L+vec3(0.,0.,1.))),0.,1.),38.);float rim=pow(1.-clamp(n.z,0.,1.),2.2);" +
      "vec3 c=mix(uD,uMd,smoothstep(.1,.8,df));c=mix(c,uL,smoothstep(.78,1.,df)*.45);c+=sp*uL*.18;c+=rim*uA*.22;gl_FragColor=vec4(c,1.);}";
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);

    var SX = small ? 60 : 110, SY = small ? 40 : 70, W = 14, H = 9;
    var v = new Float32Array((SX + 1) * (SY + 1) * 5), k = 0, i, j;
    for (j = 0; j <= SY; j++) for (i = 0; i <= SX; i++) { v[k++] = (i / SX - .5) * W; v[k++] = (.5 - j / SY) * H; v[k++] = 0; v[k++] = i / SX; v[k++] = 1 - j / SY; }
    var ix = new Uint16Array(SX * SY * 6); k = 0;
    for (j = 0; j < SY; j++) for (i = 0; i < SX; i++) { var a = j * (SX + 1) + i, b = a + 1, c = a + SX + 1, d = c + 1; ix[k++] = a; ix[k++] = c; ix[k++] = b; ix[k++] = b; ix[k++] = c; ix[k++] = d; }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ix, gl.STATIC_DRAW);
    var aP = gl.getAttribLocation(pr, "aP"), aU = gl.getAttribLocation(pr, "aU");
    gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(aU); gl.vertexAttribPointer(aU, 2, gl.FLOAT, false, 20, 12);
    var count = ix.length; v = ix = null;
    var U = {}; ["uM", "uT", "uD", "uMd", "uL", "uA"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

    function rgb(str) {
      var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(str || "");
      return m ? [m[1] / 255, m[2] / 255, m[3] / 255] : [.17, .1, .07];
    }
    function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    function colours() {
      var deep = rgb(getComputedStyle(footer).backgroundColor); // follows the footer in light and dark mode
      gl.uniform3fv(U.uD, deep);
      gl.uniform3fv(U.uMd, hex("#4a2e20"));   // walnut
      gl.uniform3fv(U.uL, hex("#dcb36a"));    // brass soft
      gl.uniform3fv(U.uA, hex("#c8963e"));    // brass
      gl.clearColor(deep[0], deep[1], deep[2], 1);
    }
    colours();

    function mul(a, b) { var o = new Float32Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }
    function persp(f, as, n, fr) { var t = 1 / Math.tan(f * Math.PI / 360), nf = 1 / (n - fr); return new Float32Array([t / as, 0, 0, 0, 0, t, 0, 0, 0, 0, (fr + n) * nf, -1, 0, 0, 2 * fr * n * nf, 0]); }
    function rx(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
    function rz(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
    var model = mul(rz(.12), rx(-.32));
    var maxDpr = small || (navigator.hardwareConcurrency || 4) <= 4 ? 1 : 1.5;

    var running = false, raf = 0, last = 0, time = 4, visible = false, lost = false;
    function draw() { gl.uniform1f(U.uT, time); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0); }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      var w = Math.max(1, footer.clientWidth), hh = Math.max(1, footer.clientHeight);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(hh * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      var as = w / hh;
      var t = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, as < 1 ? -9 : -6.2, 1];
      gl.uniformMatrix4fv(U.uM, false, mul(persp(38, as, .1, 50), mul(new Float32Array(t), model)));
      if (!running) draw();
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      time += Math.min((t - last) / 1000, .05) || .016; last = t;
      draw();
    }
    function play() { if (still || running || lost || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function pause() { running = false; cancelAnimationFrame(raf); }

    host.appendChild(canvas);
    footer.insertBefore(host, footer.firstChild);
    var rq = 0;
    new ResizeObserver(function () { cancelAnimationFrame(rq); rq = requestAnimationFrame(resize); }).observe(footer);
    onScreen(footer, function (vis) { visible = vis; vis ? play() : pause(); if (vis) clipUnderHeader(); });
    // Trim whatever part of the canvas sits under the sticky header. Chrome can
    // otherwise drop a matching strip at the bottom of a partly covered WebGL layer.
    var header = document.querySelector(".site-header"), clipRaf = 0, lastClip = -1;
    function clipUnderHeader() {
      clipRaf = 0;
      if (!header) return;
      var hb = header.getBoundingClientRect().bottom, ft = footer.getBoundingClientRect().top;
      var cut = Math.max(0, Math.ceil(hb - ft));
      if (cut === lastClip) return;
      lastClip = cut;
      host.style.clipPath = cut ? "inset(" + cut + "px 0 0 0)" : "";
    }
    window.addEventListener("scroll", function () { if (visible && !clipRaf) clipRaf = requestAnimationFrame(clipUnderHeader); }, { passive: true });
    window.addEventListener("resize", function () { if (!clipRaf) clipRaf = requestAnimationFrame(clipUnderHeader); }, { passive: true });
    document.addEventListener("visibilitychange", function () { document.hidden ? pause() : play(); });
    // follow the theme toggle (app.js flips <html data-theme>)
    new MutationObserver(function () { if (!lost) { colours(); if (!running) draw(); } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); lost = true; pause(); host.remove(); });

    resize(); draw();
    requestAnimationFrame(function () { host.classList.add("is-ready"); });
  }
})();
