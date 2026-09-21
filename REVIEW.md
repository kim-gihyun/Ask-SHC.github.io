# Website review — 21 September 2026

Reviewed the student chat, saved conversations, source citations, admin test workspace and document routes, model fallback, retrieval, and mobile/desktop presentation. The SHC watermark is now exactly 40% opacity.

## Fixes

- **Answer correctness:** combined master-and-floor-tutor questions now return both people. Added a regression test.
- **Evidence clarity:** new student answers include only sources actually cited, with citation numbers remapped consistently. Admin trials retain the complete retrieved set.
- **Request handling:** chat, admin sign-in and document editing validate JSON objects and enforce actual byte limits, including requests without Content-Length. Malformed payloads return 400 rather than a generic server failure.
- **Privacy:** chat JSON responses explicitly disable caching; admin diagnostics remain session-protected.
- **Saved chats:** validate restored metadata, reject unsafe source URLs and malformed citation/attempt records, and preserve reference alignment if an invalid source list is discarded.
- **Waiting and cancellation:** Stop aborts an in-progress response and restores the composer; retry controls cannot start overlapping requests. Unmounting aborts pending requests.
- **Formatting:** render ordinary Markdown lists as readable lists and separate paragraphs without rendering raw HTML.
- **Keyboard access:** visible focus outlines, mobile menu focus containment, Escape dismissal, focus restoration, and expanded-state announcements.
- **Mobile layout:** larger action targets, readable input text, wrapping long content, and a scrollable sidebar.
- **Admin trial layout:** flex-based height accommodates a wrapping toolbar instead of assuming a fixed 50-pixel bar.
- **Visual consistency:** removed conflicting watermark overrides, fixed an undefined color token, retained the restrained composer halo and readable backing behind answers/citations.

## Verification

- 107 automated tests passed, including malformed JSON, byte limits, corrupted storage, combined staff lookup and citation renumbering.
- TypeScript checking and production build passed.
- Live requests: malformed JSON 400, oversized payload 413, unauthenticated diagnostic request 401; ordinary RSA question returned 200 with one cited source and no provider diagnostics.
- Browser: examined 1440x900 desktop and 390x844 mobile. No horizontal overflow at either width; computed watermark opacity 0.4. Stop cancelled a live response. Escape closed mobile navigation and restored focus. No errors in the inspected browser console log.
- Earlier deletion/Undo and reload persistence checks remain covered in VERIFICATION.md.

## Assessment

| Area | Score / 4 | Scope |
| --- | --- | --- |
| Accessibility | 3 | Keyboard and mobile checks completed; not a full screen-reader/WCAG certification. |
| Performance | 3 | Bounded requests/history, cancellable generation; no production load test. |
| Responsive layout | 3 | Desktop and narrow mobile checked; device/browser matrix not exhaustive. |
| Theming | 3 | Consistent SHC palette and corrected token; light theme only. |
| Visual consistency | 3 | Quiet institutional UI; source clutter reduced and controls aligned. |

Total: 15/20, good within the reviewed scope. No redesign was needed; the main problems were behavioral and accumulated UI details.

## Practical limits

The 77-source collection covers audited official navigation links and existing materials, not every archive page or image-only detail. Chat archives are local to this browser, and model context is bounded. Provider availability and shared free-account quotas still affect generation; document excerpts remain the fallback. Admin authorization was verified at the API boundary; this pass did not perform a fresh authenticated browser upload/edit/delete cycle. Deployment and production load testing are outside this local review.

### Final code-quality pass
Reviewed the edited React components with the React best-practices checklist. Removed unused imports, stabilized admin data-loading callbacks, added missing effect dependencies, and used client-side navigation for the internal admin link. Targeted ESLint reports zero errors; two advisory warnings remain for plain logo images (no image-optimization service is configured). Browser-storage hydration and persistence intentionally run in effects and carry narrowly scoped explanations for that lint exception.
