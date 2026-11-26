#!/usr/bin/env bash
# Pengujian otomatis Tugas 5 (curl). Backend harus berjalan di $BASE.
# Pemakaian: bash scripts/uji-tugas5.sh
BASE=${BASE:-http://localhost:3000/api}
UA="Mozilla/5.0 (UjiTugas5)"
J='Content-Type: application/json'

login() { curl -s -A "$UA" -X POST "$BASE/v1/auth/login" -H "$J" -d "{\"email\":\"$1\",\"password\":\"${2:-rahasia123}\"}" | sed -E 's/.*"token":"([^"]+)".*/\1/'; }
show() { echo; echo "### $1"; }

ADMIN=$(login admin@kantin.test)
OWNER=$(login tini@kantin.test)
CUST=$(login bagas@student.test)
show "Login gagal (password salah) -> 401, tetap diaudit result=failed"
curl -s -A "$UA" -X POST "$BASE/v1/auth/login" -H "$J" -d '{"email":"tini@kantin.test","password":"salah"}'

show "Logout admin -> 200"
curl -s -A "$UA" -X POST "$BASE/v1/auth/logout" -H "Authorization: Bearer $ADMIN"
ADMIN=$(login admin@kantin.test)

show "GET /api/audit-logs?action=LOGOUT"
curl -s "$BASE/audit-logs?action=LOGOUT&pageSize=1" -H "Authorization: Bearer $ADMIN"

show "Tanpa token -> 401"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/audit-logs"
show "Owner -> 403"
curl -s "$BASE/audit-logs" -H "Authorization: Bearer $OWNER"
show "Customer -> 403"
curl -s "$BASE/audit-logs/1" -H "Authorization: Bearer $CUST"

show "GET /api/audit-logs/1 -> 200"
curl -s "$BASE/audit-logs/1" -H "Authorization: Bearer $ADMIN"
show "GET /api/audit-logs/999999 -> 404"
curl -s "$BASE/audit-logs/999999" -H "Authorization: Bearer $ADMIN"
show "GET /api/audit-logs/abc -> 400"
curl -s "$BASE/audit-logs/abc" -H "Authorization: Bearer $ADMIN"

show "Filter userId=2 (tini) -> semua item userId 2"
curl -s "$BASE/audit-logs?userId=2" -H "Authorization: Bearer $ADMIN"
show "Filter targetTable=USERS&targetId=1"
curl -s "$BASE/audit-logs?targetTable=USERS&targetId=1&pageSize=2" -H "Authorization: Bearer $ADMIN"

show "Validasi: page=0, pageSize=101, parameter asing, tanggal tidak ada, from>to"
for q in "page=0" "pageSize=101" "foo=1" "from=2026-02-30" "from=2026-11-30&to=2026-11-01" "targetId=-5" "userId=abc"; do
  echo "?$q -> $(curl -s "$BASE/audit-logs?$q" -H "Authorization: Bearer $ADMIN")"
done
