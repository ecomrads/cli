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

# npm link leaves a symlink that breaks global installs with ENOTDIR
if [ -e "$NPM_ROOT/@ecomrads" ]; then
  echo "Removing previous @ecomrads global install..."
  npm uninstall -g @ecomrads/cli 2>/dev/null || true
  rm -rf "$NPM_ROOT/@ecomrads"
fi

VERSION="${TAG:-latest}"
if [ -n "$TAG" ]; then
  VERSION="${TAG#v}"
  TARBALL_URL="https://github.com/ecomrads/cli/releases/download/v${VERSION}/ecomrads-cli-${VERSION}.tgz"
  echo "Installing eComrads CLI v${VERSION} from GitHub Release..."
  if curl -fsSL "$TARBALL_URL" -o "$INSTALL_DIR/ecomrads-cli.tgz"; then
    npm install -g "$INSTALL_DIR/ecomrads-cli.tgz" >/dev/null 2>&1
  else
    echo "Release tarball not found; cloning and building from source..."
    git clone --depth 1 --branch "$TAG" "$REPO" "$INSTALL_DIR/src"
    cd "$INSTALL_DIR/src"
    npm install --include=dev
    npm run build
    TARBALL="$(npm pack --silent 2>/dev/null | tail -1)"
    npm install -g "$INSTALL_DIR/src/$TARBALL" >/dev/null 2>&1
  fi
else
  echo "Cloning eComrads CLI from GitHub..."
  git clone --depth 1 "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  echo "Installing dependencies and building..."
  npm install --include=dev
  npm run build
  echo "Installing globally..."
  TARBALL="$(npm pack --silent 2>/dev/null | tail -1)"
  npm install -g "$INSTALL_DIR/$TARBALL" >/dev/null 2>&1
fi

echo ""
echo "✓ Installation complete"
echo "  $(ecomrads version 2>/dev/null || echo 'ecomrads installed')"
echo ""

if ecomrads auth status 2>/dev/null | grep -q "authenticated"; then
  echo "Auth already configured (~/.ecomrads/config.json). You're ready:"
  echo "  ecomrads upload ./product.jpg"
  echo "  ecomrads photoshoot --image <url> --prompt \"studio shot\" --wait"
else
  echo "Next steps (one-time setup):"
  echo "  ecomrads auth login"
  echo "  ecomrads upload ./product.jpg"
fi

echo ""
echo "Do not run: npm install -g github:ecomrads/cli (broken on npm 25; you already have the CLI)."
