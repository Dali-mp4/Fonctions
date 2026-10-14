# Reviewed AI translations — rollout

French source lessons become publicly available as soon as their ordinary technical and educational review passes. English and Tunisian Arabic can be published later, independently, after human review.

## One-time setup

1. Apply supabase/migrations/011_reviewed_ai_translations.sql in Supabase SQL Editor, **once after migrations 001–010**. It queues existing and newly approved revisions. It does not modify prior approvals or lessons.
2. Put OPENAI_API_KEY in the **Next.js server** environment only (web/.env.local locally). Never use a NEXT_PUBLIC_ prefix or commit the key. Optionally set OPENAI_TRANSLATION_MODEL (default: gpt-4.1-mini). API calls use your own provider account and may incur charges.
3. Restart/redeploy Next.js.

## Workflow

- Approving a French revision queues EN and AR records transactionally. French goes live immediately.
- The reviewer browser attempts to generate both translations after publication. This is **best effort**, not a background worker: if the page closes, the AI key is missing, or the provider fails, queued entries remain.
- In El studio., reviewers can open the Translations section, retry generation, compare each field against French, edit the translated text and approve each language separately.
- Reviewer/owner authorization is checked on the server and in PostgreSQL. The original author cannot approve their own translation.
- Only approved translations for the **currently published revision** are visible publicly. Otherwise students see French with the usual language-of-publication note.
- New revisions get new translations. Restoring the exact same previously published revision restores the translations already approved for that revision.

## What is translated

Contributor chapter summaries, method explanations, principles, examples, limitations and lesson section titles/notes. Chapter and module names remain untouched. Python source, pseudocode, variables, input schemas, tests, and runtime behavior are never translated. The seven curated original modules keep their current built-in translations.

The generated output schema contains only prose. Validation rejects changes to numbers, uppercase technical identifiers or section count. A reviewer must still verify educational accuracy, especially Tunisian Arabic technical language.

## Validation

- With two accounts, publish a French contribution and confirm that French is immediately readable.
- Confirm queued EN/AR work items, generate and independently approve one of them in Studio.
- Switch languages to confirm approved translation and French fallback, and verify code and module names remain unchanged.
- Attempt author self-approval and ensure it fails.
- Withdraw the method; it and its translation must disappear. Restore it to recover the reviewed version.
- In web/, run: npm run test:translations; npm run typecheck; npm run build.

Limitations: initial generation is initiated by the publishing reviewer's browser (with durable manual retry); there is not yet a guaranteed background worker or automatic provider spending cap. Published teaching prose is sent to an external model provider for generation. Never include student personal data or secrets in lesson text.
