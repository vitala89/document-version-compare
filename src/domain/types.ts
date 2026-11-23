export interface FieldNode {
  id: string
  type: 'field'
  label: string
  value: string
}

export interface ParagraphNode {
  id: string
  type: 'paragraph'
  text: string
}

export type ClauseChild = FieldNode | ParagraphNode

export interface ClauseNode {
  id: string
  type: 'clause'
  title: string
  status?: string
  children: ClauseChild[]
}

export interface SectionNode {
  id: string
  type: 'section'
  title: string
  children: (SectionNode | ClauseNode)[]
}

export type DocNode = SectionNode | ClauseNode | FieldNode | ParagraphNode

export interface DocumentVersion {
  id: string
  version: number
  title: string
  updatedAt: string
  children: SectionNode[]
}

/** Counting category: the four kinds shown in the summary. */
export type ChangeKind = 'added' | 'removed' | 'changed' | 'moved'

/**
 * Why an entry exists. Finer than ChangeKind: a rename counts as changed,
 * a clause that lost all its fields counts as removed but still exists.
 * Display text for each reason lives in src/view-models/format.ts.
 */
export type ChangeReason = 'added' | 'removed' | 'changed' | 'renamed' | 'moved' | 'field-removed'

export type Detail =
  | { type: 'title'; before: string; after: string }
  | { type: 'status'; before?: string; after?: string }
  | { type: 'field-value'; label: string; before: string; after: string }
  | { type: 'field-label'; before: string; after: string }
  | { type: 'field-added' | 'field-removed'; label: string; value: string }
  | { type: 'text'; before: string; after: string }
  | { type: 'text-added' | 'text-removed'; text: string }

export interface DiffEntry {
  id: string
  kind: ChangeKind
  reason: ChangeReason
  scope: 'section' | 'clause'
  title: string
  /** Parent of the node: in the target, or in the base for removed nodes. null for a top-level section. */
  parentId: string | null
  sectionId: string
  subsectionId?: string
  movedFrom?: string
  details: Detail[]
  node?: ClauseNode | SectionNode
}

export type NoiseReason = 'whitespace' | 'markup' | 'number-format'

export interface DiffResult {
  base: DocumentVersion
  target: DocumentVersion
  /** In target document order; removed nodes follow their section. */
  entries: DiffEntry[]
  counts: Record<ChangeKind, number> & { total: number }
  noise: { id: string; reason: NoiseReason }[]
  /** Parents whose children only changed order; the top level is the document id. */
  reorderedParents: string[]
}
