# 슬라이드 디자인 규격

발표 자료의 모양을 정의한다. 구현은 `deck.css` 한 파일에 모두 들어 있고,
새 덱을 만들 때는 그 파일을 복사해서 쓴다.

이 문서는 **디자인만** 다룬다. 무엇을 쓸지, 어떤 순서로 만들지는 여기서 정하지 않는다.

## 1. 무대

- 아트보드 1920x1080 (16:9)
- 슬라이드 하나 = `<section class="slide">`, 표지는 `class="slide cover"`
- 여백: 좌우 112px, 위 84px, 아래 72px
- **본문 폭 = 1920 − 112 × 2 = 1696px.** 그림 크기 계산의 기준값이다.

인쇄 규격은 덱 HTML 의 `<head>` 에 직접 넣는다.

```html
<style>
@page { size: 1920px 1080px; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
.slide { width: 1920px; height: 1080px; overflow: hidden; box-sizing: border-box;
  break-after: page; page-break-after: always; }
.slide:last-child { break-after: auto; page-break-after: auto; }
</style>
```

## 2. 색

| 토큰 | 값 | 용도 |
|---|---|---|
| `--sky` | #3b82f6 | 주색. 키커, 제목 밑줄, 불릿 |
| `--sky-deep` | #1d4ed8 | 카드 제목, 코드 함수명, 표지 과목명 |
| `--sky-soft` | #dbeafe | 표지 배경, 강조 카드 배경 |
| `--leaf` | #22c55e | 진행 막대, 정답/권장 |
| `--leaf-soft` | #dcfce7 | 권장 카드 배경 |
| `--leaf-deep` | #16a34a | 코드 문자열 |
| `--coral` | #f87171 | 경고. 붉은색 대신 부드러운 산호색 |
| `--coral-soft` | #fee2e2 | 경고 카드 배경 |
| `--sun` | #fbbf24 | 표지 강조선 |
| `--berry-deep` | #7c3aed | 코드 키워드 |
| `--ink` | #0f172a | 본문 |
| `--ink-muted` | #475569 | 보조 설명 |
| `--ink-subtle` | #94a3b8 | 푸터, 캡션 |
| `--bg` / `--surface` / `--sunken` | #ffffff / #f8fafc / #f1f5f9 | 배경 / 카드 / 코드 블록 |
| `--outline` | #e2e8f0 | 테두리 |

배경색은 흰색과 sky-soft 두 가지만 쓴다. 그라디언트는 쓰지 않는다.

## 3. 글꼴

| 역할 | 글꼴 | 비고 |
|---|---|---|
| 제목 | Nunito 800 | |
| 본문 | Atkinson Hyperlegible | 난독증 친화 서체 |
| 코드 | JetBrains Mono | `font-variant-ligatures: none` 필수 |
| 한글 | Noto Sans KR | 위 세 글꼴에 한글 글리프가 없어 폴백으로 동작 |

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet" />
```

합자를 끄지 않으면 `--` 같은 연속 기호가 긴 대시 하나로 붙어 보인다.
SVG 안에서 `font-family="monospace"` 를 쓸 때도 함께 지정한다.

```svg
<text font-family="'DejaVu Sans Mono','Noto Sans Mono',monospace">cmake --build build</text>
```

`<img>` 로 불러오는 SVG 는 덱이 불러온 웹폰트를 쓰지 못한다. `font-family="monospace"`
하나만 적으면 시스템 기본 글꼴로 떨어지고, 그 글꼴이 `--` 를 긴 대시로, `...` 를
말줄임표로 바꿔 명령줄이 틀리게 보인다. **SVG 안 고정폭 글자는 설치된 글꼴 이름을
직접 적는다.** `font-variant-ligatures:none` 만으로는 막지 못한다.

## 4. 글자 크기 (1920x1080 기준)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--type-display` | 124px | 표지 제목 |
| `--type-title` | 76px | 슬라이드 제목 |
| `--type-subtitle` | 46px | 표지 과목명, 리드 문장 |
| `--type-body` | 36px | 본문 기본, 표지 발표자 |
| `--type-small` | 29px | 불릿, 설명 |
| `--type-code` | 30px | 코드. `tight` 27px, `xs` 25px |
| `--type-kicker` | 26px | 키커, 푸터 |

**24px 아래로 내려가지 않는다.** 그림 안 글자도 마찬가지다 (9장 참고).

## 5. 슬라이드 종류

덱은 **표지 · 목차 · 본문 · 정리** 네 종류로 구성한다.

### 표지

```html
<section class="slide cover">
  <span class="course">과목명</span>
  <span class="kicker">Part 1 · 파트 이름</span>
  <h1 class="display">주제</h1>
  <div class="sun-rule"></div>
  <p class="presenter">소속 발표자</p>
</section>
```

| 요소 | 내용 |
|---|---|
| `.course` | 과목명 |
| `.kicker` | 파트 이름 |
| `.display` | 주제 하나. 짧은 명사구 |
| `.sun-rule` | 노란 강조선 260x12 |
| `.presenter` | 소속과 발표자 |

- 연구실 로고는 **왼쪽 위** 200px (`.cover::after` 가 `--lab-logo` 를 그린다)
- 주제를 풀어 쓴 설명 문장은 넣지 않는다
- 연구실 로고, 푸터, 페이지 번호를 두지 않는다

### 본문

```html
<section class="slide">
  <header class="head"><span class="kicker">묶음 이름</span><span class="folio">01</span></header>
  <h2 class="title">제목</h2>
  <div class="rule"></div>
  <div class="body"> ... </div>
  <footer class="foot">
    <span class="foot-sec">파트 이름</span>
    <div class="bar"><i style="width:5%"></i></div>
    <span class="foot-num">01 / 20</span>
  </footer>
</section>
```

- `.kicker` — 그 슬라이드가 속한 묶음 이름. **영어**로 쓰고 CSS 가 대문자로 바꾼다
- `.title` — 슬라이드 제목. 주제어 하나
- 오른쪽 위: 연구실 로고 (`.head::after` 가 `--lab-logo` 를 배경으로 그린다)
- 오른쪽 아래: 페이지 번호. `.folio` 는 숨기고 푸터에만 둔다
- 진행 막대 폭 = 현재 번호 / 전체 번호

### 목차와 정리

본문을 감싸는 틀 슬라이드다. 표지 다음에 목차, 마지막에 정리를 둔다.

| 슬라이드 | 키커 | 진행 막대 | 그림 |
|---|---|---|---|
| 목차 | `Overview` | 0% | 없음. 목록만 |
| 정리 | `Summary` | 100% | 묶음을 순서대로 이어 놓은 흐름도 |

목차는 항목이 적어 아래쪽이 크게 빈다. 목록의 글자와 줄 간격을 키워 화면을 채운다.

```css
.slide[data-label="목차"] .ul { gap: 40px; font-size: var(--type-body); }
.slide[data-label="목차"] .ul li { padding-left: 44px; }
.slide[data-label="목차"] .ul li::before { left: 6px; width: 18px; height: 18px; }
```

### 번호 매기기

- 표지, 목차, 정리, 파트 구분 슬라이드에는 번호를 매기지 않는다
- 실제 내용이 있는 첫 슬라이드가 `01`
- 분모(전체 쪽수)도 번호가 붙는 슬라이드만 센다
- 번호를 재계산할 때는 `.foot-num` 이 빈 슬라이드를 제외 대상으로 삼는다

## 6. 로고

| 변수 | 위치 |
|---|---|
| `--lab-logo` | 표지 **왼쪽 위** 200px, 본문 슬라이드 **오른쪽 위** 높이 112px |

표지와 본문이 같은 로고를 쓴다. 연구실 로고 하나로 덱 전체를 묶는다.

투명 배경 PNG. 선화 버전이 작게 줄여도 읽힌다.
파일 이름은 덱마다 고정해서 스타일 파일이 경로를 바꾸지 않아도 되게 한다.

## 7. 본문 구성 요소

| 클래스 | 설명 |
|---|---|
| `.lead` | 슬라이드 한 줄 요약 |
| `.cols` / `.cols-wide` / `.cols3` | 2열 / 비대칭 2열 / 3열 그리드. 자식에 `min-width: 0` 필수 |
| `.cols-fig` | 글 + 그림 2열. `.flip` 을 붙이면 그림이 왼쪽 |
| `.fig-stack` | 한 열에 그림 여러 장을 세로로. `.row` 를 붙이면 가로로 |
| `.grid4` / `.grid8` | 2x2 카드, 2열 용어 목록 |
| `.card` | 기본 카드. `.soft` 파랑, `.good` 초록, `.warn` 산호 |
| `.ul` | 불릿 목록. `.leaf` `.coral` 로 점 색 변경 |
| `.steps` | 번호 원이 붙은 단계 목록 |
| `.checks` | 체크 표시 목록 (CSS 로 그린 체크, SVG 아님) |
| `pre.code` / `pre.term` | 코드 / 터미널 블록 |
| `.chip` | 알약 모양 태그 |
| `.std` | 용어 + 한 줄 설명 |
| `.tbl` | 표 |
| `figure.fig` | 그림 |

불릿은 `<strong>말머리</strong> — 설명` 형태로 쓴다. 대시는 전각이 아니라 `—`.

**카드는 아껴 쓴다.** 슬라이드 아래쪽에 요약 카드를 습관적으로 붙이지 않는다.
꼭 기억해야 할 한 문장이 있을 때만 쓴다.

## 8. 배치 모델

본문은 **글 영역**과 **그림 영역** 둘로 나눈다. 표는 그림 영역에 들어간다.

```html
<div class="body" data-layout="right" style="--cols: 2; --split: 44%;">
  <div class="body-text"> ... 불릿, 카드 ... </div>
  <div class="body-media" style="--cols: 2;"> ... figure, table ... </div>
</div>
```

| 값 | 배치 |
|---|---|
| `bottom` | 글 위, 그림 아래 |
| `right` | 글 왼쪽, 그림 오른쪽 |
| `left` | 그림 왼쪽, 글 오른쪽 |
| `top` | 그림 위, 글 아래 |
| `quad` | 2단. 각 단이 글 위 / 그림 아래 |
| `text` / `media` | 한쪽만 |

| 변수 | 뜻 |
|---|---|
| `--split` | 두 영역의 비율. 첫 트랙 크기 |
| `--row` | `quad` 에서 한 단 안의 글/그림 비율 |
| `--cols` | 그림 격자의 열 수 |
| `--ctpl` / `--rtpl` | 그림 격자의 열·행 트랙 크기 (`fr`) |
| `--trow` | 표의 행 높이 |
| `.body` 의 `padding` | 본문 바깥 여백 |

- 글과 그림이 좌우로 놓이면 **두 영역의 윗변이 같은 높이**에서 시작한다
- 두 영역 모두 `overflow: hidden`. 한쪽을 끝까지 줄여도 내용이 반대편으로 넘치지 않는다
- 그림이 여러 장이면 균일 격자로 놓아 오와 열을 맞춘다

## 9. 그림

### 판형을 배치에 맞춘다

같은 그림도 폭이 절반이면 글자가 절반으로 줄어든다. 그림 상자에 실제로 주어지는
폭을 먼저 정하고 그에 맞는 판형으로 그린다.

| 배치 | 그림 폭 | 알맞은 판형 |
|---|---|---|
| 전체 폭 | 약 1696px | 가로로 긴 도해 |
| 좌우 2열 | 약 828px | 세로로 긴 도해 |

가로로 긴 도해를 절반 폭에 넣으면 글자가 기준을 밑돈다. 그럴 때는 그림을 줄이지
말고 그 슬라이드를 세로 배치로 바꿔 전체 폭을 준다.

### 그림 안 글자 크기

`viewBox` 폭이 `W` 인 SVG 는 `그림 상자 폭 / W` 배로 확대되어 보인다.
화면에서 24px 이상으로 보이려면

```
SVG 안 글자 크기 ≥ 24 × W / 그림 상자 폭
```

전체 폭(1696px)에 놓는 그림이면 `24 × W / 1696`, 절반 폭(828px)이면 `24 × W / 828`.

기존 그림을 손볼 때는 다음 식으로 한 번에 올린다.

```python
new = max(old * 1.2, 24.0 * viewBoxWidth / boxWidth)
```

**글자를 지워서 크기 문제를 해결하지 않는다.** 상자 폭을 늘린다.

### 가로 공간을 남기지 않는다

- 그림 상자에 가로 여유가 있으면 도해를 좌우로 늘려 채운다. 원래 폭 그대로 가운데에 두지 않는다
- 그림 상자의 가로세로비를 먼저 재고 `viewBox` 를 거기에 맞춘다. 비가 어긋나면 남는 쪽에
  흰 여백이 생긴다. 본문 아래 전체 폭 그림은 대략 1696x497, 비 3.4 다
  - 재는 법: 덱 HTML 사본의 `<head>` 에 `.body-media{background:#ff00ff}` 를 넣고 PDF 로
    뽑아 그 색 영역의 크기를 본다
- 전체 폭 배치의 `viewBox` 폭은 1240 안팎으로 잡는다. 880 같은 좁은 판형은 같은 글자를
  더 좁은 상자에 밀어 넣어 넘침을 만든다
  - 비 3.4 를 맞추면 `viewBox` 는 1240x360 이 된다
- 상자 배열은 판형 폭에서 좌우 여백 24 와 상자 사이 간격 24 를 빼고 균등 분할한다
  - `viewBox` 폭 1200 을 2열로 나누면 상자 하나가 564
- 남는 여백을 세로로 채우지 않는다. 상자를 늘리는 방향은 가로다

### 글자는 상자를 넘지 않는다

상자 안 글자의 렌더 폭이 `상자 폭 - 32` 를 넘으면 안 된다. 폭은 다음 지표로 어림한다.

| 문자 | 글자당 폭 |
|---|---|
| 한글, CJK | 1.0em |
| 라틴 문자, 숫자 | 0.55em |
| 고정폭 글꼴 | 0.6em |

넘칠 때는 이 순서로 처리한다.

1. 상자를 넓힌다. 가로 공간이 남아 있으면 여기서 끝난다
2. 문장을 두 줄로 나누고 상자 높이를 늘린다
3. 그래도 넘치면 문장을 이름표 수준으로 줄인다

**글꼴 크기를 낮춰서 맞추지 않는다.** 4절의 최소 크기를 깨뜨린다.

검사는 `check_svg_fit.py` 가 한다. 인자 없이 돌리면 모든 덱의 SVG 를 보고,
파일을 주면 그 파일만 본다.

```
$ python3 lecture_note/check_svg_fit.py lecture_note/basic/Docker/lecture/imgs/20_uid_gid.svg
넘치는 글자 0 개
```

그림을 고친 뒤에는 이 검사를 통과시킨다. 20px 미만으로 보고되는 것은 추정 오차 범위다.

### 직접 그릴 때

- 그림 안 글자는 **영어**로 쓴다
- 그림 안에 제목을 넣지 않는다. 제목은 슬라이드가 갖는다
- 구조도는 열과 오를 맞춘다
- 글자를 최소한으로 줄인다. 문장이 아니라 이름표다
- `viewBox` 폭을 넉넉히 잡는다. 글자가 상자 밖으로 나가면 폭을 늘려서 해결한다
- 슬라이드 글에 이미 있는 문장을 그림 안에 다시 적지 않는다
- 화살표 방향은 실제 인과와 같게 그린다. 도구가 파일을 읽으면 화살표는
  파일에서 도구로 간다
- 한 행짜리 상자에 칩을 넣지 않는다. 세로 여유가 없어 아래 상자와 겹친다

### 배치

그림은 배정된 상자를 가득 채운다. 흰 여백이 남지 않게 키운다.

## 9-1. 동영상

동영상도 그림이다. `figure.fig` 안에서 `img` 자리에 `video` 를 넣고, 9장의 그림 규칙을
그대로 따른다. 상자를 채우고, 좌우 배치에서는 윗변을 글의 첫 줄에 맞춘다.

```html
<figure class="fig"><span class="frame">
  <video src="imgs/flight.mp4" poster="imgs/flight_poster.jpg"
         controls playsinline></video>
</span></figure>
```

### 기본값 - 무음, 자동 재생

**동영상은 소리 없이 자동으로 재생한다.** 속성을 적지 않아도 그렇게 동작한다.
`present.js` 가 로드 시점에 모든 `video` 를 음소거로 고정하고, 발표 모드에서 슬라이드가
바뀌면 이전 동영상을 멈추고 현재 슬라이드의 동영상을 처음부터 재생한다.

| 기본값 | 이유 |
|---|---|
| 무음 | 발표장에서 소리가 터지는 사고를 막는다. 브라우저도 무음일 때만 자동 재생을 허용한다 |
| 자동 재생 | 발표자가 재생 버튼을 찾는 동안 화면이 멈춰 있지 않게 한다 |

**파일 자체도 음성 트랙을 빼서 굽는다.** 재생 쪽 음소거만 믿지 않는다.

```bash
ffmpeg -i master.mp4 -vf scale=1920:-2 -c:v libx264 -preset slow -crf 28 \
  -pix_fmt yuv420p -movflags +faststart -an flight.mp4
```

`-an` 이 음성 트랙을 뺀다. 화면 녹화본은 그대로 쓰기에 너무 크므로 폭 1920 으로 줄인다.

### 기본값을 끄는 속성

| 속성 | 동작 | 쓰는 때 |
|---|---|---|
| `data-noautoplay` | 자동 재생을 끈다 | 발표자가 말을 마친 뒤 직접 눌러 시작하고 싶을 때 |
| `data-sound` | 음소거를 푼다 | 소리가 내용의 일부일 때만. 기본값을 깨는 선택이므로 이유가 있어야 한다 |

### poster 는 반드시 지정한다

PDF 에는 동영상이 아니라 `poster` 정지 화면이 실린다. 지정하지 않으면 그 자리가 검은 칸이
된다. 사진 계열은 JPEG 가 PNG 보다 훨씬 작다.

```bash
ffmpeg -i flight.mp4 -vframes 1 flight_poster.jpg
```

### 파일은 HTML 밖에 둔다

동영상은 `imgs/` 에 두고 경로로 참조한다. base64 로 HTML 에 끼워 넣지 않는다. 용량이
33% 늘고 탐색이 느려지며 편집과 버전 관리가 어려워진다. 원본 촬영본은 저장소에 올리지
말고 따로 보관하고, 덱에는 변환본만 넣는다.


## 10. 표

- 머리행은 **영어**로 쓴다
- 행 높이는 `--trow` 로 정한다. 표 전체가 한 값을 공유해 행이 고르게 유지된다
- 열 폭은 표 안의 `<colgroup>` 에 퍼센트로 적고, 그 표에만
  `table-layout: fixed` 를 준다. 자동 배치는 내용이 넓으면 `<col>` 폭을 무시한다

```html
<table class="tbl" data-fixed>
  <colgroup><col style="width: 47%"><col style="width: 53%"></colgroup>
  ...
</table>
```

### 규칙은 layout.css 에만 둔다

- `cde-layout.css` 는 편집기가 저장할 때마다 다시 쓴다. 거기에 넣은 규칙은 사라진다
- `.cde-media` 를 겨냥한 규칙도 `layout.css` 에 둔다. 선택자를 더 구체적으로 쓰면
  뒤에 실리는 `cde-layout.css` 보다 이긴다

### 그림이 하나일 때

- 그림 칸의 열 수가 둘이어도 그림이 하나면 열을 나누지 않는다. 전체 폭을 주고
  가운데에 둔다. 한쪽 열에만 서면 반대쪽이 빈 채로 남는다
- `layout.css` 가 `:only-child` 에 `grid-column: 1 / -1` 을 준다. 마크업에서
  `--cols` 를 고칠 필요는 없다

### 그림이 표나 코드와 나란히 설 때

- 두 칸의 **윗변을 맞춘다.** 그림을 세로 가운데에 두면 왼쪽 표의 첫 줄보다
  아래에서 시작해 한 줄 어긋난 것처럼 보인다
- `layout.css` 가 그림 칸에 표나 코드가 함께 있을 때 `object-position: center top`
  과 `align-items: flex-start` 를 준다. 틀은 칸 높이를 그대로 쓰고 그림만 위로 붙는다
- 그래도 어긋나면 원인은 배치가 아니라 **SVG 안의 위쪽 여백**이다. `viewBox` 의
  `min-y` 를 내용 시작점 8 위로 올려 죽은 여백을 잘라낸다
  - 예: `viewBox="0 0 900 300"` 인데 내용이 y=40 에서 시작하면 `viewBox="0 32 900 268"`
- 좌우 배치(`data-layout="right"` / `"left"`) 에서 글 옆에 선 그림도 같다.
  윗변을 글의 첫 줄에 맞춘다
- 받은 그림에 흰 여백이 붙어 있으면 먼저 잘라낸다. 여백째로 넣으면 정렬을
  맞춰도 그림이 아래에서 시작한 것처럼 보인다
- 검사: 왼쪽 칸의 첫 글자 줄과 그림의 첫 잉크 줄을 재어 차이가 25px 안인지 본다

### 표와 그림을 한 칸에 둘 때

- `.body-media` 는 자식을 균등한 행으로 나눈다. 표는 내용보다 작아질 수 없어
  균등 분할에서 칸 밖으로 밀려나고, 아래의 그림을 덮거나 슬라이드 끝에서 잘린다
- `layout.css` 가 표와 그림이 함께 있는 칸만 `auto minmax(0, 1fr)` 로 잡는다.
  표에 필요한 높이를 먼저 주고 남은 높이를 그림이 받는다
- 손으로 비율을 정하려면 그 칸에 `--rtpl` 을 준다. 규칙보다 우선한다
- 남는 세로 공간이 곧 그림 크기다. 같은 칸에서는 표와 그림 사이 간격을 14px,
  표의 행 간격을 10px 로 좁혀 그 공간을 그림에 넘긴다. 표에 `--trow` 를
  직접 준 경우는 그 값이 이긴다
- 그래도 그림이 가로 폭을 다 쓰지 못하면 남은 원인은 그림 자체의 판형이다.
  표 아래 칸은 대략 6:1 이 되므로 그 비에 맞춰 다시 그린다 (9장 참고)

## 11. 코드 블록

문법 강조는 span 클래스로 한다.

| 클래스 | 대상 | 색 |
|---|---|---|
| `.k` | 키워드 | #7c3aed |
| `.s` | 문자열 | #16a34a |
| `.c` | 주석 | #64748b |
| `.fn` | 함수명 | #1d4ed8 |
| `.no` | 숫자 | #d97706 |
| `.pr` | 셸 프롬프트 | #3b82f6 |
| `.err` | 오류 메시지 | #b91c1c |

코드 폭 기준 (절반 열 828px): 30px 약 42자, 27px 약 48자, 25px 약 52자.
한글은 2자로 센다.

일부 템플릿 파서는 태그 사이의 공백 전용 텍스트 노드를 버린다. `</span>` 다음에
줄바꿈만 있고 곧바로 `<span>` 이 오면 두 줄이 한 줄로 붙는다. 줄바꿈을 앞 span 안에 넣는다.

```html
<!-- 틀림: 두 줄이 붙는다 -->
x + <span class="no">1</span>
<span class="err"># [-128]</span>

<!-- 맞음 -->
x + <span class="no">1
</span><span class="err"># [-128]</span>
```

### 절반 열에 놓는 코드

- 그림 칸을 명령어와 그림이 나눠 쓰면 코드 폭이 828px 로 준다
- 이때만 코드 크기를 24px 로 내린다. `deck.css` 가 `.cols` 와 `--cols: 2` 인
  그림 칸에 자동으로 적용한다. 4절의 하한이 24px 이므로 더 내리지 않는다
- 24px 기준 한 줄은 **53자**까지다. 넘으면 폰트가 아니라 명령을 줄이거나
  `\` 로 다음 줄에 잇는다
- 검사: 코드 상자 안쪽 폭에서 글이 차지한 폭을 재어 여유가 남는지 본다

## 12. 수식

- 수식 안에 한글, CJK, `·` `×` `→` `≤` `≥` `∈` 같은 비-ASCII 를 넣지 않는다.
  설명은 수식 밖에 쓴다
- 가운뎃점 `·`(U+00B7) 은 `\cdotp` 미정의 에러를 낸다. 곱셈은 `\cdot`, 이름 구분은 `,` 나 `-`
- 부등호와 화살표는 명령어로: `\le` `\ge` `\ne` `\to` `\times` `\in`
- `\*` 는 에러다. `T^{*}` 또는 `T^{\star}` 로 쓴다
- `\text{}` 안에는 ASCII 만 넣는다

## 13. 인쇄

헤드리스 크롬으로 뽑는다. 슬라이드 하나가 한 쪽이 된다 (1440x810pt).
배경색은 `print-color-adjust: exact` 로 유지한다.

```bash
google-chrome --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=25000 --print-to-pdf=out.pdf "file://$PWD/deck.html"
```

임시 파일에 쓴 뒤 옮기면, 열려 있는 뷰어가 깨진 파일을 읽지 않는다.

### 인쇄에서 그림이 푸터를 덮는 문제

크롬은 인쇄 분할 단계에서 `.body` 에 채움 높이를 주지 않는다. 화면에서 약 600px 인
본문 상자가 인쇄에서는 글 높이(약 180px)로 줄고, 그 결과 `max-height: 100%` 와
`1fr` 의 기준이 사라져 그림이 원본 비율대로 커지면서 푸터를 덮는다.

`.slide` 를 flex 로 두든 grid 로 두든, `.body` 를 `flex-basis: 0` 으로 두든
결과는 같다. **부모에서 높이를 내려주는 방식으로는 해결되지 않는다.**

인쇄에서 확실히 아는 값은 페이지 높이뿐이다. `@page` 높이가 1080px 이면
`1vh = 10.8px` 이므로, 인쇄에서만 그림 높이를 그 기준으로 직접 묶는다.

```css
@media print {
  figure.fig, .body[data-layout] > .body-media { max-height: 46vh; }
  figure.fig .frame { max-height: 46vh; }
  figure.fig img, .body[data-layout] .body-media img {
    max-height: 46vh; width: auto; height: auto; max-width: 100%; margin: 0 auto;
  }
}
```

`width: auto` 로 두어야 높이 제한에 걸린 그림이 비율을 지킨 채 가운데 정렬된다.
`.body` 에 `overflow: hidden` 을 함께 두면 어떤 이유로든 넘쳐도 푸터를 덮지 않는다.

값을 바꿀 때는 전 쪽의 하단 띠를 훑어 침범이 없는지 확인한다.

## 14. CSS 작성 시 주의

### 우선순위

덱 스타일에는 `figure.fig { margin: 22px 0 0 }` 처럼 **타입 + 클래스**(0,1,1)
선택자가 있다. 배치 규칙이 `.body-media > *` (0,1,0) 이면 여기에 밀려 그림이
22px 아래로 내려가고, 좌우 배치의 윗변이 어긋난다.

배치 규칙은 클래스를 둘 이상 써서 (0,2,0) 이상으로 올린다.

```css
.body[data-layout] .body-media > * { margin: 0; }
```

### display 를 덮어쓰지 않는다

미리보기 도구가 슬라이드에 `display` 를 강제하면 덱이 정한 배치가 사라진다.
`display: flex !important` 로 되살리면 `flex-direction` 이 기본값 `row` 로 떨어져
머리말·제목·본문·푸터가 가로로 늘어선다.

숨김은 대상을 좁혀서, 보이는 슬라이드에는 `display` 를 손대지 않는다.

```css
[data-slide]:not([data-current]) { display: none !important; }
[data-slide][data-current] { /* display 지정 없음 */ }
```

## 15. 하지 않는 것

- 이모지
- 그라디언트 배경
- 24px 미만 글자 (그림 안 글자 포함)
- 색만으로 의미 전달 (경고는 색 + 제목 + 문구를 같이 쓴다)
- 한 덱에 배경색 3가지 이상
- 표지에 부제 문장
- 표지, 목차, 정리, 파트 구분 슬라이드에 번호
- 슬라이드에 출처 캡션
- 습관적인 하단 요약 카드
- 그림 안에 슬라이드 글과 같은 문장
- 소리가 나는 동영상. 기본은 무음이고, 소리는 내용의 일부일 때만 `data-sound` 로 연다
