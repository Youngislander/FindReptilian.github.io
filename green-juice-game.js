(function (global) {
  const STYLE_ID = "greenjuice-lite-style";
  const TEMPLATE = `
<div data-gjl-wrapper="true">
  <div id="gx-lite">
    <div class="hud" id="hud">
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
      <div class="row"><b>라벨 해독</b><span class="note">3초 동안 카드 위치를 기억한 뒤 아이콘과 문자를 짝지으세요.</span></div>
      <div id="labelFlash" class="label-flash">
        <div id="labelCountdown" class="label-countdown">3</div>
        <div id="labelContent" class="label-content"></div>
      </div>
      <div id="labelPrompt" class="label-prompt hidden">
        <div class="note">카드를 기억한 뒤, 아이콘과 알파벳을 짝지어 모두 맞춰보세요. 공개 시간은 3초뿐입니다.</div>
        <div id="labelBoard" class="label-board"></div>
        <div class="label-controls">
          <button id="labelReplay" class="ghost-button">다시 보기</button>
        </div>
        <div class="note">힌트: 🌿↔C, 💧↔H, 🧪↔L, 🧊↔O</div>
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

    <div id="finalEncounter" class="final-enc hidden">
      <div class="final-message" id="finalMessage">
        정체가 들통난 랩틸리언이 당신을 공격하기 시작합니다. 뿜어내는 초록색 독을 피하고, 랩틸리언을 처치하세요.
      </div>
      <div class="final-transition" id="finalTransition">
        <div class="transition-face human" id="faceHuman"></div>
        <div class="transition-face reptile" id="faceReptile"></div>
        <div class="transition-glitch"></div>
      </div>
      <div class="final-game hidden" id="finalGame">
        <div class="arcade-hud">
          <span>랩틸리언 체력 <strong id="finalEnemyHealth">10</strong></span>
          <span>정신력 <strong id="finalSanityDisplay">3</strong></span>
        </div>
        <div class="arcade-stage" id="finalArena">
          <div class="enemy" id="finalEnemy"></div>
          <div class="player" id="finalPlayer"></div>
        </div>
        <div class="arcade-instructions">← → : 이동, Space : 칼 투척 — 녹즙을 피하고 칼을 10번 맞히세요.</div>
        <div class="arcade-overlay hidden" id="finalArcadeOverlay">
          <div class="arcade-overlay-text" id="finalArcadeText"></div>
          <button type="button" id="finalArcadeRestart">다시 시도</button>
        </div>
      </div>
      <div class="final-victory hidden" id="finalVictory">
        <div class="victory-face">
          <div class="victory-slice left"></div>
          <div class="victory-slice right"></div>
        </div>
        <div class="victory-text">당신이 이 회사를 구했습니다.</div>
      </div>
    </div>
  </div>
  <div id="toast" class="toast hidden"></div>
  <div id="modal" class="modal hidden">
    <div class="modal-content">
      <div id="modalMessage" class="modal-message"></div>
      <div class="modal-actions">
        <button type="button" id="modalCancel">닫기</button>
        <button type="button" id="modalConfirm" class="ghost-button">확인</button>
      </div>
    </div>
  </div>
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
.label-content { font:700 20px/1.4 ui-monospace, Menlo, monospace; text-transform:uppercase; color:#f5f3ff; display:grid; gap:12px; justify-items:center; text-align:center }
.label-content .label-line { display:block; letter-spacing:2px }
.label-content .label-line.prompt { font-size:18px; color:#c7d2fe }
.label-content .label-pairs { width:100%; border-collapse:separate; border-spacing:18px 10px }
.label-content .label-pairs td { background:rgba(17,17,45,0.85); border:1px solid #303070; border-radius:12px; padding:12px 10px; min-width:76px }
.label-content .label-pairs .icon { display:block; font-size:30px; margin-bottom:8px }
.label-content .label-pairs .letter { display:block; font-size:20px; letter-spacing:4px }
.label-prompt { margin-top:16px; display:grid; gap:12px }
.label-board { display:grid; grid-template-columns:repeat(4, minmax(64px, 1fr)); gap:10px }
.label-controls { display:flex; justify-content:flex-end }
.label-card { position:relative; padding:16px 10px; border:1px solid #2a2a58; border-radius:12px; background:rgba(15,15,40,0.95); color:#e2e8f0; font:700 22px/1.1 ui-monospace, Menlo, monospace; letter-spacing:4px; transition:background .2s ease, transform .2s ease; cursor:pointer }
.label-card.is-letter { letter-spacing:3px; font-size:18px }
.label-card.is-icon { font-size:28px; letter-spacing:8px }
.label-card.revealed { background:rgba(88,91,229,0.22); border-color:rgba(129,140,248,0.45); color:#c7d2fe }
.label-card.matched { background:rgba(34,197,94,0.2); border-color:rgba(134,239,172,0.55); color:#bbf7d0; cursor:default }
.label-card:disabled { cursor:default; opacity:.88 }
.ghost-button { border-color:rgba(99,102,241,0.55); background:rgba(17,17,40,0.85); color:#dbeafe }
.ghost-button:hover { filter:brightness(1.08) }
.keypad { display:grid; grid-template-columns: repeat(3,1fr); gap:8px; margin-top:8px }
.code { font: 700 20px/1 ui-monospace, Menlo, monospace; letter-spacing:2px; padding:6px 8px; background:#0e0e22; border:1px solid #2a2a58; border-radius:8px; text-align:center }
.modal { position:fixed; inset:0; display:grid; place-items:center; background:rgba(10,10,40,0.68); padding:20px; z-index:1000 }
.modal-content { width:min(320px, 100%); background:#161636; border:1px solid #2a2a58; border-radius:14px; padding:18px; box-shadow:0 18px 36px rgba(0,0,0,0.35); display:grid; gap:16px }
.modal-message { line-height:1.6; text-align:left; font-size:14px; color:#e2e8f0 }
.modal-actions { display:flex; justify-content:flex-end; gap:8px }
.hidden { display:none !important }
.toast { position:fixed; right:16px; bottom:16px; background:#22224a; color:#eee; padding:10px 12px; border:1px solid #2a2a58; border-radius:8px }
.final-enc { position:relative; margin-top:20px; padding:22px; border:1px solid #2a2a58; border-radius:16px; background:radial-gradient(circle at top,#020617 0%,#020b1b 55%,#010409 100%); overflow:hidden; min-height:320px; display:grid; place-items:center; gap:16px; transition:background .6s ease }
.final-message { font-size:15px; line-height:1.6; color:rgba(226,232,240,0.92); text-align:center; max-width:420px }
.final-enc.is-flicker { animation:finalFlicker .16s steps(2,end) infinite; background:radial-gradient(circle at top,#000,#00140a 60%,#000) }
.final-transition { position:relative; width:100%; height:260px; display:flex; align-items:center; justify-content:center; transition:transform .8s ease, opacity .8s ease }
.transition-face { position:absolute; top:50%; left:50%; width:220px; height:240px; transform:translate(-50%,-50%) scale(1.08); border-radius:44% 46% 40% 42%; opacity:0; transition:opacity .8s ease, transform .9s ease; box-shadow:0 0 36px rgba(34,197,94,0.28) }
.transition-face.human { background:radial-gradient(circle at 40% 30%,#f8fafc 0%,#cbd5f5 60%,#1f2937 100%); box-shadow:0 0 32px rgba(148,163,184,0.38) }
.transition-face.reptile { background:radial-gradient(circle at 45% 35%,#22c55e 0%,#047857 55%,#052e16 100%); filter:contrast(1.15) saturate(1.25); box-shadow:0 0 40px rgba(34,197,94,0.45) }
.transition-glitch { position:absolute; inset:0; background:repeating-linear-gradient(180deg,rgba(34,197,94,0.16) 0,rgba(34,197,94,0.16) 2px,transparent 2px,transparent 4px); mix-blend-mode:screen; opacity:0; transition:opacity .5s ease }
.final-enc.show-human #faceHuman { opacity:1; transform:translate(-50%,-50%) scale(1) }
.final-enc.show-reptile #faceReptile { opacity:1; transform:translate(-50%,-50%) scale(1.08) }
.final-enc.show-reptile #faceHuman { opacity:.18 }
.final-enc.is-flicker .transition-glitch { opacity:.45; animation:glitchLines .24s steps(2,end) infinite }
.final-enc.shrink-face .final-transition { transform:scale(.58) translateY(-80px); opacity:0 }
.final-game { position:relative; display:grid; gap:14px; width:100%; opacity:0; transform:translateY(14px); transition:opacity .6s ease, transform .6s ease }
.final-enc.show-game .final-game { opacity:1; transform:translateY(0) }
.arcade-hud { display:flex; justify-content:space-between; gap:12px; font-weight:600; font-size:14px }
.arcade-stage { position:relative; height:240px; border:1px solid #2f365f; border-radius:18px; background:linear-gradient(180deg,#020617,#0f172a 65%,#020617); overflow:hidden; box-shadow:inset 0 0 28px rgba(5,10,32,0.65) }
.arcade-stage .enemy { position:absolute; top:18px; left:50%; width:120px; height:120px; transform:translateX(-50%); border-radius:48% 52% 40% 40%; background:radial-gradient(circle at 40% 40%,#22c55e 0%,#15803d 45%,#052e16 100%); box-shadow:0 0 28px rgba(34,197,94,0.45); transition:filter .2s ease, transform .2s ease }
.arcade-stage .enemy.hit { animation:enemyHit .3s ease }
.arcade-stage .player { position:absolute; bottom:18px; left:50%; width:80px; height:44px; transform:translateX(-50%); border-radius:24px 24px 14px 14px; background:linear-gradient(180deg,#fef3c7 0%,#facc15 75%,#b45309 100%); box-shadow:0 0 0 2px rgba(249,250,229,0.3); transition:transform .2s ease }
.arcade-stage .player.hit { animation:playerHit .35s ease }
.proj { position:absolute; width:10px; height:24px; border-radius:999px }
.proj.knife { background:linear-gradient(180deg,#e0e7ff,#6366f1); box-shadow:0 0 14px rgba(99,102,241,0.8) }
.proj.juice { width:14px; height:32px; border-radius:50% 50% 46% 46%; background:linear-gradient(180deg,#22c55e,#15803d); box-shadow:0 0 14px rgba(34,197,94,0.75) }
.arcade-instructions { font-size:13px; color:rgba(203,213,225,0.85); text-align:center }
.arcade-overlay { position:absolute; inset:0; display:grid; place-items:center; gap:16px; padding:22px; background:rgba(2,6,23,0.78); text-align:center }
.arcade-overlay-text { font-weight:600; line-height:1.5 }
.arcade-overlay.hidden { display:none }
.final-victory { position:absolute; inset:0; display:grid; place-items:center; gap:24px; padding:24px; background:radial-gradient(circle at center,#022c22 0%,rgba(4,12,24,0.95) 65%); opacity:0; pointer-events:none }
.victory-face { position:relative; width:min(420px,90%); height:260px }
.victory-slice { position:absolute; top:0; width:50%; height:100%; background:radial-gradient(circle at 50% 35%,#22c55e 0%,#065f46 65%,#041429 100%); box-shadow:0 0 24px rgba(34,197,94,0.42) }
.victory-slice.left { left:0; border-radius:48% 0 0 52% }
.victory-slice.right { right:0; border-radius:0 48% 52% 0 }
.victory-text { font-size:1.4rem; font-weight:700; text-align:center; color:#ecfccb; text-shadow:0 0 22px rgba(74,222,128,0.7); opacity:0 }
.final-enc.victory .final-victory { opacity:1; animation:victoryFade .4s ease forwards }
.final-enc.victory .victory-slice.left { animation:victorySplitLeft 1.1s ease forwards }
.final-enc.victory .victory-slice.right { animation:victorySplitRight 1.1s ease forwards }
.final-enc.victory .victory-text { animation:victoryText 1.2s ease forwards .6s }
@keyframes finalFlicker { 0%,100% { filter:none } 40% { filter:hue-rotate(25deg) brightness(1.1) } 70% { filter:brightness(.55) hue-rotate(-25deg) } }
@keyframes glitchLines { 0%,100% { transform:translateY(0) } 50% { transform:translateY(2px) } }
@keyframes enemyHit { 0% { transform:translateX(-50%) scale(1); filter:none } 50% { transform:translateX(-50%) scale(1.12); filter:hue-rotate(40deg) brightness(1.25) } 100% { transform:translateX(-50%) scale(1); filter:none } }
@keyframes playerHit { 0% { transform:translateX(-50%) translateY(0) } 50% { transform:translateX(-50%) translateY(-6px) } 100% { transform:translateX(-50%) translateY(0) } }
@keyframes victoryFade { from { opacity:0 } to { opacity:1 } }
@keyframes victorySplitLeft { 0% { transform:translate(0,0) scale(1.05) } 50% { transform:translate(-6%,0) rotate(-2deg) } 100% { transform:translate(-42%,0) rotate(-8deg) } }
@keyframes victorySplitRight { 0% { transform:translate(0,0) scale(1.05) } 50% { transform:translate(6%,0) rotate(2deg) } 100% { transform:translate(42%,0) rotate(8deg) } }
@keyframes victoryText { 0% { opacity:0; transform:translateY(18px) } 100% { opacity:1; transform:translateY(0) } }
`;

  const DEFAULT_SANITY = 3;
  const PAIRS = [
    ["🌿", "C"],
    ["💧", "H"],
    ["🧪", "L"],
    ["🧊", "O"],
  ];
  const CODE = ["3", "8", "3", "6"];

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
    const promptLine = document.createElement("div");
    promptLine.className = "label-line prompt";
    promptLine.textContent = "카드를 기억하세요!";
    const table = document.createElement("table");
    table.className = "label-pairs";
    const row = document.createElement("tr");
    PAIRS.forEach(([icon, letter]) => {
      const cell = document.createElement("td");
      const iconSpan = document.createElement("span");
      iconSpan.className = "icon";
      iconSpan.textContent = icon;
      const letterSpan = document.createElement("span");
      letterSpan.className = "letter";
      letterSpan.textContent = letter;
      cell.appendChild(iconSpan);
      cell.appendChild(letterSpan);
      row.appendChild(cell);
    });
    table.appendChild(row);
    container.appendChild(promptLine);
    container.appendChild(table);
  }

  function hideModal() {
    if (!STATE || !STATE.refs) return;
    const { modal, modalConfirm, modalCancel } = STATE.refs;
    if (!modal) return;
    modal.classList.add("hidden");
    if (modalConfirm) {
      modalConfirm.onclick = null;
      modalConfirm.classList.remove("hidden");
    }
    if (modalCancel) {
      modalCancel.onclick = null;
    }
  }

  function showModal({ message, confirmText, cancelText, onConfirm }) {
    if (!STATE || !STATE.refs) return;
    const { modal, modalMessage, modalConfirm, modalCancel } = STATE.refs;
    if (!modal || !modalMessage || !modalCancel) return;
    modalMessage.innerHTML = message;
    if (modalConfirm) {
      if (confirmText) {
        modalConfirm.textContent = confirmText;
        modalConfirm.classList.remove("hidden");
        modalConfirm.onclick = () => {
          hideModal();
          if (typeof onConfirm === "function") {
            onConfirm();
          }
        };
      } else {
        modalConfirm.classList.add("hidden");
        modalConfirm.onclick = null;
      }
    }
    modalCancel.textContent = cancelText || (confirmText ? "취소" : "확인");
    modalCancel.onclick = hideModal;
    modal.classList.remove("hidden");
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
      labelGame: null,
      labelTimers: { interval: null, timeout: null },
      labelStarted: false,
      finalGame: null,
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
    refs.sanBarFill.style.width = Math.max(0, Math.min(100, (sanity / DEFAULT_SANITY) * 100)) + "%";
    refs.susBarFill.style.width = Math.max(0, Math.min(100, suspicion)) + "%";
    if (refs.finalSanityDisplay) {
      refs.finalSanityDisplay.textContent = sanity;
    }
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
    STATE.labelGame = null;
    hideModal();
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
        {
          text: "준비됐다",
          onClick: (event) => {
            const target = event && event.currentTarget;
            if (STATE.labelStarted) {
              if (target) {
                target.disabled = true;
              }
              return;
            }
            STATE.labelStarted = true;
            if (target) {
              target.disabled = true;
              target.classList.add("hidden");
            }
            startLabelPuzzle({ scrollIntoView: true });
          },
        },
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

  function startLabelPuzzle({ scrollIntoView = false } = {}) {
    const {
      puzzleLabel,
      labelFlash,
      labelCountdown,
      labelContent,
      labelPrompt,
      labelBoard,
      labelReplay,
    } = STATE.refs;

    if (!puzzleLabel || !labelBoard) return;

    const timers = STATE.labelTimers;
    const revealDuration = 3000;

    function createCards() {
      const cards = [];
      PAIRS.forEach(([icon, letter]) => {
        cards.push({ id: letter, display: icon, type: "icon" });
        cards.push({ id: letter, display: letter, type: "letter" });
      });
      for (let i = cards.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      return cards;
    }

    function initGame() {
      const cards = createCards();
      const buttons = [];
      STATE.labelGame = {
        cards,
        buttons,
        revealed: [],
        matched: new Set(),
        locked: false,
        peek: true,
      };

      labelBoard.innerHTML = "";
      cards.forEach((card, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `label-card ${card.type === "icon" ? "is-icon" : "is-letter"}`;
        btn.onclick = () => handleFlip(index);
        labelBoard.appendChild(btn);
        buttons.push(btn);
      });

      updateBoard();
    }

    function updateBoard() {
      const game = STATE.labelGame;
      if (!game) return;
      const { cards, buttons, revealed, matched, peek, locked } = game;
      cards.forEach((card, index) => {
        const btn = buttons[index];
        if (!btn) return;
        const isMatched = matched.has(card.id);
        const isRevealed = peek || revealed.includes(index) || isMatched;
        btn.textContent = isRevealed ? card.display : "❓";
        btn.classList.toggle("revealed", isRevealed);
        btn.classList.toggle("matched", isMatched);
        btn.disabled = peek || locked || isRevealed;
      });
    }

    function handleFlip(index) {
      const game = STATE.labelGame;
      if (!game || game.peek || game.locked) return;
      if (game.revealed.includes(index)) return;
      const card = game.cards[index];
      if (game.matched.has(card.id)) return;

      game.revealed.push(index);
      updateBoard();

      if (game.revealed.length === 2) {
        game.locked = true;
        const [firstIdx, secondIdx] = game.revealed;
        const first = game.cards[firstIdx];
        const second = game.cards[secondIdx];
        if (first.id === second.id && first.type !== second.type) {
          setTimeout(() => {
            const active = STATE.labelGame;
            if (!active) return;
            active.matched.add(first.id);
            active.revealed = [];
            active.locked = false;
            updateBoard();
            if (active.matched.size === PAIRS.length) {
              showToast("해독 성공! 증거 획득");
              go("label_done");
            }
          }, 420);
        } else {
          setTimeout(() => {
            const active = STATE.labelGame;
            if (!active) return;
            active.revealed = [];
            active.locked = false;
            updateBoard();
          }, 720);
        }
      }
    }

    function startReveal() {
      clearLabelTimers();
      if (!STATE.labelGame) {
        initGame();
      }

      const game = STATE.labelGame;
      if (game) {
        game.peek = true;
        game.locked = true;
        game.revealed = [];
        updateBoard();
      }

      puzzleLabel.classList.remove("hidden");
      if (labelPrompt) {
        labelPrompt.classList.remove("hidden");
      }
      if (labelFlash) {
        labelFlash.classList.remove("hidden");
      }
      if (labelCountdown) {
        labelCountdown.classList.remove("hidden");
        labelCountdown.textContent = "3";
      }
      if (labelContent) {
        renderLabelContent(labelContent);
      }
      if (labelReplay) {
        labelReplay.disabled = true;
      }

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
      if (labelCountdown) {
        labelCountdown.classList.add("hidden");
      }
      if (labelContent) {
        labelContent.innerHTML = "";
      }
      const game = STATE.labelGame;
      if (game) {
        game.peek = false;
        game.revealed = [];
        game.locked = false;
        updateBoard();
      }
      if (labelReplay) {
        labelReplay.disabled = false;
      }
    }

    if (!STATE.labelGame) {
      initGame();
    } else {
      updateBoard();
    }

    puzzleLabel.classList.remove("hidden");
    if (scrollIntoView && typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        if (puzzleLabel && typeof puzzleLabel.scrollIntoView === "function") {
          puzzleLabel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
    if (labelReplay) {
      labelReplay.onclick = () => {
        if (STATE.sanity <= 1) {
          showModal({
            message: "정신력이 거의 소진되어 다시 볼 수 없습니다.",
            confirmText: null,
            cancelText: "확인",
          });
          return;
        }
        showModal({
          message: "다시 볼 시 정신력이 깎입니다.<br>카드를 다시 확인하시겠습니까?",
          confirmText: "다시 보기",
          cancelText: "취소",
          onConfirm: () => {
            STATE.sanity = Math.max(0, STATE.sanity - 1);
            updateHUD();
            showToast("정신력 -1", 1400);
            startReveal();
          },
        });
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

  function updateFinalEnemyHealthDisplay(value) {
    const { finalEnemyHealth } = STATE.refs;
    if (finalEnemyHealth) {
      finalEnemyHealth.textContent = value;
    }
  }

  function clearArcadeOverlay() {
    const { finalArcadeOverlay, finalArcadeRestart } = STATE.refs;
    if (finalArcadeOverlay) {
      finalArcadeOverlay.classList.add("hidden");
    }
    if (finalArcadeRestart) {
      finalArcadeRestart.onclick = null;
      finalArcadeRestart.classList.remove("hidden");
    }
  }

  function showArcadeOverlay(message, { buttonText, onButton } = {}) {
    const { finalArcadeOverlay, finalArcadeText, finalArcadeRestart } = STATE.refs;
    if (!finalArcadeOverlay || !finalArcadeText || !finalArcadeRestart) return;
    finalArcadeText.innerHTML = message;
    if (buttonText && typeof onButton === "function") {
      finalArcadeRestart.textContent = buttonText;
      finalArcadeRestart.onclick = onButton;
      finalArcadeRestart.classList.remove("hidden");
    } else {
      finalArcadeRestart.classList.add("hidden");
      finalArcadeRestart.onclick = null;
    }
    finalArcadeOverlay.classList.remove("hidden");
  }

  function stopFinalArcade() {
    const game = STATE && STATE.finalGame;
    if (!game) return;
    game.running = false;
    if (game.raf) {
      cancelAnimationFrame(game.raf);
    }
    if (game.onKeyDown) {
      window.removeEventListener("keydown", game.onKeyDown);
    }
    if (game.onKeyUp) {
      window.removeEventListener("keyup", game.onKeyUp);
    }
    if (game.knives) {
      game.knives.forEach((proj) => {
        if (proj.el && proj.el.parentNode) {
          proj.el.parentNode.removeChild(proj.el);
        }
      });
    }
    if (game.juice) {
      game.juice.forEach((proj) => {
        if (proj.el && proj.el.parentNode) {
          proj.el.parentNode.removeChild(proj.el);
        }
      });
    }
    if (STATE.refs && STATE.refs.finalArena) {
      STATE.refs.finalArena.querySelectorAll(".proj").forEach((node) => node.remove());
    }
    STATE.finalGame = null;
  }

  function exitFinalEncounter() {
    const { refs } = STATE || {};
    if (!refs) return;
    stopFinalArcade();
    clearArcadeOverlay();
    const { finalEncounter, finalGame, finalVictory, hud, vn, finalArcadeOverlay } = refs;
    if (finalArcadeOverlay) finalArcadeOverlay.classList.add("hidden");
    if (finalGame) finalGame.classList.add("hidden");
    if (finalVictory) finalVictory.classList.add("hidden");
    if (finalEncounter) {
      finalEncounter.classList.add("hidden");
      finalEncounter.classList.remove("is-flicker", "show-human", "show-reptile", "shrink-face", "show-game", "victory");
    }
    if (hud) hud.classList.remove("hidden");
    if (vn) vn.classList.remove("hidden");
  }

  function startFinalEncounter() {
    const { refs } = STATE;
    if (!refs) return;
    const { finalEncounter, finalGame, finalVictory, hud, vn, choices, text } = refs;

    STATE.scene = "final_encounter";
    hideAllPuzzles();
    stopFinalArcade();
    clearArcadeOverlay();

    if (choices) choices.innerHTML = "";
    if (text) text.innerHTML = "";
    if (hud) hud.classList.add("hidden");
    if (vn) vn.classList.add("hidden");

    if (!finalEncounter) {
      endingGood();
      return;
    }

    finalEncounter.classList.remove("hidden", "victory", "show-human", "show-reptile", "shrink-face", "show-game");
    finalEncounter.classList.add("is-flicker");
    if (finalGame) finalGame.classList.add("hidden");
    if (finalVictory) finalVictory.classList.add("hidden");

    if (STATE.sanity < 5) {
      STATE.sanity = 5;
    }
    updateHUD();

    requestAnimationFrame(() => {
      if (!STATE || STATE.scene !== "final_encounter" || !STATE.refs || STATE.refs.finalEncounter !== finalEncounter) return;
      finalEncounter.classList.add("show-human");
    });
    setTimeout(() => {
      if (!STATE || STATE.scene !== "final_encounter" || !STATE.refs || STATE.refs.finalEncounter !== finalEncounter) return;
      finalEncounter.classList.add("show-reptile");
    }, 900);
    setTimeout(() => {
      if (!STATE || STATE.scene !== "final_encounter" || !STATE.refs || STATE.refs.finalEncounter !== finalEncounter) return;
      finalEncounter.classList.add("shrink-face");
    }, 1500);
    setTimeout(() => {
      if (!STATE || STATE.scene !== "final_encounter" || !STATE.refs || STATE.refs.finalEncounter !== finalEncounter) return;
      finalEncounter.classList.remove("is-flicker");
      startFinalArcade();
    }, 2200);
  }

  function startFinalArcade() {
    const { refs } = STATE;
    if (!refs) return;
    const {
      finalEncounter,
      finalGame,
      finalArena,
      finalEnemy,
      finalPlayer,
      finalArcadeOverlay,
      finalArcadeRestart,
    } = refs;

    if (!finalEncounter || !finalGame || !finalArena || !finalEnemy || !finalPlayer) {
      exitFinalEncounter();
      endingGood();
      return;
    }

    STATE.scene = "final_arcade";

    finalGame.classList.remove("hidden");
    finalEncounter.classList.add("show-game");
    finalEnemy.classList.remove("hit");
    finalPlayer.classList.remove("hit");
    finalArena.querySelectorAll(".proj").forEach((node) => node.remove());
    if (finalArcadeOverlay) {
      finalArcadeOverlay.classList.add("hidden");
    }
    if (finalArcadeRestart) {
      finalArcadeRestart.onclick = null;
      finalArcadeRestart.classList.remove("hidden");
    }

    const game = {
      running: true,
      knives: [],
      juice: [],
      keys: { left: false, right: false, space: false },
      playerX: 0.5,
      enemyX: 0.5,
      enemyOsc: 0,
      enemyHealth: 10,
      lastTime: null,
      lastKnife: 0,
      knifeCooldown: 250,
      lastSpawn: 0,
      spawnInterval: 900,
      raf: null,
    };

    STATE.finalGame = game;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    updateFinalEnemyHealthDisplay(game.enemyHealth);
    updateHUD();

    const onKeyDown = (event) => {
      if (!STATE || STATE.finalGame !== game) return;
      const { code, key } = event;
      if (code === "ArrowLeft" || key === "ArrowLeft") {
        game.keys.left = true;
        event.preventDefault();
      } else if (code === "ArrowRight" || key === "ArrowRight") {
        game.keys.right = true;
        event.preventDefault();
      } else if (code === "Space" || key === " " || key === "Spacebar") {
        game.keys.space = true;
        event.preventDefault();
      }
    };

    const onKeyUp = (event) => {
      if (!STATE || STATE.finalGame !== game) return;
      const { code, key } = event;
      if (code === "ArrowLeft" || key === "ArrowLeft") {
        game.keys.left = false;
        event.preventDefault();
      } else if (code === "ArrowRight" || key === "ArrowRight") {
        game.keys.right = false;
        event.preventDefault();
      } else if (code === "Space" || key === " " || key === "Spacebar") {
        game.keys.space = false;
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    game.onKeyDown = onKeyDown;
    game.onKeyUp = onKeyUp;

    const spawnKnife = () => {
      const el = document.createElement("div");
      el.className = "proj knife";
      finalArena.appendChild(el);
      const knife = { el, x: game.playerX, y: 0.18, speed: 1.4 };
      game.knives.push(knife);
    };

    const spawnJuice = () => {
      const el = document.createElement("div");
      el.className = "proj juice";
      finalArena.appendChild(el);
      const juice = {
        el,
        x: clamp(game.enemyX + (Math.random() - 0.5) * 0.3, 0.08, 0.92),
        y: 0.9,
        speed: 0.6 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.35,
      };
      game.juice.push(juice);
      finalEnemy.classList.add("hit");
      setTimeout(() => finalEnemy.classList.remove("hit"), 200);
    };

    const handleEnemyHit = () => {
      game.enemyHealth = Math.max(0, game.enemyHealth - 1);
      updateFinalEnemyHealthDisplay(game.enemyHealth);
      finalEnemy.classList.add("hit");
      setTimeout(() => finalEnemy.classList.remove("hit"), 200);
      if (game.enemyHealth <= 0) {
        game.running = false;
        finalEncounterSuccess();
      }
    };

    const handlePlayerHit = () => {
      finalPlayer.classList.add("hit");
      setTimeout(() => finalPlayer.classList.remove("hit"), 260);
      if (STATE.sanity > 0) {
        STATE.sanity = Math.max(0, STATE.sanity - 1);
        updateHUD();
        showToast("녹즙에 맞았다! 정신력 -1", 1400);
      }
      if (STATE.sanity <= 0) {
        game.running = false;
        finalEncounterFail();
      }
    };

    const updatePlayerPosition = () => {
      finalPlayer.style.left = game.playerX * 100 + "%";
    };

    const updateEnemyPosition = () => {
      finalEnemy.style.left = game.enemyX * 100 + "%";
    };

    updatePlayerPosition();
    updateEnemyPosition();

    const loop = (timestamp) => {
      if (!STATE || STATE.finalGame !== game) return;
      if (!game.running) return;
      if (game.lastTime == null) {
        game.lastTime = timestamp;
        game.raf = requestAnimationFrame(loop);
        return;
      }

      const delta = Math.min(0.05, (timestamp - game.lastTime) / 1000);
      game.lastTime = timestamp;

      const moveSpeed = 0.6;
      if (game.keys.left) {
        game.playerX = clamp(game.playerX - moveSpeed * delta, 0.08, 0.92);
      }
      if (game.keys.right) {
        game.playerX = clamp(game.playerX + moveSpeed * delta, 0.08, 0.92);
      }

      if (game.keys.space && timestamp - game.lastKnife > game.knifeCooldown) {
        spawnKnife();
        game.lastKnife = timestamp;
      }

      game.enemyOsc += delta;
      game.enemyX = clamp(0.5 + Math.sin(game.enemyOsc * 1.5) * 0.2, 0.18, 0.82);

      updatePlayerPosition();
      updateEnemyPosition();

      game.knives = game.knives.filter((knife) => {
        knife.y += knife.speed * delta;
        if (knife.y > 1.05) {
          if (knife.el && knife.el.parentNode) knife.el.parentNode.removeChild(knife.el);
          return false;
        }
        knife.el.style.left = knife.x * 100 + "%";
        knife.el.style.bottom = knife.y * 100 + "%";
        if (knife.y >= 0.78 && Math.abs(knife.x - game.enemyX) <= 0.12) {
          if (knife.el && knife.el.parentNode) knife.el.parentNode.removeChild(knife.el);
          handleEnemyHit();
          return false;
        }
        return true;
      });

      if (!game.running) return;

      game.juice = game.juice.filter((projectile) => {
        projectile.y -= projectile.speed * delta;
        projectile.x = clamp(projectile.x + projectile.vx * delta, 0.05, 0.95);
        projectile.el.style.left = projectile.x * 100 + "%";
        projectile.el.style.bottom = projectile.y * 100 + "%";
        if (projectile.y < -0.1) {
          if (projectile.el && projectile.el.parentNode) projectile.el.parentNode.removeChild(projectile.el);
          return false;
        }
        if (projectile.y <= 0.16 && Math.abs(projectile.x - game.playerX) <= 0.1) {
          if (projectile.el && projectile.el.parentNode) projectile.el.parentNode.removeChild(projectile.el);
          handlePlayerHit();
          return false;
        }
        return true;
      });

      if (!game.running) return;

      if (timestamp - game.lastSpawn > game.spawnInterval) {
        spawnJuice();
        game.lastSpawn = timestamp;
        game.spawnInterval = 680 + Math.random() * 420;
      }

      game.raf = requestAnimationFrame(loop);
    };

    game.raf = requestAnimationFrame(loop);
  }

  function finalEncounterSuccess() {
    clearArcadeOverlay();
    stopFinalArcade();
    const { refs } = STATE;
    if (!refs) return;
    const { finalEncounter, finalVictory } = refs;
    STATE.scene = "final_victory";
    STATE.suspicion = 100;
    updateHUD();
    if (finalVictory) {
      finalVictory.classList.remove("hidden");
    }
    if (finalEncounter) {
      finalEncounter.classList.add("victory");
    }
    setTimeout(() => {
      exitFinalEncounter();
      endingGood();
    }, 2200);
  }

  function finalEncounterFail() {
    showArcadeOverlay("녹즙에 맞아 정신력이 붕괴했습니다.");
    stopFinalArcade();
    STATE.scene = "final_failure";
    setTimeout(() => {
      exitFinalEncounter();
      endingBad();
    }, 1200);
  }

  function endingCheck() {
    startFinalEncounter();
  }

  function endingGood() {
    exitFinalEncounter();
    hideAllPuzzles();
    STATE.scene = "ending_good";
    speak("시스템", '<b class="good">굿엔딩</b> — 증거로 정체를 밝히는 데 성공했다.', [
      { text: "다시 시작", onClick: reset },
    ]);
    endCallback("good");
  }

  function endingBad() {
    exitFinalEncounter();
    hideAllPuzzles();
    STATE.scene = "ending_bad";
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
    STATE.labelStarted = false;
    updateHUD();
    exitFinalEncounter();
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
        hud: nodes.root.querySelector("#hud"),
        vn: nodes.root.querySelector("#vn"),
        puzzleLabel: nodes.root.querySelector("#puzzleLabel"),
        labelFlash: nodes.root.querySelector("#labelFlash"),
        labelCountdown: nodes.root.querySelector("#labelCountdown"),
        labelContent: nodes.root.querySelector("#labelContent"),
        labelPrompt: nodes.root.querySelector("#labelPrompt"),
        labelBoard: nodes.root.querySelector("#labelBoard"),
        labelReplay: nodes.root.querySelector("#labelReplay"),
        puzzleKey: nodes.root.querySelector("#puzzleKey"),
        codeDisp: nodes.root.querySelector("#codeDisp"),
        finalEncounter: nodes.root.querySelector("#finalEncounter"),
        finalGame: nodes.root.querySelector("#finalGame"),
        finalArena: nodes.root.querySelector("#finalArena"),
        finalEnemy: nodes.root.querySelector("#finalEnemy"),
        finalPlayer: nodes.root.querySelector("#finalPlayer"),
        finalEnemyHealth: nodes.root.querySelector("#finalEnemyHealth"),
        finalSanityDisplay: nodes.root.querySelector("#finalSanityDisplay"),
        finalArcadeOverlay: nodes.root.querySelector("#finalArcadeOverlay"),
        finalArcadeText: nodes.root.querySelector("#finalArcadeText"),
        finalArcadeRestart: nodes.root.querySelector("#finalArcadeRestart"),
        finalVictory: nodes.root.querySelector("#finalVictory"),
        modal: nodes.root.parentNode.querySelector("#modal"),
        modalMessage: nodes.root.parentNode.querySelector("#modalMessage"),
        modalCancel: nodes.root.parentNode.querySelector("#modalCancel"),
        modalConfirm: nodes.root.parentNode.querySelector("#modalConfirm"),
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
      stopFinalArcade();
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
