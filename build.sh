#!/bin/bash
# manifest.json 빌드 + ZIP 패키징 스크립트
# 사용법:
#   ./build.sh dev   → 로컬 테스트용 manifest 생성
#   ./build.sh prod  → 출시용 manifest 생성 (기본값)
#   ./build.sh zip   → prod 빌드 + Chrome Web Store용 ZIP 생성

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CMD="${1:-prod}"

# zip 명령이면 prod 빌드 후 패키징
if [ "$CMD" = "zip" ]; then
  ENV="prod"
else
  ENV="$CMD"
fi

CONFIG_FILE="$SCRIPT_DIR/config/${ENV}.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ config/${ENV}.json 파일이 없습니다."
  echo "   사용 가능: dev, prod, zip"
  exit 1
fi

CLIENT_ID=$(grep -o '"oauth2_client_id":\s*"[^"]*"' "$CONFIG_FILE" | sed 's/.*: *"//;s/"$//')

if [ -z "$CLIENT_ID" ]; then
  echo "❌ oauth2_client_id를 찾을 수 없습니다."
  exit 1
fi

sed "s/__OAUTH_CLIENT_ID__/$CLIENT_ID/" "$SCRIPT_DIR/manifest.template.json" > "$SCRIPT_DIR/manifest.json"

echo "✅ manifest.json 생성 완료 (${ENV})"
echo "   client_id: ${CLIENT_ID:0:20}..."

# ZIP 패키징
if [ "$CMD" = "zip" ]; then
  VERSION=$(grep -o '"version":\s*"[^"]*"' "$SCRIPT_DIR/manifest.json" | sed 's/.*: *"//;s/"$//')
  ZIP_NAME="insta-unfollow-v${VERSION}.zip"
  DIST_DIR="$SCRIPT_DIR/dist"

  mkdir -p "$DIST_DIR"
  rm -f "$DIST_DIR/$ZIP_NAME"

  cd "$SCRIPT_DIR"
  zip -r "$DIST_DIR/$ZIP_NAME" \
    manifest.json \
    background/ \
    popup/ \
    tab/ \
    shared/ \
    icons/ \
    _locales/ \
    -x "*.DS_Store"

  echo ""
  echo "📦 $ZIP_NAME 생성 완료"
  echo "   경로: dist/$ZIP_NAME"
  echo "   크기: $(du -h "$DIST_DIR/$ZIP_NAME" | cut -f1)"
  echo ""
  echo "🚀 Chrome Web Store에 업로드하세요:"
  echo "   https://chrome.google.com/webstore/devconsole"
fi
