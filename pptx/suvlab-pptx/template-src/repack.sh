set -e
S="$1"; SK="$2"; cd "$S"
pack() { (cd "$1" && rm -f "../$2" && py -c "
import zipfile,os,sys
z=zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED)
names=[os.path.relpath(os.path.join(d,f),'.').replace(os.sep,'/') for d,_,fs in os.walk('.') for f in fs]
names.sort(key=lambda n:(n!='[Content_Types].xml',n))
for n in names: z.write(n,n)
z.close()" "../$2"); }
rm -rf x y && mkdir x && (cd x && unzip -q ../raw.pptx && PYTHONUTF8=1 py -I ../post.py .) && pack x tpl.pptx
NODE_PATH="$S/node_modules" node "$SK/scripts/apply_theme.js" tpl.pptx theme.json
mkdir y && (cd y && unzip -q ../tpl.pptx && sed -i 's/<a:font script="Hang" typeface="[^"]*"\/>/<a:font script="Hang" typeface="Noto Sans KR"\/>/g' ppt/theme/theme*.xml) && pack y tpl.pptx
PYTHONUTF8=1 py "$SK/scripts/office/validate.py" tpl.pptx
PYTHONUTF8=1 py -I fill.py tpl.pptx test.pptx
