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
 * 생기고, 누르거나 Q 키를 누르면 따로 창이 열린다. 찾기 칸으로 거르고, 그 창에서 누르는 키는
 * 덱을 넘기지 않는다. 안의 묶음은 div.qa-group(h3 + div.qa-item 들), data-n 은 장 번호.
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
 * 조작 - F 시작, Esc 종료, 방향키/스페이스 이동, Home/End 처음과 끝, B 화면 끄기,
 * N 발표자 창, Q 질문 대비 창. 발표자 창은 F 보다 먼저 연다. 전체 화면 중에 새 창을 열면 브라우저가
 * 전체 화면을 푼다.
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
  function openQA(from) {
    var src = document.querySelector('aside.qa');
    if (!src) return;
    if (qaWin && !qaWin.closed) { qaWin.focus(); markNow(); return; }
    var w = (from && !from.closed ? from : window).open('', 'deck-qa', 'width=1100,height=900');
    if (!w) return;                                   // 팝업 차단
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
    var w = window.open('', 'deck-notes', 'width=1280,height=800');
    if (!w) return;                                   // 팝업 차단
    var head = [].map.call(document.querySelectorAll('link[rel="stylesheet"], style'), function (el) {
      return el.tagName === 'LINK' ? '<link rel="stylesheet" href="' + el.href + '">' : el.outerHTML;
    }).join('');
    w.document.open();
    w.document.write('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">' +
      '<title>발표자 노트</title>' + head + '<style>' + NOTES_CSS + '</style></head>' +
      '<body class="nv"><div class="nv-bar">' +
      '<button class="nv-time" type="button" title="눌러서 0 으로">00:00</button>' +
      (document.querySelector('aside.qa') ? '<button class="nv-qa" type="button" title="Q 키">질문 대비</button>' : '') +
      '<span class="nv-nav"><button class="nv-peek" type="button" data-d="-1" title="[ 키">◀</button>' +
      '<button class="nv-live" type="button" title="C 키">발표 화면</button>' +
      '<button class="nv-peek" type="button" data-d="1" title="] 키">▶</button></span>' +
      '<span class="nv-right">' + FS_BTNS + '<span class="nv-num"></span></span></div>' +
      '<div class="nv-slides"><div class="nv-now"></div><div class="nv-next"></div></div>' +
      '<div class="nv-text"></div></body></html>');
    w.document.close();

    var t0 = Date.now(), time = w.document.querySelector('.nv-time');
    time.onclick = function () { t0 = Date.now(); time.textContent = '00:00'; time.blur(); };
    sizer(w, 'deck-notes-fs');
    [].forEach.call(w.document.querySelectorAll('.nv-peek'), function (btn) {
      btn.onclick = function () { peekBy(Number(btn.getAttribute('data-d'))); btn.blur(); };
    });
    var live = w.document.querySelector('.nv-live');
    live.onclick = function () { goLive(); live.blur(); };
    w.document.addEventListener('keydown', function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === '[') { ev.preventDefault(); peekBy(-1); }
      else if (ev.key === ']') { ev.preventDefault(); peekBy(1); }
      else if (ev.key === 'c' || ev.key === 'C') { ev.preventDefault(); goLive(); }
    });
    var qb = w.document.querySelector('.nv-qa');
    if (qb) qb.onclick = function () { qb.blur(); openQA(w); };
    w.clearInterval(w.nvTick);                        // 덱을 새로 고친 뒤 다시 열 때
    w.nvTick = w.setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      time.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
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

  function drawNotes() {
    var w = notesWin;
    if (!w || w.closed || !slides.length) return;
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
