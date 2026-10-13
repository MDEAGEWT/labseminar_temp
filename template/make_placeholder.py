"""Draw imgs/example.png, the neutral figure placeholder that template.html and template.yaml show."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1600, 1000
im = Image.new('RGB', (W, H), '#F8FAFC')
d = ImageDraw.Draw(im)
d.rectangle([0, 0, W - 1, H - 1], outline='#E2E8F0', width=4)
for x in range(0, W, 80):
    d.line([(x, 0), (x, H)], fill='#EEF2F7', width=2)
for y in range(0, H, 80):
    d.line([(0, y), (W, y)], fill='#EEF2F7', width=2)
d.line([(0, 0), (W, H)], fill='#DBEAFE', width=4)
d.line([(0, H), (W, 0)], fill='#DBEAFE', width=4)
try:
    font = ImageFont.truetype('arial.ttf', 72)
except OSError:
    font = ImageFont.load_default()
text = 'Figure'
box = d.textbbox((0, 0), text, font=font)
tw, th = box[2] - box[0], box[3] - box[1]
pad = 36
d.rounded_rectangle([(W - tw) / 2 - pad, (H - th) / 2 - pad, (W + tw) / 2 + pad, (H + th) / 2 + pad + 10],
                    radius=24, fill='white', outline='#BFDBFE', width=3)
d.text(((W - tw) / 2, (H - th) / 2 - box[1]), text, fill='#1D4ED8', font=font)
os.makedirs(os.path.join(HERE, 'imgs'), exist_ok=True)
im.save(os.path.join(HERE, 'imgs', 'example.png'))
print('imgs/example.png')
