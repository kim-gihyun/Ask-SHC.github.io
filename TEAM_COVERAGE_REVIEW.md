# Student organisation coverage fix

- Removed the small sidebar label beneath the SHC logo.
- Refreshed 29 SHC organisation pages successfully and preserved the official Teams menu as a separately indexed source: 30 groups across four categories. External Schola Cantorum links are recorded as official navigation evidence, not represented as crawled third-party content.
- Added Chess Club and Drama Club pages, previously omitted because their text is short. Both currently say “To be updated”; no activities are inferred from those pages.
- Knowledge base now contains 80 documents.
- Broad teams/organisations questions retrieve the complete directory and one introductory excerpt per linked SHC organisation, plus relevant supplementary organisation documents, with a 45,000-character budget. Specific questions still rank relevant chunks rather than sending every unrelated document.
- Expanded Media/Photography aliases and retained EMT/SC expansion. Overview instructions distinguish listed organisations from confirmed recruitment.
- Added coverage validation to reject overview answers that omit directory names or state an inconsistent explicit total. Sources shown to students remain the sources cited in the answer; the full retrieved set is sent to the model and available to admin diagnostics.
- Verification: 134 regression tests passed, including the two user screenshot queries, organisation coverage, aliases, supplementary documents, omission and total checks. Type checking passed. Live responses and evidence saved in data/teams-live-check.json and data/teams-final-check.json.

No claim is made that every model reads every token perfectly, that placeholder pages contain missing facts, or that the public website lists every currently active informal group.
