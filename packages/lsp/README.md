# @freelang/lsp

FreeLang LSP (Language Server Protocol) 서버

## 설치

```bash
npm install @freelang/lsp
```

## 사용법

### VSCode 연동

`.vscode/settings.json`:
```json
{
  "[freelang]": {
    "editor.defaultFormatter": "freelang.freelang",
    "editor.formatOnSave": true
  }
}
```

### 직접 실행

```bash
freelang-lsp
```

## 기능

- 코드 자동완성 (Autocomplete)
- 호버 정보 (Hover)
- 함수 정의로 이동 (Go to Definition)
- 문제 진단 (Diagnostics)
- 문서 포매팅 (Formatting)

## 지원 에디터

- Visual Studio Code
- Neovim
- Emacs
- Sublime Text

자세한 정보: https://github.com/freelang-io/freelang-compiler
