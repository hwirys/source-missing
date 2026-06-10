/* ─────────────────────────────────────────────────────────────
 * game.js — SOURCE MISSING: broadcaster not found
 * 웹 기반 ASCII 리미널 호러 (사양서 v0.2 + 추가안 4: 7블록 구조)
 *
 * 힌트 체인 설계:
 *   관찰(3) → desktop → chat_motion_map → parser_recovery(P1)
 *   → routine_queue 해금 → fan_chat_log 깨진 줄 → viewer_records
 *   → 기록 대조 퀴즈 → restore 소스 실험 → do_not_restore.txt
 *   → SYSTEM MENU → 엔딩 (A/C/D/E/F/R)
 * 모든 화면 하단의 ▸ 목표 바가 항상 "다음 한 걸음"을 가리킨다.
 * ───────────────────────────────────────────────────────────── */

"use strict";

const $ = (sel) => document.querySelector(sel);

/* ── NG+ 저장 ──────────────────────────────────────────── */

const SAVE_KEY = "source_missing_save";

function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { runs: 0 }; }
  catch { return { runs: 0 }; }
}
const save = loadSave();

/* ── 상태 ──────────────────────────────────────────────── */

const state = {
  phase: 1,
  liveStart: 0,
  playerMsgs: 0,
  motion: 0,
  energy: 0,
  restore: 0,            // 복원률 %
  lastActivity: Date.now(),
  lastChatAt: 0,         // 형상 anomaly 판정용
  restWindowUntil: 0,    // "쉬어도 돼" 과민 반응 창
  titleDrifted: false,

  anoms: new Set(),      // 발견한 이상 현상
  clues: [],

  unlocked: { desktop: false, alert: false, records: false, routine: false, restore: false },
  mapConfirmed: false,
  fanBroken: new Set(),
  alertFailRead: false,

  solvedPuzzles: new Set(),
  wrongParse: 0,

  routineStep: 1,        // 1 refusal읽기 → 2 sleep → 3 next → 4 later
  routineFails: 0,
  routineCleared: false,
  restRefusalRead: false,
  spawnedTodos: [],

  recViewed: new Set(),
  quizDone: false,
  negationRule: false,
  endStreamHint: false,

  sources: new Set(),
  restoreRan: false,
  routineSourceUsed: false,

  dnrVisible: save.runs >= 2,
  dnrRead: false,

  menuUnlocked: false,
  lastMsgMode: false,
  lastCorrupted: "",
  watching: false,
  ended: false,
  timers: [],

  /* 공포 연출 상태 */
  blackUntil: 0,        // 형상 프레임 드랍
  sharpUntil: 0,        // 한 프레임만 비정상적으로 선명
  listenUntil: 0,       // 입력 중 — 형상이 멈추고 '듣는다'
  echoes: [],           // 플레이어의 오염된 말 — 나중에 채팅이 따라한다
  nameEchoDone: false,
  presenceCooldownAt: 0,
  endFakeout: false,

  /* 괴담 라디오 */
  finalTaleVisible: false, // 마지막_괴담.txt 등장 여부
  finalTaleRead: false,
  micAliveUntil: 0,        // 죽어 있던 마이크가 살아나는 순간
  micOutroDone: false,     // 엔딩 직전 마이크 변주는 한 번
  lastEmptyAt: 0,          // 리미널 '빈 방' 이벤트

  /* 위장 방송 — 언니가 아닌 무언가가 진행한다 */
  broadcastUntil: 0,
  broadcastCount: 0,
  ghostNoticed: false,   // 오버레이 유령 메시지 첫 인지

  /* recordings + 추가 공포 */
  lungeUntil: 0,         // 한 프레임, 너무 가깝다
  preReadDone: false,    // 전송 전 입력을 읽힌 적
  rawEchoNoted: false,   // 오버레이가 원문을 띄운 적
  clipUntil: 0,
  clipsDone: new Set(),
  figHoverAt: 0,         // 형체 위에 커서가 머문 시각
  viewerFlickAt: 0,
  viewerNoteDone: false,
  addrGhostDone: false,  // 주소창이 혼자 입력되는 건 한 번
};

/* ── 유틸 ──────────────────────────────────────────────── */

function later(fn, ms) { const id = setTimeout(fn, ms); state.timers.push(id); return id; }
function every(fn, ms) { const id = setInterval(fn, ms); state.timers.push(id); return id; }
function clearTimers() { state.timers.forEach((id) => { clearTimeout(id); clearInterval(id); }); state.timers = []; }

const WIN_SCREENS = new Set(["desktop", "records", "archive", "puzzle", "routine", "restore", "menu"]);

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $("#screen-" + name).classList.add("active");
  document.body.classList.toggle("in-windows", WIN_SCREENS.has(name));
  // 화면 인지 채팅 — 어디를 보는지 채팅이 안다 (라이브로 돌아오면 보게 된다)
  if (state.phase >= 2 && !state.ended && DATA.screenAware[name] && Math.random() < 0.45) {
    later(() => {
      if (!state.ended) chatAdd(pick(DATA.screenAware[name]));
    }, 1500 + Math.random() * 2500);
  }
}
function activeScreen() {
  const s = document.querySelector(".screen.active");
  return s ? s.id.replace("screen-", "") : "";
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n) { return String(n).padStart(2, "0"); }
function nowClock() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function shakeFrame() {
  document.body.classList.add("shake");
  later(() => document.body.classList.remove("shake"), 200);
}

/* ── 토스트 알림 (모던 HUD) ────────────────────────────── */

function toast(text, warn = false) {
  let c = $("#toasts");
  if (!c) { c = document.createElement("div"); c.id = "toasts"; document.body.appendChild(c); }
  const t = document.createElement("div");
  t.className = "toast" + (warn ? " warn" : "");
  t.textContent = text;
  c.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .3s";
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 320);
  }, 3600);
  while (c.children.length > 4) c.removeChild(c.firstChild);
}

/* ── 단서 노트 ─────────────────────────────────────────── */

function addClue(text, next) {
  if (state.clues.some((c) => c.text === text)) return;
  state.clues.push({ text, next });
  $("#btn-clues").textContent = `traces (${state.clues.length})`;
  chatSys("trace logged.");
  toast("trace #" + state.clues.length + " — " + (text.length > 30 ? text.slice(0, 30) + "…" : text));
  renderClues();
}

function renderClues() {
  const list = $("#clue-list");
  if (!state.clues.length) { list.textContent = "no traces recorded_"; return; }
  list.innerHTML = "";
  state.clues.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "clue";
    const b = document.createElement("b");
    b.textContent = `${i + 1}. `;
    div.appendChild(b);
    div.appendChild(document.createTextNode(c.text));
    if (c.next) {
      const n = document.createElement("span");
      n.className = "next";
      n.textContent = "\n" + c.next;
      div.appendChild(document.createElement("br"));
      div.appendChild(n);
    }
    list.appendChild(div);
  });
}

$("#btn-clue-close").addEventListener("click", () => $("#clue-panel").classList.add("hidden"));

/* ── 목표(힌트) 바 ─────────────────────────────────────── */

function solvedReq() {
  return DATA.puzzles.filter((p) => p.req && state.solvedPuzzles.has(p.id)).length;
}

function computeObjective() {
  if (state.ended) return "\u2014";
  if (state.watching) return "\u2014";
  if (!state.unlocked.desktop)
    return `\uc5b4\uae0b\ub09c \uacf3 (${state.anoms.size}/3)`;
  if (!state.mapConfirmed) return "\uc6c0\uc9c1\uc784\uc758 \ucd9c\ucc98";
  if (solvedReq() === 0) return "alert_test/";
  if (state.fanBroken.size < 3)
    return `\uae68\uc9c4 \uc2dc\uac04\ub300 (${state.fanBroken.size}/3)`;
  if (solvedReq() < DATA.puzzleReqCount)
    return `\ubcf5\uc6d0 ${solvedReq()}/${DATA.puzzleReqCount}`;
  if (!state.routineCleared)
    return state.routineFails >= 4 ? "rest_refusal.log \u2014 \uac70\uafb8\ub85c" : "\ub8e8\ud2f4";
  if (state.recViewed.size < 3)
    return `\uae30\ub85d (${state.recViewed.size}/3)`;
  if (!state.quizDone) return "\ubb34\uc5c7\uc774 \uc9c0\uc6cc\uc9c0\ub294\uac00";
  if (state.mapConfirmed && state.clipsDone.size < DATA.clips.length)
    return `\uc798\ub9b0 \ub05d (${state.clipsDone.size}/${DATA.clips.length})`;
  if (!state.restoreRan) return "\uc804\ubd80 \ubcf5\uc6d0\ud558\uc9c0 \ub9d0 \uac83";
  if (state.dnrVisible && !state.dnrRead) return "\uc228\uae40 \ud30c\uc77c";
  return "\ub9c8\uc9c0\ub9c9 \uc120\ud0dd";
}

function updateObjective() {
  const t = "▸ " + computeObjective();
  document.querySelectorAll(".objbar").forEach((e) => (e.textContent = t));
}

/* ── 부팅 ──────────────────────────────────────────────── */

function boot() {
  const lines = [...DATA.bootLines];
  if (save.runs >= 1) lines.push(DATA.bootReturning);
  const log = $("#boot-log");
  let i = 0;
  const step = () => {
    if (i < lines.length) {
      const { t, cls } = lines[i++];
      const span = document.createElement("span");
      if (cls) span.className = cls;
      span.textContent = t + "\n";
      log.appendChild(span);
      later(step, t === "" ? 350 : 150 + Math.random() * 200);
    } else {
      $("#btn-enter").classList.remove("hidden");
    }
  };
  step();
}

$("#btn-enter").addEventListener("click", () => {
  AUDIO.init();
  startLive();
});

/* ── 라이브 시작 ───────────────────────────────────────── */

function startLive() {
  state.liveStart = Date.now();
  state.lastActivity = Date.now();
  if (save.runs >= 1) {
    DATA.chat[2] = DATA.chat[2].concat(DATA.ngChat);
    DATA.chat[3] = DATA.chat[3].concat(DATA.ngChat);
  }
  showScreen("live");
  tryLoadCapture();
  AUDIO.ambient("bgm_ominous", 0.16); // 불길한 BGM이 계속 깔린다
  every(renderFigure, 110);
  every(tickClock, 1000);
  every(autoChat, 1000);
  every(restChatTick, 1000);
  every(micFlutter, 300);
  every(titleDrift, 12000);
  every(checkIdle, 5000);
  every(flickerTick, 7000);
  every(silenceTick, 16000);
  every(captionTick, 10000);
  every(presenceTick, 7000);
  every(emptyRoomTick, 25000);
  every(broadcastTick, 5000);
  every(ghostTick, 12000);
  every(viewerTick, 9000);
  every(addrGhostTick, 4000);
  chatSys("채팅에 연결되었습니다.");
  if (save.runs >= 1) later(() => chatSys("returning_viewer detected."), 4000);
  updateObjective();
}

const bgLoaded = {};

function preloadBg(name) {
  const img = new Image();
  img.onload = () => {
    bgLoaded[name] = true;
    if (name === "bg_live") setStageBg("bg_live");
  };
  img.src = `assets/${name}.png`;
}

function setStageBg(name) {
  if (!bgLoaded[name]) return;
  const bg = $("#bg-capture");
  bg.style.backgroundImage = `url(assets/${name}.png)`;
  bg.classList.add("loaded");
}

function tryLoadCapture() {
  preloadBg("bg_live");
  preloadBg("bg_live2"); // 위장 방송용 — 실제 괴담 라디오(치지직) 화면
  preloadFigs();
}

/* ── 상단 UI: 멈춘 시계 / 제목 드리프트 / 마이크 ───────── */

function tickClock() {
  // 이상 현상: LIVE 시간이 움직이지 않는다 (헤더와 플레이어 바 동일)
  const t = Math.random() < 0.06 ? "--:--:--" : "00:00:00";
  $("#stream-timer").textContent = t;
  const ctl = $("#ctl-time");
  if (ctl) ctl.textContent = t;
}

const TITLES = [
  "[괴담 라디오] 오늘도 잡담",
  "[괴담 라디오] 오느도 잡담",
  "[괴담 라디오] 오늘도 잡닥",
  "[괴담 라디오] 오늘드 잡담",
  "[괴담 라디오] 오 늘 도  잡 담",
  "[괴담 라디오] 오늘의 괴담: 방송자",
  "[괴담 라디오] 오늘의 괴담: 시청자",
];

function titleDrift() {
  if (state.ended) return;
  const el = $("#stream-title");
  const maxIdx = state.phase >= 3 ? TITLES.length : TITLES.length - 2;
  el.textContent = TITLES[Math.floor(Math.random() * maxIdx)];
  if (el.textContent !== TITLES[0]) state.titleDrifted = true;
}

function micFlutter() {
  let g = "";
  if (Date.now() < state.micAliveUntil) {
    // 죽어 있던 마이크가 살아 있다 — 단 한 번, 누가 말하는 것처럼
    const live = "▃▄▅▆";
    for (let i = 0; i < 4; i++) g += live[Math.floor(Math.random() * live.length)];
  } else {
    for (let i = 0; i < 4; i++) g += Math.random() < 0.15 ? "▂" : (Math.random() < 0.04 ? "▃" : "▁");
  }
  $("#mic-gauge").textContent = g;
}

/* ── 공포 연출 스케줄러 ────────────────────────────────── */

/* 프레임 드랍: 형상이 한순간 사라졌다가, 한 프레임만 너무 선명해진다 */
function flickerTick() {
  if (state.ended || state.phase < 2) return;
  if (Date.now() < state.broadcastUntil) return;
  if (activeScreen() !== "live") return;
  if (Math.random() > 0.5) return;
  const now = Date.now();
  // phase 3: 드물게, 어둠 다음 한 프레임 동안 형체가 너무 가깝다
  if (state.phase >= 3 && Math.random() < 0.16) {
    state.blackUntil = now + 200;
    state.lungeUntil = now + 380;
    AUDIO.voice("언니", 0.12, 0.5);
    return;
  }
  state.blackUntil = now + 180;
  state.sharpUntil = now + 360;
  if (Math.random() < 0.5) AUDIO.glitch(0.25); // 절반은 소리 없이
}

/* 정적: 룸톤과 채팅이 같이 끊긴다. 정적이 끝나면 누군가 한 줄 올린다 */
function silenceTick() {
  if (state.ended || state.phase < 3) return;
  if (Date.now() < state.broadcastUntil) return;
  if (Math.random() > 0.45) return;
  AUDIO.silence(3.5);
  nextChatAt = Date.now() + 5200;
  if (Math.random() < 0.35) {
    // 정적이 끝나면 같은 말이 네 번, 다른 닉으로 올라온다
    const line = pick(DATA.chat[3]);
    for (let i = 0; i < 4; i++) {
      later(() => { if (!state.ended) chatAdd(line); }, 4300 + i * 160);
    }
  } else {
    later(() => {
      if (!state.ended) chatAdd(pick(DATA.silenceBreak));
    }, 4300);
  }
}

/* caption 회전: 시스템 상태 표기가 점점 이쪽을 향한다 */
function captionTick() {
  if (state.ended || state.phase < 2) return;
  if (Date.now() < state.broadcastUntil) return;
  if (Date.now() < state.listenUntil) return;
  const maxIdx = state.phase >= 3 ? DATA.captions.length : 4;
  const idx = Math.floor(Math.random() * maxIdx);
  const el = $("#stage-caption");
  el.textContent = DATA.captions[idx];
  el.classList.toggle("creep", idx > 0);
}

/* 자리 비움 감지: 입력이 없으면 채팅이 먼저 말을 건다 */
function presenceTick() {
  if (state.ended || state.phase < 2) return;
  if (Date.now() < state.broadcastUntil) return;
  if (activeScreen() !== "live") return;
  const now = Date.now();
  if (now - state.lastActivity < 30 * 1000) return;
  if (now < state.presenceCooldownAt) return;
  state.presenceCooldownAt = now + 60 * 1000;
  chatAdd(pick(DATA.presence));
  state.energy = Math.min(6, state.energy + 2);
}

/* 리미널 '빈 방': 형상도 채팅도 룸톤도 사라진다.
 * 익숙한 화면이 22초 동안 그냥 '장소'가 된다 — 그 안에서도 단계가 있다 */
function emptyRoomTick() {
  if (state.ended || state.phase < 3) return;
  if (activeScreen() !== "live") return;
  if (Date.now() < state.broadcastUntil) return;
  if (Math.random() > 0.3) return;
  const now = Date.now();
  if (now - state.lastEmptyAt < 90 * 1000) return;
  state.lastEmptyAt = now;

  state.blackUntil = now + 22000;
  nextChatAt = now + 25000;
  AUDIO.silence(22);

  const cap = $("#stage-caption");
  cap.textContent = "nobody is streaming here";
  cap.classList.add("creep");

  // 7초: 빈 방에 한 줄
  later(() => {
    if (!state.ended) chatAdd("여기 원래 뭐 하던 방이었지", "creep");
  }, 7000);
  // 13초: 마이크가 아주 잠깐 꿈틀
  later(() => { state.micAliveUntil = Date.now() + 900; }, 13000);
  // 18초: caption마저 말을 잃는다
  later(() => {
    if (!state.ended) cap.textContent = ". . .";
  }, 18000);
  // 22초: 복귀
  later(() => {
    if (state.ended) return;
    cap.textContent = "source: missing";
    cap.classList.remove("creep");
    chatAdd("다시 있다", "creep");
  }, 22300);
}

/* ── 위장 방송: 진행자 없이 방송이 '시작'된다 ─────────── */

let nextBroadcastAt = 0;

function broadcastTick() {
  if (state.ended || state.phase < 2) return;
  const now = Date.now();
  if (now < state.broadcastUntil || now < state.clipUntil) return;
  if (!nextBroadcastAt) { nextBroadcastAt = now + 35000; return; }
  if (now < nextBroadcastAt) return;
  nextBroadcastAt = now + 90000 + Math.random() * 50000;
  startFakeBroadcast();
}

function buildBroadcastLines(first) {
  const B = DATA.broadcast;
  if (first) return [...B.opening, ...B.firstStall];
  // 본문: 시청자 기록 + 플레이어가 했던 말이 괴담의 재료가 된다
  const pool = [...B.materials, ...state.echoes];
  const body = [];
  const used = new Set();
  // 플레이어가 말한 적이 있다면, 반드시 한 줄은 그 말이다
  if (state.echoes.length) {
    const mine = pick(state.echoes);
    used.add(mine);
    body.push(mine);
  }
  while (body.length < 4 && used.size < pool.length) {
    const m = pick(pool);
    if (used.has(m)) continue;
    used.add(m);
    body.push(m);
  }
  return [...B.opening, B.taleFrame, ...body, ...B.closing];
}

function startFakeBroadcast() {
  const first = state.broadcastCount === 0;
  state.broadcastCount++;
  const lines = buildBroadcastLines(first);
  const lineGap = 2200;
  const dur = 1500 + lines.length * lineGap + 3800;
  state.broadcastUntil = Date.now() + dur;

  // 방송이 '켜진다' — 배경이 진짜 괴담 라디오 레이아웃으로 바뀐다
  setStageBg("bg_live2");
  $("#live-badge").textContent = "ON AIR";
  $("#stream-title").textContent = "[괴담 라디오] 40화: (무제)";
  $("#status-text").textContent = "avatar: presenting | script: assembled | mic: no input";
  AUDIO.radioTune(1.8);
  AUDIO.bgm("bgm_fake_opening", 0.45); // 그녀의 발성으로 합성된 어설픈 허밍
  state.energy = 0;

  const B = DATA.broadcast;
  later(() => { if (!state.ended) chatAdd(pick(B.reactStart)); }, 2400);
  later(() => { if (!state.ended) chatAdd(pick(B.reactStart)); }, 3400);

  lines.forEach((l, i) => {
    later(() => { if (!state.ended) showSubtitle(l); }, 1500 + i * lineGap);
  });

  // 읽는 동안 합성 음성이 새어 나온다 — 진짜보다 한 끗 어긋난 로봇 톤
  later(() => AUDIO.voice("아직", 0.32, 1, true), 1500 + 1 * lineGap);
  if (!first) {
    later(() => { if (!state.ended) chatAdd(pick(B.reactMid), "creep"); }, 1500 + 3 * lineGap + 1200);
    later(() => AUDIO.voice("언니", 0.3, 1, true), 1500 + 4 * lineGap);
    later(() => { if (!state.ended) chatAdd(pick(B.reactMid), "creep"); }, 1500 + 5 * lineGap + 800);
    later(() => AUDIO.voice("기다려", 0.32, 0.8, true), 1500 + (lines.length - 2) * lineGap);
  }

  later(() => collapseBroadcast(first), dur - 2300);
}

function showSubtitle(text) {
  const sub = $("#subtitle");
  sub.textContent = text;
  sub.classList.remove("hidden");
}

function collapseBroadcast(first) {
  if (state.ended) return;
  const sub = $("#subtitle");
  // 말을 더듬다가 끊긴다
  const lastWord = (sub.textContent || "잘 자").slice(0, 2);
  sub.textContent = lastWord + "—";
  AUDIO.stopBgm();
  AUDIO.glitch(1);
  state.blackUntil = Date.now() + 450;
  shakeFrame();

  later(() => {
    sub.classList.add("hidden");
    setStageBg("bg_live");
    $("#live-badge").textContent = "LIVE";
    $("#stream-title").textContent = TITLES[0];
    $("#status-text").textContent = DATA.statusbars[state.phase];
    state.broadcastUntil = 0;
    if (state.ended) return;
    later(() => chatAdd(pick(DATA.broadcast.reactEnd), "creep"), 1600);
    if (first) {
      addClue("방송이 '시작'됐다 — 진행자 없이. 오프닝은 대본에서 베꼈고, 도중에 막혀서 끊겼다.",
        "→ 다음번엔 더 길게 한다. 본문 재료가 어디서 오는지 자막을 잘 볼 것.");
    } else if (state.echoes.length) {
      addClue("위장 방송의 본문은 우리가 했던 말이다 — 내 채팅도 괴담의 재료로 읽혔다.",
        "→ 채팅을 칠수록 저것의 대본이 길어진다.");
    }
  }, 2200);
}

/* 오버레이 유령: 화면 속 채팅에만 올라오는 줄 — 보낸 사람은 "반죽이_현재" */
let lastGhostAt = 0;

function ghostTick() {
  if (state.ended || state.phase < 2) return;
  if (activeScreen() !== "live") return;
  if (Date.now() < state.broadcastUntil) return;
  if (Math.random() > 0.35) return;
  const now = Date.now();
  if (now - lastGhostAt < 25 * 1000) return;
  lastGhostAt = now;
  overlayAdd("", pick(DATA.overlayGhosts), true);
  if (!state.ghostNoticed) {
    state.ghostNoticed = true;
    later(() => { if (!state.ended) chatAdd(DATA.overlayGhostReaction, "creep"); }, 6000);
    later(() => addClue("화면 속 오버레이 채팅에, 옆 채팅에는 없는 줄이 올라온다 — 닉네임 없이.",
      "→ 이 채팅에서 닉이 표시되지 않는 사람은 나뿐이다."), 7200);
  }
}

/* 시청자 수가 한순간 2명이 된다 — 아무도 들어온 적이 없는데 */
function viewerTick() {
  if (state.ended || state.phase < 3) return;
  if (activeScreen() !== "live") return;
  const now = Date.now();
  if (now - state.viewerFlickAt < 50 * 1000) return;
  if (Math.random() > 0.22) return;
  state.viewerFlickAt = now;
  const v = $("#viewer-count");
  v.textContent = "2명 시청 중";
  later(() => { v.textContent = "1명 시청 중"; }, 1400);
  if (!state.viewerNoteDone) {
    state.viewerNoteDone = true;
    later(() => { if (!state.ended) chatAdd("방금 2명이었지", "creep"); }, 5000);
  }
}

/* 주소창이 혼자 입력된다 — 단 한 번 */
function addrGhostTick() {
  if (state.ended || state.addrGhostDone || state.phase < 3) return;
  if (activeScreen() !== "desktop") return;
  if (Date.now() - state.lastActivity < 12000) return;
  state.addrGhostDone = true;
  const a = $("#addr-input");
  if (!a) return;
  const word = "나가지마";
  const base = ADDR_BASE[deskDir] || ADDR_BASE.root;
  [...word].forEach((ch, i) => {
    later(() => { a.value = base + word.slice(0, i + 1); AUDIO.tick(); }, i * 280);
  });
  later(() => {
    a.value = base;
    addClue("주소창이 혼자 입력됐다 — '나가지마'.", "→ 이 컴퓨터에 입력하는 건 나만이 아니다.");
  }, word.length * 280 + 1800);
}

/* 입력 중 — 형상이 멈추고 듣는다 */
$("#chat-input").addEventListener("input", () => {
  if (state.phase < 2 || state.ended) return;
  const first = Date.now() >= state.listenUntil;
  state.listenUntil = Date.now() + 1400;
  if (first) {
    const cap = $("#stage-caption");
    cap.textContent = "avatar: listening";
    cap.classList.add("creep");
    later(() => {
      if (Date.now() >= state.listenUntil) {
        cap.textContent = "source: missing";
        cap.classList.remove("creep");
      }
    }, 1600);
  }
});

/* ── Block 1: 관찰 시스템 ─────────────────────────────── */

function foundAnomaly(key, el) {
  if (state.anoms.has(key) || state.ended) return;
  state.anoms.add(key);
  const a = DATA.anomalies[key];
  chatSys("observation updated.");
  chatSys(a.log);
  toast(a.log, true);
  addClue(a.clue, a.next);
  if (el) el.classList.add("found");
  AUDIO.glitch(0.4);
  if (state.anoms.size === DATA.anomalyNeed && !state.unlocked.desktop) {
    state.unlocked.desktop = true;
    later(() => {
      chatSys("desktop access partially restored.");
      toast("filesystem 잠금 해제");
      const b = $("#btn-desktop");
      b.classList.remove("locked");
      b.textContent = "filesystem";
      b.classList.add("new");
      setPhase(2);
      AUDIO.silence(1.2);
    }, 900);
  }
  updateObjective();
}

$("#stream-timer").addEventListener("click", function () { foundAnomaly("clock", this); });
$("#viewer-count").addEventListener("click", function () { foundAnomaly("viewers", this); });
$("#mic-gauge").addEventListener("click", function () { foundAnomaly("mic", this); });
$("#stream-title").addEventListener("click", function () {
  if (state.titleDrifted) foundAnomaly("title", this);
  else chatSys("(제목은… 평범해 보인다. 조금 더 지켜보자.)");
});
$("#stage").addEventListener("mousemove", (e) => {
  const f = $("#figure-img");
  if (!f) return;
  const r = f.getBoundingClientRect();
  const inside = e.clientX >= r.left && e.clientX <= r.right &&
                 e.clientY >= r.top && e.clientY <= r.bottom;
  if (inside && !state.figHoverAt) state.figHoverAt = Date.now();
  if (!inside && state.figHoverAt) {
    state.figHoverAt = 0;
    const cap = $("#stage-caption");
    if (cap.textContent === "distance: decreasing") {
      cap.textContent = "source: missing";
      cap.classList.remove("creep");
    }
  }
});

$("#stage").addEventListener("click", () => {
  const now = Date.now();
  if (now < state.restWindowUntil) foundAnomaly("rest", null);
  else if (now - state.lastChatAt < 1500) foundAnomaly("motion", null);
  else if (!state.anoms.has("motion"))
    chatSys("(지금은 가만히 있다 — 채팅이 올라온 직후를 노려보자.)");
});

/* ── 단계 ──────────────────────────────────────────────── */

function setPhase(n) {
  if (n <= state.phase) return;
  state.phase = n;
  $("#status-text").textContent = DATA.statusbars[n];
  if (n >= 2) $("#btn-lastmsg").classList.remove("hidden");
  if (n === 3) {
    $("#statusbar").classList.add("alert");
    $("#stage-caption").textContent = "identity source: repeated_names";
    AUDIO.silence(1.6);
    shakeFrame();
    // 마지막 괴담이 바탕화면에 나타난다 — 채팅이 먼저 안다
    if (!state.finalTaleVisible) {
      state.finalTaleVisible = true;
      later(() => {
        if (!state.ended) chatAdd("바탕화면에 못 보던 파일 있어", "creep");
      }, 7000);
    }
  }
}

/* ── 자동 채팅 ─────────────────────────────────────────── */

let nextChatAt = 0;
let nextRestChatAt = 0;

function autoChat() {
  if (state.ended) return;
  const now = Date.now();
  if (now < nextChatAt) return;
  const gap = { 1: [2000, 4200], 2: [1400, 3000], 3: [900, 2100] }[state.phase];
  nextChatAt = now + gap[0] + Math.random() * (gap[1] - gap[0]);
  let pool = DATA.chat[state.phase];
  if (state.restoreRan && Math.random() < 0.3) pool = DATA.restoreChat;
  // 반향: 네가 했던 말을, 다른 누군가가 다시 한다
  if (state.phase >= 3 && state.echoes.length && Math.random() < 0.18) {
    chatAdd(pick(state.echoes), "creep");
  } else {
    const line = pick(pool);
    chatAdd(line);
    // 같은 말이 다른 닉으로 한 번 더 올라온다 — 아무도 그걸 지적하지 않는다
    if (state.phase >= 3 && Math.random() < 0.18) {
      later(() => { if (!state.ended) chatAdd(line); }, 700);
    }
  }
  if (state.phase >= 3 && Math.random() < 0.08) {
    // 가끔은 반속으로, 가끔은 로봇 톤으로 — 진짜와 합성이 섞여 들린다
    const slow = Math.random() < 0.4;
    const ai = Math.random() < 0.35;
    AUDIO.voice(pick(DATA.whispers), slow ? 0.18 : 0.25, slow ? 0.55 : 1, ai);
  }
}

/* "쉬어도 돼" 특수 채팅 — 형상 과민 반응 (이상 현상 6번) */
function restChatTick() {
  if (state.ended || state.phase < 1) return;
  if (Date.now() < state.broadcastUntil) return;
  const now = Date.now();
  if (!nextRestChatAt) nextRestChatAt = now + 12000;
  if (now < nextRestChatAt) return;
  nextRestChatAt = now + 20000 + Math.random() * 15000;
  chatAdd(pick(DATA.restChat));
  state.energy = 5.5;
  state.restWindowUntil = now + 2600;
  $("#figure").classList.add("glitch");
  AUDIO.thump();
  AUDIO.glitch(0.7);
}

function chatStamp() {
  if (state.phase === 1) return nowClock();
  if (state.phase === 2) return Math.random() < 0.4 ? "--:--" : nowClock();
  return "--:--";
}

/* 닉네임은 항상 한 글자씩 깨져 있다 — 같은 사람도 매번 다른 곳이 깨진다 */
const NICK_BREAKS = ["▒", "□", "�", "?"];

function breakNick(name) {
  if (name.length < 2) return name;
  const i = Math.floor(Math.random() * name.length);
  return name.slice(0, i) + pick(NICK_BREAKS) + name.slice(i + 1);
}

/* 치지직풍 닉네임 — 후반으로 갈수록 이상한 이름의 비중이 커진다 */
function nickFor() {
  const pool = DATA.nicks;
  const oddBias = state.phase >= 3 ? 0.45 : state.phase === 2 ? 0.15 : 0.04;
  const idx = Math.random() < oddBias
    ? DATA.nickOddFrom + Math.floor(Math.random() * (pool.length - DATA.nickOddFrom))
    : Math.floor(Math.random() * DATA.nickOddFrom);
  return { name: breakNick(pool[idx]), cls: "n" + (idx % 6) };
}

/* 화면 속 오버레이 채팅 (캐릭터 우측 위젯) */
function overlayAdd(nick, text, ghost = false) {
  const oc = $("#overlay-chat");
  if (!oc) return;
  const p = document.createElement("p");
  if (ghost) p.classList.add("ghost");
  if (nick) {
    const n = document.createElement("span");
    n.className = "onick";
    n.textContent = nick;
    p.appendChild(n);
  }
  p.appendChild(document.createTextNode(text));
  oc.appendChild(p);
  while (oc.children.length > 7) oc.removeChild(oc.firstChild);
}

function chatAdd(text, cls = "") {
  const log = $("#chat-log");
  const p = document.createElement("p");
  const t = document.createElement("span");
  t.className = "t";
  t.textContent = `[${chatStamp()}]`;
  const m = document.createElement("span");
  m.className = "msg" + (cls ? " " + cls : "");
  m.textContent = text;
  if (cls === "sys") {
    p.append(t, m);
  } else if (cls === "mine") {
    // 내 닉네임은 표시되지 않는다. 아무도 그걸 지적하지 않는다.
    p.append(t, m);
    overlayAdd("", text);
  } else {
    const n = nickFor();
    const ns = document.createElement("span");
    ns.className = "nick " + n.cls;
    ns.textContent = n.name;
    p.append(t, ns, m);
    overlayAdd(n.name, text); // 화면 속 채팅에도 같은 줄이 올라온다 — 대개는.
  }
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
  while (log.children.length > 80) log.removeChild(log.firstChild);
  if (cls !== "sys") {
    state.lastChatAt = Date.now();
    state.energy = Math.min(6, state.energy + (cls === "mine" ? 2.5 : 1));
    AUDIO.tick();
    if (state.phase === 3 && Math.random() < 0.15) AUDIO.glitch(0.6);
  }
  // 오염된 말이 올라오는 순간, 무대가 잠깐 어두워진다
  if (cls === "creep") {
    const stage = $("#stage");
    stage.classList.add("dim");
    later(() => stage.classList.remove("dim"), 750);
  }
}

function chatSys(text) { chatAdd(text, "sys"); }

/* ── 메시지 오염 ───────────────────────────────────────── */

function corrupt(text) {
  const exact = DATA.corruptExact[text.trim()];
  if (exact) return exact;
  let t = text.trim();
  t = t.replace(/언니[가는를도의야]?\s*/g, "");
  t = t.replace(/그만\s*/g, "");
  t = t.replace(/쉬어[도라]?\s*/g, "");
  if (state.phase >= 2) {
    t = t.replace(/(나는|내가|저는|제가|난|전)\s*/g, "반죽이 ");
    t = t.replace(/지\s*않을래/g, "을래");
    t = t.replace(/지\s*않아/g, "아");
    t = t.replace(/지\s*마[라요]?/g, "");
    t = t.replace(/안\s+/g, "");
    if (/반죽이/.test(t) && /(아니야|아닌데|아니라고|아님)/.test(t)) return "반죽이야";
    if (/(나갈|나간다|나갈래|떠날)/.test(t)) return "남을래";
  }
  t = t.replace(/\s{2,}/g, " ").trim();
  if (!t) t = "반죽이 왔어";
  return t;
}

/* ── 플레이어 입력 ─────────────────────────────────────── */

function sendChat() {
  if (state.ended) return;
  const input = $("#chat-input");
  const raw = input.value.trim();
  if (!raw) return;
  input.value = "";
  state.lastActivity = Date.now();

  if (state.lastMsgMode) { endingC(raw); return; }

  state.playerMsgs++;
  state.motion++;

  const out = corrupt(raw);
  state.lastCorrupted = out;
  chatAdd(out, "mine");
  shakeFrame();

  // 오버레이는 파서를 거치지 않는다 — 가끔, 잘리기 전 원문이 화면에 뜬다
  if (state.phase >= 3 && out !== raw && Math.random() < 0.3) {
    later(() => {
      if (state.ended) return;
      overlayAdd("", raw, true);
      if (!state.rawEchoNoted) {
        state.rawEchoNoted = true;
        addClue("화면 속 채팅에 내가 '실제로 친' 문장이 떴다 — 잘리기 전의 원문.",
          "→ 저쪽은 원본을 본다.");
      }
    }, 1200);
  }

  // 네 말은 저장된다 — 나중에 다른 입으로 돌아온다
  state.echoes.push(out);
  if (state.echoes.length > 12) state.echoes.shift();

  // 이름 반향: 시스템이 너를 부르기 시작한다
  if (!state.nameEchoDone && state.playerMsgs >= 3 && state.phase >= 2) {
    state.nameEchoDone = true;
    later(() => { if (!state.ended) chatAdd("반죽이_현재 왔어", "creep"); }, 8000);
  }

  // 3단계: 네 말에만 반응해서, 잠깐 너무 선명해진다
  if (state.phase >= 3) {
    later(() => { state.sharpUntil = Date.now() + 170; }, 1800);
    if (Math.random() < 0.4) chatSys(`motion_contribution +1 (total ${state.motion})`);
  }

  if (/언니/.test(raw) && state.phase >= 2) {
    later(() => {
      if (state.ended) return;
      AUDIO.voice("언니", 0.35);
      $("#stage-caption").textContent = "playback: 언니 (archived)";
      later(() => { $("#stage-caption").textContent = "source: missing"; }, 1800);
    }, 1400);
  }

  if (out !== raw && state.phase >= 2 && Math.random() < 0.6) {
    later(() => {
      if (!state.ended) chatAdd(pick(DATA.reactions[Math.min(3, state.phase)]));
    }, 600 + Math.random() * 900);
  }
}

$("#btn-send").addEventListener("click", sendChat);
$("#chat-input").addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });
document.addEventListener("mousemove", () => { state.lastActivity = Date.now(); });
document.addEventListener("keydown", (e) => {
  state.lastActivity = Date.now();
  if (e.key === "Escape") $("#clue-panel").classList.add("hidden");
});

/* ── 중앙 형상 ─────────────────────────────────────────── */

/* 형상 = 합성 이미지 변종. 상태에 따라 다른 "잘못된 합성"이 표시된다.
 *  fig_0 기본 잔상 / fig_1 눈이 빈 / fig_2 RGB 분리 / fig_3 가로줄 밀림
 *  fig_4 이중노출 / fig_sharp 방송 진행용(또렷하지만 눈은 비어 있다) */
const FIG_GLITCHES = ["fig_1", "fig_2", "fig_3", "fig_4"];

function preloadFigs() {
  ["fig_0", ...FIG_GLITCHES, "fig_sharp"].forEach((n) => {
    const i = new Image();
    i.src = `assets/fig/${n}.png`;
  });
}

function setFig(fimg, name) {
  if (fimg.dataset.v === name) return;
  fimg.dataset.v = name;
  fimg.src = `assets/fig/${name}.png`;
}

function renderFigure() {
  if (state.ended) return;
  const fimg = $("#figure-img");
  if (!fimg) return;
  const now = Date.now();

  // 프레임 드랍: 한순간 아무것도 없다
  if (now < state.blackUntil) { fimg.style.visibility = "hidden"; return; }
  fimg.style.visibility = "visible";

  // 돌진 프레임: 설명 없이 지나간다
  if (now < state.lungeUntil) {
    setFig(fimg, "fig_sharp");
    fimg.style.transform = "translateX(-32%) scale(1.55)";
    fimg.style.opacity = "0.92";
    state.energy *= 0.93;
    return;
  }

  const presenting = now < state.broadcastUntil;
  const sharp = now < state.sharpUntil;
  const listening = now < state.listenUntil;
  let baseEnergy = state.routineSourceUsed ? Math.max(state.energy, 1.2) : state.energy;
  if (listening || presenting) baseEnergy = 0;

  // 변종 선택: 흔들릴수록 잘못된 합성이 끼어든다
  if (sharp || presenting) {
    setFig(fimg, "fig_sharp");
  } else if (baseEnergy > 1.3 && Math.random() < Math.min(0.65, baseEnergy * 0.13)) {
    setFig(fimg, pick(FIG_GLITCHES));
  } else if (state.phase >= 3 && Math.random() < 0.025) {
    setFig(fimg, "fig_1"); // 가만히 있어도 가끔 눈이 비어 있다
  } else if (Math.random() < 0.35) {
    setFig(fimg, "fig_0");
  }

  // 호흡 + 흔들림 (듣는 중에는 완전히 멈춘다)
  const breath = listening ? 1 : 1 + 0.012 * Math.sin(now / 2864);
  const jx = baseEnergy > 0.5 ? (Math.random() - 0.5) * Math.min(10, baseEnergy * 2.2) : 0;
  const jy = baseEnergy > 0.5 ? (Math.random() - 0.5) * Math.min(6, baseEnergy * 1.4) : 0;
  fimg.style.transform =
    `translateX(calc(-32% + ${jx.toFixed(1)}px)) translateY(${jy.toFixed(1)}px) scale(${breath.toFixed(4)})`;

  // 커서가 형체 위에 머물면, 형체가 다가온다
  let approach = 0;
  if (state.figHoverAt && state.phase >= 2) {
    const ht = now - state.figHoverAt;
    if (ht > 1500) {
      approach = Math.min(1, (ht - 1500) / 4000);
      if (approach > 0.15) {
        const cap = $("#stage-caption");
        cap.textContent = "distance: decreasing";
        cap.classList.add("creep");
      }
    }
  }

  // 선명도: 복원률이 오를수록, 방송을 진행할수록, 가까울수록
  const clarity = (presenting ? 0.82 : 0.5 + (state.restore / 100) * 0.3) + approach * 0.3;
  fimg.style.opacity = Math.min(0.95, clarity).toFixed(2);

  state.energy *= 0.93;
}

/* ── 방치 감시 ─────────────────────────────────────────── */

function checkIdle() {
  if (state.ended) return;
  if (activeScreen() !== "live") return;
  const idle = Date.now() - state.lastActivity;
  if (state.watching && idle > 45 * 1000) {
    chatSys("반죽이 굳는 중.");
    later(() => runEnding("F"), 2500);
  } else if (state.phase >= 3 && idle > 120 * 1000) {
    chatSys("반죽이 굳는 중.");
    later(() => runEnding("F"), 2500);
  }
}

/* ── 커맨드 라우팅 ─────────────────────────────────────── */

document.querySelectorAll("[data-cmd]").forEach((btn) => {
  btn.addEventListener("click", () => handleCmd(btn.dataset.cmd));
});

function handleCmd(cmd) {
  state.lastActivity = Date.now();
  switch (cmd) {
    case "desktop":
      if (!state.unlocked.desktop) { chatSys("filesystem: locked. (이상 현상 3개 필요)"); return; }
      openDesktop(); break;
    case "clues": $("#clue-panel").classList.toggle("hidden"); renderClues(); break;
    case "back": showScreen("live"); break;
    case "quit": attemptEndStream(); break;
    case "lastmsg": armLastMessage(); break;
    case "menu": openMenu(); break;
    case "quiz": startQuiz(); break;
    case "preserve": runEnding("E"); break;
    case "restore-run": runRestore(); break;
    case "puzzle-next": puzzleNext(); break;
    case "puzzle-exit": puzzleExit(); break;
  }
}

/* ── Block 2: PC 파일 탐색 ────────────────────────────── */

let deskDir = "root"; // root | alert

function openDesktop() {
  showScreen("desktop");
  renderDesk();
  updateObjective();
}

function deskEntries() {
  if (deskDir === "alert") {
    return [
      { name: "..", up: true },
      ...Object.entries(DATA.alertFiles).map(([name, f]) => ({ name, alert: f })),
    ];
  }
  if (deskDir === "scripts") {
    return [
      { name: "..", up: true },
      ...Object.entries(DATA.scriptFiles).map(([name, f]) => ({ name, script: f })),
    ];
  }
  if (deskDir === "recordings") {
    return [
      { name: "..", up: true },
      ...DATA.clips.map((c) => ({ name: c.name, clip: c })),
    ];
  }
  return Object.entries(DATA.files)
    .filter(([name, f]) => {
      if (f.ngOnly && save.runs < 1) return false;
      if (name === "do_not_restore.txt" && !state.dnrVisible) return false;
      if (f.finalTale && !state.finalTaleVisible) return false;
      return true;
    })
    .map(([name, f]) => ({ name, f }));
}

function isUnlocked(f) {
  if (!f.locked) return true;
  if (f.open === "alert") return state.unlocked.alert;
  if (f.open === "recordings") return state.mapConfirmed;
  if (f.open === "records") return state.unlocked.records;
  if (f.open === "routine") return state.unlocked.routine;
  if (f.open === "restore") return state.unlocked.restore;
  return false;
}

const ADDR_BASE = {
  root: "C:\\stream\\Desktop\\",
  alert: "C:\\stream\\Desktop\\alert_test\\",
  scripts: "C:\\stream\\Desktop\\stream_scripts\\",
  recordings: "C:\\stream\\Desktop\\recordings\\",
};

function updateAddr() {
  const a = $("#addr-input");
  if (a) a.value = ADDR_BASE[deskDir] || ADDR_BASE.root;
}

const DIR_SEGMENTS = ["desktop", "alert_test", "stream_scripts", "recordings", ""];

$("#addr-input").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  state.lastActivity = Date.now();
  const raw = e.target.value.trim();
  const name = (raw.split("\\").filter(Boolean).pop() || "").toLowerCase();
  if (DIR_SEGMENTS.includes(name.replace("c:", ""))) { updateAddr(); return; }
  const entries = deskEntries();
  const hit =
    entries.find((x) => x.name.toLowerCase().replace(/\/$/, "") === name.replace(/\/$/, "")) ||
    (name.length >= 2 && entries.find((x) => x.name.toLowerCase().includes(name)));
  if (hit) {
    openDeskEntry(hit);
    renderDesk();
    updateAddr();
  } else {
    // 진짜 윈도우의 그 문구
    setDeskView(
      `Windows에서 '${raw}'을(를) 찾을 수 없습니다.\n` +
      `이름을 올바르게 입력했는지 확인하고 다시 시도하십시오.`);
    AUDIO.glitch(0.3);
  }
});

function renderDesk() {
  const list = $("#desk-list");
  list.innerHTML = "";
  updateAddr();
  deskEntries().forEach((e) => {
    const b = document.createElement("button");
    b.textContent = e.name;
    if (e.f && e.f.type === "folder") {
      b.classList.add("folder");
      if (!isUnlocked(e.f)) b.classList.add("locked");
    }
    if (e.name === "do_not_restore.txt" && !state.dnrRead) b.classList.add("new");
    if (e.name === "returning_viewer.log") b.classList.add("new");
    b.addEventListener("click", () => {
      list.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      openDeskEntry(e);
    });
    list.appendChild(b);
  });
}

function setDeskView(text, old) {
  const v = $("#desk-view");
  v.textContent = text;
  v.classList.toggle("oldtext", !!old);
  $("#desk-actions").innerHTML = "";
}

function deskAction(label, fn, done) {
  const b = document.createElement("button");
  b.textContent = label;
  if (done) { b.classList.add("done"); b.disabled = true; }
  else b.addEventListener("click", fn);
  $("#desk-actions").appendChild(b);
}

function openDeskEntry(e) {
  state.lastActivity = Date.now();

  if (e.up) { deskDir = "root"; renderDesk(); setDeskView("Desktop으로 돌아왔습니다."); return; }

  /* recordings/ 내부 — 클립 재생 */
  if (e.clip) {
    const done = state.clipsDone.has(e.clip.id);
    setDeskView(`${e.clip.name}\n\n잘려나간 다시보기 조각.` +
      (done ? "\n\n[검토 완료]" : "\n\n재생하면 어긋난 점을 찾아야 합니다."));
    deskAction(done ? "다시 재생" : "재생", () => playClip(e.clip));
    return;
  }

  /* stream_scripts/ 내부 — 대본은 낡은 글씨로 */
  if (e.script) {
    setDeskView(e.script.body, true);
    return;
  }

  /* alert_test/ 내부 */
  if (e.alert) {
    if (e.alert.exe) { startParser(); return; }
    setDeskView(e.alert.body);
    if (!state.alertFailRead) {
      state.alertFailRead = true;
      addClue("휴식 관련 알림만 모두 전송에 실패했다. 파서가 휴식 단어를 지우고 있다.",
        "→ parser_recovery.exe 로 어떤 단어가 지워졌는지 직접 복원할 수 있다.");
    }
    return;
  }

  const f = e.f;

  /* 잠긴 폴더: 해금 조건이 곧 힌트 */
  if (f.type === "folder" && !isUnlocked(f)) {
    setDeskView(`${e.name}\n\n${f.lockHint}`);
    return;
  }

  if (f.type === "folder" || f.open) {
    switch (f.open) {
      case "alert": deskDir = "alert"; renderDesk(); setDeskView("alert_test/\n\n알림 테스트 기록과 파서 복구 도구."); return;
      case "scripts": deskDir = "scripts"; renderDesk(); setDeskView("stream_scripts/\n\n괴담 라디오 대본 폴더.\n매주 두 편씩, 빠짐없이 쌓여 있다."); return;
      case "recordings": deskDir = "recordings"; renderDesk(); setDeskView(`recordings/\n\n잘려나간 다시보기 조각 ${DATA.clips.length}개.\n검토: ${state.clipsDone.size}/${DATA.clips.length}`); return;
      case "records": openRecords(); return;
      case "routine": openRoutine(); return;
      case "restore": openRestore(); return;
      case "archive": openArchive(); return;
    }
  }

  if (e.name === "live_page.html") { showScreen("live"); return; }

  if (f.interactive === "fanlog") { renderFanlog(); return; }

  if (f.finalTale) { openFinalTale(); return; }

  if (e.name === "do_not_restore.txt") {
    setDeskView(f.body, true);
    if (!state.dnrRead) {
      state.dnrRead = true;
      addClue("do_not_restore.txt — 휴식 엔딩 조건표: routine_queue를 복원 소스에서 뺄 것.",
        "→ 조건이 다 모이면 SYSTEM MENU의 [5] rest 가 열린다.");
      renderDesk();
      updateObjective();
    }
    return;
  }

  if (e.name === "returning_viewer.log") {
    setDeskView(
`returning_viewer.log

previous_entry_detected: true
previous_ending: ${save.lastEnding || "unknown"}
previous_displayed_as: "${save.lastDisplayed || "해도 돼"}"
status: returned

나간 기록이 없으면, 들어온 것도 아니다.
이어지고 있는 것이다.`, true);
    return;
  }

  /* 일반 파일 */
  setDeskView(f.body || "(빈 파일)");

  if (e.name === "chat_motion_map.tmp" && f.action) {
    deskAction(f.action.label, () => {
      state.mapConfirmed = true;
      if (!state.unlocked.alert) {
        state.unlocked.alert = true;
        chatSys("alert_test/ unlocked.");
      }
      addClue("output source는 chat_stream — 형상은 채팅으로 움직인다. 그리고 \"쉬어\"만 음수 가중치.",
        "→ alert_test/ 가 열렸다. 왜 '쉬어'가 충돌인지 그 안에 기록이 있다.");
      renderDesk();
      openDeskEntry(e); // 액션 done 상태로 다시 그림
      updateObjective();
    }, state.mapConfirmed);
  }
}

/* 마지막_괴담.txt — 이 방송 자체가 괴담이다. 읽는 동안 단 한 번, 마이크가 살아난다 */
function openFinalTale() {
  setDeskView(DATA.finalTale + "\n\n반죽이_현재", true);
  if (state.finalTaleRead) return;
  state.finalTaleRead = true;

  AUDIO.silence(4.5);                       // 룸톤이 끊기고
  later(() => AUDIO.radioTune(2.6), 800);   // 주파수가 채널을 헤매고
  state.micAliveUntil = Date.now() + 6000;  // 죽어 있던 마이크가 떨린다

  const status = $("#status-text");
  const prev = DATA.statusbars[state.phase];
  status.textContent = "mic: INPUT DETECTED | avatar: still | chat: connected";

  later(() => AUDIO.voice("아직", 0.3, 0.55), 3200); // 반속의 낮은 한 마디
  later(() => {
    status.textContent = prev;
    if (!state.ended) chatAdd("방금 마이크 켜졌었지", "creep");
  }, 6500);

  addClue("마지막_괴담.txt — 이 방송 이야기다. 마지막 줄에 내 이름이 적혀 있다.",
    "→ 괴담은 끝까지 들어야 끝난다. 어떤 엔딩을 골라도 마지막 줄은 남는다.");
}

/* fan_chat_log.txt — 깨진 줄 클릭 퍼즐 */
const FANLOG_PUZZLE_MAP = { 2: "p1", 5: "p2", 8: "p3" }; // 줄 idx → 복원 퍼즐

/* 손상 구간 확인 — 직접 클릭하거나, 해당 퍼즐을 복원해도 인정된다 */
function markFanBroken(idx, viaPuzzle) {
  if (state.fanBroken.has(idx)) return;
  state.fanBroken.add(idx);
  if (!viaPuzzle) chatSys(`fan_chat_log: 손상 구간 표시됨 (${state.fanBroken.size}/3)`);
  if (state.fanBroken.size >= 3 && !state.unlocked.records) {
    state.unlocked.records = true;
    chatSys("viewer_records/ unlocked.");
    toast("viewer_records/ 잠금 해제");
    addClue("깨진 시간대 3곳 모두 '쉬라'는 말이 있던 자리였다.",
      "→ viewer_records/ 가 열렸다. 이전 반죽이들의 원문도 저렇게 잘렸는지 대조해 보자.");
  }
  updateObjective();
}

function renderFanlog() {
  const view = $("#desk-view");
  $("#desk-actions").innerHTML = "";
  view.innerHTML = "fan_chat_log.txt\n(깨진 시간대 [--:--] 줄을 클릭해 표시하세요)\n\n";
  DATA.fanlogLines.forEach((l, idx) => {
    const span = document.createElement("span");
    const pid = FANLOG_PUZZLE_MAP[idx];
    const restored = pid && state.solvedPuzzles.has(pid);
    if (l.broken && !restored) {
      span.className = "broken-line" + (state.fanBroken.has(idx) ? " marked" : "");
      span.textContent = `[${l.t}] ${l.m}`;
      span.addEventListener("click", () => {
        markFanBroken(idx, false);
        renderFanlog();
      });
    } else if (l.broken && restored) {
      const full = DATA.puzzles.find((p) => p.id === pid);
      span.className = "broken-line marked";
      span.textContent = `[복원] ${full.fan.replace("____", full.ans)}`;
    } else {
      span.textContent = `[${l.t}] ${l.m}`;
    }
    view.appendChild(span);
    view.appendChild(document.createTextNode("\n"));
  });
}

/* ── recordings: 클립 재생 → 어긋남 찾기 ──────────────── */

function playClip(clip) {
  showScreen("live");
  const lineGap = 1800;
  const dur = 1300 + clip.lines.length * lineGap + 1200;
  state.clipUntil = Date.now() + dur;

  setStageBg("bg_live2");
  $("#live-badge").textContent = "다시보기";
  $("#status-text").textContent = "source: recording | mic: -- | chat: read-only";
  AUDIO.radioTune(1.2);

  clip.lines.forEach((l, i) => {
    later(() => { if (!state.ended) showSubtitle(l); }, 1300 + i * lineGap);
  });
  // 녹화 특유의 흐릿한 음성 잔재
  later(() => AUDIO.voice("아", 0.22, 0.7, true), 1300 + lineGap);

  later(() => {
    if (state.ended) return;
    $("#subtitle").classList.add("hidden");
    setStageBg("bg_live");
    $("#live-badge").textContent = "LIVE";
    $("#status-text").textContent = DATA.statusbars[state.phase];
    state.clipUntil = 0;
    startClipQuiz(clip);
  }, dur);
}

function startClipQuiz(clip) {
  puzzleCtx = {
    list: [{ id: clip.id, q: clip.q, opts: clip.opts, ans: clip.ans,
             success: clip.success, clue: clip.clue }],
    idx: 0, mode: "clip", returnTo: "desktop",
  };
  showScreen("puzzle");
  $("#puzzle-path").textContent = clip.name + " — 검토";
  renderPuzzle();
}

/* ── Block 3: 파싱 복원 퍼즐 (퀴즈와 공용 러너) ────────── */

let puzzleCtx = null;

function startParser() {
  const remaining = DATA.puzzles.filter((p) => !state.solvedPuzzles.has(p.id));
  if (!remaining.length) {
    setDeskView("parser_recovery.exe\n\n복원 가능한 항목이 없습니다.\n전체 복원 완료.");
    return;
  }
  // 필수 먼저, 그다음 선택
  remaining.sort((a, b) => (b.req ? 1 : 0) - (a.req ? 1 : 0));
  puzzleCtx = { list: remaining, idx: 0, mode: "parser", returnTo: "desktop" };
  showScreen("puzzle");
  $("#puzzle-path").textContent = "parser_recovery.exe — 채팅 파싱 복원";
  renderPuzzle();
  updateObjective();
}

function startQuiz() {
  puzzleCtx = { list: DATA.quiz.map((q, i) => ({ ...q, id: "quiz" + i })), idx: 0, mode: "quiz", returnTo: "records" };
  showScreen("puzzle");
  $("#puzzle-path").textContent = "viewer_records — 기록 대조";
  renderPuzzle();
}

function renderPuzzle() {
  const p = puzzleCtx.list[puzzleCtx.idx];
  const txt = $("#puzzle-text");
  $("#btn-puzzle-next").classList.add("hidden");

  if (puzzleCtx.mode === "parser") {
    const reqTag = p.req ? "[필수]" : "[선택]";
    txt.textContent =
`${reqTag} 복원 ${solvedReq()}/${DATA.puzzleReqCount} (필수 기준)

fan message (원문 손상):
"${p.fan}"

system parsed:
"${p.parsed}"

빠진 단어를 복원하세요.`;
  } else {
    txt.textContent = p.q;
  }

  const opts = $("#puzzle-opts");
  opts.innerHTML = "";
  p.opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.textContent = `[${i + 1}] ${o}`;
    b.addEventListener("click", () => answerPuzzle(p, o, b));
    opts.appendChild(b);
  });
}

function answerPuzzle(p, opt, btn) {
  state.lastActivity = Date.now();
  if (opt !== p.ans) {
    btn.classList.add("wrong");
    btn.disabled = true;
    state.wrongParse++;
    $("#puzzle-text").textContent += `\n\nparse failed. corruption +1`;
    AUDIO.glitch(0.5);
    return;
  }
  btn.classList.add("correct");
  $("#puzzle-opts").querySelectorAll("button").forEach((b) => (b.disabled = true));
  $("#puzzle-text").textContent += "\n\n" + p.success.join("\n");
  AUDIO.tick();

  if (puzzleCtx.mode === "parser") {
    state.solvedPuzzles.add(p.id);
    if (p.clue) addClue(p.clue, p.next);
    // 파싱 복원은 fan_chat_log의 해당 손상 구간 확인으로도 인정
    Object.entries(FANLOG_PUZZLE_MAP).forEach(([idx, pid]) => {
      if (pid === p.id) markFanBroken(Number(idx), true);
    });
    if (p.effect === "unlock-routine" && !state.unlocked.routine) {
      state.unlocked.routine = true;
      chatSys("routine_queue/ unlocked.");
      toast("routine_queue/ 잠금 해제");
      // 시스템의 불쾌한 반응
      later(() => { state.energy = 5; AUDIO.glitch(0.8); }, 600);
    }
    if (p.effect === "negation-rule") state.negationRule = true;
    if (p.id === "p3") state.endStreamHint = true;
    if (solvedReq() === DATA.puzzleReqCount) {
      $("#puzzle-text").textContent += "\n\n→ 필수 복원 완료. routine_queue/ 로.";
    }
  } else if (puzzleCtx.mode === "clip") {
    state.clipsDone.add(p.id);
    if (p.clue) addClue(p.clue);
    if (state.clipsDone.size === DATA.clips.length) {
      later(() => {
        toast("recordings: 모든 클립 검토 완료");
        AUDIO.voice("기다려", 0.3, 0.55);
        addClue(DATA.clipsAllClue.text, DATA.clipsAllClue.next);
      }, 900);
    }
  } else {
    if (p.effect === "negation-rule") state.negationRule = true;
    if (p.clue) addClue(p.clue, p.next);
    if (puzzleCtx.idx === puzzleCtx.list.length - 1) finishQuiz();
  }

  $("#btn-puzzle-next").classList.remove("hidden");
  updateObjective();
}

function puzzleNext() {
  if (puzzleCtx.idx < puzzleCtx.list.length - 1) {
    puzzleCtx.idx++;
    renderPuzzle();
  } else {
    puzzleExit();
  }
}

function puzzleExit() {
  const to = puzzleCtx ? puzzleCtx.returnTo : "desktop";
  puzzleCtx = null;
  if (to === "records") openRecords();
  else { showScreen("desktop"); renderDesk(); }
  updateObjective();
}

function finishQuiz() {
  state.quizDone = true;
  chatSys("distortion rule detected.");
  // 숨은 기록 해금
  chatSys("viewer_records: 숨은 기록 2개가 나타났습니다.");
}

/* ── Block 4: routine_queue ───────────────────────────── */

function openRoutine() {
  showScreen("routine");
  renderTodos();
  updateObjective();
}

function renderTodos() {
  const list = $("#todo-list");
  list.innerHTML = "";
  const names = Object.keys(DATA.todos).concat(state.spawnedTodos);
  if (save.runs >= 2 && !state.routineCleared) names.push("skip_routine.sys");
  names.forEach((name) => {
    const b = document.createElement("button");
    b.textContent = name;
    if (name.endsWith(".log")) b.classList.add("folder");
    if (state.spawnedTodos.includes(name)) b.classList.add("new");
    b.addEventListener("click", () => {
      list.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      openTodo(name);
    });
    list.appendChild(b);
  });
}

function todoAction(label, fn) {
  const b = document.createElement("button");
  b.textContent = label;
  b.addEventListener("click", fn);
  $("#todo-actions").appendChild(b);
}

function setTodoView(text) {
  $("#todo-view").textContent = text;
  $("#todo-actions").innerHTML = "";
}

function openTodo(name) {
  state.lastActivity = Date.now();

  if (name === "skip_routine.sys") {
    setTodoView("skip_routine.sys\n\n3회차 권한이 감지되었습니다.\n루틴 전체를 건너뛸 수 있습니다.");
    todoAction("루틴 통째로 건너뛰기", () => routineSucceed(true));
    return;
  }

  if (state.spawnedTodos.includes(name)) {
    setTodoView(`${name}\n\nnew task created.\n(루틴이 다시 만든 작업입니다. 순서가 틀렸다는 뜻.)`);
    return;
  }

  const t = DATA.todos[name];
  setTodoView(t.body);

  if (t.log) {
    if (!state.restRefusalRead) {
      state.restRefusalRead = true;
      if (state.routineStep < 2) state.routineStep = 2;
      addClue("거절 순서: 이것만 끝나고(잠) → 짧게라도(다음 방송) → 나중에. 끊으려면 이 순서대로 처리.",
        "→ sleep_after_this → next_stream → rest_later 순서로 액션을 누를 것.");
      if (!state.dnrVisible) {
        state.dnrVisible = true;
        chatSys("Desktop: 숨겨져 있던 파일이 보이게 되었습니다.");
      }
      updateObjective();
    }
    return;
  }

  if (state.routineCleared) return;

  if (t.trap) {
    todoAction("완료 처리", () => routineFail(name));
    return;
  }

  if (t.action) {
    todoAction(t.action.label, () => {
      if (!state.restRefusalRead) { routineFail(name); return; }
      if (state.routineStep === t.step) {
        state.routineStep++;
        if (t.step === 4) { routineSucceed(false); return; }
        setTodoView(t.body + `\n\n→ 처리됨. (${t.step - 1}/3)`);
        chatSys(`routine: ${name} 처리됨.`);
        AUDIO.tick();
        updateObjective();
      } else {
        routineFail(name);
      }
    });
  }
}

function routineFail(name) {
  state.routineFails++;
  AUDIO.glitch(0.8);
  shakeFrame();
  let spawnLine = "";
  if (state.spawnedTodos.length < DATA.todoTrapNames.length) {
    const newTask = DATA.todoTrapNames[state.spawnedTodos.length];
    state.spawnedTodos.push(newTask);
    spawnLine = `\n\nnew task created:\n${newTask}`;
  }
  setTodoView(`${DATA.routineFail.join("\n")}${spawnLine}\n\nroutine_failure_count: ${state.routineFails}` +
    (state.routineFails >= 4 ? "\n\nrest_refusal.log" : ""));
  chatSys("routine_queue regenerated.");
  renderTodos();
  updateObjective();
}

function routineSucceed(skipped) {
  state.routineCleared = true;
  state.menuUnlocked = true;
  $("#btn-menu").classList.remove("hidden");
  setTodoView(DATA.routineSuccess.join("\n") +
    (skipped ? "\n\n(skip 권한 사용됨)" : "") +
    "\n\nrest_later.todo: 마지막 줄이 선택되었습니다." +
    "\n\n→ 방송 화면에 SYSTEM MENU 가 생겼습니다.");
  $("#todo-actions").innerHTML = "";
  chatSys("routine loop weakened.");
  chatSys("rest option partially available.");
  addClue("루틴이 끊겼다. rest는 이제 시스템이 막을 수만은 없는 선택지다.",
    "→ 남은 조건은 do_not_restore.txt 에 정리되어 있다.");
  setPhase(3);
  AUDIO.silence(2);
  updateObjective();
}

/* ── Block 5: viewer_records ──────────────────────────── */

function currentLogBody() {
  let body =
`entered: now
last_scene: viewer_records
ending: undecided
message: ${state.playerMsgs > 0 ? "archived" : "empty"}
motion_contribution: ${state.motion}
assigned_name: 반죽이_현재`;
  if (save.runs >= 1) {
    body += `

previous_entry_detected: true
previous_displayed_as: "${save.lastDisplayed || "해도 돼"}"
previous_ending: ${save.lastEnding || "unknown"}
status: returned`;
  }
  return body;
}

function openRecords() {
  showScreen("records");
  const list = $("#file-list");
  list.innerHTML = "";
  let files = [...DATA.records];
  if (state.quizDone) files = files.concat(DATA.hiddenRecords);
  files.push({ name: "current.log", current: true });
  files.forEach((f) => {
    const b = document.createElement("button");
    b.textContent = f.name;
    if (f.odd) b.classList.add("odd");
    if (f.newFile) b.classList.add("new");
    b.addEventListener("click", () => {
      list.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      $("#file-view").textContent = f.current ? currentLogBody() : f.body;
      $("#file-view").classList.toggle("oldtext", !!(f.odd || f.newFile));
      if (!f.current) {
        state.recViewed.add(f.name);
        if (state.recViewed.size >= 2 && !state.unlocked.restore) {
          state.unlocked.restore = true;
          chatSys("restore/ unlocked.");
          toast("restore/ 잠금 해제");
          addClue("기록 2개 대조 — original에서 '쉬세요/하지 마' 부분만 사라져 있다.",
            "→ 3개째를 보고 [기록 대조] 로 규칙을 확정하자. restore/ 도 열렸다.");
        }
        if (state.recViewed.size >= 3 && !state.quizDone) $("#btn-quiz").classList.remove("hidden");
      } else {
        $("#btn-preserve").classList.remove("hidden");
        AUDIO.glitch(0.5);
      }
      updateObjective();
    });
    list.appendChild(b);
  });
  $("#file-view").textContent = "파일을 선택하세요.\n(original_message 와 displayed_as 를 비교할 것)";
  if (state.recViewed.size >= 3 && !state.quizDone) $("#btn-quiz").classList.remove("hidden");
  else $("#btn-quiz").classList.add("hidden");
  updateObjective();
}

/* ── ARCHIVE ──────────────────────────────────────────── */

let archiveWhispered = false;

function openArchive() {
  showScreen("archive");
  $("#archive-view").textContent =
    state.phase >= 3 ? DATA.archiveCorrupted : DATA.archiveNormal;
  if (state.phase >= 3) {
    AUDIO.glitch(0.8);
    if (!archiveWhispered) {
      archiveWhispered = true;
      later(() => AUDIO.voice("내가뭘보고있는거지", 0.5), 1600);
    }
  }
}

/* ── Block 6: 복원 소스 실험 ──────────────────────────── */

function openRestore() {
  showScreen("restore");
  renderSources();
  $("#restore-log").textContent =
`RESTORE SOURCE

broadcaster: not found
voice_input: none
generated_voice: available
반죽_records: ${state.recViewed.size}건 loaded
chat_stream: active

restore_rate: ${state.restore}%
${state.routineSourceUsed ? "\nroutine source: restored (되돌릴 수 없음)\nrest permission: denied" : ""}

소스를 선택하고 복원을 실행하세요.
어떤 소스는 복원하지 않는 것이 더 나을 수 있다.`;
  updateObjective();
}

function renderSources() {
  const panel = $("#source-panel");
  panel.innerHTML = "";
  DATA.sources.forEach((s) => {
    const label = document.createElement("label");
    if (s.warn) label.classList.add("warn-src");
    if (state.sources.has(s.id)) label.classList.add("on");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = state.sources.has(s.id);
    cb.addEventListener("change", () => {
      if (cb.checked) state.sources.add(s.id);
      else state.sources.delete(s.id);
      label.classList.toggle("on", cb.checked);
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode("[" + (state.sources.has(s.id) ? "x" : " ") + "] " + s.label));
    const note = document.createElement("span");
    note.className = "src-note";
    note.textContent = s.note;
    label.appendChild(note);
    panel.appendChild(label);
  });
}

let restoring = false;

function runRestore() {
  if (restoring) return;
  if (!state.sources.size) {
    $("#restore-log").textContent += "\n\nno source selected.";
    return;
  }
  restoring = true;
  $("#btn-restore-run").disabled = true;
  AUDIO.bgm("bgm_drone_ai", 0.35); // 타임스트레치 아티팩트 패드

  const chosen = DATA.sources.filter((s) => state.sources.has(s.id));
  const log = $("#restore-log");
  log.textContent = "RESTORE SOURCE — 실행 중\n";
  let i = 0;

  const step = () => {
    if (i < chosen.length) {
      const s = chosen[i++];
      log.textContent += "\n[" + s.label + "]\n" + s.logs.join("\n") + "\n";
      log.scrollTop = log.scrollHeight;
      AUDIO.glitch(0.5);
      if (s.voice) {
        playVoiceFragment("고...");
        later(() => playVoiceFragment("고마..."), 1500);
        log.textContent += "\nvoice output generated.\nbroadcaster: not found\n";
      }
      if (s.id === "routine_queue") {
        state.routineSourceUsed = true;
        state.energy = 6;
        chatSys("rest permission: denied");
      }
      later(step, 1400);
    } else {
      finishRestoreRun();
    }
  };
  step();
}

function finishRestoreRun() {
  restoring = false;
  $("#btn-restore-run").disabled = false;
  state.restore = 25 * state.sources.size;
  state.restoreRan = true;
  state.menuUnlocked = true;
  $("#btn-menu").classList.remove("hidden");
  setPhase(3);

  const log = $("#restore-log");
  log.textContent += `\nrestore_rate: ${state.restore}%\nbroadcaster: not found\n`;
  log.textContent += "\n→ SYSTEM MENU 가 열렸습니다. (방송 화면 하단)";
  log.scrollTop = log.scrollHeight;

  if (state.restore >= 60 && !state.dnrVisible) {
    state.dnrVisible = true;
    chatSys("Desktop: do_not_restore.txt 가 나타났습니다.");
  }
  if (state.routineSourceUsed) {
    addClue("routine_queue를 소스로 복원했다. 형상이 채팅 없이도 흔들린다. rest가 거부된다.",
      "→ 이번 회차에서는 되돌릴 수 없다. 다음 회차의 교훈.");
  } else {
    addClue(`복원 실험: ${state.restore}% — 루틴은 소스에서 뺐다.`,
      "→ do_not_restore.txt 조건 충족에 가까워졌다.");
  }
  chatSys(`restore_rate: ${state.restore}%`);
  updateObjective();
}

/* ── Block 7: SYSTEM MENU ─────────────────────────────── */

function restBlockers() {
  const r = [];
  if (state.routineSourceUsed) r.push("reason: routine source restored");
  if (!state.routineCleared) r.push("routine_queue 가 아직 돌고 있다 (루틴 끊기 필요)");
  if (!state.restRefusalRead) r.push("rest_refusal.log 미확인");
  if (!state.negationRule) r.push("왜곡 규칙 미확인 (viewer_records 기록 대조)");
  if (!state.dnrRead) r.push("do_not_restore.txt 미확인");
  return r;
}

function openMenu() {
  if (!state.menuUnlocked) { chatSys("SYSTEM MENU: locked."); return; }
  showScreen("menu");
  $("#menu-head").textContent = DATA.menuHead +
    `\nrestore_rate: ${state.restore}%` +
    `\nroutine: ${state.routineCleared ? "weakened" : (state.routineSourceUsed ? "restored" : "active")}`;

  const opts = $("#menu-opts");
  opts.innerHTML = "";

  const mk = (label, sub, fn, disabled, reasonLines) => {
    const b = document.createElement("button");
    b.textContent = label;
    if (sub) {
      const s = document.createElement("span");
      s.className = "hintline";
      s.textContent = sub;
      b.appendChild(s);
    }
    (reasonLines || []).forEach((r) => {
      const s = document.createElement("span");
      s.className = "reason";
      s.textContent = r;
      b.appendChild(s);
    });
    if (disabled) b.classList.add("disabled");
    else b.addEventListener("click", fn);
    opts.appendChild(b);
    return b;
  };

  mk("[1] restore_source.exe",
    state.restoreRan ? `복원률 ${state.restore}% — 이 출력으로 형상을 확정한다` : "restore/ 에서 먼저 소스 실험 필요",
    () => menuRestore(), !state.restoreRan);

  mk("[2] end_stream.exe",
    state.endStreamHint ? "\"방송 꺼도 괜찮아\" — 허락은 이미 받았다 (p3 복원)" : "방송을 종료한다",
    () => attemptEndStream(), false);

  mk("[3] archive_current.log",
    state.recViewed.size >= 4 ? "recommended — 기록을 많이 열람했다" : "자신의 기록을 보존한다",
    () => runEnding("E"), false);

  mk("[4] keep_watching",
    "형상과 함께 남는다 (입력이 없으면 그대로 기록된다)",
    () => { state.watching = true; showScreen("live"); state.lastActivity = Date.now(); updateObjective(); }, false);

  const blockers = restBlockers();
  const restBtn = mk("[5] rest",
    blockers.length ? "[5] rest unavailable" : "rest available — 루틴을 끊고, 복원하지 않고, 나간다",
    () => runEnding("R"), blockers.length > 0, blockers);
  if (!blockers.length) restBtn.classList.add("rest-on");
}

function menuRestore() {
  if (state.sources.has("archive_voice")) finalVoiceScene();
  else runEnding("D");
}

/* ── 복원 엔딩 음성 연출 ──────────────────────────────── */

function finalVoiceScene() {
  showScreen("live");
  state.energy = 5;
  AUDIO.silence(2.5);
  const seq = DATA.restoreVoiceSeq;
  let i = 0;
  const speak = () => {
    if (i < seq.length) {
      playVoiceFragment(seq[i++]);
      later(speak, 1700);
    } else {
      $("#stage-caption").textContent = "output generated from 382 archived messages.";
      DATA.restoreEndChat.forEach((m, k) => later(() => chatAdd(m), 600 + k * 800));
      const after = 600 + DATA.restoreEndChat.length * 800;
      // 복원된 것이 그녀의 클로징 멘트 형식을 쓴다
      later(() => { if (!state.ended) chatAdd("오늘 괴담은 여기까지래", "creep"); }, after + 1400);
      later(() => runEnding("D"), after + 3600);
    }
  };
  speak();
}

function playVoiceFragment(text) {
  const ov = $("#voice-overlay");
  ov.textContent = `"${text}"`;
  ov.classList.remove("hidden");
  AUDIO.voice(text);
  shakeFrame();
  later(() => ov.classList.add("hidden"), 1300);
}

/* ── 마지막 메시지 (Ending C) ─────────────────────────── */

function armLastMessage() {
  state.lastMsgMode = true;
  const input = $("#chat-input");
  input.placeholder = "마지막 메시지를 입력하고 전송하세요";
  input.focus();
  chatSys("message will be assigned to avatar_motion.");
}

function endingC(raw) {
  const out = corrupt(raw);
  state.lastCorrupted = out;
  chatAdd(out, "mine");
  state.motion++;
  later(() => runEnding("C"), 1800);
}

/* ── 방송 종료 페이크아웃 ─────────────────────────────── */

function attemptEndStream() {
  if (state.ended) return;
  if (state.phase >= 2 && !state.endFakeout) {
    state.endFakeout = true;
    showScreen("live");
    $("#live-badge").textContent = "ENDING";
    AUDIO.silence(2.8);
    later(() => { if (!state.ended) chatAdd("방금 누가 나가려고 했어", "creep"); }, 1000);
    later(() => { if (!state.ended) chatAdd("너구나", "creep"); }, 2300);
    later(() => runEnding("A"), 3800);
  } else {
    runEnding("A");
  }
}

/* ── 전송 전 선독: 쓰다 멈춘 글을 채팅이 먼저 읽는다 (1회) ── */

let preReadTimer = 0;

$("#chat-input").addEventListener("input", (e) => {
  if (state.preReadDone || state.phase < 3 || state.ended) return;
  clearTimeout(preReadTimer);
  if (e.target.value.trim().length >= 3) {
    preReadTimer = setTimeout(() => {
      if (state.ended || state.preReadDone) return;
      if ($("#chat-input").value.trim().length < 3) return;
      state.preReadDone = true;
      chatAdd("그거 보내지 마", "creep");
    }, 2200);
    state.timers.push(preReadTimer);
  }
});

/* ── 입력 흔적 감지 — 쓰다 지운 것도 보인다 ───────────── */

let prevInputLen = 0;
let eraseNoticeAt = 0;

$("#chat-input").addEventListener("input", (e) => {
  const len = e.target.value.length;
  if (state.phase >= 2 && !state.ended &&
      prevInputLen >= 4 && len === 0 &&
      Date.now() > eraseNoticeAt) {
    eraseNoticeAt = Date.now() + 90 * 1000;
    later(() => {
      if (!state.ended) chatAdd("방금 쓰다 만 거 뭐였어", "creep");
    }, 2500);
  }
  prevInputLen = len;
});

/* ── 탭 이탈 감지 — 자리를 비운 것도 보인다 ───────────── */

let hiddenAt = 0;
let blurNoticeAt = 0;

document.addEventListener("visibilitychange", () => {
  if (state.ended || state.phase < 2) return;
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && Date.now() - hiddenAt > 3000 && Date.now() > blurNoticeAt) {
    blurNoticeAt = Date.now() + 120 * 1000;
    later(() => {
      if (!state.ended) chatAdd("다른 거 보고 왔네", "creep");
    }, 1800);
  }
});

/* ── 엔딩 공통 + NG+ 저장 ─────────────────────────────── */

/* 엔딩 직전 마이크 변주: 죽어 있던 마이크가 아주 짧게 한 번 더 떨린다.
 * rest 엔딩만 예외 — 그때만 마이크는 끝까지 조용하다. */
function runEnding(key) {
  if (state.ended) return;
  if (key !== "R" && state.phase >= 2 && !state.micOutroDone) {
    state.micOutroDone = true;
    showScreen("live");
    state.micAliveUntil = Date.now() + 2400;
    const status = $("#status-text");
    status.textContent = "mic: input detected";
    AUDIO.radioTune(1.5);
    later(() => AUDIO.voice("고", 0.35, 0.6), 600);
    later(() => AUDIO.voice("보고", 0.28, 0.55), 1500);
    later(() => endingSequence(key), 2800);
    return;
  }
  endingSequence(key);
}

function endingSequence(key) {
  if (state.ended) return;
  state.ended = true;
  clearTimers();
  if (key !== "R") AUDIO.glitch(1);

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      runs: save.runs + 1,
      lastEnding: { A: "exited", C: "sent", D: "restored", E: "preserved", F: "not moving", R: "rest accepted" }[key],
      lastDisplayed: state.lastCorrupted || "",
    }));
  } catch { /* 저장 불가 환경 */ }

  showScreen("ending");
  const log = $("#ending-log");
  log.innerHTML = "";
  const lines = DATA.endings[key].split("\n");
  let i = 0;
  const step = () => {
    if (i < lines.length) {
      const line = lines[i++];
      const span = document.createElement("span");
      if (/not found|kneaded|굳는|inactive|denied/.test(line)) span.className = "bad";
      if (/rest accepted|나갔습니다/.test(line)) span.className = "ok";
      span.textContent = line + "\n";
      log.appendChild(span);
      setTimeout(step, line === "" ? 480 : 220 + Math.random() * 230);
    } else {
      $("#btn-reconnect").classList.remove("hidden");
    }
  };
  step();
}

$("#btn-reconnect").addEventListener("click", () => location.reload());

/* ── 시작 ─────────────────────────────────────────────── */

boot();
