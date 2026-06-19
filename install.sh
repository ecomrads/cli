#!/bin/sh
# eComrads CLI installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/ecomrads/cli/main/install.sh | sh
#   curl -fsSL ... | sh -s -- --tag v0.1.1

set -e

TAG=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --tag=*) TAG="${1#*=}"; shift ;;
    --tag) TAG="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required (Node 20+)." >&2
  echo "Install from https://nodejs.org then re-run this script." >&2
  exit 1
fi

PKG="@ecomrads/cli"
if [ -n "$TAG" ]; then
  PKG="@ecomrads/cli@${TAG#v}"
fi

echo "Installing $PKG via npm..."
npm install -g "$PKG"

echo ""
echo "Installed: $(ecomrads version 2>/dev/null || echo 'ecomrads')"
echo ""
echo "Next:"
echo "  ecomrads auth login"
echo "  ecomrads upload ./product.jpg"
