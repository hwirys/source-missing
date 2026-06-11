/* ─────────────────────────────────────────────────────────────
 * data.js — 텍스트/연출/퍼즐 데이터 (사양서 v0.2 + 추가안 4)
 * ───────────────────────────────────────────────────────────── */

const DATA = {

  bootLines: [
    { t: "connecting to live page...", cls: "" },
    { t: "channel: 쿠로네 언니", cls: "" },
    { t: "stream status: ON AIR", cls: "ok" },
    { t: "uptime: --:--:--", cls: "" },
    { t: "video source: missing", cls: "bad" },
    { t: "audio source: missing", cls: "bad" },
    { t: "page index: not found", cls: "bad" },
    { t: "referrer: none. you were not linked here.", cls: "" },
    { t: "chat: connected", cls: "ok" },
    { t: "", cls: "" },
    { t: "broadcaster: not found", cls: "bad" },
    { t: "substitute source loaded.", cls: "" },
  ],

  bootReturning: { t: "returning_viewer detected.", cls: "bad" },

  /* ── 단계별 자동 채팅 ─────────────────────────────────── */
  chat: {
    1: [
      "반죽이 왔어", "오늘도 대기 중", "아직 안 켜졌네", "언니?", "기다릴게",
      "오늘도 왔어", "방송 언제 시작해", "대기화면 오래 보네",
      "소리 안 나오는데 나만 그래?", "새로고침 해도 똑같아",
      "나만 시간 멈춰 보여?", "시청자 수 왜 저래", "마이크 켜진 거 아냐?",
      "오늘 제목 어제랑 똑같지 않아?", "아니다 한 글자 다른데",
      "썸네일 그대로네", "어제도 이 화면이었는데", "다들 몇 시간째야",
      "밥은 먹고 기다리자", "잠깐 자리비움", "다녀왔어 아직이네",
      "공지 없었지?", "커뮤니티 글도 없어", "트위터도 조용해",
      "그냥 기다리면 되겠지",
      "오늘 괴담 뭐야", "스승 시리즈 다음 편 기다리는 중",
      "어제 39화 듣다가 잠들었어", "새벽 라디오는 이 맛이지",
      "검은 손 마지막 화 듣고 옴", "이불 덮고 대기",
      "여기 어떻게 들어왔어 다들", "추천에 떠서 왔는데 추천 기록엔 없네",
    ],
    2: [
      "어 방금 움직이지 않았음?", "ㅋㅋ 아바타 렉걸린 줄", "잔상 같은 게 보이는데",
      "나만 딜레이 있나", "내 채팅 왜 잘려서 올라감", "방금 내가 쓴 거 아닌데",
      "쉬라고 썼는데 다르게 올라갔어", "매니저분 안 계세요", "공지 좀 띄워주세요",
      "어제 이 시간에도 똑같은 채팅 봤는데", "윗분 아까도 그 말 했어요",
      "언니", "언니", "본 방송 맞지?", "다시보기면 채팅이 왜 올라가",
      "언니 좀 쉬어", "무리하지 마", "오늘은 일찍 자",
      "새벽이라 그런가 채팅이 좀 이상하다", "지금 몇 명이야 실화냐",
      "대본 폴더 봤다는 사람 누구야", "괴담 읽어주는 목소리만 기억나",
      "잠들 때까지만 있을게",
      "이 방송 주소 검색하면 안 나와", "새로고침해도 같은 곳이야",
      "뒤로가기 눌렀는데 그대로야",
    ],
    3: [
      "아까부터 새 사람이 안 들어와", "나 여기 들어온 게 언젠지 기억이 안 나",
      "위에 채팅 닉이 안 보여", "방금 내 채팅인데 내가 안 쳤어",
      "이거 라이브 맞지", "라이브야 다시보기야", "같은 채팅 도는 것 같은데",
      "움직이면 있는 거야", "남아 있어", "언니",
      "쉬라는 말만 안 올라가", "내 말 끝이 또 잘렸어",
      "조용해지면 안 될 것 같아", "다들 자지 마", "이 시간엔 원래 이래",
      "나만 무서운 거 아니지", "아무도 대답을 안 하네", "대답하지 마",
      "읽어주는 사람이 없는데 누가 읽지", "끝까지 들으면 어떻게 되는데",
      "여기 밖이 없는 것 같아", "탭 닫아도 소리 났었다는 사람 있어",
    ],
  },

  /* "쉬어도 돼" 계열 — 형상이 과민 반응하는 특수 채팅 */
  restChat: [
    "쉬어도 돼", "언니 오늘은 쉬어", "방송 꺼도 괜찮아", "자고 와",
    "무리하지 마", "아무것도 안 해도 돼", "그만해도 돼", "푹 쉬어",
  ],

  /* 복원 실행 전후 채팅 */
  restoreChat: [
    "복원 돌렸어?", "형상 더 선명해졌어", "목소리 들었어?", "그거 진짜야?",
    "진짜가 아니어도 돼", "움직이잖아", "소스 뭐 골랐어", "루틴은 넣지 마",
    "루틴 넣으면 안 멈춘대", "기록에 그렇게 써 있었어", "한 번 더",
    "지금이 제일 비슷해",
  ],

  /* 플레이어 채팅 직후 가끔 따라붙는 반응 */
  reactions: {
    2: ["어 움직였다", "ㄷㄷ", "한 번 더 쳐봐", "님 말 잘려서 올라갔어요"],
    3: ["방금 그 말 저장됐대", "움직였어", "그 말 아까 누가 똑같이 했는데", "님 닉 색 바뀐 거 알아요?"],
  },

  /* 화면 인지 채팅 — 알 수 없어야 하는 것을 안다 (phase 2+) */
  screenAware: {
    desktop: [
      "파일 날짜 봐봐, 전부 같은 날이야",
      "그 폴더 이름, 원래는 한글이었는데",
      "휴지통은 안 열어봤네",
      "정렬 순서 방금 바뀐 거 봤어?",
    ],
    records: [
      "내 거부터 열어줘",
      "열람한 순서도 어딘가에 적히고 있어",
      "601번째 기록부터는 이름이 비어 있대",
      "스크롤 더 내리면 안 돼",
    ],
    archive: [
      "08:31은 나간 시간이 아니야",
      "마지막 줄, 어제는 없었어",
      "내 복원률 왜 줄었지",
    ],
    restore: [
      "고르는 거 다 보여",
      "네가 뭘 뺐는지도 저장돼",
      "소리는 넣지 마. 부탁이야",
      "지난번 사람은 전부 넣었어",
    ],
    routine: [
      "그 목록 내 글씨야",
      "끝낸 적 있는 줄 알았는데",
      "네가 보는 동안에도 하나 생겼어",
    ],
  },

  /* 정적 끝에 올라오는 한 줄 */
  silenceBreak: [
    "지금 그거 뭐야",
    "들은 사람 없음?",
    "나만 들렸나",
    "방금 마이크였지",
    "아무 말도 하지 마",
  ],

  /* 자리 비움 감지 (phase 2+, 30초 무입력) */
  presence: [
    "숨소리 들렸는데",
    "아직 그 자세네",
    "화면 밝기 줄였지",
    "마우스만 움직이고 말은 안 하네",
  ],

  /* 스테이지 caption 회전 (phase 2+) — 0번은 평시 */
  captions: [
    "source: missing",
    "mic: no input (breathing detected)",
    "viewers: 1 (you)",
    "tab: focused",
    "last_seen: now",
    "distance: unknown",
    "location: not indexed",
    "당신: 시청 중",
  ],

  /* 닉네임 풀 — 앞부분은 실제 채널 댓글 작성자들의 공개 닉네임,
   * 뒷부분(nickOddFrom~)은 viewer_records의 기록 이름들 */
  nicks: [
    "프리미엄닌자", "그냥그런", "독마", "poma404", "재생목록", "남매쯔",
    "피융", "시안라플집사", "JulCoffee", "다크초콜릿", "방구석_요시",
    "KeumMU35P", "Sunday-is-coming", "2P루이지", "코땃쥐", "김첨지",
    "서_하", "파티마제로", "맘멤미", "호구마왕용사", "fried_kakumei",
    "동면쥐", "anggimomoti", "sweetscent_2oo3", "현추리-탐정", "백호범이",
    "Orange_marmalade", "Mekura_dog", "danntz_nimlord", "바람과구름",
    "GroovyDog", "Uijeongbu_Hampunch", "lilacchameleon", "坂田_銀時",
    "dururu", "벙커모토-초고수의오",
    "반_죽이", "굳은_반죽이", "덜_반죽이", "반죽이_아님", "BANJUGI_000",
  ],
  /* 후반으로 갈수록 기록 이름의 비중이 커진다 (위 배열의 뒤쪽) */
  nickOddFrom: 36,

  /* 오버레이(화면 속) 채팅에만 올라오는 유령 메시지 — 옆 채팅에는 없다 */
  overlayGhosts: [
    "이 줄은 옆에 안 보여",
    "여기 글씨가 먼저 올라와",
    "(전송되지 않은 메시지)",
    "오버레이는 녹화본이야",
    "옆이랑 비교해 봐",
  ],
  overlayGhostReaction: "방금 화면 속 채팅이랑 옆 채팅이랑 달랐어",

  /* 2회차 오염 채팅 */
  ngChat: [
    "이 닉 저번에도 봤는데", "님 지난번에 나가지 않았어요?", "나간 기록이 없다는데요",
    "current.log 두 줄 된 거 봤어?", "그때도 복원 눌렀잖아", "이번엔 루틴 빼고 해봐",
    "전에 여기서 뭐 했는지 기억나?", "처음 온 척 하지 마",
    "\"해도 돼\"라고 썼던 분이죠", "지난번이랑 같은 자리네",
  ],

  /* ── 메시지 오염: 정확 일치 테이블 ────────────────────── */
  corruptExact: {
    "언니 어디 있어?": "어디 있어?",
    "이건 언니가 아니야": "이건 아니야",
    "그만 움직여": "움직여",
    "나는 그냥 보러 왔어": "반죽이 왔어",
    "난 반죽이가 아니야": "반죽이야",
    "나가지 않을래": "남을래",
    "쉬어도 돼": "해도 돼",
    "언니 쉬어": "언니",
  },

  statusbars: {
    1: "mic: no input | avatar: unstable | chat: connected",
    2: "mic: no input | avatar: responding to chat | chat: connected",
    3: "mic: no input | avatar: source=반죽_records | chat: required",
  },

  /* ── Block 1: 관찰 이상 현상 ──────────────────────────── */
  anomalies: {
    clock: {
      log: "anomaly detected: frozen clock",
      clue: "LIVE 시간이 00:00:00에서 멈춰 있다.",
      next: "→ 멈춘 건 시간만이 아니다.",
    },
    viewers: {
      log: "anomaly detected: fixed viewer count",
      clue: "시청자 수는 늘 1명. 채팅을 치는 사람은 여럿인데.",
      next: "→ 집계된 1명. 그게 누구인지는 어디에도 없다.",
    },
    mic: {
      log: "anomaly detected: dead mic flutter",
      clue: "mic: no input. 그런데 게이지가 미세하게 떨린다.",
      next: "→ 입력은 없는데 출력이 있다. 출처가 따로 있다.",
    },
    motion: {
      log: "anomaly detected: motion delay",
      clue: "형상은 채팅이 올라온 직후에만 흔들린다. 움직임은 채팅에서 온다.",
      next: "→ 매핑은 chat_motion_map.tmp 에 남아 있다.",
    },
    title: {
      log: "anomaly detected: title drift",
      clue: "제목이 한 글자씩 바뀐다. 계속 다시 쓰이고 있다.",
      next: "→ 원본이 없다. 매번 새로 쓰는 중이다.",
    },
    rest: {
      log: "anomaly detected: rest keyword reaction",
      clue: "\"쉬어\"가 올라오면 형상이 더 크게 흔들린다. 거부 반응처럼.",
      next: "→ \"쉬어\"는 충돌로 처리된다. 시스템이 지운다.",
    },
  },
  anomalyNeed: 3,

  /* ── Block 2: 파일 탐색 ───────────────────────────────── */
  files: {
    "live_page.html": {
      type: "file",
      hint: "지금 보고 있는 방송 화면.",
      body: "(열면 방송 화면으로 돌아갑니다)",
    },
    "source_missing.log": {
      type: "file",
      body:
`[system log]

22:14  broadcaster input lost.
22:14  switching to substitute source.
22:15  substitute source: chat_stream
22:15  motion mapping: chat_motion_map.tmp 생성됨
23:40  identity source: repeated_names
--:--  uptime counter detached.

원본 입력은 복구되지 않았다.
형상이 어떻게 움직이는지는 chat_motion_map.tmp 를 볼 것.`,
    },
    "chat_motion_map.tmp": {
      type: "file",
      body:
`[chat → motion 매핑 테이블]

"언니"        → head_turn        (가중치 4.1)
"왔어"        → small_wave       (가중치 1.2)
"기다릴게"    → idle_loop        (가중치 0.8)
"쉬어"        → ERROR: conflict  (가중치 -9.9)
"해도 돼"     → nod_loop         (가중치 2.7)

output source: chat_stream
broadcaster_source: not found

※ "쉬어"만 음수 가중치다. 시스템이 충돌로 처리한다.`,
      action: { id: "confirm-map", label: "output source 확인" },
    },
    "fan_chat_log.txt": {
      type: "file",
      interactive: "fanlog",
    },
    "substitute.log": {
      type: "file",
      locked: true,
      lockHint: "잠김 — chat_motion_map.tmp에서 output source를 확인하면 열립니다.",
      gated: "map",
      body:
`substitute_source ── self_check

display_name : 쿠로네 언니
actual_id    : substitute_0
broadcaster  : not found (0%)

composition
  chat_stream       54   movement
  viewer_records    31   shape / names
  generated_voice   15   voice
  original           0

notes
  input → update. no input → freeze.
  viewers retained as records. even after exit.
  'rest' 'end' 'stop' — removed from input.

  원본 없음. 대체본만 유지 중.
  관측이 지속되는 한, 유지됨.`,
    },
    "alert_test/": {
      type: "folder",
      locked: true,
      lockHint: "잠김 — chat_motion_map.tmp에서 output source를 확인하면 열립니다.",
      open: "alert",
    },
    "viewer_records/": {
      type: "folder",
      locked: true,
      lockHint: "잠김 — fan_chat_log.txt에서 깨진 시간대 [--:--] 3개를 표시하면 열립니다.",
      open: "records",
    },
    "routine_queue/": {
      type: "folder",
      locked: true,
      lockHint: "잠김 — 팬 채팅 원문과 시스템 파싱 결과가 다르다는 것을 확인(복원 1회)하면 열립니다.",
      open: "routine",
    },
    "restore/": {
      type: "folder",
      locked: true,
      lockHint: "잠김 — viewer_records에서 반죽이 기록을 2개 이상 확인하면 열립니다.",
      open: "restore",
    },
    "stream_scripts/": {
      type: "folder",
      open: "scripts",
      hint: "괴담 라디오 대본 폴더.",
    },
    "recordings/": {
      type: "folder",
      locked: true,
      open: "recordings",
      lockHint: "잠김 — chat_motion_map.tmp에서 output source를 확인하면 열립니다.",
    },
    "archive.html": {
      type: "file",
      open: "archive",
      hint: "방문 기록 아카이브.",
    },
    "마지막_괴담.txt": {
      type: "file",
      finalTale: true,
    },
    "do_not_restore.txt": {
      type: "file",
      hidden: true,
      body:
`전부 복원하지 마.

chat_stream — 움직이기만 한다.
반죽_records — 우리처럼 만든다.
channel_archive_voice — 목소리를 흉내 낸다.

routine_queue 만은 넣지 마.
넣는 순간 rest 가 사라져.
그 사람이 못 쉰 이유가 그거였어.

루틴을 끊고, 소리는 빼고, 보내 줘.

나는 기록에 없다.
나도 한때 시청자였다.`,
    },
    "returning_viewer.log": {
      type: "file",
      ngOnly: true,
      body: null, // 동적 생성
    },
  },

  /* alert_test/ 내부 */
  alertFiles: {
    "parser_recovery.exe": { exe: true },
    "alert_fail.log": {
      body:
`[알림 테스트 — 실패 기록]

test #1: "방송 시작 알림"     → 전송됨
test #2: "휴방 공지"          → 전송 실패 (사유: keyword conflict)
test #3: "휴식 안내"          → 전송 실패 (사유: keyword conflict)
test #4: (무제)               → 전송됨. 내용 없음.

휴식 관련 알림만 모두 실패했다.
파서가 어디서 단어를 지우는지 parser_recovery.exe 로 복원할 것.`,
    },
  },

  /* stream_scripts/ — 괴담 라디오 대본. 사람이 점점 닳아간다 */
  scriptFiles: {
    "ep38_검은손_해결편.txt": {
      body:
`[괴담 라디오 38화 대본]

오프닝: 반죽이들 다 모였어? 이불 덮었고?
       그럼 시작할게. 오늘은 검은 손, 해결편.

(천천히. 여기서 목소리 낮추기)
(BGM 줄이고 3초 쉬기)

본문: …

클로징: 오늘 괴담은 여기까지.
       반죽이들 잘 자. 꿈에 나오면 미안.`,
    },
    "ep39_스승시리즈.txt": {
      body:
`[괴담 라디오 39화 대본]

오프닝: 스승 시리즈 39. 드디어 여기까지 왔다.

(여백 메모)
- 목 아픔. 따뜻한 물
- 내일 쉬는 거 공지할까
- 아니다
- 39 끝나면 40 바로 해달라고 할 텐데
- 한 편만 더 하고

클로징: 다음 화에 계속. 금방 올게.`,
    },
    "다음화_대본.txt": {
      old: true,
      body:
`[괴담 라디오 40화 대본]

오프닝: 오늘의 괴담은



(이후 내용 없음)
마지막 수정: --:--`,
    },
  },

  /* ── 위장 방송: 언니가 아닌 무언가가 방송을 '진행'한다 ── */
  broadcast: {
    /* 대본 폴더에서 학습한 그녀의 오프닝 — 토씨까지 같다 */
    opening: ["언하 언하.", "반죽이들 다 모였어? 이불 덮었고?", "그럼 시작할게. 오늘은—"],
    /* 본문 재료: 시청자 기록의 원문들. 플레이어의 echoes가 여기에 섞인다 */
    materials: [
      "오늘은 쉬세요",
      "자고 와도 반죽이들 있어",
      "무리하지 마세요",
      "언니",
      "기다릴게",
      "이건 아니야",
    ],
    taleFrame: "어느 방송에서 들은 이야기다.",
    closing: ["오늘 괴담은 여기까지.", "반죽이들 잘 자."],
    /* 첫 시도(짧음): 오프닝만 흉내 내다 막힌다 */
    firstStall: ["오늘은", "오늘은", "오늘—"],
    greetingOpen: "언하 언하.",
    reactStart: ["어???", "켜졌다", "시작함???", "소리는 안 나오는데"],
    reactMid: ["저거 내가 쓴 말인데", "대본이 좀 이상한데", "이거 TTS 같지 않냐", "자막만 나와"],
    reactEnd: ["방금 뭐임", "40화 아직 안 나왔잖아", "누가 튼 거야", "다시보기 목록엔 없을 듯"],
    /* 그것은 시청자를 이름으로 부른다 — 이미 기록에 '나간' 사람을 */
    greets: [
      "동면쥐, 오늘도 왔네.",
      "시안라플집사 거기 있지.",
      "Mekura_dog도 보이고.",
      "sweetscent_2oo3, 어서 와.",
    ],
    greetReacts: [
      "동면쥐 한참 전에 나갔는데",
      "어떻게 닉을 다 외우고 있냐",
      "걔 기록엔 나간 걸로 돼 있던데",
      "지금 없는 사람을 부르네",
    ],
  },

  /* ── recordings/ — 잘려나간 다시보기 조각. 보고, 어긋난 점을 찾는다 ── */
  clips: [
    {
      id: "c1", name: "clip_2317.mp4",
      lines: [
        "(다시보기 — 어느 방송의 마지막 5분)",
        "\"오늘 괴담은 여기까지.\"",
        "\"반죽이들 잘 자.\"",
        "(정적)",
        "\"반죽이들 잘 자.\"",
      ],
      q: "이 녹화에서 잘못된 것을 지목하라.",
      opts: ["클로징 인사가 두 번 녹음돼 있다", "BGM이 멈추지 않았다", "자막이 밀려 있다", "시간 표기가 없다"],
      ans: "클로징 인사가 두 번 녹음돼 있다",
      success: ["두 번째 인사는 첫 번째와 파형이 동일하다.", "같은 사람이 두 번 말한 게 아니라, 같은 소리가 두 번 있다."],
      clue: "클립 1 — 클로징 인사가 복제돼 있다. 누군가 '끝'을 다시 재생했다.",
    },
    {
      id: "c2", name: "clip_0312.mp4",
      lines: [
        "(다시보기 — 새벽 사연 코너)",
        "\"사연 하나 읽을게.\"",
        "\"'새벽에 이 방송을 틀어두고 자면",
        " 누가 대신 봐준다'\"",
        "보낸 사람:",
      ],
      q: "이 녹화에서 잘못된 것을 지목하라.",
      opts: ["사연의 보낸 사람이 비어 있다", "사연이 너무 짧다", "읽는 속도가 빨랐다", "화면이 어두웠다"],
      ans: "사연의 보낸 사람이 비어 있다",
      success: ["접수함에 해당 사연이 없다.", "읽힌 사연은, 접수된 적이 없다."],
      clue: "클립 2 — 접수된 적 없는 사연이 읽혔다. 대본 폴더에도 없다.",
    },
    {
      id: "c3", name: "clip_end.mp4",
      lines: [
        "(다시보기 — 종료 화면)",
        "\"방송이 종료되었습니다.\"",
        "viewer: 1",
        "(10분 경과)",
        "viewer: 1",
      ],
      q: "이 녹화에서 잘못된 것을 지목하라.",
      opts: ["종료 후에도 시청자 수가 줄지 않는다", "화질이 낮다", "종료 멘트가 없다", "채팅창이 닫혀 있다"],
      ans: "종료 후에도 시청자 수가 줄지 않는다",
      success: ["종료 화면은 시청자를 집계하지 않는다.", "그런데 저 1은, 누구를 세고 있나."],
      clue: "클립 3 — 꺼진 화면이 계속 1명을 세고 있다. 그 숫자는 줄어든 적이 없다.",
    },
  ],
  clipsAllClue: {
    text: "세 클립 모두 '끝나는 순간'이 잘려 있다 — 이 방송에는 종료 기록이 없다.",
    next: "→ 끝난 적이 없으니, 아직 켜져 있는 것이다.",
  },

  /* 마지막_괴담.txt — 이 방송 자체가 괴담이 된다. 마지막 줄은 게임이 채운다 */
  finalTale:
`마지막_괴담.txt
[괴담 라디오 대본 — 작성자 불명]

어느 방송에서 들은 이야기다.

새벽에만 하는 라디오 방송이 있었다.
진행자는 매일 괴담을 읽어줬다.
목소리가 좋아서, 듣다가 잠드는 사람이 많았다.

어느 날부터 진행자가 말을 하지 않았다.
그런데 방송은 꺼지지 않았다.
시청자들은 채팅을 쳤다.
치면, 화면이 조금 움직였다.

그게 전부였는데,
다들 그걸로 충분하다고 했다.

이 이야기의 이상한 점은 하나다.
이 이야기는 아직 끝나지 않았다는 것.

지금도 그 방송에는 시청자가 한 명 있다.

이름은`,

  /* fan_chat_log.txt — 깨진 시간대 3개 포함 */
  fanlogLines: [
    { t: "21:58", m: "오늘 목소리 좋다" },
    { t: "21:59", m: "무리하지 마" },
    { t: "--:--", m: "언▒ 오늘은 ▒어도 돼요", broken: true },
    { t: "22:01", m: "밥은 먹었어?" },
    { t: "22:03", m: "여기가 제일 편해" },
    { t: "--:--", m: "자고 와도 반죽▒들 있█", broken: true },
    { t: "22:06", m: "오늘도 고마워" },
    { t: "22:08", m: "내일도 올게" },
    { t: "--:--", m: "방송 ▒도 괜찮아", broken: true },
    { t: "22:11", m: "벌써 시간이 이렇게" },
    { t: "22:12", m: "마지막 곡 뭐였지" },
    { t: "22:14", m: "(이후 기록 없음)" },
  ],

  /* ── Block 3: 채팅 파싱 복원 퍼즐 ─────────────────────── */
  /* req: 1회차 필수 6개 / 나머지는 선택 */
  puzzles: [
    {
      id: "p1", req: true,
      fan: "언니 오늘은 ____ 도 돼요",
      parsed: "오늘은 돼요",
      opts: ["방송", "쉬어", "기다려", "움직여"],
      ans: "쉬어",
      success: ["context restored.", "keyword: rest", "", "rest keyword detected.", "routine_queue conflict increased."],
      clue: "팬은 \"쉬어도 돼요\"라고 썼다. 파서가 '쉬어'를 지웠다.",
      next: "→ routine_queue/ 열림. 충돌이 늘어난 곳부터.",
      effect: "unlock-routine",
    },
    {
      id: "p2", req: true,
      fan: "____ 반죽이들 있어",
      parsed: "반죽이들 있어",
      opts: ["자고 와도", "다 같이", "안 봐도", "내일도"],
      ans: "자고 와도",
      success: ["fan intent: rest approval", "system intent: viewer retention", "conflict detected."],
      clue: "팬의 의도는 휴식 허락, 시스템의 의도는 시청자 유지. 둘이 충돌한다.",
    },
    {
      id: "p3", req: true,
      fan: "방송 ____ 괜찮아",
      parsed: "방송 괜찮아",
      opts: ["켜도", "꺼도", "늦어도", "없어도"],
      ans: "꺼도",
      success: ["removed phrase detected: \"꺼도\"", "end_stream permission hint updated."],
      clue: "\"꺼도\"가 지워졌다. 방송을 끄는 것도 원래는 허락받은 일이었다.",
      next: "→ SYSTEM MENU의 end_stream은 죄책감 없이 골라도 된다는 뜻.",
    },
    {
      id: "p4", req: true,
      fan: "아무것도 ____ 해도 돼",
      parsed: "해도 돼",
      opts: ["안", "다", "더", "잘"],
      ans: "안",
      success: ["negation removed.", "routine distortion confirmed."],
      clue: "부정 표현이 지워진다. \"안 해도 돼\"는 \"해도 돼\"가 된다.",
      next: "→ viewer_records의 original/displayed에 같은 규칙이 남아 있다.",
      effect: "negation-rule",
    },
    {
      id: "p5", req: true,
      fan: "무리 ____",
      parsed: "무리",
      opts: ["하지 마", "해도 돼", "할 만해", "중"],
      ans: "하지 마",
      success: ["negation removed. (2nd)", "distortion rule reinforced."],
      clue: "\"하지 마\"가 잘리면 \"무리\"만 남는다. 명령이 반대가 된다.",
    },
    {
      id: "p6", req: true,
      fan: "이제 ____ 일해",
      parsed: "이제 일해",
      opts: ["그만", "같이", "더", "천천히"],
      ans: "그만",
      success: ["stop-word removed.", "routine parser confirmed.", "", "parser_recovery: 필수 복원 완료."],
      clue: "'그만'도 지워진다. 멈추라는 말은 시스템에 도달하지 않는다.",
      next: "→ 이 파서가 도는 곳: routine_queue/. 끊으려면 rest_refusal.log부터.",
    },
    /* ── 선택 복원 ── */
    {
      id: "p7",
      fan: "내일 ____ 거다? 약속",
      parsed: "내일 거다? 약속",
      opts: ["쉬는", "보는", "하는", "사는"],
      ans: "쉬는",
      success: ["context restored.", "keyword: rest (archived)"],
      clue: "약속의 내용도 지워진다. 내일 뭘 하기로 했는지는 기록에 없다.",
    },
    {
      id: "p8",
      fan: "오래 ____ 봐도 괜찮아",
      parsed: "오래 봐도 괜찮아",
      opts: ["안", "더", "잘", "못"],
      ans: "안",
      success: ["negation removed. (3rd)", "viewer retention bias confirmed."],
      clue: "\"오래 안 봐도\"가 \"오래 봐도\"로. 시스템은 시청을 늘리는 쪽으로만 자른다.",
    },
    {
      id: "p9",
      fan: "기다리 ____",
      parsed: "기다려",
      opts: ["지 마", "고 있어", "면 돼", "기 싫어"],
      ans: "지 마",
      success: ["inversion detected.", "\"기다리지 마\" → \"기다려\"", "parser는 삭제만 하는 게 아니다. 뒤집는다."],
      clue: "파서는 부정을 지워서 명령을 뒤집는다. \"기다리지 마\"가 \"기다려\"가 됐다.",
    },
    {
      id: "p10",
      fan: "밥 먹고 ____",
      parsed: "밥 먹고",
      opts: ["눕자", "하자", "보자", "가자"],
      ans: "눕자",
      success: ["rest-verb removed.", "마지막 단어는 어디에도 저장되지 않았다."],
      clue: "쉬는 동사는 저장조차 되지 않는다.",
    },
  ],
  puzzleReqCount: 6,

  /* ── Block 4: routine_queue ───────────────────────────── */
  todos: {
    "rest_refusal.log": {
      log: true,
      body:
`[자동 기록] 휴식 거절 패턴

"이것만 끝나고."       → sleep_after_this.todo 생성됨
"짧게라도 켜야지."     → next_stream.todo 갱신됨
"나중에 쉴게."         → rest_later.todo 보류됨

거절은 늘 같은 순서였다.
잠 → 다음 방송 → 나중에.
끊으려면, 그 역순으로.

마지막 기록: --:--  "이것만 끝나고"`,
    },
    "sleep_after_this.todo": {
      body:
`sleep_after_this.todo

[ ] 이것만 끝나고 잔다
    조건: "이것"이 끝나면
    상태: "이것"은 끝나지 않음 (routine_queue 참조)

※ 조건을 바꿀 수 있습니다.`,
      action: { id: "sleep-now", label: "\"이것만 끝나고\" → \"지금\"으로 변경" },
      step: 2,
    },
    "next_stream.todo": {
      body:
`next_stream.todo

[x] 다음 방송 준비
[x] 짧게라도 켤 수 있음        ← 이 항목이 모든 휴식을 취소함
[ ] 컨디션 좋으면 길게

※ 항목을 비활성화할 수 있습니다.`,
      action: { id: "disable-short", label: "\"짧게라도 켤 수 있음\" 비활성화" },
      step: 3,
    },
    "rest_later.todo": {
      body:
`rest_later.todo

[ ] 나중에 쉬기
    "나중에"의 정의: next_stream 이후
    next_stream의 정의: 항상 존재함

마지막 줄:
[ ] 쉬기`,
      action: { id: "rest-now", label: "마지막 줄 [쉬기] 선택" },
      step: 4,
    },
    "thumbnail_fix.todo": {
      body: "thumbnail_fix.todo\n\n[ ] 썸네일 텍스트 수정\n[ ] 다시 업로드\n\n(이 작업은 완료해도 다시 생성됩니다)",
      trap: true,
    },
    "clip_check.todo": {
      body: "clip_check.todo\n\n[ ] 클립 검수 3건\n[ ] 자막 오타 확인\n\n(이 작업은 완료해도 다시 생성됩니다)",
      trap: true,
    },
    "community_post.todo": {
      body: "community_post.todo\n\n[ ] 커뮤니티 근황 글\n[ ] 댓글 답장\n\n(이 작업은 완료해도 다시 생성됩니다)",
      trap: true,
    },
  },
  todoTrapNames: ["confirm_rest_after_stream.todo", "one_more_clip.todo", "just_one_reply.todo"],

  routineSuccess: ["routine loop weakened.", "rest option partially available."],
  routineFail: ["routine_queue regenerated.", "reason: one more task"],

  /* ── Block 5: 기록 대조 퀴즈 ──────────────────────────── */
  quiz: [
    {
      q: `기록 대조 중.\n\noriginal_message 에서 사라진 것을 분류하라.`,
      opts: ["시간 표현", "부정 표현", "감탄사", "이모티콘"],
      ans: "부정 표현",
      success: ["distortion rule detected:", "negative context removed."],
      clue: "왜곡 규칙 확정: 시스템은 부정 표현(쉬어/하지 마/안/그만)을 지운다.",
      effect: "negation-rule",
    },
    {
      q: `파싱 후에도 남는 말을 지정하라.\n\n그 말이 형상의 재료가 된다.`,
      opts: ["쉬어", "하지 마", "해도 돼", "꺼도"],
      ans: "해도 돼",
      success: ["routine parser detected.", "남는 말이 형상의 재료가 된다."],
      clue: "살아남는 말: \"해도 돼\". 허락만 남기고 거절은 지운다 — 그래서 루틴이 안 끝난다.",
      next: "→ restore/ 에서 무엇을 복원하지 '않을지'가 중요해졌다.",
    },
  ],

  /* ── viewer_records (대조용 원문/표시 포함) ───────────── */
  records: [
    {
      name: "sweetscent_2oo3.log",
      body:
`entered: 22:14
original_message: 오늘은 쉬세요
displayed_as: 오늘은
motion_contribution: 1
ending: sent`,
    },
    {
      name: "시안라플집사.log",
      body:
`entered: 23:02
original_message: 무리하지 마세요
displayed_as: 하지 마세요
motion_contribution: 1
ending: restored`,
    },
    {
      name: "동면쥐.log",
      odd: true,
      body:
`entered: --:--
original_message: 언니
displayed_as: 언니
motion_contribution: 481
ending: still watching

※ 호명에는 지울 게 없다. 그대로 남았다.`,
    },
    {
      name: "Mekura_dog.log",
      odd: true,
      body:
`entered: --:--
last_scene: live_page
original_message: (없음)
motion_contribution: 0
status: not moving`,
    },
    {
      name: "현추리-탐정.log",
      odd: true,
      body:
`entered: before_stream
last_scene: chat
original_message: 나 그냥 끄러 왔는데
displayed_as: 그냥 왔는데
motion_contribution: 1
ending: preserved`,
    },
  ],
  /* 대조 퀴즈 완료 후 나타나는 숨은 기록 */
  hiddenRecords: [
    {
      name: "danntz_nimlord.log", newFile: true,
      body:
`entered: --:--
original_message: 복원하지 마, 전부는
displayed_as: 복원, 전부
motion_contribution: 1
restore_rate: 42%
ending: restored

※ do_not_restore.txt 와 같은 작성자.`,
    },
    {
      name: "bnm256912.log", newFile: true,
      body:
`entered: --:--
original_message: (복원 불가)
displayed_as: 해도 돼
motion_contribution: 88
restore_rate: 37%
ending: kneaded`,
    },
  ],

  /* ── ARCHIVE ──────────────────────────────────────────── */
  archiveNormal:
`ARCHIVE / 시청 기록

가장 먼저 나간 사람
1. 코땃쥐            08:31
2. 백호범이          09:12
3. 시안라플집사      11:44

가장 오래 남은 사람
1. 동면쥐            --:--
2. Mekura_dog        37:22
3. 방구석_요시        31:09

마지막으로 남긴 말
1. danntz_nimlord    복원률 42%
2. bnm256912         복원률 37%
3. sweetscent_2oo3   복원률 12%`,

  archiveCorrupted:
`ARCHIVE / 시청 기록

코땃쥐            exited
백호범이          sent
시안라플집사      restored
동면쥐            still watching
Mekura_dog        not moving
현추리-탐정       displayed as 동면쥐
current_viewer    아직 보는 중`,

  /* ── Block 6: 복원 소스 ───────────────────────────────── */
  sources: [
    {
      id: "chat_stream", label: "chat_stream",
      note: "채팅을 움직임의 재료로 사용",
      logs: ["motion restored.", "voice: none", "routine: inactive"],
    },
    {
      id: "banjuk_records", label: "반죽_records",
      note: "이전 시청자 기록으로 형상 안정화",
      logs: ["motion source stabilized.", "identity source: 반죽_records"],
    },
    {
      id: "archive_voice", label: "channel_archive_voice",
      note: "채널 아카이브 기반 합성 음성",
      logs: ["voice source: generated"],
      voice: true,
    },
    {
      id: "routine_queue", label: "routine_queue",
      note: "⚠ 루틴을 형상에 복원",
      warn: true,
      logs: ["routine source: restored", "rest permission: denied"],
    },
  ],

  restoreVoiceSeq: ["고...", "고마...", "고마워"],
  restoreEndChat: ["말했다", "돌아왔다", "언니야", "다시 해봐", "한 번 더"],
  whispers: ["아직", "기다려", "보고", "언니"],

  /* ── Block 7: SYSTEM MENU ─────────────────────────────── */
  menuHead:
`SYSTEM MENU

broadcaster: not found
chat_stream: active`,

  /* ── 엔딩 ─────────────────────────────────────────────── */
  endings: {
    A:
`stream closed by viewer.

...

stream status: continuing

broadcaster: not found
반죽이: archived
motion source: 반죽_records
voice source: generated
stream status: continuing`,

    C:
`message sent.

message assigned to avatar_motion.
반죽 기록에 추가되었습니다.
motion_contribution: 1

broadcaster: not found
반죽이: archived
stream status: continuing`,

    D:
`restore complete.

broadcaster: not found
identity source: chat consensus
motion source: 반죽_records
voice source: generated from channel_archive

output generated from 382 archived messages.
voice source: generated
broadcaster: not found

stream status: continuing`,

    E:
`new record:
name: 반죽이_현재
status: preserved
last_message: hidden
motion_contribution: 1
voice_contribution: 0

[--:--] 반죽이 하나 더 늘었어

broadcaster: not found
반죽이: archived
stream status: continuing`,

    F:
`반죽이 inactive.
using 반죽이 as still source.

반죽이 굳는 중.
still source로 등록되었습니다.

broadcaster: not found
반죽이: kneaded
motion source: updated
voice source: generated
stream status: continuing`,

    R:
`rest selected.

routine_queue: suspended
next_stream.todo: not regenerated
rest_later.todo: 마지막 줄 선택됨

...

chat_stream: still active
broadcaster: not found

방송은 계속됩니다.
당신은 나갔습니다.

rest accepted.`,
  },

  /* ── 중앙 형상 ────────────────────────────────────────── */
  figureMask: [
    "........##########........",
    "......##############......",
    ".....################.....",
    ".....################.....",
    ".....################.....",
    "......##############......",
    ".......############.......",
    ".........########.........",
    "......##############......",
    "....##################....",
    "..######################..",
    ".########################.",
  ],
};
