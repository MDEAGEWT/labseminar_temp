"""Tile rendered slide PNGs into one overview image:  py grid.py outdir [cols]"""
import glob, os, sys
from PIL import Image

d = sys.argv[1]
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 2
files = sorted(glob.glob(os.path.join(d, 'slide-*.png')))
w, h = 800, 450
g = Image.new('RGB', (w * cols, h * (-(-len(files) // cols))), 'white')
for i, f in enumerate(files):
    g.paste(Image.open(f).resize((w, h)), ((i % cols) * w, (i // cols) * h))
out = os.path.join(d, 'grid.png')
g.save(out)
print(out)
