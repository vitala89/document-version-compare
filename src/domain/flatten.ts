import type { DocNode, DocumentVersion } from './types'

export interface IndexedNode {
  node: DocNode
  parentId: string | null
  topSectionId: string
  subsectionId?: string
}

export type NodeIndex = Map<string, IndexedNode>

/**
 * Flat lookup by id at any depth. Top-level sections have parentId null;
 * subsectionId is the closest nested section. The screens show one level of
 * nesting, as in the data (README, Questions I asked and assumptions).
 */
export function indexDocument(doc: DocumentVersion): NodeIndex {
  const index: NodeIndex = new Map()

  const visit = (
    nodes: DocNode[],
    parentId: string | null,
    topSectionId: string | null,
    subsectionId?: string,
  ) => {
    nodes.forEach((node) => {
      const top = topSectionId ?? node.id
      const nested = node.type === 'section' && topSectionId !== null ? node.id : subsectionId
      index.set(node.id, { node, parentId, topSectionId: top, subsectionId: nested })
      if (node.type === 'section' || node.type === 'clause') {
        visit(node.children, node.id, top, nested)
      }
    })
  }

  visit(doc.children, null, null)
  return index
}
