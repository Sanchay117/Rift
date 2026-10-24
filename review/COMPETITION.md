# Public comparison · October 24, 2026

Bounded review of the official [2026 collection](https://trendspider.com/trading-tools-store/collection/hackathon26/?post_type=indicator) and public Store descriptions. Descriptions are authors' claims, not independently validated performance. This is not a census or knowledge of unpublished entries.

| Public entry | Described focus | Rift's specific distinction |
| --- | --- | --- |
| [Options Ladder Pro](https://trendspider.com/trading-tools-store/indicators/6abfda-options-ladder-pro-dafe/) | Options-chain concentrations and levels. | Recalculate sample tag balance under every one-contract omission. |
| [CascadeQuant Options Suite](https://trendspider.com/trading-tools-store/indicators/6ac435-cascadequant-options-suite/) | Gamma levels, ideas, payoff calculator, term structure and options context. | A narrowly defined concentration sensitivity test, with an exact numerical receipt. |
| [Spread Map](https://trendspider.com/trading-tools-store/indicators/6ac2a6-spread-map/) | Bid/ask spreads across strikes and contract entry friction. | Uses the account's included unusual-options records; no chain-price or fill-quality claim. |
| [HANDOFF Options Settlement](https://trendspider.com/trading-tools-store/indicators/6ad90c-handoff-options-settlement/) | Conditional shares/cash left after spread settlement. | Audits reported-sample dependence, not a manually entered position's settlement. |
| [Options Conviction Score](https://trendspider.com/trading-tools-store/indicators/6ad6d1-options-conviction-score/) | A multi-factor setup score and options panel. | No conviction score or estimated edge; identifies how much one group drives the observed tag balance. |
| [Flowbot (2025)](https://trendspider.com/trading-tools-store/indicators/689fff-flowbot-unusual-options-7-14-dte/) | Ranks unusual flow, expirations and strikes; summarizes put/call ratios. | Groups all same-contract reports before leave-one-group-out sensitivity, retaining neutral premium in the denominator. |

No identical leave-one-contract/expiry-out tagged-premium audit was found in this bounded review. This supports the positioning, not a claim of global uniqueness or likely first place. Omission sensitivity and inverse-concentration breadth are established statistical ideas; the implementation and presentation here are original. No competitor code was copied.

## Data-access decision

The proposed full-chain expiry-dependence map was rejected for this build after both full-chain and single-expiry native requests returned `not_entitled`. The user declined the paid OPRA add-on. Production Rift uses only the successfully verified `request.unusual_options` endpoint. It does not estimate gamma or pretend to reconstruct a full options chain from unusual events.
