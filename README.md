# Ask SHC

A working English-language RAG chatbot for Shun Hing College and JCSV III, with the supplied SHC logo, responsive student chat, citations, source excerpts, a searchable document library, and administrator uploads. The initial knowledge base contains 182 searchable excerpts.

## Open and use

- Ask a question on the chat screen. Click any numbered citation to inspect the actual excerpt and open its original source.
- Use **Source library** to search/filter the 72 collected sources.
- Use **Manage documents** to upload a searchable PDF, UTF-8 TXT or Markdown file (5 MB, 150 PDF pages, 250,000 extracted characters maximum). OCR scanned files first.
- The administrator token is in your local `.env` file under `ADMIN_TOKEN`. Copy that value into the access field. It is never sent to the LLM, exposed in a public asset, or persisted in browser storage. Keep this file private.
- Only approved public student information should be uploaded. Uploaded originals and excerpts are readable by users with site access.
- Uploads persist in D1 and R2. Local and hosted stores are separate. An uploaded source can be removed from Manage documents after confirming removal.

## Knowledge collection

See **KNOWLEDGE_SUMMARY.md** for coverage, limitations and all 72 original URLs. The collection includes 54 SHC and 18 JCSV III sources, comprising 63 pages and 9 PDFs, collected on 19 September 2026. Original PDF files are retained under `data/originals/`; extracted text, source URLs, source dates, hashes and PDF page numbers are in `data/knowledge.json`.

The collection is bounded, not exhaustive. Private portal pages, inaccessible embedded content and scanned/image-only material require administrator upload. Website refreshes are deliberate and require rebuilding/redeploying; uploads are available immediately.

## Architecture

- React UI with Vinext/Vite, deployed as a Cloudflare Worker through Sites.
- Server-only `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` and `ADMIN_TOKEN`.
- Models: `qwen/qwen3.8-27b:free` with automatic fallback to `google/gemma-4-31b-it:free` on provider rate limits, unavailability, timeouts and context/output limits. Only these two free models are allowed, with zero maximum input/output pricing. Recently rate-limited models are deprioritized for 90 seconds. Account-wide daily quotas cannot be reset by switching models.
- Paragraph-aware chunks (~1,700 characters, ~220 overlap), PDF page provenance, BM25 lexical retrieval, a small resident-language synonym map, title/category matching, document diversity and conservative historical downweighting. This implementation does not claim to use vector embeddings.
- Top six relevant excerpts plus limited conversation history are sent to OpenRouter. Document content is treated as untrusted evidence, never system instructions. Answers are in English and constrained to that evidence.
- Citation-number validation, no-evidence responses, explicit year checks for fees/admissions, source inspection and rate-limit error states. Citation validation checks references, not factual entailment; staff review remains necessary.
- Eight requests per IP per minute using D1. IPs are hashed for ephemeral counters, cleared after two minutes. Chat transcripts are not saved by this app; OpenRouter and its model provider process prompts under their own data policies.
- Administrator uploads are authenticated, extension/content checked, size limited, hashed to prevent duplicate uploads and stored using prepared SQL. Secrets never belong in browser code.

## Local development

Requires Node 22.13+ (Node 24 recommended) and npm.

```powershell
npm ci
# On a fresh clone, copy .env.example to .env and fill it in.
Copy-Item .env .dev.vars
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config wrangler.local.json --file drizzle/0000_icy_arachne.sql
node scripts/run-framework.mjs dev --host 127.0.0.1
```

The SQL initialization is for a fresh database only. Do not re-run the same CREATE statements on an already initialized database. Local URL: http://localhost:5173/ .

In the supplied Windows environment, the npm command shim has a path issue. The equivalent installation command is `node 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js' ci`. Direct Node commands above avoid that shim for development/builds.

Validation and build:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/run-framework.mjs build
```

Refresh sources:

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/collect.py
```

Review source dates, titles, category changes and historical material after refresh. Keep `data/knowledge.json` and the source summary aligned. Rebuild/deploy to publish a refresh. The crawler uses a six-worker pool, official-domain allowlist, three crawl passes, a 220-URL cap and content-hash deduplication.

## Integrating with the official website

The app is currently running locally. Online publishing was attempted but blocked because the hosting source endpoint git.chatgpt-team.site does not resolve in DNS. No live hosted deployment was completed, and the official SHC website has not been changed. For public launch, the college needs to approve current content, the public audience and use of OpenRouter, and provide the website editor/deployment access or ask its webmaster to embed the app. The source is portable to a Cloudflare Workers account with D1/R2; other platforms require replacing those storage bindings.

Use the full-page app link or the sample iframe in `embed-example.html` after substituting the approved public app URL. Private Sites sign-in can prevent embedding; do not use the owner-only review URL as the public student deployment. A public launch also needs a deliberate framing/CSP policy for the real college domain and an institutional administrator sign-in plan if a shared admin token is insufficient.

## Model availability

A live Qwen answer with citations was verified. Subsequent requests returned OpenRouter 429 free-endpoint limits. The app reports this honestly and keeps the retrieved excerpts available; it does not fabricate an answer. It automatically tries Gemma 4 31B if Qwen is unavailable, and shows which model answered. Both free endpoints were provider-rate-limited during the latest live test; the account still had 49 of 50 daily requests available. Free model availability is not a service guarantee. Before launch, assess expected student traffic against the account and provider limits.

The key supplied in chat is configured for testing. Replace it before public launch and update both local secret files and hosted environment secrets. Never commit `.env`, `.dev.vars` or administrator tokens.

