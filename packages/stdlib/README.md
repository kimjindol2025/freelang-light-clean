# @freelang/stdlib

FreeLang 표준 라이브러리 - 1,500+ 빌트인 함수

## 설치

```bash
npm install @freelang/stdlib
```

## 포함된 모듈

### 문자열 처리
- `string_upper()` - 대문자 변환
- `string_lower()` - 소문자 변환
- `string_split()` - 문자열 분할
- `string_replace()` - 문자열 치환

### 수학 함수
- `math_sin()`, `math_cos()` - 삼각 함수
- `math_sqrt()` - 제곱근
- `math_abs()` - 절댓값

### 파일 I/O
- `file_read()` - 파일 읽기
- `file_write()` - 파일 쓰기
- `file_delete()` - 파일 삭제

### 네트워크
- `http_get()` - HTTP GET 요청
- `http_post()` - HTTP POST 요청
- `http_server()` - HTTP 서버 생성

### 데이터베이스
- `db_open()` - 데이터베이스 열기
- `db_query()` - SQL 쿼리 실행
- `db_insert()` - 데이터 삽입

### 비동기
- `async_sleep()` - 비동기 대기
- `async_parallel()` - 병렬 실행
- `async_map()` - 비동기 맵

## 사용 예제

```freelang
import { string_upper, http_get } from @freelang/stdlib

fn main() {
    let msg = "hello"
    println(string_upper(msg))  // "HELLO"

    let response = http_get("https://api.example.com/data")
    println(response)
}
```

## 함수 목록

전체 함수 목록은 [API 문서](https://github.com/freelang-io/freelang-compiler/wiki/stdlib-api)를 참고하세요.

자세한 정보: https://github.com/freelang-io/freelang-compiler
