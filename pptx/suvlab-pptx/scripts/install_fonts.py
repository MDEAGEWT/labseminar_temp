"""Install the deck fonts (Nunito, Atkinson Hyperlegible, JetBrains Mono) for the current
Windows user, no admin rights needed:  py install_fonts.py
Restart PowerPoint afterwards. All three are SIL Open Font License fonts."""
import glob, os, shutil, sys, winreg

try:
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit('missing package: run  py -m pip install fonttools')

src = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'fonts')
dst = os.path.join(os.environ['LOCALAPPDATA'], r'Microsoft\Windows\Fonts')
os.makedirs(dst, exist_ok=True)
key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts',
                     0, winreg.KEY_ALL_ACCESS)
for f in sorted(glob.glob(os.path.join(src, '*.ttf'))):
    target = os.path.join(dst, os.path.basename(f))
    shutil.copyfile(f, target)
    name = TTFont(f)['name'].getDebugName(4)
    winreg.SetValueEx(key, f'{name} (TrueType)', 0, winreg.REG_SZ, target)
    print('installed', name)
