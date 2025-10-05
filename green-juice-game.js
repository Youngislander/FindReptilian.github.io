(function (global) {
  const STYLE_ID = "greenjuice-lite-style";
  const TEMPLATE = `
<div data-gjl-wrapper="true">
  <div id="gx-lite">
    <div class="hud">
      <div class="pill">정신력 <span id="sanVal">3</span></div>
      <div class="pill" style="min-width:160px">의심도
        <div id="susBar" class="bar"><span style="width:0%"></span></div>
      </div>
      <div class="pill" style="min-width:160px">정신력바
        <div id="sanBar" class="bar"><span style="width:100%"></span></div>
      </div>
    </div>

    <div id="vn">
      <div id="name">나</div>
      <div id="text">인트로는 이미 끝났다. 이제 본 게임을 시작하자.</div>
      <div id="choices"></div>
    </div>

    <div id="puzzleLabel" class="hidden">
      <div class="row"><b>라벨 해독</b><span class="note">아이콘과 문자 카드를 짝지어 모두 맞추세요.</span></div>
      <div id="labelGrid" class="grid" style="margin-top:8px"></div>
      <div class="note">힌트: 🌿=C, 💧=H, 🧪=L, 🧊=O (튜토리얼 느낌)</div>
    </div>

    <div id="puzzleKey" class="hidden">
      <div class="row"><b>냉장고 키패드</b><span class="note">라벨에서 얻은 힌트로 4자리를 입력하세요.</span></div>
      <div class="code" id="codeDisp">____</div>
      <div class="keypad">
        <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button>
        <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button>
        <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button>
        <button data-k="C">C</button><button data-k="0">0</button><button data-k="OK">OK</button>
      </div>
      <div class="note">힌트: 해독된 글자 “C H L O” → 알파벳 순서 번호(3 8 12 15)</div>
    </div>
  </div>
  <div id="toast" class="toast hidden"></div>
</div>`;

  const STYLES = `
#gx-lite { max-width: 680px; margin: 24px auto; padding: 16px; font-family: ui-sans-serif, system-ui, "Noto Sans KR", Arial; color:#eee; background:#121225; border:1px solid #2a2a58; border-radius:12px }
.hud { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; font-size:14px }
.pill { padding:6px 10px; border:1px solid #2a2a58; border-radius:999px; background:#191936 }
.bar { height:6px; border:1px solid #2a2a58; background:#101028; border-radius:999px; overflow:hidden }
.bar>span { display:block; height:100% }
#susBar>span { background:linear-gradient(90deg,#79f,#f5c) }
#sanBar>span { background:linear-gradient(90deg,#7f7,#3c8) }
#vn { border:1px solid #2a2a58; border-radius:10px; overflow:hidden; background:#15153a }
#name { padding:8px 12px; font-weight:700; color:#bdbaff; border-bottom:1px solid #2a2a58 }
#text { padding:14px; min-height:64px; line-height:1.6 }
#choices { display:flex; gap:8px; flex-wrap:wrap; padding:10px 12px; border-top:1px solid #2a2a58; background:#12123a }
button { padding:10px 14px; border:1px solid #2a2a58; border-radius:10px; background:#1a1a3a; color:#eee; cursor:pointer }
button:hover { filter:brightness(1.1) }
.row { display:flex; align-items:center; gap:8px }
.note { font-size:12px; opacity:.85; margin-top:10px }
.grid { display:grid; grid-template-columns: repeat(4,1fr); gap:8px }
.card { height:56px; display:grid; place-items:center; background:#202042; border:1px solid #2a2a58; border-radius:8px; cursor:pointer; user-select:none }
.card.solved { background:#253a25; border-color:#3c8f3c }
.keypad { display:grid; grid-template-columns: repeat(3,1fr); gap:8px; margin-top:8px }
.code { font: 700 20px/1 ui-monospace, Menlo, monospace; letter-spacing:2px; padding:6px 8px; background:#0e0e22; border:1px solid #2a2a58; border-radius:8px; text-align:center }
.hidden { display:none }
.toast { position:fixed; right:16px; bottom:16px; background:#22224a; color:#eee; padding:10px 12px; border:1px solid #2a2a58; border-radius:8px }
`;

  const DEFAULT_SANITY = 3;
  const PAIRS = [
    ["🌿", "C"],
    ["💧", "H"],
    ["🧪", "L"],
    ["🧊", "O"],
  ];
  const CODE = ["3", "8", "1", "5"];

  let STATE = null;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function createStructure(target) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = TEMPLATE;
    const root = wrapper.querySelector("#gx-lite");
    const toast = wrapper.querySelector("#toast");
    const fragment = document.createDocumentFragment();
    while (wrapper.firstChild) {
      fragment.appendChild(wrapper.firstChild);
    }
    target.appendChild(fragment);
    return { root, toast };
  }

  function collectExisting(target) {
    const root = target.querySelector("#gx-lite");
    const toast = target.querySelector("#toast");
    if (root && toast) {
      return { root, toast };
    }
    return null;
  }

  function createState() {
    return {
      sanity: DEFAULT_SANITY,
      suspicion: 0,
      evidence: new Set(),
      scene: "start",
      onEnd: null,
      container: null,
      root: null,
      toast: null,
      toastTimer: null,
      refs: {},
    };
  }

  function checkMounted() {
    if (!STATE || !STATE.root) {
      throw new Error("GreenJuiceLite is not mounted. Call mount() first.");
    }
  }

  function showToast(msg, ms = 1600) {
    checkMounted();
    const toast = STATE.toast;
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    if (STATE.toastTimer) {
      clearTimeout(STATE.toastTimer);
    }
    STATE.toastTimer = setTimeout(() => {
      toast.classList.add("hidden");
      STATE.toastTimer = null;
    }, ms);
  }

  function updateHUD() {
    const { refs, sanity, suspicion } = STATE;
    refs.sanVal.textContent = sanity;
    refs.sanBarFill.style.width = Math.max(0, (sanity / DEFAULT_SANITY) * 100) + "%";
    refs.susBarFill.style.width = Math.max(0, Math.min(100, suspicion)) + "%";
  }

  function speak(name, text, choices = []) {
    const { refs } = STATE;
    refs.name.textContent = name;
    refs.text.innerHTML = text;
    refs.choices.innerHTML = "";
    choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.textContent = choice.text;
      btn.onclick = choice.onClick;
      refs.choices.appendChild(btn);
    });
  }

  function hideAllPuzzles() {
    STATE.refs.puzzleLabel.classList.add("hidden");
    STATE.refs.puzzleKey.classList.add("hidden");
  }

  function go(scene) {
    STATE.scene = scene;
    hideAllPuzzles();

    if (scene === "start") {
      speak("나", "인트로는 끝났다. 보라의 녹즙… 뭔가 수상하다.", [
        { text: "라벨을 확인한다", onClick: () => go("label_tut") },
      ]);
    }

    if (scene === "label_tut") {
      speak("나", "라벨에 아이콘만 있다. 간단히 해독해보자.", [
        { text: "시작", onClick: startLabelPuzzle },
      ]);
    }

    if (scene === "label_done") {
      STATE.evidence.add("label");
      STATE.suspicion = Math.min(100, STATE.suspicion + 40);
      updateHUD();
      speak("시스템", "라벨에서 C/H/L/O를 해독했다.", [
        { text: "냉장고를 확인한다", onClick: () => go("key_intro") },
      ]);
    }

    if (scene === "key_intro") {
      speak("나", "보라의 밀프렙 박스가 자물쇠로 잠겨 있다.", [
        { text: "키패드 입력", onClick: startKeypadPuzzle },
      ]);
    }

    if (scene === "key_done") {
      STATE.evidence.add("fridge");
      STATE.suspicion = Math.min(100, STATE.suspicion + 40);
      updateHUD();
      speak("보라", "당신도 곧 맑아질 거예요. 한 잔만 마시면.", [
        { text: "증거를 제시한다", onClick: endingCheck },
        { text: "녹즙을 마신다(배드엔딩)", onClick: endingBad },
      ]);
    }
  }

  function startLabelPuzzle() {
    const grid = STATE.refs.labelGrid;
    const container = STATE.refs.puzzleLabel;
    container.classList.remove("hidden");
    grid.innerHTML = "";

    const cards = [];
    PAIRS.forEach(([icon, ch]) => {
      cards.push({ k: icon, t: "i" });
      cards.push({ k: ch, t: "c" });
    });
    shuffle(cards);

    let opened = [];
    let solved = 0;

    cards.forEach((data) => {
      const el = document.createElement("div");
      el.className = "card";
      el.textContent = "?";
      el.onclick = () => {
        if (el.classList.contains("solved") || opened.length === 2) return;
        if (opened.some((item) => item.el === el)) return;
        el.textContent = data.k;
        opened.push({ el, data });
        if (opened.length === 2) {
          const [a, b] = opened;
          if (isPair(a.data, b.data)) {
            a.el.classList.add("solved");
            b.el.classList.add("solved");
            solved += 1;
            opened = [];
            if (solved === PAIRS.length) {
              showToast("해독 성공! 증거 획득");
              go("label_done");
            }
          } else {
            setTimeout(() => {
              a.el.textContent = "?";
              b.el.textContent = "?";
              opened = [];
            }, 550);
          }
        }
      };
      grid.appendChild(el);
    });

    function isPair(a, b) {
      if (a.t === b.t) return false;
      const icon = a.t === "i" ? a.k : b.k;
      const ch = a.t === "c" ? a.k : b.k;
      return PAIRS.some(([I, C]) => I === icon && C === ch);
    }
  }

  function startKeypadPuzzle() {
    const keypad = STATE.refs.puzzleKey;
    const display = STATE.refs.codeDisp;
    keypad.classList.remove("hidden");

    let cur = [];
    const buttons = Array.from(keypad.querySelectorAll("button"));
    buttons.forEach((btn) => {
      const k = btn.dataset.k;
      btn.onclick = () => {
        if (k === "C") {
          cur = [];
          update();
          return;
        }
        if (k === "OK") {
          if (equals(cur, CODE)) {
            showToast("잠금 해제!", 1200);
            go("key_done");
          } else {
            miss();
          }
          return;
        }
        if (cur.length < 4) {
          cur.push(k);
          update();
        }
      };
    });

    update();

    function update() {
      display.textContent = (cur.join("") + "____").slice(0, 4);
    }

    function miss() {
      STATE.sanity = Math.max(0, STATE.sanity - 1);
      updateHUD();
      showToast("오답! 정신력 -1", 1400);
      if (STATE.sanity <= 0) {
        endingBad();
      }
    }
  }

  function endingCheck() {
    const score = (STATE.evidence.has("label") ? 50 : 0) + (STATE.evidence.has("fridge") ? 50 : 0);
    STATE.suspicion = score;
    updateHUD();
    if (score >= 70) {
      endingGood();
    } else {
      endingBad();
    }
  }

  function endingGood() {
    hideAllPuzzles();
    speak("시스템", '<b class="good">굿엔딩</b> — 증거로 정체를 밝히는 데 성공했다.', [
      { text: "다시 시작", onClick: reset },
    ]);
    endCallback("good");
  }

  function endingBad() {
    hideAllPuzzles();
    speak("시스템", '<b class="bad">배드엔딩</b> — 정신력이 소진되었거나, 잘못된 선택을 했다.', [
      { text: "다시 시작", onClick: reset },
    ]);
    endCallback("bad");
  }

  function endCallback(type) {
    if (typeof STATE.onEnd === "function") {
      STATE.onEnd({
        ending: type,
        stats: {
          evidence: Array.from(STATE.evidence),
          sanity: STATE.sanity,
          suspicion: STATE.suspicion,
        },
      });
    }
  }

  function reset() {
    STATE.sanity = DEFAULT_SANITY;
    STATE.suspicion = 0;
    STATE.evidence = new Set();
    STATE.scene = "start";
    updateHUD();
    hideAllPuzzles();
    go("start");
  }

  function equals(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const api = {
    mount({ container, onEnd } = {}) {
      ensureStyle();
      const target = container || document.body;
      let nodes = collectExisting(target);
      if (!nodes) {
        nodes = createStructure(target);
      }

      STATE = createState();
      STATE.container = target;
      STATE.onEnd = typeof onEnd === "function" ? onEnd : null;
      STATE.root = nodes.root;
      STATE.toast = nodes.toast;

      STATE.refs = {
        sanVal: nodes.root.querySelector("#sanVal"),
        sanBarFill: nodes.root.querySelector("#sanBar span"),
        susBarFill: nodes.root.querySelector("#susBar span"),
        name: nodes.root.querySelector("#name"),
        text: nodes.root.querySelector("#text"),
        choices: nodes.root.querySelector("#choices"),
        puzzleLabel: nodes.root.querySelector("#puzzleLabel"),
        labelGrid: nodes.root.querySelector("#labelGrid"),
        puzzleKey: nodes.root.querySelector("#puzzleKey"),
        codeDisp: nodes.root.querySelector("#codeDisp"),
      };

      updateHUD();
      hideAllPuzzles();
      speak("나", "인트로는 이미 끝났다. 이제 본 게임을 시작하자.");
    },
    start() {
      checkMounted();
      reset();
    },
    destroy() {
      if (!STATE || !STATE.root) return;
      if (STATE.toastTimer) {
        clearTimeout(STATE.toastTimer);
      }
      const wrapper = STATE.root.closest('[data-gjl-wrapper="true"]');
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      } else {
        if (STATE.root.parentNode) {
          STATE.root.parentNode.removeChild(STATE.root);
        }
      }
      if (STATE.toast && STATE.toast.parentNode) {
        STATE.toast.parentNode.removeChild(STATE.toast);
      }
      STATE = null;
    },
  };

  Object.defineProperty(api, "state", {
    get() {
      return STATE;
    },
  });

  global.GreenJuiceLite = api;
})(window);
