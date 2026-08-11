#!/usr/bin/env bash
# FlexNet local sanity check — run against a live static server.
# Usage: ./scripts/check.sh [base-url]

set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pass=0
fail=0

check_http() {
  local path="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}${path}")"
  if [ "$code" = "200" ]; then
    echo "  OK  ${path}"
    pass=$((pass + 1))
  else
    echo "  FAIL ${path} (HTTP ${code})"
    fail=$((fail + 1))
  fi
}

echo "FlexNet check — ${BASE_URL}"
echo

echo "Routes and assets"
for path in \
  / \
  /index.html \
  /robots.txt \
  /sitemap.xml \
  /LICENSE \
  /NOTICE \
  /css/styles.css \
  /src/core/site-config.js \
  /src/core/loader.js \
  /src/utilities/routeViewModules.js \
  /assets/images/hero-430.avif \
  /assets/images/summer-golf-camp.webp \
  /assets/images/summer-golf-camp.jpg \
  /assets/images/golf-lesson.avif \
  /assets/images/golf-lesson.jpg \
  /assets/images/favicon.ico \
  /assets/images/og-image.jpg \
  /public/views/home/index.html \
  /public/views/register/index.html; do
  check_http "$path"
done

echo
echo "JavaScript syntax"
while IFS= read -r file; do
  if node --check "$file" >/dev/null 2>&1; then
    echo "  OK  ${file#./}"
    pass=$((pass + 1))
  else
    echo "  FAIL ${file#./}"
    fail=$((fail + 1))
  fi
done < <(find src -name '*.js' -type f | sort)

echo
echo "JSON-LD in index.html"
if python3 - <<'PY'
import json, re, pathlib, sys
html = pathlib.Path("index.html").read_text()
match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
if not match:
    sys.exit("missing JSON-LD block")
data = json.loads(match.group(1))
types = [node["@type"] for node in data["@graph"]]
expected = {"SportsOrganization", "WebSite", "GolfCourse", "SportsEvent"}
if not expected.issubset(set(types)):
    sys.exit(f"unexpected @graph types: {types}")
PY
then
  echo "  OK  JSON-LD @graph"
  pass=$((pass + 1))
else
  echo "  FAIL JSON-LD @graph"
  fail=$((fail + 1))
fi

echo
echo "One h1 per view"
while IFS= read -r file; do
  count="$(grep -c '<h1' "$file" || true)"
  if [ "$count" = "1" ]; then
    echo "  OK  ${file#./}"
    pass=$((pass + 1))
  else
    echo "  FAIL ${file#./} (h1 count: ${count})"
    fail=$((fail + 1))
  fi
done < <(find public/views -name 'index.html' | sort)

echo
echo "Home shell sync (index.html vs public/views/home)"
if python3 - <<'PY'
import pathlib, re, sys

def normalize(html: str) -> str:
    return re.sub(r'\s+', ' ', html.strip())

def inner_from_view(html: str) -> str:
    match = re.search(r'<div id="page-content">\s*(.*)\s*</div>\s*$', html.strip(), re.S)
    if not match:
        sys.exit('invalid home view markup')
    return normalize(match.group(1))

def inner_from_index(html: str) -> str:
    match = re.search(
        r'<div id="content-placeholder"[^>]*>\s*<div id="page-content">\s*(.*)\s*</div>\s*</div>\s*</main>',
        html,
        re.S,
    )
    if not match:
        sys.exit('missing home shell in index.html')
    return normalize(match.group(1))

index = pathlib.Path('index.html').read_text()
view = pathlib.Path('public/views/home/index.html').read_text()
if inner_from_index(index) != inner_from_view(view):
    sys.exit('home shell drift: update index.html or public/views/home/index.html')
PY
then
  echo "  OK  home shell matches view"
  pass=$((pass + 1))
else
  echo "  FAIL home shell drift"
  fail=$((fail + 1))
fi

echo
echo "Registration fee options"
if python3 - <<'PY'
import pathlib, re, sys

config = pathlib.Path('src/core/site-config.js').read_text()
register = pathlib.Path('public/views/register/index.html').read_text()

required_keys = [
    'entryFee',
    'practiceRound',
    'membership',
    'titleSponsor',
    'lunchSponsor',
    'puttingGreenSponsor',
    'drivingRangeSponsor',
]

for key in required_keys:
    if not re.search(rf"\bkey:\s*'{key}'", config):
        sys.exit(f"missing payment option key: {key}")

if 'shortLabel:' not in config:
    sys.exit('payment options missing shortLabel fields')

footer = pathlib.Path('src/core/layout/renderFooter.js').read_text()
if 'data-legal-dialog-open' not in footer:
    sys.exit('footer missing terms of use dialog trigger')

if 'Website Terms of Use' not in config:
    sys.exit('site config missing public website terms of use')

register_view = pathlib.Path('public/views/register/index.html').read_text()
if 'data-registration-fee-add' not in register_view:
    sys.exit('register view missing fee add dropdown')

invoice = pathlib.Path('src/views/registration-invoice/registration-invoice.js').read_text()
if 'syncFeeSelection' not in invoice:
    sys.exit('registration module missing fee selection sync')
PY
then
  echo "  OK  registration fees and legal dialog wiring"
  pass=$((pass + 1))
else
  echo "  FAIL registration fee options and mobile helper"
  fail=$((fail + 1))
fi

echo
echo "Summary: ${pass} passed, ${fail} failed"
if [ "$fail" -gt 0 ]; then
  exit 1
fi
