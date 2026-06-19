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
curl -fsSL https://raw.githubusercontent.com/ecomrads/cli/main/install.sh | sh -s -- --tag v0.1.1
```

> On Windows, use `npm install -g @ecomrads/cli`.

## Quickstart

```bash
ecomrads auth login
ecomrads upload ./product.jpg
ecomrads photoshoot --image <upload-url> --prompt "clean studio hero shot" --aspect-ratio 4:5 --wait
```

Sign in opens your browser (same account as ecomrads.com / MCP). No ImgBB API key needed when signed in.

## Environment

Optional overrides (most users can skip these):

| Variable | Purpose |
|----------|---------|
| `ECOMRADS_ACCESS_TOKEN` | Bearer token if not using `auth login` |
| `ECOMRADS_MCP_URL` | Sign-in server (default: `https://mcp.ecomrads.com`) |
| `ECOMRADS_API_BASE_URL` | API origin override (local development only) |

Session config: `~/.ecomrads/config.json`

## Commands

| Command | Purpose |
|---------|---------|
| `ecomrads auth login` | Sign in via browser |
| `ecomrads upload` | Upload image file or URL |
| `ecomrads photoshoot` | Product image edit |
| `ecomrads storyboard` | 9-angle storyboard |
| `ecomrads video` | Image-to-video |
| `ecomrads ugc` | UGC creator video |
| `ecomrads ad` | Static / carousel ad |
| `ecomrads recreate` | Recreate competitor-style ad |
| `ecomrads analyze` | Virality Analysis |
| `ecomrads spy` | Meta Ads Library |
| `ecomrads job` | Get / wait on jobs |
| `ecomrads version` | Print version |

Full reference: [COMMANDS.md](./COMMANDS.md)

## Related

- **npm package**: [@ecomrads/cli](https://www.npmjs.com/package/@ecomrads/cli)
- **Agent skills**: [ecomrads/skills](https://github.com/ecomrads/skills)
- **MCP connector**: `https://mcp.ecomrads.com/mcp`

## License

[MIT](./LICENSE)
