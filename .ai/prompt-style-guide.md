# MarketBrain Prompt Style Guide

> Prompts are product assets. Treat them like typed, reviewable source code.

---

## 1. Core Principles

Prompts follow the same `schema-first`, `evidence-first`, and `eval-first`
invariants defined in `.ai/CONSTITUTION.md` §2.

Prompt behavior belongs in `packages/ai`, not inside page or route glue.

---

## 2. Every Prompt Should Declare

- purpose
- expected caller
- input schema
- output schema
- allowed tools
- citation or evidence requirements
- refusal or uncertainty behavior
- model/router expectations if relevant

If the repository later adopts prompt front matter or metadata objects, preserve
these fields there.

---

## 3. Writing Rules

- Refer to the output schema by intent and field meaning; do not rely on the
  prompt alone to enforce JSON structure.
- Ask the model to distinguish facts, inferences, and uncertainty.
- Require evidence references for claims that could influence decisions.
- Instruct the model to say when evidence is insufficient instead of filling
  gaps with confident prose.
- Keep prompts specific to one task; do not build giant omnibus prompts.

---

## 4. Tool And Citation Rules

- Tool names and inputs should map to typed contracts.
- Prompts should not ask the model to invent tool arguments that are not backed
  by schema fields.
- If a surface expects citations, prompts should require them and downstream
  code should preserve them.
- Prompt output should be easy for evaluators to score without human guesswork.

---

## 5. Change Policy

When changing a prompt, router, or evaluator behavior:

1. Update the schema first if the contract changed.
2. Update fixtures or evaluators alongside the prompt whenever practical.
3. Record meaningful policy changes in the task plan or PR description.
4. Keep prompt assets versioned in-repo and reviewable in diffs.

---

## 6. Anti-Patterns

- Embedding a production prompt directly in a page component
- Encoding JSON shape only in prose when a schema already exists
- Asking for definitive conclusions without evidence requirements
- Letting prompts silently swallow missing data or tool failures
- Changing prompt behavior without updating tests, fixtures, or evaluators
