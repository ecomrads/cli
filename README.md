# eComrads CLI

[![npm](https://img.shields.io/npm/v/@ecomrads/cli?style=flat-square)](https://www.npmjs.com/package/@ecomrads/cli)
[![license](https://img.shields.io/github/license/ecomrads/cli?style=flat-square)](./LICENSE)

Generate product photoshoots, storyboards, videos, static ads, and Virality Analysis from the terminal — powered by [eComrads](https://ecomrads.com).

## Install

**npm** (Mac, Linux, Windows):

```bash
npm install -g @ecomrads/cli
```

**curl** (Mac/Linux):

```bash
curl -fsSL https://raw.githubusercontent.com/ecomrads/cli/main/install.sh | sh
```

Pin a version:

```bash
curl -fsSL https://raw.githubusercontent.com/ecomrads/cli/main/install.sh | sh -s -- --tag v0.1.3
```

One-off:

```bash
npx @ecomrads/cli --help
```

## Quickstart

```bash
ecomrads auth login
ecomrads upload ./product.jpg
ecomrads photoshoot --image <url> --prompt "clean studio hero shot" --aspect-ratio 4:5 --wait
```

Sign in opens your browser (same account as ecomrads.com / MCP). No ImgBB key needed when signed in.

## Commands

| Command | Purpose |
|---------|---------|
| `ecomrads auth login` | Sign in via browser |
| `ecomrads upload` | Upload a product image |
| `ecomrads photoshoot` | Product image edit |
| `ecomrads storyboard` | 9-angle storyboard |
| `ecomrads video` | Image-to-video |
| `ecomrads ugc` | UGC creator video |
| `ecomrads ad` | Static / carousel ad |
| `ecomrads recreate` | Recreate competitor-style ad |
| `ecomrads analyze` | Virality Analysis |
| `ecomrads spy` | Meta Ads Library |
| `ecomrads job` | Inspect / wait on jobs |

Full reference: [COMMANDS.md](./COMMANDS.md)

## Related

- **npm**: [@ecomrads/cli](https://www.npmjs.com/package/@ecomrads/cli)
- **Agent skills**: [ecomrads/skills](https://github.com/ecomrads/skills)
- **MCP**: `https://mcp.ecomrads.com/mcp`

## License

[MIT](./LICENSE)
