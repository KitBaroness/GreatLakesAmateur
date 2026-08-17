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
echo "Live scoring"
if python3 - <<'PY'
import pathlib, re, sys
config = pathlib.Path('src/core/site-config.js').read_text()
if not re.search(r'liveScoring:\s*\{[^}]*enabled:\s*true', config, re.S):
    sys.exit(2)
if not pathlib.Path('public/views/live-scoring/index.html').exists():
    sys.exit('live scoring enabled but view missing')
if 'embedUrl:' not in config:
    sys.exit('live scoring missing embedUrl')
PY
then
  check_http "/public/views/live-scoring/index.html"
  echo "  OK  live scoring config"
  pass=$((pass + 1))
elif [ "$?" = "2" ]; then
  echo "  OK  live scoring disabled"
  pass=$((pass + 1))
else
  echo "  FAIL live scoring config"
  fail=$((fail + 1))
fi

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
    sys.exit('footer missing legal dialog triggers')

required_legal_ids = ['terms', 'privacy', 'accessibility', 'do-not-sell']
for legal_id in required_legal_ids:
    if f"id: '{legal_id}'" not in config:
        sys.exit(f'site config missing legal document: {legal_id}')

if "id: 'about-ryan-yip'" not in config:
    sys.exit('site config missing footer about section for Ryan Yip')

legal_markers = ['WCAG 2.1', 'CCPA', 'State of Michigan']
for marker in legal_markers:
    if marker not in config:
        sys.exit(f'site config missing legal compliance marker: {marker}')

headers = pathlib.Path('_headers').read_text()
for header in ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options']:
    if header not in headers:
        sys.exit(f'_headers missing {header}')

if 'frame-src https://*.golfgenius.com' not in headers:
    sys.exit('_headers missing Golf Genius frame-src policy')

register_view = pathlib.Path('public/views/register/index.html').read_text()
if 'data-registration-fee-add' not in register_view:
    sys.exit('register view missing fee add dropdown')

if 'data-legal-dialog-open="privacy"' not in register_view:
    sys.exit('register view missing privacy policy consent link')

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
echo "Cache version sync"
if python3 - <<'PY'
import pathlib, re, sys

config = pathlib.Path('src/core/site-config.js').read_text()
index = pathlib.Path('index.html').read_text()

match = re.search(r"version:\s*'([^']+)'", config)
if not match:
    sys.exit('site-config missing version field')

version = match.group(1)
if f'?v={version}' not in index:
    sys.exit(f'index.html cache bust out of sync with config version {version}')
PY
then
  echo "  OK  index.html version matches site-config"
  pass=$((pass + 1))
else
  echo "  FAIL cache version drift"
  fail=$((fail + 1))
fi

echo
echo "Summary: ${pass} passed, ${fail} failed"
if [ "$fail" -gt 0 ]; then
  exit 1
fi
