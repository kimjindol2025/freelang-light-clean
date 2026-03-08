# @freelang/vm

FreeLang 가상 머신 (Virtual Machine) 런타임

## 설치

```bash
npm install @freelang/vm
```

## 사용법

```javascript
const { VMExecutor } = require('@freelang/vm');

const vm = new VMExecutor();
const result = vm.execute(bytecode);
console.log(result);
```

## 특징

- 고성능 바이트코드 실행
- 메모리 안전성
- JIT 컴파일 지원
- 디버깅 기능

## 지원 아키텍처

- x86-64
- ARM64
- WASM

자세한 정보: https://github.com/freelang-io/freelang-compiler
