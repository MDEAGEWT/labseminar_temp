#!/usr/bin/env bash
# 덱 HTML 을 브라우저에서 고친다.
#   ./editor.sh                 output/ 의 덱을 모두 연다
#   ./editor.sh output/x.html   덱 하나만 연다
#   ./editor.sh --port 8899     포트를 바꾼다. --no-open 은 브라우저를 띄우지 않는다
#
# 편집기 본체는 editor/ 서브모듈이다. 없으면 여기서 내려받는다.
# 고친 결과는 덱 HTML 에 바로 저장된다. PDF 는 ./build.sh 로 다시 굽는다.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f editor/editor.py ]; then
  echo "editor/ 서브모듈을 내려받는다"
  git submodule update --init editor
fi

# 인자에 경로가 없으면 output/ 을 연다
target_given=0
for a in "$@"; do
  case "$a" in -*) ;; *) target_given=1 ;; esac
done
if [ "$target_given" -eq 0 ]; then
  [ -d output ] || { echo "output/ 이 없다. ./create.sh 를 먼저 실행한다" >&2; exit 1; }
  set -- output "$@"
fi

exec python3 editor/editor.py "$@"
