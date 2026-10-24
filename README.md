# Rift · Options Flow Stress Test

**Does the options-flow headline survive losing one contract?** Rift audits concentration in the provider-selected unusual-options sample. It groups reports by contract or expiry, omits each group separately, and shows how far the provider-tagged premium balance can move.

Built for **Most Unique Options Indicator**: Options Insight 60%, Execution 40%. Original implementation; MIT; #TSBuild26. **Published free with visible source on October 25, 2026; pending Store moderation. The hackathon form has not been submitted.** [Store listing](https://trendspider.com/trading-tools-store/indicators/6add16-rift-options-flow-stress-test/). No additional OPRA subscription is required by this build: the current account's included `request.unusual_options` endpoint was verified on five stocks. Full-chain APIs returned `not_entitled` and are not used by the production adapter.

## Open and reproduce

- Native source: [dist/rift.trendspider.js](dist/rift.trendspider.js).
- Local preview: `npm run preview`, then http://127.0.0.1:8768/preview/.
- Run `npm run build`, `npm test`, `npm run qa`. Node 20+ and Python 3; no npm dependencies or credentials.
- Native evidence and scope: [review/NATIVE-QA.md](review/NATIVE-QA.md). Independent review: [review/INDEPENDENT-REVIEW.md](review/INDEPENDENT-REVIEW.md).
- Publication evidence and current gate: [review/PUBLICATION.md](review/PUBLICATION.md).
- Numerical audit: [review/validation.json](review/validation.json).
- Submission copy: [submission/store-description.md](submission/store-description.md) and [submission/form-answers.md](submission/form-answers.md).

The local preview uses frozen captures, the production engine's calculated models and the production table specification, with an SVG ruler. Native chart rendering is checked separately. Raw provider responses remain local and ignored by Git; the reproducible automated tests use synthetic records. Re-running the real-data QA requires the locally captured `data/*-raw.json` files.

## Exact calculation

For the accepted reports in the returned sample, B is gross reported premium tagged only bullish, R only bearish, and U neutral, contradictory or unclassified. **Tagged premium balance = (B − R) / (B + R + U).** The displayed value is in percentage points. CALL/PUT never determines the tag. This is not net buying, signed capital flow, dealer positioning, a probability or a prediction.

Contract keys combine underlying, UTC expiry day, option type and strike. Expiry mode groups these contracts by expiry day. Removing group g produces **((B − B_g) − (R − R_g)) / (T − T_g)**. If nothing remains, the result is unknown. The ruler's endpoints are the minimum and maximum over every valid one-group omission, including groups below the visible table. Equal largest groups remain explicit; no arbitrary tied group is selected for a headline claim.

A material lead is bullish-tagged at +10 pp or above and bearish-tagged at −10 pp or below by default; between them is no material tagged lead. This user-adjustable threshold is an interpretation convention, not an estimated trading edge. Rift counts every omission that changes that three-way classification, including cases where a neutral baseline gains a lead only after an omission.

Premium-equivalent breadth is **1 / sum(group premium share²)**. It measures concentration: 1 means all premium sits in one group, N means N equally weighted groups. It does not count independent people, orders, institutions or conviction.

## What a trader can inspect

Read the sample balance and omission range together. Then inspect the groups whose removal changes the result. If a tagged lead dissolves when one contract is omitted, check that contract and the broader chain before attaching importance to a flow headline. Expiry mode exposes a different concentration: whether several apparently distinct contracts are all from the same expiration.

Ink/Paper palettes and Compact/Full layouts are available. The default compact card is 590px wide, positioned at x36/y88; native appearance settings can retain older offsets. Both layouts show the largest group and the low/high omission-range endpoints, deduplicated when one group has several roles. Remaining rows are filled by absolute balance impact. Full shows five groups instead of three. A star marks a displayed omission that changes the material lead. All groups still enter the range calculation.

## Data discipline and boundaries

- This is the latest returned **provider-selected sample**, potentially truncated, within a trailing 1–30-calendar-day window anchored to calculation time. The native endpoint returned 200 records per stock in this check, even though the cached API documentation describes a maximum of 300. Rift never claims that a requested time window or the whole market is completely covered.
- Event timestamps and expiry timestamps accept seconds or milliseconds. Positive numeric premium, a valid type/strike/expiry, matching ticker and non-future event time are required. Missing data is not zero flow.
- Identical repeated event IDs count once. Conflicting copies of an ID exclude every current-window copy, including contradictions returned outside the window or with invalid timestamps. The audit counts distinct affected conflicting IDs. Validly dated, unrelated older records are filtered out before validating their other metadata; old-only conflicts do not suppress current conditions. Different IDs remain different reports even if their visible fields match. Reports without IDs remain in the descriptive display but suppress current conditions; they are never silently called duplicates.
- Invalid records, conflicting or missing IDs, fewer than 10 accepted reports, fewer than 3 groups, under 50% classified premium, or a newest event older than 36 hours suppress current conditions. The older-sample limit applies on weekends as well; the display remains labeled with event age.
- Provider tags do not establish initiator, intent, opening versus closing, or whether several reports are parts of one order. Omission is a concentration sensitivity test, not a simulation of executing or reversing a trade. Past-expiry reports can legitimately appear in the historical sample; they are not current open positions.
- Three scanner conditions populate only the latest chart bar. All prior bars are null. Use **Signal active** on the last bar for the current returned sample; there is no historical event series or point-in-time backtest.
- Native batch-scanner reliability remains unresolved: an earlier S&P 100 run completed, but v1.1 repeat runs on S&P 100 and Recently viewed ended with TrendSpider's `scan_timeout`. The chart renders successfully; the cause of the scanner timeouts has not been isolated. Do not treat the companion scanner as fully verified or promise reliable batch execution.

## Validation

Eighteen automated tests verify hand-calculated examples, omissions by contract and expiry, neutral denominators, ID handling across window boundaries, timestamps, invalid inputs, stale/empty/one-group samples, ties, scaling, permutation invariance, safe labels, decisive-row visibility, and the latest-bar-only native adapter. The real-data QA independently recomputes each omission from the remaining raw reports across CVX, AAPL, TSLA, NVDA and JPM: 1,000 returned records, ten contract/expiry views and 553 omissions. A separate read-only reviewer also reproduced all 553 omissions and verified the two v1.1 fixes; see the review record for scope and the subjective rubric assessment.

In the NVDA capture, balance is +12.4 pp. The contract-omission range is +6.4…+15.6 pp; three of 87 omissions remove the +10 pp material lead. In expiry mode it is +8.1…+20.4 pp, with two of 19 omissions removing the lead. These are descriptive sample results, not performance evidence.

Sources: [official hackathon](https://trendspider.com/hackathon/), [judging rubric](https://drt8s3xkrl8yg.cloudfront.net/1/assets/pdf/hackathon/2026_How_You_Are_Judged.pdf), [scripting API](https://platform-docs.trendspider.com/scripting/docs/), [unusual-options widget](https://help.trendspider.com/articles/unusual-options-widget). Public comparison: [review/COMPETITION.md](review/COMPETITION.md).
