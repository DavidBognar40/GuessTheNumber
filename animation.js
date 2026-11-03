/* Alles, was sich bewegt: Keyframes, Pixel-Emoji, Tipp-Effekt, Partikel, Zahlen-Zoom */
window.Anim = (() => {
  const $ = s => document.querySelector(s);
  const face = $('#face'), ctx = face.getContext('2d'),
        say = $('#say'), verdict = $('#verdict'),
        fx = $('#fx'), fctx = fx.getContext('2d');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- CSS-Keyframes ---------- */
  const css = document.createElement('style');
  css.textContent = `
    body.shake main{animation:shake .4s steps(1)}
    @keyframes shake{0%{transform:translate(-8px,0)}20%{transform:translate(8px,-4px)}40%{transform:translate(-6px,4px)}60%{transform:translate(6px,0)}80%{transform:translate(-3px,-2px)}100%{transform:none}}

    .face.laugh{animation:jig .36s steps(1) infinite}
    .face.annoyed{animation:sway 1.6s steps(1) infinite}
    @keyframes jig{0%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes sway{0%{transform:translateX(0)}50%{transform:translateX(-6px)}}

    .verdict.pop{animation:pop .5s steps(5)}
    @keyframes pop{0%{transform:scale(2.2);opacity:0}60%{transform:scale(.9);opacity:1}100%{transform:scale(1)}}

    .bump strong{animation:bump .5s steps(4)}
    @keyframes bump{0%{transform:scale(1)}50%{transform:scale(1.35)}100%{transform:scale(1)}}

    .slot.locked .tile{animation:lock .24s steps(1) infinite}
    @keyframes lock{50%{background:var(--yellow);--c:var(--yellow)}}

    @media (prefers-reduced-motion:reduce){
      *{animation-duration:.01ms!important;transition-duration:.01ms!important}
    }`;
  document.head.append(css);

  /* ---------- Pixel-Emoji (16x16) ---------- */
  const COL = { k: '#2a1500', w: '#ffffff', b: '#59c8ff', r: '#ff3b3b', p: '#ff7a9c' };
  const LAYERS = {
    idle:   { 5: '....kk....kk....', 6: '....kk....kk....', 10: '....k......k....', 11: '.....kkkkkk.....' },
    laughA: { 5: '...k........k...', 6: '....kk....kk....', 7: '...k........k...', 8: '..b..........b..',
              9: '...kkkkkkkkkk...', 10: '...kwwwwwwwwk...', 11: '....kppppppk....', 12: '.....kkkkkk.....' },
    laughB: { 5: '...k........k...', 6: '....kk....kk....', 7: '...k........k...',
              9: '..bkkkkkkkkkkb..', 10: '...kwwwwwwwwk...', 11: '....kkkkkkkk....' },
    annoyed:{ 5: '...kkkk...kkkk..', 6: '....kk....kk....', 11: '.....kkkkkk.....', 12: '....k......k....' },
    vein:   { 2: '...........r.r..', 3: '............r...', 4: '...........r.r..' }
  };
  let mood = 'idle', frame = 0;

  function drawFace() {
    const annoyed = mood === 'annoyed';
    const body  = annoyed ? '#ff9b3d' : '#ffd23f',
          edge  = annoyed ? '#b5560f' : '#c98900',
          shine = annoyed ? '#ffc58a' : '#fff0a0';
    ctx.clearRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d > 7.6) continue;
      ctx.fillStyle = d > 6.3 ? edge : body;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.fillStyle = shine;
    [[4, 2], [5, 2], [3, 3]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));

    const layers = mood === 'laugh' ? [frame ? LAYERS.laughB : LAYERS.laughA]
                 : annoyed ? [LAYERS.annoyed].concat(frame ? [] : [LAYERS.vein])
                 : [LAYERS.idle];
    layers.forEach(L => Object.entries(L).forEach(([y, row]) => [...row].forEach((c, x) => {
      if (c === '.') return;
      ctx.fillStyle = COL[c];
      ctx.fillRect(x, +y, 1, 1);
    })));
  }
  function setMood(m) { mood = m; face.className = 'face ' + m; drawFace(); }
  setInterval(() => { frame ^= 1; drawFace(); }, 240);

  /* ---------- Sprechblase: Tipp-Effekt ---------- */
  let typer;
  function speak(text) {
    clearInterval(typer);
    say.textContent = '';
    let i = 0;
    typer = setInterval(() => {
      say.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typer);
    }, 24);
  }

  /* ---------- "RICHTIG!" / "FALSCH!" ---------- */
  function showVerdict(text, ok) {
    verdict.className = 'verdict ' + (ok ? 'ok' : 'no');
    verdict.textContent = text;
    void verdict.offsetWidth;
    verdict.classList.add('pop');
  }

  /* ---------- Zahlen-Zoom (Hover-Effekt) ---------- */
  function magnify(slot, w) {
    const t = slot.firstElementChild;
    t.style.setProperty('--s', (1 + 0.55 * w).toFixed(3));
    t.style.setProperty('--y', (-16 * w).toFixed(1) + 'px');
    slot.style.zIndex = Math.round(w * 10);
  }
  function resetMagnify(slots, keep) { slots.forEach(s => { if (s !== keep) magnify(s, 0); }); }
  function bindMagnify(axis, slots, isBusy) {
    axis.addEventListener('pointermove', e => {
      if (isBusy() || calm || e.pointerType === 'touch') return;
      slots.forEach(s => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width / 2));
        magnify(s, Math.exp(-((d / (r.width * 1.1)) ** 2)));
      });
    });
    axis.addEventListener('pointerleave', () => { if (!isBusy()) resetMagnify(slots); });
  }

  /* ---------- Pixel-Partikel ---------- */
  let parts = [], raf = 0;
  function resize() {
    const d = devicePixelRatio || 1;
    fx.width = innerWidth * d;
    fx.height = innerHeight * d;
    fctx.setTransform(d, 0, 0, d, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  function burst(x, y, good) {
    const n = (good ? 150 : 80) * (calm ? 0.3 : 1);
    const cols = good ? ['#3ef2b0', '#ffd23f', '#ffffff', '#7a5cff']
                      : ['#ff4f7b', '#ff8aa5', '#5a1530', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = good ? rand(-Math.PI * 0.95, -Math.PI * 0.05) : rand(0, Math.PI * 2);
      const v = good ? rand(4, 13) : rand(2, 8);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: good ? 0.28 : 0.35,
                   s: pick([6, 8, 8, 12]), life: rand(60, 110), age: 0, c: pick(cols) });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.age++ < p.life);
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.985;
      const s = Math.max(2, Math.round(p.s * (1 - p.age / p.life) / 2) * 2);
      fctx.fillStyle = p.c;
      fctx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, s, s);
    });
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) fctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  /* ---------- Screen-Shake + HUD-Bump ---------- */
  function shake() {
    if (calm) return;
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 420);
  }
  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  return { setMood, speak, verdict: showVerdict, magnify, resetMagnify, bindMagnify, burst, shake, bump };
})();