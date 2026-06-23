#!/usr/bin/env bash
# Regenerate the typography checklist PDF from its HTML source.
# Requires weasyprint:  pip install weasyprint
set -euo pipefail
cd "$(dirname "$0")"
python3 -c "from weasyprint import HTML; HTML('figma-typography-checklist.html').write_pdf('figma-typography-checklist.pdf')"
echo "Wrote figma-typography-checklist.pdf"
