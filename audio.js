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
  let started = false;

  function init() {
    if (started) return;
    started = true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
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
    const el = new Audio("assets/roomtone.mp3");
    el.loop = true;
    el.volume = 0.25;
    el.play().then(() => {}).catch(() => synthRoomTone());
    el.onerror = () => synthRoomTone();
  }

  function synthRoomTone() {
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

  /* 음성 조각: assets/voice/<텍스트>.mp3 있으면 재생, 없으면 합성 대체.
   * 합성 대체는 사람 목소리가 아니라 "재생 오류처럼 들리는 파편"이다. */
  /* ai=true 면 로봇(못 만든 TTS) 변종(<텍스트>_ai.mp3)을 재생한다 */
  function voice(text, vol = 0.8, rate = 1, ai = false) {
    const clean = text.replace(/\.+$/, "") + (ai ? "_ai" : "");
    const el = new Audio(`assets/voice/${encodeURIComponent(clean)}.mp3`);
    el.volume = vol;
    el.playbackRate = rate;
    el.preservesPitch = false; // 느려지면 낮아진다
    el.play().catch(() => synthVoiceFragment(text.length));
    el.onerror = () => synthVoiceFragment(text.length);
  }

  /* 어중간한 AI 합성풍 BGM (assets/<이름>.mp3). 동시에 하나만 */
  let bgmEl = null;
  function bgm(name, vol = 0.4) {
    stopBgm();
    if (ambEl) ambEl.volume = 0.04; // 이벤트 BGM이 나올 땐 앰비언트를 낮춘다
    bgmEl = new Audio(`assets/${encodeURIComponent(name)}.mp3`);
    bgmEl.volume = vol;
    bgmEl.play().catch(() => {});
  }
  function stopBgm() {
    if (ambEl) ambEl.volume = ambEl._base;
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
    ambEl.volume = vol;
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

  function synthVoiceFragment(len) {
    if (!ctx) return;
    const n = Math.min(4, Math.max(1, Math.floor(len / 2)));
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * 0.13;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(0.1);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 300 + Math.random() * 500; // 음성 대역 근처
      bp.Q.value = 6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      src.connect(bp).connect(g).connect(master);
      src.start(t);
    }
  }

  /* 정적: 룸톤을 잠시 끊는다 — 공포의 중심은 무음 */
  function silence(seconds = 1.2) {
    if (ambEl) {
      const base = ambEl._base;
      ambEl.volume = 0.005;
      setTimeout(() => { if (ambEl) ambEl.volume = base; }, seconds * 1000);
    }
    if (!roomGain) return;
    const t = ctx.currentTime;
    roomGain.gain.cancelScheduledValues(t);
    roomGain.gain.setValueAtTime(roomGain.gain.value, t);
    roomGain.gain.linearRampToValueAtTime(0.0001, t + 0.05);
    roomGain.gain.linearRampToValueAtTime(0.06, t + seconds);
  }

  return { init, tick, glitch, voice, silence, thump, radioTune, bgm, stopBgm, ambient };
})();
