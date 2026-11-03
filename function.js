(() => {
  const $ = s => document.querySelector(s);
  const axis = $('#axis'), verdict = $('#verdict'),
        bestEl = $('#best'), streakEl = $('#streak'),
        bestBlock = $('#bestBlock'), streakBlock = $('#streakBlock');
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- Spielstand ---------- */
  const KEY = 'zahlenraten-v1';
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } })();
  const state = {
    secret: Math.ceil(Math.random() * 10),
    tried: new Set(),
    busy: false,
    best: saved.best | 0,     // Highscore: meiste Fehlversuche in Folge
    streak: saved.streak | 0  // aktuelle Serie nicht erraten
  };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ best: state.best, streak: state.streak })); } catch {}
  };

  function renderHud(bumpWhich) {
    bestEl.textContent = state.best;
    streakEl.textContent = state.streak;
    streakBlock.classList.toggle('hot', state.streak > 0);
    if (bumpWhich) Anim.bump(bumpWhich === 'best' ? bestBlock : streakBlock);
  }

  /* ---------- Texte ---------- */
  const mock = n => pick([
    `HAHAHA! Die ${n}? Im Ernst?`,
    `Die ${n}! Nein. Einfach nein. Hahaha!`,
    `Das war so falsch, dass es fast schon weh tut.`,
    `Ich lach mich schlapp. Versuch’s nochmal!`,
    `${n}? Mutig. Falsch, aber mutig. HAHA!`,
    `Mein Mitleid hält sich in Grenzen. HAHAHA!`,
    `Knapp daneben ist auch vorbei. Hihihi!`
  ]);
  const annoyedText = fails => fails === 0
    ? 'Beim ersten Versuch?! Das war Zufall. Nur Zufall.'
    : pick([
        `Na endlich. ${fails} Versuche für eine Zahl bis 10…`,
        `Ja ja. Glück gehabt. Freu dich nicht zu früh.`,
        `Boah. Ich bin so genervt. Nochmal?`,
        `Tolle Leistung. ${fails} Fehlversuche. Ich klatsche nicht.`
      ]);

  /* ---------- Skala aufbauen ---------- */
  const slots = [];
  for (let n = 1; n <= 10; n++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    b.dataset.n = n;
    b.setAttribute('aria-label', `Zahl ${n} wählen`);
    b.innerHTML = `<span class="tile">${n}</span><span class="tick"></span>`;
    b.addEventListener('click', () => guess(n));
    axis.append(b);
    slots.push(b);
  }
  Anim.bindMagnify(axis, slots, () => state.busy);

  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) guess(e.key === '0' ? 10 : +e.key);
  });

  /* ---------- Spiellogik ---------- */
  function guess(n) {
    if (state.busy || state.tried.has(n)) return;
    state.busy = true;
    axis.classList.add('busy');
    const slot = slots[n - 1];
    Anim.resetMagnify(slots, slot);
    Anim.magnify(slot, 1);            // Zahl wird eingelockt
    slot.classList.add('locked');
    verdict.textContent = '';
    setTimeout(() => reveal(n, slot), 650);
  }

  function reveal(n, slot) {
    const r = slot.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height * 0.3;
    slot.classList.remove('locked');

    if (n === state.secret) {
      // RICHTIG: Highscore prüfen, Serie zurücksetzen, Emoji genervt
      const fails = state.streak;
      const record = fails > state.best;
      if (record) state.best = fails;
      state.streak = 0;
      save();
      slot.classList.add('win');
      Anim.verdict('RICHTIG!', true);
      Anim.setMood('annoyed');
      Anim.speak(annoyedText(fails) + (record ? ' Neuer Highscore, übrigens.' : ''));
      Anim.burst(x, y, true);
      renderHud(record ? 'best' : 'streak');
      setTimeout(newRound, 3200);
    } else {
      // FALSCH: Serie +1, Zahl sperren, Emoji lacht
      state.streak++;
      state.tried.add(n);
      save();
      slot.classList.add('dead');
      slot.disabled = true;
      slot.firstElementChild.textContent = 'X';
      Anim.verdict('FALSCH!', false);
      Anim.setMood('laugh');
      Anim.speak(mock(n));
      Anim.burst(x, y, false);
      Anim.shake();
      renderHud('streak');
      setTimeout(() => {
        Anim.resetMagnify(slots);
        state.busy = false;
        axis.classList.remove('busy');
      }, 700);
    }
  }

  function newRound() {
    state.secret = Math.ceil(Math.random() * 10);
    state.tried.clear();
    slots.forEach((s, i) => {
      s.className = 'slot';
      s.disabled = false;
      s.firstElementChild.textContent = i + 1;
    });
    Anim.resetMagnify(slots);
    verdict.textContent = '';
    state.busy = false;
    axis.classList.remove('busy');
    Anim.speak('Neue Zahl, neues Glück. Ich freu mich schon aufs Lachen.');
  }

  /* ---------- Start ---------- */
  Anim.setMood('idle');
  renderHud();
  Anim.speak('Ich denke an eine Zahl. Viel Spaß beim Scheitern.');
})();