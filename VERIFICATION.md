# Verification — 19 September 2026

- TypeScript type check passed.
- Production Worker/client build passed.
- Browser checks: chat screen, source library search, original PDF links, administrator form, mobile navigation; no browser console errors observed.
- Responsive checks: desktop at 1440 px and mobile at 375 px, with no horizontal overflow observed.
- Library: 72 documents and 182 excerpts served successfully.
- A live answer from `qwen/qwen3.8-27b:free` returned valid source references for JCSV III visitor hours.
- Subsequent upstream OpenRouter requests returned HTTP 429. Model generation for additional test questions could not be verified while the free endpoint was limited. The app preserved retrieved sources and displayed the availability message.
- Retrieval found laundry guidance in the FAQ/reminders and 2026–27 fee information in the current charges documents.
- A question about 2035 fees correctly returned no confirmed information rather than inventing a fee.
- Unauthorized uploads rejected (401); text upload persisted (201); identical upload rejected (409); downloaded bytes matched; removal succeeded and the file returned 404.
- A temporary uploaded document ranked first for its unique test query. Live answer generation for it was rate limited.
- PDF upload, text extraction and persistent storage succeeded (201, 7,626 extracted characters), followed by fixture removal.
- Temporary test documents removed.
- Actual API key and administrator token absent from production build files.

This verifies the implementation and representative flows, not the factual accuracy of every possible model answer. A college content review is still needed before public launch.

## Free-model fallback update

- OpenRouter confirmed 49 of 50 daily free requests remained; the live Qwen error identified the upstream shared provider pool.
- Both Qwen and Gemma were tried by the updated endpoint; both returned provider HTTP 429.
- Six isolated fallback tests passed: recovery, shared daily quota, both unavailable, authentication, context limit, and free-only enforcement.
- The student-committee query with an admissions question in history now retrieves committee/governance sources; unrelated question history is excluded.
- Hosted publishing is incomplete: the source hosting endpoint returned DNS NXDOMAIN.


## Document-only resilience fix

- Minimal direct requests to both permitted models still returned upstream shared-pool HTTP 429, confirming an external capacity limit.
- Nine tests passed, including verbatim source extraction, citation alignment, document deduplication and cooldown behavior.
- The exact question "what does the student committee do?" returned HTTP 200 with real Student Committee excerpts, and the result was verified in the browser.
- Document-only quotations are explicitly distinguished from AI-generated answers.

## Explicit model switching and attempt visibility (19 September 2026)

- Removed the 90-second cooldown skip described in the earlier verification. Each new eligible question gets fresh model attempts.
- Thirteen tests passed: Qwen to Gemma and Gemma to Qwen failover, repeated questions after both fail, shared quota, auth, context/output limits, error envelopes, success short-circuit, free-only routing and source quotations.
- TypeScript checking and production build passed.
- Live browser: the Student Committee question received a cited Qwen answer. A successful primary correctly made only one attempt.
- Live application helper with Gemma first: Gemma returned 429 at 07:03:42.281 UTC and Qwen returned 429 at 07:03:42.943 UTC.
- Live browser, visitors question: Qwen returned provider 429 at 15:03:49 Hong Kong time, followed by Gemma provider 429 at 15:03:50. Both appeared in the expanded Model attempts panel, followed by document-only evidence. No browser console errors were recorded.
- The fallback wiring is verified; Gemma did not successfully generate an answer during this check because its provider rejected the request.

## Staff retrieval, admin privacy and uploads (20 September 2026)

- Refreshed the official Tutorial Team page. The existing collection already contained its names and assignments, but retrieval dropped single-digit numbers and limited page chunks. The directory now preserves all 14 people together; 24 floor assignments (5–28) are individually tested.
- Sixty automated tests passed, covering staff/floor lookups, current versus founding master, missing facts, eleven topic coverage queries, uploaded/edited evidence, sessions, model fallback and stream parsing. TypeScript and production build passed.
- Anonymous library listing, original-file download, editor access, upload, editing and deletion returned 401. Cross-origin mutation was rejected. Correct password creates an HttpOnly/SameSite cookie; wrong password is rejected; logout clears the cookie.
- Live upload → edit → download returned matching revised text. Anonymous download was denied. The public chatbot used the revised booking code with a valid citation and did not expose the uploaded-file URL.
- That live answer recovered from Qwen 429 and Gemma 429 using Ling Flash VL (200). The disposable test source was removed afterward.
- Browser: student navigation contains no library/management controls; a complete master/tutor/fellow answer was displayed with citations. The separate admin URL showed a password screen without document metadata. No errors were recorded on the admin login page.
- These checks verify representative retrieval and access boundaries, not universal factual accuracy. Uploaded content is intended to inform public student answers even though library management and full downloads are private.

## Conversation memory verification (2026-09-20)
- Fixed history being discarded for short corrections such as "sc".
- Added shared client/server history validation and size limits, plus contextual retrieval for chained follow-ups.
- Exact live API regression: prior "what is the difference between emt and sf", followed by "sc", returned HTTP 200 and a sourced EMT versus Student Committee comparison.
- All 66 tests pass, including six new context, retrieval, reset, validation and Unicode request-size regressions. TypeScript check and production build pass.
- Local development server available at http://localhost:5173/. Conversation history is temporary, not persistent across reloads.

## Persistent conversation verification (2026-09-20)
- Browser tested: submitted a question, reloaded, and verified the question, answer and citations restored.
- Browser tested: New conversation retained the previous chat in Saved conversations; selecting it restored its full transcript.
- Visually inspected the HKU crest and faint SHC watermark at the current mobile-width viewport.
- All 68 automated tests pass, including archive validation and relevant older-turn recall. TypeScript and production build pass.

## Student UI and admin trial chat (2026-09-20)
Student conversations hide model attempts and provider labels, including previously saved answers. Model diagnostics require an authenticated admin session and the test-chat request header; anonymous diagnostic requests return 401. The /admin workspace offers Open test chat alongside material management. Test chats use the same retrieval and model fallback pipeline and a separate browser archive. Source excerpts remain inspectable.

Polished the saved-conversation picker, increased watermark opacity, added a subtle composer halo, and reduced home-screen copy. Live API checks confirmed anonymous diagnostic denial, student responses without model details, and authenticated responses with attempt records. Browser inspection confirmed the styled picker and hidden diagnostics on saved student answers. All 68 tests, TypeScript checking and production build passed.

## Coverage and chat controls (2026-09-21)
- Added per-chat deletion with Undo in the saved conversation picker; verified deleting and restoring a chat through the browser.
- SHC watermark opacity is 60%; answer text and source chips retain pale backing for readability.
- Refreshed all previously collected sources and all eligible official homepage navigation links. 81 URLs checked without failures; 77 distinct source documents retained. Audit: data/coverage-audit.json. Re-run with scripts/audit-coverage.py.
- The ambassador question was a terminology mismatch: the official source says Residential Student Advisers (RSA). Added matching for RSA, ambassadors, and advisor spellings, with explicit official-name clarification in answers. Live exact question returned HTTP 200 with the RSA duties and source citation.
- Added 29 regression cases: three RSA wording variants and retrieval checks for all 26 SHC team/club pages. All 97 tests and production build pass.
- Coverage scope is explicit: this audit covers existing documents and homepage-linked official pages/PDFs. It does not certify every historical archive page, externally hosted resource, or information embedded solely in images/video. Missing evidence must remain explicit rather than fabricated.

## Broad review (2026-09-21)
See REVIEW.md for the full scope and limits. Watermark set to 40%; fixed combined master/tutor lookup, added Stop generation, hardened JSON byte limits and saved metadata, reduced student citations to used sources, improved Markdown formatting, mobile keyboard navigation, focus styles, touch targets and admin layout. All 107 tests passed. Live bad-request/auth checks and a cited answer succeeded; desktop/mobile checks found no horizontal overflow. Targeted lint: no errors, two logo optimization advisories.
