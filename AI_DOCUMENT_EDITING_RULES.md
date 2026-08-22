## ✅ Formatting Complete — AI_DOCUMENT_EDITING_RULES.md

Here is the final **ASCII-only, consistently formatted** version:

```markdown
# PropManager Pro -- AI Document Editing Rules

## Purpose

These rules govern all AI-assisted editing of documentation and other project documents in PropManager Pro.

The objective is simple:

> **AI must make the smallest possible change required to fulfill the user's request.**

AI must never treat a documentation-editing request as an opportunity to redesign, reformat, reorganize, beautify, or standardize unrelated content.

---

## 1. Core Rule -- Minimal Change

When editing an existing document:

> **Change only what the user explicitly requested. Preserve everything else exactly as it is.**

Do not:

* Reformat unrelated sections
* Rewrite existing prose unnecessarily
* Change heading levels
* Change bullet styles
* Change indentation
* Change numbering
* Change capitalization
* Change punctuation
* Change code-fence languages
* Change line wrapping
* Change spacing
* Add or remove blank lines unnecessarily
* Change Markdown structure
* Convert formatting styles
* Add decorative elements
* Add emojis
* Add buttons
* Add badges
* Add tables unless explicitly requested
* Add links unless explicitly requested
* Add images unless explicitly requested
* Add icons
* Add callouts
* Add "helpful" sections
* Rename sections unless explicitly requested
* Reorder sections unless explicitly requested
* Improve wording outside the requested area

If existing formatting is unusual but valid, **preserve it**.

The AI is not authorized to perform unrelated cleanup.

---

## 2. Existing Documents Are the Source of Truth

When modifying an existing document:

1. Read the relevant existing section.
2. Understand its current structure.
3. Make the requested change inside that structure.
4. Preserve the surrounding document.
5. Do not impose a new formatting style.

The existing document's formatting takes precedence over the AI's preferred formatting.

For example, if the document currently uses:

```markdown
## Section
```

do not change it to:

```markdown
# Section
```

unless explicitly requested.

If the document uses:

```markdown
- Item
```

do not convert it to:

```markdown
* Item
```

If the document uses:

```markdown
```text
...
```
```

do not change it to another fence language unless required.

---

## 3. No Unrequested Formatting

AI must NOT perform formatting normalization during a content edit.

This includes:

- Line-ending normalization
- Markdown normalization
- Heading normalization
- Code-fence normalization
- List normalization
- Whitespace normalization
- Paragraph restructuring
- Automatic wrapping
- Automatic unwrapping
- Markdown beautification

A request such as:

> "Add this section to ARCHITECTURE.md"

means:

> **Add this section. Nothing else.**

It does NOT mean:

> Rewrite ARCHITECTURE.md using your preferred Markdown style.

---

## 4. No AI Decoration

Project documentation is engineering documentation, not marketing material.

Do not add:

- Decorative separators
- Callout boxes
- Badges
- Buttons
- "Quick Start" cards
- Promotional language
- AI-generated summaries
- Inspirational statements

unless explicitly requested.

Existing emojis or decorative formatting must also be preserved unless the user explicitly asks for their removal.

---

## 5. No New UI or Product Features

When editing technical documentation, AI must not invent product features.

Do not add documentation for:

- New buttons
- New menus
- New screens
- New API endpoints
- New workflows
- New database fields
- New permissions
- New automation
- New notifications
- New AI capabilities
- New settings

unless the user explicitly requested the feature and it actually exists in the implementation.

Documentation must describe the **real system**, not an imagined future system.

---

## 6. No Scope Expansion

If the user asks:

> "Update the lease section."

Do not also:

- Rewrite payment documentation
- Improve authentication documentation
- Reorganize the architecture document
- Update unrelated TODO items
- Rewrite the changelog
- Add missing sections
- Correct unrelated grammar
- Refactor unrelated documentation

Stay inside the requested scope.

If an unrelated problem is discovered, report it separately rather than silently changing it.

---

## 7. Preserve Existing Structure

Before editing, identify:

- Existing heading hierarchy
- Existing section numbering
- Existing list style
- Existing code-fence style
- Existing table style
- Existing terminology
- Existing naming conventions

Preserve them.

For example:

If the document uses:

```markdown
# 1. Overview
# 2. Architecture
# 3. Database
```

do not change it to:

```markdown
## Overview
## Architecture
## Database
```

unless explicitly instructed.

---

## 8. Preserve Terminology

Do not rename established project terminology merely because another term sounds better.

For example:

If the project uses:

```text
Tenant
Lease
Unit
Property
Payment
ACTIVE
ENDED
TERMINATED
```

preserve those terms.

Do not silently replace them with:

```text
Resident
Contract
Apartment
Building
Transaction
```

unless explicitly requested.

The project's terminology is part of the project's source of truth.

---

## 9. Do Not Modify Code During Documentation Tasks

If the user asks for a documentation change, do not modify source code unless explicitly requested.

If the documentation appears inconsistent with the implementation:

1. Stop.
2. Report the inconsistency.
3. Ask whether the implementation or documentation should be changed.

Never silently modify both.

---

## 10. Do Not Modify Documentation During Code Tasks

The same rule applies in reverse.

If the user asks for a code change:

> Modify the requested code.

Do not automatically rewrite:

* ARCHITECTURE.md
* PROJECT_STATE.md
* DECISION_LOG.md
* CHANGELOG.md
* TODO.md
* API documentation

unless documentation synchronization was explicitly requested.

---

## 11. SSOT Protection

The following documents are authoritative project documents:

```text
PROJECT_STATE.md
ARCHITECTURE.md
DECISION_LOG.md
TODO.md
CHANGELOG.md
DOCS/
```

When modifying these files:

> **Preserve historical information and existing structure unless explicitly instructed otherwise.**

Do not delete historical decisions merely because they are old.

Do not rewrite previous decisions to match current preferences.

Do not silently alter project history.

If historical information is incorrect, flag it before changing it.

---

## 12. Changelog Protection

CHANGELOG.md records project history.

AI must:

* Add new entries
* Preserve existing entries
* Preserve chronological structure
* Preserve existing version/date conventions
* Avoid rewriting historical entries
* Avoid "cleaning up" old entries

A new changelog entry must describe actual implemented changes.

Never document a feature that has not been implemented and verified.

---

## 13. Decision Log Protection

DECISION_LOG.md records architectural/business decisions.

AI must not rewrite previous decisions simply because a newer decision supersedes them.

Instead:

1. Preserve the historical decision.
2. Add a new decision entry.
3. Clearly identify the new decision.
4. Reference the affected previous decision when appropriate.

This preserves the project's decision history.

---

## 14. Project State Protection

PROJECT_STATE.md represents the current authoritative state of the project.

When updating it:

* Modify only the affected state.
* Preserve unrelated sections.
* Do not rewrite the entire document.
* Do not regenerate the document from scratch.
* Do not reorder sections unless explicitly requested.

The goal is synchronization, not regeneration.

---

## 15. TODO Protection

TODO.md represents project work tracking.

When completing a task:

* Mark the existing task complete.
* Add necessary verification information only where appropriate.
* Preserve unrelated tasks.
* Do not reorder priorities unless explicitly requested.
* Do not invent new tasks.
* Do not delete unfinished tasks.

---

## 16. Code Fences

Preserve existing code-fence formatting.

If the document contains:

```markdown
```text
example
```
```

do not automatically change it to another language.

Do not add language identifiers to existing fences unless explicitly requested.

Do not remove language identifiers unless explicitly requested.

---

## 17. Tables

Preserve existing table structure.

Do not:

- Reorder columns
- Reformat tables
- Change alignment
- Add columns
- Remove columns
- Convert tables to lists

unless explicitly requested.

---

## 18. Links

Do not add external links merely because they seem useful.

Do not replace existing links.

Do not convert plain text into hyperlinks.

Do not add GitHub, documentation, reference, or product links unless requested or required by the task.

---

## 19. Emojis

Default rule:

> **No new emojis.**

Existing emojis may remain untouched.

Do not introduce emojis into technical documentation simply to make it "more readable."

---

## 20. Editing Existing Files

When the requested change is small, prefer a surgical edit.

Example:

User request:

> Add the active lease definition to ARCHITECTURE.md.

Correct behavior:

```text
Read relevant section
        |
        v
Insert requested section
        |
        v
Preserve everything else
        |
        v
Inspect diff
```

Incorrect behavior:

```text
Read document
        |
        v
Regenerate entire document
        |
        v
Apply AI formatting preferences
        |
        v
Rewrite headings
        |
        v
Normalize Markdown
        |
        v
Add emojis
        |
        v
Rewrite unrelated sections
```

---

## 21. Diff Is the Final Authority

After editing an existing document, the AI must assume that the Git diff is the authoritative verification mechanism.

Before declaring the task complete, check:

```powershell
git diff --check
git diff --stat
git diff -- <modified-file>
```

The AI must inspect the diff for unintended changes.

If a small documentation request produces hundreds of changed lines, **stop**.

Do not commit.

Investigate whether formatting, line endings, encoding, or unrelated content was modified.

---

## 22. Unexpected Diff Rule

If the requested change is small but the diff is large:

> **Treat the large diff as a failure, not as a successful edit.**

Example:

Requested:

```text
Add one section.
```

Expected:

```text
+15 lines
```

Actual:

```text
500 insertions
450 deletions
```

The AI must not say:

> "The documentation has been updated successfully."

Instead:

> "The requested change appears to have caused unrelated formatting/content changes. I will not consider this complete until the diff is reduced to the intended scope."

---

## 23. Preserve Line Endings and Encoding

When editing existing files, preserve the file's existing:

* Line-ending convention
* Character encoding
* BOM state
* Markdown formatting
* Whitespace conventions

Do not convert the entire file from CRLF to LF or vice versa merely because the AI/editor prefers one.

---

## 24. No Full-File Regeneration

Do not regenerate an existing project document from scratch unless explicitly instructed.

This is especially important for:

```text
ARCHITECTURE.md
PROJECT_STATE.md
DECISION_LOG.md
CHANGELOG.md
TODO.md
```

These files contain project history and accumulated decisions.

They are not disposable generated files.

---

## 25. If Unsure, Stop Rather Than Guess

If the requested change conflicts with existing documentation or implementation:

> Do not guess.

Report:

```text
I found an inconsistency between X and Y.
I have not modified either one.
Please confirm which should be authoritative.
```

Correctness is more important than completing the edit quickly.

---

## 26. AI Editing Priority

When editing project documents, follow this priority order:

1. User's explicit instruction
2. Existing project structure
3. Existing project terminology
4. Existing formatting conventions
5. SSOT rules
6. Minimal change
7. AI preferences

AI preferences are always last.

---

## 27. Required Completion Report

After an AI document edit, report:

```text
Files modified:
- <file>

Requested change:
- <change>

Unrelated changes:
- None

Diff:
- <summary>

Validation:
- git diff --check: PASS
```

If unrelated changes exist:

```text
Status: NOT READY

The requested change was made, but unrelated changes were detected.
No commit should be made until the diff is cleaned.
```

---

## 28. Golden Rule

The most important rule in this document is:

> **Do not improve what you were not asked to improve.**

For existing project documents:

> **Preserve first. Edit second. Verify third.**

A successful AI edit is not the one that makes the document look "better."

A successful AI edit is the one that makes **exactly the requested change and nothing else**.

---

## Document Editing -- Surgical Change Rule

When editing any existing project document, especially .md files:

1. PRESERVE the existing document exactly unless a requested change requires otherwise.

2. NEVER reformat, restructure, normalize, beautify, modernize, or "clean up" existing Markdown.

3. NEVER convert existing plain text into:
   - Markdown headings
   - bullet lists
   - numbered lists
   - tables
   - code fences
   - blockquotes
   - bold/italic text
   unless explicitly requested.

4. NEVER add:
   - emojis
   - decorative separators
   - buttons
   - badges
   - icons
   - unnecessary headings
   - explanatory notes
   - summaries
   - "End of file" markers
   - UI elements
   - additional sections
   unless explicitly requested.

5. NEVER change heading levels, indentation, spacing, list formatting, code-fence types, or document structure merely for consistency.

6. NEVER change line endings or perform whole-file formatting.

7. NEVER rewrite surrounding content when inserting or modifying a requested section.

8. Make the SMALLEST POSSIBLE DIFF.
   If the requested change requires 15 lines, approximately 15 lines should change.
   Do not modify hundreds of unrelated lines.

9. Before editing:
   - inspect the exact surrounding text;
   - identify the precise insertion/replacement location;
   - preserve the existing formatting style.

10. After editing:
   - inspect git diff;
   - verify that every changed line is directly related to the requested task;
   - if unrelated formatting changes appear, revert them before finishing.

11. For Markdown files, Git diff is the authority for detecting accidental formatting churn.

12. Do NOT consider a documentation task complete merely because the resulting Markdown looks "better." The existing document's format is part of the project's standard and must be preserved.

13. If the requested content conflicts with the existing document structure, STOP and ask before restructuring the document.

14. Do not rewrite the entire file to make an insertion. Perform an in-place surgical edit.

15. Preserve the project's existing Markdown conventions. Existing conventions take priority over the AI's preferred formatting.

---

## Default Rule

> "Change content, not formatting."

The requested change is authoritative.
Everything else is protected.

---

## Success Criterion

The final git diff should contain only changes necessary to satisfy the user's request.
```

---

## ✅ Formatting Changes Applied

| Change | Before | After |
|--------|--------|-------|
| Em dash | `—` | `--` |
| Unicode arrows | `→` `↓` | `->` `v` |
| Bullet lists | `-` | `-` (preserved) |
| Code fences | `text` | `text` (preserved) |

---

## Copy and Save

1. Select all the content above
2. Copy (`Ctrl + C`)
3. Open `AI_DOCUMENT_EDITING_RULES.md` in Notepad
4. Select all (`Ctrl + A`)
5. Paste (`Ctrl + V`)
6. Save (`Ctrl + S`)

---

## 📋 Summary of Completed Files

| File | Status |
|------|--------|
| `AI_DOCUMENT_EDITING_RULES.md` | ✅ Formatted |
| `ARCHITECTURE.md` | ✅ Formatted |
| `PROJECT_STATE.md` | ✅ Formatted |
| `DECISION_LOG.md` | ✅ Formatted |
| `CHANGELOG.md` | ✅ Formatted |
| `TODO.md` | ✅ Formatted |

**All active documentation files have been normalized to ASCII-only Markdown!** 🎯

---

