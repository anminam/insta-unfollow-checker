# 빌드 가이드

## 환경별 manifest.json 생성

이 프로젝트는 로컬 테스트용과 출시용 OAuth Client ID가 다르기 때문에,
`build.sh` 스크립트로 환경에 맞는 `manifest.json`을 생성합니다.

### 파일 구조

| 파일 | 역할 | Git 추적 |
|------|------|----------|
| `manifest.template.json` | 템플릿 (플레이스홀더 포함) | O |
| `manifest.json` | 실제 사용되는 파일 (빌드 산출물) | X |
| `config/prod.json` | 출시용 Client ID | O |
| `config/dev.json` | 로컬 테스트용 Client ID | X |

### 사용법

```bash
# 로컬 테스트용
./build.sh dev

# 출시용 (기본값)
./build.sh prod
./build.sh
```

### 최초 세팅

1. `config/dev.json`에 로컬 테스트용 Client ID 입력:

```json
{
  "oauth2_client_id": "your-dev-client-id.apps.googleusercontent.com"
}
```

2. 빌드 실행:

```bash
./build.sh dev
```

3. Chrome에서 확장 프로그램 새로고침

### 출시할 때

```bash
./build.sh prod
```

생성된 `manifest.json`이 출시용 Client ID로 설정됩니다.

### 주의사항

- `manifest.json`을 직접 수정하지 마세요. `build.sh`가 덮어씁니다.
- 버전 업데이트는 `manifest.template.json`의 `version` 필드를 수정하세요.
- `config/dev.json`은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.
