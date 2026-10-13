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
 *
 *   poster 만들기  ffmpeg -i flight.mp4 -vframes 1 flight_poster.jpg
 *
 * 조작 - F 시작, Esc 종료, 방향키/스페이스 이동, Home/End 처음과 끝, B 화면 끄기.
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

  function show(i) {
    if (!slides.length) return;
    at = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (sl, n) { sl.classList.toggle('current', n === at); });
    syncVideos(slides[at]);
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

    document.addEventListener('keydown', function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.target && ev.target.isContentEditable) return;

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
      if (NEXT[ev.key]) { ev.preventDefault(); show(at + 1); return; }
      if (PREV[ev.key]) { ev.preventDefault(); show(at - 1); return; }
      if (ev.key === 'Home') { ev.preventDefault(); show(0); return; }
      if (ev.key === 'End') { ev.preventDefault(); show(slides.length - 1); }
    });

    // 슬라이드를 누르면 다음 장. 눌러서 쓰는 것들은 그대로 둔다.
    document.addEventListener('click', function (ev) {
      if (!document.body.classList.contains('presenting')) return;
      if (interactive(ev.target)) return;
      show(at + 1);
    });

    window.addEventListener('resize', fit);
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
