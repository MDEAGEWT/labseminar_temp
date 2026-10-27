/* 발표 모드와 동영상 지원.
 *
 * 발표: F 키 또는 오른쪽 아래 버튼으로 전체 화면. 슬라이드 하나를 화면 크기에
 * 맞춰 확대하고 나머지는 감춘다. 방향키와 스페이스로 넘기고 Esc 로 빠져나온다.
 * 동영상: 슬라이드가 바뀌면 이전 슬라이드의 재생을 멈추고, data-autoplay 가
 * 붙은 동영상은 현재 슬라이드로 들어올 때 처음부터 재생한다.
 *
 * 인쇄에는 아무 영향이 없다. 버튼은 숨고, 동영상은 poster 프레임으로 찍힌다.
 *
 * 동영상 슬라이드 작성법 - figure.fig 안에서 img 자리에 video 를 넣는다.
 * poster 는 인쇄에 찍히는 정지 화면이므로 반드시 지정한다.
 *
 *   <figure class="fig"><span class="frame">
 *     <video src="imgs/flight.mp4" poster="imgs/flight_poster.jpg"
 *            controls playsinline></video>
 *   </span></figure>
 *
 * 기본값 - 속성을 적지 않아도 이렇게 동작한다.
 *   무음     모든 동영상을 음소거로 강제한다. 파일 자체도 -an 으로 음성 트랙을
 *            빼서 굽는 것을 원칙으로 한다. 발표장에서 소리가 터지지 않게 한다
 *   자동 재생  그 슬라이드로 들어오면 처음부터 재생하고, 벗어나면 멈춘다
 *
 * 기본값을 끄는 속성 - 필요한 경우에만 적는다.
 *   data-noautoplay  자동 재생을 끈다. 발표자가 직접 눌러 재생
 *   data-sound       음소거를 푼다. 소리가 내용의 일부일 때만 쓴다
 *   loop             끝나면 처음부터 다시 튼다. HTML 기본 속성이라 따로 처리하지 않는다
 *
 *   poster 만들기  ffmpeg -i flight.mp4 -vframes 1 flight_poster.jpg
 *
 * 발표자 노트 - 슬라이드 맨 끝에 aside.notes 를 둔다. 화면과 인쇄에는 찍히지 않고
 * N 키로 여는 발표자 창에만 뜬다. 발표자 창에는 현재 장, 다음 장, 노트, 경과 시간이
 * 나오고, 그 창에서 누른 키도 덱을 넘긴다. 경과 시간은 눌러서 0 으로 돌린다.
 *
 *   <section class="slide"> ... <footer class="foot">...</footer>
 *     <aside class="notes"><p>발표에서 말할 내용</p></aside>
 *   </section>
 *
 * 질문 대비 - 덱에 aside.qa(슬라이드 밖, hidden)가 있으면 발표자 창에 "질문 대비" 버튼이
 * 생기고, 누르거나 Q 키를 누르면 따로 창이 열린다. 찾기 칸으로 거르고(/ 키로 찾기 칸, Esc 로 빠져나옴),
 * 찾기 칸 밖에서 누른 넘김 키는 덱을 넘긴다. 장이 바뀌면 그 장의 메모 묶음에 표시가 옮겨 간다.
 * 안의 묶음은 div.qa-group(h3 + div.qa-item 들), data-n 은 장 번호.
 * 묶음에 class="stuck" 이 있으면 질문 대비 창에 "영어가 막힐 때" 버튼이 생기고, 누르면 그 문장들만 크게 덮어 보인다.
 *
 * 단계 등장 - 슬라이드 안 요소에 data-build="1", "2" ... 를 붙이면 발표 중 그 순서로 나타난다.
 * 넘김(방향키, 스페이스, 클릭)은 남은 단계가 있으면 다음 단계를, 없으면 다음 장을 연다.
 * 뒤로 가면 단계를 하나씩 거두고, 앞 장으로 돌아가면 그 장은 다 보인 채로 연다.
 * 발표 모드가 아닐 때와 인쇄(PDF)에는 모두 보인다. 발표자 창 번호 옆에 단계가 뜬다(예 · 2/5).
 * data-only 를 함께 붙이면 그 단계에서만 보인다(장면 바꾸기, 0 단계도 된다). 그런 장면은 발표 모드에서만
 * 쓰고, 발표 모드가 아닐 때와 인쇄에는 data-static 을 붙인 정지 그림이 대신 보인다.
 *
 * 대본 넘겨 보기 - 발표자 창은 기본으로 발표 화면을 따라간다. 발표자 창 위쪽 ◀ ▶ 버튼이나 [ ] 키로
 * 다른 장의 대본을 미리 볼 수 있고(발표 화면은 그대로), [발표 화면] 버튼이나 C 키로 바로 돌아온다.
 * 발표 화면을 넘기면(방향키, 클릭) 미리 보기는 저절로 풀린다.
 *
 * 글자 크기 - 발표자 창과 질문 대비 창 위쪽의 가−/가+ 버튼, 또는 그 창에서 - / + 키.
 * 창마다 따로 기억한다(이 브라우저의 localStorage). 노트 안 글자는 em 으로 적어 함께 커진다.
 *
 * 장별 목표 시간 - aside.notes 에 data-target="40"(초)을 적으면 발표자 창 위쪽에
 * "이 장 0:12 / 0:40 · 누적 목표 3:20" 이 뜨고, 목표를 넘기면 주황색으로 바뀐다. 발표를 시작할 때
 * [시간 리셋] 버튼(또는 경과 시간 누르기)으로 전체 시간과 이 장 시간을 함께 0 으로 돌린다.
 *
 *   <aside class="notes" data-target="40"> ... </aside>
 *
 * 단계 대본 - 단계 등장(data-build)이 있는 장은 노트 문단에 data-step="0", "1" ... 을 붙이면
 * 발표자 창이 지금 단계 문단을 표시하고 그 위치로 스크롤한다(지난 단계는 흐리게). data-step 이 없으면
 * ▶ 로 시작하는 문단마다 단계를 하나씩 올려 붙인다. style 이 달린 ▶ 문단(번역 등)은 바로 앞 단계에 묶인다.
 * 장이 바뀌면 대본은 언제나 맨 위부터 보인다.
 *
 *   <p>처음 화면에서 할 말</p>
 *   <p>▶ 첫 클릭 뒤에 할 말</p>
 *
 * 읽기 도움 - 노트 안 <span class="pr" data-pr="시뮬레이터 · SIM-u-la-tor">simulator</span> 는 점선
 * 밑줄이 생기고 마우스를 올리면 읽는 법이 뜬다. <span class="rd"> (zero point eight six)</span> 는 숫자
 * 뒤에 작게 붙는 읽는 법이다. 질문 대비 창의 답에서도 .rd 를 쓸 수 있다.
 *
 * 미리보기 숨기기 - 발표자 창의 [미리보기] 버튼이나 V 키로 장 미리보기 두 개를 숨기고 노트만 크게 본다.
 *
 * 창 위치 - N, Q 창은 Window Management API 로 메인 디스플레이에 열려고 한다. 덱에서 처음 클릭하거나
 * 키를 누를 때 '창 관리' 권한을 묻는다. 거부하거나, 지원하지 않거나, 브라우저가 화면 사이 이동을 막으면
 * (로컬 파일이나 배율이 다른 화면에서 막히는 경우가 있다) 덱 창과 같은 화면에 연다. 확실한 방법은 덱 창을
 * 노트북 화면에 둔 채 N, Q 를 먼저 열고, 덱 창을 프로젝터로 옮겨 F 를 누르는 것이다.
 * 주소 끝에 ?debug-screen 을 붙이면 화면·권한·창 위치 진단이 콘솔에 찍힌다.
 *
 * SVG 애니메이션 - 장 안의 SVG(animate, animateMotion ...)는 그 장에 들어올 때마다 처음부터 다시 돈다.
 * 숨겨져 있던 장의 SMIL 은 첫 반복이 멈춘 채 남아 한동안 가만히 있기 때문이다.
 *
 * 자동 넘김 - 장 안의 스크립트가 document 에 presentationadvance 이벤트(detail: {slide, step})를
 * 보내면, 그 장과 단계가 지금과 같을 때 한 번 넘긴다(애니메이션이 끝나면 다음 장으로 갈 때 쓴다).
 *
 * 조작 - F 시작, Esc 종료, 방향키/스페이스 이동, Home/End 처음과 끝, B 화면 끄기,
 * N 발표자 창, Q 질문 대비 창. 발표자 창은 F 보다 먼저 연다. 전체 화면 중에 새 창을 열면 브라우저가
 * 전체 화면을 푼다. 발표자 창과 질문 대비 창에서 누른 넘김 키도 덱을 넘긴다.
 * 슬라이드를 누르면 다음 장으로 넘어가고, 동영상 재생 막대는 눌러도 넘어가지 않는다.
 */
(function () {
  'use strict';

  var STAGE_W = 1920;
  var STAGE_H = 1080;

  var CSS = [
    '.present-btn {',
    '  position: fixed; right: 24px; bottom: 24px; z-index: 20;',
    '  font-family: "Atkinson Hyperlegible", "Noto Sans KR", system-ui, sans-serif;',
    '  font-size: 20px; font-weight: 700;',
    '  color: #1d4ed8; background: #ffffff; border: 2px solid #93c5fd;',
    '  border-radius: 999px; padding: 10px 22px; cursor: pointer;',
    '  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12); opacity: 0.5;',
    '}',
    '.present-btn:hover { opacity: 1; }',
    /* 한 장만 화면 크기에 맞춰 띄우고 나머지는 치운다. */
    'body.presenting { background: #000; overflow: hidden; }',
    'body.presenting .present-btn { display: none; }',
    'body.presenting .slide { display: none; }',
    'body.presenting .slide [data-build] { opacity: 0; transition: opacity 0.35s ease; }',
    'body.presenting .slide [data-build].built { opacity: 1; }',
    '.slide [data-only] { display: none; }',
    'body.presenting .slide [data-only].built { display: inline; }',
    'body.presenting .slide [data-static] { display: none; }',
    'body.presenting .slide.current {',
    '  display: flex; position: fixed; left: 50%; top: 50%;',
    '  transform: translate(-50%, -50%) scale(var(--present-scale, 1));',
    '  transform-origin: center center; box-shadow: none;',
    '}',
    /* 동영상은 그림과 같은 상자 규칙을 쓴다. deck.css 의 `figure.fig img` 가
       타입+클래스(0,1,1) 이므로 여기도 같은 형태로 맞춘다. */
    'figure.fig video {',
    '  display: block; width: 100%; height: 100%;',
    '  max-height: 100%; object-fit: contain; background: transparent;',
    '}',
    '.body[data-layout] .body-media video {',
    '  width: 100%; height: 100%; max-width: 100%; max-height: 100%;',
    '  object-fit: contain;',
    '}',
    '.body[data-layout="right"] > .body-media video,',
    '.body[data-layout="left"] > .body-media video { object-position: center top; }',
    '@media print {',
    '  .present-btn { display: none !important; }',
    '  video::-webkit-media-controls, video::-webkit-media-controls-enclosure {',
    '    display: none !important; opacity: 0 !important;',
    '  }',
    '  body.presenting { background: #fff; overflow: visible; }',
    '  body.presenting .slide {',
    '    display: flex !important; position: static !important; transform: none !important;',
    '  }',
    '}'
  ].join('\n');

  function injectCss() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var slides = [];
  var at = 0;

  function interactive(el) {
    if (!el || !el.closest) return false;      // document / window targets
    return !!(el.isContentEditable || el.closest('button, a, video, audio, input, pre'));
  }

  function fit() {
    if (!document.body.classList.contains('presenting')) return;
    var s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    document.body.style.setProperty('--present-scale', s);
  }

  /* 동영상은 무음 자동 재생이 기본이다. 슬라이드를 벗어나면 멈추고, 들어오면
     처음부터 튼다. data-noautoplay 는 자동 재생을, data-sound 는 음소거를 끈다. */
  function muteAll() {
    [].forEach.call(document.querySelectorAll('video'), function (v) {
      if (!v.hasAttribute('data-sound')) { v.muted = true; v.defaultMuted = true; }
    });
  }

  function syncVideos(slide) {
    [].forEach.call(document.querySelectorAll('video'), function (v) {
      if (slide && slide.contains(v)) return;
      if (!v.paused) v.pause();
    });
    if (!slide) return;
    [].forEach.call(slide.querySelectorAll('video'), function (v) {
      if (v.hasAttribute('data-noautoplay')) return;
      if (!v.hasAttribute('data-sound')) v.muted = true;   // 무음이라야 브라우저가 허용
      v.currentTime = 0;
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* 차단되면 발표자가 직접 재생 */ });
    });
  }

  var step = 0;

  function steps(slide) {
    var n = 0;
    [].forEach.call(slide.querySelectorAll('[data-build]'), function (el) {
      n = Math.max(n, parseInt(el.getAttribute('data-build'), 10) || 0);
    });
    return n;
  }

  function setStep(k) {
    step = k;
    [].forEach.call(slides[at].querySelectorAll('[data-build]'), function (el) {
      var n = parseInt(el.getAttribute('data-build'), 10) || 0;
      el.classList.toggle('built', el.hasAttribute('data-only') ? n === step : n <= step);
    });
    document.dispatchEvent(new CustomEvent('presentationstep', {detail: {slide: slides[at], step: step}}));
    restartSvg(slides[at]);
  }

  // SVG(SMIL) 애니메이션은 숨겨진 동안 첫 반복이 멈춘 채로 남아, 장에 들어와도 다음 반복까지 가만히 있다.
  // 장에 들어올 때마다 그 장의 SVG 시계를 0 으로 돌려 바로 움직이게 한다
  var svgAt = -1;
  function restartSvg(slide) {
    if (at === svgAt) return;
    svgAt = at;
    [].forEach.call(slide.querySelectorAll('svg'), function (svg) {
      if (svg.setCurrentTime && svg.querySelector('animate, animateMotion, animateTransform, set')) {
        try { svg.setCurrentTime(0); } catch (e) {}
      }
    });
  }

  // all: 단계를 다 보인 채로 연다 (뒤로 돌아올 때)
  function show(i, all) {
    if (!slides.length) return;
    at = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (sl, n) { sl.classList.toggle('current', n === at); });
    setStep(all ? steps(slides[at]) : 0);
    peek = null;
    syncVideos(slides[at]);
    drawNotes();
    markNow();
  }

  function next() {
    if (step < steps(slides[at])) { setStep(step + 1); peek = null; drawNotes(); }
    else if (at < slides.length - 1) show(at + 1);
  }

  function prev() {
    if (step > 0) { setStep(step - 1); peek = null; drawNotes(); }
    else if (at > 0) show(at - 1, true);
  }

  /* 발표자 창. 같은 출처의 빈 창이라 덱 창이 직접 그려 넣고, 그 창의 키 입력도
     덱 창의 onKey 가 받는다. 덱의 스타일을 그대로 옮겨 와 슬라이드를 축소해 보여 준다. */
  var notesWin = null;

  var NOTES_CSS = [
    'body.nv {',
    '  margin: 0; padding: 16px 24px; box-sizing: border-box; height: 100vh; overflow: hidden;',
    '  display: grid; grid-template-rows: auto auto 1fr; grid-template-columns: minmax(0, 1fr); gap: 16px;',
    '  background: #0f172a; color: #e2e8f0;',
    '  font-family: "Atkinson Hyperlegible", "Noto Sans KR", system-ui, sans-serif;',
    '}',
    '.nv-bar { display: flex; justify-content: space-between; font-size: 28px; font-weight: 700; }',
    '.nv-time { font: inherit; color: inherit; background: none; border: 0; padding: 0;',
    '  cursor: pointer; font-variant-numeric: tabular-nums; }',
    '.nv-reset { font: inherit; font-size: 18px; font-weight: 700; color: #0f172a; background: #fbbf24; border: 0;',
    '  border-radius: 8px; padding: 2px 10px; margin-left: 8px; cursor: pointer; vertical-align: middle; }',
    '.nv-lap { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; color: #38bdf8; }',
    '.nv-lap.over { color: #fb923c; }',
    '.nv-slides { display: flex; gap: 24px; align-items: flex-start; }',
    '.nv-now, .nv-next { position: relative; overflow: hidden; border-radius: 8px; }',
    '.nv-now { width: 576px; height: 324px; }',
    '.nv-next { width: 384px; height: 216px; opacity: 0.75; }',
    '.nv-slides deck-stage { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px;',
    '  transform-origin: 0 0; }',
    '.nv-now deck-stage { transform: scale(0.3); }',
    '.nv-next deck-stage { transform: scale(0.2); }',
    '.nv-text { overflow: auto; font-size: calc(32px * var(--fs, 1)); line-height: 1.6; }',
    '.nv-right { display: flex; gap: 14px; align-items: center; }',
    '.nv-nav { display: flex; gap: 8px; align-items: center; }',
    '.nv-peek, .nv-live { font: inherit; font-size: 20px; color: #e2e8f0; background: #1e293b;',
    '  border: 1px solid #334155; border-radius: 8px; padding: 2px 12px; cursor: pointer; }',
    '.nv.peeking .nv-live { background: #f59e0b; border-color: #f59e0b; color: #0f172a; }',
    '.nv.peeking .nv-num { color: #f59e0b; }',
    '.nv.peeking .nv-text::before { content: "미리 보기 중 · C 키 또는 [발표 화면] 버튼으로 돌아갑니다";',
    '  display: block; margin-bottom: 10px; font-size: 20px; color: #f59e0b; }',
    '.fs-btn { font: inherit; font-size: 20px; color: #e2e8f0; background: #1e293b; border: 1px solid #334155;',
    '  border-radius: 8px; padding: 2px 12px; cursor: pointer; }',
    '.nv-text p { margin: 0 0 0.8em; }',
    '.nv-text [data-step] { transition: opacity 0.2s; }',
    '.nv-text .rd { font-size: 0.6em; color: #94a3b8; font-weight: 400; }',
    '.nv-text .pr { position: relative; border-bottom: 2px dotted #64748b; cursor: help; }',
    '.nv-text .pr:hover::after { content: attr(data-pr); position: absolute; left: 0; top: 100%; z-index: 5;',
    '  white-space: nowrap; font-size: 22px; font-weight: 700; line-height: 1.4; padding: 4px 10px;',
    '  background: #f8fafc; color: #0f172a; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.4); }',
    '.nv-text.stepped [data-step].done { opacity: 0.45; }',
    '.nv-text.stepped [data-step].cur { border-left: 4px solid #38bdf8; padding-left: 12px; margin-left: -16px; }',
    '.nv-prev { font: inherit; font-size: 20px; color: #e2e8f0; background: #1e293b; border: 1px solid #334155;',
    '  border-radius: 8px; padding: 2px 12px; cursor: pointer; }',
    'body.nv.noprev { grid-template-rows: auto 1fr; }',
    'body.nv.noprev .nv-slides { display: none; }',
    'body.nv.noprev .nv-prev { background: #f59e0b; border-color: #f59e0b; color: #0f172a; }',
    '.nv-text.empty::before { content: "노트 없음"; color: #64748b; }',
    '.nv-qa { font: inherit; font-size: 22px; color: #0f172a; background: #38bdf8; border: 0;',
    '  border-radius: 999px; padding: 4px 18px; cursor: pointer; }'
  ].join('\n');

  /* 질문 대비 창. 발표자 창과 같은 방식으로 덱 창이 그려 넣는다. 덱을 넘기는 키는 받지 않는다. */
  var qaWin = null;

  var QA_CSS = [
    'body.qa-win { margin: 0; padding: 0 28px 28px; background: #0f172a; color: #e2e8f0;',
    '  font-family: "Atkinson Hyperlegible", "Noto Sans KR", system-ui, sans-serif;',
    '  font-size: calc(24px * var(--fs, 1)); line-height: 1.55; }',
    '.fs-btn { font: inherit; font-size: 20px; color: #e2e8f0; background: #1e293b; border: 1px solid #334155;',
    '  border-radius: 10px; padding: 0 12px; cursor: pointer; }',
    '.qa-bar { position: sticky; top: 0; display: flex; gap: 12px; padding: 18px 0 14px; background: #0f172a; }',
    '.qa-find { flex: 1; font: inherit; font-size: 24px; padding: 8px 14px; border-radius: 10px; border: 1px solid #334155;',
    '  background: #1e293b; color: #e2e8f0; }',
    '.qa-now { font: inherit; font-size: 20px; color: #0f172a; background: #38bdf8; border: 0; border-radius: 10px;',
    '  padding: 0 16px; cursor: pointer; }',
    '.qa-group { margin: 18px 0 0; padding: 4px 0 0; border-top: 1px solid #1e293b; }',
    '.qa-group.now { border-top: 3px solid #38bdf8; }',
    '.qa-group h3 { margin: 10px 0 8px; font-size: 0.92em; color: #38bdf8; }',
    '.qa-item { margin: 0 0 14px; }',
    '.qa-item p { margin: 0 0 4px; }',
    '.qa-item .q { font-weight: 700; color: #f8fafc; }',
    '.qa-item .a { color: #cbd5e1; }',
    '.qa-item .rd { font-size: 0.75em; color: #94a3b8; font-weight: 400; }',
    '.qa-item strong { color: #fde047; font-weight: 700; }',
    '.qa-item .m { font-size: 0.88em; color: #94a3b8; }'
  ].join('\n');

  /* 영어가 막힐 때. 질문 대비 창의 버튼이 qa-group.stuck 의 문장만 크게 덮어 보여 주고, 덮개를 누르면 닫는다 */
  var STUCK_CSS = [
    '.stuck-btn { font: inherit; font-size: 20px; color: #0f172a; background: #fde047; border: 0;',
    '  border-radius: 999px; padding: 4px 18px; cursor: pointer; }',
    '.stuck-pane { position: fixed; inset: 0; z-index: 10; overflow: auto; padding: 24px 36px; background: #0f172a;',
    '  color: #e2e8f0; font-family: "Atkinson Hyperlegible", "Noto Sans KR", system-ui, sans-serif; cursor: pointer; }',
    '.stuck-pane[hidden] { display: none; }',
    '.stuck-pane h3 { margin: 0 0 18px; font-size: 20px; font-weight: 400; color: #94a3b8; }',
    '.stuck-pane .k { margin: 0; font-size: calc(20px * var(--fs, 1)); color: #38bdf8; }',
    '.stuck-pane .e { margin: 2px 0 22px; font-size: calc(34px * var(--fs, 1)); line-height: 1.35; }',
    '.stuck-pane strong { color: #fde047; }'
  ].join('\n');
  var STUCK_BTN = '<button class="stuck-btn" type="button">영어가 막힐 때</button>';

  function stuck(w) {
    var g = document.querySelector('aside.qa .qa-group.stuck'), btn = w.document.querySelector('.stuck-btn');
    if (!btn) return;
    if (!g) { btn.remove(); return; }
    var pane = w.document.createElement('div');
    pane.className = 'stuck-pane';
    pane.hidden = true;
    pane.innerHTML = '<h3>영어가 막힐 때 · 아무 데나 누르면 닫힘</h3>' + [].map.call(g.querySelectorAll('.qa-item'), function (it) {
      var q = it.querySelector('.q'), a = it.querySelector('.a');     // 상황, 말할 문장
      return '<p class="k">' + (q ? q.innerHTML : '') + '</p><p class="e">' + (a ? a.innerHTML : '') + '</p>';
    }).join('');
    w.document.body.appendChild(pane);
    btn.onclick = function () { pane.hidden = false; btn.blur(); };
    pane.onclick = function () { pane.hidden = true; };
  }

  /* 글자 크기. 창마다 배율 하나를 body 의 --fs 로 둔다 */
  function loadFs(key) {
    try { var v = parseFloat(localStorage.getItem(key)); return v >= 0.5 && v <= 2.5 ? v : 1; } catch (e) { return 1; }
  }

  function sizer(w, key) {
    var b = w.document.body, fs = loadFs(key);
    function set(v) {
      fs = Math.round(Math.max(0.5, Math.min(2.5, v)) * 10) / 10;
      b.style.setProperty('--fs', fs);
      try { localStorage.setItem(key, fs); } catch (e) { /* 저장 못 해도 이번 창에는 적용 */ }
    }
    set(fs);
    [].forEach.call(w.document.querySelectorAll('.fs-btn'), function (btn) {
      btn.onclick = function () { set(fs + 0.1 * Number(btn.getAttribute('data-d'))); btn.blur(); };
    });
    w.document.addEventListener('keydown', function (ev) {
      if (ev.target && ev.target.tagName === 'INPUT') return;           // 찾기 칸에 치는 - 는 그대로
      if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); set(fs + 0.1); }
      else if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); set(fs - 0.1); }
    });
  }

  var FS_BTNS = '<button class="fs-btn" type="button" data-d="-1" title="- 키">가−</button>' +
                '<button class="fs-btn" type="button" data-d="1" title="+ 키">가+</button>';

  function curNum() {
    var f = slides[at] && slides[at].querySelector('.folio');
    return f ? f.textContent.trim() : '';
  }

  // from: 키나 버튼을 받은 창. 팝업 허용은 사용자가 누른 그 창을 기준으로 하므로 그 창에서 연다
  // 발표자 창(N)과 질문 대비 창(Q)은 메인 디스플레이에 연다. Window Management API 를 쓰므로
  // 처음 한 번 '창 관리' 권한을 묻는다. 거부하거나 지원하지 않으면 브라우저가 정한 위치에 연다.
  var mainScreen = null;
  // 진단 로그: 주소 끝에 ?debug-screen 을 붙여 열면 덱 창 콘솔(F12)에 [deck-screen] 으로 찍힌다
  var SCREEN_DEBUG = /[?&]debug-screen(?:[=&]|$)/.test(location.search);
  function slog() {
    if (!SCREEN_DEBUG) return;
    try { console.log.apply(console, ['[deck-screen]'].concat([].slice.call(arguments))); } catch (e) {}
  }
  function srect(s) {
    return s ? (s.label || '?') + ' primary=' + s.isPrimary + ' internal=' + s.isInternal +
      ' avail=' + s.availLeft + ',' + s.availTop + ' ' + s.availWidth + 'x' + s.availHeight +
      ' left/top=' + s.left + ',' + s.top : 'null';
  }
  function findMain() {
    if (mainScreen) return Promise.resolve(mainScreen);
    if (!window.getScreenDetails) { slog('getScreenDetails 없음 (브라우저 미지원 또는 보안 컨텍스트 아님)'); return Promise.resolve(null); }
    try {
      if (navigator.permissions) navigator.permissions.query({name: 'window-management'})
        .then(function (r) { slog('권한 상태 =', r.state); }, function (e) { slog('권한 조회 실패', e && e.message); });
      return window.getScreenDetails().then(function (d) {
        slog('화면', d.screens.length + '개, 덱 창 화면 = ' + srect(d.currentScreen));
        d.screens.forEach(function (s, i) { slog('  #' + i, srect(s)); });
        mainScreen = d.screens.filter(function (s) { return s.isPrimary; })[0] || null;
        slog('메인으로 고른 화면 =', srect(mainScreen));
        return mainScreen;
      }).catch(function (e) { slog('getScreenDetails 거부/실패:', e && (e.name + ' ' + e.message)); return null; });
    } catch (e) { slog('getScreenDetails 예외:', e && e.message); return Promise.resolve(null); }  // 동기 예외도 창 열기를 막지 않게
  }
  // 메인 화면이 작으면(노트북) 창을 화면 안에 들어가게 줄인다. 다 안 들어가는 창은 브라우저가 화면 이동을 막는다
  function fitMain(s, width, height) {
    return {w: Math.min(width, s.availWidth - 40), h: Math.min(height, s.availHeight - 140)};
  }
  function onMainAt(s, width, height) {
    var f = fitMain(s, width, height);
    return {x: Math.round(s.availLeft + Math.max(0, (s.availWidth - f.w) / 2)),
            y: Math.round(s.availTop + Math.max(0, (s.availHeight - f.h - 100) / 2)), w: f.w, h: f.h};
  }
  function winFeatures(width, height) {
    var f = 'width=' + width + ',height=' + height;
    if (mainScreen) { var p = onMainAt(mainScreen, width, height); f = 'width=' + p.w + ',height=' + p.h + ',left=' + p.x + ',top=' + p.y; }
    slog('window.open features =', f, '| 덱 창 screenX/Y =', window.screenX + ',' + window.screenY);
    return f;
  }
  // 권한 질문은 사용자 입력(클릭·키) 안에서만 뜬다. window.open 이 그 입력을 써 버리므로
  // 덱에서 처음 클릭하거나 키를 누를 때 미리 묻는다 (아직 정해지지 않았을 때만)
  function askEarly() {
    document.removeEventListener('pointerdown', askEarly, true);
    document.removeEventListener('keydown', askEarly, true);
    findMain();
  }
  document.addEventListener('pointerdown', askEarly, true);
  document.addEventListener('keydown', askEarly, true);
  function moveToMain(w, width, height) {
    if (w) setTimeout(function () { try { slog('열린 직후 창 위치 =', w.screenX + ',' + w.screenY); } catch (e) {} }, 0);
    findMain().then(function (s) {
      if (!s || !w || w.closed) { slog('moveTo 생략 (메인 화면 정보 없음)'); return; }
      var p = onMainAt(s, width, height);
      try { w.resizeTo(p.w, p.h + 80); w.moveTo(p.x, p.y); slog('resizeTo/moveTo 요청 =', p.w + 'x' + (p.h + 80) + ' @ ' + p.x + ',' + p.y); }
      catch (e) { slog('moveTo 예외:', e && e.message); }
      setTimeout(function () {
        try {
          slog('moveTo 뒤 창 위치 =', w.screenX + ',' + w.screenY, '크기 =', w.outerWidth + 'x' + w.outerHeight);
          if (Math.abs(w.screenX - p.x) > 50) { w.moveTo(p.x, p.y); slog('다시 moveTo'); }
        } catch (e) {}
      }, 500);
    });
  }

  function openQA(from) {
    var src = document.querySelector('aside.qa');
    if (!src) return;
    if (qaWin && !qaWin.closed) { qaWin.focus(); markNow(); return; }
    findMain();                                       // 창을 열기 전에 (입력 활성 상태에서) 권한 요청
    var w = (from && !from.closed ? from : window).open('', 'deck-qa', winFeatures(1100, 900));
    if (!w) return;                                   // 팝업 차단
    moveToMain(w, 1100, 900);
    w.document.open();
    w.document.write('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">' +
      '<title>질문 대비</title><style>' + QA_CSS + '\n' + STUCK_CSS + '</style></head><body class="qa-win">' +
      '<div class="qa-bar"><input class="qa-find" type="search" placeholder="찾기 (예: 튐, 속도, 요, 플랩)">' +
      '<button class="qa-now" type="button">지금 장 메모</button>' + STUCK_BTN + FS_BTNS + '</div>' +
      '<div class="qa-list">' + src.innerHTML + '</div></body></html>');
    w.document.close();
    var d = w.document, find = d.querySelector('.qa-find');
    sizer(w, 'deck-qa-fs');
    stuck(w);
    find.oninput = function () {
      var q = find.value.trim().toLowerCase();
      [].forEach.call(d.querySelectorAll('.qa-group'), function (g) {
        var head = g.querySelector('h3').textContent.toLowerCase(), any = false;
        [].forEach.call(g.querySelectorAll('.qa-item'), function (it) {
          var hit = !q || head.indexOf(q) >= 0 || it.textContent.toLowerCase().indexOf(q) >= 0;
          it.style.display = hit ? '' : 'none';
          any = any || hit;
        });
        g.style.display = any ? '' : 'none';
      });
    };
    d.querySelector('.qa-now').onclick = function () {
      find.value = ''; find.oninput();
      var g = markNow();
      if (g) g.scrollIntoView();
    };
    // 질문 대비 창에서도 덱을 넘기고(방향키, 스페이스, Home/End) N 으로 발표자 창으로 간다.
    // 찾기 칸에 글을 쓰는 동안에는 넘기지 않고, Esc 로 찾기 칸을 빠져나온다
    d.addEventListener('keydown', function (ev) {
      var t = ev.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) { if (ev.key === 'Escape') { ev.preventDefault(); t.blur(); } return; }
      if (ev.key === 'Escape') return;                  // 질문 대비 창의 Esc 는 발표를 끝내지 않는다
      if (ev.key === 'q' || ev.key === 'Q') return;
      if (ev.key === '/') { ev.preventDefault(); find.focus(); return; }
      onKey(ev);
      if (ev.key === 'n' || ev.key === 'N' || NEXT[ev.key] || PREV[ev.key] || ev.key === 'Home' || ev.key === 'End') markNow();
    });
    qaWin = w;
    markNow();
    find.focus();
  }

  // 지금 장의 메모 묶음에 표시한다
  function markNow() {
    if (!qaWin || qaWin.closed) return null;
    var n = curNum(), hit = null;
    [].forEach.call(qaWin.document.querySelectorAll('.qa-group'), function (g) {
      var on = !!n && g.getAttribute('data-n') === n;
      g.classList.toggle('now', on);
      if (on) hit = g;
    });
    return hit;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function openNotes() {
    findMain();
    var w = window.open('', 'deck-notes', winFeatures(1280, 800));
    if (!w) return;                                   // 팝업 차단
    moveToMain(w, 1280, 800);
    var head = [].map.call(document.querySelectorAll('link[rel="stylesheet"], style'), function (el) {
      return el.tagName === 'LINK' ? '<link rel="stylesheet" href="' + el.href + '">' : el.outerHTML;
    }).join('');
    w.document.open();
    w.document.write('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">' +
      '<title>발표자 노트</title>' + head + '<style>' + NOTES_CSS + '</style></head>' +
      '<body class="nv"><div class="nv-bar">' +
      '<span><button class="nv-time" type="button" title="눌러서 0 으로">00:00</button>' +
      '<button class="nv-reset" type="button" title="발표 시작할 때 누르기: 전체 시간과 이 장 시간을 0 으로">시간 리셋</button>' +
      ' <span class="nv-lap" title="이 장 경과 / 이 장 목표 · 누적 목표"></span></span>' +
      (document.querySelector('aside.qa') ? '<button class="nv-qa" type="button" title="Q 키">질문 대비</button>' : '') +
      '<span class="nv-nav"><button class="nv-peek" type="button" data-d="-1" title="[ 키">◀</button>' +
      '<button class="nv-live" type="button" title="C 키">발표 화면</button>' +
      '<button class="nv-peek" type="button" data-d="1" title="] 키">▶</button></span>' +
      '<span class="nv-right"><button class="nv-prev" type="button" title="V 키">미리보기</button>' + FS_BTNS + '<span class="nv-num"></span></span></div>' +
      '<div class="nv-slides"><div class="nv-now"></div><div class="nv-next"></div></div>' +
      '<div class="nv-text"></div></body></html>');
    w.document.close();

    var t0 = Date.now(), time = w.document.querySelector('.nv-time');
    function resetTime() { t0 = Date.now(); lapAt = at; lapT0 = Date.now(); time.textContent = '00:00'; drawLap(); }
    time.onclick = function () { resetTime(); time.blur(); };
    var rb = w.document.querySelector('.nv-reset');
    rb.onclick = function () { resetTime(); rb.blur(); };
    sizer(w, 'deck-notes-fs');
    [].forEach.call(w.document.querySelectorAll('.nv-peek'), function (btn) {
      btn.onclick = function () { peekBy(Number(btn.getAttribute('data-d'))); btn.blur(); };
    });
    // 슬라이드 미리보기 숨기기(V 키): 노트를 크게 보려고. 다음에 열 때도 유지한다
    function togglePrev(on) {
      var hide = typeof on === 'boolean' ? on : !w.document.body.classList.contains('noprev');
      w.document.body.classList.toggle('noprev', hide);
      try { localStorage.setItem('deck-notes-noprev', hide ? '1' : ''); } catch (e) {}
    }
    try { togglePrev(localStorage.getItem('deck-notes-noprev') === '1'); } catch (e) {}
    var pv = w.document.querySelector('.nv-prev');
    pv.onclick = function () { togglePrev(); pv.blur(); };
    var live = w.document.querySelector('.nv-live');
    live.onclick = function () { goLive(); live.blur(); };
    w.document.addEventListener('keydown', function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === '[') { ev.preventDefault(); peekBy(-1); }
      else if (ev.key === ']') { ev.preventDefault(); peekBy(1); }
      else if (ev.key === 'c' || ev.key === 'C') { ev.preventDefault(); goLive(); }
      else if (ev.key === 'v' || ev.key === 'V') { ev.preventDefault(); togglePrev(); }
    });
    var qb = w.document.querySelector('.nv-qa');
    if (qb) qb.onclick = function () { qb.blur(); openQA(w); };
    w.clearInterval(w.nvTick);                        // 덱을 새로 고친 뒤 다시 열 때
    w.nvTick = w.setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      time.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
      drawLap();
    }, 1000);
    w.document.addEventListener('keydown', onKey);
    // 미리보기 두 장(576 + 24 + 384)이 창 폭을 넘으면 함께 줄인다
    w.onresize = function () {
      w.document.querySelector('.nv-slides').style.zoom = Math.min(1, (w.innerWidth - 48) / 984);
    };
    w.onresize();

    notesWin = w;
    if (!document.body.classList.contains('presenting')) at = nearestSlide();
    drawNotes();
  }

  function thumb(box, slide) {
    box.innerHTML = '';
    if (!slide) return;
    var c = slide.cloneNode(true);
    [].forEach.call(c.querySelectorAll('video'), function (v) { v.removeAttribute('src'); });  // poster 만
    var stage = box.ownerDocument.createElement('deck-stage');
    stage.appendChild(c);
    box.appendChild(stage);
  }

  // 대본 미리 보기: null 이면 발표 화면을 따라간다
  var peek = null;

  function peekBy(d) {
    var i = (peek === null ? at : peek) + d;
    if (i < 0 || i >= slides.length) return;
    peek = i === at ? null : i;
    drawNotes();
  }

  function goLive() { peek = null; drawNotes(); }

  // 장별 시간: 발표 중인 장에 머문 시간과 aside.notes[data-target] 목표(초), 그 장까지 누적 목표
  var lapAt = -1, lapT0 = Date.now();
  function mmss(s) { return Math.floor(s / 60) + ':' + pad(s % 60); }
  function target(i) {
    var n = slides[i] && slides[i].querySelector('aside.notes');
    return n ? parseInt(n.getAttribute('data-target'), 10) || 0 : 0;
  }
  function drawLap() {
    var w = notesWin;
    if (!w || w.closed || !slides.length) return;
    if (at !== lapAt) { lapAt = at; lapT0 = Date.now(); }
    var el = w.document.querySelector('.nv-lap');
    if (!el) return;
    var goal = target(at), sum = 0;
    for (var i = 0; i <= at; i++) sum += target(i);
    if (!goal) { el.textContent = ''; return; }
    var s = Math.floor((Date.now() - lapT0) / 1000);
    el.textContent = '이 장 ' + mmss(s) + ' / ' + mmss(goal) + ' · 누적 목표 ' + mmss(sum);
    el.classList.toggle('over', s > goal);
  }

  function drawNotes() {
    var w = notesWin;
    if (!w || w.closed || !slides.length) return;
    drawLap();
    var i = peek === null ? at : peek;
    var d = w.document, note = slides[i].querySelector('aside.notes');
    var n = steps(slides[at]);
    d.body.classList.toggle('peeking', peek !== null);
    d.querySelector('.nv-num').textContent = peek === null
      ? (at + 1) + ' / ' + slides.length + (n ? ' · ' + step + '/' + n : '')
      : '보는 장 ' + (i + 1) + ' · 발표 ' + (at + 1) + ' / ' + slides.length;
    thumb(d.querySelector('.nv-now'), slides[i]);
    thumb(d.querySelector('.nv-next'), slides[i + 1]);
    var text = d.querySelector('.nv-text');
    text.innerHTML = note ? note.innerHTML : '';
    text.classList.toggle('empty', !text.textContent.trim());
    // 단계(▶)가 있는 노트: 지금 단계 문단을 표시하고 그 위치로 스크롤한다.
    // 장이 바뀐 직후에는 (뒤로 돌아와 마지막 단계여도) 대본 맨 위부터 보여 준다
    tagSteps(text);
    var parts = text.querySelectorAll('[data-step]'), cur = null;
    var newSlide = at !== notesAt;
    notesAt = at;
    text.classList.toggle('stepped', peek === null && parts.length > 0);
    if (peek !== null || !parts.length || newSlide) text.scrollTop = 0;
    if (peek !== null || !parts.length) return;
    [].forEach.call(parts, function (p) {
      var k = parseInt(p.getAttribute('data-step'), 10);
      p.classList.toggle('cur', k === step);
      p.classList.toggle('done', k < step);
      if (k === step && !cur) cur = p;
    });
    if (!newSlide) text.scrollTop = cur && step > 0 ? Math.max(0, cur.offsetTop - text.offsetTop - 12) : 0;
  }
  var notesAt = -1;

  // data-step 이 없는 노트는 ▶ 로 시작하는 문단마다 단계를 하나씩 올려 붙인다(그 앞은 0 단계)
  function tagSteps(box) {
    if (box.querySelector('[data-step]')) return;
    var ps = box.querySelectorAll('p'), k = 0, any = false, ARROW = /^\s*▶/;
    [].forEach.call(ps, function (p) { if (ARROW.test(p.textContent)) any = true; });
    if (!any) return;
    [].forEach.call(ps, function (p) {
      if (ARROW.test(p.textContent) && !p.hasAttribute('style')) k++;
      p.setAttribute('data-step', k);
    });
  }

  function nearestSlide() {
    var mid = window.scrollY + window.innerHeight / 2;
    var best = 0, bestGap = Infinity;
    slides.forEach(function (sl, n) {
      var box = sl.getBoundingClientRect();
      var gap = Math.abs(window.scrollY + box.top + box.height / 2 - mid);
      if (gap < bestGap) { bestGap = gap; best = n; }
    });
    return best;
  }

  function startPresenting() {
    if (document.body.classList.contains('presenting')) return;
    var from = nearestSlide();
    document.body.classList.add('presenting');
    show(from);
    fit();
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () { /* 창 모드로 계속 */ });
    }
  }

  function stopPresenting() {
    if (!document.body.classList.contains('presenting')) return;
    document.body.classList.remove('presenting');
    slides.forEach(function (sl) { sl.classList.remove('current'); });
    syncVideos(null);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    slides[at].scrollIntoView();
  }

  var NEXT = { ' ': 1, Spacebar: 1, ArrowRight: 1, ArrowDown: 1, PageDown: 1, Enter: 1 };
  var PREV = { ArrowLeft: 1, ArrowUp: 1, PageUp: 1, Backspace: 1 };

  // 덱 창과 발표자 창이 함께 쓴다
  function onKey(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.target && ev.target.isContentEditable) return;

    if (ev.key === 'n' || ev.key === 'N') {
      ev.preventDefault();
      if (notesWin && !notesWin.closed) notesWin.focus(); else openNotes();
      return;
    }
    if (ev.key === 'q' || ev.key === 'Q') { ev.preventDefault(); openQA(ev.view); return; }
    if (!document.body.classList.contains('presenting')) {
      if (ev.key === 'f' || ev.key === 'F') { ev.preventDefault(); startPresenting(); }
      return;
    }
    if (ev.key === 'Escape') { stopPresenting(); return; }
    if (ev.key === 'b' || ev.key === 'B') {     // 화면 잠깐 끄기
      ev.preventDefault();
      document.body.style.visibility =
        document.body.style.visibility === 'hidden' ? '' : 'hidden';
      return;
    }
    if (NEXT[ev.key]) { ev.preventDefault(); next(); return; }
    if (PREV[ev.key]) { ev.preventDefault(); prev(); return; }
    if (ev.key === 'Home') { ev.preventDefault(); show(0); return; }
    if (ev.key === 'End') { ev.preventDefault(); show(slides.length - 1); }
  }

  function setup() {
    injectCss();
    muteAll();
    slides = [].slice.call(document.querySelectorAll('.slide'));
    if (!slides.length) return;

    var btn = document.createElement('button');
    btn.className = 'present-btn';
    btn.type = 'button';
    btn.textContent = '전체 화면';
    btn.title = 'F 키로도 시작. Esc 로 종료';
    btn.addEventListener('click', startPresenting);
    document.body.appendChild(btn);

    document.addEventListener('keydown', onKey);
    document.addEventListener('presentationseek', function (ev) {
      if (!document.body.classList.contains('presenting') || ev.detail.slide !== slides[at]) return;
      setStep(Math.max(0, Math.min(steps(slides[at]), ev.detail.step)));
      peek = null; drawNotes();
    });
    document.addEventListener('presentationadvance', function (ev) {
      if (!ev.detail || !document.body.classList.contains('presenting') || ev.detail.slide !== slides[at] || ev.detail.step !== step) return;
      next();
    });

    // 슬라이드를 누르면 다음 장. 눌러서 쓰는 것들은 그대로 둔다.
    document.addEventListener('click', function (ev) {
      if (!document.body.classList.contains('presenting')) return;
      if (interactive(ev.target)) return;
      next();
    });

    window.addEventListener('resize', fit);
    // 새로 고친 덱은 file:// 에서 출처가 바뀌어 남은 발표자 창을 만질 수 없다. 같이 닫는다
    window.addEventListener('pagehide', function () {
      if (notesWin && !notesWin.closed) notesWin.close();
      if (qaWin && !qaWin.closed) qaWin.close();
    });
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement) stopPresenting();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
