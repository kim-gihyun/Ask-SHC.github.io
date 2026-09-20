# Ask SHC

A working English-language RAG chatbot for Shun Hing College and JCSV III, with the supplied SHC logo, responsive student chat, citations, source excerpts, and a password-protected administrator library.

## Open and use

- Ask a question on the chat screen. Click any numbered citation to inspect the actual excerpt and open its original source.
- Students see chat and relevant source citations. The complete library and uploaded originals require server-side authentication.
- Open `/admin` to sign in, browse 72 collected sources, upload searchable PDF/TXT/Markdown files, and edit/remove uploaded material. Limits: 5 MB, 150 PDF pages and 250,000 extracted characters. OCR scanned files first.
- The current local password and instructions are in the ignored `ADMIN_ACCESS.txt`. The server accepts `ADMIN_PASSWORD`, falling back to `ADMIN_TOKEN`. Configure matching values in `.env` and `.dev.vars`. Passwords are never sent to the LLM or included in client code.
- Login uses a signed six-hour HttpOnly/SameSite=Strict cookie (Secure over HTTPS). Login attempts are throttled; sign-out clears the cookie. Changing the server secret invalidates sessions. Passwords are not stored in browser local/session storage.
- Relevant uploaded facts and excerpts can appear in student answers. This is a private management library, not a mechanism for storing confidential information that students must never learn.
- Uploads persist in D1/R2 and are used immediately. Editing replaces the stored download with a matching TXT version. Removal excludes it from subsequent answers. Official pages remain read-only in the UI; upload updated notices or refresh the source collection.

## Knowledge collection

See **KNOWLEDGE_SUMMARY.md** for coverage, limitations and all 72 original URLs. The collection includes 54 SHC and 18 JCSV III sources, comprising 63 pages and 9 PDFs, collected on 19 September 2026. Original PDF files are retained under `data/originals/`; extracted text, source URLs, source dates, hashes and PDF page numbers are in `data/knowledge.json`.

The Tutorial Team page was refreshed on 20 September 2026. Its directory includes the College Master, 11 tutors and two resident fellows. Names, roles, floors and emails are preserved together. Identity/floor queries support direct cited lookups without model availability. Biographical and interpretive questions use RAG.

The collection is bounded, not exhaustive. Private portal pages, inaccessible embedded content and scanned/image-only material require administrator upload. Website refreshes require rebuilding/redeploying; uploads are available immediately. No test suite can guarantee an answer to every possible question; missing or conflicting evidence should remain explicit.

## Architecture

- React UI with Vinext/Vite and Cloudflare Worker/D1/R2 bindings, running locally.
- Server-only `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` and administrator password.
- Twenty-one free text-chat models from the requested list, verified against the OpenRouter catalogue. Qwen and Gemma are first by default; `lib/models.ts` lists the complete order. Zero maximum input/output pricing is enforced. Paid Lyria music generation and the content-safety classifier are excluded. Provider errors, empty/truncated answers and invalid citations trigger fallback. Shared account quotas cannot be reset by switching models.
- Paragraph-aware chunks (~1,700 characters, ~220 overlap), PDF page provenance, BM25 lexical retrieval, a small resident-language synonym map, title/category matching, document diversity and conservative historical downweighting. This implementation does not claim to use vector embeddings.
- Up to eight relevant excerpts plus limited conversation history are sent to OpenRouter. Single-digit floor numbers are retained; EMT/SC abbreviations are expanded. Document content is untrusted evidence, never system instructions. Answers are in English and constrained to that evidence.
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
node --experimental-strip-types --test scripts/test-*.mjs
node scripts/run-framework.mjs build
```

Refresh sources:

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/collect.py
# Refresh one official page without replacing the other sources:
python scripts/collect.py --refresh-url https://shunhingcollege.hku.hk/tutorial-team/
```

Review source dates, titles, category changes and historical material after refresh. Keep `data/knowledge.json` and the source summary aligned. Rebuild/deploy to publish a refresh. The crawler uses a six-worker pool, official-domain allowlist, three crawl passes, a 220-URL cap and content-hash deduplication.

## Integrating with the official website

The app is currently running locally. Online publishing was attempted but blocked because the hosting source endpoint git.chatgpt-team.site does not resolve in DNS. No live hosted deployment was completed, and the official SHC website has not been changed. For public launch, the college needs to approve current content, the public audience and use of OpenRouter, and provide the website editor/deployment access or ask its webmaster to embed the app. The source is portable to a Cloudflare Workers account with D1/R2; other platforms require replacing those storage bindings.

Use the full-page app link or the sample iframe in `embed-example.html` after substituting the approved public app URL. Private Sites sign-in can prevent embedding; do not use the owner-only review URL as the public student deployment. A public launch also needs a deliberate framing/CSP policy for the real college domain and an institutional administrator sign-in plan if a shared admin token is insufficient.

## Model availability

The live upload/edit test on 20 September 2026 returned Qwen 429, Gemma 429, then Ling Flash VL 200 with a cited answer from the edited document. Free model availability is not guaranteed. The chat streams attempt results while moving through the list and displays which model answered.

The key supplied in chat is configured for testing. Replace it before public launch and update both local secret files and hosted environment secrets. Never commit `.env`, `.dev.vars` or administrator tokens.


## Provider-outage behavior

When the selected free providers are unavailable, the app returns HTTP 200 with explicitly labelled Document-only mode: verbatim passages from the retrieved sources and aligned citations. It does not pretend that a model generated an answer. Exact document titles are prioritized for matching questions.

Each question attempts the configured primary model, then the remaining free models in order. Previous failures do not silently skip models. Each model has a 12-second timeout; the first valid answer stops the sequence. Shared account daily quotas, authentication and account restrictions stop immediately. The local eight-questions-per-minute limit still applies.

The chat displays an ordered Model attempts panel with model names, results and timestamps. It expands automatically for fallback and document-only responses. Server logs contain only these diagnostic fields, not keys or questions. Token usage does not demonstrate whether a rejected request was attempted. See `VERIFICATION.md` for automated and live checks.
