"""Fix up the pptxgenjs output so the layouts behave like a real template."""
import re, sys, glob, os

root = sys.argv[1]
EMU = 914400 / 144                      # css px -> EMU
KR = 'Noto Sans KR'
BULLET_PROMPTS = ('Bullet', 'Section - ')
CENTER_PROMPTS = ('00 / 00', 'SECTION', 'Section', 'Course / Venue', 'PART / TOPIC', 'Presenter Name', 'Affiliation')
NAMES = {'SECTION': 'Kicker', 'Slide Title': 'Title', 'Section': 'Footer Section', 'Course / Venue': 'Course',
         'PART / TOPIC': 'Kicker', 'Presentation Title': 'Title', 'Presenter Name': 'Presenter',
         'Affiliation · Date': 'Affiliation', 'Part Name': 'Part Name', 'Lead sentence': 'Lead',
         'Insert figure': 'Figure', '00 / 00': 'Footer Number'}

def bullet_ppr(lvl_tag='a:lvl1pPr', aft=700):
    m = int(34 * EMU)
    return (f'<{lvl_tag} marL="{m}" indent="-{m}" algn="l"><a:lnSpc><a:spcPct val="115000"/></a:lnSpc>'
            f'<a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="{aft}"/></a:spcAft>'
            '<a:buClr><a:srgbClr val="3B82F6"/></a:buClr><a:buSzPct val="80000"/>'
            '<a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="&#9679;"/>')

def round_geom(sp, radius_px):
    ext = re.search(r'<a:ext cx="(\d+)" cy="(\d+)"/>', sp)
    cx, cy = int(ext.group(1)), int(ext.group(2))
    adj = min(50000, int(radius_px * EMU / min(cx, cy) * 100000))
    return sp.replace('<a:prstGeom prst="rect"><a:avLst></a:avLst></a:prstGeom>',
                      f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val {adj}"/></a:avLst></a:prstGeom>')

PIC = re.compile(r'<p:ph\s+idx="(\d+)"\s+hasCustomPrompt="1"\s*/>')
def typed(t):  # pptxgenjs drops type="pic"
    return PIC.sub(lambda m: f"<p:ph idx=\"{m.group(1)}\" type=\"pic\"/>", t)

def fix_layout(t):
    t = typed(t)
    prompts = {}
    def sp_fix(m):
        sp = m.group(0)
        ph = re.search(r'<p:ph\s+idx="(\d+)"\s+type="(\w+)"', sp)
        if not ph:
            ext = re.search(r'<a:ext cx="(\d+)" cy="(\d+)"/>', sp)
            if ext and 'srgbClr val="E2E8F0"' in sp:          # figure frame
                sp = round_geom(sp, 16)
            elif ext and int(ext.group(2)) in (50800, 76200):  # title rule, cover sun rule, progress track
                sp = round_geom(sp, 999)
            if '<a:ln></a:ln>' in sp:
                sp = sp.replace('<a:ln></a:ln>', '<a:ln><a:noFill/></a:ln>')
            return sp
        idx, typ = ph.groups()
        prompt = re.search(r'<a:t>([^<]*)</a:t>', sp)
        prompt = prompt.group(1) if prompt else ''
        prompts[idx] = (typ, prompt)
        name = 'Figure' if typ == 'pic' else NAMES.get(prompt, 'Body')
        sp = re.sub(r'(<p:cNvPr id="\d+" name=")[^"]*', r'\g<1>' + name, sp, count=1)
        if typ == 'pic':
            return sp
        anchor = 't' if prompt.startswith(BULLET_PROMPTS) else ('ctr' if typ == 'title' or prompt.startswith(CENTER_PROMPTS) else 't')
        autofit = '<a:normAutofit/>' if prompt.startswith(BULLET_PROMPTS) else ''
        sp = re.sub(r'<a:bodyPr[^>]*>(</a:bodyPr>)?|<a:bodyPr[^>]*/>',
                    f'<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="{anchor}">{autofit}</a:bodyPr>', sp, count=1)
        if prompt.startswith(BULLET_PROMPTS):
            sp = sp.replace('<a:lvl1pPr indent="0" marL="0"><a:buNone/>', bullet_ppr(aft=2000 if prompt.startswith('Section - ') else 700))
            sp = sp.replace('<a:pPr indent="0" marL="0"><a:buNone/></a:pPr>', '')
        else:
            lh = '<a:lnSpc><a:spcPct val="100000"/></a:lnSpc>' if typ == 'title' else ''
            algn = 'r' if prompt == '00 / 00' else 'l'
            sp = sp.replace('<a:lvl1pPr indent="0" marL="0"><a:buNone/>', f'<a:lvl1pPr indent="0" marL="0" algn="{algn}">{lh}<a:buNone/>')
        return sp
    t = re.sub(r'<p:sp>.*?</p:sp>', sp_fix, t, flags=re.S)
    return t, prompts

def fix_fonts(t):
    return re.sub(r'<a:ea typeface="[^"]*"', f'<a:ea typeface="{KR}"', t)

layout_ph = {}
for f in glob.glob(os.path.join(root, 'ppt/slideLayouts/slideLayout*.xml')):
    t = open(f, encoding='utf-8').read()
    t, prompts = fix_layout(t)
    t = fix_fonts(t)
    open(f, 'w', encoding='utf-8').write(t)
    layout_ph[os.path.basename(f)] = (prompts, t)

for f in glob.glob(os.path.join(root, 'ppt/slides/slide*.xml')):
    t = open(f, encoding='utf-8').read()
    rels = open(os.path.join(root, 'ppt/slides/_rels', os.path.basename(f) + '.rels'), encoding='utf-8').read()
    t = typed(t)
    lay = re.search(r'slideLayouts/(slideLayout\d+\.xml)', rels).group(1)
    prompts, _ = layout_ph[lay]
    # body text on slides must inherit the layout's bullets
    def sp_fix(m):
        sp = m.group(0)
        ph = re.search(r'<p:ph\s+idx="(\d+)"', sp)
        if ph and prompts.get(ph.group(1), ('', ''))[1].startswith(BULLET_PROMPTS):
            sp = sp.replace('<a:pPr indent="0" marL="0"><a:buNone/></a:pPr>', '')
            sp = re.sub(r'<a:bodyPr[^>]*>(</a:bodyPr>)?', '<a:bodyPr><a:normAutofit/></a:bodyPr>', sp, count=1)
        if ph:   # let position come from the layout
            sp = re.sub(r'<p:spPr>.*?</p:spPr>', '<p:spPr/>', sp, count=1, flags=re.S)
            typ, prm = prompts.get(ph.group(1), ('', ''))
            name = 'Figure' if typ == 'pic' else NAMES.get(prm, 'Body')
            sp = re.sub(r'(<p:cNvPr id="\d+" name=")[^"]*', r'\g<1>' + name, sp, count=1)
        return sp
    t = re.sub(r'<p:sp>.*?</p:sp>', sp_fix, t, flags=re.S)
    present = set(re.findall(r'<p:ph\s+idx="(\d+)"', t))
    ids = [int(i) for i in re.findall(r'<p:cNvPr id="(\d+)"', t)] or [1]
    nid = max(ids) + 1
    inject = ''
    for idx, (typ, prompt) in sorted(prompts.items()):
        if idx in present:
            continue
        name = 'Figure' if typ == 'pic' else NAMES.get(prompt, 'Body')
        body = '' if typ == 'pic' else '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody>'
        inject += (f'<p:sp><p:nvSpPr><p:cNvPr id="{nid}" name="{name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
                   f'<p:nvPr><p:ph type="{typ}" idx="{idx}"/></p:nvPr></p:nvSpPr><p:spPr/>{body}</p:sp>')
        nid += 1
    t = t.replace('</p:spTree>', inject + '</p:spTree>', 1)
    t = fix_fonts(t)
    open(f, 'w', encoding='utf-8').write(t)

for f in glob.glob(os.path.join(root, 'ppt/slideMasters/*.xml')) + glob.glob(os.path.join(root, 'ppt/theme/*.xml')):
    t = open(f, encoding='utf-8').read()
    t = t.replace('<p:titleStyle>  <a:lvl1pPr algn="ctr"', '<p:titleStyle>  <a:lvl1pPr algn="l"')
    t = re.sub(r'(<a:(?:major|minor)Font>\s*<a:latin typeface="[^"]*"[^>]*/>\s*)<a:ea typeface="[^"]*"', rf'\1<a:ea typeface="{KR}"', t)
    open(f, 'w', encoding='utf-8').write(t)
print('ok')
