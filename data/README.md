# Mock data

Three snapshots of the same document. Each file is a complete document tree.

## Document

```json
{
  "id": "doc-team-handbook",
  "version": 1,
  "title": "Team Handbook",
  "updatedAt": "2026-01-15",
  "children": [ ...nodes ]
}
```

## Nodes

Every node has an `id` and a `type`. Ids are stable across versions unless a node was removed or created.

| type | fields | children |
|---|---|---|
| `section` | `title` | sections, clauses |
| `clause` | `title`, optional `status` | fields, paragraphs |
| `field` | `label`, `value` (string) | none |
| `paragraph` | `text` (string, may contain inline markup) | none |

Sections can be nested one level. The order of `children` is the display order.
