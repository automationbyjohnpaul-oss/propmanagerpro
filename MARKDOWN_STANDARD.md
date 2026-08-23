# PropManager Pro Markdown Standard

This document is the authoritative formatting standard for PropManager Pro documentation.

Its purpose is to keep documentation predictable, readable, AI-friendly, and easy to maintain.

This standard controls formatting. It does not require every document to have the same content or structure.

---

## 1. Core Principle

Documentation must be edited with minimal changes.

When editing an existing document:

* Preserve existing content unless the task requires changing it.
* Preserve the document's existing logical structure.
* Do not rewrite sections merely to make them look different.
* Do not reorder information unless explicitly required.
* Do not remove useful information because of formatting preferences.
* Make the smallest change that correctly completes the task.
* Do not normalize unrelated files.

---

## 2. Character Standard

All active PropManager Pro documentation must use ASCII characters only.

Do not introduce:

* Unicode arrows
* Unicode dashes
* Curly quotation marks
* Unicode ellipsis characters
* Emoji
* Unicode box-drawing characters
* Other decorative Unicode symbols

Use these ASCII equivalents:

| Meaning             | Use   |   |
| ------------------- | ----- | - |
| Right arrow         | `->`  |   |
| Left arrow          | `<-`  |   |
| Bidirectional arrow | `<->` |   |
| Em dash             | `--`  |   |
| En dash             | `-`   |   |
| Curly double quotes | `"`   |   |
| Curly single quotes | `'`   |   |
| Ellipsis            | `...` |   |
| Tree branch         | `+--` |   |
| Tree vertical line  | `     | ` |

For status indicators, use plain text labels:

```text
[LOCKED]
[CONFIRMED]
[PLANNED]
[PENDING]
[REJECTED]
[DECISION]
[WARNING]
[NOTE]
[CRITICAL]
[IMPORTANT]
[AI]
[DEPLOY]
[TARGET]
```

Do not use emoji equivalents.

---

## 3. Document Titles

Use one level-one heading for the document title.

Example:

```markdown
# Document Title
```

Rules:

* Use `#` for the main document title.
* Normally use only one `#` heading per document.
* Do not use headings only for decoration.
* Preserve an existing meaningful title when editing a document.

---

## 4. Heading Hierarchy

Use headings in logical order.

```markdown
# Document Title

## Major Section

### Subsection

#### Detail Section
```

Rules:

* `#` = document title
* `##` = major section
* `###` = subsection
* `####` = detail section
* Do not skip heading levels without a clear reason.
* Do not change existing heading levels unless the task requires it.

---

## 5. Unordered Lists

Use standard Markdown unordered lists.

```markdown
- Item one
- Item two
- Item three
```

Rules:

* Use `-` for unordered lists.
* Keep the same list style within a section.
* Use indentation for nested lists.
* Do not convert lists simply for cosmetic reasons.

---

## 6. Ordered Lists

Use standard numbered Markdown lists.

```markdown
1. First item
2. Second item
3. Third item
```

Rules:

* Use numbered lists when order matters.
* Keep ordered lists logically sequential.
* Do not convert an unordered list into an ordered list unless order matters.

---

## 7. Task Lists

Use standard Markdown task lists.

```markdown
- [ ] Pending task
- [x] Completed task
```

Rules:

* `[ ]` means incomplete.
* `[x]` means complete.
* Do not use Unicode checkbox characters.

---

## 8. Code Blocks

Use fenced code blocks with the most appropriate language identifier.

Examples:

```text
General text
```

```powershell
Get-ChildItem
```

```typescript
const value = true;
```

```bash
npm test
```

```json
{
  "example": true
}
```

```http
GET /api/health
```

Rules:

* Always close fenced code blocks.
* Use `text` when the content has no specific language.
* Use the correct language identifier when known.
* Do not change a code block's contents when performing a documentation-only formatting task.

---

## 9. Inline Code

Use backticks for commands, filenames, paths, variables, routes, and code references.

Examples:

```text
`npm test`
`backend/src/services/unit.service.ts`
`/api/health`
`DATABASE_URL`
```

---

## 10. Emphasis

Use standard Markdown emphasis.

```markdown
**Important**
*Secondary emphasis*
```

Use backticks for technical identifiers:

```markdown
`PROJECT_STATE.md`
```

Do not use decorative Unicode formatting.

---

## 11. Blockquotes

Use standard Markdown blockquotes.

```markdown
> This is an important note.
```

Do not use Unicode quotation characters for blockquotes.

---

## 12. Tables

Use standard Markdown tables.

```markdown
| File | Purpose |
|---|---|
| `README.md` | Project overview |
| `ARCHITECTURE.md` | System architecture |
```

Rules:

* Include a header row.
* Include a separator row.
* Keep columns readable.
* Do not convert useful tables into prose without a reason.
* Do not create tables when a simple list is clearer.

---

## 13. Links

Use standard Markdown links.

Internal links should normally use relative paths:

```markdown
[Architecture](ARCHITECTURE.md)
```

External links may use full URLs:

```markdown
[Example](https://example.com)
```

Do not replace working links merely for formatting purposes.

---

## 14. Horizontal Rules

Use three hyphens for a horizontal rule:

```markdown
---
```

Use horizontal rules only when they provide meaningful separation.

Do not add horizontal rules to every section.

---

## 15. Spacing

Use consistent Markdown spacing.

Preferred structure:

```markdown
# Title

Introduction.

## Section

Content.

### Subsection

More content.

---

## Another Section

More content.
```

Rules:

* Leave one blank line after headings.
* Leave one blank line between normal paragraphs.
* Leave one blank line before and after code blocks.
* Leave one blank line before and after lists when appropriate.
* Do not add unnecessary blank lines.
* Do not leave trailing whitespace.
* End files with a normal newline.

---

## 16. Document Structure

There is no single mandatory structure for every PropManager Pro document.

Different documents have different purposes.

Examples:

* `README.md` may prioritize project introduction and setup.
* `ARCHITECTURE.md` may prioritize system structure and technical decisions.
* `CHANGELOG.md` may prioritize chronological changes.
* `DECISION_LOG.md` may prioritize decisions and rationale.
* `TODO.md` may prioritize actionable tasks.
* `API.md` may prioritize endpoints and request/response information.
* `PROJECT_STATE.md` may prioritize current project state.

Do not force these documents into an identical structure.

The correct structure is the structure that best serves the document's purpose.

---

## 17. Formatting Versus Content

Formatting changes must not silently become content changes.

When asked to format a document:

* Fix formatting.
* Fix obvious character encoding problems.
* Preserve wording.
* Preserve technical information.
* Preserve examples.
* Preserve code.
* Preserve links.
* Preserve document-specific structure.
* Do not add new features, requirements, decisions, or claims.

If content appears incorrect, flag it rather than silently rewriting it.

---

## 18. Existing Documents

Existing documentation is not required to be rewritten merely because it does not perfectly match this standard.

When an existing document is edited:

1. Apply the standard to the area being changed.
2. Preserve unrelated content.
3. Avoid unnecessary reformatting.
4. Do not rewrite the entire document.
5. Keep the Git diff as small as reasonably possible.

Gradual normalization is preferred over large bulk rewrites.

---

## 19. Archive Documents

Documents under:

```text
DOCS/_archive/
```

are archived documentation.

Do not modify archived documentation during normal documentation normalization.

Archived files may be changed only when explicitly requested.

---

## 20. AI Editing Rule

AI assistants working on PropManager Pro documentation must treat this file as the authoritative formatting reference.

Before editing documentation, the AI must:

1. Identify the target file.
2. Read the relevant existing content.
3. Follow this formatting standard.
4. Preserve unrelated content.
5. Make minimal changes.
6. Avoid unnecessary restructuring.
7. Verify the resulting file.
8. Review the Git diff when Git is available.

The AI must not perform broad formatting changes across the repository unless explicitly instructed.

---

## 21. Single Source of Truth

Documentation must not contain conflicting authoritative information.

When a project fact changes:

* Update the appropriate authoritative document.
* Update supporting documentation when necessary.
* Do not create competing versions of the same information.
* Do not preserve known obsolete information merely because it appears in an older document.

The project's documentation hierarchy determines which document is authoritative for each type of information.

---

## 22. Verification

After documentation changes, verify:

* Markdown syntax is valid.
* Code fences are closed.
* Links remain intact.
* Tables remain valid.
* No unintended Unicode characters were introduced.
* No unrelated content was changed.
* Git diff contains only intended changes.

For significant documentation changes, run the project's normal validation process.

---

## 23. What This Standard Does Not Require

This standard does not require:

* Every document to have identical sections.
* Every document to have identical formatting density.
* Every document to contain a Purpose section.
* Every document to end with an "End of Document" marker.
* Every document to contain tables.
* Every document to contain lists.
* Existing documents to be completely rewritten.
* Decorative formatting.

The goal is consistency without unnecessary rewriting.

---

## 24. Authority

This file is the authoritative formatting standard for active PropManager Pro documentation.

Other documentation may define project-specific content, architecture, processes, or decisions.

Formatting rules are governed by this document.

Project-specific documentation may define its own structure when required by its purpose. This does not override the formatting rules defined here.

A project decision may change this standard only when the change is explicitly documented as a formatting-standard decision.

Otherwise, this standard remains authoritative.

---

**End of Standard**

