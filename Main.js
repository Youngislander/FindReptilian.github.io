const { useMemo, useState, useEffect } = React;

// "랩틸리언을 찾아라" — 미연시 스타일 선택 추리 게임 (단일 파일)
// 신규 요구 반영 + 버그 수정:
// - 라운드별로 이미 대화한 인물은 같은 라운드 선택지에서 제외
// - 라운드 종료 시 의심 최다 인물 산정: 단독 1명 → 자동 지목/엔딩, 동점 n명 → 그들만 결승 라운드(finalists)로 재시작
// - 한 명 이상 대화하면 언제든 "범인 선택하기"(수동 지목) 가능
// - 각 장면에 맞는 큰 배경 일러스트(SVG) 추가: 회의실/데이터랩/사내식당/탕비실
// - HR: 입가에 초록 액체 묻음 → "그거 뭐예요?" 추궁
// - DS: 눈동자 색이 평소와 다름 → "왜 그래요?" 질문 시 "렌즈 꼈어요" 답변
// - 어려운 기술 용어 제거, 쉬운 말투
// - 🔧 무한 리렌더 수정: 렌더 중 setState 호출 제거. useEffect로 페어 생성 관리

function App(){
  const baseChars = [
    { id:"pm", name:"박PM", role:"프로덕트 매니저", color:"#4f83ff", desc:"프로덕트 방향과 회의를 정리한다." },
    { id:"ds", name:"최데싸", role:"데이터 사이언티스트", color:"#18b87a", desc:"데이터 분석과 리포트를 맡는다." },
    { id:"fe", name:"김프엔", role:"프론트엔드 개발자", color:"#d08a1f", desc:"화면과 인터랙션을 만든다." },
    { id:"hr", name:"오인사", role:"HR", color:"#c24c9a", desc:"채용과 복지를 챙긴다." }
  ];
  function freshChars(){
    return baseChars.map(c => ({ ...c, susp:0, talks:0 }));
  }
  function pickRandomCulprit(){
    const ids = baseChars.map(c=>c.id); return ids[(Math.random()*ids.length)|0];
  }

  const [state, setState] = useState({
    mode:"title",          // title | choose | talk | summary | accuse | ending | tie_note
    chars:freshChars(),
    culprit:pickRandomCulprit(),
    current:null,
    pair:[],
    accused:null,
    endingKey:null,
    round:1,               // 진행 라운드 (1부터 증가)
    finalists:null         // null | [id...] 동점 결승전 후보만 남겨 라운드 진행
  });

  const charMap = useMemo(()=>{ const m={}; baseChars.forEach(c=>m[c.id]=c); return m; },[]);

  // ---------------- 흐름 제어 ----------------
  function startGame(){
    setState({ mode:"choose", chars:freshChars(), culprit:pickRandomCulprit(), current:null, pair:[], accused:null, endingKey:null, round:1, finalists:null });
  }

  // 현재 라운드에 아직 대화하지 않은 대상(결승전이면 finalists에 포함된 대상만)을 반환
  function eligibleIds(st){
    const allow = (st.finalists? new Set(st.finalists): null);
    return st.chars.filter(c => (allow? allow.has(c.id) : true)).filter(c => c.talks < st.round).map(c=>c.id);
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } }

  function pickPair(st){
    const pool = eligibleIds(st);
    if (pool.length===0) return [];
    if (pool.length===1){
      // 한 명만 남았으면, 이미 대화 끝난 사람 중(또는 finalists 범위 내)에서 1명 보조로 채움 (미끼 대화)
      const universe = (st.finalists? st.finalists : baseChars.map(c=>c.id)).filter(id=>id!==pool[0]);
      const others = universe;
      if (others.length===0) return [pool[0]]; // 이 경우 곧 요약으로 감
      const copy = others.slice(); shuffle(copy);
      return [pool[0], copy[0]];
    }
    const copy = pool.slice(); shuffle(copy);
    return [copy[0], copy[1]];
  }

  function choosePerson(id){ setState(prev=>({ ...prev, mode:"talk", current:id })); }

  function finishTalk(targetId, deltaSusp){
    setState(prev=>{
      const nextChars = prev.chars.map(c => c.id===targetId ? { ...c, susp:c.susp+(deltaSusp||0), talks: Math.max(c.talks, prev.round) } : c);
      const tmp = { ...prev, chars: nextChars, mode:"choose", current:null, pair:[] };
      // 라운드 소진 체크 → 페어는 useEffect가 채움
      const left = eligibleIds(tmp);
      if (left.length===0){
        return { ...tmp, mode:"summary" };
      }
      return tmp;
    });
  }

  function goAccuse(){ setState(prev=>({ ...prev, mode:"accuse", current:null, pair:[] })); }
  function onAccuse(id){ setState(prev=>({ ...prev, mode:"ending", accused:id, endingKey: (id===prev.culprit)?"true_end":"enslaved" })); }

  // 요약에서 후보 산정
  function computeLeaders(st){
    const scope = st.finalists? new Set(st.finalists) : null;
    let max = -Infinity; let leaders=[];
    st.chars.forEach(c=>{
      if (scope && !scope.has(c.id)) return;
      if (c.susp>max){ max=c.susp; leaders=[c.id]; }
      else if (c.susp===max){ leaders.push(c.id); }
    });
    return { max, leaders };
  }

  function startFinals(nextFinalists){
    setState(prev=>({ ...prev, finalists: nextFinalists.slice(), round: prev.round+1, mode:"choose", pair:[] }));
  }

  // 🔧 페어 생성은 렌더가 아닌 useEffect에서 1회성으로 수행
  useEffect(()=>{
    if (state.mode!=="choose") return;
    if (state.pair.length>0) return;
    const nextPair = pickPair(state);
    if (nextPair.length){ setState(prev=> ({ ...prev, pair: nextPair })); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mode, state.round, state.finalists, state.chars, state.pair.length]);

  // ---------------- 화면 ----------------
  if (state.mode==="title") return <TitleScreen onStart={startGame} />;

  const canQuickAccuse = state.chars.some(c=>c.talks>0);

  if (state.mode==="choose"){
    // 여기서는 state.pair만 사용 (렌더 중 pair 생성 금지)
    if (!state.pair.length) return <SummaryScreen state={state} onPlanFinals={startFinals} onAutoAccuse={onAccuse} onToAccuse={goAccuse} />;
    const a = getChar(state.chars, state.pair[0]);
    const b = state.pair[1]? getChar(state.chars, state.pair[1]) : null;
    const scopeLabel = state.finalists? "결승 라운드" : `라운드 ${state.round}`;
    return (
      <div style={styles.vnRoot}>
        <SceneLayer tag="pantry" />
        <div style={styles.hud}>
          <div>{scopeLabel}</div>
          <div>의심 총합 {state.chars.reduce((s,x)=>s+x.susp,0)}</div>
          {canQuickAccuse && <button style={styles.btnMini} onClick={goAccuse}>범인 선택하기</button>}
        </div>
        <SceneHeader text={b?"탕비실 — 두 동료가 서 있다. 누구에게 말을 걸까?":"탕비실 — 한 동료만 남았다."} />
        <div style={styles.pairWrap}>
          <PortraitKaiju char={a} sceneTag="pantry" onClick={()=>choosePerson(a.id)} />
          {b && <PortraitKaiju char={b} sceneTag="pantry" onClick={()=>choosePerson(b.id)} />}
        </div>
        
        <ChoiceBar choices={[
          {label:`${a.name}에게 말을 건다`, onClick:()=>choosePerson(a.id)},
          ...(b? [{label:`${b.name}에게 말을 건다`, onClick:()=>choosePerson(b.id)}] : [])
        ]} />
      </div>
    );
  }

  if (state.mode==="talk"){
    const ch = getChar(state.chars, state.current);
    const data = talkData(ch.id, state.culprit===ch.id, state.round);
    const scopeLabel = state.finalists? "결승 라운드" : `라운드 ${state.round}`;
    return (
      <div style={styles.vnRoot}>
        <SceneLayer tag={data.bgTag} />
        <div style={styles.hud}>
          <div>{scopeLabel}</div>
          {canQuickAccuse && <button style={styles.btnMini} onClick={goAccuse}>범인 선택하기</button>}
        </div>
        <SceneHeader text={data.situation} />
        <PortraitKaiju char={ch} sceneTag={data.tag} highlightMouth={data.highlightMouth} eyeTint={data.eyeTint} />
        <DialogBox speaker={ch.name} q={data.q} a={data.a} />
        <ChoiceBar choices={[
          {label:data.suspLabel, onClick:()=>finishTalk(ch.id, data.suspDelta)},
          {label:data.passLabel, onClick:()=>finishTalk(ch.id, 0)}
        ]} />
      </div>
    );
  }

  if (state.mode==="summary") return <SummaryScreen state={state} onPlanFinals={startFinals} onAutoAccuse={onAccuse} onToAccuse={goAccuse} />;
  if (state.mode==="accuse") return <AccuseScreen chars={state.chars} onAccuse={onAccuse} finalists={state.finalists} />;
  if (state.mode==="ending") return <EndingScreen chars={state.chars} accused={state.accused} culpritId={state.culprit} endingKey={state.endingKey} onRestart={startGame} />;

  return null;
}

/* ======================= 데이터 & 대사 ======================= */

function talkData(id, isCulprit, round){
  // 쉬운 말투 + 장면 설명 + Q/A 포맷(q: 나의 질문, a: 캐릭터 답)
  if (id==="pm"){
    if (isCulprit){
      return { bgTag:"meeting", tag:"pm", situation:"회의실. 박PM의 표정이 미묘하게 굳어 있다.", q: round===1?"요즘 회의 중에 이상한 분위기 느끼셨어요?":"오늘 특히 긴장한 것 같아 보여요.", a: round===1?"일정은 잘 가고 있어요. 다들… 눈빛만 잘 보면 됩니다.":"리스크는 제가 삼켜… 아니, 정리하겠습니다.", suspLabel:"의심한다(말이 어색하다)", passLabel:"넘어간다", suspDelta:1 };
    }
    return { bgTag:"meeting", tag:"pm", situation:"회의실. 박PM이 플래너를 넘기며 브리핑한다.", q: round===1?"무리한 일정은 없죠?":"팀 컨디션은 어때요?", a: round===1?"오늘 목표만 딱 맞추죠. 어렵다면 바로 말해요.":"다들 피곤해 보여요. 커피 챙길게요.", suspLabel:"살짝 의심", passLabel:"그렇군요", suspDelta:1 };
  }
  if (id==="ds"){
    if (isCulprit){
      return { bgTag:"datalab", tag:"ds", situation:"데이터랩. 최데싸의 눈동자가 평소보다 진하게 보인다.", q: round===1?"눈동자 색이 평소랑 다른데요?":"잠 못 주무셨어요?", a: round===1?"오늘은 모니터 빛이 눈에… 잘 비치네요.":"시선이… 건조해서 그런가봐요.", suspLabel:"더 캐묻는다(수상함)", passLabel:"넘어간다", suspDelta:2, eyeTint:true };
    }
    if (round===1){
      return { bgTag:"datalab", tag:"ds", situation:"데이터랩. 최데싸가 차분히 화면을 스크롤한다.", q:"눈동자 색이 달라 보여요.", a:"아… 그러네요?", suspLabel:"왜 그런지 물어본다", passLabel:"수고 많아요", suspDelta:1, eyeTint:true };
    } else {
      return { bgTag:"datalab", tag:"ds", situation:"데이터랩. 모니터 불빛이 얼굴을 비춘다.", q:"눈 얘기 다시 물어봐도 돼요?", a:"렌즈 꼈어요. 컬러 렌즈라 좀 진해 보여요.", suspLabel:"그렇군요(넘어간다)", passLabel:"알겠어요", suspDelta:0 };
    }
  }
  if (id==="fe"){
    if (isCulprit){
      return { bgTag:"cafeteria", tag:"fe", situation:"사내식당. 김프엔이 생고기 코너에서 잠시 멈춘다.", q: round===1?"점심 뭐 드세요?":"생고기 좋아하세요?", a: round===1?"샐러드에… 생고기 토핑이 있다던데요.":"신선하면… 바로 먹는 게 좋죠.", suspLabel:"의심한다(입맛이 수상하다)", passLabel:"농담으로 넘긴다", suspDelta:1 };
    }
    return { bgTag:"cafeteria", tag:"fe", situation:"사내식당. 김프엔이 샐러드 드레싱을 고른다.", q: round===1?"추천 메뉴 있어요?":"운동하신다더니 식단 중이에요?", a: round===1?"새 메뉴가 많네요. 뭐가 맛있을까요?":"맞아요. 단백질 챙기는 중이에요.", suspLabel:"장난스레 의심", passLabel:"응원한다", suspDelta:1 };
  }
  if (id==="hr"){
    if (isCulprit){
      return { bgTag:"pantry", tag:"hr", situation:"탕비실. 오인사의 입가에 초록색 액체가 묻어 있다.", q: round===1?"입가에 초록색… 그거 뭐예요?":"아침에 급했어요?", a: round===1?"물이 또 떨어져서요. 이거 드세요. (입가를 슬쩍 닦는다)":"아침에 바빠서… 정리할 틈이 없었네요.", suspLabel:"더 추궁한다", passLabel:"괜찮아요", suspDelta:2, highlightMouth:true };
    }
    if (round===1){
      return { bgTag:"pantry", tag:"hr", situation:"탕비실. 오인사가 종이컵을 정리한다. 입가에 녹즙 자국이 있다.", q:"혹시 입가에 뭐 묻었어요?", a:"앗, 녹즙이요. 아침에 마셨는데 묻었나 봐요.", suspLabel:"살짝 의심", passLabel:"그럴 수 있죠", suspDelta:1, highlightMouth:true };
    } else {
      return { bgTag:"pantry", tag:"hr", situation:"탕비실. 오인사가 미소를 지으며 휴지를 내민다.", q:"아까 그거 이제 괜찮죠?", a:"네. 다음부터는 바로 닦을게요.", suspLabel:"넘어간다", passLabel:"알겠어요", suspDelta:0 };
    }
  }
  return { bgTag:"office", tag:"office", situation:"사무실.", q:"…", a:"…", suspLabel:"의심", passLabel:"패스", suspDelta:1 };
}


/* ======================= 요약/지목 화면 ======================= */

function SummaryScreen({ state, onPlanFinals, onAutoAccuse, onToAccuse }){
  const { max, leaders } = computeLeaders(state);
  const scope = state.finalists? new Set(state.finalists) : null;
  const shown = state.chars.filter(c=> scope? scope.has(c.id): true);
  const allRoundsDone = shown.every(c=> c.talks>=state.round);
  const uniqueLeader = (leaders.length===1);

  return (
    <div style={styles.summaryRoot}>
      <div style={styles.summaryBox}>
        <div style={styles.title}>요약 {state.finalists?"(결승 라운드)":"(라운드 "+state.round+")"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
          {shown.map(c=> (
            <div key={c.id} style={styles.card}>
              <PortraitKaiju char={c} sceneTag="summary" compact />
              <div style={{marginTop:6,fontWeight:800}}>{c.name} <span style={{opacity:0.7,fontWeight:400}}>({c.role})</span></div>
              <div style={{opacity:0.9,marginTop:4}}>{c.desc}</div>
              <div style={{marginTop:6}}>의심: <b>{c.susp}</b> / 대화: {c.talks}회</div>
            </div>
          ))}
        </div>

        {allRoundsDone && (
          <div style={{marginTop:12}}>
            {uniqueLeader ? (
              <>
                <div style={{opacity:0.9,marginBottom:8}}>의심이 가장 많은 사람은 <b>{getChar(state.chars, leaders[0]).name}</b> 입니다. 자동으로 지목합니다.</div>
                <button style={styles.btnPrimary} onClick={()=>onAutoAccuse(leaders[0])}>자동 지목 → 결과 보기</button>
              </>
            ) : (
              <>
                <div style={{opacity:0.95,marginBottom:8}}>여러 명이 동점이에요. <b>{leaders.map(id=>getChar(state.chars,id).name).join(", ")}</b>. 조금 더 대화를 해보고 진짜 범인을 찾자!</div>
                <button style={styles.btnGhost} onClick={()=>onPlanFinals(leaders)}>결승 라운드 시작</button>
                <button style={{...styles.btnPrimary, marginLeft:8}} onClick={onToAccuse}>수동으로 지목하기</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AccuseScreen({ chars, onAccuse, finalists }){
  const scope = finalists? new Set(finalists) : null;
  const list = scope? chars.filter(c=>scope.has(c.id)) : chars;
  const sorted = list.slice().sort((a,b)=> b.susp - a.susp);
  return (
    <div style={styles.accRoot}>
      <div style={styles.accBox}>
        <div style={styles.title}>누가 랩틸리언인가요?</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
          {sorted.map(c=> (
            <button key={c.id} style={styles.btnAccuse} onClick={()=>onAccuse(c.id)}>
              <PortraitKaiju char={c} sceneTag="accuse" compact />
              <div style={{marginTop:6,fontWeight:800}}>{c.name}</div>
              <div style={{fontSize:12,opacity:0.8}}>{c.role}</div>
              <div style={{fontSize:12,marginTop:4}}>의심 {c.susp}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EndingScreen({ chars, accused, culpritId, endingKey, onRestart }){
  const ok = endingKey==="true_end"; const target = getChar(chars, accused);
  return (
    <div style={styles.endRoot}>
      <div style={styles.endBox}>
        <div style={styles.title}>{ok?"정답 엔딩":"지배 엔딩"}</div>
        {ok? (
          <>
            <div style={styles.endDesc}>당신은 {target?target.name:"?"} 님을 정확히 지목했고, 회사는 사실을 공개해 그를 퇴치했습니다.</div>
            <div style={styles.endDesc}>사무실은 다시 평온을 되찾습니다.</div>
          </>
        ) : (
          <>
            <div style={styles.endDesc}>{target?target.name:"?"} 님은 인간이었습니다. 진짜 랩틸리언은 미소 지으며 당신의 정신을 포획합니다.</div>
            <div style={styles.endDesc}>어둠이 낮게 깔리고, 당신의 시선은 그들의 의지를 속삭입니다…</div>
            <div style={{opacity:0.8,marginTop:4}}>정답: {getChar(chars, culpritId)?.name || "?"}</div>
          </>
        )}
        <button style={styles.btnPrimary} onClick={onRestart}>다시 시작(범인 랜덤)</button>
      </div>
    </div>
  );
}

/* ======================= 비주얼 컴포넌트 ======================= */

function TitleScreen({onStart}){
  return (
    <div style={styles.titleRoot}>
      <HeroIllust />
      <div style={styles.titleBox}>
        <div style={{fontWeight:900,fontSize:28,letterSpacing:1}}>랩틸리언을 찾아라</div>
        <div style={{opacity:0.9,marginTop:6}}>반은 인간, 반은 랩틸리언… 오늘도 평범한 회사?</div>
        <button style={styles.btnPrimary} onClick={onStart}>게임 시작</button>
      </div>
    </div>
  );
}

function SceneLayer({tag}){
  // JPG 배경을 상황별로 적용 (괴수8호풍 애니 톤). 파일 프로토콜에서도 동작하도록 상대 경로 처리
  const prefix = (typeof window !== "undefined" && window.location && window.location.protocol === "file:") ? "." : "";
  const bgMap = {
    meeting: `${prefix}/images/meeting_kaiju.jpg`,
    datalab: `${prefix}/images/datalab_kaiju.jpg`,
    cafeteria: `${prefix}/images/cafeteria_kaiju.jpg`,
    pantry: `${prefix}/images/pantry_kaiju.jpg`,
    office: `${prefix}/images/office_kaiju.jpg`,
    default: `${prefix}/images/default_bg.jpg`
  };
  const url = bgMap[tag] || bgMap.default;
  return (
    <div style={{position:"fixed",inset:0,zIndex:-2,backgroundImage:`url(${url})`,backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(0.82) contrast(1.08)"}} />
  );
}

function SceneHeader({text}){
  return (
    <div style={styles.sceneHeader}>
      {text}
    </div>
  );
}

function MeetingArt(){
  return (
    <g opacity="0.35">
      <rect x="80" y="70" width="220" height="120" fill="#0f172a" stroke="#1e293b" />
      <rect x="90" y="80" width="200" height="6" fill="#334155" />
      <rect x="90" y="92" width="140" height="6" fill="#334155" />
      <circle cx="340" cy="150" r="80" fill="#0b1220" stroke="#1e293b" />
      <rect x="420" y="210" width="260" height="10" fill="#1f2937" />
    </g>
  );
}
function DataLabArt(){
  return (
    <g opacity="0.35">
      <rect x="520" y="70" width="180" height="110" fill="#0f172a" stroke="#1e293b" />
      <polyline points="530,160 560,130 590,140 620,110 690,120" fill="none" stroke="#34d399" strokeWidth="3" />
      <rect x="80" y="250" width="640" height="10" fill="#1f2937" />
    </g>
  );
}
function CafeArt(){
  return (
    <g opacity="0.35">
      <rect x="120" y="80" width="180" height="90" fill="#0f172a" stroke="#1e293b" />
      <circle cx="210" cy="180" r="60" fill="#0b1220" stroke="#1e293b" />
      <rect x="420" y="90" width="220" height="16" fill="#334155" />
      <rect x="420" y="114" width="220" height="16" fill="#334155" />
    </g>
  );
}
function PantryArt(){
  return (
    <g opacity="0.35">
      <rect x="90" y="90" width="120" height="160" fill="#0f172a" stroke="#1e293b" />
      <rect x="100" y="100" width="100" height="8" fill="#334155" />
      <circle cx="620" cy="140" r="50" fill="#0b1220" stroke="#1e293b" />
      <rect x="520" y="240" width="180" height="10" fill="#1f2937" />
      <rect x="300" y="260" width="200" height="8" fill="#334155" />
    </g>
  );
}

function PortraitKaiju({char, sceneTag, compact, onClick, highlightMouth, eyeTint}){
  const W = compact? 140 : 240; const H = compact? 120 : 210;
  return (
    <div onClick={onClick} style={{ width:W, height:H, borderRadius:16, background:"#0b0f1a", border:"1px solid rgba(255,255,255,0.18)", display:"grid", placeItems:"center", position:"relative", boxShadow:"0 10px 30px rgba(0,0,0,0.5)", cursor: onClick?"pointer":"default" }}>
      <svg viewBox="0 0 240 210" style={{position:"absolute",inset:0}}>
        <defs>
          <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#121a2b"/><stop offset="100%" stopColor="#0b1220"/></linearGradient>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#2dd4bf"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient>
        </defs>
        {/* 몸통 실루엣 */}
        <ellipse cx="120" cy="110" rx="70" ry="80" fill="url(#fg)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        {/* 얼굴 */}
        <ellipse cx="120" cy="78" rx="42" ry="38" fill="#0f172a" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        {/* 림라이트 */}
        <path d="M70,80 Q120,20 170,80" stroke="url(#rim)" strokeWidth="3" fill="none" opacity="0.6" />
        {/* 눈 */}
        <ellipse cx="108" cy="78" rx="10" ry="8" fill={eyeTint?"#8ef2ff":"#e2e8f0"}/>
        <ellipse cx="132" cy="78" rx="10" ry="8" fill={eyeTint?"#8ef2ff":"#e2e8f0"}/>
        {/* 캐릭터 컬러 포인트 */}
        <circle cx="120" cy="150" r="18" fill={char.color} opacity="0.85" />
        {/* 캐릭터별 아이콘 */}
        {sceneTag==="pm" && <PMIcon/>}
        {sceneTag==="ds" && <DSIcon/>}
        {sceneTag==="fe" && <FEIcon/>}
        {sceneTag==="hr" && <HRIcon/>}
        {sceneTag==="accuse" && <TargetIcon/>}
        {sceneTag==="summary" && <NoteIcon/>}
      </svg>
      {!compact && <div style={{position:"absolute",bottom:8,left:0,right:0,textAlign:"center",fontWeight:800}}>{char.name}</div>}
      {highlightMouth && <div style={{position:"absolute", bottom: compact? 38 : 56, left:"50%", transform:"translateX(-50%)", width: compact? 30 : 42, height: compact? 8 : 12, background:"#49ff6a", opacity:0.9, borderRadius:8, boxShadow:"0 0 8px rgba(73,255,106,0.6)"}} />}
    </div>
  );
}

// 아이콘들
function PMIcon(){ return <g opacity="0.9"><rect x="30" y="24" width="28" height="18" fill="#60a5fa"/><rect x="34" y="28" width="20" height="10" fill="#0b1220"/></g>; }
function DSIcon(){ return <g opacity="0.9"><path d="M24,120 L60,88 L96,120" fill="none" stroke="#34d399" strokeWidth="4"/><circle cx="60" cy="88" r="3" fill="#34d399"/></g>; }
function FEIcon(){ return <g opacity="0.9"><rect x="150" y="24" width="36" height="24" rx="3" fill="#f59e0b"/><rect x="154" y="28" width="28" height="16" fill="#0b1220"/></g>; }
function HRIcon(){ return <g opacity="0.9"><rect x="100" y="24" width="40" height="18" rx="3" fill="#f472b6"/><circle cx="120" cy="33" r="4" fill="#0b1220"/></g>; }
function TargetIcon(){ return <g opacity="0.9"><circle cx="200" cy="170" r="16" fill="none" stroke="#ef4444" strokeWidth="3"/><circle cx="200" cy="170" r="8" fill="#ef4444"/></g>; }
function NoteIcon(){ return <g opacity="0.9"><rect x="12" y="160" width="32" height="20" fill="#93c5fd"/><line x1="16" y1="166" x2="40" y2="166" stroke="#0b1220" strokeWidth="2"/></g>; }

function DialogBox({speaker, q, a}){
  return (
    <div style={styles.dialogBox}>
      {q && <div style={{marginBottom:6}}><b>나</b><span style={{opacity:0.9}}>: {q}</span></div>}
      <div style={{fontWeight:800,marginBottom:4}}>{speaker}</div>
      <div style={{opacity:0.95,lineHeight:1.6}}>{a}</div>
    </div>
  );
}

function ChoiceBar({choices}){ return <div style={styles.choiceBar}>{choices.map((ch,idx)=> <button key={idx} style={styles.btnChoice} onClick={ch.onClick}>{"▶ "}{ch.label}</button>)}</div>; }

function HeroIllust(){
  return (
    <svg viewBox="0 0 600 360" style={{ width: "min(92vw, 820px)", maxWidth: 900, height: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(180deg,#070a13,#0a0f1f)" }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f172a"/><stop offset="100%" stopColor="#0b1320"/></linearGradient>
        <pattern id="scales" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0,10 Q5,0 10,10" fill="none" stroke="#3fa66b" strokeWidth="1"/></pattern>
      </defs>
      <rect x="0" y="0" width="600" height="360" fill="url(#g1)" />
      <g transform="translate(300,180)">
        <ellipse cx="0" cy="0" rx="120" ry="140" fill="#e5e7eb" stroke="#0c1220" strokeWidth="4" />
        <line x1="0" y1="-140" x2="0" y2="140" stroke="#0c1220" strokeWidth="4" />
        <clipPath id="rightHalf"><rect x="0" y="-160" width="160" height="320"/></clipPath>
        <g clipPath="url(#rightHalf)"><ellipse cx="0" cy="0" rx="120" ry="140" fill="#0f3b33" /><ellipse cx="50" cy="-10" rx="26" ry="18" fill="#d6b410" stroke="#0b1220" strokeWidth="4" /><circle cx="58" cy="-10" r="6" fill="#0b1220" /><rect x="-120" y="-140" width="240" height="280" fill="url(#scales)" opacity="0.4" /></g>
        <clipPath id="leftHalf"><rect x="-160" y="-160" width="160" height="320"/></clipPath>
        <g clipPath="url(#leftHalf)"><ellipse cx="0" cy="0" rx="120" ry="140" fill="#cbd5e1" /><ellipse cx="-50" cy="-12" rx="22" ry="14" fill="#1e293b" /><circle cx="-52" cy="-12" r="5" fill="#93c5fd" /></g>
        <path d="M-30,50 Q0,70 30,50" stroke="#0b1220" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
      <text x="300" y="330" textAnchor="middle" fill="#dee2e6" style={{fontFamily:"ui-sans-serif",fontSize:18,fontWeight:800}}>반은 인간, 반은 랩틸리언</text>
    </svg>
  );
}

/* ======================= 유틸 ======================= */
function getChar(list,id){ return list.find(c=>c.id===id) || null; }
function computeLeaders(st){
  const scope = st.finalists? new Set(st.finalists) : null;
  let max = -Infinity; let leaders=[];
  st.chars.forEach(c=>{ if (scope && !scope.has(c.id)) return; if (c.susp>max){ max=c.susp; leaders=[c.id]; } else if (c.susp===max){ leaders.push(c.id); } });
  return { max, leaders };
}

/* ======================= 스타일 ======================= */
const styles = {
  sceneHeader:{ position:"fixed", top:12, left:12, right:12, textAlign:"left", padding:"10px 12px", borderRadius:12, background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.12)", color:"#e5e7eb", fontWeight:900, letterSpacing:0.2, zIndex:0 },

  vnRoot:{ minHeight:"100vh", background:"rgba(0,0,0,0.35)", backdropFilter:"blur(1px)", color:"#e5e7eb", fontFamily:"ui-sans-serif,system-ui", display:"grid", gridTemplateRows:"1fr auto auto", gap:12, padding:16, boxSizing:"border-box" },
  hud:{ position:"fixed", top:12, right:12, display:"flex", gap:8, alignItems:"center", background:"rgba(0,0,0,0.55)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"6px 10px", zIndex:1 },
  btnMini:{ padding:"6px 8px", background:"#0ea5e9", color:"#0b1020", border:"none", borderRadius:8, fontWeight:800, cursor:"pointer" },
  pairWrap:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, alignItems:"center", justifyItems:"center" },
  dialogBox:{ background:"rgba(2,6,23,0.8)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, padding:"12px 14px" },
  choiceBar:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },
  btnChoice:{ padding:"12px", background:"#131c2b", color:"#e5e7eb", border:"1px solid rgba(255,255,255,0.2)", borderRadius:12, textAlign:"left", fontWeight:800, cursor:"pointer" },
  titleRoot:{ minHeight:"100vh", display:"grid", placeItems:"center", padding:16, boxSizing:"border-box", background:"radial-gradient(900px 400px at 50% 0%, #0a0e1a, #070a13)", color:"#e5e7eb" },
  titleBox:{ textAlign:"center", marginTop:16 },
  btnPrimary:{ padding:"10px 14px", background:"#10b981", color:"#0b1020", border:"none", borderRadius:10, fontWeight:800, cursor:"pointer", marginTop:12 },
  summaryRoot:{ minHeight:"100vh", display:"grid", placeItems:"center", background:"linear-gradient(180deg,#070b14,#0a0f1c)", color:"#e5e7eb", padding:16 },
  summaryBox:{ width:"min(920px,92vw)", background:"rgba(2,6,23,0.8)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:16 },
  card:{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:12 },
  accRoot:{ minHeight:"100vh", display:"grid", placeItems:"center", background:"linear-gradient(180deg,#070b14,#0a0f1c)", color:"#e5e7eb", padding:16 },
  accBox:{ width:"min(920px,92vw)", background:"rgba(2,6,23,0.8)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:16 },
  btnAccuse:{ padding:12, background:"#0b1320", color:"#e5e7eb", border:"1px solid rgba(255,255,255,0.25)", borderRadius:12, textAlign:"left", cursor:"pointer" },
  endRoot:{ minHeight:"100vh", display:"grid", placeItems:"center", background:"linear-gradient(180deg,#070b14,#0a0f1c)", color:"#e5e7eb", padding:16 },
  endBox:{ width:"min(720px,92vw)", background:"rgba(2,6,23,0.8)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:16 },
  title:{ margin:0, fontSize:20, fontWeight:900, marginBottom:10 },
  endDesc:{ opacity:0.95, lineHeight:1.6, marginBottom:8 }
};

let hasRendered = false;
function renderApp(){
  if (hasRendered) return;
  const rootEl = document.getElementById("root");
  if (!rootEl) return;
  hasRendered = true;
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", renderApp, { once:true });
} else {
  renderApp();
}
