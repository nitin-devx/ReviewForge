# ReviewForge 🤖

> An AI-powered GitHub Action that automatically reviews pull requests like a senior engineer — posting intelligent inline comments directly on your PR diff.

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Ready-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Powered by Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev)

---

## What it does

When a developer opens or updates a pull request, ReviewForge:

1. Fetches the PR diff from GitHub
2. Parses it into structured hunks with line-level metadata
3. Chunks the diff to stay within AI token limits
4. Sends each chunk to Google Gemini with a schema-constrained prompt
5. Maps the AI findings back to exact diff line positions
6. Posts a single grouped review with inline comments + a summary

Every finding includes a severity level, a clear explanation, and a concrete suggested fix — exactly like a senior engineer would leave during a real code review.

---

## Example output

**Inline comment on a PR diff line:**

```
🟠 WARNING: Lack of input validation for item price

No null check before accessing user.email — will throw if email is undefined.

Suggested fix: Add `if (!user || !user.email)` guard before this line.

— ReviewForge AI
```

**PR summary comment:**

```
🤖 ReviewForge Summary

Reviewed 3 file(s) — found 5 issue(s) across 2 file(s).

| Severity  | Count |
|-----------|-------|
| 🔴 Critical   | 1 |
| 🟠 Warning    | 2 |
| 🟡 Suggestion | 1 |
| ⚪ Nitpick    | 1 |

See inline comments below for details.
```

---

## Quick start

### Step 1 — Add the workflow file

In your repo, create `.github/workflows/reviewforge.yml`:

```yaml
name: ReviewForge

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run ReviewForge
        uses: nitin-devx/Reviewforge@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
```

### Step 2 — Add your Gemini API key as a secret

1. Get a free API key at [aistudio.google.com](https://aistudio.google.com)
2. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GEMINI_API_KEY`, Value: your key

> **Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions — you do not need to create it manually.

### Step 3 — Open a pull request

That's it. ReviewForge runs automatically on every new or updated PR.

---

## Configuration

Add optional configuration via the `with:` block:

```yaml
- name: Run ReviewForge
  uses: nitin-devx/Reviewforge@main
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    review_level: strict        # strict | standard | light (default: standard)
```

### `review_level` options

| Level | What gets reviewed |
|---|---|
| `light` | Critical and warning issues only — minimal noise |
| `standard` | Critical, warnings, and suggestions (default) |
| `strict` | Everything including nitpicks — maximum coverage |

---

## How it works — architecture

```
PR Opened / Updated
        │
        ▼
  GitHub API (Octokit)
  Fetch changed files + raw diff
        │
        ▼
  Diff Parser
  Raw unified diff → structured hunks
  with line numbers per added line
        │
        ▼
  Chunking Engine
  Split files into token-safe chunks
  (~3000 tokens max per chunk)
        │
        ▼
  Gemini AI Reviewer
  Schema-constrained JSON prompt
  Returns: line, severity, issue,
  explanation, suggestion
        │
        ▼
  Review Aggregator
  Filter by review_level
  Map findings to GitHub line positions
        │
        ▼
  GitHub Review API
  Post single grouped review
  with inline comments + summary
```

---

## Project structure

```
src/
├── github/
│   ├── client.js           Authenticated Octokit client
│   ├── pr-fetcher.js       Fetch PR files + real head SHA
│   ├── comment-mapper.js   Map findings to GitHub comment shape
│   └── review-poster.js    Post grouped review via createReview API
├── parsers/
│   └── diff-parser.js      Unified diff → structured hunks
├── chunking/
│   └── chunker.js          Token-aware diff chunking
├── ai/
│   ├── gemini-service.js   Gemini API integration
│   └── reviewer.js         Chunk orchestration + per-file isolation
├── prompts/
│   └── review-prompt.js    System prompt + JSON schema definition
├── reviewers/
│   └── summary-builder.js  Deterministic PR summary (no extra AI call)
├── config/
│   └── loader.js           Review level config + validation
├── utils/
│   └── retry.js            Exponential backoff for flaky API calls
└── index.js                Entry point + event guard
```

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github_token` | ✅ | — | GitHub token for API access. Use `secrets.GITHUB_TOKEN` |
| `gemini_api_key` | ✅ | — | Google Gemini API key |
| `review_level` | ❌ | `standard` | Review strictness: `strict`, `standard`, or `light` |

---

## Supported events

ReviewForge runs on:
- `pull_request` → `opened` — new PR created
- `pull_request` → `synchronize` — new commits pushed to existing PR
- `pull_request` → `reopened` — previously closed PR reopened

---

## Rate limits

ReviewForge uses Google Gemini's API. The free tier allows approximately 5 requests per minute.

For large PRs on the free tier, set `REVIEW_THROTTLE_MS` as an environment variable in your workflow to add a delay between requests:

```yaml
env:
  REVIEW_THROTTLE_MS: "13000"   # 13 seconds between requests — safe for free tier
```

Paid Gemini API tiers have significantly higher limits and typically do not need this.

---

## Tech stack

- **Runtime:** Node.js with ES Modules (ESM)
- **GitHub integration:** `@actions/core`, `@actions/github` (Octokit)
- **AI:** Google Gemini (`gemini-2.5-flash`) via `@google/genai`
- **Diff parsing:** Custom unified diff parser with hunk + line-number tracking
- **Retry logic:** Exponential backoff with Gemini-specific error shape handling

---

## Local development

Clone the repo and install dependencies:

```bash
git clone https://github.com/nitin-devx/Reviewforge.git
cd Reviewforge
npm install
```

Create `test/run-local.ps1` (PowerShell) or equivalent shell script:

```powershell
$env:GITHUB_TOKEN="your_github_token"
$env:GEMINI_API_KEY="your_gemini_key"
$env:GITHUB_EVENT_NAME="pull_request"
$env:GITHUB_EVENT_PATH="./test/mock-pr-event.json"
$env:GITHUB_REPOSITORY="owner/repo"
$env:GITHUB_REF="refs/pull/1/merge"
$env:GITHUB_WORKFLOW="ReviewForge"
$env:GITHUB_ACTION="reviewforge"
$env:GITHUB_ACTOR="your-username"

node src/index.js
```

Update `test/mock-pr-event.json` with a real open PR from any repo your token has access to.

---

## Known limitations

- `node_modules` is committed directly to the repo (standard approach for JS-based GitHub Actions without a bundling step). A future improvement is to bundle with `@vercel/ncc` to produce a single `dist/index.js`.
- Binary files (images, compiled assets) are automatically skipped during review.
- Very large PRs (50+ files) may hit Gemini's rate limits on the free tier.

---

## License

MIT
