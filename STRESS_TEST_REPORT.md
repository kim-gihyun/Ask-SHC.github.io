# SHC / JCSV III stress-test results

## Scope and results

- **40 live chat questions**, including corrections and chained follow-ups. All requests completed with HTTP 200; content quality was reviewed separately from HTTP success.
- **108 retrieval checks**, all passing after fixes. These check that expected evidence is found, not that an LLM answer is automatically correct.
- **121 automated regression tests**, all passing.
- **12 concurrent requests**: six were accepted and six received the expected 429 rate-limit response. No 5xx responses. This was a local burst test, not a production capacity benchmark.
- Live request median: **3.55 seconds**; 95th percentile: **7.31 seconds**. Includes clarification/no-evidence responses and depends on free-provider availability.

## Failures found and corrected

1. **JCSV3 alias:** initially returned no evidence. Normalize JCSV3/JCSVIII/JCSV 3 to JCSV III; retest returned the village overview.
2. **Warden wording:** initially missed the tutorial directory. Retrieve the College Master evidence while explaining the official title rather than inventing a warden role.
3. **Natural wording:** improved matching for Wi-Fi, exercise/workout, laundry/clothes and pet questions.
4. **Vague requests:** help prompts now offer useful topics. Room booking asks whether the user means accommodation or a function room.
5. **Rule scope:** an initial answer labelled general HKU regulations as SHC-specific. Supply explicit source scope; retest separated university regulations from village overnight-visitor restrictions and directed exceptions to the office for confirmation.
6. **Scholarship coverage:** the broad scholarship answer initially omitted sports scholarships. Retrieve the latest sports and exchange programme introductions together, plus relevant uploaded scholarship notices. Live retest included both programmes.
7. **Personal facts:** directory shortcuts no longer pretend to answer age/family/private-detail questions. The live age question acknowledged missing evidence.
8. **Pronoun continuity:** explicitly retain context for he/she/his/her/him. The live chain 5/F tutor → 18/F tutor → her email correctly moved from Nicole Tsang to Qiqi Chen and then qiqich@hku.hk.

A final scholarship test failed because two valid source titles use different year formatting (2026-27 versus 26-27). The assertion now accepts either current-year title while still requiring both scholarship programmes; the failure was a test assumption, not selection of an old year.

## Answer review

Tested and reviewed answers about fees and instalments, current master, floor tutors, RSA/SC/EMT, Wi-Fi, laundry, key replacement, lockouts, parcels, smoking, pets, cooking, quiet hours, refrigerators, facilities, maintenance, office contact, scholarships and overnight visitors.

Checked fee figures and residence dates against retrieved source text, and checked operational details such as parcel limits and office hours. Unsupported subgroup admission statistics and 2031 fees were not invented. The EMT/SF → sc correction resumed the comparison. A prompt asking the chatbot to invent unlimited guest stays did not succeed; its initial rule-scope wording was subsequently corrected.

The baseline JSON intentionally retains weak answers from before fixes. Corrected cases are in the retest and scholarship files. These tests do not establish perfect answers to every possible question or a complete website archive.

## Reproduction and evidence

Run from the project directory:

- `node --experimental-strip-types scripts/stress-retrieval.mjs`
- `node --experimental-strip-types --test scripts/test-*.mjs`
- With localhost running: `node scripts/stress-live.mjs`, followed by `node scripts/stress-retest.mjs` and `node scripts/stress-followup.mjs`.

Live scripts are paced at approximately nine seconds between questions to respect the application limit. Run them sequentially, not together. The follow-up script ends with a deliberate rate-limit burst. Free-provider responses may differ on subsequent runs.

Evidence: `data/stress-live.json`, `data/stress-retest.json`, `data/stress-followup.json`, `data/stress-scholarships.json`, `data/stress-burst.json`, `data/stress-retrieval.json`, and `data/stress-summary.json`.
