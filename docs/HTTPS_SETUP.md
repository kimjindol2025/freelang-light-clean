# 🔒 FreeLang Light HTTPS/SSL 설정 가이드

## 📋 개요

FreeLang Light가 HTTPS를 통해 보안적으로 배포되도록 하는 완전한 설정 가이드입니다.

**구성 요소**:
- nginx reverse proxy (SSL 종료)
- Let's Encrypt 인증서 (자동 갱신)
- HTTP → HTTPS 리다이렉트
- HSTS, X-Frame-Options 등 보안 헤더

---

## 🚀 빠른 시작 (5분)

### 1️⃣ 도메인 준비

```bash
# 253.dclub.kr이 123.212.111.26을 가리키도록 DNS 설정 필요
nslookup 253.dclub.kr
# → 123.212.111.26으로 해석되어야 함
```

### 2️⃣ 초기 인증서 발급 (253 서버)

```bash
# 253 서버에 ssh 접속
ssh -p 10053 kimjin@123.212.111.26

# 홈 디렉토리에서:
cd ~/freelang-light

# 1. certbot 설치
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# 2. 인증서 발급
sudo certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  --email admin@dclub.kr \
  --agree-tos \
  --noninteractive \
  -d 253.dclub.kr

# → /etc/letsencrypt/live/253.dclub.kr/ 생성됨

# 3. 인증서 디렉토리 권한 설정 (Docker 접근 가능)
sudo chown -R 1000:1000 /etc/letsencrypt
sudo chmod -R 755 /etc/letsencrypt
```

### 3️⃣ Docker Compose 실행

```bash
# docker-compose.yml에서 nginx가 활성화됨 (profiles 제거됨)
docker-compose up -d

# 확인
docker-compose ps
# → freelang-hybrid-nginx (nginx)
# → freelang-hybrid-api (blog server)
```

### 4️⃣ 테스트

```bash
# HTTP → HTTPS 리다이렉트 확인
curl -I http://253.dclub.kr/
# → Location: https://253.dclub.kr/ (301)

# HTTPS 연결 확인
curl -I https://253.dclub.kr/
# → 200 OK
# → X-Frame-Options: SAMEORIGIN
# → Strict-Transport-Security: max-age=31536000

# SSL 인증서 확인
openssl s_client -connect 253.dclub.kr:443 -servername 253.dclub.kr
# → Verify return code: 0 (ok)
```

---

## 🔄 자동 갱신 설정

### crontab 설정 (253 서버)

```bash
# cron 편집
sudo crontab -e

# 다음을 추가 (매월 1일 02:00 갱신)
0 2 1 * * /home/kimjin/freelang-light/scripts/renew-ssl.sh >> /var/log/freelang-ssl-renew.log 2>&1

# 또는 매주 월요일 02:00
0 2 * * 1 /home/kimjin/freelang-light/scripts/renew-ssl.sh >> /var/log/freelang-ssl-renew.log 2>&1
```

### 로그 확인

```bash
tail -f /var/log/freelang-ssl-renew.log

# 또는 certbot 로그
sudo journalctl -u certbot.timer -f
```

---

## 📊 현재 구성도

```
┌─────────────────────────────────────────┐
│ 브라우저 (클라이언트)                     │
│                                         │
│ https://253.dclub.kr/api/posts          │
└────────────────┬────────────────────────┘
                 │ HTTPS (443)
        ┌────────▼────────┐
        │  nginx (alpine) │
        │ (포트 80, 443)   │
        │                 │
        ├─ HTTP → HTTPS   │
        │   리다이렉트    │
        │                 │
        ├─ SSL 종료      │
        │ (cert.pem)      │
        │                 │
        └────────┬────────┘
                 │ HTTP (5021)
        ┌────────▼────────────┐
        │ FreeLang Blog      │
        │ Server (포트 5021)  │
        │                    │
        │ - REST API         │
        │ - WebSocket        │
        │ - 정적 파일        │
        └────────────────────┘
```

---

## 🐛 문제 해결

### 인증서 발급 실패

```bash
# 1. DNS 확인
nslookup 253.dclub.kr
# → 123.212.111.26으로 해석되는지 확인

# 2. 포트 80 확인
sudo netstat -tlnp | grep :80
# → nginx이 80 포트를 수신해야 함

# 3. certbot 로그
sudo certbot --verbose renew --dry-run
```

### nginx 시작 실패

```bash
# 설정 문법 검사
sudo nginx -t

# nginx 로그 확인
docker logs freelang-hybrid-nginx
```

### SSL 연결 오류

```bash
# 인증서 확인
openssl x509 -text -noout -in /etc/letsencrypt/live/253.dclub.kr/fullchain.pem

# 만료 날짜 확인
openssl x509 -enddate -noout -in /etc/letsencrypt/live/253.dclub.kr/fullchain.pem
```

---

## 📝 주요 파일

| 파일 | 역할 |
|------|------|
| `nginx.conf` | nginx 설정 (reverse proxy + SSL) |
| `scripts/renew-ssl.sh` | 자동 갱신 스크립트 |
| `docker-compose.yml` | nginx 서비스 (profiles 제거됨) |
| `examples/src/security.fl` | require_https: true |

---

## 🎯 다음 단계

✅ **완료**:
- HTTPS 활성화 (nginx reverse proxy)
- Let's Encrypt 인증서 설정
- 자동 갱신 스크립트

⏳ **다음** (Task 2-4):
- PostgreSQL 데이터 영속성
- 자동 백업 시스템
- 기본 모니터링

---

## 📞 문의

설정 중 문제가 발생하면:
```bash
# 로그 확인
docker logs freelang-hybrid-nginx
docker logs freelang-hybrid-api

# 상태 확인
docker-compose ps
curl -I https://253.dclub.kr/api/health
```
