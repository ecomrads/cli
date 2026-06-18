#!/bin/sh
# eComrads CLI — installer (TypeScript / @ecomrads/cli)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/ecomrads/cli/main/install.sh | sh
#   curl -fsSL ... | sh -s -- --tag v0.1.0
#
# Do NOT use: npm install -g github:ecomrads/cli
# npm link + github: global installs conflict (ENOTDIR on npm 25).

set -e

TAG=""
REPO="https://github.com/ecomrads/cli.git"
INSTALL_DIR="${TMPDIR:-/tmp}/ecomrads-cli-install-$$"

cleanup() {
  rm -rf "$INSTALL_DIR"
}
trap cleanup EXIT

while [ "$#" -gt 0 ]; do
  case "$1" in
    --tag=*) TAG="${1#*=}"; shift ;;
    --tag) TAG="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required." >&2
  echo "Install Node 20+ from https://nodejs.org then re-run this script." >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required." >&2
  exit 1
fi

NPM_ROOT="$(npm root -g)"

# npm link leaves a symlink that breaks `npm install -g` with ENOTDIR
if [ -e "$NPM_ROOT/@ecomrads" ]; then
  echo "Removing previous @ecomrads global install..."
  npm uninstall -g @ecomrads/cli 2>/dev/null || true
  rm -rf "$NPM_ROOT/@ecomrads"
fi

echo "Cloning eComrads CLI from GitHub..."
if [ -n "$TAG" ]; then
  git clone --depth 1 --branch "$TAG" "$REPO" "$INSTALL_DIR"
else
  git clone --depth 1 "$REPO" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
echo "Installing dependencies and building..."
npm install --include=dev
npm run build
echo "Installing globally..."
npm install -g .

echo ""
echo "Installed: $(ecomrads version 2>/dev/null || true)"
echo ""
echo "Next:"
echo "  ecomrads auth token <your-supabase-jwt>"
echo "  ecomrads auth imgbb-key <your-imgbb-key>"
echo "  ecomrads upload ./product.jpg"
