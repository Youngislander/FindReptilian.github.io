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
      <div id="text">정체불명의 녹즙 냄새가 새어 나온다. 머뭇거릴 시간이 없다.</div>
      <div id="choices"></div>
    </div>

    <div id="puzzleLabel" class="hidden">
      <div class="row"><b>라벨 해독</b><span class="note">3초 동안 라벨을 기억한 뒤 정답을 입력하세요.</span></div>
      <div id="labelFlash" class="label-flash">
        <div id="labelCountdown" class="label-countdown">3</div>
        <div id="labelContent" class="label-content"></div>
      </div>
      <div id="labelPrompt" class="label-prompt hidden">
        <div class="note">기억한 알파벳 네 글자를 순서대로 입력하세요.</div>
        <div class="label-input-row">
          <input id="labelInput" maxlength="4" autocomplete="off" spellcheck="false" />
          <button id="labelSubmit">확인</button>
          <button id="labelReplay" class="ghost-button">다시 보기</button>
        </div>
        <div class="note">힌트: 🌿=C, 💧=H, 🧪=L, 🧊=O</div>
      </div>
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
.label-flash { margin-top:12px; padding:18px; border:1px dashed #3c3c6b; border-radius:12px; background:rgba(18,18,60,0.6); display:grid; place-items:center; gap:12px; min-height:120px; text-align:center }
.label-countdown { font:700 42px/1 "Orbitron", ui-monospace, monospace; color:#60a5fa }
.label-content { font:700 22px/1.4 ui-monospace, Menlo, monospace; letter-spacing:4px; text-transform:uppercase; text-align:center; color:#f5f3ff }
.label-content .label-line { display:block }
.label-content .icons { font-size:28px; letter-spacing:10px }
.label-content .letters { font-size:20px; letter-spacing:6px }
.label-prompt { margin-top:16px; display:grid; gap:12px }
.label-input-row { display:flex; flex-wrap:wrap; gap:8px }
#labelInput { flex:1; min-width:140px; padding:10px 12px; border-radius:10px; border:1px solid #2a2a58; background:#0e0e26; color:#f8fafc; font:700 18px/1 ui-monospace, Menlo, monospace; text-transform:uppercase; letter-spacing:3px }
#labelInput:focus { outline:2px solid rgba(99,102,241,0.7); outline-offset:2px }
.ghost-button { border-color:rgba(99,102,241,0.55); background:rgba(17,17,40,0.85); color:#dbeafe }
.ghost-button:hover { filter:brightness(1.08) }
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
  const LABEL_SEQUENCE = PAIRS.map(([, ch]) => ch);
  const CODE = ["3", "8", "1", "5"];

  let STATE = null;

  function clearLabelTimers() {
    if (!STATE || !STATE.labelTimers) return;
    const { labelTimers } = STATE;
    if (labelTimers.interval) {
      clearInterval(labelTimers.interval);
      labelTimers.interval = null;
    }
    if (labelTimers.timeout) {
      clearTimeout(labelTimers.timeout);
      labelTimers.timeout = null;
    }
  }

  function renderLabelContent(container) {
    if (!container) return;
    container.innerHTML = "";
    const iconsLine = document.createElement("div");
    iconsLine.className = "label-line icons";
    iconsLine.textContent = PAIRS.map(([icon]) => icon).join("   ");
    const lettersLine = document.createElement("div");
    lettersLine.className = "label-line letters";
    lettersLine.textContent = LABEL_SEQUENCE.join("   ");
    container.appendChild(iconsLine);
    container.appendChild(lettersLine);
  }

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
      labelTimers: { interval: null, timeout: null },
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
    clearLabelTimers();
    const { refs } = STATE;
    if (!refs) return;
    if (refs.puzzleLabel) refs.puzzleLabel.classList.add("hidden");
    if (refs.puzzleKey) refs.puzzleKey.classList.add("hidden");
    if (refs.labelFlash) refs.labelFlash.classList.add("hidden");
    if (refs.labelPrompt) refs.labelPrompt.classList.add("hidden");
  }

  function go(scene) {
    STATE.scene = scene;
    hideAllPuzzles();

    if (scene === "start") {
      speak("나", "정체불명의 녹즙… 냉장고 라벨부터 확인하자.", [
        { text: "라벨을 살핀다", onClick: () => go("label_tut") },
      ]);
    }

    if (scene === "label_tut") {
      speak("나", "라벨은 3초 동안만 볼 수 있다. 정신 바짝 차리자.", [
        { text: "준비됐다", onClick: startLabelPuzzle },
      ]);
    }

    if (scene === "label_done") {
      STATE.evidence.add("label");
      STATE.suspicion = Math.min(100, STATE.suspicion + 40);
      updateHUD();
      speak("시스템", "라벨에서 C/H/L/O 조합을 기억해냈다.", [
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
    const {
      puzzleLabel,
      labelFlash,
      labelCountdown,
      labelContent,
      labelPrompt,
      labelInput,
      labelSubmit,
      labelReplay,
    } = STATE.refs;

    if (!puzzleLabel) return;

    const timers = STATE.labelTimers;
    const revealDuration = 3000;

    function startReveal() {
      clearLabelTimers();
      if (labelFlash) {
        labelFlash.classList.remove("hidden");
      }
      if (labelPrompt) {
        labelPrompt.classList.add("hidden");
      }
      if (labelInput) {
        labelInput.disabled = true;
      }
      if (labelSubmit) {
        labelSubmit.disabled = true;
      }
      if (labelReplay) {
        labelReplay.disabled = true;
      }
      if (labelCountdown) {
        labelCountdown.classList.remove("hidden");
        labelCountdown.textContent = "3";
      }
      renderLabelContent(labelContent);

      let remaining = 3;
      timers.interval = setInterval(() => {
        remaining -= 1;
        if (!labelCountdown) return;
        if (remaining > 0) {
          labelCountdown.textContent = String(remaining);
        } else {
          labelCountdown.textContent = "0";
          if (timers.interval) {
            clearInterval(timers.interval);
            timers.interval = null;
          }
        }
      }, 1000);

      timers.timeout = setTimeout(() => {
        showPrompt();
      }, revealDuration);
    }

    function showPrompt() {
      clearLabelTimers();
      if (labelFlash) {
        labelFlash.classList.add("hidden");
      }
      if (labelPrompt) {
        labelPrompt.classList.remove("hidden");
      }
      if (labelCountdown) {
        labelCountdown.classList.add("hidden");
      }
      if (labelContent) {
        labelContent.innerHTML = "";
      }
      if (labelInput) {
        labelInput.disabled = false;
        labelInput.focus();
        labelInput.select();
      }
      if (labelSubmit) {
        labelSubmit.disabled = false;
      }
      if (labelReplay) {
        labelReplay.disabled = false;
      }
    }

    function attempt() {
      if (!labelInput) return;
      const raw = labelInput.value || "";
      const answer = raw.replace(/\s+/g, "").toUpperCase();
      if (answer.length !== LABEL_SEQUENCE.length) {
        showToast("네 글자를 모두 입력하세요.", 1300);
        labelInput.focus();
        return;
      }
      if (answer === LABEL_SEQUENCE.join("")) {
        showToast("해독 성공! 증거 획득");
        go("label_done");
      } else {
        showToast("기억과 다르다. 다시 시도!", 1400);
        labelInput.select();
      }
    }

    puzzleLabel.classList.remove("hidden");
    if (labelInput) {
      labelInput.value = "";
      labelInput.onkeydown = (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          attempt();
        }
      };
      labelInput.oninput = () => {
        labelInput.value = labelInput.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, LABEL_SEQUENCE.length);
      };
    }
    if (labelSubmit) {
      labelSubmit.onclick = attempt;
    }
    if (labelReplay) {
      labelReplay.onclick = () => {
        startReveal();
      };
    }

    startReveal();
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
        labelFlash: nodes.root.querySelector("#labelFlash"),
        labelCountdown: nodes.root.querySelector("#labelCountdown"),
        labelContent: nodes.root.querySelector("#labelContent"),
        labelPrompt: nodes.root.querySelector("#labelPrompt"),
        labelInput: nodes.root.querySelector("#labelInput"),
        labelSubmit: nodes.root.querySelector("#labelSubmit"),
        labelReplay: nodes.root.querySelector("#labelReplay"),
        puzzleKey: nodes.root.querySelector("#puzzleKey"),
        codeDisp: nodes.root.querySelector("#codeDisp"),
      };

      updateHUD();
      hideAllPuzzles();
      speak("나", "정체불명의 녹즙 냄새가 난다. 머뭇거리면 놓친다.");
    },
    start() {
      checkMounted();
      reset();
    },
    destroy() {
      if (!STATE || !STATE.root) return;
      clearLabelTimers();
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
