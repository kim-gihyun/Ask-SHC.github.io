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
