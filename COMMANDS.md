# Commands — eComrads CLI

Reference for routes, flags, and request bodies. Every creative command returns a **job** — use `--wait` or `ecomrads job wait <id>`.

Sign in with `ecomrads auth login` before creative commands. The CLI stores your session in `~/.ecomrads/config.json`.

Auth: `Authorization: Bearer <token>` on all API calls (token from `auth login`).

Upload: when signed in, local files upload via the eComrads API — **no ImgBB key needed**. HTTPS URLs pass through unchanged. Optional `IMGBB_API_KEY` fallback if not signed in.

Advanced overrides (optional): `ECOMRADS_API_BASE_URL`, `ECOMRADS_ACCESS_TOKEN`, `ECOMRADS_MCP_URL`, `IMGBB_API_KEY`.

---

## Auth

| Command | Purpose |
|---------|---------|
| `ecomrads auth login` | Sign in via browser (OAuth — recommended) |
| `ecomrads auth status` | Show auth + upload mode |
| `ecomrads auth logout` | Clear stored credentials |
| `ecomrads auth token <token>` | Save access token manually (advanced) |
| `ecomrads auth imgbb-key <key>` | ImgBB fallback when not signed in (advanced) |

Config file: `~/.ecomrads/config.json`

```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

---

## Upload

| Command | Backend | Notes |
|---------|---------|-------|
| `ecomrads upload <file\|url>` | eComrads API when signed in | Returns public HTTPS URL for creative commands |


Local files are uploaded via the API (max 32 MB). HTTPS URLs are passed through as-is.

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

All POST JSON bodies directly to the eComrads API.

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
