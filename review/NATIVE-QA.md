# Rift native validation · October 24, 2026

Production build **1.1.0**, **22,750 bytes**, SHA256 `1aa909fa35c9fd4dfe773d8b939c567fb9d551d02b63db139ff90f0689b2b9d7`.

## Native save and rendering

Saved privately as **Rift - Options Flow Stress Test** in TrendSpider's Custom Indicator Editor. The editor acknowledged no unsaved changes. The compiled source uses only the account's included `request.unusual_options` endpoint; no OPRA chain or paid data request is in the production adapter. Full-chain and single-expiry probes both returned `not_entitled`; the user declined that add-on.

An older private QA copy is retained under the distinct name **Rift - Native QA Draft**. Its chart instance was removed. The final chart contains one Rift production instance; Harbor was removed from this chart view only, without altering its source or publication.

| Native case | Verified result | Evidence |
| --- | --- | --- |
| CVX, Ink/Compact/Contract | −3.1 pp baseline; omission range −10.3…+3.7 pp; one of 92 contract omissions changes the three-way threshold state. | `screenshots/native-cvx-compact.png` (v1.0 historical evidence; unchanged sample arithmetic) |
| NVDA, Ink/Compact/Contract, v1.1 | +12.4 pp baseline; +6.4…+15.6 pp range; 3 / 87 omissions remove the +10 pp material lead. TOP, LOW* and HIGH rows are visible, including the 220 call expiring November 20 at +6.4 pp without that contract. | `screenshots/native-nvda-contract.png` |
| NVDA, Paper/Full/Expiry, v1.1 | Same +12.4 pp baseline and $11.91M accepted premium. +8.1…+20.4 pp range; 2 / 19 expiry omissions change the lead. TOP/HIGH, LOW* and remaining impact rows render clearly with the role legend. | `screenshots/native-nvda-paper-expiry.png` |

The native omission ruler and sample tick were visually checked. Both palettes were tested on the current dark price-chart background. A complete native light-chart background switch was not tested. Full and Compact fit the normal chart panel; an actual Store publication preview has not been configured yet.

## Native scanner

A new **Daily** scanner used **Rift → Sample lead changes when one group is omitted → (last) → Signal active**, with Paper/Full/**Expiry**/7-day/10-pp inputs, over **S&P 100 Index**. The completed scan included **NVDA**, matching its chart and fixture calculation. Other results are provider-sample filters, not individually audited financial conclusions or recommended trades.

The companion is saved privately as **Rift - Current Sample Dependence**, with no schedule enabled. Evidence: `screenshots/native-sp100-scan.png` is the earlier v1.0 successful run. Only this condition completed end to end natively; the adapter test checks all three registered output arrays and confirms that every historical element is null.

**v1.1 repeat limitation:** an S&P 100 repeat and a separate Recently viewed run both ended with TrendSpider's `scan_timeout`. See `screenshots/native-scan-timeout.png` for the latter. The cause has not been isolated; successful chart rendering and passing adapter-array tests do not establish reliable native batch execution. The saved S&P 100 scanner definition was restored after the temporary scope test. Batch scanning is unresolved and must not be represented as fully verified.

## Numerical and local checks

- All **18 automated tests passed**, including hand-worked balances and omission ranges, contract/expiry grouping, neutral denominators, duplicate/conflicting IDs across window boundaries, unit normalization, invalid/future data, staleness, one-group and tied-group cases, scaling/permutation invariance, escaping, decisive-row visibility and native adapter topology.
- **Five real native captures**, 200 records each: CVX, AAPL, TSLA, NVDA, JPM. Both groupings produce ten audited views. `tools/qa.mjs` independently removes each group from the raw reports and recomputes its balance, then compares with the engine's direct omission formula.
- Source capture timestamps, event times, hashes and summary values are in `validation.json`. Local raw API responses are ignored by Git. The generated local preview contains aggregated models, not a live external feed.
- The local preview was visually checked in Ink/Compact/Contract and Paper/Full/Expiry. It uses the production table specification and a separate SVG ruler. Evidence: `screenshots/local-nvda-ink.png`.
- The separate read-only review directly recomputed all **553 omissions**, checked current source against the generated artifact, and verified both v1.1 fixes. It found no remaining mathematical blocker. See `INDEPENDENT-REVIEW.md` for the limits of that conclusion.

## Scope and status

All conclusions apply to the returned provider-selected sample, which can be truncated. The default 7-day window is a filter, not a promise that seven days of activity were returned. Event age is visible. Source tags do not establish initiator, intent, opening/closing, net capital flow or related multi-leg orders. Contract counts and premium-equivalent breadth do not count independent traders. This is not full-chain analysis, a forecast, current open interest or a historical trading strategy.

**Private and unsubmitted.** Store description and category-two form copy are prepared. Native Store preview, public/free/visible-source publication and public-listing verification remain before the user's separate submission form.
