#!/bin/bash
# manifest.json 빌드 스크립트
# 사용법:
#   ./build.sh dev   → 로컬 테스트용
#   ./build.sh prod  → 출시용 (기본값)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV="${1:-prod}"
CONFIG_FILE="$SCRIPT_DIR/config/${ENV}.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ config/${ENV}.json 파일이 없습니다."
  echo "   사용 가능: dev, prod"
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
