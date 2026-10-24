# Rift - Options Flow Stress Test

Does the options-flow headline survive losing one contract?

Rift audits concentration in the unusual-options reports returned by TrendSpider. It groups all reports for each contract, removes each contract separately, and shows the range of resulting provider-tagged premium balances. Switch to Expiry to test whether several apparently different contracts depend on one expiration.

The headline balance is (bullish-tagged premium minus bearish-tagged premium) divided by all accepted premium, including neutral or unclassified reports. The ruler compares that balance with every one-group omission. Both layouts show the largest group and the groups setting the low/high endpoints; a star marks omissions that change the material lead. Premium-equivalent breadth summarizes concentration without pretending to count independent traders.

A material lead defaults to ±10 percentage points and is adjustable. For example, a +12.4-point tagged lead that drops to +6.4 after one omission is sensitive to that contract at the stated threshold. The tool turns a flow headline into a concrete research question before you give it weight.

Data scope matters: this is a provider-selected, potentially truncated sample within a trailing calendar-day window, not complete market flow or current open positions. Repeated identical event IDs count once; conflicting copies are excluded. Missing or contradictory tags stay unclassified. CALL does not mean bullish, and gross reported premium is not net buying. Tags do not establish initiator, intent, opening/closing or related multi-leg orders.

Three current-sample conditions support research scans. Invalid/ambiguous records, missing IDs, small samples, insufficient classified premium or a newest event over 36 hours old suppress those conditions. Only the latest bar is populated; there are no historical signals or point-in-time backtests.

Ink/Paper palettes and Compact/Full layouts. Uses the included unusual-options endpoint verified on the development account; no full-chain OPRA request is made. Free and open source under MIT. Built for Most Unique Options Indicator. No price forecast or buy/sell recommendation. #TSBuild26

---
Draft; not published. The paragraph above this rule ends the Store description.
