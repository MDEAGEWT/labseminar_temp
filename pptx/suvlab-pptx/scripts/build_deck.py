"""Build an SUV Lab seminar deck (.pptx) from a slides.yaml file.

    py build_deck.py slides.yaml out.pptx

The script only fills assets/template.pptx. Fonts, colours and sizes come from the
template and from the constants below, which mirror labseminar_temp's deck.css and
layout.css; the YAML carries content alone. See SKILL.md for the YAML format.
"""
import hashlib, os, re, shutil, subprocess, sys, tempfile

try:
    import yaml
    from pptx import Presentation
    from pptx.util import Emu, Pt
    from pptx.enum.shapes import MSO_SHAPE
    from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
    from pptx.dml.color import RGBColor
    from pptx.oxml.ns import qn
    from lxml import etree
    import pymupdf
    from PIL import Image
except ImportError as e:
    sys.exit(f"missing package: {e.name}. Run: py -m pip install pyyaml python-pptx pymupdf pillow lxml")

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, '..', 'assets', 'template.pptx')
PX = 914400 / 144                      # 1 css px of the 1920x1080 artboard in EMU

# deck.css tokens
def rgb(h): return RGBColor.from_string(h)
SKY, SKY_DEEP, SKY_SOFT = rgb('3B82F6'), rgb('1D4ED8'), rgb('DBEAFE')
LEAF, LEAF_SOFT, LEAF_DEEP = rgb('22C55E'), rgb('DCFCE7'), rgb('16A34A')
CORAL_SOFT = rgb('FEE2E2')
INK, MUTED, SUBTLE = rgb('0F172A'), rgb('475569'), rgb('94A3B8')
SURFACE, SUNKEN, OUTLINE = rgb('F8FAFC'), rgb('F1F5F9'), rgb('E2E8F0')
MONO = 'JetBrains Mono'
TONES = {  # .card variants: fill, border, title colour
    None: (SURFACE, OUTLINE, SKY_DEEP), 'soft': (SKY_SOFT, rgb('BFDBFE'), SKY_DEEP),
    'good': (LEAF_SOFT, rgb('BBF7D0'), LEAF_DEEP), 'warn': (CORAL_SOFT, rgb('FECACA'), rgb('B91C1C')),
}
BULLET_COLORS = {'sky': '3B82F6', 'leaf': '22C55E', 'coral': 'F87171'}

# layout.css geometry (px)
BODY_X, BODY_Y, BODY_W, BODY_BOTTOM = 112, 274, 1696, 950
GAP = 28            # .body[data-layout] gap between text and media
TEXT_GAP = 18       # .body-text gap between blocks
FIG_GAP = 32        # gap between figures
BODY_PX, LEAD_PX = 29, 46
TITLE_MAX, COVER_TITLE_MAX = 42, 70   # one line of 76 px Nunito in 1500 px; two lines of 84 px on the cover

LAYOUTS = {  # yaml layout -> (mode, defaults)
    'bottom': ('bottom', {}), 'top': ('top', {}), 'right': ('right', {}), 'left': ('left', {}),
    'quad': ('quad', {}), 'text': ('text', {}), 'media': ('media', {}),
    # older names kept so existing slides.yaml files still build
    'text-figure': ('bottom', {}), 'lead-figure': ('bottom', {}), 'title-only': ('bottom', {}),
    'text-right': ('right', {'split': 42}), 'two-figures': ('bottom', {'cols': 2}),
    'three-figures': ('bottom', {'cols': 3}),
}
SPECIAL = ('cover', 'part', 'contents')
WARN = []

# ---------------------------------------------------------------- inline text
GREEK = {n: c for n, c in zip(
    'alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi rho sigma tau upsilon phi varphi chi psi omega'.split(),
    'αβγδϵεζηθϑικλμνξπρστυϕφχψω')}
GREEK.update({n: c for n, c in zip('Gamma Delta Theta Lambda Xi Pi Sigma Phi Psi Omega'.split(), 'ΓΔΘΛΞΠΣΦΨΩ')})
SYMS = {'cdot': '·', 'times': '×', 'le': '≤', 'leq': '≤', 'ge': '≥', 'geq': '≥', 'ne': '≠', 'neq': '≠',
        'pm': '±', 'approx': '≈', 'to': '→', 'rightarrow': '→', 'leftarrow': '←', 'infty': '∞',
        'partial': '∂', 'nabla': '∇', 'sum': '∑', 'int': '∫', 'in': '∈', 'deg': '°', 'circ': '°',
        'ldots': '…', 'dots': '…', 'quad': ' ', ',': ' ', ' ': ' ', '%': '%', '{': '{', '}': '}'}
ACCENTS = {'dot': '\u0307', 'ddot': '\u0308', 'hat': '\u0302', 'bar': '\u0304', 'tilde': '\u0303', 'vec': '\u20d7'}


def _group(s, i):
    """Return (content, next_index) for a {...} group or a single token at s[i]."""
    if i < len(s) and s[i] == '{':
        depth, j = 0, i
        while j < len(s):
            depth += {'{': 1, '}': -1}.get(s[j], 0)
            if depth == 0:
                return s[i + 1:j], j + 1
            j += 1
        return s[i + 1:], len(s)
    if i < len(s) and s[i] == '\\':
        m = re.match(r'\\([A-Za-z]+|.)', s[i:])
        return m.group(0), i + len(m.group(0))
    return (s[i], i + 1) if i < len(s) else ('', i)


def math_runs(s, base=0, upright=False):
    """A tiny LaTeX subset -> [(text, italic, baseline)] for inline math."""
    out, i = [], 0
    while i < len(s):
        c = s[i]
        if c in '_^':
            g, i = _group(s, i + 1)
            out += math_runs(g, -25000 if c == '_' else 30000, upright)
        elif c == '\\':
            m = re.match(r'\\([A-Za-z]+|.)', s[i:])
            name, i = m.group(1), i + len(m.group(0))
            if name in ('text', 'mathrm', 'textrm', 'operatorname'):
                g, i = _group(s, i)
                out += math_runs(g, base, True)
            elif name in ('mathbf', 'boldsymbol', 'bm', 'mathit'):
                g, i = _group(s, i)
                out += math_runs(g, base, upright)
            elif name in ACCENTS:
                g, i = _group(s, i)
                sub = math_runs(g, base, upright)
                if sub:
                    t, it, b = sub[-1]
                    sub[-1] = (t + ACCENTS[name], it, b)
                out += sub
            elif name == 'frac':
                a, i = _group(s, i)
                b, i = _group(s, i)
                out += math_runs(a, base, upright) + [('/', False, base)] + math_runs(b, base, upright)
            elif name in ('left', 'right', 'big', 'Big', 'displaystyle'):
                pass
            elif name in GREEK:
                out.append((GREEK[name], not upright and name[0].islower(), base))
            else:
                out.append((SYMS.get(name, name), False, base))
        elif c == ' ':
            i += 1
        elif c == ',':
            out.append((', ', False, base)); i += 1
        elif c in '=<>':
            out.append((f' {c} ', False, base)); i += 1
        elif c in '+-' and base == 0 and out:
            out.append((f' {"−" if c == "-" else c} ', False, base)); i += 1
        elif c in '{}':
            i += 1
        else:
            out.append((c, c.isalpha() and not upright, base)); i += 1
    return out


def rich(text):
    """'**bold** text $y_c$ `code`' -> [(text, bold, italic, baseline, code)], merged."""
    runs = []
    for c, chunk in enumerate(re.split(r'`([^`]+)`', str(text))):
        if c % 2:                                  # .ul code: mono, sky-deep
            runs.append((chunk, False, False, 0, True))
            continue
        for k, part in enumerate(re.split(r'(\*\*.+?\*\*)', chunk)):
            bold = k % 2 == 1
            part = part[2:-2] if bold else part
            for j, seg in enumerate(re.split(r'(?<!\\)\$(.+?)(?<!\\)\$', part)):
                if j % 2:
                    runs += [(t, bold, it, b, False) for t, it, b in math_runs(seg)]
                elif seg:
                    runs.append((seg.replace('\\$', '$'), bold, False, 0, False))
    merged = []
    for r in runs:
        if merged and merged[-1][1:] == r[1:]:
            merged[-1] = (merged[-1][0] + r[0],) + r[1:]
        else:
            merged.append(r)
    return merged


def plain(text):
    return ''.join(r[0] for r in rich(text))


def set_mono(run):
    """Monospace run, flagged fixed-pitch."""
    run.font.name = MONO
    latin = run._r.get_or_add_rPr().find(qn('a:latin'))
    latin.set('pitchFamily', '49'); latin.set('charset', '0')


def write_runs(paragraph, text, size_pt=None, color=None, bold_color=INK, font=None):
    """Write rich text. Bold runs take the ink colour (the deck's <strong>)."""
    for t, bold, italic, base, code in rich(text):
        r = paragraph.add_run()
        r.text = t
        if code:
            set_mono(r)
            r.font.color.rgb = SKY_DEEP
            if size_pt:
                r.font.size = Pt(size_pt * 0.86)
            continue
        if bold:
            r.font.bold = True
            if bold_color is not None:
                r.font.color.rgb = bold_color
        elif color is not None:
            r.font.color.rgb = color
        if italic:
            r.font.italic = True
        if base:
            r._r.get_or_add_rPr().set('baseline', str(base))
        if size_pt:
            r.font.size = Pt(size_pt)
        if font == MONO:
            set_mono(r)
        elif font:
            r.font.name = font


def _ppr_reset(p):
    pPr = p._p.get_or_add_pPr()
    for tag in ('a:buNone', 'a:buChar', 'a:buAutoNum', 'a:buClr', 'a:buSzPct', 'a:buFont'):
        for el in pPr.findall(qn(tag)):
            pPr.remove(el)
    return pPr


def no_bullet(p):
    pPr = _ppr_reset(p)
    pPr.set('marL', '0'); pPr.set('indent', '0')
    pPr.append(pPr.makeelement(qn('a:buNone'), {}))


def bullet(p, char='●', color='3B82F6', indent_px=34, size_pct=80000):
    """Explicit bullet, for text boxes and for colour variants (.ul.leaf / .ul.coral)."""
    pPr = _ppr_reset(p)
    pPr.set('marL', str(int(indent_px * PX))); pPr.set('indent', str(int(-indent_px * PX)))
    clr = pPr.makeelement(qn('a:buClr'), {})
    clr.append(clr.makeelement(qn('a:srgbClr'), {'val': color}))
    pPr.append(clr)
    pPr.append(pPr.makeelement(qn('a:buSzPct'), {'val': str(size_pct)}))
    pPr.append(pPr.makeelement(qn('a:buFont'), {'typeface': 'Arial'}))
    pPr.append(pPr.makeelement(qn('a:buChar'), {'char': char}))


def lines_of(text, width_px, size_px, em=0.5):
    """Line count for wrapped text (~0.5 em per char: conservative, so text never runs into figures)."""
    per = max(1, int(width_px / (size_px * em)))
    return max(1, -(-len(plain(text)) // per))


def textbox(slide, x, y, w, h, anchor=MSO_ANCHOR.TOP, name=None):
    tb = slide.shapes.add_textbox(Emu(int(x * PX)), Emu(int(y * PX)), Emu(int(w * PX)), Emu(int(h * PX)))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    if name:
        tb.name = name
    return tb, tf


def box(slide, x, y, w, h, fill, line, radius_px, name):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(int(x * PX)), Emu(int(y * PX)),
                               Emu(int(w * PX)), Emu(int(h * PX)))
    s.adjustments[0] = min(0.5, radius_px / max(1, min(w, h)))
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid(); s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line; s.line.width = Pt(0.75)
    s.shadow.inherit = False
    s.name = name
    return s

# ---------------------------------------------------------------- text area
def bullets_of(spec):
    return spec.get('bullets') or []


def text_height(spec, w):
    """Estimated px height of a text area: lead, bullets, then blocks."""
    parts = []
    if spec.get('lead'):
        parts.append(lines_of(spec['lead'], w, LEAD_PX) * LEAD_PX * 1.35)
    bl = bullets_of(spec)
    if bl:
        parts.append(sum(lines_of(b, w - 34, BODY_PX) * BODY_PX * 1.35 + 14 for b in bl) - 14)
    for blk in spec.get('blocks') or []:
        parts.append(block_height(blk, w))
    return sum(parts) + TEXT_GAP * max(0, len(parts) - 1)


def fill_body(tf, spec, as_textbox=False):
    """Lead (unbulleted, 23pt) then bullets in one text frame."""
    paras = ([('lead', spec['lead'])] if spec.get('lead') else []) + [('b', b) for b in bullets_of(spec)]
    color = BULLET_COLORS.get(spec.get('bullet_color') or 'sky')
    for k, (kind, text) in enumerate(paras):
        p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
        if as_textbox:
            p.line_spacing = 1.15              # the Body placeholder's lnSpc; a bare text box defaults to 1.0
        if kind == 'lead':
            write_runs(p, text, size_pt=23, color=MUTED if as_textbox else None)
            no_bullet(p)
            p.space_after = Pt(TEXT_GAP / 2 + 7)
        else:
            write_runs(p, text, size_pt=14.5 if as_textbox else None, color=MUTED if as_textbox else None)
            if as_textbox or color != '3B82F6':
                bullet(p, color=color)
            p.space_after = Pt(7)


def text_area(slide, ph, x, y, w, h, spec, label):
    """Put lead + bullets into the Body placeholder (or a text box), then draw blocks below."""
    need = text_height(spec, w)
    if need > h * 1.03:
        WARN.append(f'{label}: text likely overflows its area (~{need:.0f}px for {h:.0f}px). '
                    'Shorten it, move detail to notes, or split the slide.')
    top = y
    if spec.get('lead') or bullets_of(spec):
        th = text_height({k: spec.get(k) for k in ('lead', 'bullets')}, w)
        if ph is not None:
            ph.left, ph.top, ph.width, ph.height = (Emu(int(v * PX)) for v in (x, y, w, th + 4))
            fill_body(ph.text_frame, spec)
        else:
            _, tf = textbox(slide, x, y, w, th + 4, name='Body')
            fill_body(tf, spec, as_textbox=True)
        top += th + TEXT_GAP
    elif ph is not None:
        ph._element.getparent().remove(ph._element)
    for blk in spec.get('blocks') or []:
        top += draw_block(slide, blk, x, top, w) + TEXT_GAP

# ---------------------------------------------------------------- blocks (.card, pre.code, ...)
def code_size(w):
    return 24 if w < 1000 else 30          # deck.css: half-width code drops to 24px


def block_height(blk, w):
    if 'card' in blk:
        if blk.get('_h'):
            return blk['_h']
        title = blk.get('title')
        return 56 + (36 * 1.3 + 14 if title else 0) + lines_of(blk['card'], w - 64, BODY_PX) * BODY_PX * 1.4
    if 'cards' in blk:
        cols = blk.get('cols', 2)
        cw = (w - 28 * (cols - 1)) / cols
        rows = [blk['cards'][i:i + cols] for i in range(0, len(blk['cards']), cols)]
        return sum(max(block_height(c, cw) for c in r) for r in rows) + 28 * (len(rows) - 1)
    if 'code' in blk:
        n = len(str(blk['code']).rstrip('\n').split('\n'))
        return n * code_size(w) * 1.5 + 44
    if 'steps' in blk or 'checks' in blk:
        items = blk.get('steps') or blk.get('checks')
        return sum(max(40, lines_of(t, w - 56, BODY_PX) * BODY_PX * 1.35) + 14 for t in items) - 14
    if 'chips' in blk:
        x, rows = 0, 1
        for c in blk['chips']:
            cw = len(plain(c)) * 26 * 0.6 + 36
            if x + cw > w:
                rows, x = rows + 1, 0
            x += cw + 12
        return rows * 46 + (rows - 1) * 12
    if 'terms' in blk:
        cols = blk.get('cols', 1)
        cw = (w - 44 * (cols - 1)) / cols
        per = -(-len(blk['terms']) // cols)
        col_items = [blk['terms'][i * per:(i + 1) * per] for i in range(cols)]
        return max(sum(lines_of(f'{t} — {d}', cw, BODY_PX) * BODY_PX * 1.35 + 20 for t, d in c) - 20
                   for c in col_items if c)
    sys.exit(f'unknown block: {blk}')


def draw_block(slide, blk, x, y, w):
    h = block_height(blk, w)
    if 'card' in blk:
        fill, line, tcol = TONES[blk.get('tone')]
        box(slide, x, y, w, h, fill, line, 20, 'Card')
        _, tf = textbox(slide, x + 32, y + 28, w - 64, h - 56)
        p = tf.paragraphs[0]
        if blk.get('title'):
            write_runs(p, blk['title'], size_pt=18, color=tcol, bold_color=tcol, font='+mj-lt')
            for r in p.runs:
                r.font.bold = True
            p.space_after = Pt(7)
            p = tf.add_paragraph()
        write_runs(p, blk['card'], size_pt=14.5, color=MUTED)
    elif 'cards' in blk:
        cols = blk.get('cols', 2)
        cw = (w - 28 * (cols - 1)) / cols
        rows = [blk['cards'][i:i + cols] for i in range(0, len(blk['cards']), cols)]
        cy = y
        for r in rows:
            rh = max(block_height(c, cw) for c in r)
            for k, c in enumerate(r):
                draw_block(slide, dict(c, _h=rh), x + k * (cw + 28), cy, cw)
            cy += rh + 28
    elif 'code' in blk:
        term = blk.get('term')
        box(slide, x, y, w, h, INK if term else SUNKEN, INK if term else OUTLINE, 14, 'Terminal' if term else 'Code')
        _, tf = textbox(slide, x + 26, y + 22, w - 52, h - 44)
        tf.word_wrap = False
        for k, line in enumerate(str(blk['code']).rstrip('\n').split('\n')):
            p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
            r = p.add_run(); r.text = line or ' '
            set_mono(r); r.font.size = Pt(code_size(w) / 2)
            r.font.color.rgb = rgb('E2E8F0') if term else INK
            p.line_spacing = 1.25
    elif 'steps' in blk or 'checks' in blk:
        steps = 'steps' in blk
        cy = y
        for k, t in enumerate(blk.get('steps') or blk.get('checks')):
            th = max(40, lines_of(t, w - 56, BODY_PX) * BODY_PX * 1.35)
            if steps:   # number in a sky circle
                c = slide.shapes.add_shape(MSO_SHAPE.OVAL, Emu(int(x * PX)), Emu(int(cy * PX)),
                                           Emu(int(40 * PX)), Emu(int(40 * PX)))
                c.fill.solid(); c.fill.fore_color.rgb = SKY; c.line.fill.background(); c.shadow.inherit = False
                c.name = 'Step'
                tf = c.text_frame
                tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
                tf.vertical_anchor = MSO_ANCHOR.MIDDLE
                p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
                r = p.add_run(); r.text = str(k + 1)
                r.font.bold = True; r.font.size = Pt(13); r.font.name = '+mj-lt'; r.font.color.rgb = rgb('FFFFFF')
            else:       # leaf check mark
                _, tf = textbox(slide, x, cy, 40, 40, MSO_ANCHOR.TOP, 'Check')
                r = tf.paragraphs[0].add_run(); r.text = '✓'
                r.font.bold = True; r.font.size = Pt(16); r.font.color.rgb = LEAF_DEEP
            _, tf = textbox(slide, x + 56, cy + (2 if steps else 0), w - 56, th)
            write_runs(tf.paragraphs[0], t, size_pt=14.5, color=MUTED)
            cy += th + 14
    elif 'chips' in blk:
        cx, cy = x, y
        for c in blk['chips']:
            cw = len(plain(c)) * 26 * 0.6 + 36
            if cx + cw > x + w:
                cx, cy = x, cy + 58
            s = box(slide, cx, cy, cw, 46, SKY_SOFT, None, 23, 'Chip')
            tf = s.text_frame
            tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
            write_runs(p, c, size_pt=13, color=SKY_DEEP, bold_color=SKY_DEEP, font='+mj-lt')
            for r in p.runs:
                r.font.bold = True
            cx += cw + 12
    elif 'terms' in blk:
        cols = blk.get('cols', 1)
        cw = (w - 44 * (cols - 1)) / cols
        per = -(-len(blk['terms']) // cols)
        for i in range(cols):
            items = blk['terms'][i * per:(i + 1) * per]
            if not items:
                continue
            _, tf = textbox(slide, x + i * (cw + 44), y, cw, h, name='Terms')
            for k, (t, d) in enumerate(items):
                p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
                write_runs(p, f'**{t}** — {d}', size_pt=14.5, color=MUTED)
                p.space_after = Pt(10)
    else:
        sys.exit(f'unknown block: {blk}')
    return h

# ---------------------------------------------------------------- equations
def latex_png(tex, cache):
    key = hashlib.sha1(tex.encode()).hexdigest()[:16]
    png = os.path.join(cache, f'eq_{key}.png')
    if os.path.exists(png):
        return png
    if not shutil.which('pdflatex'):
        sys.exit('pdflatex not found: install MiKTeX or TeX Live to typeset equations')
    work = tempfile.mkdtemp()
    src = ('\\documentclass[preview,border=1pt]{standalone}\n'
           '\\usepackage{amsmath,amssymb,bm}\n\\usepackage[dvipsnames]{xcolor}\n'
           '\\begin{document}\\color[HTML]{0F172A}$\\displaystyle ' + tex + '$\\end{document}\n')
    open(os.path.join(work, 'eq.tex'), 'w', encoding='utf-8').write(src)
    r = subprocess.run(['pdflatex', '-interaction=nonstopmode', '-halt-on-error', 'eq.tex'],
                       cwd=work, capture_output=True, text=True, errors='replace')
    if r.returncode != 0:
        err = '\n'.join(l for l in r.stdout.splitlines() if l.startswith('!') or l.startswith('l.'))
        sys.exit(f'LaTeX error in equation:\n  {tex}\n{err}')
    pdf = pymupdf.open(os.path.join(work, 'eq.pdf'))
    pdf[0].get_pixmap(dpi=600, alpha=True).save(png)
    shutil.rmtree(work, ignore_errors=True)
    return png


def place_picture(slide, png, x, y, w, h, align_top=False, natural_w=None):
    """Contain-fit a picture in the px box. natural_w: preferred width in px (equations)."""
    iw, ih = Image.open(png).size
    if natural_w:
        pw, ph = natural_w, natural_w * ih / iw
        f = min(1, w / pw, h / ph)
    else:
        pw, ph, f = iw, ih, min(w / iw, h / ih)
    pw, ph = pw * f, ph * f
    left = x + (w - pw) / 2
    top = y if align_top else y + (h - ph) / 2
    return slide.shapes.add_picture(png, Emu(int(left * PX)), Emu(int(top * PX)), Emu(int(pw * PX)), Emu(int(ph * PX)))


def equation(slide, item, x, y, w, h, cache):
    """.eq box: formula centred, number at the right edge, symbol notes under a rule."""
    tex = item['eq']
    num = item.get('num', item.get(False))     # YAML reads a bare `no:` key as False
    png = latex_png(tex, cache)
    iw, ih = Image.open(png).size
    nat_w = iw / 600 * 72 * item.get('scale', 2.2) * 2      # 10pt LaTeX -> 22pt on the slide, in px
    nat_h = nat_w * ih / iw
    defs = item.get('defs')
    defs = [defs] if isinstance(defs, str) else (defs or [])
    padx, pady = 22, 18
    num_w = 68 if num is not None else 0
    defs_h = sum(lines_of(d, w - 2 * padx, 24) * 24 * 1.4 for d in defs) + 24 if defs else 0
    eq_h = min(nat_h, h - defs_h - 2 * pady)
    top = y + (h - eq_h - defs_h) / 2
    pic = place_picture(slide, png, x + padx + num_w, top, w - 2 * padx - 2 * num_w, eq_h, natural_w=nat_w)
    if pic.width < nat_w * PX * 0.7:
        WARN.append(f'equation shrunk to fit its box: {tex[:40]}  (give it a wider/taller cell or lower scale)')
    if num is not None:
        no = str(num); no = no if no.startswith('(') else f'({no})'
        _, tf = textbox(slide, x + w - padx - num_w, top, num_w, eq_h, MSO_ANCHOR.MIDDLE, 'Equation Number')
        p = tf.paragraphs[0]; p.alignment = PP_ALIGN.RIGHT
        write_runs(p, no, size_pt=12, color=SUBTLE, font=MONO)
    if defs:
        ly = top + eq_h + 12
        ln = slide.shapes.add_connector(1, Emu(int((x + padx) * PX)), Emu(int(ly * PX)),
                                        Emu(int((x + w - padx) * PX)), Emu(int(ly * PX)))
        ln.line.color.rgb = OUTLINE; ln.line.width = Pt(0.75)
        _, tf = textbox(slide, x + padx, ly + 12, w - 2 * padx, defs_h - 24, name='Equation Notes')
        for k, d in enumerate(defs):
            p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
            write_runs(p, d, size_pt=12, color=MUTED)

# ---------------------------------------------------------------- tables
def table_height(spec):
    size = spec.get('size', 14.5)
    row = spec.get('row', 16)                   # --trow
    return (len(spec['rows']) + 1) * (size * 2 * 1.3 + 2 * row)


def table(slide, item, x, y, w, h):
    spec = item['table']
    header, rows = spec['header'], spec['rows']
    widths = spec.get('widths') or [1] * len(header)
    size, row = spec.get('size', 14.5), spec.get('row', 16)
    th = min(h, table_height(spec))
    shape = slide.shapes.add_table(len(rows) + 1, len(header), Emu(int(x * PX)), Emu(int(y * PX)),
                                   Emu(int(w * PX)), Emu(int(th * PX)))
    shape.name = 'Table'
    tbl = shape.table
    tblPr = tbl._tbl.tblPr
    tblPr.set('firstRow', '0'); tblPr.set('bandRow', '0')
    for el in tblPr.findall(qn('a:tableStyleId')):
        tblPr.remove(el)
    tot = sum(widths)
    for j, wd in enumerate(widths):
        tbl.columns[j].width = Emu(int(w * PX * wd / tot))
    for i in range(len(rows) + 1):
        tbl.rows[i].height = Emu(int(th / (len(rows) + 1) * PX))
    emph = spec.get('emphasis') or []          # columns set large and blue (e.g. a Question column)
    for i, vals in enumerate([header] + rows):
        for j, val in enumerate(vals):
            cell = tbl.cell(i, j)
            cell.fill.background()
            cell.margin_left = Emu(0 if j == 0 else int(20 * PX))
            cell.margin_right = Emu(0 if j == len(vals) - 1 else int(20 * PX))
            cell.margin_top = cell.margin_bottom = Emu(int((row if i else 4) * PX))
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE if i else MSO_ANCHOR.BOTTOM
            p = cell.text_frame.paragraphs[0]
            if i == 0:                         # .tbl th: Nunito 26px sky-deep; first column ink
                c = INK if j == 0 else SKY_DEEP
                write_runs(p, val, size_pt=13, color=c, bold_color=c, font='+mj-lt')
                for r in p.runs:
                    r.font.bold = True
            elif j == 0:                       # first column: ink, bold
                write_runs(p, val, size_pt=size, color=INK)
                for r in p.runs:
                    r.font.bold = True
            elif j in emph:
                write_runs(p, val, size_pt=16, color=SKY_DEEP, bold_color=SKY_DEEP, font='+mj-lt')
                for r in p.runs:
                    r.font.bold = True
            else:
                write_runs(p, val, size_pt=size, color=MUTED)
            tcPr = cell._tc.get_or_add_tcPr()
            for k, side in enumerate(('a:lnL', 'a:lnR', 'a:lnT', 'a:lnB')):   # borders precede the fill
                ln = tcPr.makeelement(qn(side), {'w': '0'})
                if side == 'a:lnB' and i < len(rows):
                    ln.set('w', str(int(Pt(2.25 if i == 0 else 0.75))))
                    fill = ln.makeelement(qn('a:solidFill'), {})
                    fill.append(fill.makeelement(qn('a:srgbClr'), {'val': 'DBEAFE' if i == 0 else 'E2E8F0'}))
                    ln.append(fill)
                else:
                    ln.append(ln.makeelement(qn('a:noFill'), {}))
                tcPr.insert(k, ln)
    return th

# ---------------------------------------------------------------- media (figures)
def image_png(path, cache):
    if not os.path.exists(path):
        sys.exit(f'figure not found: {path}')
    if path.lower().endswith('.svg'):
        out = os.path.join(cache, 'svg_' + hashlib.sha1(os.path.abspath(path).encode()).hexdigest()[:16] + '.png')
        if not os.path.exists(out):
            pymupdf.open(path)[0].get_pixmap(matrix=pymupdf.Matrix(3, 3), alpha=False).save(out)
        return out
    return path


AUTOPLAY = ('<p:timing xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:tnLst><p:par>'
            '<p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:par><p:cTn id="2" fill="hold">'
            '<p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst>'
            '<p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
            '<p:par><p:cTn id="4" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="afterEffect">'
            '<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr>'
            '<p:cTn id="5" dur="1" fill="hold"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:cmd>'
            '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>'
            '<p:video><p:cMediaNode vol="0" mute="1"><p:cTn id="6" fill="hold" display="0"><p:stCondLst>'
            '<p:cond delay="indefinite"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'
            '</p:cMediaNode></p:video></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>')


def video(slide, item, x, y, w, h, align_top):
    poster = item.get('poster')
    if not poster:
        WARN.append(f'video without poster: {item["video"]} (print and PDF show a black box)')
    mv = slide.shapes.add_movie(item['video'], Emu(int(x * PX)), Emu(int(y * PX)), Emu(int(w * PX)), Emu(int(h * PX)),
                                poster_frame_image=poster, mime_type='video/mp4')
    mv.name = 'Video'
    if poster:   # keep the poster's aspect ratio
        iw, ih = Image.open(poster).size
        f = min(w / iw, h / ih)
        mv.width, mv.height = Emu(int(iw * f * PX)), Emu(int(ih * f * PX))
        mv.left = Emu(int((x + (w - iw * f) / 2) * PX))
        mv.top = Emu(int((y if align_top else y + (h - ih * f) / 2) * PX))
    # deck default (mydesign.md 9-1): muted autoplay. autoplay: false / sound: true opt out.
    if item.get('autoplay', True):
        sld = slide._element
        for t in sld.findall(qn('p:timing')):
            sld.remove(t)
        timing = etree.fromstring(AUTOPLAY.replace('{spid}', str(mv.shape_id)))
        if item.get('sound'):
            node = timing.find('.//' + qn('p:cMediaNode'))
            del node.attrib['mute']; node.set('vol', '80000')
        ext = sld.find(qn('p:extLst'))
        if ext is not None:
            ext.addprevious(timing)
        else:
            sld.append(timing)


def item_fixed_height(it, w):
    if isinstance(it, dict) and 'table' in it:
        return table_height(it['table'])
    if isinstance(it, dict) and 'code' in it:
        return block_height(it, w)
    return None


def cell(slide, item, x, y, w, h, cache, align_top=False):
    """One figure cell: image, eq, table, code, video, or a list stacked vertically."""
    if isinstance(item, list):
        gap = 18
        weights = [it.get('weight', 1) if isinstance(it, dict) else 1 for it in item]
        fixed = [item_fixed_height(it, w) for it in item]
        free = h - gap * (len(item) - 1) - sum(f for f in fixed if f)
        flex = sum(wt for wt, f in zip(weights, fixed) if not f) or 1
        for it, wt, f in zip(item, weights, fixed):
            hh = f if f else free * wt / flex
            cell(slide, it, x, y, w, hh, cache, align_top)
            y += hh + gap
        return
    if isinstance(item, str):
        item = {'image': item}
    if 'table' in item:
        table(slide, item, x, y, w, h); return
    if 'code' in item:
        draw_block(slide, item, x, y, w); return
    box(slide, x, y, w, h, None, OUTLINE, 14 if 'eq' in item else 16, 'Frame')   # figure.fig .frame / .eq
    pad = 0 if 'eq' in item else 8
    ix, iy, iw, ih = x + pad, y + pad, w - 2 * pad, h - 2 * pad
    if 'image' in item:
        place_picture(slide, image_png(item['image'], cache), ix, iy, iw, ih, align_top)
    elif 'eq' in item:
        equation(slide, item, ix, iy, iw, ih, cache)
    elif 'video' in item:
        video(slide, item, ix, iy, iw, ih, align_top)
    else:
        sys.exit(f'unknown figure item: {item}')


def media_area(slide, figs, x, y, w, h, cache, cols, gap, col_widths=None, align_top=False, label=''):
    """.body-media: a uniform grid; rows holding only tables/code get their natural height."""
    if not figs:
        return
    if h < 150:
        WARN.append(f'{label}: only {h:.0f}px left for figures. Shorten the text or split the slide.')
    cols = 1 if len(figs) == 1 else max(1, min(cols, len(figs)))   # a lone figure takes the full width
    cw_list = (col_widths or [1] * cols)[:cols]
    widths = [(w - gap * (cols - 1)) * c / sum(cw_list) for c in cw_list]
    rows = [figs[i:i + cols] for i in range(0, len(figs), cols)]
    fixed = []
    for r in rows:
        hs = [item_fixed_height(it, widths[k]) for k, it in enumerate(r)]
        fixed.append(max(hs) if all(v is not None for v in hs) else None)
    flex_n = sum(1 for f in fixed if f is None)
    free = h - gap * (len(rows) - 1) - sum(f for f in fixed if f is not None)
    cy = y
    for r, fh in zip(rows, fixed):
        rh = fh if fh is not None else max(60, free / max(1, flex_n))
        cx = x
        for k, it in enumerate(r):
            cell(slide, it, cx, cy, widths[k], rh, cache, align_top)
            cx += widths[k] + gap
        cy += rh + gap

# ---------------------------------------------------------------- slides
def layout_by_name(prs, name):
    for lay in prs.slide_layouts:
        if lay.name == name:
            return lay
    sys.exit(f'layout not in template: {name}')


def figures_of(spec):
    return spec.get('figures') or ([spec['figure']] if spec.get('figure') else [])


def has_text(spec):
    return any(spec.get(k) for k in ('lead', 'bullets', 'blocks'))


def content_body(slide, s, key, body_ph, cache, label):
    mode, defaults = LAYOUTS[key]
    opt = dict(defaults, **{k: v for k, v in s.items() if k in ('split', 'cols', 'gap', 'col_widths')})
    figs = figures_of(s)
    gap = opt.get('gap', FIG_GAP)
    x, y, W, H = BODY_X, BODY_Y, BODY_W, BODY_BOTTOM - BODY_Y
    cols = opt.get('cols', 1 if mode in ('right', 'left') else min(3, max(1, len(figs))))
    cw = opt.get('col_widths')

    def drop_body():
        if body_ph is not None:
            body_ph._element.getparent().remove(body_ph._element)

    if mode == 'quad':
        columns = s.get('columns') or []
        first = W * opt['split'] / 100 if opt.get('split') else (W - 44) / 2
        widths, cx = [first, W - first - 44], x
        for k, col in enumerate(columns[:2]):
            w = widths[k]
            th = text_height(col, w) if has_text(col) else -GAP
            if has_text(col):
                text_area(slide, body_ph if k == 0 else None, cx, y, w, th, col, f'{label} column {k + 1}')
            elif k == 0:
                drop_body()
            media_area(slide, figures_of(col), cx, y + th + GAP, w, H - th - GAP, cache,
                       col.get('cols', 1), gap, label=f'{label} column {k + 1}')
            cx += w + 44
        if not columns:
            drop_body()
        return
    if mode == 'media' or not has_text(s):
        drop_body()
        media_area(slide, figs, x, y, W, H, cache, cols, gap, cw, label=label)
        return
    if mode == 'text' or not figs:
        text_area(slide, body_ph, x, y, W, H, s, label)
        if figs:
            WARN.append(f'{label}: layout "text" ignores its figures')
        return
    if mode in ('bottom', 'top'):
        th = min(text_height(s, W), H - 150)
        mh = H - th - GAP
        ty, my = (y, y + th + GAP) if mode == 'bottom' else (y + mh + GAP, y)
        text_area(slide, body_ph, x, ty, W, th, s, label)
        media_area(slide, figs, x, my, W, mh, cache, cols, gap, cw, label=label)
        return
    # right / left: --split sizes the first track (text for right, media for left)
    first = W * opt['split'] / 100 if opt.get('split') else (W - GAP) / 2
    second = W - first - GAP
    tw, mw = (first, second) if mode == 'right' else (second, first)
    tx, mx = (x, x + tw + GAP) if mode == 'right' else (x + mw + GAP, x)
    text_area(slide, body_ph, tx, y, tw, H, s, label)
    media_area(slide, figs, mx, y, mw, H, cache, cols, gap, cw, align_top=True, label=label)


def build(spec_path, out_path):
    spec = yaml.safe_load(open(spec_path, encoding='utf-8'))
    slides = spec['slides'] if isinstance(spec, dict) else spec
    base = os.path.dirname(os.path.abspath(spec_path))
    cache = os.path.join(base, '.pptx_cache'); os.makedirs(cache, exist_ok=True)
    os.chdir(base)
    prs = Presentation(TEMPLATE)
    sldIdLst = prs.slides._sldIdLst                    # start from an empty deck
    for sldId in list(sldIdLst):
        prs.part.drop_rel(sldId.rId); sldIdLst.remove(sldId)

    # mydesign.md: cover, contents, summary and part slides carry no number; the
    # first content slide is 01 and the total counts numbered slides only.
    # A summary slide may opt back in with an explicit `numbered: true`.
    def numbered(s):
        if s.get('layout', 'bottom') in SPECIAL:
            return False
        if s.get('summary'):
            return s.get('numbered') is True
        return s.get('numbered', True)
    total = sum(1 for s in slides if numbered(s))
    n, section = 0, 'Overview'
    for num, s in enumerate(slides, 1):
        key = s.get('layout', 'bottom')
        label = f'slide {num} "{plain(s.get("title", ""))}"'
        if key not in LAYOUTS and key not in SPECIAL:
            sys.exit(f'{label}: unknown layout "{key}". Use one of: {", ".join(list(LAYOUTS) + list(SPECIAL))}')
        lay = layout_by_name(prs, {'cover': 'Cover', 'part': 'Part Divider', 'contents': 'Contents'}.get(key, 'Title and Text'))
        slide = prs.slides.add_slide(lay)
        by_name = {}
        for lp in lay.placeholders:
            by_name.setdefault(lp.name, []).append(lp.placeholder_format.idx)
        ph = {p.placeholder_format.idx: p for p in slide.placeholders}

        def take(name):
            idx = by_name.get(name, [])
            return ph.pop(idx[0]) if idx and idx[0] in ph else None

        def put(name, text):
            p = take(name)
            if p is not None and text:
                write_runs(p.text_frame.paragraphs[0], text)
            elif p is not None:
                p._element.getparent().remove(p._element)

        if key == 'part':
            section = plain(s['title'])
            put('Part Name', s['title'])
        elif key == 'cover':
            if len(plain(s.get('title', ''))) > COVER_TITLE_MAX:
                WARN.append(f'{label}: cover title is {len(plain(s["title"]))} characters (three lines); '
                            f'keep it within {COVER_TITLE_MAX} so it stays on two lines.')
            for f, nm in (('course', 'Course'), ('kicker', 'Kicker'), ('title', 'Title'),
                          ('presenter', 'Presenter'), ('meta', 'Affiliation')):
                put(nm, s.get(f))
        else:
            is_num = numbered(s)
            sec = s.get('section') or ('Overview' if key == 'contents' else section)
            default_kicker = 'Overview' if key == 'contents' else ('Summary' if s.get('summary') else sec)
            put('Kicker', (s.get('kicker') or default_kicker).upper())
            if len(plain(s.get('title', ''))) > TITLE_MAX:
                WARN.append(f'{label}: title is {len(plain(s["title"]))} characters and will wrap onto the '
                            f'kicker; keep slide titles within {TITLE_MAX}.')
            put('Title', s.get('title') or ('Contents' if key == 'contents' else None))
            put('Footer Section', sec)
            if is_num:
                n += 1
            put('Footer Number', f'{n:02d} / {total:02d}' if is_num else None)
            pct = 0 if key == 'contents' else (100 if s.get('summary') else (n / total * 100 if total else 0))
            pct = s.get('progress', pct)
            track = next(sh for sh in lay.shapes if sh.shape_type == 1 and sh.height == Emu(int(8 * PX))
                         and sh.width > Emu(int(600 * PX)))
            if pct > 0:
                bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, track.left, track.top,
                                             Emu(int(track.width * min(pct, 100) / 100)), track.height)
                bar.adjustments[0] = 0.5; bar.fill.solid(); bar.fill.fore_color.rgb = LEAF
                bar.line.fill.background(); bar.shadow.inherit = False; bar.name = 'Progress'
            body_ph = take('Body')
            if key == 'contents':
                tf = body_ph.text_frame
                for k, it in enumerate(s.get('items') or []):
                    write_runs(tf.paragraphs[0] if k == 0 else tf.add_paragraph(), it)
            else:
                content_body(slide, s, key, body_ph, cache, label)
        for p in list(ph.values()):                 # placeholders that got no content
            p._element.getparent().remove(p._element)
        if s.get('notes'):
            slide.notes_slide.notes_text_frame.text = str(s['notes'])
    prs.save(out_path)
    print(f'wrote {out_path} ({len(slides)} slides, {total} numbered)')
    for w in WARN:
        print('WARNING:', w)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    build(sys.argv[1], os.path.abspath(sys.argv[2]))
