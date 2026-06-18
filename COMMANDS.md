# Commands — eComrads CLI

Reference for routes, flags, and request bodies. Every creative command returns a **job** — use `--wait` or `ecomrads job wait <id>`.

Base URL: `ECOMRADS_API_BASE_URL` env or `~/.ecomrads/config.json` (no trailing slash).

Default production: `https://backend-ecomrads-production.up.railway.app` (same as eComrads MCP).

Auth: `Authorization: Bearer <supabase-access_token>` on all FastAPI calls.

Upload uses **ImgBB** (same as MCP) — requires `IMGBB_API_KEY` env or `imgbb_api_key` in config. Upload does **not** hit FastAPI.

---

## Auth

| Command | Purpose |
|---------|---------|
| `ecomrads auth login` | Browser OAuth (coming soon) |
| `ecomrads auth token <token>` | Save Supabase access token (Bearer JWT) |
| `ecomrads auth imgbb-key <key>` | Save ImgBB key for `upload` |
| `ecomrads auth status` | Show auth + API base URL + upload config |
| `ecomrads auth logout` | Clear stored access token |

Config file: `~/.ecomrads/config.json`

```json
{
  "api_base_url": "https://backend-ecomrads-production.up.railway.app",
  "access_token": "...",
  "imgbb_api_key": "..."
}
```

Environment overrides: `ECOMRADS_API_BASE_URL`, `ECOMRADS_ACCESS_TOKEN`, `IMGBB_API_KEY`.

---

## Upload

| Command | Backend | Notes |
|---------|---------|-------|
| `ecomrads upload <file\|url>` | ImgBB (`api.imgbb.com`) | Returns public HTTPS URL — copy into all creative commands |

Local files are base64-encoded and sent to ImgBB (max 32 MB). HTTPS URLs are passed through to ImgBB.

---

## Jobs

| Command | HTTP | Purpose |
|---------|------|---------|
| `ecomrads job get <job_id>` | `GET /jobs/{job_id}` | Fetch job status + result |
| `ecomrads job wait <job_id>` | `GET /jobs/{job_id}` (poll) | Poll until terminal |

Poll cadence: first check ~15s, then ~30s (45–60s for video).

Terminal statuses: `completed`, `failed`, `cancelled`.

---

## Creative commands

All POST **InnerJSON directly** to FastAPI (no `{ "body": ... }` wrapper — same as ecomrads-mcp HTTP client).

### `ecomrads photoshoot`

Route: `POST /post/edit`

| Flag | Field | Default |
|------|-------|---------|
| `--image` | `image_urls[]` | required |
| `--prompt` | `prompt` | required |
| `--aspect-ratio` | `aspect_ratio` | `1:1` |
| `--resolution` | `resolution` | `2K` |

Aspect ratios: `1:1`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`.

### `ecomrads storyboard`

Route: `POST /post/multi-angles`

| Flag | Field | Default |
|------|-------|---------|
| `--image` | `image_urls[]` | required (1–2) |
| `--prompt` | `prompt` | optional |
| `--aspect-ratio` | `aspect_ratio` | `4:5` |
| `--resolution` | `resolution` | `2K` |

Outputs 9 angle stills.

### `ecomrads video`

Route: `POST /post/animate`

| Flag | Field | Default |
|------|-------|---------|
| `--frame` | `image_url` | required (upload URL) |
| `--prompt` | `prompt` | required |
| `--duration` | `duration` | `10` |
| `--aspect-ratio` | `aspect_ratio` | `9:16` |
| `--resolution` | `resolution` | `std` |
| `--video-model` | `video_model` | `kling-3.0` |

### `ecomrads ugc`

Route: `POST /post/ugc`

| Flag | Field | Default |
|------|-------|---------|
| `--script` | `script` | required |
| `--image` | `image_urls[]` | required (1–4) |
| `--actor-image` | `actor_image_url` | optional |
| `--style` | `video_style` | `testimonial` |
| `--direction` | `direction` | `authentic` |
| `--duration` | `duration` | `5` |
| `--aspect-ratio` | `aspect_ratio` | `9:16` |

`video_style`: `testimonial`, `unboxing`, `how_to_use`, `vlog_style`  
`direction`: `authentic`, `high_energy`, `asmr_calm`, `urgent_salesy`

### `ecomrads ad`

Route: `POST /post/static`

| Flag | Field | Default |
|------|-------|---------|
| `--product-image` | `product_image_url` | required |
| `--instructions` | `instructions` | optional |
| `--format` | `ad_format` | `4:5` |
| `--slides` | `num_slides` | `1` |
| `--resolution` | `resolution` | `2K` |

### `ecomrads recreate`

Route: `POST /post/genanalysis`

| Flag | Field | Default |
|------|-------|---------|
| `--product-image` | `product_image_url` | required |
| `--ad-media` | `ad_media_url` | required |
| `--media-type` | `media_type` | `image` |

### `ecomrads analyze`

Route: `POST /post/ad-score` (Virality Analysis)

| Flag | Field | Default |
|------|-------|---------|
| `--media` | `media_url` | required |
| `--media-type` | `media_type` | `image` |
| `--context` | `context` | optional |

### `ecomrads spy`

Route: `POST /spy/` (sync — no job poll)

| Flag | Field | Default |
|------|-------|---------|
| `--query` | `query` | required |
| `--country` | `country` | optional |

---

## Global flags

| Flag | Purpose |
|------|---------|
| `--wait` | Block until job completes; print result URL(s) |
| `--wait-timeout` | Max wait (default `10m`) |
| `--wait-interval` | Poll interval (default `30s`) |
| `--json` | Machine-readable JSON output |
| `--no-color` | Disable color |

---

## Examples

```bash
ecomrads auth login
ecomrads upload ./product.jpg
ecomrads photoshoot --image <url> --prompt "luxury studio hero" --aspect-ratio 4:5 --wait
ecomrads video --frame <url> --prompt "slow push-in" --aspect-ratio 9:16 --wait
ecomrads analyze --media <url> --context "DTC skincare, IG feed" --wait
ecomrads spy --query "skincare serum" --country US --json
```
