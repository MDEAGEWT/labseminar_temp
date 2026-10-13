// SUV Lab seminar template (labseminar_temp design) as PowerPoint layouts.
const pptxgen = require('pptxgenjs');
const out = process.argv[2];
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.333 x 7.5 in = 1920 x 1080 px
pres.author = 'SUV Lab';
pres.title = 'SUV Lab Seminar Template';
pres.theme = { headFontFace: 'Nunito', bodyFontFace: 'Atkinson Hyperlegible' };

const P = v => v / 144;                 // css px -> inch
const F = v => v / 2;                   // css px -> pt
const COL = { sky: '3B82F6', skyDeep: '1D4ED8', skySoft: 'DBEAFE', leaf: '22C55E', sun: 'FBBF24',
  ink: '0F172A', muted: '475569', subtle: '94A3B8', sunken: 'F1F5F9', outline: 'E2E8F0', bg: 'FFFFFF' };
const H = 'Nunito', B = 'Atkinson Hyperlegible', M = 'JetBrains Mono';
const LOGO = 'lab_logo.png';            // 400 x 313
const PX = 112, W = 1920 - 2 * PX;
const BODY_Y = 274, BODY_BOTTOM = 950;

// ---------- shared pieces of the content frame ----------
function head() {
  return [
    { image: { path: LOGO, x: P(1808 - 143), y: P(84), w: P(143), h: P(112) } },
    { rect: { x: P(PX), y: P(236), w: P(120), h: P(8), fill: { color: COL.sky } } },
    { placeholder: { options: { name: 'kicker', type: 'body', x: P(PX), y: P(84), w: P(1300), h: P(40),
        fontFace: H, fontSize: F(26), bold: true, color: COL.sky, charSpacing: 1, margin: 0, valign: 'middle' },
        text: 'SECTION' } },
    { placeholder: { options: { name: 'title', type: 'title', x: P(PX), y: P(126), w: P(1500), h: P(96),
        fontFace: H, fontSize: F(76), bold: true, color: COL.ink, margin: 0, valign: 'middle' },
        text: 'Slide Title' } },
  ];
}
function foot() {
  return [
    { placeholder: { options: { name: 'footSec', type: 'body', x: P(PX), y: P(972), w: P(300), h: P(36),
        fontFace: H, fontSize: F(26), color: COL.subtle, margin: 0, valign: 'middle' }, text: 'Section' } },
    { rect: { x: P(430), y: P(986), w: P(1250), h: P(8), fill: { color: COL.sunken } } },
    { placeholder: { options: { name: 'footNum', type: 'body', x: P(1690), y: P(972), w: P(118), h: P(36),
        fontFace: M, fontSize: F(26), color: COL.subtle, align: 'right', margin: 0, valign: 'middle' }, text: '00 / 00' } },
  ];
}
function bodyPh(name, x, y, w, h, prompt, size = 29) {
  return { placeholder: { options: { name, type: 'body', x: P(x), y: P(y), w: P(w), h: P(h),
    fontFace: B, fontSize: F(size), color: COL.muted, margin: 0, valign: 'top' }, text: prompt } };
}
function leadPh(x, y, w, h) {
  return { placeholder: { options: { name: 'lead', type: 'body', x: P(x), y: P(y), w: P(w), h: P(h),
    fontFace: B, fontSize: F(46), color: COL.muted, margin: 0, valign: 'top' }, text: 'Lead sentence' } };
}
function picPh(name, x, y, w, h) {
  return { placeholder: { options: { name, type: 'pic', x: P(x), y: P(y), w: P(w), h: P(h), color: COL.subtle },
    text: 'Insert figure' } };
}
function frame(x, y, w, h) {             // figure frame: 1px outline on white
  return { rect: { x: P(x), y: P(y), w: P(w), h: P(h), fill: { color: COL.bg },
    line: { color: COL.outline, width: 0.75 } } };
}
function content(title, extra) {
  pres.defineSlideMaster({ title, background: { color: COL.bg },
    objects: [...head(), ...extra, ...foot()] });
}

// ---------- layouts ----------
pres.defineSlideMaster({ title: 'Cover', background: { color: COL.skySoft }, objects: [
  { image: { path: LOGO, x: P(PX), y: P(84), w: P(200), h: P(156) } },
  { placeholder: { options: { name: 'course', type: 'body', x: P(PX), y: P(290), w: P(W), h: P(64),
      fontFace: H, fontSize: F(46), bold: true, color: COL.skyDeep, margin: 0, valign: 'middle' }, text: 'Course / Venue' } },
  { placeholder: { options: { name: 'kicker', type: 'body', x: P(PX), y: P(366), w: P(W), h: P(40),
      fontFace: H, fontSize: F(26), bold: true, color: COL.sky, charSpacing: 1, margin: 0, valign: 'middle' }, text: 'PART / TOPIC' } },
  { placeholder: { options: { name: 'title', type: 'title', x: P(PX), y: P(420), w: P(W), h: P(210),
      fontFace: H, fontSize: F(84), bold: true, color: COL.ink, margin: 0, valign: 'middle' }, text: 'Presentation Title' } },
  { rect: { x: P(PX), y: P(650), w: P(260), h: P(12), fill: { color: COL.sun } } },
  { placeholder: { options: { name: 'presenter', type: 'body', x: P(PX), y: P(684), w: P(W), h: P(56),
      fontFace: H, fontSize: F(36), color: COL.ink, margin: 0, valign: 'middle' }, text: 'Presenter Name' } },
  { placeholder: { options: { name: 'meta', type: 'body', x: P(PX), y: P(970), w: P(W), h: P(40),
      fontFace: B, fontSize: F(26), color: COL.muted, margin: 0, valign: 'middle' }, text: 'Affiliation · Date' } },
] });

pres.defineSlideMaster({ title: 'Part Divider', background: { color: COL.skySoft }, objects: [
  { placeholder: { options: { name: 'title', type: 'title', x: P(PX), y: P(460), w: P(W), h: P(160),
      fontFace: H, fontSize: F(124), bold: true, color: COL.ink, margin: 0, valign: 'middle' }, text: 'Part Name' } },
] });

content('Contents', [bodyPh('body', PX, BODY_Y + 10, W, 640, 'Section - one-line description', 36)]);
content('Title and Text', [bodyPh('body', PX, BODY_Y, W, BODY_BOTTOM - BODY_Y, 'Bullet - one sentence per paragraph')]);
content('Text over Figure', [
  bodyPh('body', PX, BODY_Y, W, 180, 'Bullet - one sentence per paragraph'),
  frame(PX, 470, W, 480), picPh('figure', PX + 8, 478, W - 16, 464)]);
content('Lead and Figure', [
  leadPh(PX, BODY_Y, W, 70),
  frame(PX, 370, W, 580), picPh('figure', PX + 8, 378, W - 16, 564)]);
content('Text and Figure', [     // text left 42 %, figure right
  bodyPh('body', PX, BODY_Y, 690, BODY_BOTTOM - BODY_Y, 'Bullet - one sentence per paragraph'),
  frame(PX + 718, BODY_Y, W - 718, BODY_BOTTOM - BODY_Y),
  picPh('figure', PX + 726, BODY_Y + 8, W - 734, BODY_BOTTOM - BODY_Y - 16)]);
const hw = (W - 44) / 2;
content('Two Figures', [
  bodyPh('body', PX, BODY_Y, W, 180, 'Bullet - one sentence per paragraph'),
  ...[0, 1].flatMap(i => [frame(PX + i * (hw + 44), 470, hw, 480),
    picPh('figure' + (i + 1), PX + i * (hw + 44) + 8, 478, hw - 16, 464)])]);
const cw = (W - 2 * 32) / 3;
content('Three Figures', [
  bodyPh('body', PX, BODY_Y, W, 260, 'Bullet - one sentence per paragraph'),
  ...[0, 1, 2].flatMap(i => [frame(PX + i * (cw + 32), 560, cw, 390),
    picPh('figure' + (i + 1), PX + i * (cw + 32) + 8, 568, cw - 16, 374)])]);
content('Figure and Text', [     // left: figure left 50 %, text right
  frame(PX, BODY_Y, (W - 28) / 2, BODY_BOTTOM - BODY_Y),
  picPh('figure', PX + 8, BODY_Y + 8, (W - 28) / 2 - 16, BODY_BOTTOM - BODY_Y - 16),
  bodyPh('body', PX + (W - 28) / 2 + 28, BODY_Y, (W - 28) / 2, BODY_BOTTOM - BODY_Y, 'Bullet - one sentence per paragraph')]);
content('Figure over Text', [    // top: figure above, text below
  frame(PX, BODY_Y, W, 480), picPh('figure', PX + 8, BODY_Y + 8, W - 16, 464),
  bodyPh('body', PX, BODY_Y + 508, W, BODY_BOTTOM - BODY_Y - 508, 'Bullet - one sentence per paragraph')]);
content('Two Columns', [         // quad: each column text over figure
  ...[0, 1].flatMap(i => [
    bodyPh('body', PX + i * (hw + 44), BODY_Y, hw, 180, 'Bullet - one sentence per paragraph'),
    frame(PX + i * (hw + 44), 482, hw, BODY_BOTTOM - 482),
    picPh('figure' + (i + 1), PX + i * (hw + 44) + 8, 490, hw - 16, BODY_BOTTOM - 498)])]);
content('Figure Only', [         // media
  frame(PX, BODY_Y, W, BODY_BOTTOM - BODY_Y), picPh('figure', PX + 8, BODY_Y + 8, W - 16, BODY_BOTTOM - BODY_Y - 16)]);
content('Title Only', []);

// ---------- one empty slide per layout ----------
function bar(s, pct) {                   // progress fill differs per slide
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: P(430), y: P(986), w: P(1250 * pct / 100), h: P(8),
    fill: { color: COL.leaf }, line: { type: 'none' }, rectRadius: 0.028, objectName: 'Progress' });
}
pres.addSection({ title: 'Cover' });
pres.addSlide({ masterName: 'Cover', sectionTitle: 'Cover' });
pres.addSection({ title: 'Overview' });
let s = pres.addSlide({ masterName: 'Contents', sectionTitle: 'Overview' });
pres.addSection({ title: 'Section' });
pres.addSlide({ masterName: 'Part Divider', sectionTitle: 'Section' });
const L = ['Title and Text', 'Text over Figure', 'Lead and Figure', 'Text and Figure', 'Figure and Text', 'Figure over Text', 'Two Figures', 'Three Figures', 'Two Columns', 'Figure Only', 'Title Only'];
L.forEach((m, i) => { s = pres.addSlide({ masterName: m, sectionTitle: 'Section' }); bar(s, Math.round(100 * (i + 1) / L.length)); });
pres.writeFile({ fileName: out }).then(f => console.log('wrote', f));
