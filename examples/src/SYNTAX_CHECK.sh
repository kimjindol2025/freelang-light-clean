#!/bin/bash

echo "════════════════════════════════════════════════"
echo "📝 FreeLang 문법 검증 (1.3.1)"
echo "════════════════════════════════════════════════"
echo ""

# 체크 1: 임포트 문법
echo "✓ 1️⃣  임포트 문법 검증"
grep -n "^use " blog-server.fl blog-db.fl blog-api.fl mod.fl 2>/dev/null || echo "❌ use 문법 없음"
echo ""

# 체크 2: 함수 정의
echo "✓ 2️⃣  함수 정의 검증"
echo "  blog-server.fl:"
grep -c "^fn " blog-server.fl | xargs -I {} echo "    함수: {} 개"
echo "  blog-api.fl:"
grep -c "^fn\|^pub fn" blog-api.fl | xargs -I {} echo "    함수: {} 개"
echo "  blog-db.fl:"
grep -c "^fn\|^pub fn" blog-db.fl | xargs -I {} echo "    함수: {} 개"
echo ""

# 체크 3: 구조체 정의
echo "✓ 3️⃣  구조체 정의 검증"
grep -n "^pub struct\|^struct" blog-server.fl blog-db.fl blog-api.fl | wc -l | xargs -I {} echo "    구조체: {} 개"
echo ""

# 체크 4: 에러 가능 부분
echo "✓ 4️⃣  잠재적 에러 확인"
echo "  주석 처리된 코드:"
grep -c "^[ ]*\/\/" blog-server.fl blog-db.fl blog-api.fl | grep -v ":0$" | wc -l
echo ""

# 체크 5: 대괄호/괄호 짝 맞음
echo "✓ 5️⃣  괄호 균형 검증"
for file in blog-server.fl blog-db.fl blog-api.fl mod.fl; do
  open_brace=$(grep -o "{" $file | wc -l)
  close_brace=$(grep -o "}" $file | wc -l)
  open_paren=$(grep -o "(" $file | wc -l)
  close_paren=$(grep -o ")" $file | wc -l)
  
  if [ "$open_brace" -eq "$close_brace" ] && [ "$open_paren" -eq "$close_paren" ]; then
    echo "    ✅ $file: 괄호 균형 완벽 ({$open_brace}, ($open_paren)"
  else
    echo "    ⚠️  $file: 괄호 불균형 (브레이스: $open_brace/$close_brace, 소괄호: $open_paren/$close_paren)"
  fi
done
echo ""

echo "════════════════════════════════════════════════"
echo "✅ 1.3.1 문법 검증 완료!"
echo "════════════════════════════════════════════════"
