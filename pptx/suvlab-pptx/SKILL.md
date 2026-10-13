---
name: suvlab-pptx
description: Build PowerPoint (.pptx) decks in the SUV Lab (SUVLab, 충북대 SUV 연구실) seminar design — the labseminar_temp look with the sky-blue cover, kicker + title + blue rule, SUV LAB logo, and green progress-bar footer — by writing a slides.yaml and running the bundled fill script on the lab's master template, with LaTeX equations typeset as images. Use this whenever the user wants lab-seminar, 랩세미나, 연구실 양식, SUV Lab, or labseminar_temp slides as PPTX/PowerPoint, wants an existing lab HTML deck or slide.md turned into PPTX, or asks for a conference/seminar deck "in our lab template" — even if they only say "PPT로 만들어줘" while working in a lab-seminar folder. Prefer this over the generic pptx skill for any SUV Lab deck.
---

# SUV Lab seminar decks as PPTX

This is a port of labseminar_temp (`design/mydesign.md`, `deck.css`, `layout.css`) to PowerPoint.
The design lives in `assets/template.pptx` (slide-master layouts) and in the constants of
`scripts/build_deck.py`. You never draw the design yourself: you write **content only** into a
`slides.yaml`, and the script places it. The YAML has no field for fonts, colours, positions
or sizes, so the deck cannot drift from the lab design whatever the content is.

This overrides the generic pptx skill's "Design Ideas" (no accent line under titles, pick a
topic palette, avoid text-only slides, etc.). The blue rule, palette and progress bar *are*
the lab's design; keep them and add nothing on top.

## Workflow

1. Gather the content (user text, `contents.md`/`slide.md` from labseminar_temp, an HTML
   deck, a paper). Put figures next to the YAML (e.g. `imgs/`). PNG, JPG and SVG all work.
2. Write `slides.yaml` in the format below. One message per slide. Choose the layout from
   the figure's shape: a wide diagram wants full width (`bottom`/`top`), a tall plot sits
   beside the text (`right`/`left`) — mydesign.md §9: never shrink a wide figure into half
   width; change the layout instead.
3. Build:
   ```
   py <skill>/scripts/build_deck.py slides.yaml out.pptx
   ```
   Read every `WARNING:` line. Overflow warnings mean the slide needs fewer words or a split.
4. Check visually (PowerPoint must be installed):
   ```
   powershell -ExecutionPolicy Bypass -File <skill>/scripts/render.ps1 out.pptx render
   py <skill>/scripts/grid.py render 3
   ```
   Look at `render/grid.png`, then any suspicious `render/slide-NN.png` at full size: text
   running into a figure or the footer, equations too small, figures tiny inside a frame.
5. Fix by editing the YAML (shorter text, other layout, `split`, split the slide) and rebuild.
   Do not post-edit the .pptx by hand or with python-pptx: the next build would lose it, and
   hand edits are where the design breaks.

Dependencies: `py -m pip install pyyaml python-pptx pymupdf pillow lxml fonttools`; `pdflatex`
(MiKTeX/TeX Live) for equations.

**Fonts.** The deck uses the HTML deck's fonts: Nunito (titles), Atkinson Hyperlegible (body),
JetBrains Mono (code, page numbers), Noto Sans KR (Korean). They must be installed on the
machine that builds the QA renders *and* the one that presents. Without them PowerPoint
substitutes other fonts: line breaks move, and its fallback for JetBrains Mono garbles some
words. A copy bundled inside a JetBrains IDE does not count — Windows apps cannot see it.
If the fonts are missing, run `py <skill>/scripts/install_fonts.py` (current user, no admin)
and restart PowerPoint.

## slides.yaml

```yaml
slides:
  - layout: cover
    course: APISAT 2026             # course / venue (large, sky-deep)
    kicker: Part 1 · Topic
    title: Talk Title
    presenter: Name$^1$, Name$^2$
    meta: $^1$ Chungbuk National University   # optional bottom line

  - layout: contents                # kicker OVERVIEW, bar 0 %, no number
    items:
      - "**Motivation** — one-line description"

  - layout: part                    # divider; sets kicker + footer section for following slides
    title: Motivation

  - layout: bottom                  # text on top, figures below
    title: Slide Title
    lead: One-line summary          # optional, 23 pt, no bullet
    bullets:
      - "**Label** — one sentence"
    blocks: [ ... ]                 # optional, see Blocks
    figure: imgs/fig.png            # or figures: [a, b, c]
    notes: Speaker notes

  - layout: bottom
    summary: true                   # the closing 정리 slide: kicker SUMMARY, bar 100 %, no number
    title: Summary
    bullets: [...]
    figure: imgs/flow.svg           # mydesign.md: a flow of the parts in order
```

### Layouts (layout.css `data-layout`)

| layout | arrangement | options |
|---|---|---|
| `bottom` | text on top, media below | `cols` |
| `top` | media on top, text below | `cols` |
| `right` | text left, media right; both start at the top edge | `split` = text width % |
| `left` | media left, text right | `split` = media width % |
| `quad` | two columns, each text over its own figures | `split`; `columns: [{bullets, figure}, {…}]` |
| `text` | text only | – |
| `media` | figures only | `cols` |

Shared options: `cols` (figure grid columns; default = number of figures up to 3, 1 beside
text), `col_widths: [2, 1]` (like `--ctpl`), `gap` (px between figures, default 32),
`kicker`, `section`, `progress` (override %), `numbered: false`.
Old names still work: `text-figure`, `lead-figure`, `title-only` → bottom; `text-right` → right
with split 42; `two-figures`/`three-figures` → bottom with 2/3 cols.

**Numbering** (mydesign.md §5): cover, contents, part and `summary` slides carry no number.
The first content slide is `01`, the footer reads `01 / NN` where NN counts numbered slides
only, and the progress bar is number / NN.

### Text

`**bold**` is the dark label (`<strong>`); the rest stays the muted body colour. Lab style is
a bold label, an em dash `—`, then one sentence. `` `code` `` is inline code (mono, sky-deep).
`$...$` is inline math for simple symbols: `$y_c$`, `$b > 0$`, `$\beta$`, `$v_0/K_p$`, `$^1$`.
Fractions, matrices and cases go in an equation figure instead. `bullet_color: leaf|coral`
recolours the bullet dots (`.ul.leaf`, `.ul.coral`).

### Blocks (deck.css body components), under `blocks:` after the bullets

```yaml
blocks:
  - {card: "One sentence to remember.", title: Card title, tone: soft}   # tone: soft | good | warn | omit
  - cards: [{title: A, card: ...}, {title: B, card: ..., tone: good}]      # .grid4, cols: 2 default
  - code: |                     # pre.code
      colcon build
  - {code: "$ ros2 run demo talker", term: true}                         # pre.term (dark)
  - steps: [First step, Second step]                                     # numbered circles
  - checks: [Done thing, Other done thing]                               # green check marks
  - chips: [PX4, ROS 2]                                                  # pill tags
  - terms: [[IMU, inertial measurement unit], [EKF, extended Kalman filter]]   # .std; cols: 2 = .grid8
```
Use cards sparingly (mydesign.md §7): only for the one sentence the audience must keep.

### Figures (`figure:` or each entry of `figures:`)

```yaml
imgs/plot.png                        # image, contain-fit inside a 1px rounded frame
{image: imgs/plot.svg}
{eq: 'M \ddot{y}_c + D \dot{y}_c = F_y', num: 4, defs: "$y_c$ displacement · $M, D$ mass, damping"}
{table: {header: [A, B], rows: [[1, 2]], widths: [40, 60], emphasis: [1], size: 14.5, row: 16}}
{code: "...", term: true}
{video: imgs/flight.mp4, poster: imgs/flight_poster.jpg}   # muted autoplay; autoplay: false / sound: true
- [ {image: a.png, weight: 2}, {eq: ...} ]                 # a list stacks items; weight = height share
```
- Equations are full LaTeX (amsmath: `cases`, `aligned`, `\frac`, `\bm` …) typeset by pdflatex
  and inserted as high-resolution images; `scale:` (default 2.2) enlarges them. Write the number
  key as `num:` — YAML reads a bare `no:` as false. Single-quote LaTeX so `\` survives.
- Quote numbers in table rows (`"0.50"`): YAML reads a bare `0.50` as a float and the trailing zero is lost.
- Slide titles fit one line at about 42 characters and cover titles two lines at about 70; the build warns past that. Put the message in the title, the detail in the lead.
- Tables have no frame and take their natural height; `emphasis` lists columns drawn large
  and blue; `row` is the cell padding (`--trow`). Header text is English (mydesign.md §10).
- Video: always give a poster (print/PDF shows it). Strip audio when encoding (`ffmpeg -an`).

## Fitting content

Body text is 14.5 pt on a 1920×1080 artboard; the script estimates text height on the
generous side so text never runs into figures, which can leave figures a little smaller than
in the HTML deck. If a figure comes out small, shorten the bullets, move detail into `notes`,
switch to `right`/`left`, or split the slide — do not shrink type (mydesign.md §4: nothing
below 24 px).

## Differences from the HTML deck

- Equations are images, not editable text; edit the YAML and rebuild to change one.
- `.steps`, `.checks` and `.std` are listed in mydesign.md but not defined in deck.css; their
  look here (sky number circles, green check marks, bold term + dash) follows the spec's
  descriptions.

## Changing the design itself

The design belongs to the template, not to slides.yaml. Small edits: open
`assets/template.pptx` in PowerPoint → View → Slide Master, edit, save. Keep layout and
placeholder names (`Title and Text`, `Kicker`, `Title`, `Body`, `Footer Section`,
`Footer Number`, …) because the script finds them by name. To regenerate the template from
code, `template-src/` holds the pptxgenjs builder (`build.js`), the post-processor
(`post.py`) and `repack.sh`. Card, code and table colours live in the constants at the top of
`scripts/build_deck.py`.

In the labseminar_temp repository, `template/template.yaml` is the starting deck: the six slides of
`design/template.html` (cover, contents, part divider, text + table, equation, figure).
Copy it next to your figures and edit it.
