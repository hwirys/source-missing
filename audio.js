/* ─────────────────────────────────────────────────────────────
 * audio.js — Web Audio 합성 사운드
 *
 * 기본값은 전부 브라우저에서 합성한 노이즈/글리치다.
 * 허가받은 실제 소재가 있으면 assets/ 아래에 두면 자동 사용된다.
 *   assets/roomtone.mp3        — 방송 대기 룸톤 루프
 *   assets/voice/<이름>.mp3    — 재합성 음성 조각 (예: 고마워.mp3)
 * ───────────────────────────────────────────────────────────── */

const AUDIO = (() => {
  let ctx = null;
  let master = null;
  let roomGain = null;
  let roomEl = null;
  let started = false;
  let silenceUntil = 0;
  let silenceTimer = 0;
  let lastHoverSoundAt = 0;
  const activeVoiceEls = new Set();

  function init() {
    if (started) {
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      return;
    }
    started = true;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      ctx = new AudioContextClass();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
    }
    startRoomTone();
  }

  function noiseBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* 방송 대기 공기감: 저역 필터 노이즈 루프 (파일 있으면 파일 우선) */
  function startRoomTone() {
    roomEl = new Audio("assets/roomtone.mp3");
    roomEl.loop = true;
    roomEl.volume = 0.25;
    roomEl._base = 0.25;
    let fallbackStarted = false;
    const fallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      roomEl = null;
      synthRoomTone();
    };
    roomEl.play().then(() => {}).catch(fallback);
    roomEl.onerror = fallback;
  }

  function synthRoomTone() {
    if (!ctx || roomGain) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 240;
    roomGain = ctx.createGain();
    roomGain.gain.value = 0.06;
    src.connect(lp).connect(roomGain).connect(master);
    src.start();
    // 아주 느린 호흡감
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain).connect(roomGain.gain);
    lfo.start();
  }

  /* 채팅 도착: 알림음의 잔해 같은 짧은 톤 */
  function tick() {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 660 + Math.random() * 120;
    g.gain.setValueAtTime(0.03, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    o.connect(g).connect(master);
    o.start();
    o.stop(ctx.currentTime + 0.09);
  }

  /* 글리치: 짧은 노이즈 버스트 + 떨어지는 톤 */
  function glitch(strength = 1) {
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.15);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 800 + Math.random() * 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12 * strength, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    src.connect(bp).connect(g).connect(master);
    src.start();

    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(420, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.18);
    og.gain.setValueAtTime(0.05 * strength, ctx.currentTime);
    og.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    o.connect(og).connect(master);
    o.start();
    o.stop(ctx.currentTime + 0.22);
  }

  /* AI 음성은 전용 파일을 우선 사용하고, 실시간으로 좁은 공진 대역·45ms
   * 이중 음성·27Hz 진폭 떨림을 더한다. _ai 파일이 없으면 원본 조각을
   * 같은 처리 체인에 통과시켜 음성이 사라지지 않게 한다. */
  const AI_VOICE_ASSETS = new Set(["고마워", "기다려", "보고", "아", "아직", "언니"]);

  function voice(text, vol = 0.8, rate = 1, ai = false) {
    const clean = text.replace(/\.+$/, "");
    const aiUrl = `assets/voice/${encodeURIComponent(clean + "_ai")}.mp3`;
    const baseUrl = `assets/voice/${encodeURIComponent(clean)}.mp3`;
    const el = new Audio();
    el.volume = ctx && master ? 1 : vol;
    el.playbackRate = rate;
    // 느리게 재생해도 음정(여성 음색)은 유지 — 남성처럼 내려가지 않게
    el.preservesPitch = true;
    el.mozPreservesPitch = true;
    el.webkitPreservesPitch = true;

    const cleanup = routeVoice(el, vol, ai);
    el._voiceCleanup = cleanup;
    activeVoiceEls.add(el);
    let fallbackStarted = false;
    let attempt = 0;
    const finalFallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      activeVoiceEls.delete(el);
      cleanup();
      synthVoiceFragment(text.length, ai);
    };
    el.onended = () => { activeVoiceEls.delete(el); cleanup(); };
    const playAttempt = (url, retryingBase) => {
      const currentAttempt = ++attempt;
      el.src = url;
      if (el.load) el.load();
      el.play()
        .then(() => { if (ai) synthAIVoiceTexture(text.length, vol); })
        .catch(() => {
          if (currentAttempt !== attempt) return;
          if (ai && !retryingBase) playAttempt(baseUrl, true);
          else finalFallback();
        });
    };
    const hasAIAsset = ai && AI_VOICE_ASSETS.has(clean);
    playAttempt(hasAIAsset ? aiUrl : baseUrl, !hasAIAsset);
  }

  function routeVoice(el, vol, ai) {
    if (!ctx || !master || !ctx.createMediaElementSource) return () => {};
    try {
      const src = ctx.createMediaElementSource(el);
      const out = ctx.createGain();
      out.gain.value = vol;

      if (!ai) {
        src.connect(out).connect(master);
        return () => {};
      }

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 110;
      const formant = ctx.createBiquadFilter();
      formant.type = "peaking";
      formant.frequency.value = 1450;
      formant.Q.value = 5.5;
      formant.gain.value = 7;
      src.connect(highpass).connect(formant).connect(out).connect(master);

      // 아주 짧게 늦은 동일 음성이 금속성 이중 발음처럼 따라온다.
      let delay = null;
      if (ctx.createDelay) {
        const echoBand = ctx.createBiquadFilter();
        echoBand.type = "bandpass";
        echoBand.frequency.value = 760;
        echoBand.Q.value = 9;
        delay = ctx.createDelay(0.12);
        delay.delayTime.value = 0.045;
        const echoGain = ctx.createGain();
        echoGain.gain.value = Math.min(0.18, vol * 0.24);
        src.connect(echoBand).connect(delay).connect(echoGain).connect(master);
      }

      // 일정하지 않은 AI 보코더처럼 음량이 빠르게 떨린다.
      const lfo = ctx.createOscillator();
      const lfoDepth = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 27 + Math.random() * 5;
      lfoDepth.gain.value = Math.min(0.07, vol * 0.09);
      lfo.connect(lfoDepth).connect(out.gain);
      lfo.start();
      return () => { try { lfo.stop(); } catch { /* 이미 정지 */ } };
    } catch {
      el.volume = vol;
      return () => {};
    }
  }

  /* 음성 시작부에만 들리는 짧은 합성 포먼트. 실제 발화 위에 겹쳐져
   * 사람 목소리와 생성음의 경계를 일부러 어긋나게 한다. */
  function synthAIVoiceTexture(len, vol) {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const dur = Math.min(0.75, Math.max(0.24, len * 0.11));
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modDepth = ctx.createGain();
    const band = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    carrier.type = "triangle";
    carrier.frequency.value = 620 + Math.random() * 90;
    mod.type = "square";
    mod.frequency.value = 18 + Math.random() * 9;
    modDepth.gain.value = 45;
    band.type = "bandpass";
    band.frequency.value = 1200 + Math.random() * 500;
    band.Q.value = 12;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.006, vol * 0.035), now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    mod.connect(modDepth).connect(carrier.frequency);
    carrier.connect(band).connect(gain).connect(master);
    mod.start(now);
    carrier.start(now);
    mod.stop(now + dur);
    carrier.stop(now + dur);
  }

  /* 어중간한 AI 합성풍 BGM (assets/<이름>.mp3). 동시에 하나만 */
  let bgmEl = null;
  function bgm(name, vol = 0.4) {
    stopBgm();
    if (ambEl) ambEl.volume = Date.now() < silenceUntil ? 0.005 : 0.04;
    bgmEl = new Audio(`assets/${encodeURIComponent(name)}.mp3`);
    bgmEl.volume = vol;
    bgmEl.play().catch(() => {});
  }
  function stopBgm() {
    if (ambEl) ambEl.volume = Date.now() < silenceUntil ? 0.005 : ambEl._base;
    if (!bgmEl) return;
    const el = bgmEl;
    bgmEl = null;
    // 뚝 끊지 않고 짧게 줄인다
    const fade = setInterval(() => {
      el.volume = Math.max(0, el.volume - 0.08);
      if (el.volume <= 0) { el.pause(); clearInterval(fade); }
    }, 60);
  }

  /* 상시 불길한 앰비언트 — 방송 내내 깔린다 */
  let ambEl = null;
  function ambient(name, vol = 0.16) {
    if (ambEl) { ambEl.pause(); ambEl = null; }
    ambEl = new Audio(`assets/${encodeURIComponent(name)}.mp3`);
    ambEl.loop = true;
    ambEl.volume = Date.now() < silenceUntil ? 0.005 : vol;
    ambEl._base = vol;
    ambEl.play().catch(() => {});
  }

  /* 라디오 주파수 튜닝: 새벽 라디오의 잡음이 채널을 헤맨다 */
  function radioTune(dur = 2.4) {
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 18;
    bp.frequency.setValueAtTime(300, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + dur * 0.55);
    bp.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(bp).connect(g).connect(master);
    src.start();
  }

  /* 저음 펄스: 휴식 단어 충돌 때 한 번 울리는 둔탁한 박동 */
  function thump() {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(52, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(34, ctx.currentTime + 0.25);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.connect(g).connect(master);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  }

  function synthVoiceFragment(len, ai = false) {
    if (!ctx) return;
    const n = Math.min(4, Math.max(1, Math.floor(len / 2)));
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * 0.13;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(0.1);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = (ai ? 680 : 300) + Math.random() * (ai ? 1100 : 500);
      bp.Q.value = ai ? 12 : 6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      src.connect(bp).connect(g).connect(master);
      src.start(t);
    }
    if (ai) synthAIVoiceTexture(len, 0.8);
  }

  /* 플랫폼/파일 시스템 상호작용음. 전부 짧은 합성음이라 별도 자산 없이
   * 동작하며, hover는 과도하게 반복되지 않도록 제한한다. */
  function ui(kind = "press") {
    if (!ctx || !master) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const nowMs = Date.now();
    if (kind === "hover") {
      if (nowMs - lastHoverSoundAt < 70) return;
      lastHoverSoundAt = nowMs;
    }

    const now = ctx.currentTime;
    if (kind === "hover") {
      uiTone(430, 510, 0.045, 0.012, "sine", now);
    } else if (kind === "open") {
      uiTone(210, 330, 0.09, 0.026, "triangle", now);
      uiTone(420, 610, 0.07, 0.014, "sine", now + 0.035);
    } else if (kind === "confirm") {
      uiTone(390, 610, 0.1, 0.035, "sine", now);
      uiTone(610, 820, 0.12, 0.025, "triangle", now + 0.055);
    } else if (kind === "deny") {
      uiTone(190, 72, 0.14, 0.045, "sawtooth", now);
    } else {
      uiTone(310, 250, 0.055, 0.025, "triangle", now);
      uiNoiseClick(now, 0.016);
    }
  }

  function uiTone(from, to, dur, level, type, start) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  }

  function uiNoiseClick(start, level) {
    const src = ctx.createBufferSource();
    const band = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = noiseBuffer(0.035);
    band.type = "bandpass";
    band.frequency.value = 1800;
    band.Q.value = 3;
    gain.gain.setValueAtTime(level, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);
    src.connect(band).connect(gain).connect(master);
    src.start(start);
  }

  /* 정적: 룸톤을 잠시 끊는다 — 공포의 중심은 무음 */
  function silence(seconds = 1.2) {
    const now = Date.now();
    silenceUntil = Math.max(silenceUntil, now + seconds * 1000);
    if (ambEl) ambEl.volume = 0.005;
    if (roomEl) roomEl.volume = 0.005;

    if (roomGain && ctx) {
      const t = ctx.currentTime;
      const remaining = Math.max(0.05, (silenceUntil - now) / 1000);
      roomGain.gain.cancelScheduledValues(t);
      roomGain.gain.setValueAtTime(roomGain.gain.value, t);
      roomGain.gain.linearRampToValueAtTime(0.0001, t + 0.05);
      roomGain.gain.linearRampToValueAtTime(0.06, t + remaining);
    }

    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      const wait = silenceUntil - Date.now();
      if (wait > 10) {
        silenceTimer = setTimeout(restoreSilencedMedia, wait);
        return;
      }
      restoreSilencedMedia();
    }, Math.max(0, silenceUntil - now));
  }

  function restoreSilencedMedia() {
    if (Date.now() < silenceUntil) return;
    if (roomEl) roomEl.volume = roomEl._base;
    if (ambEl) ambEl.volume = bgmEl ? 0.04 : ambEl._base;
  }

  function stopAll() {
    clearTimeout(silenceTimer);
    silenceTimer = 0;
    silenceUntil = 0;
    if (roomEl) { if (roomEl.pause) roomEl.pause(); roomEl = null; }
    if (ambEl) { if (ambEl.pause) ambEl.pause(); ambEl = null; }
    if (bgmEl) { if (bgmEl.pause) bgmEl.pause(); bgmEl = null; }
    activeVoiceEls.forEach((el) => {
      if (el.pause) el.pause();
      if (el._voiceCleanup) el._voiceCleanup();
    });
    activeVoiceEls.clear();
  }

  return { init, tick, glitch, voice, silence, thump, radioTune, bgm, stopBgm, ambient, ui, stopAll };
})();
