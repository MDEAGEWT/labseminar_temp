# PPTX 양식과 suvlab-pptx 스킬

`design/` 의 HTML 양식을 PowerPoint 로 옮긴 것이다. 색, 글꼴, 배치, 번호 규칙은
`design/mydesign.md` 를 그대로 따른다.

| 경로 | 내용 |
|---|---|
| `suvlab-pptx/assets/template.pptx` | 슬라이드 마스터. 표지, 파트 구분, 목차, 본문 배치 레이아웃 14 종 |
| `suvlab-pptx/scripts/build_deck.py` | `slides.yaml` 을 읽어 마스터에 내용을 채우는 스크립트 |
| `suvlab-pptx/SKILL.md` | 클로드 코드 스킬 설명. YAML 표기, 배치, 블록, 수식, 표, 동영상 규칙 |
| `suvlab-pptx/template-src/` | 마스터를 코드로 다시 만드는 원본 (pptxgenjs + 후처리) |
| `../template/template.yaml` | 시작용 덱. HTML 양식의 여섯 장과 같다 |

## 왜 YAML 인가

YAML 에는 내용만 적는다. 글꼴, 색, 위치, 크기를 적는 칸이 없으므로 누가 쓰더라도 덱이
연구실 양식에서 벗어나지 않는다. 배치는 스크립트가 마스터 레이아웃 위에서 계산한다.

## 설치

```bash
pip install pyyaml python-pptx pymupdf pillow lxml fonttools
python suvlab-pptx/scripts/install_fonts.py   # 글꼴을 현재 사용자에게 설치한다 (Windows)
```

수식을 쓰려면 `pdflatex` (MiKTeX 또는 TeX Live) 가 필요하다. 수식은 LaTeX 로 조판하여 고해상도
그림으로 넣는다.

클로드 코드에서 스킬로 쓰려면 `suvlab-pptx/` 폴더를 `~/.claude/skills/` 아래에 복사한다.
그 뒤 "랩세미나 PPT 로 만들어줘" 처럼 지시하면 스킬이 YAML 을 작성하고 덱을 생성한다.

## 사용

```bash
cp ../template/template.yaml my_talk/slides.yaml     # 그림은 my_talk/imgs/ 에 둔다
python suvlab-pptx/scripts/build_deck.py my_talk/slides.yaml my_talk/talk.pptx
```

`WARNING:` 줄은 글이 넘치거나 제목이 긴 슬라이드를 알려 준다. 문장을 줄이거나 배치를 바꾸고
다시 생성한다. 생성된 PPTX 를 손으로 고치면 다음 생성에서 사라지므로 YAML 을 고친다.

Windows 에서 PowerPoint 가 설치되어 있으면 렌더링으로 확인할 수 있다.

```powershell
powershell -ExecutionPolicy Bypass -File suvlab-pptx/scripts/render.ps1 my_talk/talk.pptx render
python suvlab-pptx/scripts/grid.py render 3
```

## HTML 양식과 다른 점

- 수식은 편집 가능한 글자가 아니라 그림이다. 바꾸려면 YAML 을 고치고 다시 생성한다
- 글 높이를 넉넉하게 추정하므로 그림이 HTML 보다 조금 작게 나올 수 있다
- `steps` `checks` `terms` 블록은 `mydesign.md` 의 설명을 따라 구현했다
