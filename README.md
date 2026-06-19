# eComrads CLI

[![npm](https://img.shields.io/npm/v/@ecomrads/cli?style=flat-square)](https://www.npmjs.com/package/@ecomrads/cli)
[![license](https://img.shields.io/github/license/ecomrads/cli?style=flat-square)](./LICENSE)

Generate product photoshoots, storyboards, videos, static ads, and Virality Analysis from the terminal — powered by the [eComrads](https://ecomrads.com) API.

## Install

### npm (recommended)

```bash
npm install -g @ecomrads/cli
```

One-off without global install:

```bash
npx @ecomrads/cli --help
```

### curl (Mac/Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/ecomrads/cli/main/install.sh | sh
```

Pin a version:

```bash
curl -fsSL https://raw.githubusercontent.com/ecomrads/cli/main/install.sh | sh -s -- --tag v0.1.3
```

### GitHub Release tarball

```bash
npm install -g https://github.com/ecomrads/cli/releases/download/v0.1.3/ecomrads-cli-0.1.3.tgz
```

Manual clone + build:

```bash
git clone https://github.com/ecomrads/cli.git /tmp/ecomrads-cli
cd /tmp/ecomrads-cli && npm install && npm run build && npm install -g .
```

> **Note:** Do not use `npm install -g github:ecomrads/cli` — it is broken on npm 25. On Windows, use `npm install -g @ecomrads/cli`.

## Quickstart

Sign in (opens browser — same account as ecomrads.com / MCP):

```bash
ecomrads auth login
```

Upload and generate:

```bash
ecomrads upload ./product.jpg
ecomrads photoshoot --image <upload-url> --prompt "clean studio hero shot" --aspect-ratio 4:5 --wait
```



## Environment

| Variable | Purpose |
|----------|---------|
| `ECOMRADS_API_BASE_URL` | FastAPI origin (default: production Railway backend) |
| `ECOMRADS_ACCESS_TOKEN` | Supabase access token (optional if you use `auth login`) |
| `ECOMRADS_MCP_URL` | OAuth sign-in server (default: `https://mcp.ecomrads.com`) |


Config file: `~/.ecomrads/config.json`

## Commands

| Command | Purpose |
|---------|---------|
| `ecomrads auth` | login / status / logout (token & imgbb-key for advanced use) |
| `ecomrads upload` | upload image file or URL (backend when signed in) |
| `ecomrads photoshoot` | product image edit (`/post/edit`) |
| `ecomrads storyboard` | 9-angle storyboard (`/post/multi-angles`) |
| `ecomrads video` | image-to-video (`/post/animate`) |
| `ecomrads ugc` | UGC creator video (`/post/ugc`) |
| `ecomrads ad` | static / carousel ad (`/post/static`) |
| `ecomrads recreate` | recreate competitor ad (`/post/genanalysis`) |
| `ecomrads analyze` | Virality Analysis (`/post/ad-score`) |
| `ecomrads spy` | Meta Ads Library (`/spy/`) |
| `ecomrads job` | get / wait on jobs |
| `ecomrads version` | print version |

Full reference: [COMMANDS.md](./COMMANDS.md)

## Flags

| Flag | Purpose |
|------|---------|
| `--wait` | block until job completes |
| `--wait-timeout` | max wait (default `10m`) |
| `--wait-interval` | poll interval (default `30s`) |
| `--json` | machine-readable JSON |
| `--no-color` | disable color |

## Development

```bash
git clone https://github.com/ecomrads/cli.git
cd cli
npm install
npm run build
npm link
ecomrads version
```

## Related

- **Agent skills**: [ecomrads/skills](https://github.com/ecomrads/skills)
- **MCP connector**: `https://mcp.ecomrads.com/mcp`

## License

[MIT](./LICENSE)
