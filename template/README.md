# 빈 덱 양식

내용 없이 양식만 담은 덱 한 벌이다. 같은 여섯 장을 세 가지 형식으로 둔다.

| 파일 | 형식 | 용도 |
|---|---|---|
| `template.html` | HTML | 브라우저 발표용 덱. `design/template.html` 과 같은 내용이며 옆의 `deck.css` `layout.css` `present.js` 로 바로 열린다 |
| `template.pdf` | PDF | `template.html` 을 인쇄한 결과. 한 장이 한 쪽이다 |
| `template.pptx` | PowerPoint | `template.yaml` 로 생성한 덱. 슬라이드 마스터에 레이아웃 14 종이 들어 있다 |

여섯 장은 표지, 목차, 파트 구분, 글과 표, 수식, 그림 순이다. `imgs/example.png` 는 그림 자리를
보여 주는 빈 그림이며 `make_placeholder.py` 로 다시 그린다.

## 다시 만들기

`deck.css` `layout.css` `present.js` 는 `design/` 의 복사본이다. `design/` 을 고친 뒤에는 다시
복사하고 PDF 를 다시 인쇄한다.

```bash
cp ../design/deck.css ../design/layout.css ../design/present.js ../design/template.html .
google-chrome --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=30000 --print-to-pdf=template.pdf template.html
```

PPTX 는 `pptx/suvlab-pptx` 스킬로 만든다.

```bash
python ../pptx/suvlab-pptx/scripts/build_deck.py template.yaml template.pptx
```

## PowerPoint 에서 쓰기

`template.pptx` 를 열고 **홈 → 새 슬라이드** 에서 레이아웃을 고른다. 표지, 파트 구분, 목차, 본문
배치 11 종이 마스터에 있다. 글꼴 Nunito, Atkinson Hyperlegible, JetBrains Mono, Noto Sans KR 이
설치되어 있어야 줄바꿈이 HTML 과 같다. 설치는 `pptx/README.md` 를 따른다.
