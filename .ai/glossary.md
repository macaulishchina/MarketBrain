# MarketBrain Glossary

> Keep this file small and current. Add terms that AI agents need to interpret
> consistently across prompts, specs, and code.

---

## Core Product Terms

- **Briefing**: A pre-market or periodic digest that summarizes the most
  important developments for a defined scope such as a watchlist, theme, or
  market segment.
- **Alert**: A time-sensitive notification or in-app event that may interrupt
  the user because a threshold, rule, or important new evidence was triggered.
- **Research Session**: A multi-turn, evidence-driven analysis workflow centered
  on a stock, theme, event, or question.
- **Instrument**: A security or market symbol the user can analyze or track.
- **Theme**: A cross-instrument topic such as AI infrastructure, EV supply
  chain, or rate sensitivity.
- **Watchlist**: A user-managed set of instruments or themes that personalizes
  briefing and alert scope.

---

## AI-Native Workflow Terms

- **Schema-First**: Define typed contracts before implementation and treat
  prompts as consumers of those contracts rather than format-defining prose.
- **Evidence-First**: Generated conclusions must remain linked to source
  material, citations, or structured evidence IDs.
- **Eval-First**: AI behavior changes should be paired with fixtures,
  evaluators, or regression tests instead of relying on ad hoc manual checking.
- **Task Contract**: The structured task input card that scopes a change before
  implementation.
- **Model Router**: Logic that decides which provider/model should handle a task
  and how fallbacks work.
- **Guardrail**: A hard constraint or risk-control rule applied before or after
  model reasoning.
- **Evaluator**: A repeatable check that scores or validates AI behavior against
  fixtures or expectations.

---

## Evidence And Delivery Terms

- **Evidence**: A structured fact, document snippet, price snapshot, filing
  excerpt, or retrieved record that can support a claim.
- **Citation**: A user-visible pointer from an AI conclusion back to a specific
  source or evidence object.
- **Connector**: A module or workflow that fetches raw external data into the
  system.
- **Workflow**: A multi-step async process, typically in the worker, such as
  ingestion, briefing generation, or alert fanout.
- **PWA-Enhanced**: A web application that remains web-first but adds install,
  offline, and notification capabilities where supported.
