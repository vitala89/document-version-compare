import { indexDocument, type IndexedNode, type NodeIndex } from './flatten'
import { noiseReason, plainNoiseReason, plainText } from './text'
import type {
  ChangeKind,
  ChangeReason,
  ClauseNode,
  Detail,
  DiffEntry,
  DiffResult,
  DocumentVersion,
  NoiseReason,
  SectionNode,
} from './types'

type Noise = { id: string; reason: NoiseReason }

/**
 * Compares two versions of a document by stable node ids.
 * Rules and expected counts: docs/plan.md, sections 2 and 3.
 * Returns what changed, not how a screen shows it: per-screen data is built
 * from this result in src/view-models.
 */
export function diffDocuments(base: DocumentVersion, target: DocumentVersion): DiffResult {
  if (base.version >= target.version) {
    throw new Error('Base version must be older than target version')
  }

  const before = indexDocument(base)
  const after = indexDocument(target)
  const noise: Noise[] = []
  const found: DiffEntry[] = []

  const insideNewSection = (id: string) =>
    hasAncestor(after, id, (ancestor) => !before.has(ancestor))
  const insideRemovedSection = (id: string) =>
    hasAncestor(before, id, (ancestor) => !after.has(ancestor))

  // Target document order: sections and clauses that exist in the new version.
  for (const [id, current] of after) {
    const previous = before.get(id)
    if (current.node.type === 'section') {
      if (!previous) {
        if (!insideNewSection(id))
          found.push(entry('added', 'added', current, { node: current.node }))
        continue
      }
      const old = previous.node as SectionNode
      // Checked before the move, so a section that moved and was renamed keeps its rename.
      const details: Detail[] = textChanged(id, old.title, current.node.title, noise)
        ? [{ type: 'title', before: old.title, after: current.node.title }]
        : []
      if (previous.parentId !== current.parentId) {
        const from = before.get(previous.parentId ?? '')?.node as SectionNode | undefined
        found.push(
          entry('moved', 'moved', current, { details, movedFrom: from?.title, node: current.node }),
        )
      } else if (details.length > 0) {
        found.push(entry('changed', 'renamed', current, { details }))
      }
    }

    if (current.node.type === 'clause') {
      if (!previous) {
        if (!insideNewSection(id))
          found.push(entry('added', 'added', current, { node: current.node }))
        continue
      }
      const details = clauseDetails(previous, current, before, after, noise)
      if (previous.parentId !== current.parentId) {
        const from = before.get(previous.parentId ?? '')?.node as SectionNode | undefined
        found.push(
          entry('moved', 'moved', current, {
            details,
            movedFrom: from?.title,
            node: current.node as ClauseNode,
          }),
        )
      } else if (details.length > 0) {
        found.push(classifyClauseChange(current, details))
      }
    }
  }

  // Removed nodes: listed once, at the highest removed level.
  for (const [id, previous] of before) {
    if (after.has(id) || insideRemovedSection(id)) continue
    if (previous.node.type !== 'section' && previous.node.type !== 'clause') continue
    found.push(entry('removed', 'removed', previous, { node: previous.node }))
  }

  const sectionOrder = target.children.map((section) => section.id)
  const rank = (sectionId: string) => {
    const position = sectionOrder.indexOf(sectionId)
    return position === -1 ? sectionOrder.length : position
  }
  const entries = [...found].sort((a, b) => rank(a.sectionId) - rank(b.sectionId))

  return {
    base,
    target,
    entries,
    counts: countKinds(entries),
    noise: noise.sort((a, b) => a.id.localeCompare(b.id)),
    reorderedParents: reordered(before, after, target.id),
  }
}

function entry(
  kind: ChangeKind,
  reason: ChangeReason,
  at: IndexedNode,
  extra: Partial<Pick<DiffEntry, 'details' | 'movedFrom' | 'node'>> = {},
): DiffEntry {
  const node = at.node as SectionNode | ClauseNode
  return {
    id: node.id,
    kind,
    reason,
    scope: node.type,
    title: node.title,
    parentId: at.parentId,
    sectionId: at.topSectionId,
    subsectionId: at.subsectionId,
    details: extra.details ?? [],
    movedFrom: extra.movedFrom,
    node: extra.node,
  }
}

function classifyClauseChange(at: IndexedNode, details: Detail[]): DiffEntry {
  const node = at.node as ClauseNode
  // Only lost fields make a clause field-removed (AGENTS.md, docs/plan.md section 2).
  if (details.every((d) => d.type === 'field-removed')) {
    return entry('removed', 'field-removed', at, { details, node })
  }
  if (details.every((d) => d.type === 'title' || d.type === 'field-label')) {
    return entry('changed', 'renamed', at, { details, node })
  }
  return entry('changed', 'changed', at, { details, node })
}

function clauseDetails(
  previous: IndexedNode,
  current: IndexedNode,
  before: NodeIndex,
  after: NodeIndex,
  noise: Noise[],
): Detail[] {
  const old = previous.node as ClauseNode
  const now = current.node as ClauseNode
  const details: Detail[] = []

  if (textChanged(now.id, old.title, now.title, noise)) {
    details.push({ type: 'title', before: old.title, after: now.title })
  }
  if (old.status !== now.status)
    details.push({ type: 'status', before: old.status, after: now.status })

  for (const child of now.children) {
    const was = before.get(child.id)
    if (!was || was.parentId !== now.id) {
      details.push(
        child.type === 'field'
          ? { type: 'field-added', label: child.label, value: child.value }
          : { type: 'text-added', text: plainText(child.text) },
      )
      continue
    }
    if (child.type === 'field' && was.node.type === 'field') {
      if (textChanged(child.id, was.node.label, child.label, noise)) {
        details.push({ type: 'field-label', before: was.node.label, after: child.label })
      }
      if (was.node.value !== child.value) {
        const reason = plainNoiseReason(was.node.value, child.value)
        if (reason) noise.push({ id: child.id, reason })
        else
          details.push({
            type: 'field-value',
            label: child.label,
            before: was.node.value,
            after: child.value,
          })
      }
    }
    if (
      child.type === 'paragraph' &&
      was.node.type === 'paragraph' &&
      was.node.text !== child.text
    ) {
      const reason = noiseReason(was.node.text, child.text)
      if (reason) noise.push({ id: child.id, reason })
      else
        details.push({
          type: 'text',
          before: plainText(was.node.text),
          after: plainText(child.text),
        })
    }
  }

  for (const child of old.children) {
    if (after.get(child.id)?.parentId === now.id) continue
    details.push(
      child.type === 'field'
        ? { type: 'field-removed', label: child.label, value: child.value }
        : { type: 'text-removed', text: plainText(child.text) },
    )
  }

  return details
}

/** True for a real change in a title or label. Noise-only differences are recorded and return false. */
function textChanged(id: string, before: string, after: string, noise: Noise[]): boolean {
  if (before === after) return false
  const reason = plainNoiseReason(before, after)
  if (reason) noise.push({ id, reason })
  return reason === null
}

function hasAncestor(index: NodeIndex, id: string, test: (ancestorId: string) => boolean): boolean {
  let parent = index.get(id)?.parentId ?? null
  while (parent) {
    if (test(parent)) return true
    parent = index.get(parent)?.parentId ?? null
  }
  return false
}

/**
 * Parents whose surviving children kept their ids but changed order. The top
 * level is reported as the document id, which no node can share.
 */
function reordered(before: NodeIndex, after: NodeIndex, documentId: string): string[] {
  const childrenOf = (index: NodeIndex) => {
    const map = new Map<string, string[]>()
    for (const [id, at] of index) {
      const parent = at.parentId ?? documentId
      const ids = map.get(parent)
      if (ids) ids.push(id)
      else map.set(parent, [id])
    }
    return map
  }
  const oldChildren = childrenOf(before)
  const newChildren = childrenOf(after)
  const result: string[] = []
  for (const [parent, ids] of newChildren) {
    const previous = oldChildren.get(parent)
    if (!previous) continue
    const wasThere = new Set(previous)
    const isThere = new Set(ids)
    const kept = ids.filter((id) => wasThere.has(id))
    const keptBefore = previous.filter((id) => isThere.has(id))
    // Element by element: joining ids into one string could match ids that contain commas.
    if (kept.some((id, i) => id !== keptBefore[i])) result.push(parent)
  }
  return result
}

function countKinds(entries: DiffEntry[]): DiffResult['counts'] {
  const counts = { total: entries.length, added: 0, removed: 0, changed: 0, moved: 0 }
  for (const e of entries) counts[e.kind] += 1
  return counts
}
